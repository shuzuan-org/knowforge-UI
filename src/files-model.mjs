export const PAGE_SIZE = 20;

export function sourceLocation(source) {
  if (source.kind === 'web') return { name: source.name, path: source.name, folder: '' };
  const path = String(source.name || '').replaceAll('\\', '/').replace(/^\/+|\/+$/g, '');
  const parts = path.split('/');
  return { name: parts.at(-1) || '未命名文件', path, folder: parts.slice(0, -1).join('/') };
}

export function fileKind(source) {
  if (source.kind === 'web') return '网页';
  const extension = sourceLocation(source).name.split('.').at(-1).toLowerCase();
  if (/^(png|jpe?g|gif|webp|svg|heic|avif)$/.test(extension) || source.type === '图片') return '图片';
  if (/^(pdf|docx?|pptx?|xlsx?)$/.test(extension)) return '文档';
  if (/^(txt|md|markdown|csv|json|rtf)$/.test(extension) || source.type === '文本') return '文本';
  if (/^(html?|css|scss|js|jsx|ts|tsx|py|java|mjs|vue|sh|sql|yaml|yml)$/.test(extension) || source.type === '代码') return '代码';
  return '其他';
}

export function collectFiles(libraries, sources, examples) {
  const names = new Map(libraries.map(l => [l.id, l.name]));
  return [...sources].reverse().concat(examples).filter(s => names.has(s.libraryId)).map(s => ({ ...s, libraryName: names.get(s.libraryId), location: sourceLocation(s), fileKind: fileKind(s) }));
}

export function isInFolder(source, folder) {
  return !folder || sourceLocation(source).folder === folder || sourceLocation(source).folder.startsWith(folder + '/');
}

export function filterFiles(files, { libraryId = '', folder = '', query = '', status = 'all', kind = 'all', origin = 'all', trash = false, sort = 'recent' } = {}) {
  const needle = query.trim().toLocaleLowerCase();
  const result = files.filter(s => !!s.trashedAt === trash)
    .filter(s => !libraryId || s.libraryId === libraryId)
    .filter(s => isInFolder(s, folder))
    .filter(s => !needle || (s.name + ' ' + s.libraryName).toLocaleLowerCase().includes(needle))
    .filter(s => status === 'all' || (status === 'indexed' ? s.example && s.state === 'ready' : status === 'skipped' ? s.state === 'skipped' : status === 'example' ? s.example : !s.example && (status === 'pending' ? ['waiting', 'processing'].includes(s.state) : s.state === status)))
    .filter(s => kind === 'all' || s.fileKind === kind)
    .filter(s => origin === 'all' || (origin === 'example' ? s.example : !s.example));
  if (sort === 'contribution') return result.sort((a,b) => (b.contribution ?? -1) - (a.contribution ?? -1) || a.name.localeCompare(b.name,'zh-CN'));
  if (sort === 'name') return result.sort((a, b) => sourceLocation(a).name.localeCompare(sourceLocation(b).name, 'zh-CN') || a.name.localeCompare(b.name, 'zh-CN'));
  if (trash) return result.sort((a, b) => b.trashedAt.localeCompare(a.trashedAt));
  return result.sort((a, b) => Number(!!a.example) - Number(!!b.example) || (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export function buildFolderTree(files) {
  const roots = new Map();
  for (const source of files) {
    const parts = sourceLocation(source).folder.split('/').filter(Boolean);
    let children = roots, path = '';
    for (const name of parts) {
      path += (path ? '/' : '') + name;
      if (!children.has(name)) children.set(name, { name, path, count: 0, children: new Map() });
      const node = children.get(name); node.count++; children = node.children;
    }
  }
  const flatten = nodes => [...nodes.values()].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')).map(n => ({ ...n, children: flatten(n.children) }));
  return flatten(roots);
}

export function trashSources(state, ids, at = new Date().toISOString()) {
  const selected = new Set(ids);
  return { ...state, sources: state.sources.map(s => selected.has(s.id) && !s.example && !s.trashedAt ? { ...s, trashedAt: at, stateBeforeTrash: s.state } : s) };
}

export function restoreSources(state, ids) {
  const selected = new Set(ids);
  return { ...state, sources: state.sources.map(s => {
    if (!selected.has(s.id) || !s.trashedAt || s.example) return s;
    const { trashedAt, stateBeforeTrash, ...rest } = s;
    return { ...rest, state: stateBeforeTrash === 'processing' ? 'waiting' : stateBeforeTrash || s.state };
  }) };
}

export function changeProcessing(state, ids, next) {
  const selected = new Set(ids);
  return { ...state, sources: state.sources.map(s => selected.has(s.id) && !s.example && !s.trashedAt && (next === 'waiting' ? s.state === 'processing' : s.state === 'waiting') ? { ...s, state: next } : s) };
}
