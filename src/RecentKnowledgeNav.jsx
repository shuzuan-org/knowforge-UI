import React, { useEffect, useId, useState } from 'react';
import { libraryDocuments } from './workbench-docs.js';
import { libraryPath } from './workbench-model.mjs';
import { libraryContentTab } from './knowledge-map-model.mjs';
import { recentLibraryPages, recentPageIds, stableRecentOrder } from './recent-reading-model.mjs';
import './recent-knowledge.css';

export function RecentKnowledgeNav({ libraries, sources, state, currentLibraryId, route, readRequest }) {
  const displayedLibraries = useStableRecentItems(libraries);
  return <nav className="mm-recent-nav" aria-label="最近访问的知识">
    {displayedLibraries.map((library, index) => {
      const documents = recentPageIds(state, library.id).length ? libraryDocuments(library, sources) : [];
      const pages = recentLibraryPages(state, library, documents);
      const isCurrent = currentLibraryId === library.id;
      const reading = isCurrent && libraryContentTab(route, library.isShared) === 'knowledge';
      const currentPage = reading ? documents.find(doc => doc.id === route.searchParams.get('doc')) || documents[0] : null;
      return <RecentLibrary key={library.id} library={library} pages={pages} isCurrent={isCurrent}
        currentPageId={currentPage?.id} initiallyOpen={isCurrent || index === 0} readRequest={readRequest} />;
    })}
  </nav>;
}

function useStableRecentItems(items) {
  const [order, setOrder] = useState(() => items.map(item => item.id));
  const next = stableRecentOrder(order, items.map(item => item.id));
  // Adjust this component's own state before commit so no reordered frame flashes.
  if (next.length !== order.length || next.some((id, index) => id !== order[index])) setOrder(next);
  const byId = new Map(items.map(item => [item.id, item]));
  return next.map(id => byId.get(id));
}

function RecentLibrary({ library, pages, isCurrent, currentPageId, initiallyOpen, readRequest }) {
  const listId = useId();
  const [expanded, setExpanded] = useState(initiallyOpen);
  const displayedPages = useStableRecentItems(pages);
  useEffect(() => { if (isCurrent) setExpanded(true); }, [isCurrent, readRequest]);
  return <div className="mm-recent-library">
    <div className="mm-recent-library-row">
      {pages.length > 0 ? <button type="button" className="mm-recent-library-link mm-recent-library-toggle"
        aria-expanded={expanded} aria-controls={listId} aria-current={isCurrent ? 'location' : undefined}
        title={library.name} onClick={() => setExpanded(value => !value)}>
        <span className="mm-recent-expand-mark" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m9 5 7 7-7 7" /></svg></span>
        <span>{library.name}</span>
      </button> : <><span className="mm-recent-expand-placeholder" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m9 5 7 7-7 7" /></svg></span>
        <a className="mm-recent-library-link" href={libraryPath(library.id)} aria-current={isCurrent ? 'location' : undefined} title={library.name}><span>{library.name}</span></a></>}
    </div>
    {pages.length > 0 && <ul id={listId} className="mm-recent-pages" aria-label={library.name + '的最近阅读'} hidden={!expanded}>
      {displayedPages.map(page => <li key={page.id}><a className="mm-recent-page" href={libraryPath(library.id, 'knowledge', page.id)}
        aria-current={currentPageId === page.id ? 'page' : undefined} title={page.title}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8Z"/><path d="M14 3v5h5M8 12h8M8 16h6"/></svg><span>{page.title}</span>
      </a></li>)}
    </ul>}
  </div>;
}
