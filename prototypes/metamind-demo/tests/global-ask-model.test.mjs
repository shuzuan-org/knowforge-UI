import test from 'node:test';
import assert from 'node:assert/strict';
import {migrateGlobalAsk,globalKnowledgeIndex,findGlobalEvidence,globalCitationPath,resolveGlobalReference,continuationDraft} from '../src/global-ask-model.mjs';
import {migrateFeatures,mergeWorkbenchBackup,purgeLibrary} from '../src/feature-model.mjs';
import {findEvidence,questionDocuments} from '../src/workbench-model.mjs';
const items=[{id:'a',name:'品牌规范',available:true},{id:'b',name:'界面规范',available:true,isShared:true},{id:'revoked',name:'撤销分享',available:false}];
const a=[{id:'same.md',title:'字体',sourceKind:'knowledge',paragraphs:['品牌标准字体采用 Inter，正文字号为十四像素。']}];
const b=[{id:'same.md',title:'字体',sourceKind:'shared',paragraphs:['界面字体采用 Noto Sans SC，字重统一为常规。']}];
const read=l=>l.id==='a'?a:l.id==='b'?b:assert.fail('unavailable content must not be read');
test('global retrieval crosses owned and shared knowledge and keeps colliding document IDs separate',()=>{
  const index=globalKnowledgeIndex(items,read);assert.equal(index.length,2);assert.notEqual(index[0].id,index[1].id);
  const evidence=findGlobalEvidence('字体采用什么？',items,read);
  assert.deepEqual(new Set(evidence.map(e=>e.libraryId)),new Set(['a','b']));assert.ok(evidence.every(e=>e.docId==='same.md'));
  assert.equal(evidence.find(e=>e.libraryId==='b').isShared,true);
});
test('revoked knowledge is never read, while a scoped library query stays inside its documents',()=>{
  assert.equal(findGlobalEvidence('火星秘密规则',items,read).length,0);
  const local=findEvidence('字体采用什么？',questionDocuments(a,'all',null));
  assert.ok(local.every(e=>!e.text.includes('Noto')));
  assert.equal(findEvidence('Noto Sans',questionDocuments(a,'all',null)).length,0);
});
test('global reference links carry IDs only and resolve to the correct library and exact paragraph',()=>{
  const evidence=findGlobalEvidence('字体采用什么？',items,read),chat={id:'chat',question:'字体采用什么？',evidence};
  const i=evidence.findIndex(e=>e.libraryId==='b'),url=new URL(globalCitationPath(evidence[i],'chat',i),'http://local');
  assert.equal(url.searchParams.get('doc'),'same.md');assert.equal(url.searchParams.get('globalChat'),'chat');assert.equal(url.searchParams.get('citation'),String(i));assert.ok(!url.href.includes('字体采用什么'));
  const result=resolveGlobalReference([chat],'chat',String(i),'b',b);assert.equal(result.unchanged,true);assert.equal(result.doc.id,'same.md');
  assert.equal(resolveGlobalReference([chat],'chat',String(i),'a',a),null);assert.equal(resolveGlobalReference([chat],'chat',null,'b',b),null);
  assert.equal(resolveGlobalReference([chat],'chat','999','b',b),null);
});
test('changed or missing historical text returns saved excerpts instead of highlighting unrelated text',()=>{
  const evidence=findGlobalEvidence('字体采用什么？',items,read),chat={id:'chat',evidence};const i=evidence.findIndex(e=>e.libraryId==='a');
  const changed=resolveGlobalReference([chat],'chat',i,'a',[{...a[0],paragraphs:['修改后的完全不同正文']}]);assert.equal(changed.unchanged,false);assert.equal(changed.text,evidence[i].text);
  const missing=resolveGlobalReference([chat],'chat',i,'a',[]);assert.equal(missing.missing,true);assert.equal(missing.text,evidence[i].text);
});
test('continuing in a library preserves an existing unsent draft and never auto-sends the global question',()=>{
  assert.deepEqual(continuationDraft('已有的草稿','全局问题'),{value:'已有的草稿',conflict:true});
  assert.deepEqual(continuationDraft('','全局问题'),{value:'全局问题',conflict:false});
  const e=findGlobalEvidence('字体采用什么？',items,read)[0];assert.equal(new URL(globalCitationPath(e,'chat',0,true),'http://local').searchParams.get('continue'),'1');
});
test('migration keeps library conversations and adds separate global records without resetting user data',()=>{
  const chats={a:[{id:'local',question:'本库问题',evidence:[]}]},s=migrateGlobalAsk({chats,customLibraries:items});
  assert.deepEqual(s.chats,chats);assert.deepEqual(s.globalChats,[]);s.globalChats.push({id:'global',question:'全局问题',evidence:[]});assert.deepEqual(migrateGlobalAsk(s),s);assert.equal(s.chats.a.length,1);
});
test('backup restores global records and drafts while prioritizing existing local conversations and drafts',()=>{
  const base=()=>migrateGlobalAsk(migrateFeatures({version:2,customLibraries:[],sources:[],chats:{},edits:{},recent:[],hiddenLibraries:[],resourcePackages:[],agentProfiles:[]}));
  const backup=base();backup.globalChats=[{id:'g',question:'字体',evidence:findGlobalEvidence('字体',items,read)}];backup.globalAskDraft='备份的全局草稿';backup.libraryAskDrafts={a:'备份的库内草稿'};
  const existing=base();existing.globalAskDraft='当前草稿';existing.libraryAskDrafts.a='本库当前草稿';existing.chats.a=[{question:'已有对话',evidence:[]}];
  const merged=mergeWorkbenchBackup(existing,{format:'metamind-workbench-backup',version:1,state:backup});
  assert.equal(merged.globalChats.length,1);assert.equal(merged.globalAskDraft,'当前草稿');assert.equal(merged.libraryAskDrafts.a,'本库当前草稿');assert.equal(merged.chats.a[0].question,'已有对话');
  assert.throws(()=>mergeWorkbenchBackup(existing,{format:'metamind-workbench-backup',version:1,state:{...backup,globalChats:[{id:'x',question:'q',evidence:[{docId:'d'}]}]}}),/全局问答格式/);
});
test('permanent library removal also removes its new global excerpts and local draft while retaining other sources',()=>{
  const s=migrateGlobalAsk(migrateFeatures({customLibraries:items,sources:[],chats:{},edits:{},recent:[],hiddenLibraries:[],resourcePackages:[],agentProfiles:[]}));
  s.globalChats=[{id:'g',question:'字体',evidence:findGlobalEvidence('字体',items,read)}];s.libraryAskDrafts={a:'本库草稿',b:'保留草稿'};
  const next=purgeLibrary(s,'a');assert.ok(next.globalChats[0].evidence.every(e=>e.libraryId!=='a'));assert.ok(next.globalChats[0].evidence.some(e=>e.libraryId==='b'));
  assert.equal(next.libraryAskDrafts.a,undefined);assert.equal(next.libraryAskDrafts.b,'保留草稿');assert.equal(s.globalChats[0].evidence.length,2);
});
