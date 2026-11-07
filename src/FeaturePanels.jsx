import { ActionLink } from './ActionControls.jsx';
import { ActionSummary, ActionButton } from './ActionControls.jsx';
import { FeatureHint } from './FeatureHint.jsx';
import { relatedPages } from './knowledge-map-model.mjs';
import React, { useState } from 'react';
import seed from './library-seed.json';
import { Button, Modal, Empty } from './workbench-components.jsx';
import { agentTemplates, resolveActiveMethod } from './advanced-model.mjs';
import { appendActivity, evaluateLibrary, generateLocalPages, clearLibraryContent, purgeLibrary, documentRelations } from './feature-model.mjs';
import { libraryDocuments } from './workbench-docs.js';
import { libraryPath, getCounts, findEvidence } from './workbench-model.mjs';
import { copyText } from './copy-text.js';

export function downloadJSON(value, name) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value,null,2)], {type:'application/json'}));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function LibraryTools({ kind, library, docs, sources, state, setState, onClose, navigate, notify, initialMemory = '' }) {
  const [tab, setTab] = useState(kind === 'memory' ? 'memory' : 'evaluate');
  const [text, setText] = useState(initialMemory);
  const [editing, setEditing] = useState('');
  const [agentId, setAgentId] = useState(state.generations[library.id]?.agent?.id || 'general');
  const [mode, setMode] = useState('incremental');
  const [confirmation, setConfirmation] = useState('');
  const [done, setDone] = useState(null);
  const memory = state.memories[library.id] || [];
  const inputs = docs.filter(d=>d.sourceKind !== 'generated');
  const report = evaluateLibrary(inputs, sources.filter(s=>s.libraryId === library.id));
  const saveMemory = () => {
    if(!text.trim()) return;
    setState(s=>appendActivity({...s,memories:{...s.memories,[library.id]:editing ? (s.memories[library.id]||[]).map(m=>m.id===editing?{...m,text:text.trim(),updatedAt:new Date().toISOString()}:m) : [...(s.memories[library.id]||[]),{id:crypto.randomUUID(),text:text.trim(),enabled:true,createdAt:new Date().toISOString()}]}},editing?'修改用户记忆':'添加用户记忆',library.id)); setEditing('');setText('');notify('记忆已保存，下次整理会带入');
  };
  function run() {
    const generation = generateLocalPages({libraryId:library.id,docs:inputs,memory,agent:resolveActiveMethod(agentId,state.agentProfiles),mode,previous:state.generations[library.id]});
    setState(s=>appendActivity({...s,generations:{...s.generations,[library.id]:generation}},mode==='rebuild'?'重新生成整理提要':'增量生成整理提要',library.id,generation.pages.length+' 篇提要；'+generation.changed+' 篇输入变更'));
    setDone(generation);notify('本地整理完成，原文与历史引用保留');
  }
  if(kind==='clear' || kind==='purge') return <Modal title={kind==='clear'?'清空知识库内容':'彻底删除本地知识库'} description={library.name} onClose={onClose}><div className="mm-dialog-body mm-form-stack"><p>{kind==='clear'?'清除当前浏览器中此库的资料与整理提要，并隐藏现有知识页面。名称、用户记忆、对话和资源包配置保留。':'从当前浏览器删除此库的正文、资料、对话、记忆和资源包关联，删除后无法恢复。电脑中的原文件不受影响。'}</p><Button onClick={()=>downloadJSON({format:'metamind-workbench-backup',version:1,state,libraryIds:[...seed.libraries,...state.customLibraries].filter(l=>!state.deletedLibraries.includes(l.id)).map(l=>l.id)},'MetaMind-本地完整备份.json')}>先导出备份</Button><label>输入知识库名称确认<input value={confirmation} onChange={e=>setConfirmation(e.target.value)} placeholder={library.name}/></label></div><div className="mm-dialog-actions"><Button onClick={onClose}>取消</Button><Button variant="danger" disabled={confirmation!==library.name} onClick={()=>{setState(s=>kind==='clear'?clearLibraryContent(s,library.id):purgeLibrary(s,library.id));onClose();if(kind==='purge')navigate('/workspace');notify(kind==='clear'?'知识库内容已清空，配置和记忆保留':'本地知识库已删除');}}>{kind==='clear'?'确认清空内容':'确认彻底删除'}</Button></div></Modal>;
  return <Modal title={kind==='memory'?'修改与记忆':'评测与生成'} description={library.name} drawer onClose={onClose}><div className="mm-dialog-body mm-form-stack">
    <div className="mm-feature-tabs" role="group" aria-label="整理工具">{[['evaluate','生成前评测'],['generate','知识生成'],['memory','修改与记忆']].map(([id,label])=><Button key={id} aria-pressed={tab===id} onClick={()=>setTab(id)}>{label}</Button>)}</div>
    {tab==='evaluate' && <><div className="mm-health-score"><div><strong>{report.score}</strong><span>/ 100 · 本地规则检查</span></div></div><p className="mm-caption">根据本机可读正文、重复内容和待处理状态计算，不代表在线 AI 质量评估。</p>{report.checks.map(c=><section className="mm-feature-card" key={c.name}><h3>{c.name}<span className="mm-soft-tag">{c.warning?'需关注':'已检查'}</span></h3><p>{c.value}</p></section>)}<div className="mm-feature-inline"><Button onClick={()=>{setState(s=>appendActivity(s,'生成前评测',library.id,'本地规则得分 '+report.score));notify('已重新评测当前正文');}}>重新评测</Button><Button variant="primary" onClick={()=>setTab('generate')}>继续生成</Button></div></>}
    {tab==='generate' && <><div className="mm-notice">从已有正文提取可核验的整理提要，按主题归类并保留来源。不会改写原文；每个主题展示前 12 篇资料的摘录。在线 AI 重构与语义建图待接入。</div><label>生成方式<select value={mode} onChange={e=>setMode(e.target.value)}><option value="incremental">增量生成 · 检查输入变更并更新提要</option><option value="rebuild">重新生成 · 根据当前正文重建全部提要</option></select></label><details className="mm-advanced-settings mm-generation-method"><ActionSummary>智能体（可选） · {resolveActiveMethod(agentId,state.agentProfiles).name}</ActionSummary><p>默认使用通用整理，也可以选择已有的其他方式。</p><label>选择智能体<select value={resolveActiveMethod(agentId,state.agentProfiles).id} onChange={e=>setAgentId(e.target.value)}>{[...agentTemplates,...state.agentProfiles.filter(a=>!a.archived)].map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label></details><div className="mm-feature-stats"><span>{inputs.length} 篇输入正文</span><span>{memory.filter(m=>m.enabled!==false).length} 条记忆</span><span>{report.missing} 份缺正文</span></div><p className="mm-caption">记录所选智能体及规则版本，用户记忆作为单独的原则附录带入，不会覆盖原文事实。</p><Button variant="primary" disabled={!inputs.length} onClick={run}>{state.generations[library.id]?'生成新版本':'开始本地生成'}</Button>{!inputs.length&&<ActionLink href={'/upload?library='+encodeURIComponent(library.id)}>先添加可读资料 →</ActionLink>}{done&&<section className="mm-feature-card" role="status"><h3>本地整理完成</h3><p>已检查 {done.sourceCount} 篇正文，发现 {done.changed} 篇输入变更，生成 {done.pages.length} 篇主题提要，带入 {done.memory.length} 条记忆。</p><Button onClick={()=>{onClose();navigate(libraryPath(library.id,'knowledge',done.pages[0]?.id));}}>阅读整理结果</Button></section>}{state.generations[library.id]&&<p className="mm-caption">最近生成：{new Date(state.generations[library.id].at).toLocaleString('zh-CN')}</p>}</>}
    {tab==='memory'&&<><div className="mm-notice">保存你对这个库的纠正、命名和工作原则。启用的记忆在下次整理时带入；重新生成不会清除记忆。它们是用户提供的信息。</div><label>{editing?'编辑记忆':'新增纠正或原则'}<textarea rows={3} maxLength={2000} value={text} onChange={e=>setText(e.target.value)} placeholder="例如：正文中的产品名统一使用 MetaMind；推测必须单独标注。"/></label><div className="mm-feature-inline">{editing&&<Button onClick={()=>{setEditing('');setText('');}}>取消编辑</Button>}<Button variant="primary" disabled={!text.trim()} onClick={saveMemory}>保存记忆</Button></div>{memory.length?memory.map(m=><section className="mm-feature-card" key={m.id}><p>{m.text}</p><div className="mm-feature-inline"><label className="mm-check-inline"><input type="checkbox" checked={m.enabled!==false} onChange={e=>{const enabled=e.target.checked;setState(s=>({...s,memories:{...s.memories,[library.id]:(s.memories[library.id]||[]).map(x=>x.id===m.id?{...x,enabled}:x)}}));}}/>下次生成带入</label><Button variant="plain" onClick={()=>{setEditing(m.id);setText(m.text);}}>编辑</Button><Button variant="plain" onClick={()=>setState(s=>appendActivity({...s,memories:{...s.memories,[library.id]:(s.memories[library.id]||[]).filter(x=>x.id!==m.id)}},'移除用户记忆',library.id))}>移除</Button></div></section>):<p className="mm-caption">还没有记忆。也可以在问答后点击“纠正并记住”。</p>}</>}
  </div><div className="mm-dialog-actions"><Button onClick={onClose}>完成</Button></div></Modal>;
}

export function ReaderPanel({ kind, doc, docs, onOpen, onClose, headings, onHeading, onMap }) {
  const [query,setQuery]=useState('');const [application,setApplication]=useState('report');
  const relations=relatedPages(docs,doc.id).filter(item=>(item.doc.title+' '+item.reasons.join(' ')).toLowerCase().includes(query.toLowerCase()));
  const draft=(application==='video'?'视频脚本素材\n开场：'+doc.title+'\n\n':application==='image'?'长图内容提纲\n标题：'+doc.title+'\n\n':'汇报材料底稿\n主题：'+doc.title+'\n\n')+doc.paragraphs.slice(0,6).map((p,i)=>(i+1)+'. '+p).join('\n\n')+'\n\n来源：'+doc.title+'\n本地摘录草稿，请核验后编辑。';
  return <Modal title={kind==='toc'?'本页目录':kind==='relations'?'相关内容':'应用知识库'} description={doc.title} drawer onClose={onClose}><div className="mm-dialog-body mm-form-stack">
    {kind==='toc'&&(headings.length?<nav className="mm-toc-list" aria-label="本页章节">{headings.map((h,i)=><ActionButton key={i} style={{paddingLeft:(h.level-1)*12+12}} onClick={()=>{onClose();requestAnimationFrame(()=>onHeading(i));}}>{h.text}</ActionButton>)}</nav>:<Empty title="当前页面没有章节标题">可以直接阅读正文或围绕此页提问。</Empty>)}
    {kind==='relations'&&<><label><FeatureHint text="仅根据当前知识中的共同主题、关键词和引用来源展示，每条结果都标明关联理由。">查找相关内容</FeatureHint><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索标题、主题、知识点或来源"/></label>{onMap&&<Button onClick={onMap}>在知识图谱中浏览</Button>}{relations.map(item=><ActionButton className="mm-related-page" key={item.doc.id} onClick={()=>{onClose();onOpen(item.doc.id);}}><strong>{item.doc.title}</strong>{item.reasons.map(reason=><span key={reason}>{reason}</span>)}<small>阅读 →</small></ActionButton>)}{!relations.length&&<p className="mm-caption">{query?'没有匹配的相关内容，试试其他关键词。':'暂未发现相关内容，后续有共同主题、知识点或引用来源时会显示在这里。'}</p>}</>}
    {kind==='applications'&&<><div className="mm-notice">根据正文摘录生成可编辑草稿。在线 AI 写作、图片和视频生成尚未连接。</div><label>草稿用途<select value={application} onChange={e=>setApplication(e.target.value)}><option value="report">汇报材料</option><option value="image">长图提纲</option><option value="video">视频脚本素材</option></select></label><EditableDraft key={application+doc.id} text={draft}/></>}
  </div><div className="mm-dialog-actions"><Button onClick={onClose}>关闭</Button></div></Modal>;
}
function EditableDraft({text}) {const [value,setValue]=useState(text);const [copied,setCopied]=useState(false);return <><label>摘录草稿<textarea rows={12} value={value} onChange={e=>setValue(e.target.value)}/></label><div className="mm-feature-inline"><Button onClick={async()=>{try{await copyText(value);setCopied(true);}catch{setCopied(false);}}}>{copied?'已复制草稿':'复制草稿'}</Button><Button onClick={()=>{const url=URL.createObjectURL(new Blob([value],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='知识应用草稿.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}}>导出文本</Button></div></>;}

export function GlobalTools({ kind, libraries, sources, state, setState, onClose, navigate, notify }) {
  const [query,setQuery]=useState('');const [answer,setAnswer]=useState(null);
  const docs=libraries.flatMap(l=>libraryDocuments(l,sources).map(d=>({...d,actualId:d.id,id:l.id+'::'+d.id,libraryId:l.id,libraryName:l.name})));
  const needle=query.trim().toLowerCase();
  const results=needle?docs.filter(d=>(d.title+' '+d.paragraphs.join('\n')).toLowerCase().includes(needle)):[];
  const foundLibraries=needle?libraries.filter(l=>(l.name+' '+l.description).toLowerCase().includes(needle)):libraries;
  const log=state.activity || [];
  function ask(q=query) {
    if(!q.trim())return;setQuery(q);
    const evidence=findEvidence(q,docs).map(e=>({...e,libraryId:docs.find(d=>d.id===e.docId)?.libraryId,actualId:docs.find(d=>d.id===e.docId)?.actualId}));
    if(/最近|操作|做了/.test(q))setAnswer({text:log.length?'最近的本地操作如下。':'还没有本地操作记录，后续修改会自动记录。',logs:log.slice(0,8)});
    else if(/确认|处理|待整理/.test(q))setAnswer({text:'以下知识库有待整理或需处理的资料。',libraries:libraries.filter(l=>{const c=getCounts(l,sources);return c.waiting+c.processing+c.attention>0;})});
    else if(/哪些库|多少|有哪些知识/.test(q))setAnswer({text:'当前有 '+libraries.length+' 项知识，'+docs.length+' 篇可读内容。',libraries});
    else setAnswer({text:evidence.length?'找到相关内容，可以打开对应内容继续阅读和提问。':'没有找到相关正文，试试资料中的具体名称或关键词。',evidence});
  }
  const openDoc=d=>{onClose();navigate(libraryPath(d.libraryId,'knowledge',d.actualId||d.docId||d.id));};
  return <Modal title={{search:'搜索知识库 / 文档',assistant:'工作台助手',activity:'最近操作'}[kind]} description={kind==='assistant'?'了解有哪些资料、最近做了什么、下一步去哪里。':undefined} drawer onClose={onClose}><div className="mm-dialog-body mm-form-stack">
    {kind==='search'&&<><label>搜索知识库和正文<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="输入名称、主题或正文关键词" autoFocus/></label><p className="mm-caption">{foundLibraries.length} 项知识 · {results.length} 篇正文</p>{foundLibraries.map(l=><ActionButton className="mm-search-result" key={l.id} onClick={()=>{onClose();navigate(libraryPath(l.id));}}><strong>{l.name}</strong><small>{l.description}</small></ActionButton>)}{results.slice(0,80).map(d=><ActionButton className="mm-search-result" key={d.libraryId+d.id} onClick={()=>openDoc(d)}><strong>{d.title}</strong><small>{d.libraryName} · {d.category}</small><p>{d.paragraphs.find(p=>p.toLowerCase().includes(needle))?.slice(0,180)}</p></ActionButton>)}{results.length>80&&<p className="mm-caption">显示前 80 条，请细化关键词。</p>}</>}
    {kind==='assistant'&&<><div className="mm-feature-inline">{['我有哪些知识？','最近做了什么操作？','哪些内容需要确认？'].map(q=><Button key={q} onClick={()=>ask(q)}>{q}</Button>)}</div><form onSubmit={e=>{e.preventDefault();ask();}} className="mm-form-stack"><label>向工作台提问<textarea rows={3} value={query} onChange={e=>setQuery(e.target.value)} placeholder="例如：字体规范应该到哪里看？"/></label><Button variant="primary" type="submit" disabled={!query.trim()}>查找</Button></form><p className="mm-caption">使用本地记录和段落检索，不调用在线 AI。</p>{answer&&<section className="mm-feature-card" role="status"><p>{answer.text}</p>{answer.logs&&<ActivityList items={answer.logs} libraries={libraries}/>}<div className="mm-related-list">{answer.libraries?.map(l=><ActionButton key={l.id} onClick={()=>{onClose();navigate(libraryPath(l.id));}}>{l.name}<span>打开内容 →</span></ActionButton>)}{answer.evidence?.map((e,i)=><ActionButton key={i} onClick={()=>openDoc(e)}>{e.title}<small>{e.text.slice(0,140)}</small></ActionButton>)}</div></section>}</>}
    {kind==='activity'&&<><p className="mm-caption">记录当前浏览器中最近 300 次操作。</p>{log.length?<ActivityList items={log.filter(x=>!needle||(x.label+' '+x.detail).toLowerCase().includes(needle))} libraries={libraries}/>:<Empty title="还没有本地操作记录">添加资料、修改记忆和生成提要后会自动记录。</Empty>}<label>筛选操作<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="按操作名称筛选"/></label></>}

  </div><div className="mm-dialog-actions"><Button onClick={onClose}>关闭</Button></div></Modal>;
}
function ActivityList({items,libraries}) {return <ol className="mm-activity-list">{items.map((x,i)=><li key={x.id||i}><time>{new Date(x.at).toLocaleString('zh-CN')}</time><strong>{x.label}</strong><span>{libraries.find(l=>l.id===x.libraryId)?.name||''}</span>{x.detail&&<p>{x.detail}</p>}</li>)}</ol>;}
export function DynamicRelations({docs,onOpen}) {
  const [query,setQuery]=useState('');const [mode,setMode]=useState('keywords');
  const keywords=documentRelations(docs,[query]);
  const bySource=new Map();for(const d of docs){for(const path of d.sourcePaths||[]){if(!bySource.has(path))bySource.set(path,[]);bySource.get(path).push(d);}}
  const groups=(mode==='keywords'?keywords:[...bySource].filter(([,ds])=>ds.length>1).map(([term,documents])=>({term,documents}))).filter(g=>!query||g.term.toLowerCase().includes(query.toLowerCase()));
  return <section className="mm-feature-card"><div className="mm-list-toolbar"><label className="mm-search"><input aria-label="搜索关联" placeholder="搜索关键词或来源路径" value={query} onChange={e=>setQuery(e.target.value)}/></label><select aria-label="关系类型" value={mode} onChange={e=>setMode(e.target.value)}><option value="keywords">共同知识点</option><option value="sources">共同引用来源</option></select></div><p className="mm-caption">由当前正文实时重算。共同关键词表示文本共现，共同来源表示引用相同文件，均可打开正文核验。</p><div className="mm-relations-grid">{groups.map(g=><article className="mm-feature-card" key={g.term}><h3 title={g.term}>{g.term.split('/').at(-1)}<span className="mm-soft-tag">{g.documents.length} 篇</span></h3><div className="mm-related-list">{g.documents.map(d=><ActionButton key={d.id} onClick={()=>onOpen(d)}>{d.title}<span>阅读 →</span></ActionButton>)}</div></article>)}</div>{!groups.length&&<Empty title="没有找到跨文档关联">添加相关资料或切换关系类型。</Empty>}</section>;
}
