import test from 'node:test';
import assert from 'node:assert/strict';
import { recentPageIds, rememberRecentPage, recentLibraryPages, stableRecentOrder } from '../src/recent-reading-model.mjs';

test('older states do not invent reading history; new records preserve existing data', () => {
  const state = { recent: ['book'], chats: { book: ['answer'] }, sources: ['source'] };
  assert.deepEqual(recentPageIds(state, 'book'), []);
  const next = rememberRecentPage(state, 'book', 'chapter');
  assert.deepEqual(next.recentPages, { book: ['chapter'] });
  assert.equal(next.chats, state.chats); assert.equal(next.sources, state.sources);
  assert.equal(state.recentPages, undefined);
});
test('revisits move a page to the front without duplicates or truncation', () => {
  let state = {};
  for (let i = 0; i < 12; i++) state = rememberRecentPage(state, 'book', String(i));
  state = rememberRecentPage(state, 'book', '2');
  assert.equal(recentPageIds(state, 'book').length, 12);
  assert.equal(recentPageIds(state, 'book')[0], '2');
  assert.equal(rememberRecentPage(state, 'book', '2'), state);
  state = rememberRecentPage(state, 'other', '2');
  assert.deepEqual(recentPageIds(state, 'other'), ['2']);
  assert.equal(recentPageIds(state, 'book').length, 12);
});
test('current titles are used and removed or inaccessible pages are excluded', () => {
  const state = { recentPages: { book: ['removed', 'chapter', 'outside-share'] } };
  const documents = [{ id: 'chapter', title: 'Updated title' }];
  assert.deepEqual(recentLibraryPages(state, { id: 'book' }, documents), documents);
  assert.deepEqual(recentLibraryPages(state, { id: 'book', available: false }, documents), []);
  assert.deepEqual(recentLibraryPages(state, { id: 'book' }, []), []);
  assert.deepEqual(recentLibraryPages(state, undefined, documents), []);
});
test('invalid history is harmless and JSON persistence retains identifiers', () => {
  assert.deepEqual(recentPageIds({ recentPages: { book: {} } }, 'book'), []);
  assert.deepEqual(recentPageIds({ recentPages: { book: [null, 1, '', 'page', 'page'] } }, 'book'), ['page']);
  const state = { chats: { book: ['kept'] } };
  assert.equal(rememberRecentPage(state, '', 'page'), state);
  assert.equal(rememberRecentPage(state, 'book', ''), state);
  const next = JSON.parse(JSON.stringify(rememberRecentPage(state, 'book', '目录/章节.md')));
  assert.deepEqual(recentPageIds(next, 'book'), ['目录/章节.md']); assert.deepEqual(next.chats, state.chats);
});

test('visible library and page positions remain stable while true recency changes', () => {
  const visible = ['first', 'second', 'third'];
  assert.deepEqual(stableRecentOrder(visible, ['third', 'first', 'second']), visible);
  const state = rememberRecentPage({ recentPages: { book: visible } }, 'book', 'third');
  assert.deepEqual(recentPageIds(state, 'book'), ['third', 'first', 'second']);
  assert.deepEqual(stableRecentOrder(visible, recentPageIds(state, 'book')), visible);
  assert.deepEqual(visible, ['first', 'second', 'third']);
});

test('new entries and access removals do not reshuffle retained rows; remount uses real recency', () => {
  assert.deepEqual(stableRecentOrder(['a', 'b', 'c'], ['d', 'c', 'a', 'b']), ['d', 'a', 'b', 'c']);
  assert.deepEqual(stableRecentOrder(['a', 'b', 'c'], ['c', 'b']), ['b', 'c']);
  assert.deepEqual(stableRecentOrder([], ['c', 'a', 'b']), ['c', 'a', 'b']);
  assert.deepEqual(stableRecentOrder(['a', 'a'], ['a', 'a']), ['a']);
  assert.deepEqual(stableRecentOrder(['a'], []), []);
});
