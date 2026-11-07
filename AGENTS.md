# MetaMind 知识库 Demo

当前界面位于 `src/workspace-demo/`，入口为 `src/main.jsx` 和 `src/Workbench.jsx`。

- 工作区使用 `/workspace`。详情由 `library` 查询参数指定，所有权筛选使用 `tab=created|shared`。
- 知识列表、我创建的和与我共享位于最左侧导航栏。
- 卡片支持打开对应知识库，并返回原来的筛选列表。
- 新建知识库需要名称，可以先创建空库。
- 向已有知识库添加资料时显示目标名称，提供资料选择和整理设置。
- 保留现有浏览器本地数据的兼容性。资料导入根据知识库 ID 定位目标。
- 沿用本地 MiSans 字体和当前组件样式。
- 本地分享、外部 Agent 示例和资料解析的能力说明应与实际行为一致。

修改后运行 `npm run build`、`npm run test:workbench` 和 `npm run test:sites`。涉及界面交互时，通过浏览器验证正常入口。

构建适配位于 `.openai/hosting.json`、`worker/index.js` 和 `scripts/prepare-sites-build.mjs`。
