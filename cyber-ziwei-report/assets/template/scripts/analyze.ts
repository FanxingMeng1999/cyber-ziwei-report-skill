import { readFile } from "node:fs/promises";
import type { ParsedWenmoChart } from "../src/types.js";
import { generateMockAnalysis } from "../src/analysis/mockAnalysis.js";
import { writeJson } from "../src/utils/format.js";
import { readLatestOutputPointer } from "../src/utils/outputPaths.js";

const root = process.cwd();

async function main(): Promise<void> {
  const outputPaths = await readLatestOutputPointer(root);
  const raw = await readFile(outputPaths.chartPath, "utf8");
  const chart = JSON.parse(raw) as ParsedWenmoChart;
  const analysis = generateMockAnalysis(chart);
  await writeJson(outputPaths.analysisPath, analysis);
  console.log(`Analysis saved to ${outputPaths.analysisPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
