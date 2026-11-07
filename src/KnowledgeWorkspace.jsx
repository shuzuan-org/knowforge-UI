import { ActionLink, ActionSummary, ActionButton } from './ActionControls.jsx';
import { FeatureHint } from './FeatureHint.jsx';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Button, Modal } from './workbench-components.jsx';
import './knowledge-workspace.css';
import { ReaderPanel } from './FeaturePanels.jsx';
import { relatedPages } from './knowledge-map-model.mjs';
import './knowledge-map.css';

export function KnowledgeWorkspace({ active, renderCatalog, catalogRequested, onOpenMap, returnToGlobal, docs, selected, onOpen, onAskCurrent, assistant, assistantOpen, onAssistantOpen, mobilePane, onMobilePane, evidence, onClearEvidence, onInspectEvidence, notify }) {
  const [catalogOpen,setCatalogOpen]=useState(true);
  const [catalogDrawerOpen,setCatalogDrawerOpen]=useState(false);
  const [compactCatalog,setCompactCatalog]=useState(()=>window.matchMedia('(max-width:1180px)').matches);
  useEffect(()=>{const media=window.matchMedia('(max-width:1180px)');const update=()=>{setCompactCatalog(media.matches);setCatalogDrawerOpen(false);};media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
  useEffect(()=>{if(active&&catalogRequested){if(compactCatalog)setCatalogDrawerOpen(true);else setCatalogOpen(true);}},[active,catalogRequested,compactCatalog]);
  useEffect(()=>{if(!active)setCatalogDrawerOpen(false);},[active]);
  function closeCatalog(){setCatalogDrawerOpen(false);requestAnimationFrame(()=>document.getElementById('mm-directory-toggle')?.focus({preventScroll:true}));}
  function selectFromCatalog(id){onOpen(id);if(compactCatalog){setCatalogDrawerOpen(false);onMobilePane('read');requestAnimationFrame(()=>readerRef.current?.focus({preventScroll:true}));}}
  const [readerPanel,setReaderPanel]=useState(null);
  const applicationTrigger=useRef(null);
  const [headingRequest,setHeadingRequest]=useState(null);
  const [activeHeading,setActiveHeading]=useState(-1);
  const articleMarkup=useMemo(()=>({__html:selected.html||''}),[selected.html]);
  const [headings,setHeadings]=useState([]);
  useEffect(()=>{setHeadings([...articleRef.current.querySelectorAll('h1,h2,h3,h4')].map(n=>({text:n.textContent,level:Number(n.tagName.slice(1))})));},[selected.id]);
  function goHeading(index){const n=articleRef.current?.querySelectorAll('h1,h2,h3,h4')[index],reader=readerRef.current;if(n&&reader){n.setAttribute('tabindex','-1');n.focus({preventScroll:true});reader.scrollTop=Math.max(0,reader.scrollTop+n.getBoundingClientRect().top-reader.getBoundingClientRect().top);setActiveHeading(index);}}
  function selectChapter(docId,index){onOpen(docId);if(compactCatalog){setCatalogDrawerOpen(false);onMobilePane('read');}setHeadingRequest({docId,index});}
  function trackHeading(){const top=readerRef.current?.getBoundingClientRect().top||0;let index=-1;articleRef.current?.querySelectorAll('h1,h2,h3,h4').forEach((node,i)=>{if(node.getBoundingClientRect().top<=top+24)index=i;});setActiveHeading(index);}
  useLayoutEffect(()=>{if(!active)return;const frame=requestAnimationFrame(()=>{if(headingRequest?.docId===selected.id){goHeading(headingRequest.index);setHeadingRequest(null);}else trackHeading();});return()=>cancelAnimationFrame(frame);},[selected.id,headingRequest,active]);
  const articleRef = useRef(null);
  const readerRef = useRef(null);
  const readerPosition=useRef({id:selected.id,top:0});
  const workspaceRef = useRef(null);
  const related = relatedPages(docs,selected.id);
  function openMap(){onOpenMap();}
  function openReaderPanel(kind) { setReaderPanel(kind); }
  function closeReaderPanel() { const restore=readerPanel==='applications';setReaderPanel(null);if(restore)requestAnimationFrame(()=>applicationTrigger.current?.focus({preventScroll:true})); }


  useLayoutEffect(() => {
    if(readerPosition.current.id!==selected.id)readerPosition.current={id:selected.id,top:0};
    if(!active)return;
    if(readerRef.current)readerRef.current.scrollTop=readerPosition.current.top;
  },[selected.id,active]);
  useEffect(() => {
    if(!active)return;
    const node = workspaceRef.current;
    const update = () => node?.style.setProperty('--mm-workspace-top', (node.getBoundingClientRect().top + window.scrollY) + 'px');
    const observer = new ResizeObserver(update);
    const heading = node?.closest('.mm-library-view')?.querySelector('.mm-library-heading');
    if (heading) observer.observe(heading);
    window.addEventListener('resize', update); update();
    return () => { observer.disconnect(); window.removeEventListener('resize', update); };
  }, [active]);

  useEffect(() => {
    const article = articleRef.current;
    article?.querySelectorAll('.mm-evidence-highlight').forEach(node => { node.classList.remove('mm-evidence-highlight'); node.removeAttribute('tabindex'); });
    if (evidence?.docId === selected.id) {
      const target = article?.querySelector('[data-mm-paragraph="' + evidence.paragraphIndex + '"]');
      if (target) {
        target.classList.add('mm-evidence-highlight');
        target.setAttribute('tabindex', '-1');
        if (active && mobilePane === 'read') {
          target.focus({ preventScroll: true });
          target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
      }
    }
  }, [selected.id, evidence, mobilePane]);

  const showAsk = () => { onAssistantOpen(true); onMobilePane('ask'); };
  const directoryToggle=<Button id="mm-directory-toggle" className="mm-directory-toggle" variant="plain" aria-label={compactCatalog?'打开目录':catalogOpen?'收起目录':'展开目录'} aria-expanded={compactCatalog?catalogDrawerOpen:catalogOpen} aria-controls={compactCatalog?'mm-directory-drawer':'mm-inline-directory'} onClick={()=>{if(compactCatalog)setCatalogDrawerOpen(true);else{setCatalogOpen(!catalogOpen);requestAnimationFrame(()=>document.getElementById('mm-directory-toggle')?.focus({preventScroll:true}));}}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M9 4.5v15"/></svg></Button>;
  return <div ref={workspaceRef} className={'mm-knowledge-workspace' + (!assistantOpen ? ' is-assistant-hidden' : '') + ' mobile-pane-' + mobilePane}>
    <div className="mm-reading-toolbar" role="toolbar" aria-label="阅读操作">
      {(compactCatalog||!catalogOpen||returnToGlobal)&&<div className="mm-reading-meta">{(compactCatalog||!catalogOpen)&&directoryToggle}{returnToGlobal&&<ActionLink className="mm-button mm-button-plain mm-global-return" href={returnToGlobal}>‹ 返回全局问答</ActionLink>}</div>}
      <div className="mm-knowledge-mobile-switch" role="group" aria-label="阅读与问答面板"><Button id="mm-read-pane" variant="plain" aria-pressed={mobilePane === 'read'} onClick={() => onMobilePane('read')}>阅读</Button><Button variant="plain" aria-pressed={mobilePane === 'ask'} onClick={showAsk}>问答</Button></div>
      <div className="mm-reading-actions">
        <Button variant="plain" onClick={()=>openReaderPanel('relations')}>相关内容{related.length>0&&<span className="mm-related-count">{related.length}</span>}</Button>
        <Button variant="plain" onClick={event=>{applicationTrigger.current=event.currentTarget;openReaderPanel('applications');}}>应用知识库</Button>
      </div>
      {!assistantOpen&&<Button id="mm-open-assistant" className="mm-open-assistant" variant="plain" aria-controls="mm-library-assistant" aria-expanded={false} onClick={()=>{showAsk();requestAnimationFrame(()=>document.getElementById('mm-question')?.focus({preventScroll:true}));}}>打开问答</Button>}
    </div>
    <div className={'mm-reading-body'+(!catalogOpen||compactCatalog?' is-directory-hidden':'')}>
      {!compactCatalog&&<aside id="mm-inline-directory" className="mm-inline-directory" aria-label="目录" hidden={!catalogOpen}>{renderCatalog({active:active&&catalogOpen,onSelect:selectFromCatalog,onSelectHeading:selectChapter,activeHeading,inDrawer:false,headingAction:catalogOpen?directoryToggle:null})}</aside>}
    <div className="mm-knowledge-columns">
      <section className="mm-knowledge-reader" aria-label="阅读知识内容" tabIndex={-1} ref={readerRef} onScroll={e=>{if(active){readerPosition.current={id:selected.id,top:e.currentTarget.scrollTop};trackHeading();}}}>

        {evidence?.docId === selected.id && <div className="mm-inline-evidence" role="status"><div><strong>引用出处 · 第 {evidence.paragraphIndex + 1} 段</strong><span>已在正文中高亮，问答记录保留，可随时继续提问。</span></div><div><Button variant="plain" onClick={onInspectEvidence}>引用详情</Button><Button variant="plain" className="mm-evidence-return" onClick={showAsk}>返回问答</Button><Button variant="plain" aria-label="清除引用高亮" onClick={onClearEvidence}>×</Button></div></div>}
        <article className="mm-article markdown-body" ref={articleRef} onClick={e => {
          const anchor = e.target.closest('a'); if (!anchor) return;
          const href = anchor.getAttribute('href') || ''; const targetDoc=docs.find(d=>d.title===anchor.textContent.trim());if(targetDoc){e.preventDefault();onOpen(targetDoc.id);return;} if (anchor.dataset.sourcePath) { e.preventDefault();notify('引用原始文件：'+anchor.dataset.sourcePath+'。可在全部资料中查看文件信息，当前未保存附件正文。');return; } if (href.startsWith('#')) return;
          e.preventDefault(); const found = docs.find(d => d.title === anchor.textContent.trim());
          if (found) onOpen(found.id); else notify('暂未找到此链接对应的内容。');
        }}>{selected.html ? <div dangerouslySetInnerHTML={articleMarkup} /> : <><h1>{selected.title}</h1><div className="mm-plain-document"><TextBlocks paragraphs={selected.paragraphs} /></div></>}</article>
        {selected.citations?.length>0&&<details className="mm-generation-sources"><ActionSummary>本提要引用 {selected.citations.length} 篇资料</ActionSummary>{selected.citations.map(c=><Button key={c.docId} onClick={()=>onOpen(c.docId)}>{c.title}</Button>)}</details>}
        <section className="mm-reading-related" aria-label="本页相关内容"><div className="mm-reading-related-heading"><h2><FeatureHint text="从当前知识中的共同主题、知识点和引用来源继续阅读，每条结果会标明关联理由。">相关内容</FeatureHint></h2><Button variant="plain" onClick={()=>setReaderPanel('relations')}>查看全部{related.length>0?' · '+related.length:''}</Button></div>{related.slice(0,3).map(item=><ActionButton className="mm-related-page" key={item.doc.id} onClick={()=>onOpen(item.doc.id)}><strong>{item.doc.title}</strong><span>{item.reasons.slice(0,2).join('；')}</span><small>阅读 →</small></ActionButton>)}{!related.length&&<p className="mm-caption">暂未发现相关内容，后续有共同主题、知识点或引用来源时会显示在这里。</p>}<Button variant="plain" onClick={openMap}>在知识图谱中浏览</Button></section>
        <div className="mm-reading-footer"><Button variant="plain" onClick={onAskCurrent}>就当前页面提问</Button></div>
      </section>
      <aside id="mm-library-assistant" className="mm-knowledge-assistant" aria-label="知识问答" hidden={!assistantOpen}>{assistant}</aside>
    </div>
    </div>
    {compactCatalog&&catalogDrawerOpen&&<Modal title="目录" drawer onClose={closeCatalog}><div id="mm-directory-drawer" className="mm-dialog-body mm-directory-drawer-body">{renderCatalog({active:true,onSelect:selectFromCatalog,onSelectHeading:selectChapter,activeHeading,inDrawer:true})}</div></Modal>}
    {readerPanel&&<ReaderPanel kind={readerPanel} doc={selected} docs={docs} onOpen={onOpen} onMap={()=>{setReaderPanel(null);openMap();}} onClose={closeReaderPanel} headings={headings} onHeading={goHeading}/>}


  </div>;
}

function TextBlocks({ paragraphs }) {
  return paragraphs.map((text, i) => {
    const heading = /^#{1,6}\s+([^\n]+)$/.exec(text);
    if (heading) return <h2 key={i} data-mm-paragraph={i}>{heading[1]}</h2>;
    const rows = text.split('\n');
    if (rows.every(row => /^[-*]\s+/.test(row))) return <ul key={i} data-mm-paragraph={i}>{rows.map((row, n) => <li key={n}>{row.replace(/^[-*]\s+/, '')}</li>)}</ul>;
    return <p key={i} data-mm-paragraph={i}>{text}</p>;
  });
}
