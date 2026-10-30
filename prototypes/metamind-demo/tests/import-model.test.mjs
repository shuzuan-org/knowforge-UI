import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveImportTarget, orderedImportLibraries, prepareImportBatch, applyImportBatch } from '../src/import-model.mjs';
const libraries = [{id:'a',name:'甲'}, {id:'b',name:'乙'}, {id:'shared',isShared:true,name:'收到的资料'}, {id:'gone',available:false}];
test('explicit/current context wins, then recent views, then last actual import', () => {
  assert.equal(resolveImportTarget(libraries,{explicitId:'b',currentId:'a',lastAddedId:'a'}),'b');
  assert.equal(resolveImportTarget(libraries,{currentId:'a',lastAddedId:'b'}),'a');
  assert.equal(resolveImportTarget(libraries,{lastAddedId:'b',recent:['a']}),'a');
});
test('invalid, shared and removed destinations cannot be defaulted or imported into', () => {
  assert.equal(resolveImportTarget(libraries,{explicitId:'shared',currentId:'gone',lastAddedId:'missing'}),'a');
  assert.equal(resolveImportTarget(libraries.filter(l=>l.isShared||l.available===false)),'');
  for(const id of ['shared','gone','missing']) assert.throws(()=>prepareImportBatch(libraries,id,null,[{name:'资料.txt'}]),/不可用/);
});
test('older uploads migrate by creation order and ignore trashed/unavailable sources', () => {
  assert.equal(resolveImportTarget(libraries,{sources:[{libraryId:'b',createdAt:'2026-10-27'},{libraryId:'a',createdAt:'2026-10-26'},{libraryId:'a',createdAt:'2026-10-28',trashedAt:'now'},{libraryId:'shared',createdAt:'2026-10-29'}]}),'b');
});
test('creating a destination commits the same selected content atomically without changing old data', () => {
  let sequence=0;const queue=[{queueId:'q1',name:'folder/资料.md',content:'# 正文',parseMethod:'text'},{queueId:'q2',name:'https://example.com',kind:'web',content:''}];
  const before=structuredClone(queue);
  const batch=prepareImportBatch(libraries,'__new__',{name:' 新知识库 ',description:' 说明 '},queue,{makeId:p=>p+'-'+(++sequence),now:'2026-10-28'});
  const state={customLibraries:[],sources:[{id:'old'}],chats:{a:['existing']},lastImportLibraryId:'b'};
  const next=applyImportBatch(state,batch);
  assert.deepEqual(queue,before);assert.equal(state.sources.length,1);assert.equal(state.customLibraries.length,0);
  assert.equal(next.customLibraries[0].name,'新知识库');assert.equal(next.sources.length,3);assert.equal(next.lastImportLibraryId,batch.library.id);
  assert.equal(next.sources[1].name,'folder/资料.md');assert.equal(next.sources[1].content,'# 正文');assert.equal(next.sources[2].kind,'web');
  assert.ok(batch.sources.every(s=>s.libraryId===batch.library.id&&s.state==='processing'));assert.equal(next.chats,state.chats);
});
test('empty, unnamed or excessive batches cannot create orphan libraries or update last-added state', () => {
  assert.throws(()=>prepareImportBatch(libraries,'a',null,[]),/至少/);
  assert.throws(()=>prepareImportBatch(libraries,'__new__',{name:' '},[{name:'x'}]),/名称/);
  assert.throws(()=>prepareImportBatch(libraries,'a',null,Array.from({length:1001},()=>({name:'x'}))),/1000/);
});

test('most recently viewed writable library outranks last upload; unavailable recent entries are skipped', () => {
  assert.equal(resolveImportTarget(libraries,{recent:['shared','gone','missing','b','a'],lastAddedId:'a'}),'b');
  assert.equal(resolveImportTarget(libraries,{explicitId:'a',recent:['b'],lastAddedId:'b'}),'a');
  assert.equal(resolveImportTarget(libraries,{currentId:'a',recent:['b']}),'a');
});
test('picker order follows views without mutating libraries and never offers received/unavailable items', () => {
  const before=structuredClone(libraries);
  assert.deepEqual(orderedImportLibraries(libraries,['shared','b','b','gone','a']).map(item=>item.id),['b','a']);
  assert.deepEqual(libraries,before);
  assert.deepEqual(orderedImportLibraries(libraries,[]).map(item=>item.id),['a','b']);
});
