import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { parseWenmoChart } from "../src/parser/parseWenmoChart.js";
import { writeJson } from "../src/utils/format.js";
import {
  buildReportOutputPaths,
  cleanupOldReportOutputs,
  ensureReportOutputDir,
  writeLatestOutputPointer
} from "../src/utils/outputPaths.js";

const root = process.cwd();
const inputPath = path.join(root, "input", "chart.txt");

function fail(message: string): never {
  console.error(`[parse] ${message}`);
  process.exit(1);
}

async function main(): Promise<void> {
  try {
    await access(inputPath);
  } catch {
    fail(
      `未找到输入文件：${inputPath}。请将文墨天机命盘原始文本保存为 input/chart.txt 后再运行 npm run parse。`
    );
  }

  const stats = await stat(inputPath);
  if (stats.size === 0) {
    fail(`输入文件为空：${inputPath}。请确认文墨天机命盘文本已正确粘贴。`);
  }

  const text = await readFile(inputPath, "utf8");

  if (text.trim().length === 0) {
    fail(`输入文件只包含空白：${inputPath}。请确认文墨天机命盘文本已正确粘贴。`);
  }

  if (!/(文墨天机|紫微斗数|命宫|十二宫)/.test(text)) {
    console.warn(
      `[parse] 警告：输入文本中未检测到“文墨天机/紫微斗数/命宫/十二宫”等关键词，解析可能不完整。`
    );
  }

  const parsed = parseWenmoChart(text);
  parsed.meta.sourceFile = inputPath;
  const outputPaths = buildReportOutputPaths(parsed, root);
  await cleanupOldReportOutputs(outputPaths);
  await ensureReportOutputDir(outputPaths);

  const palaceCount = parsed.palaces.length;
  const majorCount = parsed.majorPeriods.length;
  const annualCount = parsed.majorPeriods.reduce((sum, period) => sum + period.annuals.length, 0);
  const partialMajors = parsed.majorPeriods.filter((period) => period.partial).length;

  if (palaceCount === 0) {
    fail("解析失败：未识别到任何宫位。请检查输入是否为文墨天机紫微斗数命盘文本。");
  }

  if (palaceCount !== 12) {
    console.warn(`[parse] 警告：仅解析到 ${palaceCount} 个宫位，标准命盘通常应有 12 宫。`);
  }

  if (majorCount === 0) {
    console.warn("[parse] 警告：未识别到任何大限段落，请检查“大限流年信息”章节是否存在。");
  }

  if (partialMajors > 0) {
    console.warn(`[parse] 警告：${partialMajors} 个大限被标记为部分数据（partial: true）。`);
  }

  await writeJson(outputPaths.chartPath, parsed);
  await writeLatestOutputPointer(outputPaths, root);

  console.log("[parse] 解析摘要：");
  console.log(`  - 宫位数量          : ${palaceCount} / 12`);
  console.log(`  - 大限数量          : ${majorCount}`);
  console.log(`  - 流年累计          : ${annualCount}`);
  console.log(`  - 部分数据大限      : ${partialMajors}`);
  console.log(`  - 数据完整情况      : ${parsed.meta.dataCompleteness}`);
  console.log(`  - 全局 warnings 数量: ${parsed.meta.warnings.length}`);
  console.log(`  - 输出目录          : ${outputPaths.outputDir}`);
  console.log(`  - 输出文件          : ${outputPaths.chartPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
