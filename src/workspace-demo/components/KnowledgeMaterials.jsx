import {useEffect,useRef,useState} from 'react';
import {BookOpen,Download,FolderOpen,Plus,Search,Star,Trash2} from 'lucide-react';
import {attachmentLibraries,chatAttachmentSource,downloadMaterial,listMaterials,readMaterialFavorites,removeLibraryMaterial,saveUploadedMaterials,toggleMaterialFavorite} from '../chat-attachments';
import {formatSourceSize} from '../knowledge-import';
import {knowledgeMaterialTypeOf} from '../knowledge-material-types';
import {ChatAttachmentDialog} from './ChatAttachmentDialog';
import {ChatMaterialMenu} from './ChatMaterialMenu';
import {ChatMaterialPreview,materialPreviewType} from './ChatMaterialPreview';
import './chat-materials.css';
import '../knowledge-materials.css';

const date=new Intl.DateTimeFormat('zh-CN',{
  year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23',
});

export function KnowledgeMaterials({materialType,notebooks,onImport}){
  const fileInput=useRef(null),picker=useRef(null),loadingVersion=useRef(0);
  const removalDialog=useRef(null),removingLock=useRef(false),searchInput=useRef(null);
  const [removal,setRemoval]=useState(null),[removing,setRemoving]=useState(false),[removalError,setRemovalError]=useState('');
  const [materials,setMaterials]=useState(null),[query,setQuery]=useState(''),[origin,setOrigin]=useState('');
  const [favorites,setFavorites]=useState(readMaterialFavorites),[onlyFavorites,setOnlyFavorites]=useState(false);
  const [preview,setPreview]=useState(null);
  const [uploading,setUploading]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  useEffect(()=>{
    function refresh(){
      const version=++loadingVersion.current;
      setFavorites(readMaterialFavorites());
      listMaterials().then(items=>{if(version===loadingVersion.current)setMaterials(items);})
        .catch(()=>{if(version===loadingVersion.current)setError('暂时无法读取素材，请刷新后重试。');});
    }
    refresh();
    window.addEventListener('metask-materials-changed',refresh);
    window.addEventListener('focus',refresh);
    return ()=>{++loadingVersion.current;window.removeEventListener('metask-materials-changed',refresh);window.removeEventListener('focus',refresh);};
  },[]);
  async function upload(event){
    const files=Array.from(event.currentTarget.files);
    event.currentTarget.value='';
    if(!files.length)return;
    setError('');setNotice('');setUploading(true);
    try{await saveUploadedMaterials(files);setQuery('');setOrigin('');setNotice(`已上传 ${files.length} 份资料。`);}
    catch(reason){setError(reason.message||'上传失败，请重试。');}
    finally{setUploading(false);}
  }
  async function store([material],destination){
    setNotice('');
    const library=await onImport({...destination,sources:[await chatAttachmentSource(material)]});
    setNotice(`已将「${material.name}」存入「${library.name}」。`);
  }
  function confirmRemoval(material){
    setRemoval(material);
    setRemovalError('');
    removalDialog.current.showModal();
  }
  async function remove(event){
    event.preventDefault();
    if(!removal||removingLock.current)return;
    removingLock.current=true;
    setRemoving(true);
    setRemovalError('');
    try{
      await removeLibraryMaterial(removal.id);
      setMaterials(current=>current?.filter(item=>item.id!==removal.id)??null);
      setError('');
      setNotice(`已删除素材「${removal.name}」。`);
      removalDialog.current.close();
      searchInput.current?.focus();
    }catch{
      setRemovalError('删除失败，请重试。');
    }finally{
      removingLock.current=false;
      setRemoving(false);
    }
  }
  function toggleFavorite(material){
    setError('');
    try{setFavorites(toggleMaterialFavorite(material.id));}
    catch{setError('未能更新收藏，请稍后重试。');}
  }
  const filter=query.trim().toLocaleLowerCase();
  const visible=(materials||[]).filter(item=>
    (!materialType || knowledgeMaterialTypeOf(item) === materialType) && (!origin || item.origin === origin) &&
    (!onlyFavorites || favorites.has(item.id)) && item.name.toLocaleLowerCase().includes(filter)
  );
  const available=attachmentLibraries(notebooks);
  return <section className="kb-materials">
    <input type="file" multiple hidden ref={fileInput} onChange={upload} disabled={uploading} aria-label="选择资料文件"/>
    <header className="kb-materials-header">
      <h2 className="kb-hub-content-title">{materialType?.label || '我的素材'}</h2>
      <div className="kb-materials-tools">
        <label className="kb-materials-search"><Search size={16} aria-hidden="true"/><input ref={searchInput} value={query} onChange={event=>setQuery(event.target.value)} aria-label="搜索资料" placeholder="搜索"/></label>
        <button type="button" className="kb-primary kb-material-upload" disabled={uploading} onClick={()=>fileInput.current?.click()}>
          <Plus size={17} aria-hidden="true"/>上传资料
        </button>
      </div>
    </header>
    <div className="kb-materials-filters" role="group" aria-label="素材筛选">
      <button type="button" aria-pressed={!origin && !onlyFavorites} onClick={()=>{setOrigin('');setOnlyFavorites(false);}}>全部</button>
      <button type="button" aria-pressed={onlyFavorites} onClick={()=>setOnlyFavorites(value=>!value)}>收藏</button>
      {[['uploaded','用户上传'],['generated','生成结果']].map(([value,label])=>
        <button type="button" key={value} aria-pressed={origin===value} onClick={()=>setOrigin(origin===value?'':value)}>{label}</button>
      )}
    </div>
    {error&&<p className="kb-receive-message" role="alert">{error}</p>}
    {(uploading||notice)&&<p className="kb-receive-notice" role="status">{uploading?'正在上传资料…':notice}</p>}
    {materials===null?!error&&<p className="kb-materials-empty" role="status">正在读取资料…</p>:visible.length?<table className="kb-materials-list" aria-label="素材列表">
      <colgroup><col/><col className="kb-material-source-col"/><col className="kb-material-time-col"/><col className="kb-material-action-col"/></colgroup>
      <thead><tr><th scope="col">名称</th><th scope="col">来源</th><th scope="col">添加时间</th><th scope="col"><span className="sr-only">操作</span></th></tr></thead>
      <tbody>
      {visible.map(material=>{
        const signature=material.name+':'+material.size+':'+material.lastModified;
        const favorite=favorites.has(material.id);
        const generated=material.origin==='generated';
        const addedAt=new Date(material.addedAt);
        const hasTime=addedAt.getTime()>0;
        const stored=available.filter(library=>library.sources?.some(source=>source.id===material.id||source.signature===signature));
        const {icon: Icon} = knowledgeMaterialTypeOf(material);
        const canPreview = Boolean(materialPreviewType(material));
        const actions = [
          {label:favorite?'取消收藏':'收藏',icon:Star,run:()=>toggleFavorite(material)},
          {label:'下载原文件',icon:Download,run:()=>{
            setError('');
            downloadMaterial(material).catch(reason=>setError(reason.message||'无法下载原文件。'));
          }},
          {label:'存入知识库',icon:BookOpen,run:()=>picker.current?.open([material])},
          {label:'删除素材',icon:Trash2,run:()=>confirmRemoval(material)},
        ];
        return <tr key={material.id}>
          <td>
            <div className="kb-material-info">
              <span className="kb-material-icon" title={formatSourceSize(material.size)}><Icon size={17} strokeWidth={1.6} aria-hidden="true"/></span>
              <div className="kb-material-name">
                {canPreview ? <button type="button" title={material.name} onClick={()=>setPreview(material)}>{material.name}</button> : <strong title={material.name}>{material.name}</strong>}
                {stored.length>0&&<small title={stored.map(library=>library.name).join('、')}>已存入 {stored.map(library=>library.name).join('、')}</small>}
              </div>
              {favorite&&<Star className="kb-material-star" size={13} aria-label="已收藏"/>}
            </div>
          </td>
          <td>
            {generated ? '生成结果' : '用户上传'}
          </td>
          <td>{hasTime?<time dateTime={addedAt.toISOString()}>{date.format(addedAt)}</time>:'—'}</td>
          <td><ChatMaterialMenu name={material.name} actions={actions}/></td>
        </tr>;
      })}
    </tbody></table>:<div className="kb-materials-empty"><FolderOpen size={28} strokeWidth={1.5}/><strong>{filter||origin||onlyFavorites?'没有匹配的资料':materialType?'暂无'+materialType.label:'暂无资料'}</strong>{!filter&&!origin&&!onlyFavorites&&!materialType&&<span>上传的文件和生成的素材会保存在这里。</span>}</div>}
    <dialog ref={removalDialog} className="uw-history-dialog" aria-labelledby="kb-material-remove-title"
      onClose={()=>setRemoval(null)} onCancel={event=>{if(removingLock.current)event.preventDefault();}}>
      {removal&&<form onSubmit={remove}>
        <h3 id="kb-material-remove-title">删除素材</h3>
        <p>删除素材「{removal.name}」？已发送的附件和已入库的内容仍可使用。</p>
        {removalError&&<p className="kb-receive-message" role="alert">{removalError}</p>}
        <div className="uw-history-dialog-actions">
          <button type="button" autoFocus disabled={removing} onClick={()=>removalDialog.current.close()}>取消</button>
          <button type="submit" className="is-danger" disabled={removing}>{removing?'正在删除…':'删除'}</button>
        </div>
      </form>}
    </dialog>
    <ChatAttachmentDialog ref={picker} notebooks={notebooks} onStore={store}/>
    {preview&&<ChatMaterialPreview material={preview} onClose={()=>setPreview(null)}/>}
  </section>;
}
