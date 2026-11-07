import { ActionIcon, ActionLink, ActionButton } from './ActionControls.jsx';
import React,{useEffect,useRef,useState} from 'react';
import {Button,Modal} from './workbench-components.jsx';
import './account-menu.css';

const PREVIEW_KEY='metamind-account-preview';
export function useAccountPreview(){
  const [preview,setPreview]=useState(()=>{try{return sessionStorage.getItem(PREVIEW_KEY)==='1';}catch{return false;}});
  useEffect(()=>{try{if(preview)sessionStorage.setItem(PREVIEW_KEY,'1');else sessionStorage.removeItem(PREVIEW_KEY);}catch{}},[preview]);
  return [preview,setPreview];
}
export function useAccountAppearance(legacy){
  const [appearance,setAppearance]=useState(()=>{try{const v=localStorage.getItem('metamind-appearance');return ['system','light','dark'].includes(v)?v:'light';}catch{return 'light';}});
  useEffect(()=>{
    if(legacy)return;
    const media=window.matchMedia('(prefers-color-scheme: dark)');
    const apply=()=>{document.documentElement.dataset.theme=appearance==='system'?(media.matches?'dark':'light'):appearance;};
    apply();media.addEventListener('change',apply);
    try{localStorage.setItem('metamind-appearance',appearance);}catch{}
    return()=>media.removeEventListener('change',apply);
  },[appearance,legacy]);
  return [appearance,setAppearance];
}

export function AccountMenu({onOpen,preview,onLogout}){
  const [open,setOpen]=useState(false);const root=useRef(null),trigger=useRef(null);
  useEffect(()=>{
    function dismiss(e){if(!open)return;if(e.type==='keydown'){if(e.key!=='Escape')return;e.preventDefault();setOpen(false);trigger.current?.focus();}else if(!root.current?.contains(e.target))setOpen(false);}
    document.addEventListener('pointerdown',dismiss);document.addEventListener('keydown',dismiss);
    return()=>{document.removeEventListener('pointerdown',dismiss);document.removeEventListener('keydown',dismiss);};
  },[open]);
  function move(e){if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;e.preventDefault();const actions=[...root.current.querySelectorAll('[role=menuitem]')];let i=actions.indexOf(document.activeElement);i=e.key==='Home'?0:e.key==='End'?actions.length-1:(i+(e.key==='ArrowUp'?-1:1)+actions.length)%actions.length;actions[i]?.focus();}
  return <div className="mm-account-dock" ref={root}>
    {open&&<div className="mm-account-popover" role="menu" aria-label="账户操作" onKeyDown={move}>
      <div className="mm-account-head"><span className="mm-account-avatar" aria-hidden="true"><ActionIcon name="user" size={18}/></span><div><strong>{preview?'演示账号':'未登录'}</strong><small>{preview?'演示登录':'登录后查看账户信息'}</small></div></div>
      <div className="mm-account-balance"><div><span>存储空间</span><strong aria-label="账号未连接，容量未知">— / —</strong></div><div className="mm-account-progress" aria-hidden="true"/></div>
      <div className="mm-account-balance"><div><span>剩余积分</span><strong aria-label="账号未连接，积分未知">—</strong></div></div>
      <div className="mm-account-actions"><ActionLink role="menuitem" href="/">返回首页</ActionLink><ActionButton role="menuitem" onClick={()=>{setOpen(false);onOpen('profile');}}>个人中心</ActionButton>{preview?<ActionButton role="menuitem" onClick={()=>{setOpen(false);onLogout();}}>退出登录</ActionButton>:<ActionButton role="menuitem" onClick={()=>{setOpen(false);onOpen('login');}}>登录账户</ActionButton>}</div>
    </div>}
    <ActionButton ref={trigger} className="mm-account-trigger" aria-label={preview?'账户菜单':'登录账户'} aria-haspopup={preview?'menu':'dialog'} aria-expanded={preview?open:undefined} onClick={()=>{if(!preview){onOpen('login');return;}setOpen(v=>!v);}} onKeyDown={e=>{if(preview&&['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();setOpen(true);requestAnimationFrame(()=>{const nodes=root.current?.querySelectorAll('[role=menuitem]');nodes?.[e.key==='ArrowUp'?nodes.length-1:0]?.focus();});}}}>
      <span className="mm-account-avatar" aria-hidden="true"><ActionIcon name="user" size={18}/></span><span className="mm-account-trigger-copy"><strong>{preview?'演示账号':'登录'}</strong><small>{preview?'演示登录':'未登录'}</small></span>{preview&&<span className={'mm-account-caret'+(open?' is-open':'')} aria-hidden="true">⌃</span>}
    </ActionButton>
  </div>;
}

export function AccountPanel({kind,onClose,appearance,onAppearance,preview,onLogin,onLogout,onOpen}){
  if(kind==='login')return <Modal title="登录账户" description="在当前原型中体验登录后的界面。" onClose={onClose}><div className="mm-dialog-body mm-account-panel"><div className="mm-account-login-preview"><span className="mm-account-avatar" aria-hidden="true"><ActionIcon name="user" size={18}/></span><div><strong>演示账号</strong><p className="mm-caption">无需真实账号或密码，不会连接在线账户。</p></div></div></div><div className="mm-dialog-actions"><Button onClick={onClose}>取消</Button><Button variant="primary" onClick={onLogin}>使用演示账号</Button></div></Modal>;
  if(kind==='contact'||kind==='password')return <Modal title={kind==='contact'?'修改联系方式':'修改密码'} description="账户服务尚未连接，当前仅展示操作界面。" onClose={onClose}><div className="mm-dialog-body mm-form-stack">{kind==='contact'?<><label>邮箱<input type="email" placeholder="未设置" disabled/></label><label>手机号<input type="tel" placeholder="未设置" disabled/></label></>:<><label>新密码<input type="password" placeholder="原型中无需填写真实密码" disabled/></label><label>确认密码<input type="password" placeholder="原型中无需填写真实密码" disabled/></label></>}</div><div className="mm-dialog-actions"><Button onClick={()=>onOpen('profile')}>返回个人中心</Button><Button variant="primary" disabled>保存</Button></div></Modal>;
  return <Modal title="个人中心" onClose={onClose}><div className="mm-dialog-body mm-account-panel">
    <div className="mm-notice">{preview?'当前为演示账号，在线账户信息和用量暂不可用。':'尚未登录，在线账户信息和用量暂不可用。'}当前浏览器的资料不会自动上传。</div>
    <div className="mm-account-profile-stats">{[['用户名',preview?'演示账号':'未登录'],['权限',preview?'演示预览':'—'],['已用空间','—'],['空间配额','—']].map(([label,value])=><div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
    <section><h3>账号信息</h3><dl className="mm-account-info">{[['显示名',preview?'演示账号':'未登录'],['邮箱','—'],['电话','—'],['UUID','—'],['状态',preview?'演示登录':'未登录'],['最近登录','—']].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>{preview?<Button onClick={onLogout}>退出登录</Button>:<Button onClick={()=>onOpen('login')}>登录账户</Button>}</section>
    <section><h3>联系方式</h3><p>查看或修改账号的邮箱和手机号。</p><Button onClick={()=>onOpen('contact')}>修改联系方式</Button></section>
    <section><h3>修改密码</h3><p>修改当前账号的登录密码。</p><Button onClick={()=>onOpen('password')}>修改密码</Button></section>
    <section><h3>外观</h3><div className="mm-account-period" role="group" aria-label="工作区外观">{[['system','跟随系统'],['light','浅色'],['dark','深色']].map(([id,label])=><Button key={id} aria-pressed={appearance===id} onClick={()=>onAppearance(id)}>{label}</Button>)}</div><p className="mm-caption">跟随系统时随操作系统深浅色切换；浅色或深色会记住你的选择。</p></section>
  </div><div className="mm-dialog-actions"><Button onClick={onClose}>关闭</Button></div></Modal>;
}
