import { ActionLink, ActionButton, ActionLabel, ActionSummary } from './ActionControls.jsx';
import { FeatureHint } from './FeatureHint.jsx';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Empty, Icon, Modal, Status } from './workbench-components.jsx';
import { exampleDocuments, localDocuments, libraryDocuments } from './workbench-docs.js';
import { getCounts, libraryPath } from './workbench-model.mjs';
import { agentTemplates, graphGroups, packageLibraries, packagePath, updatePackageEnabled, validatePackage } from './advanced-model.mjs';
import { DynamicRelations } from './FeaturePanels.jsx';
import { PackageSharing, ReceivedPackages } from './PackageSharing.jsx';
import sourceGraph from './graph-source.svg?raw';

const uid = prefix => prefix + '-' + crypto.randomUUID();
const textMatches = (text, query) => text.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
function documentsFor(library, sources, firstLibraryId) {
  return libraryDocuments(library, sources);
}
function PageHeading({ title, description, actions, back }) {
  return <div className="mm-page-heading"><div>{back && <ActionLink className="mm-back-link" href={back.href}>‹ {back.label}</ActionLink>}<h1>{back?title:<FeatureHint text={description}>{title}</FeatureHint>}</h1>{back&&<p>{description}</p>}</div><div className="mm-heading-actions">{actions}</div></div>;
}
function Search({ placeholder, value, onChange }) {
  return <label className="mm-search"><Icon name="search" /><span className="mm-sr-only">{placeholder}</span><input placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} /></label>;
}
function Tabs({ items, value, onChange, label }) {
  return <div className="mm-advanced-tabs" role="group" aria-label={label}>{items.map(([id, name]) => <Button key={id} variant="plain" aria-pressed={value === id} className={value === id ? 'active' : ''} onClick={() => onChange(id)}>{name}</Button>)}</div>;
}

export function GraphView({ libraries, sources, firstLibraryId, route, navigate, embedded=false, documents, onOpen, onAsk }) {
  const library = libraries.find(l => l.id === route.searchParams.get('library')) || libraries[0];
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [selectedId, setSelectedId] = useState(route.searchParams.get('doc') || '');
  const routeDoc=route.searchParams.get('doc') || '';
  useEffect(()=>{setSelectedId(routeDoc);},[routeDoc]);
  const [mode, setMode] = useState('directory');
  const [sourceNode, setSourceNode] = useState(null);
  const sourceNodes = useMemo(() => [...new DOMParser().parseFromString(sourceGraph, 'image/svg+xml').querySelectorAll('circle title')].map((title, i) => ({ id: String(i), name: title.textContent.split('\n')[0], description: title.textContent.split('\n')[1] || '', full: title.textContent })).filter(n => n.name !== '未入总结的来源' && !/^其余/.test(n.name)), []);
  const [guide, setGuide] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef(null);
  const docs = documents || documentsFor(library, sources, firstLibraryId);
  const allGroups = graphGroups(docs);
  const groups = graphGroups(docs, query);
  const group = groups.find(g => g.id === category);
  const selected = docs.find(d => d.id === selectedId);
  const visibleDocs = group ? group.documents : groups.flatMap(g => g.documents);
  const items = group ? group.documents.map(d => ({ id: d.id, name: d.title, description: '知识页面', doc: d })) : groups.map(g => ({ id: g.id, name: g.name, description: g.documents.length + ' 个页面' }));
  const visualItems = group ? items.slice(0, 10) : items;
  const nodes = visualItems.map((item, i) => {
    const half = Math.ceil(visualItems.length / 2);
    const side = i < half ? 0 : 1, count = side ? visualItems.length - half : half, index = side ? i - half : i;
    return { ...item, x: side ? 78 : 22, y: count <= 1 ? 50 : 10 + index * 80 / (count - 1) };
  });
  function reset() { setZoom(1); setOffset({ x: 0, y: 0 }); }
  function focus(id) { setCategory(id); setSelectedId(''); reset(); }
  const openDoc = doc => onOpen ? onOpen(doc.id) : navigate(libraryPath(library.id, 'pages', doc.id));
  function chooseSource(event) {
    const node = event.target.closest('circle');
    if (!node) return;
    const text = node.querySelector('title')?.textContent;
    if (text) setSourceNode(sourceNodes.find(n => n.full === text) || { name: text.split('\n')[0], description: '' });
  }
  if (!library) return <Empty title="先创建一个知识库" action={<ActionLink className="mm-button mm-button-primary" href="/workspace">前往知识库</ActionLink>}>添加资料后，就能在这里探索内容结构。</Empty>;
  return <>
    {!embedded && <PageHeading title="知识图谱" description="从主题找到知识页面，再回到原文核验内容。" actions={<><Button onClick={() => setGuide(true)}>如何阅读图谱</Button><ActionLink className="mm-button" href={libraryPath(library.id)}>进入知识库</ActionLink></>} />}
    <div className="mm-graph-toolbar">{!embedded && <label className="mm-inline-select">所属知识库<select aria-label="图谱所属知识库" value={library.id} onChange={e => { navigate('/graph?library=' + encodeURIComponent(e.target.value)); setCategory(''); setSelectedId(''); setQuery(''); setMode('directory'); reset(); }}>{libraries.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></label>}<Search placeholder="搜索主题或页面" value={query} onChange={value => { setQuery(value); setSelectedId(''); reset(); }} /><span className="mm-result-count">{allGroups.length} 个主题 · {docs.length} 个可读页面</span></div>
    {!docs.length ? <div className="mm-outlined"><Empty title="还没有可展示的知识页面" action={<ActionLink className="mm-button mm-button-primary" href={'/upload?library=' + encodeURIComponent(library.id)}>添加资料</ActionLink>}>完成文本整理后，内容会按目录出现在这里。没有正文的文件记录不会参与展示。</Empty></div> : <>
      <Tabs items={library.id === firstLibraryId ? [['directory', '主题结构'], ['relations','内容关联'], ['sources', '来源关联 · 示例']] : [['directory', '主题结构'],['relations','内容关联']]} value={mode} onChange={next => { setMode(next); setSourceNode(null); reset(); }} label="图谱视图" />
      {mode==='relations'?<DynamicRelations docs={docs} onOpen={openDoc}/>:<div className="mm-graph-layout"><section className="mm-graph-card" aria-label="知识图谱画布"><div className="mm-graph-card-heading"><div>{category?<Button variant="plain" onClick={() => focus('')}>{library.name}</Button>:<strong className="mm-map-library-name">{library.name}</strong>}{group && <><span>/</span><strong>{group.name}</strong></>}</div><span className="mm-caption">{mode === 'directory' ? '连线表示目录归属' : '保留原知识库的来源关系'}</span></div>
        {mode === 'directory' && !nodes.length ? <Empty title="没有匹配的内容" action={<Button onClick={() => { setQuery(''); focus(''); }}>清空搜索</Button>}>试试其他主题或页面名称。</Empty> : <>
          <div className="mm-graph-viewport" onPointerDown={event => { if (event.target.closest('button,circle')) return; drag.current = { startX: event.clientX, startY: event.clientY, x: offset.x, y: offset.y }; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={event => { if (drag.current) setOffset({ x: drag.current.x + event.clientX - drag.current.startX, y: drag.current.y + event.clientY - drag.current.startY }); }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
            <div className="mm-graph-transform" style={{ transform: `translate(${offset.x}px,${offset.y}px) scale(${zoom})` }}>
              {mode === 'directory' ? <><svg className="mm-directory-edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{nodes.map(n => <line key={n.id} className={selectedId===n.id?'is-current':undefined} x1="50" y1="50" x2={n.x} y2={n.y} />)}</svg><ActionButton className="mm-graph-node mm-graph-root" style={{ left: '50%', top: '50%' }} onClick={() => focus('')}><span>{group ? '当前主题' : '知识库'}</span><strong>{group?.name || library.name}</strong><small>{visibleDocs.length} 个页面</small></ActionButton>{nodes.map(n => <ActionButton key={n.id} className={'mm-graph-node' + (n.doc ? ' mm-graph-document' : '') + (selectedId === n.id ? ' selected' : '')} style={{ left: n.x + '%', top: n.y + '%' }} onClick={() => n.doc ? setSelectedId(n.id) : focus(n.id)} title={n.name} aria-label={(n.doc ? '查看页面：' : '探索主题：') + n.name} aria-pressed={n.doc ? selectedId === n.id : undefined}><strong>{n.name}</strong><small>{n.description}</small></ActionButton>)}</> : <div className="mm-source-graph" onClick={chooseSource} dangerouslySetInnerHTML={{ __html: sourceGraph }} />}
            </div>
          </div>
          <div className="mm-graph-mobile-list">{mode === 'directory' ? <><p className="mm-caption">{group ? group.name + ' · 点击查看页面' : '点击主题展开知识页面'}</p>{group && <Button variant="plain" onClick={() => focus('')}>‹ 全部主题</Button>}<div>{items.map(n => <Button key={n.id} className={selectedId === n.id ? 'active' : ''} onClick={() => n.doc ? setSelectedId(n.id) : focus(n.id)}>{n.name}<small>{n.description}</small></Button>)}</div></> : <div className="mm-source-graph mm-source-graph-mobile" onClick={chooseSource} dangerouslySetInnerHTML={{ __html: sourceGraph }} />}</div>
        </>}
        <footer className="mm-graph-footer"><span>{mode === 'directory' ? group && items.length > 10 ? '画布显示前 10 页，可搜索查找其余页面' : '选择主题 → 选择页面 → 阅读原文' : '紫红：总结篇　青绿：引用来源　灰：未入总结'}</span><div className="mm-graph-controls"><Button aria-label="缩小图谱" disabled={zoom <= .6} onClick={() => setZoom(z => Math.max(.6, z - .2))}>−</Button><span>{Math.round(zoom * 100)}%</span><Button aria-label="放大图谱" disabled={zoom >= 1.8} onClick={() => setZoom(z => Math.min(1.8, z + .2))}>＋</Button><Button onClick={reset}>复位</Button></div></footer>
      </section>
      <aside className="mm-graph-detail">{mode === 'sources' ? <><span className="mm-eyebrow">来源关联示例</span><label className="mm-source-node-picker">选择节点<select aria-label="选择来源关联节点" value={sourceNode?.id || ''} onChange={e => setSourceNode(sourceNodes.find(n => n.id === e.target.value) || null)}><option value="">选择总结篇或来源</option>{sourceNodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}</select></label><h2>{sourceNode?.name || '查看内容的出处'}</h2><p className="mm-caption">{sourceNode?.description || '点击图中的总结篇或来源，查看其名称与引用信息。此视图展示已保存的关联，资料更新后不会自动刷新。'}</p>{sourceNode && docs.find(d => d.title === sourceNode.name) && <Button variant="primary" onClick={() => openDoc(docs.find(d => d.title === sourceNode.name))}>阅读知识页面</Button>}<div className="mm-notice">当前未保存附件正文。知识目录中的页面可直接阅读和提问。</div><Button onClick={() => { setMode('directory'); reset(); }}>返回知识目录</Button></> : selected ? <><span className="mm-eyebrow">知识页面 · {selected.category}</span><h2>{selected.title}</h2><p className="mm-graph-excerpt">{selected.paragraphs[0]?.slice(0, 260) || '打开页面查看完整内容。'}</p><Button variant="primary" onClick={() => openDoc(selected)}>阅读知识页面</Button><Button onClick={()=>onAsk ? onAsk(selected.id) : navigate(libraryPath(library.id, 'ask', selected.id))}>围绕此页提问</Button><Button variant="plain" onClick={() => setSelectedId('')}>返回页面列表</Button></> : <><span className="mm-eyebrow">{group ? '当前主题' : '开始探索'}</span><h2>{group?.name || '选择主题，开始探索'}</h2><p className="mm-caption">{group ? '选择一个页面，先看摘要，再阅读完整内容。' : '点击图中的主题展开内容。也可以直接从下面的页面开始。'}</p><div className="mm-graph-doc-list">{visibleDocs.map(doc => <ActionButton key={doc.id} onClick={() => setSelectedId(doc.id)}><span>{doc.title}</span><small>{doc.category}</small></ActionButton>)}</div><p className="mm-caption">{visibleDocs.length} 个页面 · 仅显示本机可读内容</p></>}</aside></div>}
    </>}
    {guide && <Modal title="从图谱找到内容" onClose={() => setGuide(false)}><div className="mm-dialog-body mm-form-stack"><p>先选择知识库，再点击主题查看页面。选中页面后，可以阅读原文，或围绕这一个页面提问。</p><p>“知识目录”的连线表示页面所属主题，来自已有目录，不代表 AI 推断的语义关系。</p>{library.id === firstLibraryId && <p>“来源关联”保留原知识库的共书与引用关系示例。紫红表示总结篇，青绿表示引用来源，灰色表示未入总结的来源。支持拖动画布、缩放和点击节点。</p>}</div><div className="mm-dialog-actions"><Button variant="primary" onClick={() => setGuide(false)}>开始探索</Button></div></Modal>}
  </>;
}

function MethodManagerShell({ embedded, onClose, onCreate, children }) {
  if (!embedded) return <Modal title="管理智能体" description="选择适合的智能体，或保存自己的整理规则。关闭后继续添加资料。" onClose={onClose}>{children}</Modal>;
  return <section className="mm-agent-workspace"><PageHeading title="智能体" description="使用内置智能体整理资料，也可以创建自己的智能体。" actions={<Button variant="primary" onClick={onCreate}>新建智能体</Button>}/>{children}</section>;
}

export function MethodManager({ profiles, libraries, sources, setState, notify, onChoose, onClose, currentId, initialTab='templates', embedded=false }) {
  const [tab,setTab]=useState(initialTab==='mine'?'mine':'templates');
  const [query,setQuery]=useState(''),[editor,setEditor]=useState(null),[archiving,setArchiving]=useState(null),[showArchived,setShowArchived]=useState(false);
  const active=profiles.filter(a=>!a.archived),archived=profiles.filter(a=>a.archived);
  const list=(tab==='templates'?agentTemplates:showArchived?archived:active).filter(a=>textMatches(a.name+a.description+a.direction,query));
  function saveMethod(draft){
    const editing=editor.kind==='edit';
    const method={...draft,id:editing?editor.agent.id:uid('agent'),archived:false,updatedAt:new Date().toISOString(),recommended:false};
    setState(s=>({...s,agentProfiles:editing?s.agentProfiles.map(a=>a.id===method.id?method:a):[...s.agentProfiles,method]}));
    setEditor(null);setShowArchived(false);setTab('mine');notify(embedded?'智能体已保存，可在添加资料时使用':'智能体已保存，可用于本次资料');
  }
  function changeTab(id){setTab(id);setQuery('');setShowArchived(false);}
  const startCreate=()=>setEditor({kind:'create',agent:{name:'',description:'',scenario:'',direction:'',strategy:'',requirements:'',anchors:''}});
  return <>
    <MethodManagerShell embedded={embedded} onClose={onClose} onCreate={startCreate}>
      <div className="mm-dialog-body mm-method-manager">
        {!embedded&&<div className="mm-method-manager-actions"><p>不确定选哪种时，使用通用整理即可。</p><Button variant="primary" onClick={startCreate}>新建智能体</Button></div>}
        <Tabs items={[[ 'templates','内置智能体 · '+agentTemplates.length ],['mine','我的智能体 · '+active.length]]} value={tab} onChange={changeTab} label="智能体分类"/>
        <div className="mm-list-toolbar"><Search placeholder="搜索名称、用途或关注点" value={query} onChange={setQuery}/>{tab==='mine'&&<div className="mm-filters"><ActionButton className={!showArchived?'active':''} aria-pressed={!showArchived} onClick={()=>setShowArchived(false)}>使用中</ActionButton><ActionButton className={showArchived?'active':''} aria-pressed={showArchived} onClick={()=>setShowArchived(true)}>已归档 · {archived.length}</ActionButton></div>}<span className="mm-result-count">{list.length} 个智能体</span></div>
        {!list.length?<div className="mm-outlined"><Empty title={query?'没有匹配的智能体':showArchived?'没有已归档的智能体':'还没有自定义智能体'} action={<Button onClick={()=>changeTab('templates')}>浏览内置智能体</Button>}>{query?'换个关键词试试。':'可以新建智能体，或复制内置智能体后调整规则。'}</Empty></div>:<div className="mm-agent-grid">{list.map(method=><article className="mm-agent-card" key={method.id}>
          <div className="mm-card-top"><span className="mm-card-icon">{method.avatar?<img className="mm-agent-avatar" src={method.avatar} alt=""/>:<Icon name="archive"/>}</span><Status state={method.id===currentId&&!method.archived?'ready':'example'}>{method.archived?'已归档':method.id===currentId?'已选择':method.id==='general'?'默认智能体':tab==='templates'?'内置智能体':'自定义智能体'}</Status></div>
          <h3>{method.name}</h3><p>{method.description||'为资料定义专属的整理规则。'}</p><div className="mm-agent-purpose"><span>适合用来</span><p>{method.scenario||'日常资料整理'}</p><span>重点关注</span><p>{method.direction||'主题与核心内容'}</p></div>
          <footer>{method.archived?<Button onClick={()=>{setState(s=>({...s,agentProfiles:s.agentProfiles.map(a=>a.id===method.id?{...a,archived:false}:a)}));notify('智能体已恢复');}}>恢复使用</Button>:<Button variant={method.id===currentId?'primary':'secondary'} onClick={()=>onChoose(method)}>使用此智能体</Button>}<Button variant="plain" onClick={()=>setEditor({kind:tab==='templates'?'copy':'edit',agent:method})}>{tab==='templates'?'查看与复制':'编辑规则'}</Button>{tab==='mine'&&!method.archived&&<Button variant="plain" onClick={()=>setArchiving(method)}>归档</Button>}</footer>
        </article>)}</div>}
        <p className="mm-caption mm-advanced-footnote">所选智能体与规则会随资料保存。当前按段落整理，在线 AI 尚未连接。</p>
      </div>{!embedded&&<div className="mm-dialog-actions"><Button onClick={onClose}>返回添加资料</Button></div>}
    </MethodManagerShell>
    {editor&&<AgentEditor libraries={libraries} sources={sources} editor={editor} onClose={()=>setEditor(null)} onSave={saveMethod}/>}
    {archiving&&<Modal title={'归档“'+archiving.name+'”？'} onClose={()=>setArchiving(null)}><div className="mm-dialog-body"><p>归档后不再出现在添加资料的选项中，已有资料和添加时的规则保留。可以随时恢复使用。</p></div><div className="mm-dialog-actions"><Button onClick={()=>setArchiving(null)}>取消</Button><Button onClick={()=>{setState(s=>({...s,agentProfiles:s.agentProfiles.map(a=>a.id===archiving.id?{...a,archived:true}:a)}));setArchiving(null);notify('智能体已归档，可在“已归档”恢复');}}>归档智能体</Button></div></Modal>}
  </>;
}

function AgentEditor({ editor, libraries, sources, onClose, onSave }) {
  const [draft, setDraft] = useState({ ...editor.agent, name: editor.agent.name + (editor.kind === 'copy' ? ' · 我的版本' : '') });
  const update = key => e => setDraft(d => ({ ...d, [key]: e.target.value }));
  const [assist,setAssist]=useState(false);const [assistLibrary,setAssistLibrary]=useState(libraries[0]?.id||'');const [avatarError,setAvatarError]=useState('');
  const contextDocs=libraryDocuments(libraries.find(l=>l.id===assistLibrary),sources);
  function suggest(){const lib=libraries.find(l=>l.id===assistLibrary);const categories=[...new Set(contextDocs.map(d=>d.category))].slice(0,8);setDraft(d=>({...d,name:d.name||lib.name+'整理',description:'整理'+lib.name+'的资料并保留可核验出处',scenario:lib.description||'知识积累与资料回查',direction:categories.join('、')||'主题、核心概念和来源',strategy:'按已有主题归类，区分原文、用户原则和推测；为每条结论保留引用。',requirements:'不补造缺失内容。优先核验原始资料。',anchors:categories.join('，')}));setAssist(false);}

  return <Modal title={editor.kind === 'edit' ? '编辑整理规则' : editor.kind === 'copy' ? '复制模板并调整' : '新建智能体'} description="写清楚用途与关注点，添加资料时就能直接复用。" onClose={onClose}><form onSubmit={e => { e.preventDefault(); if (draft.name.trim()) onSave({ ...draft, name: draft.name.trim() }); }}><div className="mm-dialog-body mm-form-stack"><div className="mm-feature-inline">{draft.avatar&&<img className="mm-agent-avatar" src={draft.avatar} alt="智能体标识"/>}<ActionLabel className="mm-button">上传标识<input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={async e=>{const file=e.target.files[0];if(!file)return;if(!/^image\/(png|jpeg|webp)$/.test(file.type)||file.size>200000){setAvatarError('请选择200KB以内的PNG、JPEG或WebP图片。');return;}const reader=new FileReader();reader.onload=()=>{setDraft(d=>({...d,avatar:reader.result}));setAvatarError('');};reader.readAsDataURL(file);}}/></ActionLabel>{draft.avatar&&<Button onClick={()=>setDraft(d=>({...d,avatar:''}))}>移除标识</Button>}<Button onClick={()=>setAssist(v=>!v)}>基于内容生成规则</Button></div>{avatarError&&<p role="alert" className="mm-field-error">{avatarError}</p>}{assist&&<section className="mm-feature-card mm-form-stack"><h3>内容辅助填写</h3><label>参考知识库<select value={assistLibrary} onChange={e=>setAssistLibrary(e.target.value)}>{libraries.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></label><p className="mm-caption">依据 {contextDocs.length} 篇可读内容的目录给出本地建议，供你修改；在线 AI 生成待接入。填写后会替换表单中的规则草稿。</p><Button disabled={!contextDocs.length} onClick={suggest}>填入规则建议</Button></section>}<label><span>智能体名称 <em className="mm-required">必填</em></span><input autoFocus required maxLength={60} value={draft.name} onChange={update('name')} placeholder="例如：客户访谈整理" /></label><label>一句话说明<textarea rows={2} maxLength={300} value={draft.description} onChange={update('description')} placeholder="这个智能体适合整理哪些资料" /></label><label>适用场景<textarea rows={2} maxLength={600} value={draft.scenario} onChange={update('scenario')} placeholder="例如：客户访谈、需求分析、产品复盘" /></label><label>重点关注<textarea rows={2} maxLength={1000} value={draft.direction} onChange={update('direction')} placeholder="例如：用户目标、痛点、原话与待验证假设" /></label><details className="mm-editor-advanced"><ActionSummary>整理策略与更多规则</ActionSummary><div className="mm-form-stack"><label>整理策略<textarea rows={3} maxLength={2000} value={draft.strategy} onChange={update('strategy')} /></label><label>其他要求<textarea rows={2} maxLength={1000} value={draft.requirements} onChange={update('requirements')} /></label><label>重点关键词<input maxLength={300} value={draft.anchors} onChange={update('anchors')} placeholder="用逗号分隔，选填" /></label></div></details></div><div className="mm-dialog-actions"><Button onClick={onClose}>取消</Button><Button type="submit" variant="primary" disabled={!draft.name.trim()}>{editor.kind === 'edit' ? '保存修改' : '保存智能体'}</Button></div></form></Modal>;
}

export function PackagesView({ packages, defaultId, libraries, sources, firstLibraryId, route, navigate, state, setState, notify }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [editor, setEditor] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const itemId = route.searchParams.get('package');
  const item = packages.find(p => p.id === itemId);
  const tab = route.searchParams.get('tab') === 'connect' ? 'connect' : 'contents';
  const isUsable = p => p.enabled && packageLibraries(p, libraries).length > 0;
  const owner = route.searchParams.get('owner') === 'shared' || route.searchParams.has('demoShare') ? 'shared' : 'mine';
  const bound = item ? packageLibraries(item, libraries) : [];
  const readable = bound.reduce((sum, lib) => sum + documentsFor(lib, sources, firstLibraryId).length, 0);
  async function copy(text) { try { await navigator.clipboard.writeText(text); notify('已复制'); } catch { notify('复制失败，请选中下方内容手动复制'); } }
  function save(draft) {
    const next = { ...draft, id: editor.kind === 'edit' ? editor.item.id : uid('package'), name: draft.name.trim(), description: draft.description.trim(), updatedAt: new Date().toISOString() };
    setState(s => ({ ...s, resourcePackages: editor.kind === 'edit' ? s.resourcePackages.map(p => p.id === next.id ? next : p) : [...s.resourcePackages, next] }));
    setEditor(null); navigate(packagePath(next.id)); notify('资源包已保存到本地');
  }
  if (itemId && !item) return <Empty title="没有找到这个资源包" action={<ActionLink className="mm-button mm-button-primary" href="/packages">返回资源包列表</ActionLink>}>这个链接对应的资源包不在当前浏览器中。</Empty>;
  const previewUrl = item ? location.origin + packagePath(item.id) : '';
  return <>
    {item ? <>
      <PageHeading title={item.name} description={item.description || '将需要一起使用的知识库整理成一个资源包。'} back={{ href: '/packages', label: '返回资源包管理' }} actions={<><Button onClick={() => setEditor({ kind: 'edit', item })}>编辑资源包</Button><Button variant="primary" disabled={!item.enabled || !bound.length} onClick={() => setShareOpen(true)}>分享与连接</Button></>} />
      <div className="mm-package-meta"><Status state={item.enabled && bound.length ? 'ready' : 'waiting'}>{item.enabled ? bound.length ? '本地可用' : '范围需更新' : '已停用'}</Status><span>{bound.length} 个知识库</span><span>{readable} 个本机可读页面</span>{defaultId === item.id && <span className="mm-soft-tag">默认资源包</span>}</div>
      {!item.enabled && <div className="mm-notice mm-package-notice">此资源包已停用。恢复后可继续使用。<Button onClick={() => { setState(s => updatePackageEnabled(s, item.id, true)); notify('资源包已恢复'); }}>恢复使用</Button></div>}
      {item.libraryIds.some(id => !libraries.some(l => l.id === id)) && <div className="mm-notice mm-notice-warning">部分知识库已移除，请编辑资源包，更新内容范围。</div>}
      <Tabs items={[[ 'contents', '包含的知识库' ], [ 'connect', '使用与连接' ]]} value={tab} onChange={next => navigate(packagePath(item.id, next))} label="资源包内容" />
      <div className="mm-package-detail-layout"><section>{tab === 'contents' ? bound.length ? <div className="mm-package-library-list">{bound.map(lib => { const counts = getCounts(lib, sources), pages = documentsFor(lib, sources, firstLibraryId).length; return <article key={lib.id}><span className="mm-card-icon"><Icon name="archive" /></span><div><h2>{lib.name}</h2><p>{lib.description || '知识库资料与知识页面'}</p><small>{counts.total} 份资料 · {pages} 个本机可读页面</small></div><ActionLink className="mm-button" href={libraryPath(lib.id)}>查看知识库</ActionLink></article>; })}</div> : <div className="mm-outlined"><Empty title="内容范围需要更新" action={<Button onClick={() => setEditor({ kind: 'edit', item })}>选择知识库</Button>}>关联的知识库已被移除，请重新选择。</Empty></div> : <div className="mm-connection-panel"><h2>分享与外部连接</h2><PackageSharing item={item} libraries={libraries} sources={sources} state={state} setState={setState} notify={notify}/></div>}</section><aside className="mm-package-summary"><h2>使用范围</h2><dl><div><dt>内容</dt><dd>{bound.length} 个知识库</dd></div><div><dt>权限</dt><dd>只读查看</dd></div><div><dt>可用位置</dt><dd>当前浏览器</dd></div></dl><p className="mm-caption">资源包保存内容的组合。更新知识库资料后，这里的可读内容会同步变化。</p><div className="mm-package-management"><Button disabled={!item.enabled || !bound.length || defaultId === item.id} onClick={() => { setState(s => ({ ...s, defaultPackageId: item.id })); notify('已设为默认资源包'); }}>{defaultId === item.id ? '已设为默认' : '设为默认资源包'}</Button><Button variant="plain" onClick={() => setToggling(item)}>{item.enabled ? '停用资源包' : '恢复资源包'}</Button></div></aside></div>
    </> : <>
      <PageHeading title="资源包管理" description="把要一起使用的知识库打包，明确内容范围与使用入口。" actions={<Button variant="primary" onClick={() => setEditor({ kind: 'create', item: { name: '', description: '', libraryIds: route.searchParams.has('library') ? [route.searchParams.get('library')] : [], enabled: true, example: false } })}>创建资源包</Button>} />
      <Tabs items={[[ 'mine', '我的资源包 · ' + packages.length ], [ 'shared', '收到的分享 · ' + state.receivedShares.length ]]} value={owner} onChange={next => navigate('/packages' + (next === 'shared' ? '?owner=shared' : ''))} label="资源包归属" />
      {owner === 'shared' ? <ReceivedPackages state={state} setState={setState} notify={notify} route={route}/> : <><div className="mm-list-toolbar"><Search placeholder="搜索资源包名称或知识库" value={query} onChange={setQuery} /><div className="mm-filters">{[['all','全部'],['enabled','可使用'],['disabled','已停用']].map(([id,label]) => <ActionButton key={id} aria-pressed={filter === id} className={filter === id ? 'active' : ''} onClick={() => setFilter(id)}>{label}</ActionButton>)}</div><span className="mm-result-count">{packages.filter(isUsable).length} 个可使用</span></div><div className="mm-package-table"><div className="mm-package-table-head"><span>资源包</span><span>包含的知识库</span><span>状态</span><span>操作</span></div>{packages.filter(p => textMatches(p.name + p.description + packageLibraries(p, libraries).map(l => l.name).join(' '), query) && (filter === 'all' || (filter === 'enabled' ? isUsable(p) : !p.enabled))).map(p => { const libs = packageLibraries(p, libraries); return <article className="mm-package-row" key={p.id}><div className="mm-package-name"><span className="mm-card-icon"><Icon name="archive" /></span><div><h2><a href={packagePath(p.id)}>{p.name}</a>{defaultId === p.id && <span className="mm-soft-tag">默认</span>}</h2><p>{p.description || '未填写说明'}</p></div></div><div className="mm-package-scope">{libs.slice(0, 2).map(l => <span key={l.id}>{l.name}</span>)}{libs.length > 2 && <small>＋{libs.length - 2}</small>}{!libs.length && <span>需要更新范围</span>}</div><Status state={p.enabled && libs.length ? 'ready' : 'waiting'}>{p.enabled ? libs.length ? '本地可用' : '范围需更新' : '已停用'}</Status><ActionLink className="mm-button mm-button-plain" href={packagePath(p.id)}>管理资源包 →</ActionLink></article>; })}{!packages.some(p => textMatches(p.name + p.description + packageLibraries(p, libraries).map(l => l.name).join(' '), query) && (filter === 'all' || (filter === 'enabled' ? isUsable(p) : !p.enabled))) && <Empty title="没有匹配的资源包" action={<Button onClick={() => { setQuery(''); setFilter('all'); }}>清空筛选</Button>}>换个关键词，或创建一个新的资源包。</Empty>}</div><p className="mm-caption mm-advanced-footnote">资源包可在本机查看和管理，在线分享和 Agent 连接尚未连接。</p></>}
    </>}
    {editor && <PackageEditor editor={editor} libraries={libraries} onClose={() => setEditor(null)} onSave={save} />}
    {toggling && <Modal title={(toggling.enabled ? '停用' : '恢复') + '“' + toggling.name + '”？'} onClose={() => setToggling(null)}><div className="mm-dialog-body"><p>{toggling.enabled ? '停用后，此资源包的使用入口将不可用。内容和知识库会保留，可随时恢复。' : '恢复后，可以继续使用这个资源包的本地入口。'}</p></div><div className="mm-dialog-actions"><Button onClick={() => setToggling(null)}>取消</Button><Button onClick={() => { setState(s => updatePackageEnabled(s, toggling.id, !toggling.enabled)); setToggling(null); notify(toggling.enabled ? '资源包已停用，可随时恢复' : '资源包已恢复'); }}>确认{toggling.enabled ? '停用' : '恢复'}</Button></div></Modal>}
    {shareOpen && item && <Modal title="资源包分享与连接" drawer onClose={()=>setShareOpen(false)}><div className="mm-dialog-body"><PackageSharing item={item} libraries={libraries} sources={sources} state={state} setState={setState} notify={notify}/></div><div className="mm-dialog-actions"><Button onClick={()=>setShareOpen(false)}>关闭</Button></div></Modal>}
  </>;
}

function PackageEditor({ editor, libraries, onClose, onSave }) {
  const [draft, setDraft] = useState({ ...editor.item });
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const selected = packageLibraries(draft, libraries);
  function toggle(id) { setDraft(d => ({ ...d, libraryIds: d.libraryIds.includes(id) ? d.libraryIds.filter(value => value !== id) : [...d.libraryIds, id] })); setError(''); }
  return <Modal title={editor.kind === 'edit' ? '编辑资源包' : '创建资源包'} description="命名资源包，再选择需要一起使用的知识库。" onClose={onClose}><form onSubmit={event => { event.preventDefault(); const message = validatePackage(draft, libraries); if (message) setError(message); else onSave({ ...draft, libraryIds: selected.map(l => l.id) }); }}><div className="mm-dialog-body mm-form-stack"><label><span>资源包名称 <em className="mm-required">必填</em></span><input required maxLength={60} value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="例如：品牌设计资料包" /></label><label><span>说明 <em className="mm-subtle">选填</em></span><textarea rows={2} maxLength={300} value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} placeholder="什么场景下使用这个资源包" /></label><fieldset className="mm-library-picker"><legend>包含的知识库 <span className="mm-required">至少选择 1 个</span></legend><Search placeholder="搜索可选知识库" value={query} onChange={setQuery} /><div className="mm-library-picker-list">{libraries.filter(l => textMatches(l.name, query)).map(lib => <label key={lib.id}><input type="checkbox" checked={draft.libraryIds.includes(lib.id)} onChange={() => toggle(lib.id)} /><span><strong>{lib.name}</strong><small>{lib.description || '知识库资料与知识页面'}</small></span></label>)}{!libraries.some(l => textMatches(l.name, query)) && <p className="mm-caption">没有匹配的知识库。</p>}</div><p className="mm-caption">已选择 {selected.length} 个知识库 · 只读查看</p></fieldset>{error && <p role="alert" className="mm-field-error">{error}</p>}</div><div className="mm-dialog-actions"><Button onClick={onClose}>取消</Button><Button type="submit" variant="primary" disabled={!draft.name.trim() || !selected.length}>{editor.kind === 'edit' ? '保存修改' : '创建资源包'}</Button></div></form></Modal>;
}
