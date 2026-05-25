import type { ParsedWenmoChart } from "../types.js";
import { ANALYSIS_DISCLAIMER, ANALYSIS_JSON_CONTRACT } from "./analysisSchema.js";

export function buildAnalysisPrompt(chart: ParsedWenmoChart): string {
  return [
    "你是紫微斗数研究辅助模型，需要基于给定命盘数据输出严格合法 JSON。",
    "不要输出 Markdown，不要输出代码块，不要解释你的思路，不要补充 schema 之外的外层文本。",
    "分析视角必须同时综合：三合紫微、飞星紫微、河洛紫微、钦天四化。",
    "分析时必须覆盖：十二宫星曜分布、命财官三方四正、身命关系、来因宫、生年四化、自化、向心自化、大限四化、流年四化。",
    "对健康、学业、事业、财运、人际、婚姻感情分别给出客观分析。",
    "关键事件必须包含时间范围、吉凶属性、影响程度、命盘依据、现实建议。",
    "前八个大限的逐年流年必须表格化信息化输出到 annualForecasts，保证每一年都有 year、majorPeriodIndex、theme、events、risks、advice。",
    "涉及医疗、投资、婚姻、法律相关内容时必须使用审慎措辞，不能给绝对判断，不能制造恐吓式、宿命论表达。",
    `免责声明必须原样写入 disclaimer：${ANALYSIS_DISCLAIMER}`,
    "如果原始数据不完整，meta.dataCompleteness 必须为 partial，并在 meta.warnings 与相关 majorPeriods / annualForecasts 中说明补推或未分析部分。",
    "请严格遵守下列 JSON 结构：",
    JSON.stringify(ANALYSIS_JSON_CONTRACT, null, 2),
    "以下是待分析命盘 JSON：",
    JSON.stringify(chart, null, 2)
  ].join("\n\n");
}
