import type {
  AnnualFlow,
  MajorPeriod,
  Palace,
  ParsedWenmoChart,
  StarPlacement
} from "../types.js";
import { normalizePalaceName, parseNumbers, parseRange, splitList } from "../utils/format.js";

const PARSER_VERSION = "0.1.0";
const PALACE_NAMES = [
  "命宫",
  "兄弟宫",
  "夫妻宫",
  "子女宫",
  "财帛宫",
  "疾厄宫",
  "迁移宫",
  "交友宫",
  "官禄宫",
  "田宅宫",
  "福德宫",
  "父母宫"
] as const;
const STATUS_TAGS = new Set(["旺", "庙", "陷", "平", "得", "利", "不"]);
const TRANSFORMATION_PREFIXES = ["生年", "↑", "↓"];
const GANZHI_RE = /([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])/;

type Section = "root" | "palaces" | "major-periods";

function cleanLine(line: string): string {
  return line.replace(/^\uFEFF/, "").replace(/\r/g, "").trimEnd();
}

function stripTreePrefix(line: string): string {
  return line.replace(/^[\s│┃├└┌┐┘┬┴┼─━·•]+/, "").trim();
}

function splitKeyValue(line: string): [string, string] | undefined {
  const match = line.match(/^([^:：]+)\s*[:：]\s*(.+)$/);
  if (!match) {
    return undefined;
  }
  return [match[1].trim(), match[2].trim()];
}

function normalizeKey(key: string): string {
  return key.replace(/\s+/g, "");
}

function createPalace(name: string): Palace {
  return {
    name,
    isLifePalace: name === "命宫",
    isBodyPalace: false,
    isCausePalace: false,
    mainStars: [],
    auxiliaryStars: [],
    minorStars: [],
    shensha: [],
    minorAges: [],
    flowYears: [],
    warnings: [],
    rawLines: []
  };
}

function createMajorPeriod(index: number): MajorPeriod {
  return {
    index,
    transformations: [],
    annuals: [],
    partial: false,
    warnings: [],
    rawLines: []
  };
}

function classifyTag(tag: string): "state" | "transformation" | "other" {
  if (STATUS_TAGS.has(tag)) {
    return "state";
  }
  if (TRANSFORMATION_PREFIXES.some((prefix) => tag.startsWith(prefix))) {
    return "transformation";
  }
  return "other";
}

function parseStarList(value: string): StarPlacement[] {
  if (value.trim() === "无") {
    return [];
  }

  return splitList(value).map((token) => {
    const tags = [...token.matchAll(/[\[（(【]([^)\]）】]+)[\]）)】]/g)].map((match) => match[1].trim());
    const name = token.replace(/[\[（(【]([^)\]）】]+)[\]）)】]/g, "").trim();
    const star: StarPlacement = {
      name,
      states: [],
      transformations: [],
      tags: [],
      raw: token
    };

    for (const tag of tags) {
      const type = classifyTag(tag);
      if (type === "state") {
        star.states.push(tag);
      } else if (type === "transformation") {
        star.transformations.push(tag);
      } else {
        star.tags.push(tag);
      }
    }

    return star;
  });
}

function setPalaceFlags(palace: Palace, text: string): void {
  if (text.includes("命宫")) {
    palace.isLifePalace = true;
  }
  if (text.includes("身宫")) {
    palace.isBodyPalace = true;
  }
  if (text.includes("来因宫") || text.includes("来因")) {
    palace.isCausePalace = true;
  }
}

function parsePalaceHeader(line: string): { name: string; ganzhi?: string; rest: string } | undefined {
  const compactLine = line.replace(/\s+/g, "");
  const match = compactLine.match(
    /^(命宫|兄弟宫|夫妻宫|子女宫|财帛宫|疾厄宫|迁移宫|交友宫|官禄宫|田宅宫|福德宫|父母宫)(.*)$/
  );
  if (!match) {
    return undefined;
  }

  const rest = match[2]?.trim() ?? "";
  const ganzhi = rest.match(GANZHI_RE)?.[1];
  return { name: match[1], ganzhi, rest };
}

function parseChineseNumber(input: string): number {
  if (/^\d+$/.test(input)) {
    return Number(input);
  }

  const table: Record<string, number> = {
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
    十: 10
  };

  if (input === "十") {
    return 10;
  }
  if (input.startsWith("十")) {
    return 10 + (table[input[1]] ?? 0);
  }
  if (input.endsWith("十")) {
    return (table[input[0]] ?? 0) * 10;
  }
  if (input.includes("十")) {
    const [left, right] = input.split("十");
    return (table[left] ?? 0) * 10 + (table[right] ?? 0);
  }
  return table[input] ?? 0;
}

function parseMajorPeriodHeader(line: string): MajorPeriod | undefined {
  const match = line.match(/^(?:第)?\s*([0-9一二三四五六七八九十]+)\s*大限(.*)$/);
  if (!match) {
    return undefined;
  }

  const major = createMajorPeriod(parseChineseNumber(match[1]));
  const rest = match[2]?.trim() ?? "";
  major.palaceName = rest.match(
    /(命宫|兄弟宫|夫妻宫|子女宫|财帛宫|疾厄宫|迁移宫|交友宫|官禄宫|田宅宫|福德宫|父母宫)/
  )?.[1];
  major.palaceGanzhi = rest.match(GANZHI_RE)?.[1];

  const yearRange = parseRange(rest);
  if (yearRange && yearRange[0] > 1000) {
    major.startYear = yearRange[0];
    major.endYear = yearRange[1];
  }

  const ageMatch = rest.match(/虚岁?\s*(\d{1,3})\s*[-~至]\s*(\d{1,3})/);
  if (ageMatch) {
    major.startNominalAge = Number(ageMatch[1]);
    major.endNominalAge = Number(ageMatch[2]);
  }

  if (/\.\.\.|未完|截断|缺失/.test(rest)) {
    major.partial = true;
  }

  return major;
}

function parseAnnualLine(line: string): AnnualFlow | undefined {
  const yearMatch = line.match(/([12]\d{3})/);
  if (!yearMatch) {
    return undefined;
  }

  const transformationsText = line.match(/流年四化\s*[:：]\s*(.+)$/)?.[1] ?? "";
  const nominalAgeText = line.match(/虚岁?\s*(\d{1,3})/)?.[1] ?? line.match(/(\d{1,3})\s*虚岁/)?.[1];
  const annual: AnnualFlow = {
    year: Number(yearMatch[1]),
    ganzhi: line.match(GANZHI_RE)?.[1],
    nominalAge: nominalAgeText ? Number(nominalAgeText) : undefined,
    lifePalaceGanzhi: line.match(/命宫(?:干支)?\s*[:：]?\s*([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])/)?.[1],
    transformations: transformationsText ? splitList(transformationsText) : [],
    raw: line,
    partial: /\.\.\.|未完|截断|缺失/.test(line)
  };

  if (!annual.nominalAge) {
    const fallbackAge = line.match(/[（(]\s*(\d{1,3})\s*岁?[)）]/)?.[1];
    if (fallbackAge) {
      annual.nominalAge = Number(fallbackAge);
    }
  }

  return annual;
}

function applyMajorRange(value: string, major: MajorPeriod): void {
  const yearAgeMatch = value.match(
    /(\d{4})年?\s*[（(]\s*(\d{1,3})\s*虚岁\s*[)）]\s*[-~至]\s*(\d{4})年?\s*[（(]\s*(\d{1,3})\s*虚岁\s*[)）]/
  );
  if (yearAgeMatch) {
    major.startYear = Number(yearAgeMatch[1]);
    major.startNominalAge = Number(yearAgeMatch[2]);
    major.endYear = Number(yearAgeMatch[3]);
    major.endNominalAge = Number(yearAgeMatch[4]);
    return;
  }

  const years = [...value.matchAll(/([12]\d{3})/g)].map((match) => Number(match[1]));
  if (years.length >= 2) {
    major.startYear = years[0];
    major.endYear = years[1];
  }

  const ages = [...value.matchAll(/(\d{1,3})\s*虚岁/g)].map((match) => Number(match[1]));
  if (ages.length >= 2) {
    major.startNominalAge = ages[0];
    major.endNominalAge = ages[1];
  }
}

function applyRootField(chart: ParsedWenmoChart, warnings: string[], key: string, value: string): void {
  switch (normalizeKey(key)) {
    case "备注":
      break;
    case "API版本":
      chart.meta.apiVersion = value;
      break;
    case "App版本":
      chart.meta.appVersion = value;
      break;
    case "安星码":
      chart.meta.anXingCode = value;
      break;
    case "性别":
      chart.basicInfo.gender = value;
      break;
    case "地理经度":
      chart.basicInfo.geographicLongitude = value;
      break;
    case "钟表时间":
      chart.basicInfo.clockTime = value;
      break;
    case "真太阳时":
      chart.basicInfo.trueSolarTime = value;
      break;
    case "农历时间":
      chart.basicInfo.lunarTime = value;
      break;
    case "节气四柱":
      chart.basicInfo.solarTermFourPillars = value;
      break;
    case "非节气四柱":
      chart.basicInfo.nonSolarTermFourPillars = value;
      break;
    case "五行局数":
      chart.basicInfo.fiveElementBureau = value;
      break;
    case "身主":
      chart.basicInfo.bodyMaster = value;
      break;
    case "命主":
      chart.basicInfo.lifeMaster = value;
      break;
    case "子年斗君":
      chart.basicInfo.childYearDouJun = value;
      break;
    case "身宫":
      chart.basicInfo.bodyPalace = normalizePalaceName(value);
      break;
    case "来因宫":
      chart.basicInfo.causePalace = normalizePalaceName(value);
      break;
    default:
      warnings.push(`未解析根字段 ${key}: ${value}`);
      break;
  }
}

function findPalaceByReference(chart: ParsedWenmoChart, reference?: string): Palace | undefined {
  if (!reference) {
    return undefined;
  }

  const normalized = normalizePalaceName(reference);
  const exact = chart.palaces.find((palace) => palace.name === normalized || palace.ganzhi === reference);
  if (exact) {
    return exact;
  }

  const branch = reference.match(/[子丑寅卯辰巳午未申酉戌亥]/)?.[0];
  if (branch) {
    return chart.palaces.find((palace) => palace.ganzhi?.endsWith(branch));
  }

  return undefined;
}

function finalizeMajorPeriod(major?: MajorPeriod): MajorPeriod | undefined {
  if (!major) {
    return undefined;
  }

  if (major.startYear && major.endYear && major.annuals.length > 0) {
    const expected = major.endYear - major.startYear + 1;
    if (expected !== major.annuals.length) {
      major.partial = true;
      major.warnings.push(`第${major.index}大限流年数为${major.annuals.length}，与区间推测的${expected}年不一致。`);
    }
  }

  if (major.rawLines.length > 0 && major.annuals.length === 0) {
    major.partial = true;
    major.warnings.push(`第${major.index}大限缺少可识别流年。`);
  }

  return major;
}

export function parseWenmoChart(text: string): ParsedWenmoChart {
  const warnings: string[] = [];
  const chart: ParsedWenmoChart = {
    meta: {
      parserVersion: PARSER_VERSION,
      warnings,
      dataCompleteness: "complete"
    },
    basicInfo: {},
    palaces: [],
    majorPeriods: []
  };

  const lines = text
    .split("\n")
    .map((line) => cleanLine(line))
    .filter((line) => line.trim().length > 0);

  let section: Section = "root";
  let currentPalace: Palace | undefined;
  let currentMajorPeriod: MajorPeriod | undefined;

  for (const originalLine of lines) {
    const line = stripTreePrefix(originalLine);
    if (!line) {
      continue;
    }

    if (line.includes("命盘十二宫") || line === "十二宫") {
      section = "palaces";
      continue;
    }

    if (line.includes("大限流年信息")) {
      if (currentPalace) {
        chart.palaces.push(currentPalace);
        currentPalace = undefined;
      }
      section = "major-periods";
      continue;
    }

    if (section === "palaces") {
      const palaceHeader = parsePalaceHeader(line);
      if (palaceHeader) {
        if (currentPalace) {
          chart.palaces.push(currentPalace);
        }
        currentPalace = createPalace(palaceHeader.name);
        currentPalace.ganzhi = palaceHeader.ganzhi;
        setPalaceFlags(currentPalace, palaceHeader.rest);
        currentPalace.rawLines.push(line);
        continue;
      }

      if (!currentPalace) {
        warnings.push(`十二宫段落出现游离行：${line}`);
        continue;
      }

      currentPalace.rawLines.push(line);
      const keyValue = splitKeyValue(line);
      if (!keyValue) {
        currentPalace.warnings.push(`未识别宫位行：${line}`);
        warnings.push(`未识别宫位行：${line}`);
        continue;
      }

      const [key, value] = keyValue;
      switch (normalizeKey(key)) {
        case "标记":
        case "标签":
          setPalaceFlags(currentPalace, value);
          break;
        case "干支":
          currentPalace.ganzhi = value.match(GANZHI_RE)?.[1] ?? value;
          break;
        case "主星":
          currentPalace.mainStars = parseStarList(value);
          break;
        case "辅星":
          currentPalace.auxiliaryStars = parseStarList(value);
          break;
        case "小星":
          currentPalace.minorStars = parseStarList(value);
          break;
        case "岁前星":
        case "将前星":
        case "十二长生":
        case "太岁煞禄":
          currentPalace.shensha.push(`${normalizeKey(key)}:${value}`);
          break;
        case "神煞":
          currentPalace.shensha = splitList(value);
          break;
        case "大限":
          currentPalace.decadeRange = value;
          break;
        case "小限":
          currentPalace.minorAges = parseNumbers(value);
          break;
        case "流年":
          currentPalace.flowYears = parseNumbers(value);
          break;
        case "限流叠宫":
          currentPalace.overlapNote = value;
          break;
        default:
          currentPalace.warnings.push(`未解析字段 ${key}: ${value}`);
          warnings.push(`未解析字段 ${key}: ${value}`);
          break;
      }
      continue;
    }

    if (section === "major-periods") {
      const majorHeader = parseMajorPeriodHeader(line);
      if (majorHeader) {
        const finalized = finalizeMajorPeriod(currentMajorPeriod);
        if (finalized) {
          chart.majorPeriods.push(finalized);
        }
        currentMajorPeriod = majorHeader;
        currentMajorPeriod.rawLines.push(line);
        continue;
      }

      if (!currentMajorPeriod) {
        warnings.push(`大限流年段落出现游离行：${line}`);
        continue;
      }

      currentMajorPeriod.rawLines.push(line);
      const keyValue = splitKeyValue(line);
      if (keyValue) {
        const [key, value] = keyValue;
        switch (normalizeKey(key)) {
          case "备注":
            break;
          case "起止年份":
            applyMajorRange(value, currentMajorPeriod);
            break;
          case "大限宫干支":
            currentMajorPeriod.palaceGanzhi = value.match(GANZHI_RE)?.[1] ?? value;
            break;
          case "大限四化":
            currentMajorPeriod.transformations = splitList(value);
            break;
          case "流年": {
            const annual = parseAnnualLine(value);
            if (annual) {
              currentMajorPeriod.annuals.push(annual);
            } else {
              currentMajorPeriod.partial = true;
              currentMajorPeriod.warnings.push(`未识别流年：${value}`);
              warnings.push(`未识别流年：${value}`);
            }
            break;
          }
          default:
            if (line.match(/([12]\d{3})/)) {
              const annual = parseAnnualLine(line);
              if (annual) {
                currentMajorPeriod.annuals.push(annual);
              }
            } else {
              currentMajorPeriod.warnings.push(`未解析大限字段 ${key}: ${value}`);
              warnings.push(`未解析大限字段 ${key}: ${value}`);
            }
            break;
        }
      } else {
        const annual = parseAnnualLine(line);
        if (annual) {
          currentMajorPeriod.annuals.push(annual);
        } else {
          currentMajorPeriod.partial = true;
          currentMajorPeriod.warnings.push(`未识别大限行：${line}`);
          warnings.push(`未识别大限行：${line}`);
        }
      }
      continue;
    }

    const keyValue = splitKeyValue(line);
    if (!keyValue) {
      if (!/文墨天机|紫微斗数|命盘|排盘/.test(line)) {
        warnings.push(`未解析根字段：${line}`);
      }
      continue;
    }

    const [key, value] = keyValue;
    if (line.includes(";")) {
      for (const segment of line.split(";")) {
        const segmentKeyValue = splitKeyValue(segment.trim());
        if (segmentKeyValue) {
          applyRootField(chart, warnings, segmentKeyValue[0], segmentKeyValue[1]);
        }
      }
    } else {
      applyRootField(chart, warnings, key, value);
    }
  }

  if (currentPalace) {
    chart.palaces.push(currentPalace);
  }

  const finalizedMajor = finalizeMajorPeriod(currentMajorPeriod);
  if (finalizedMajor) {
    chart.majorPeriods.push(finalizedMajor);
  }

  const flaggedBodyPalace = chart.palaces.find((palace) => palace.isBodyPalace)?.name;
  const resolvedBodyPalace = findPalaceByReference(chart, chart.basicInfo.bodyPalace)?.name;
  chart.basicInfo.bodyPalace = resolvedBodyPalace ?? flaggedBodyPalace ?? chart.basicInfo.bodyPalace;

  const flaggedCausePalace = chart.palaces.find((palace) => palace.isCausePalace)?.name;
  const resolvedCausePalace = findPalaceByReference(chart, chart.basicInfo.causePalace)?.name;
  chart.basicInfo.causePalace = resolvedCausePalace ?? flaggedCausePalace ?? chart.basicInfo.causePalace;

  for (const palace of chart.palaces) {
    if (chart.basicInfo.bodyPalace && palace.name === chart.basicInfo.bodyPalace) {
      palace.isBodyPalace = true;
    }
    if (chart.basicInfo.causePalace && palace.name === chart.basicInfo.causePalace) {
      palace.isCausePalace = true;
    }
  }

  for (const major of chart.majorPeriods) {
    if (!major.palaceName && major.palaceGanzhi) {
      major.palaceName = chart.palaces.find((palace) => palace.ganzhi === major.palaceGanzhi)?.name;
    }
  }

  if (chart.palaces.length !== PALACE_NAMES.length) {
    warnings.push(`当前仅解析到 ${chart.palaces.length} 个宫位，标准命盘通常应为 12 宫。`);
  }

  if (chart.majorPeriods.some((item) => item.partial)) {
    chart.meta.dataCompleteness = "partial";
  }

  return chart;
}
