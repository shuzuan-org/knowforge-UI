import {forwardRef,useId,useImperativeHandle,useRef,useState} from 'react';
import {BookOpen,FileText,Plus,Search,X} from 'lucide-react';
import {attachmentLibraries,recommendAttachmentLibrary} from '../chat-attachments';
import {formatSourceSize,sourceLimit} from '../knowledge-import';
import '../chat-attachments.css';

// This picker is for explicit knowledge imports, separate from chat attachments.
export const ChatAttachmentDialog=forwardRef(function ChatAttachmentDialog({notebooks,onStore,onClose},ref){
  const dialog=useRef(null),lock=useRef(false);
  const titleId = useId();
  const [projectName, setProjectName] = useState('');
  const [chatTitle, setChatTitle] = useState('');
  const [excludedIds, setExcludedIds] = useState(new Set());
  const [attachments,setAttachments]=useState([]),[query,setQuery]=useState(''),[creating,setCreating]=useState(false),[name,setName]=useState('');
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const selected = projectName ? attachments.filter(item => !excludedIds.has(item.id)) : attachments;
  const attachment = selected.length === 1 ? selected[0] : null;
  const canStore = !busy && selected.length > 0 && selected.length <= sourceLimit;
  const available=attachmentLibraries(notebooks);
  const suggested=attachment&&(available.find(library=>library.id===attachment.recommendedId)||recommendAttachmentLibrary(attachment,notebooks));
  const matches=available.filter(library=>(library.name+' '+(library.description||'')).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).sort((a,b)=>(b.id===suggested?.id)-(a.id===suggested?.id));
  function open(items, {projectName: project = '', chatTitle: chat = ''} = {}) {
    if (lock.current || (!items.length && !project)) return;
    setAttachments(items);
    setProjectName(project);
    setChatTitle(chat);
    setExcludedIds(new Set());
    setQuery('');
    setCreating(false);
    setName(project || chat ? (project || chat).slice(0, 60) : items.length === 1 ? items[0].name.split('/').pop().replace(/\.[^.]+$/, '') : '');
    setError('');
    dialog.current?.showModal();
  }
  useImperativeHandle(ref,()=>({open}));
  function close(){if(!lock.current)dialog.current?.close();}
  function toggleMaterial(id) {
    setExcludedIds(current => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  async function store(id,newName=''){
    if(lock.current || !canStore)return;
    lock.current=true;setBusy(true);setError('');
    try{await onStore(selected,{id,name:newName});dialog.current?.close();}
    catch(reason){setError(reason.message||'存入失败，请重试。');if(!dialog.current?.open){setQuery('');setCreating(false);dialog.current?.showModal();}}
    finally{lock.current=false;setBusy(false);}
  }
  return <dialog ref={dialog} className="uw-context-dialog uw-attachment-dialog" aria-labelledby={titleId} onClose={onClose} onCancel={event=>{if(lock.current)event.preventDefault();}} onClick={event=>{if(event.target===event.currentTarget)close();}}>
    <header><h2 id={titleId}>{chatTitle ? '添加聊天到知识库' : projectName ? '加入知识库' : '存入知识库'}</h2><button type="button" className="uw-icon-button" aria-label={chatTitle ? '取消添加聊天' : '关闭保存资料'} disabled={busy} onClick={close}><X size={18}/></button></header>
    <div className="uw-attachment-body">
      {projectName && <>
        <p className="uw-attachment-purpose uw-project-materials-name">项目「{projectName}」</p>
        {attachments.length ? <div className="uw-project-materials">
          <div className="uw-project-materials-toolbar">
            <span>已选 {selected.length} / {attachments.length} 份资料</span>
            <button type="button" disabled={busy}
              onClick={() => setExcludedIds(selected.length === attachments.length ? new Set(attachments.map(item => item.id)) : new Set())}>
              {selected.length === attachments.length ? '取消全选' : '全选'}
            </button>
          </div>
          <div className="uw-project-materials-list" role="group" aria-label="项目资料">
            {attachments.map(item => <label key={item.id} title={item.name}>
              <input type="checkbox" checked={!excludedIds.has(item.id)} disabled={busy}
                onChange={() => toggleMaterial(item.id)}/>
              <span>{item.name}</span>
              <small>{formatSourceSize(item.size)}</small>
            </label>)}
          </div>
          {selected.length > sourceLimit && <p className="uw-attachment-error" role="alert">每次最多存入 {sourceLimit} 份资料，请分批选择。</p>}
        </div> : <p className="uw-attachment-no-match">这个项目还没有资料。添加对话附件或生成文件后，可在这里选取。</p>}
      </>}
      {!projectName&&attachment&&<div className="uw-attachment-summary"><FileText size={16}/><span title={chatTitle||attachment.name}>{chatTitle||attachment.name}</span>{!chatTitle&&<small>{formatSourceSize(attachment.size)}</small>}</div>}
      {!projectName&&attachments.length>1&&<div className="uw-attachment-summary"><FileText size={16} aria-hidden="true"/><span>已选 {attachments.length} 份素材</span></div>}
      {!projectName && <p className="uw-attachment-purpose">{chatTitle?'选择要保存这段聊天的知识库。':'保存后，可在其他对话中继续使用'}</p>}
      {attachments.length > 0 && (!creating?<>
        <label className="uw-attachment-search"><Search size={15}/><input aria-label="搜索保存位置" placeholder="搜索知识库" value={query} disabled={busy} onChange={event=>setQuery(event.target.value)}/></label>
        <div className="uw-attachment-destinations" aria-label="可保存的知识库">{matches.map(library=><button type="button" key={library.id} disabled={!canStore} aria-label={'存入“'+library.name+'”'} onClick={()=>store(library.id)}><BookOpen size={17}/><span><strong>{library.name}</strong><small>{library.description||'我创建的知识库'}</small></span>{library.id===suggested?.id&&<small className="uw-attachment-recommended">推荐</small>}</button>)}{!matches.length&&<p className="uw-attachment-no-match">{available.length?'没有找到匹配的知识库':'还没有自己创建的知识库'}</p>}</div>
        <button type="button" className="uw-attachment-create" disabled={!canStore} onClick={()=>setCreating(true)}><Plus size={16}/>新建知识库</button>
      </>:<form onSubmit={event=>{event.preventDefault();if(name.trim())store('new',name.trim());}}><label className="uw-attachment-name">知识库名称<input aria-label="新知识库名称" value={name} disabled={busy} onChange={event=>setName(event.target.value)} maxLength={60} required/></label><div className="uw-attachment-create-actions"><button type="button" className="uw-attachment-cancel" disabled={busy} onClick={()=>setCreating(false)}>返回</button><button type="submit" className="uw-primary" disabled={!canStore||!name.trim()}>创建并存入</button></div></form>)}
      {busy&&<p className="uw-attachment-notice" role="status">正在存入知识库…</p>}
      {error&&<p className="uw-attachment-error" role="alert">{error}</p>}
    </div>
  </dialog>;
});
