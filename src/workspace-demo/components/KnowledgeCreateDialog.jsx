import {forwardRef, useEffect, useImperativeHandle, useRef, useState} from 'react';
import {ChevronDown, FileText, Folder, Link, X} from 'lucide-react';
import {droppedFiles, formatSourceSize, prepareNotebook, organizingAgents, readFileSource, sourceLimit, webSources} from '../knowledge-import';
import '../knowledge-create.css';
import {saveChatAttachments} from '../chat-attachments';

export const KnowledgeCreateDialog=forwardRef(function KnowledgeCreateDialog({onCreate,library,canAdd=true},ref) {
  const dialog=useRef(null), nameInput=useRef(null), fileTab=useRef(null), fileInput=useRef(null), folderInput=useRef(null), webInput=useRef(null);
  const reading=useRef(false), version=useRef(0);
  const [name,setName]=useState(''), [description,setDescription]=useState(''), [agentId,setAgentId]=useState('general'), [customInstructions,setCustomInstructions]=useState('');
  const [kind,setKind]=useState('file'), [sources,setSources]=useState([]), [web,setWeb]=useState('');
  const [error,setError]=useState(''), [busy,setBusy]=useState(false), [dragging,setDragging]=useState(false),[saving,setSaving]=useState(false);
  useEffect(()=>()=>{version.current++;reading.current=false;},[]);

  useImperativeHandle(ref,()=>({open(){
    version.current++;reading.current=false;
    setName('');setDescription('');setAgentId(library?.organizingAgent?.id||'general');setCustomInstructions(library?.organizingAgent?.instructions||'');setKind('file');setSources([]);setWeb('');setError('');setBusy(false);setDragging(false);setSaving(false);
    dialog.current?.showModal();(library ? fileTab : nameInput).current?.focus();
  }}),[library]);

  function close() {if(saving)return;version.current++;reading.current=false;setBusy(false);dialog.current?.close();}
  async function addFiles(incoming) {
    if(reading.current)return;
    const token=version.current;
    reading.current=true;setBusy(true);setError('');
    try {
      const files=Array.from(await incoming);
      if(token!==version.current)return;
      const remaining=sourceLimit-sources.length;
      if(remaining<=0)throw new Error('每批最多添加 1000 份资料，请分批添加。');
      const known=new Set(sources.map(source=>source.signature).filter(Boolean));
      const items=[], originals=new Map();
      for(const entry of files) {
        if(token!==version.current)return;
        if(items.length>=remaining)break;
        const item=await readFileSource(entry);
        if(!known.has(item.signature)){known.add(item.signature);items.push(item);originals.set(item.id,entry.file||entry);}
      }
      await saveChatAttachments(items.map(item=>{
        const file=originals.get(item.id);
        return {id:item.id,name:item.name,size:file.size,type:file.type,lastModified:file.lastModified};
      }),originals);
      if(token!==version.current)return;
      setSources(current=>[...current,...items]);
      if(files.length>remaining)setError('每批最多添加 1000 份资料，其余文件请分批添加。');
    }catch(problem){if(token===version.current)setError(problem.message||'读取文件失败，请重新选择。');}
    finally{if(token===version.current){reading.current=false;setBusy(false);}}
  }
  function pickFiles(event) {const files=Array.from(event.currentTarget.files||[]);event.currentTarget.value='';addFiles(files);}
  function addWeb() {
    try{const items=webSources(web,sources);setSources(current=>[...current,...items]);setWeb('');setError('');}
    catch(problem){setError(problem.message);webInput.current?.focus();}
  }
  async function submit(event) {
    event.preventDefault();
    if(!canAdd){setError('添加权限已被收回，待添加资料仍保留在这里。');return;}
    if((!library&&!name.trim())||reading.current||saving)return;
    try {
      const items=web.trim()?[...sources,...webSources(web,sources)]:sources;
      if(library&&!items.length)throw new Error('请先添加文件或网页资料。');
      setSaving(true);
      await onCreate(prepareNotebook({
        name: library?.name ?? name, description: library?.description ?? description,
        agentId, customInstructions, sources: items,
      }));
      version.current++;reading.current=false;dialog.current?.close();
    }catch(problem){setError(problem.message);if(web.trim())webInput.current?.focus();}finally{setSaving(false);}
  }
  function switchKind(value){setKind(value);setError('');}
  function sourceKey(event) {
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();
    const next=event.key==='Home'?'file':event.key==='End'?'web':kind==='file'?'web':'file';
    switchKind(next);requestAnimationFrame(()=>document.getElementById('kb-import-tab-'+next)?.focus());
  }

  return <dialog ref={dialog} className="kb-create-dialog" aria-labelledby="kb-create-title" aria-describedby={library ? "kb-import-destination" : undefined} onCancel={event=>{event.preventDefault();close();}} onClick={event=>{if(event.target===event.currentTarget)close();}}>
    <form onSubmit={submit}>
      <header className="kb-create-header"><h2 id="kb-create-title">{library?'添加资料':'新建知识库'}</h2><button type="button" className="kb-close" aria-label="关闭" disabled={saving} onClick={close}><X size={18}/></button></header>
      <div className="kb-create-body">
        <div className={'kb-create-metadata' + (library ? ' kb-create-metadata-existing' : '')}>
          {library
            ? <p id="kb-import-destination" className="kb-import-destination">添加到 <strong>「{library.name}」</strong></p>
            : <>
              <label>知识库名称 <span>必填</span><input ref={nameInput} autoFocus name="name" value={name} onChange={event=>setName(event.target.value)} placeholder="给这批资料起个名字" maxLength={60} required/></label>
              <label>说明 <span>选填</span><input name="description" value={description} onChange={event=>setDescription(event.target.value)} placeholder="资料内容或知识库用途" maxLength={300}/></label>
            </>}
          <label className="kb-organizer-field">整理智能体<div className="kb-organizer-select"><select name="agent" aria-label="整理智能体" value={agentId} disabled={saving} onChange={event=>{setAgentId(event.target.value);setError('');}}>{organizingAgents.map(agent=><option key={agent.id} value={agent.id}>{agent.name}{agent.id==='general'?'（默认）':''}</option>)}</select><ChevronDown size={15}/></div></label>
        </div>
        {agentId==='custom'?<label className="kb-custom-organizing">自定义整理要求 <span>必填</span><textarea aria-label="自定义整理要求" value={customInstructions} onChange={event=>{setCustomInstructions(event.target.value);setError('');}} disabled={saving} rows={3} maxLength={2000} placeholder="例如：按客户行业分类，提炼每份资料的核心问题、解决方案和案例，最后生成对比表。" required/></label>:<p className="kb-organizing-description">{organizingAgents.find(agent=>agent.id===agentId)?.description}</p>}
        <div className="kb-import-tabs" role="tablist" aria-label="资料添加方式" onKeyDown={sourceKey}>
          <button type="button" ref={fileTab} id="kb-import-tab-file" role="tab" aria-selected={kind==='file'} aria-controls="kb-import-panel" tabIndex={kind==='file'?0:-1} onClick={()=>switchKind('file')}><Folder size={18}/>文件与文件夹</button>
          <button type="button" id="kb-import-tab-web" role="tab" aria-selected={kind==='web'} aria-controls="kb-import-panel" tabIndex={kind==='web'?0:-1} onClick={()=>switchKind('web')}><Link size={18}/>网页链接</button>
        </div>
        <input ref={fileInput} type="file" multiple hidden aria-label="选择本地文件" onChange={pickFiles}/>
        <input ref={folderInput} type="file" multiple webkitdirectory="" hidden aria-label="选择本地文件夹" onChange={pickFiles}/>
        <div id="kb-import-panel" role="tabpanel" aria-labelledby={'kb-import-tab-'+kind} className={'kb-import-area'+(dragging?' is-dragging':'')} onDragOver={event=>{event.preventDefault();if(!reading.current)setDragging(true);}} onDragLeave={event=>{if(!event.currentTarget.contains(event.relatedTarget))setDragging(false);}} onDrop={event=>{event.preventDefault();setDragging(false);if(!reading.current)addFiles(droppedFiles(event.dataTransfer));}}>
          {kind==='file'?<div className={sources.length?'kb-import-more':'kb-import-drop'}>
            <div><h3>{sources.length?'继续添加资料':'把资料放进来'}</h3><p>拖入文件或文件夹，也可以从电脑选择</p><p className="kb-import-limits">每批最多 1000 份；文本 200 万字符，PDF/DOCX 30 MB，PDF 最多 500 页。</p></div>
            <div className="kb-import-file-actions"><button type="button" className="kb-secondary" onClick={()=>fileInput.current?.click()} disabled={busy||saving||!canAdd}><FileText size={17}/>{sources.length?'继续添加文件':'选择文件'}</button><button type="button" className="kb-secondary" onClick={()=>folderInput.current?.click()} disabled={busy||saving||!canAdd}><Folder size={18}/>{sources.length?'添加文件夹':'选择文件夹'}</button></div>
          </div>:<div className="kb-import-web"><label htmlFor="kb-web-address">网页地址</label><textarea ref={webInput} id="kb-web-address" value={web} onChange={event=>{setWeb(event.target.value);setError('');}} rows={3} placeholder={'https://example.com/article\n每行一个网页地址'}/><div><p>添加后可补充网页正文</p><button type="button" className="kb-secondary" disabled={busy||!web.trim()} onClick={addWeb}>加入列表</button></div></div>}
          {busy&&<p className="kb-import-reading" role="status">正在读取资料…</p>}
          {sources.length>0&&<section className="kb-import-queue" aria-label="待添加资料">{sources.map(source=><div className="kb-import-source" key={source.id}>
            {source.kind==='web'?<Link size={18}/>:<FileText size={18}/>}<div><strong title={source.name}>{source.name}</strong><span>{source.kind==='file'?formatSourceSize(source.size)+' · ':''}{source.note}</span></div><button type="button" className="kb-source-remove" aria-label={'移除资料 '+source.name} disabled={busy||saving||!canAdd} onClick={()=>setSources(current=>current.filter(item=>item.id!==source.id))}><X size={16}/></button>
          </div>)}</section>}
        </div>
        {kind==='file'&&<p className="kb-import-formats">支持文本、源码、PDF、DOCX · 扫描件和图片需补充文本</p>}
        {(error||!canAdd)&&<p className="kb-import-error" role="alert">{!canAdd?'添加权限已被收回，待添加资料仍保留在这里。':error}</p>}
      </div>
      <footer className="kb-create-footer"><span role="status">{sources.length?'已添加 '+sources.length+' 份资料':library?'请选择要添加的资料':'可稍后添加资料'}</span><div><button type="button" className="kb-secondary" disabled={saving} onClick={close}>取消</button><button type="submit" className="kb-primary" disabled={!canAdd||(!library&&!name.trim())||busy||saving||agentId==='custom'&&!customInstructions.trim()||Boolean(library&&!sources.length&&!web.trim())}>{saving?'正在保存…':busy?'正在读取…':library?'添加资料':'创建知识库'}</button></div></footer>
    </form>
  </dialog>;
});
