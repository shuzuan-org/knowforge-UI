import {useEffect,useMemo,useRef,useState} from 'react';
import {ChevronDown,ChevronLeft,ChevronRight,FileText,Globe,Search} from 'lucide-react';
import {fileOutline} from '../knowledge-file-outline';
import {knowledgeMaterialTypeOf} from '../knowledge-material-types';
import '../knowledge-outline.css';
import '../knowledge-files-outline.css';

const cache=new Map();
const states={ready:'已整理',waiting:'待整理',processing:'整理中',attention:'需处理',skipped:'不参与整理'};
export function KnowledgeFiles({library,onInspect,focusPath}) {
  const [records,setRecords]=useState(()=>cache.get(library.filesUrl)||[]),[loading,setLoading]=useState(Boolean(library.filesUrl&&!cache.has(library.filesUrl)));
  const [error,setError]=useState(''),[retry,setRetry]=useState(0),[query,setQuery]=useState(''),[state,setState]=useState('all'),[type,setType]=useState('all'),[page,setPage]=useState(0);
  const section=useRef(null);
  useEffect(()=>{if(section.current)section.current.scrollTop=0;},[page]);
  useEffect(()=>{
    if(!library.filesUrl){setRecords([]);return;}
    if(cache.has(library.filesUrl)){setRecords(cache.get(library.filesUrl));return;}
    const abort=new AbortController();setLoading(true);setError('');
    fetch(library.filesUrl,{signal:abort.signal}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{
      if(!Array.isArray(data.records))throw Error();cache.set(library.filesUrl,data.records);setRecords(data.records);setLoading(false);
    }).catch(e=>{if(e.name!=='AbortError'){setError('文件记录读取失败，请重试。');setLoading(false);}});
    return()=>abort.abort();
  },[library.filesUrl,retry]);
  useEffect(()=>{if(focusPath){setQuery(focusPath);setState('all');setType('all');setPage(0);}},[focusPath]);
  const sources=useMemo(()=>[...(library.sources||[]).map(s=>({...s,type:s.kind==='web'?'网页':s.type?.includes('/')?'文件':s.type||'文件',state:s.state || (s.hasText?'ready':'waiting'),local:true})),...records],[library.sources,records]);
  const totalSources=Math.max(Number(library.files)||0,sources.length);
  const matches=sources.filter(s=>(state==='all'||s.state===state)&&(type==='all'||s.type===type)&&s.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const types=[...new Set(sources.map(s=>s.type))];
  const pages=Math.max(1,Math.ceil(matches.length/50)),current=Math.min(page,pages-1);
  const outline=fileOutline(matches.slice(current*50,(current+1)*50));
  function filter(setter,value){setter(value);setPage(0);}
  return <section ref={section} className="kb-files kb-section-scroll" aria-label="知识库文件">
    <dl className="kb-structure-stats kb-file-stats" aria-label="文件统计">
      <div><dt>文件记录</dt><dd>{loading||error?'—':sources.length.toLocaleString()}<span>条</span></dd></div>
      <div><dt>{library.files>sources.length?'原库资料':'资料总量'}</dt><dd>{totalSources.toLocaleString()}<span>份</span></dd></div>
    </dl>
    <div className="kb-file-filters"><label className="kb-panel-search"><Search size={17}/><input aria-label="搜索文件" placeholder="搜索文件名称" value={query} onChange={e=>filter(setQuery,e.target.value)}/></label><select aria-label="文件类型" value={type} onChange={e=>filter(setType,e.target.value)}><option value="all">全部类型</option>{types.map(t=><option key={t}>{t}</option>)}</select><select aria-label="文件状态" value={state} onChange={e=>filter(setState,e.target.value)}><option value="all">全部状态</option>{Object.entries(states).filter(([key])=>sources.some(s=>s.state===key)).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></div>
    {loading?<p className="kb-panel-empty" role="status">正在读取文件记录…</p>:error?<p role="alert">{error}<button className="kb-secondary" onClick={()=>setRetry(v=>v+1)}>重试</button></p>:<>
      <ul className="kb-wiki-outline kb-files-outline" aria-label="文件目录">{outline.map(node=><FileOutlineItem key={node.key} node={node} onInspect={onInspect}/>)}</ul>
      {!matches.length&&<div className="kb-panel-empty"><FileText size={28}/><h3>{focusPath&&query===focusPath&&type==='all'&&state==='all'?'此来源未包含在当前文件索引中':sources.length?'没有找到匹配文件':'还没有文件'}</h3><p>{sources.length?'试试其他名称、类型或状态。':library.isShare?'此分享包含 Wiki 页面，不包含原始附件。':'添加文件或网页资料，开始整理知识。'}</p></div>}
      {matches.length>0&&<div className="kb-pagination"><span>共 {matches.length.toLocaleString()} 条</span><div><button className="kb-secondary" aria-label="上一页文件" disabled={current===0} onClick={()=>setPage(current-1)}><ChevronLeft size={16}/></button><span>{current+1} / {pages}</span><button className="kb-secondary" aria-label="下一页文件" disabled={current>=pages-1} onClick={()=>setPage(current+1)}><ChevronRight size={16}/></button></div></div>}
    </>}
  </section>;
}

function FileOutlineItem({node,onInspect}) {
  if(node.kind==='folder')return <li className="kb-file-outline-branch"><details open>
    <summary className="kb-file-outline-folder" title={node.path}><ChevronDown size={14} aria-hidden="true"/><span>{node.name}</span></summary>
    <ul className="kb-wiki-outline-children" aria-label={node.path+'内的文件'}>{node.children.map(child=><FileOutlineItem key={child.key} node={child} onInspect={onInspect}/>)}</ul>
  </details></li>;
  const {source}=node;
  const fileType = source.type || '文件';
  const status = states[source.state] || source.state;
  const TypeIcon = source.kind === 'web' || fileType === '网页' ? Globe : knowledgeMaterialTypeOf(source).icon;
  return <li><button type="button" className="kb-wiki-outline-row kb-file-outline-row" title={source.name}
    aria-label={'查看文件 '+source.name} aria-description={`类型：${fileType}，状态：${status}`}
    aria-haspopup="dialog" onClick={()=>onInspect(source)}>
    <span className="kb-wiki-outline-name">
      <span className="kb-file-type-icon" title={fileType}><TypeIcon size={16} strokeWidth={1.6} aria-hidden="true"/></span>
      <span className="kb-file-outline-name">{node.name}</span>
    </span>
    <span className="kb-wiki-outline-meta"><span className={'kb-file-status '+(source.state==='ready'?'is-ready':'')}>{status}</span></span>
  </button></li>;
}
