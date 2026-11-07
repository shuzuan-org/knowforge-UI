import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFolderTree, changeProcessing, collectFiles, fileKind, filterFiles, restoreSources, sourceLocation, trashSources } from '../src/files-model.mjs';
import { finishSource, getCounts } from '../src/workbench-model.mjs';

const libraries = [{ id: 'a', name: '设计规范', totalFiles: 0 }, { id: 'b', name: '项目资料', totalFiles: 0 }];
const files = [
  { id: '1', libraryId: 'a', name: '品牌/排版/字体.md', state: 'ready', content: '字体规范正文', createdAt: '2026-10-23T01:00:00Z' },
  { id: '2', libraryId: 'a', name: '品牌/排版2/图片.png', state: 'attention' },
  { id: '3', libraryId: 'b', name: '项目/记录.pdf', state: 'waiting' },
];

test('目录路径按完整层级筛选，不混入前缀相似的相邻文件夹', () => {
  const items = collectFiles(libraries, files, []);
  assert.deepEqual(filterFiles(items, { libraryId: 'a', folder: '品牌/排版' }).map(s => s.id), ['1']);
  assert.equal(buildFolderTree(files)[0].count, 2);
  assert.deepEqual(buildFolderTree(files)[0].children.map(n => [n.path, n.count]), [['品牌/排版', 1], ['品牌/排版2', 1]]);
  assert.equal(sourceLocation({ name: 'Brand\\Typography\\rules.md' }).folder, 'Brand/Typography');
});

test('跨库搜索、类型和来源筛选保持范围，示例记录不伪装为本地可使用文件', () => {
  const items = collectFiles(libraries, files, [{ id: 'example', libraryId: 'a', name: '示例.md', state: 'ready', example: true }]);
  assert.deepEqual(filterFiles(items, { status: 'ready' }).map(s => s.id), ['1']);
  assert.deepEqual(filterFiles(items, { query: '项目资料', status: 'pending' }).map(s => s.id), ['3']);
  assert.deepEqual(filterFiles(items, { origin: 'example' }).map(s => s.id), ['example']);
  assert.deepEqual(filterFiles(items, { kind: '图片' }).map(s => s.id), ['2']);
  assert.equal(filterFiles(items, { libraryId: 'b', query: '字体' }).length, 0);
  assert.equal(collectFiles(libraries.slice(1), files, []).length, 1);
});

test('回收站保留原文、路径、ID和整理规则，恢复后可继续使用', () => {
  const rules = { name: '设计研究员', direction: '字体与证据' };
  const state = { sources: [{ ...files[0], agentRules: rules }], chats: { a: [{ evidence: '历史引用' }] } };
  const recycled = trashSources(state, ['1'], '2026-10-23T02:00:00Z');
  assert.equal(recycled.sources[0].content, files[0].content);
  assert.equal(recycled.sources[0].name, files[0].name);
  assert.deepEqual(recycled.sources[0].agentRules, rules);
  assert.deepEqual(recycled.chats, state.chats);
  assert.equal(filterFiles(collectFiles(libraries, recycled.sources, [])).length, 0);
  assert.equal(filterFiles(collectFiles(libraries, recycled.sources, []), { trash: true }).length, 1);
  assert.deepEqual(restoreSources(recycled, ['1']), state);
  assert.equal(state.sources[0].trashedAt, undefined);
});

test('回收站内的文件不继续整理，恢复运行中的任务时先暂停等待', () => {
  const state = { sources: [{ ...files[0], state: 'processing' }] };
  const recycled = trashSources(state, ['1']);
  assert.deepEqual(finishSource(recycled.sources[0]), recycled.sources[0]);
  assert.deepEqual(changeProcessing(recycled, ['1'], 'processing'), recycled);
  const restored = restoreSources(recycled, ['1']);
  assert.equal(restored.sources[0].state, 'waiting');
  const resumed = changeProcessing(restored, ['1'], 'processing');
  assert.equal(finishSource(resumed.sources[0]).state, 'ready');
});

test('批量操作保护只读示例、未选文件及未知ID，不重复覆盖回收站记录', () => {
  const state = { sources: [...files, { id: 'example', name: '示例', example: true, state: 'ready' }] };
  const first = trashSources(state, ['1', 'example', 'missing'], 'first');
  assert.equal(first.sources[0].trashedAt, 'first');
  assert.equal(first.sources[1].trashedAt, undefined);
  assert.equal(first.sources[3].trashedAt, undefined);
  assert.equal(trashSources(first, ['1'], 'second').sources[0].trashedAt, 'first');
  assert.equal(first.sources.length, state.sources.length);
});

test('知识库统计排除回收站文件，网页地址不作为文件夹路径', () => {
  const recycled = trashSources({ sources: files }, ['1']);
  assert.equal(getCounts(libraries[0], recycled.sources).total, 1);
  assert.equal(getCounts(libraries[0], recycled.sources).ready, 0);
  assert.equal(getCounts(libraries[0], restoreSources(recycled, ['1']).sources).ready, 1);
  assert.equal(sourceLocation({ kind: 'web', name: 'https://example.com/a/b' }).folder, '');
  assert.equal(fileKind({ kind: 'web', name: 'https://example.com/file.pdf' }), '网页');
  assert.equal(fileKind({ name: '规则.JSON' }), '文本');
  assert.equal(fileKind({ name: 'index.tsx' }), '代码');
});
