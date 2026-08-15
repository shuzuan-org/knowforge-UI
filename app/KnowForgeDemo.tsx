"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  Books,
  CaretDown,
  CaretRight,
  Check,
  Clock,
  FileText,
  Folder,
  FolderOpen,
  Gear,
  House,
  LinkSimple,
  ListBullets,
  LockSimple,
  MagnifyingGlass,
  Package,
  ImageSquare,
  Plus,
  PresentationChart,
  Robot,
  SquaresFour,
  Sparkle,
  ShieldCheck,
  TreeStructure,
  UploadSimple,
  VideoCamera,
} from "@phosphor-icons/react";

const sections = [
  { id: "overview", label: "知识重构概览" },
  { id: "pipeline", label: "从资料到知识资产" },
  { id: "structure", label: "知识结构" },
  { id: "citations", label: "可追溯的证据链" },
  { id: "quality", label: "质量与置信度" },
];

const projectSections = [
  { id: "overview", label: "页面概览" },
  { id: "pipeline", label: "核心结论" },
  { id: "structure", label: "重构正文" },
  { id: "citations", label: "相关关系" },
  { id: "quality", label: "来源证据" },
];

const navigation = [
  {
    title: "主要功能",
    icon: "",
    items: [
      { label: "工作台", href: "#overview", icon: House },
      { label: "导入资料", href: "#pipeline", icon: UploadSimple },
      { label: "原始文件", href: "#sources", icon: FileText },
      { label: "知识图谱", href: "#graph", icon: TreeStructure },
      { label: "智能体", href: "#agents", icon: Robot },
    ],
  },
];

type LibraryGroupId = "projects" | "organizations" | "decisions" | "timeline" | "methods" | "pending";

type LibraryPage = {
  id: string;
  title: string;
  description: string;
  meta: string;
  status?: string;
};

type LibraryGroup = {
  id: LibraryGroupId;
  title: string;
  description: string;
  pages: LibraryPage[];
};

const libraryGroups: LibraryGroup[] = [
  {
    id: "projects",
    title: "项目",
    description: "按项目聚合方案、会议、交付物和关键决策，形成可以持续更新的项目知识页。",
    pages: [
      { id: "a-company", title: "A 公司数字化项目", description: "汇总项目复盘、实施方案和会议纪要，呈现目标、阶段成果与未决事项。", meta: "7 个来源", status: "86%" },
      { id: "b-process", title: "B 公司流程优化", description: "整理现状诊断、流程设计和执行反馈，保留每项结论的原始依据。", meta: "5 个来源", status: "72%" },
      { id: "c-planning", title: "C 公司系统规划", description: "归并系统规划、接口清单和范围变更，标记仍需业务确认的内容。", meta: "4 个来源", status: "待确认" },
    ],
  },
  {
    id: "organizations",
    title: "客户 / 组织",
    description: "围绕客户、团队和协作关系组织长期资料，快速理解组织背景和关键联系人。",
    pages: [
      { id: "a-company-profile", title: "A 公司组织档案", description: "组织结构、业务范围、关键角色与合作历史。", meta: "12 个来源", status: "已确认" },
      { id: "product-team", title: "产品与交付团队", description: "团队职责、协作边界和历次项目中的角色变化。", meta: "8 个来源", status: "更新中" },
      { id: "partners", title: "外部合作伙伴", description: "供应商、顾问和实施伙伴的合作记录与能力标签。", meta: "6 个来源", status: "81%" },
    ],
  },
  {
    id: "decisions",
    title: "决策",
    description: "集中保存重要选择、反对意见和决策依据，避免只留下结果而丢失上下文。",
    pages: [
      { id: "readonly-mcp", title: "先做只读 MCP", description: "为什么先开放可信读取能力，以及写入权限需要满足的前置条件。", meta: "4 个来源", status: "已确认" },
      { id: "no-editor", title: "不做在线编辑器", description: "产品边界、用户需求证据和替代方案的完整决策记录。", meta: "3 个来源", status: "已确认" },
    ],
  },
  {
    id: "timeline",
    title: "时间线",
    description: "按时间串联项目、组织和决策变化，查看事实如何逐步形成。",
    pages: [
      { id: "digital-history", title: "数字化项目演进时间线", description: "从立项、范围调整到交付复盘的关键事件。", meta: "18 个事件", status: "已更新" },
      { id: "knowledge-plan", title: "知识重构计划", description: "资料导入、关系识别、质检和发布的阶段计划。", meta: "9 个事件", status: "进行中" },
    ],
  },
  {
    id: "methods",
    title: "方法论",
    description: "沉淀可重复使用的工作方法，并保留方法适用范围和案例证据。",
    pages: [
      { id: "source-merge", title: "多来源证据合并", description: "如何识别重复、补充和冲突信息，形成稳定结论。", meta: "6 个案例", status: "可用" },
      { id: "confidence", title: "置信度与冲突处理", description: "低置信结论的标记、复核和更新规则。", meta: "4 个案例", status: "可用" },
    ],
  },
  {
    id: "pending",
    title: "待确认",
    description: "集中展示缺少引用、来源冲突或内容过期的知识页，方便逐项处理。",
    pages: [
      { id: "contract-scope", title: "合同补充条款范围", description: "扫描件识别结果存在歧义，需要核对原始合同。", meta: "2 个冲突", status: "待确认" },
      { id: "ocr-claims", title: "低置信 OCR 结论", description: "图片来源的关键数字尚未经过人工复核。", meta: "3 个结论", status: "待确认" },
      { id: "stale-profile", title: "过期客户资料", description: "联系人和组织结构可能已经变化，需要补充新来源。", meta: "5 项过期", status: "待更新" },
    ],
  },
];

function BrandMark() {
  return <span className="brand-mark" aria-hidden="true"><img src="/metask-logo.svg" alt="" /></span>;
}

function LibraryGroupView({ group, onOpenPage }: { group: LibraryGroup; onOpenPage: (page: LibraryPage) => void }) {
  return (
    <section className="library-index-view">
      <header className="library-index-header">
        <p className="eyebrow">我的20年工作档案 / {group.title}</p>
        <h1>{group.title}</h1>
        <p>{group.description}</p>
      </header>
      <div className="library-index-toolbar">
        <strong>{group.pages.length} 个内容页</strong>
        <span>按最近更新排序</span>
      </div>
      <div className="library-page-grid">
        {group.pages.map((page) => (
          <button key={page.id} className="library-page-item" onClick={() => onOpenPage(page)}>
            <span className="library-page-icon"><FileText size={19} weight="regular" /></span>
            <span className="library-page-copy">
              <strong>{page.title}</strong>
              <small>{page.description}</small>
              <em>{page.meta}</em>
            </span>
            {page.status && <span className="library-page-status">{page.status}</span>}
            <ArrowRight className="library-page-arrow" size={17} weight="regular" />
          </button>
        ))}
      </div>
    </section>
  );
}

function LibraryOverviewView({ onOpenGroup, onAction }: { onOpenGroup: (groupId: LibraryGroupId) => void; onAction: (message: string) => void }) {
  const [libraryName, setLibraryName] = useState("我的20年工作档案");
  const [libraryDescription, setLibraryDescription] = useState("持续整理项目、客户、决策与方法，把零散资料重构成可追溯、可复用的长期知识。");
  const [editOpen, setEditOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const groupMetrics: Record<LibraryGroupId, { sources: number; contribution: string }> = {
    projects: { sources: 16, contribution: "8.2" },
    organizations: { sources: 26, contribution: "8.8" },
    decisions: { sources: 7, contribution: "9.1" },
    timeline: { sources: 14, contribution: "7.9" },
    methods: { sources: 10, contribution: "8.6" },
    pending: { sources: 12, contribution: "6.2" },
  };
  const processingStats = [
    { value: "1,284", label: "资料总数", icon: FileText },
    { value: "5", label: "待处理", icon: Clock },
    { value: "18", label: "处理中", icon: Sparkle },
    { value: "1,165", label: "已入库", icon: Check },
    { value: "96", label: "知识页", icon: Books },
  ];
  const mcpAddress = "https://mcp.knowforge.local/library/my-20-year-archive";

  const copyMcpAddress = async () => {
    await navigator.clipboard?.writeText(mcpAddress);
    onAction("MCP 地址已复制");
  };

  return (
    <section className="library-overview-view">
      <header className="library-summary-card">
        <div>
          <div className="library-health"><span>健康度</span><strong>87.7</strong></div>
          <h1>{libraryName}</h1>
          <p>{libraryDescription}</p>
        </div>
        <aside className="library-summary-actions">
          <button className="library-rebuild" onClick={() => onAction("知识库重新生成任务已加入队列")}>重新生成</button>
          <button className="library-delete" onClick={() => onAction("删除功能仅作界面演示")}>删除知识库</button>
          <button className="library-edit" onClick={() => setEditOpen(true)}>编辑</button>
          <button className="library-clear" onClick={() => setClearOpen(true)}>清空</button>
        </aside>
      </header>

      <section className="library-processing-card">
        <h2>资料处理情况</h2>
        <div className="library-processing-stats" aria-label="资料处理统计">
          {processingStats.map((stat) => (
            <div key={stat.label}><span><stat.icon size={16} weight="regular" /></span><strong>{stat.value}</strong><small>{stat.label}</small></div>
          ))}
        </div>

        <div className="library-directory-heading">
          <div><h3>目录</h3><span>按知识结构浏览</span></div>
          <small>{libraryGroups.length} 个分类 · 16 个内容页</small>
        </div>
        <div className="library-directory-list">
          {libraryGroups.map((group) => (
            <button key={group.id} onClick={() => onOpenGroup(group.id)}>
              <span className="library-directory-icon"><Folder size={18} weight="regular" /></span>
              <span className="library-directory-copy"><strong>{group.title}</strong><small>{group.description}</small></span>
              <span className="library-directory-metric"><strong>{group.pages.length}</strong><small>内容页</small></span>
              <span className="library-directory-metric"><strong>{groupMetrics[group.id].sources}</strong><small>来源</small></span>
              <span className="library-directory-metric"><strong>{groupMetrics[group.id].contribution}</strong><small>贡献度</small></span>
            </button>
          ))}
        </div>
      </section>

      <section className="library-mcp-card">
        <h2>知识库 MCP</h2>
        <div>
          <LinkSimple size={20} weight="regular" />
          <span><small>知识库 MCP 只读地址</small><strong>{mcpAddress}</strong><em>连接后，外部 AI 可读取目录、知识页与引用，不开放写入和删除权限。</em></span>
          <button onClick={copyMcpAddress}>复制</button>
        </div>
      </section>

      {editOpen && (
        <EditLibraryDialog
          name={libraryName}
          description={libraryDescription}
          onClose={() => setEditOpen(false)}
          onSave={(name, description) => { setLibraryName(name); setLibraryDescription(description); setEditOpen(false); onAction("知识库信息已更新"); }}
        />
      )}
      {clearOpen && (
        <ClearLibraryDialog
          libraryName={libraryName}
          onClose={() => setClearOpen(false)}
          onConfirm={() => { setClearOpen(false); onAction("知识库内容已清空，可重新导入资料"); }}
        />
      )}
    </section>
  );
}

function ImportView({ onAction }: { onAction: (message: string) => void }) {
  const agents = {
    research: { avatar: "研", name: "研究整理员", scene: "行业研究、论文阅读、专题调研", focus: "核心结论、关键数据、争议观点、待验证问题" },
    project: { avatar: "项", name: "项目归档员", scene: "项目复盘、会议纪要、交付资料", focus: "关键决策、项目进展、责任人、风险与行动项" },
    evidence: { avatar: "证", name: "证据检查员", scene: "合同、制度、扫描件与事实核验", focus: "来源引用、冲突信息、置信度、待人工确认内容" },
  } as const;
  const libraries = {
    archive: "我的20年工作档案",
    company: "公司制度库",
    client: "客户项目库",
  } as const;
  const [importMode, setImportMode] = useState<"file" | "text" | "url">("file");
  const [targetMode, setTargetMode] = useState<"existing" | "new">("existing");
  const [targetOpen, setTargetOpen] = useState(false);
  const [existingLibrary, setExistingLibrary] = useState<keyof typeof libraries>("archive");
  const [newLibraryName, setNewLibraryName] = useState("");
  const [newLibraryDescription, setNewLibraryDescription] = useState("");
  const [agentId, setAgentId] = useState<keyof typeof agents>("research");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [sourceText, setSourceText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceCommitted, setSourceCommitted] = useState(false);
  const selectedAgent = agents[agentId];
  const targetName = targetMode === "existing" ? libraries[existingLibrary] : newLibraryName.trim();
  const sourceReady = importMode === "file" ? selectedFiles.length > 0 : sourceCommitted && (importMode === "text" ? sourceText.trim().length > 0 : sourceUrl.trim().length > 0);
  const importReady = Boolean(targetName && sourceReady);

  const acceptFiles = (files: FileList | null) => {
    const names = Array.from(files ?? []).map((file) => file.name);
    if (!names.length) return;
    setSelectedFiles(names);
    setImportMode("file");
    setSourceCommitted(true);
    onAction(`已添加 ${names.length} 份资料`);
  };

  const resetSource = (mode: "file" | "text" | "url") => {
    setSelectedFiles([]);
    setSourceText("");
    setSourceUrl("");
    setImportMode(mode);
    setSourceCommitted(false);
  };

  const startImport = () => {
    if (!targetName) {
      onAction("请先选择知识库或填写新知识库名称");
      return;
    }
    if (!sourceReady) {
      onAction(importMode === "file" ? "请先选择要上传的文件" : importMode === "text" ? "请先粘贴资料文本" : "请先填写资料 URL");
      return;
    }
    onAction(`${targetMode === "new" ? "已新建知识库并开始导入" : "已开始导入到"}「${targetName}」，由${selectedAgent.name}整理`);
  };
  const previewRows = [
    { source: "2019_A公司项目复盘.docx", type: "Word", upload: "已上传", viki: "已生成" },
    { source: "2020_B公司会议纪要.pdf", type: "PDF", upload: "已上传", viki: "生成中" },
    { source: "数字化咨询方案.pptx", type: "PPT", upload: "已上传", viki: "已生成" },
    { source: "合同扫描件_补充条款.png", type: "图片", upload: "上传中", uploadProgress: 72, viki: "待生成" },
  ];

  return (
    <section className="import-view">
      <div className="import-main">
        <section className="import-hero">
          <span className="import-upload-icon"><UploadSimple size={26} weight="regular" /></span>
          <h1>导入资料</h1>
          <p>先添加文件、网页或文本，再选择资料去向与整理智能体。</p>

          <section className={`import-simple-card${targetOpen ? " target-open" : ""}`} aria-label="导入资料">
            <section className="import-simple-source">
              <header><div><strong>添加资料</strong><small>支持文件、网页和文本，可一次添加多份资料</small></div>{sourceReady && <span><Check size={13} weight="bold" />已就绪</span>}</header>
              {importMode === "file" ? (
                <label className={`import-simple-drop import-source-input-panel ${selectedFiles.length ? "has-source" : ""}`}>
                  <input type="file" multiple onChange={(event) => acceptFiles(event.currentTarget.files)} />
                  <div><strong>{selectedFiles.length ? `已选择 ${selectedFiles.length} 份资料` : "选择文件或拖放到这里"}</strong><small>{selectedFiles.length ? selectedFiles.join("、") : "PDF、Word、Excel、PPT、图片与代码目录"}</small></div>
                  <em>{selectedFiles.length ? "重新选择" : "选择文件"}</em>
                </label>
              ) : importMode === "text" ? (
                <div className="import-inline-source-editor import-source-input-panel is-text">
                  <textarea value={sourceText} onChange={(event) => { setSourceText(event.target.value); setSourceCommitted(false); }} placeholder="在这里粘贴需要整理的资料文本…" aria-label="粘贴资料文本" />
                  <button type="button" disabled={!sourceText.trim()} onClick={() => { setSourceCommitted(true); onAction("文本资料已确认"); }}>确认文本</button>
                </div>
              ) : (
                <div className="import-inline-source-editor import-source-input-panel is-url">
                  <input value={sourceUrl} onChange={(event) => { setSourceUrl(event.target.value); setSourceCommitted(false); }} placeholder="https://example.com/document" aria-label="资料 URL" />
                  <button type="button" disabled={!sourceUrl.trim()} onClick={() => { setSourceCommitted(true); onAction("网页资料已确认"); }}>添加网页</button>
                </div>
              )}
              <div className="import-simple-source-switch" aria-label="切换资料类型">
                <button type="button" className={importMode === "file" ? "active" : ""} aria-pressed={importMode === "file"} onClick={() => importMode !== "file" && resetSource("file")}><UploadSimple size={14} />选择文件</button>
                <button type="button" className={importMode === "url" ? "active" : ""} aria-pressed={importMode === "url"} onClick={() => importMode !== "url" && resetSource("url")}><LinkSimple size={14} />添加网页</button>
                <button type="button" className={importMode === "text" ? "active" : ""} aria-pressed={importMode === "text"} onClick={() => importMode !== "text" && resetSource("text")}><FileText size={14} />粘贴文本</button>
              </div>
            </section>

            <section className="import-quick-settings">
              <header><div><strong>导入设置</strong><small>系统已预选，可直接使用或调整</small></div></header>
              <div className="import-quick-settings-grid">
                <div className="import-target-field">
                  <span>导入到</span>
                  <div className={`import-target-dropdown${targetOpen ? " open" : ""}`}>
                    {targetOpen && <button type="button" className="import-target-scrim" aria-hidden="true" tabIndex={-1} onClick={() => setTargetOpen(false)} />}
                    <button
                      type="button"
                      className={`import-target-trigger${targetMode === "new" ? " is-new" : ""}`}
                      onClick={() => setTargetOpen((current) => !current)}
                      aria-haspopup="listbox"
                      aria-expanded={targetOpen}
                    >
                      {targetMode === "new" ? "＋ 新建知识库" : libraries[existingLibrary]}
                      <CaretDown size={14} />
                    </button>
                    {targetOpen && (
                      <div className="import-target-panel" role="listbox" aria-label="选择知识库">
                        <button type="button" className={`import-target-new${targetMode === "new" ? " active" : ""}`} role="option" aria-selected={targetMode === "new"} onClick={() => { setTargetMode("new"); setTargetOpen(false); }}>＋ 新建知识库</button>
                        <div className="import-target-divider" />
                        {Object.entries(libraries).slice(0, 3).map(([value, label]) => (
                          <button type="button" key={value} className={`import-target-option${targetMode === "existing" && existingLibrary === value ? " active" : ""}`} role="option" aria-selected={targetMode === "existing" && existingLibrary === value} onClick={() => { setTargetMode("existing"); setExistingLibrary(value as keyof typeof libraries); setTargetOpen(false); }}>{label}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <label className="import-agent-setting">
                  <span>智能体</span>
                  <select value={agentId} onChange={(event) => setAgentId(event.target.value as keyof typeof agents)}>
                    {Object.entries(agents).map(([value, agent]) => <option value={value} key={value}>{agent.name} · {agent.scene}</option>)}
                  </select>
                  <small className="import-setting-hint"><Sparkle size={12} />{selectedAgent.name}将重点整理：{selectedAgent.focus}</small>
                </label>
              </div>
              {targetMode === "new" && (
                <div className="import-new-library-inline">
                  <label><span>新知识库名称</span><input value={newLibraryName} onChange={(event) => setNewLibraryName(event.target.value)} placeholder="例如：2026 产品研究库" autoFocus /></label>
                  <label><span>说明 <em>选填</em></span><input value={newLibraryDescription} onChange={(event) => setNewLibraryDescription(event.target.value)} placeholder="资料主题与使用范围" /></label>
                </div>
              )}
            </section>

            <footer className="import-simple-footer centered">
              <button type="button" disabled={!importReady} onClick={startImport}>{targetMode === "new" ? "新建并导入" : "开始导入"}<ArrowRight size={16} /></button>
            </footer>
          </section>
        </section>

        <section className="import-preview-card">
          <h2>导入预检结果</h2>
          <div className="import-preview-table" role="table" aria-label="导入预检结果">
            <div className="import-preview-row head" role="row"><span>Source</span><span>类型</span><span>上传状态</span><span>Viki 生成</span></div>
            {previewRows.map((row) => (
              <div className="import-preview-row" role="row" key={row.source}>
                <span><FileText size={14} />{row.source}</span>
                <span>{row.type}</span>
                <span className={`import-upload-cell${row.upload === "上传中" ? " is-progress" : " is-text"}`}>
                  {row.upload === "上传中" ? (
                    <span className="import-upload-progress">
                      <span className="import-upload-progress-bar"><i style={{ width: `${row.uploadProgress}%` }} /></span>
                      <strong>{row.uploadProgress}%</strong>
                    </span>
                  ) : row.upload}
                </span>
                <span>{row.viki}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

    </section>
  );
}

function SourceFilesView({ onImport }: { onImport: () => void }) {
  const libraries = [
    {
      id: "archive",
      title: "我的20年工作档案",
      description: "工作、研究与项目资料",
      fileCount: 1284,
      expanded: true,
      folders: [
        {
          name: "项目复盘",
          files: [
            { name: "2019_A公司项目复盘.docx", type: "Word", size: "2.4 MB", status: "已解析", target: "A 公司数字化项目", time: "今天 10:42" },
            { name: "2020_B公司会议纪要.pdf", type: "PDF", size: "6.8 MB", status: "已解析", target: "B 公司流程优化", time: "今天 10:36" },
            { name: "数字化咨询方案.pptx", type: "PPT", size: "12.1 MB", status: "已解析", target: "A 公司数字化项目", time: "昨天 18:20" },
          ],
        },
        {
          name: "合同与证据",
          files: [
            { name: "合同扫描件_补充条款.png", type: "图片", size: "4.2 MB", status: "待确认", target: "合同与报价证据链", time: "昨天 16:08" },
            { name: "报价单_2020Q4.xlsx", type: "Excel", size: "1.1 MB", status: "已解析", target: "合同与报价证据链", time: "7 月 28 日" },
          ],
        },
        {
          name: "会议纪要",
          files: [
            { name: "2021_战略复盘会议.pdf", type: "PDF", size: "3.5 MB", status: "已解析", target: "战略决策记录", time: "7 月 25 日" },
            { name: "2022_年度规划.docx", type: "Word", size: "5.2 MB", status: "已解析", target: "年度规划", time: "7 月 20 日" },
          ],
        },
      ],
    },
    {
      id: "product",
      title: "产品研究资料库",
      description: "竞品、行业报告与访谈",
      fileCount: 248,
      expanded: false,
      folders: [
        {
          name: "竞品分析",
          files: [
            { name: "竞品对比_2026Q1.xlsx", type: "Excel", size: "0.8 MB", status: "已解析", target: "竞品分析报告", time: "昨天 14:20" },
            { name: "竞品截图合集.zip", type: "压缩包", size: "45.3 MB", status: "已解析", target: "竞品分析报告", time: "昨天 14:05" },
          ],
        },
        {
          name: "行业报告",
          files: [
            { name: "2026_行业趋势报告.pdf", type: "PDF", size: "8.6 MB", status: "已解析", target: "行业研究专题", time: "8 月 1 日" },
            { name: "市场调研访谈纪要.docx", type: "Word", size: "2.1 MB", status: "处理中", target: "用户调研", time: "7 月 30 日" },
          ],
        },
      ],
    },
    {
      id: "client",
      title: "客户项目库",
      description: "项目方案、会议与交付资料",
      fileCount: 86,
      expanded: false,
      folders: [
        {
          name: "客户A项目",
          files: [
            { name: "客户A_需求文档.docx", type: "Word", size: "1.8 MB", status: "已解析", target: "客户A交付", time: "7 月 30 日" },
            { name: "客户A_验收报告.pdf", type: "PDF", size: "3.2 MB", status: "待确认", target: "客户A交付", time: "7 月 28 日" },
          ],
        },
        {
          name: "客户B项目",
          files: [
            { name: "客户B_方案设计.pptx", type: "PPT", size: "6.4 MB", status: "已解析", target: "客户B方案", time: "7 月 22 日" },
          ],
        },
      ],
    },
    {
      id: "course",
      title: "课程与论文资料库",
      description: "课程资料、论文与研究笔记",
      fileCount: 174,
      expanded: false,
      folders: [
        {
          name: "课程资料",
          files: [
            { name: "机器学习课程笔记.md", type: "Markdown", size: "0.3 MB", status: "已解析", target: "ML学习笔记", time: "7 月 28 日" },
            { name: "算法导论_习题解答.pdf", type: "PDF", size: "5.6 MB", status: "已解析", target: "算法学习", time: "7 月 26 日" },
          ],
        },
        {
          name: "论文",
          files: [
            { name: "Attention_is_All_You_Need.pdf", type: "PDF", size: "2.2 MB", status: "已解析", target: "Transformer 原理", time: "7 月 20 日" },
            { name: "BERT_论文精读.pdf", type: "PDF", size: "3.8 MB", status: "已解析", target: "预训练模型", time: "7 月 18 日" },
          ],
        },
      ],
    },
  ];
  const [expandedLibraries, setExpandedLibraries] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(libraries.map((lib) => [lib.id, lib.expanded]))
  );
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const folderKey = (libId: string, folderName: string) => `${libId}/${folderName}`;

  const allFiles = libraries.flatMap((lib) => lib.folders.flatMap((folder) => folder.files));
  const stats = [
    { label: "全部文件", value: "1,792" },
    { label: "已解析", value: "1,761" },
    { label: "处理中", value: "3" },
    { label: "待确认", value: "28" },
  ];

  return (
    <section className="source-files-view">
      <header className="source-files-heading">
        <div><p>原始文件</p><h1>原始文件</h1><span>按知识库与文件夹层级浏览用户上传的原始文件，作为知识页的可追溯证据来源。</span></div>
        <button onClick={onImport}><UploadSimple size={16} weight="regular" />导入新资料</button>
      </header>
      <div className="source-file-stats">
        {stats.map((stat) => (
          <span key={stat.label}><small>{stat.label}</small><strong>{stat.value}</strong></span>
        ))}
      </div>
      <div className="source-file-tree">
        {libraries.map((library) => {
          const libExpanded = expandedLibraries[library.id];
          return (
            <div className={`source-tree-library${libExpanded ? " expanded" : ""}`} key={library.id}>
              <button
                className="source-tree-library-header"
                onClick={() => setExpandedLibraries((current) => ({ ...current, [library.id]: !current[library.id] }))}
                aria-expanded={libExpanded}
              >
                <span className="source-tree-caret">{libExpanded ? <CaretDown size={15} /> : <CaretRight size={15} />}</span>
                <span className="source-tree-library-icon"><Books size={18} weight="regular" /></span>
                <span className="source-tree-library-copy"><strong>{library.title}</strong><small>{library.description}</small></span>
                <em className="source-tree-count">{library.fileCount} 个文件</em>
              </button>
              {libExpanded && (
                <div className="source-tree-folders">
                  {library.folders.map((folder) => {
                    const fKey = folderKey(library.id, folder.name);
                    const folderExpanded = expandedFolders[fKey];
                    return (
                      <div className={`source-tree-folder${folderExpanded ? " expanded" : ""}`} key={fKey}>
                        <button
                          className="source-tree-folder-header"
                          onClick={() => setExpandedFolders((current) => ({ ...current, [fKey]: !current[fKey] }))}
                          aria-expanded={folderExpanded}
                        >
                          <span className="source-tree-caret">{folderExpanded ? <CaretDown size={14} /> : <CaretRight size={14} />}</span>
                          <span className="source-tree-folder-icon"><Folder size={16} weight="regular" /></span>
                          <strong>{folder.name}</strong>
                          <em>{folder.files.length} 个文件</em>
                        </button>
                        {folderExpanded && (
                          <div className="source-file-table">
                            <div className="source-file-row head"><span>文件</span><span>类型</span><span>大小</span><span>状态</span><span>关联知识页</span><span>更新时间</span></div>
                            {folder.files.map((file) => (
                              <button className="source-file-row" key={file.name}>
                                <span className="source-file-name"><i><FileText size={16} weight="regular" /></i><strong>{file.name}</strong></span>
                                <span>{file.type}</span><span>{file.size}</span><span><em className={file.status === "待确认" ? "review" : file.status === "处理中" ? "processing" : ""}>{file.status}</em></span><span>{file.target}</span><span>{file.time}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

type GraphFilter = "page" | "project" | "organization" | "decision" | "source" | "conflict";

function KnowledgeGraphView() {
  const [filter, setFilter] = useState<GraphFilter>("page");
  const [graphLibrary, setGraphLibrary] = useState("metask视觉");

  return (
    <section className="knowledge-graph-view">
      <header className="knowledge-graph-heading">
        <div><p>KNOWLEDGE GRAPH</p><h1>知识图谱</h1></div>
        <div className="knowledge-graph-actions">
          <label className="sr-only" htmlFor="graph-library-select">选择知识库</label>
          <select id="graph-library-select" value={graphLibrary} onChange={(event) => setGraphLibrary(event.target.value)}>
            <option value="metask视觉">metask视觉</option>
            <option value="我的20年工作档案">我的20年工作档案</option>
          </select>
          <button type="button" onClick={() => setFilter("page")}>刷新</button>
        </div>
      </header>

      <div className="knowledge-graph-content">
        <section className="knowledge-graph-overview" aria-labelledby="graph-overview-heading">
          <h2 id="graph-overview-heading">总结全貌 <span>（知识聚焦）</span></h2>
          <div className="knowledge-graph-stats">
            <div><strong>20</strong><span>总结篇</span></div>
            <div><strong>59</strong><span>引用节句</span></div>
            <div><strong>208</strong><span>未入总结</span></div>
            <div><strong>122</strong><span>共书关联</span></div>
          </div>
        </section>

        <div
          className="knowledge-graph-canvas"
          data-filter={filter}
          role="img"
          aria-label="当前知识图谱：A公司连接A公司数字化项目和先做流程梳理，两者连接2019至2021时间线，时间线连接项目复盘和数字化方案两个来源文件"
        >
          <svg className="knowledge-graph-edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <line x1="50" y1="20" x2="31" y2="42" />
            <line x1="50" y1="20" x2="69" y2="42" />
            <line x1="31" y1="42" x2="50" y2="62" />
            <line x1="69" y1="42" x2="50" y2="62" />
            <line x1="50" y1="62" x2="23" y2="78" />
            <line x1="50" y1="62" x2="77" y2="78" />
          </svg>

          <span className="knowledge-graph-node graph-node-organization" style={{ left: "50%", top: "20%" }}>A公司</span>
          <span className="knowledge-graph-node graph-node-project" style={{ left: "31%", top: "42%" }}>A 公司数字化项目</span>
          <span className="knowledge-graph-node graph-node-decision" style={{ left: "69%", top: "42%" }}>先做流程梳理</span>
          <span className="knowledge-graph-node graph-node-timeline" style={{ left: "50%", top: "62%" }}>2019–2021</span>
          <span className="knowledge-graph-node graph-node-source" style={{ left: "23%", top: "78%" }}>项目复盘.docx</span>
          <span className="knowledge-graph-node graph-node-source" style={{ left: "77%", top: "78%" }}>数字化方案.pptx</span>
        </div>
      </div>
    </section>
  );
}

type AgentProfile = {
  id: string;
  avatar: string;
  title: string;
  description: string;
  tags: string[];
  focus: string;
  current: boolean;
};

function AgentEditorDialog({ agent, onClose, onSave }: { agent: AgentProfile | null; onClose: () => void; onSave: (name: string) => void }) {
  const [name, setName] = useState(agent?.title ?? "");
  const [description, setDescription] = useState(agent?.description ?? "");
  const [scenarios, setScenarios] = useState(agent?.tags.join("、") ?? "");
  const [strategy, setStrategy] = useState(agent ? "识别重复与冲突信息，按主题聚合来源，并保留每条结论的证据链。" : "");
  const [focus, setFocus] = useState(agent?.focus ?? "");
  const [requirements, setRequirements] = useState(agent ? "不确定内容必须标记置信度，不补写来源中没有的信息。" : "");
  const [avatarImage, setAvatarImage] = useState("");

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const generateProfile = () => {
    if (!name) setName("深度研究员");
    if (!description) setDescription("跨来源检索、证据归纳与研究报告生成。");
    if (!scenarios) setScenarios("行业研究、论文阅读、专题调研");
    if (!strategy) setStrategy("优先识别事实、观点与证据，合并重复内容并显式保留冲突。");
    if (!focus) setFocus("核心结论、关键数据、争议观点、待验证问题");
    if (!requirements) setRequirements("不确定内容必须标记置信度，不补写来源中没有的信息。");
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim());
  };

  return (
    <div className="agent-editor-overlay" role="presentation" onMouseDown={onClose}>
      <form className="agent-editor" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="agent-editor-title">
        <header className="agent-editor-heading">
          <div><p>{agent ? "修改智能体" : "创建智能体"}</p><h2 id="agent-editor-title">定义知识整理角色</h2></div>
          <button type="button" onClick={onClose} aria-label="关闭智能体编辑器">×</button>
        </header>

        <div className="agent-editor-body">
          <div className="agent-editor-profile">
            <label className="agent-avatar-upload">
              <span>智能体头像 <em>1:1</em></span>
              <i style={avatarImage ? { backgroundImage: `url(${avatarImage})` } : undefined}>{!avatarImage && (agent?.avatar ?? "智")}</i>
              <strong><UploadSimple size={16} />本地上传</strong>
              <input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) setAvatarImage(URL.createObjectURL(file)); }} />
            </label>
            <div className="agent-name-tools">
              <label><span>智能体名称</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：深度研究员" required /></label>
              <button type="button" onClick={generateProfile}><Sparkle size={17} />AI 基于内容生成</button>
              <small>根据名称、描述和使用场景生成头像与整理建议</small>
            </div>
          </div>

          <div className="agent-editor-fields">
            <label><span>智能体描述</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="说明这个智能体负责什么" /></label>
            <label><span>知识使用场景</span><textarea value={scenarios} onChange={(event) => setScenarios(event.target.value)} rows={3} placeholder="例如：行业研究、论文阅读、专题调研" /></label>
            <label><span>整理策略</span><textarea value={strategy} onChange={(event) => setStrategy(event.target.value)} rows={3} placeholder="说明如何识别、合并和组织知识" /></label>
            <label><span>核心方向</span><textarea value={focus} onChange={(event) => setFocus(event.target.value)} rows={3} placeholder="需要优先关注的结论、数据或问题" /></label>
            <label><span>其他要求</span><textarea value={requirements} onChange={(event) => setRequirements(event.target.value)} rows={3} placeholder="补充置信度、引用或边界要求" /></label>
          </div>
        </div>

        <footer><button type="button" onClick={onClose}>取消</button><button type="submit" disabled={!name.trim()}>{agent ? "保存修改" : "创建智能体"}</button></footer>
      </form>
    </div>
  );
}

function AgentsView({ onAction }: { onAction: (message: string) => void }) {
  const [activeTab, setActiveTab] = useState<"mine" | "templates">("mine");
  const [query, setQuery] = useState("");
  const agents: AgentProfile[] = [
    {
      id: "research",
      avatar: "研",
      title: "研究整理员",
      description: "面向论文、行业报告和研究资料，优先建立事实、观点与证据之间的关系。",
      tags: ["行业研究", "论文阅读", "专题调研"],
      focus: "核心结论、关键数据、争议观点、待验证问题",
      current: true,
    },
    {
      id: "project",
      avatar: "项",
      title: "项目顾问",
      description: "把会议、方案和交付资料整理成项目脉络，突出决策、风险与下一步行动。",
      tags: ["咨询项目", "客户交付", "项目复盘"],
      focus: "关键决策、项目进展、责任人、风险与行动项",
      current: false,
    },
    {
      id: "content",
      avatar: "策",
      title: "内容策划师",
      description: "从个人知识中提炼观点、案例和表达素材，为内容生产建立可复用资产。",
      tags: ["自媒体选题", "课程研发", "视频与长图内容"],
      focus: "独特观点、案例证据、内容结构、可传播表达",
      current: false,
    },
  ];
  const [editorAgent, setEditorAgent] = useState<AgentProfile | "create" | null>(null);
  const visibleAgents = agents.filter((agent) => `${agent.title}${agent.description}${agent.tags.join("")}`.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <section className="agents-view">
      <header className="agents-heading">
        <h1>给知识一个明确的整理角色</h1>
        <p>每个智能体代表一套可复用的知识使用场景、整理策略和关注方向</p>
      </header>

      <div className="agents-toolbar">
        <div className="agents-tabs" role="tablist" aria-label="智能体分类">
          <button className={activeTab === "mine" ? "active" : ""} onClick={() => setActiveTab("mine")}>我的智能体 <span>3</span></button>
          <button className={activeTab === "templates" ? "active" : ""} onClick={() => setActiveTab("templates")}>系统模板 <span>3</span></button>
        </div>
        <label className="agents-search"><MagnifyingGlass size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索智能体…" /></label>
      </div>

      <div className="agents-grid">
        <button className="agent-create-card" onClick={() => setEditorAgent("create")}>
          <span><Plus size={23} weight="regular" /></span>
          <strong>创建智能体</strong>
          <small>定义专属于你的知识整理方式</small>
        </button>

        {visibleAgents.map((agent) => (
          <article className={`agent-card ${agent.current ? "current" : ""}`} key={agent.id}>
            <div className="agent-card-badges"><span>系统预置</span>{agent.current && <em>当前使用</em>}</div>
            <span className={`agent-avatar ${agent.id}`}>{agent.avatar}</span>
            <h2>{agent.title}</h2>
            <p>{agent.description}</p>
            <div className="agent-tags">{agent.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            <div className="agent-focus"><small>重点关注</small><strong>{agent.focus}</strong></div>
            <div className="agent-actions">
              <button className="agent-use" onClick={() => onAction(`${agent.title}已用于本次整理`)}><UploadSimple size={15} />用于整理</button>
              <button onClick={() => setEditorAgent(agent)}><Gear size={15} />编辑策略</button>
            </div>
          </article>
        ))}
      </div>

      {visibleAgents.length === 0 && <div className="agents-empty">没有找到匹配的智能体</div>}
      {editorAgent && (
        <AgentEditorDialog
          agent={editorAgent === "create" ? null : editorAgent}
          onClose={() => setEditorAgent(null)}
          onSave={(name) => { setEditorAgent(null); onAction(`${name}${editorAgent === "create" ? "已创建" : "策略已保存"}`); }}
        />
      )}
    </section>
  );
}

function NewLibraryDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const libraryName = name.trim();
    if (!libraryName) return;
    onCreate(libraryName);
  };

  return (
    <div className="new-library-overlay" role="presentation" onMouseDown={onClose}>
      <form className="new-library-dialog" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="new-library-title">
        <header>
          <span className="new-library-icon"><Books size={20} weight="regular" /></span>
          <div>
            <p>知识空间</p>
            <h2 id="new-library-title">新建知识库</h2>
          </div>
          <button className="new-library-close" type="button" onClick={onClose} aria-label="关闭新建知识库">×</button>
        </header>
        <p className="new-library-description">为一个长期项目、客户或主题建立独立的知识空间。</p>
        <div className="new-library-fields">
          <label>
            <span>知识库名称</span>
            <input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：客户项目库" required />
          </label>
          <label>
            <span>说明 <em>选填</em></span>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="例如：客户项目资料和访谈纪要" rows={3} />
          </label>
        </div>
        <p className="new-library-note">创建后会显示在左侧知识库列表中。</p>
        <footer>
          <button type="button" className="new-library-cancel" onClick={onClose}>取消</button>
          <button type="submit" className="new-library-submit" disabled={!name.trim()}><Plus size={15} weight="bold" />创建知识库</button>
        </footer>
      </form>
    </div>
  );
}

function EditLibraryDialog({ name, description, onClose, onSave }: { name: string; description: string; onClose: () => void; onSave: (name: string, description: string) => void }) {
  const [editName, setEditName] = useState(name);
  const [editDescription, setEditDescription] = useState(description);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = editName.trim();
    if (!trimmedName) return;
    onSave(trimmedName, editDescription.trim());
  };

  return (
    <div className="new-library-overlay" role="presentation" onMouseDown={onClose}>
      <form className="new-library-dialog" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="edit-library-title">
        <header>
          <span className="new-library-icon"><Books size={20} weight="regular" /></span>
          <div>
            <p>知识空间</p>
            <h2 id="edit-library-title">编辑知识库</h2>
          </div>
          <button className="new-library-close" type="button" onClick={onClose} aria-label="关闭编辑知识库">×</button>
        </header>
        <p className="new-library-description">修改知识库的名称和说明。</p>
        <div className="new-library-fields">
          <label>
            <span>知识库名称</span>
            <input autoFocus value={editName} onChange={(event) => setEditName(event.target.value)} placeholder="例如：客户项目库" required />
          </label>
          <label>
            <span>说明 <em>选填</em></span>
            <textarea value={editDescription} onChange={(event) => setEditDescription(event.target.value)} placeholder="例如：客户项目资料和访谈纪要" rows={3} />
          </label>
        </div>
        <p className="new-library-note">修改后会立即生效。</p>
        <footer>
          <button type="button" className="new-library-cancel" onClick={onClose}>取消</button>
          <button type="submit" className="new-library-submit" disabled={!editName.trim()}>保存修改</button>
        </footer>
      </form>
    </div>
  );
}

function ClearLibraryDialog({ libraryName, onClose, onConfirm }: { libraryName: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="new-library-overlay" role="presentation" onMouseDown={onClose}>
      <div className="new-library-dialog" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="clear-library-title">
        <header>
          <span className="new-library-icon"><Books size={20} weight="regular" /></span>
          <div>
            <p>知识空间</p>
            <h2 id="clear-library-title">清空知识库</h2>
          </div>
          <button className="new-library-close" type="button" onClick={onClose} aria-label="关闭">×</button>
        </header>
        <p className="new-library-description">确定要清空「{libraryName}」中的全部内容吗？清空后知识库名称和设置会保留，你可以重新导入资料。</p>
        <p className="new-library-note">此操作不可撤销。</p>
        <footer>
          <button type="button" className="new-library-cancel" onClick={onClose}>取消</button>
          <button type="button" className="new-library-submit library-clear-confirm" onClick={onConfirm}>确认清空</button>
        </footer>
      </div>
    </div>
  );
}

function PlansPanel({ onClose, onAction }: { onClose: () => void; onAction: (message: string) => void }) {
  const [period, setPeriod] = useState<"month" | "half" | "year">("month");
  const displayedPrices = {
    month: {
      pro: { total: "$19.90", term: "/ 月", note: "按月支付，随时取消" },
      ultra: { total: "$69", term: "/ 月", note: "按月支付，随时取消" },
      team: { total: "$199", term: "/ 月", note: "按月支付，随时取消" },
    },
    half: {
      pro: { total: "$35.82", term: "/ 2 个月", note: "折合 $17.91 / 月" },
      ultra: { total: "$124.20", term: "/ 2 个月", note: "折合 $62.10 / 月" },
      team: { total: "$358.20", term: "/ 2 个月", note: "折合 $179.10 / 月" },
    },
    year: {
      pro: { total: "$167.16", term: "/ 年", note: "折合 $13.93 / 月" },
      ultra: { total: "$579.60", term: "/ 年", note: "折合 $48.30 / 月" },
      team: { total: "$1671.60", term: "/ 年", note: "折合 $139.30 / 月" },
    },
  }[period];

  return (
    <div className="plans-overlay" role="presentation" onMouseDown={onClose}>
      <section className="plans-panel" role="dialog" aria-modal="true" aria-labelledby="plans-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="plans-close" onClick={onClose} aria-label="关闭套餐与额度">×</button>
        <header className="plans-heading">
          <p>套餐与额度</p>
          <h1 id="plans-title">基础套餐 + 通用积分，按需使用知识能力</h1>
          <span>基础存储与通用积分组合使用；知识处理、全网检索与 MCP 读取统一按积分兑换，额度用完后可单独加购。</span>
        </header>

        <div className="plans-period" role="tablist" aria-label="计费周期">
          <button className={period === "month" ? "active" : ""} onClick={() => setPeriod("month")} role="tab" aria-selected={period === "month"}>月付</button>
          <button className={period === "half" ? "active" : ""} onClick={() => setPeriod("half")} role="tab" aria-selected={period === "half"}>双月包 <em>-10%</em></button>
          <button className={period === "year" ? "active" : ""} onClick={() => setPeriod("year")} role="tab" aria-selected={period === "year"}>连续包年 <em>-30%</em></button>
        </div>

        <div className="plans-grid">
          <article className="plan-card pro">
            <header><span><Books size={21} weight="regular" /></span><div><h2>Pro</h2><p>知识管理与应用</p></div></header>
            <strong className="plan-audience">适合 学生、顾问、个人专家</strong>
            <p className="plan-suited">把分散资料重构成可管理、可追溯、可被 AI 使用的个人知识。</p>
            <div className="plan-price"><strong>{displayedPrices.pro.total}</strong><span>{displayedPrices.pro.term}</span></div>
            <p className="plan-billing">{displayedPrices.pro.note}</p>
            <div className="plan-rows"><span>存储空间 <strong>1GB</strong></span><span>知识积分 <strong>1,500 / 月</strong></span><span>全网检索 <strong>50 次 / 月</strong></span><span>MCP 读取 <strong>5,000 次 / 月</strong></span></div>
            <div className="plan-capabilities"><h3>核心能力</h3><span><Check size={15} />多来源知识生成与引用</span><span><Check size={15} />基于个人知识的 Ask</span><span><Check size={15} />模型调用与内容应用</span><span><Check size={15} />基础知识质检</span><span><Check size={15} />只读 MCP 接入</span></div>
            <button className="plan-secondary" onClick={() => onAction("Pro 套餐选择流程已准备好")}>选择 Pro</button>
          </article>

          <article className="plan-card ultra featured">
            <header><span><Sparkle size={21} weight="regular" /></span><div><h2>Ultra</h2><p>知识进化与传播</p></div><em>推荐</em></header>
            <strong className="plan-audience">适合 创始人、自媒体、行业专家</strong>
            <p className="plan-suited">让知识持续学习、扩展，并转化成可以分享和复用的专业影响力。</p>
            <div className="plan-price"><strong>{displayedPrices.ultra.total}</strong><span>{displayedPrices.ultra.term}</span></div>
            <p className="plan-billing">{displayedPrices.ultra.note}</p>
            <div className="plan-rows"><span>存储空间 <strong>5GB</strong></span><span>知识积分 <strong>5,500 / 月</strong></span><span>全网检索 <strong>300 次 / 月</strong></span><span>MCP 读取 <strong>30,000 次 / 月</strong></span></div>
            <div className="plan-capabilities"><h3>核心能力</h3><span><Check size={15} />包含全部 Pro 能力</span><span><Check size={15} />全网知识扩展</span><span><Check size={15} />知识点挖掘与自动学习</span><span><Check size={15} />高级模型与批量应用</span><span><Check size={15} />公开及私密知识分享</span></div>
            <button className="plan-primary" onClick={() => onAction("Ultra 套餐选择流程已准备好")}>选择 Ultra</button>
          </article>

          <article className="plan-card team">
            <header><span><ShieldCheck size={21} weight="regular" /></span><div><h2>Team</h2><p>知识协同与治理</p></div></header>
            <strong className="plan-audience">适合 5–20 人专业团队</strong>
            <p className="plan-suited">让团队共同生产、确认和调用同一套可信知识，并保留完整协作记录。</p>
            <div className="plan-price"><strong>{displayedPrices.team.total}</strong><span>{displayedPrices.team.term}</span></div>
            <p className="plan-billing">{displayedPrices.team.note}</p>
            <div className="plan-rows"><span>存储空间 <strong>50GB</strong></span><span>知识积分 <strong>15,000 / 月</strong></span><span>全网检索 <strong>1,000 次 / 月</strong></span><span>MCP 读取 <strong>150,000 次 / 月</strong></span></div>
            <div className="plan-capabilities"><h3>核心能力</h3><span><Check size={15} />包含全部 Ultra 能力</span><span><Check size={15} />共享知识库与成员权限</span><span><Check size={15} />质检任务和审核流程</span><span><Check size={15} />团队应用与额度管理</span><span><Check size={15} />调用记录与操作日志</span></div>
            <button className="plan-secondary" onClick={() => onAction("Team 套餐选择流程已准备好")}>选择 Team</button>
          </article>
        </div>

        <footer className="enterprise-plan"><span><strong>Enterprise · 企业知识基础设施</strong><small>面向需要私有部署、SSO、完整审计、专属模型策略和数据主权的组织。</small></span><button onClick={() => onAction("企业顾问联系入口已打开")}>联系企业顾问</button></footer>

        <section className="plan-comparison" aria-labelledby="plan-comparison-title">
          <header><div><p>能力对比</p><h2 id="plan-comparison-title">版本差异不只在额度</h2></div><span>Pro 管理和应用知识，Ultra 让知识进化，Team 让知识协同运转。</span></header>
          <div className="plan-comparison-table" role="table" aria-label="套餐能力对比">
            <div className="plan-comparison-row head" role="row"><strong>核心能力</strong><strong>Pro</strong><strong>Ultra</strong><strong>Team</strong></div>
            <div className="plan-comparison-row" role="row"><strong>多来源知识重构</strong><span className="included"><Check size={15} />包含</span><span className="included"><Check size={15} />包含</span><span className="included"><Check size={15} />包含</span></div>
            <div className="plan-comparison-row" role="row"><strong>来源引用与版本管理</strong><span className="included"><Check size={15} />包含</span><span className="included"><Check size={15} />包含</span><span className="included"><Check size={15} />包含</span></div>
            <div className="plan-comparison-row" role="row"><strong>知识 Ask 与模型调用</strong><span>标准</span><span>高级与自动路由</span><span>团队模型策略</span></div>
            <div className="plan-comparison-row" role="row"><strong>内容应用</strong><span>基础应用</span><span>高级与批量应用</span><span>团队应用模板</span></div>
            <div className="plan-comparison-row" role="row"><strong>知识质检</strong><span>基础检查</span><span>深度检查</span><span>任务分配与审核</span></div>
            <div className="plan-comparison-row" role="row"><strong>全网知识扩展</strong><span>手动检索</span><span>自动扩展</span><span>团队扩展策略</span></div>
            <div className="plan-comparison-row" role="row"><strong>知识点挖掘与自动学习</strong><span>—</span><span className="included"><Check size={15} />包含</span><span className="included"><Check size={15} />包含</span></div>
            <div className="plan-comparison-row" role="row"><strong>知识库分享</strong><span>—</span><span>公开、私密、密码保护</span><span>内部与外部分享</span></div>
            <div className="plan-comparison-row" role="row"><strong>成员权限与共享空间</strong><span>—</span><span>—</span><span className="included"><Check size={15} />包含</span></div>
            <div className="plan-comparison-row" role="row"><strong>调用记录与操作日志</strong><span>个人记录</span><span>高级记录</span><span>团队审计</span></div>
          </div>
        </section>
      </section>
    </div>
  );
}

function ProfileCenterPanel({
  onClose,
  onAction,
  theme,
  onThemeChange,
}: {
  onClose: () => void;
  onAction: (message: string) => void;
  theme: "light";
  onThemeChange: (theme: "light") => void;
}) {
  const saveContact = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onAction("联系方式已保存");
  };

  const updatePassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onAction("密码修改已提交");
  };

  return (
    <div className="profile-center-overlay" role="presentation" onMouseDown={onClose}>
      <section className="profile-center-panel" role="dialog" aria-modal="true" aria-labelledby="profile-center-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="profile-center-close" onClick={onClose} aria-label="关闭个人中心">×</button>
        <header className="profile-center-heading">
          <div><p>ACCOUNT</p><h1 id="profile-center-title">个人中心</h1><span>管理账户资料、安全设置与界面偏好。</span></div>
          <button type="button" onClick={() => onAction("Demo 中未执行退出登录")}>退出登录</button>
        </header>

        <div className="profile-center-body">
          <section className="profile-summary" aria-label="账户概览">
            <article><span><House size={20} weight="regular" /></span><div><strong>Jowelin</strong><small>用户名</small></div></article>
            <article><span><ShieldCheck size={20} weight="regular" /></span><div><strong>owner</strong><small>权限</small></div></article>
            <article><span><FolderOpen size={20} weight="regular" /></span><div><strong>126 MB</strong><small>已用空间</small></div></article>
            <article><span><Books size={20} weight="regular" /></span><div><strong>200 MB</strong><small>空间配额</small></div></article>
          </section>

          <div className="profile-center-grid">
            <section className="profile-card account-details">
              <header><h2>账号信息</h2><p>账户标识与最近登录状态</p></header>
              <dl>
                <div><dt>显示名</dt><dd>Jowelin</dd></div>
                <div><dt>邮箱</dt><dd>owner@knowforge.local</dd></div>
                <div><dt>电话</dt><dd className="muted">未填写</dd></div>
                <div><dt>UUID</dt><dd>user:knowforge-demo-jowelin</dd></div>
                <div><dt>状态</dt><dd><em>active</em></dd></div>
                <div><dt>最近登录</dt><dd>2026-08-03 05:49</dd></div>
              </dl>
            </section>

            <form className="profile-card profile-contact" onSubmit={saveContact}>
              <header><h2>联系方式</h2><p>用于账号找回与重要通知</p></header>
              <label><span>邮箱</span><input type="email" defaultValue="owner@knowforge.local" placeholder="you@example.com" /></label>
              <label><span>电话</span><input type="tel" placeholder="手机号码" /></label>
              <button type="submit">保存联系方式</button>
              <small>修改后立即生效，我们不会公开这些信息。</small>
            </form>
          </div>

          <div className="profile-center-grid profile-settings-grid">
            <form className="profile-card profile-password" onSubmit={updatePassword}>
              <header><h2>修改密码</h2><p>建议定期更新账户密码</p></header>
              <label><span>当前密码</span><input type="password" placeholder="输入当前密码" /></label>
              <label><span>新密码</span><input type="password" placeholder="至少 8 位字符" /></label>
              <button type="submit"><LockSimple size={16} weight="regular" />修改密码</button>
            </form>

            <section className="profile-card profile-appearance">
              <header><h2>外观</h2><p>选择适合当前环境的界面主题</p></header>
              <div className="profile-theme-options" role="group" aria-label="界面主题">
                <button type="button" className="active"><span>浅色</span><small>明亮、清晰</small></button>
              </div>
              <small>当前为浅色主题。</small>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}

function WorkspaceDashboard({ onOpenLibrary, onNewLibrary, onOpenImport, onAction }: { onOpenLibrary: () => void; onNewLibrary: () => void; onOpenImport: () => void; onAction: (message: string) => void }) {
  const [librarySearch, setLibrarySearch] = useState("");
  const stats = [
    { label: "知识库", value: "12", icon: Books },
    { label: "原始文件", value: "1,792", icon: FileText },
    { label: "已用空间", value: "126 MB", icon: FolderOpen },
    { label: "资源包", value: "8", icon: Package },
  ];
  const recentOperations = [
    { title: "我的20年工作档案", action: "导入 18 份资料，正在重构", detail: "研究整理员处理中 · 72%", meta: "今天 10:42", total: "1,284 个文件", current: true },
    { title: "产品研究资料库", action: "查看知识页《2026 行业趋势报告》", detail: "引用覆盖 85% · 31 篇知识页", meta: "昨天 21:05", total: "248 个文件", current: false },
    { title: "客户项目库", action: "确认 3 条待确认引用", detail: "合同与报价证据链 · 待确认剩 2 项", meta: "昨天 16:40", total: "86 个文件", current: false },
    { title: "课程与论文资料库", action: "导入 6 份 PDF 论文", detail: "已生成 2 篇知识页", meta: "8 月 11 日", total: "174 个文件", current: false },
    { title: "个人内容素材库", action: "用 Ask 生成选题大纲", detail: "基于 12 条长期观点", meta: "8 月 10 日", total: "132 个文件", current: false },
  ];
  const visibleLibraries = recentOperations.filter((record) => `${record.title}${record.action}${record.detail}`.toLowerCase().includes(librarySearch.trim().toLowerCase()));

  return (
    <div className="workspace-hub" id="workspace">
      <section className="workspace-progress-card">
        <header className="workspace-hub-heading">
          <div><span>KNOWLEDGE WORKSPACE</span><h1>知识库变化与进度</h1><p>查看所有知识库的规模、知识页产出和最近一次更新。</p></div>
          <div className="workspace-hub-actions">
            <button className="workspace-import-button" onClick={onOpenImport}><UploadSimple size={18} weight="bold" />导入资料</button>
          </div>
        </header>

        <div className="workspace-hub-stats" aria-label="全部知识库指标">
          {stats.map((stat) => (
            <article key={stat.label}>
              <div><span>{stat.label}</span><strong>{stat.value}</strong></div>
              <stat.icon size={24} weight="regular" />
            </article>
          ))}
        </div>
      </section>

      <section className="workspace-libraries-card">
        <header className="workspace-libraries-heading">
          <div><span>RECENT ACTIVITY</span><h2>最近操作</h2></div>
          <button onClick={onNewLibrary}><Plus size={18} weight="regular" />新建知识库</button>
        </header>

        <div className="workspace-library-toolbar">
          <span>最近 7 天 · 5 条记录</span>
          <label><MagnifyingGlass size={17} weight="regular" /><input value={librarySearch} onChange={(event) => setLibrarySearch(event.target.value)} placeholder="搜索操作记录" aria-label="搜索操作记录" /></label>
        </div>

        <div className="workspace-library-list" aria-label="最近操作记录">
          {visibleLibraries.map((record) => (
            <button className={record.current ? "current" : ""} key={`${record.title}-${record.meta}`} onClick={() => record.current ? onOpenLibrary() : onAction(`已打开「${record.title}」的${record.action}`)}>
              <span className="workspace-library-icon"><Books size={21} weight="regular" /></span>
              <span className="workspace-library-copy"><strong>{record.title}</strong><small>{record.action}</small><em>{record.detail} · {record.meta}</em></span>
              <span className="workspace-library-state count">{record.total}</span>
              <CaretRight size={18} weight="bold" />
            </button>
          ))}
          {visibleLibraries.length === 0 && <div className="workspace-library-empty">没有找到匹配的操作记录</div>}
        </div>
      </section>
    </div>
  );
}

function LegacyKnowForgeHome({ onEnter }: { onEnter: () => void }) {
  const compilationSteps = [
    { icon: UploadSimple, title: "导入原始资料", detail: "PDF / Word / Excel / 图片 / 代码目录" },
    { icon: TreeStructure, title: "抽取实体与关系", detail: "切分、识别、建图，可断点续跑" },
    { icon: FileText, title: "生成带出处的知识文档", detail: "按主题社区自顶向下组织" },
    { icon: LockSimple, title: "打包给 Agent 只读调用", detail: "UUID 授权、检索、溯源、下载原件" },
  ];
  const capabilities = [
    { icon: LinkSimple, title: "原文可追溯", detail: "每段结论都标注它来自哪个文件、哪一段，点开即可回到原文，不让模型凭记忆复述。" },
    { icon: TreeStructure, title: "知识图谱而非摘要", detail: "抽取实体与关系并按社区结构聚成主题，把散落在多份资料里描述同一件事的内容合到一起。" },
    { icon: ListBullets, title: "结构化导航", detail: "标题即知识点：目录、知识点与图谱关联内容，把整个知识库串成可浏览的结构。" },
    { icon: Robot, title: "给 Agent 只读调用", detail: "打包成资源包，用 UUID 授权外部 Agent 检索、溯源与下载原件，不允许写入或删除。" },
  ];

  return (
    <div className="kf-home">
      <header className="kf-home-header">
        <a href="#home" className="kf-home-brand" aria-label="Metask Mind 首页">
          <BrandMark />
          <span><strong>Metask Mind</strong><small>AI 知识重构工作台</small></span>
        </a>
        <button className="kf-home-enter" onClick={onEnter}>进入工作台 <ArrowRight size={15} weight="bold" /></button>
      </header>

      <main>
        <section className="kf-home-hero" id="home">
          <div className="kf-home-hero-copy">
            <p>PERSONAL KNOWLEDGE HUB</p>
            <h1>把分散资料，重构成能查、能问、能追溯的知识库</h1>
            <div>Metask Mind 接收 PDF、Word、Excel、图片和代码目录，不做逐篇摘要，而是抽取实体与关系建成知识图谱，再按主题写出<strong>每段都标注出处</strong>的知识文档，并可打包授权给 Agent 只读调用。</div>
            <button className="kf-home-primary" onClick={onEnter}>进入工作台 <ArrowRight size={16} weight="bold" /></button>
          </div>

          <article className="kf-home-compiler" aria-label="知识编译流程">
            <header><span>KNOWLEDGE COMPILATION</span><strong>4 步</strong></header>
            <div className="kf-home-step-list">
              {compilationSteps.map((step, index) => (
                <div className="kf-home-step" key={step.title}>
                  <span><step.icon size={20} weight="regular" /></span>
                  <div><small>0{index + 1}</small><strong>{step.title}</strong><p>{step.detail}</p></div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="kf-home-capabilities" id="capabilities">
          <header>
            <p>CORE CAPABILITIES</p>
            <h2>先说清楚它到底解决什么问题</h2>
          </header>
          <div className="kf-home-card-grid">
            {capabilities.map((capability) => (
              <article key={capability.title}>
                <span><capability.icon size={20} weight="regular" /></span>
                <h3>{capability.title}</h3>
                <p>{capability.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="kf-home-cta">
          <div><span>从资料到可信知识</span><h2>创建知识库，开始重构你的长期知识资产</h2><p>创建知识库 / 上传资料 / 生成图谱与总结 / 阅读与提问 / 打包分享</p></div>
          <button className="kf-home-enter" onClick={onEnter}>进入工作台 <ArrowRight size={15} weight="bold" /></button>
        </section>
      </main>

      <footer className="kf-home-footer"><span>Metask Mind</span><small>把原始资料编译为可持续使用的可信知识。</small></footer>
    </div>
  );
}

function KnowForgeLanding({ onEnter }: { onEnter: () => void }) {
  const capabilities = [
    { icon: LinkSimple, index: "01", title: "原文可追溯", detail: "结论、引用与原始文件保持连接。" },
    { icon: TreeStructure, index: "02", title: "关系可理解", detail: "从资料堆中识别实体、事件与关系。" },
    { icon: ListBullets, index: "03", title: "知识可浏览", detail: "把内容重构成长期维护的知识页面。" },
    { icon: Robot, index: "04", title: "能力可调用", detail: "通过 Ask 与只读 MCP 安全交付给 AI。" },
  ];

  return (
    <div className="kf-home">
      <header className="kf-home-header">
        <a href="#home" className="kf-home-brand" aria-label="Metask Mind 首页">
          <BrandMark />
          <span><strong>Metask Mind</strong><small>AI 知识重构工作台</small></span>
        </a>
        <nav className="kf-home-nav" aria-label="首页导航">
          <a href="#workflow">工作方式</a><a href="#scenarios">使用场景</a><a href="#capabilities">产品能力</a><a href="#mcp">MCP</a>
        </nav>
        <button className="kf-home-enter" onClick={onEnter}>进入工作台<ArrowRight size={15} weight="bold" /></button>
      </header>

      <main>
        <section className="kf-home-hero" id="home">
          <div className="kf-home-hero-copy">
            <p>KNOWLEDGE, COMPILED</p>
            <h1>把分散资料<br />重构成可信知识</h1>
            <div>Metask Mind 把文档、网页、会议纪要与代码仓库重构为可追溯、可复用、可被 AI 安全调用的长期知识资产。</div>
            <div className="kf-home-hero-actions">
              <button className="kf-home-primary" onClick={onEnter}>进入工作台<ArrowRight size={16} weight="bold" /></button>
              <a href="#workflow">了解工作方式<ArrowRight size={15} weight="regular" /></a>
            </div>
            <div className="kf-home-formats" aria-label="支持的资料类型"><span>PDF</span><span>Word</span><span>Web</span><span>Markdown</span><span>Repo</span></div>
          </div>
          <div className="kf-home-hero-visual">
            <figure className="kf-home-product-shot kf-home-product-shot-hero"><img src="/latest-agents.png" alt="Metask Mind 智能体工作台" /><figcaption><span>智能体工作台</span><small>给知识一个明确的整理角色</small></figcaption></figure>
            <figure className="kf-home-product-shot kf-home-product-shot-demo"><img src="/latest-import.png" alt="Metask Mind 导入资料工作台" /><figcaption><span>导入资料</span><small>从原始资料开始重构</small></figcaption></figure>
          </div>
        </section>

        <section className="kf-home-statement" id="workflow">
          <div className="kf-home-statement-top"><span>METASK MIND</span><p>让资料从“存过”变成真正能持续使用的知识。</p></div>
          <div className="kf-home-statement-copy"><p>EVIDENCE, NOT MEMORY</p><h2>每条结论<br />都能回到证据现场</h2><div>不是让 AI 凭记忆复述，而是让每段知识保留来源、引用与上下文，随时可以回到原始资料核验。</div></div>
          <figure className="kf-home-generated-visual kf-home-statement-visual"><img src="/knowledge-graph-process.svg" alt="Metask Mind 将原始资料抽取实体与关系，重构成可追溯的知识图谱" /><figcaption><span>KNOWLEDGE GRAPH</span><small>从资料到知识图谱的重构过程</small></figcaption></figure>
          <div className="kf-home-orbit-note"><Sparkle size={17} weight="regular" /><span>此处可补充品牌角色或知识助手插图</span></div>
        </section>

        <section className="kf-home-scenarios" id="scenarios">
          <header className="kf-home-section-heading"><p>ALL-SCENARIO KNOWLEDGE WORKSPACE</p><h2>让每一类资料，都有清晰的去处</h2><span>从个人积累到团队交付，用同一套可信知识底座连接阅读、整理、检索与 AI。</span></header>
          <article className="kf-home-scenario">
            <div className="kf-home-scenario-copy"><span>01 / 个人长期知识库</span><h3>把二十年的资料，整理成今天仍然可用的知识</h3><p>按项目、客户、决策、时间线与方法论重构资料。每条结论保留出处，每次更新都能延续原有上下文。</p><ul><li><Check size={16} />目录与知识页面自动生成</li><li><Check size={16} />引用、健康度与待确认问题</li></ul></div>
            <figure className="kf-home-generated-visual">
              <img src="/latest-workbench.png" alt="Metask Mind 知识库工作台总览" />
              <figcaption><span>KNOWLEDGE WORKSPACE</span><small>真实工作台总览</small></figcaption>
            </figure>
          </article>
          <article className="kf-home-scenario kf-home-scenario-reverse">
            <figure className="kf-home-generated-visual"><img src="/latest-relations.png" alt="Metask Mind 知识页面与关联面板" /><figcaption><span>RELATIONS</span><small>知识点与图谱关联内容</small></figcaption></figure>
            <div className="kf-home-scenario-copy"><span>02 / 研究与内容生产</span><h3>不止于总结文档，更能整合证据与观点</h3><p>智能体按研究角色整理行业报告、论文与访谈资料，优先识别核心结论、关键数据、争议观点和待验证问题。</p><ul><li><Check size={16} />跨来源识别同一主题</li><li><Check size={16} />为报告与内容生产保留证据链</li></ul></div>
          </article>
          <article className="kf-home-scenario" id="mcp">
            <div className="kf-home-scenario-copy"><span>03 / AI 与团队交付</span><h3>把可信知识交给 Agent，而不是再复制一遍上下文</h3><p>通过只读 MCP 把检索、溯源和原件下载能力安全交付给 Codex、Claude 或 Cursor，不开放写入与删除权限。</p><ul><li><Check size={16} />Ask、关联与应用在同一上下文工作</li><li><Check size={16} />只读授权与来源级访问控制</li></ul></div>
            <figure className="kf-home-generated-visual"><img src="/latest-ask.png" alt="Metask Mind 知识页面与 Ask 面板" /><figcaption><span>ASK METASK MIND</span><small>基于当前知识库与引用回答</small></figcaption></figure>
          </article>
        </section>

        <section className="kf-home-capabilities" id="capabilities">
          <header className="kf-home-section-heading kf-home-section-heading-left"><p>CORE CAPABILITIES</p><h2>知识重构的四个基础能力</h2></header>
          <div className="kf-home-capability-strip">
            {capabilities.map((capability) => <article key={capability.title}><div><capability.icon size={22} weight="regular" /></div><small>{capability.index}</small><h3>{capability.title}</h3><p>{capability.detail}</p></article>)}
          </div>
        </section>

        <section className="kf-home-cta"><div><span>READY TO COMPILE?</span><h2>准备好，把资料变成真正可用的知识了吗？</h2><p>创建知识库 / 上传资料 / 重构知识 / 阅读与提问 / 安全调用</p></div><button className="kf-home-primary" onClick={onEnter}>进入工作台<ArrowRight size={16} weight="bold" /></button></section>
      </main>

      <footer className="kf-home-footer"><div><BrandMark /><span><strong>Metask Mind</strong><small>AI 知识重构工作台</small></span></div><nav><a href="#workflow">工作方式</a><a href="#scenarios">使用场景</a><a href="#capabilities">产品能力</a></nav><small>把原始资料编译为可持续使用的可信知识。</small></footer>
    </div>
  );
}

export function KnowForgeDemo() {
  const [theme, setTheme] = useState<"light">("light");
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileCenterOpen, setProfileCenterOpen] = useState(false);
  const [newLibraryOpen, setNewLibraryOpen] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(false);
  const [knowledgeSideTab, setKnowledgeSideTab] = useState<"ask" | "relations" | "apps">("ask");
  const [activeSection, setActiveSection] = useState("overview");
  const [currentView, setCurrentView] = useState<"home" | "docs" | "dashboard" | "import" | "sources" | "graph" | "agents" | "library" | "libraryOverview">("home");
  const [libraryExpanded, setLibraryExpanded] = useState(true);
  const [selectedLibraryGroup, setSelectedLibraryGroup] = useState<LibraryGroupId>("projects");
  const [selectedLibraryPage, setSelectedLibraryPage] = useState<{ groupId: LibraryGroupId; pageId: string } | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<LibraryGroupId, boolean>>({
    projects: true,
    organizations: false,
    decisions: true,
    timeline: false,
    methods: false,
    pending: false,
  });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setMobileNavOpen(false);
        setProfileOpen(false);
        setProfileCenterOpen(false);
        setNewLibraryOpen(false);
        setPlansOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveSection(visible.target.id);
      },
      { rootMargin: "-80px 0px -68%", threshold: [0.05, 0.4] },
    );
    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  };

  const openDocs = (sectionId = "overview") => {
    setSelectedLibraryPage(null);
    setAnswer(false);
    setCurrentView("docs");
    window.setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" }), 0);
  };

  const openLibraryGroup = (groupId: LibraryGroupId) => {
    setSelectedLibraryGroup(groupId);
    setSelectedLibraryPage(null);
    setExpandedGroups((current) => ({ ...current, [groupId]: true }));
    setKnowledgeSideTab("ask");
    setCurrentView("library");
    setMobileNavOpen(false);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  };

  const toggleLibraryGroup = (groupId: LibraryGroupId) => {
    setSelectedLibraryGroup(groupId);
    setSelectedLibraryPage(null);
    setExpandedGroups((current) => ({ ...current, [groupId]: !current[groupId] }));
    setKnowledgeSideTab("ask");
    setCurrentView("library");
    setMobileNavOpen(false);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  };

  const openLibraryOverview = () => {
    setLibraryExpanded(true);
    setSelectedLibraryPage(null);
    setKnowledgeSideTab("ask");
    setCurrentView("libraryOverview");
    setMobileNavOpen(false);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  };

  const openWorkspaceDashboard = () => {
    setTheme("light");
    setSelectedLibraryPage(null);
    setAnswer(false);
    setKnowledgeSideTab("ask");
    setCurrentView("dashboard");
    setMobileNavOpen(false);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  };

  const openLibraryPage = (groupId: LibraryGroupId, pageId: string) => {
    setSelectedLibraryGroup(groupId);
    setSelectedLibraryPage({ groupId, pageId });
    setKnowledgeSideTab("ask");
    setCurrentView("docs");
    setActiveSection("overview");
    setMobileNavOpen(false);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  };

  const activeLibraryGroup = libraryGroups.find((group) => group.id === selectedLibraryGroup) ?? libraryGroups[0];
  const activeLibraryPage = selectedLibraryPage
    ? libraryGroups.find((group) => group.id === selectedLibraryPage.groupId)?.pages.find((page) => page.id === selectedLibraryPage.pageId)
    : null;
  const showPageAssistantTools = currentView === "docs" && Boolean(activeLibraryPage);
  const showAssistant = currentView === "dashboard" || currentView === "libraryOverview" || currentView === "library" || showPageAssistantTools;

  const copyPage = async () => {
    await navigator.clipboard?.writeText(window.location.href);
    showToast("页面链接已复制");
  };

  const submitQuestion = (event: FormEvent) => {
    event.preventDefault();
    if (!question.trim()) return;
    setAnswer(true);
    setQuestion("");
  };

  if (currentView === "home") {
    return <KnowForgeLanding onEnter={openWorkspaceDashboard} />;
  }

  return (
    <div className={`site ${currentView === "dashboard" ? "dashboard-active" : ""}`} data-theme="light">
      <header className="topbar">
        <a className="brand" href="#overview" aria-label="Metask Mind 首页" onClick={(event) => { event.preventDefault(); openDocs(); }}>
          <BrandMark />
          <span>Metask Mind</span>
        </a>

        <div className="top-actions">
          {showAssistant && <button className="icon-button sparkle" onClick={() => { setKnowledgeSideTab("ask"); window.setTimeout(() => document.getElementById("assistant")?.focus(), 0); }} aria-label="询问知识助手">✦</button>}
          <button className="mobile-menu" onClick={() => setMobileNavOpen(!mobileNavOpen)} aria-label="打开导航">☰</button>
        </div>
      </header>

      <aside className={`left-sidebar ${mobileNavOpen ? "open" : ""}`}>
        <div className="sidebar-branding">
          <BrandMark />
          <div><strong>Metask Mind</strong><span>AI 知识重构工作台</span></div>
        </div>
        <button className="sidebar-search" onClick={() => setSearchOpen(true)}>
          <MagnifyingGlass size={17} weight="regular" />
          <span>搜索知识页 / 来源 / 证据</span>
        </button>
        <div className="nav-scroll">
          {navigation.map((group) => (
            <section className="nav-group" key={group.title}>
              <h2>{group.title}</h2>
              <ul>
                {group.items.map((item) => {
                  const isDashboardLink = item.href === "#overview";
                  const isNewLibraryLink = item.href === "#new-library";
                  const isImportLink = item.href === "#pipeline";
                  const isSourcesLink = item.href === "#sources";
                  const isGraphLink = item.href === "#graph";
                  const isAgentsLink = item.href === "#agents";
                  const isActive = currentView === "dashboard" ? isDashboardLink : currentView === "import" ? isImportLink : currentView === "sources" ? isSourcesLink : currentView === "graph" ? isGraphLink : currentView === "agents" ? isAgentsLink : Boolean(item.active);
                  return (
                    <li key={item.label}>
                      <a
                        className={isActive ? "active" : ""}
                        href={isDashboardLink ? "#workspace" : isImportLink ? "#import" : isSourcesLink ? "#sources" : isGraphLink ? "#graph" : isAgentsLink ? "#agents" : item.href}
                        onClick={(event) => {
                          event.preventDefault();
                          setMobileNavOpen(false);
                          if (isDashboardLink) {
                            openWorkspaceDashboard();
                          } else if (isNewLibraryLink) {
                            setTheme("light");
                            setNewLibraryOpen(true);
                          } else if (isImportLink) {
                            setTheme("light");
                            setSelectedLibraryPage(null);
                            setAnswer(false);
                            setCurrentView("import");
                            window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
                          } else if (isSourcesLink) {
                            setTheme("light");
                            setSelectedLibraryPage(null);
                            setAnswer(false);
                            setCurrentView("sources");
                            window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
                          } else if (isGraphLink) {
                            setTheme("light");
                            setSelectedLibraryPage(null);
                            setAnswer(false);
                            setCurrentView("graph");
                            window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
                          } else if (isAgentsLink) {
                            setTheme("light");
                            setSelectedLibraryPage(null);
                            setAnswer(false);
                            setCurrentView("agents");
                            window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
                          } else openDocs(item.href.slice(1));
                        }}
                      >
                        <item.icon className="nav-item-icon" size={18} weight="regular" aria-hidden="true" />
                        <span>{item.label}</span>
                        {item.badge && <em>{item.badge}</em>}
                        {item.count && <small>{item.count}</small>}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          <section className="library-tree" aria-label="知识库">
            <header><h2>知识库</h2><button onClick={() => { setTheme("light"); setMobileNavOpen(false); setNewLibraryOpen(true); }} aria-label="新建知识库"><Plus size={17} weight="regular" /></button></header>

            <div className="library-root">
              <div className={`library-root-row ${currentView === "libraryOverview" ? "is-active" : ""}`}>
                <button className="library-root-toggle" onClick={() => setLibraryExpanded((current) => !current)} aria-expanded={libraryExpanded} aria-label={libraryExpanded ? "收起我的20年工作档案" : "展开我的20年工作档案"}>
                  {libraryExpanded ? <CaretDown size={15} /> : <CaretRight size={15} />}
                </button>
                <Books size={18} weight="regular" />
                <button className="library-root-open" onClick={openLibraryOverview}><strong>我的20年工作档案</strong></button>
                <em>重构中</em>
                <Gear size={16} weight="regular" />
              </div>

              {libraryExpanded && (
                <div className="library-branches">
                  {libraryGroups.map((group) => (
                    <div className="tree-group" key={group.id}>
                      <button
                        className={`tree-group-title ${currentView === "library" && selectedLibraryGroup === group.id ? "is-active" : ""}`}
                        onClick={() => toggleLibraryGroup(group.id)}
                        aria-expanded={expandedGroups[group.id]}
                      >
                        {expandedGroups[group.id] ? <CaretDown size={14} /> : <CaretRight size={14} />}
                        <Folder size={17} weight="regular" />
                        <strong>{group.title}</strong>
                        {group.id === "pending" && <em>{group.pages.length}</em>}
                      </button>
                      {expandedGroups[group.id] && (
                        <div className="tree-children">
                          {group.pages.map((page) => (
                            <button
                              key={page.id}
                              className={currentView === "docs" && selectedLibraryPage?.pageId === page.id ? "is-active" : ""}
                              onClick={() => openLibraryPage(group.id, page.id)}
                            >
                              <FileText size={15} />
                              <span>{page.title}</span>
                              {page.status && <em>{page.status}</em>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="other-libraries">
              {[
                ["公司制度库", "可用"],
                ["客户项目库", "需确认"],
                ["产品方法论库", "可用"],
              ].map(([name, state]) => (
                <button key={name} onClick={() => showToast(`${name}已折叠`)}>
                  <CaretRight size={14} /><Books size={17} weight="regular" /><strong>{name}</strong><em>{state}</em><Gear size={15} weight="regular" />
                </button>
              ))}
            </div>
          </section>
        </div>
        <div className={`workspace-account ${profileOpen ? "open" : ""}`}>
          {profileOpen && (
            <section className="account-popover" role="dialog" aria-label="账户信息">
              <header className="account-profile">
                <span className="account-avatar">J</span>
                <div><strong>Jowelin</strong><small>owner@knowforge.local</small></div>
              </header>

              <div className="account-membership">
                <div><small>当前会员</small><strong>14 天体验</strong></div>
                <em>剩余 9 天</em>
              </div>

              <div className="account-usage">
                <div className="account-usage-row">
                  <div className="account-usage-label"><FileText size={18} weight="regular" /><span>知识积分</span><strong>184 / 300</strong></div>
                  <span className="account-meter"><i style={{ width: "61.33%" }} /></span>
                </div>
                <div className="account-usage-row storage">
                  <div className="account-usage-label"><FolderOpen size={18} weight="regular" /><span>存储空间</span><strong>126 / 200MB</strong></div>
                  <span className="account-meter"><i style={{ width: "63%" }} /></span>
                </div>
              </div>

              <nav className="account-menu" aria-label="账户操作">
                <button onClick={() => { setProfileOpen(false); setProfileCenterOpen(true); }}><House size={19} weight="regular" /><span>个人中心</span></button>
                <button onClick={() => { setProfileOpen(false); setPlansOpen(true); }}><Sparkle size={19} weight="regular" /><span>套餐与额度</span></button>
                <button className="logout" onClick={() => { setProfileOpen(false); showToast("Demo 中未执行退出登录"); }}><ArrowRight size={19} weight="regular" /><span>退出登录</span></button>
              </nav>

              <footer>Metask Mind Demo v0.2.0</footer>
            </section>
          )}

          <button
            className="workspace-chip"
            aria-label="账户菜单"
            aria-expanded={profileOpen}
            onClick={() => setProfileOpen((current) => !current)}
          >
            <span className="avatar">J</span>
            <span className="workspace-user"><strong>Jowelin</strong><small>体验版 · 184 积分</small></span>
            <CaretDown className="workspace-caret" size={17} />
          </button>
        </div>
      </aside>

      {mobileNavOpen && <button className="mobile-scrim" onClick={() => setMobileNavOpen(false)} aria-label="关闭导航" />}

      <main className={`main-shell ${currentView === "dashboard" ? "dashboard-shell" : ""} ${currentView === "import" ? "import-shell" : ""} ${currentView === "sources" ? "sources-shell" : ""} ${currentView === "graph" ? "graph-shell" : ""} ${currentView === "agents" ? "agents-shell" : ""} ${currentView === "library" || currentView === "libraryOverview" ? "library-list-shell" : ""} ${showAssistant ? "knowledge-shell" : ""} ${showPageAssistantTools ? "project-page-shell" : ""}`}>
        {showPageAssistantTools && activeLibraryPage && (
          <aside className="project-directory-panel" aria-label="项目页面目录">
            <header className="project-directory-header">
              <span>项目目录</span>
              <strong>{activeLibraryPage.title}</strong>
            </header>
            <nav className="project-directory-nav" aria-label="页面目录">
              <h2>页面目录</h2>
              <ol>
                {projectSections.map((section, index) => (
                  <li key={section.id}>
                    <a className={activeSection === section.id ? "active" : ""} href={`#${section.id}`} aria-current={activeSection === section.id ? "location" : undefined}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      {section.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>
        )}
        {currentView === "dashboard" ? (
          <WorkspaceDashboard
            onOpenLibrary={openLibraryOverview}
            onNewLibrary={() => setNewLibraryOpen(true)}
            onOpenImport={() => {
              setTheme("light");
              setSelectedLibraryPage(null);
              setAnswer(false);
              setMobileNavOpen(false);
              setCurrentView("import");
              window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
            }}
            onAction={showToast}
          />
        ) : currentView === "import" ? (
          <ImportView onAction={showToast} />
        ) : currentView === "sources" ? (
          <SourceFilesView onImport={() => { setCurrentView("import"); window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0); }} />
        ) : currentView === "graph" ? (
          <KnowledgeGraphView />
        ) : currentView === "agents" ? (
          <AgentsView onAction={showToast} />
        ) : currentView === "libraryOverview" ? (
          <LibraryOverviewView onOpenGroup={openLibraryGroup} onAction={showToast} />
        ) : currentView === "library" ? (
          <LibraryGroupView
            group={activeLibraryGroup}
            onOpenPage={(page) => openLibraryPage(activeLibraryGroup.id, page.id)}
          />
        ) : (
          <>
            <div className="content-column">
          <article className="article">
            <header className="article-header" id="overview">
              <p className="eyebrow">{activeLibraryPage ? `我的20年工作档案 / ${activeLibraryGroup.title}` : "知识工作流"}</p>
              <div className="title-row">
                <h1>{activeLibraryPage?.title ?? "把原始资料重构为可信知识"}</h1>
                <div className="page-actions">
                  <button onClick={copyPage}><span aria-hidden="true">▣</span> 复制页面</button>
                  <button className="more" onClick={() => showToast("更多操作即将开放")} aria-label="更多操作">⌄</button>
                </div>
              </div>
              <p className="lede">{activeLibraryPage?.description ?? "Metask Mind 把散落的文档、网页、会议纪要和代码仓库，整理为可追溯、可复用、可被 AI 安全调用的长期知识资产。"}</p>
            </header>

            {activeLibraryPage && (
              <section className="project-summary-panel" aria-labelledby="project-summary-heading">
                <div className="project-summary-heading-row">
                  <div>
                    <p className="project-summary-kicker">AI 项目摘要</p>
                    <h2 id="project-summary-heading">项目总结</h2>
                  </div>
                  <span className="project-summary-updated">基于 {activeLibraryPage.meta}重构</span>
                </div>

                <p className="project-summary-copy">
                  这是一篇由 AI 从项目复盘、会议纪要、方案文档与合同扫描件中重构出的 Knowledge Page。页面保留核心结论、来源引用、相关关系和修订记录，便于快速理解项目全貌并继续追问。
                </p>

                <div className="project-summary-actions" aria-label="项目操作">
                  <button
                    className="primary"
                    type="button"
                    onClick={() => {
                      setKnowledgeSideTab("ask");
                      window.setTimeout(() => document.getElementById("assistant")?.focus(), 0);
                    }}
                  >
                    <Sparkle size={17} weight="duotone" />
                    唤起 Copilot
                  </button>
                  <button type="button" onClick={() => setKnowledgeSideTab("relations")}>
                    <TreeStructure size={17} />
                    查看关联
                  </button>
                  <button type="button" onClick={() => setKnowledgeSideTab("apps")}>
                    <SquaresFour size={17} />
                    应用
                  </button>
                </div>

                <div className="project-summary-metrics" aria-label="项目摘要指标">
                  <article><span>对象类型</span><strong>{activeLibraryGroup.title === "项目" ? "项目" : activeLibraryGroup.title}</strong></article>
                  <article><span>可信度</span><strong>{activeLibraryPage.status ?? "86%"}</strong></article>
                  <article><span>引用覆盖</span><strong>18 / 22 段</strong></article>
                  <article><span>关联节点</span><strong>23 个</strong></article>
                </div>

                <div className="project-conclusions">
                  <h2>核心结论</h2>
                  <div className="project-conclusion-list">
                    <article>
                      <p>2019–2021 年，该项目的主要目标从销售流程线上化，逐步转向跨部门数据协同。</p>
                      <div className="project-reference-tags" aria-label="引用来源"><span>S12</span><span>S18</span></div>
                    </article>
                    <article>
                      <p>项目推进效果高度依赖前期访谈质量、关键负责人共识和阶段性复盘机制。</p>
                      <div className="project-reference-tags" aria-label="引用来源"><span>S03</span><span>S09</span><span>S21</span></div>
                    </article>
                    <article className="warning">
                      <p>合同补充条款可能影响交付范围，但当前扫描件 OCR 置信度偏低，仍需确认。</p>
                      <div className="project-reference-tags" aria-label="引用来源"><span>S27</span></div>
                    </article>
                  </div>
                </div>
              </section>
            )}

            {activeLibraryPage && <h2 className="project-body-heading">重构正文</h2>}

            <section className="prose intro-copy">
              <p>它不只是把每份文件各自做一遍摘要，而是识别其中的项目、客户、决策和方法，将多份来源中属于同一主题的内容合并成稳定的知识页面。</p>
              <p>每个关键结论都保留来源与置信度。你可以直接阅读，也可以通过只读 MCP，让 Codex、Claude 或 Cursor 获得一致的上下文。</p>
            </section>

            <aside className="callout callout-green">
              <span className="callout-icon">✦</span>
              <div><strong>知识不是文件的堆积。</strong><p>Metask Mind 将原始资料视为证据，把重构后的知识页面作为可持续使用的核心资产。</p></div>
            </aside>

            <section className="doc-section" id="pipeline">
              <h2><a href="#pipeline" aria-label="链接到从资料到知识资产">#</a>从资料到知识资产</h2>
              <p>一条清晰的处理链路，将导入、解析、关联和发布连接起来。</p>
              <div className="steps">
                <div className="step-card"><span>01</span><strong>导入资料</strong><p>支持 PDF、Word、网页、Markdown、图片与代码仓库。</p></div>
                <div className="step-card"><span>02</span><strong>识别关系</strong><p>提取实体、事件、决策、时间线与来源之间的联系。</p></div>
                <div className="step-card"><span>03</span><strong>重构知识</strong><p>合并重复信息，保留冲突，并生成可引用的知识页面。</p></div>
              </div>
              <div className="flow-strip" aria-label="知识重构流程">
                <b>Source</b><i>→</i><b>Object</b><i>→</i><b>Knowledge Page</b><i>→</i><b>MCP</b>
              </div>
            </section>

            <section className="doc-section" id="structure">
              <h2><a href="#structure" aria-label="链接到知识结构">#</a>知识结构</h2>
              <p>每一页都以知识对象为核心，而不是按文件名机械生成。结构化字段让人和 AI 都能稳定理解同一份内容。</p>
              <div className="code-card">
                <div className="code-top"><span>knowledge-page.yaml</span><button onClick={() => showToast("示例已复制")}>复制</button></div>
                <pre><code><span className="code-key">type:</span> project{`\n`}<span className="code-key">title:</span> A 公司数字化项目{`\n`}<span className="code-key">confidence:</span> <span className="code-value">high</span>{`\n`}<span className="code-key">sources:</span> 7{`\n`}<span className="code-key">open_questions:</span> 2</code></pre>
              </div>
              <aside className="callout callout-blue">
                <span className="callout-icon">i</span>
                <div><strong>同一事实，只维护一个知识对象。</strong><p>新的来源会补充或挑战当前结论，并形成可审阅的 revision，而不是悄悄覆盖。</p></div>
              </aside>
            </section>

            <section className="doc-section" id="citations">
              <h2><a href="#citations" aria-label="链接到可追溯的证据链">#</a>可追溯的证据链</h2>
              <p>引用是 Metask Mind 的基础能力。搜索结果、AI 回答、图谱关系和知识页面，都能回到原始段落、页码或代码位置。</p>
              <div className="evidence-card">
                <div className="evidence-head"><span className="file-icon">W</span><div><strong>2019_A公司项目复盘.docx</strong><small>第 8 页 · 项目结果</small></div><em>高置信</em></div>
                <blockquote>“首期上线后，交付周期由 12 天缩短至 7 天，核心流程完成标准化。”</blockquote>
                <div className="evidence-foot"><span>支持结论：流程效率提升 41%</span><button onClick={() => showToast("已定位到原文")}>查看原文 ↗</button></div>
              </div>
            </section>

            <section className="doc-section" id="quality">
              <h2><a href="#quality" aria-label="链接到质量与置信度">#</a>质量与置信度</h2>
              <p>系统会持续暴露缺少引用、来源冲突、内容过期和解析质量问题，让不确定性保持可见。</p>
              <div className="status-table" role="table" aria-label="知识质量状态">
                <div className="table-row table-head" role="row"><span>检查项</span><span>状态</span><span>处理方式</span></div>
                <div className="table-row" role="row"><strong>引用覆盖率</strong><span><i className="dot good" />81%</span><span>持续补充</span></div>
                <div className="table-row" role="row"><strong>来源冲突</strong><span><i className="dot warn" />2 项</span><span>等待确认</span></div>
                <div className="table-row" role="row"><strong>低置信结论</strong><span><i className="dot muted" />3 项</span><span>保留标记</span></div>
              </div>
            </section>

            <section className="mcp-card" id="mcp">
              <div><span className="mcp-kicker">READ-ONLY MCP</span><h2>让外部 AI 读取可信上下文</h2><p>统一的搜索、阅读与带引用回答接口，默认不开放写入和删除权限。</p></div>
              <button onClick={() => showToast("MCP 配置已复制")}>复制配置</button>
            </section>

            <footer className="article-footer">
              <p>相关主题</p>
              <div className="topic-links"><a href="#citations">搜索与引用 <span>↗</span></a><a href="#quality">知识质检 <span>↗</span></a><a href="#mcp">MCP 配置 <span>↗</span></a></div>
              <div className="pager"><a href="#overview"><small>上一篇</small><strong>快速开始</strong></a><a href="#pipeline"><small>下一篇</small><strong>导入资料</strong></a></div>
            </footer>
          </article>

        </div>

            {!activeLibraryPage && (
              <aside className="toc" aria-label="本页目录">
                <h2><span>≡</span> 本页目录</h2>
                <ul>
                  {sections.map((section) => (
                    <li key={section.id}><a className={activeSection === section.id ? "active" : ""} href={`#${section.id}`}>{section.label}</a></li>
                  ))}
                </ul>
                <div className="toc-card"><span>知识健康度</span><strong>81%</strong><div><i /></div><small>已连接 24 个来源</small></div>
              </aside>
            )}

          </>
        )}

        {showAssistant && (
          <aside className="knowledge-side-panel" aria-label="知识库辅助面板">
            <div className={`knowledge-side-tabs ${showPageAssistantTools ? "has-page-tools" : ""}`} role="tablist" aria-label="知识库面板切换">
              <button className={knowledgeSideTab === "ask" ? "active" : ""} onClick={() => setKnowledgeSideTab("ask")} role="tab" aria-selected={knowledgeSideTab === "ask"}><Robot size={17} weight="regular" />Ask</button>
              {showPageAssistantTools && <button className={knowledgeSideTab === "relations" ? "active" : ""} onClick={() => setKnowledgeSideTab("relations")} role="tab" aria-selected={knowledgeSideTab === "relations"}><TreeStructure size={17} weight="regular" />关联</button>}
              {showPageAssistantTools && <button className={knowledgeSideTab === "apps" ? "active" : ""} onClick={() => setKnowledgeSideTab("apps")} role="tab" aria-selected={knowledgeSideTab === "apps"}><SquaresFour size={17} weight="regular" />应用</button>}
            </div>

            <div className="knowledge-side-body">
              {knowledgeSideTab === "ask" && (
                <section className="knowledge-ask-panel" aria-label="Ask">
                  <div className="knowledge-chat-user">{currentView === "dashboard" ? "最近有哪些知识库需要关注？" : "这个项目最重要的结论是什么？"}</div>
                  <div className="knowledge-chat-answer">{currentView === "dashboard" ? "当前「我的20年工作档案」正在重构，客户项目库仍有待确认内容。建议先查看 72% 的重构进度，再处理需要确认的知识页。" : "A 公司项目的核心变化是从销售流程线上化转向跨部门数据协同。这个结论主要来自 S12 项目复盘和 S18 会议纪要。"}</div>
                  <div className="knowledge-prompt-list">
                    {["解释这篇文章", "找出不确定结论", "生成会议摘要", "列出引用来源"].map((prompt) => (
                      <button key={prompt} onClick={() => { setQuestion(prompt); window.setTimeout(() => document.getElementById("assistant")?.focus(), 0); }}>{prompt}</button>
                    ))}
                  </div>
                </section>
              )}

              {knowledgeSideTab === "relations" && (
                <section className="knowledge-relations-panel" aria-label="关联">
                  <div className="knowledge-relation-card">
                    <h2>知识点</h2>
                    {["流程线上化", "跨部门数据协同", "阶段性复盘", "合同补充条款"].map((item) => <button key={item}><FileText size={17} weight="regular" />{item}</button>)}
                  </div>
                  <div className="knowledge-relation-card">
                    <h2>图谱关联内容</h2>
                    {["A 公司", "先做流程梳理", "2020 年审批系统范围变更", "数字化咨询方案.pptx"].map((item) => <button key={item}><TreeStructure size={17} weight="regular" />{item}</button>)}
                  </div>
                </section>
              )}

              {knowledgeSideTab === "apps" && (
                <section className="knowledge-apps-panel" aria-label="应用">
                  <button onClick={() => showToast("视频脚本生成能力开发中")}><span><VideoCamera size={20} weight="regular" /></span><div><strong>视频脚本</strong><small>把文档要点整理成口播脚本</small></div></button>
                  <button onClick={() => showToast("长图生成能力开发中")}><span><ImageSquare size={20} weight="regular" /></span><div><strong>长图</strong><small>生成可分享的图文长图</small></div></button>
                  <button onClick={() => showToast("汇报材料生成能力开发中")}><span><PresentationChart size={20} weight="regular" /></span><div><strong>汇报材料</strong><small>输出汇报用的结构化提纲</small></div></button>
                  <p>生成能力开发中，当前为界面预留位。</p>
                </section>
              )}
            </div>

            {knowledgeSideTab === "ask" && (
              <form className="knowledge-ask-form" onSubmit={submitQuestion}>
                <label htmlFor="assistant">向 Metask Mind 提问</label>
                <div>
                  <input id="assistant" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={currentView === "dashboard" ? "询问全部知识库…" : "询问这套知识库…"} aria-label="向 Metask Mind 提问" />
                  <button disabled={!question.trim()} aria-label="发送问题"><ArrowRight size={16} weight="bold" /></button>
                </div>
                <small>{answer
                  ? currentView === "dashboard" ? "回答已基于全部知识库生成" : "回答已基于当前知识库生成"
                  : currentView === "dashboard" ? "基于全部知识库与引用回答" : "基于当前知识库与引用回答"}
                </small>
              </form>
            )}
          </aside>
        )}
      </main>

      {newLibraryOpen && (
        <NewLibraryDialog
          onClose={() => setNewLibraryOpen(false)}
          onCreate={(name) => {
            setNewLibraryOpen(false);
            showToast(`${name}已创建`);
          }}
        />
      )}

      {plansOpen && <PlansPanel onClose={() => setPlansOpen(false)} onAction={showToast} />}

      {profileCenterOpen && (
        <ProfileCenterPanel
          onClose={() => setProfileCenterOpen(false)}
          onAction={showToast}
          theme={theme}
          onThemeChange={setTheme}
        />
      )}

      {searchOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSearchOpen(false)}>
          <section className="search-modal" role="dialog" aria-modal="true" aria-label="搜索 Metask Mind" onMouseDown={(e) => e.stopPropagation()}>
            <div className="search-box"><span>⌕</span><input autoFocus placeholder="搜索知识、页面或来源…" /><kbd>ESC</kbd></div>
            <div className="search-body"><small>快速前往</small>{sections.slice(1).map((section) => <a key={section.id} href={`#${section.id}`} onClick={() => setSearchOpen(false)}><span>⌘</span><div><strong>{section.label}</strong><small>Metask Mind 文档</small></div><em>↗</em></a>)}</div>
          </section>
        </div>
      )}

      {toast && <div className="toast" role="status"><span>✓</span>{toast}</div>}
    </div>
  );
}
