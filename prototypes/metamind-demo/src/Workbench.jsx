import { ActionButton, ActionLink } from './ActionControls.jsx';
import {GuideView} from './GuideView.jsx';
import {AccountMenu,AccountPanel,useAccountAppearance,useAccountPreview} from './AccountMenu.jsx';
import React, { useState, useEffect } from 'react';
import { HomePage } from './HomePage.jsx';
import seed from './library-seed.json';
import packageSeed from './package-seed.json';
import { migrateAdvanced } from './advanced-model.mjs';
import { MethodManager } from './AdvancedViews.jsx';
import { finishSource, migrateExisting, libraryPath } from './workbench-model.mjs';
import { exampleDocuments, libraryDocuments } from './workbench-docs.js';
import { migrateFeatures, appendActivity, evaluateLibrary } from './feature-model.mjs';
import { GlobalTools } from './FeaturePanels.jsx';
import { ImportPage } from './ImportPage.jsx';
import { resolveImportTarget, prepareImportBatch, applyImportBatch } from './import-model.mjs';
import './features.css';
import { UnifiedKnowledge } from './UnifiedKnowledge.jsx';
import { buildKnowledgeItems, migrateUnifiedKnowledge, oldPackageDestination, sharedKnowledgeId, sharedDocumentId } from './knowledge-model.mjs';
import { Button, Icon, Modal, Empty, Status } from './workbench-components.jsx';
import { LibraryView } from './LibraryView.jsx';
import { RecentKnowledgeNav } from './RecentKnowledgeNav.jsx';
import { FilesView } from './FilesView.jsx';
import './workbench.css';
import './advanced.css';
import './files.css';
import './unified-knowledge.css';
import './global-ask.css';
import './organizing-methods.css';
import './form-focus.css';
import {migrateGlobalAsk} from './global-ask-model.mjs';
import {knowledgeMapDestination} from './knowledge-map-model.mjs';

const STORAGE = 'metamind-workbench-v2';
function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function initialState() {
  const stored = read(STORAGE, null);
  const base = stored?.version === 2 ? stored : { version: 2, ...migrateExisting(read('mirror-scopes', []), read('mirror-files', []), seed.libraries[0].id) };
  return migrateGlobalAsk(migrateUnifiedKnowledge(migrateFeatures(migrateAdvanced(base, read('mirror-agents', []), packageSeed))));
}
const newId = prefix => prefix + '-' + crypto.randomUUID();
const knownPath = path => path === '/' || ['/workspace', '/upload', '/sources', '/graph', '/agents', '/packages', '/guide'].includes(path) || path.startsWith('/library/');

export function App() {
  const [route, setRoute] = useState(() => location.pathname + location.search);
  const [state, setRawState] = useState(initialState);
  function setState(update) { setRawState(previous => {
    const changed = typeof update === 'function' ? update(previous) : update;
    const next = changed.receivedShares !== previous.receivedShares ? migrateUnifiedKnowledge(changed) : changed;
    if(next.activity !== previous.activity) return next;
    let label = '', libraryId = '';
    if(next.sources !== previous.sources) { const added = next.sources.filter(x=>!previous.sources.some(y=>y.id===x.id)); const changed = next.sources.filter(x=>previous.sources.some(y=>y.id===x.id && JSON.stringify(y)!==JSON.stringify(x))); libraryId = added[0]?.libraryId || changed[0]?.libraryId || ''; label = added.length ? '添加资料' : changed.some(x=>x.trashedAt) ? '资料移到回收站' : changed.some(x=>previous.sources.find(y=>y.id===x.id)?.trashedAt) ? '恢复资料' : changed.some(x=>x.state==='ready') ? '正文整理完成' : '更新资料状态'; }
    else if(next.customLibraries !== previous.customLibraries) label='新建知识库';
    else if(next.edits !== previous.edits) label='更新知识库设置';
    else if(next.agentProfiles !== previous.agentProfiles) label='更新智能体';
    else if(next.resourcePackages !== previous.resourcePackages) label='更新资源包';
    return label ? appendActivity(next,label,libraryId) : next;
  }); }
  const [globalTool,setGlobalTool] = useState(null);
  const [collapsed,setCollapsed] = useState(()=>read('metamind-nav-collapsed',false));
  const [navMotionReady,setNavMotionReady] = useState(false);
  const [toast, setToast] = useState('');
  const [storageError, setStorageError] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [recentReadRequest, setRecentReadRequest] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const url = new URL(route, location.origin);
  const path = url.pathname;
  const legacy = path === '/';
  const [appearance,setAppearance]=useAccountAppearance(legacy);
  const [accountPreview,setAccountPreview]=useAccountPreview();
  const advancedTitle = ({ '/graph': '知识图谱', '/agents': '智能体', '/sources': '全部资料', '/guide': '使用说明' })[path];
  const savedLibraries = [...seed.libraries, ...state.customLibraries].map(l=>({...l,...(state.edits[l.id]||{})})).filter(l=>!state.hiddenLibraries.includes(l.id)&&!state.deletedLibraries.includes(l.id)).map(l=>({...l,generation:state.generations[l.id],importedDocuments:state.importedDocuments[l.id]||[]}));
  const knowledgeItems = buildKnowledgeItems(savedLibraries,state);
  const ownedLibraries = knowledgeItems.filter(l=>!l.isShared);
  const allLibraries = knowledgeItems.filter(l=>l.available!==false);
  const activeSources = state.sources.filter(source => !source.trashedAt);
  const libraryId = path.startsWith('/library/') ? decodeURIComponent(path.slice(9)) : '';
  const library = knowledgeItems.find(l => l.id === libraryId);
  const legacyReceipt = state.receivedShares.find(r=>r.libraryIds?.includes(libraryId));
  const notify = message => setToast(message);
  function openAccount(kind){setGlobalTool('account-'+kind);setMobileNav(false);}
  function closeAccount(){
    setGlobalTool(null);
    requestAnimationFrame(()=>document.querySelector(window.matchMedia('(max-width:900px)').matches?'.mm-mobile-menu':'.mm-sidebar .mm-account-trigger')?.focus({preventScroll:true}));
  }
  function loginPreview(){setAccountPreview(true);notify('已进入演示账号');closeAccount();}
  function logoutPreview(){setAccountPreview(false);notify('已退出演示账号');closeAccount();}
  function navigate(href, replace = false, scroll = true) {
    const next = new URL(href, location.origin);
    if (replace) history.replaceState({}, '', next.pathname + next.search + next.hash);
    else history.pushState({}, '', next.pathname + next.search + next.hash);
    setRoute(next.pathname + next.search);
    setMobileNav(false);
    if (scroll) window.scrollTo({ top: 0, behavior: 'instant' });
  }
  useEffect(() => {
    const onPop = () => { setRoute(location.pathname + location.search); setMobileNav(false); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  useEffect(() => {
    const capture = event => {
      const target = event.target.closest?.('a,button');
      if (!target) return;
      let href;
      if (target.tagName === 'A') {
        const raw = target.getAttribute('href') || '';
        if (!raw || raw.startsWith('#') || target.target === '_blank' || event.metaKey || event.ctrlKey) return;
        const dest = new URL(raw, location.origin);
        if (dest.origin !== location.origin || !knownPath(dest.pathname)) return;
        if (target.closest('.mm-recent-nav') && dest.pathname.startsWith('/library/')) {
          if (event.shiftKey || event.altKey) return;
          setRecentReadRequest(value => value + 1);
        }
        href = dest.pathname + dest.search + dest.hash;
      } else if (legacy) {
        if (target.dataset.go === 'workspace') href = '/workspace';
        else if (target.dataset.scope) href = libraryPath(target.dataset.scope);
        else if (target.dataset.doc || target.dataset.openDoc) href = libraryPath(seed.libraries[0].id, 'pages', target.dataset.doc || target.dataset.openDoc);
        else if (target.dataset.act === 'home') href = '/';
      }
      if (href) { event.preventDefault(); event.stopPropagation(); const sameGuide=location.pathname==='/guide'&&new URL(href,location.origin).pathname==='/guide';navigate(href,false,!sameGuide); }
    };
    document.addEventListener('click', capture, true);
    return () => document.removeEventListener('click', capture, true);
  }, [legacy]);
  useEffect(() => {
    if (legacy) return;
    document.body.className = 'mm-workbench-body';
    document.title = (library?.name || advancedTitle || (path === '/upload' ? '添加资料' : '知识库')) + ' · MetaMind';
  }, [route, legacy, library?.name]);
  useEffect(() => {
    try { localStorage.setItem(STORAGE, JSON.stringify(state)); setStorageError(false); }
    catch { setStorageError(true); }
  }, [state]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 4200); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => {
    const next = state.sources.filter(s => s.state === 'processing' && !s.trashedAt).slice(0,8);
    if (!next.length) return;
    const timer = setTimeout(() => setState(s => ({ ...s, sources: s.sources.map(item => next.some(n=>n.id===item.id) && item.state === 'processing' && !item.trashedAt ? finishSource(item) : item) })), 150);
    return () => clearTimeout(timer);
  }, [state.sources]);
  useEffect(() => {
    if (!libraryId || !library || library.available===false) return;
    setState(s => ({ ...s, recent: [libraryId, ...s.recent.filter(id => id !== libraryId)] }));
  }, [libraryId]);
  useEffect(() => {
    if (path !== '/workspace') return;
    if (url.searchParams.has('scope')) navigate(libraryPath(url.searchParams.get('scope')), true);
    else if (url.searchParams.has('doc')) navigate(libraryPath(seed.libraries[0].id, 'pages', url.searchParams.get('doc')), true);
    else if (url.searchParams.has('new')) navigate('/upload?new=1', true);
  }, [route]);
  useEffect(()=>{
    if(path==='/graph')navigate(knowledgeMapDestination(url,allLibraries),true,false);
    else if(path==='/packages')navigate(oldPackageDestination(url),true,false);
    else if(legacyReceipt){const id=sharedKnowledgeId(legacyReceipt.id);const doc=url.searchParams.get('doc');navigate(libraryPath(id,'knowledge',doc?sharedDocumentId(libraryId,doc):''),true,false);}
  },[route]);
  function createLibrary(name, description = '') {
    const item = { id: newId('local'), name: name.trim(), description: description.trim(), totalFiles: 0, readyFiles: 0, pendingFiles: 0, example: false };
    setState(s => ({ ...s, customLibraries: [...s.customLibraries, item] }));
    return item;
  }
  function importSources(targetId, newLibrary, pending) {
    const batch = prepareImportBatch(ownedLibraries, targetId, newLibrary, pending);
    setState(s => applyImportBatch(s, batch));
    navigate(libraryPath(batch.library.id, 'sources') + '&batch=' + batch.batchId);
    notify('已添加 ' + batch.sources.length + ' 份资料，正在整理');
  }
  const recent = [...new Set((state.recent.length?state.recent:[seed.libraries[0].id]).map(id=>{const receipt=state.receivedShares.find(r=>r.libraryIds?.includes(id));return receipt?sharedKnowledgeId(receipt.id):id;}))].map(id=>allLibraries.find(l=>l.id===id)).filter(Boolean);
  const nav = <><Button className="mm-sidebar-collapse" onClick={()=>{setNavMotionReady(true);setCollapsed(v=>{try{localStorage.setItem('metamind-nav-collapsed',JSON.stringify(!v));}catch{}return !v;});}} aria-label={collapsed?'展开导航':'收起导航'} aria-expanded={!collapsed} aria-controls="mm-primary-sidebar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg></Button><a className="mm-logo" href="/" aria-label="MetaMind 产品首页"><img src="/static/img/brand/metamind-logo-h.svg" alt="MetaMind" /><small className="mm-brand-tagline">知识，让工作更清晰</small></a>
    <nav aria-label="主导航" className="mm-main-nav"><a href="/workspace" className={path === '/workspace' || library ? 'active' : ''}><Icon name="archive" />知识库</a><a href="/upload" className={path === '/upload' ? 'active' : ''}><Icon name="upload" />添加资料</a><a href="/agents" className={'mm-nav-agents'+(path==='/agents'?' active':'')} aria-current={path==='/agents'?'page':undefined}><Icon name="bot" />智能体</a></nav>
    <div className="mm-nav-label">最近访问</div><RecentKnowledgeNav libraries={recent} sources={activeSources} state={state} currentLibraryId={libraryId} route={url} readRequest={recentReadRequest}/>
    <div className="mm-sidebar-bottom"><ActionButton onClick={()=>{setGlobalTool('activity');setMobileNav(false);}}>最近操作</ActionButton><ActionLink className="mm-guide-link" href="/guide" aria-current={path==='/guide'?'page':undefined}>使用说明</ActionLink><AccountMenu preview={accountPreview} onLogout={logoutPreview} onOpen={openAccount}/></div></>;
  if (legacy) return <HomePage key={path} />;
  return <div className={"mm-app"+(collapsed?" mm-nav-collapsed":"")+(navMotionReady?" mm-nav-motion":"")}><a className="mm-skip" href="#mm-main">跳到主要内容</a><aside className="mm-sidebar" id="mm-primary-sidebar">{nav}</aside>
    <div className="mm-main-shell">
      <main id="mm-main" className="mm-main" tabIndex="-1">
        <div className="mm-mobile-nav-entry"><Button className="mm-mobile-menu" onClick={() => setMobileNav(true)} aria-label="打开导航">导航</Button></div>
        {storageError && <div className="mm-notice mm-notice-warning" role="alert">浏览器存储空间不足，新增内容暂时无法保留。请减少较大的文本资料后重试。</div>}
        {path === '/workspace' && <UnifiedKnowledge items={knowledgeItems} sources={activeSources} recent={state.recent} onCreate={()=>setCreateOpen(true)} route={url} navigate={navigate} state={state} setState={setState} notify={notify}/>}
        {path === '/upload' && <ImportPage key={route} libraries={ownedLibraries} initialLibrary={resolveImportTarget(ownedLibraries,{explicitId:url.searchParams.get('library'),recent:state.recent,lastAddedId:state.lastImportLibraryId,sources:activeSources})} recent={state.recent} initialAgent={url.searchParams.get('method')||url.searchParams.get('agent')} initialSettings={url.searchParams.has('settings')||url.searchParams.has('methods')} initialManager={url.searchParams.has('methods')} initialMethodTab={url.searchParams.get('methodTab')} agentProfiles={state.agentProfiles} sources={activeSources} setState={setState} notify={notify} onImport={importSources} onClose={()=>navigate('/workspace')} />}
        {path === '/guide' && <GuideView items={knowledgeItems} sources={activeSources} state={state} setState={setState} notify={notify} route={url} navigate={navigate}/>}
        {path === '/agents' && <MethodManager embedded profiles={state.agentProfiles} libraries={ownedLibraries} sources={activeSources} setState={setState} notify={notify} initialTab={url.searchParams.get('tab')||'templates'} currentId={url.searchParams.get('agent')||undefined} onClose={()=>navigate('/workspace')} onChoose={agent=>{const params=new URLSearchParams({agent:agent.id,settings:'1'});const context=ownedLibraries.find(l=>l.id===url.searchParams.get('library'));if(context)params.set('library',context.id);navigate('/upload?'+params);}}/>}
        {path === '/sources' && <FilesView libraries={ownedLibraries} sources={state.sources} exampleSources={seed.sources.filter(s=>!allLibraries.find(l=>l.id===s.libraryId)?.contentCleared)} route={url} navigate={navigate} setState={setState} notify={notify} />}


        {library && library.available!==false && <LibraryView key={library.id} library={library} route={url} navigate={navigate} sources={activeSources} exampleSources={seed.sources.filter(s=>!allLibraries.find(l=>l.id===s.libraryId)?.contentCleared)} firstLibraryId={seed.libraries[0].id} chats={state.chats[library.id] || []} state={state} setState={setState} notify={notify} recentReadRequest={recentReadRequest} />}
        {library?.available===false&&<Empty title={library.revoked?'这份分享已撤销':'已取消接收这份内容'} action={<ActionLink className="mm-button" href="/workspace?filter=shared">返回知识库</ActionLink>}>你可以在“与我共享”查看来源和接收状态。</Empty>}
        {path.startsWith('/library/') && !library && !legacyReceipt && <Empty title="没有找到这份知识" action={<ActionLink className="mm-button mm-button-primary" href="/workspace">返回知识库</ActionLink>}>它可能已在当前浏览器中移除。</Empty>}
      </main>
    </div>
    {mobileNav && <Modal title="导航" onClose={() => setMobileNav(false)}><div className="mm-mobile-nav">{nav}</div></Modal>}
    {globalTool?.startsWith('account-')&&<AccountPanel key={globalTool} kind={globalTool.slice(8)} preview={accountPreview} onOpen={openAccount} onLogin={loginPreview} onLogout={logoutPreview} appearance={appearance} onAppearance={setAppearance} onClose={closeAccount}/>}
    {globalTool && !globalTool.startsWith('account-') && <GlobalTools kind={globalTool} libraries={allLibraries} sources={activeSources} state={state} setState={setState} onClose={()=>setGlobalTool(null)} navigate={navigate} notify={notify}/>}
    {createOpen && <CreateLibrary onClose={() => setCreateOpen(false)} onCreate={(name, description) => { const l = createLibrary(name, description); setCreateOpen(false); navigate(libraryPath(l.id)); notify('知识库已创建，可以先添加一篇笔记'); }} />}
    {toast && <div className="mm-toast" role="status">{toast}</div>}
  </div>;
}

function CreateLibrary({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  return <Modal title="新建知识库" description="一篇笔记也可以开始，内容可以随时补充。" onClose={onClose}><form onSubmit={e => { e.preventDefault(); if (name.trim()) onCreate(name, description); }}><div className="mm-dialog-body mm-form-stack"><label>知识库名称 <span className="mm-required">必填</span><input value={name} onChange={e => setName(e.target.value)} placeholder="例如：品牌设计规范" maxLength={60} autoFocus required /></label><label>说明 <span className="mm-subtle">选填</span><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="这个知识库用于保存哪些资料？" rows={3} maxLength={300} /></label></div><div className="mm-dialog-actions"><Button onClick={onClose}>取消</Button><Button variant="primary" type="submit" disabled={!name.trim()}>创建知识库</Button></div></form></Modal>;
}
