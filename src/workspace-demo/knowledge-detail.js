import {documentForPath} from './knowledge-graph.js';
import {normalizeSourcePath} from './knowledge-structure.js';

// Resolve only exact paths in the current library; matching basenames can cross sources.
export function fileKnowledgeDetail(model,record){
  const path=normalizeSourcePath(record.name||'');
  const document=record.local&&record.hasText
    ?model.pages.find(page=>page.title===record.name)
    :/^(\.knowforge\/content|content)\//.test(path)?documentForPath(model.pages,path):undefined;
  const source=model.sources.find(item=>normalizeSourcePath(item.path)===path);
  return {document,source,pages:source?source.documentIds.map(id=>model.byId.get(id)).filter(Boolean):[]};
}

export function knowledgePointPages(model,term){
  const point=model.knowledgePoints.find(item=>item.term===term);
  return point?point.documentIds.map(id=>model.byId.get(id)).filter(Boolean):[];
}
