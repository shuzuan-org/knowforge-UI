import {readFileSource,sourceLimit} from './knowledge-import.js';

const excludedId='entity_scope%3A15859e4b41de4ff49e9570f5f34cf1be';
export function attachmentLibraries(notebooks){
  return notebooks.filter(library=>library.owner==='created'&&!library.isShare&&!library.disabled&&library.id!==excludedId&&!['不可用','已失效','分享已关闭','已停用'].includes(library.status));
}
export function chatAttachments(files){
  if(files.length>sourceLimit)throw Error('每批最多添加 '+sourceLimit+' 份资料，请分批选择。');
  return files.map(file=>({id:crypto.randomUUID(),name:file.webkitRelativePath||file.name,size:file.size,type:file.type,lastModified:file.lastModified}));
}
const normalize=value=>(value||'').normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const terms=value=>new Set((value.match(/[a-z][a-z0-9]{2,}|[\p{Script=Han}]{2,}/gu)||[]).flatMap(word=>/^[a-z]/.test(word)?[word]:Array.from({length:word.length-1},(_,index)=>word.slice(index,index+2))));
const common=new Set(['知识','资料','内容','说明','规范','我的','使用','参考','设计','整理']);
// Suggestions use the attachment itself, never the currently selected chat library.
export function recommendAttachmentLibrary(attachment,notebooks,text=''){
  return attachmentLibraryMatch(attachment,notebooks,text)?.library??null;
}
export function attachmentLibraryMatch(attachment,notebooks,text=''){
  const available=attachmentLibraries(notebooks),name=normalize(attachment.name),body=normalize(text.slice(0,12000));
  const dictionaries=available.map(library=>({library,name:normalize(library.name),terms:terms(normalize(library.name+' '+(library.description||'')))}));
  const frequency=new Map();for(const entry of dictionaries)for(const term of entry.terms)frequency.set(term,(frequency.get(term)||0)+1);
  const scores=dictionaries.map(entry=>{
    const exactName=entry.name.length>=3&&name.includes(entry.name);
    let score=exactName?20:0;
    const matches=[];
    for(const term of entry.terms){
      if(common.has(term)||frequency.get(term)!==1)continue;
      if(name.includes(term)){score+=3;matches.push(term);}
      else if(body.includes(term)){score+=1;matches.push(term);}
    }
    return {library:entry.library,score,reason:exactName?'文件名含知识库名称':`匹配词 ${matches.slice(0,3).join('、')}`};
  }).sort((a,b)=>b.score-a.score);
  return scores[0]?.score>=6&&scores[0].score-(scores[1]?.score||0)>=3?scores[0]:null;
}
export async function attachmentSuggestionText(file){
  const extension=file.name.split('.').at(-1).toLowerCase();
  if(!['txt','md','markdown'].includes(extension)&&!(file.type==='text/plain'&&!file.name.includes('.')))return '';
  return file.slice(0,12000).text();
}

function shortenMaterialText(text,limit){
  return text.length>limit?text.slice(0,limit).trimEnd()+'…':text;
}

export function materialTextPreview(text){
  if(!text.trim()||/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFD]/u.test(text.trimEnd().replace(/\uFFFD$/u,'')))return null;
  const body=text.replace(/^\s*---[^\S\r\n]*\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/u,'')
    .replace(/^ {0,3}(`{3,}|~{3,})[^\n]*\n[\s\S]*?(?:^ {0,3}\1[ \t]*$|(?![\s\S]))/gmu,'')
    .replace(/<!--[\s\S]*?(?:-->|$)/gu,'');
  const sections=new Map();
  const excerpts=new Set();
  let section='';
  for(const line of body.split(/\r?\n/u)){
    const heading=line.trim().match(/^(#{1,6})\s+(.+)$/u);
    if(heading){
      section=heading[1].length>1?heading[2].replace(/\s+#+$/u,'').trim():'';
      if(section&&!sections.has(section))sections.set(section,'');
      continue;
    }
    const content=line.trim().replace(/^(?:>\s*|[-*+]\s+|\d+[.)]\s+)/u,'');
    if(!/[\p{L}\p{N}]/u.test(content))continue;
    const sentences=content.split(/(?<=[。！？])\s*|(?<=[.!?])\s+/u).filter(Boolean);
    for(const sentence of sentences)excerpts.add(sentence);
    if(section&&!sections.get(section))sections.set(section,sentences[0]);
  }
  const topics=[...sections.keys()].slice(0,3);
  const passages=[...excerpts].slice(0,3);
  if(!topics.length&&!passages.length)return null;
  return {
    summary:topics.length>=2?`包含${topics.map(topic=>`「${shortenMaterialText(topic,20)}」`).join('、')}`:`内容摘录 · ${shortenMaterialText(passages[0]||topics[0],86)}`,
    points:topics.length>=2
      ?topics.map(topic=>sections.get(topic)?`${shortenMaterialText(topic,32)} · ${shortenMaterialText(sections.get(topic),128)}`:shortenMaterialText(topic,160))
      :(passages.length?passages:topics).map(point=>shortenMaterialText(point,160)),
  };
}
function openStore(){return new Promise((resolve,reject)=>{
  const request=indexedDB.open('metask-chat-attachments-v1',2);
  request.onupgradeneeded=event=>{
    if(event.oldVersion<1)request.result.createObjectStore('files',{keyPath:'id'});
    request.result.createObjectStore('removed');
  };
  request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
});}
export async function saveChatAttachments(attachments,fileMap,origin='uploaded'){
  if(!attachments.length)return;
  const records=attachments.map(attachment=>{const file=fileMap.get(attachment.id);if(!file)throw Error('附件读取失败，请重新添加。');return {id:attachment.id,file,material:{...attachment,origin,addedAt:attachment.addedAt??Date.now()}};});
  const db=await openStore();
  try{await new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite');for(const record of records)tx.objectStore('files').put(record);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
  catch{throw Error('附件未能保存到当前浏览器，请检查存储空间后重试。');}finally{db.close();}
  globalThis.dispatchEvent?.(new Event('metask-materials-changed'));
}
async function storedFile(id){
  const db=await openStore();
  try{return await new Promise((resolve,reject)=>{const request=db.transaction('files').objectStore('files').get(id);request.onsuccess=()=>resolve(request.result?.file);request.onerror=()=>reject(request.error);});}finally{db.close();}
}
export async function chatAttachmentSource(attachment,fileMap=new Map(),readStored=storedFile){
  const file=fileMap.get(attachment.id)||await readStored(attachment.id);
  if(!file)throw Error('当前浏览器中找不到此附件，请重新上传后再存入知识库。');
  const source=await readFileSource({file,path:attachment.name});
  return {...source,id:attachment.id};
}
export function attachmentStored(attachment,library){return {...attachment,savedTo:{id:library.id,name:library.name}};}
export function markChatAttachmentStored(chat,id,library){
  let changed=false;
  const messages=chat.messages.map(message=>{
    if(!message.attachments?.some(attachment=>attachment.id===id))return message;
    changed=true;return {...message,attachments:message.attachments.map(attachment=>attachment.id===id?attachmentStored(attachment,library):attachment)};
  });
  return changed?{...chat,messages}:chat;
}

export async function saveUploadedMaterials(files){
  const attachments=chatAttachments(files);
  await saveChatAttachments(attachments,new Map(attachments.map((item,index)=>[item.id,files[index]])));
  return attachments;
}
// Keep original files available to conversations that already reference them.
export async function removeLibraryMaterial(id){
  const db=await openStore();
  try{
    await new Promise((resolve,reject)=>{
      const tx=db.transaction('removed','readwrite');
      tx.objectStore('removed').put(true,id);
      tx.oncomplete=resolve;
      tx.onabort=()=>reject(tx.error);
    });
  }finally{db.close();}
  globalThis.dispatchEvent?.(new Event('metask-materials-changed'));
}

export async function listMaterials(legacyAttachments=[]){
  const legacy=new Map(legacyAttachments.map(item=>[item.id,item]));
  const db=await openStore();
  try{
    const {records,removed}=await new Promise((resolve,reject)=>{
      const tx=db.transaction(['files','removed']);
      const files=tx.objectStore('files').getAll();
      const removals=tx.objectStore('removed').getAllKeys();
      tx.oncomplete=()=>resolve({records:files.result,removed:new Set(removals.result)});
      tx.onabort=()=>reject(tx.error);
    });
    return records.filter(record=>record.file&&!removed.has(record.id)).map(({id,file,material})=>material||{
      id,name:legacy.get(id)?.name||file.name,size:file.size,type:file.type,lastModified:file.lastModified,
      origin:'uploaded',addedAt:file.lastModified,
    }).sort((a,b)=>b.addedAt-a.addedAt);
  }finally{db.close();}
}
const materialFavoritesKey = 'metask-demo-material-favorites-v1';

export function readMaterialFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(materialFavoritesKey));
    return new Set(Array.isArray(saved) ? saved : []);
  } catch {
    return new Set();
  }
}

export function toggleMaterialFavorite(id) {
  const favorites = readMaterialFavorites();
  if (favorites.has(id)) favorites.delete(id);
  else favorites.add(id);
  localStorage.setItem(materialFavoritesKey, JSON.stringify([...favorites]));
  return favorites;
}

export async function readMaterialFile(id){
  const file=await storedFile(id);
  if(!file)throw Error('找不到原文件，请重新上传。');
  return file;
}
export async function downloadMaterial(material){
  const file=await readMaterialFile(material.id);
  const url=URL.createObjectURL(file);
  const link=document.createElement('a');
  link.href=url;link.download=material.name.split('/').at(-1);
  link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
