import {useMemo} from 'react';
import {ArrowRight,FileText} from 'lucide-react';
import {fileKnowledgeDetail} from '../knowledge-detail';
import {formatSourceSize} from '../knowledge-import';
import {readableHtml} from '../knowledge-html';

const states={ready:'已整理',waiting:'待整理',processing:'整理中',attention:'需处理',skipped:'不参与整理'};
export function KnowledgeFileDetail({record,model,onRead,onFollowReference}){
  const detail=useMemo(()=>fileKnowledgeDetail(model,record),[model,record]);
  const html=useMemo(()=>readableHtml(detail.document?.html,detail.document?.title),[detail.document]);
  return <>
    <dl className="kb-file-detail-facts"><div><dt>类型</dt><dd>{record.type||'文件'}</dd></div><div><dt>状态</dt><dd>{states[record.state]||record.state||'待整理'}</dd></div>{Number.isFinite(record.size)&&<div><dt>大小</dt><dd>{formatSourceSize(record.size)}</dd></div>}{record.originalStatus&&<div><dt>整理说明</dt><dd>{record.originalStatus}</dd></div>}{record.note&&<div><dt>说明</dt><dd>{record.note}</dd></div>}</dl>
    {detail.document?<><h3 className="kb-detail-subtitle">文件内容</h3><article className="kb-article" aria-label={'文件正文：'+record.name} onClick={onFollowReference} onAuxClick={event=>{if(event.target.closest('a'))event.preventDefault();}} dangerouslySetInnerHTML={{__html:html}}/></>:<p className="kb-file-content-note">{record.local?'这份资料尚未提供可读正文。':'当前文件记录未包含原始附件正文。'}</p>}
    {detail.pages.length>0&&<section className="kb-file-related" aria-label="引用此文件的内容"><h3 className="kb-detail-subtitle">关联 Wiki <span>{detail.pages.length}</span></h3>{detail.pages.map(page=>{const location=detail.source.locations.find(item=>item.documentId===page.id);return <button key={page.id} onClick={()=>onRead(page,location)}><FileText size={16}/><span>{page.title}</span><ArrowRight size={15}/></button>;})}</section>}
  </>;
}
