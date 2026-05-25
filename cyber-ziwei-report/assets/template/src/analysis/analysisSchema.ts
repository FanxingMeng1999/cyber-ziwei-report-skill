export const ANALYSIS_DISCLAIMER =
  "本报告仅供研究、娱乐和自我反思参考，不能替代医学、法律、投资、婚姻、心理咨询或职业决策。";

export const ANALYSIS_JSON_CONTRACT = {
  meta: {
    title: "赛博算卦紫微斗数命盘分析报告",
    generatedAt: "ISO-8601 datetime",
    dataCompleteness: "complete | partial",
    warnings: ["string"]
  },
  profile: {
    basicInfo: {
      gender: "string",
      lunarTime: "string"
    },
    corePattern: {
      summary: "string",
      keywords: ["string"],
      strengths: ["string"],
      risks: ["string"]
    }
  },
  palaces: [
    {
      name: "命宫",
      summary: "string",
      stars: ["string"],
      interpretation: "string",
      strengths: ["string"],
      risks: ["string"],
      advice: ["string"]
    }
  ],
  transformations: {
    birthTransformations: ["string"],
    selfTransformations: ["string"],
    incomingTransformations: ["string"],
    flyingNotes: ["string"]
  },
  domains: {
    health: {
      assessment: "string",
      riskLevel: "low | medium | high",
      keyPeriods: ["string"],
      advice: ["string"]
    },
    study: {
      assessment: "string",
      riskLevel: "low | medium | high",
      keyPeriods: ["string"],
      advice: ["string"]
    },
    career: {
      assessment: "string",
      riskLevel: "low | medium | high",
      keyPeriods: ["string"],
      advice: ["string"]
    },
    wealth: {
      assessment: "string",
      riskLevel: "low | medium | high",
      keyPeriods: ["string"],
      advice: ["string"]
    },
    relationships: {
      assessment: "string",
      riskLevel: "low | medium | high",
      keyPeriods: ["string"],
      advice: ["string"]
    },
    marriage: {
      assessment: "string",
      riskLevel: "low | medium | high",
      keyPeriods: ["string"],
      advice: ["string"]
    }
  },
  majorPeriods: [
    {
      index: 1,
      range: "1993-2002 / 虚岁3-12",
      theme: "string",
      auspiciousness: "吉 | 平 | 凶 | 吉中带凶 | 凶中有解",
      impact: "低 | 中 | 高",
      analysis: "string",
      advice: ["string"]
    }
  ],
  annualForecasts: [
    {
      year: 2026,
      nominalAge: 37,
      majorPeriodIndex: 4,
      palace: "迁移宫",
      theme: "string",
      auspiciousness: "string",
      impact: "string",
      events: ["string"],
      risks: ["string"],
      advice: ["string"]
    }
  ],
  actionPlan: [
    {
      domain: "事业",
      priority: "高 | 中 | 低",
      recommendation: "string",
      reason: "string"
    }
  ],
  disclaimer: ANALYSIS_DISCLAIMER
} as const;
