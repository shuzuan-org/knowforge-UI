import React from 'react';
import { actionIconName, actionPaths } from './action-icon-model.mjs';

export function ActionIcon({name='arrow-right',size=16,className='',...props}) {
  return <svg className={'mm-action-icon '+className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" style={{'--mm-icon-size':size+'px'}} {...props}>{(actionPaths[name]||actionPaths['arrow-right']).map((d,i)=><path key={i} d={d}/>)}</svg>;
}
const glyphs={'×':'close','＋':'plus','+':'plus','−':'minus','↗':'arrow-up-right','→':'arrow-right','‹':'arrow-left','⌄':'chevron-down','⌃':'chevron-up'};
function textOf(value) {
  return React.Children.toArray(value).map(child=>typeof child==='string'||typeof child==='number'?String(child):React.isValidElement(child)&&child.props['aria-hidden']!==true?textOf(child.props.children):'').join('');
}
function normalize(children, preferred) {
  const cueName=glyph=>/[↗→]/.test(glyph)&&preferred&&!preferred.startsWith('arrow-')?preferred:glyphs[glyph];
  return React.Children.map(children,child=>{
    if(typeof child==='string') {
      const text=child.trim();
      if(glyphs[text])return <ActionIcon name={glyphs[text]}/>;
      if(/^\s*‹\s*/.test(child))return <><ActionIcon name="arrow-left"/>{child.replace(/^\s*‹\s*/,'')}</>;
      const m=child.match(/^([\s\S]*?\S)\s*([↗→])\s*$/);
      if(m)return <>{m[1]}<ActionIcon name={cueName(m[2])}/></>;
      return child;
    }
    if(!React.isValidElement(child))return child;
    if(child.type===ActionIcon||child.type?.isActionIcon)return child;
    if(child.type==='svg')return React.cloneElement(child,{strokeWidth:1.7,strokeLinecap:'round',strokeLinejoin:'round'});
    if(child.props.className==='mm-reader-copy-icon')return <ActionIcon name="copy"/>;
    if(child.props['aria-hidden']===true&&glyphs[textOf(child.props.children).trim()])return React.cloneElement(child,{},<ActionIcon name={cueName(textOf(child.props.children).trim())}/>);
    return child.props.children?React.cloneElement(child,{},normalize(child.props.children,preferred)):child;
  });
}
function hasIcon(children) {
  return React.Children.toArray(children).some(child=>React.isValidElement(child)&&(child.type===ActionIcon||child.type?.isActionIcon||child.type==='svg'||child.type==='img'||/nav-icon|avatar|file-type/.test(child.props.className||'')||hasIcon(child.props.children)));
}
function withInlineIcon(children,icon) {
  let inserted=false;
  const visit=nodes=>React.Children.map(nodes,child=>{
    if(inserted||!React.isValidElement(child))return child;
    if(['strong','h3','h4'].includes(child.type)){inserted=true;return React.cloneElement(child,{},icon,child.props.children);}
    if(child.props.children)return React.cloneElement(child,{},visit(child.props.children));
    return child;
  });
  const result=visit(children);
  return inserted?result:<>{icon}{children}</>;
}
function Control({as:Tag,children,icon,className='',...props}) {
  const label=textOf(children).trim();
  const preferred=icon||actionIconName(label||props['aria-label'],{...props,className});
  const normalized=normalize(children,preferred);
  const structured=/mm-account-trigger|mm-library-catalog-row|mm-search-result|mm-related-page|mm-graph-node/.test(className)||React.Children.toArray(children).some(c=>React.isValidElement(c)&&['strong','div','p','h3'].includes(c.type));
  const has=hasIcon(normalized);
  const picture=<ActionIcon name={preferred}/>;
  const content=icon===false||has?normalized:structured?withInlineIcon(normalized,picture):<>{picture}{normalized}</>;
  const onlyGlyph=!!glyphs[label];
  return <Tag {...props} aria-label={props['aria-label']||(onlyGlyph&&label==='×'?'关闭':undefined)} className={className+' mm-action-control'+(!structured?' mm-action-simple':'')}>{content}</Tag>;
}
export function ActionButton(props){return <Control as="button" {...props}/>;}
export function ActionLink(props){return <Control as="a" {...props}/>;}
export function ActionSummary(props){return <Control as="summary" {...props}/>;}
export function ActionLabel(props){return <Control as="label" {...props}/>;}
