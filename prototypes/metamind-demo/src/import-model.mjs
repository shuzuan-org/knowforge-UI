// Explicit/current context wins; otherwise use the most recently viewed writable
// knowledge library. Received or unavailable items never become upload targets.
export function orderedImportLibraries(libraries, recent = []) {
  const writable = libraries.filter(l => !l.isShared && l.available !== false);
  const ranks = new Map();
  for (const id of recent) if (!ranks.has(id)) ranks.set(id, ranks.size);
  return writable.map((library, index) => ({ library, index })).sort((a, b) =>
    (ranks.get(a.library.id) ?? Infinity) - (ranks.get(b.library.id) ?? Infinity) || a.index - b.index
  ).map(item => item.library);
}

export function resolveImportTarget(libraries, { explicitId, currentId, recent = [], lastAddedId, sources = [] } = {}) {
  const writable = orderedImportLibraries(libraries, recent);
  const valid = id => writable.some(l => l.id === id);
  for (const id of [explicitId, currentId, ...recent, lastAddedId]) if (valid(id)) return id;
  const previous = sources.filter(s => !s.trashedAt && valid(s.libraryId)).map((s, i) => ({ ...s, order: i }))
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')) || b.order - a.order)[0];
  return previous?.libraryId || writable[0]?.id || '';
}

export function prepareImportBatch(libraries, targetId, newLibrary, pending, { makeId = prefix => prefix + '-' + crypto.randomUUID(), now = new Date().toISOString() } = {}) {
  if (!pending.length) throw new Error('请先添加至少一份资料。');
  if (pending.length > 1000) throw new Error('每批最多添加1000份资料，请分批添加。');
  if (newLibrary && !newLibrary.name?.trim()) throw new Error('请填写新知识库的名称。');
  const library = newLibrary ? { id: makeId('local'), name: newLibrary.name.trim(), description: (newLibrary.description || '').trim(), totalFiles: 0, readyFiles: 0, pendingFiles: 0, example: false }
    : libraries.find(l => l.id === targetId && !l.isShared && l.available !== false);
  if (!library) throw new Error('这个知识库已不可用，请重新选择保存位置。');
  const batchId = makeId('batch');
  return { library, isNew: !!newLibrary, batchId, sources: pending.map(source => ({ ...source, id: makeId('source'), batchId, libraryId: library.id, state: 'processing', createdAt: now })) };
}

export function applyImportBatch(state, batch) {
  return { ...state, customLibraries: batch.isNew ? [...state.customLibraries, batch.library] : state.customLibraries,
    sources: [...state.sources, ...batch.sources], lastImportLibraryId: batch.library.id };
}
