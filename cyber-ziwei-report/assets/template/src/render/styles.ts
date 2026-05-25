export type ReportTheme = "mystic-dark" | "gentle-light";

function themeVars(theme: ReportTheme): string {
  if (theme === "gentle-light") {
    return `
    --bg: oklch(0.975 0.012 92);
    --bg-soft: oklch(0.992 0.006 95);
    --surface: oklch(0.988 0.008 92);
    --surface-2: oklch(0.95 0.016 88);
    --text: oklch(0.34 0.018 255);
    --text-muted: oklch(0.48 0.014 245);
    --gold: oklch(0.66 0.085 72);
    --cyan: oklch(0.61 0.055 220);
    --vermillion: oklch(0.63 0.09 32);
    --line: color-mix(in oklch, var(--cyan) 18%, var(--surface) 82%);
    --line-strong: color-mix(in oklch, var(--gold) 26%, var(--surface) 74%);
    --shadow: 0 22px 60px color-mix(in oklch, var(--text) 10%, transparent);
    --page-bg:
      radial-gradient(circle at 85% 10%, color-mix(in oklch, var(--cyan) 10%, transparent), transparent 22%),
      radial-gradient(circle at 12% 14%, color-mix(in oklch, var(--gold) 8%, transparent), transparent 18%),
      linear-gradient(180deg, oklch(0.992 0.008 95) 0%, oklch(0.974 0.013 92) 60%, oklch(0.958 0.018 90) 100%);
    --frame-bg: color-mix(in oklch, white 84%, var(--surface) 16%);
    --hero-bg:
      linear-gradient(135deg, color-mix(in oklch, var(--cyan) 8%, transparent), transparent 42%),
      linear-gradient(180deg, color-mix(in oklch, var(--gold) 5%, var(--surface) 95%), transparent);
    --bg-panel: color-mix(in oklch, white 90%, var(--surface-2) 10%);
    --bg-panel-strong: color-mix(in oklch, white 95%, var(--surface-2) 5%);
    --tag-bg: color-mix(in oklch, var(--cyan) 7%, white 93%);
    --tag-border: color-mix(in oklch, var(--cyan) 18%, white 82%);
    --table-stripe: color-mix(in oklch, var(--cyan) 4%, white 96%);
    --disclaimer-bg: color-mix(in oklch, var(--vermillion) 8%, white 92%);
    --disclaimer-text: oklch(0.49 0.05 28);
    --watermark: color-mix(in oklch, var(--gold) 9%, transparent);
    --focus-bg: color-mix(in oklch, var(--gold) 8%, white 92%);
    --focus-border: color-mix(in oklch, var(--gold) 26%, white 74%);
    --evidence-bg: color-mix(in oklch, var(--cyan) 7%, white 93%);
    --boundary-bg: color-mix(in oklch, var(--vermillion) 6%, white 94%);
    --current-row-bg: color-mix(in oklch, var(--gold) 12%, white 88%);
    --print-bg: oklch(0.987 0.008 92);
    --print-frame-bg: white;
    `;
  }

  return `
  --bg: oklch(0.16 0.022 280);
  --bg-soft: oklch(0.2 0.024 278);
  --surface: oklch(0.22 0.024 279);
  --surface-2: oklch(0.26 0.026 276);
  --text: oklch(0.93 0.012 275);
  --text-muted: oklch(0.8 0.015 270);
  --gold: oklch(0.78 0.1 76);
  --cyan: oklch(0.82 0.07 220);
  --vermillion: oklch(0.7 0.1 30);
  --line: color-mix(in oklch, var(--cyan) 18%, var(--surface) 82%);
  --line-strong: color-mix(in oklch, var(--gold) 28%, var(--surface) 72%);
  --shadow: 0 24px 60px color-mix(in oklch, black 50%, transparent);
  --page-bg:
    radial-gradient(circle at 84% 10%, color-mix(in oklch, var(--cyan) 12%, transparent), transparent 22%),
    radial-gradient(circle at 14% 18%, color-mix(in oklch, var(--gold) 8%, transparent), transparent 20%),
    linear-gradient(180deg, oklch(0.17 0.024 280) 0%, oklch(0.14 0.02 281) 60%, oklch(0.13 0.022 290) 100%);
  --frame-bg: color-mix(in oklch, black 6%, var(--surface) 94%);
  --hero-bg:
    linear-gradient(135deg, color-mix(in oklch, var(--cyan) 10%, transparent), transparent 42%),
    linear-gradient(180deg, color-mix(in oklch, var(--gold) 4%, transparent), transparent);
  --bg-panel: color-mix(in oklch, white 4%, var(--surface-2) 96%);
  --bg-panel-strong: color-mix(in oklch, white 8%, var(--surface-2) 92%);
  --tag-bg: color-mix(in oklch, white 4%, var(--surface) 96%);
  --tag-border: color-mix(in oklch, var(--cyan) 18%, transparent);
  --table-stripe: color-mix(in oklch, white 2%, var(--surface) 98%);
  --disclaimer-bg: color-mix(in oklch, var(--vermillion) 12%, transparent);
  --disclaimer-text: oklch(0.88 0.03 28);
  --watermark: color-mix(in oklch, var(--gold) 8%, transparent);
  --focus-bg: color-mix(in oklch, var(--gold) 9%, var(--surface) 91%);
  --focus-border: color-mix(in oklch, var(--gold) 36%, var(--surface) 64%);
  --evidence-bg: color-mix(in oklch, var(--cyan) 7%, var(--surface) 93%);
  --boundary-bg: color-mix(in oklch, var(--vermillion) 8%, var(--surface) 92%);
  --current-row-bg: color-mix(in oklch, var(--gold) 12%, var(--surface) 88%);
  --print-bg: oklch(0.165 0.022 280);
  --print-frame-bg: var(--surface);
  `;
}

export function buildStyles(theme: ReportTheme): string {
  return `
:root {
  ${themeVars(theme)}
  --page-width: 794px;
  --content-width: 66ch;
  --content-width-narrow: 52ch;
  --radius: 10px;
  --space-1: 8px;
  --space-2: 12px;
  --space-3: 16px;
  --space-4: 22px;
  --space-5: 32px;
  --accent-1: var(--gold);
  --accent-2: var(--cyan);
  --accent-3: var(--vermillion);
}

* {
  box-sizing: border-box;
}

html {
  background: var(--bg);
}

body {
  margin: 0;
  color: var(--text);
  background: var(--page-bg);
  font-family: "Noto Sans CJK SC", "Source Han Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 11.1pt;
  line-height: 1.78;
}

.report-shell {
  position: relative;
  width: min(var(--page-width), calc(100vw - 32px));
  margin: 0 auto;
  padding: 28px 0 56px;
}

.watermark {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 64px;
  letter-spacing: 6px;
  color: var(--watermark);
  transform: rotate(-16deg);
  pointer-events: none;
  z-index: 0;
  opacity: 0.34;
}

.report {
  position: relative;
  z-index: 1;
}

.page-frame {
  position: relative;
  border: 1px solid var(--line-strong);
  background: var(--frame-bg);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.page-frame::before {
  content: "";
  position: absolute;
  inset: 14px;
  border: 1px solid var(--line);
  pointer-events: none;
}

header.hero {
  padding: 46px 48px 34px;
  border-bottom: 1px solid var(--line);
  background: var(--hero-bg);
}

.eyebrow {
  color: var(--cyan);
  font-size: 10pt;
  letter-spacing: 0.08em;
  margin-bottom: 10px;
}

h1, h2, h3, h4 {
  margin: 0;
  font-family: "Noto Serif CJK SC", "Source Han Serif SC", "Songti SC", "SimSun", serif;
  font-weight: 600;
  letter-spacing: 0;
  text-wrap: balance;
}

h1 {
  color: var(--gold);
  font-size: 26pt;
  line-height: 1.25;
  max-inline-size: 18ch;
}

.subtitle {
  margin-top: 12px;
  max-inline-size: 60ch;
  color: var(--text-muted);
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 26px;
}

.meta-card,
.card,
.advice-card,
.warning-card,
.quick-tile,
.scan-panel,
.focus-banner,
.current-year-card {
  background: var(--bg-panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
}

.meta-card {
  padding: 12px 14px;
}

.meta-label {
  font-size: 9.5pt;
  color: var(--text-muted);
}

.meta-value {
  margin-top: 4px;
  color: var(--text);
  font-size: 11pt;
}

main {
  padding: 26px 40px 40px;
}

section {
  margin-top: 26px;
  break-inside: avoid;
  scroll-margin-top: 86px;
}

section.page-break {
  page-break-before: always;
  break-before: page;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--line);
}

.section-head h2 {
  color: var(--gold);
  font-size: 17pt;
  max-inline-size: 22ch;
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-note {
  color: var(--cyan);
  font-size: 9.3pt;
}

.section-index,
.sub-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid var(--line-strong);
  background: color-mix(in oklch, var(--gold) 6%, var(--bg-panel) 94%);
  color: var(--gold);
  font-family: "Noto Sans CJK SC", "Source Han Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 10pt;
  font-weight: 700;
}

.sub-index {
  min-width: 26px;
  height: 26px;
  font-size: 9pt;
  color: var(--cyan);
  border-color: var(--line);
  background: color-mix(in oklch, var(--cyan) 7%, var(--bg-panel) 93%);
}

.toc-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 24px;
  padding: 0;
  margin: 16px 0 0;
  list-style: none;
}

.toc-item {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  border-bottom: 1px dashed var(--line);
  padding-bottom: 6px;
}

.toc-link {
  color: var(--text);
  text-decoration: none;
}

.grid-2,
.grid-3,
.grid-4 {
  display: grid;
  gap: 14px;
}

.grid-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.grid-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.grid-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.card,
.quick-tile {
  padding: 18px 18px 16px;
}

.card h3,
.quick-tile h3 {
  font-size: 13.5pt;
  color: var(--cyan);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.tag,
.risk-badge {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid var(--tag-border);
  background: var(--tag-bg);
  font-size: 9.5pt;
  color: var(--text);
}

.highlight {
  font-weight: 700;
}

.hl-gold {
  color: var(--accent-1);
}

.hl-cyan {
  color: var(--accent-2);
}

.hl-red {
  color: var(--accent-3);
}

.tone-strong {
  font-weight: 700;
  color: var(--text);
}

.risk-low {
  border-color: color-mix(in oklch, var(--cyan) 38%, transparent);
  color: color-mix(in oklch, var(--cyan) 78%, var(--text) 22%);
}

.risk-medium {
  border-color: color-mix(in oklch, var(--gold) 36%, transparent);
  color: color-mix(in oklch, var(--gold) 72%, var(--text) 28%);
}

.risk-high {
  border-color: color-mix(in oklch, var(--vermillion) 38%, transparent);
  color: color-mix(in oklch, var(--vermillion) 76%, var(--text) 24%);
}

.statement-box {
  margin: 14px 0 12px;
  padding: 12px 14px;
  border-left: 3px solid var(--gold);
  border-radius: 0 var(--radius) var(--radius) 0;
  background: color-mix(in oklch, var(--gold) 6%, var(--bg-panel) 94%);
}

.statement-box strong {
  color: var(--gold);
}

.statement-box ol {
  margin: 8px 0 0;
  padding-left: 20px;
}

.statement-box li {
  margin-bottom: 4px;
}

.boundary-note {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  margin-top: 14px;
  padding: 12px 14px;
  border: 1px solid color-mix(in oklch, var(--vermillion) 24%, transparent);
  border-radius: var(--radius);
  background: var(--boundary-bg);
}

.boundary-note strong {
  color: var(--vermillion);
}

.boundary-note span {
  color: var(--text);
}

.insight-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin: 14px 0;
}

.insight-chip {
  display: grid;
  gap: 4px;
  min-height: 64px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--bg-panel);
}

.insight-chip span {
  color: var(--text-muted);
  font-size: 9pt;
}

.insight-chip strong {
  color: var(--text);
  font-size: 10.2pt;
}

.tone-gold strong,
.tone-gold .metric-top strong {
  color: var(--gold);
}

.tone-cyan strong,
.tone-cyan .metric-top strong {
  color: var(--cyan);
}

.tone-red strong,
.tone-red .metric-top strong {
  color: var(--vermillion);
}

.focus-banner {
  position: relative;
  margin: 18px 0;
  padding: 18px 20px;
  border: 1px solid var(--focus-border);
  background: var(--focus-bg);
  border-radius: var(--radius);
  break-inside: avoid;
}

.focus-eyebrow {
  font-size: 9pt;
  letter-spacing: 0.08em;
  color: var(--cyan);
  text-transform: none;
}

.focus-headline {
  margin-top: 4px;
  font-family: "Noto Serif CJK SC", "Source Han Serif SC", "Songti SC", "SimSun", serif;
  font-size: 15pt;
  color: var(--gold);
  font-weight: 700;
}

.focus-banner p {
  margin: 8px 0 0;
  max-inline-size: 60ch;
}

.focus-tags {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.current-year-card {
  margin-bottom: 14px;
  padding: 16px 18px;
  border-color: var(--focus-border);
  background: var(--focus-bg);
}

.card-eyebrow {
  font-size: 9pt;
  letter-spacing: 0.06em;
  color: var(--cyan);
  margin-bottom: 6px;
}

.current-year-card .lead {
  color: var(--gold);
  font-weight: 600;
  margin: 0;
}

.current-year-card ul {
  margin-top: 8px;
  margin-bottom: 0;
}

.scan-board {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
  break-inside: avoid;
}

.scan-panel {
  padding: 16px;
}

.scan-panel h3 {
  margin-bottom: 10px;
  color: var(--cyan);
  display: flex;
  align-items: center;
  gap: 8px;
}

.metric-line {
  margin-top: 10px;
}

.metric-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 9.6pt;
  color: var(--text-muted);
}

.metric-track {
  height: 7px;
  margin-top: 5px;
  overflow: hidden;
  border-radius: 999px;
  background: color-mix(in oklch, var(--text-muted) 14%, transparent);
}

.metric-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--cyan);
}

.tone-gold .metric-track span {
  background: var(--gold);
}

.tone-red .metric-track span {
  background: var(--vermillion);
}

.mini-rank {
  display: grid;
  gap: 8px;
}

.rank-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 7px;
  border-bottom: 1px dashed var(--line);
}

.rank-row strong {
  color: var(--gold);
  white-space: nowrap;
}

.year-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.year-pill {
  display: grid;
  gap: 2px;
  min-width: 94px;
  padding: 7px 9px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: color-mix(in oklch, var(--cyan) 5%, var(--bg-panel) 95%);
}

.year-pill strong {
  color: var(--gold);
}

.year-pill small {
  color: var(--text-muted);
}

.year-pill.is-current {
  border-color: var(--focus-border);
  background: var(--current-row-bg);
}

.mini-status {
  color: var(--text-muted);
  font-family: "Noto Sans CJK SC", "Source Han Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 9.2pt;
  white-space: nowrap;
}

.mini-status.is-current {
  color: var(--gold);
  font-weight: 700;
}

.structured-lines {
  display: grid;
  gap: 8px;
  margin-top: 6px;
}

.structured-lines p {
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 10px;
  margin: 0;
}

.structured-lines b,
.field-label {
  color: var(--cyan);
  font-weight: 700;
}

.annual-table .year-main {
  color: var(--gold);
  font-size: 12pt;
}

.table-card {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.annual-table {
  min-width: 720px;
}

.evidence-line {
  margin-top: 8px;
  padding-top: 7px;
  border-top: 1px dashed var(--line);
}

.annual-table th:nth-child(1),
.annual-table td:nth-child(1) {
  width: 16%;
}

.annual-table th:nth-child(2),
.annual-table td:nth-child(2) {
  width: 28%;
}

tr.is-current {
  background: var(--current-row-bg);
}

tr.is-current td {
  border-color: var(--focus-border);
}

.palace-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.palace-card h3 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.key-points {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0 0;
}

.key-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--bg-panel);
  font-size: 9.4pt;
  color: var(--text);
}

.key-chip b {
  color: var(--gold);
}

.evidence-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.evidence-card {
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--evidence-bg);
}

.evidence-card b {
  color: var(--gold);
}

.domain-block {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 14px;
  align-items: start;
  padding: 16px 0;
  border-top: 1px solid var(--line);
}

.domain-block:first-of-type {
  border-top: none;
  padding-top: 0;
}

.domain-title h3 {
  font-size: 13pt;
  color: var(--cyan);
}

.advice-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.advice-card {
  padding: 14px;
}

.quick-summary {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 16px;
}

.quick-list {
  margin: 0;
  padding-left: 18px;
}

.quick-pillars {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.quick-tile {
  min-height: 100%;
}

.card.is-current {
  border-color: var(--focus-border);
  background: var(--focus-bg);
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
  font-size: 9.6pt;
}

thead {
  display: table-header-group;
}

th, td {
  padding: 9px 10px;
  vertical-align: top;
  border: 1px solid var(--line);
}

th {
  text-align: left;
  color: var(--gold);
  background: color-mix(in oklch, var(--gold) 5%, var(--bg-panel) 95%);
}

tbody tr:nth-child(odd) {
  background: var(--table-stripe);
}

tbody tr.is-current {
  background: var(--current-row-bg);
}

.warning-card {
  padding: 14px 16px;
  border-color: color-mix(in oklch, var(--vermillion) 28%, transparent);
  color: var(--text);
}

.disclaimer {
  margin-top: 26px;
  padding: 16px 18px;
  border: 1px solid color-mix(in oklch, var(--vermillion) 36%, transparent);
  border-radius: var(--radius);
  background: var(--disclaimer-bg);
  color: var(--disclaimer-text);
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
  padding: 16px 40px 24px;
  color: color-mix(in oklch, var(--text) 58%, transparent);
  font-size: 9pt;
  border-top: 1px solid var(--line);
}

.page-number::after {
  content: "网页版";
}

.small {
  font-size: 9.5pt;
  color: var(--text-muted);
}

.lead {
  font-size: 11.3pt;
  max-inline-size: var(--content-width);
}

p,
li,
.meta-value,
.meta-label,
.small,
td,
th {
  overflow-wrap: break-word;
}

.card p,
.card li,
.advice-card p,
.advice-card li,
.warning-card li,
.warning-card p,
.quick-tile p,
.disclaimer,
td > div,
td li {
  max-inline-size: var(--content-width);
}

td > ul,
.card ul,
.advice-card ul,
.warning-card ul {
  max-inline-size: var(--content-width-narrow);
}

.subtitle,
.card > p:first-of-type,
.quick-list,
.disclaimer {
  text-wrap: pretty;
}

@page {
  size: A4;
  margin: 14mm 12mm 16mm;
}

@media print {
  html,
  body {
    width: 210mm;
    background: var(--print-bg);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body {
    background: var(--print-bg);
  }

  /* 打印时去掉重背景和大水印，避免浏览器打印过重 */
  .watermark {
    display: none !important;
  }

  .page-frame {
    border: 1px solid var(--line-strong);
    box-shadow: none;
    background: var(--print-frame-bg);
  }

  .page-frame::before {
    display: none;
  }

  header.hero {
    background: var(--print-frame-bg);
    border-bottom: 1px solid var(--line-strong);
  }

  .report-shell {
    width: 100%;
    padding: 0;
  }

  /* 打印时使用更平的面板背景，避免逐页栅格化巨型 gradient */
  .meta-card,
  .card,
  .advice-card,
  .warning-card,
  .quick-tile,
  .scan-panel,
  .focus-banner,
  .current-year-card,
  .boundary-note,
  .evidence-card,
  .insight-chip,
  .year-pill,
  .key-chip {
    background: var(--print-frame-bg);
  }

  .scan-board,
  .focus-banner,
  .current-year-card,
  section,
  .card,
  .advice-card,
  .warning-card,
  .quick-tile,
  .palace-card {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  h2, h3 {
    break-after: avoid;
    page-break-after: avoid;
  }

  table,
  thead {
    page-break-inside: auto;
  }

  tr {
    page-break-inside: avoid;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  .page-number::after {
    content: counter(page);
  }
}

@media (max-width: 900px) {
  .report-shell {
    width: calc(100vw - 20px);
    padding-top: 10px;
  }

  header.hero,
  main,
  .footer {
    padding-left: 20px;
    padding-right: 20px;
  }

  .meta-grid,
  .grid-2,
  .grid-3,
  .grid-4,
  .palace-grid,
  .advice-grid,
  .toc-list,
  .quick-summary,
  .quick-pillars,
  .scan-board,
  .insight-strip,
  .evidence-grid {
    grid-template-columns: 1fr;
  }

  .boundary-note {
    grid-template-columns: 1fr;
  }

  .domain-block {
    grid-template-columns: 1fr;
  }
}
`;
}

export function buildAggregateStyles(): string {
  const scopedDarkStyles = buildStyles("mystic-dark").replace(
    ":root {",
    ":root, body.aggregate-report.theme-mystic-dark, .report-view.theme-mystic-dark {"
  );

  return `${scopedDarkStyles}

body.aggregate-report.theme-gentle-light,
.report-view.theme-gentle-light {
  ${themeVars("gentle-light")}
}

body.aggregate-report {
  min-height: 100vh;
}

.variant-switcher {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  justify-content: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--line-strong);
  background: color-mix(in oklch, var(--bg) 88%, transparent);
  backdrop-filter: blur(10px);
}

.variant-switcher button {
  min-height: 34px;
  padding: 6px 13px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--bg-panel);
  color: var(--text);
  font: inherit;
  font-size: 10pt;
  cursor: pointer;
}

.variant-switcher button.is-active {
  border-color: var(--line-strong);
  color: var(--gold);
  background: color-mix(in oklch, var(--gold) 10%, var(--bg-panel) 90%);
  font-weight: 700;
}

.report-view {
  display: none;
  min-height: 100vh;
  color: var(--text);
  background: var(--page-bg);
}

.report-view.is-active {
  display: block;
}

@media print {
  .variant-switcher {
    display: none !important;
  }

  .report-view {
    display: none !important;
  }

  .report-view.is-active {
    display: block !important;
    background: var(--print-bg);
  }
}

@media (max-width: 900px) {
  .variant-switcher {
    flex-wrap: wrap;
    justify-content: flex-start;
  }
}
`;
}
