export type DataCompleteness = "complete" | "partial";
export type DomainRiskLevel = "low" | "medium" | "high";

export interface StarPlacement {
  name: string;
  states: string[];
  transformations: string[];
  tags: string[];
  raw: string;
}

export interface Palace {
  name: string;
  ganzhi?: string;
  isLifePalace: boolean;
  isBodyPalace: boolean;
  isCausePalace: boolean;
  mainStars: StarPlacement[];
  auxiliaryStars: StarPlacement[];
  minorStars: StarPlacement[];
  shensha: string[];
  decadeRange?: string;
  minorAges: number[];
  flowYears: number[];
  overlapNote?: string;
  warnings: string[];
  rawLines: string[];
}

export interface AnnualFlow {
  year?: number;
  ganzhi?: string;
  nominalAge?: number;
  lifePalaceGanzhi?: string;
  transformations: string[];
  raw: string;
  partial?: boolean;
}

export interface MajorPeriod {
  index: number;
  palaceName?: string;
  palaceGanzhi?: string;
  startYear?: number;
  endYear?: number;
  startNominalAge?: number;
  endNominalAge?: number;
  transformations: string[];
  annuals: AnnualFlow[];
  partial: boolean;
  warnings: string[];
  rawLines: string[];
}

export interface ParsedChartMeta {
  sourceFile?: string;
  apiVersion?: string;
  appVersion?: string;
  anXingCode?: string;
  parserVersion: string;
  warnings: string[];
  dataCompleteness: DataCompleteness;
}

export interface ChartBasicInfo {
  gender?: string;
  geographicLongitude?: string;
  clockTime?: string;
  trueSolarTime?: string;
  lunarTime?: string;
  solarTermFourPillars?: string;
  nonSolarTermFourPillars?: string;
  fiveElementBureau?: string;
  bodyMaster?: string;
  lifeMaster?: string;
  childYearDouJun?: string;
  bodyPalace?: string;
  causePalace?: string;
}

export interface ParsedWenmoChart {
  meta: ParsedChartMeta;
  basicInfo: ChartBasicInfo;
  palaces: Palace[];
  majorPeriods: MajorPeriod[];
}

export interface AnalysisMeta {
  title: string;
  generatedAt: string;
  dataCompleteness: DataCompleteness;
  warnings: string[];
}

export interface AnalysisDomain {
  assessment: string;
  riskLevel: DomainRiskLevel;
  keyPeriods: string[];
  advice: string[];
}

export interface PalaceAnalysis {
  name: string;
  summary: string;
  stars: string[];
  interpretation: string;
  strengths: string[];
  risks: string[];
  advice: string[];
}

export interface MajorPeriodAnalysis {
  index: number;
  range: string;
  theme: string;
  auspiciousness: "吉" | "平" | "凶" | "吉中带凶" | "凶中有解";
  impact: "低" | "中" | "高";
  analysis: string;
  advice: string[];
}

export interface AnnualForecast {
  year: number;
  nominalAge?: number;
  majorPeriodIndex: number;
  palace: string;
  annualPalace?: string;
  annualLifePalaceGanzhi?: string;
  transformations?: string[];
  evidence?: string[];
  theme: string;
  auspiciousness: string;
  impact: string;
  events: string[];
  risks: string[];
  advice: string[];
}

export interface ActionPlanItem {
  domain: string;
  priority: "高" | "中" | "低";
  recommendation: string;
  reason: string;
}

export interface AnalysisResult {
  meta: AnalysisMeta;
  profile: {
    basicInfo: Record<string, string | undefined>;
    corePattern: {
      summary: string;
      keywords: string[];
      strengths: string[];
      risks: string[];
    };
  };
  palaces: PalaceAnalysis[];
  transformations: {
    birthTransformations: string[];
    selfTransformations: string[];
    incomingTransformations: string[];
    flyingNotes: string[];
  };
  domains: {
    health: AnalysisDomain;
    study: AnalysisDomain;
    career: AnalysisDomain;
    wealth: AnalysisDomain;
    relationships: AnalysisDomain;
    marriage: AnalysisDomain;
  };
  majorPeriods: MajorPeriodAnalysis[];
  annualForecasts: AnnualForecast[];
  actionPlan: ActionPlanItem[];
  disclaimer: string;
}
