const finite=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0;
export function knowledgeOverview(notebooks){
  let contentBytes=0,sourceCount=0,pageCount=0,pendingCount=0,capacityComplete=true;
  const encoder=new TextEncoder();
  for(const notebook of notebooks){
    const sources=notebook.sources||[],documents=notebook.documents;
    if(Array.isArray(documents)){contentBytes+=documents.reduce((sum,page)=>sum+encoder.encode(page.html||'').length,0);pageCount+=documents.length;}
    else{pageCount+=finite(notebook.contents)?notebook.contents:0;if(finite(notebook.contentBytes))contentBytes+=notebook.contentBytes;else if(notebook.contents>0)capacityComplete=false;}
    sourceCount+=(finite(notebook.files)?notebook.files:sources.filter(source=>source.kind!=='web').length)+sources.filter(source=>source.kind==='web').length;
    pendingCount+=finite(notebook.pending)?notebook.pending:0;
  }
  return {libraryCount:notebooks.length,contentBytes,sourceCount,pageCount,pendingCount,capacityComplete};
}
export function contentSize(bytes){
  if(bytes>=1_000_000_000)return {value:(bytes/1_000_000_000).toFixed(1),unit:'GB'};
  if(bytes>=1_000_000)return {value:(bytes/1_000_000).toFixed(1),unit:'MB'};
  if(bytes>=1000)return {value:Math.max(1,Math.round(bytes/1000)).toLocaleString('zh-CN'),unit:'KB'};
  return {value:String(bytes),unit:'B'};
}
