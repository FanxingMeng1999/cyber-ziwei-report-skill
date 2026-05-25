import type {
  ActionPlanItem,
  AnalysisDomain,
  AnalysisResult,
  AnnualForecast,
  MajorPeriodAnalysis,
  Palace,
  ParsedWenmoChart
} from "../types.js";
import { compactText, dedupe, ensureText, starsToNames, toIsoTimestamp } from "../utils/format.js";
import { auspiciousnessFromScore, impactFromScore, riskLevelFromScore, scorePalace } from "../utils/risk.js";
import { ANALYSIS_DISCLAIMER } from "./analysisSchema.js";

const PALACE_FOCUS: Record<string, string> = {
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

const PALACE_REALITY: Record<string, string> = {
  命宫: "适合把个人判断、表达整理和资源协调放在同一条线上推进",
  兄弟宫: "同辈关系中容易一边依赖信息互通，一边需要提前说清边界",
  夫妻宫: "亲密关系更重视情绪照顾、生活节奏和责任分配是否舒服",
  子女宫: "更适合理解为创作、项目孵化、带人带团队或照料责任的压力测试",
  财帛宫: "收入与资产议题适合走稳健经营路线，先看现金流，再看扩张",
  疾厄宫: "不用于判断具体疾病，只提示身心负荷、恢复节律和压力阈值需要被管理",
  迁移宫: "外部机会、对外表达、跨城市或跨领域行动会更容易打开局面",
  交友宫: "合作关系容易经历筛选，分工、账目、交付标准越清楚越稳",
  官禄宫: "适合承担协调、制度接口、项目管理、文书整理或对外沟通类职责",
  田宅宫: "安全感更多来自可沉淀资产、稳定空间和长期秩序",
  福德宫: "精神状态需要靠稳定兴趣、休息节律和可持续生活系统来缓冲",
  父母宫: "制度、资质、长辈或权威关系中，沟通文本和规则确认尤其重要"
};

const PALACE_ACTIONS: Record<string, string[]> = {
  命宫: ["把灵感、人脉和判断写成流程清单，减少只靠临场发挥。", "重要决定先用事实记录验证，再做长期承诺。"],
  兄弟宫: ["合作前写清分工、费用和退出条件，少依赖口头默契。", "遇到反复沟通不顺时，先缩小合作范围。"],
  夫妻宫: ["亲密关系里优先讨论作息、金钱、家务和情绪表达方式。", "冲突发生时先确认事实，再表达感受，减少猜测。"],
  子女宫: ["把创作、项目或照料责任拆成月度节点，避免一次承担过多。", "适合做小规模试点，再决定是否扩大投入。"],
  财帛宫: ["先建立现金流预算和风险上限，再考虑投资、借贷或扩张。", "避免把关系压力和金钱承诺混在一起处理。"],
  疾厄宫: ["把睡眠、运动、体检和压力记录放进固定日程。", "一旦出现持续不适，应优先求助正规医疗，不用盘面替代诊断。"],
  迁移宫: ["对外机会适合用作品、案例和稳定输出承接。", "出行、搬迁、跨界合作前先检查时间、预算和支持系统。"],
  交友宫: ["团队合作先定义交付标准和责任人。", "不适合为了维持关系长期承担不属于自己的成本。"],
  官禄宫: ["职业选择优先看是否能发挥协调、整理、项目推进和对外接口能力。", "适合保留成果档案，便于升职、转岗或谈合作。"],
  田宅宫: ["资产和居住安排以稳健、透明、可承受为先。", "重大合同要让专业人士复核，不靠感觉判断。"],
  福德宫: ["给休息、兴趣和独处留固定位置，避免长期只靠意志硬撑。", "情绪波动明显时，用记录和专业支持帮助校准。"],
  父母宫: ["和制度、资质、长辈有关的事，尽量保留书面记录。", "需要协商时先列清边界和可让步范围。"]
};

const DOMAIN_DETAILS: Record<
  string,
  { label: string; source: string; actions: string[] }
> = {
  健康: {
    label: "身心负荷与恢复节律",
    source: "疾厄宫看身体负荷，福德宫看精神缓冲",
    actions: ["固定体检、睡眠和运动记录，不用盘面替代医疗判断。", "压力连续升高时，先减少高消耗安排，再求助专业意见。"]
  },
  学业: {
    label: "学习、进修与证照能力",
    source: "命宫看学习驱动力，父母宫看制度、资质和规则",
    actions: ["把学习目标改成作品、证照或可交付成果。", "适合结构化笔记、复盘清单和阶段考试，不适合只凭兴趣推进。"]
  },
  事业: {
    label: "职责结构与职业定位",
    source: "官禄宫看职业承担，迁移宫看外部机会，命宫看个人驱动",
    actions: ["优先考虑项目统筹、对外接口、内容整理、制度协同类岗位或角色。", "遇到机会扩张时，先确认职责边界、资源配置和交付周期。"]
  },
  财运: {
    label: "现金流、资产和风险预算",
    source: "财帛宫看收入结构，田宅宫看资产沉淀",
    actions: ["先设现金流安全垫和亏损上限，再处理投资或借贷。", "谨慎处理关系型借贷、冲动消费和超出承受力的扩张。"]
  },
  人际: {
    label: "合作筛选与关系边界",
    source: "交友宫看团队网络，兄弟宫看同辈协作",
    actions: ["合作前写清分工、账目、交付标准和退出条件。", "对反复消耗的关系要降低投入，不把人情当作长期制度。"]
  },
  婚姻: {
    label: "亲密关系与现实责任分配",
    source: "夫妻宫看亲密互动，福德宫看情绪缓冲",
    actions: ["重点讨论金钱、时间、家务、家庭边界和情绪表达。", "遇到长期冲突时，优先使用沟通、咨询和现实协商，不做绝对判断。"]
  }
};

const TRANSFORMATION_MEANING: Record<string, string> = {
  禄: "资源和机会较容易出现，但仍要看能否承接",
  权: "推动力和压力一起上升，适合主动设边界",
  科: "整理、名誉和被看见的机会增加，适合留证据",
  忌: "卡点、执念或消耗感更明显，适合提前缓冲"
};

const TRANSFORMATION_SCORE: Record<string, number> = {
  禄: 2,
  权: 1,
  科: 1,
  忌: -3
};

type TransformationType = "禄" | "权" | "科" | "忌";

interface TransformationHit {
  raw: string;
  star: string;
  type: TransformationType;
  palaceName?: string;
  meaning: string;
}

const TRANSFORMATION_EVENT_HINT: Record<string, Record<string, string>> = {
  禄: {
    命宫: "个人主线容易接住一次新的资源或机会，适合把它落成可重复的方法。",
    兄弟宫: "同辈或合伙人侧出现互助、合作或资源对接的窗口。",
    夫妻宫: "亲密关系中容易出现安抚、改善或共同推进的契机。",
    子女宫: "创作、项目或带人议题更容易拿到外部支持，可借势小步推进。",
    财帛宫: "收入或资源面有正向信号，但仍要先确认结构是否可持续。",
    疾厄宫: "身体或情绪上有缓和窗口，适合调整作息和恢复节奏。",
    迁移宫: "外出、跨界或对外发声更容易打开局面，可主动尝试。",
    交友宫: "新的合作或人脉机会出现，宜先小范围试合作。",
    官禄宫: "工作侧有协调、推进或被看见的机会，适合留下结果证据。",
    田宅宫: "居住、资产或家庭层面出现可稳定经营的契机。",
    福德宫: "兴趣、休息和精神生活有改善空间，适合修复节律。",
    父母宫: "与长辈、制度或资质相关的事情容易顺利推进。"
  },
  权: {
    命宫: "个人议题被推动力放大，要主动安排节奏，避免硬撑。",
    兄弟宫: "同辈互动的张力上升，适合提前划清边界和责任。",
    夫妻宫: "亲密关系里需要更明确的协商节奏，避免单边推进。",
    子女宫: "创作或带人压力上升，把任务拆细并设交付节点更稳。",
    财帛宫: "资金调度和决策强度变大，先看现金流再看扩张。",
    疾厄宫: "身体负荷或情绪强度上升，要预留固定恢复时间。",
    迁移宫: "对外行动节奏加快，行程、合同、对接需要更紧的管理。",
    交友宫: "群体协作中容易承担更多责任，注意不要替别人扛指标。",
    官禄宫: "职责或考核压力上升，更适合用流程和文档建立证据。",
    田宅宫: "家务、资产、装修等议题强度上升，宜分阶段处理。",
    福德宫: "想法和情绪强度都上升，给独处和休息留出固定时间。",
    父母宫: "与权威、制度的沟通需要更主动，但务必保留书面记录。"
  },
  科: {
    命宫: "个人形象、表达和成果整理的机会更明显，适合做积累。",
    兄弟宫: "在同辈圈层里有被看见或被引荐的机会。",
    夫妻宫: "亲密关系里适合做长期承诺、文档化和共同规划。",
    子女宫: "作品、项目或学习产出较容易被外界承认。",
    财帛宫: "财务结构整理、记账、合规等议题适合在这一年做。",
    疾厄宫: "健康档案、复盘和体检的整理收益更明显。",
    迁移宫: "对外形象、品牌、跨地区合作有正向信号。",
    交友宫: "维护人脉、整理通讯、修复关系容易见效。",
    官禄宫: "职位、资历、文书表现容易被认可，可主动留痕。",
    田宅宫: "房产、户口、家庭事务的手续整理较易推进。",
    福德宫: "兴趣、内容、阅读积累更适合系统化整理。",
    父母宫: "考证、资质、证件、家族档案适合在这一年完成。"
  },
  忌: {
    命宫: "个人议题容易卡住、过载，更适合做减法和缓冲。",
    兄弟宫: "同辈或合伙人之间的摩擦增多，需提前约定退出条款。",
    夫妻宫: "亲密关系容易出现冷暖切换，沟通要更慢、更明确。",
    子女宫: "创作或带人议题容易反复、推不动，宜降低同时承担量。",
    财帛宫: "资金安排易遇到意外支出或卡点，要预留缓冲池。",
    疾厄宫: "身心负荷信号较强，避免长期通宵和过载安排。",
    迁移宫: "外出、对外行动容易出现摩擦或延误，要预留备用方案。",
    交友宫: "人际中可能出现误会或断舍离，先减少高消耗关系。",
    官禄宫: "职场易遇到沟通卡点、流程延误或职责越界。",
    田宅宫: "居住、家庭事务容易出现意外开支或修整需求。",
    福德宫: "情绪起伏较大，需要主动建立修复和倾诉渠道。",
    父母宫: "与长辈、制度的沟通需要耐心，遇到障碍优先求助专业。"
  }
};

const STAR_LIBRARY: Record<
  string,
  { summary: string; strengths: string[]; risks: string[]; keywords: string[] }
> = {
  紫微: {
    summary: "重视秩序、统筹和全局定位，适合承担中枢协调角色。",
    strengths: ["统筹力", "格局感", "决策节奏"],
    risks: ["自我标准偏高", "在资源不足时容易背压过重"],
    keywords: ["统筹", "组织", "方向感"]
  },
  天府: {
    summary: "偏向稳定经营和资源整合，做事讲究留有余地。",
    strengths: ["资源管理", "稳定性", "兑现能力"],
    risks: ["过度求稳", "对变化适应偏慢"],
    keywords: ["稳定", "积累", "管理"]
  },
  天机: {
    summary: "反应快、善于拆解问题，适合动态环境和策略调整。",
    strengths: ["学习速度", "分析能力", "机动性"],
    risks: ["想法过多", "切换频繁导致消耗"],
    keywords: ["思考", "变通", "学习"]
  },
  太阳: {
    summary: "重视表达、影响力和外部可见度，愿意对外承担。",
    strengths: ["公开表达", "带动能力", "行动热度"],
    risks: ["透支精力", "在低支持环境下波动明显"],
    keywords: ["表达", "行动", "影响力"]
  },
  太阴: {
    summary: "偏向细腻观察、长期积累和隐性资源经营。",
    strengths: ["审美与细节", "耐心沉淀", "柔性协调"],
    risks: ["犹豫", "情绪受环境影响较大"],
    keywords: ["细致", "耐心", "积累"]
  },
  武曲: {
    summary: "执行和财务感较强，更看重结果、效率和边界。",
    strengths: ["执行力", "资源调度", "结果导向"],
    risks: ["表达偏硬", "关系处理可能过于直接"],
    keywords: ["执行", "效率", "财务"]
  },
  天同: {
    summary: "倾向缓和、包容和留白，适合做关系润滑与体验优化。",
    strengths: ["亲和力", "适应性", "舒缓能力"],
    risks: ["拖延", "遇到冲突时回避"],
    keywords: ["亲和", "包容", "放松"]
  },
  廉贞: {
    summary: "重视原则与辨识度，适合处理复杂规则和角色转换。",
    strengths: ["原则感", "识别问题", "角色切换"],
    risks: ["张力偏强", "容易对人事敏感"],
    keywords: ["原则", "边界", "分辨"]
  },
  天相: {
    summary: "强调平衡、公允和接口协同，常扮演协调位。",
    strengths: ["协同能力", "判断分寸", "制度适配"],
    risks: ["顾虑较多", "在多方拉扯下决策变慢"],
    keywords: ["协调", "平衡", "秩序"]
  },
  天梁: {
    summary: "重视保护、修正和经验积累，常带有顾问或兜底气质。",
    strengths: ["稳定支持", "修正能力", "长期判断"],
    risks: ["替别人承担过多", "不易彻底放松"],
    keywords: ["保护", "经验", "修正"]
  },
  七杀: {
    summary: "面对变化更敢推进，适合高压和高不确定环境。",
    strengths: ["突破力", "临场判断", "应急速度"],
    risks: ["过冲", "风险暴露偏高"],
    keywords: ["果断", "突破", "应变"]
  },
  破军: {
    summary: "适合改造、重组和清理低效结构，但过程波动较大。",
    strengths: ["改革动力", "去旧能力", "勇于重置"],
    risks: ["折腾成本", "节奏不稳"],
    keywords: ["改造", "重整", "变化"]
  },
  贪狼: {
    summary: "对资源、人脉和体验有较强感知，扩张性明显。",
    strengths: ["社交触达", "机会识别", "审美表达"],
    risks: ["分心", "欲望管理压力"],
    keywords: ["资源", "人脉", "体验"]
  },
  巨门: {
    summary: "擅长辨析与质疑，适合做信息校验和复杂沟通。",
    strengths: ["辨析能力", "问题意识", "语言组织"],
    risks: ["多虑", "沟通误差被放大"],
    keywords: ["分析", "提问", "表达"]
  },
  左辅: {
    summary: "辅助资源较好，容易得到合作与配合。",
    strengths: ["辅助资源", "团队支持", "执行配合"],
    risks: ["过度依赖默契", "边界不清"],
    keywords: ["支持", "协作", "帮助"]
  },
  右弼: {
    summary: "柔性支持与人和感较强，适合润滑关系。",
    strengths: ["缓冲摩擦", "人际调和", "善后能力"],
    risks: ["不好拒绝", "背后承担较多"],
    keywords: ["缓和", "配合", "善后"]
  },
  文昌: {
    summary: "学习、整理和表达能力较突出，适合文书与结构化工作。",
    strengths: ["表达能力", "结构整理", "学习迁移"],
    risks: ["对细节过度执着", "对错误较敏感"],
    keywords: ["表达", "结构", "学习"]
  },
  文曲: {
    summary: "审美、理解与柔性表达较强，更重细部节奏。",
    strengths: ["审美感", "理解力", "柔性表达"],
    risks: ["情绪卷入", "决策易受氛围影响"],
    keywords: ["审美", "润色", "体察"]
  }
};

function describeStars(palace: Palace): string[] {
  return dedupe([
    ...starsToNames(palace.mainStars),
    ...starsToNames(palace.auxiliaryStars),
    ...starsToNames(palace.minorStars)
  ]);
}

function collectNarrative(name: string): { strengths: string[]; risks: string[]; keywords: string[]; summary: string[] } {
  const star = STAR_LIBRARY[name];
  if (!star) {
    return {
      strengths: [],
      risks: [],
      keywords: [],
      summary: []
    };
  }

  return {
    strengths: star.strengths,
    risks: star.risks,
    keywords: star.keywords,
    summary: [star.summary]
  };
}

function palaceAdvice(name: string, score: number): string[] {
  const focus = PALACE_FOCUS[name] ?? "对应生活分区";
  const base = PALACE_ACTIONS[name]
    ? [...PALACE_ACTIONS[name]]
    : [
        `围绕${focus}建立可跟踪的阶段目标，用事实记录代替单次情绪判断。`,
        `遇到明显波动时，优先复盘触发条件、资源边界和时间分配，而不是把结果理解为固定结论。`
      ];

  if (score <= -3) {
    base.unshift(`这一宫位的起伏信号偏强，适合提前做缓冲方案，尤其是预算、节奏和沟通预案。`);
  } else if (score >= 5) {
    base.unshift(`这一宫位的资源利用空间较好，适合把优势沉淀成流程、作品集或长期合作。`);
  }

  return base;
}

function buildPalaceAnalysis(palace: Palace) {
  const starNames = describeStars(palace);
  const narratives = starNames.map((name) => collectNarrative(name));
  const score = scorePalace(palace);
  const focus = PALACE_FOCUS[palace.name] ?? "该主题";
  const strengths = dedupe(narratives.flatMap((item) => item.strengths)).slice(0, 4);
  const risks = dedupe(narratives.flatMap((item) => item.risks)).slice(0, 4);
  const starLogic = narratives
    .flatMap((item) => item.summary)
    .slice(0, 3)
    .join("");
  const reality = PALACE_REALITY[palace.name] ?? "需要结合个人经历和外部条件交叉验证";
  const interpretation = compactText(
    `依据：${palace.name}聚焦${focus}，${starNames.slice(0, 4).join("、") || "未见明确主星"}共同构成主要线索。${starLogic}表现：${reality}。${
      score >= 0
        ? "整体属于可经营、可优化的结构，重点在于把优势做成稳定机制。"
        : "整体更像高敏感区，遇到外界变动时需要更早设置边界和备选路径。"
    }`
  );

  return {
    name: palace.name,
    summary: `${palace.name}主轴是${focus}；当前星曜组合呈现${score >= 0 ? "可用资源较多" : "波动较敏感"}的结构。`,
    stars: starNames,
    interpretation,
    strengths:
      strengths.length > 0 ? strengths : ["需要结合完整盘势与现实经历交叉验证，暂不宜单点放大解释。"],
    risks:
      risks.length > 0 ? risks : ["暂未见明显单点风险信号，但仍需结合大限与流年变化观察波动来源。"],
    advice: palaceAdvice(palace.name, score)
  };
}

function findPalace(chart: ParsedWenmoChart, name: string): Palace | undefined {
  return chart.palaces.find((palace) => palace.name === name);
}

function findPalaceByGanzhi(chart: ParsedWenmoChart, ganzhi?: string): Palace | undefined {
  if (!ganzhi) {
    return undefined;
  }
  return chart.palaces.find((palace) => palace.ganzhi === ganzhi);
}

function findStarPalace(chart: ParsedWenmoChart, starName: string): Palace | undefined {
  return chart.palaces.find((palace) =>
    [...palace.mainStars, ...palace.auxiliaryStars, ...palace.minorStars].some((star) => star.name === starName)
  );
}

function transformationType(tag: string): TransformationType | undefined {
  return tag.match(/(禄|权|科|忌)$/)?.[1] as TransformationType | undefined;
}

function transformationStar(tag: string): string {
  return tag
    .replace(/[↑↓]/g, "")
    .replace(/^生年/, "")
    .replace(/[禄权科忌]$/, "")
    .trim();
}

function describeTransformationHits(chart: ParsedWenmoChart, tags: string[]): TransformationHit[] {
  return tags
    .map((raw): TransformationHit | undefined => {
      const type = transformationType(raw);
      const star = transformationStar(raw);
      if (!type || !star) {
        return undefined;
      }
      const palace = findStarPalace(chart, star);
      return {
        raw,
        star,
        type,
        palaceName: palace?.name,
        meaning: TRANSFORMATION_MEANING[type]
      };
    })
    .filter((item): item is TransformationHit => Boolean(item));
}

function transformationEvidence(chart: ParsedWenmoChart, tags: string[]): string[] {
  return describeTransformationHits(chart, tags).map((hit) =>
    `${hit.raw}：${hit.star}在${hit.palaceName ?? "本盘未定位宫位"}，提示${hit.meaning}`
  );
}

function buildDomain(
  chart: ParsedWenmoChart,
  label: string,
  palaceNames: string[],
  extraAdvice: string
): AnalysisDomain {
  const palaces = palaceNames
    .map((name) => findPalace(chart, name))
    .filter((item): item is Palace => Boolean(item));
  const score = palaces.reduce((sum, palace) => sum + scorePalace(palace), 0);
  const keyPeriods = chart.majorPeriods
    .filter((period) => palaceNames.includes(period.palaceName ?? ""))
    .slice(0, 3)
    .map((period) => {
      const range = [period.startYear, period.endYear].filter(Boolean).join("-");
      const age = [period.startNominalAge, period.endNominalAge].filter(Boolean).join("-");
      return compactText(`第${period.index}大限 ${range}${age ? ` / 虚岁${age}` : ""}`);
    });
  const detail = DOMAIN_DETAILS[label];
  const sourceText = detail?.source ?? `主要参考${palaceNames.join("、")}`;
  const labelText = detail?.label ?? label;
  const actions = detail?.actions ?? [extraAdvice];

  return {
    assessment: compactText(
      `${labelText}主要参考：${sourceText}。当前组合更接近${
        score >= 4 ? "稳步推进" : score <= -3 ? "容易起伏" : "中性波动"
      }。这不是结果预言，而是提醒这一领域更适合提前管理哪些变量。`
    ),
    riskLevel: riskLevelFromScore(score),
    keyPeriods: keyPeriods.length > 0 ? keyPeriods : ["当前样本未给出足够的大限映射，建议结合后续完整流年继续补充。"],
    advice: dedupe([
      ...actions,
      extraAdvice,
      "涉及医疗、投资、法律、婚姻等高代价决策时，应以专业意见和真实数据为主。"
    ]).slice(0, 4)
  };
}

function buildCorePattern(chart: ParsedWenmoChart) {
  const lifePalace = findPalace(chart, "命宫");
  const bodyPalace = chart.basicInfo.bodyPalace ? findPalace(chart, chart.basicInfo.bodyPalace) : undefined;
  const combinedStars = dedupe([
    ...(lifePalace ? describeStars(lifePalace) : []),
    ...(bodyPalace ? describeStars(bodyPalace) : [])
  ]);
  const narratives = combinedStars.map((name) => collectNarrative(name));
  const lifeScore = lifePalace ? scorePalace(lifePalace) : 0;

  return {
    summary: compactText(
      `核心格局先看${ensureText(combinedStars.slice(0, 3).join("、"), "多星并见")}。这个盘的主线在于：用统筹、表达和资源协调推动局面，同时要管理精力透支、边界不清和过度承担。命宫整体${
        lifeScore >= 0 ? "较容易经营" : "对外界变化更敏感"
      }；${
        bodyPalace
          ? bodyPalace.name === lifePalace?.name
            ? `命身同宫，实际行动与自我判断都集中在${PALACE_FOCUS[bodyPalace.name]}。`
            : `身宫落在${bodyPalace.name}，说明实际行动常会更多落到${PALACE_FOCUS[bodyPalace.name]}。`
          : "当前样本未明确身宫落点，因此实际重心仍要结合现实经历判断。"
      }`
    ),
    keywords: dedupe(narratives.flatMap((item) => item.keywords)).slice(0, 8),
    strengths: dedupe(narratives.flatMap((item) => item.strengths)).slice(0, 6),
    risks: dedupe(narratives.flatMap((item) => item.risks)).slice(0, 6)
  };
}

function buildTransformations(chart: ParsedWenmoChart) {
  const allTags = chart.palaces.flatMap((palace) =>
    [...palace.mainStars, ...palace.auxiliaryStars, ...palace.minorStars].flatMap((star) => star.transformations)
  );
  const birthTransformations = dedupe(allTags.filter((item) => item.startsWith("生年")));
  const selfTransformations = dedupe(allTags.filter((item) => item.startsWith("↑")));
  const incomingTransformations = dedupe(allTags.filter((item) => item.startsWith("↓")));
  const flyingNotes = dedupe([
    "四化可以先按白话理解：禄偏资源机会，权偏推动压力，科偏整理名誉，忌偏卡点消耗。",
    birthTransformations.length > 0 ? `先天变化以${birthTransformations.join("、")}为主，更适合放到长期节奏里理解。` : "",
    selfTransformations.length > 0 ? `主动变化信号包括${selfTransformations.join("、")}，常表示自己会主动调整方向或做法。` : "",
    incomingTransformations.length > 0 ? `外界触发的变化信号包括${incomingTransformations.join("、")}，更要结合当时环境来看。` : ""
  ]).filter(Boolean);

  return {
    birthTransformations,
    selfTransformations,
    incomingTransformations,
    flyingNotes:
      flyingNotes.length > 0
        ? flyingNotes
        : ["当前样本可见的变化标签较少，后续若接入更完整分析，可再结合全盘一起看。"]
  };
}

function buildMajorPeriods(chart: ParsedWenmoChart): MajorPeriodAnalysis[] {
  return chart.majorPeriods.slice(0, 8).map((period) => {
    const palace = period.palaceName ? findPalace(chart, period.palaceName) : undefined;
    const score = palace ? scorePalace(palace) : 0;
    const range = compactText(
      `${period.startYear ?? "?"}-${period.endYear ?? "?"} / 虚岁${period.startNominalAge ?? "?"}-${period.endNominalAge ?? "?"}`
    );
    const palaceFocus = PALACE_FOCUS[period.palaceName ?? "命宫"] ?? "阶段结构调整";
    const palaceReality = PALACE_REALITY[period.palaceName ?? ""] ?? "需要结合当时真实环境和个人选择理解";
    const periodTags = period.transformations.length > 0
      ? `大限四化为 ${period.transformations.join("、")}，`
      : "";
    const periodEvidence = transformationEvidence(chart, period.transformations);
    const evidenceText = periodEvidence.length > 0
      ? `四化落点可先看：${periodEvidence.slice(0, 4).join("；")}。`
      : "";

    return {
      index: period.index,
      range,
      theme: `${period.palaceName ?? "对应宫位"}主导的十年主题，重心落在${palaceFocus}。`,
      auspiciousness: auspiciousnessFromScore(score),
      impact: impactFromScore(score),
      analysis: compactText(
        `现实表现：${palaceReality}。${periodTags}${evidenceText}这一阶段重点看资源能否跟上目标，以及关系、职责是否匹配。${
          period.partial
            ? "原始数据存在截断，部分年份只能按区间大致参考或暂不展开。"
            : "如果现实经历与盘面提示不一致，应优先相信真实经历和外部条件。"
        }`
      ),
      advice: [
        `把${period.palaceName ?? "该阶段"}对应议题拆成 2 到 3 个可验证阶段，避免只凭一时感受下结论。`,
        ...(period.palaceName && PALACE_ACTIONS[period.palaceName] ? PALACE_ACTIONS[period.palaceName].slice(0, 1) : []),
        `重点留意${period.palaceName ?? "该阶段"}所对应领域的资源配置与关系边界。`
      ]
    };
  });
}

function pureTransformationTags(tags: string[]): string[] {
  return tags
    .map((tag) => transformationType(tag))
    .filter((tag): tag is TransformationType => Boolean(tag));
}

function annualScoreShift(tags: string[]): number {
  return pureTransformationTags(tags).reduce((acc, tag) => acc + (TRANSFORMATION_SCORE[tag] ?? 0), 0);
}

function annualAuspiciousness(combinedScore: number, tags: string[]): string {
  const pure = pureTransformationTags(tags);
  const hasJi = pure.includes("忌");
  const hasLu = pure.includes("禄");
  if (hasJi && hasLu) {
    return "吉中带凶";
  }
  if (combinedScore >= 5) {
    return "吉";
  }
  if (combinedScore >= 1) {
    return "吉中带凶";
  }
  if (combinedScore >= -2) {
    return "平";
  }
  if (combinedScore >= -5) {
    return "凶中有解";
  }
  return "凶";
}

function annualImpact(combinedScore: number, tags: string[]): string {
  const pure = pureTransformationTags(tags);
  if (pure.includes("忌") && combinedScore <= -2) {
    return "高";
  }
  if (Math.abs(combinedScore) >= 6) {
    return "高";
  }
  if (Math.abs(combinedScore) >= 2 || pure.length >= 2) {
    return "中";
  }
  return "低";
}

function buildAnnualEvents(
  chart: ParsedWenmoChart,
  palaceName: string,
  annualPalaceName: string | undefined,
  year: number,
  tags: string[]
): string[] {
  const palaceReality = PALACE_REALITY[palaceName] ?? PALACE_FOCUS[palaceName] ?? "阶段性议题";
  const annualFocus = annualPalaceName ? PALACE_FOCUS[annualPalaceName] : undefined;
  const hits = describeTransformationHits(chart, tags);
  const pure = pureTransformationTags(tags);
  if (pure.length === 0) {
    return [`${year}年延续${palaceName}的主线，${annualPalaceName ? `流年命宫落${annualPalaceName}，` : ""}重点是${palaceReality}。`];
  }

  const hitHints = hits
    .slice(0, 3)
    .map((hit) => `${hit.raw}触发${hit.palaceName ?? "未定位宫位"}，提示${hit.meaning}。`);
  const fallbackHints = pure
    .map((tag) => TRANSFORMATION_EVENT_HINT[tag]?.[annualPalaceName ?? palaceName] ?? `${tag}意味着${TRANSFORMATION_MEANING[tag] ?? "需要结合现实验证的变化点"}。`)
    .filter(Boolean);
  return [
    `${year}年以${palaceName}大限为底，${annualPalaceName ? `流年命宫落${annualPalaceName}，先看${annualFocus}。` : `关注${palaceReality}。`}`,
    ...(hitHints.length > 0 ? hitHints : fallbackHints)
  ];
}

function buildAnnualRisks(
  chart: ParsedWenmoChart,
  palaceName: string,
  annualPalaceName: string | undefined,
  tags: string[]
): string[] {
  const pure = pureTransformationTags(tags);
  const hits = describeTransformationHits(chart, tags);
  const risks: string[] = [];
  const jiHit = hits.find((hit) => hit.type === "忌");
  if (jiHit) {
    risks.push(`${jiHit.raw}落在${jiHit.palaceName ?? "未定位宫位"}，对应议题容易出现卡点或消耗，需要预留时间与资源缓冲。`);
  } else if (pure.includes("忌")) {
    risks.push(`${annualPalaceName ?? palaceName}对应议题容易出现卡点或意外开支，需要预留时间与资源缓冲。`);
  }
  if (pure.includes("权")) {
    risks.push("推动力与压力同时上升，避免承担超出现实可控范围的指标。");
  }
  if (risks.length === 0) {
    risks.push("避免把单年起伏误读成长期定论，正向信号也要先验证再投入。");
  }
  risks.push("健康、合同、财务和重大关系类决策，应以专业意见和真实数据为主，不依赖盘面。");
  return risks.slice(0, 3);
}

function buildAnnualAdvice(palaceName: string, annualPalaceName: string | undefined, tags: string[]): string[] {
  const pure = pureTransformationTags(tags);
  const actionPalace = annualPalaceName ?? palaceName;
  const advice: string[] = [];
  if (pure.includes("禄") || pure.includes("科")) {
    advice.push(`把${actionPalace}相关的机会拆成可复盘的小步骤，留下文档、案例或记录。`);
  }
  if (pure.includes("权")) {
    advice.push("提前规划交付节点和恢复时间，避免长时间高压连续运转。");
  }
  if (pure.includes("忌")) {
    advice.push("先做减法和缓冲：减少同时进行的高强度任务，遇到障碍优先求助专业。");
  }
  if (advice.length === 0) {
    advice.push("按季度记录关键变化、投入与结果，形成年度复盘证据链。");
  }
  advice.push("把机会判断与风险缓冲同时准备，避免把积极信号理解为无需验证。");
  return advice.slice(0, 3);
}

function buildAnnualForecasts(chart: ParsedWenmoChart): AnnualForecast[] {
  return chart.majorPeriods.slice(0, 8).flatMap((period) => {
    const palaceName = period.palaceName ?? "未标注宫位";
    const palace = period.palaceName ? findPalace(chart, period.palaceName) : undefined;
    const baseScore = palace ? scorePalace(palace) : 0;

    return period.annuals
      .filter((annual): annual is typeof annual & { year: number } => typeof annual.year === "number")
      .map((annual) => {
        const tags = annual.transformations;
        const annualPalace = findPalaceByGanzhi(chart, annual.lifePalaceGanzhi);
        const annualPalaceName = annualPalace?.name;
        const evidence = transformationEvidence(chart, tags);
        const shift = annualScoreShift(tags);
        const combined = baseScore + shift;
        const auspiciousness = annualAuspiciousness(combined, tags);
        const impact = annualImpact(combined, tags);

        return {
          year: annual.year,
          nominalAge: annual.nominalAge,
          majorPeriodIndex: period.index,
          palace: palaceName,
          annualPalace: annualPalaceName,
          annualLifePalaceGanzhi: annual.lifePalaceGanzhi,
          transformations: tags,
          evidence: [
            `大限主宫：${palaceName}`,
            annualPalaceName ? `流年命宫：${annualPalaceName}${annual.lifePalaceGanzhi ? `[${annual.lifePalaceGanzhi}]` : ""}` : "",
            ...evidence
          ].filter(Boolean),
          theme: tags.length > 0
            ? `${palaceName}大限主线，流年命宫${annualPalaceName ? `落${annualPalaceName}` : "未定位"}；流年四化为 ${tags.join("、")}。`
            : `${palaceName}主线延续，${PALACE_REALITY[palaceName] ?? "需要结合现实经历观察"}。`,
          auspiciousness,
          impact,
          events: buildAnnualEvents(chart, palaceName, annualPalaceName, annual.year, tags),
          risks: buildAnnualRisks(chart, palaceName, annualPalaceName, tags),
          advice: buildAnnualAdvice(palaceName, annualPalaceName, tags)
        };
      });
  });
}

function buildActionPlan(result: AnalysisResult): ActionPlanItem[] {
  const domainEntries: Array<[string, AnalysisDomain]> = [
    ["健康", result.domains.health],
    ["学业", result.domains.study],
    ["事业", result.domains.career],
    ["财运", result.domains.wealth],
    ["人际", result.domains.relationships],
    ["婚姻", result.domains.marriage]
  ];

  return domainEntries.map(([label, domain]) => ({
    domain: label,
    priority: domain.riskLevel === "high" ? "高" : domain.riskLevel === "medium" ? "中" : "低",
    recommendation: domain.advice[0] ?? `围绕${label}建立下一阶段的观察与复盘节奏。`,
    reason: domain.assessment
  }));
}

export function generateMockAnalysis(chart: ParsedWenmoChart): AnalysisResult {
  const palaces = chart.palaces.map((palace) => buildPalaceAnalysis(palace));
  const result: AnalysisResult = {
    meta: {
      title: "赛博算卦紫微斗数命盘分析报告",
      generatedAt: toIsoTimestamp(),
      dataCompleteness: chart.meta.dataCompleteness,
      warnings: dedupe([...chart.meta.warnings, ...chart.majorPeriods.flatMap((item) => item.warnings)]).slice(0, 50)
    },
    profile: {
      basicInfo: {
        gender: chart.basicInfo.gender,
        clockTime: chart.basicInfo.clockTime,
        trueSolarTime: chart.basicInfo.trueSolarTime,
        lunarTime: chart.basicInfo.lunarTime,
        solarTermFourPillars: chart.basicInfo.solarTermFourPillars,
        nonSolarTermFourPillars: chart.basicInfo.nonSolarTermFourPillars,
        fiveElementBureau: chart.basicInfo.fiveElementBureau,
        lifeMaster: chart.basicInfo.lifeMaster,
        bodyMaster: chart.basicInfo.bodyMaster,
        childYearDouJun: chart.basicInfo.childYearDouJun,
        bodyPalace: chart.basicInfo.bodyPalace
      },
      corePattern: buildCorePattern(chart)
    },
    palaces,
    transformations: buildTransformations(chart),
    domains: {
      health: buildDomain(chart, "健康", ["疾厄宫", "福德宫"], "注意作息、体检、压力源管理与恢复节律的长期一致性。"),
      study: buildDomain(chart, "学业", ["命宫", "父母宫"], "适合把学习目标拆成阶段作品或考试节点，减少空转。"),
      career: buildDomain(chart, "事业", ["官禄宫", "迁移宫", "命宫"], "优先看岗位职责是否与强项匹配，再决定是否扩张。"),
      wealth: buildDomain(chart, "财运", ["财帛宫", "田宅宫"], "涉及投资与借贷时，应先看现金流和风险承受力，不宜只参考盘面。"),
      relationships: buildDomain(chart, "人际", ["交友宫", "兄弟宫"], "合作前先定义边界、分工与退出条件，能显著降低摩擦成本。"),
      marriage: buildDomain(chart, "婚姻", ["夫妻宫", "福德宫"], "关系议题宜重视沟通质量、价值观对齐和现实责任分配。")
    },
    majorPeriods: [],
    annualForecasts: [],
    actionPlan: [],
    disclaimer: ANALYSIS_DISCLAIMER
  };

  result.majorPeriods = buildMajorPeriods(chart);
  result.annualForecasts = buildAnnualForecasts(chart);
  result.actionPlan = buildActionPlan(result);
  return result;
}
