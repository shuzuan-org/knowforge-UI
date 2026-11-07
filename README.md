# MetaMind 知识库 Demo

当前前端 Demo，提供知识库列表、我创建的与我共享筛选，以及知识库内的文件、Wiki、图谱和分享界面。

## 本地运行

需要 Node.js 22 或更新版本。

```bash
npm ci
npm run build
node server.mjs
```

打开 http://localhost:8767/workspace 。

开发模式使用 `npm run dev`。知识库和新增资料保存在当前浏览器中。示例知识库内容随项目提供，导入的本地资料支持文本、PDF 和 DOCX 解析。

## 检查

```bash
npm run test:workbench
npm run test:sites
```

本地分享链接在同一浏览器内使用，跨浏览器可导出分享文件。外部 Agent 接入提供配置示例。

## 目录

- `src/workspace-demo/` 包含当前知识库界面和交互。
- `src/Workbench.jsx` 管理工作区路由和浏览器数据。
- `public/` 包含本地字体、品牌素材和示例知识库。
- `server.mjs` 在本机提供构建后的预览。
- `worker/` 与 `scripts/` 提供 Sites 构建适配。
