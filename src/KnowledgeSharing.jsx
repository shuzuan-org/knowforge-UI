import { ActionSummary, ActionLink, ActionLabel, ActionButton } from './ActionControls.jsx';
import React,{useState} from 'react';
import {Button,Modal,Empty} from './workbench-components.jsx';
import {copyText} from './copy-text.js';
import {downloadJSON} from './FeaturePanels.jsx';
import {DemoConnection} from './PackageSharing.jsx';
import {libraryPath} from './workbench-model.mjs';
import {createLibraryShare,resetKnowledgeShare,revokeKnowledgeShare,receiveKnowledge,resolveShareInput} from './knowledge-model.mjs';
import {validateManifest} from './feature-model.mjs';
import {AccessLinkFields} from './AccessLinkFields.jsx';

export function ShareContentDialog({library,documents,state,setState,notify,onClose}) {
  const [error,setError]=useState('');const [copied,setCopied]=useState(false);const [busy,setBusy]=useState(false);
  const active=Object.entries(state.localShares).find(([,share])=>!share.revoked&&state.resourcePackages.some(p=>p.id===share.packageId&&p.kind==='library-share'&&p.sourceLibraryId===library.id&&p.enabled!==false));
  const link=active?location.origin+'/workspace?filter=shared&receive=1&demoShare='+encodeURIComponent(active[0]):'';
  async function copy(){
    setBusy(true);setError('');
    try{
      let value=link;
      if(!active){
        const args={library,documents,packageId:'library-share-'+crypto.randomUUID(),shareId:crypto.randomUUID()};
        createLibraryShare(state,args);
        setState(s=>createLibraryShare(s,args));
        value=location.origin+'/workspace?filter=shared&receive=1&demoShare='+encodeURIComponent(args.shareId);
      }
      await copyText(value);setCopied(true);notify('知识库分享链接已复制');
    }catch(e){setError(e.message||'复制失败，请手动选中链接复制。');}finally{setBusy(false);}
  }
  return <Modal title="复制分享链接" description="仅分享当前知识库，可发给别人或接入工具。" onClose={onClose}>
    <AccessLinkFields scope={'当前知识库「'+library.name+'」。'} address={link} status="仅当前浏览器" inputLabel="知识库分享链接" placeholder="点击下方按钮生成并复制链接" permission={<>原站开启游客访问时，对方无需注册，可将链接粘贴给 Agent 使用；网页登录后可添加到自己的账号。<br/>本地链接仅在当前浏览器有效，保存当前可读内容。在线分享及游客接入尚未连接。</>} error={error}/>
    <div className="mm-dialog-actions mm-agent-access-actions"><Button variant="primary" onClick={copy} disabled={busy||!documents.length}>{copied?'已复制地址':'复制地址'}</Button></div>
  </Modal>;
}
export function ShareAccess({item,state,setState,notify}) {
  const [copied,setCopied]=useState(false);const [error,setError]=useState('');
  const active=Object.entries(state.localShares).find(([,s])=>s.packageId===item.id&&!s.revoked&&item.enabled!==false);
  const latest=Object.values(state.localShares).filter(s=>s.packageId===item.id).at(-1);
  const manifest=item.manifest || active?.[1].manifest || latest?.manifest;
  const documents=(manifest?.libraries||[]).flatMap(l=>l.documents);
  const link=active?location.origin+'/workspace?filter=shared&receive=1&demoShare='+encodeURIComponent(active[0]):'';
  async function copy(){try{await copyText(link);setCopied(true);setError('');notify('分享链接已复制');}catch{setError('复制失败，请手动选中链接复制。');}}
  return <>
    <section className="mm-share-summary"><div><span className="mm-soft-tag">{active?'分享可用':'已撤销或尚未生成'}</span><h3>{item.name}</h3><p>{documents.length} 篇内容 · {manifest?.publisher || item.publisher || '知识分享者'}</p></div></section>
    {manifest?<><details className="mm-share-scope"><ActionSummary>查看分享范围 · {documents.length} 篇</ActionSummary>{(manifest.libraries||[]).map((l,i)=><div key={i}><p>来自「{l.name}」</p><ul>{l.documents.map(d=><li key={d.id}>{d.title}</li>)}</ul></div>)}</details>
    {active&&<label>分享链接<input className="mm-share-link" value={link} readOnly onFocus={e=>e.currentTarget.select()}/></label>}
    <div className="mm-feature-inline">{active&&<Button variant="primary" onClick={copy}>{copied?'已复制链接':'复制分享链接'}</Button>}<Button onClick={()=>downloadJSON(manifest,item.name+'.metamind.json')}>导出分享文件</Button></div>
    <p className="mm-caption">分享链接仅在当前浏览器有效。跨浏览器请使用分享文件；在线分享尚未连接。</p>
    <details className="mm-share-management"><ActionSummary>管理这次分享</ActionSummary><p className="mm-caption">重置或撤销后，旧链接及通过它接收的内容会失效。离线导出的文件无法远程撤销。</p><div className="mm-feature-inline"><Button onClick={()=>{try{const id=crypto.randomUUID();resetKnowledgeShare(state,item.id,id);setState(s=>resetKnowledgeShare(s,item.id,id));setCopied(false);notify('已生成新链接，旧链接失效');}catch(e){setError(e.message);}}}>{active?'重置分享链接':'重新生成链接'}</Button>{active&&<Button onClick={()=>{setState(s=>revokeKnowledgeShare(s,item.id));setCopied(false);notify('分享已撤销');}}>撤销分享</Button>}</div></details>
    </>:<><p className="mm-caption">这是旧版保存的分享范围。请打开对应知识库，重新复制当前知识库的 MCP 地址。</p>{item.libraryIds?.[0]&&<ActionLink href={libraryPath(item.libraryIds[0])} className="mm-button">打开知识库</ActionLink>}</>}
    {error&&<p role="alert" className="mm-field-error">{error}</p>}
  </>;
}
export function ReceiveKnowledgeDialog({route,state,setState,notify,navigate,onClose,listOnly=false}) {
  const [input,setInput]=useState(route.searchParams.get('demoShare')||'');const [error,setError]=useState('');
  let preview,previewError='';try{if(input.trim())preview=resolveShareInput(input,location.origin,state);}catch(e){previewError=e.message;}
  function accept(value,shareId='') {try{validateManifest(value);const existing=shareId?state.receivedShares.find(r=>r.sourceShareId===shareId):null;const id=existing?.id || 'received-'+crypto.randomUUID();receiveKnowledge(state,value,id,shareId);setState(s=>receiveKnowledge(s,value,id,shareId));notify(listOnly?'已添加到“与我共享”':'已添加到“与我共享”，可以直接阅读和提问');onClose();navigate('/workspace?filter=shared');}catch(e){setError(e.message);}}
  return <Modal title="接收分享" description={listOnly?"添加别人分享的知识库。":"添加别人分享的知识库，直接阅读和提问。"} onClose={onClose}><div className="mm-dialog-body mm-form-stack"><form id="mm-receive-knowledge" className="mm-form-stack" onSubmit={e=>{e.preventDefault();try{const share=resolveShareInput(input,location.origin,state);accept(share.manifest,share.id);}catch(e){setError(e.message);}}}>
    <label>分享链接或编号<input value={input} onChange={e=>{setInput(e.target.value);setError('');}} placeholder="粘贴分享链接或 UUID" autoFocus/></label>
    {preview&&<section className="mm-share-summary"><h3>{preview.manifest.name}</h3><p>{preview.manifest.publisher||'知识分享者'}分享 · {preview.manifest.libraries.reduce((n,l)=>n+l.documents.length,0)} 篇内容</p><small>内容范围：{preview.manifest.libraries.map(l=>l.name).join('、')}</small></section>}
    </form><ActionLabel className="mm-button mm-receive-file">从分享文件添加<input hidden type="file" accept=".json" onChange={async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>8_000_000)throw new Error('文件超过8MB，请让分享者分批导出。');accept(JSON.parse(await file.text()));}catch(e){setError(e.message);}e.target.value='';}}/></ActionLabel>
    <p className="mm-caption">添加后显示在“与我共享”，只包含分享者提供的内容。原来的资料不会变成你创建的知识。</p><p className="mm-caption">支持当前浏览器的分享链接和分享文件，在线分享尚未连接。</p>{(error||(input.trim()===route.searchParams.get('demoShare')&&previewError))&&<p role="alert" className="mm-field-error">{error||previewError}</p>}
    </div><div className="mm-dialog-actions"><Button onClick={onClose}>取消</Button><Button variant="primary" type="submit" form="mm-receive-knowledge" disabled={!input.trim()}>添加到知识库</Button></div></Modal>;
}
export function ShareRecordsDialog({state,setState,notify,route,onClose}) {
  const [selected,setSelected]=useState(route.searchParams.get('package')||'');
  const [connections,setConnections]=useState(route.searchParams.has('connections'));
  const items=state.resourcePackages.filter(p=>p.kind==='selected-content'||!p.example||Object.values(state.localShares).some(v=>v.packageId===p.id));
  const item=state.resourcePackages.find(p=>p.id===selected);
  return <Modal title="分享记录" description="管理你分享出去的内容、范围和链接。" drawer onClose={onClose}><div className="mm-dialog-body mm-form-stack">
    {item?<><Button variant="plain" className="mm-share-back" onClick={()=>setSelected('')}>‹ 全部分享记录</Button><ShareAccess key={item.id} item={item} state={state} setState={setState} notify={notify}/></>:items.length?<div className="mm-share-record-list">{[...items].reverse().map(p=>{const active=Object.values(state.localShares).some(v=>v.packageId===p.id&&!v.revoked&&p.enabled!==false);const manifest=p.manifest||Object.values(state.localShares).find(v=>v.packageId===p.id)?.manifest;const count=manifest?.libraries.reduce((n,l)=>n+l.documents.length,0);return <ActionButton key={p.id} onClick={()=>setSelected(p.id)}><span><strong>{p.name}</strong><small>{count!=null?count+' 篇内容': '旧版保存的范围'}{p.sourceLibraryName?' · 来自'+p.sourceLibraryName:''}</small></span><span className="mm-soft-tag">{active?'分享中':manifest?'已撤销':'待选择内容'}</span></ActionButton>;})}</div>:<Empty title="还没有分享记录">打开自己创建的内容，点击“复制分享链接”即可分享整个知识库。</Empty>}
    <details open={connections} onToggle={e=>setConnections(e.currentTarget.open)} className="mm-share-connections"><ActionSummary>连接设置</ActionSummary><DemoConnection state={state} setState={setState} notify={notify}/></details>
  </div><div className="mm-dialog-actions"><Button onClick={onClose}>关闭</Button></div></Modal>;
}
export function SharedOriginDialog({item,state,setState,onClose,notify}) {
  return <Modal title="来源与使用范围" description={item.name} onClose={onClose}><div className="mm-dialog-body mm-form-stack"><section className="mm-share-summary"><h3>{item.sharedBy}分享</h3><p>来自{item.sourceNames.map(s=>'「'+s+'」').join('、')||'分享的内容'}</p><p>{item.readableCount} 篇可读内容 · {item.available?'可以阅读和提问':item.revoked?'分享已撤销':'已取消接收'}</p></section><p>你收到的是分享者提供的知识库内容，可独立使用。问答只在这份内容范围内查找，不会访问未分享的页面和原始附件。</p><p className="mm-caption">这是接收时保存的文本版本。原资料更新后，需要分享者提供新的内容。</p></div><div className="mm-dialog-actions"><Button onClick={onClose}>关闭</Button>{!item.revoked&&<Button onClick={()=>{setState(s=>({...s,receivedShares:s.receivedShares.map(r=>r.id===item.receipt.id?{...r,enabled:r.enabled===false}:r)}));onClose();notify(item.available?'已取消接收，可在“与我共享”恢复':'已恢复接收');}}>{item.available?'取消接收':'恢复接收'}</Button>}</div></Modal>;
}
