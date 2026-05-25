import { readFile, writeFile } from "node:fs/promises";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AggregateReport } from "../src/render/Report.js";
import type { AnalysisResult, ParsedWenmoChart } from "../src/types.js";
import { readLatestOutputPointer } from "../src/utils/outputPaths.js";

const root = process.cwd();

async function main(): Promise<void> {
  const outputPaths = await readLatestOutputPointer(root);
  const chart = JSON.parse(await readFile(outputPaths.chartPath, "utf8")) as ParsedWenmoChart;
  const analysis = JSON.parse(await readFile(outputPaths.analysisPath, "utf8")) as AnalysisResult;
  const html =
    "<!doctype html>\n" +
    renderToStaticMarkup(<AggregateReport chart={chart} analysis={analysis} />);
  await writeFile(outputPaths.reportPath, html, "utf8");
  console.log(`HTML report saved to ${outputPaths.reportPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
