import { ActionLink, ActionButton, ActionSummary } from './ActionControls.jsx';
import { FeatureHint } from './FeatureHint.jsx';
import React, { useEffect, useRef, useState } from 'react';
import { Button, Empty, Icon, Modal, Status } from './workbench-components.jsx';
import { SourceAgentInfo, SupplementDialog } from './LibraryView.jsx';
import { libraryPath, formatBytes } from './workbench-model.mjs';
import { buildFolderTree, changeProcessing, collectFiles, filterFiles, PAGE_SIZE, restoreSources, trashSources } from './files-model.mjs';
import fileIcons from './file-icons.json';
import { copyText } from './copy-text.js';

function FolderIcon() { return <span className="tree-icon tree-icon-category mm-folder-icon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: fileIcons.category }} />; }
const listHref = (library = '', folder = '', trash = false) => {
  const params = new URLSearchParams();
  if (library) params.set('library', library);
  if (folder && library) params.set('folder', folder);
  if (trash) params.set('view', 'trash');
  return '/sources' + (params.size ? '?' + params : '');
};
const fileStatus = source => source.trashedAt ? 'waiting' : source.example ? 'example' : source.state;
const fileStatusText = source => source.trashedAt ? '已移入回收站' : source.example ? source.state==='ready'?'已整理':source.state==='skipped'?'不处理':'待整理' : undefined;
const dateText = value => value ? new Date(value).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '未记录';

export function FilesView({ libraries, sources, exampleSources, route, navigate, setState, notify }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [kind, setKind] = useState('all');
  const [origin, setOrigin] = useState('all');
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(0);
  const [selection, setSelection] = useState([]);
  const [prompt, setPrompt] = useState(null);
  const [foldersOpen, setFoldersOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const headerCheckbox = useRef(null);
  const libraryId = route.searchParams.get('library') || '';
  const library = libraries.find(l => l.id === libraryId);
  const folder = libraryId ? route.searchParams.get('folder') || '' : '';
  const trash = route.searchParams.get('view') === 'trash';
  const files = collectFiles(libraries, sources, exampleSources);
  const active = files.filter(s => !s.trashedAt);
  const recycled = files.filter(s => s.trashedAt);
  const pool = trash ? recycled : active;
  const scoped = pool.filter(s => !libraryId || s.libraryId === libraryId);
  const filtered = filterFiles(files, { libraryId, folder, query, status, kind, origin, trash, sort });
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const selectable = visible.filter(s => !s.example);
  const selected = filtered.filter(s => !s.example && selection.includes(s.id));
  const allChecked = selectable.length > 0 && selectable.every(s => selection.includes(s.id));
  const detail = files.find(s => s.id === route.searchParams.get('file'));
  const hasFilters = !!query.trim() || status !== 'all' || kind !== 'all' || origin !== 'all';
  const activeLocal = filterFiles(files, { libraryId, folder }).filter(s => !s.example);
  const pending = activeLocal.filter(s => ['waiting', 'processing'].includes(s.state));
  const attention = activeLocal.filter(s => s.state === 'attention');
  const statusEmpty = !query.trim() && kind === 'all' && origin !== 'example' && ['attention', 'pending'].includes(status);
  const addHref = '/upload' + (libraryId ? '?library=' + encodeURIComponent(libraryId) : '');

  useEffect(() => { setPage(0); setSelection([]); }, [libraryId, folder, query, status, kind, origin, trash, sort]);
  useEffect(() => { if (headerCheckbox.current) headerCheckbox.current.indeterminate = !allChecked && selectable.some(s => selection.includes(s.id)); }, [selection, allChecked, currentPage, selectable.map(s => s.id).join('|')]);
  function clearFilters() { setQuery(''); setStatus('all'); setKind('all'); setOrigin('all'); }
  function chooseFolder(id = '', path = '') { navigate(listHref(id, path, trash)); setFoldersOpen(false); }
  function openDetails(source) { const dest = new URL(listHref(libraryId, folder, trash), location.origin); dest.searchParams.set('file', source.id); navigate(dest.pathname + dest.search, false, false); }
  function closeDetails() { navigate(listHref(libraryId, folder, trash), false, false); }
  function toggle(id) { setSelection(ids => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]); }
  function togglePage() { setSelection(ids => allChecked ? ids.filter(id => !selectable.some(s => s.id === id)) : [...new Set([...ids, ...selectable.map(s => s.id)])]); }
  function restore(ids) { setState(s => restoreSources(s, ids)); setSelection([]); if (detail) closeDetails(); notify('已恢复 ' + ids.length + ' 份文件，回到原知识库和文件夹'); }
  function processing(ids, next) { setState(s => changeProcessing(s, ids, next)); setSelection([]); notify(next === 'processing' ? '已继续整理' : '整理已暂停，可随时继续'); }
  function confirmTrash() {
    setState(s => trashSources(s, prompt.ids)); setSelection([]); setPrompt(null);
    if (detail) closeDetails(); notify('已移到回收站，可随时恢复');
  }
  const directory = <FileDirectory libraries={libraries} files={pool} libraryId={libraryId} folder={folder} onSelect={chooseFolder} />;
  if (libraryId && !library) return <Empty title="没有找到这个知识库" action={<ActionLink className="mm-button mm-button-primary" href="/sources">查看全部资料</ActionLink>}>它可能已从当前浏览器中隐藏。</Empty>;

  return <div className="mm-files-view">
    <ActionLink className="mm-back-link" href="/workspace">‹ 返回知识库</ActionLink>
    <div className="mm-page-heading"><div><h1><FeatureHint text="跨知识库查找资料，查看原文和整理状态。">全部资料</FeatureHint></h1></div><div className="mm-heading-actions"><Button onClick={() => setHelpOpen(true)}>资料与知识页面的区别</Button><ActionLink className="mm-button mm-button-primary" href={addHref}><Icon name="upload" />添加资料</ActionLink></div></div>
    <div className="mm-advanced-tabs" role="group" aria-label="文件视图"><Button variant="plain" aria-pressed={!trash} className={!trash ? 'active' : ''} onClick={() => { clearFilters(); navigate(listHref(libraryId, folder)); }}>文件列表 · {active.length}</Button><Button variant="plain" aria-pressed={trash} className={trash ? 'active' : ''} onClick={() => { clearFilters(); navigate(listHref(libraryId, '', true)); }}>回收站 · {recycled.length}</Button></div>
    <div className="mm-file-browser"><aside className="mm-file-directory" aria-label="知识库与文件夹">{directory}</aside>
      <section className="mm-files-content" aria-label={trash ? '回收站文件' : '文件列表'}>
        <div className="mm-files-location"><nav aria-label="当前文件夹"><Button className="mm-files-directory-button" aria-label="选择知识库与文件夹" title={library ? library.name + (folder ? ' / ' + folder : '') : '全部知识库'} onClick={() => setFoldersOpen(true)}><span>{library ? library.name + (folder ? ' / ' + folder.split('/').at(-1) : '') : '全部知识库'}</span><small>更换</small></Button><ActionButton onClick={() => chooseFolder()}>全部知识库</ActionButton>{library && <><span>/</span><ActionButton onClick={() => chooseFolder(library.id)}>{library.name}</ActionButton></>}{folder.split('/').filter(Boolean).map((part, i, parts) => <React.Fragment key={i}><span>/</span><ActionButton aria-current={i === parts.length - 1 ? 'location' : undefined} onClick={() => chooseFolder(libraryId, parts.slice(0, i + 1).join('/'))}>{part}</ActionButton></React.Fragment>)}</nav>{library && <ActionLink href={libraryPath(library.id, 'sources')}>查看知识库 →</ActionLink>}</div>
        <div className="mm-file-search-row"><label className="mm-search"><Icon name="search" /><input aria-label="搜索文件名称、路径或知识库" placeholder="搜索文件名称、路径或知识库" value={query} onChange={e => setQuery(e.target.value)} /></label><label className="mm-file-sort">排序<select value={sort} onChange={e => setSort(e.target.value)}><option value="recent">最近添加</option><option value="name">文件名称</option><option value="contribution">引用贡献度</option></select></label></div>
        <div className="mm-file-filters"><label>状态<select value={status} onChange={e => setStatus(e.target.value)}><option value="all">全部状态</option><option value="ready">可使用</option><option value="attention">需处理</option><option value="pending">待整理 / 整理中</option><option value="example">全部只读记录</option><option value="indexed">已整理的只读记录</option><option value="skipped">不处理</option></select></label><label>类型<select value={kind} onChange={e => setKind(e.target.value)}><option value="all">全部类型</option>{['文档','文本','图片','代码','网页','其他'].map(name => <option key={name}>{name}</option>)}</select></label><label>来源<select value={origin} onChange={e => setOrigin(e.target.value)}><option value="all">全部来源</option><option value="local">我添加的</option><option value="example">只读记录</option></select></label>{hasFilters && <Button variant="plain" onClick={clearFilters}>清空筛选</Button>}<span className="mm-result-count">{filtered.length} 份文件{folder ? ' · 含子文件夹' : ''}</span></div>
        {!trash && (attention.length > 0 || pending.length > 0) && <div className="mm-file-task-strip"><span>继续处理资料</span>{attention.length > 0 && <ActionButton onClick={() => { setQuery(''); setKind('all'); setOrigin('local'); setStatus('attention'); }}>{attention.length} 份需处理 →</ActionButton>}{pending.length > 0 && <ActionButton onClick={() => { setQuery(''); setKind('all'); setOrigin('local'); setStatus('pending'); }}>{pending.length} 份待整理 / 整理中 →</ActionButton>}</div>}
        {selected.length > 0 && <div className="mm-file-selection" role="region" aria-label="批量文件操作"><strong>已选 {selected.length} 份本地文件</strong><div>{trash ? <Button onClick={() => restore(selected.map(s => s.id))}>恢复文件</Button> : <>{selected.some(s => s.state === 'waiting') && <Button onClick={() => processing(selected.filter(s => s.state === 'waiting').map(s => s.id), 'processing')}>继续整理</Button>}{selected.some(s => s.state === 'processing') && <Button onClick={() => processing(selected.filter(s => s.state === 'processing').map(s => s.id), 'waiting')}>暂停整理</Button>}<Button onClick={() => setPrompt({ kind: 'trash', ids: selected.map(s => s.id) })}>移到回收站</Button></>}<Button variant="plain" onClick={() => setSelection([])}>取消选择</Button></div></div>}
        {visible.length ? <>
          <div className="mm-files-table"><div className="mm-files-table-head"><span><input ref={headerCheckbox} type="checkbox" aria-label="选择本页可操作的本地文件" checked={allChecked} disabled={!selectable.length} onChange={togglePage} /></span><span>文件名称与路径</span><span>所属知识库</span><span>{trash ? '移入时间' : '状态与说明'}</span><span>操作</span></div>
            {visible.map(source => <FileRow key={source.id} source={source} selected={selection.includes(source.id)} onToggle={() => toggle(source.id)} onDetails={() => openDetails(source)} onSupplement={() => setPrompt({ kind: 'supplement', id: source.id })} onTrash={() => setPrompt({ kind: 'trash', ids: [source.id] })} onRestore={() => restore([source.id])} onProcessing={next => processing([source.id], next)} />)}
          </div><footer className="mm-file-pagination"><span>第 {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, filtered.length)} 份，共 {filtered.length} 份</span><div><Button disabled={!currentPage} onClick={() => { setPage(p => p - 1); }}>上一页</Button><span>{currentPage + 1} / {pageCount}</span><Button disabled={currentPage >= pageCount - 1} onClick={() => setPage(p => p + 1)}>下一页</Button></div></footer>
        </> : <div className="mm-outlined"><Empty title={hasFilters ? statusEmpty ? status === 'attention' ? '没有需要处理的文件' : '没有待整理的文件' : '没有匹配的文件' : trash ? '回收站是空的' : library?.example && library.totalFiles > 0 ? '尚未收录文件条目' : '这里还没有文件'} action={hasFilters ? <Button onClick={clearFilters}>{statusEmpty ? '查看全部文件' : '重置筛选'}</Button> : trash ? <Button onClick={() => navigate(listHref(libraryId))}>返回文件列表</Button> : <ActionLink className="mm-button mm-button-primary" href={addHref}>添加资料</ActionLink>}>{hasFilters ? statusEmpty ? pending.length ? '资料已提交整理，可以切换到“待整理 / 整理中”查看进度。' : '当前范围内没有待处理项，可以查看全部文件。' : '换一个关键词或调整筛选条件。' : trash ? '移入回收站的本地资料可以在这里恢复。' : library?.example && library.totalFiles > 0 ? '此知识库共有 ' + library.totalFiles + ' 份资料，当前暂无对应文件明细。你可以添加新的资料。' : '添加文件、文件夹或网页后，在这里查看原文与整理状态。'}</Empty></div>}
        <p className="mm-caption">当前收录 {active.filter(s=>!libraryId||s.libraryId===libraryId).length} 条文件记录{library?.totalFiles>2000&&<>；文件列表不完整，此知识库仅保存了2000条文件记录。</>}</p><p className="mm-caption mm-file-footnote">{trash ? '文件在回收站期间不参与问答与知识页面。恢复后回到原知识库和路径。' : '只读记录未保存附件正文。你添加的文本可直接阅读和提问。'}</p>
      </section>
    </div>
    {foldersOpen && <Modal title="选择知识库与文件夹" onClose={() => setFoldersOpen(false)}><div className="mm-dialog-body mm-mobile-file-directory">{directory}</div></Modal>}
    {detail && !prompt && <FileDetails source={detail} library={libraries.find(l => l.id === detail.libraryId)} onClose={closeDetails} onSupplement={() => setPrompt({ kind: 'supplement', id: detail.id })} onTrash={() => setPrompt({ kind: 'trash', ids: [detail.id] })} onRestore={() => restore([detail.id])} onProcessing={next => processing([detail.id], next)} notify={notify} />}
    {prompt?.kind === 'supplement' && sources.find(s => s.id === prompt.id && !s.trashedAt) && <SupplementDialog source={sources.find(s => s.id === prompt.id)} onClose={() => setPrompt(null)} onSave={content => { setState(s => ({ ...s, sources: s.sources.map(item => item.id === prompt.id && !item.trashedAt ? { ...item, content, state: 'processing', reason: '', providedText: true } : item) })); setPrompt(null); if (detail) closeDetails(); notify('文本已补充，正在重新整理'); }} />}
    {prompt?.kind === 'trash' && <Modal title={'将 ' + prompt.ids.length + ' 份文件移到回收站？'} onClose={() => setPrompt(null)}><div className="mm-dialog-body"><p>文件会暂时从知识库的问答与知识页面中移除，内容和整理规则会保留。你可以在回收站恢复，电脑中的原文件不会改变。</p><div className="mm-files-confirm-list">{files.filter(s => prompt.ids.includes(s.id)).slice(0, 4).map(s => <p key={s.id}>{s.location.name}</p>)}{prompt.ids.length > 4 && <p>及其他 {prompt.ids.length - 4} 份文件</p>}</div></div><div className="mm-dialog-actions"><Button onClick={() => setPrompt(null)}>取消</Button><Button variant="danger" onClick={confirmTrash}>移到回收站</Button></div></Modal>}
    {helpOpen && <Modal title="文件保存原始内容，知识页面用于阅读和问答" onClose={() => setHelpOpen(false)}><div className="mm-dialog-body mm-form-stack"><div><h3>全部资料</h3><p>保留你添加的文件、目录和网页记录。在这里查找文件、查看正文、补充文本和管理整理状态。</p></div><div><h3>知识页面</h3><p>资料整理后进入知识库的可读内容。可以围绕一篇内容提问，并点击引用核验出处。</p></div><div className="mm-notice">只读记录仅包含文件信息，未保存附件正文。待解析的资料可补充文本后继续整理。</div></div><div className="mm-dialog-actions"><Button variant="primary" onClick={() => setHelpOpen(false)}>开始查看文件</Button></div></Modal>}
  </div>;
}

function FileDirectory({ libraries, files, libraryId, folder, onSelect }) {
  return <><div className="mm-file-directory-heading"><h2>知识库与文件夹</h2><small>按路径浏览 · 仅计已收录</small></div><ActionButton className={'mm-file-directory-all' + (!libraryId ? ' active' : '')} onClick={() => onSelect()}><Icon name="archive" /><span>全部知识库</span><small>{files.length}</small></ActionButton><div className="mm-file-library-tree">{libraries.map(library => {
    const items = files.filter(s => s.libraryId === library.id), selected = libraryId === library.id;
    return <div key={library.id}><ActionButton className={'mm-file-library-button' + (selected && !folder ? ' active' : '')} aria-current={selected && !folder ? 'location' : undefined} onClick={() => onSelect(library.id)}><Icon name="archive" /><span>{library.name}</span><small>{items.length}</small></ActionButton>{selected && <FolderTree nodes={buildFolderTree(items)} selected={folder} onSelect={path => onSelect(library.id, path)} />}</div>;
  })}</div><p className="mm-caption">数字为当前视图已收录的文件条目。</p></>;
}

function FolderTree({ nodes, selected, onSelect }) {
  return <ul className="mm-file-folder-tree">{nodes.map(node => <li key={node.path}><div className={'mm-file-folder-line' + (selected === node.path ? ' active' : '')}><FolderIcon /><ActionButton title={node.path} aria-current={selected === node.path ? 'location' : undefined} onClick={() => onSelect(node.path)}>{node.name}</ActionButton><small>{node.count}</small></div>{node.children.length > 0 && <details open={selected === node.path || selected.startsWith(node.path + '/') ? true : undefined}><ActionSummary aria-label={'展开 ' + node.name + ' 的子文件夹'}>子文件夹 · {node.children.length}</ActionSummary><FolderTree nodes={node.children} selected={selected} onSelect={onSelect} /></details>}</li>)}</ul>;
}

function FileRow({ source, selected, onToggle, onDetails, onSupplement, onTrash, onRestore, onProcessing }) {
  const extension = source.kind === 'web' ? 'URL' : source.location.name.includes('.') ? source.location.name.split('.').at(-1).toUpperCase().slice(0, 5) : 'FILE';
  return <article className={'mm-file-row' + (selected ? ' selected' : '')}>
    <div className="mm-file-row-checkbox"><input type="checkbox" checked={selected} disabled={!!source.example} onChange={onToggle} aria-label={(source.example ? '只读文件记录：' : '选择文件：') + source.location.path} title={source.example ? '此记录仅供查看' : '选择此文件'} /></div>
    <div className="mm-file-row-name"><span className={'mm-file-extension mm-file-extension-' + source.fileKind}>{extension}</span><div><ActionButton className="mm-file-name-button" title={source.name} onClick={onDetails}>{source.location.name}</ActionButton><small className="mm-file-inline-library">{source.libraryName} · {source.example ? '只读记录' : '我添加的'}</small><small title={source.location.folder}>{source.location.folder || (source.kind === 'web' ? '网页链接' : '知识库根目录')}</small></div></div>
    <div className="mm-file-row-library"><span>{source.libraryName}</span><small>{source.example ? '只读记录' : source.providedText ? '已补充文本' : source.fileKind + (source.size ? ' · ' + formatBytes(source.size) : '')}</small></div>
    <div className="mm-file-row-state"><Status state={fileStatus(source)}>{fileStatusText(source)}</Status><small title={source.reason}>{source.trashedAt ? dateText(source.trashedAt) : source.example ? ('未保存附件正文') : source.state === 'attention' ? '补充文本后继续整理' : source.state === 'processing' ? '正在整理正文' : source.state === 'waiting' ? '可继续整理' : source.providedText ? '补充文本可读' : '可阅读和提问'}</small></div>
    <div className="mm-file-row-actions">{source.trashedAt ? <Button variant="plain" onClick={onRestore}>恢复</Button> : source.state === 'attention' && !source.example ? <Button variant="plain" onClick={onSupplement}>补充文本</Button> : <Button variant="plain" onClick={onDetails}>{source.example ? '查看信息' : source.content ? '查看原文' : '查看详情'}</Button>}{!source.example && <details className="mm-file-row-menu"><ActionSummary className="mm-button mm-button-plain" aria-label={'更多操作：' + source.location.name}>更多</ActionSummary><div><ActionButton onClick={e => { e.currentTarget.closest('details').open = false; onDetails(); }}>文件详情</ActionButton>{source.state === 'waiting' && !source.trashedAt && <ActionButton onClick={e => { e.currentTarget.closest('details').open = false; onProcessing('processing'); }}>继续整理</ActionButton>}{source.state === 'processing' && !source.trashedAt && <ActionButton onClick={e => { e.currentTarget.closest('details').open = false; onProcessing('waiting'); }}>暂停整理</ActionButton>}{!source.trashedAt && <ActionButton onClick={e => { e.currentTarget.closest('details').open = false; onTrash(); }}>移到回收站</ActionButton>}</div></details>}</div>
  </article>;
}

function FileDetails({ source, library, onClose, onSupplement, onTrash, onRestore, onProcessing, notify }) {
  const [tab, setTab] = useState(source.content ? 'content' : 'info');
  async function copy(text) { try { await copyText(text); notify('已复制'); } catch { notify('复制失败，请手动选择内容复制'); } }
  const available = !source.trashedAt && !source.example && source.state === 'ready' && source.content?.trim();
  return <Modal title={source.location.name} description={source.libraryName} drawer onClose={onClose}><div className="mm-dialog-body mm-file-detail-body"><div className="mm-evidence-meta"><span>{source.fileKind}{source.example ? ' · 只读记录' : source.providedText ? ' · 手动补充文本' : ' · 我添加的'}</span><Status state={fileStatus(source)}>{fileStatusText(source)}</Status></div><div className="mm-advanced-tabs" role="group" aria-label="文件详情内容"><Button variant="plain" aria-pressed={tab === 'info'} className={tab === 'info' ? 'active' : ''} onClick={() => setTab('info')}>文件信息</Button><Button variant="plain" aria-pressed={tab === 'content'} className={tab === 'content' ? 'active' : ''} onClick={() => setTab('content')}>{source.providedText ? '补充文本' : '文件正文'}</Button></div>
    {tab === 'info' ? <><dl className="mm-file-metadata">{[['所属知识库', source.libraryName],['文件名称', source.location.name],['原始路径', source.location.path],['类型', source.fileKind],...(source.example?[['整理状态',fileStatusText(source)],['贡献度',source.contribution??'未收录']]:[['解析方式',source.parseMethod||'手动补充或文本读取']]),['文件大小', source.size ? formatBytes(source.size) : source.example ? '未记录' : source.kind === 'web' ? '网页链接' : '未记录'],['添加时间', source.example ? '未记录' : dateText(source.createdAt)],...(source.trashedAt ? [['移入回收站',dateText(source.trashedAt)]] : [])].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><div className="mm-file-detail-links"><Button onClick={() => copy(source.location.path)}>复制路径</Button><ActionLink className="mm-button" href={libraryPath(library.id, 'sources')}>查看知识库</ActionLink></div><SourceAgentInfo source={source} /></> : source.content ? <><div className="mm-file-content-heading"><p className="mm-caption">{source.providedText ? '以下是手动补充的文本，可用于本地阅读和问答。' : '以下是添加时保存的原始文本。'}</p><Button variant="plain" onClick={() => copy(source.content)}>复制正文</Button></div><pre className={'mm-source-original' + (source.fileKind === '代码' ? ' mm-file-code' : '')}>{source.content}</pre></> : <div className="mm-notice">{source.example ? '当前仅保存文件信息，没有附件正文。可以阅读相关知识页面，或添加文本资料。' : source.reason || (source.state === 'processing' ? '正文正在整理，完成后可以在这里阅读。' : '当前没有保存正文，可补充文本后继续整理。')}</div>}
    {source.state === 'attention' && !source.example && !source.trashedAt && <div className="mm-file-attention"><h3>需要补充文本</h3><p>{source.reason}</p><Button variant="primary" onClick={onSupplement}>补充文本并继续整理</Button></div>}{source.trashedAt && <div className="mm-notice">文件仍保留在回收站中，暂不参与知识库问答。恢复后回到原知识库与文件夹。</div>}
    </div><div className="mm-dialog-actions mm-file-detail-actions"><Button onClick={onClose}>返回列表</Button>{source.trashedAt ? <Button variant="primary" onClick={onRestore}>恢复文件</Button> : <>{!source.example && <Button variant="plain" onClick={onTrash}>移到回收站</Button>}{source.state === 'waiting' && !source.example && <Button variant="primary" onClick={() => onProcessing('processing')}>继续整理</Button>}{source.state === 'processing' && !source.example && <Button onClick={() => onProcessing('waiting')}>暂停整理</Button>}{available && <ActionLink className="mm-button mm-button-primary" href={libraryPath(library.id, 'ask', 'source:' + source.id)}>围绕文件提问</ActionLink>}{source.example && <ActionLink className="mm-button mm-button-primary" href={libraryPath(library.id, 'pages')}>查看知识页面</ActionLink>}</>}</div></Modal>;
}
