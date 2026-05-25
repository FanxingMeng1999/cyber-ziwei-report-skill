import type { Palace, StarPlacement } from "../types.js";

const POSITIVE_TAGS = new Map<string, number>([
  ["庙", 3],
  ["旺", 2],
  ["得", 1],
  ["利", 1],
  ["生年禄", 2],
  ["生年权", 1],
  ["生年科", 2],
  ["↑禄", 1],
  ["↑权", 1],
  ["↑科", 1]
]);

const NEGATIVE_TAGS = new Map<string, number>([
  ["陷", -3],
  ["平", 0],
  ["生年忌", -3],
  ["↓忌", -2],
  ["↓权", -1],
  ["↓科", -1],
  ["↓禄", -1]
]);

const NEGATIVE_STARS = new Set(["擎羊", "陀罗", "火星", "铃星", "地空", "地劫"]);
const POSITIVE_STARS = new Set(["紫微", "天府", "天相", "天梁", "左辅", "右弼", "文昌", "文曲", "禄存"]);

function scoreStar(star: StarPlacement): number {
  let score = 0;

  for (const tag of [...star.states, ...star.transformations, ...star.tags]) {
    score += POSITIVE_TAGS.get(tag) ?? 0;
    score += NEGATIVE_TAGS.get(tag) ?? 0;
  }

  if (NEGATIVE_STARS.has(star.name)) {
    score -= 2;
  }

  if (POSITIVE_STARS.has(star.name)) {
    score += 1;
  }

  return score;
}

export function scorePalace(palace: Palace): number {
  const stars = [...palace.mainStars, ...palace.auxiliaryStars, ...palace.minorStars];
  return stars.reduce((sum, star) => sum + scoreStar(star), 0);
}

export function riskLevelFromScore(score: number): "low" | "medium" | "high" {
  if (score >= 5) {
    return "low";
  }
  if (score <= -3) {
    return "high";
  }
  return "medium";
}

export function auspiciousnessFromScore(
  score: number
): "吉" | "平" | "凶" | "吉中带凶" | "凶中有解" {
  if (score >= 7) {
    return "吉";
  }
  if (score >= 2) {
    return "吉中带凶";
  }
  if (score >= -2) {
    return "平";
  }
  if (score >= -6) {
    return "凶中有解";
  }
  return "凶";
}

export function impactFromScore(score: number): "低" | "中" | "高" {
  if (Math.abs(score) >= 8) {
    return "高";
  }
  if (Math.abs(score) >= 3) {
    return "中";
  }
  return "低";
}
