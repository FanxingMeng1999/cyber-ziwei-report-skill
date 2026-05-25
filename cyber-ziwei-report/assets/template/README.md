# 赛博算卦 / 文墨天机紫微斗数报告生成器

这是一个本地可运行的网页报告工作流：将文墨天机紫微斗数命盘原始文本解析为结构化数据，生成分区清晰、双主题、双信息密度的自包含 HTML 报告。

## 1. 安装依赖

要求：

- Node.js 20+
- npm 10+

安装：

```bash
npm install
```

## 2. 放入命盘文本

将文墨天机命盘原始文本放到：

`input/chart.txt`

解析器支持：

- 忽略树状前缀符号，如 `│`、`├`、`└`
- 识别基础信息、十二宫、大限流年
- 容忍缺少地理经度、钟表时间、真太阳时等字段
- 对截断的大限流年标记 `partial: true`
- 将无法解析但疑似重要的行写入 `warnings`

页面文案默认尽量避免中英文混杂；对“大限、流年、四化”等术语，会搭配更直白的中文说明。

## 3. 生成网页报告

分步命令：

```bash
npm run parse
npm run analyze
npm run render
```

一键执行：

```bash
npm run build:all
```

`npm run build:all` 顺序：

```text
typecheck → parse → analyze → audit:analysis → render → audit:report → check
```

可选命令：

```bash
npm run analyze:llm    # 若设置了 OPENAI_API_KEY，调用真实模型；否则自动回退 mock
npm run audit:analysis # 分析审计：绝对化表达、医疗越界、依据-表现-建议链完整性
npm run audit:report   # 报告审计：HTML 结构、主题版本、可见文本风险
npm run review:all     # 在已生成产物基础上执行 typecheck + 双审计 + check
npm run typecheck      # 单独运行类型检查
```

## 4. 输出文件

核心输出：

- `output/latest.json`
- `output/紫微斗数报告-出生日期-性别/chart.json`
- `output/紫微斗数报告-出生日期-性别/analysis.json`
- `output/紫微斗数报告-出生日期-性别/report.html`

说明：

- 每个命主会单独创建一个文件夹，避免不同命主的 JSON、HTML 混在一起。
- `output/latest.json` 是最新产物指针，后续 `analyze`、`render`、`check` 都按它定位最新命主目录。
- 命主目录中的 `report.html` 是聚合分享版，内含四个版本，并提供顶部按钮切换。
- 命名优先使用钟表时间或真太阳时中的公历日期；若原始命盘没有公历日期，则使用农历时间；文件名同时包含性别。
- 当前工作流只生成网页报告，不再包含文档导出步骤。

## 5. 报告版本

命主目录中的聚合版 `report.html` 内含四种视图：

- 详细版 / 玄奥玄色
- 详细版 / 明亮护眼
- 省流版 / 玄奥玄色
- 省流版 / 明亮护眼

也可以在浏览器地址后加 `?view=concise-light` 或 `#concise-light` 直接打开护眼省流版。

详细版保留十二宫、四化线索、六大领域、前八大限、逐年流年、行动建议。省流版压缩为核心格局、一页看懂、六大领域、大限摘要、优先建议。

## 6. 校验内容

`npm run check` 会验证：

- `chart.json` 是否包含 12 个宫位
- `analysis.json` 是否包含 12 个宫位分析、六大领域、前八大限、六条行动建议和标准免责声明
- HTML 是否包含目录、十二宫、前八大限、免责声明、版本切换按钮等关键结构
- 报告可见文本是否出现绝对化、恐吓式、专业越界或模板残留表达
- 聚合版四个版本是否都存在，章节锚点是否唯一
- 最新命主目录是否只包含 `chart.json`、`analysis.json`、`report.html`
- `output` 中是否残留已禁用的文档导出产物

## 7. 接入真实大模型

当前默认使用 `src/analysis/mockAnalysis.ts` 生成稳定可运行的 `analysis.json`，保证离线可跑。

如需使用真实模型，配置环境变量后运行：

```bash
set OPENAI_API_KEY=your_api_key_here
set OPENAI_BASE_URL=https://api.openai.com/v1
set OPENAI_MODEL=gpt-4o-mini
npm run analyze:llm
```

`scripts/analyze-llm.ts` 的行为：

- 没有 API Key 或 `CYBER_ZIWEI_LLM=0` 时，自动回退到 mock。
- 模型返回必须是合法 JSON 对象，不能是 Markdown 或代码块。
- 内置结构校验：12 宫、六大领域、行动建议、标准免责声明等。
- 失败时会把原始响应写入最新命主目录的 `analysis-llm-debug.txt` 并回退 mock。

`buildAnalysisPrompt.ts` 已要求模型综合三合紫微、飞星紫微、河洛紫微、钦天四化等视角，并对健康、学业、事业、财运、人际、婚姻感情分别给出审慎分析。

## 8. 调整主题样式

报告主模板位于：

- `src/render/Report.tsx`
- `src/render/styles.ts`
- `src/render/reportVariants.ts`

可直接调整：

- 配色变量：`--bg`、`--gold`、`--cyan`、`--vermillion`
- 页面宽度、字号、行距、卡片间距
- 宫位卡片、风险标签、目录、表格样式
- 水印、装饰线条、主题变量

HTML 输出为自包含样式，不依赖 CDN，也不依赖网络字体。

## 9. 当前限制

- 当前术数分析由规则型 mock 逻辑生成，重点在于流程跑通、结构稳定和分区建议，不等同于专业命理师逐盘研判。
- 不同来源的文墨天机文本格式可能存在差异，若字段命名偏差较大，需继续扩展解析规则。
- 大限流年若原始文本本身截断，系统会保守标记为部分数据，并在报告中提示。
- `audit:analysis` 与 `audit:report` 是规则型审计，只能拦截明显越界和结构问题；接入真实模型后建议继续扩展禁词、专业边界和重点年份数量规则。
- 本项目结果仅供研究、娱乐与自我反思，不能替代医学、法律、投资、婚姻、心理咨询或职业决策。
