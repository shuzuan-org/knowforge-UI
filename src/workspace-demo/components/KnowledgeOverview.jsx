import {useMemo} from 'react';
import {Database,Files,BookOpen} from 'lucide-react';
import {contentSize,knowledgeOverview} from '../knowledge-overview';
export function KnowledgeOverview({notebooks}){
  const data=useMemo(()=>knowledgeOverview(notebooks),[notebooks]),size=contentSize(data.contentBytes),measured=data.capacityComplete||data.contentBytes>0||data.pageCount===0;
  return <dl className="kb-overview" aria-label="知识库数据概览">
    <div title="统计已整理 Wiki 正文和图表的大小，不含原始附件。"><dt><Database size={15}/><span>内容容量</span></dt><dd>{measured?<>{!data.capacityComplete&&'≥ '}{size.value}<span>{size.unit}</span></>:'—'}</dd><p>Wiki 正文及图表</p></div>
    <div><dt><Files size={15}/><span>资料总量</span></dt><dd>{data.sourceCount.toLocaleString('zh-CN')}<span>份</span></dd><p>{data.libraryCount} 个知识库</p></div>
    <div><dt><BookOpen size={15}/><span>已整理内容</span></dt><dd>{data.pageCount.toLocaleString('zh-CN')}<span>篇</span></dd><p>{data.pendingCount>0?data.pendingCount.toLocaleString('zh-CN')+' 份资料待整理':data.pageCount>0?'可用于阅读与对话':'暂无已整理内容'}</p></div>
  </dl>;
}
