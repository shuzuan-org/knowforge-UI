import {ActionHint} from './ActionHint.jsx';
import { ActionLink, ActionButton } from './ActionControls.jsx';
import { KnowledgeUse } from './KnowledgeUse.jsx';
import { AgentAccessDialog } from './AgentAccessDialog.jsx';
import { FeatureHint } from './FeatureHint.jsx';
import React,{useLayoutEffect,useRef,useState} from 'react';
import {GlobalAsk} from './GlobalAsk.jsx';
import {Button,Icon,Empty,Status} from './workbench-components.jsx';
import {libraryDocuments} from './workbench-docs.js';
import {getCounts,libraryPath} from './workbench-model.mjs';
import {ShareContentDialog,ReceiveKnowledgeDialog,ShareRecordsDialog,SharedOriginDialog} from './KnowledgeSharing.jsx';

const readView=()=>{try{return JSON.parse(localStorage.getItem('metamind-library-view'))==='grid'?'grid':'list';}catch{return 'list';}};
export function UnifiedKnowledge({items,sources,recent,onCreate,route,navigate,state,setState,notify}) {
  const [search,setSearch]=useState('');const [status,setStatus]=useState('all');const [view,setView]=useState(readView);
  const askView=route.searchParams.has('ask')||route.searchParams.has('chat');
  const hub=useRef(null),listPane=useRef(null),listControls=useRef(null),ownershipTabs=useRef(null),listScroll=useRef(0),lastChat=useRef('');
  useLayoutEffect(()=>{
    const measure=()=>{if(hub.current)hub.current.style.setProperty('--mm-hub-height',Math.max(160,(window.visualViewport?.height||window.innerHeight)-hub.current.getBoundingClientRect().top-16)+'px');};
    measure();window.addEventListener('resize',measure);window.visualViewport?.addEventListener('resize',measure);
    return()=>{window.removeEventListener('resize',measure);window.visualViewport?.removeEventListener('resize',measure);};
  },[]);
  useLayoutEffect(()=>{
    const controls=listControls.current,pane=listPane.current;if(!controls||!pane)return;
    const measure=()=>{const height=controls.getBoundingClientRect().height;if(height>0)pane.style.setProperty('--mm-list-controls-height',height+'px');};
    measure();const observer=new ResizeObserver(measure);observer.observe(controls);
    return()=>observer.disconnect();
  },[]);
  useLayoutEffect(()=>{if(!askView&&listPane.current)listPane.current.scrollTop=listScroll.current;},[askView]);
  function switchMode(next){
    document.getElementById('mm-mode-'+(next?'ask':'list'))?.focus({preventScroll:true});
    if(next===askView){
      if(!next&&['mine','shared'].includes(route.searchParams.get('filter'))){
        const p=new URLSearchParams(route.searchParams);p.delete('filter');
        navigate('/workspace'+(p.size?'?'+p:''),false,false);
      }
      return;
    }
    const p=new URLSearchParams(route.searchParams);
    if(next){p.set('ask','1');if(lastChat.current)p.set('chat',lastChat.current);}
    else {lastChat.current=p.get('chat')||'';p.delete('ask');p.delete('chat');}
    navigate('/workspace'+(p.size?'?'+p:''),false,false);
  }
  const [sharing,setSharing]=useState(null);const [origin,setOrigin]=useState(null);
  const [accountMcpOpen,setAccountMcpOpen]=useState(false);
  const accountMcpTrigger=useRef(null);
  function closeAccountMcp(){setAccountMcpOpen(false);requestAnimationFrame(()=>accountMcpTrigger.current?.focus({preventScroll:true}));}
  const filter=['mine','shared'].includes(route.searchParams.get('filter'))?route.searchParams.get('filter'):'all';
  const tabs=[['mine','我创建的',items.filter(l=>!l.isShared).length],['shared','与我共享',items.filter(l=>l.isShared).length]];
  const [ownershipIndicator,setOwnershipIndicator]=useState(null);
  const previousFilter=useRef(filter);
  useLayoutEffect(()=>{
    const bar=ownershipTabs.current;if(!bar)return;
    if(filter==='all'||askView){setOwnershipIndicator(null);return;}
    let live=true;
    const measure=()=>{
      const label=bar.querySelector('button[aria-pressed="true"] .mm-ownership-label');
      if(!live||!label||!label.getBoundingClientRect().width)return;
      const bounds=bar.getBoundingClientRect(),selected=label.getBoundingClientRect();
      const next={left:selected.left-bounds.left+bar.scrollLeft,width:selected.width};
      setOwnershipIndicator(old=>old&&Math.abs(old.left-next.left)<.1&&Math.abs(old.width-next.width)<.1?old:next);
    };
    measure();const observer=new ResizeObserver(measure);observer.observe(bar);
    bar.querySelectorAll('.mm-ownership-label').forEach(label=>observer.observe(label));
    document.fonts.ready.then(measure);
    return()=>{live=false;observer.disconnect();};
  },[filter,askView]);
  useLayoutEffect(()=>{
    const old=previousFilter.current;previousFilter.current=filter;
    if(old===filter||askView||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const content=listPane.current?.querySelector('.mm-unified-table tbody,.mm-library-grid,.mm-empty');
    const direction=tabs.findIndex(t=>t[0]===filter)>tabs.findIndex(t=>t[0]===old)?1:-1;
    const animation=content?.animate([{opacity:.4,transform:'translateX('+direction*8+'px)'},{opacity:1,transform:'translateX(0)'}],{duration:180,easing:'cubic-bezier(.2,.7,.2,1)'});
    return()=>animation?.cancel();
  },[filter,askView]);
  const recentKeys=recent.map(id=>items.find(l=>l.receipt?.libraryIds.includes(id))?.id||id);
  const rank=id=>{const n=recentKeys.indexOf(id);return n<0?999:n;};
  const records=items.map(l=>{const counts=getCounts(l,sources),documents=libraryDocuments(l,sources);return {...l,counts,documents,readable:documents.length,status:l.available===false?'unavailable':documents.length||counts.ready?'ready':counts.processing?'processing':counts.attention?'attention':'waiting'};});
  const needle=search.trim().toLowerCase();
  const shown=records.filter(l=>filter==='all'||(filter==='shared'?l.isShared:!l.isShared)).filter(l=>!needle||(l.name+' '+l.description+' '+(l.sourceNames||[]).join(' ')+' '+(l.sharedBy||'')).toLowerCase().includes(needle)).filter(l=>status==='all'||(status==='ready'?l.status==='ready':status==='attention'?l.counts.attention+l.counts.waiting+l.counts.processing>0:l.available===false)).sort((a,b)=>rank(a.id)-rank(b.id));
  function tab(next){const p=new URLSearchParams();p.set('filter',next);navigate('/workspace?'+p,false,false);}
  function openTool(key){const p=new URLSearchParams(route.searchParams);p.set(key,'1');navigate('/workspace?'+p,false,false);}
  function closeTool(){const p=new URLSearchParams(route.searchParams);for(const key of ['receive','demoShare','shares','package','connections','library'])p.delete(key);navigate('/workspace'+(p.size?'?'+p:''),true,false);}
  function changeView(value){setView(value);try{localStorage.setItem('metamind-library-view',JSON.stringify(value));}catch{}}
  function entryState(l){return l.available===false?<span className="mm-knowledge-unavailable">{l.revoked?'分享已撤销':'已取消接收'}</span>:<Status state={l.status}>{l.status==='waiting'?(l.isShared?'暂无可读内容':'待添加资料'):undefined}</Status>;}
  function note(l){return l.isShared?'仅包含分享给你的内容':l.counts.attention?l.counts.attention+' 份资料需处理':l.counts.waiting?l.counts.waiting+' 份资料待整理':l.counts.processing?l.counts.processing+' 份资料整理中':'';}
  function openRow(event,library){
    if(library.available===false||event.defaultPrevented||event.button!==0)return;
    if(event.target.closest?.('a,button,input,select,textarea,label,summary,[role="button"],[role="link"],[contenteditable]'))return;
    const selection=window.getSelection();
    if(selection?.type==='Range'&&event.currentTarget.contains(selection.anchorNode))return;
    if(event.metaKey||event.ctrlKey||event.shiftKey){window.open(libraryPath(library.id),'_blank','noopener');return;}
    navigate(libraryPath(library.id));
  }
  const openAction=l=>l.available===false?<Button variant="plain" onClick={()=>setOrigin(l)}>查看状态</Button>:<ActionLink className="mm-button mm-button-plain" href={libraryPath(l.id)} aria-label={'打开 '+l.name}>打开 →</ActionLink>;
  return <div ref={hub} className={"mm-workspace-hub"+(askView?" is-ask":"")} >
    <div className="mm-page-heading mm-my-knowledge-heading"><div><h1><FeatureHint text="自己的资料和别人分享的内容，都在这里阅读和提问。">知识库</FeatureHint></h1></div><div className="mm-heading-actions"><Button onClick={onCreate}>新建知识库</Button><Button onClick={()=>openTool('receive')}>接收分享</Button><ActionHint text="支持 MCP 和 Skill。这个链接等同你账号的访问权，只给自己的 Agent 用，不要转发；分享知识库给别人请用知识库页的「复制分享链接」。"><Button ref={accountMcpTrigger} className="mm-account-mcp" aria-haspopup="dialog" onClick={()=>setAccountMcpOpen(true)}>复制给 Agent</Button></ActionHint><ActionLink className="mm-button mm-button-primary" href="/upload"><Icon name="upload"/>添加资料</ActionLink></div></div>
    <div className="mm-workspace-switchbar" role="group" aria-label="知识库视图与筛选">
    <div className="mm-workspace-mode-tabs" role="tablist" aria-label="知识库视图">{[['list','知识列表',false],['ask','知识问答',true]].map(([id,label,value],index)=><ActionButton key={id} id={'mm-mode-'+id} role="tab" aria-selected={askView===value} aria-controls={value?'mm-workspace-ask':'mm-workspace-list'} tabIndex={askView===value?0:-1} onClick={()=>switchMode(value)} onKeyDown={e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?false:e.key==='End'?true:!value;switchMode(next);}}}>{label}</ActionButton>)}</div>
    <div ref={ownershipTabs} className="mm-ownership-tabs" role="group" aria-label="知识列表归属筛选">{tabs.map(([id,name,count])=><ActionButton key={id} aria-pressed={!askView&&filter===id} className={!askView&&filter===id?'active':''} onClick={()=>tab(id)}><span className="mm-ownership-label">{name}</span><span className="mm-ownership-count">{count}</span></ActionButton>)}{ownershipIndicator&&<span className="mm-ownership-indicator" aria-hidden="true" style={{width:ownershipIndicator.width,transform:"translateX("+ownershipIndicator.left+"px)"}}/>}</div>
    <ActionLink className="mm-all-sources" href="/sources"><Icon name="archive"/>全部资料</ActionLink>
    </div>
    <GlobalAsk active={askView} items={items} sources={sources} state={state} setState={setState} route={route} navigate={navigate} notify={notify}/>
    <section ref={listPane} id="mm-workspace-list" className="mm-workspace-list" hidden={askView} role="tabpanel" aria-labelledby="mm-mode-list" tabIndex={0} onScroll={e=>{if(!askView)listScroll.current=e.currentTarget.scrollTop;}}>
    <div ref={listControls} className="mm-workspace-list-controls">
    <div className="mm-list-toolbar mm-unified-toolbar"><label className="mm-search"><Icon name="search"/><input aria-label="搜索知识库" placeholder="搜索名称、来源或分享者" value={search} onChange={e=>setSearch(e.target.value)}/></label><label className="mm-select-inline">状态<select value={status} onChange={e=>setStatus(e.target.value)}><option value="all">全部状态</option><option value="ready">可以阅读</option><option value="attention">待整理与需处理</option><option value="unavailable">已撤销或取消接收</option></select></label><Button variant="plain" onClick={()=>openTool('shares')}>分享记录</Button><div className="mm-library-display"><span className="mm-result-count" role="status">{shown.length} 项知识</span><div className="mm-view-switch" role="group" aria-label="知识展示方式"><ActionButton aria-pressed={view==='list'} onClick={()=>changeView('list')}>列表</ActionButton><ActionButton aria-pressed={view==='grid'} onClick={()=>changeView('grid')}>卡片</ActionButton></div></div></div>
    </div>
    {shown.length?view==='list'?<div className="mm-library-table-wrap"><table className="mm-library-table mm-unified-table"><caption className="mm-sr-only">知识库，{shown.length} 项知识</caption><thead><tr><th scope="col">知识名称</th><th scope="col">来源</th><th scope="col">可阅读内容</th><th scope="col">状态</th><th scope="col"><span className="mm-sr-only">操作</span></th></tr></thead><tbody>{shown.map(l=><tr key={l.id} className={l.available===false?undefined:"mm-library-row-clickable"} onClick={event=>openRow(event,l)}><th scope="row"><div className="mm-library-row-name"><span className={'mm-card-icon'+(l.isShared?' mm-shared-icon':'')}><Icon name="archive"/></span><div>{l.available===false?<strong>{l.name}</strong>:<a href={libraryPath(l.id)}>{l.name}</a>}<p>{l.description|| (l.isShared?'收到的知识，可以直接阅读和提问。':'围绕一个主题，随时添加笔记和资料。')}</p></div></div></th><td data-label="来源" className="mm-knowledge-origin"><span>{l.isShared?l.sharedBy+'分享':'我创建的'}</span><small>{l.isShared?'来自'+l.sourceNames.map(s=>'「'+s+'」').join('、'):l.counts.total+' 份资料'}</small></td><td data-label="可阅读内容"><span className="mm-library-number">{l.readable}</span><small>篇内容</small></td><td className="mm-library-row-state">{entryState(l)}{note(l)&&<small>{note(l)}</small>}</td><td className="mm-library-row-action"><div className="mm-unified-row-actions">{l.available===false&&<Button variant="plain" onClick={()=>setOrigin(l)}>查看状态</Button>}{!l.isShared&&<Button variant="plain" disabled={!l.documents.length} onClick={event=>{event.stopPropagation();setSharing(l);}} aria-label={'分享 '+l.name}>分享<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg></Button>}{l.isShared&&l.available!==false&&<Button variant="plain" onClick={()=>setOrigin(l)}>来源</Button>}</div></td></tr>)}</tbody></table></div>:<div className="mm-library-grid">{shown.map(l=><article className="mm-library-card" key={l.id}><div className="mm-card-top"><span className={'mm-card-icon'+(l.isShared?' mm-shared-icon':'')}><Icon name="archive"/></span>{entryState(l)}</div><h2>{l.available===false?l.name:<a href={libraryPath(l.id)}>{l.name}</a>}</h2><p>{l.description||'打开内容，开始阅读和提问。'}</p><div className="mm-card-meta"><span>{l.readable} 篇内容</span><span>{l.isShared?l.sharedBy+'分享':'我创建的'}</span></div>{l.isShared&&<p className="mm-caption">来自{l.sourceNames.join('、')}</p>}<div className="mm-card-bottom">{note(l)&&<span>{note(l)}</span>}{openAction(l)}</div>{!l.isShared&&<Button variant="plain" disabled={!l.documents.length} onClick={()=>setSharing(l)} aria-label={'分享 '+l.name}>复制分享链接</Button>}</article>)}</div>:<Empty title={search||status!=='all'?'没有符合条件的内容':filter==='shared'?'还没有收到分享':filter==='mine'?'从一篇笔记开始积累':'把知识放在一起'} action={search||status!=='all'?<Button onClick={()=>{setSearch('');setStatus('all');}}>清除筛选</Button>:filter==='shared'?<Button variant="primary" onClick={()=>openTool('receive')}>接收分享</Button>:<ActionLink className="mm-button mm-button-primary" href="/upload?new=1">添加第一份资料</ActionLink>}>{filter==='shared'?'别人分享给你的部分内容，会独立显示在这里。无需先拥有原来的资料。':'资料多少、是否完整，都不影响你开始保存和整理。'}</Empty>}
    </section>
    {['metask','tools'].includes(route.searchParams.get('use'))&&<KnowledgeUse key={route.searchParams.get('use')} mode={route.searchParams.get('use')} notify={notify} onClose={()=>{const p=new URLSearchParams(route.searchParams);p.delete('use');p.delete('library');navigate('/workspace'+(p.size?'?'+p:''),true,false);requestAnimationFrame(()=>document.getElementById(askView?'global-question':'mm-mode-list')?.focus({preventScroll:true}));}}/>}
    {sharing&&<ShareContentDialog library={sharing} documents={sharing.documents} state={state} setState={setState} notify={notify} onClose={()=>setSharing(null)}/>}
    {accountMcpOpen&&<AgentAccessDialog notify={notify} onClose={closeAccountMcp}/>}
    {origin&&<SharedOriginDialog item={origin} state={state} setState={setState} notify={notify} onClose={()=>setOrigin(null)}/>}
    {(route.searchParams.has('receive')||route.searchParams.has('demoShare'))&&<ReceiveKnowledgeDialog route={route} state={state} setState={setState} notify={notify} navigate={navigate} onClose={closeTool}/>}
    {route.searchParams.has('shares')&&<ShareRecordsDialog route={route} state={state} setState={setState} notify={notify} onClose={closeTool}/>}
  </div>;
}
