import test from 'node:test';
import assert from 'node:assert/strict';
import {migrateFeatures,mergeWorkbenchBackup} from '../src/feature-model.mjs';
import {selectedContentManifest,createSelectedShare,createLibraryShare,receiveKnowledge,buildKnowledgeItems,resetKnowledgeShare,revokeKnowledgeShare,resolveShareInput,migrateUnifiedKnowledge,oldPackageDestination,sharedDocumentId} from '../src/knowledge-model.mjs';
const library={id:'mine',name:'设计笔记',description:'不对外的说明'};
const docs=[{id:'font',title:'字体',category:'品牌',paragraphs:['Inter 与 Noto Sans SC，正文 14px。'],html:'<script>private</script>',citations:[{text:'private source'}]},{id:'private',title:'未选中的项目',paragraphs:['不应出现在分享中的文字']}];
const base=()=>migrateFeatures({version:2,customLibraries:[library],sources:[],chats:{mine:[{question:'保留我的问答',evidence:[]}]},edits:{},recent:['mine'],hiddenLibraries:[],resourcePackages:[],agentProfiles:[]});
const args={library,documents:docs,selectedIds:['font'],draft:{name:'排版规范',publisher:'设计团队'},packageId:'selection',shareId:'token',at:'2026-10-24'};
const create=()=>createSelectedShare(base(),args);
test('share contains exactly selected text and no unselected page, attachments, HTML or conversations',()=>{
  const s=create(),m=s.resourcePackages[0].manifest,raw=JSON.stringify(m);
  assert.deepEqual(m.libraries[0].documents.map(d=>d.id),['font']);assert.equal(m.publisher,'设计团队');
  assert.doesNotMatch(raw,/未选中|private source|<script|不对外|保留我的问答/);
  assert.deepEqual(s.chats,base().chats);assert.throws(()=>selectedContentManifest(library,docs,[],args.draft),/至少/);
  assert.throws(()=>selectedContentManifest(library,docs,['missing'],args.draft),/已变化/);
  assert.throws(()=>selectedContentManifest({...library,isShared:true},docs,['font'],args.draft),/自己创建/);
});
test('received selection works independently without owning source library and groups as one received item',()=>{
  const snapshot=create().resourcePackages[0].manifest;
  const receiver=receiveKnowledge({...base(),customLibraries:[],chats:{}},snapshot,'receipt');
  const items=buildKnowledgeItems(receiver.customLibraries,receiver);
  assert.equal(items.length,1);const item=items[0];assert.equal(item.ownership,'shared');assert.equal(item.canEdit,false);
  assert.deepEqual(item.sourceNames,['设计笔记']);assert.equal(item.readableCount,1);assert.equal(item.sharedBy,'设计团队');
  assert.equal(item.importedDocuments[0].id,'receipt-library-0::font');assert.equal(item.importedDocuments[0].html,undefined);
  assert.ok(!receiver.customLibraries.some(l=>l.id===library.id));
});
test('live share receive is deduplicated; cancellation and revocation remove readable bodies',()=>{
  const s=create();let received=receiveKnowledge(s,s.localShares.token.manifest,'receipt','token');
  received=receiveKnowledge(received,s.localShares.token.manifest,'duplicate','token');assert.equal(received.receivedShares.length,1);
  assert.equal(buildKnowledgeItems(received.customLibraries,received).filter(l=>!l.isShared).length,1);
  const cancelled={...received,receivedShares:received.receivedShares.map(r=>({...r,enabled:false}))};
  assert.equal(buildKnowledgeItems(cancelled.customLibraries,cancelled).find(l=>l.isShared).readableCount,0);
  const revoked=revokeKnowledgeShare(received,'selection');const item=buildKnowledgeItems(revoked.customLibraries,revoked).find(l=>l.isShared);
  assert.equal(item.revoked,true);assert.deepEqual(item.importedDocuments,[]);
  assert.throws(()=>receiveKnowledge(revoked,s.localShares.token.manifest,'extra','token'),/失效/);
  assert.throws(()=>resolveShareInput('token','http://local',revoked),/有效分享/);
});
test('reset keeps original frozen selection rather than expanding to current library contents',()=>{
  const s=create(),next=resetKnowledgeShare(s,'selection','new-token');
  assert.equal(next.localShares.token.revoked,true);assert.equal(next.localShares['new-token'].revoked,false);
  assert.deepEqual(next.localShares['new-token'].manifest,s.localShares.token.manifest);
  assert.equal(resolveShareInput('http://local/workspace?demoShare=new-token','http://local',next).id,'new-token');
  assert.throws(()=>resolveShareInput('http://other/workspace?demoShare=new-token','http://local',next),/本机/);
});
test('legacy multi-library receipt preserves conversations and namespaces colliding document IDs',()=>{
  const s=base();s.receivedShares=[{id:'old',name:'旧分享',libraryIds:['a','b']}];s.importedDocuments={a:[docs[0]],b:[docs[0]]};
  s.chats.a=[{id:'q',question:'字体',scopeDocId:'font',evidence:[{docId:'font',text:'Inter'}]}];s.chats.b=[{id:'q',question:'颜色',evidence:[]}];
  const migrated=migrateUnifiedKnowledge(s),item=buildKnowledgeItems([{id:'a'},{id:'b'}],migrated)[0];
  assert.equal(item.importedDocuments.length,2);assert.notEqual(item.importedDocuments[0].id,item.importedDocuments[1].id);
  assert.equal(migrated.chats['shared:old'][0].evidence[0].docId,sharedDocumentId('a','font'));
  assert.deepEqual(migrated.chats.a,s.chats.a);assert.deepEqual(migrateUnifiedKnowledge(migrated),migrated);
});
test('backup restore keeps received ownership, exact selected manifest and existing revocation',()=>{
  const s=create(),backup=receiveKnowledge(s,s.localShares.token.manifest,'receipt','token');
  const restored=mergeWorkbenchBackup({...base(),customLibraries:[]},{format:'metamind-workbench-backup',version:1,state:backup});
  assert.equal(buildKnowledgeItems(restored.customLibraries,restored).filter(l=>l.isShared).length,1);
  assert.equal(restored.localShares.token.manifest.libraries[0].documents.length,1);
  const revoked=revokeKnowledgeShare(restored,'selection'),merged=mergeWorkbenchBackup(revoked,{format:'metamind-workbench-backup',version:1,state:backup});
  assert.equal(merged.localShares.token.revoked,true);
});
test('old package bookmarks lead into unified knowledge sharing workflows',()=>{
  assert.equal(oldPackageDestination(new URL('http://local/packages?owner=shared')),'/workspace?filter=shared&receive=1');
  assert.equal(oldPackageDestination(new URL('http://local/packages?demoShare=token')),'/workspace?filter=shared&receive=1&demoShare=token');
  assert.equal(oldPackageDestination(new URL('http://local/packages?package=old&tab=connect')),'/workspace?shares=1&package=old&connections=1');
});


test('library sharing restores complete library scope and preserves earlier partial shares',()=>{
  const old=create();
  const next=createLibraryShare(old,{library,documents:docs,packageId:'whole-library',shareId:'whole-link',at:'2026-10-29'});
  const manifest=next.localShares['whole-link'].manifest;
  assert.equal(manifest.kind,'library-share');
  assert.equal(manifest.name,library.name);
  assert.deepEqual(manifest.libraries[0].documents.map(d=>d.id),docs.map(d=>d.id));
  assert.doesNotMatch(JSON.stringify(manifest),/private source|<script|保留我的问答/);
  assert.deepEqual(next.localShares.token,old.localShares.token);
  assert.deepEqual(next.resourcePackages[0],old.resourcePackages[0]);
  assert.deepEqual(next.chats,old.chats);
  assert.equal(next.resourcePackages.at(-1).kind,'library-share');
  const received=receiveKnowledge(next,manifest,'whole-receipt','whole-link');
  const item=buildKnowledgeItems(received.customLibraries,received).find(l=>l.receipt?.id==='whole-receipt');
  assert.equal(item.readableCount,docs.length);
  assert.throws(()=>createLibraryShare(old,{library:{...library,isShared:true},documents:docs,packageId:'bad',shareId:'bad'}),/自己创建/);
  assert.throws(()=>createLibraryShare(old,{library,documents:[],packageId:'empty',shareId:'empty'}),/至少/);
});
