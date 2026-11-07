import {documentEdges} from './knowledge-graph.js';

export function normalizeSourcePath(value='') {
  try{value=decodeURIComponent(value);}catch{}
  return value.replace(/\\/g,'/').replace(/^\/+/, '');
}
export function extractDocumentStructure(document) {
  if(Array.isArray(document.sourceReferences)&&Array.isArray(document.headings))return {sources:document.sourceReferences,headings:document.headings};
  if(typeof DOMParser==='undefined')return {sources:[],headings:[]};
  const root=new DOMParser().parseFromString(document.html||'','text/html');
  const headings=Array.from(root.querySelectorAll('h2,h3,h4')).map(el=>({id:el.id,title:el.textContent.trim(),level:Number(el.tagName[1])}));
  const refs=new Map();let section={id:'',title:''};
  for(const element of root.querySelectorAll('h2,h3,h4,a')) {
    if(/^H[234]$/.test(element.tagName)){section={id:element.id,title:element.textContent.trim()};continue;}
    let path=element.getAttribute('data-source-path')||element.getAttribute('data-cite-path')||'';
    if(!path)try{path=new URL(element.getAttribute('href')||'', 'http://knowledge.local').searchParams.get('path')||'';}catch{}
    path=normalizeSourcePath(path);if(!path||/^(\.knowforge\/content|content)\//.test(path))continue;
    if(!refs.has(path))refs.set(path,{path,title:element.getAttribute('data-cite-name')||path.split('/').pop(),fragmentIds:[],locations:[]});
    const item=refs.get(path),fragmentId=element.getAttribute('data-fragment-id');
    if(fragmentId&&!item.fragmentIds.includes(fragmentId)){item.fragmentIds.push(fragmentId);item.locations.push({fragmentId,sectionId:section.id,sectionTitle:section.title});}
  }
  return {sources:[...refs.values()],headings};
}

export function buildKnowledgeStructure(documents,library={}) {
  const pages=documents.map(document=>({...document,structure:extractDocumentStructure(document)}));
  const byId=new Map(pages.map(page=>[page.id,page])),points=new Map(),sources=new Map();
  const categories=[...new Set(pages.map(page=>page.category||'未分类'))];
  const edges=documentEdges(documents,library.sourceLibraryId||library.libraryId);
  for(const page of pages) {
    for(const term of new Set((page.knowledgePoints||[]).filter(v=>typeof v==='string'&&v.trim()))){if(!points.has(term))points.set(term,{term,documentIds:[]});points.get(term).documentIds.push(page.id);}
    let references=page.structure.sources;
    const ownSource=(library.sources||[]).find(source=>source.hasText&&source.name===page.title);
    if(ownSource&&!references.some(source=>source.path===ownSource.name))references=[...references,{path:ownSource.name,title:ownSource.name,fragmentIds:[],locations:[]}];
    for(const reference of references) {
      const path=normalizeSourcePath(reference.path);if(!path)continue;
      if(!sources.has(path))sources.set(path,{path,title:reference.title||path.split('/').pop(),documentIds:[],fragmentIds:[],locations:[]});
      const item=sources.get(path);if(!item.documentIds.includes(page.id))item.documentIds.push(page.id);
      for(const id of reference.fragmentIds||[])if(!item.fragmentIds.includes(id))item.fragmentIds.push(id);
      for(const location of reference.locations||[])if(!item.locations.some(l=>l.documentId===page.id&&l.fragmentId===location.fragmentId))item.locations.push({...location,documentId:page.id});
    }
  }
  const knowledgePoints=[...points.values()].sort((a,b)=>b.documentIds.length-a.documentIds.length||a.term.localeCompare(b.term,'zh-CN'));
  const sourceList=[...sources.values()].sort((a,b)=>b.documentIds.length-a.documentIds.length||a.path.localeCompare(b.path,'zh-CN'));
  function scope(ids) {
    const selected=ids?new Set(ids.filter(id=>byId.has(id))):new Set(byId.keys());
    const scopedPages=pages.filter(page=>selected.has(page.id));
    const scopedPoints=knowledgePoints.map(point=>({...point,documentIds:point.documentIds.filter(id=>selected.has(id))})).filter(point=>point.documentIds.length);
    const scopedSources=sourceList.map(source=>{const locations=source.locations.filter(l=>selected.has(l.documentId));const documentIds=source.documentIds.filter(id=>selected.has(id));const fragmentIds=[...new Set(scopedPages.flatMap(page=>page.structure.sources.filter(s=>normalizeSourcePath(s.path)===source.path).flatMap(s=>s.fragmentIds||[])))];return {...source,documentIds,locations,fragmentIds};}).filter(source=>source.documentIds.length);
    return {pages:scopedPages,knowledgePoints:scopedPoints,sources:scopedSources,fragments:new Set(scopedSources.flatMap(s=>s.fragmentIds)).size};
  }
  function related(id) {
    const page=byId.get(id);if(!page)return [];
    const pagePoints=new Set(page.knowledgePoints||[]),pageSources=new Set(sourceList.filter(source=>source.documentIds.includes(id)).map(source=>source.path));
    return pages.filter(other=>other.id!==id).map(other=>{
      const sharedPoints=[...new Set(other.knowledgePoints||[])].filter(term=>pagePoints.has(term));
      const sharedSources=sourceList.filter(source=>source.documentIds.includes(other.id)&&pageSources.has(source.path));
      const linked=edges.some(edge=>edge.from===id&&edge.to===other.id||edge.from===other.id&&edge.to===id);
      const sameTopic=Boolean(page.category)&&page.category===other.category;
      return {page:other,sharedPoints,sharedSources,linked,sameTopic,score:sharedSources.length*4+sharedPoints.length+Number(linked)*5+Number(sameTopic)*2};
    }).filter(item=>item.score>0).sort((a,b)=>b.score-a.score||a.page.title.localeCompare(b.page.title,'zh-CN'));
  }
  return {pages,byId,categories,knowledgePoints,sources:sourceList,edges,fragments:new Set(sourceList.flatMap(s=>s.fragmentIds)).size,scope,related};
}
