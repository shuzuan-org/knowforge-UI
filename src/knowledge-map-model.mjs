import { documentRelations } from './feature-model.mjs';
import { libraryPath } from './workbench-model.mjs';

// All relationships are computed from the caller's currently accessible library.
export function relatedPages(docs, currentId) {
  const current = docs.find(d => d.id === currentId);
  if (!current) return [];
  const terms = documentRelations(docs).filter(g => g.documents.some(d => d.id === currentId));
  const generic = new Set(['未分类', '我的资料', '本地资料', '收到的分享', '导入备份', '整理提要', '知识页面', '资料']);
  const paths = new Set(current.sourcePaths || []);
  const seen = new Set([currentId]);
  return docs.filter(d => { if (seen.has(d.id)) return false; seen.add(d.id); return true; }).map(doc => {
    const sharedTerms = terms.filter(g => g.documents.some(d => d.id === doc.id)).sort((a,b) =>
      Number(current.title.includes(b.term)) - Number(current.title.includes(a.term)) || a.documents.length - b.documents.length);
    const keywords = sharedTerms.map(g => g.term);
    const sources = [...new Set(doc.sourcePaths || [])].filter(p => paths.has(p));
    const sameTopic = !!current.category && !generic.has(current.category) && current.category === doc.category;
    const reasons = [
      ...(sameTopic ? ['相同主题 · ' + current.category] : []),
      ...(keywords.length ? ['共同知识点 · ' + keywords.slice(0, 3).join('、')] : []),
      ...(sources.length ? ['共同引用 · ' + sources[0].split('/').at(-1)] : []),
    ];
    const keywordScore = sharedTerms.reduce((sum,g)=>sum+1+Math.log(docs.length/g.documents.length),0);
    return { doc, reasons, keywords, sourcePaths: sources, score: Math.min(sources.length,3) + (sameTopic ? 8 : 0) + keywordScore };
  }).filter(item => item.reasons.length).sort((a, b) => b.score - a.score);
}

export function knowledgeMapDestination(route, libraries) {
  const requested = route.searchParams.get('library');
  const library = requested ? libraries.find(l => l.id === requested) : libraries[0];
  if (!library) return requested ? libraryPath(requested) : '/workspace';
  return libraryPath(library.id, 'map', route.searchParams.get('doc') || '');
}

export function libraryContentTab(route, isShared = false) {
  const tab = route.searchParams.get('tab');
  if (tab === 'catalog') return 'knowledge';
  if (tab === 'map') return 'map';
  if (tab === 'sources') return isShared ? 'knowledge' : 'sources';
  if (tab === 'usage') return isShared ? 'knowledge' : 'usage';
  return route.searchParams.get('view') === 'map' ? 'map' : 'knowledge';
}
