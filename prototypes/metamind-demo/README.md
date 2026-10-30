# MetaMind 知识库 demo

这是当前迭代的 MetaMind 知识库前端原型（2026-10-30），包含源码、预构建页面、字体与测试。仓库根目录保留原有 KnowForge demo，本目录可独立运行。

## 直接打开

需要 Node.js 22.13 或更新版本。已包含构建文件，直接预览无需安装依赖，Windows、macOS、Linux 都可运行。

1. 下载或克隆仓库，进入 `prototypes/metamind-demo`。
2. 在此目录打开终端，执行：

```sh
node server.mjs
```

3. 浏览器访问 <http://localhost:8767/workspace>；产品介绍首页为 <http://localhost:8767/>。

macOS 也可双击本目录的 `启动知识库.command`。请保持服务终端开启；不要直接双击 `dist/client/index.html`。

## 修改与构建

```sh
npm ci
npm run dev
```

Vite 会在终端显示开发地址。修改后重新生成成品：

```sh
npm run build
node server.mjs
```

`dist/` 随源码提交，方便直接运行；修改界面后请同步重新构建。

## 检查

```sh
npm run test:workbench
npm run test:sites
```

## 当前内容

- 知识库列表、知识问答、我创建的、与我共享和全部资料。
- 正文与目录并排阅读，知识问答侧栏可收起，提供知识图谱、资料来源与使用方式。
- 独立的添加资料页面、知识库选择、新建知识库和整理智能体设置。
- 智能体管理、最近访问及子目录、使用说明、本地演示账户。
- 账号级「复制给 Agent」与单库「复制分享链接」入口，范围分别说明。
- MiSans 字体、统一字重层级、线性图标、轻量按钮与圆角规范。

## 原型范围

这是本地前端原型。演示登录不连接真实账户；在线 AI、MCP、支付尚未接入，接入地址为示例。浏览器中新添加的资料、对话和草稿保存在当前浏览器中，不随仓库迁移。

`public/fonts/misans/` 包含 MiSans 字体及其许可文件。历史验收截图、浏览器账户数据、临时缓存与 `node_modules` 未上传。
