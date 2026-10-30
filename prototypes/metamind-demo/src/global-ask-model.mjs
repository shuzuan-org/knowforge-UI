import {findEvidence,libraryPath,resolveEvidence} from './workbench-model.mjs';
import {contextualQuestion} from './feature-model.mjs';

export function migrateGlobalAsk(state) {
  return {...state,globalChats:state.globalChats||[],globalAskDraft:state.globalAskDraft||'',libraryAskDrafts:state.libraryAskDrafts||{}};
}

// Use a compound key only for retrieval. Citations retain both original IDs.
export function globalKnowledgeIndex(items,readDocuments) {
  return items.filter(l=>l.available!==false).flatMap(l=>readDocuments(l).map(d=>({
    ...d,id:JSON.stringify([l.id,d.id]),documentId:d.id,documentTitle:d.title,
    title:l.name+' · '+d.title,libraryId:l.id,libraryName:l.name,isShared:!!l.isShared,
  })));
}

export function findGlobalEvidence(question,items,readDocuments,previous=null) {
  const index=globalKnowledgeIndex(items,readDocuments),byId=new Map(index.map(d=>[d.id,d]));
  const found=findEvidence(contextualQuestion(question,previous,null),index).map(e=>{
    const d=byId.get(e.docId);
    return {...e,docId:d.documentId,title:d.documentTitle,libraryId:d.libraryId,libraryName:d.libraryName,isShared:d.isShared,text:e.text.slice(0,1200)};
  });
  return [...new Set(found.map(e=>e.libraryId))].flatMap(id=>found.filter(e=>e.libraryId===id));
}

export function globalCitationPath(evidence,chatId,index,continueQuestion=false) {
  const p=new URLSearchParams(libraryPath(evidence.libraryId,'knowledge',evidence.docId).split('?')[1]);
  p.set('globalChat',chatId);p.set('citation',String(index));
  if(continueQuestion)p.set('continue','1');
  return '/library/'+encodeURIComponent(evidence.libraryId)+'?'+p;
}

export function resolveGlobalReference(chats,chatId,index,libraryId,documents) {
  if(!/^\d{1,4}$/.test(String(index??'')))return null;
  const chat=chats.find(c=>c.id===chatId&&c.kind!=='break'),evidence=chat?.evidence?.[Number(index)];
  if(!evidence||evidence.libraryId!==libraryId)return null;
  const doc=documents.find(d=>d.id===evidence.docId);
  return {chat,evidence,doc,...resolveEvidence(evidence,doc)};
}

export function continuationDraft(existing,incoming) {
  return {value:existing?.trim()?existing:incoming,conflict:!!existing?.trim()&&existing!==incoming};
}
