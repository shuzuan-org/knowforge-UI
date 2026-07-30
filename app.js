/* KnowForge 企业知识工作台
   保留真实业务：工作台、上传资料、原始文件、知识图谱、资源包、知识库与用量。
   页面布局为独立设计，不复刻原始参考页骨架。 */
(function(){
  "use strict";

  var currentView = "overview";
  var currentScope = "metask";
  var libraryOpen = false;

  var navItems = [
    {view:"overview",icon:"home",label:"知识库"},
    {view:"agents",icon:"network",label:"智能体"},
    {view:"search",icon:"search",label:"搜索问答"}
  ];

  var scopes = [
    {id:"metask",name:"metask——视觉",docs:11,health:100,description:"品牌视觉、产品界面与应用规范",files:{total:2,pending:0,processing:0,ignored:0,graphed:2}},
    {id:"history",name:"中国历史专题",docs:8,health:96,description:"从先秦文明到现代中国发展",files:{total:2,pending:0,processing:0,ignored:0,graphed:2}},
    {id:"geography",name:"世界地理知识",docs:8,health:94,description:"自然地理、人文地理与区域知识",files:{total:2,pending:0,processing:0,ignored:0,graphed:2}}
  ];

  var viewMeta = {
    overview:{title:"知识库内容"},
    library:{title:"知识库"},
    upload:{title:"导入新资料"},
    sources:{title:"原始文件"},
    graph:{title:"知识图谱"},
    packages:{title:"资源包"},
    agents:{title:"智能体管理"},
    search:{title:"搜索与带引用回答"},
    health:{title:"知识质检"},
    mcp:{title:"只读 MCP 设置"},
    document:{title:"知识页"},
    pages:{title:"知识页列表"},
    home:{title:"知识库工作台"},
    import:{title:"导入资料"},
    product:{title:"产品介绍"},
    login:{title:"登录"},
    register:{title:"注册"},
    profile:{title:"个人中心"},
    pricing:{title:"会员方案"}
  };

  var accountState={
    loggedIn:true,
    name:"Jowelin",
    email:"owner@knowforge.local",
    role:"Owner",
    plan:"14 天体验",
    remainingDays:9,
    points:184,
    pointsTotal:300,
    storageUsed:"126 MB",
    storageTotal:"200 MB"
  };
  var accountMenuOpen=false;
  var accountModalView=null;
  var accountProfileTab="overview";
  var accountBillingCycle="monthly";

  var membershipPlans=[
    {id:"trial",name:"体验版",position:"快速验证个人知识库",price:"免费",storage:"2 GB",points:"1,000 U / 月",search:"基础检索 · 20 次/日",features:["3 个知识库","基础文件解析","基础知识图谱","系统智能体试用"]},
    {id:"pro",name:"专业版",position:"个人研究与专业创作",price:"¥59 / 月",storage:"100 GB",points:"50,000 U / 月",search:"语义检索 · 1,000 次/月",featured:true,features:["无限知识库","高级文件解析","自建智能体","版本与来源追踪"]},
    {id:"ultimate",name:"旗舰版",position:"高强度知识生产者",price:"¥159 / 月",storage:"1 TB",points:"300,000 U / 月",search:"深度检索 · 5,000 次/月",features:["专业版全部能力","多模型智能编排","批量知识加工","优先计算队列"]},
    {id:"team",name:"团队版",position:"小型团队协作与治理",price:"¥399 / 月",storage:"2 TB 共享",points:"1,000,000 U / 月",search:"团队检索 · 20,000 次/月",features:["20 名团队成员","角色与空间权限","团队智能体","协作审阅与发布"]},
    {id:"enterprise",name:"企业版",position:"组织级私有知识基础设施",price:"按需定制",storage:"弹性私有存储",points:"企业积分池",search:"企业检索 SLA",features:["SSO 与组织架构","审计与数据治理","私有化部署","专属模型与服务"]} 
  ];

  var agents=[
    {id:"research",name:"深度研究员",type:"system",category:"研究分析",description:"跨来源检索、证据归纳与研究报告生成。",status:"可用",avatar:"assets/agents/researcher-3d.jpg",scenario:"行业研究、论文阅读、专题调研",direction:"核心结论、关键数据、争议观点、待验证问题",requirements:"不确定内容必须标记置信度，不补写来源中没有的信息。"},
    {id:"librarian",name:"知识管理员",type:"system",category:"知识运维",description:"检查重复内容、来源完整性与知识结构。",status:"可用",avatar:"assets/agents/librarian-3d.jpg",scenario:"知识运维、结构审计、来源治理",direction:"重复内容、缺失引用、结构冲突",requirements:"仅检测与提示，不自动删除或合并。"},
    {id:"writer",name:"内容编译器",type:"system",category:"内容生产",description:"将知识模块编译为文章、方案与演示提纲。",status:"可用",avatar:"assets/agents/writer-3d.jpg",scenario:"内容生产、汇报提纲、知识转写",direction:"核心观点、结构提纲、可传播表达",requirements:"不得改变原始结论，保留来源引用。"},
    {id:"vi-reviewer",name:"品牌规范审阅",type:"custom",category:"业务自动化",description:"根据品牌知识库检查界面与营销物料。",status:"运行中",avatar:"assets/agents/brand-reviewer-3d.jpg",scenario:"品牌审阅、界面合规、物料核查",direction:"品牌色、字体、标志、安全空间",requirements:"仅给出修改建议，不直接修改源文件。"},
    {id:"history-guide",name:"历史学习向导",type:"custom",category:"研究分析",description:"围绕历史专题生成路径、问答与复习任务。",status:"草稿",avatar:"assets/agents/history-guide-3d.jpg",scenario:"专题学习、问答复习、知识路径",direction:"关键事件、因果脉络、可考察点",requirements:"依据知识库内容生成，不补充库外信息。"}
  ];

  var pageRows=[
    {title:"METASK 品牌 VI 系统概述",type:"项目",status:"已确认",confidence:"86%",sources:"7",updated:"今天 10:42"},
    {title:"VI 规范快速开始",type:"主题",status:"已确认",confidence:"91%",sources:"5",updated:"今天 10:36"},
    {title:"品牌视觉识别核心理论框架",type:"主题",status:"需确认",confidence:"72%",sources:"3",updated:"昨天 21:18"},
    {title:"配色与字体规范",type:"资产",status:"已确认",confidence:"88%",sources:"4",updated:"今天 09:54"}
  ];

  var healthIssues=[
    {type:"来源冲突",title:"品牌色主色值在两份文档中存在版本差异",page:"配色与字体规范",severity:"高",action:"查看证据"},
    {type:"缺少引用",title:"元循环辅助符号的几何比例缺少来源依据",page:"主标志与元循环辅助符号",severity:"高",action:"补充来源"},
    {type:"低置信",title:"海报与营销系统深色系列截图 OCR 置信度偏低",page:"海报与营销系统",severity:"中",action:"提交纠错"},
    {type:"解析质量",title:"2 份扫描件 OCR 置信度低于 70%",page:"原始文件",severity:"中",action:"重跑 OCR"}
  ];

  var graphNodes=[
    {label:"METASK",className:"node-primary",x:"50%",y:"20%"},
    {label:"VI 系统概述",className:"node-blue",x:"32%",y:"42%"},
    {label:"视觉识别理论",className:"node-green",x:"68%",y:"42%"},
    {label:"品牌资产",className:"node-amber",x:"50%",y:"61%"},
    {label:"DESIGN.md",className:"node-muted",x:"24%",y:"73%"},
    {label:"metask-design.html",className:"node-muted",x:"75%",y:"73%"}
  ];

  var currentReaderSection="overview";
  var currentDocumentId=null;
  var uploadMode="upload";
  var importState={scope:"metask",agent:"research",method:"file",files:[],text:"",url:""};
  var newLibraryImportMode=false;
  var articleSideTab="toc";
  var agentEditorOpen=false;
  var agentEditing=null;
  var activeAgentFilter="all";
  var activeAgentId="research";
  var agentDockOpen=window.innerWidth>1120;
  var agentConversations={};
  var agentDrafts={};
  var globalSearchQuery="";
  var searchScopeId="all";
  var agentEditingDraft={
    name:"我的知识智能体",avatar:"",
    description:"按照我的工作方式整理资料，并持续沉淀可复用的个人知识。",
    scenario:"个人项目、工作资料与长期知识管理",
    strategy:"按主题和项目归类，合并重复信息，保留关键事实与来源。",
    direction:"核心结论、关键决策、经验方法与待办事项",
    requirements:"保持简洁，无法确认的内容必须明确标记。"
  };
  var readerGroups=[
    {title:"项目概述",open:true,items:[
      {id:"overview",title:"METASK 品牌 VI 系统概述"},
      {id:"quick",title:"VI 规范快速开始"}
    ]},
    {title:"核心理论框架",open:true,items:[
      {id:"theory",title:"品牌视觉识别核心理论框架"}
    ]},
    {title:"品牌视觉识别系统",items:[
      {id:"principles",title:"视觉传达通用原则"},
      {id:"identity",title:"品牌识别构成"}
    ]},
    {title:"品牌资产与标志规范",items:[
      {id:"logo",title:"主标志与元循环辅助符号"},
      {id:"tokens",title:"配色与字体规范"}
    ]},
    {title:"视觉应用规范",items:[
      {id:"marketing",title:"海报与营销系统"},
      {id:"applications",title:"包装与展示系统"}
    ]},
    {title:"产品定位与核心价值",items:[
      {id:"positioning",title:"产品定位与五大价值"}
    ]},
    {title:"安全与企业级保障",items:[
      {id:"security",title:"企业级应用边界"}
    ]}
  ];

  var readerContent={
    overview:{title:"METASK 品牌 VI 系统概述",html:'\
      <p class="reader-lead">Metask 是面向企业智能工作的系统品牌，致力于把分散的知识、任务与流程组织成可执行、可追溯、可持续优化的智能系统。</p>\
      <blockquote>Know-how → Work → Intelligence System<br><strong>从知识，到能力</strong></blockquote>\
      <h3>品牌使命</h3><p>以结构化思维应对复杂任务与未来挑战。可靠的系统源于清晰的结构与持续精进：在秩序中创造确定性，在精确中驱动未来。</p>\
      <div class="concept-grid"><div><strong>Capture Know-how</strong><span>捕捉企业任务、知识与流程中的隐性经验。</span></div><div><strong>Structure Know-how</strong><span>将分散信息转化为可执行智能系统。</span></div><div><strong>Activate Know-how</strong><span>让企业经验进入每一次工作执行。</span></div></div>'},
    quick:{title:"VI 规范快速开始",html:'\
      <h3>从哪里读起</h3><ol><li><strong>先读定位：</strong>理解品牌角色、核心命题与五大价值。</li><li><strong>再看系统构成：</strong>掌握品牌视觉识别系统的总体结构。</li><li><strong>掌握通用原则：</strong>把品牌理念转译为可操作的界面规则。</li><li><strong>深入资产与应用：</strong>按需查阅标志、色彩字体、海报、包装与展示模块。</li></ol>\
      <h3>模块全景</h3><div class="module-map"><strong>METASK VI 系统</strong><span>理论框架</span><span>视觉识别</span><span>品牌资产</span><span>应用规范</span><span>企业保障</span></div>\
      <h3>核心概念速览</h3><ul><li><strong>品牌定位：</strong>企业智能执行系统，而非泛化聊天助手。</li><li><strong>五大核心价值：</strong>稳定、可控、可治理、可连接、可进化。</li><li><strong>主标志：</strong>完整 METASK 组合标志用于正式署名。</li><li><strong>品牌色：</strong>智能紫用于关键动作、智能状态和识别节点。</li></ul>'},
    theory:{title:"品牌视觉识别核心理论框架",html:'\
      <p class="reader-lead">Metask 的视觉语言把复杂输入组织、折叠并提炼为确定的系统输出。</p>\
      <div class="concept-grid"><div><strong>复杂输入</strong><span>来自任务、知识、流程与人的经验。</span></div><div><strong>结构化组织</strong><span>以模块、层级和关系建立秩序。</span></div><div><strong>精确折叠</strong><span>提炼关键变量，降低执行复杂度。</span></div><div><strong>清晰输出</strong><span>形成稳定、可复用的系统结果。</span></div></div>\
      <h3>设计判断</h3><p>所有界面与视觉资产都应体现清晰、稳定、可靠、精确、模块化与持续进化。装饰不能替代信息结构，视觉效果不能削弱操作路径。</p>'},
    principles:{title:"视觉传达通用原则",html:'\
      <h3>层级先于装饰</h3><p>先建立标题、正文、数据、状态和动作层级，再决定颜色与图形。一个页面只设置一个明确的主动作。</p>\
      <h3>紫色是功能信号</h3><p>品牌紫用于主按钮、选中路径、智能能力和实时状态，不作为大面积背景装饰。页面主要空间由白色、柔灰和深墨色承担。</p>\
      <h3>结构保持可扫描</h3><p>采用稳定网格、8px 间距基准、清楚分组和可追溯状态，使用户快速理解对象、关系与下一步操作。</p>'},
    identity:{title:"品牌识别构成",html:'\
      <p class="reader-lead">品牌识别由完整组合标志、辅助符号、色彩、字体、结构网格与应用规则共同构成。</p>\
      <ul><li>完整 METASK 组合标志是唯一正式品牌署名。</li><li>元循环辅助符号用于数字界面、小尺寸图标和特定品牌场景。</li><li>品牌紫负责识别与状态，深墨黑负责权威信息，暖白与建筑灰承担空间层级。</li><li>所有资产必须保持安全空间、最小尺寸和足够对比度。</li></ul>'},
    logo:{title:"主标志与元循环辅助符号",html:'\
      <h3>主标志</h3><p>主标志由几何化字标构成，完整 METASK 组合不可拆分、不可改字距、不可加阴影，也不能超出安全画面。</p>\
      <h3>元循环</h3><p>辅助符号以首字母 M 为基础，融合元循环与任务折叠的思维方式，表达“任务 → 执行 → 沉淀 → 再优化”的循环生成逻辑。</p>\
      <ul><li>左侧代表 Human / Task：人的任务输入与目标发起。</li><li>右侧代表 AI / Intelligence：智能执行、分析与反馈。</li><li>中部节点构成 Meta Layer：人机协同、知识沉淀与持续优化。</li></ul>'},
    tokens:{title:"配色与字体规范",html:'\
      <h3>品牌色</h3><div class="token-row"><span style="--swatch:#8A4ED1">智能紫 #8A4ED1</span><span style="--swatch:#4B2DB5">深紫 #4B2DB5</span><span style="--swatch:#1D1D1F">深墨黑 #1D1D1F</span><span style="--swatch:#F5F1E8">温润骨白 #F5F1E8</span><span style="--swatch:#86868B">建筑暖灰 #86868B</span></div>\
      <h3>字体分工</h3><ul><li>产品 UI：Inter 与 Noto Sans SC。</li><li>数字与数据：IBM Plex Mono。</li><li>英文展示：Eurostile Extended。</li><li>中文展示：优设标题黑、站酷库黑。</li></ul>'},
    marketing:{title:"海报与营销系统",html:'\
      <p class="reader-lead">营销物料分为浅色信息系列与深色技术系列，统一使用完整品牌标志、明确标题层级和受控紫色节点。</p>\
      <h3>浅色系列</h3><p>适用于品牌介绍、业务价值与日常传播。以白色或柔灰为主空间，紫色承担标题重点、功能节点与识别线索。</p>\
      <h3>深色系列</h3><p>适用于技术主题、产品发布与企业级解决方案。深色背景必须保持信息层级和标志对比，光效不得覆盖标题正文。</p>'},
    applications:{title:"包装与展示系统",html:'\
      <h3>包装规范</h3><p>包装正面以完整标志、产品名称和必要信息构成三层结构。紫色只用于识别节点、封签或局部材质工艺，禁止无目的渐变。</p>\
      <h3>展示规范</h3><p>展架、展板与演示文稿使用统一页边距和结构网格；标题、结论与数据应优先，图像位置需预留安全空间。</p>\
      <h3>输出要求</h3><ul><li>印刷物料：CMYK、300 dpi、3 mm 出血。</li><li>数字物料：RGB，按实际显示尺寸输出。</li><li>演示文稿：保持母版层级，不用装饰干扰结论。</li></ul>'},
    positioning:{title:"产品定位与五大价值",html:'\
      <p class="reader-lead">Metask 是企业智能执行系统，让企业经验成为可执行智能，使组织真正拥有对智能的掌控力。</p>\
      <div class="concept-grid"><div><strong>稳定</strong><span>为企业提供可预期的长期智能能力。</span></div><div><strong>可控</strong><span>明确权限、流程、状态与风险边界。</span></div><div><strong>可治理</strong><span>让知识、任务与智能能力可管理。</span></div><div><strong>可连接</strong><span>连接人员、知识、工具与业务流程。</span></div><div><strong>可进化</strong><span>让能力在持续执行中沉淀和升级。</span></div></div>'},
    security:{title:"企业级应用边界",html:'\
      <h3>安全与权限</h3><p>重要操作应提供权限说明、二次确认与可追溯记录。私有数据与组织知识不得用于无授权的外部训练或传播。</p>\
      <h3>可靠输出</h3><p>界面必须明确区分进行中、成功、警告和失败状态；智能生成结果应提供来源、版本与复核入口。</p>\
      <h3>一致交付</h3><p>品牌资产、产品界面与营销物料均遵循同一套标志、色彩、字体和结构规则，确保跨触点识别一致。</p>'}
  };

  function makeKnowledgeArticle(title,lead,points){
    return {title:title,html:'<p class="reader-lead">'+lead+'</p><h3>知识要点</h3><ul>'
      +points.map(function(point){return '<li>'+point+'</li>';}).join("")+'</ul>'};
  }

  var historyGroups=[
    {title:"先秦文明",open:true,items:[{id:"hist_origin",title:"中华文明的起源"},{id:"hist_states",title:"夏商周与诸侯国家"}]},
    {title:"统一帝国",items:[{id:"hist_qinhan",title:"秦汉大一统"},{id:"hist_tang",title:"隋唐制度与社会"}]},
    {title:"宋元明清",items:[{id:"hist_songyuan",title:"宋元经济与文化"},{id:"hist_mingqing",title:"明清国家与世界"}]},
    {title:"近现代史",items:[{id:"hist_modern",title:"近代转型"},{id:"hist_contemporary",title:"现代中国发展"}]}
  ];
  var historyContent={
    hist_origin:makeKnowledgeArticle("中华文明的起源","从新石器时代聚落、农业与区域文化，理解中华文明多元一体格局的形成。",["黄河、长江与辽河流域共同孕育早期文明。","农业定居推动聚落、手工业和社会分工发展。","考古材料与传世文献需要相互印证。"]),
    hist_states:makeKnowledgeArticle("夏商周与诸侯国家","从早期王朝、礼乐制度与分封体系，观察国家形态的演进。",["商代甲骨文记录了成熟文字与国家祭祀。","西周分封与宗法构成政治秩序。","春秋战国竞争推动制度、技术与思想变革。"]),
    hist_qinhan:makeKnowledgeArticle("秦汉大一统","理解中央集权国家的建立、调整与长期影响。",["秦统一文字、度量衡与行政制度。","汉代在郡县基础上调整治理结构。","丝绸之路扩展了跨区域交流。"]),
    hist_tang:makeKnowledgeArticle("隋唐制度与社会","从制度整合、城市生活与对外交流理解隋唐盛世。",["科举制度扩大人才选拔来源。","长安是多元文化汇聚的国际城市。","交通与制度支撑大范围国家治理。"]),
    hist_songyuan:makeKnowledgeArticle("宋元经济与文化","观察商品经济、技术传播与区域联系的深化。",["城市与市场网络持续扩展。","印刷、火药与航海技术加速传播。","元代形成更广阔的欧亚交流网络。"]),
    hist_mingqing:makeKnowledgeArticle("明清国家与世界","理解传统国家治理、社会经济与全球联系。",["统一多民族国家进一步巩固。","白银流通连接国内市场与全球贸易。","制度稳定与转型压力长期并存。"]),
    hist_modern:makeKnowledgeArticle("近代转型","从内外压力与制度探索理解近代中国的转型过程。",["工业化世界体系带来新的挑战。","社会各界持续探索国家与制度变革。","现代民族国家观念逐步形成。"]),
    hist_contemporary:makeKnowledgeArticle("现代中国发展","从国家建设、工业化与社会变迁观察现代发展道路。",["国家治理体系持续发展。","工业化与城市化重塑社会结构。","改革开放推动经济与全球联系深化。"])
  };

  var geographyGroups=[
    {title:"自然地理",open:true,items:[{id:"geo_earth",title:"地球系统与圈层"},{id:"geo_climate",title:"气候与水循环"}]},
    {title:"地貌与生态",items:[{id:"geo_landform",title:"地貌形成过程"},{id:"geo_ecology",title:"生态系统与生物群落"}]},
    {title:"人文地理",items:[{id:"geo_population",title:"人口、城市与迁移"},{id:"geo_economy",title:"产业与区域联系"}]},
    {title:"区域与地图",items:[{id:"geo_regions",title:"世界主要区域"},{id:"geo_map",title:"地图、尺度与空间数据"}]}
  ];
  var geographyContent={
    geo_earth:makeKnowledgeArticle("地球系统与圈层","从大气圈、水圈、岩石圈和生物圈的相互作用理解地球环境。",["圈层之间通过物质循环与能量交换相互连接。","太阳辐射和地球内部能量驱动主要过程。","局部变化可能通过系统反馈影响更大区域。"]),
    geo_climate:makeKnowledgeArticle("气候与水循环","理解热量、水分和大气环流如何塑造不同气候区。",["纬度、海陆位置与地形共同影响气候。","水循环连接海洋、陆地与大气。","极端天气需要结合长期气候背景分析。"]),
    geo_landform:makeKnowledgeArticle("地貌形成过程","从内力与外力共同作用解释山地、平原、河谷和海岸。",["板块运动塑造大尺度地形。","流水、风、冰川和海浪持续侵蚀与堆积。","地貌过程影响资源、聚落与风险分布。"]),
    geo_ecology:makeKnowledgeArticle("生态系统与生物群落","理解气候、地形、土壤与生物之间的空间关系。",["生产者、消费者与分解者构成能量流动。","纬度和海拔影响群落分布。","人类活动会改变生态系统稳定性。"]),
    geo_population:makeKnowledgeArticle("人口、城市与迁移","从人口分布、迁移与城市化观察人地关系。",["自然条件与经济机会影响人口分布。","迁移连接不同区域的劳动力与文化。","城市化需要协调空间、资源与公共服务。"]),
    geo_economy:makeKnowledgeArticle("产业与区域联系","理解农业、工业与服务业的区位选择和网络联系。",["资源、市场、交通和技术共同影响区位。","全球供应链强化区域分工。","数字基础设施正在重塑空间距离。"]),
    geo_regions:makeKnowledgeArticle("世界主要区域","通过自然环境、人口、经济和文化比较世界区域。",["区域划分服务于特定分析目的。","区域内部具有共同性，也存在显著差异。","跨区域联系是理解全球格局的关键。"]),
    geo_map:makeKnowledgeArticle("地图、尺度与空间数据","掌握地图表达、比例尺与空间分析的基本方法。",["比例尺决定信息细节与分析范围。","投影方式会产生不同类型的变形。","空间数据需要关注来源、时间与精度。"])
  };

  var scopeKnowledge={
    metask:{groups:readerGroups,content:readerContent,sources:["DESIGN.md","metask-design-system.html"],packageText:"品牌视觉与产品界面规范"},
    history:{groups:historyGroups,content:historyContent,sources:["中国历史纲要.md","历史年表.pdf"],packageText:"中国历史主题知识与时间线"},
    geography:{groups:geographyGroups,content:geographyContent,sources:["世界地理框架.md","地图数据说明.pdf"],packageText:"自然与人文地理知识体系"}
  };

  function getCurrentScope(){
    return scopes.find(function(scope){return scope.id===currentScope;})||scopes[0];
  }
  function getCurrentKnowledge(){
    return scopeKnowledge[currentScope]||scopeKnowledge.metask;
  }

  var $ = function(selector){return document.querySelector(selector);};
  var $$ = function(selector,root){return Array.from((root||document).querySelectorAll(selector));};

  var icons = {
    home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>',
    upload:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/></svg>',
    archive:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8h18v13H3zM1 3h22v5H1zM10 12h4"/></svg>',
    network:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 7v6M12 13l-5 5M12 13l5 5"/></svg>',
    link:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-2 2"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l2-2"/></svg>',
    doc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
    card:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></svg>',
    folder:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
    search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
    heart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    bot:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 16h.01M16 16h.01"/></svg>',
    key:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/></svg>',
    sparkles:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3z"/></svg>',
    check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>',
    alert:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/><path d="M12 9v4M12 17h.01"/></svg>',
    refresh:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>',
    clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    pencil:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>',
    plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5v14"/></svg>',
    arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17 17 7M7 7h10v10"/></svg>',
    close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    chevron:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>',
    chevronDown:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>',
    list:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    blocks:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>',
    database:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5M3 12a9 3 0 0 0 18 0"/></svg>',
    harddrive:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12H2M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><path d="M6 16h.01M10 16h.01"/></svg>',
    message:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    filecheck:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 15l2 2 4-4"/></svg>',
    globe:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    building:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/></svg>',
    users:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    crown:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zM5 20h14"/></svg>',
    dollar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M9 9.5a2.5 2.5 0 0 1 5 0c0 2-2.5 2.5-5 2.5s-5 .5-5 2.5a2.5 2.5 0 0 0 5 0"/></svg>',
    creditcard:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></svg>',
    mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></svg>',
    logout:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
    folderopen:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/></svg>',
    filetext:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>',
    filearchive:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M10 12v2M10 16v2"/></svg>',
    archive:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8h18v13H3zM1 3h22v5H1zM10 12h4"/></svg>',
    upload:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/></svg>',
    network:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 7v6M12 13l-5 5M12 13l5 5"/></svg>',
    link:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-2 2"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l2-2"/></svg>',
    doc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
    gitbranch:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>'
  };

  function renderNavigation(){
    var knowledgeViews=["library","upload","sources","graph","packages","health","document","pages"];
    $("#mainNav").innerHTML = '<div class="nav-group">'+navItems.map(function(item){
      var active = item.view === currentView||(knowledgeViews.indexOf(currentView)>=0&&item.view==="overview");
      return '<a class="nav'+(active?' active':'')+'" href="#'+item.view+'" data-view="'+item.view+'"'
        +(active?' aria-current="page"':'')+'><span>'+icons[item.icon]+'</span><span>'+item.label+'</span></a>';
    }).join("")+'</div>';
    $$(".nav").forEach(function(node){
      node.addEventListener("click",function(event){
        event.preventDefault();
        if(node.dataset.view==="overview"){
          libraryOpen=false;
          renderScopes();
        }
        if(["upload","sources","graph","packages","document"].indexOf(node.dataset.view)>=0&&!libraryOpen){
          toast("请先选择一个知识库","warn");
          return;
        }
        navigate(node.dataset.view);
      });
    });
  }

  function renderScopes(){
    $("#scopeList").innerHTML = scopes.map(function(scope){
      return '<button type="button" class="scope-item'+(libraryOpen&&scope.id===currentScope?' active':'')+'" data-scope="'+scope.id+'">'
        +icons.folder+'<span>'+scope.name+'</span><span class="scope-count">'+scope.docs+'</span></button>';
    }).join("");
    $(".context-caption").textContent=libraryOpen?"当前知识库":"选择知识库";
    $$(".scope-item").forEach(function(node){
      node.addEventListener("click",function(){
        selectScope(node.dataset.scope);
      });
    });
  }

  function applyTheme(theme){
    var next=theme==="dark"?"dark":"light";
    document.documentElement.setAttribute("data-theme",next);
    try{localStorage.setItem("kf-theme",next);}catch(e){}
  }

  function renderAccountCenter(){
    var host=$("#accountCenterCard");
    if(!host)return;
    var initial=accountState.loggedIn?accountState.name.slice(0,1):"访";
    var subtitle=accountState.loggedIn
      ?accountState.plan+' · 剩余 '+accountState.remainingDays+' 天'
      :"未登录 · 登录后同步额度";
    host.innerHTML='<div class="account-center-card">'
      +'<button type="button" class="account-center-trigger" data-account-menu-toggle aria-expanded="'+(accountMenuOpen?'true':'false')+'">'
        +'<span class="account-avatar">'+initial+'</span>'
        +'<span class="account-center-copy"><strong>'+accountState.name+'</strong><span>'+subtitle+'</span></span>'
        +'<span class="account-chevron">'+(accountMenuOpen?'⌄':'›')+'</span></button>'
      +(accountMenuOpen?templateAccountMenu():"")
      +'</div>';
    var toggle=host.querySelector("[data-account-menu-toggle]");
    if(toggle)toggle.addEventListener("click",function(event){
      event.stopPropagation();
      accountMenuOpen=!accountMenuOpen;
      renderAccountCenter();
    });
    host.querySelectorAll("[data-account-modal]").forEach(function(node){
      node.addEventListener("click",function(event){
        event.stopPropagation();
        openAccountModal(node.dataset.accountModal);
      });
    });
    host.querySelectorAll("[data-account-menu-view]").forEach(function(node){
      node.addEventListener("click",function(event){
        event.stopPropagation();
        accountMenuOpen=false;
        renderAccountCenter();
        navigate(node.dataset.accountMenuView);
      });
    });
    host.querySelectorAll("[data-account-theme]").forEach(function(node){
      node.addEventListener("click",function(event){
        event.stopPropagation();
        applyTheme(node.dataset.accountTheme);
        renderAccountCenter();
      });
    });
    var logout=host.querySelector("[data-account-menu-logout]");
    if(logout)logout.addEventListener("click",function(event){
      event.stopPropagation();
      logoutAccount();
    });
  }

  function templateAccountMenu(){
    if(!accountState.loggedIn){
      return '<div class="account-popover" role="menu">'
        +'<div class="account-popover-guest"><span class="account-avatar">访</span><strong>登录 KnowForge</strong><p>登录后同步知识库、会员版本和剩余额度。</p></div>'
        +'<div class="account-menu-actions"><button data-account-menu-view="login">登录</button><button class="primary" data-account-menu-view="register">注册</button></div></div>';
    }
    var pointsPercent=Math.min(100,Math.round(accountState.points/accountState.pointsTotal*100));
    var storagePercent=accountState.storageTotal==="200 MB"?63:accountState.storageTotal==="1 GB"?12:4;
    var currentTheme=document.documentElement.getAttribute("data-theme")==="dark"?"dark":"light";
    return '<div class="account-popover" role="menu">'
      +'<div class="account-popover-identity"><span class="account-avatar large">'+accountState.name.slice(0,1)+'</span><div><strong>'+accountState.name+'</strong><span>'+accountState.email+'</span></div></div>'
      +'<div class="account-membership-card"><div><span>当前会员</span><strong>'+accountState.plan+'</strong></div><b>剩余 '+accountState.remainingDays+' 天</b></div>'
      +'<div class="account-quota-row"><div><span>'+icons.creditcard+'知识积分</span><strong>'+accountState.points.toLocaleString()+' / '+accountState.pointsTotal.toLocaleString()+'</strong></div><i><b style="width:'+pointsPercent+'%"></b></i></div>'
      +'<div class="account-quota-row"><div><span>'+icons.harddrive+'存储空间</span><strong>'+accountState.storageUsed+' / '+accountState.storageTotal+'</strong></div><i><b style="width:'+storagePercent+'%"></b></i></div>'
      +'<div class="account-theme-setting"><div class="account-theme-label"><span>外观模式</span><small>选择浅色或深色界面</small></div><div class="account-theme-options" role="group" aria-label="外观模式">'
        +'<button type="button" data-account-theme="light" class="'+(currentTheme==="light"?"active":"")+'" aria-pressed="'+(currentTheme==="light")+'">浅色</button>'
        +'<button type="button" data-account-theme="dark" class="'+(currentTheme==="dark"?"active":"")+'" aria-pressed="'+(currentTheme==="dark")+'">深色</button></div></div>'
      +'<div class="account-menu-links">'
        +'<button type="button" data-account-modal="profile">'+icons.user+'<span>个人中心</span></button>'
        +'<button type="button" data-account-modal="pricing">'+icons.crown+'<span>套餐与额度</span></button>'
        +'<button type="button" class="danger" data-account-menu-logout>'+icons.logout+'<span>退出登录</span></button>'
      +'</div></div>';
  }

  function templateAccountProfileModal(){
    var totalPages=scopes.reduce(function(total,scope){return total+scope.docs;},0);
    var profileTabs=[
      {id:"overview",label:"数据概览",description:"知识与调用统计",icon:icons.blocks},
      {id:"profile",label:"编辑资料",description:"身份与默认设置",icon:icons.pencil},
      {id:"workspace",label:"工作区与权限",description:"知识库访问角色",icon:icons.users},
      {id:"security",label:"安全与连接",description:"凭证、审计与通知",icon:icons.shield}
    ].map(function(tab){
      var active=accountProfileTab===tab.id;
      return '<div class="account-profile-tab'+(active?' is-active':'')+'" role="tab" tabindex="0" aria-selected="'+active+'" data-account-profile-tab="'+tab.id+'">'
        +'<span class="account-profile-tab-icon">'+tab.icon+'</span><span><strong>'+tab.label+'</strong><small>'+tab.description+'</small></span></div>';
    }).join("");
    var profilePanel="";
    if(accountProfileTab==="profile"){
      profilePanel='<section class="account-modal-panel account-profile-panel" role="tabpanel"><div class="account-panel-head"><div><h3>编辑资料</h3><p>这些信息用于个人工作区、MCP 审计日志和团队成员展示。</p></div><button type="button" class="primary" data-account-save>保存</button></div>'
        +'<div class="account-form-grid"><label>姓名<input value="'+accountState.name+'"></label><label>邮箱<input value="'+accountState.email+'"></label><label>默认语言<input value="中文"></label><label>默认知识库<input value="我的20年工作档案"></label></div></section>';
    }else if(accountProfileTab==="workspace"){
      profilePanel='<section class="account-modal-panel account-profile-panel" role="tabpanel"><div class="account-panel-head"><div><h3>工作区与权限</h3><p>当前账户可访问的知识库及角色。</p></div></div>'
        +'<div class="workspace-access-list"><div><strong>我的20年工作档案</strong><span>Owner</span><b class="pending">重构中</b></div><div><strong>公司制度库</strong><span>Editor</span><b>可用</b></div><div><strong>客户项目库</strong><span>Viewer</span><b class="pending">需确认</b></div></div></section>';
    }else if(accountProfileTab==="security"){
      profilePanel='<section class="account-modal-panel account-profile-panel" role="tabpanel"><div class="account-panel-head"><div><h3>账户安全与连接</h3><p>管理登录方式、MCP 凭证、调用审计和通知偏好。</p></div></div>'
        +'<div class="security-card-grid"><article>'+icons.mail+'<strong>登录邮箱</strong><span>'+accountState.email+' 已验证</span></article><article>'+icons.key+'<strong>MCP 凭证</strong><span>1 个有效凭证，30 天后过期</span></article><article>'+icons.shield+'<strong>访问审计</strong><span>最近 7 天有 18 次外部 AI 调用</span></article><article>'+icons.message+'<strong>通知偏好</strong><span>健康问题和高风险调用会提醒</span></article></div></section>';
    }else{
      profilePanel='<section class="account-modal-panel account-profile-panel account-overview-panel" role="tabpanel"><div class="account-panel-head"><div><h3>数据概览</h3><p>快速查看个人知识空间的核心数据与待处理事项。</p></div></div>'
        +'<div class="account-profile-stats">'
          +'<article><span class="account-stat-icon">'+icons.database+'</span><div class="account-stat-copy"><span>知识库</span><strong>'+scopes.length+'</strong></div></article>'
          +'<article><span class="account-stat-icon">'+icons.filetext+'</span><div class="account-stat-copy"><span>知识页</span><strong>'+totalPages+'</strong></div></article>'
          +'<article><span class="account-stat-icon">'+icons.key+'</span><div class="account-stat-copy"><span>MCP 调用</span><strong>128</strong></div></article>'
          +'<article><span class="account-stat-icon">'+icons.alert+'</span><div class="account-stat-copy"><span>待确认</span><strong>5</strong></div></article>'
        +'</div></section>';
    }
    return '<div class="account-modal-backdrop" data-account-modal-backdrop>'
      +'<section class="account-modal account-profile-modal" role="dialog" aria-modal="true" aria-label="个人中心">'
        +'<button class="account-modal-close" type="button" data-account-modal-close aria-label="关闭">'+icons.close+'</button>'
        +'<header class="account-profile-hero"><span class="account-avatar xl">'+accountState.name.slice(0,1)+'</span><div><span class="eyebrow">PERSONAL CENTER</span><h2>'+accountState.name+'</h2><p>'+accountState.email+' · '+accountState.role+' · 个人知识库管理员</p></div></header>'
        +'<div class="account-profile-tabs" role="tablist" aria-label="个人中心模块">'+profileTabs+'</div>'
        +profilePanel
      +'</section></div>';
  }

  function templateAccountPricingModal(){
    var billingCycles={
      monthly:{multiplier:1,suffix:"/ 月",points:"1,500 / 月"},
      bimonthly:{multiplier:1.8,suffix:"/ 双月",points:"3,000 / 双月"},
      annual:{multiplier:8.4,suffix:"/ 年",points:"18,000 / 年"}
    };
    var billing=billingCycles[accountBillingCycle]||billingCycles.monthly;
    function formatPrice(value){
      return "¥"+(Math.abs(value-Math.round(value))<0.001?Math.round(value):value.toFixed(2));
    }
    var basePrice=formatPrice(19.9*billing.multiplier);
    var planCards=''
      +'<article class="account-plan-card account-credit-card featured">'
        +'<span class="account-plan-recommend">基础套餐</span>'
        +'<div class="account-plan-title">'+icons.crown+'<div><h3>KnowForge Basic</h3><span>存储与通用积分组合包</span></div></div>'
        +'<strong class="account-plan-fit">适合个人知识管理、研究与日常检索</strong>'
        +'<div class="account-plan-price">'+basePrice+' <small>'+billing.suffix+'</small></div>'
        +'<div class="account-plan-quotas"><div><span>基础存储空间</span><b>1 GB</b></div><div><span>通用积分</span><b>'+billing.points+'</b></div><div><span>套餐权益</span><b>持续有效</b></div><div><span>额度用完后</span><b>支持单独加购</b></div></div>'
        +'<div class="account-plan-features"><strong>基础能力</strong><div class="account-plan-capability-list">'
          +'<span class="account-plan-capability"><b>多来源知识重构</b><em>✓ 包含</em></span>'
          +'<span class="account-plan-capability"><b>来源引用与版本管理</b><em>✓ 包含</em></span>'
          +'<span class="account-plan-capability"><b>知识 Ask 与模型调用</b><em>积分扣减</em></span>'
          +'<span class="account-plan-capability"><b>知识质检</b><em>基础检查</em></span>'
          +'<span class="account-plan-capability"><b>只读 MCP 接入</b><em>✓ 包含</em></span>'
        +'</div></div>'
        +'<button type="button" class="primary" data-account-plan="base">开通基础套餐</button></article>'
      +'<article class="account-plan-card account-credit-card">'
        +'<div class="account-plan-title">'+icons.database+'<div><h3>积分兑换</h3><span>一个积分池覆盖全部用量</span></div></div>'
        +'<strong class="account-plan-fit">按实际使用扣减，不再分别限制固定次数</strong>'
        +'<div class="account-plan-price">统一积分 <small>按次结算</small></div>'
        +'<div class="account-plan-quotas credit-rate-list"><div><span>知识生成与模型调用</span><b>1 积分 = 1 知识积分</b></div><div><span>全网检索</span><b>30 积分 / 次</b></div><div><span>MCP 读取</span><b>1 积分 / 10 次</b></div><div><span>余额提醒</span><b>20% 与 5%</b></div></div>'
        +'<div class="account-plan-features"><strong>扣费原则</strong><div class="account-plan-capability-list">'
          +'<span class="account-plan-capability"><b>未使用服务</b><em>不扣积分</em></span>'
          +'<span class="account-plan-capability"><b>失败的检索或调用</b><em>自动退回</em></span>'
          +'<span class="account-plan-capability"><b>用量记录</b><em>逐笔可查</em></span>'
          +'<span class="account-plan-capability"><b>积分不足</b><em>暂停付费能力</em></span>'
        +'</div></div>'
        +'<button type="button" data-account-credit="rules">查看积分明细</button></article>'
      +'<article class="account-plan-card account-credit-card">'
        +'<div class="account-plan-title">'+icons.plus+'<div><h3>用量加购</h3><span>积分或存储空间可独立购买</span></div></div>'
        +'<strong class="account-plan-fit">加购单价略高于基础套餐，适合临时扩容</strong>'
        +'<div class="account-plan-price">按需购买 <small>即时到账</small></div>'
        +'<div class="account-plan-quotas credit-addon-list"><div><span>通用积分 +1,000</span><b>¥16</b></div><div><span>通用积分 +5,000</span><b>¥75</b></div><div><span>存储空间 +1 GB</span><b>¥8 / 月</b></div><div><span>存储空间 +10 GB</span><b>¥70 / 月</b></div></div>'
        +'<div class="account-plan-features"><strong>加购说明</strong><div class="account-plan-capability-list">'
          +'<span class="account-plan-capability"><b>积分包</b><em>购买后立即生效</em></span>'
          +'<span class="account-plan-capability"><b>存储包</b><em>随基础套餐续费</em></span>'
          +'<span class="account-plan-capability"><b>自动加购</b><em>默认关闭</em></span>'
          +'<span class="account-plan-capability"><b>价格关系</b><em>套餐内更优惠</em></span>'
        +'</div></div>'
        +'<button type="button" data-account-credit="topup">购买加量包</button></article>';
    return '<div class="account-modal-backdrop" data-account-modal-backdrop>'
      +'<section class="account-modal account-pricing-modal" role="dialog" aria-modal="true" aria-label="套餐与额度">'
        +'<button class="account-modal-close" type="button" data-account-modal-close aria-label="关闭">'+icons.close+'</button>'
        +'<header class="account-pricing-head"><div><h2>基础套餐 + 通用积分，按需使用知识能力</h2><p>¥19.9 起获得基础存储和通用积分；知识处理、全网检索与 MCP 读取统一按积分兑换。额度用完后可单独加购，基础套餐始终更优惠。</p></div><div class="billing-switch" aria-label="计费周期">'
          +'<button type="button" data-account-billing="monthly" class="'+(accountBillingCycle==="monthly"?"active":"")+'" aria-pressed="'+(accountBillingCycle==="monthly")+'">月付</button>'
          +'<button type="button" data-account-billing="bimonthly" class="'+(accountBillingCycle==="bimonthly"?"active":"")+'" aria-pressed="'+(accountBillingCycle==="bimonthly")+'">双月包 <span>-10%</span></button>'
          +'<button type="button" data-account-billing="annual" class="'+(accountBillingCycle==="annual"?"active":"")+'" aria-pressed="'+(accountBillingCycle==="annual")+'">连续包年 <span>-30%</span></button></div></header>'
        +'<div class="account-plan-grid">'+planCards+'</div>'
        +'<section class="enterprise-plan"><span>'+icons.building+'</span><div><strong>Enterprise · 企业知识基础设施</strong><p>面向需要私有部署、SSO、完整审计、专属模型策略和数据主权的组织。</p></div><button type="button">联系企业顾问</button></section>'
      +'</section></div>';
  }

  function openAccountModal(view){
    if(!accountState.loggedIn){
      accountMenuOpen=false;
      renderAccountCenter();
      navigate("login");
      return;
    }
    accountMenuOpen=false;
    if(view==="profile")accountProfileTab="overview";
    accountModalView=view;
    renderAccountCenter();
    renderAccountModal();
  }

  function closeAccountModal(){
    accountModalView=null;
    document.body.classList.remove("account-modal-open");
    var host=$("#accountModalHost");
    if(host)host.innerHTML="";
  }

  function renderAccountModal(){
    var host=$("#accountModalHost");
    if(!host)return;
    if(!accountModalView){
      host.innerHTML="";
      document.body.classList.remove("account-modal-open");
      return;
    }
    host.innerHTML=accountModalView==="pricing"?templateAccountPricingModal():templateAccountProfileModal();
    document.body.classList.add("account-modal-open");
    host.querySelectorAll("[data-account-modal-close]").forEach(function(node){node.addEventListener("click",closeAccountModal);});
    var backdrop=host.querySelector("[data-account-modal-backdrop]");
    if(backdrop)backdrop.addEventListener("click",function(event){if(event.target===backdrop)closeAccountModal();});
    host.querySelectorAll("[data-account-save]").forEach(function(node){node.addEventListener("click",function(){toast("个人资料已保存","success");});});
    host.querySelectorAll("[data-account-profile-tab]").forEach(function(node){
      var activateProfileTab=function(){
        accountProfileTab=node.dataset.accountProfileTab;
        renderAccountModal();
      };
      node.addEventListener("click",activateProfileTab);
      node.addEventListener("keydown",function(event){
        if(event.key==="Enter"||event.key===" "){
          event.preventDefault();
          activateProfileTab();
        }
      });
    });
    host.querySelectorAll("[data-account-billing]").forEach(function(node){
      node.addEventListener("click",function(){
        accountBillingCycle=node.dataset.accountBilling;
        renderAccountModal();
      });
    });
    host.querySelectorAll("[data-account-plan]").forEach(function(node){
      node.addEventListener("click",function(){
        var planMap={
          base:{plan:"基础套餐",storage:"1 GB",pointsTotal:1500}
        };
        var next=planMap[node.dataset.accountPlan];
        accountState.plan=next.plan;
        accountState.storageTotal=next.storage;
        accountState.points=next.pointsTotal;
        accountState.pointsTotal=next.pointsTotal;
        accountState.remainingDays=30;
        renderAccountCenter();
        closeAccountModal();
        toast("已切换为 "+next.plan+" 套餐","success");
      });
    });
    host.querySelectorAll("[data-account-credit]").forEach(function(node){
      node.addEventListener("click",function(){
        if(node.dataset.accountCredit==="rules"){
          toast("1 积分可兑换 1 知识积分；全网检索 30 积分/次；MCP 读取 1 积分/10 次","success");
        }else{
          toast("可加购积分包或存储包；单独购买价格略高于基础套餐","success");
        }
      });
    });
  }

  function logoutAccount(){
    accountMenuOpen=false;
    closeAccountModal();
    accountState.loggedIn=false;
    accountState.name="访客用户";
    accountState.email="";
    accountState.role="未登录";
    accountState.plan="体验版";
    accountState.remainingDays=0;
    accountState.points=0;
    accountState.pointsTotal=300;
    accountState.storageUsed="0 B";
    accountState.storageTotal="2 GB";
    renderAccountCenter();
    toast("已退出登录","success");
    navigate("overview");
  }

  function selectScope(scopeId){
    if(!scopeKnowledge[scopeId])return;
    currentScope=scopeId;
    libraryOpen=true;
    var firstGroup=getCurrentKnowledge().groups[0];
    currentReaderSection=firstGroup.items[0].id;
    currentDocumentId=currentReaderSection;
    uploadMode="upload";
    renderScopes();
    navigate("document");
  }

  function startNewLibraryImport(){
    libraryOpen=false;
    importState.method="file";
    importState.files=[];
    importState.text="";
    importState.url="";
    renderScopes();
    navigate("import",{newLibrary:true});
  }

  function navigate(view,options){
    if(!viewMeta[view])return;
    if(view==="search"){
      libraryOpen=false;
      renderScopes();
    }
    if(view==="import")newLibraryImportMode=!!(options&&options.newLibrary);
    if(view==="upload"){
      if(!(options&&options.preserveUploadMode))uploadMode="upload";
      if(libraryOpen){
        newLibraryImportMode=false;
        importState.scope=currentScope;
      }
    }
    currentView=view;
    if(location.hash !== "#"+view)history.replaceState(null,"","#"+view);
    renderNavigation();
    renderView();
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function renderView(){
    var meta=viewMeta[currentView];
    document.body.classList.toggle("overview-view",currentView==="overview");
    document.body.classList.toggle("library-view",currentView==="library");
    document.body.classList.toggle("knowledge-detail-view",libraryOpen&&["library","upload","sources","graph","packages","health","document"].indexOf(currentView)>=0);
    document.body.classList.toggle("immersive-view",["agents","import","product","login","register","profile","pricing","search","health","mcp","document","pages"].indexOf(currentView)>=0);
    document.body.classList.toggle("agent-dock-hidden",["import","product","login","register","profile","pricing"].indexOf(currentView)>=0);
    $("#viewTitle").textContent=currentView==="library"?getCurrentScope().name:meta.title;
    var templates={
      overview:templateOverview,
      library:templateLibraryContents,
      upload:templateUpload,
      sources:templateSources,
      graph:templateGraph,
      packages:templatePackages,
      agents:templateAgents,
      search:templateSearch,
      health:templateHealth,
      mcp:templateMcp,
      document:templateDocument,
      pages:templatePages,
      import:templateImportStudio,
      product:templateProduct,
      login:templateLogin,
      register:templateRegister,
      profile:templateProfile,
      pricing:templatePricing
    };
    var content=templates[currentView]();
    if(libraryOpen&&["library","upload","sources","graph","packages","health","document"].indexOf(currentView)>=0){
      content=templateKnowledgeWorkspace(currentView,content);
    }
    if(agentEditorOpen){
      content=content+templateAgentEditor();
    }
    $("#view").innerHTML=content;
    bindViewActions();
    applySearch($("#globalSearchInput").value);
    renderAgentDock();
  }

  function getSelectedKnowledgeItem(){
    var selectedId=currentDocumentId||currentReaderSection;
    var groups=getCurrentKnowledge().groups;
    for(var groupIndex=0;groupIndex<groups.length;groupIndex++){
      for(var itemIndex=0;itemIndex<groups[groupIndex].items.length;itemIndex++){
        if(groups[groupIndex].items[itemIndex].id===selectedId){
          return groups[groupIndex].items[itemIndex];
        }
      }
    }
    return groups[0].items[0];
  }

  function templateKnowledgeWorkspace(activeView,mainContent){
    var scope=getCurrentScope();
    var selected=getSelectedKnowledgeItem();
    var tabs=[
      {view:"document",icon:"filetext",label:"知识页"},
      {view:"graph",icon:"network",label:"知识图谱"},
      {view:"packages",icon:"link",label:"资源包"},
      {view:"sources",icon:"archive",label:"原始文件"},
      {view:"health",icon:"heart",label:"知识质检"},
      {view:"upload",icon:"upload",label:"导入新资料"}
    ];
    var contentTree=getCurrentKnowledge().groups.map(function(group){
      var treeItems=group.items.map(function(item){
        return '<button type="button" class="knowledge-tree-item'+(item.id===selected.id?' active':'')+'" data-library-content="'+item.id+'">'
          +icons.doc+'<span>'+item.title+'</span></button>';
      }).join("");
      return '<section class="knowledge-tree-group"><h3>'+group.title+'</h3>'+treeItems+'</section>';
    }).join("");
    return '<div class="knowledge-workspace">'
      +'<aside class="knowledge-content-sidebar" aria-label="知识内容">'
        +'<div class="knowledge-sidebar-head"><button type="button" class="knowledge-back-button" data-library-list>'+icons.arrow+'<span>全部知识库</span></button>'
          +'<div class="knowledge-scope-title"><span class="library-icon">'+icons.folder+'</span><div><strong>'+scope.name+'</strong><span>'+scope.description+'</span></div></div></div>'
        +'<div class="knowledge-sidebar-label"><span>知识内容</span><strong>'+scope.docs+'</strong></div>'
        +'<div class="knowledge-content-tree">'+contentTree+'</div>'
      +'</aside>'
      +'<section class="knowledge-main">'
        +'<header class="knowledge-main-header"><div class="knowledge-main-heading"><span>当前内容</span><strong>'+selected.title+'</strong></div>'
          +'<nav class="knowledge-workspace-tabs" aria-label="'+scope.name+' 内容视图">'+tabs.map(function(item){
        return '<button type="button" class="'+(item.view===activeView?'active':'')+'" data-go-view="'+item.view+'">'
          +icons[item.icon]+'<span>'+item.label+'</span></button>';
          }).join("")+'</nav></header>'
        +'<div class="knowledge-main-view">'+mainContent+'</div>'
      +'</section></div>';
  }

  function escapeHTML(value){
    return String(value==null?"":value).replace(/[&<>"']/g,function(character){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[character];
    });
  }

  function isAgentAvatarImage(value){
    return /^(?:data:image\/|assets\/agents\/.*\.(?:png|jpe?g|webp)(?:\?.*)?$)/i.test(String(value||""));
  }

  function agentAvatarContent(value,alt){
    if(isAgentAvatarImage(value)){
      return '<img src="'+escapeHTML(value)+'" alt="'+escapeHTML(alt||"智能体头像")+'">';
    }
    var text=String(value||"").trim();
    if(!text){
      var name=String(alt||"").trim();
      var chinese=Array.from(name).find(function(character){return /[\u3400-\u9fff]/.test(character);});
      if(chinese)text=chinese;
      else text=name.split(/\s+/).filter(Boolean).map(function(word){return word.charAt(0);}).join("").slice(0,2).toUpperCase();
    }
    return escapeHTML(text||"智");
  }

  function agentAvatarMarkup(value,className,alt){
    return '<span class="'+className+'">'+agentAvatarContent(value,alt)+'</span>';
  }

  function syncAgentEditorDraft(form){
    if(!form)return agentEditingDraft;
    ["name","description","scenario","strategy","direction","requirements"].forEach(function(field){
      if(form.elements[field])agentEditingDraft[field]=form.elements[field].value;
    });
    return agentEditingDraft;
  }

  function generatedAgentAvatar(draft){
    var source=[draft.name,draft.description,draft.scenario,draft.direction].join("|");
    var hash=2166136261;
    for(var i=0;i<source.length;i++){
      hash^=source.charCodeAt(i);
      hash=Math.imul(hash,16777619);
    }
    var palettes=[
      ["#6f32c9","#a96ce8","#f4eaff"],
      ["#2445c4","#6d7ff0","#e9edff"],
      ["#0d7f70","#55b7a9","#e0f7f2"],
      ["#a04475","#df78a9","#fde8f2"],
      ["#b76419","#efac56","#fff0d9"]
    ];
    var colors=palettes[Math.abs(hash)%palettes.length];
    var canvas=document.createElement("canvas");
    canvas.width=512;
    canvas.height=512;
    var context=canvas.getContext("2d");
    var gradient=context.createLinearGradient(0,0,512,512);
    gradient.addColorStop(0,colors[0]);
    gradient.addColorStop(1,colors[1]);
    context.fillStyle=gradient;
    context.fillRect(0,0,512,512);
    context.globalAlpha=.22;
    for(var shape=0;shape<5;shape++){
      var angle=((hash>>>shape*3)&255)/255*Math.PI*2;
      var radius=76+((hash>>>shape*2)&63);
      var x=256+Math.cos(angle)*(80+shape*15);
      var y=256+Math.sin(angle)*(70+shape*12);
      context.beginPath();
      context.arc(x,y,radius,0,Math.PI*2);
      context.fillStyle=shape%2?colors[2]:"#ffffff";
      context.fill();
    }
    context.globalAlpha=1;
    var name=String(draft.name||"智能体").trim();
    var initials=Array.from(name.replace(/\s+/g,"")).slice(0,2).join("")||"智";
    context.fillStyle="#ffffff";
    context.font='600 154px "Microsoft YaHei","PingFang SC",sans-serif';
    context.textAlign="center";
    context.textBaseline="middle";
    context.shadowColor="rgba(0,0,0,.18)";
    context.shadowBlur=22;
    context.fillText(initials,256,270);
    return canvas.toDataURL("image/png");
  }

  function squareAvatarFromFile(file,onComplete){
    if(!file||!/^image\/(png|jpe?g|webp)$/i.test(file.type)){
      toast("请选择 JPG、PNG 或 WebP 图片","warn");
      return;
    }
    if(file.size>8*1024*1024){
      toast("图片请控制在 8 MB 以内","warn");
      return;
    }
    var reader=new FileReader();
    reader.onload=function(){
      var image=new Image();
      image.onload=function(){
        var size=Math.min(image.naturalWidth,image.naturalHeight);
        var sourceX=(image.naturalWidth-size)/2;
        var sourceY=(image.naturalHeight-size)/2;
        var canvas=document.createElement("canvas");
        canvas.width=512;
        canvas.height=512;
        var context=canvas.getContext("2d");
        context.drawImage(image,sourceX,sourceY,size,size,0,0,512,512);
        onComplete(canvas.toDataURL("image/jpeg",.9));
      };
      image.onerror=function(){toast("图片读取失败，请更换文件","warn");};
      image.src=reader.result;
    };
    reader.onerror=function(){toast("图片读取失败，请重试","warn");};
    reader.readAsDataURL(file);
  }

  function getActiveAgent(){
    return agents.find(function(agent){return agent.id===activeAgentId;})||agents[0];
  }

  function getAgentContext(){
    var scope=libraryOpen?getCurrentScope():null;
    var label=scope?scope.name:"全部知识库";
    var detail="跨知识库检索与问答";
    if(scope){
      detail=(viewMeta[currentView]&&viewMeta[currentView].title)||"知识库";
      if(currentView==="document"){
        var section=currentDocumentId||getCurrentKnowledge().groups[0].items[0].id;
        var article=getCurrentKnowledge().content[section];
        if(article)detail=article.title;
      }
    }
    return {scope:scope,label:label,detail:detail};
  }

  function getAgentConversationKey(){
    return (libraryOpen?currentScope:"all")+"::"+activeAgentId;
  }

  function getAgentConversation(){
    var key=getAgentConversationKey();
    if(!agentConversations[key]){
      var agent=getActiveAgent();
      var context=getAgentContext();
      agentConversations[key]=[{
        role:"assistant",
        text:"我是"+agent.name+"。当前将基于「"+context.label+"」工作，你可以让我总结内容、查找依据或继续生成可执行结果。",
        citations:[]
      }];
    }
    return agentConversations[key];
  }

  function getAgentQuickPrompts(){
    if(currentView==="document")return ["总结当前知识页","列出引用来源","找出不确定结论"];
    if(currentView==="health")return ["解释高风险问题","生成修复顺序","检查缺失来源"];
    if(currentView==="graph")return ["解释当前图谱","查找孤立节点","梳理关键关系"];
    if(currentView==="upload"||currentView==="sources")return ["建议整理方式","识别重复资料","生成入库规则"];
    if(currentView==="agents")return ["推荐适合的智能体","如何设计智能体","比较整理策略"];
    return ["总结知识库现状","推荐下一步任务","查找关键内容"];
  }

  function buildAgentReply(question){
    var agent=getActiveAgent();
    var context=getAgentContext();
    var prefix="基于「"+context.label+"」";
    if(agent.id==="librarian"){
      return prefix+"，我会先检查来源完整性、重复内容与结构冲突。针对“"+question+"”，建议先确认待处理文件，再核对知识页引用覆盖，最后重新生成受影响模块。";
    }
    if(agent.id==="writer"){
      return prefix+"，我可以把现有内容编译为清晰的文章、提纲或汇报材料。针对“"+question+"”，我会保留原始结论和来源，再按目标受众重组表达。";
    }
    if(agent.id==="vi-reviewer"){
      return prefix+"，我会重点检查品牌色、字体、标志、安全空间与版式一致性。针对“"+question+"”，建议先锁定当前规范版本，再逐项标注不符合项。";
    }
    if(agent.id==="history-guide"){
      return prefix+"，我会沿时间、事件与因果关系组织回答。针对“"+question+"”，将只使用当前知识库已有内容，并明确标记缺失证据。";
    }
    return prefix+"，我会围绕“"+question+"”先提取核心结论，再核对来源与争议点，最后给出可继续执行的步骤。当前上下文是「"+context.detail+"」。";
  }

  function sendAgentMessage(question){
    var text=(question||"").trim();
    if(!text)return;
    var context=getAgentContext();
    var conversation=getAgentConversation();
    conversation.push({role:"user",text:text,citations:[]});
    conversation.push({
      role:"assistant",
      text:buildAgentReply(text),
      citations:libraryOpen?[context.label,context.detail]:["全部知识库"]
    });
    agentDrafts[getAgentConversationKey()]="";
    agentDockOpen=true;
    renderAgentDock();
  }

  function renderAgentDock(){
    var host=$("#agentDockContent");
    var launcher=$("#agentDockLauncher");
    if(!host||!launcher)return;
    var hidden=document.body.classList.contains("agent-dock-hidden");
    document.body.classList.toggle("agent-dock-open",!hidden&&agentDockOpen);
    document.body.classList.toggle("agent-dock-collapsed",!hidden&&!agentDockOpen);
    launcher.innerHTML=icons.bot+"<span>智能体</span>";
    launcher.onclick=function(){agentDockOpen=true;renderAgentDock();};
    if(hidden){
      host.innerHTML="";
      return;
    }
    if(!agentDockOpen){
      host.innerHTML='<div class="agent-dock-collapsed-view"><button class="agent-dock-expand" id="agentDockExpand" type="button" aria-label="展开智能体对话">'+icons.bot+'</button><span>智能体对话</span></div>';
      $("#agentDockExpand").onclick=function(){agentDockOpen=true;renderAgentDock();};
      return;
    }
    var agent=getActiveAgent();
    var context=getAgentContext();
    var conversation=getAgentConversation();
    var key=getAgentConversationKey();
    var messages=conversation.map(function(message){
      var citations=(message.citations||[]).length?'<div class="agent-citations">'
        +message.citations.map(function(citation){return '<button type="button" data-agent-citation="'+escapeHTML(citation)+'">'+icons.link+escapeHTML(citation)+'</button>';}).join("")+'</div>':"";
      return '<div class="agent-message '+message.role+'"><div class="agent-message-bubble">'+escapeHTML(message.text)+'</div>'+citations+'</div>';
    }).join("");
    var promptButtons=getAgentQuickPrompts().map(function(prompt){
      return '<button type="button" data-agent-prompt="'+escapeHTML(prompt)+'">'+escapeHTML(prompt)+'</button>';
    }).join("");
    var agentOptions=agents.map(function(item){
      return '<option value="'+item.id+'"'+(item.id===agent.id?' selected':'')+'>'+escapeHTML(item.name)+'</option>';
    }).join("");
    host.innerHTML='<div class="agent-dock-shell">'
      +'<header class="agent-dock-head"><div class="agent-dock-identity">'+agentAvatarMarkup(agent.avatar,"agent-dock-avatar",agent.name)
      +'<div class="agent-dock-copy"><strong>'+escapeHTML(agent.name)+'</strong><span>'+escapeHTML(agent.category)+' · '+escapeHTML(agent.status)+'</span></div></div>'
      +'<div class="agent-dock-actions"><button id="agentDockReset" type="button" title="新建对话" aria-label="新建对话">'+icons.plus+'</button>'
      +'<button id="agentDockCollapse" type="button" title="收起" aria-label="收起智能体对话">'+icons.chevron+'</button></div></header>'
      +'<section class="agent-dock-context"><div class="agent-context-label"><label class="agent-picker"><select id="agentDockAgentSelect" aria-label="智能体">'+agentOptions+'</select></label></div>'
      +'<div class="agent-context-chip">'+(context.scope?icons.folder:icons.database)+'<div><strong>'+escapeHTML(context.label)+'</strong><span>'+escapeHTML(context.detail)+'</span></div></div></section>'
      +'<div class="agent-dock-messages" id="agentDockMessages" aria-live="polite">'+messages+'</div>'
      +'<footer class="agent-dock-footer"><div class="agent-quick-prompts">'+promptButtons+'</div>'
      +'<form class="agent-composer" id="agentDockForm"><textarea id="agentDockInput" aria-label="向智能体提问" placeholder="向 '+escapeHTML(agent.name)+' 提问...">'+escapeHTML(agentDrafts[key]||"")+'</textarea>'
      +'<button class="primary" type="submit" aria-label="发送">'+icons.arrow+'</button></form>'
      +'<div class="agent-dock-footnote"><button type="button" data-go-view="agents">管理智能体</button></div></footer></div>';
    bindAgentDockActions();
    var messageHost=$("#agentDockMessages");
    if(messageHost)requestAnimationFrame(function(){messageHost.scrollTop=messageHost.scrollHeight;});
  }

  function bindAgentDockActions(){
    var collapse=$("#agentDockCollapse");
    if(collapse)collapse.onclick=function(){agentDockOpen=false;renderAgentDock();};
    var reset=$("#agentDockReset");
    if(reset)reset.onclick=function(){
      agentConversations[getAgentConversationKey()]=null;
      agentDrafts[getAgentConversationKey()]="";
      renderAgentDock();
    };
    var select=$("#agentDockAgentSelect");
    if(select)select.onchange=function(){
      activeAgentId=select.value;
      renderAgentDock();
    };
    var input=$("#agentDockInput");
    if(input)input.oninput=function(){agentDrafts[getAgentConversationKey()]=input.value;};
    var form=$("#agentDockForm");
    if(form)form.onsubmit=function(event){
      event.preventDefault();
      sendAgentMessage(input?input.value:"");
    };
    $$("[data-agent-prompt]",$("#agentDockContent")).forEach(function(node){
      node.onclick=function(){sendAgentMessage(node.dataset.agentPrompt);};
    });
    $$("[data-agent-citation]",$("#agentDockContent")).forEach(function(node){
      node.onclick=function(){
        if(libraryOpen)navigate("document");
        else toast("请先选择一个知识库","warn");
      };
    });
  }

  function templateOverview(){
    return templateLibraryIndex();
  }

  function templateHome(){
    var scope=getCurrentScope();
    var knowledge=getCurrentKnowledge();
    var recentPages=pageRows.slice(0,3).map(function(page){
      return '<button type="button" class="page-row-card" data-go-view="document">'
        +'<div><strong>'+page.title+'</strong>'
        +'<span>'+page.type+' · '+page.sources+' 个来源 · '+page.updated+'</span></div>'
        +'<small class="'+(page.status==='已确认'?'ok':'warn')+'">'+page.status+'</small></button>';
    }).join("");
    var pipeline=[
      {label:"解析原始资料",detail:"MD、HTML 与 PDF 已转成规范文本",status:"done"},
      {label:"识别实体、事件和关系",detail:"新增 12 个品牌与项目关系",status:"done"},
      {label:"重构 Knowledge Page",detail:scope.name+" 正在合并多来源证据",status:"active"},
      {label:"更新搜索、图谱和 MCP",detail:"完成后外部 AI 可读取最新确认版本",status:"waiting"}
    ];
    var pipelineHtml=pipeline.map(function(step){
      var icon=step.status==="done"?icons.check:step.status==="active"?icons.refresh:icons.clock;
      return '<div class="pipeline-step '+step.status+'"><span>'+icon+'</span><div><strong>'+step.label+'</strong><small>'+step.detail+'</small></div></div>';
    }).join("");
    return '\
      <div class="page-stack">\
        <section class="hero-band reconstruction-hero">\
          <div>\
            <p class="eyebrow">Knowledge Reconstruction</p>\
            <h2>AI 正在把分散资料重构为长期知识页</h2>\
            <p>'+knowledge.sources.length+' 份资料正在被合并为知识页。每个核心结论都会保留来源引用，外部 AI 当前只能通过只读 MCP 调用。</p>\
            <div class="button-row">\
              <button class="primary" data-go-view="library">查看知识内容</button>\
              <button data-go-view="upload">导入新资料</button>\
            </div>\
          </div>\
          <div class="hero-score"><span>健康度</span><strong>'+scope.health+'</strong></div>\
        </section>\
        <section class="metric-grid">\
          <div class="metric-card green"><div><span>原始资料</span><strong>'+String(knowledge.sources.length).padStart(3,"0")+'</strong></div>'+icons.archive+'</div>\
          <div class="metric-card blue"><div><span>知识页</span><strong>'+String(scope.docs).padStart(2,"0")+'</strong></div>'+icons.filetext+'</div>\
          <div class="metric-card violet"><div><span>引用覆盖</span><strong>81%</strong></div>'+icons.link+'</div>\
          <div class="metric-card amber"><div><span>待确认</span><strong>5</strong></div>'+icons.alert+'</div>\
        </section>\
        <section class="split-grid">\
          <div class="panel">\
            <div class="panel-title">重构队列</div>\
            <div class="pipeline-list">'+pipelineHtml+'</div>\
          </div>\
          <div class="panel">\
            <div class="panel-title">最近生成的知识页</div>\
            <div class="page-card-list">'+recentPages+'</div>\
            <div class="button-row"><button data-go-view="health">查看待确认问题</button></div>\
          </div>\
        </section>\
      </div>';
  }

  function templateLibraryContents(){
    var rows=[];
    getCurrentKnowledge().groups.forEach(function(group){
      group.items.forEach(function(item,index){
        rows.push('<button type="button" class="content-row searchable" data-search="'+group.title+' '+item.title+'" data-open-document="'+item.id+'">'
          +'<span class="content-name">'+icons.doc+'<strong>'+item.title+'</strong></span>'
          +'<span>'+group.title+'</span><span>解析文档</span><span class="content-state">'+(index===0?'已更新':'已解析')+'</span></button>');
      });
    });
    return '\
      <div class="content-index">\
        <div class="content-index-toolbar">\
          <div class="content-tabs"><button data-library-list>全部知识库</button><button class="active">'+getCurrentScope().name+'</button></div>\
          <div class="content-tools"><button>显示</button><button>筛选</button></div>\
        </div>\
        <div class="content-list">\
          <div class="content-list-head"><span>内容</span><span>所属模块</span><span>类型</span><span>状态</span></div>\
          '+rows.join("")+'\
        </div>\
        <div class="empty-message" id="searchEmpty"><strong>没有匹配内容</strong></div>\
      </div>';
  }

  function templateProcessingStats(scope){
    return '<div class="processing-stats" aria-label="文件处理情况">'
      +'<div class="processing-stat stat-total"><span class="processing-mark">Σ</span><strong data-processing="total">'+scope.files.total+'</strong><span>文件总数</span></div>'
      +'<div class="processing-stat"><span class="processing-mark">P</span><strong data-processing="pending">'+scope.files.pending+'</strong><span>未处理</span></div>'
      +'<div class="processing-stat stat-working"><span class="processing-mark">W</span><strong data-processing="processing">'+scope.files.processing+'</strong><span>处理中</span></div>'
      +'<div class="processing-stat stat-ignored"><span class="processing-mark">N</span><strong data-processing="ignored">'+scope.files.ignored+'</strong><span>不处理</span></div>'
      +'<div class="processing-stat stat-done"><span class="processing-mark">✓</span><strong data-processing="graphed">'+scope.files.graphed+'</strong><span>已入图</span></div>'
      +'</div>';
  }

  function updateProcessingStats(card,files){
    if(!card)return;
    Object.keys(files).forEach(function(key){
      var value=card.querySelector('[data-processing="'+key+'"]');
      if(value)value.textContent=files[key];
    });
  }

  function templateLibraryIndex(){
    var cards=scopes.map(function(scope){
      return '<article class="library-card">'
        +'<button type="button" class="library-open" data-open-scope="'+scope.id+'"><span class="library-icon">'+icons.folder+'</span>'
        +'<span class="library-card-main"><strong>'+scope.name+'</strong><span>'+scope.description+'</span></span></button>'
        +'<div class="library-side">'+templateProcessingStats(scope)
        +'<span class="library-count"><strong>'+String(scope.docs).padStart(2,"0")+'</strong><span>知识内容</span></span>'
        +'<button type="button" class="regenerate-button" data-regenerate-scope="'+scope.id+'">↻ 重新生成</button></div></article>';
    }).join("");
    return '\
      <div class="library-index">\
        <div class="library-index-head"><div><h2>全部知识库</h2></div></div>\
        <div class="library-grid">'+cards+'</div>\
      </div>';
  }

  function templateUpload(){
    var scope=getCurrentScope();
    if(uploadMode==="parsed"){
      return '\
        <div class="view-toolbar"><div><h2>解析内容</h2></div>\
        <div class="toolbar-actions"><button data-upload-mode="upload">继续上传</button><button class="primary" data-go-view="graph">查看图谱</button><button>导出内容</button></div></div>\
        <div class="reader-toolbar"><div><strong>'+scope.name+'</strong><span class="tag tag-success">已完成解析</span></div></div>\
        <article class="reader-document reader-document-standalone" id="readerDocument">'+renderReaderDocument()+'</article>';
    }
    return templateImportStudio();
  }

  function templateSources(){
    var scope=getCurrentScope();
    var rows=getCurrentKnowledge().sources.map(function(file,index){
      return '<tr class="searchable" data-search="'+file+' '+scope.name+'"><td><strong>'+file+'</strong></td><td>'+scope.name+'</td><td><span class="tag tag-success">已索引</span></td><td class="td-mono">'+String(index+1).padStart(2,"0")+'</td><td class="td-mono">最近更新</td></tr>';
    }).join("");
    return '\
      <div class="view-toolbar"><div><h2>'+getCurrentKnowledge().sources.length+' 个来源文件</h2></div>\
      <div class="toolbar-actions"><button>筛选</button><button class="primary" data-go-view="upload">导入新资料</button></div></div>\
      <div class="table-wrap"><table><thead><tr><th>文件名</th><th>知识库</th><th>状态</th><th>模块</th><th>更新时间</th></tr></thead><tbody>\
        '+rows+'\
      </tbody></table></div><div class="empty-message" id="searchEmpty"><strong>没有匹配文件</strong></div>';
  }

  function templateReader(){
    var tree=getCurrentKnowledge().groups.map(function(group){
      var items=group.items.map(function(item){
        return '<button type="button" class="outline-item'+(item.id===currentReaderSection?' active':'')+'" data-reader-section="'+item.id+'">'+icons.doc+'<span>'+item.title+'</span></button>';
      }).join("");
      return '<details class="outline-group"'+(group.open||group.items.some(function(item){return item.id===currentReaderSection;})?' open':'')+'>'
        +'<summary>'+icons.folder+'<span>'+group.title+'</span></summary><div class="outline-items">'+items+'</div></details>';
    }).join("");
    return '\
      <div class="reader-shell">\
        <aside class="outline-panel"><div class="outline-title">'+icons.folder+'<strong>内容目录</strong></div>'+tree+'</aside>\
        <article class="reader-document" id="readerDocument">'+renderReaderDocument()+'</article>\
      </div>';
  }

  function renderReaderDocument(){
    var content=getCurrentKnowledge().content;
    var firstId=getCurrentKnowledge().groups[0].items[0].id;
    var section=content[currentReaderSection]||content[firstId];
    return '<div class="document-prose"><h2>'+section.title+'</h2>'+section.html+'</div>';
  }

  function openReaderSection(sectionId){
    if(!getCurrentKnowledge().content[sectionId])return;
    currentReaderSection=sectionId;
    uploadMode="parsed";
    if(currentView!=="upload"){
      navigate("upload",{preserveUploadMode:true});
      return;
    }
    renderView();
  }

  function templateGraph(){
    var scope=getCurrentScope();
    var knowledge=getCurrentKnowledge();
    var names=[];
    knowledge.groups.forEach(function(group){group.items.forEach(function(item){names.push(item.title);});});
    var totalNames=names.length;
    names=names.slice(0,8);
    var nodes=names.map(function(name,index){
      return '<div class="graph-node n'+(index+1)+' searchable" data-search="'+name+'"><strong>'+name+'</strong></div>';
    }).join("");
    return '\
      <div class="view-toolbar"><div><h2>知识模块关系</h2></div>\
      <div class="toolbar-actions"><button>重新整理</button><button class="primary">导出结构</button></div></div>\
      <div class="graph-layout"><div class="graph-canvas">'+nodes+'<div class="graph-node core searchable" data-search="'+scope.name+' 核心"><strong>'+scope.name+'</strong></div></div>\
      <aside class="graph-side"><h3>图谱概览</h3><div class="graph-stat"><span>知识模块</span><b>'+String(totalNames).padStart(2,"0")+'</b></div>\
      <div class="graph-stat"><span>知识关系</span><b>'+String(Math.max(totalNames*2-2,0)).padStart(2,"0")+'</b></div><div class="graph-stat"><span>来源文件</span><b>'+String(knowledge.sources.length).padStart(2,"0")+'</b></div>\
      <div class="graph-stat"><span>结构冲突</span><b>00</b></div><div class="graph-stat"><span>健康度</span><b>'+scope.health+'%</b></div></aside></div>\
      <div class="empty-message" id="searchEmpty"><strong>没有匹配模块</strong></div>';
  }

  function templatePackages(){
    var scope=getCurrentScope();
    var knowledge=getCurrentKnowledge();
    return '\
      <div class="view-toolbar"><div><h2>已发布资源包</h2></div>\
      <div class="toolbar-actions"><button>导入资源包</button><button class="primary">新建资源包</button></div></div>\
      <div class="cards-grid">\
        <article class="card searchable" data-search="'+scope.name+' 已发布 资源包"><div class="card-head"><span class="card-icon">'+icons.link+'</span><span class="tag tag-primary">已发布</span></div>\
        <div class="card-title">'+scope.name+'</div><div class="card-desc">'+knowledge.packageText+'</div></article>\
      </div><div class="empty-message" id="searchEmpty"><strong>没有匹配资源包</strong></div>';
  }

  function templateImportStudio(){
    var selectedScope=scopes.find(function(scope){return scope.id===importState.scope;})||scopes[0];
    var selectedAgent=agents.find(function(agent){return agent.id===importState.agent;})||agents[0];
    var scopeOptions=scopes.map(function(scope){
      return '<option value="'+scope.id+'"'+(scope.id===selectedScope.id?' selected':'')+'>'+scope.name+'</option>';
    }).join("");
    var agentOptions=agents.map(function(agent){
      return '<option value="'+agent.id+'"'+(agent.id===selectedAgent.id?' selected':'')+'>'+agent.name+'</option>';
    }).join("");
    var targetControl=newLibraryImportMode
      ?'<div class="import-select-shell import-auto-target">'+icons.folder+'<div><strong>新知识库</strong><span>导入后由 AI 自动命名</span></div><b>自动</b></div>'
      :'<div class="import-select-shell">'+icons.folder+'<select id="importScopeSelect">'+scopeOptions+'</select></div>';
    var heroTitle=newLibraryImportMode?"导入资料，创建新的知识库":"导入原始资料，交给 AI 重构知识";
    var heroDescription=newLibraryImportMode
      ?"无需预先命名。添加首批资料并选择整理智能体后，AI 将解析主题、生成知识库名称与目录，并创建可追溯的知识页。"
      :"选择资料所属的知识库和负责整理的智能体。系统将解析来源、提取实体与关系，并生成可追溯的知识页。";
    var methodTabs='<div class="import-method-tabs" role="tablist" aria-label="资料导入方式">'
      +'<button type="button" class="'+(importState.method==="file"?'active':'')+'" data-import-method="file">'+icons.filetext+'<span>选择文件</span></button>'
      +'<button type="button" class="'+(importState.method==="text"?'active':'')+'" data-import-method="text">'+icons.doc+'<span>粘贴文本</span></button>'
      +'<button type="button" class="'+(importState.method==="url"?'active':'')+'" data-import-method="url">'+icons.link+'<span>导入 URL</span></button>'
      +'</div>';
    var configControls='<div class="import-hero-config"><div class="import-select-grid">'
      +'<label><span>目标知识库</span>'+targetControl+'</label>'
      +'<label class="import-agent-control"><span>整理智能体</span><div class="import-agent-combined">'
        +agentAvatarMarkup(selectedAgent.avatar,"agent-avatar",selectedAgent.name)+'<div class="import-agent-combined-body">'
          +'<select id="importAgentSelect" aria-label="整理智能体">'+agentOptions+'</select>'
        +'</div></div><div class="import-agent-meta"><p>'+selectedAgent.description+'</p>'
          +'<strong>整理重点 · '+selectedAgent.direction+'</strong></div></label>'
      +'</div></div>';
    var methodContent="";
    if(importState.method==="text"){
      methodContent='<div class="import-text-panel">'
        +'<textarea id="importTextInput" aria-label="粘贴文本" placeholder="粘贴会议纪要、研究笔记、网页正文或其他文本内容……">'+escapeHTML(importState.text)+'</textarea></div>';
    }else if(importState.method==="url"){
      methodContent='<div class="import-url-panel"><div><span>'+icons.link+'</span>'
        +'<input id="importUrlInput" aria-label="导入 URL" type="url" value="'+escapeHTML(importState.url)+'" placeholder="https://example.com/article"></div></div>';
    }else{
      var fileSummary=importState.files.length
        ?'<strong>'+importState.files.length+' 个文件已就绪</strong><span>'+escapeHTML(importState.files.join(" · "))+'</span>'
        :'<strong>拖拽文件到这里，或点击选择文件</strong><span>PDF · DOCX · PPTX · XLSX · Markdown · 图片</span>';
      methodContent='<div class="import-file-drop" id="importDropzone" data-import-pick tabindex="0" role="button" aria-label="选择导入文件">'
        +'<input id="importFileInput" type="file" multiple hidden accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.md,.txt,.html,.png,.jpg,.jpeg">'
        +'<span class="import-upload-icon">'+icons.upload+'</span><div>'+fileSummary+'</div><button type="button" data-import-pick>选择文件</button></div>';
    }
    return '<section class="import-studio">'
      +'<header class="import-studio-hero"><span class="eyebrow">METASK · KNOWLEDGE INTAKE</span>'
        +'<div class="import-hero-icon">'+icons.upload+'</div><h2>'+heroTitle+'</h2>'
        +'<p>'+heroDescription+'</p>'+methodTabs+configControls
        +'<div class="import-hero-method-panel">'+methodContent+'</div></header></section>';
  }

  function templateProduct(){
    return '\
      <section class="product-hero">\
        <span class="eyebrow">KNOWFORGE · 知识编译器</span>\
        <h2>把资料编译成可检索、可调用、可持续更新的知识能力。</h2>\
        <p>KnowForge 面向个人、团队与企业，将本地文件、业务经验和专题资料整理为结构化知识库，并通过智能体进入研究、创作与业务执行。</p>\
        <div class="hero-actions"><button class="primary" data-go-view="register">免费开始</button><button data-go-view="pricing">查看会员方案</button></div>\
        <div class="product-metrics"><div><strong>文件 → 知识</strong><span>解析、归类与来源追踪</span></div><div><strong>知识 → 检索</strong><span>语义检索与证据定位</span></div><div><strong>检索 → 执行</strong><span>智能体调用与工作输出</span></div></div>\
      </section>\
      <section class="feature-section"><div class="section-heading"><span>核心能力</span><h3>从资料管理走向知识执行</h3></div>\
        <div class="feature-grid">\
          <article><b>01</b><strong>知识编译</strong><p>识别文件结构、主题与关系，生成可浏览的知识目录。</p></article>\
          <article><b>02</b><strong>可信检索</strong><p>返回答案同时保留来源、版本与证据位置。</p></article>\
          <article><b>03</b><strong>智能体协作</strong><p>让系统智能体与自建智能体调用指定知识库完成任务。</p></article>\
          <article><b>04</b><strong>持续更新</strong><p>本地文件变化后重新生成，保持知识库与源文件一致。</p></article>\
        </div>\
      </section>';
  }

  function templateLogin(){
    return '\
      <div class="auth-layout auth-layout-centered"><section class="auth-intro"><span class="eyebrow">WELCOME BACK</span><h2>继续编译你的知识。</h2><p>登录后同步会员等级、知识积分、存储空间和自建智能体。</p></section>\
      <form class="auth-card" id="loginForm"><h3>登录 KnowForge</h3><label>邮箱<input type="email" name="email" placeholder="name@company.com" required></label>\
      <label>密码<input type="password" name="password" placeholder="输入密码" required></label>\
      <div class="form-inline"><label class="check-line"><input type="checkbox" checked>保持登录</label><button type="button" class="text-button">忘记密码</button></div>\
      <button class="primary auth-submit" type="submit">登录</button><p class="auth-switch">还没有账户？<button type="button" data-go-view="register">注册</button></p></form></div>';
  }

  function templateRegister(){
    return '\
      <div class="auth-layout"><section class="auth-intro"><span class="eyebrow">START FREE</span><h2>建立你的第一座知识库。</h2><p>注册即获得体验版、2 GB 存储空间和每月 1,000 U 知识积分。</p></section>\
      <form class="auth-card" id="registerForm"><h3>创建账户</h3><label>姓名<input type="text" name="name" placeholder="你的姓名" required></label>\
      <label>邮箱<input type="email" name="email" placeholder="name@company.com" required></label>\
      <label>密码<input type="password" name="password" placeholder="至少 8 位字符" minlength="8" required></label>\
      <label class="check-line"><input type="checkbox" required>我同意服务条款与隐私政策</label>\
      <button class="primary auth-submit" type="submit">注册并开始</button><p class="auth-switch">已有账户？<button type="button" data-go-view="login">直接登录</button></p></form></div>';
  }

  function templateProfile(){
    if(!accountState.loggedIn){
      return '<div class="auth-required"><span class="account-avatar">访</span><h2>登录后查看账户中心</h2><p>会员等级、知识积分、存储空间和账户操作将在这里统一管理。</p><div><button class="primary" data-go-view="login">登录</button><button data-go-view="register">注册</button></div></div>';
    }
    return '\
      <div class="profile-head"><div class="profile-identity"><span class="account-avatar">'+accountState.name.slice(0,1)+'</span><div><span class="eyebrow">ACCOUNT CENTER</span><h2>'+accountState.name+'</h2><p>'+accountState.role+'</p></div></div>\
      <button data-account-action="logout">退出登录</button></div>\
      <div class="account-overview-grid">\
        <article><span>会员等级</span><strong>'+accountState.plan+'</strong><button class="text-button" data-go-view="pricing">变更方案</button></article>\
        <article><span>知识积分</span><strong>'+accountState.points.toLocaleString()+' U</strong><small>用于解析、检索与智能体执行</small></article>\
        <article><span>存储空间</span><strong>'+accountState.storageUsed+' / '+accountState.storageTotal+'</strong><div class="storage-bar"><i style="width:2%"></i></div></article>\
      </div>\
      <div class="settings-grid"><section><h3>用户身份</h3><div class="setting-row"><span>姓名</span><b>'+accountState.name+'</b></div><div class="setting-row"><span>身份</span><b>'+accountState.role+'</b></div><div class="setting-row"><span>账户状态</span><b class="success-text">正常</b></div></section>\
      <section><h3>账户操作</h3><button>修改个人信息</button><button>账户安全</button><button>账单与发票</button><button data-go-view="pricing">升级会员</button></section></div>';
  }

  function templatePricing(){
    var cards=membershipPlans.map(function(plan){
      return '<article class="pricing-card'+(plan.featured?' featured':'')+'">'
        +(plan.featured?'<span class="plan-recommend">推荐</span>':'')
        +'<span class="plan-name">'+plan.name+'</span><h3>'+plan.position+'</h3><strong class="plan-price">'+plan.price+'</strong>'
        +'<div class="plan-metrics"><div><span>存储空间</span><b>'+plan.storage+'</b></div><div><span>知识积分</span><b>'+plan.points+'</b></div><div><span>检索服务</span><b>'+plan.search+'</b></div></div>'
        +'<span class="plan-feature-label">核心能力</span><ul>'+plan.features.map(function(feature){return '<li>✓ '+feature+'</li>';}).join("")+'</ul>'
        +'<button class="'+(plan.featured?'primary':'')+'" data-select-plan="'+plan.id+'">'+(plan.id==="enterprise"?'联系顾问':'选择'+plan.name)+'</button></article>';
    }).join("");
    return '\
      <div class="pricing-head"><span class="eyebrow">MEMBERSHIP</span><h2>按知识规模与协作方式选择版本</h2><p>所有版本均包含知识库、来源追踪与基础账户管理；升级后获得更高存储、知识积分、智能体能力和检索额度。</p></div>\
      <div class="pricing-grid">'+cards+'</div>\
      <div class="paywall-note"><strong>付费能力说明</strong><span>当存储空间、知识积分、检索次数或智能体能力达到当前版本上限时，系统会保留已有知识并引导升级，不会删除源文件。</span></div>';
  }

  function templateAgents(){
    var visibleAgents=activeAgentFilter==="system"
      ? agents.filter(function(agent){return agent.type==="system";})
      : agents;
    var cards=visibleAgents.map(function(agent){
      var sceneTags=agent.scenario.split(/[、，,]/).slice(0,3).map(function(scene){return '<span>'+scene+'</span>';}).join("");
      return '<article class="agent-card searchable" data-agent-type="'+agent.type+'" data-agent-category="'+agent.category+'" data-search="'+agent.name+' '+agent.description+' '+agent.category+' '+agent.scenario+'">'
        +'<div class="agent-card-topline"><small>'+(agent.type==="system"?'系统预置':'自定义')+'</small></div>'
        +'<div class="agent-card-identity">'+agentAvatarMarkup(agent.avatar,"agent-avatar large",agent.name)
        +'<div class="agent-card-main"><div class="agent-card-copy"><h3>'+agent.name+'</h3><p>'+agent.description+'</p></div></div></div>'
        +'<div class="agent-scene-tags">'+sceneTags+'</div>'
        +'<div class="agent-focus"><span>重点关注</span><strong>'+agent.direction+'</strong></div>'
        +'<div class="agent-card-actions"><button class="agent-use-button" data-agent-use="'+agent.id+'">'+icons.message+'<span>开始对话</span></button>'
        +'<button class="agent-edit-button" data-agent-edit="'+agent.id+'">'+icons.pencil+'<span>编辑策略</span></button></div></article>';
    }).join("");
    return '\
      <div class="agents-page">\
        <section class="agents-header"><div><p class="eyebrow">Knowledge Agents</p><h2>给知识一个明确的整理角色</h2><p>每个智能体代表一套可复用的知识使用场景、整理策略和关注方向。</p></div></section>\
        <section class="agent-toolbar" aria-label="智能体筛选">\
          <div class="agent-tabs"><button class="'+(activeAgentFilter==="all"?"is-active":"")+'" data-agent-filter="all">全部智能体 <span>'+agents.length+'</span></button><button class="'+(activeAgentFilter==="system"?"is-active":"")+'" data-agent-filter="system">系统模板 <span>'+agents.filter(function(a){return a.type==="system";}).length+'</span></button></div>\
          <label class="agent-search">'+icons.search+'<input id="agentSearch" placeholder="搜索智能体..."></label>\
        </section>\
        <section class="agent-grid" aria-label="智能体列表">'
          +(activeAgentFilter==="all"?'<div class="agent-create-card" id="newAgentBtn" role="button" tabindex="0"><span>'+icons.plus+'</span><strong>创建智能体</strong><small>定义专属于你的知识整理方式</small></div>':'')
          +cards+
        '</section>\
        <div class="empty-message" id="agentEmpty"><strong>没有找到匹配的智能体</strong></div>\
      </div>';
  }

  function templateAgentEditor(){
    var agent=agentEditing?agents.find(function(a){return a.id===agentEditing;}):null;
    var title=agent?'修改智能体':'创建智能体';
    return '\
      <div class="agent-editor-backdrop" id="agentEditorBackdrop">\
        <section class="agent-editor-modal" role="dialog" aria-modal="true" aria-label="'+title+'">\
          <div class="agent-editor-head"><div><span>'+(agent?'修改智能体':'创建智能体')+'</span><h3>定义知识整理角色</h3></div>\
          <button class="icon-button" id="closeAgentEditor" aria-label="关闭">'+icons.close+'</button></div>\
          <form class="agent-editor-form" id="agentEditorForm">\
            <div class="agent-editor-identity">\
              <div class="avatar-field"><span>智能体头像 <small>1:1</small></span>\
                <label class="agent-avatar-upload-tile">\
                  <div class="agent-avatar-preview" id="agentAvatarPreview">'+agentAvatarContent(agentEditingDraft.avatar,agentEditingDraft.name)+'</div>\
                  <span class="agent-avatar-upload-overlay">'+icons.upload+'<b>本地上传</b></span>\
                  <input id="agentAvatarFile" type="file" accept="image/png,image/jpeg,image/webp">\
                </label>\
              </div>\
              <div class="agent-editor-name-stack">\
                <label class="form-field"><span>智能体名称</span><input name="name" required value="'+agentEditingDraft.name+'"></label>\
                <button class="agent-avatar-generate" id="generateAgentAvatar" type="button">'+icons.sparkles+'<span>AI 基于内容生成</span></button>\
                <small>根据名称、描述和使用场景生成头像</small>\
              </div>\
            </div>\
            <label class="form-field"><span>智能体描述</span><textarea name="description">'+agentEditingDraft.description+'</textarea></label>\
            <label class="form-field"><span>知识使用场景</span><textarea name="scenario">'+agentEditingDraft.scenario+'</textarea></label>\
            <label class="form-field"><span>整理策略</span><textarea name="strategy">'+agentEditingDraft.strategy+'</textarea></label>\
            <label class="form-field"><span>核心方向</span><textarea name="direction">'+agentEditingDraft.direction+'</textarea></label>\
            <label class="form-field"><span>其他要求</span><textarea name="requirements">'+agentEditingDraft.requirements+'</textarea></label>\
            <div class="agent-editor-actions"><button type="button" id="cancelAgentEditor">取消</button><button class="primary" type="submit">'+(agent?'保存修改':'创建智能体')+'</button></div>\
          </form>\
        </section>\
      </div>';
  }

  function templatePages(){
    var cards=pageRows.map(function(page){
      return '<button type="button" class="knowledge-page-card" data-go-view="document">'
        +'<div class="card-topline"><span>'+page.type+'</span><small class="'+(page.status==='已确认'?'ok':'warn')+'">'+page.status+'</small></div>'
        +'<h3>'+page.title+'</h3>'
        +'<p>'+page.sources+' 个来源参与重构，引用覆盖和关系图谱已同步。外部 AI 默认读取最新确认版本。</p>'
        +'<div class="card-metrics"><span>可信度 '+page.confidence+'</span><span>'+page.updated+'</span></div></button>';
    }).join("");
    return '\
      <div class="page-stack">\
        <section class="raw-files-header"><div><p class="eyebrow">Knowledge Pages</p><h2>AI 重构后的长期知识资产</h2><p>这些页面不是原始文件摘要，而是系统把多份资料、证据和关系合并后的只读知识页。</p></div>'
        +'<button data-go-view="health">查看质量问题</button></section>'
        +'<section class="page-gallery">'+cards+'</section>\
      </div>';
  }

  function templateDocument(){
    var section=currentDocumentId?currentDocumentId:getCurrentKnowledge().groups[0].items[0].id;
    var content=getCurrentKnowledge().content[section]||getCurrentKnowledge().content[getCurrentKnowledge().groups[0].items[0].id];
    var toc='<div class="article-side-content"><div class="right-heading">Markdown 目录</div>'
      +'<a href="#overview">01 页面概览</a><a href="#claims">02 核心结论</a><a href="#body">03 重构正文</a><a href="#relations">04 相关关系</a><a href="#sources">05 来源证据</a></div>';
    return '\
      <div class="article-page">\
        <article class="document-view knowledge-document">\
          <div class="doc-status-row">\
            <span class="status-pill green">'+icons.check+'已确认</span>\
            <span class="status-pill blue">'+icons.link+'7 个来源 · 18 条引用</span>\
            <span class="status-pill amber">'+icons.clock+'今天 10:42 更新</span>\
          </div>\
          <h2>'+content.title+'</h2>\
          <p class="lead">这是一篇由 AI 从来源资料中重构出的 Knowledge Page。页面保留核心结论、来源引用、相关关系和修订记录；右侧智能体会自动跟随当前知识页。</p>\
          <div class="article-action-bar">\
            <button class="primary" data-agent-open data-agent-prompt="总结当前知识页">'+icons.sparkles+'<span>唤起智能体</span></button>\
            <button data-go-view="graph">查看关联</button>\
            <button data-agent-open data-agent-prompt="把当前知识页转成可执行应用方案">生成应用方案</button>\
          </div>\
          <section class="summary-strip" id="overview">\
            <div><strong>对象类型</strong><span>主题</span></div>\
            <div><strong>可信度</strong><span>86%</span></div>\
            <div><strong>引用覆盖</strong><span>18 / 22 段</span></div>\
            <div><strong>关联节点</strong><span>23 个</span></div>\
          </section>\
          <div class="markdown-body">\
            <section id="claims"><h2>核心结论</h2><ol class="markdown-claims">'
              +'<li>Metask 是面向企业智能工作的系统品牌，把分散的知识、任务与流程组织成可执行的智能系统。 <code>[S01]</code> <code>[S02]</code></li>'
              +'<li>品牌视觉识别系统以“复杂输入 → 结构化组织 → 精确折叠 → 清晰输出”为核心理论框架。 <code>[S03]</code> <code>[S07]</code></li>'
            +'</ol><blockquote class="markdown-warning"><strong>待确认</strong><p>品牌色主色值在两份文档中存在版本差异，需进一步确认。 <code>[S09]</code></p></blockquote></section>\
            <section id="body"><h2>重构正文</h2>'+content.html+'</section>\
            <section id="relations"><h2>相关关系</h2><table><thead><tr><th>关系类型</th><th>关联内容</th></tr></thead><tbody>'
              +'<tr><td>品牌</td><td>Metask</td></tr>'
              +'<tr><td>理论</td><td>视觉识别核心框架</td></tr>'
              +'<tr><td>资产</td><td>主标志与辅助符号</td></tr>'
              +'<tr><td>来源</td><td>DESIGN.md、设计系统文档</td></tr>'
            +'</tbody></table></section>\
            <section id="sources"><h2>来源证据</h2><ul class="markdown-sources">'
              +'<li><code>[S01]</code> DESIGN.md · 品牌使命与定位</li>'
              +'<li><code>[S03]</code> metask-design-system.html · 视觉识别框架</li>'
              +'<li><code>[S09]</code> 配色规范.md · OCR 低置信 · 待确认</li>'
            +'</ul></section>\
          </div>\
          <div class="button-row"><button data-correction-open>指出问题</button><button data-go-view="graph">查看图谱页</button><button data-go-view="health">查看健康问题</button></div>\
        </article>\
        <aside class="article-toc"><div class="toc-card">\
          <div class="toc-toolbar" aria-label="右侧功能">'
            +'<button class="'+(articleSideTab==='toc'?'is-active':'')+'" data-side-tab="toc" aria-label="文章目录">'+icons.list+'<span>目录</span></button>'
            +'<button class="'+(articleSideTab==='ask'?'is-active':'')+'" data-side-tab="ask" aria-label="AI Ask">'+icons.bot+'<span>Ask</span></button>'
            +'<button class="'+(articleSideTab==='relations'?'is-active':'')+'" data-side-tab="relations" aria-label="知识关联">'+icons.network+'<span>关联</span></button>'
            +'<button class="'+(articleSideTab==='apps'?'is-active':'')+'" data-side-tab="apps" aria-label="内容应用">'+icons.blocks+'<span>应用</span></button>'
          +'</div>'
          +(articleSideTab==='toc'?toc:'')
          +(articleSideTab==='ask'?'<div class="copilot-body"><div class="copilot-message user">这篇文章最重要的结论是什么？</div><div class="copilot-message assistant">Metask 的核心定位是企业智能执行系统，关键差异在于把分散资料重构成可被 AI 调用的长期知识资产。结论主要来自 S01 品牌定位和 S03 视觉识别框架。</div><div class="prompt-grid"><button>解释这篇文章</button><button>找出不确定结论</button><button>生成会议摘要</button><button>列出引用来源</button></div><div class="chat-input"><input placeholder="向这篇内容提问..."><button>'+icons.arrow+'</button></div></div>':'')
          +(articleSideTab==='relations'?'<div class="copilot-body"><div class="right-block"><div class="right-heading">知识点</div>'+["复杂输入","结构化组织","精确折叠","清晰输出"].map(function(i){return '<div class="source-chip">'+icons.filetext+'<span>'+i+'</span></div>';}).join("")+'</div><div class="right-block"><div class="right-heading">图谱关联内容</div>'+["Metask","视觉识别框架","主标志","DESIGN.md"].map(function(i){return '<div class="source-chip">'+icons.network+'<span>'+i+'</span></div>';}).join("")+'</div></div>':'')
          +(articleSideTab==='apps'?'<div class="copilot-body"><button class="app-entry">'+icons.message+'<div><strong>生成视频脚本</strong><span>把这篇知识页转成 3 分钟讲解脚本</span></div></button><button class="app-entry">'+icons.filetext+'<div><strong>生成长图</strong><span>提炼核心结论、时间线和引用来源</span></div></button><button class="app-entry">'+icons.sparkles+'<div><strong>生成汇报材料</strong><span>输出给团队评审使用的结构化提纲</span></div></button></div>':'')
        +'</div></aside>\
      </div>';
  }

  function getSearchAnswerData(question){
    var query=(question||"").toLowerCase();
    if(/历史|中国|文明|朝代|秦汉|隋唐|宋元|明清|近代/.test(query)){
      return {
        scopeId:"history",
        answer:"当前中国历史专题按四个主要阶段组织：先秦文明、统一帝国、宋元明清和近现代史。内容从中华文明起源与夏商周展开，延伸到秦汉大一统、隋唐制度与社会、宋元经济文化、明清国家与世界，以及近代转型和现代中国发展。",
        citations:["[S12] 中国历史纲要.md","[S18] 历史年表.pdf"],
        results:[
          ["Knowledge Page","中国历史专题概览","覆盖从先秦文明到现代中国发展的主要阶段。"],
          ["Source Evidence","中国历史纲要.md","命中历史分期、制度演进与社会变迁。"],
          ["Graph Node","先秦文明 → 现代中国","展示各历史阶段之间的时间与主题关系。"]
        ]
      };
    }
    if(/地理|气候|地图|区域|人口|城市|生态|地貌/.test(query)){
      return {
        scopeId:"geography",
        answer:"当前世界地理知识库从自然地理和人文地理两条主线组织内容，包括地球系统、气候与水循环、地貌与生态、人口与城市、产业联系，以及世界主要区域和地图空间数据。",
        citations:["[S21] 世界地理框架.md","[S24] 地图数据说明.pdf"],
        results:[
          ["Knowledge Page","世界地理知识概览","整合自然地理、人文地理与区域知识。"],
          ["Source Evidence","世界地理框架.md","命中气候、地貌、生态与区域结构。"],
          ["Graph Node","自然系统 ↔ 人类活动","展示环境过程与人口、城市和产业的关系。"]
        ]
      };
    }
    if(/metask|品牌|视觉|vi|设计|界面/.test(query)){
      return {
        scopeId:"metask",
        answer:"Metask 定位为企业智能执行系统，致力于把分散的知识、任务与流程组织成可执行、可追溯、可持续优化的智能系统。核心理念为“Know-how → Work → Intelligence System”。部分截图 OCR 置信度偏低，不建议直接用于正式结论。",
        citations:["[S01] DESIGN.md","[S03] metask-design-system.html","[S09] 配色规范.md"],
        results:[
          ["Knowledge Page","METASK 品牌 VI 系统概述","最推荐点击，长期知识资产，已合并 7 个来源。"],
          ["Source Evidence","metask-design-system.html","命中视觉识别框架与品牌定位表述。"],
          ["Graph Node","视觉识别核心理论","与 Metask、品牌资产与设计判断相关。"]
        ]
      };
    }
    return {
      scopeId:"metask",
      answer:"已检索当前全部知识库，但尚未找到足以直接回答该问题的可靠证据。建议补充相关来源文件，或调整问题中的对象名称、时间范围和关键词后重新搜索。",
      citations:["未找到可直接引用的来源"],
      results:[
        ["Knowledge Base","metask——视觉","品牌视觉、产品界面与应用规范。"],
        ["Knowledge Base","中国历史专题","从先秦文明到现代中国发展。"],
        ["Knowledge Base","世界地理知识","自然地理、人文地理与区域知识。"]
      ]
    };
  }

  function templateSearch(){
    var searchQuestion=(globalSearchQuery||"").trim();
    var hasQuestion=searchQuestion.length>0;
    var selectedSearchScope=searchScopeId==="all"?null:scopes.find(function(scope){return scope.id===searchScopeId;});
    var answerData=hasQuestion?getSearchAnswerData(searchQuestion):null;
    if(hasQuestion&&selectedSearchScope&&answerData.scopeId!==selectedSearchScope.id){
      answerData={
        scopeId:selectedSearchScope.id,
        answer:"已在「"+selectedSearchScope.name+"」中完成检索，但当前资料不足以可靠回答这个问题。建议补充相关来源，或调整对象名称、时间范围与关键词后重新搜索。",
        citations:["未找到可直接引用的来源"],
        results:[
          ["Knowledge Base",selectedSearchScope.name,selectedSearchScope.description],
          ["Search Scope","当前检索范围","仅检索「"+selectedSearchScope.name+"」中的知识页、来源文件与图谱关系。"]
        ]
      };
    }
    var effectiveScopes=selectedSearchScope?[selectedSearchScope]:scopes;
    var totalSources=effectiveScopes.reduce(function(total,scope){
      return total+(scopeKnowledge[scope.id]?scopeKnowledge[scope.id].sources.length:0);
    },0);
    var totalPages=effectiveScopes.reduce(function(total,scope){return total+scope.docs;},0);
    var scopeLabel=selectedSearchScope?selectedSearchScope.name:"全部知识库";
    var searchHeading=selectedSearchScope?"在「"+selectedSearchScope.name+"」中搜索答案":"跨全部知识库搜索答案";
    var searchDescription=selectedSearchScope
      ?"系统仅检索该知识库中的资料、知识页与图谱关系，并在回答中保留来源引用。"
      :"系统会检索所有已上传资料、知识页与图谱关系，并在回答中保留来源引用。";
    var searchScopeOptions='<option value="all"'+(searchScopeId==="all"?" selected":"")+'>全部知识库</option>'
      +scopes.map(function(scope){
        return '<option value="'+scope.id+'"'+(searchScopeId===scope.id?" selected":"")+'>'+escapeHTML(scope.name)+'</option>';
      }).join("");
    var searchOutput='';
    if(hasQuestion){
      var citations=answerData.citations.map(function(citation){return '<span>'+escapeHTML(citation)+'</span>';}).join("");
      var resultItems=answerData.results.map(function(result){
        return '<article class="result-item" role="button" tabindex="0" data-open-scope="'+answerData.scopeId+'"><span>'+result[0]+'</span><strong>'+result[1]+'</strong><p>'+result[2]+'</p></article>';
      }).join("");
      searchOutput='\
        <section class="answer-card">\
          <div class="search-answer-inner">\
          <div class="answer-header">'+icons.bot+'<span>带引用回答</span></div>\
          <h2>'+escapeHTML(searchQuestion)+'</h2>\
          <p>已在「'+escapeHTML(scopeLabel)+'」中完成检索。'+escapeHTML(answerData.answer)+'</p>\
          <div class="citation-list">'+citations+'</div>\
          <div class="button-row"><button data-go-view="document">打开知识页</button><button data-correction-open>这个回答有问题</button></div>\
          </div>\
        </section>\
        <section class="panel">\
          <div class="search-result-inner">\
          <div class="panel-title">搜索结果分层</div>\
          <div class="result-list">'+resultItems+'</div>\
          </div>\
        </section>';
    }else{
      searchOutput='\
        <section class="search-empty-state" aria-live="polite">\
          <span class="search-empty-icon">'+icons.search+'</span>\
          <h2>输入问题开始搜索</h2>\
          <p>先选择知识库范围，再输入你想了解的问题。提交后，这里会展示带引用回答和分层搜索结果。</p>\
          <div class="search-empty-examples" aria-label="示例问题">\
            <button type="button" data-search-example="Metask 的品牌定位是什么？">品牌定位是什么？</button>\
            <button type="button" data-search-example="中国历史专题包含哪些阶段？">历史专题包含哪些阶段？</button>\
            <button type="button" data-search-example="世界地理知识库有哪些核心主题？">地理知识有哪些核心主题？</button>\
          </div>\
        </section>';
    }
    return '\
      <div class="search-page">\
        <section class="search-query-panel">\
          <div class="search-query-heading"><div><h2>'+escapeHTML(searchHeading)+'</h2><p>'+escapeHTML(searchDescription)+'</p></div></div>\
          <form class="knowledge-search-form" id="knowledgeSearchForm">\
            <label class="knowledge-search-scope">'+icons.database+'<select id="knowledgeSearchScope" name="scope" aria-label="选择知识库范围">'+searchScopeOptions+'</select></label>\
            <div class="knowledge-search-input-row">\
              <input name="question" aria-label="输入要搜索的问题" value="'+escapeHTML(searchQuestion)+'" placeholder="输入问题，例如：过去几年与 A 公司合作过哪些项目？" autocomplete="off">\
              <button class="primary" type="submit">'+icons.search+'<span>搜索答案</span></button>\
            </div>\
          </form>\
          <div class="search-scope-summary"><span>'+escapeHTML(scopeLabel)+'</span><strong>'+effectiveScopes.length+' 个知识库</strong><strong>'+totalSources+' 份来源文件</strong><strong>'+totalPages+' 个知识页</strong></div>\
        </section>\
        '+searchOutput+'\
      </div>';
  }

  function templateHealth(){
    var scope=getCurrentScope();
    var healthTitle=libraryOpen?"检查「"+scope.name+"」的知识质量":"把不可靠知识显性化";
    var healthDescription=libraryOpen
      ?"检查当前知识库中的缺引用、来源冲突、低置信、过期和解析质量问题，确保每条知识都可以追溯。"
      :"知识质检会标出缺引用、来源冲突、低置信、过期和解析质量问题，避免知识页看起来正确但无法追溯。";
    var healthScore=libraryOpen?scope.health:72;
    var rows=healthIssues.map(function(issue){
      var actionView=issue.action==="提交纠错"?"":issue.action==="重跑 OCR"?"sources":"document";
      var actionAttr=actionView?' data-go-view="'+actionView+'"':' data-correction-open';
      return '<tr><td>'+issue.type+'</td><td>'+issue.title+'</td><td>'+issue.page+'</td>'
        +'<td><span class="file-status '+(issue.severity==='高'?'failed':'compiling')+'">'+issue.severity+'</span></td>'
        +'<td><button class="text-button"'+actionAttr+'>'+issue.action+'</button></td></tr>';
    }).join("");
    return '\
      <div class="page-stack">\
        <section class="raw-files-header"><div><p class="eyebrow">Knowledge Health</p><h2>'+escapeHTML(healthTitle)+'</h2><p>'+escapeHTML(healthDescription)+'</p></div>'
        +'<button class="primary" data-correction-open>提交纠错</button></section>\
        <section class="metric-grid compact">\
          <div class="metric-card green"><div><span>健康度</span><strong>'+healthScore+'</strong></div>'+icons.heart+'</div>\
          <div class="metric-card red"><div><span>高优先问题</span><strong>2</strong></div>'+icons.alert+'</div>\
          <div class="metric-card amber"><div><span>缺少引用</span><strong>5</strong></div>'+icons.link+'</div>\
          <div class="metric-card blue"><div><span>低置信来源</span><strong>6</strong></div>'+icons.archive+'</div>\
        </section>\
        <section class="panel table-panel">\
          <div class="panel-title">待处理问题</div>\
          <table><thead><tr><th>类型</th><th>问题</th><th>关联页面</th><th>优先级</th><th>动作</th></tr></thead><tbody>'+rows+'</tbody></table>\
        </section>\
      </div>';
  }

  function templateMcp(){
    var tools=[
      ["search_knowledge_pages","搜索知识页并返回匹配原因"],
      ["read_knowledge_page","读取最新确认版本和引用"],
      ["answer_with_citations","基于知识库生成带引用回答"],
      ["list_source_evidence","查看回答或页面背后的来源证据"],
      ["get_graph_neighbors","读取某个页面或实体的一度关系"]
    ];
    var toolCards=tools.map(function(t){return '<div class="tool-card"><strong>'+t[0]+'</strong><span>'+t[1]+'</span><small>read only</small></div>';}).join("");
    return '\
      <div class="settings-page">\
        <section class="settings-hero"><div><p class="eyebrow">Read-only MCP</p><h2>让外部 AI 读取同一套可信知识</h2><p>Owner 可以开启只读 MCP tools。Codex、Claude、Cursor 或企业 Agent 可以搜索和读取知识页，但不能写入、删除或纠错。</p></div>'
        +'<span class="status-pill green">'+icons.lock+'<span>只读已启用</span></span></section>\
        <section class="settings-panel">\
          <div class="settings-section-head"><div><h3>开放工具</h3><p>第一版只展示读取类工具，写入和导入能力默认不存在。</p></div><button>轮换凭证</button></div>\
          <div class="tool-grid">'+toolCards+'</div>\
        </section>\
        <section class="settings-panel">\
          <div class="settings-section-head"><div><h3>客户端配置</h3><p>复制后可放入外部 AI 客户端。权限范围限定为当前知识库。</p></div><button class="primary">复制配置</button></div>'
          +'<pre class="config-block">'+'{\n  "mcpServers": {\n    "knowforge": {\n      "url": "https://knowforge.site/mcp",\n      "headers": {\n        "Authorization": "Bearer ****"\n      }\n    }\n  }\n}'+'</pre>'
        +'</section>\
        <section class="settings-panel">\
          <div class="settings-section-head"><div><h3>最近调用</h3><p>每次外部 AI 调用都会保留客户端、tool、知识库和结果数量。</p></div></div>'
          +'<div class="access-log">'
            +'<div class="log-row"><div><strong>Codex</strong><span>answer_with_citations</span></div><p>返回 1 个回答、3 条引用</p><small>今天 10:58</small></div>'
            +'<div class="log-row"><div><strong>Claude</strong><span>read_knowledge_page</span></div><p>读取 METASK 品牌 VI 系统概述</p><small>今天 10:44</small></div>'
            +'<div class="log-row"><div><strong>Cursor</strong><span>search_knowledge_pages</span></div><p>命中 5 个页面</p><small>昨天 22:10</small></div>'
          +'</div>\
        </section>\
      </div>';
  }

  function bindViewActions(){
    $$("[data-go-view]").forEach(function(node){
      node.addEventListener("click",function(){navigate(node.dataset.goView);});
    });
    var importScopeSelect=$("#importScopeSelect");
    if(importScopeSelect){
      importScopeSelect.addEventListener("change",function(){
        importState.scope=importScopeSelect.value;
        renderView();
      });
    }
    var importAgentSelect=$("#importAgentSelect");
    if(importAgentSelect){
      importAgentSelect.addEventListener("change",function(){
        importState.agent=importAgentSelect.value;
        renderView();
      });
    }
    $$("[data-import-method]").forEach(function(node){
      node.addEventListener("click",function(){
        importState.method=node.dataset.importMethod;
        renderView();
      });
    });
    var importFileInput=$("#importFileInput");
    $$("[data-import-pick]").forEach(function(node){
      node.addEventListener("click",function(event){
        event.stopPropagation();
        if(importFileInput)importFileInput.click();
      });
    });
    var importDropzone=$("#importDropzone");
    if(importDropzone){
      importDropzone.addEventListener("keydown",function(event){
        if(event.key==="Enter"||event.key===" "){
          event.preventDefault();
          if(importFileInput)importFileInput.click();
        }
      });
    }
    if(importFileInput){
      importFileInput.addEventListener("change",function(){
        importState.files=Array.from(importFileInput.files||[]).map(function(file){return file.name;});
        renderView();
      });
    }
    var importTextInput=$("#importTextInput");
    if(importTextInput)importTextInput.addEventListener("input",function(){importState.text=importTextInput.value;});
    var importUrlInput=$("#importUrlInput");
    if(importUrlInput)importUrlInput.addEventListener("input",function(){importState.url=importUrlInput.value;});
    var uploadZone=$("#uploadZone");
    var chooseFile=$("#chooseFileBtn");
    if(uploadZone){
      uploadZone.addEventListener("click",function(){toast("请选择需要上传的文件","warn");});
      uploadZone.addEventListener("keydown",function(event){
        if(event.key==="Enter"||event.key===" "){event.preventDefault();uploadZone.click();}
      });
    }
    if(chooseFile)chooseFile.addEventListener("click",function(){toast("请选择需要上传的文件","warn");});
    var knowledgeSearchForm=$("#knowledgeSearchForm");
    if(knowledgeSearchForm){
      knowledgeSearchForm.addEventListener("submit",function(event){
        event.preventDefault();
        var question=knowledgeSearchForm.elements.question.value.trim();
        if(!question){
          toast("请输入想要搜索的问题","warn");
          knowledgeSearchForm.elements.question.focus();
          return;
        }
        searchScopeId=knowledgeSearchForm.elements.scope.value;
        globalSearchQuery=question;
        $("#globalSearchInput").value=question;
        renderView();
      });
      var knowledgeSearchScope=$("#knowledgeSearchScope");
      if(knowledgeSearchScope)knowledgeSearchScope.addEventListener("change",function(){
        searchScopeId=knowledgeSearchScope.value;
        globalSearchQuery=knowledgeSearchForm.elements.question.value.trim();
        renderView();
      });
    }
    $$("[data-search-example]").forEach(function(node){
      node.addEventListener("click",function(){
        globalSearchQuery=node.dataset.searchExample;
        $("#globalSearchInput").value=globalSearchQuery;
        renderView();
      });
    });
    $$("[data-upload-mode]").forEach(function(node){
      node.addEventListener("click",function(){
        uploadMode=node.dataset.uploadMode;
        renderView();
      });
    });
    $$("[data-reader-section]").forEach(function(node){
      node.addEventListener("click",function(event){
        event.stopPropagation();
        openReaderSection(node.dataset.readerSection);
      });
    });
    $$("[data-library-content]").forEach(function(node){
      node.addEventListener("click",function(){
        currentReaderSection=node.dataset.libraryContent;
        currentDocumentId=node.dataset.libraryContent;
        navigate("document");
      });
    });
    $$("[data-open-scope]").forEach(function(node){
      var openScope=function(){selectScope(node.dataset.openScope);};
      node.addEventListener("click",openScope);
      if(node.classList.contains("result-item"))node.addEventListener("keydown",function(event){
        if(event.key==="Enter"||event.key===" "){
          event.preventDefault();
          openScope();
        }
      });
    });
    $$("[data-regenerate-scope]").forEach(function(node){
      node.addEventListener("click",function(event){
        event.stopPropagation();
        var scope=scopes.find(function(item){return item.id===node.dataset.regenerateScope;});
        var card=node.closest(".library-card");
        scope.files.pending=0;
        scope.files.processing=scope.files.total;
        scope.files.graphed=0;
        updateProcessingStats(card,scope.files);
        node.disabled=true;
        node.textContent="正在生成…";
        setTimeout(function(){
          scope.files.processing=0;
          scope.files.graphed=scope.files.total;
          updateProcessingStats(card,scope.files);
          node.disabled=false;
          node.textContent="↻ 重新生成";
          toast("「"+scope.name+"」已根据本地最新文件重新生成","success");
        },900);
      });
    });
    var libraryListButton=$("[data-library-list]");
    if(libraryListButton){
      libraryListButton.addEventListener("click",function(){
        libraryOpen=false;
        renderScopes();
        navigate("overview");
      });
    }
    var loginForm=$("#loginForm");
    if(loginForm){
      loginForm.addEventListener("submit",function(event){
        event.preventDefault();
        accountState.loggedIn=true;
        accountState.name="Jowelin";
        accountState.email=loginForm.elements.email.value||"owner@knowforge.local";
        accountState.role="Owner";
        accountState.plan="14 天体验";
        accountState.remainingDays=9;
        accountState.points=184;
        accountState.pointsTotal=300;
        accountState.storageUsed="126 MB";
        accountState.storageTotal="200 MB";
        renderAccountCenter();
        toast("登录成功","success");
        navigate("overview");
        openAccountModal("profile");
      });
    }
    var registerForm=$("#registerForm");
    if(registerForm){
      registerForm.addEventListener("submit",function(event){
        event.preventDefault();
        accountState.loggedIn=true;
        accountState.name=registerForm.elements.name.value||"新用户";
        accountState.email=registerForm.elements.email.value||"new@knowforge.local";
        accountState.role="个人用户";
        accountState.plan="14 天体验";
        accountState.remainingDays=14;
        accountState.points=300;
        accountState.pointsTotal=300;
        accountState.storageUsed="0 B";
        accountState.storageTotal="200 MB";
        renderAccountCenter();
        toast("账户已创建，体验版已开通","success");
        navigate("overview");
        openAccountModal("profile");
      });
    }
    $$("[data-account-action]").forEach(function(node){
      node.addEventListener("click",function(){
        if(node.dataset.accountAction==="logout"){
          logoutAccount();
        }
      });
    });
    $$("[data-select-plan]").forEach(function(node){
      node.addEventListener("click",function(){
        var plan=membershipPlans.find(function(item){return item.id===node.dataset.selectPlan;});
        if(plan.id==="enterprise"){
          toast("企业顾问会为你配置私有方案","success");
          return;
        }
        if(!accountState.loggedIn){
          toast("登录后可选择会员方案","warn");
          navigate("login");
          return;
        }
        var storageMap={trial:"2 GB",pro:"100 GB",ultimate:"1 TB",team:"2 TB",enterprise:"弹性存储"};
        var pointsMap={trial:1000,pro:50000,ultimate:300000,team:1000000,enterprise:0};
        accountState.plan=plan.name;
        accountState.storageTotal=storageMap[plan.id];
        accountState.points=pointsMap[plan.id];
        accountState.pointsTotal=pointsMap[plan.id];
        accountState.remainingDays=30;
        renderAccountCenter();
        toast("已切换为"+plan.name,"success");
        navigate("profile");
      });
    });
    $$("[data-agent-filter]").forEach(function(node){
      node.addEventListener("click",function(){
        activeAgentFilter=node.dataset.agentFilter;
        renderView();
      });
    });
    var agentSearch=$("#agentSearch");
    if(agentSearch){
      agentSearch.addEventListener("input",function(){
        var query=agentSearch.value.trim().toLowerCase();
        var visible=0;
        $$(".agent-card").forEach(function(card){
          var matches=!query||(card.dataset.search||"").toLowerCase().indexOf(query)>=0;
          card.style.display=matches?"":"none";
          if(matches)visible++;
        });
        var empty=$("#agentEmpty");
        if(empty)empty.classList.toggle("show",visible===0);
      });
    }
    var newAgentBtn=$("#newAgentBtn");
    if(newAgentBtn){
      var openNewAgentEditor=function(){
        agentEditing=null;
        agentEditingDraft={
          name:"我的知识智能体",avatar:"",
          description:"按照我的工作方式整理资料，并持续沉淀可复用的个人知识。",
          scenario:"个人项目、工作资料与长期知识管理",
          strategy:"按主题和项目归类，合并重复信息，保留关键事实与来源。",
          direction:"核心结论、关键决策、经验方法与待办事项",
          requirements:"保持简洁，无法确认的内容必须明确标记。"
        };
        agentEditorOpen=true;
        renderView();
      };
      newAgentBtn.addEventListener("click",openNewAgentEditor);
      newAgentBtn.addEventListener("keydown",function(event){
        if(event.key==="Enter"||event.key===" "){
          event.preventDefault();
          openNewAgentEditor();
        }
      });
    }
    var closeAgentEditor=$("#closeAgentEditor");
    if(closeAgentEditor)closeAgentEditor.addEventListener("click",function(){agentEditorOpen=false;renderView();});
    var cancelAgentEditor=$("#cancelAgentEditor");
    if(cancelAgentEditor)cancelAgentEditor.addEventListener("click",function(){agentEditorOpen=false;renderView();});
    var agentEditorBackdrop=$("#agentEditorBackdrop");
    if(agentEditorBackdrop)agentEditorBackdrop.addEventListener("click",function(event){if(event.target===agentEditorBackdrop){agentEditorOpen=false;renderView();}});
    var agentAvatarPreview=$("#agentAvatarPreview");
    var agentAvatarFile=$("#agentAvatarFile");
    var generateAgentAvatar=$("#generateAgentAvatar");
    var agentEditorForm=$("#agentEditorForm");
    var updateAgentAvatarPreview=function(){
      if(agentAvatarPreview)agentAvatarPreview.innerHTML=agentAvatarContent(agentEditingDraft.avatar,agentEditingDraft.name);
    };
    var agentNameInput=agentEditorForm&&agentEditorForm.elements.name;
    if(agentNameInput){
      agentNameInput.addEventListener("input",function(){
        agentEditingDraft.name=agentNameInput.value;
        if(!agentEditingDraft.avatar)updateAgentAvatarPreview();
      });
    }
    if(agentAvatarFile){
      agentAvatarFile.addEventListener("change",function(){
        var file=agentAvatarFile.files&&agentAvatarFile.files[0];
        squareAvatarFromFile(file,function(dataUrl){
          agentEditingDraft.avatar=dataUrl;
          updateAgentAvatarPreview();
          toast("头像已裁切为 1:1","success");
        });
      });
    }
    if(generateAgentAvatar){
      generateAgentAvatar.addEventListener("click",function(){
        syncAgentEditorDraft($("#agentEditorForm"));
        agentEditingDraft.avatar=generatedAgentAvatar(agentEditingDraft);
        updateAgentAvatarPreview();
        toast("已根据智能体内容生成头像","success");
      });
    }
    if(agentEditorForm){
      agentEditorForm.addEventListener("submit",function(event){
        event.preventDefault();
        var draft=syncAgentEditorDraft(agentEditorForm);
        if(agentEditing){
          var existing=agents.find(function(a){return a.id===agentEditing;});
          if(existing){
            existing.name=draft.name;existing.avatar=draft.avatar;existing.description=draft.description;
            existing.scenario=draft.scenario;existing.strategy=draft.strategy;
            existing.direction=draft.direction;existing.requirements=draft.requirements;
          }
          toast("智能体已更新","success");
        }else{
          agents.unshift({
            id:"custom-"+Date.now(),name:draft.name,avatar:draft.avatar,type:"custom",
            category:"自定义",description:draft.description,status:"草稿",
            scenario:draft.scenario,strategy:draft.strategy,direction:draft.direction,requirements:draft.requirements
          });
          toast("自建智能体已保存","success");
        }
        agentEditorOpen=false;
        agentEditing=null;
        renderView();
      });
    }
    $$("[data-agent-use]").forEach(function(node){
      node.addEventListener("click",function(){
        activeAgentId=node.dataset.agentUse;
        agentDockOpen=true;
        renderAgentDock();
        toast("已打开「"+getActiveAgent().name+"」对话","success");
      });
    });
    $$("[data-agent-open]",$("#view")).forEach(function(node){
      node.addEventListener("click",function(){
        agentDockOpen=true;
        renderAgentDock();
      });
    });
    $$("[data-agent-prompt]",$("#view")).forEach(function(node){
      node.addEventListener("click",function(){
        agentDockOpen=true;
        sendAgentMessage(node.dataset.agentPrompt);
      });
    });
    $$("[data-agent-edit]").forEach(function(node){
      node.addEventListener("click",function(){
        var agent=agents.find(function(a){return a.id===node.dataset.agentEdit;});
        if(!agent)return;
        agentEditing=agent.id;
        agentEditingDraft={name:agent.name,avatar:agent.avatar,description:agent.description,scenario:agent.scenario||"",strategy:agent.strategy||"",direction:agent.direction||"",requirements:agent.requirements||""};
        agentEditorOpen=true;
        renderView();
      });
    });
    $$("[data-open-document]").forEach(function(node){
      node.addEventListener("click",function(){
        currentDocumentId=node.dataset.openDocument;
        currentReaderSection=currentDocumentId;
        navigate("document");
      });
    });
    $$("[data-side-tab]").forEach(function(node){
      node.addEventListener("click",function(){
        articleSideTab=node.dataset.sideTab;
        renderView();
      });
    });
    $$("[data-correction-open]").forEach(function(node){
      node.addEventListener("click",function(){toast("纠错抽屉将在正式版提供","warn");});
    });
  }

  function applySearch(value){
    var query=(value||"").trim().toLowerCase();
    var items=$$(".searchable");
    if(!items.length)return;
    var visible=0;
    items.forEach(function(item){
      var text=(item.dataset.search||item.textContent).toLowerCase();
      var show=!query||text.indexOf(query)>=0;
      item.style.display=show?"":"none";
      if(show)visible++;
    });
    var empty=$("#searchEmpty");
    if(empty)empty.classList.toggle("show",visible===0);
  }

  var toastTimer;
  function toast(message,type){
    var node=$("#toast");
    node.textContent=message;
    node.className="toast "+(type||"")+" show";
    clearTimeout(toastTimer);
    toastTimer=setTimeout(function(){node.classList.remove("show");},2400);
  }

  $("#globalSearchInput").addEventListener("input",function(event){applySearch(event.target.value);});
  $("#globalSearchInput").addEventListener("keydown",function(event){
    if(event.key!=="Enter")return;
    event.preventDefault();
    globalSearchQuery=event.currentTarget.value.trim();
    navigate("search");
  });
  $("#createScopeNavBtn").addEventListener("click",startNewLibraryImport);
  $(".sidebar-create").addEventListener("click",startNewLibraryImport);
  document.addEventListener("click",function(event){
    if(accountMenuOpen&&!event.target.closest(".account-center-card")){
      accountMenuOpen=false;
      renderAccountCenter();
    }
    var button=event.target.closest("[data-go-view]");
    if(button&&!button.closest("#view")){
      var targetView=button.dataset.goView;
      if(["upload","sources","graph","packages","document"].indexOf(targetView)>=0&&!libraryOpen){
        toast("请先选择一个知识库","warn");
        return;
      }
      navigate(targetView);
    }
  });
  document.addEventListener("keydown",function(event){
    if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="k"){
      event.preventDefault();$("#globalSearchInput").focus();
    }
    if(event.key==="Escape"){
      $("#globalSearchInput").value="";applySearch("");
      if(accountModalView)closeAccountModal();
      if(accountMenuOpen){accountMenuOpen=false;renderAccountCenter();}
    }
  });

  var hashView=location.hash.replace("#","");
  if(viewMeta[hashView])currentView=hashView;
  if(["library","upload","sources","graph","packages","health","document"].indexOf(currentView)>=0)libraryOpen=true;
  renderNavigation();
  renderScopes();
  renderAccountCenter();
  renderView();
})();
