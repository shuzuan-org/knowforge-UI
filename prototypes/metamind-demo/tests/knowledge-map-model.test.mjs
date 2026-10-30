import test from 'node:test';
import assert from 'node:assert/strict';
import { relatedPages, knowledgeMapDestination, libraryContentTab } from '../src/knowledge-map-model.mjs';

test('related pages explain real topic, keyword and source relationships without self links or duplicates', () => {
  const a={id:'a',title:'字体规范',category:'视觉规范',paragraphs:['字体和字号'],sourcePaths:['docs/design.md']};
  const b={id:'b',title:'排版',category:'视觉规范',paragraphs:['字体与布局'],sourcePaths:['docs/design.md','docs/design.md']};
  const c={id:'c',title:'部署',category:'工程',paragraphs:['构建与部署']};
  const result=relatedPages([a,b,b,c],'a');
  assert.equal(result.length,1);assert.equal(result[0].doc.id,'b');
  assert.deepEqual(result[0].keywords,['字体']);assert.deepEqual(result[0].sourcePaths,['docs/design.md']);
  assert.match(result[0].reasons.join('\n'),/相同主题/);assert.match(result[0].reasons.join('\n'),/共同引用/);
});
test('relations fail closed for missing pages, change with readable inputs and do not treat generic collections as a relationship',()=>{
  const a={id:'a',title:'笔记一',category:'收到的分享',paragraphs:['没有共同词']};
  const b={id:'b',title:'笔记二',category:'收到的分享',paragraphs:['另一段正文']};
  assert.deepEqual(relatedPages([a,b],'a'),[]);assert.deepEqual(relatedPages([a,b],'missing'),[]);
  const c={id:'c',title:'字体',paragraphs:['字体']};const d={id:'d',title:'字号',paragraphs:['字体']};
  assert.equal(relatedPages([c,d],'c').length,1);assert.deepEqual(relatedPages([c],'c'),[]);
});
test('legacy graph routes retain library and page scope and do not replace an unavailable library with another one',()=>{
  const route=new URL('http://local/graph?library=shared-a&doc=page-a');
  const dest=new URL(knowledgeMapDestination(route,[{id:'own'},{id:'shared-a'}]),'http://local');
  assert.equal(decodeURIComponent(dest.pathname),'/library/shared-a');assert.equal(dest.searchParams.get('doc'),'page-a');
  assert.equal(dest.searchParams.get('tab'),'map');assert.equal(dest.searchParams.has('expanded'),false);
  assert.match(knowledgeMapDestination(new URL('http://local/graph?library=removed'),[{id:'own'}]),/removed/);
  assert.equal(knowledgeMapDestination(new URL('http://local/graph'),[]),'/workspace');
});

test('legacy catalog bookmarks open the combined reading view while preserving source access boundaries',()=>{
  const route=q=>new URL('http://local/library/a?'+q);
  assert.equal(libraryContentTab(route('tab=catalog')),'knowledge');
  assert.equal(libraryContentTab(route('tab=catalog'),true),'knowledge');
  assert.equal(libraryContentTab(route('tab=catalog&view=map')),'knowledge');
  assert.equal(libraryContentTab(route('tab=map')),'map');
  assert.equal(libraryContentTab(route('tab=knowledge&view=map&expanded=1')),'map');
  assert.equal(libraryContentTab(route('tab=sources&view=map')),'sources');
  assert.equal(libraryContentTab(route('tab=sources'),true),'knowledge');
  assert.equal(libraryContentTab(route('tab=usage&view=map')),'usage');
  assert.equal(libraryContentTab(route('tab=usage'),true),'knowledge');
  assert.equal(libraryContentTab(route('tab=map'),true),'map');
  for(const tab of ['ask','pages','knowledge','unknown'])assert.equal(libraryContentTab(route('tab='+tab)),'knowledge');
});
