import { ActionLink } from './ActionControls.jsx';
import { FeatureHint } from './FeatureHint.jsx';
import React, { useEffect, useRef } from 'react';
import { Button, Empty } from './workbench-components.jsx';
import { GraphView } from './AdvancedViews.jsx';

export function LibraryKnowledgeMap({ library, docs, firstLibraryId, selected, active, onOpen, onAsk, onRead }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!active) return;
    const node=ref.current;
    const update=()=>node?.style.setProperty('--mm-map-top',(node.getBoundingClientRect().top+window.scrollY)+'px');
    const heading=node?.closest('.mm-library-view')?.querySelector('.mm-library-heading');
    const observer=new ResizeObserver(update);
    if(heading)observer.observe(heading);
    window.addEventListener('resize',update);update();
    return()=>{observer.disconnect();window.removeEventListener('resize',update);};
  },[active,docs.length]);
  if(!docs.length)return <Empty title="还没有可展示的知识页面" action={library.isShared?<Button onClick={onRead}>返回正文</Button>:<ActionLink className="mm-button mm-button-primary" href={'/upload?library='+encodeURIComponent(library.id)}>添加资料</ActionLink>}>有可阅读的内容后，可以在这里按主题浏览和探索关联。</Empty>;
  const route=new URL('/graph?doc='+encodeURIComponent(selected.id),location.origin);
  return <section className="mm-library-map-page" aria-label="当前知识库的知识图谱" ref={ref}>
    <div className="mm-library-map-heading"><div><strong><FeatureHint text="按主题浏览，发现相关内容。选择主题展开页面，可阅读原文、围绕页面提问或切换查看内容关联。">按主题浏览</FeatureHint></strong><p>当前知识 · {library.name}</p></div><Button onClick={onRead}>返回正在阅读</Button></div>
    <div className="mm-library-map-content"><GraphView embedded libraries={[library]} documents={docs} sources={[]} firstLibraryId={firstLibraryId} route={route} onOpen={onOpen} onAsk={onAsk}/></div>
  </section>;
}
