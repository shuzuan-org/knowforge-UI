import test from 'node:test';
import assert from 'node:assert/strict';
import { finishSource, findEvidence, getCounts, migrateExisting, libraryPath, questionDocuments } from '../src/workbench-model.mjs';

test('资料可用与需处理明确区分，补充文本可以恢复', () => {
  const unsupported = finishSource({ id: 'a', name: 'report.doc', state: 'processing' });
  assert.equal(unsupported.state, 'attention');
  assert.match(unsupported.reason, /本机解析尚未支持/);
  assert.equal(finishSource({ ...unsupported, content: '项目约定：品牌使用紫色，并保留资料引用。', providedText: true }).state, 'ready');
  assert.equal(finishSource({ readable: true, content: '  ' }).state, 'attention');
});
test('资料统计和检索不混入其他知识库内容', () => {
  const sources = [{ libraryId: 'a', state: 'ready' }, { libraryId: 'b', state: 'ready' }, { libraryId: 'a', state: 'attention' }];
  const counts = getCounts({ id: 'a', readyFiles: 2, pendingFiles: 1, totalFiles: 3 }, sources);
  assert.deepEqual(counts, { total: 5, ready: 3, waiting: 1, attention: 1, processing: 0, skipped: 0 });
  assert.deepEqual(findEvidence('火星登陆', [{ id: 'd', title: '字体规范', paragraphs: ['使用 Inter 与 Noto Sans SC，正文为14px。'] }]), []);
});
test('回答引用可回到精确的原文段落，限制在所选文档集合', () => {
  const docs = [{ id: 'fonts', title: '字体规范', sourceKind: 'original', paragraphs: ['主界面使用紫色作为强调色。', '正文使用Inter字体，字号14px，字重400。'] }, { id: 'colors', title: '色彩规范', paragraphs: ['品牌强调色为紫色。'] }];
  const result = findEvidence('字体字号如何使用', docs.slice(0, 1));
  assert.equal(result[0].docId, 'fonts');
  assert.equal(result[0].paragraphIndex, 1);
  assert.equal(result[0].text, docs[0].paragraphs[1]);
});
test('旧版本地知识库和文件保留，缺正文记录不会伪装成可用', () => {
  const state = migrateExisting([{ id: 'local-x', name: '我的库' }], [{ name: 'notes.md', text: '资料正文：这是既有的本地记录。' }, { name: 'paper.pdf' }], 'seed');
  assert.equal(state.customLibraries[0].name, '我的库');
  assert.equal(state.sources[0].state, 'ready');
  assert.equal(state.sources[1].state, 'attention');
  assert.equal(state.sources[0].libraryId, 'seed');
  assert.equal(libraryPath('a:b', 'pages', '目录/页面.md'), '/library/a%3Ab?tab=pages&doc=%E7%9B%AE%E5%BD%95%2F%E9%A1%B5%E9%9D%A2.md');
});

test('资料更新后，历史引用仍保留回答时的摘录', async () => {
  const { resolveEvidence } = await import('../src/workbench-model.mjs');
  const evidence = { paragraphIndex: 0, text: '原定交付日期为11月6日。' };
  assert.equal(resolveEvidence(evidence, { paragraphs: ['原定交付日期为11月6日。'] }).unchanged, true);
  const changed = resolveEvidence(evidence, { paragraphs: ['最新交付日期改为11月13日。'] });
  assert.equal(changed.unchanged, false);
  assert.equal(changed.text, evidence.text);
  assert.equal(resolveEvidence(evidence, undefined).missing, true);
});

test('边读边问使用当前页面的明确范围，不混入其他页面', () => {
  const docs = [{ id: 'a', title: '客户甲', paragraphs: ['客户甲的项目截止日期为2026年11月6日。'] }, { id: 'b', title: '客户乙', paragraphs: ['客户乙的项目截止日期为2026年12月1日。'] }];
  assert.deepEqual(questionDocuments(docs, 'current', 'b').map(d => d.id), ['b']);
  const evidence = findEvidence('项目截止日期是什么', questionDocuments(docs, 'current', 'b'));
  assert.ok(evidence.length > 0);
  assert.ok(evidence.every(e => e.docId === 'b' && !e.text.includes('11月6日')));
  assert.equal(questionDocuments(docs, 'all', 'b').length, 2);
});

test('失效页面范围不会默默扩展检索，默认链接打开合并后的工作区', () => {
  const docs = [{ id: 'a', title: '客户甲', paragraphs: ['这份资料属于客户甲。'] }];
  assert.deepEqual(questionDocuments(docs, 'current', 'removed'), []);
  assert.deepEqual(questionDocuments(docs, 'unknown', 'a'), []);
  assert.equal(libraryPath('a:b'), '/library/a%3Ab?tab=knowledge');
  assert.equal(libraryPath('a:b', 'ask', 'source:123'), '/library/a%3Ab?tab=ask&doc=source%3A123');
});
