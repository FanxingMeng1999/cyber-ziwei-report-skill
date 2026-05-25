# Cyber Ziwei Workflow Reference

## Template Layout

The scaffold lives in `assets/template/` and contains:

- `src/parser/parseWenmoChart.ts`: tolerant parser for 文墨天机 raw text.
- `src/analysis/mockAnalysis.ts`: deterministic rule-based analysis.
- `src/analysis/buildAnalysisPrompt.ts`: prompt reserved for real LLM analysis.
- `src/render/Report.tsx`: React server-side HTML report.
- `src/render/styles.ts`: self-contained dual-theme CSS.
- `src/utils/outputPaths.ts`: per-chart output directory and latest pointer handling.
- `scripts/parse.ts`: parse `input/chart.txt` into latest chart directory.
- `scripts/analyze.ts`: generate `analysis.json`.
- `scripts/render.tsx`: generate aggregate `report.html`.
- `scripts/audit-analysis.ts`, `scripts/audit-report.ts`, `scripts/check.ts`: validation.

## Normal Commands

```bash
npm run parse
npm run analyze
npm run render
npm run build:all
npm run review:all
```

`npm run build:all` executes:

```text
typecheck -> parse -> analyze -> audit:analysis -> render -> audit:report -> check
```

## New Chart Procedure

1. Replace `input/chart.txt` with the new 文墨天机 raw chart.
2. Run `npm run build:all`.
3. Open `output/latest.json` to locate the latest `report.html`.
4. Share only the latest directory's `report.html` when the user wants a single file.

## LLM Hook

Use `npm run analyze:llm` only when the user wants real model analysis and has configured an API key. The script falls back to mock analysis if the model is unavailable or returns invalid JSON.

Expected environment variables:

```bash
OPENAI_API_KEY=...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=...
CYBER_ZIWEI_LLM=1
```

## Common Pitfalls

- Do not write separate standalone `report-light.html` or `report-quick.html`; the aggregate `report.html` contains all views.
- Do not leave old root-level output files in `output/`.
- Do not export PDF by default.
- Do not make medical, investment, legal, or marriage decisions sound certain.
- Do not make annual text generic; use annual transformations and their natal palace evidence.
