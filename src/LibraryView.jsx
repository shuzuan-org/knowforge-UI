import {ActionHint} from './ActionHint.jsx';
import { ActionButton, ActionLink, ActionSummary } from './ActionControls.jsx';
import { FeatureHint } from './FeatureHint.jsx';
import { UsageCards } from './UsageCards.jsx';
import { AgentAccessDialog } from './AgentAccessDialog.jsx';
import './library-tabbar.css';
import React, { useState, useEffect, useRef } from 'react';
import { Button, Icon, Modal, Empty, Status } from './workbench-components.jsx';
import { exampleDocuments, localDocuments, libraryDocuments } from './workbench-docs.js';
import { trashSources } from './files-model.mjs';
import { KnowledgeWorkspace } from './KnowledgeWorkspace.jsx';
import { LibraryKnowledgeMap } from './KnowledgeMap.jsx';
import { LibraryCatalog } from './LibraryCatalog.jsx';
import { libraryContentTab } from './knowledge-map-model.mjs';
import { rememberRecentPage } from './recent-reading-model.mjs';
import { ShareContentDialog, SharedOriginDialog } from './KnowledgeSharing.jsx';
import { LibraryTools } from './FeaturePanels.jsx';
import { contextualQuestion } from './feature-model.mjs';
import {resolveGlobalReference,continuationDraft} from './global-ask-model.mjs';
import {methodLabel} from './advanced-model.mjs';
import { copyText } from './copy-text.js';
import { getCounts, findEvidence, libraryPath, formatBytes, TEXT_LIMIT, resolveEvidence, questionDocuments } from './workbench-model.mjs';

export function LibraryView({ library, route, navigate, sources, exampleSources, firstLibraryId, chats, state, setState, notify, recentReadRequest }) {
  const isShared=!!library.isShared;
  const tabs = [['knowledge','正文'],['map','知识图谱'],...(!isShared?[['sources','资料来源'],['usage','使用方式']]:[])];
  const tab = libraryContentTab(route,isShared);
  useEffect(()=>{
    let frame;
    const reveal=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>document.getElementById('mm-tab-'+tab)?.scrollIntoView({block:'nearest',inline:'nearest'}));};
    reveal();
    window.addEventListener('resize',reveal);
    return ()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',reveal);};
  },[tab]);
  const [mapVisited,setMapVisited]=useState(tab==='map');
  useEffect(()=>{if(tab==='map')setMapVisited(true);},[tab]);
  const localSources = sources.filter(s => s.libraryId === library.id);
  const docs = libraryDocuments(library, sources);
  const counts = getCounts(library, sources);
  const [dialog, setDialog] = useState(null);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [sourceSearch, setSourceSearch] = useState('');
  const [pageSearch, setPageSearch] = useState('');
  const [pageTopic, setPageTopic] = useState('');
  const catalogPosition = useRef(0);
  const [catalogExpanded,setCatalogExpanded]=useState({});
  const [askScope, setAskScope] = useState(() => route.searchParams.get('tab') === 'ask' && docs.some(d => d.id === route.searchParams.get('doc')) ? 'current' : 'all');
  const [assistantOpen, setAssistantOpen] = useState(true);
  const [mobilePane, setMobilePane] = useState(() => route.searchParams.get('tab') === 'ask' ? 'ask' : 'read');
  const [focusedEvidence, setFocusedEvidence] = useState(null);
  useEffect(() => {
    if (recentReadRequest && route.searchParams.get('tab') === 'knowledge') {
      setFocusedEvidence(null); setMobilePane('read');
    }
  }, [recentReadRequest]);
  const [draft, setDraftRaw] = useState(()=>state.libraryAskDrafts?.[library.id]||'');
  function setDraft(value){setDraftRaw(value);setState(s=>({...s,libraryAskDrafts:{...s.libraryAskDrafts,[library.id]:value}}));}
  const [thinking, setThinking] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState('');
  const responseTimer = useRef(null);
  const mcpTrigger = useRef(null);
  const shareTrigger = useRef(null);
  const conversationEnd = useRef(null);
  const [dismissedBatch, setDismissedBatch] = useState('');
  const selected = docs.find(d => d.id === route.searchParams.get('doc')) || docs[0];
  useEffect(()=>{if(selected)setCatalogExpanded(previous=>({...previous,[selected.id]:true}));},[selected?.id]);
  useEffect(() => {
    if (tab !== 'knowledge' || !selected || library.available === false) return;
    const compact = window.matchMedia('(max-width:760px)');
    const remember = () => {
      if (!compact.matches || mobilePane === 'read') setState(previous => rememberRecentPage(previous, library.id, selected.id));
    };
    remember(); compact.addEventListener('change', remember);
    return () => compact.removeEventListener('change', remember);
  }, [library.id, selected?.id, tab, mobilePane]);
  const originChatId=route.searchParams.get('globalChat');
  const incoming=resolveGlobalReference(state.globalChats||[],originChatId,route.searchParams.get('citation'),library.id,docs);
  const incomingQuestion=route.searchParams.get('continue')==='1'&&incoming?incoming.chat.question:'';
  const returnToGlobal=originChatId&&(state.globalChats||[]).some(c=>c.id===originChatId)?'/workspace?ask=1&chat='+encodeURIComponent(originChatId):'';
  useEffect(()=>{
    if(!incoming)return;
    setAssistantOpen(true);
    if(incoming.doc&&incoming.unchanged){setFocusedEvidence(incoming.evidence);setMobilePane('read');}
    else setDialog({kind:'evidence',evidence:incoming.evidence});
  },[originChatId,route.searchParams.get('citation'),library.id]);
  useEffect(()=>{
    if(!incomingQuestion)return;
    const next=continuationDraft(draft,incomingQuestion);if(!next.conflict)setDraft(next.value);
    setAskScope('all');setAssistantOpen(true);setMobilePane('ask');
    requestAnimationFrame(()=>document.getElementById('mm-question')?.focus({preventScroll:true}));
  },[incomingQuestion,originChatId,library.id]);

  const batchId = route.searchParams.get('batch');
  const batch = batchId ? localSources.filter(s => s.batchId === batchId) : [];
  const completed = batch.filter(s => ['ready', 'attention'].includes(s.state)).length;
  const processing = localSources.filter(s => s.state === 'processing');
  const waiting = localSources.filter(s => s.state === 'waiting');
  const lastBreak = chats.map(c => c.kind).lastIndexOf('break');
  const activeChats = chats.slice(lastBreak + 1);
  const pastChats = chats.filter(c => c.kind !== 'break');
  useEffect(() => () => clearTimeout(responseTimer.current), []);
  useEffect(() => { if (route.searchParams.get('tab') === 'ask' && docs.some(d => d.id === route.searchParams.get('doc'))) { setAskScope('current'); setAssistantOpen(true); setMobilePane('ask'); } }, [route.searchParams.get('doc'), route.searchParams.get('tab')]);
  useEffect(() => { if (activeChats.length || thinking) conversationEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [chats.length, thinking]);

  function goTab(next, doc = selected?.id || '') {
    navigate(libraryPath(library.id, ['catalog','map','sources','usage'].includes(next) ? next : 'knowledge', doc)+(returnToGlobal?'&globalChat='+encodeURIComponent(originChatId):''), false, false);
    if (next === 'ask') { setAssistantOpen(true); setMobilePane('ask'); }
  }
  function openDocument(id) {
    setFocusedEvidence(null); setMobilePane('read'); goTab('knowledge', id);
  }
  function collapseAssistant() {
    setAssistantOpen(false); setMobilePane('read');
    requestAnimationFrame(() => document.getElementById(window.matchMedia('(max-width:760px)').matches ? 'mm-read-pane' : 'mm-open-assistant')?.focus({ preventScroll: true }));
  }
  function openMcp() {
    mcpTrigger.current = document.activeElement;
    setDialog({ kind: 'mcp' });
  }
  function closeMcp() {
    setDialog(null);
    requestAnimationFrame(() => {
      if (mcpTrigger.current?.isConnected) mcpTrigger.current.focus({ preventScroll: true });
    });
  }
  function openLibraryShare() {
    shareTrigger.current=document.activeElement;
    setDialog({kind:'selected-share'});
  }
  function closeLibraryShare() {
    setDialog(null);
    requestAnimationFrame(()=>{
      if(shareTrigger.current?.isConnected)shareTrigger.current.focus({preventScroll:true});
    });
  }
  function askCurrent() {
    setAskScope('current'); setAssistantOpen(true); setMobilePane('ask');
    requestAnimationFrame(() => document.getElementById('mm-question')?.focus({ preventScroll: true }));
  }
  function showEvidence(evidence) {
    const doc = docs.find(d => d.id === evidence.docId);
    if (!doc || !resolveEvidence(evidence, doc).unchanged) return setDialog({ kind: 'evidence', evidence });
    setDialog(null); setPageSearch(''); setFocusedEvidence({ ...evidence }); setMobilePane('read');
    goTab('knowledge', doc.id);
  }
  function updateSource(id, changes) {
    setState(s => ({ ...s, sources: s.sources.map(item => item.id === id ? { ...item, ...changes } : item) }));
  }
  function ask(question = draft) {
    const q = question.trim();
    if (!q || thinking || !docs.length) return;
    const scoped = questionDocuments(docs, askScope, selected?.id);
    if (!scoped.length) return;
    const evidence = findEvidence(contextualQuestion(q, activeChats.filter(c=>c.question).at(-1), askScope==='all'?null:scoped[0]?.id), scoped).map(e => ({ ...e, text: e.text.slice(0, 1200) }));
    setPendingQuestion(q); setDraft(''); setThinking(true);
    responseTimer.current = setTimeout(() => {
      setState(s => ({ ...s, chats: { ...s.chats, [library.id]: [...(s.chats[library.id] || []), { id: crypto.randomUUID(), question: q, evidence, scope: askScope === 'all' ? library.name : scoped[0].title, scopeDocId: askScope === 'all' ? null : scoped[0].id, createdAt: new Date().toISOString() }] } }));
      setThinking(false); setPendingQuestion('');
    }, 400);
  }
  async function copy(text, success = '已复制') {
    try { await copyText(text); notify(success); }
    catch { notify('浏览器未允许复制，请手动选中文字复制。'); }
  }
  function renderAnswer(chat, history = false) {
    return <div className="mm-conversation-item" key={chat.id}><div className="mm-question-row"><span className="mm-question-avatar">我</span><p>{chat.question}</p></div><div className="mm-answer"><div className="mm-answer-label"><strong>MetaMind</strong><span>段落检索 · 范围：{chat.scope}</span></div>{chat.evidence.length ? <><p className="mm-answer-intro">从现有资料中找到以下相关内容：</p>{chat.evidence.map((e, i) => <div className="mm-answer-excerpt" key={e.docId + '-' + i}><p>{e.text.length > 420 ? e.text.slice(0, 420) + '…' : e.text}</p><ActionButton className="mm-citation" aria-label={'查看引用 ' + e.title} onClick={() => showEvidence(e)}><span>{i + 1}</span>{e.title}<small>{e.sourceKind === 'knowledge' ? '知识页' : e.sourceKind === 'supplement' ? '补充文本' : e.sourceKind === 'generated' ? '整理提要' : e.sourceKind === 'shared' ? '分享文本' : '原文'}</small></ActionButton></div>)}<div className="mm-answer-actions"><span>点击引用可核验对应内容</span><Button variant="plain" onClick={() => copy(chat.evidence.map((e, i) => e.text + '\n[' + (i + 1) + '] ' + e.title).join('\n\n'), '回答与引用已复制')}>复制回答</Button></div></> : <div className="mm-no-evidence"><p>没有找到足够相关、可核验的内容。</p><p className="mm-subtle">{isShared?'试试使用内容中的具体名称或关键词，也可以向分享者获取更多相关内容。':'试试使用资料中的具体名称或关键词，或补充更多相关正文。'}</p>{!isShared&&<ActionLink href={'/upload?library=' + encodeURIComponent(library.id)}>添加相关资料 →</ActionLink>}</div>}{!isShared&&<Button variant="plain" onClick={()=>setDialog({kind:'memory',text:'针对「'+chat.question+'」的纠正：'})}>纠正并记住</Button>}{history && <small className="mm-caption">{new Date(chat.createdAt).toLocaleString('zh-CN')}</small>}</div></div>;
  }
  const questions = library.id === firstLibraryId ? ['这个知识库主要讲什么？', '品牌使用哪些颜色？', '字体与字号有哪些规范？'] : ['这份资料主要讲什么？', '概括资料中的主要要点', '资料中有哪些约定？'];
  const baseSources = exampleSources.filter(s => s.libraryId === library.id);
  const listedSources = [...localSources].reverse().concat(baseSources);
  const shownSources = listedSources.filter(s => sourceFilter === 'all' || s.state === sourceFilter).filter(s => s.name.toLowerCase().includes(sourceSearch.toLowerCase()));
    const addLink = '/upload?library=' + encodeURIComponent(library.id);
  return <div className={"mm-library-view" + (tab !== 'sources' && docs.length ? ' mm-library-integrated' : '')}>
    <div className="mm-page-heading mm-library-heading"><div className="mm-library-heading-copy"><div className="mm-library-title"><h1 title={library.name}>{library.name}</h1>{isShared&&<span className="mm-shared-label">与我共享</span>}<Status state={docs.length ? 'ready' : counts.processing ? 'processing' : counts.attention ? 'attention' : 'waiting'}>{!docs.length && !counts.processing && !counts.attention ? isShared?'暂无可读内容':counts.waiting?'待整理':'待添加资料' : undefined}</Status>{counts.attention > 0 && docs.length > 0 && <span className="mm-caption mm-status-attention">{counts.attention} 份资料需处理</span>}</div><p className="mm-library-description" title={isShared?library.sharedBy+'分享 · 来自'+library.sourceNames.join('、'):library.description||'围绕同一个项目或主题，持续积累可信的知识。'}>{isShared?library.sharedBy+'分享 · 来自'+library.sourceNames.join('、'):library.description||'围绕同一个项目或主题，持续积累可信的知识。'}</p></div><div className="mm-heading-actions">{isShared?<><Button onClick={()=>setDialog({kind:'origin'})}>来源与范围</Button><ActionLink className="mm-button" href="/workspace?filter=shared">知识库</ActionLink></>:<><Button onClick={()=>setDialog({kind:'evaluate'})}>评测与生成</Button><details className="mm-library-menu"><ActionSummary className="mm-button mm-button-secondary">更多操作</ActionSummary><div><ActionButton onClick={e=>{e.currentTarget.closest('details').removeAttribute('open');setDialog({kind:'memory'});}}>修改与记忆</ActionButton><ActionButton onClick={e=>{e.currentTarget.closest('details').removeAttribute('open');setDialog({kind:'clear'});}}>清空内容</ActionButton><ActionButton onClick={e=>{e.currentTarget.closest('details').removeAttribute('open');setDialog({kind:'purge'});}}>彻底删除本地知识库</ActionButton><ActionButton onClick={e => { e.currentTarget.closest('details').removeAttribute('open'); setDialog({ kind: 'settings' }); }}>知识库设置</ActionButton><ActionLink href={'/sources?library=' + encodeURIComponent(library.id)}>在全部资料中查看 ↗</ActionLink><ActionLink href={'/workspace?shares=1&library=' + encodeURIComponent(library.id)}>分享记录 ↗</ActionLink></div></details><ActionLink className="mm-button mm-button-primary" href={addLink}><Icon name="upload" />添加资料</ActionLink></>}</div></div>
    <div className="mm-library-tabbar"><div className="mm-library-tabs" role="tablist" aria-label="知识库内容">{tabs.map(([id, label], index) => <ActionButton style={{order:index<2?index:index+1}} id={'mm-tab-' + id} role="tab" aria-selected={tab === id} aria-controls="mm-library-panel" key={id} tabIndex={tab === id ? 0 : -1} onClick={() => goTab(id)} onKeyDown={e => { if (['ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); const next = tabs[(index + (e.key==='ArrowRight'?1:-1) + tabs.length) % tabs.length][0]; goTab(next); requestAnimationFrame(() => document.getElementById('mm-tab-' + next)?.focus()); } }}>{label}{id === 'catalog' && <span>{docs.length}</span>}</ActionButton>)}</div>{!isShared&&<ActionHint text={'仅分享当前知识库「'+library.name+'」，可发给别人，也可接入工具。'}><ActionButton className="mm-library-share" aria-haspopup="dialog" disabled={!docs.length} onClick={openLibraryShare}>复制分享链接</ActionButton></ActionHint>}</div>
    <section id="mm-library-panel" role="tabpanel" aria-labelledby={'mm-tab-' + tab} className={'mm-library-panel mm-panel-' + tab}>
    <div hidden={tab!=='knowledge'}>{!docs.length ? isShared?<Empty title="这份分享还没有可阅读内容" action={<Button onClick={()=>setDialog({kind:'origin'})}>查看来源与范围</Button>}>请向分享者获取包含正文的新分享，收到后即可阅读和提问。</Empty>:<Empty title={counts.processing ? '资料正在整理' : '添加资料，开始阅读与提问'} action={counts.processing ? <Button onClick={() => goTab('sources')}>查看整理进度</Button> : <ActionLink className="mm-button mm-button-primary" href={addLink}>添加第一份资料</ActionLink>}>{counts.attention ? '部分资料需要补充文本，处理后即可在这里阅读和提问。' : library.referenceOnly && counts.total > 0 ? '当前仅有文件信息，尚无可读正文。添加文本后即可阅读和提问。' : '整理完成后，从正文左侧的目录选择内容，阅读、提问并点击引用回到出处。'}{counts.attention > 0 && <p><Button variant="plain" onClick={() => { setSourceFilter('attention'); goTab('sources'); }}>查看需处理的资料 →</Button></p>}</Empty> :
      <KnowledgeWorkspace library={library} active={tab==='knowledge'} catalogRequested={route.searchParams.get('tab')==='catalog'} renderCatalog={({active,onSelect,inDrawer,headingAction,onSelectHeading,activeHeading})=><LibraryCatalog expanded={catalogExpanded} onExpandedChange={setCatalogExpanded} onHeading={onSelectHeading} activeHeading={activeHeading} embedded headingAction={headingAction} hideHeading={inDrawer} library={library} docs={docs} selected={selected} active={active} search={pageSearch} onSearch={setPageSearch} topic={pageTopic} onTopicChange={setPageTopic} position={catalogPosition} onOpen={onSelect}/>} onOpenMap={()=>goTab('map')} returnToGlobal={returnToGlobal} docs={docs} selected={selected} onOpen={openDocument} onAskCurrent={askCurrent} assistantOpen={assistantOpen} onAssistantOpen={setAssistantOpen} mobilePane={mobilePane} onMobilePane={setMobilePane} evidence={focusedEvidence} onClearEvidence={() => setFocusedEvidence(null)} onInspectEvidence={() => setDialog({ kind: 'evidence', evidence: focusedEvidence })} notify={notify} assistant={
        <div className="mm-ask-layout"><div className="mm-knowledge-assistant-heading"><h2>知识问答</h2><div><Button variant="plain" onClick={() => setDialog({ kind: 'history' })}>记录{pastChats.length ? ' ' + pastChats.length : ''}</Button><Button variant="plain" disabled={thinking} onClick={() => { if (activeChats.length) setState(s => ({ ...s, chats: { ...s.chats, [library.id]: [...(s.chats[library.id] || []), { id: crypto.randomUUID(), kind: 'break' }] } })); setDraft(''); }}>新对话</Button><Button variant="plain" className="mm-close-assistant mm-assistant-toggle" aria-label="收起问答" aria-controls="mm-library-assistant" aria-expanded={true} onClick={collapseAssistant}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M15 4.5v15"/></svg><span className="mm-panel-toggle-hint" aria-hidden="true">收起问答</span></Button></div></div>
        {incomingQuestion&&<div className="mm-global-context"><strong>从全局问答继续</strong><p>{incomingQuestion}</p>{draft!==incomingQuestion&&<Button variant="plain" onClick={()=>setDraft(incomingQuestion)}>填入这个问题</Button>}<span>本次仅在当前{isShared?'分享':'知识库'}中查找。</span></div>}
        <div className="mm-knowledge-scope"><div role="group" aria-label="提问范围"><ActionButton aria-pressed={askScope === 'all'} onClick={() => setAskScope('all')}>全部内容</ActionButton><ActionButton aria-pressed={askScope === 'current'} onClick={() => setAskScope('current')}>当前页面</ActionButton></div><p>{askScope === 'all' ? '仅在「' + library.name + '」的 ' + docs.length + ' 篇内容中查找' : '仅围绕「' + selected.title + '」提问'}</p></div>
        <div className="mm-conversation" aria-live="polite">{!activeChats.length && !thinking && <div className="mm-ask-welcome"><p>点击问题开始，引用会定位到正文。</p><div className="mm-question-suggestions">{(askScope === 'current' ? ['概括当前页面的主要内容', '当前页面有哪些约定？'] : [questions[0], questions[2]]).map(q => <ActionButton key={q} onClick={() => ask(q)}>{q}<span aria-hidden="true">↗</span></ActionButton>)}</div></div>}{activeChats.map(chat => renderAnswer(chat))}{thinking && <div className="mm-conversation-item"><div className="mm-question-row"><span className="mm-question-avatar">我</span><p>{pendingQuestion}</p></div><p className="mm-thinking" role="status">正在查找可核验的相关内容…</p></div>}<div ref={conversationEnd} /></div>
        <form className="mm-composer" onSubmit={e => { e.preventDefault(); ask(); }}><label className="mm-sr-only" htmlFor="mm-question">向当前知识库提问</label><textarea id="mm-question" value={draft} onChange={e => setDraft(e.target.value)} placeholder={askScope === 'current' ? '围绕当前页面提问…' : '向「'+library.name+'」提问…'} aria-description="Enter 发送，Shift + Enter 换行" rows={2} maxLength={2000} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); ask(); } }} /><div><span>本地段落检索 · 回答附引用</span><Button type="submit" variant="primary" disabled={!draft.trim() || thinking}>{thinking ? '查找中…' : '提问'}</Button></div></form></div>
      } />}</div>
    <div hidden={tab!=='map'}>{(mapVisited||tab==='map')&&<LibraryKnowledgeMap library={library} docs={docs} firstLibraryId={firstLibraryId} selected={selected} active={tab==='map'} onRead={()=>goTab('knowledge')} onOpen={openDocument} onAsk={id=>{openDocument(id);askCurrent();}}/>}</div>
    {!isShared && <div hidden={tab!=='usage'} className="mm-library-usage"><h2><FeatureHint text="选择阅读提问、Metask对话或Agent接入。复制给 Agent 用于账号内全部可访问知识；复制分享链接只授权当前知识库。两种链接都能接入工具。">知识库使用</FeatureHint></h2><UsageCards onAsk={()=>{goTab('ask');requestAnimationFrame(()=>document.getElementById('mm-question')?.focus({preventScroll:true}));}} onCopyMcp={openMcp}/></div>}
    {tab === 'sources' && <>
      {batch.length > 0 && dismissedBatch !== batchId && <div className={'mm-batch mm-batch-' + (completed === batch.length ? 'done' : 'processing')} aria-live="polite"><div><h2>{completed === batch.length ? (batch.every(s => s.state === 'attention') ? '本次资料需要处理' : batch.some(s => s.state === 'attention') ? '整理结束，部分资料需处理' : '整理完成') : processing.length ? '正在整理你的资料' : '整理已暂停'}</h2><p>{completed === batch.length ? batch.filter(s => s.state === 'ready').length + ' 份可使用，' + batch.filter(s => s.state === 'attention').length + ' 份需处理。' + (batch.some(s => s.state === 'ready') ? '可用内容已经可以阅读和提问。' : '补充文本后，可以继续整理本次资料。') : '已完成 ' + completed + ' / ' + batch.length + ' 份，可以离开此页，稍后回来查看。'}</p><progress max={batch.length} value={completed} aria-label="本次资料整理进度" /></div><div>{completed === batch.length && docs.length > 0 && <Button variant="primary" onClick={() => goTab('ask')}>开始提问</Button>}{completed === batch.length && batch.some(s => s.state === 'attention') && <Button onClick={() => setSourceFilter('attention')}>查看需处理</Button>}{completed !== batch.length && <Button onClick={() => setState(s => ({ ...s, sources: s.sources.map(item => item.libraryId === library.id && (processing.length ? item.state === 'processing' : item.state === 'waiting') ? { ...item, state: processing.length ? 'waiting' : 'processing' } : item) }))}>{processing.length ? '暂停整理' : '继续整理'}</Button>}{completed === batch.length && <Button variant="plain" aria-label="收起本次整理结果" onClick={() => setDismissedBatch(batchId)}>收起</Button>}</div></div>}
      <div className="mm-sources-overview"><div><h2>资料来源与整理状态</h2><p>上传成功后，仍需完成整理，内容才会显示在正文中。</p><ActionLink className="mm-file-manage-link" href={'/sources?library=' + encodeURIComponent(library.id)}>在全部资料中管理目录与回收站 →</ActionLink></div><div><span><b>{counts.ready}</b> 可使用</span><span><b>{counts.waiting + counts.processing}</b> 待整理 / 整理中</span><span><b>{counts.attention}</b> 需处理</span></div></div>
      <div className="mm-source-toolbar"><label className="mm-search"><Icon name="search" /><input aria-label="搜索资料" placeholder="搜索文件名称" value={sourceSearch} onChange={e => setSourceSearch(e.target.value)} /></label><label className="mm-select-inline">状态<select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}><option value="all">全部状态</option><option value="ready">可使用</option><option value="waiting">待开始</option><option value="processing">整理中</option><option value="attention">需处理</option></select></label>{waiting.length > 0 && <Button onClick={() => setState(s => ({ ...s, sources: s.sources.map(item => item.libraryId === library.id && item.state === 'waiting' ? { ...item, state: 'processing' } : item) }))}>继续整理 {waiting.length} 份</Button>}</div>
      {shownSources.length ? <div className="mm-source-table-wrap"><table className="mm-source-table"><thead><tr><th>资料名称</th><th>类型</th><th>状态与说明</th><th>操作</th></tr></thead><tbody>{shownSources.slice(0,100).map(s => <tr key={s.id}><td><strong title={s.name}>{s.name}</strong><small>{s.agentName && <>{methodLabel(s.method||s.agentRules?.id,s.agentName)} · </>}{s.example ? '只读记录' : s.providedText ? '已补充文本' : formatBytes(s.size)}</small></td><td>{s.type}</td><td><Status state={s.state}>{s.example&&s.state==='ready'?'已整理':undefined}</Status><span className="mm-source-reason">{s.state === 'attention' ? s.reason : s.state === 'ready' ? (s.example ? '已整理 · 未保存附件正文' : '已可阅读和提问') : s.state === 'skipped' ? '不参与整理' : s.state === 'processing' ? '正在整理正文' : '点击继续整理后处理'}</span></td><td><Button variant="plain" onClick={() => setDialog({ kind: s.state === 'attention' ? 'supplement' : 'source', source: s })}>{s.state === 'attention' ? '补充文本' : s.example ? '查看信息' : '查看原文'}</Button>{!s.example && <Button variant="plain" onClick={() => setDialog({ kind: 'remove-source', source: s })}>移到回收站</Button>}</td></tr>)}</tbody></table></div> : <Empty title={sourceSearch ? '没有找到匹配的资料' : sourceFilter === 'attention' ? '没有需要处理的本地资料' : sourceFilter === 'all' ? '这里还没有资料' : '当前列表没有此状态的条目'} action={sourceSearch || sourceFilter !== 'all' ? <Button onClick={() => { setSourceSearch(''); setSourceFilter('all'); }}>查看全部</Button> : <ActionLink href={addLink} className="mm-button mm-button-primary">添加资料</ActionLink>}>{library.example && counts.waiting && sourceFilter === 'waiting' ? '当前仅有待整理数量，暂无对应文件明细。新添加的资料会显示在这里。' : '添加资料后，你可以在这里管理内容并查看整理状态。'}</Empty>}
      {shownSources.length>100&&<p className="mm-caption">此页显示前100条；<ActionLink href={'/sources?library='+encodeURIComponent(library.id)}>打开完整文件列表（分页） →</ActionLink></p>}{library.example && <div className="mm-example-source-note"><p>当前列表未保存附件正文；知识页面可直接阅读，新增文本资料也可用于提问。</p>{counts.skipped > 0 && <details><ActionSummary>另有 {counts.skipped} 份资料不参与整理</ActionSummary><p>这些资料已标记为“不处理”，无需逐项处理。</p></details>}</div>}
    </>}
    </section>
    {!isShared&&['evaluate','memory','clear','purge'].includes(dialog?.kind) && <LibraryTools key={dialog.kind} kind={dialog.kind} initialMemory={dialog.text||''} library={library} docs={docs} sources={sources} state={state} setState={setState} onClose={()=>setDialog(null)} navigate={navigate} notify={notify}/>}
    {dialog?.kind === 'mcp' && <AgentAccessDialog contextLibrary={library} notify={notify} onClose={closeMcp} />}
    {dialog?.kind === 'evidence' && <EvidenceDialog evidence={dialog.evidence} doc={docs.find(d => d.id === dialog.evidence.docId)} onClose={() => setDialog(null)} onRead={doc => { setDialog(null); openDocument(doc.id); }} />}
    {dialog?.kind === 'source' && <SourceDialog source={dialog.source} onClose={() => setDialog(null)} />}
    {dialog?.kind === 'supplement' && <SupplementDialog source={dialog.source} onClose={() => setDialog(null)} onSave={content => { updateSource(dialog.source.id, { content, state: 'processing', reason: '', providedText: true }); setDialog(null); notify('文本已补充，正在重新整理'); }} />}
    {dialog?.kind === 'remove-source' && <Modal title="将这份资料移到回收站？" description={dialog.source.name} onClose={() => setDialog(null)}><div className="mm-dialog-body"><p>资料会暂时从此知识库的可阅读内容与问答范围中移除，正文和整理规则会保留。可在全部资料的回收站中恢复，电脑中的文件不会改变，历史回答保留原有引用。</p></div><div className="mm-dialog-actions"><Button onClick={() => setDialog(null)}>取消</Button><Button variant="danger" onClick={() => { setState(s => trashSources(s, [dialog.source.id])); setDialog(null); notify('已移到回收站，可在全部资料中恢复'); }}>移到回收站</Button></div></Modal>}
    {dialog?.kind === 'history' && <Modal title="对话记录" description="记录保存在此浏览器中，引用可以重新打开核验。" drawer onClose={() => setDialog(null)}><div className="mm-dialog-body">{pastChats.length ? pastChats.map(c => renderAnswer(c, true)) : <Empty title="还没有对话记录">发送第一个问题后，记录会出现在这里。</Empty>}</div></Modal>}
    {dialog?.kind==='selected-share'&&!isShared&&<ShareContentDialog library={library} documents={docs} state={state} setState={setState} notify={notify} onClose={closeLibraryShare}/>}
    {dialog?.kind==='origin'&&isShared&&<SharedOriginDialog item={library} state={state} setState={setState} notify={notify} onClose={()=>setDialog(null)}/>}

    {dialog?.kind === 'settings' && <SettingsDialog library={library} onClose={() => setDialog(null)} onSave={(name, description) => { setState(s => ({ ...s, edits: { ...s.edits, [library.id]: { ...s.edits[library.id], name, description } } })); setDialog(null); notify('知识库信息已保存'); }} onDelete={() => setDialog({ kind: 'delete-library' })} />}
    {dialog?.kind === 'delete-library' && <Modal title="移除这个本地知识库？" description={library.name} onClose={() => setDialog(null)}><div className="mm-dialog-body"><p>知识库会从当前浏览器的列表中隐藏，相关文本和记录仍保留在本地，不会影响电脑中的原文件。</p></div><div className="mm-dialog-actions"><Button onClick={() => setDialog(null)}>取消</Button><Button variant="danger" onClick={() => { setState(s => ({ ...s, hiddenLibraries: [...s.hiddenLibraries, library.id] })); navigate('/workspace'); notify('已从当前列表移除知识库'); }}>移除知识库</Button></div></Modal>}
  </div>;
}


function EvidenceDialog({ evidence, doc, onClose, onRead }) {
  const resolved = resolveEvidence(evidence, doc);
  const paragraph = resolved.text;
  const label = evidence.sourceKind === 'knowledge' ? '知识页面引用' : evidence.sourceKind === 'supplement' ? '补充文本引用' : evidence.sourceKind === 'generated' ? '本地整理提要引用' : evidence.sourceKind === 'shared' ? '分享文本引用' : '原始文本引用';
  return <Modal title="查看引用出处" description={evidence.title} drawer onClose={onClose}><div className="mm-dialog-body"><div className="mm-evidence-meta"><span>{label}</span><span>段落 {evidence.paragraphIndex + 1}</span></div><blockquote className="mm-evidence-quote">{paragraph}</blockquote>{doc && resolved.unchanged && <div className="mm-evidence-context"><h3>相邻内容</h3>{doc.paragraphs.slice(Math.max(0, evidence.paragraphIndex - 1), evidence.paragraphIndex + 2).map((p, i) => <p key={i}>{p}</p>)}</div>}<div className="mm-notice">{evidence.sourceKind === 'knowledge' ? '此处核验的是知识页面正文，未保存原始附件。' : evidence.sourceKind === 'supplement' ? '此处核验的是手动补充的文本，不代表原始附件已经完成解析。' : evidence.sourceKind === 'generated' ? '此处引用的是本地摘录提要。提要底部可打开原始资料核验；用户记忆为单独附录。' : evidence.sourceKind === 'shared' ? '此处引用的是接收分享时保存的文本版本。' : '此处显示你添加的原始文本，回答没有改写这段内容。'}{!doc && ' 该资料已从当前知识库移除，以上是当时保存的引用摘录。'}{doc && !resolved.unchanged && ' 资料已更新，此处保留回答时的引用摘录；阅读全文可查看当前版本。'}</div></div><div className="mm-dialog-actions"><Button onClick={onClose}>返回工作区</Button>{doc && <Button variant="primary" onClick={() => onRead(doc)}>阅读全文</Button>}</div></Modal>;
}
function SourceDialog({ source, onClose }) {
  return <Modal title={source.example ? '文件信息' : '查看原文'} description={source.name} drawer onClose={onClose}><div className="mm-dialog-body"><div className="mm-evidence-meta"><span>{source.type}</span><Status state={source.state}>{source.example&&source.state==='ready'?'已整理':undefined}</Status></div><SourceAgentInfo source={source} />{source.content ? <><p className="mm-caption">{source.providedText ? '以下是手动补充的文本。' : '以下是你添加的文件正文。'}</p><pre className="mm-source-original">{source.content}</pre></> : <div className="mm-notice">{source.example ? '当前仅有文件信息，未保存附件正文。可阅读相关知识页面，或添加文本资料。' : source.reason || '这份资料还没有可显示的正文。整理完成后可以在这里查看。'}</div>}</div></Modal>;
}
export function SourceAgentInfo({ source }) {
  if (!source.agentRules) return null;
  const rules = source.agentRules;
  return <details className="mm-source-agent-info"><ActionSummary>本次智能体：{methodLabel(source.method||rules.id,source.agentName||rules.name)}</ActionSummary><dl>{[['适用场景', rules.scenario], ['重点关注', rules.direction], ['整理策略', rules.strategy], ['其他要求', rules.requirements], ['重点关键词', rules.anchors]].filter(([,value]) => value).map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p className="mm-caption">已保存添加资料时的规则。当前按段落整理，在线 AI 尚未连接。</p></details>;
}
export function SupplementDialog({ source, onClose, onSave }) {
  const [text, setText] = useState(source.content || '');
  return <Modal title="补充文本并继续整理" description={source.name} onClose={onClose}><form onSubmit={e => { e.preventDefault(); if (text.trim()) onSave(text.trim()); }}><div className="mm-dialog-body mm-form-stack"><div className="mm-notice">{source.reason}</div><SourceAgentInfo source={source} /><label>资料正文或摘录<textarea value={text} onChange={e => setText(e.target.value)} maxLength={TEXT_LIMIT} rows={10} placeholder="粘贴你有权使用的正文或摘录，整理后可阅读和提问。" required autoFocus /></label><small className="mm-caption">引用会明确标为“补充文本”，不会伪装成已解析的附件原文。</small></div><div className="mm-dialog-actions"><Button onClick={onClose}>取消</Button><Button type="submit" variant="primary" disabled={!text.trim()}>保存并整理</Button></div></form></Modal>;
}
function SettingsDialog({ library, onClose, onSave, onDelete }) {
  const [name, setName] = useState(library.name), [description, setDescription] = useState(library.description || '');
  return <Modal title="知识库设置" onClose={onClose}><form onSubmit={e => { e.preventDefault(); if (name.trim()) onSave(name.trim(), description.trim()); }}><div className="mm-dialog-body mm-form-stack"><label>知识库名称<input value={name} onChange={e => setName(e.target.value)} maxLength={60} required /></label><label>说明<textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={300} rows={3} /></label><div className="mm-danger-zone"><div><strong>移除知识库</strong><p>从列表隐藏，保留正文和记录。</p></div><Button variant="danger" onClick={onDelete}>移除</Button></div></div><div className="mm-dialog-actions"><Button onClick={onClose}>取消</Button><Button type="submit" variant="primary" disabled={!name.trim()}>保存修改</Button></div></form></Modal>;
}

