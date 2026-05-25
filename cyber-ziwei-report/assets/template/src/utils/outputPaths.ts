import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ParsedWenmoChart } from "../types.js";
import { buildReportBaseName, toIsoTimestamp } from "./format.js";

export interface ReportOutputPaths {
  reportBaseName: string;
  outputRoot: string;
  outputDir: string;
  chartPath: string;
  analysisPath: string;
  reportPath: string;
  debugPath: string;
}

export interface LatestOutputPointer {
  reportBaseName: string;
  outputDir: string;
  chartPath: string;
  analysisPath: string;
  reportPath: string;
  generatedAt: string;
}

const LEGACY_ROOT_FILES = new Set([
  "chart.json",
  "analysis.json",
  "analysis-llm-debug.txt",
  "report.html",
  "report-light.html",
  "report-quick.html",
  "report-quick-light.html"
]);

function isInside(parent: string, child: string): boolean {
  const parentResolved = path.resolve(parent);
  const childResolved = path.resolve(child);
  return childResolved === parentResolved || childResolved.startsWith(`${parentResolved}${path.sep}`);
}

export function getOutputRoot(root = process.cwd()): string {
  return path.join(root, "output");
}

export function getLatestPointerPath(root = process.cwd()): string {
  return path.join(getOutputRoot(root), "latest.json");
}

export function buildReportOutputPaths(chart: ParsedWenmoChart, root = process.cwd()): ReportOutputPaths {
  const outputRoot = getOutputRoot(root);
  const reportBaseName = buildReportBaseName(chart);
  const outputDir = path.join(outputRoot, reportBaseName);
  return {
    reportBaseName,
    outputRoot,
    outputDir,
    chartPath: path.join(outputDir, "chart.json"),
    analysisPath: path.join(outputDir, "analysis.json"),
    reportPath: path.join(outputDir, "report.html"),
    debugPath: path.join(outputDir, "analysis-llm-debug.txt")
  };
}

export async function ensureReportOutputDir(paths: ReportOutputPaths): Promise<void> {
  const outputRoot = path.resolve(paths.outputRoot);
  const outputDir = path.resolve(paths.outputDir);
  if (!isInside(outputRoot, outputDir) || outputDir === outputRoot) {
    throw new Error(`拒绝清理异常输出目录：${paths.outputDir}`);
  }
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(paths.outputDir, { recursive: true });
}

export async function writeLatestOutputPointer(paths: ReportOutputPaths, root = process.cwd()): Promise<void> {
  await mkdir(paths.outputRoot, { recursive: true });
  const pointer: LatestOutputPointer = {
    reportBaseName: paths.reportBaseName,
    outputDir: path.relative(root, paths.outputDir),
    chartPath: path.relative(root, paths.chartPath),
    analysisPath: path.relative(root, paths.analysisPath),
    reportPath: path.relative(root, paths.reportPath),
    generatedAt: toIsoTimestamp()
  };
  await writeFile(getLatestPointerPath(root), `${JSON.stringify(pointer, null, 2)}\n`, "utf8");
}

export async function readLatestOutputPointer(root = process.cwd()): Promise<ReportOutputPaths> {
  const pointerPath = getLatestPointerPath(root);
  const pointer = JSON.parse(await readFile(pointerPath, "utf8")) as LatestOutputPointer;
  const outputDir = path.resolve(root, pointer.outputDir);
  const outputRoot = getOutputRoot(root);

  if (!isInside(outputRoot, outputDir)) {
    throw new Error(`latest.json 指向了 output 目录之外的位置：${pointer.outputDir}`);
  }

  return {
    reportBaseName: pointer.reportBaseName,
    outputRoot,
    outputDir,
    chartPath: path.resolve(root, pointer.chartPath),
    analysisPath: path.resolve(root, pointer.analysisPath),
    reportPath: path.resolve(root, pointer.reportPath),
    debugPath: path.join(outputDir, "analysis-llm-debug.txt")
  };
}

export async function cleanupOldReportOutputs(paths: ReportOutputPaths): Promise<void> {
  await mkdir(paths.outputRoot, { recursive: true });
  const outputRoot = path.resolve(paths.outputRoot);
  const keepDir = path.resolve(paths.outputDir);

  for (const entry of await readdir(outputRoot, { withFileTypes: true })) {
    const fullPath = path.resolve(outputRoot, entry.name);
    if (!isInside(outputRoot, fullPath) || fullPath === outputRoot) {
      continue;
    }

    if (entry.isFile()) {
      const isLegacyHtml = /^紫微斗数报告-.+\.html$/u.test(entry.name);
      const isPdf = entry.name.toLowerCase().endsWith(".pdf");
      if (LEGACY_ROOT_FILES.has(entry.name) || isLegacyHtml || isPdf) {
        await rm(fullPath, { force: true });
      }
      continue;
    }

    if (entry.isDirectory() && /^紫微斗数报告-/u.test(entry.name) && fullPath !== keepDir) {
      await rm(fullPath, { recursive: true, force: true });
    }
  }
}
