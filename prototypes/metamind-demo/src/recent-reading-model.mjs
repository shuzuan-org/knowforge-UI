// Persist identifiers only; resolve labels against currently accessible pages.
export function recentPageIds(state, libraryId) {
  const ids = state?.recentPages?.[libraryId];
  return Array.isArray(ids) ? [...new Set(ids.filter(id => typeof id === 'string' && id))] : [];
}
export function rememberRecentPage(state, libraryId, documentId) {
  if (!libraryId || !documentId) return state;
  const previous = recentPageIds(state, libraryId);
  if (previous[0] === documentId) return state;
  return { ...state, recentPages: { ...state.recentPages, [libraryId]: [documentId, ...previous.filter(id => id !== documentId)] } };
}
export function recentLibraryPages(state, library, documents) {
  if (!library || library.available === false) return [];
  const available = new Map(documents.map(doc => [doc.id, doc]));
  return recentPageIds(state, library.id).map(id => available.get(id)).filter(Boolean);
}

// Keep spatial positions while browsing without changing the actual visit history.
export function stableRecentOrder(previous, current) {
  const incoming = [...new Set(current)];
  const available = new Set(incoming);
  const retained = [...new Set(previous)].filter(id => available.has(id));
  const known = new Set(retained);
  return [...incoming.filter(id => !known.has(id)), ...retained];
}
