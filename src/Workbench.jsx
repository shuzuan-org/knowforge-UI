import { useEffect, useMemo, useState } from 'react';
import seed from './library-seed.json';
import packageSeed from './package-seed.json';
import { migrateAdvanced } from './advanced-model.mjs';
import { appendActivity, migrateFeatures } from './feature-model.mjs';
import { migrateGlobalAsk } from './global-ask-model.mjs';
import { buildKnowledgeItems, migrateUnifiedKnowledge } from './knowledge-model.mjs';
import { finishSource, migrateExisting } from './workbench-model.mjs';
import { WorkspacePreview } from './workspace-demo/WorkspacePreview.jsx';
import './typography.css';
import './workbench.css';
import './features.css';

const STORAGE = 'metamind-workbench-v2';

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

function initialState() {
  const stored = read(STORAGE, null);
  const base = stored?.version === 2 ? stored : {
    version: 2,
    ...migrateExisting(read('mirror-scopes', []), read('mirror-files', []), seed.libraries[0].id),
  };
  return migrateGlobalAsk(migrateUnifiedKnowledge(migrateFeatures(migrateAdvanced(base, read('mirror-agents', []), packageSeed))));
}

function workspaceUrl(href) {
  const incoming = new URL(href, location.origin);
  const next = new URL('/workspace', location.origin);
  if (incoming.pathname !== next.pathname) return next;
  const tab = incoming.searchParams.get('tab') || ({ mine: 'created', shared: 'shared' })[incoming.searchParams.get('filter')];
  const shareId = incoming.searchParams.get('demoShare');
  if (shareId || incoming.searchParams.has('receive')) {
    next.searchParams.set('tab', 'shared');
    next.searchParams.set('receive', '1');
    if (shareId) next.searchParams.set('demoShare', shareId);
  } else {
    if (['created', 'shared'].includes(tab)) next.searchParams.set('tab', tab);
    const libraryId = incoming.searchParams.get('library');
    if (libraryId) {
      next.searchParams.set('library', libraryId);
      const doc = incoming.searchParams.get('doc');
      if (doc) next.searchParams.set('doc', doc);
    }
  }
  if (incoming.hash === '#mm-main') next.hash = incoming.hash;
  return next;
}

export function App() {
  const [route, setRoute] = useState(() => workspaceUrl(location.href));
  const [state, setState] = useState(initialState);
  const [storageError, setStorageError] = useState(false);
  const [toast, setToast] = useState('');

  function navigate(href, replace = false, scroll = true) {
    const next = workspaceUrl(href);
    if (next.href !== location.href) {
      if (replace) history.replaceState(null, '', next);
      else history.pushState(null, '', next);
    }
    setRoute(next);
    if (scroll) window.scrollTo({ top: 0, behavior: 'instant' });
  }

  useEffect(() => {
    const sync = () => navigate(location.href, true, false);
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(state));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [state]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4200);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const pending = new Set(state.sources.filter(source => source.state === 'processing' && !source.trashedAt).slice(0, 8).map(source => source.id));
    if (!pending.size) return;
    const timer = setTimeout(() => setState(previous => {
      const sources = previous.sources.map(source =>
        pending.has(source.id) && source.state === 'processing' && !source.trashedAt ? finishSource(source) : source);
      return appendActivity({ ...previous, sources }, '更新资料状态');
    }), 150);
    return () => clearTimeout(timer);
  }, [state.sources]);

  const libraries = useMemo(() => {
    const items = [...seed.libraries, ...state.customLibraries]
      .map(library => ({ ...library, ...state.edits[library.id] }))
      .filter(library => !state.hiddenLibraries.includes(library.id) && !state.deletedLibraries.includes(library.id))
      .map(library => ({
        ...library,
        generation: state.generations[library.id],
        importedDocuments: state.importedDocuments[library.id] || [],
      }));
    return buildKnowledgeItems(items, state);
  }, [state]);
  const sources = useMemo(() => state.sources.filter(source => !source.trashedAt), [state.sources]);

  return <>
    <WorkspacePreview items={libraries} sources={sources} route={route} navigate={navigate}
      state={state} setState={setState} notify={setToast} storageError={storageError}/>
    {toast && <div className="mm-toast" role="status">{toast}</div>}
  </>;
}
