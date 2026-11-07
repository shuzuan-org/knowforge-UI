import { ActionButton, ActionLink, ActionIcon } from './ActionControls.jsx';
import { catalogOutline, plainDocumentHeadings } from './catalog-outline-model.mjs';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button, Empty, Icon } from './workbench-components.jsx';
import { FeatureHint } from './FeatureHint.jsx';
import './library-catalog.css';

export function LibraryCatalog({ library, docs, selected, active, search, onSearch, onOpen, onRead, headingAction, embedded=false, hideHeading=false, topic: controlledTopic='', onTopicChange, position, expanded={}, onExpandedChange, onHeading, activeHeading }) {
  const [localTopic, setLocalTopic] = useState('');
  const topic=onTopicChange?controlledTopic:localTopic, setTopic=onTopicChange||setLocalTopic;
  const ref = useRef(null), list = useRef(null), localScroll = useRef(0);
  const outlineCache = useRef(new Map());
  const headingGroupId=React.useId();
  function outline(doc) {
    const cached=outlineCache.current.get(doc.id);
    if(cached && cached.html===doc.html && cached.paragraphs===doc.paragraphs && cached.title===doc.title)return cached.entries;
    const headings=doc.html?[...new DOMParser().parseFromString(doc.html,'text/html').querySelectorAll('h1,h2,h3,h4')].map(node=>({text:node.textContent,level:Number(node.tagName.slice(1))})):plainDocumentHeadings(doc);
    const entries=catalogOutline(headings,doc.title);
    outlineCache.current.set(doc.id,{html:doc.html,paragraphs:doc.paragraphs,title:doc.title,entries});
    return entries;
  }
  const scroll=position||localScroll;
  const topics = [...new Set(docs.map(d => d.category || '未分类'))];
  const currentTopic = topics.includes(topic) ? topic : '';
  const needle = search.trim().toLocaleLowerCase();
  const shown = docs.filter(d => (!currentTopic || (d.category || '未分类') === currentTopic) &&
    (!needle || (d.title + ' ' + (d.category || '')).toLocaleLowerCase().includes(needle)));
  useEffect(() => {
    if (!active || embedded) return;
    const node = ref.current, root = node.closest('.mm-library-view');
    const update = () => node.style.setProperty('--mm-catalog-top', (node.getBoundingClientRect().top + window.scrollY) + 'px');
    const observer = new ResizeObserver(update);
    root.querySelectorAll('.mm-library-heading,.mm-library-tabs').forEach(e => observer.observe(e));
    window.addEventListener('resize', update); update();
    return () => { observer.disconnect(); window.removeEventListener('resize', update); };
  }, [active,embedded]);
  useLayoutEffect(() => { if (active && list.current) list.current.scrollTop = scroll.current; }, [active]);
  function resetPosition() { scroll.current = 0; if (list.current) list.current.scrollTop = 0; }
  function clear() { onSearch(''); setTopic(''); resetPosition(); }
  return <section className={'mm-library-catalog-page'+(embedded?' is-embedded':'')} aria-label="当前知识库的目录" ref={ref}>
    {!hideHeading&&<header className="mm-library-catalog-heading"><div><h2><FeatureHint text="选择文章阅读正文，展开文章可查看章节，点击章节即可定位原文。">目录</FeatureHint></h2></div>{headingAction}{!embedded&&selected && <Button onClick={onRead}>继续阅读</Button>}</header>}
    {docs.length ? <><div className="mm-library-catalog-toolbar"><label className="mm-search"><Icon name="search"/><input aria-label="搜索知识库目录" placeholder="搜索页面名称或主题" value={search} onChange={e => { onSearch(e.target.value); resetPosition(); }}/></label><label className="mm-select-inline">主题<select value={currentTopic} onChange={e => { setTopic(e.target.value); resetPosition(); }}><option value="">全部主题</option>{topics.map(name => <option key={name} value={name}>{name}</option>)}</select></label><span className="mm-sr-only" role="status">找到 {shown.length} 篇匹配内容</span>{(search || currentTopic) && <Button variant="plain" onClick={clear}>清除筛选</Button>}</div>
      <nav className="mm-library-catalog-list" aria-label="知识库所有页面" ref={list} onScroll={e => { if (active) scroll.current = e.currentTarget.scrollTop; }}>
        {shown.length ? <ol>{shown.map((doc, index) => {
          const chapters=outline(doc),isOpen=!!expanded[doc.id],isCurrent=doc.id===selected?.id;
          const chapterId=headingGroupId+'-'+encodeURIComponent(doc.id);
          return <li key={doc.id} className="mm-catalog-branch">
            <div className="mm-catalog-article-row">
              {chapters.length?<button type="button" className="mm-catalog-expand" aria-label={(isOpen?'收起':'展开')+doc.title+'的章节'} aria-expanded={isOpen} aria-controls={chapterId} onClick={()=>onExpandedChange?.(previous=>({...previous,[doc.id]:!previous[doc.id]}))}><ActionIcon name="chevron-right" size={14}/></button>:<span className="mm-catalog-expand-empty" aria-hidden="true"/>}
              <ActionButton icon="file" className="mm-library-catalog-row" aria-current={isCurrent?'page':undefined} onClick={()=>{onExpandedChange?.(previous=>({...previous,[doc.id]:true}));onOpen(doc.id);}}><span className="mm-catalog-title">{doc.title}</span>{(!embedded||doc.category&&doc.category!==doc.title)&&<span className="mm-catalog-topic">{doc.category || '未分类'}</span>}</ActionButton>
            </div>
            {!!chapters.length&&<ol id={chapterId} className="mm-catalog-chapters" aria-label={doc.title+'的章节'} hidden={!isOpen}>{chapters.map(heading=><li key={heading.index}><button type="button" className="mm-catalog-chapter" style={{'--chapter-depth':heading.depth}} aria-current={isCurrent&&activeHeading===heading.index?'location':undefined} onClick={()=>onHeading?.(doc.id,heading.index)}><ActionIcon name="list" size={13}/><span>{heading.text}</span></button></li>)}</ol>}
          </li>;
        })}</ol> : <Empty title="没有匹配的页面" action={<Button onClick={clear}>清除筛选</Button>}>试试其他页面名称或主题。</Empty>}
      </nav></> : <Empty title="还没有可阅读的页面" action={library.isShared ? undefined : <ActionLink className="mm-button mm-button-primary" href={'/upload?library=' + encodeURIComponent(library.id)}>添加资料</ActionLink>}>{library.isShared ? '这份分享的目录只显示分享者提供的内容。' : '添加资料并完成整理后，知识页面会显示在这里。'}</Empty>}
  </section>;
}
