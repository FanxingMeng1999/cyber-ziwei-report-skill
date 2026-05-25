import { readdir, readFile } from "node:fs/promises";
import { ANALYSIS_DISCLAIMER } from "../src/analysis/analysisSchema.js";
import type { AnalysisResult, ParsedWenmoChart } from "../src/types.js";
import { getOutputRoot, readLatestOutputPointer } from "../src/utils/outputPaths.js";

const root = process.cwd();

async function main(): Promise<void> {
  const outputPaths = await readLatestOutputPointer(root);
  const chart = JSON.parse(await readFile(outputPaths.chartPath, "utf8")) as ParsedWenmoChart;
  const analysis = JSON.parse(await readFile(outputPaths.analysisPath, "utf8")) as AnalysisResult;

  if (chart.palaces.length !== 12) {
    throw new Error(`chart.json 宫位数量异常：期望 12，实际 ${chart.palaces.length}`);
  }

  const flaggedBodyPalace = chart.palaces.find((palace) => palace.isBodyPalace);
  if (flaggedBodyPalace && chart.basicInfo.bodyPalace !== flaggedBodyPalace.name) {
    throw new Error(`chart.json 身宫映射异常：标记在 ${flaggedBodyPalace.name}，basicInfo 为 ${chart.basicInfo.bodyPalace ?? "空"}`);
  }

  if (chart.palaces.every((palace) => palace.flowYears.length === 0)) {
    throw new Error("chart.json 十二宫流年年龄全部为空，可能误删了宫位流年信息");
  }

  if (!analysis.disclaimer) {
    throw new Error("analysis.json 缺少 disclaimer");
  }

  if (analysis.disclaimer !== ANALYSIS_DISCLAIMER) {
    throw new Error("analysis.json 的免责声明与标准文本不一致");
  }

  if (analysis.palaces.length !== 12) {
    throw new Error(`analysis.json 宫位分析数量异常：期望 12，实际 ${analysis.palaces.length}`);
  }

  if (flaggedBodyPalace && /未明确身宫落点/.test(analysis.profile.corePattern.summary)) {
    throw new Error("analysis.json 已有身宫标记，但核心格局仍提示身宫未明确");
  }

  const domainKeys = ["health", "study", "career", "wealth", "relationships", "marriage"] as const;
  for (const key of domainKeys) {
    const domain = analysis.domains[key];
    if (!domain || !domain.assessment || domain.advice.length === 0) {
      throw new Error(`analysis.json 缺少完整领域分析：${key}`);
    }
  }

  if (analysis.majorPeriods.length === 0 || analysis.majorPeriods.length > 8) {
    throw new Error(`analysis.json 前八大限数量异常：${analysis.majorPeriods.length}`);
  }

  if (analysis.actionPlan.length !== 6) {
    throw new Error(`analysis.json 行动建议数量异常：期望 6，实际 ${analysis.actionPlan.length}`);
  }

  const anchoredAnnual = analysis.annualForecasts.find((item) => item.year === 2026);
  if (!anchoredAnnual) {
    throw new Error("analysis.json 缺少 2026 年当前流年记录");
  }
  if (!anchoredAnnual.annualPalace || !anchoredAnnual.transformations?.length || !anchoredAnnual.evidence?.length) {
    throw new Error("analysis.json 当前流年缺少流年命宫、四化或证据链字段");
  }

  // 检测 mock 模板拼接残留：events 不能以「上。」收尾，且不应同时包含连续两个句号
  for (const item of analysis.annualForecasts) {
    for (const event of item.events) {
      if (/。上。$/.test(event)) {
        throw new Error(`流年事件出现模板拼接残留（"上。"）：${item.year} - ${event}`);
      }
      if (/。。/.test(event)) {
        throw new Error(`流年事件出现连续句号：${item.year} - ${event}`);
      }
    }
  }

  // 排除绝对化、恐吓式或越界专业建议表达
  const forbidden = [
    /必然(发财|破财|离婚|生病|生子|破产|发达)/,
    /必有(灾|祸|血光|官非|大病)/,
    /(命中注定|命中带煞|血光之灾)/,
    /建议(服药|手术|抄底|融资)/
  ];
  const blobs: string[] = [];
  blobs.push(analysis.profile.corePattern.summary ?? "");
  for (const palace of analysis.palaces) {
    blobs.push(palace.summary ?? "", palace.interpretation ?? "");
    blobs.push(...(palace.advice ?? []));
  }
  for (const key of domainKeys) {
    blobs.push(analysis.domains[key].assessment ?? "");
    blobs.push(...(analysis.domains[key].advice ?? []));
  }
  for (const period of analysis.majorPeriods) {
    blobs.push(period.analysis ?? "");
    blobs.push(...(period.advice ?? []));
  }
  for (const annual of analysis.annualForecasts) {
    blobs.push(...(annual.events ?? []));
    blobs.push(...(annual.risks ?? []));
    blobs.push(...(annual.advice ?? []));
  }

  for (const blob of blobs) {
    for (const re of forbidden) {
      if (re.test(blob)) {
        throw new Error(`analysis.json 出现绝对化或越界表达：${blob}`);
      }
    }
  }

  const namedHtml = await readFile(outputPaths.reportPath, "utf8");
  if (
    !namedHtml.includes("variant-switcher") ||
    !namedHtml.includes("免责声明") ||
    !namedHtml.includes("不能替代")
  ) {
    throw new Error(`${outputPaths.reportPath} 不是完整聚合报告`);
  }
  for (const token of ["目录", "十二宫", "前八大限", "一页看懂", "六大领域", "核心判断三句话", "领域风险条"]) {
    if (!namedHtml.includes(token)) {
      throw new Error(`report.html 缺少关键内容：${token}`);
    }
  }
  for (const token of ["detailed-dark", "detailed-light", "concise-dark", "concise-light"]) {
    if (!namedHtml.includes(`data-report-variant="${token}"`) || !namedHtml.includes(`id="${token}-sec-profile"`)) {
      throw new Error(`report.html 聚合版缺少版本或唯一章节锚点：${token}`);
    }
  }
  const ids = [...namedHtml.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  if (duplicateIds.length > 0) {
    throw new Error(`report.html 聚合版存在重复章节 id：${duplicateIds.join("、")}`);
  }
  for (const token of ["证据链怎么读", "流年命宫", "table-card", "overflow-x: auto", "aria-pressed", "replaceState"]) {
    if (!namedHtml.includes(token)) {
      throw new Error(`report.html 缺少结构或交互保护：${token}`);
    }
  }
  if (/。上。/.test(namedHtml)) {
    throw new Error("report.html 出现模板拼接残留（\"。上。\"）");
  }

  const outputEntries = await readdir(getOutputRoot(root));
  const pdfFiles = outputEntries.filter((file) => file.toLowerCase().endsWith(".pdf"));
  if (pdfFiles.length > 0) {
    throw new Error(`当前工作流已禁用 PDF 导出，但 output 中仍有 PDF 文件：${pdfFiles.join("、")}`);
  }
  const legacyRootFiles = outputEntries.filter((file) =>
    ["chart.json", "analysis.json", "report.html", "report-light.html", "report-quick.html", "report-quick-light.html"].includes(file) ||
    /^紫微斗数报告-.+\.html$/u.test(file)
  );
  if (legacyRootFiles.length > 0) {
    throw new Error(`output 根目录仍有旧式散落产物：${legacyRootFiles.join("、")}`);
  }

  console.log("Checks passed. (HTML-only workflow)");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
