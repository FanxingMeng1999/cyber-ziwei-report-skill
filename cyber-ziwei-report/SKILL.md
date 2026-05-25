---
name: cyber-ziwei-report
description: Build or maintain a local Node.js TypeScript workflow that turns 文墨天机紫微斗数 chart text into a self-contained cyber-style HTML report. Use when the user asks to generate, package, improve, audit, or rerun a Zi Wei Dou Shu report from input/chart.txt, wants a shareable single-file report.html, or needs the current workflow scaffold copied into another repo.
---

# Cyber Ziwei Report

Use this skill to create or operate the local “赛博算卦 / 文墨天机紫微斗数报告生成器” workflow.

## Default Workflow

1. If the current repo already contains `src/parser/parseWenmoChart.ts`, `scripts/build-all.ts`, and `src/render/Report.tsx`, treat it as an existing workflow and edit in place.
2. If the repo does not contain the workflow, copy `assets/template/` into the current workspace root. Do not copy any generated `output` from another project.
3. Put the 文墨天机 raw chart into `input/chart.txt`.
4. Run:

```bash
npm install
npm run build:all
```

5. Deliver the latest report at `output/<紫微斗数报告-出生日期-性别>/report.html`.

The template is HTML-only. Do not reintroduce PDF export unless the user explicitly asks for it.

## Output Rules

- Each chart must get its own output directory: `output/紫微斗数报告-出生日期-性别/`.
- The directory should contain only:
  - `chart.json`
  - `analysis.json`
  - `report.html`
- `output/latest.json` points to the newest report directory.
- Clean old root-level artifacts such as `output/report.html`, `output/chart.json`, `output/report-light.html`, and any `.pdf`.
- `report.html` is the shareable file. It embeds the four views:
  - 详细版 / 玄奥玄色
  - 详细版 / 明亮护眼
  - 省流版 / 玄奥玄色
  - 省流版 / 明亮护眼

## Quality Bar

Preserve these guarantees:

- Parser tolerates 文墨天机 tree symbols such as `│ ├ └`.
- Missing longitude, clock time, or true solar time must not fail parsing.
- Twelve palaces and first eight major periods are parsed when present.
- Body palace and cause palace must be resolved to palace names, not only branch labels.
- Annual forecasts should include major-period palace, annual life palace, transformations, and evidence.
- Report language should be Chinese-first, clear, and not overloaded with English or unexplained jargon.
- The report must include the standard disclaimer that it is only for research, entertainment, and self-reflection, and cannot replace medical, legal, investment, marriage, psychological, or career decisions.
- Avoid absolute, frightening, deterministic, medical, legal, investment, or marriage directives.

## Verification

After any code or workflow change, run:

```bash
npm run build:all
npm run review:all
```

Also inspect `output/latest.json` and the latest output directory. If the user only asks to generate a new report and code did not change, `npm run build:all` is enough.

## References

For implementation details and expected structure, read `references/workflow.md` only when needed.
