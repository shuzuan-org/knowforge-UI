import snapshots from './snapshots.json';
import documentRoutes from './documents.json';
import { fingerprintDocument } from './feature-model.mjs';
import captured from './captured-library-docs.json';
const FIRST_LIBRARY = 'entity_scope:e3dafa41529c44c6b3c75ee7c71e4e51';
const capturedCache = new Map();

let cached;
export function exampleDocuments(libraryId = FIRST_LIBRARY) {
  if (libraryId !== FIRST_LIBRARY) {
    if (!capturedCache.has(libraryId)) capturedCache.set(libraryId, captured.filter(d => d.libraryId === libraryId).map(d => parseArticle(d)));
    return capturedCache.get(libraryId);
  }
  if (cached) return cached;
  cached = Object.entries(documentRoutes).map(([path, key]) => {
    const dom = new DOMParser().parseFromString(snapshots[key].body, 'text/html');
    const article = dom.querySelector('#docBody');
    if (!article) return null;
    article.querySelectorAll('script,iframe,object,embed,form').forEach(n => n.remove());
    article.querySelectorAll('*').forEach(n => [...n.attributes].forEach(a => {
      if (/^on/i.test(a.name) || (/^(href|src)$/.test(a.name) && /^javascript:/i.test(a.value))) n.removeAttribute(a.name);
    }));
    const paragraphs = [];
    article.querySelectorAll('p,tbody tr').forEach(node => {
      const text = node.tagName === 'TR' ? [...node.querySelectorAll('td')].map(td => td.textContent.trim()).join(' · ') : node.textContent.trim();
      if (text.length <= 8) return;
      node.setAttribute('data-mm-paragraph', String(paragraphs.length));
      paragraphs.push(text);
    });
    return { id: path, title: article.querySelector('h1')?.textContent || path.split('/').pop().replace(/\.md$/, ''), category: path.split('/')[0], html: article.innerHTML, paragraphs, sourceKind: 'knowledge', sourcePaths: articleSources(article) };
  }).filter(Boolean);
  return cached;
}
export function localDocuments(sources) {
  const result = sources.filter(s => !s.trashedAt && s.state === 'ready' && s.content?.trim()).map(s => ({
    id: 'source:' + s.id, title: s.name.split('/').pop().replace(/\.[a-z0-9]{1,5}$/i, ''), category: '我的资料', sourceId: s.id,
    paragraphs: s.content.split(/\n\s*\n/).map(t => t.trim()).filter(Boolean),
    content: s.content, originalName:s.name.split('/').pop(), sourceKind: s.providedText ? 'supplement' : 'original',
  }));
  return result.map(d=>result.filter(x=>x.title===d.title).length>1?{...d,title:d.originalName}:d);
}

function parseArticle(doc) {
  const dom = new DOMParser().parseFromString(doc.html, 'text/html');
  dom.querySelectorAll('script,iframe,object,embed,form').forEach(n => n.remove());
  dom.querySelectorAll('*').forEach(n => [...n.attributes].forEach(a => { if (/^on/i.test(a.name)) n.removeAttribute(a.name); }));
  const paragraphs = [];
  dom.querySelectorAll('p,tbody tr').forEach(n => {
    const text = n.tagName === 'TR' ? [...n.querySelectorAll('td')].map(t => t.textContent.trim()).join(' · ') : n.textContent.trim();
    if (text.length <= 8) return;
    n.setAttribute('data-mm-paragraph', String(paragraphs.length)); paragraphs.push(text);
  });
  return { ...doc, html: dom.body.innerHTML, paragraphs, sourceKind: 'knowledge', sourcePaths: articleSources(dom.body) };
}
export function libraryDocuments(library, sources = []) {
  if (!library || library.available === false) return [];
  const raw = [...localDocuments(sources.filter(s => s.libraryId === library.id)), ...(library.contentCleared ? [] : exampleDocuments(library.id)), ...(library.importedDocuments || [])];
  // Generated pages are invalidated as soon as their original inputs change or enter the recycle bin.
  const live = new Map(raw.map(d => [d.id,fingerprintDocument(d)]));
  const generated = (library.generation?.pages || []).filter(d => d.citations?.every(c => live.has(c.docId) && live.get(c.docId) === library.generation?.versions?.[c.docId]));
  return [...generated, ...raw];
}

function articleSources(article) {
  return [...new Set([...article.querySelectorAll('a')].map(n=>{if(n.dataset.sourcePath)return n.dataset.sourcePath;try{return new URL(n.getAttribute('href'),location.origin).searchParams.get('path')||'';}catch{return '';}}).filter(Boolean))];
}
