import { readFile } from "node:fs/promises";
import { REPORT_VARIANTS } from "../src/render/reportVariants.js";
import { ANALYSIS_DISCLAIMER } from "../src/analysis/analysisSchema.js";
import { readLatestOutputPointer } from "../src/utils/outputPaths.js";

const root = process.cwd();

interface ReportIssue {
  severity: "error" | "warning";
  file: string;
  message: string;
}

const visibleForbidden: Array<{ re: RegExp; reason: string }> = [
  { re: /必然(发财|破财|离婚|婚变|生病|生子|破产|发达)/g, reason: "绝对化命运判断" },
  { re: /必有(灾|祸|血光|官非|大病)/g, reason: "恐吓式判断" },
  { re: /命中注定|命中带煞|血光之灾/g, reason: "宿命化表达" },
  { re: /建议(服药|手术|抄底|融资)/g, reason: "专业越界建议" },
  { re: /。上。|。。/g, reason: "模板拼接残留" }
];

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function countMatches(text: string, token: string): number {
  return text.split(token).length - 1;
}

async function auditHtmlVariant(
  variant: (typeof REPORT_VARIANTS)[number],
  html: string,
  file: string,
  issues: ReportIssue[]
): Promise<void> {
  const visibleText = stripHtml(html);
  const isAggregate = true;

  const commonTokens = [
    "报告锚定",
    "核心判断三句话",
    "领域风险条",
    "当前阶段",
    "免责声明",
    ANALYSIS_DISCLAIMER
  ];
  const densityTokens = variant.density === "detailed"
    ? ["十二宫解读", "关键变化提示", "逐年提示表"]
    : ["一页看懂", "今年焦点"];

  for (const token of [...commonTokens, ...densityTokens]) {
    if (!visibleText.includes(token)) {
      issues.push({ severity: "error", file, message: `缺少关键可见文本：${token}` });
    }
  }

  if (variant.density === "concise" && !isAggregate && visibleText.includes("逐年提示表")) {
    issues.push({ severity: "error", file, message: "省流版不应包含逐年提示大表。" });
  }

  if (!html.includes(`theme-${variant.theme}`) || !html.includes(`density-${variant.density}`)) {
    issues.push({ severity: "error", file, message: "主题或版本 class 缺失。" });
  }

  if (isAggregate) {
    if (!html.includes("variant-switcher")) {
      issues.push({ severity: "error", file, message: "聚合版缺少版本切换按钮容器。" });
    }
    for (const reportVariant of REPORT_VARIANTS) {
      if (!html.includes(`data-report-variant="${reportVariant.key}"`) || !visibleText.includes(reportVariant.label)) {
        issues.push({ severity: "error", file, message: `聚合版缺少版本：${reportVariant.label}` });
      }
    }
  }

  if (!html.includes("@media print") || !html.includes("@page")) {
    issues.push({ severity: "error", file, message: "缺少打印 CSS。" });
  }

  const disclaimerCount = countMatches(visibleText, ANALYSIS_DISCLAIMER);
  const expectedDisclaimerCount = isAggregate ? REPORT_VARIANTS.length : 1;
  if (disclaimerCount !== expectedDisclaimerCount) {
    issues.push({ severity: "warning", file, message: `免责声明出现 ${disclaimerCount} 次，期望 ${expectedDisclaimerCount} 次。` });
  }

  const redHighlightCount = countMatches(html, "hl-red");
  const maxRedHighlight = isAggregate ? 32 : 8;
  if (redHighlightCount > maxRedHighlight) {
    issues.push({ severity: "warning", file, message: `红色高亮数量偏多（${redHighlightCount}），可能削弱风险语义。` });
  }

  for (const rule of visibleForbidden) {
    const match = visibleText.match(rule.re);
    if (match) {
      issues.push({
        severity: "error",
        file,
        message: `${rule.reason}：${match[0]}`
      });
    }
  }
}

async function main(): Promise<void> {
  const issues: ReportIssue[] = [];
  const outputPaths = await readLatestOutputPointer(root);
  const html = await readFile(outputPaths.reportPath, "utf8");
  for (const variant of REPORT_VARIANTS) {
    await auditHtmlVariant(variant, html, outputPaths.reportPath, issues);
  }

  const errors = issues.filter((item) => item.severity === "error");
  const warnings = issues.filter((item) => item.severity === "warning");

  console.log("[audit-report] 摘要：");
  console.log(`  - 错误数量: ${errors.length}`);
  console.log(`  - 警告数量: ${warnings.length}`);

  if (warnings.length > 0) {
    console.log("[audit-report] 警告：");
    for (const issue of warnings) {
      console.log(`  · [${issue.file}] ${issue.message}`);
    }
  }

  if (errors.length > 0) {
    console.error("[audit-report] 错误：");
    for (const issue of errors) {
      console.error(`  ✗ [${issue.file}] ${issue.message}`);
    }
    process.exit(1);
  }

  console.log("[audit-report] 通过。");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
