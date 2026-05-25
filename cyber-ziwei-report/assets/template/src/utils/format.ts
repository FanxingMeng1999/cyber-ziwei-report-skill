import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ParsedWenmoChart } from "../types.js";

export function toIsoTimestamp(date = new Date()): string {
  return date.toISOString();
}

export function splitList(input: string): string[] {
  return input
    .split(/[，,、/／]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizePalaceName(name?: string): string | undefined {
  if (!name) {
    return undefined;
  }

  const trimmed = name.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.endsWith("宫") ? trimmed : `${trimmed}宫`;
}

export function dedupe<T>(items: T[]): T[] {
  return [...new Set(items)];
}

export function compactText(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

export function parseRange(input: string): [number, number] | undefined {
  const match = input.match(/(\d{1,4})\s*[-~至]\s*(\d{1,4})/);
  if (!match) {
    return undefined;
  }

  return [Number(match[1]), Number(match[2])];
}

export function parseNumbers(input: string): number[] {
  const matches = input.match(/\d{1,4}/g);
  if (!matches) {
    return [];
  }
  return matches.map((item) => Number(item));
}

export function ensureText(value: string | undefined, fallback: string): string {
  return value && value.trim() ? value.trim() : fallback;
}

export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

export async function writeJson(filePath: string, data: unknown): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export function starsToNames(items: { name: string }[]): string[] {
  return items.map((item) => item.name);
}

export function toFileLabel(year?: number, age?: number): string {
  if (!year) {
    return "未标注年份";
  }
  return age ? `${year} / 虚岁${age}` : String(year);
}

function normalizeSolarDate(input?: string): string | undefined {
  const match = input?.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
  if (!match) {
    return undefined;
  }

  const [, year, month, day] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function sanitizeFileSegment(input: string): string {
  return input
    .normalize("NFKC")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .replace(/\s+/g, "")
    .replace(/[，,、；;]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "未标注";
}

export function getBirthDateLabel(chart: ParsedWenmoChart): string {
  return (
    normalizeSolarDate(chart.basicInfo.clockTime) ??
    normalizeSolarDate(chart.basicInfo.trueSolarTime) ??
    chart.basicInfo.lunarTime ??
    "未知出生日期"
  );
}

export function buildReportBaseName(chart: ParsedWenmoChart): string {
  const birthDate = sanitizeFileSegment(getBirthDateLabel(chart));
  const gender = sanitizeFileSegment(chart.basicInfo.gender ?? "未知性别");
  return `紫微斗数报告-${birthDate}-${gender}`;
}
