import {useEffect, useMemo, useRef, useState} from 'react';
import {ArrowLeft, BookOpen, FileText, MessageSquare, Plus, Share2, Waypoints, X, ChevronLeft, ChevronRight} from 'lucide-react';
import '../knowledge-reader.css';
import '../knowledge-panels.css';
import '../knowledge-structure.css';
import {buildKnowledgeStructure,normalizeSourcePath} from '../knowledge-structure';
import {KnowledgeSourceDialog} from './KnowledgeSourceDialog';
import {KnowledgeWiki} from './KnowledgeWiki';
import {KnowledgeFiles} from './KnowledgeFiles';
import {KnowledgeGraph} from './KnowledgeGraph';
import {KnowledgeSharing} from './KnowledgeSharing';
import {KnowledgeCreateDialog} from './KnowledgeCreateDialog';
import {documentForPath} from '../knowledge-graph';
import {readableHtml} from '../knowledge-html';
import {KnowledgeFileDetail} from './KnowledgeFileDetail';
import {knowledgePointPages} from '../knowledge-detail';
import '../knowledge-interactions.css';

const contentCache=new Map();


export function KnowledgeReader({library,libraries,initialDocument,onOpenLibrary,onClose,onAddSources,onRemoveShared,onUseInChat}) {
  const [documents,setDocuments]=useState(()=>library.documents||contentCache.get(library.id)||[]);
  const [loading,setLoading]=useState(Boolean(!library.documents&&library.contentUrl&&!contentCache.has(library.id)));
  const [error,setError]=useState('');
  const [retry,setRetry]=useState(0);
  const [selectedId,setSelectedId]=useState('');
  const [drawerOpen,setDrawerOpen]=useState(false);
  const [fileRecord,setFileRecord]=useState(null),[pointTerm,setPointTerm]=useState('');
  const drawer=useRef(null);
  const [linkMessage,setLinkMessage]=useState('');
  const [tab,setTab]=useState('wiki');
  const [focus,setFocus]=useState(null),[fileFocus,setFileFocus]=useState('');
  const sourceDialog=useRef(null);
  const createDialog=useRef(null);
  const article=useRef(null);
  const scroller=useRef(null);
  const canAdd = !library.isShare;
  const canUseInChat = !loading && !error && documents.length > 0;
  useEffect(()=>{
    if(Array.isArray(library.documents)){setDocuments(library.documents);setLoading(false);setError('');return;}
    if(!library.contentUrl){setDocuments([]);setLoading(false);return;}
    if(contentCache.has(library.id)){setDocuments([...contentCache.get(library.id), ...(library.extraDocuments || [])]);setLoading(false);return;}
    const abort=new AbortController();
    setLoading(true);setError('');
    fetch(library.contentUrl,{signal:abort.signal}).then(response=>{
      if(!response.ok)throw new Error('load');
      return response.json();
    }).then(data=>{
      if(!Array.isArray(data.documents))throw new Error('format');
      contentCache.set(library.id,data.documents);
      setDocuments([...data.documents, ...(library.extraDocuments || [])]);setLoading(false);
    }).catch(reason=>{if(reason.name!=='AbortError'){setLoading(false);setError('暂时无法读取知识内容，请重试。');}});
    return()=>abort.abort();
  },[library.id,library.contentUrl,library.documents,library.extraDocuments,retry]);
  useEffect(()=>{
    const requested=initialDocument&&documentForPath(documents,initialDocument);
    setSelectedId(current=>requested?.id||(documents.some(document=>document.id===current)?current:documents[0]?.id||''));
    if(requested)setDrawerOpen(true);
  },[documents,initialDocument]);
  const structure=useMemo(()=>buildKnowledgeStructure(documents,library),[documents,library]);
  const pointPages=useMemo(()=>pointTerm?knowledgePointPages(structure,pointTerm):[],[structure,pointTerm]);
  const readingPages=pointPages.length?pointPages:documents;
  const selected=documents.find(doc=>doc.id===selectedId)||documents[0];
  const readingIndex=readingPages.findIndex(doc=>doc.id===selected?.id);
  const body=useMemo(()=>readableHtml(selected?.html,selected?.title),[selected]);
  useEffect(()=>{if(scroller.current)scroller.current.scrollTop=0;setLinkMessage('');},[selected?.id]);

  useEffect(()=>{if(drawerOpen&&(selected||fileRecord)&&!drawer.current?.open)drawer.current?.showModal();},[drawerOpen,selected,fileRecord]);
  function chooseDocument(doc,location) {setFileRecord(null);setPointTerm('');setSelectedId(doc.id);setFocus(location?.fragmentId||location?.sectionId?{documentId:doc.id,...location,nonce:Date.now()}:null);setDrawerOpen(true);}
  function chooseFile(record){setFileRecord(record);setPointTerm('');setFocus(null);setLinkMessage('');setDrawerOpen(true);}
  function choosePoint(point){const pages=knowledgePointPages(structure,point.term);if(!pages.length)return;setFileRecord(null);setPointTerm(point.term);setSelectedId(pages[0].id);setFocus(null);setLinkMessage('');setDrawerOpen(true);}
  function turnPage(page){if(!page)return;if(pointTerm){setSelectedId(page.id);setFocus(null);}else chooseDocument(page);}
  function closeDrawer(){drawer.current?.close();setDrawerOpen(false);}
  useEffect(()=>{
    article.current?.querySelectorAll('.kb-citation-highlight').forEach(node=>node.classList.remove('kb-citation-highlight'));
    if(!drawerOpen||!focus||focus.documentId!==selected?.id)return;
    const frame=requestAnimationFrame(()=>{
      const target=[...(article.current?.querySelectorAll('[data-fragment-id]')||[])].find(node=>node.getAttribute('data-fragment-id')===focus.fragmentId)||[...(article.current?.querySelectorAll('[id]')||[])].find(node=>node.id===focus.sectionId);
      if(target){const paragraph=target.closest('p,li,blockquote')||target;paragraph.classList.add('kb-citation-highlight');paragraph.scrollIntoView({block:'center',behavior:'instant'});}
    });return()=>cancelAnimationFrame(frame);
  },[drawerOpen,focus,selected?.id,body]);
  function inspectSource(source){sourceDialog.current?.open(source);}
  function locateSource(source){closeDrawer();setFileFocus(source.path);setTab('files');}
  function followReference(event) {
    const link=event.target.closest('a');
    if(!link)return;
    event.preventDefault();
    const href=link.dataset.knowledgeHref||'';
    const attributePath=link.dataset.knowledgePath;
    try {
      const url=new URL(href,location.origin),path=attributePath||url.searchParams.get('path');
      const scope=url.pathname.match(/\/scopes\/([^/]+)\/scope-file/)?.[1],decoded=scope&&decodeURIComponent(scope);
      const target=!scope||decoded===(library.sourceLibraryId||library.libraryId)?library:library.isShare?null:libraries.find(item=>item.libraryId===decoded);
      if(path&&target){
        const normalized=normalizeSourcePath(path);
        if(target.id===library.id){
          const document=documentForPath(documents,normalized);
          if(document){chooseDocument(document);return;}
          const source=structure.sources.find(item=>item.path===normalized);if(source){inspectSource(source);return;}
        }else if(/^(\.knowforge\/content|content)\//.test(normalized)){onOpenLibrary(target.id,normalized);return;}
      }
    }catch{}
    if(href.startsWith('#')){
      let id=href.slice(1);try{id=decodeURIComponent(id);}catch{}
      const target=[...(article.current?.querySelectorAll('[id]')||[])].find(node=>node.id===id);
      if(target){target.scrollIntoView({block:'start',behavior:'instant'});return;}
    }
    setLinkMessage('此链接对应的内容未包含在当前知识库中。');
  }

  async function appendSources(draft) {
    await onAddSources(draft);
    setTab('files');
  }
  const readerTabs=[['files','文件',FileText],['wiki','Wiki',BookOpen],['graph','图谱',Waypoints],['sharing','分享与链接',Share2]];
  function tabKey(event){
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();const index=readerTabs.findIndex(t=>t[0]===tab);
    const next=readerTabs[event.key==='Home'?0:event.key==='End'?3:(index+(event.key==='ArrowRight'?1:3))%4][0];
    setTab(next);requestAnimationFrame(()=>document.getElementById('kb-reader-tab-'+next)?.focus());
  }
  return <main id="mm-main" className="kb-reader" tabIndex={-1}>
    <header className="kb-reader-header">
      <div className="kb-reader-topline">
        <div className="kb-reader-heading">
          <button type="button" className="kb-reader-back" aria-label="返回知识库" title="返回知识库" onClick={onClose}><ArrowLeft size={18}/></button>
          <h1 title={'知识库——'+library.name.replace(/^metask/i,'Metask')}>知识库——{library.name.replace(/^metask/i,'Metask')}</h1>
          <span className={'kb-state '+(library.contents>0?'is-ready':'')}><span className="kb-state-dot" aria-hidden="true"/>{library.status}</span>
        </div>
        <div className="kb-reader-header-actions">
          {onRemoveShared&&<button type="button" className="kb-secondary" onClick={onRemoveShared}>移出共享列表</button>}
          {(onUseInChat||canAdd||onRemoveShared)&&<div className="kb-reader-main-actions">
            {onUseInChat&&<button type="button" className="kb-secondary kb-reader-chat" disabled={!canUseInChat}
              title={!canUseInChat?'当前知识库暂不可用于对话':undefined} onClick={()=>onUseInChat(library.id)}>
              <MessageSquare size={16} aria-hidden="true"/>添加到对话
            </button>}
            {(canAdd||onRemoveShared)&&<button type="button" className="kb-primary" disabled={!canAdd||loading||Boolean(error)}
              title={!canAdd?'需要编辑权限才能添加资料':undefined} onClick={()=>createDialog.current?.open()}>
              <Plus size={16} aria-hidden="true"/>添加资料
            </button>}
          </div>}
        </div>
      </div>
      {library.isShare&&<p className="kb-shared-label">共享知识库 · {documents.length} 篇 Wiki<span className="kb-shared-permission">只读</span></p>}
      {library.description&&<p>{library.description}</p>}
      {library.organizingAgent&&<p>整理智能体：{library.organizingAgent.name}</p>}
    </header>
    <div className="kb-reader-tabs" role="tablist" aria-label="知识库内容" onKeyDown={tabKey}>{readerTabs.map(([id,label,Icon])=><button key={id} type="button" role="tab" id={'kb-reader-tab-'+id} aria-selected={tab===id} aria-controls="kb-reader-panel" tabIndex={tab===id?0:-1} onClick={()=>setTab(id)}><Icon size={17}/>{label}</button>)}</div>
    <div id="kb-reader-panel" className="kb-reader-panel" role="tabpanel" aria-labelledby={'kb-reader-tab-'+tab}>
    {tab==='files'?<KnowledgeFiles library={library} focusPath={fileFocus} onInspect={chooseFile}/>:tab==='graph'?(loading?<p className="kb-panel-empty" role="status">正在读取知识内容…</p>:error?<p className="kb-panel-empty" role="alert">{error}<button className="kb-secondary" onClick={()=>setRetry(v=>v+1)}>重试</button></p>:<KnowledgeGraph library={library} model={structure} selected={selected} onRead={chooseDocument} onReadPoint={choosePoint}/>):tab==='sharing'?(loading?<p className="kb-panel-empty" role="status">正在读取知识内容…</p>:error?<p className="kb-panel-empty" role="alert">{error}<button className="kb-secondary" onClick={()=>setRetry(v=>v+1)}>重试</button></p>:<KnowledgeSharing library={library} documents={documents}/>):loading?<p className="kb-panel-empty" role="status">正在读取知识内容…</p>:error?<p className="kb-panel-empty" role="alert">{error}<button className="kb-secondary" onClick={()=>setRetry(v=>v+1)}>重试</button></p>:<KnowledgeWiki model={structure} activeId={drawerOpen&&!fileRecord?selected?.id:''} onRead={chooseDocument}/>}
    </div>
    <dialog ref={drawer} className="kb-wiki-drawer" aria-labelledby="kb-wiki-drawer-title" onCancel={event=>{event.preventDefault();closeDrawer();}} onClick={event=>{if(event.target===event.currentTarget){const rect=event.currentTarget.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right)closeDrawer();}}}>
      <header className="kb-wiki-drawer-header"><div><p>{fileRecord?<><FileText size={15}/>文件</>:pointTerm?<><Waypoints size={15}/>知识点</>:<><BookOpen size={15}/>Wiki{selected?.category&&<> · {selected.category}</>}</>}</p><h2 id="kb-wiki-drawer-title">{fileRecord?.name||pointTerm||selected?.title||'Wiki 正文'}</h2></div><button type="button" className="kb-wiki-drawer-close" aria-label={fileRecord?'关闭文件详情':pointTerm?'关闭知识点详情':'关闭正文'} onClick={closeDrawer}><X size={20}/></button></header>
      {!fileRecord&&<div className="kb-wiki-drawer-pagination"><span>{pointTerm?pointPages.length+' 篇关联 Wiki · ':''}第 {Math.max(1,readingIndex+1)} / {readingPages.length} 篇</span><div><button aria-label="上一篇 Wiki" disabled={readingIndex<=0} onClick={()=>turnPage(readingPages[readingIndex-1])}><ChevronLeft size={16}/></button><button aria-label="下一篇 Wiki" disabled={readingIndex>=readingPages.length-1} onClick={()=>turnPage(readingPages[readingIndex+1])}><ChevronRight size={16}/></button></div></div>}
      <div className="kb-wiki-drawer-main">
      <section className="kb-reader-content kb-wiki-drawer-content" ref={scroller} aria-label="知识正文">
        {linkMessage&&<p className="kb-reader-link-message" role="status">{linkMessage}</p>}
        {fileRecord?<KnowledgeFileDetail record={fileRecord} model={structure} onRead={chooseDocument} onFollowReference={followReference}/>:<>{pointTerm&&<><select className="kb-point-select" aria-label="知识点关联内容" value={selected?.id||''} onChange={event=>turnPage(readingPages.find(page=>page.id===event.target.value))}>{readingPages.map(page=><option key={page.id} value={page.id}>{page.title}</option>)}</select><h3 className="kb-point-page-title">{selected?.title}</h3></>}<article className="kb-article" ref={article} aria-label={'正文：'+(selected?.title||'')} onClick={followReference} onAuxClick={event=>{if(event.target.closest('a'))event.preventDefault();}} dangerouslySetInnerHTML={{__html:body}}/></>}
      </section>

      </div>
    </dialog>
    <KnowledgeSourceDialog ref={sourceDialog} model={structure} onRead={chooseDocument} onLocate={locateSource} canLocate={!library.isShare}/>
    {canAdd&&<KnowledgeCreateDialog ref={createDialog} library={library} canAdd={canAdd} onCreate={appendSources}/>}
  </main>;
}
