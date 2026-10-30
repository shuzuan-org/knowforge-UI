import { ActionLink } from './ActionControls.jsx';
import React, {useEffect, useRef, useState} from 'react';
import {Button, Empty, Modal} from './workbench-components.jsx';
import {ShareContentDialog} from './KnowledgeSharing.jsx';
import {libraryDocuments} from './workbench-docs.js';
import {libraryPath} from './workbench-model.mjs';
import guideCopy from './official-guide-copy.json';
import './guide.css';

const ids=['quick','choose','share','upload','methods','agent'];
const METASK='https://app.metask-ai.com/app/ai';
const quickActions=[
  ['/upload?new=1','添加第一份资料'],
  [METASK,'打开 Metask'],
  ['/workspace?use=tools','复制给 Agent'],
  ['/guide?action=ask','开始提问'],
  ['/guide?action=share','选择要分享的知识库']
];
const detailActions={upload:['/upload','添加资料'],methods:['/upload?settings=1','设置智能体'],agent:['/workspace?use=tools','复制给 Agent']};
const agentLabels=['「复制给 Agent」','这个链接','链接泄露了：','Agent 能做的：'];
function Action({href,children,className}){const external=href.startsWith('https:');return <ActionLink className={className} href={href} {...(external?{target:'_blank',rel:'noopener noreferrer'}:{})}>{children} <span aria-hidden="true">{external?'↗':'→'}</span></ActionLink>;}
function Section({id,title,children}){return <section className="mm-guide-section" id={'guide-'+id} aria-labelledby={'guide-title-'+id}><h2 id={'guide-title-'+id}>{title}</h2>{children}</section>;}
function Emphasis({text,phrase}){if(!phrase||!text.includes(phrase))return text;const index=text.indexOf(phrase);return <>{text.slice(0,index)}<strong>{phrase}</strong>{text.slice(index+phrase.length)}</>;}
function OriginalStep({text,linkMetask}){if(!linkMetask)return text;const phrase='metask-ai',index=text.indexOf(phrase);return <>{text.slice(0,index)}<a href={METASK} target="_blank" rel="noopener noreferrer">{phrase}</a>{text.slice(index+phrase.length)}</>;}
function Details({section,id}){return <dl className="mm-guide-details">{section.items.map((item,index)=>{const label=item.label?item.label+'：':agentLabels[index];return <div key={index}><dt>{label}</dt><dd>{item.text.slice(label.length)}</dd></div>;})}</dl>;}

export function GuideView({items,sources,state,setState,notify,route,navigate}){
  const heading=useRef(null);
  const previousAction=useRef('');
  const [selection,setSelection]=useState('');
  const action=['ask','share'].includes(route.searchParams.get('action'))?route.searchParams.get('action'):'';
  const choices=action?items.filter(item=>item.available!==false&&(action!=='share'||!item.isShared)).map(item=>({...item,documents:libraryDocuments(item,sources)})).filter(item=>item.documents.length):[];
  const sharing=action==='share'?choices.find(item=>item.id===route.searchParams.get('library')):null;
  const selected=choices.find(item=>item.id===selection);
  useEffect(()=>{heading.current?.focus({preventScroll:true});},[]);
  useEffect(()=>{
    setSelection('');
    if(action){previousAction.current=action;return;}
    const last=previousAction.current;previousAction.current='';
    if(last){const frame=requestAnimationFrame(()=>document.querySelector('.mm-guide a[href="/guide?action='+last+'"]')?.focus({preventScroll:true}));return()=>cancelAnimationFrame(frame);}
  },[action]);
  function closeAction(){const params=new URLSearchParams(route.searchParams);params.delete('action');params.delete('library');navigate('/guide'+(params.size?'?'+params:''),true,false);}
  function continueAction(event){
    event.preventDefault();if(!selected)return;
    if(action==='share')navigate('/guide?action=share&library='+encodeURIComponent(selected.id),false,false);
    else {navigate(libraryPath(selected.id,'ask'),false,false);requestAnimationFrame(()=>document.getElementById('mm-question')?.focus({preventScroll:true}));}
  }
  const [quick,comparison]=guideCopy.sections;
  return <><div className="mm-guide">
    <header className="mm-page-heading"><h1 ref={heading} tabIndex={-1}>{guideCopy.title}</h1><ActionLink className="mm-button" href="/workspace">返回知识库</ActionLink></header>
    <nav className="mm-guide-nav" aria-label="使用说明目录">{guideCopy.sections.map((section,index)=><a key={ids[index]} href={'#guide-'+ids[index]}>{section.title}</a>)}</nav>
    <Section id="quick" title={quick.title}>
      <div className="mm-guide-quick">{quick.cards.map((card,index)=>{const [,number,title]=card.title.match(/^(\d+\.)\s*(.*)$/);const [href,label]=quickActions[index];return <article key={number}><h3><span>{number}</span>{title}</h3><ol>{card.steps.map((text,step)=><li key={step}><OriginalStep text={text} linkMetask={index===1&&step===0}/></li>)}</ol><Action href={href}>{label}</Action></article>;})}</div>
    </Section>
    <Section id="choose" title={comparison.title}>
      <div className="mm-guide-table-wrap" role="region" aria-label="知识使用方式对比，可横向滚动" tabIndex={0}><table><caption className="mm-guide-sr">知识使用方式对比</caption><thead><tr>{comparison.columns.map(column=><th key={column} scope="col">{column}</th>)}</tr></thead><tbody>{comparison.rows.map((row,index)=><tr key={row[0]}><th scope="row">{row[0]}</th>{row.slice(1).map((cell,column)=><td key={column}><Emphasis text={cell} phrase={index===0&&column===1?'不做深度思考':''}/></td>)}</tr>)}</tbody></table></div>
    </Section>
    {guideCopy.sections.slice(2).map((section,index)=>{const id=ids[index+2],action=detailActions[id];return <Section key={id} id={id} title={section.title}>{section.intro&&<p><Emphasis text={section.intro} phrase={section.emphasis}/></p>}<Details section={section} id={id}/>{action&&<Action className="mm-guide-action" href={action[0]}>{action[1]}</Action>}</Section>;})}
  </div>
    {action&&!sharing&&<Modal title={action==='share'?'选择要分享的知识库':'选择要提问的知识库'} description={action==='share'?'选择自己的知识库，复制整个知识库的分享链接。':'仅根据选中的知识库回答，不会自动发送问题。'} onClose={closeAction}>
      <form onSubmit={continueAction}><div className="mm-dialog-body mm-form-stack">{choices.length?<><label>知识库<select value={selected?.id||''} onChange={event=>setSelection(event.target.value)} required autoFocus><option value="" disabled>请选择知识库</option>{choices.map(item=><option key={item.id} value={item.id}>{item.name}{item.isShared?' · 与我共享':''} · {item.documents.length} 篇内容</option>)}</select></label>{selected&&<p className="mm-caption">{selected.description||selected.name}</p>}</>:<Empty title={action==='share'?'还没有可分享的内容':'还没有可提问的知识库'} action={<ActionLink className="mm-button mm-button-primary" href="/upload?new=1">添加第一份资料</ActionLink>}>{action==='share'?'自己的知识库中有可读页面后，就可以复制知识库分享链接。':'添加资料或接收分享，准备好正文后即可提问。'}</Empty>}</div><div className="mm-dialog-actions"><Button onClick={closeAction}>取消</Button>{choices.length>0&&<Button variant="primary" type="submit" disabled={!selected}>{action==='share'?'复制分享链接':'进入知识库问答'}</Button>}</div></form>
    </Modal>}
    {sharing&&<ShareContentDialog library={sharing} documents={sharing.documents} state={state} setState={setState} notify={notify} onClose={closeAction}/>}
  </>;
}
