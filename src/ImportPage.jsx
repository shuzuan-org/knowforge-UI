import { ActionSummary, ActionIcon } from './ActionControls.jsx';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from './workbench-components.jsx';
import { resolveActiveMethod, organizingMethodSnapshot, agentTemplates } from './advanced-model.mjs';
import { MethodManager } from './AdvancedViews.jsx';
import { formatBytes, TEXT_LIMIT } from './workbench-model.mjs';
import { readDocumentFile } from './document-import.js';
import { ImportDestination } from './ImportDestination.jsx';
import './import-page.css';
import { FeatureHint } from './FeatureHint.jsx';
const newId = prefix => prefix + '-' + crypto.randomUUID();

export function ImportPage({ libraries, initialLibrary, recent, initialAgent, initialSettings, initialManager, initialMethodTab, agentProfiles, sources, setState, notify, onImport }) {
  const [target, setTarget] = useState(initialLibrary || '');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState('file');
  const [method, setMethod] = useState(() => resolveActiveMethod(initialAgent, agentProfiles).id);
  const selectedAgent = resolveActiveMethod(method, agentProfiles);
  useEffect(() => { if (method !== selectedAgent.id) setMethod(selectedAgent.id); }, [method, selectedAgent.id]);
  const [settingsOpen, setSettingsOpen] = useState(!!initialAgent || !!initialSettings);
  const [managerOpen, setManagerOpen] = useState(!!initialManager);
  const availableAgents = [...agentTemplates, ...agentProfiles.filter(a => !a.archived)];
  const [pending, setPending] = useState([]);
  const [web, setWeb] = useState('');
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [scan, setScan] = useState({done:0,total:0});
  const [assess, setAssess] = useState(false);
  const fileInput = useRef(null), folderInput = useRef(null), reading = useRef(false), submitting = useRef(false), newNameInput = useRef(null), queue = useRef(null);
  useEffect(() => {
    if (target !== '__new__' && !libraries.some(l => l.id === target)) setTarget(initialLibrary);
  }, [libraries, target, initialLibrary]);
  function chooseDestination(id) {
    setTarget(id); setError('');
    if (id === '__new__') requestAnimationFrame(() => newNameInput.current?.focus());
  }
  async function addFiles(files) {
    if (reading.current) return;
    const remaining = 1000 - pending.length;
    if (remaining <= 0) return setError('每批最多添加1000份资料，请分批添加。');
    reading.current = true;
    setBusy(true); setError(''); setScan({done:0,total:Math.min(files.length,remaining)});
    const items = [];
    for (const file of [...files].slice(0, remaining)) {
      const readable = /\.(txt|md|markdown|csv|json|js|jsx|ts|tsx|mjs|cjs|css|scss|html?|xml|yaml|yml|py|java|sql|sh|vue|svelte|pdf|docx)$/i.test(file.name) || /^(README|LICENSE|Dockerfile|\.gitignore)$/i.test(file.name);
      const item = { queueId: newId('queue'), name: file.demoRelativePath || file.webkitRelativePath || file.name, size: file.size, type: file.name.split('.').pop()?.toUpperCase() || '文件', readable, kind: 'file', content: '', tooLarge: readable && file.size > (/\.(pdf|docx)$/i.test(file.name) ? 30_000_000 : TEXT_LIMIT) };
      if (readable && !item.tooLarge) { try { const result = await readDocumentFile(file); item.content=result.text;item.parseMethod=result.method; } catch (error) { item.readError = error.message || '没有成功读取文件，请重新添加。'; } }
      items.push(item);setScan(v=>({...v,done:items.length}));if(items.length%10===0)await new Promise(resolve=>setTimeout(resolve,0));
    }
    setPending(previous => [...previous, ...items]); setBusy(false); reading.current = false;
    if (files.length > remaining) setError('本批最多1000份资料，其余文件可分批添加。');
    if (fileInput.current) fileInput.current.value = '';
    if (folderInput.current) folderInput.current.value = '';
  }
  function addWeb() {
    const rows = web.split(/\n/).map(s => s.trim()).filter(Boolean);
    if (!rows.length) return setError('请先填写网页地址。');
    try { rows.forEach(s => { const u = new URL(s); if (!['http:', 'https:'].includes(u.protocol)) throw new Error(); }); } catch { return setError('请填写完整的 http:// 或 https:// 网页地址，每行一个。'); }
    if (rows.length + pending.length > 1000) return setError('每批最多添加1000份资料，请分批添加。');
    setPending(previous => [...previous, ...rows.map(address => ({ queueId: newId('queue'), name: address, url: address, type: '网页', kind: 'web', content: '' }))]); setWeb(''); setError('');
  }
  function removePending(id) {
    if (busy || reading.current) return;
    const index = pending.findIndex(item => item.queueId === id);
    setPending(previous => previous.filter(item => item.queueId !== id));
    requestAnimationFrame(() => {
      const controls = queue.current?.querySelectorAll('button');
      const fallback = document.getElementById(kind === 'web' ? 'mm-import-web-address' : 'mm-import-select-files');
      (controls?.[Math.min(index, controls.length - 1)] || fallback)?.focus({ preventScroll: true });
    });
  }
  function submit(e) {
    e.preventDefault();
    if (!pending.length) return setError('请先添加至少一份资料。');
    if (target === '__new__' && !name.trim()) return setError('请填写新知识库的名称。');
    if (!target) return setError('请选择保存资料的知识库。');
    if (reading.current || busy || submitting.current) return;
    try {
      submitting.current = true;
      onImport(target, target === '__new__' ? { name, description } : null, pending.map(s => ({ ...s, ...organizingMethodSnapshot(method,agentProfiles) })));
      setPending([]); setWeb(''); setName(''); setDescription(''); setError(''); setKind('file'); setMethod('general'); setSettingsOpen(false); setAssess(false);
    } catch (problem) { setError(problem.message || '没有完成添加，请重试。'); }
    finally { submitting.current = false; }
  }
  return <>
    <section className="mm-import-page" aria-labelledby="mm-import-page-title">
      <div className="mm-page-heading"><div><h1 id="mm-import-page-title"><FeatureHint text="选择归属，添加资料，整理后即可阅读和提问。">添加资料</FeatureHint></h1></div></div>
      <form className="mm-import-form" onSubmit={submit}>
        <div className="mm-import-body">
          <div className="mm-import-destination"><label htmlFor="mm-import-destination">保存到知识库</label><ImportDestination id="mm-import-destination" libraries={libraries} recent={recent} value={target} onChange={chooseDestination} /></div>
          {target === '__new__' && <div className="mm-import-new"><ClearableImportField id="mm-import-new-name" label={<>知识库名称 <span className="mm-required">必填</span></>} clearLabel="清空知识库名称" inputRef={newNameInput} value={name} onChange={setName} maxLength={60} placeholder="给这批资料起个名字" required /><ClearableImportField id="mm-import-new-description" label={<>说明 <span className="mm-subtle">选填</span></>} clearLabel="清空说明" value={description} onChange={setDescription} maxLength={300} placeholder="资料内容或知识库用途" /></div>}
          <div className="mm-import-source-tabs mm-segmented" role="group" aria-label="资料添加方式"><Button aria-pressed={kind === 'file'} className={kind === 'file' ? 'active' : ''} onClick={() => { setKind('file'); setError(''); }}>文件与文件夹</Button><Button aria-pressed={kind === 'web'} className={kind === 'web' ? 'active' : ''} onClick={() => { setKind('web'); setError(''); }}>网页链接</Button></div>
          <input hidden ref={fileInput} type="file" multiple aria-label="选择本地文件" onChange={e => addFiles(e.target.files)} /><input hidden ref={folderInput} type="file" multiple webkitdirectory="" directory="" aria-label="选择本地文件夹" onChange={e => addFiles(e.target.files)} />
          <div className={'mm-import-add-area' + (dragging ? ' dragging' : '')} onDragOver={e => { e.preventDefault(); if(!busy)setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={async e => { e.preventDefault(); setDragging(false); if(reading.current||busy)return; const entries=[...e.dataTransfer.items].map(i=>i.webkitGetAsEntry?.()).filter(Boolean); if(!entries.length)return addFiles(e.dataTransfer.files);setBusy(true);setError('');const files=[];async function walk(entry,path=''){if(files.length>=1001)return;if(entry.isFile){const file=await new Promise((resolve,reject)=>entry.file(resolve,reject));Object.defineProperty(file,'demoRelativePath',{value:path+file.name});files.push(file);}else if(entry.isDirectory){const reader=entry.createReader();for(;;){const children=await new Promise((resolve,reject)=>reader.readEntries(resolve,reject));if(!children.length||files.length>=1001)break;for(const child of children)await walk(child,path+entry.name+'/');}}}try{for(const entry of entries)await walk(entry);await addFiles(files);}catch{setError('读取拖入目录失败，请使用选择文件夹。');setBusy(false);} }}>
          {kind === 'file' ? pending.length === 0 ? <div className="mm-import-drop"><h3>把资料放进来</h3><div className="mm-import-drop-hint"><p>拖入文件或文件夹，也可以从电脑选择</p><ImportLimits /></div><div className="mm-import-file-actions"><Button id="mm-import-select-files" className="mm-import-picker" onClick={() => fileInput.current.click()} disabled={busy}>选择文件</Button><Button variant="plain" onClick={() => folderInput.current.click()} disabled={busy}>选择文件夹</Button></div></div> : <div className="mm-import-more-files"><div className="mm-import-continue-hint"><span>可继续拖入文件或文件夹</span><ImportLimits /></div><div><Button id="mm-import-select-files" className="mm-import-picker" onClick={() => fileInput.current.click()} disabled={busy}>继续添加文件</Button><Button variant="plain" onClick={() => folderInput.current.click()} disabled={busy}>添加文件夹</Button></div></div> : <div className="mm-import-web"><ClearableImportField id="mm-import-web-address" label="网页地址" clearLabel="清空网页地址" multiline className="mm-import-picker" rows={3} value={web} onChange={setWeb} placeholder={"https://example.com/article\n每行一个网页地址"} /><div className="mm-import-web-actions"><p className="mm-caption">网页正文暂不支持自动获取，添加后可补充文本。</p><Button onClick={addWeb} disabled={busy || !web.trim()}>加入列表</Button></div></div>}
          {busy && <div className="mm-import-scan" role="status"><p>正在读取 · {scan.done} / {scan.total} 份</p><progress value={scan.done} max={scan.total || 1}/></div>}
          {pending.length > 0 && <div className="mm-import-queue" ref={queue}><div className="mm-queue-heading"><span>待添加资料</span></div>{pending.map(item => <div className="mm-queue-row" key={item.queueId}><span className="mm-file-type">{item.type}</span><div><strong title={item.name}>{item.name}</strong><small className={item.readError || item.tooLarge ? 'mm-field-error' : ''}>{item.kind === 'web' ? '网页 · 添加后补充正文' : formatBytes(item.size) + ' · ' + (item.readError || (item.tooLarge ? '超出读取上限，添加后需补充文本' : item.content?.trim() ? '正文已读取' : '需补充文本'))}</small></div><ImportClearButton label={'移除待添加资料 ' + item.name} disabled={busy} onClick={() => removePending(item.queueId)} /></div>)}</div>}
          </div>
          {kind === 'file' && <div className="mm-import-formats"><p>支持文本、源码、PDF、DOCX · 扫描件和图片需补充文本</p></div>}
          <details className="mm-import-settings" open={settingsOpen} onToggle={event => setSettingsOpen(event.currentTarget.open)}><ActionSummary><span>整理智能体</span><span className="mm-import-settings-toggle"><ActionIcon name="chevron-down"/>{settingsOpen ? '收起设置' : '更多设置'}</span></ActionSummary><div className="mm-import-settings-content"><label>智能体<select value={selectedAgent.id} onChange={e => setMethod(e.target.value)}>{availableAgents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}{agent.id === 'general' ? '（默认）' : ''}</option>)}</select></label><div className="mm-import-method-note"><p>{selectedAgent.direction || selectedAgent.description}</p><Button className="mm-import-setting-action" onClick={() => setManagerOpen(true)}>管理智能体</Button></div><p className="mm-caption">所选智能体与规则随本次资料保存。当前按段落整理，在线 AI 尚未连接。</p><Button className="mm-import-setting-action" disabled={busy} onClick={() => setAssess(v => !v)} aria-expanded={assess}>生成前评测</Button>{assess && <div className="mm-import-assessment"><strong>本批资料检查</strong><p>{pending.filter(s => s.content?.trim()).length} 份正文可用 · {pending.filter(s => !s.content?.trim()).length} 份需补充正文</p><p className="mm-caption">按实际读取结果检查，源码不执行，空文件及扫描件不会假装已解析。</p></div>}</div></details>
          {error && <p className="mm-field-error" role="alert">{error}</p>}
        </div>
        <footer className="mm-import-footer"><div>{pending.length > 0 && <span role="status">已选 {pending.length} 份资料</span>}<small>文本只保存在当前浏览器，不产生在线 AI 调用。</small></div><div><Button type="submit" variant="primary" disabled={busy || !pending.length || !target || (target === '__new__' && !name.trim())}>{busy ? '正在读取…' : '添加并整理'}</Button></div></footer>
      </form>
    </section>
    {managerOpen && <MethodManager profiles={agentProfiles} libraries={libraries} sources={sources} currentId={selectedAgent.id} initialTab={initialMethodTab} setState={setState} notify={notify} onClose={() => setManagerOpen(false)} onChoose={choice => { setMethod(choice.id); setManagerOpen(false); setSettingsOpen(true); notify('已选择' + choice.name + '，待添加资料保留'); }}/>}
  </>;
}

function ImportLimits(){return <p className="mm-import-limits">每批最多1000份；文本200万字符，PDF/DOCX 30MB，PDF最多500页。</p>;}

function ImportClearButton({ label, ...props }) {
  return <Button type="button" variant="secondary" className="mm-import-clear" aria-label={label} {...props}><ActionIcon name="close" size={14} /></Button>;
}

function ClearableImportField({ id, label, clearLabel, inputRef, value, onChange, multiline = false, ...props }) {
  const ownRef = useRef(null), ref = inputRef || ownRef;
  const Field = multiline ? 'textarea' : 'input';
  return <div className="mm-import-field"><label htmlFor={id}>{label}</label><div className="mm-import-clearable"><Field id={id} ref={ref} value={value} onChange={event => onChange(event.target.value)} {...props} />{value.length > 0 && <ImportClearButton label={clearLabel} onClick={() => { onChange(''); ref.current?.focus({ preventScroll: true }); }} />}</div></div>;
}
