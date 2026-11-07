import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogOutline,plainDocumentHeadings} from '../src/catalog-outline-model.mjs';

test('directory excludes the duplicate article title and retains original heading indices',()=>{
 const result=catalogOutline([{text:'文章',level:1},{text:'概述',level:2},{text:'概述',level:3},{text:'结论',level:2}],'文章');
 assert.deepEqual(result.map(h=>[h.index,h.text,h.depth]),[[1,'概述',0],[2,'概述',1],[3,'结论',0]]);
});
test('empty outlines and a distinct first heading do not invent chapters',()=>{
 assert.deepEqual(catalogOutline([{text:'文章',level:1}],'文章'),[]);
 assert.equal(catalogOutline([{text:'不同的标题',level:1}],'文章')[0].index,0);
});
test('plain-text chapter indices match the actual reader rendering rather than paragraph indices',()=>{
 const doc={title:'笔记',paragraphs:['开头正文','## 第一节','普通正文','#### 第二节','第一节']};
 assert.deepEqual(catalogOutline(plainDocumentHeadings(doc),doc.title).map(h=>[h.index,h.level,h.text]),[[1,2,'第一节'],[2,2,'第二节']]);
});
