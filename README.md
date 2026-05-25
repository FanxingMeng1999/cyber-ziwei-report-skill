# 赛博算卦：文墨天机紫微斗数报告生成器 Codex Skill

把一段从 **文墨天机** 复制出来的紫微斗数命盘文本，变成一份 **可本地运行、可分享、带双主题和省流版的中文 HTML 报告**。

这个仓库提供的是一个可安装到 Codex 的 skill，同时也内置了一套完整的 Node.js + TypeScript + React 模板。你可以让 Codex 帮你自动处理命盘文本，也可以直接复制模板项目自己运行。

> 重要提示：本项目生成的术数分析仅供研究、娱乐和自我反思参考，不能替代医学、法律、投资、婚姻、心理咨询或职业决策。

## 它能做什么

很多紫微斗数命盘软件可以排盘，但后续整理报告常常会遇到几个问题：

- 原始命盘文本很长，不适合直接发给别人看。
- 十二宫、大限、流年信息混在一起，阅读成本高。
- 想做成网页报告时，解析、排版、主题、目录、免责声明都要重复劳动。
- 如果接入大模型，缺少稳定的数据结构和审查流程，容易出现夸大、恐吓或不负责任的表达。

本项目解决的是从 **命盘原文到可分享报告** 的完整工作流：

```mermaid
flowchart LR
  A["文墨天机命盘文本"] --> B["解析为 chart.json"]
  B --> C["生成 analysis.json"]
  C --> D["渲染 report.html"]
  D --> E["四合一可分享网页报告"]
```

最终的 `report.html` 是一个自包含网页文件，内置四种阅读模式：

- **玄色详细版**：深色、玄奥、适合正式展示。
- **护眼详细版**：浅色、低疲劳，适合长时间阅读。
- **玄色省流版**：快速抓重点，适合先看结论。
- **护眼省流版**：轻量阅读，适合转发给不想看长文的人。

## 项目亮点

### 1. 面向中文长文报告的排版

报告不是简单把 JSON 转成表格，而是按中文阅读习惯组织内容：

- 顶部有报告锚定信息，快速说明当前大限和当前年份。
- 目录可跳转，长报告不迷路。
- 十二宫、领域分析、大限、流年分区清晰。
- 关键字加粗和着色，减少“满屏都是字”的疲劳感。
- 风险提示使用克制色彩，不制造恐慌。

### 2. 一个 HTML 文件就能分享

生成后的 `report.html` 不依赖 `chart.json` 或 `analysis.json` 才能阅读。  
你只分享这个 HTML 文件，对方也能打开完整报告。

每个命盘会独立输出到自己的文件夹：

```text
output/
  紫微斗数报告-乙亥年正月二十日午时-女/
    chart.json
    analysis.json
    report.html
  latest.json
```

### 3. 不再默认导出 PDF

本项目当前专注 HTML 报告。  
PDF 导出已经被移除，因为复杂网页转 PDF 的视觉质量往往不稳定，也不适合交互式多版本报告。

### 4. 保留真实大模型接入口

默认分析使用规则型生成，便于本地跑通和测试。  
如果你配置了真实模型接口，可以使用预留脚本生成更细致的 `analysis.json`，并继续走同一套渲染和审查流程。

### 5. 有审查脚本，避免危险表达

模板内置基础审查：

- 检查是否有免责声明。
- 检查十二宫和前八个大限是否完整。
- 检查报告是否包含必要章节。
- 扫描绝对化、恐吓式、医疗越界、投资越界等高风险表达。
- 检查年度文案是否过度模板化。

## 适合谁用

这个项目适合：

- 想把文墨天机命盘整理成美观网页报告的人。
- 想批量生成命盘解读交付件的内容创作者。
- 想研究命盘解析、结构化数据和大模型分析流程的开发者。
- 想给 Codex 增加一个稳定命理报告工作流的人。
- 想开一个本地化、不依赖在线页面的术数报告模板的人。

不适合：

- 想用它直接做医学、投资、婚姻、法律判断的人。
- 想得到“百分百准确预测”的人。
- 想把术数建议当成唯一决策依据的人。

## 仓库结构

```text
cyber-ziwei-report-skill/
  README.md
  LICENSE
  cyber-ziwei-report/
    SKILL.md
    agents/
      openai.yaml
    references/
      workflow.md
    assets/
      template/
        input/
        output/
        scripts/
        src/
        package.json
```

其中最重要的是：

- `cyber-ziwei-report/SKILL.md`：Codex skill 的说明文件。
- `cyber-ziwei-report/assets/template/`：可以直接运行的完整项目模板。
- `src/parser/parseWenmoChart.ts`：文墨天机命盘文本解析器。
- `src/analysis/mockAnalysis.ts`：本地规则型分析生成器。
- `src/analysis/buildAnalysisPrompt.ts`：接入真实大模型时使用的严格提示词。
- `src/render/Report.tsx`：报告页面渲染入口。
- `scripts/build-all.ts`：一键构建流程。

## 方式一：安装为 Codex Skill

如果你使用 Codex，本仓库最推荐的用法是把 skill 安装到本机 Codex 技能目录。

在 PowerShell 中执行：

```powershell
git clone https://github.com/FanxingMeng1999/cyber-ziwei-report-skill.git
cd cyber-ziwei-report-skill
Copy-Item -Recurse -Force .\cyber-ziwei-report "$env:USERPROFILE\.codex\skills\cyber-ziwei-report"
```

之后在 Codex 中可以这样调用：

```text
使用 $cyber-ziwei-report，根据 input/chart.txt 生成一份自包含 HTML 紫微斗数报告。
```

或者直接把命盘文本发给 Codex，并说明：

```text
请按这个文墨天机命盘重新生成报告，报告文件名要包含出生日期和性别。
```

## 方式二：直接运行模板项目

你也可以不安装 skill，直接复制模板项目运行。

```powershell
git clone https://github.com/FanxingMeng1999/cyber-ziwei-report-skill.git
cd cyber-ziwei-report-skill
Copy-Item -Recurse .\cyber-ziwei-report\assets\template .\my-ziwei-report
cd .\my-ziwei-report
npm install
```

把从文墨天机复制出的完整命盘文本放入：

```text
input/chart.txt
```

然后运行：

```powershell
npm run build:all
```

生成完成后查看：

```text
output/latest.json
```

它会指向最新报告目录，例如：

```text
output/紫微斗数报告-乙亥年正月二十日午时-女/report.html
```

打开这个 `report.html` 即可查看完整报告。

## 常用命令

在模板项目目录中可以使用这些命令：

```powershell
npm run parse
npm run analyze
npm run render
npm run build:all
npm run review:all
```

推荐流程：

```powershell
npm run build:all
npm run review:all
```

`build:all` 会执行类型检查、解析、分析、渲染和基础检查。  
`review:all` 会执行更完整的报告审阅。

## 输入格式

输入文件固定为：

```text
input/chart.txt
```

内容应当是从文墨天机复制出来的紫微斗数命盘原文，通常包含：

- API 版本、App 版本、安星码。
- 性别、农历时间、四柱、五行局数。
- 命主、身主、身宫、来因宫。
- 十二宫星曜、四化、神煞、大限、小限、流年。
- 大限流年信息。

解析器会自动忽略常见树状符号，例如：

```text
│ ├ └
```

如果命盘缺少经度、真太阳时、部分流年等字段，解析流程不会直接失败，而是尽量保留已知信息并写入警告。

## 输出内容

每次生成会创建一个独立报告目录，命名规则包含命盘特征：

```text
紫微斗数报告-出生日期-性别
```

目录内包含：

```text
chart.json
analysis.json
report.html
```

含义如下：

- `chart.json`：解析后的结构化命盘数据。
- `analysis.json`：分析结果和报告内容。
- `report.html`：可直接分享的最终网页报告。

## 报告内容包含什么

报告会尽量把复杂信息分成易读模块：

- 基本信息和数据完整度。
- 命盘核心结构。
- 十二宫逐宫解读。
- 生年四化、自化、向心自化和飞化提示。
- 健康、学业、事业、财运、人际、婚姻感情等领域分析。
- 前八个大限分析。
- 前八个大限逐年流年表。
- 重点建议清单。
- 明确免责声明。

所有建议都会尽量绑定命盘结构和流年信息，避免只给泛泛的安慰话。

## 如何接入真实大模型

默认的 `npm run analyze` 使用本地规则型分析，目的是保证没有模型接口时也能跑通完整工作流。

如果你希望接入真实大模型，可以配置环境变量后运行：

```powershell
$env:CYBER_ZIWEI_LLM="1"
$env:OPENAI_API_KEY="your_api_key_here"
$env:OPENAI_BASE_URL="https://api.openai.com/v1"
$env:OPENAI_MODEL="your_model_name"
npm run analyze:llm
npm run render
npm run review:all
```

真实模型必须返回合法 JSON，不能返回 Markdown。  
项目内的 `buildAnalysisPrompt.ts` 已经要求模型从三合、飞星、河洛、钦天四化等视角综合分析，同时要求使用审慎措辞。

## 如何调整主题

主要样式在：

```text
src/render/styles.ts
```

报告视图配置在：

```text
src/render/reportVariants.ts
```

你可以调整：

- 玄色主题配色。
- 护眼主题配色。
- 卡片密度。
- 关键字高亮。
- 表格样式。
- 章节间距。

建议保持正文足够克制，避免高饱和颜色过多，尤其不要让风险提示变成恐吓式视觉表达。

## 为什么强调审慎表达

命理报告很容易被读者当成确定结论。  
因此本项目默认要求：

- 不说“必然发生”。
- 不制造恐慌。
- 不替代医生、律师、投资顾问、心理咨询师、婚姻咨询师或职业顾问。
- 不把流年建议写成唯一选择。
- 对健康、投资、婚姻、法律相关内容使用保守措辞。

这是项目的底线，不是可选项。

## 开发与贡献

欢迎围绕这些方向改进：

- 支持更多文墨天机文本变体。
- 增强十二宫与流年解析稳定性。
- 改进真实模型提示词和结构化校验。
- 增加更多报告主题。
- 优化手机端阅读体验。
- 加强中文长文排版和重点提示。
- 扩展安全审查规则。

提交前建议至少运行：

```powershell
npm run build:all
npm run review:all
```

## 常见问题

### 只分享 HTML 文件，对方还能看到内容吗？

可以。生成后的 `report.html` 已经包含报告内容和样式，不需要把 `chart.json` 与 `analysis.json` 一起发给对方。

### 为什么没有 PDF？

当前版本故意不提供 PDF 导出。  
HTML 可以保留多主题、多版本、目录跳转和更好的屏幕阅读效果，视觉质量也更稳定。

### 没有真实大模型接口能用吗？

能用。默认规则型分析可以跑完整流程，适合测试、样式设计和基础报告生成。  
如果要更深入的逐盘分析，建议接入真实模型并加强人工复核。

### 可以用于商业交付吗？

代码采用 MIT 协议。  
但命理内容本身必须保留审慎表达和免责声明，不能包装成确定预测或专业决策替代品。

## 许可证

MIT License
