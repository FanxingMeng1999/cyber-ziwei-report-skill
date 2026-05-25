# Cyber Ziwei Report Skill

Codex skill for generating a local, self-contained HTML report from raw 文墨天机紫微斗数 chart text.

This repository contains one installable skill:

```text
cyber-ziwei-report/
  SKILL.md
  agents/openai.yaml
  references/workflow.md
  assets/template/
```

## What It Does

- Parses raw 文墨天机 chart text from `input/chart.txt`.
- Produces structured `chart.json` and `analysis.json`.
- Renders a shareable `report.html` with four embedded views:
  - detailed dark theme
  - detailed light theme
  - concise dark theme
  - concise light theme
- Keeps each chart output isolated under `output/<report-name>/`.
- Runs local audits for structure, disclaimer, unsafe phrasing, and report completeness.

The workflow is HTML-only. PDF export is intentionally not included.

## Install Into Codex

Copy the skill folder into your Codex skills directory:

```powershell
Copy-Item -Recurse -Force .\cyber-ziwei-report "$env:USERPROFILE\.codex\skills\cyber-ziwei-report"
```

Then invoke it in Codex:

```text
Use $cyber-ziwei-report to generate a self-contained HTML Zi Wei Dou Shu report from input/chart.txt.
```

## Use The Template Directly

The runnable project template is in `cyber-ziwei-report/assets/template`.

```powershell
Copy-Item -Recurse .\cyber-ziwei-report\assets\template .\my-ziwei-report
Set-Location .\my-ziwei-report
npm install
```

Put raw chart text into:

```text
input/chart.txt
```

Run:

```powershell
npm run build:all
```

Open the generated file indicated by:

```text
output/latest.json
```

## Important Disclaimer

This project is for research, entertainment, and self-reflection. It must not be used as a substitute for medical, legal, investment, marriage, psychological, or career decisions.

## License

MIT
