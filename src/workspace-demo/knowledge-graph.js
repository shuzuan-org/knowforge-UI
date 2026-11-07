export function documentForPath(documents,path='') {
  const normalized=path.replace(/^\/?\.knowforge\/content\//,'').replace(/^\/?content\//,'');
  return documents.find(doc=>doc.id===normalized)||(/^(\/?\.knowforge\/content|\/?content)\//.test(path)||!normalized.includes('/')?documents.find(doc=>doc.title===normalized.split('/').pop()?.replace(/\.md$/i,'')):undefined);
}

// Relationships come exclusively from links in the captured Wiki pages.
export function documentEdges(documents,scope) {
  const edges=[],seen=new Set();
  for(const document of documents)for(const match of (document.html||'').matchAll(/<a\b[^>]*>/gi)) {
    try {
      const attributes=Object.fromEntries([...match[0].matchAll(/([\w:-]+)\s*=\s*(["'])([\s\S]*?)\2/g)].map(attribute=>[attribute[1].toLowerCase(),attribute[3].replace(/&amp;/g,'&').replace(/&quot;/g,'"')]));
      const url=new URL(attributes.href||'', 'http://knowledge.local');
      const linkScope=url.pathname.match(/\/scopes\/([^/]+)\/scope-file/)?.[1];
      if(linkScope&&decodeURIComponent(linkScope)!==scope)continue;
      let path=attributes['data-source-path']||attributes['data-cite-path']||url.searchParams.get('path');
      if(!path)continue;try{path=decodeURIComponent(path);}catch{}
      const target=documentForPath(documents,path);
      if(!target||target.id===document.id)continue;
      const key=document.id+'\0'+target.id;
      if(!seen.has(key)){seen.add(key);edges.push({from:document.id,to:target.id});}
    }catch{}
  }
  return edges;
}
