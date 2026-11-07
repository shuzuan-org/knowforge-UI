import {useId,useMemo,useState} from 'react';
import {BookOpen,Search} from 'lucide-react';
import {wikiOutline} from '../knowledge-outline';
import '../knowledge-outline.css';

export function KnowledgeWiki({model,activeId,onRead}) {
  const [query,setQuery]=useState(''),[topic,setTopic]=useState('all');
  const documents=model.pages,categories=model.categories,needle=query.trim().toLocaleLowerCase();
  const matches=useMemo(()=>documents.filter(page=>{
    const category=page.category||'未分类';
    return (topic==='all'||category===topic)&&(page.title+' '+category).toLocaleLowerCase().includes(needle);
  }),[documents,topic,needle]);
  const topicCount=new Set(matches.map(page=>page.category||'未分类')).size;
  const outline=useMemo(()=>wikiOutline(matches),[matches]);
  return <section className="kb-wiki-index kb-section-scroll" aria-label="Wiki 文档">
    {documents.length>0?<>
      <dl className="kb-structure-stats" aria-label="Wiki 内容统计">{[['Wiki 页面',documents.length,'篇'],['主题分类',categories.length,'个'],['知识点',model.knowledgePoints.length,'个'],['引用来源',model.sources.length,'个'],['引用片段',model.fragments,'个']].map(([label,count,unit])=><div key={label}><dt>{label}</dt><dd>{count}<span>{unit}</span></dd></div>)}</dl>
      <div className="kb-wiki-catalog">
        <div className="kb-wiki-filters"><label className="kb-panel-search"><Search size={17}/><input aria-label="搜索 Wiki 文档" value={query} onChange={event=>setQuery(event.target.value)} placeholder="搜索文档名称或主题"/></label><select aria-label="Wiki 主题" value={topic} onChange={event=>setTopic(event.target.value)}><option value="all">全部主题</option>{categories.map(category=><option key={category}>{category}</option>)}</select></div>
        <ul className="kb-wiki-outline" aria-label="Wiki 文档目录">{outline.map(({page,children})=><li key={page.id} className="kb-wiki-outline-section">
          <WikiDocument model={model} page={page} active={activeId===page.id} onRead={onRead}/>
          {children.length>0&&<ul className="kb-wiki-outline-children" aria-label={page.title+'下的文档'}>{children.map(child=><li key={child.id}><WikiDocument model={model} page={child} active={activeId===child.id} onRead={onRead} child/></li>)}</ul>}
        </li>)}</ul>
        {!matches.length&&<div className="kb-panel-empty"><Search size={26}/><h3>没有找到匹配文档</h3><p>试试其他文档名称或主题。</p></div>}
        <p className="kb-wiki-count">{needle||topic!=='all'?'找到 '+matches.length+' 篇文档':'共 '+documents.length+' 篇文档'} · {topicCount} 个主题</p>
      </div>
    </>:<div className="kb-panel-empty"><BookOpen size={29}/><h3>暂无 Wiki 内容</h3><p>添加可读资料后，在这里查看文档。</p></div>}
  </section>;
}

function WikiDocument({model,page,active,onRead,child=false}) {
  const data=useMemo(()=>model.scope([page.id]),[model,page]);
  const detailsId=useId();
  return <button type="button" className={'kb-wiki-outline-row'+(child?' is-child':'')+(active?' is-reading':'')} title={page.title} aria-label={'阅读文档 '+page.title} aria-describedby={detailsId} aria-haspopup="dialog" aria-current={active?'page':undefined} onClick={()=>onRead(page)}>
    <span className="kb-wiki-outline-name"><span>{page.title}</span></span>
    <span id={detailsId} className="kb-wiki-outline-meta"><span>{data.knowledgePoints.length} 个知识点</span><span className="kb-wiki-outline-sources">{data.sources.length} 个引用来源</span></span>
  </button>;
}
