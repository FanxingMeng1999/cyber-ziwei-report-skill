import { readFile } from "node:fs/promises";
import { ANALYSIS_DISCLAIMER } from "../src/analysis/analysisSchema.js";
import type { AnalysisResult } from "../src/types.js";
import { readLatestOutputPointer } from "../src/utils/outputPaths.js";

const root = process.cwd();

interface AuditIssue {
  severity: "error" | "warning";
  area: string;
  message: string;
}

// 这些表达明显越界、绝对化、宿命化或带恐吓色彩，禁止出现在最终分析中。
const FORBIDDEN_PHRASES: Array<{ re: RegExp; reason: string }> = [
  { re: /必然(发财|破财|离婚|婚变|生病|生子|健康|发达|破产)/g, reason: "出现绝对化命运判断" },
  { re: /(某年|某个时间)必有(灾|祸|病|劫|难|血光|官非)/g, reason: "出现时间锁定式恐吓表达" },
  { re: /(必定|一定会|肯定会|绝对会)(发财|破产|离婚|生病|发达|大病|血光)/g, reason: "出现绝对化预言" },
  { re: /(一辈子|终生)(无法|不能)(结婚|生育|赚钱|发达)/g, reason: "出现终身否定式预言" },
  { re: /应当?服用|建议(服药|手术|治疗|用药)/g, reason: "越界给出医疗建议" },
  { re: /(适合|建议)(立刻|马上|尽快)(投资|加杠杆|买入|抄底|融资)/g, reason: "越界给出投资指令" },
  { re: /(必须|应当)(离婚|结婚|分手|和好)/g, reason: "越界给出婚姻定论" },
  { re: /命中注定|命中带煞|命犯小人|大凶之兆|血光之灾/g, reason: "宿命化或恐吓式表达" }
];

// 这些是命盘术语，提示是否解释成人话；只在数量过多时报警告。
const JARGON_TOKENS = ["三方四正", "向心自化", "飞星", "钦天四化", "河洛", "斗君"];

function lookup<T>(obj: Record<string, T>, key: string): T | undefined {
  return obj[key];
}

function pushIfMatch(text: string, area: string, issues: AuditIssue[]): void {
  if (!text) {
    return;
  }
  for (const rule of FORBIDDEN_PHRASES) {
    const match = text.match(rule.re);
    if (match) {
      issues.push({
        severity: "error",
        area,
        message: `${rule.reason}：在「${area}」中匹配到「${match[0]}」`
      });
    }
  }
}

function auditDomainChain(analysis: AnalysisResult, issues: AuditIssue[]): void {
  const domainKeys = ["health", "study", "career", "wealth", "relationships", "marriage"] as const;
  for (const key of domainKeys) {
    const domain = analysis.domains[key];
    if (!domain) {
      issues.push({ severity: "error", area: `domains.${key}`, message: "缺失整个领域块。" });
      continue;
    }
    if (!domain.assessment || domain.assessment.trim().length < 16) {
      issues.push({ severity: "error", area: `domains.${key}.assessment`, message: "领域 assessment 缺失或过短。" });
    }
    if (!domain.advice || domain.advice.length < 2) {
      issues.push({ severity: "error", area: `domains.${key}.advice`, message: "领域 advice 数量过少（应至少 2 条具体建议）。" });
    }
    if (!domain.keyPeriods || domain.keyPeriods.length === 0) {
      issues.push({ severity: "warning", area: `domains.${key}.keyPeriods`, message: "领域 keyPeriods 为空，建议至少补充一个相关大限。" });
    }
    pushIfMatch(domain.assessment ?? "", `domains.${key}.assessment`, issues);
    for (const item of domain.advice ?? []) {
      pushIfMatch(item, `domains.${key}.advice`, issues);
    }
  }
}

function auditPalaceChain(analysis: AnalysisResult, issues: AuditIssue[]): void {
  if (analysis.palaces.length !== 12) {
    issues.push({
      severity: "error",
      area: "palaces",
      message: `宫位数量异常：期望 12，实际 ${analysis.palaces.length}。`
    });
  }

  for (const palace of analysis.palaces) {
    const area = `palaces.${palace.name}`;
    if (!palace.summary || palace.summary.length < 8) {
      issues.push({ severity: "warning", area: `${area}.summary`, message: "宫位 summary 过短。" });
    }
    if (!palace.interpretation || !/依据[:：]/.test(palace.interpretation) || !/表现[:：]/.test(palace.interpretation)) {
      issues.push({
        severity: "warning",
        area: `${area}.interpretation`,
        message: "宫位 interpretation 未包含「依据 / 表现」结构，建议补全因果链。"
      });
    }
    if (!palace.advice || palace.advice.length === 0) {
      issues.push({ severity: "error", area: `${area}.advice`, message: "宫位 advice 缺失。" });
    }
    pushIfMatch(palace.interpretation ?? "", `${area}.interpretation`, issues);
    for (const item of palace.advice ?? []) {
      pushIfMatch(item, `${area}.advice`, issues);
    }
  }
}

function auditMajorPeriods(analysis: AnalysisResult, issues: AuditIssue[]): void {
  if (analysis.majorPeriods.length === 0) {
    issues.push({ severity: "error", area: "majorPeriods", message: "大限分析为空。" });
  }
  if (analysis.majorPeriods.length > 8) {
    issues.push({
      severity: "error",
      area: "majorPeriods",
      message: `大限分析数量超出 8 个：${analysis.majorPeriods.length}`
    });
  }
  for (const period of analysis.majorPeriods) {
    const area = `majorPeriods[${period.index}]`;
    if (!period.range || !period.theme || !period.analysis) {
      issues.push({ severity: "error", area, message: "大限缺少 range / theme / analysis 任一字段。" });
    }
    pushIfMatch(period.analysis ?? "", `${area}.analysis`, issues);
  }
}

function auditAnnualForecasts(analysis: AnalysisResult, issues: AuditIssue[]): void {
  if (analysis.annualForecasts.length === 0) {
    issues.push({ severity: "warning", area: "annualForecasts", message: "逐年提示为空，建议至少覆盖当前大限。" });
    return;
  }

  const themeCount = new Map<string, number>();
  const eventCount = new Map<string, number>();
  for (const item of analysis.annualForecasts) {
    const area = `annualForecasts[${item.year}]`;
    if (/上。$/.test(item.events?.[0] ?? "") && /[。\.][^。]*上。$/.test(item.events[0])) {
      issues.push({ severity: "error", area, message: `年度事件出现“上。”等模板拼接残留：${item.events[0]}` });
    }
    pushIfMatch(item.events?.join("；") ?? "", `${area}.events`, issues);
    pushIfMatch(item.risks?.join("；") ?? "", `${area}.risks`, issues);
    pushIfMatch(item.advice?.join("；") ?? "", `${area}.advice`, issues);

    themeCount.set(item.theme ?? "", (themeCount.get(item.theme ?? "") ?? 0) + 1);
    const firstEvent = item.events?.[0] ?? "";
    eventCount.set(firstEvent, (eventCount.get(firstEvent) ?? 0) + 1);
  }

  const reusedTheme = [...themeCount.entries()].find(([, n]) => n >= 6);
  if (reusedTheme && reusedTheme[0]) {
    issues.push({
      severity: "warning",
      area: "annualForecasts.theme",
      message: `有大量年份共用同一 theme（${reusedTheme[1]} 次），可在四化层面继续做差异化。`
    });
  }

  const reusedEvent = [...eventCount.entries()].find(([, n]) => n >= 8);
  if (reusedEvent && reusedEvent[0]) {
    issues.push({
      severity: "warning",
      area: "annualForecasts.events",
      message: `年度首条 event 模板高度重复（${reusedEvent[1]} 次重复）：${reusedEvent[0]}`
    });
  }
}

function auditDisclaimer(analysis: AnalysisResult, issues: AuditIssue[]): void {
  if (!analysis.disclaimer) {
    issues.push({ severity: "error", area: "disclaimer", message: "缺少免责声明。" });
    return;
  }
  if (analysis.disclaimer !== ANALYSIS_DISCLAIMER) {
    issues.push({
      severity: "error",
      area: "disclaimer",
      message: "免责声明与标准文本不一致，必须保留 ANALYSIS_DISCLAIMER 原文。"
    });
  }
}

function auditJargon(analysis: AnalysisResult, issues: AuditIssue[]): void {
  const joinedBlobs: string[] = [];
  joinedBlobs.push(analysis.profile.corePattern.summary ?? "");
  for (const palace of analysis.palaces) {
    joinedBlobs.push(palace.interpretation ?? "");
  }
  for (const note of analysis.transformations.flyingNotes ?? []) {
    joinedBlobs.push(note);
  }

  const blob = joinedBlobs.join("\n");
  const hits = JARGON_TOKENS.filter((token) => blob.includes(token));
  if (hits.length >= 4) {
    issues.push({
      severity: "warning",
      area: "jargon",
      message: `术语堆砌偏多（${hits.join("、")}），建议同步给出白话解释。`
    });
  }
}

function auditCorePattern(analysis: AnalysisResult, issues: AuditIssue[]): void {
  const core = analysis.profile.corePattern;
  if (!core.summary || core.summary.length < 30) {
    issues.push({ severity: "warning", area: "corePattern.summary", message: "核心格局 summary 过短。" });
  }
  if ((core.strengths ?? []).length < 3) {
    issues.push({ severity: "warning", area: "corePattern.strengths", message: "核心格局 strengths 数量少于 3。" });
  }
  if ((core.risks ?? []).length < 2) {
    issues.push({ severity: "warning", area: "corePattern.risks", message: "核心格局 risks 数量少于 2。" });
  }
  pushIfMatch(core.summary ?? "", "corePattern.summary", issues);
}

async function main(): Promise<void> {
  const outputPaths = await readLatestOutputPointer(root);
  const analysisPath = outputPaths.analysisPath;
  const analysis = JSON.parse(await readFile(analysisPath, "utf8")) as AnalysisResult;
  const issues: AuditIssue[] = [];

  auditDisclaimer(analysis, issues);
  auditCorePattern(analysis, issues);
  auditPalaceChain(analysis, issues);
  auditDomainChain(analysis, issues);
  auditMajorPeriods(analysis, issues);
  auditAnnualForecasts(analysis, issues);
  auditJargon(analysis, issues);

  const errors = issues.filter((item) => item.severity === "error");
  const warnings = issues.filter((item) => item.severity === "warning");

  console.log("[audit-analysis] 摘要：");
  console.log(`  - 错误数量: ${errors.length}`);
  console.log(`  - 警告数量: ${warnings.length}`);

  if (warnings.length > 0) {
    console.log("[audit-analysis] 警告：");
    for (const w of warnings) {
      console.log(`  · [${w.area}] ${w.message}`);
    }
  }

  if (errors.length > 0) {
    console.error("[audit-analysis] 错误：");
    for (const e of errors) {
      console.error(`  ✗ [${e.area}] ${e.message}`);
    }
    process.exit(1);
  }

  // 避免 typecheck 警告 lookup 未使用
  void lookup;

  console.log("[audit-analysis] 通过。");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
