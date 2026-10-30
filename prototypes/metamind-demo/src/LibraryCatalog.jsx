import { ActionButton, ActionLink } from './ActionControls.jsx';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button, Empty, Icon } from './workbench-components.jsx';
import { FeatureHint } from './FeatureHint.jsx';
import './library-catalog.css';

export function LibraryCatalog({ library, docs, selected, active, search, onSearch, onOpen, onRead, headingAction, embedded=false, hideHeading=false, topic: controlledTopic='', onTopicChange, position }) {
  const [localTopic, setLocalTopic] = useState('');
  const topic=onTopicChange?controlledTopic:localTopic, setTopic=onTopicChange||setLocalTopic;
  const ref = useRef(null), list = useRef(null), localScroll = useRef(0);
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
    {!hideHeading&&<header className="mm-library-catalog-heading"><div><h2><FeatureHint text="这里列出当前知识库的全部可读页面。点选目录即可在旁边阅读正文；文章内的章节跳转仍使用“本页目录”。">目录</FeatureHint></h2></div>{headingAction}{!embedded&&selected && <Button onClick={onRead}>继续阅读</Button>}</header>}
    {docs.length ? <><div className="mm-library-catalog-toolbar"><label className="mm-search"><Icon name="search"/><input aria-label="搜索知识库目录" placeholder="搜索页面名称或主题" value={search} onChange={e => { onSearch(e.target.value); resetPosition(); }}/></label><label className="mm-select-inline">主题<select value={currentTopic} onChange={e => { setTopic(e.target.value); resetPosition(); }}><option value="">全部主题</option>{topics.map(name => <option key={name} value={name}>{name}</option>)}</select></label><span className="mm-sr-only" role="status">找到 {shown.length} 篇匹配内容</span>{(search || currentTopic) && <Button variant="plain" onClick={clear}>清除筛选</Button>}</div>
      <nav className="mm-library-catalog-list" aria-label="知识库所有页面" ref={list} onScroll={e => { if (active) scroll.current = e.currentTarget.scrollTop; }}>
        {shown.length ? <ol>{shown.map((doc, index) => <li key={doc.id}><ActionButton className="mm-library-catalog-row" aria-current={doc.id === selected?.id ? 'page' : undefined} onClick={() => onOpen(doc.id)}><span className="mm-catalog-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><span className="mm-catalog-title">{doc.title}</span>{(!embedded||doc.category&&doc.category!==doc.title)&&<span className="mm-catalog-topic">{doc.category || '未分类'}</span>}<span className="mm-catalog-read">{doc.id === selected?.id ? '正在阅读' : '阅读'} <span aria-hidden="true">→</span></span></ActionButton></li>)}</ol> : <Empty title="没有匹配的页面" action={<Button onClick={clear}>清除筛选</Button>}>试试其他页面名称或主题。</Empty>}
      </nav></> : <Empty title="还没有可阅读的页面" action={library.isShared ? undefined : <ActionLink className="mm-button mm-button-primary" href={'/upload?library=' + encodeURIComponent(library.id)}>添加资料</ActionLink>}>{library.isShared ? '这份分享的目录只显示分享者提供的内容。' : '添加资料并完成整理后，知识页面会显示在这里。'}</Empty>}
  </section>;
}
