import React from "react";
import type { AnalysisResult, MajorPeriodAnalysis, ParsedWenmoChart } from "../types.js";
import { buildAggregateStyles, buildStyles, type ReportTheme } from "./styles.js";
import { REPORT_VARIANTS, type ReportDensity, type RenderVariant } from "./reportVariants.js";

interface ReportProps {
  chart: ParsedWenmoChart;
  analysis: AnalysisResult;
  theme: ReportTheme;
  density: ReportDensity;
  idPrefix?: string;
}

interface SectionIdProps {
  idPrefix?: string;
}

const BODY_FOCUS: Record<string, string> = {
  命宫: "人格结构、行动风格与自我驱动",
  兄弟宫: "同辈协作、资源互助与边界感",
  夫妻宫: "亲密关系期待、互动模式与协商能力",
  子女宫: "创造表达、项目孵化与照料责任",
  财帛宫: "现金流、收入结构与风险偏好",
  疾厄宫: "身心负荷、恢复节律与长期保养",
  迁移宫: "外部环境、出行变化与跨界机会",
  交友宫: "团队网络、人脉质量与合作筛选",
  官禄宫: "职业路径、职责结构与成就方式",
  田宅宫: "资产沉淀、居住环境与安全感来源",
  福德宫: "精神缓冲、兴趣系统与压力代谢",
  父母宫: "制度支持、长辈关系与规范来源"
};

function sectionId(id: string, idPrefix?: string): string {
  return idPrefix ? `${idPrefix}-${id}` : id;
}

const DOMAIN_ITEMS = [
  ["health", "健康"],
  ["study", "学习进修"],
  ["career", "事业"],
  ["wealth", "财运"],
  ["relationships", "人际"],
  ["marriage", "婚姻感情"]
] as const;

function sectionTitle(index: string, title: string) {
  return (
    <>
      <span className="section-index">{index}</span>
      <span>{title}</span>
    </>
  );
}

function subTitle(index: string, title: string) {
  return (
    <>
      <span className="sub-index">{index}</span>
      <span>{title}</span>
    </>
  );
}

function emphasizeText(text: string): React.ReactNode {
  // 仅保留少量、有意义的高亮，避免红色滥用与高亮过密
  const rules: Array<{ re: RegExp; cls: string }> = [
    { re: /(免责声明|不能替代|高代价决策|风险等级)/g, cls: "highlight hl-red" },
    { re: /(当前阶段|核心格局|行动建议)/g, cls: "highlight hl-gold" },
    { re: /(命宫|身宫|大限|流年)/g, cls: "highlight hl-cyan" }
  ];

  const matches: Array<{ start: number; end: number; cls: string }> = [];
  for (const rule of rules) {
    for (const match of text.matchAll(rule.re)) {
      if (typeof match.index === "number") {
        matches.push({ start: match.index, end: match.index + match[0].length, cls: rule.cls });
      }
    }
  }

  matches.sort((a, b) => a.start - b.start || b.end - a.end);
  const filtered: Array<{ start: number; end: number; cls: string }> = [];
  let cursor = -1;
  for (const match of matches) {
    if (match.start >= cursor) {
      filtered.push(match);
      cursor = match.end;
    }
  }

  if (filtered.length === 0) {
    return text;
  }

  const parts: React.ReactNode[] = [];
  let index = 0;
  filtered.forEach((match, i) => {
    if (match.start > index) {
      parts.push(text.slice(index, match.start));
    }
    parts.push(
      <strong className={match.cls} key={`${match.start}-${match.end}-${i}`}>
        {text.slice(match.start, match.end)}
      </strong>
    );
    index = match.end;
  });
  if (index < text.length) {
    parts.push(text.slice(index));
  }
  return <>{parts}</>;
}

function EmText({ text, className }: { text: string; className?: string }) {
  return <span className={className}>{emphasizeText(text)}</span>;
}

function riskLabel(level: string): string {
  switch (level) {
    case "low":
      return "低";
    case "high":
      return "高";
    default:
      return "中";
  }
}

function riskClass(level: string): string {
  switch (level) {
    case "low":
      return "risk-low";
    case "high":
      return "risk-high";
    default:
      return "risk-medium";
  }
}

function riskValue(level: string): number {
  switch (level) {
    case "low":
      return 32;
    case "high":
      return 88;
    default:
      return 60;
  }
}

function starCountLabel(count: number): string {
  if (count >= 6) {
    return "星曜密集";
  }
  if (count >= 3) {
    return "线索充足";
  }
  return "线索较少";
}

function isHighImpactAnnual(impact: string): boolean {
  // 新的 impact 取值为 低/中/高，"中"也算偏高优先级提示
  return impact === "高" || impact === "中高";
}

function isRiskyAuspiciousness(text: string): boolean {
  return text.includes("凶");
}

function keyAnnuals(analysis: AnalysisResult) {
  return analysis.annualForecasts
    .filter((item) => isHighImpactAnnual(item.impact) || isRiskyAuspiciousness(item.auspiciousness))
    .slice(0, 8);
}

function currentYearAnnual(analysis: AnalysisResult, currentYear: number) {
  return analysis.annualForecasts.find((item) => item.year === currentYear);
}

function currentMajorPeriod(chart: ParsedWenmoChart, analysis: AnalysisResult, currentYear: number) {
  const rawPeriod = chart.majorPeriods.find(
    (period) =>
      typeof period.startYear === "number" &&
      typeof period.endYear === "number" &&
      currentYear >= period.startYear &&
      currentYear <= period.endYear
  );
  return rawPeriod ? analysis.majorPeriods.find((period) => period.index === rawPeriod.index) : undefined;
}

function deriveCoreSentences(analysis: AnalysisResult): string[] {
  const strengths = analysis.profile.corePattern.strengths.filter(Boolean);
  const risks = analysis.profile.corePattern.risks.filter(Boolean);
  const bodyPalace = analysis.profile.basicInfo.bodyPalace;
  const partial = analysis.meta.dataCompleteness === "partial";

  const first = strengths.length >= 3
    ? `主线靠${strengths.slice(0, 3).join("、")}推动局面。`
    : strengths.length > 0
      ? `主线靠${strengths.join("、")}推动局面。`
      : "主线偏向稳健经营，宜先做记录再做决定。";

  const second = strengths.length >= 5
    ? `优势焦点在${strengths.slice(3, 5).join("、")}，适合沉淀成可复用的方法。`
    : "优势可以先做成流程、案例或长期合作，比单次发挥更稳。";

  const third = risks.length >= 2
    ? `重点管理${risks.slice(0, 2).join("、")}带来的消耗。`
    : "重点是把节奏和边界写清楚，避免长期硬撑。";

  const fourth = bodyPalace
    ? bodyPalace === "命宫"
      ? `身宫在命宫，命身同宫，行动重心与自我判断集中在${BODY_FOCUS[bodyPalace]}。`
      : `身宫在${bodyPalace}，行动重心常落到${BODY_FOCUS[bodyPalace] ?? "对应生活分区"}。`
    : "身宫未明确，重心仍要结合现实经历判断。";

  return [first, second, third, partial ? "原始数据存在部分缺失，请把以下提示理解为参考而非定论。" : fourth];
}

function MetricBar({ label, value, tone }: { label: string; value: number; tone?: "gold" | "cyan" | "red" }) {
  return (
    <div className={`metric-line tone-${tone ?? "cyan"}`}>
      <div className="metric-top">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="metric-track">
        <span style={{ width: `${Math.max(8, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

function InsightStrip({ items }: { items: Array<{ label: string; value: string; tone?: "gold" | "cyan" | "red" }> }) {
  return (
    <div className="insight-strip">
      {items.map((item) => (
        <div className={`insight-chip tone-${item.tone ?? "cyan"}`} key={`${item.label}-${item.value}`}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

function Header({ chart, analysis, density, currentYear }: Pick<ReportProps, "chart" | "analysis" | "density"> & { currentYear: number }) {
  return (
    <header className="hero">
      <div className="eyebrow">赛博算卦 · 紫微命盘参考报告 · {density === "detailed" ? "详细版" : "省流版"}</div>
      <h1>{analysis.meta.title}</h1>
      <p className="subtitle">
        {density === "detailed"
          ? "基于文墨天机紫微斗数命盘原始文本生成。本报告尽量用直白、克制、可复盘的方式说明重点，适合研究、娱乐和自我反思。"
          : "面向快速阅读的省流版本，优先保留核心格局、六大方向、关键阶段和行动建议，方便先看全局再决定是否细读详细版。"}
      </p>
      <div className="meta-grid">
        <div className="meta-card">
          <div className="meta-label">安星码</div>
          <div className="meta-value">{chart.meta.anXingCode ?? "未提供安星码"}</div>
        </div>
        <div className="meta-card">
          <div className="meta-label">数据完整情况</div>
          <div className="meta-value">{analysis.meta.dataCompleteness === "partial" ? "部分缺失，建议保守理解" : "数据完整"}</div>
        </div>
        <div className="meta-card">
          <div className="meta-label">参考年份</div>
          <div className="meta-value">报告以 {currentYear} 年为时间锚点</div>
        </div>
      </div>
    </header>
  );
}

function ScanBoard({
  chart,
  analysis,
  density,
  currentYear,
  currentPeriod,
  currentAnnual
}: Pick<ReportProps, "chart" | "analysis" | "density"> & {
  currentYear: number;
  currentPeriod?: MajorPeriodAnalysis;
  currentAnnual?: ReturnType<typeof currentYearAnnual>;
}) {
  const topPalaces = analysis.palaces
    .map((palace) => ({ palace, count: palace.stars.length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, density === "detailed" ? 5 : 3);
  const annuals = keyAnnuals(analysis).slice(0, density === "detailed" ? 6 : 4);

  return (
    <div className="scan-board">
      <div className="scan-panel">
        <h3>{subTitle("2-5", "领域风险条")}</h3>
        {DOMAIN_ITEMS.map(([key, label]) => {
          const domain = analysis.domains[key];
          return (
            <MetricBar
              key={key}
              label={`${label}：${riskLabel(domain.riskLevel)}`}
              value={riskValue(domain.riskLevel)}
              tone={domain.riskLevel === "high" ? "red" : domain.riskLevel === "medium" ? "gold" : "cyan"}
            />
          );
        })}
      </div>
      <div className="scan-panel">
        <h3>{subTitle("2-6", "当前阶段")}</h3>
        {currentPeriod ? (
          <>
            <p className="lead">
              <EmText text={`${currentYear} 年位于第 ${currentPeriod.index} 大限（${currentPeriod.range}）。`} />
            </p>
            <p><EmText text={currentPeriod.theme} /></p>
            <div className="tag-row">
              <span className="tag">{currentPeriod.auspiciousness}</span>
              <span className="tag">影响：{currentPeriod.impact}</span>
              {currentAnnual ? <span className="tag">今年流年：{currentAnnual.auspiciousness}</span> : null}
            </div>
          </>
        ) : (
          <p className="lead">当前样本未定位到正在运行的十年阶段，请结合完整命盘数据继续核对。</p>
        )}
      </div>
      <div className="scan-panel">
        <h3>{subTitle("2-7", "星曜密度")}</h3>
        <div className="mini-rank">
          {topPalaces.map(({ palace, count }) => (
            <div className="rank-row" key={palace.name}>
              <span>{palace.name}</span>
              <strong>{starCountLabel(count)} · {count}</strong>
            </div>
          ))}
        </div>
      </div>
      <div className="scan-panel">
        <h3>{subTitle("2-8", "重点年份")}</h3>
        <div className="year-pills">
          {annuals.length > 0 ? annuals.map((item) => (
            <span className={`year-pill${item.year === currentYear ? " is-current" : ""}`} key={`${item.majorPeriodIndex}-${item.year}`}>
              <strong>{item.year}</strong>
              <small>{item.palace} · {item.auspiciousness}</small>
            </span>
          )) : <span className="small">未筛出高关注年份，建议按完整流年表复盘。</span>}
        </div>
        <p className="small" style={{ marginTop: 8 }}>{chart.basicInfo.gender ? `（性别：${chart.basicInfo.gender}）` : ""}</p>
      </div>
    </div>
  );
}

function FocusBanner({
  currentYear,
  currentPeriod,
  currentAnnual
}: {
  currentYear: number;
  currentPeriod?: MajorPeriodAnalysis;
  currentAnnual?: ReturnType<typeof currentYearAnnual>;
}) {
  if (!currentPeriod && !currentAnnual) {
    return null;
  }
  return (
    <div className="focus-banner">
      <div className="focus-eyebrow">报告锚定</div>
      <div className="focus-headline">
        {currentPeriod ? `${currentYear} 年 · 第 ${currentPeriod.index} 大限 · ${currentPeriod.range}` : `${currentYear} 年`}
      </div>
      {currentAnnual ? (
        <p>{currentAnnual.theme}</p>
      ) : (
        <p>当前流年未在前八大限范围内，请结合完整命盘继续核对。</p>
      )}
      {currentAnnual ? (
        <div className="focus-tags">
          <span className="tag">大限主宫：{currentAnnual.palace}</span>
          {currentAnnual.annualPalace ? <span className="tag">流年命宫：{currentAnnual.annualPalace}</span> : null}
          <span className="tag">流年定调：{currentAnnual.auspiciousness}</span>
          <span className="tag">影响等级：{currentAnnual.impact}</span>
        </div>
      ) : null}
    </div>
  );
}

function Toc({ density, idPrefix }: Pick<ReportProps, "density"> & SectionIdProps) {
  const detailedItems = [
    ["sec-toc", "目录"],
    ["sec-profile", "基础信息与核心格局"],
    ["sec-palaces", "十二宫解读"],
    ["sec-transformations", "四化与飞化线索"],
    ["sec-domains", "分领域分析"],
    ["sec-major", "前八大限"],
    ["sec-annual", "逐年流年"],
    ["sec-action", "行动建议"],
    ["sec-disclaimer", "免责声明"]
  ];

  const conciseItems = [
    ["sec-toc", "目录"],
    ["sec-profile", "核心格局"],
    ["sec-quick", "一页看懂"],
    ["sec-domains", "六大领域"],
    ["sec-major", "前八大限摘要"],
    ["sec-action", "优先建议"],
    ["sec-disclaimer", "免责声明"]
  ];

  const items = density === "detailed" ? detailedItems : conciseItems;

  return (
    <section id={sectionId("sec-toc", idPrefix)}>
      <div className="section-head">
        <h2>{sectionTitle("01", "目录")}</h2>
        <div className="section-note">快速索引</div>
      </div>
      <ul className="toc-list">
        {items.map(([id, label], index) => (
          <li className="toc-item" key={id}>
            <a className="toc-link" href={`#${sectionId(id, idPrefix)}`}>
              {index + 1}. {label}
            </a>
            <span className="small">章节</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProfileSection({
  chart,
  analysis,
  density,
  currentPeriod,
  coreSentences,
  idPrefix
}: Pick<ReportProps, "chart" | "analysis" | "density"> & {
  currentPeriod?: MajorPeriodAnalysis;
  coreSentences: string[];
} & SectionIdProps) {
  const info = analysis.profile.basicInfo;
  const core = analysis.profile.corePattern;
  const keyRisks = DOMAIN_ITEMS.filter(([key]) => analysis.domains[key].riskLevel !== "low");

  return (
    <section id={sectionId("sec-profile", idPrefix)} className="page-break">
      <div className="section-head">
        <h2>{sectionTitle("02", density === "detailed" ? "基础信息与核心格局" : "核心格局")}</h2>
        <div className="section-note">先看这一页</div>
      </div>
      <div className="grid-2">
        <div className="card">
          <h3>{subTitle("2-1", density === "detailed" ? "基础信息" : "命盘摘要")}</h3>
          <p><EmText text={`性别：${info.gender ?? "未提供"}`} /></p>
          <p><EmText text={`农历时间：${info.lunarTime ?? "未提供"}`} /></p>
          <p><EmText text={`钟表时间：${info.clockTime ?? "未提供"}`} /></p>
          {density === "detailed" ? (
            <>
              <p><EmText text={`真太阳时：${info.trueSolarTime ?? "未提供"}`} /></p>
              <p><EmText text={`节气四柱：${info.solarTermFourPillars ?? "未提供"}`} /></p>
              <p><EmText text={`非节气四柱：${info.nonSolarTermFourPillars ?? "未提供"}`} /></p>
              <p><EmText text={`五行局数：${info.fiveElementBureau ?? "未提供"}`} /></p>
              <p><EmText text={`命主 / 身主：${info.lifeMaster ?? "未提供"} / ${info.bodyMaster ?? "未提供"}`} /></p>
              <p><EmText text={`子年斗君：${info.childYearDouJun ?? "未提供"}`} /></p>
            </>
          ) : (
            <>
              <p><EmText text={`五行局数：${info.fiveElementBureau ?? "未提供"}`} /></p>
              <p><EmText text={`命主 / 身主：${info.lifeMaster ?? "未提供"} / ${info.bodyMaster ?? "未提供"}`} /></p>
            </>
          )}
          <p><EmText text={`身宫：${info.bodyPalace ?? chart.basicInfo.bodyPalace ?? "未提供"}`} /></p>
        </div>
        <div className="card">
          <h3>{subTitle("2-2", "核心格局")}</h3>
          <p className={density === "concise" ? "lead" : undefined}><EmText text={core.summary} /></p>
          <div className="statement-box">
            <strong>核心判断三句话</strong>
            <ol>
              {coreSentences.map((sentence, idx) => (
                <li key={`core-${idx}`}>{sentence}</li>
              ))}
            </ol>
          </div>
          <div className="tag-row">
            {core.keywords.map((item) => (
              <span className="tag" key={item}>{item}</span>
            ))}
          </div>
          <div className="key-points">
            <span className="key-chip"><b>关键词</b><span>{core.keywords.slice(0, 4).join("、")}</span></span>
            <span className="key-chip"><b>重点</b><span>{core.strengths.slice(0, 2).join("、")}</span></span>
          </div>
          <h3 style={{ marginTop: 16 }}>{subTitle("2-3", "优势焦点")}</h3>
          <ul>
            {core.strengths.slice(0, density === "detailed" ? core.strengths.length : 4).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h3 style={{ marginTop: 16 }}>{subTitle("2-4", "关注点")}</h3>
          <ul>
            {core.risks.slice(0, density === "detailed" ? core.risks.length : 4).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      <InsightStrip
        items={[
          { label: "当前阶段", value: currentPeriod ? `第 ${currentPeriod.index} 大限` : "未定位", tone: "gold" },
          { label: "阶段主题", value: currentPeriod?.theme.replace("主导的十年主题，重心落在", "重心：").replace("。", "") ?? "需结合完整数据", tone: "cyan" },
          { label: "需先管理", value: keyRisks.map(([, label]) => label).slice(0, 3).join("、") || "保持记录", tone: "red" }
        ]}
      />
      <div className="boundary-note">
        <strong>阅读边界</strong>
        <span>吉凶与影响等级是报告内部的风险分层，不是事件承诺；医疗、投资、法律、婚姻和心理相关事项仍以专业意见与真实证据为准。</span>
      </div>
      {analysis.meta.warnings.length > 0 ? (
        <div className="warning-card" style={{ marginTop: 14 }}>
          <strong className="hl-red">数据提示：</strong>
          <ul>
            {analysis.meta.warnings.slice(0, density === "detailed" ? 8 : 4).map((item) => (
              <li key={item}><EmText text={item} /></li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function QuickSection({
  analysis,
  currentAnnual,
  idPrefix
}: Pick<ReportProps, "analysis"> & { currentAnnual?: ReturnType<typeof currentYearAnnual> } & SectionIdProps) {
  const topActions = analysis.actionPlan.slice(0, 4);
  const topPeriods = analysis.majorPeriods.slice(0, 4);
  const topDomains = [
    ["健康", analysis.domains.health],
    ["事业", analysis.domains.career],
    ["财运", analysis.domains.wealth],
    ["婚姻感情", analysis.domains.marriage]
  ] as const;

  return (
    <section id={sectionId("sec-quick", idPrefix)} className="page-break">
      <div className="section-head">
        <h2>{sectionTitle("03", "一页看懂")}</h2>
        <div className="section-note">三分钟读完</div>
      </div>
      {currentAnnual ? (
        <div className="current-year-card">
          <div className="card-eyebrow">今年焦点 · {currentAnnual.year}</div>
          <p className="lead">{currentAnnual.theme}</p>
          {currentAnnual.annualPalace ? (
            <p className="small"><span className="field-label">流年命宫：</span>{currentAnnual.annualPalace}{currentAnnual.annualLifePalaceGanzhi ? ` [${currentAnnual.annualLifePalaceGanzhi}]` : ""}</p>
          ) : null}
          <ul>
            {currentAnnual.events.slice(0, 2).map((event) => (
              <li key={`now-${event}`}>{event}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="quick-summary">
        <div className="card">
          <h3>{subTitle("3-1", "最该先看什么")}</h3>
          <ol className="quick-list">
            {topActions.map((item) => (
              <li key={item.domain}>
                <strong className="hl-gold">{item.domain}</strong>：{item.recommendation}
              </li>
            ))}
          </ol>
        </div>
        <div className="quick-pillars">
          {topDomains.map(([label, domain], index) => (
            <div className="quick-tile" key={label}>
              <h3>{subTitle(`3-${index + 2}`, label)}</h3>
              <div className={`risk-badge ${riskClass(domain.riskLevel)}`}>风险等级：{riskLabel(domain.riskLevel)}</div>
              <p className="small" style={{ marginTop: 10 }}>{domain.assessment}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="grid-2" style={{ marginTop: 14 }}>
        {topPeriods.map((period) => (
          <div className="card" key={period.index}>
            <h3>{subTitle(`3-${period.index + 4}`, `第 ${period.index} 大限`)}</h3>
            <p><EmText text={period.range} /></p>
            <div className="tag-row">
              <span className="tag">{period.auspiciousness}</span>
              <span className="tag">影响：{period.impact}</span>
            </div>
            <p style={{ marginTop: 10 }}><EmText text={period.analysis} /></p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PalacesSection({ analysis, density, idPrefix }: Pick<ReportProps, "analysis" | "density"> & SectionIdProps) {
  const palaces = density === "detailed" ? analysis.palaces : analysis.palaces.slice(0, 6);
  const densePalaces = analysis.palaces
    .map((palace) => `${palace.name}${palace.stars.length}星`)
    .slice(0, 5)
    .join("、");
  return (
    <section id={sectionId("sec-palaces", idPrefix)} className="page-break">
      <div className="section-head">
        <h2>{sectionTitle("03", "十二宫解读")}</h2>
        <div className="section-note">逐宫说明</div>
      </div>
      <InsightStrip
        items={[
          { label: "阅读方式", value: "先看主轴，再看风险和建议", tone: "gold" },
          { label: "星曜概览", value: densePalaces || "暂无", tone: "cyan" },
          { label: "提醒", value: "单宫不作绝对判断", tone: "red" }
        ]}
      />
      <div className="palace-grid">
        {palaces.map((palace, index) => (
          <article className="card palace-card" key={palace.name}>
            <h3>
              <span>{subTitle(`3-${index + 1}`, palace.name)}</span>
              <span className="mini-status">{starCountLabel(palace.stars.length)} · {palace.stars.length}星</span>
            </h3>
            <div className="structured-lines">
              <p><b>主轴</b><span>{palace.summary}</span></p>
              <p><b>星曜</b><span>{palace.stars.join("、") || "未解析到明确星曜"}</span></p>
              <p><b>解读</b><span>{palace.interpretation}</span></p>
            </div>
            <div className="tag-row">
              {palace.strengths.map((item) => (
                <span className="tag" key={`${palace.name}-${item}`}>{item}</span>
              ))}
            </div>
            <p className="small tone-strong field-label" style={{ marginTop: 12 }}>风险关注</p>
            <ul>
              {palace.risks.slice(0, density === "detailed" ? palace.risks.length : 3).map((item) => (
                <li key={`${palace.name}-risk-${item}`}>{item}</li>
              ))}
            </ul>
            <p className="small tone-strong field-label" style={{ marginTop: 12 }}>建议</p>
            <ul>
              {palace.advice.slice(0, density === "detailed" ? palace.advice.length : 2).map((item) => (
                <li key={`${palace.name}-advice-${item}`}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

function TransformationSection({ analysis, idPrefix }: Pick<ReportProps, "analysis"> & SectionIdProps) {
  const t = analysis.transformations;

  return (
    <section id={sectionId("sec-transformations", idPrefix)} className="page-break">
      <div className="section-head">
        <h2>{sectionTitle("04", "关键变化提示（四化）")}</h2>
        <div className="section-note">长期与年度变化</div>
      </div>
      <div className="grid-3">
        <div className="card">
          <h3>{subTitle("4-1", "先天变化")}</h3>
          <div className="tag-row">
            {t.birthTransformations.length > 0 ? t.birthTransformations.map((item) => <span className="tag" key={item}>{item}</span>) : <span className="small">暂无明确标签</span>}
          </div>
        </div>
        <div className="card">
          <h3>{subTitle("4-2", "主动变化")}</h3>
          <div className="tag-row">
            {t.selfTransformations.length > 0 ? t.selfTransformations.map((item) => <span className="tag" key={item}>{item}</span>) : <span className="small">暂无明确标签</span>}
          </div>
        </div>
        <div className="card">
          <h3>{subTitle("4-3", "外界带来的变化")}</h3>
          <div className="tag-row">
            {t.incomingTransformations.length > 0 ? t.incomingTransformations.map((item) => <span className="tag" key={item}>{item}</span>) : <span className="small">暂无明确标签</span>}
          </div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <h3>{subTitle("4-4", "理解提示")}</h3>
        <ul>
          {t.flyingNotes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="evidence-grid">
        <div className="evidence-card">
          <b>4-5 证据链怎么读</b>
          <span>先看本命宫位与星曜，再看四化标签；大限代表十年主场，流年命宫代表当年切入点。</span>
        </div>
        <div className="evidence-card">
          <b>4-6 当前实现边界</b>
          <span>本地规则已定位星曜四化落宫，并保留三方四正、飞宫等复杂推演的后续接入位置。</span>
        </div>
      </div>
    </section>
  );
}

function DomainsSection({ analysis, density, idPrefix }: Pick<ReportProps, "analysis" | "density"> & SectionIdProps) {
  const riskSummary = DOMAIN_ITEMS.map(([key, label]) => `${label}${riskLabel(analysis.domains[key].riskLevel)}`).join("、");

  return (
    <section id={sectionId("sec-domains", idPrefix)} className="page-break">
      <div className="section-head">
        <h2>{sectionTitle(density === "detailed" ? "05" : "04", density === "detailed" ? "六大方向分析" : "六大方向")}</h2>
        <div className="section-note">健康、学习进修、事业、财运、人际、婚姻</div>
      </div>
      <InsightStrip
        items={[
          { label: "风险分布", value: riskSummary, tone: "gold" },
          { label: "阅读重点", value: "先看中高风险，再看行动建议", tone: "cyan" },
          { label: "边界", value: "专业事项不由命盘替代", tone: "red" }
        ]}
      />
      <div className="card">
        {DOMAIN_ITEMS.map(([key, label], index) => {
          const domain = analysis.domains[key];
          return (
            <div className="domain-block" key={key}>
              <div className="domain-title">
                <h3>{subTitle(`${density === "detailed" ? "5" : "4"}-${index + 1}`, label)}</h3>
                <span className={`risk-badge ${riskClass(domain.riskLevel)}`}>风险等级：{riskLabel(domain.riskLevel)}</span>
                <MetricBar label="关注度" value={riskValue(domain.riskLevel)} tone={domain.riskLevel === "high" ? "red" : domain.riskLevel === "medium" ? "gold" : "cyan"} />
              </div>
              <div>
                <p>{domain.assessment}</p>
                <p className="small"><span className="field-label">关键阶段：</span>{domain.keyPeriods.join("；")}</p>
                <ul>
                  {domain.advice.slice(0, density === "detailed" ? domain.advice.length : 2).map((item) => (
                    <li key={`${key}-${item}`}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MajorPeriodsSection({
  analysis,
  density,
  currentPeriod,
  idPrefix
}: Pick<ReportProps, "analysis" | "density"> & { currentPeriod?: MajorPeriodAnalysis } & SectionIdProps) {
  const periods = density === "detailed" ? analysis.majorPeriods : analysis.majorPeriods.slice(0, 8);
  const highImpact = periods.filter((period) => period.impact !== "低").map((period) => `第${period.index}限`).join("、");
  return (
    <section id={sectionId("sec-major", idPrefix)} className="page-break">
      <div className="section-head">
        <h2>{sectionTitle(density === "detailed" ? "06" : "05", `前八个十年阶段${density === "concise" ? "摘要" : ""}（大限）`)}</h2>
        <div className="section-note">按十年看节奏</div>
      </div>
      <InsightStrip
        items={[
          { label: "高关注阶段", value: highImpact || "整体平稳", tone: "gold" },
          { label: "使用方式", value: "按阶段复盘，不作单点定论", tone: "cyan" },
          { label: "原始数据", value: analysis.meta.dataCompleteness === "partial" ? "部分缺失" : "数据完整", tone: analysis.meta.dataCompleteness === "partial" ? "red" : "cyan" }
        ]}
      />
      <div className="grid-2">
        {periods.map((period) => {
          const isCurrent = currentPeriod && currentPeriod.index === period.index;
          return (
            <div className={`card${isCurrent ? " is-current" : ""}`} key={period.index}>
              <h3>
                {subTitle(`6-${period.index}`, `第 ${period.index} 大限`)}
                {isCurrent ? <span className="mini-status is-current">当前</span> : null}
              </h3>
              <p><EmText text={period.range} /></p>
              <p>{period.theme}</p>
              <div className="tag-row">
                <span className="tag">{period.auspiciousness}</span>
                <span className="tag">影响：{period.impact}</span>
              </div>
              <p style={{ marginTop: 10 }}>{period.analysis}</p>
              {density === "detailed" ? (
                <ul>
                  {period.advice.map((item) => (
                    <li key={`${period.index}-${item}`}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function AnnualSection({
  analysis,
  currentYear,
  idPrefix
}: Pick<ReportProps, "analysis"> & { currentYear: number } & SectionIdProps) {
  const importantAnnuals = keyAnnuals(analysis);
  const importantText = importantAnnuals.slice(0, 6).map((item) => `${item.year}${item.palace}`).join("、");
  return (
    <section id={sectionId("sec-annual", idPrefix)} className="page-break">
      <div className="section-head">
        <h2>{sectionTitle("07", "逐年提示表（流年）")}</h2>
        <div className="section-note">按年份查看重点</div>
      </div>
      <InsightStrip
        items={[
          { label: "正文先看", value: importantText || "无明显高关注年", tone: "gold" },
          { label: "完整表", value: "按大限分组查询", tone: "cyan" },
          { label: "解释边界", value: "年份提示不是事件承诺", tone: "red" }
        ]}
      />
      <div className="card table-card">
        <table className="annual-table">
          <thead>
            <tr>
              <th>年份阶段</th>
              <th>宫位主题</th>
              <th>事件线索</th>
              <th>风险与建议</th>
            </tr>
          </thead>
          <tbody>
            {analysis.annualForecasts.map((item) => {
              const isCurrent = item.year === currentYear;
              return (
                <tr key={`${item.majorPeriodIndex}-${item.year}`} className={isCurrent ? "is-current" : ""}>
                  <td>
                    <strong className="year-main">{item.year}{isCurrent ? "（今年）" : ""}</strong>
                    <div className="small">虚岁 {item.nominalAge ?? "-"} · 第 {item.majorPeriodIndex} 大限</div>
                  </td>
                  <td>
                    <strong className="hl-cyan">{item.palace}</strong>
                    {item.annualPalace ? (
                      <div className="small">流年命宫：{item.annualPalace}{item.annualLifePalaceGanzhi ? ` [${item.annualLifePalaceGanzhi}]` : ""}</div>
                    ) : null}
                    {item.transformations && item.transformations.length > 0 ? (
                      <div className="small">四化：{item.transformations.join("、")}</div>
                    ) : null}
                    <div>{item.theme}</div>
                    <div className="small">{item.auspiciousness} / 影响 {item.impact}</div>
                  </td>
                  <td>
                    {item.events.slice(0, 2).join("；")}
                    {item.evidence && item.evidence.length > 0 ? (
                      <div className="small evidence-line"><span className="field-label">依据：</span>{item.evidence.slice(0, 3).join("；")}</div>
                    ) : null}
                  </td>
                  <td>
                    <div>{item.risks.slice(0, 2).join("；")}</div>
                    <div className="small"><span className="field-label">建议：</span>{item.advice.slice(0, 2).join("；")}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ActionPlanSection({ analysis, density, idPrefix }: Pick<ReportProps, "analysis" | "density"> & SectionIdProps) {
  const items = density === "detailed" ? analysis.actionPlan : analysis.actionPlan.slice(0, 4);
  return (
    <section id={sectionId("sec-action", idPrefix)} className="page-break">
      <div className="section-head">
        <h2>{sectionTitle(density === "detailed" ? "08" : "06", density === "detailed" ? "关键行动建议" : "优先建议")}</h2>
        <div className="section-note">先做什么更合适</div>
      </div>
      <div className="advice-grid">
        {items.map((item, index) => (
          <div className="advice-card" key={item.domain}>
            <h3>{subTitle(`${density === "detailed" ? "8" : "6"}-${index + 1}`, item.domain)}</h3>
            <div className="tag-row">
              <span className="tag">优先级：{item.priority}</span>
            </div>
            <p style={{ marginTop: 10 }}>{item.recommendation}</p>
            <p className="small">{item.reason}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DisclaimerSection({ analysis, density, idPrefix }: Pick<ReportProps, "analysis" | "density"> & SectionIdProps) {
  return (
    <section id={sectionId("sec-disclaimer", idPrefix)} className="page-break">
      <div className="section-head">
        <h2>{sectionTitle(density === "detailed" ? "09" : "07", "免责声明")}</h2>
        <div className="section-note">使用边界</div>
      </div>
      <div className="disclaimer">
        <strong className="hl-red">重要提示：</strong> <EmText text={analysis.disclaimer} />
      </div>
    </section>
  );
}

function Footer({ density, theme }: Pick<ReportProps, "density" | "theme">) {
  const themeLabel = theme === "mystic-dark" ? "玄奥玄色" : "明亮护眼";
  const densityLabel = density === "detailed" ? "详细版" : "省流版";
  return (
    <footer className="footer">
      <div>赛博算卦 / 文墨天机紫微斗数报告生成器 / {densityLabel} / {themeLabel}</div>
      <div>第 <span className="page-number" /> 页</div>
    </footer>
  );
}

function ReportBody({ chart, analysis, theme, density, idPrefix }: ReportProps) {
  const currentYear = new Date().getFullYear();
  const currentPeriod = currentMajorPeriod(chart, analysis, currentYear);
  const currentAnnual = currentYearAnnual(analysis, currentYear);
  const coreSentences = deriveCoreSentences(analysis);

  return (
    <>
      <div className="watermark" aria-hidden="true">紫微命盘参考</div>
      <div className="report-shell">
        <div className="page-frame report">
          <Header chart={chart} analysis={analysis} density={density} currentYear={currentYear} />
          <main>
            <Toc density={density} idPrefix={idPrefix} />
            <ProfileSection
              chart={chart}
              analysis={analysis}
              density={density}
              currentPeriod={currentPeriod}
              coreSentences={coreSentences}
              idPrefix={idPrefix}
            />
            <FocusBanner currentYear={currentYear} currentPeriod={currentPeriod} currentAnnual={currentAnnual} />
            <ScanBoard
              chart={chart}
              analysis={analysis}
              density={density}
              currentYear={currentYear}
              currentPeriod={currentPeriod}
              currentAnnual={currentAnnual}
            />
            {density === "concise" ? <QuickSection analysis={analysis} currentAnnual={currentAnnual} idPrefix={idPrefix} /> : null}
            {density === "detailed" ? <PalacesSection analysis={analysis} density={density} idPrefix={idPrefix} /> : null}
            {density === "detailed" ? <TransformationSection analysis={analysis} idPrefix={idPrefix} /> : null}
            <DomainsSection analysis={analysis} density={density} idPrefix={idPrefix} />
            <MajorPeriodsSection analysis={analysis} density={density} currentPeriod={currentPeriod} idPrefix={idPrefix} />
            {density === "detailed" ? <AnnualSection analysis={analysis} currentYear={currentYear} idPrefix={idPrefix} /> : null}
            <ActionPlanSection analysis={analysis} density={density} idPrefix={idPrefix} />
            <DisclaimerSection analysis={analysis} density={density} idPrefix={idPrefix} />
          </main>
          <Footer density={density} theme={theme} />
        </div>
      </div>
    </>
  );
}

export function Report({ chart, analysis, theme, density }: ReportProps) {
  const styles = buildStyles(theme);
  const bodyClass = `theme-${theme} density-${density}`;

  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{analysis.meta.title}</title>
        <style dangerouslySetInnerHTML={{ __html: styles }} />
      </head>
      <body className={bodyClass}>
        <ReportBody chart={chart} analysis={analysis} theme={theme} density={density} />
      </body>
    </html>
  );
}

export function AggregateReport({ chart, analysis }: Pick<ReportProps, "chart" | "analysis">) {
  const styles = buildAggregateStyles();
  const defaultVariant = REPORT_VARIANTS[0];
  const switchScript = `
(() => {
  const buttons = Array.from(document.querySelectorAll("[data-variant-target]"));
  const views = Array.from(document.querySelectorAll("[data-report-variant]"));
  function activate(key) {
    const activeView = views.find((view) => view.getAttribute("data-report-variant") === key) || views[0];
    const theme = activeView.getAttribute("data-theme") || "mystic-dark";
    const density = activeView.getAttribute("data-density") || "detailed";
    const activeKey = activeView.getAttribute("data-report-variant");
    document.body.className = "aggregate-report theme-" + theme + " density-" + density;
    views.forEach((view) => view.classList.toggle("is-active", view === activeView));
    buttons.forEach((button) => {
      const isActive = button.getAttribute("data-variant-target") === activeKey;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    if (activeKey && window.history && window.location.protocol !== "file:") {
      const url = new URL(window.location.href);
      url.searchParams.set("view", activeKey);
      window.history.replaceState(null, "", url);
    } else if (activeKey && window.location.hash !== "#" + activeKey) {
      window.history.replaceState(null, "", "#" + activeKey);
    }
  }
  buttons.forEach((button) => button.addEventListener("click", () => activate(button.getAttribute("data-variant-target"))));
  const initial = new URLSearchParams(window.location.search).get("view") || location.hash.replace("#", "");
  activate(initial || "${defaultVariant.key}");
})();
`;

  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{analysis.meta.title}</title>
        <style dangerouslySetInnerHTML={{ __html: styles }} />
      </head>
      <body className={`aggregate-report theme-${defaultVariant.theme} density-${defaultVariant.density}`}>
        <nav className="variant-switcher" aria-label="报告版本切换">
          {REPORT_VARIANTS.map((variant) => (
            <button
              type="button"
              className={variant.key === defaultVariant.key ? "is-active" : undefined}
              data-variant-target={variant.key}
              aria-pressed={variant.key === defaultVariant.key}
              key={variant.key}
            >
              {variant.label}
            </button>
          ))}
        </nav>
        {REPORT_VARIANTS.map((variant) => (
          <div
            className={`report-view theme-${variant.theme} density-${variant.density}${variant.key === defaultVariant.key ? " is-active" : ""}`}
            data-report-variant={variant.key}
            data-theme={variant.theme}
            data-density={variant.density}
            key={variant.key}
          >
            <ReportBody chart={chart} analysis={analysis} theme={variant.theme} density={variant.density} idPrefix={variant.key} />
          </div>
        ))}
        <script dangerouslySetInnerHTML={{ __html: switchScript }} />
      </body>
    </html>
  );
}
