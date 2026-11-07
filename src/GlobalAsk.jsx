import { ActionButton } from './ActionControls.jsx';
import { FeatureHint } from './FeatureHint.jsx';
import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {Button,Modal,Empty} from './workbench-components.jsx';
import {libraryDocuments} from './workbench-docs.js';
import {findGlobalEvidence,globalCitationPath} from './global-ask-model.mjs';
import {appendActivity} from './feature-model.mjs';
import {copyText} from './copy-text.js';

const quickQuestions=[
  {question:'我的知识库有哪些内容',icon:'library'},
  {question:'帮我总结一下我的知识库',icon:'list'},
  {question:'这些资料主要讲什么',icon:'book'},
];

export function GlobalAsk({active:activeView=false,items,sources,state,setState,route,navigate,notify}) {
  const [historyOpen,setHistoryOpen]=useState(false);
  const resultScroll=useRef(0);
  useLayoutEffect(()=>{if(activeView&&answer.current)answer.current.scrollTop=resultScroll.current;},[activeView]);
  const input=useRef(null),answer=useRef(null);
  const chats=state.globalChats||[],questions=chats.filter(c=>c.kind!=='break');
  const lastBreak=chats.map(c=>c.kind).lastIndexOf('break'),active=chats.slice(lastBreak+1);
  const requested=questions.find(c=>c.id===route.searchParams.get('chat'));
  const historical=requested&&!active.some(c=>c.id===requested.id);
  const visible=historical?[requested]:active;
  const available=items.filter(l=>l.available!==false);
  const read=l=>libraryDocuments(l,sources);
  const readableItems=available.filter(l=>read(l).length);
  const count=readableItems.reduce((n,l)=>n+read(l).length,0);
  function questionRoute(chat='') {
    const p=new URLSearchParams();const filter=route.searchParams.get('filter');if(['mine','shared'].includes(filter))p.set('filter',filter);
    p.set('ask','1');if(chat)p.set('chat',chat);return '/workspace?'+p;
  }
  useEffect(()=>{
    if(route.searchParams.has('ask')&&document.activeElement?.getAttribute('role')!=='tab')input.current?.focus({preventScroll:true});
  },[route.searchParams.get('ask'),route.searchParams.get('chat')]);
  function locateAnswer(id){requestAnimationFrame(()=>{const container=answer.current,node=document.getElementById('global-answer-'+id);if(container&&node)container.scrollTop+=node.getBoundingClientRect().top-container.getBoundingClientRect().top;});}
  useEffect(()=>{if(requested)locateAnswer(requested.id);},[requested?.id]);
  function ask(e) {
    e.preventDefault();const q=(state.globalAskDraft||'').trim();if(!q||!count)return;
    const evidence=findGlobalEvidence(q,available,read,historical?requested:active.at(-1));
    const chat={id:crypto.randomUUID(),question:q,evidence,scope:'全部可访问知识',scopeDocId:null,createdAt:new Date().toISOString()};
    setState(s=>appendActivity({...s,globalAskDraft:'',globalChats:[...(s.globalChats||[]),chat]},'全局知识问答','',q.slice(0,80)));
    if(!activeView||route.searchParams.has('chat'))navigate(questionRoute(),false,false);
    locateAnswer(chat.id);
  }
  function newConversation(){setState(s=>({...s,globalAskDraft:'',globalChats:[...(s.globalChats||[]),{id:crypto.randomUUID(),kind:'break'}]}));navigate(questionRoute(),false,false);input.current?.focus({preventScroll:true});}
  function chooseQuickQuestion(question){setState(s=>({...s,globalAskDraft:question}));input.current?.focus({preventScroll:true});}
  async function copy(chat){try{
    const evidence=chat.evidence.filter(e=>available.some(l=>l.id===e.libraryId));
    await copyText(evidence.map((e,i)=>e.text+'\n['+(i+1)+'] '+e.libraryName+' · '+e.title).join('\n\n'));notify('回答与来源已复制');
  }catch{notify('复制失败，请手动选择文字复制。');}}
  function renderChat(chat) {
    const groups=new Map();(chat.evidence||[]).forEach((e,index)=>{if(!groups.has(e.libraryId))groups.set(e.libraryId,[]);groups.get(e.libraryId).push({...e,index});});
    return <article className="mm-global-answer" key={chat.id} id={'global-answer-'+chat.id}>
      <div className="mm-global-question"><span>我</span><h3>{chat.question}</h3></div>
      <div className="mm-global-answer-meta"><strong>MetaMind</strong><span>全部可访问知识 · 本地段落检索</span></div>
      {groups.size?<><p className="mm-global-answer-intro">从现有正文中找到以下相关内容，点击引用可定位核验。</p>{[...groups].map(([id,evidence])=>{
        const l=available.find(x=>x.id===id),first=evidence[0];
        return <section className="mm-global-source" key={id}><div className="mm-global-source-heading"><h3>{l?.name||first.libraryName}</h3><span className="mm-soft-tag">{l?.isShared||first.isShared?'与我共享':'我创建的'}</span>{l&&<Button variant="plain" onClick={()=>navigate(globalCitationPath(first,chat.id,first.index,true))}>{l.isShared?'在这份分享继续问':'在此知识库继续问'} →</Button>}</div>
          {evidence.map(e=><div className="mm-global-excerpt" key={e.index}>{l?<><p>{e.text.length>420?e.text.slice(0,420)+'…':e.text}</p><Button className="mm-global-citation" onClick={()=>navigate(globalCitationPath(e,chat.id,e.index))} aria-label={'定位引用 '+e.libraryName+' · '+e.title}><span>{e.index+1}</span>{e.libraryName} · {e.title}<small>{e.sourceKind==='shared'?'分享文本':e.sourceKind==='generated'?'整理提要':e.sourceKind==='supplement'?'补充文本':e.sourceKind==='knowledge'?'知识页面':'原始文本'}</small></Button></>:<p className="mm-caption">来源已不可用，此引用暂不展示。恢复内容或重新接收分享后可核验。</p>}</div>)}
        </section>;
      })}<div className="mm-global-answer-actions"><span>引用范围仅含当前可访问的内容</span><Button variant="plain" disabled={!chat.evidence.some(e=>available.some(l=>l.id===e.libraryId))} onClick={()=>copy(chat)}>复制回答与来源</Button></div></>:<div className="mm-global-no-answer"><p>没有找到足够相关、可核验的内容。</p><p>试试具体名称或关键词，也可以添加相关资料；未解析的附件不会用于回答。</p></div>}
    </article>;
  }
  return <section id="mm-workspace-ask" hidden={!activeView} className={"mm-global-ask"+(activeView?" is-conversation":"")} role={activeView?"tabpanel":undefined} aria-labelledby={activeView?"mm-mode-ask":undefined} aria-label={activeView?undefined:"向全部知识库提问"}>
    {activeView&&<div className="mm-global-ask-heading"><h2 id="global-ask-title"><FeatureHint text="从全部可访问的知识正文中查找答案，包含我创建的与我共享，点击引用可核验出处。知识列表的归属、状态和搜索筛选不会改变问答范围。">向知识库提问</FeatureHint></h2><div>{questions.length>0&&<><Button variant="plain" onClick={()=>setHistoryOpen(true)}>记录 {questions.length}</Button><Button variant="plain" onClick={newConversation}>新对话</Button></>}</div></div>}
    {activeView&&historical&&<div className="mm-global-results-heading"><span>正在查看历史问答</span><Button variant="plain" onClick={()=>navigate(questionRoute(),true,false)}>返回当前对话</Button></div>}
    <div className="mm-global-results" ref={answer} hidden={!activeView} tabIndex={0} aria-label="问答内容" aria-live="polite" onScroll={e=>{if(activeView)resultScroll.current=e.currentTarget.scrollTop;}}>{visible.length?visible.map(renderChat):<div className="mm-global-welcome"><h3>从一个问题开始</h3><p>查找概念、约定或具体内容，回答附带可核验的出处。</p><div className="mm-global-quick-questions" role="group" aria-label="快捷问题">{quickQuestions.map(({question,icon})=><ActionButton key={question} type="button" icon={icon} className="mm-button mm-button-secondary mm-global-quick-question" onClick={()=>chooseQuickQuestion(question)}>{question}</ActionButton>)}</div></div>}</div>
    <div className="mm-global-compose-area">
    <form onSubmit={ask} className="mm-global-composer"><label className="mm-sr-only" htmlFor="global-question">向全部知识提问</label><textarea ref={input} id="global-question" aria-describedby="global-ask-scope" rows={1} maxLength={2000} value={state.globalAskDraft||''} onChange={e=>{const value=e.target.value;setState(s=>({...s,globalAskDraft:value}));}} placeholder="向全部知识库提问…" onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();ask(e);}}}/><Button type="submit" variant="primary" disabled={!(state.globalAskDraft||'').trim()||!count}>提问</Button></form>
    <div id="global-ask-scope" className={activeView?"mm-global-ask-scope":"mm-sr-only"}><span className="mm-sr-only">范围包含我创建的和与我共享的全部可访问知识，不受列表筛选影响。</span><span>{readableItems.length} 项可读知识 · {count} 篇内容</span></div>
    {!count&&<p className="mm-caption">先添加一份资料或接收分享，准备好正文后即可提问。</p>}
    </div>
    {historyOpen&&<Modal title="全局问答记录" description="记录独立于各知识库内的对话，保存在当前浏览器。" drawer onClose={()=>setHistoryOpen(false)}><div className="mm-dialog-body mm-global-history">{questions.length?[...questions].reverse().map(c=><ActionButton key={c.id} onClick={()=>{setHistoryOpen(false);navigate(questionRoute(c.id),false,false);}}><strong>{c.question}</strong><span>{new Date(c.createdAt).toLocaleString('zh-CN')} · {new Set(c.evidence.map(e=>e.libraryId)).size} 个来源</span></ActionButton>):<Empty title="还没有全局问答">在首页输入第一个问题。</Empty>}</div><div className="mm-dialog-actions"><Button onClick={()=>setHistoryOpen(false)}>关闭</Button></div></Modal>}
  </section>;
}
