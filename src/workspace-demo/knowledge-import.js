import { readDocumentFile } from '../document-import.js';

export const organizingAgents = [
  {id:'general',name:'通用整理',description:'按资料本身的主题组织内容，适合大多数资料。'},
  {id:'research',name:'研究整理',description:'关注结论、证据和待验证问题。'},
  {id:'project',name:'项目整理',description:'关注项目决策、行动项、进展与风险。'},
  {id:'content',name:'内容素材整理',description:'关注观点、案例和可复用的内容素材。'},
  {id:'onboarding',name:'学习整理',description:'关注背景、流程和由浅入深的阅读顺序。'},
  {id:'custom',name:'自定义整理',description:'自行指定整理角度、分类规则和输出结构。'},
];

export const sourceLimit=1000;
const textFile=/\.(txt|md|markdown|csv|json|js|jsx|ts|tsx|mjs|cjs|css|scss|html?|xml|yaml|yml|py|java|sql|sh|vue|svelte)$/i;

export function formatSourceSize(size) {
  return size>=1_000_000?(size/1_000_000).toFixed(1)+' MB':size>=1000?Math.ceil(size/1000)+' KB':size+' B';
}

export async function readFileSource(entry) {
  const file = entry.file || entry;
  const name = entry.path || file.webkitRelativePath || file.name;
  const source = { id: crypto.randomUUID(), kind: 'file', name, size: file.size,
    type: file.name.split('.').pop()?.toUpperCase() || '文件',
    signature: name + ':' + file.size + ':' + file.lastModified, content: '', note: '需补充文本' };
  const documentFile = /\.(pdf|docx)$/i.test(file.name);
  const readable = documentFile || textFile.test(file.name) || file.type.startsWith('text/') ||
    /^(README|LICENSE|Dockerfile|\.gitignore)$/i.test(file.name);
  if (!readable) return source;
  if (file.size > (documentFile ? 30_000_000 : 8_000_000)) {
    return { ...source, note: '文件超过读取上限，请拆分后添加或补充文本' };
  }
  try {
    const { text, method } = await readDocumentFile(file);
    return { ...source, content: text, parseMethod: method, note: text.trim() ? '正文已读取' : '空文件，需补充文本' };
  } catch (error) {
    return { ...source, note: error.message || '未能读取正文，需补充文本' };
  }
}

export async function droppedFiles(transfer) {
  const entries=Array.from(transfer.items||[]).map(item=>item.webkitGetAsEntry?.()).filter(Boolean);
  const fallback=Array.from(transfer.files||[]);
  if(!entries.length)return fallback;
  const files=[];
  async function walk(entry,path='') {
    if(files.length>sourceLimit)return;
    if(entry.isFile) {
      const file=await new Promise((resolve,reject)=>entry.file(resolve,reject));
      files.push({file,path:path+file.name});
    }else if(entry.isDirectory) {
      const reader=entry.createReader();
      for(;;) {
        const children=await new Promise((resolve,reject)=>reader.readEntries(resolve,reject));
        if(!children.length||files.length>sourceLimit)break;
        for(const child of children)await walk(child,path+entry.name+'/');
      }
    }
  }
  for(const entry of entries)await walk(entry);
  return files;
}

export function webSources(text,existing) {
  const addresses=text.split(/\r?\n/).map(value=>value.trim()).filter(Boolean);
  if(!addresses.length)throw new Error('请先填写网页地址。');
  const known=new Set(existing.filter(source=>source.kind==='web').map(source=>source.url));
  const result=[];
  for(const address of addresses) {
    let url;
    try{url=new URL(address);if(!['http:','https:'].includes(url.protocol))throw new Error();}
    catch{throw new Error('请填写完整的 http:// 或 https:// 网页地址，每行一个。');}
    if(known.has(url.href))continue;
    known.add(url.href);
    result.push({id:crypto.randomUUID(),kind:'web',name:url.href,url:url.href,type:'网页',content:'',note:'待补充正文'});
  }
  if(existing.length+result.length>sourceLimit)throw new Error('每批最多添加 1000 份资料，请分批添加。');
  return result;
}

export function prepareNotebook({name, description, agentId, customInstructions = '', sources}) {
  const preset = organizingAgents.find(item => item.id === agentId) || organizingAgents[0];
  const instructions = customInstructions.trim();
  if (preset.id === 'custom' && !instructions) throw Error('请填写自定义整理要求。');
  if (preset.id === 'custom' && instructions.length > 2000) throw Error('自定义整理要求最多 2000 字。');
  const organizingAgent = preset.id === 'custom' ? { ...preset, description: instructions, instructions } : preset;
  return { name: name.trim(), description: description.trim(), organizingAgent, inputSources: sources };
}
