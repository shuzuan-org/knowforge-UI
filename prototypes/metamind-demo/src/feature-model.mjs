// Local, inspectable operations. No network service or AI score is implied.
export function migrateFeatures(state) {
  return { ...state, memories: state.memories || {}, generations: state.generations || {}, activity: state.activity || [], deletedLibraries: state.deletedLibraries || [], importedDocuments: state.importedDocuments || {}, receivedShares: state.receivedShares || [], localShares: state.localShares || {}, demoKeyVersion: state.demoKeyVersion || 1 };
}
export function appendActivity(state, label, libraryId = '', detail = '', at = new Date().toISOString()) {
  return { ...state, activity: [{ id: at + '-' + (state.activity?.length || 0), label, libraryId, detail, at }, ...(state.activity || [])].slice(0, 300) };
}
export function evaluateLibrary(docs, sources = []) {
  const active = sources.filter(s => !s.trashedAt);
  const readable = active.filter(s => s.content?.trim()).length;
  const pending = active.filter(s => ['waiting', 'processing'].includes(s.state)).length;
  const missing = active.filter(s => !s.content?.trim() && !s.example).length;
  const fingerprints = new Set(); let duplicates = 0;
  for (const d of docs) { const f = d.paragraphs.join('').replace(/\s/g, '').slice(0, 4000); if (f && fingerprints.has(f)) duplicates++; if (f) fingerprints.add(f); }
  const groups = [...new Set(docs.map(d => d.category || '未分类'))];
  const score = docs.length ? Math.max(0, Math.round(100 - 35 * missing / Math.max(1, active.filter(s => !s.example).length) - 25 * duplicates / docs.length - (pending ? 10 : 0))) : 0;
  return { score, documents: docs.length, readable, pending, missing, duplicates, groups, checks: [
    { name: '正文可用性', value: docs.length + ' 篇可读内容；' + missing + ' 份本地资料缺少正文', warning: missing > 0 || !docs.length },
    { name: '重复与混放', value: duplicates + ' 篇重复正文；' + groups.length + ' 个目录主题，请按用途判断是否拆库', warning: duplicates > 0 },
    { name: '目标与机械排除', value: '仅依据已有正文和状态检查。缺失附件、不处理文件和回收站内容不会被生成。', warning: pending > 0 },
  ] };
}
export function fingerprintDocument(doc) { let h = 2166136261; for (const c of doc.paragraphs.join('\n')) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0).toString(16); }
export function generateLocalPages({ libraryId, docs, memory = [], agent, mode = 'incremental', previous, at = new Date().toISOString() }) {
  const inputs = docs.filter(d => d.sourceKind !== 'generated');
  const activeMemory = memory.filter(m => m.enabled !== false);
  const versions = Object.fromEntries(inputs.map(d => [d.id, fingerprintDocument(d)]));
  // A full local rebuild keeps immutable original texts and historical citations.
  const changed = inputs.filter(d => previous?.versions?.[d.id] !== versions[d.id]);
  const groups = new Map();
  for (const d of inputs) { const category = d.category || '未分类'; if (!groups.has(category)) groups.set(category, []); groups.get(category).push(d); }
  const pages = [...groups].map(([category, items]) => ({
    id: 'generated:' + libraryId + ':' + category, title: category + ' · 整理提要', category: '整理提要', sourceKind: 'generated', createdAt: at,
    paragraphs: ['本地摘录整理 · ' + (agent?.name || '通用整理') + '。以下内容直接摘自资料，未调用在线 AI。',
      ...items.slice(0, 12).flatMap(d => ['来源：' + d.title, ...d.paragraphs.filter(p => p.trim().length > 12).slice(0, 2)]),
      ...(activeMemory.length ? ['本次采用的用户记忆（用户提供的原则，需结合原文核验）：', ...activeMemory.map(m => m.text)] : [])],
    citations: items.slice(0, 12).map(d => ({ docId: d.id, title: d.title })),
  }));
  return { mode, at, versions, changed: changed.length, sourceCount: inputs.length, agent: { ...agent }, memory: activeMemory.map(m => ({ ...m })), pages };
}
export function documentRelations(docs, terms = []) {
  const builtins = ['组件','Token','字体','字号','布局','响应式','品牌','色彩','API','数据库','部署','构建','时间线','历史','运镜','人物','叙事'];
  return [...new Set([...terms.filter(Boolean), ...builtins])].map(term => ({ term, documents: docs.filter(d => (d.title + '\n' + d.paragraphs.join('\n')).toLowerCase().includes(term.toLowerCase())) })).filter(g => g.documents.length > 1).sort((a,b) => b.documents.length - a.documents.length);
}
export function clearLibraryContent(state, libraryId) {
  const result = { ...state, sources: state.sources.filter(s => s.libraryId !== libraryId), edits: { ...state.edits, [libraryId]: { ...state.edits[libraryId], contentCleared: true, totalFiles: 0, readyFiles: 0, pendingFiles: 0, skippedFiles: 0 } }, generations: { ...state.generations, [libraryId]: null }, importedDocuments: { ...state.importedDocuments, [libraryId]: [] } };
  return appendActivity(result, '清空知识库内容', libraryId, '保留名称、记忆、对话和资源包配置');
}
export function purgeLibrary(state, libraryId) {
  const result = clearLibraryContent(state, libraryId);
  const omit = obj => Object.fromEntries(Object.entries(obj || {}).filter(([id]) => id !== libraryId));
  return appendActivity({ ...result, defaultPackageId: result.resourcePackages.find(p=>p.id===state.defaultPackageId)?.libraryIds.some(id=>id!==libraryId) ? state.defaultPackageId : '', customLibraries: result.customLibraries.filter(l => l.id !== libraryId), deletedLibraries: [...new Set([...(state.deletedLibraries || []), libraryId])], edits: omit(result.edits), chats: omit(result.chats), globalChats: (result.globalChats||[]).map(c=>c.kind==='break'?c:{...c,evidence:(c.evidence||[]).filter(e=>e.libraryId!==libraryId)}), libraryAskDrafts: omit(result.libraryAskDrafts), memories: omit(result.memories), generations: omit(result.generations), importedDocuments: omit(result.importedDocuments), recent: result.recent.filter(id => id !== libraryId), resourcePackages: result.resourcePackages.map(p => ({ ...p, libraryIds: p.libraryIds.filter(id => id !== libraryId) })), localShares: Object.fromEntries(Object.entries(result.localShares || {}).map(([key, share])=>[key,share.manifest?.libraries?.some(l=>l.id===libraryId)?{...share,revoked:true}:share])) }, '彻底删除本地知识库', '', '内容与关联配置已删除');
}
export function makeManifest(item, libraries, getDocs) {
  return { format: 'metamind-demo-package', version: 1, name: item.name, description: item.description || '', libraries: libraries.filter(l => item.libraryIds.includes(l.id)).map(l => ({ id: l.id, name: l.name, description: l.description || '', documents: getDocs(l).map(d => ({ id: d.id, title: d.title, category: d.category, paragraphs: d.paragraphs, sourceKind: 'shared' })) })) };
}
export function validateManifest(value) {
  if (!value || value.format !== 'metamind-demo-package' || value.version !== 1 || typeof value.name !== 'string' || !Array.isArray(value.libraries) || !value.libraries.length || value.libraries.length > 100) throw new Error('不是有效的 MetaMind 分享文件。');
  if ((value.description != null && typeof value.description !== 'string') || (value.publisher != null && typeof value.publisher !== 'string')) throw new Error('分享介绍或署名格式不正确。');
  let chars = 0;
  for (const l of value.libraries) {
    if (!l || typeof l.name !== 'string' || (l.description != null && typeof l.description !== 'string') || !Array.isArray(l.documents) || l.documents.length > 2000) throw new Error('资源包中的知识库结构不完整。');
    for (const d of l.documents) { if (typeof d.id !== 'string' || typeof d.title !== 'string' || !Array.isArray(d.paragraphs) || d.paragraphs.some(p => typeof p !== 'string')) throw new Error('资源包正文格式不正确。'); chars += d.paragraphs.join('').length; }
  }
  if (chars > 4_000_000) throw new Error('资源包正文超过本地导入上限。');
  return value;
}
export function importManifest(state, value, id, shareId = '') {
  const manifest = validateManifest(value);
  const libraries = manifest.libraries.map((l, i) => ({ id: id + '-library-' + i, name: l.name, description: l.description || '', totalFiles: 0, readyFiles: 0, pendingFiles: 0, example: false }));
  const importedDocuments = { ...state.importedDocuments };
  libraries.forEach((l,i) => { importedDocuments[l.id] = manifest.libraries[i].documents.map(d => ({ id: d.id, title: d.title, category: typeof d.category === 'string' ? d.category : '收到的分享', paragraphs: [...d.paragraphs], sourceKind: 'shared' })); });
  return appendActivity({ ...state, customLibraries: [...state.customLibraries, ...libraries], importedDocuments, receivedShares: [...state.receivedShares, { id, name: manifest.name, description: manifest.description || '', libraryIds: libraries.map(l => l.id), sourceShareId: shareId, sharedBy: typeof manifest.publisher === 'string' ? manifest.publisher.slice(0,40) : '知识分享者', sourceNames: manifest.libraries.map(l=>l.name), enabled: true, importedAt: new Date().toISOString() }] }, '导入分享文件', '', manifest.name);
}
export function contextualQuestion(question, previous, scopeDocId = null) {
  return /^(那|它|这些|这个|继续|还有|再|具体|为什么|分别|其中)/.test(question.trim()) && previous && (previous.scopeDocId || null) === scopeDocId ? previous.question + '\n追问：' + question : question;
}

export function mergeWorkbenchBackup(state, value) {
  const b = value?.state;
  if(value?.format!=='metamind-workbench-backup' || value.version!==1 || b?.version!==2 || !Array.isArray(b.customLibraries) || !Array.isArray(b.sources)) throw new Error('备份格式不正确。');
  const named = x => x && typeof x.id==='string' && typeof x.name==='string';
  if(b.customLibraries.some(x=>!named(x)) || b.sources.some(x=>!named(x)||typeof x.libraryId!=='string'||(x.content!=null&&typeof x.content!=='string'))) throw new Error('知识库或资料记录格式不正确。');
  const merge=(a,z)=>[...a,...z.filter(x=>!a.some(y=>y.id===x.id))];
  const imported={}; for(const [id,docs] of Object.entries(b.importedDocuments||{})) {
    if(!Array.isArray(docs)||docs.some(d=>!d||typeof d.id!=='string'||typeof d.title!=='string'||!Array.isArray(d.paragraphs)||d.paragraphs.some(p=>typeof p!=='string')))throw new Error('备份正文格式不正确。');
    imported[id]=docs.map(d=>({id:d.id,title:d.title,category:typeof d.category==='string'?d.category:'导入备份',paragraphs:d.paragraphs,sourceKind:'shared'}));
  }
  const memories={};for(const [id,entries]of Object.entries(b.memories||{})){if(!Array.isArray(entries)||entries.some(m=>typeof m.id!=='string'||typeof m.text!=='string'))throw new Error('备份记忆格式不正确。');memories[id]=entries;}
  const chats={};for(const [id,entries]of Object.entries(b.chats||{})){if(!Array.isArray(entries)||entries.some(c=>c.kind!=='break'&&(typeof c.question!=='string'||!Array.isArray(c.evidence)||c.evidence.some(e=>typeof e.text!=='string'||typeof e.docId!=='string'))))throw new Error('备份对话格式不正确。');chats[id]=entries;}
  const globalChats=b.globalChats||[];
  if(!Array.isArray(globalChats)||globalChats.some(c=>!c||typeof c.id!=='string'||(c.kind!=='break'&&(typeof c.question!=='string'||!Array.isArray(c.evidence)||c.evidence.some(e=>!e||['text','docId','title','libraryId','libraryName'].some(k=>typeof e[k]!=='string'))))))throw new Error('备份全局问答格式不正确。');
  const libraryAskDrafts=b.libraryAskDrafts||{};
  if(typeof libraryAskDrafts!=='object'||Array.isArray(libraryAskDrafts)||Object.values(libraryAskDrafts).some(v=>typeof v!=='string')||(b.globalAskDraft!=null&&typeof b.globalAskDraft!=='string'))throw new Error('备份问答草稿格式不正确。');
  const profiles=(b.agentProfiles||[]).filter(named).map(a=>({...a,avatar:typeof a.avatar==='string'&&/^data:image\/(png|jpeg|webp);base64,/.test(a.avatar)?a.avatar:''}));
  const packages=(b.resourcePackages||[]).filter(p=>named(p)&&Array.isArray(p.libraryIds)&&p.libraryIds.every(id=>typeof id==='string'));
  for(const p of packages)if(p.manifest)validateManifest(p.manifest);
  const receipts=b.receivedShares||[];
  if(!Array.isArray(receipts)||receipts.some(r=>!named(r)||!Array.isArray(r.libraryIds)||r.libraryIds.some(id=>typeof id!=='string')||(r.sharedBy!=null&&typeof r.sharedBy!=='string')||(r.sourceNames!=null&&(!Array.isArray(r.sourceNames)||r.sourceNames.some(n=>typeof n!=='string')))))throw new Error('备份中的分享来源格式不正确。');
  const shares={};for(const [id,share] of Object.entries(b.localShares||{})) {
    if(!share || typeof share.packageId!=='string')throw new Error('备份分享格式不正确。');
    validateManifest(share.manifest);shares[id]=share;
  }
  const ids=new Set((value.libraryIds || [...b.customLibraries.map(l=>l.id),...b.sources.map(s=>s.libraryId)]).filter(id=>typeof id==='string'));
  const edits={...b.edits,...state.edits};for(const id of ids){if(state.edits[id]?.contentCleared&&!b.edits?.[id]?.contentCleared){edits[id]={...state.edits[id],...b.edits?.[id]};for(const key of ['contentCleared','totalFiles','readyFiles','pendingFiles','skippedFiles'])if(!Object.hasOwn(b.edits?.[id]||{},key))delete edits[id][key];}}
  return appendActivity({...state,edits,hiddenLibraries:state.hiddenLibraries.filter(id=>!ids.has(id)),deletedLibraries:state.deletedLibraries.filter(id=>!ids.has(id)),customLibraries:merge(state.customLibraries,b.customLibraries),sources:merge(state.sources,b.sources),agentProfiles:merge(state.agentProfiles,profiles),resourcePackages:merge(state.resourcePackages,packages),receivedShares:merge(state.receivedShares||[],receipts),localShares:{...shares,...state.localShares},memories:{...memories,...state.memories},chats:{...chats,...state.chats},globalChats:merge(state.globalChats||[],globalChats),globalAskDraft:state.globalAskDraft||b.globalAskDraft||'',libraryAskDrafts:{...libraryAskDrafts,...state.libraryAskDrafts},importedDocuments:{...imported,...state.importedDocuments}},'合并导入本地备份');
}
