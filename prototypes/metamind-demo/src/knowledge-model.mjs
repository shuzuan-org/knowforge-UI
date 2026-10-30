import { appendActivity, validateManifest, importManifest } from './feature-model.mjs';

export const sharedKnowledgeId = receiptId => 'shared:' + receiptId;
export const sharedDocumentId = (libraryId, documentId) => libraryId + '::' + documentId;
export function receiptAvailable(state, receipt) {
  if (!receipt || receipt.enabled === false) return false;
  if (!receipt.sourceShareId) return true;
  const share = state.localShares?.[receipt.sourceShareId];
  return !!share && !share.revoked && state.resourcePackages?.find(p => p.id === share.packageId)?.enabled !== false;
}
// Keep legacy received-library IDs, saved citations and conversations; expose one received item.
export function migrateUnifiedKnowledge(state) {
  const chats = { ...state.chats };
  for (const receipt of state.receivedShares || []) {
    const id = sharedKnowledgeId(receipt.id);
    if (Object.hasOwn(chats, id)) continue;
    const old = (receipt.libraryIds || []).flatMap(libraryId => (state.chats?.[libraryId] || []).map(chat => ({
      ...chat, id: libraryId + ':' + chat.id,
      ...(chat.kind === 'break' ? {} : { scope: receipt.name, scopeDocId: chat.scopeDocId ? sharedDocumentId(libraryId, chat.scopeDocId) : null,
        evidence: (chat.evidence || []).map(e => ({ ...e, docId: sharedDocumentId(libraryId, e.docId), sourceKind: 'shared' })) }),
    })));
    if (old.length) chats[id] = old.sort((a,b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
  }
  return { ...state, chats, knowledgeUnificationVersion: 1 };
}
export function buildKnowledgeItems(libraries, state) {
  const receiptLibraries = new Set((state.receivedShares || []).flatMap(p => p.libraryIds || []));
  const own = libraries.filter(l => !receiptLibraries.has(l.id)).map(l => ({ ...l, ownership: 'mine', available: true, canEdit: true }));
  const shared = (state.receivedShares || []).map(receipt => {
    const available = receiptAvailable(state, receipt);
    const raw = (receipt.libraryIds || []).flatMap(id => (state.importedDocuments?.[id] || []).map(d => ({
      ...d, id: sharedDocumentId(id, d.id), sourceKind: 'shared', html: undefined,
      category: d.category || '分享的内容', originDocumentId: d.id, originLibraryId: id,
    })));
    const sourceNames = receipt.sourceNames?.length ? receipt.sourceNames : (receipt.libraryIds || []).map(id => state.customLibraries?.find(l => l.id === id)?.name).filter(Boolean);
    const revoked = !!receipt.sourceShareId && !available && receipt.enabled !== false;
    return { id: sharedKnowledgeId(receipt.id), name: receipt.name, description: receipt.description || '', ownership: 'shared', isShared: true, canEdit: false,
      receipt, available, revoked, sourceNames, sharedBy: receipt.sharedBy || '知识分享者', importedAt: receipt.importedAt,
      importedDocuments: available ? raw : [], readableCount: available ? raw.length : 0, totalFiles: 0, readyFiles: 0, pendingFiles: 0,
    };
  });
  return [...own, ...shared];
}
export function selectedContentManifest(library, documents, selectedIds, draft) {
  if (!library || library.isShared || library.canEdit === false) throw new Error('只能分享自己创建的内容。');
  if (!draft.name?.trim()) throw new Error('请填写分享名称。');
  const ids = [...new Set(selectedIds)];
  if (!ids.length) throw new Error('请至少选择一篇内容。');
  const selected = ids.map(id => documents.find(d => d.id === id));
  if (selected.some(d => !d)) throw new Error('部分选中内容已变化或移除，请重新选择。');
  const manifest = {
    format: 'metamind-demo-package', version: 1, kind: 'selected-content',
    name: draft.name.trim().slice(0,80), description: (draft.description || '').trim().slice(0,300), publisher: (draft.publisher || '').trim().slice(0,40) || '知识分享者',
    libraries: [{ id: library.id, name: library.name, description: '', documents: selected.map(d => ({ id:d.id, title:d.title, category:d.category || '选中的内容', paragraphs:[...d.paragraphs], sourceKind:'shared' })) }],
  };
  return validateManifest(manifest);
}
export function createSelectedShare(state, { library, documents, selectedIds, draft, packageId, shareId, at = new Date().toISOString() }) {
  const manifest = selectedContentManifest(library,documents,selectedIds,draft);
  const item = { id:packageId, kind:'selected-content', name:manifest.name, description:manifest.description, publisher:manifest.publisher,
    libraryIds:[library.id], sourceLibraryId:library.id, sourceLibraryName:library.name, documentIds:manifest.libraries[0].documents.map(d=>d.id), manifest, enabled:true, createdAt:at, updatedAt:at };
  return appendActivity({ ...state, resourcePackages:[...state.resourcePackages,item], localShares:{...state.localShares,[shareId]:{packageId,manifest,createdAt:at,revoked:false}} },'分享选中的内容',library.id,manifest.name+' · '+item.documentIds.length+' 篇',at);
}
export function resetKnowledgeShare(state, packageId, shareId, at = new Date().toISOString()) {
  const item = state.resourcePackages.find(p=>p.id===packageId);
  const old = Object.values(state.localShares).find(v=>v.packageId===packageId);
  const manifest = item?.manifest || old?.manifest;
  if (!item || !manifest) throw new Error('请先从正文中选择需要分享的内容。');
  validateManifest(manifest);
  return appendActivity({...state,resourcePackages:state.resourcePackages.map(p=>p.id===packageId?{...p,enabled:true}:p),localShares:{...Object.fromEntries(Object.entries(state.localShares).map(([id,v])=>[id,v.packageId===packageId?{...v,revoked:true}:v])),[shareId]:{packageId,manifest,createdAt:at,revoked:false}}},'重置分享链接',item.sourceLibraryId||'',item.name,at);
}
// The original product shares a library, without asking for page selection.
// Keep the selection helpers above only for existing saved shares and backups.
export function createLibraryShare(state, {library, documents, packageId, shareId, at = new Date().toISOString()}) {
  const manifest = {...selectedContentManifest(library, documents, documents.map(d=>d.id), {name:library.name}), kind:'library-share'};
  const item = {id:packageId, kind:'library-share', name:manifest.name, description:'', libraryIds:[library.id], sourceLibraryId:library.id, sourceLibraryName:library.name, documentIds:manifest.libraries[0].documents.map(d=>d.id), manifest, enabled:true, createdAt:at, updatedAt:at};
  return appendActivity({...state, resourcePackages:[...state.resourcePackages,item], localShares:{...state.localShares,[shareId]:{packageId,manifest,createdAt:at,revoked:false}}},'分享知识库',library.id,manifest.name,at);
}
export function revokeKnowledgeShare(state, packageId) {
  return appendActivity({...state,localShares:Object.fromEntries(Object.entries(state.localShares).map(([id,v])=>[id,v.packageId===packageId?{...v,revoked:true}:v]))},'撤销分享', '',state.resourcePackages.find(p=>p.id===packageId)?.name||'');
}
export function receiveKnowledge(state, manifest, receiptId, shareId='') {
  validateManifest(manifest);
  if (shareId) {
    const share=state.localShares[shareId];
    if (!share || share.revoked || state.resourcePackages.find(p=>p.id===share.packageId)?.enabled===false) throw new Error('这份分享已失效，请向分享者获取新链接。');
    const existing=state.receivedShares.find(p=>p.sourceShareId===shareId);
    if(existing)return appendActivity({...state,receivedShares:state.receivedShares.map(p=>p.id===existing.id?{...p,enabled:true}:p)},'恢复收到的分享','',existing.name);
  }
  return migrateUnifiedKnowledge(importManifest(state,manifest,receiptId,shareId));
}
export function resolveShareInput(input, origin, state) {
  let id=input.trim();
  if (/^https?:/i.test(id)) {
    const url=new URL(id);
    if(url.origin!==origin)throw new Error('仅支持当前浏览器生成的本机分享链接，请检查链接或导入分享文件。');
    id=url.searchParams.get('demoShare') || '';
  }
  const share=state.localShares[id];
  if(!share || share.revoked || state.resourcePackages.find(p=>p.id===share.packageId)?.enabled===false)throw new Error('没有找到有效分享，请检查链接，或向分享者获取新文件。');
  return {id,manifest:share.manifest};
}
export function oldPackageDestination(route) {
  const params=new URLSearchParams();
  if(route.searchParams.has('demoShare') || route.searchParams.get('owner')==='shared') {
    params.set('filter','shared');params.set('receive','1');
    if(route.searchParams.has('demoShare'))params.set('demoShare',route.searchParams.get('demoShare'));
  } else {
    params.set('shares','1');
    for(const key of ['package','library'])if(route.searchParams.has(key))params.set(key,route.searchParams.get(key));
    if(route.searchParams.get('tab')==='connect')params.set('connections','1');
  }
  return '/workspace?'+params;
}
