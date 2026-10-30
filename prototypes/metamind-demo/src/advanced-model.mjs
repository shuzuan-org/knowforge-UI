export const agentTemplates = [
  { id: 'general', name: '通用整理', description: '按资料本身的主题组织内容，适合大多数资料。', scenario: '日常资料收集、知识沉淀、跨资料回查', direction: '主题、核心概念、内容之间的联系', strategy: '按主题聚合相近内容，保留出处，避免重复。', requirements: '保留原文含义，不把推测写成事实。', anchors: '', recommended: true },
  { id: 'research', name: '研究整理', description: '关注结论、证据和待验证问题。', scenario: '文献调研、行业研究、专题资料整理', direction: '核心结论、关键数据、争议观点、待验证问题', strategy: '区分事实、观点和推测；为结论保留证据与引用。', requirements: '标注证据来源与局限，保留不同观点。', anchors: '' },
  { id: 'project', name: '项目整理', description: '关注项目决策、行动项、进展与风险。', scenario: '项目复盘、决策支持、会议记录与跟进', direction: '关键决策、责任人、风险、行动项与截止时间', strategy: '围绕项目目标聚合记录，区分已决定、进行中和待确认事项。', requirements: '不要推测责任人或截止时间。', anchors: '' },
  { id: 'content', name: '内容素材整理', description: '关注观点、案例和可复用的内容素材。', scenario: '写作选题、内容生产、演讲与课程准备', direction: '独特观点、案例证据、内容结构、可传播表达', strategy: '按选题与受众整理素材，标记引用和适用场景。', requirements: '区分原文和改写建议，保留出处。', anchors: '' },
  { id: 'onboarding', name: '学习整理', description: '关注背景、流程和由浅入深的阅读顺序。', scenario: '新成员入职、岗位交接、陌生领域自学', direction: '背景与全貌、规则与流程、常见问题、进阶材料', strategy: '从背景、基础规则到实际任务分层组织内容。', requirements: '说明阅读顺序和前置知识，不补造缺失流程。', anchors: '' },
];

export function migrateAdvanced(state, oldAgents, packages) {
  return {
    ...state,
    agentProfiles: Array.isArray(state.agentProfiles) ? state.agentProfiles : (Array.isArray(oldAgents) ? oldAgents : []).filter(a => a && typeof a.name === 'string').map((a, i) => ({ ...agentTemplates[0], ...a, id: 'migrated-agent-' + i, recommended: false })),
    resourcePackages: Array.isArray(state.resourcePackages) ? state.resourcePackages : packages.map(p => ({ ...p, libraryIds: [...p.libraryIds] })),
    defaultPackageId: state.defaultPackageId ?? packages.at(-1)?.id ?? '',
  };
}

export function resolveAgent(id, profiles = []) {
  return [...agentTemplates, ...profiles].find(a => a.id === id) || agentTemplates[0];
}

export function resolveActiveMethod(id, profiles = []) {
  return resolveAgent(id,profiles.filter(p=>!p.archived));
}
export function organizingMethodSnapshot(id, profiles = []) {
  const method=resolveActiveMethod(id,profiles);
  return {method:method.id,agentName:method.name,agentRules:{...method}};
}
export function methodLabel(id,name='') {
  const old={general:'知识聚焦',research:'研究整理员',project:'项目顾问',content:'内容策划师',onboarding:'入职培训员'};
  const template=agentTemplates.find(m=>m.id===id);
  return template&&(!name||name===old[id]||name===template.name)?template.name:name||'自定义智能体';
}
export function organizingSettingsPath(route) {
  const p=new URLSearchParams({settings:'1',methods:'1'});
  if(route.searchParams.get('tab')==='mine')p.set('methodTab','mine');
  for(const key of ['library','agent'])if(route.searchParams.get(key))p.set(key,route.searchParams.get(key));
  return '/upload?'+p;
}

export function packageLibraries(item, libraries) {
  return libraries.filter(l => item.libraryIds.includes(l.id));
}

export function validatePackage(draft, libraries) {
  if (!draft.name.trim()) return '请填写资源包名称。';
  if (!packageLibraries(draft, libraries).length) return '请至少选择一个知识库。';
  return '';
}

export function updatePackageEnabled(state, id, enabled) {
  return { ...state, resourcePackages: state.resourcePackages.map(p => p.id === id ? { ...p, enabled } : p), defaultPackageId: !enabled && state.defaultPackageId === id ? '' : state.defaultPackageId };
}

// The directory graph encodes real membership only, rather than inferred relations.
export function graphGroups(documents, query = '') {
  const groups = new Map();
  const needle = query.trim().toLocaleLowerCase();
  for (const doc of documents) {
    if (needle && !(doc.title + ' ' + doc.category).toLocaleLowerCase().includes(needle)) continue;
    const category = doc.category || '未分类';
    if (!groups.has(category)) groups.set(category, { id: category, name: category, documents: [] });
    groups.get(category).documents.push(doc);
  }
  return [...groups.values()];
}

export function packagePath(id, tab = 'contents') {
  return '/packages?package=' + encodeURIComponent(id) + (tab === 'connect' ? '&tab=connect' : '');
}
