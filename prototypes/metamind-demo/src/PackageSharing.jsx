import { ActionLink } from './ActionControls.jsx';
import { ActionLabel, ActionSummary } from './ActionControls.jsx';
import React,{useState} from 'react';
import {Button,Empty} from './workbench-components.jsx';
import {makeManifest,importManifest,validateManifest,appendActivity} from './feature-model.mjs';
import {libraryDocuments} from './workbench-docs.js';
import {libraryPath} from './workbench-model.mjs';
import {copyText} from './copy-text.js';
import {downloadJSON} from './FeaturePanels.jsx';

export function PackageSharing({item,libraries,sources,state,setState,notify}) {
  const active=Object.entries(state.localShares).find(([,v])=>v.packageId===item.id&&!v.revoked);
  const [error,setError]=useState('');const [copied,setCopied]=useState(false);
  const shareUrl=active?location.origin+'/packages?demoShare='+encodeURIComponent(active[0]):'';
  function issue() {
    const id=crypto.randomUUID();const manifest=makeManifest(item,libraries,l=>libraryDocuments(l,sources));
    setState(s=>appendActivity({...s,localShares:{...Object.fromEntries(Object.entries(s.localShares).map(([k,v])=>[k,v.packageId===item.id?{...v,revoked:true}:v])),[id]:{packageId:item.id,manifest,createdAt:new Date().toISOString(),revoked:false}}},active?'重置本地分享':'创建本地分享','',item.name));setCopied(false);notify('分享已创建，仅当前浏览器可接收');
  }
  async function copy(value) {try{await copyText(value);setCopied(true);setError('');}catch{setError('浏览器未允许复制，请手动选中文字复制。');}}
  return <div className="mm-form-stack"><div className="mm-notice">分享保存当前可读内容。链接或 UUID 仅在当前浏览器有效；跨浏览器请导出分享文件。在线分享尚未连接。</div><section className="mm-feature-card mm-form-stack"><h3>本地分享</h3>{active?<><label>本机分享链接<input readOnly value={shareUrl}/></label><label>本机分享 UUID<input readOnly value={active[0]}/></label><div className="mm-feature-inline"><Button onClick={()=>copy(shareUrl)}>{copied?'已复制':'复制分享链接'}</Button><Button onClick={issue}>重置分享链接</Button><Button onClick={()=>{setState(s=>appendActivity({...s,localShares:{...s.localShares,[active[0]]:{...s.localShares[active[0]],revoked:true}}},'撤销本地分享','',item.name));notify('链接已撤销，经此链接接收的内容将不可用');}}>撤销分享</Button></div><p className="mm-caption">重置后旧 UUID 失效，旧分享导入的内容停止显示；导出的离线文件无法远程撤销。</p></>:<Button disabled={!item.enabled} onClick={issue}>创建本机分享链接</Button>}</section><Button onClick={()=>downloadJSON(makeManifest(item,libraries,l=>libraryDocuments(l,sources)),item.name+'.metamind.json')}>导出分享文件</Button>{error&&<p className="mm-field-error" role="alert">{error}</p>}<DemoConnection state={state} setState={setState} notify={notify}/></div>;
}
export function ReceivedPackages({state,setState,notify,route}) {
  const [input,setInput]=useState(route.searchParams.get('demoShare')||'');const [error,setError]=useState('');
  function receive(value,shareId='') {try{validateManifest(value);setState(s=>importManifest(s,value,'received-'+crypto.randomUUID(),shareId));setInput('');setError('');notify('资源包已导入，可阅读和提问');}catch(e){setError(e.message);}}
  function submit(e) {e.preventDefault();let id=input.trim();try{if(/^https?:/.test(id)){const u=new URL(id);if(u.origin!==location.origin)throw new Error('在线分享尚未连接。请导入 .metamind.json 分享文件。');id=u.searchParams.get('demoShare')||'';}const value=state.localShares[id];if(!value||value.revoked)throw new Error('未找到有效的本地分享，请检查 UUID，或改用分享文件。');receive(value.manifest,id);}catch(e){setError(e.message);}}
  return <div className="mm-form-stack"><section className="mm-feature-card mm-form-stack"><h2>添加收到的分享</h2><form onSubmit={submit} className="mm-form-stack"><label>本机链接或 UUID<input value={input} onChange={e=>setInput(e.target.value)} placeholder="粘贴本机本机分享链接或 UUID"/></label><Button type="submit" variant="primary" disabled={!input.trim()}>导入分享</Button></form><ActionLabel className="mm-button">从分享文件导入<input hidden type="file" accept=".json" onChange={async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>8_000_000)throw new Error('文件超过8MB，请拆分导出。');receive(JSON.parse(await f.text()));}catch(err){setError(err.message);}e.target.value='';}}/></ActionLabel><p className="mm-caption">离线文件以文本快照导入，不执行 HTML、脚本或源码。在线分享尚未连接。</p>{error&&<p className="mm-field-error" role="alert">{error}</p>}</section>{state.receivedShares.length?state.receivedShares.map(p=>{const revoked=p.sourceShareId&&state.localShares[p.sourceShareId]?.revoked;return <section className="mm-feature-card" key={p.id}><h3>{p.name}<span className="mm-soft-tag">{revoked?'分享已撤销':p.enabled?'已导入':'已取消接收'}</span></h3><p>{p.description}</p><div className="mm-related-list">{!revoked&&p.enabled&&p.libraryIds.map(id=><ActionLink key={id} href={libraryPath(id)}>进入知识库 → {state.customLibraries.find(l=>l.id===id)?.name}</ActionLink>)}</div><Button variant="plain" disabled={!!revoked} onClick={()=>setState(s=>({...s,receivedShares:s.receivedShares.map(x=>x.id===p.id?{...x,enabled:!x.enabled}:x)}))}>{p.enabled?'取消接收':'恢复接收'}</Button></section>;}):<Empty title="还没有收到资源包">接收本机分享链接，或导入别人提供的分享文件。</Empty>}</div>;
}
export function DemoConnection({state,setState,notify}) {
  const [visible,setVisible]=useState(false);const [copied,setCopied]=useState(false);
  const key='demo_key_NOT_A_CREDENTIAL_v'+state.demoKeyVersion;
  const config=JSON.stringify({mcpServers:{metamind:{url:'https://YOUR_METAMIND_SERVER/mcp',headers:{Authorization:'Bearer '+key}}}},null,2);
  async function copy(value){try{await copyText(value);setCopied(true);}catch{notify('复制失败，请手动复制。');}}
  return <section className="mm-feature-card mm-form-stack"><h3>API Key 与 MCP<span className="mm-soft-tag">演示配置</span></h3><p className="mm-caption">以下密钥为明显标记的演示值，不具有认证能力。更新此值不影响真实凭据；在线服务、权限与访问记录尚未连接。</p><label>演示 API Key<input readOnly type={visible?'text':'password'} value={key}/></label><div className="mm-feature-inline"><Button onClick={()=>setVisible(v=>!v)}>{visible?'隐藏':'显示'}</Button><Button onClick={()=>copy(key)}>{copied?'已复制演示值':'复制演示 Key'}</Button><Button onClick={()=>{setState(s=>appendActivity({...s,demoKeyVersion:s.demoKeyVersion+1},'轮换演示 Key'));setCopied(false);notify('演示值已更新，不影响任何真实凭据');}}>轮换演示 Key</Button></div><details><ActionSummary>查看 MCP 配置示例</ActionSummary><pre className="mm-code-preview">{config}</pre><Button onClick={()=>copy(config)}>复制 MCP 示例</Button></details><p>在线状态：AI 问答、网页抓取、OCR、MCP / Agent 均未连接。</p></section>;
}
