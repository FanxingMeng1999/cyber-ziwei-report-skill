import { readFile, writeFile } from "node:fs/promises";
import type { AnalysisResult, ParsedWenmoChart } from "../src/types.js";
import { generateMockAnalysis } from "../src/analysis/mockAnalysis.js";
import { buildAnalysisPrompt } from "../src/analysis/buildAnalysisPrompt.js";
import { ANALYSIS_DISCLAIMER } from "../src/analysis/analysisSchema.js";
import { writeJson } from "../src/utils/format.js";
import { readLatestOutputPointer, type ReportOutputPaths } from "../src/utils/outputPaths.js";

const root = process.cwd();

interface OpenAiMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

interface OpenAiResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

function envFlag(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
}

async function fallbackToMock(chart: ParsedWenmoChart, outputPaths: ReportOutputPaths, reason: string): Promise<void> {
  console.warn(`[analyze-llm] 回退到 mock 分析：${reason}`);
  const analysis = generateMockAnalysis(chart);
  await writeJson(outputPaths.analysisPath, analysis);
  console.log(`[analyze-llm] 已写入 mock 分析到 ${outputPaths.analysisPath}`);
}

function isAnalysisResult(value: unknown): value is AnalysisResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const obj = value as Record<string, unknown>;
  const meta = obj.meta as Record<string, unknown> | undefined;
  const profile = obj.profile as Record<string, unknown> | undefined;
  const palaces = obj.palaces as unknown[] | undefined;
  const domains = obj.domains as Record<string, unknown> | undefined;
  const majorPeriods = obj.majorPeriods as unknown[] | undefined;
  const actionPlan = obj.actionPlan as unknown[] | undefined;
  if (!meta || typeof meta.title !== "string") {
    return false;
  }
  if (!profile || typeof profile !== "object") {
    return false;
  }
  if (!palaces || !Array.isArray(palaces) || palaces.length !== 12) {
    return false;
  }
  if (!domains || typeof domains !== "object") {
    return false;
  }
  for (const key of ["health", "study", "career", "wealth", "relationships", "marriage"]) {
    if (!domains[key]) {
      return false;
    }
  }
  if (!majorPeriods || !Array.isArray(majorPeriods) || majorPeriods.length === 0) {
    return false;
  }
  if (!actionPlan || !Array.isArray(actionPlan) || actionPlan.length !== 6) {
    return false;
  }
  if (typeof obj.disclaimer !== "string" || obj.disclaimer !== ANALYSIS_DISCLAIMER) {
    return false;
  }
  return true;
}

async function callOpenAi(apiKey: string, model: string, prompt: string): Promise<string> {
  const baseUrl = envFlag("OPENAI_BASE_URL") ?? "https://api.openai.com/v1";
  const url = `${baseUrl.replace(/\/+$/, "")}/chat/completions`;
  const body = {
    model,
    response_format: { type: "json_object" as const },
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: "你是紫微斗数研究辅助模型，必须严格返回合法 JSON，不要 Markdown，不要解释。"
      },
      {
        role: "user",
        content: prompt
      }
    ] satisfies OpenAiMessage[]
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`OpenAI API 调用失败：HTTP ${response.status} ${errorText.slice(0, 400)}`);
  }

  const data = (await response.json()) as OpenAiResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI 返回结构异常：缺少 choices[0].message.content。");
  }
  return content;
}

async function main(): Promise<void> {
  const outputPaths = await readLatestOutputPointer(root);
  const raw = await readFile(outputPaths.chartPath, "utf8");
  const chart = JSON.parse(raw) as ParsedWenmoChart;

  const apiKey = envFlag("OPENAI_API_KEY") ?? envFlag("LLM_API_KEY");
  const enableFlag = envFlag("CYBER_ZIWEI_LLM");

  if (!apiKey || enableFlag === "0") {
    await fallbackToMock(chart, outputPaths, apiKey ? "环境变量 CYBER_ZIWEI_LLM=0 显式禁用" : "未配置 OPENAI_API_KEY / LLM_API_KEY");
    return;
  }

  const model = envFlag("OPENAI_MODEL") ?? "gpt-4o-mini";
  const prompt = buildAnalysisPrompt(chart);

  let rawResponse = "";
  try {
    rawResponse = await callOpenAi(apiKey, model, prompt);
  } catch (error) {
    await writeFile(outputPaths.debugPath, `Request error:\n${(error as Error).message}\n\nPrompt:\n${prompt}`, "utf8");
    await fallbackToMock(chart, outputPaths, `调用失败已写入 ${outputPaths.debugPath}`);
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawResponse);
  } catch (error) {
    await writeFile(outputPaths.debugPath, `Invalid JSON:\n${rawResponse}\n\nError: ${(error as Error).message}`, "utf8");
    await fallbackToMock(chart, outputPaths, `模型返回的 JSON 解析失败，原始响应已写入 ${outputPaths.debugPath}`);
    return;
  }

  if (!isAnalysisResult(parsed)) {
    await writeFile(outputPaths.debugPath, `Schema mismatch:\n${rawResponse}`, "utf8");
    await fallbackToMock(chart, outputPaths, `模型返回未通过结构校验，原始响应已写入 ${outputPaths.debugPath}`);
    return;
  }

  await writeJson(outputPaths.analysisPath, parsed);
  console.log(`[analyze-llm] 已写入真实模型分析到 ${outputPaths.analysisPath}（model=${model}）`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
