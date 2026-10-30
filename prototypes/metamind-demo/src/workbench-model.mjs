export const TEXT_LIMIT = 2_000_000;
export const STATE_LABELS = { waiting: '待开始', processing: '整理中', ready: '可使用', attention: '需处理' };

export function finishSource(source) {
  if (source.trashedAt) return source;
  if (source.content?.trim()) return { ...source, state: 'ready', reason: '', completedAt: new Date().toISOString() };
  const reason = source.readError || (source.kind === 'web'
    ? '暂不支持自动获取网页正文。请补充文本后继续整理和提问。'
    : source.tooLarge ? '文件超过读取上限，请拆分后添加，或补充一段文本。'
    : source.readable ? '没有读取到正文，请检查文件内容，或补充文本。'
    : '该格式的本机解析尚未支持（如旧版 Word、图片）。请补充文本，或将 PDF/DOCX 重新添加以读取正文。');
  return { ...source, state: 'attention', reason };
}

export function getCounts(library, sources) {
  const items = sources.filter(s => s.libraryId === library.id && !s.trashedAt);
  const count = state => items.filter(s => s.state === state).length;
  return { total: (library.totalFiles || 0) + items.length, ready: (library.readyFiles || 0) + count('ready'), waiting: (library.pendingFiles || 0) + count('waiting'), processing: count('processing'), attention: count('attention'), skipped: library.skippedFiles || 0 };
}

export function migrateExisting(scopes = [], files = [], defaultId) {
  return {
    customLibraries: scopes.filter(s => s?.id && s?.name).map(s => ({ ...s, totalFiles: 0, readyFiles: 0, pendingFiles: 0, description: s.description || '', example: false })),
    sources: files.filter(f => f?.name).map((f, i) => ({ ...f, id: f.id || 'migrated-' + i, libraryId: f.libraryId || defaultId, readable: !!f.text, content: f.text || '', kind: 'file', state: f.text?.trim() ? 'ready' : 'attention', reason: f.text?.trim() ? '' : '旧版记录未保存正文。请重新添加文件，或补充文本。', createdAt: new Date().toISOString() })),
    chats: {}, recent: [], edits: {}, hiddenLibraries: [],
  };
}

const STOP = new Set(['什么','哪些','怎么','如何','这个','这份','一下','可以','有没有','的资料','有什么','告诉','我们','进行','请问','关于','是什么']);
export function findEvidence(question, documents) {
  const query = question.trim().toLowerCase();
  if (!query) return [];
  const overview = /概括|主要.*(内容|说|讲)|要点|有哪些内容|总结/.test(query);
  const tokens = new Set(query.match(/[a-z0-9_-]{2,}/g) || []);
  for (const phrase of query.match(/[\u4e00-\u9fff]+/g) || []) {
    for (let n = 0; n < phrase.length - 1; n++) {
      const t = phrase.slice(n, n + 2); if (!STOP.has(t)) tokens.add(t);
    }
  }
  const matches = documents.flatMap((doc, order) => doc.paragraphs.map((text, paragraphIndex) => {
    let score = overview ? Math.max(1, 30 - order * 4 - paragraphIndex) : [...tokens].reduce((n, token) => n + (text.toLowerCase().includes(token) ? 4 : 0) + (doc.title.toLowerCase().includes(token) ? 1 : 0), 0);
    if (!overview && /字号|字重/.test(query) && /字体|排版/.test(doc.title) && /[0-9]+(?:px|rem|–|-)/.test(text)) score += 5;
    if (!overview && /日期|时间|截止|什么时候/.test(query) && /[0-9]{4}年|[0-9]+月[0-9]+日|截止/.test(text)) score += 12;
    if (/^注[:：]|授权规范|版权声明/.test(text)) score *= .15;
    return { docId: doc.id, title: doc.title, text, paragraphIndex, sourceKind: doc.sourceKind, score };
  })).filter(r => r.score > 0 && r.text.trim().length > 8).sort((a, b) => b.score - a.score);
  const perDoc = new Map();
  const relevant = overview ? matches : matches.filter(r => r.score >= (matches[0]?.score || 0) * .6);
  return relevant.filter(r => { const n = perDoc.get(r.docId) || 0; perDoc.set(r.docId, n + 1); return n < 2; }).slice(0, 3);
}

export function formatBytes(bytes = 0) {
  if (!bytes) return '文本资料';
  return bytes > 1024 * 1024 ? (bytes / 1024 / 1024).toFixed(1) + ' MB' : Math.max(1, Math.round(bytes / 1024)) + ' KB';
}

export function libraryPath(id, tab = 'knowledge', doc = '') {
  return '/library/' + encodeURIComponent(id) + '?tab=' + tab + (doc ? '&doc=' + encodeURIComponent(doc) : '');
}

export function questionDocuments(documents, scope, currentId) {
  return scope === 'all' ? documents : scope === 'current' ? documents.filter(doc => doc.id === currentId) : [];
}

export function resolveEvidence(evidence, document) {
  const current = document?.paragraphs[evidence.paragraphIndex];
  const unchanged = typeof current === 'string' && current.startsWith(evidence.text);
  return { text: unchanged ? current : evidence.text, unchanged, missing: !document };
}
