import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, UserRound, UsersRound } from 'lucide-react';
import { getCounts } from '../workbench-model.mjs';
import { exampleDocuments, libraryDocuments } from '../workbench-docs.js';
import { applyImportBatch, prepareImportBatch } from '../import-model.mjs';
import { ReceiveKnowledgeDialog, SharedOriginDialog } from '../KnowledgeSharing.jsx';
import { KnowledgeWorkspace } from './components/KnowledgeWorkspace.jsx';
import { KnowledgeReader } from './components/KnowledgeReader.jsx';
import { WorkspaceSharingContext } from './components/KnowledgeSharing.jsx';
import { appendActivity } from '../feature-model.mjs';
import referenceLibraries from './knowledge-source.json';
import './workspace-preview.css';

const categories = [
  { id: 'all', label: '知识列表', icon: BookOpen },
  { id: 'created', label: '我创建的', icon: UserRound },
  { id: 'shared', label: '与我共享', icon: UsersRound },
];
const workspacePath = tab => tab === 'all' ? '/workspace' : '/workspace?tab=' + tab;

const referenceById = new Map(referenceLibraries.map((library, index) => [library.libraryId, { ...library, index }]));
const escapeHtml = text => text.replace(/[&<>]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char]));
const toWiki = doc => ({ ...doc, html: doc.html || '<pre class="kb-import-text">' + escapeHtml(doc.content || doc.paragraphs?.join('\n\n') || '') + '</pre>' });

function adaptLibrary(library, sources) {
  const reference = referenceById.get(library.id);
  const localSources = sources.filter(source => source.libraryId === library.id);
  const counts = getCounts(library, localSources);
  const useReference = reference && !library.contentCleared;
  const unchanged = useReference && !localSources.length && !library.importedDocuments?.length && !library.generation;
  const localDocuments = unchanged ? [] : libraryDocuments(library, localSources);
  const exampleIds = useReference && !unchanged ? new Set(exampleDocuments(library.id).map(doc => doc.id)) : null;
  const documents = exampleIds ? localDocuments.filter(doc => !exampleIds.has(doc.id)) : localDocuments;
  const wikiDocuments = documents.map(toWiki);
  const contents = (useReference ? reference.contents : 0) + wikiDocuments.length;
  return {
    id: library.id, libraryId: library.id, name: library.name, description: library.description,
    owner: library.isShared ? 'shared' : 'created', isShare: library.isShared,
    available: library.available, organizingAgent: library.organizingAgent,
    ownerName: library.sharedBy, contents,
    status: library.available === false ? (library.revoked ? '分享已撤销' : '已取消接收') :
      contents || counts.ready ? '可使用' : localSources.length ? '待整理' : '待添加资料',
    files: counts.total - localSources.filter(source => source.kind === 'web').length,
    pending: counts.waiting + counts.processing + counts.attention,
    sources: localSources.map(source => ({
      ...source, hasText: source.state === 'ready' && Boolean(source.content?.trim()),
    })),
    filesUrl: useReference ? reference.filesUrl : undefined,
    ...(useReference && reference.contentUrl
      ? {
        contentUrl: reference.contentUrl,
        contentBytes: reference.contentBytes + wikiDocuments.reduce((size, doc) => size + new TextEncoder().encode(doc.html).length, 0),
        extraDocuments: wikiDocuments,
      }
      : { documents: wikiDocuments }),
  };
}

export function WorkspacePreview({ items, sources, route, navigate, state, setState, notify, storageError }) {
  const notebooks = useMemo(() => [...items].sort((a, b) =>
    (referenceById.get(a.id)?.index ?? -1) - (referenceById.get(b.id)?.index ?? -1)
  ).map(library => adaptLibrary(library, sources)), [items, sources]);
  const activeTab = route.searchParams.get('tab') || 'all';
  const listPath = workspacePath(activeTab);
  const selected = notebooks.find(notebook => notebook.id === route.searchParams.get('library') && notebook.available !== false);
  const receiveOpen = route.searchParams.has('receive');
  const [originId, setOriginId] = useState(null);
  const origin = items.find(item => item.id === originId);
  const returnToCard = useRef(null);
  const closeReceive = () => navigate('/workspace?tab=shared', true, false);

  useLayoutEffect(() => {
    document.title = (selected?.name || '知识库') + ' · MetaMind';
    if (selected) {
      document.getElementById('mm-main')?.focus({ preventScroll: true });
    } else if (returnToCard.current) {
      const { id, scrollY } = returnToCard.current;
      returnToCard.current = null;
      window.scrollTo({ top: scrollY, behavior: 'instant' });
      document.getElementById('kb-card-' + id)?.focus({ preventScroll: true });
    }
  }, [selected?.id, selected?.name]);

  function selectCategory(id) {
    if (id !== activeTab) returnToCard.current = null;
    navigate(workspacePath(id));
  }

  function openLibrary(id, doc) {
    const notebook = notebooks.find(item => item.id === id);
    if (!notebook) return;
    if (notebook.available === false) {
      setOriginId(id);
      return;
    }
    if (!selected) returnToCard.current = { id, scrollY: window.scrollY };
    const next = new URL(listPath, location.origin);
    next.searchParams.set('library', id);
    if (doc) next.searchParams.set('doc', doc);
    navigate(next);
  }

  function importSources(draft, library) {
    const batch = prepareImportBatch(items, library?.id, library ? null : draft, draft.inputSources.map(source => ({
      ...source,
      readable: Boolean(source.content || source.parseMethod),
      readError: source.content ? '' : source.note,
      organizingMethod: draft.organizingAgent,
    })));
    if (batch.isNew) batch.library.organizingAgent = draft.organizingAgent;
    setState(previous => appendActivity(applyImportBatch(previous, batch), '添加资料', batch.library.id));
    notify('已添加 ' + batch.sources.length + ' 份资料，正在整理');
  }

  function createLibrary(draft) {
    if (draft.inputSources.length) {
      importSources(draft);
    } else {
      const item = {
        id: 'local-' + crypto.randomUUID(),
        name: draft.name,
        description: draft.description,
        totalFiles: 0,
        readyFiles: 0,
        pendingFiles: 0,
        example: false,
        organizingAgent: draft.organizingAgent,
      };
      setState(previous => appendActivity({ ...previous, customLibraries: [...previous.customLibraries, item] }, '新建知识库', item.id));
      notify('知识库已创建');
    }
    navigate('/workspace');
  }

  return <div className="uw-app mm-demo-workspace">
    <a className="mm-skip" href="#mm-main">跳到主要内容</a>
    <aside className="mm-demo-rail" aria-label="MetaMind">
      <div className="mm-demo-brand">
        <img src="/static/img/brand/workspace-mark.svg" alt="MetaMind"/>
      </div>
      <nav className="mm-demo-rail-nav" aria-label="知识库导航">
        {categories.map(({ id, label, icon: Icon }) => {
          const count = id === 'all' ? null : notebooks.filter(notebook => notebook.owner === id).length;
          const accessibleLabel = count === null ? label : label + ' ' + count;
          return <button key={id} type="button" aria-label={accessibleLabel} aria-pressed={id === activeTab}
            data-tooltip={accessibleLabel} onClick={() => selectCategory(id)}>
            <Icon size={18} strokeWidth={1.7} aria-hidden="true"/>
            <span aria-hidden="true">{label}</span>
          </button>;
        })}
      </nav>
    </aside>
    <div className="mm-demo-body">
      {storageError && <p role="alert" className="kb-receive-message">浏览器存储空间不足，新增内容暂时无法保留。</p>}
      {selected
        ? <WorkspaceSharingContext.Provider value={{ items, sources, state, setState, notify }}>
          <KnowledgeReader key={selected.id} library={selected} libraries={notebooks}
            initialDocument={route.searchParams.get('doc')} onOpenLibrary={openLibrary}
            onClose={() => navigate(listPath, true, false)}
            onAddSources={draft => importSources(draft, selected)}
            onRemoveShared={selected.isShare ? () => setOriginId(selected.id) : undefined}/>
        </WorkspaceSharingContext.Provider>
        : <KnowledgeWorkspace activeTab={activeTab} notebooks={notebooks} onOpenLibrary={openLibrary}
          onCreate={createLibrary} onReceive={() => navigate('/workspace?tab=shared&receive=1')}/>}
    </div>
    {receiveOpen && <ReceiveKnowledgeDialog route={route} state={state} setState={setState}
      notify={notify} navigate={navigate} onClose={closeReceive} listOnly/>}
    {origin && <SharedOriginDialog item={origin} state={state} setState={setState} notify={notify}
      onClose={() => setOriginId(null)}/>}
  </div>;
}
