import {useEffect,useMemo,useRef,useState} from 'react';
import {ArrowLeft,BookOpen,Maximize2,Minus,Plus,RotateCcw,Search,Waypoints,X} from 'lucide-react';
import {buildKnowledgeNetwork,layoutKnowledgeNetwork} from '../knowledge-network';
import '../knowledge-network.css';
const short=text=>Array.from(text).length>15?Array.from(text).slice(0,14).join('')+'…':text;

export function KnowledgeGraph({library,model,selected,onRead,onReadPoint}){
  const [mode,setMode]=useState(()=>model.knowledgePoints.length?'points':'topics'),[topic,setTopic]=useState(''),[center,setCenter]=useState(selected?.id||model.pages[0]?.id),[query,setQuery]=useState(''),[zoom,setZoom]=useState(1),[pan,setPan]=useState({x:0,y:0}),[hover,setHover]=useState(''),[focus,setFocus]=useState(''),[dragging,setDragging]=useState(false),[size,setSize]=useState({width:1000,height:420});
  const canvas=useRef(null),svg=useRef(null),drag=useRef(null);
  useEffect(()=>{const element=canvas.current;if(!element)return;const measure=()=>{const width=element.clientWidth,height=element.clientHeight;if(!width||!height)return;setSize(current=>current.width===width&&current.height===height?current:{width,height});};measure();const observer=new ResizeObserver(measure);observer.observe(element);return()=>observer.disconnect();},[model.pages.length]);
  const network=useMemo(()=>buildKnowledgeNetwork(model,{mode,topic,center,query}),[model,mode,topic,center,query]);
  const nodes=useMemo(()=>layoutKnowledgeNetwork(network,size.width,size.height),[network,size]),byId=useMemo(()=>new Map(nodes.map(node=>[node.id,node])),[nodes]);
  const active=focus||hover,activeId=byId.has(active)?active:'',neighbors=useMemo(()=>{const set=new Set();for(const link of network.links){if(link.from===activeId)set.add(link.to);if(link.to===activeId)set.add(link.from);}return set;},[network,activeId]);
  function resetView(){setZoom(1);setPan({x:0,y:0});}
  function changeView(action){action();setHover('');setFocus('');resetView();}
  function openNode(node){
    if(focus!==node.id){
      setFocus(node.id);
      return;
    }
    if(node.point)onReadPoint(node.point);
    else if(node.topic)changeView(()=>setTopic(node.topic));
    else onRead(node.page);
  }
  function activate(event,node){if(event.key==='Enter'||event.key===' '){event.preventDefault();if(!event.repeat)openNode(node);}}
  function pointerDown(event){if(event.button!==0||event.target.closest('[data-network-node]'))return;drag.current={x:event.clientX,y:event.clientY,pan,moved:false};event.currentTarget.setPointerCapture(event.pointerId);}
  function pointerMove(event){if(!drag.current)return;const start=drag.current,dx=event.clientX-start.x,dy=event.clientY-start.y;if(Math.hypot(dx,dy)>3){start.moved=true;setDragging(true);setPan({x:start.pan.x+dx,y:start.pan.y+dy});}}
  function pointerUp(event){if(event.type==='pointerup'&&drag.current&&!drag.current.moved){setFocus('');setHover('');}drag.current=null;setDragging(false);}
  const primaryCount=nodes.filter(node=>node.primary).length,pageCount=nodes.filter(node=>node.kind==='page').length;
  return <section className="kb-graph kb-section-scroll" aria-label="知识图谱">
    <div className="kb-section-title"><div><h2>知识图谱</h2><p>{model.knowledgePoints.length} 个知识点 · {model.pages.length} 篇 Wiki · {model.edges.length} 条页面引用</p></div><div className="kb-segmented" aria-label="图谱视图">{[['points','知识点'],['topics','主题目录'],['links','内容关联']].map(([id,label])=><button key={id} aria-pressed={mode===id} onClick={()=>changeView(()=>{setMode(id);setQuery('');})}>{label}</button>)}</div></div>
    {!model.pages.length?<div className="kb-panel-empty"><Waypoints size={30}/><h3>暂无知识图谱</h3><p>添加可读内容后，即可浏览知识与引用关系。</p></div>:<>
      <div className="kb-graph-toolbar"><label className="kb-panel-search"><Search size={16}/><input aria-label="搜索图谱" placeholder={mode==='points'?'搜索知识点':'搜索主题或页面'} value={query} onChange={event=>changeView(()=>setQuery(event.target.value))}/></label>{mode==='links'?<select aria-label="图谱中心页面" value={center||model.pages[0]?.id||''} onChange={event=>changeView(()=>setCenter(event.target.value))}>{model.pages.map(page=><option key={page.id} value={page.id}>{page.title}</option>)}</select>:mode==='topics'&&topic?<button className="kb-secondary" onClick={()=>changeView(()=>{setTopic('');setQuery('');})}><ArrowLeft size={15}/>全部主题</button>:null}<div className="kb-network-actions">{focus&&<button type="button" className="kb-secondary kb-network-clear" title="取消当前节点聚焦，显示全部关联" onClick={()=>{setFocus('');setHover('');}}><X size={14} aria-hidden="true"/>取消聚焦</button>}<div className="kb-zoom"><button aria-label="缩小图谱" disabled={zoom<=.6} onClick={()=>setZoom(value=>Math.max(.6,+(value-.2).toFixed(1)))}><Minus size={16}/></button><span>{Math.round(zoom*100)}%</span><button aria-label="放大图谱" disabled={zoom>=2.4} onClick={()=>setZoom(value=>Math.min(2.4,+(value+.2).toFixed(1)))}><Plus size={16}/></button><button aria-label="重置图谱缩放" onClick={resetView}><RotateCcw size={15}/></button><button aria-label="显示完整图谱" onClick={()=>{resetView();setFocus('');setHover('');}}><Maximize2 size={15}/></button></div></div></div>
      {!nodes.length?<div className="kb-panel-empty"><Waypoints size={28}/><h3>{mode==='points'&&!model.knowledgePoints.length?'当前内容没有知识点记录':'没有匹配的节点'}</h3><p>可以切换视图或调整搜索。</p></div>:null}
      <div ref={canvas} className={'kb-network-canvas'+(dragging?' is-dragging':'')+(zoom>=1.4?' is-zoomed':'')+(mode==='links'||mode==='topics'&&topic?' is-page-view':'')} hidden={!nodes.length} tabIndex={0} aria-label="图谱画布，可拖动和缩放" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}>
        <svg ref={svg} viewBox={'0 0 '+size.width+' '+size.height} role="group" aria-label={mode==='points'?'知识点关联图谱':mode==='topics'?'Wiki 主题关系':'Wiki 页面引用关系'}><g transform={`translate(${size.width/2+pan.x} ${size.height/2+pan.y}) scale(${zoom}) translate(${-size.width/2} ${-size.height/2})`}>
          <g aria-hidden="true">{network.links.map(link=>{const from=byId.get(link.from),to=byId.get(link.to),highlight=activeId&&(link.from===activeId||link.to===activeId);return <line key={link.from+'\0'+link.to} className={'kb-network-edge'+(highlight?' is-active':activeId?' is-muted':'')} x1={from.x} y1={from.y} x2={to.x} y2={to.y}/>;})}</g>
          {nodes.map(node=><g key={node.id} data-network-node={node.id} role="button" tabIndex={0} aria-haspopup={node.kind!=='topic'?'dialog':undefined} aria-label={(focus!==node.id?'查看关联：':node.kind==='topic'?'展开主题：':'查看内容：')+node.title} className={'kb-network-node'+(node.primary?' is-primary':'')+(node.kind==='topic'?' is-topic':'')+(node.id===activeId?' is-selected':neighbors.has(node.id)?' is-neighbor':activeId?' is-muted':'')} transform={`translate(${node.x} ${node.y})`} onMouseEnter={()=>setHover(node.id)} onMouseLeave={()=>setHover('')} onFocus={()=>setHover(node.id)} onBlur={()=>setHover('')} onClick={()=>openNode(node)} onKeyDown={event=>activate(event,node)}><circle r={node.radius}/><text className={node.primary?'':'kb-network-page-label'} x={node.primary?0:node.radius+6} y={node.primary?node.radius+16:4} textAnchor={node.primary?'middle':'start'}>{short(node.title)}</text>{focus===node.id&&node.kind!=='topic'&&<g className="kb-network-read-badge" aria-hidden="true" transform={`translate(${node.radius - 4} ${-node.radius - 7})`}>
            <rect width="22" height="22" rx="11"/>
            <BookOpen x={4} y={4} size={14} strokeWidth={1.8}/>
          </g>}<title>{node.title}{node.count!==undefined?' · '+node.count+' 篇 Wiki':''}</title></g>)}
        </g></svg>
      </div>
      {!!nodes.length&&<div className="kb-network-legend">{mode!=='links'&&<span><i className={mode==='topics'?'is-topic':''}/>{mode==='points'?'知识点':'主题'} {primaryCount}</span>}<span><i className="is-page"/>Wiki {pageCount}</span><span className="kb-network-total">{nodes.length} 个节点 · {network.links.length} 条关联</span></div>}
    </>}
  </section>;
}
