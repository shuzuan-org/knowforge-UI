import { useEffect, useRef } from 'react';
import workspaceSnapshots from './snapshots.json';
import landing from './landing.json';
import documents from './documents.json';
import './mirror.css';
import './home.css';

const snapshots = { ...workspaceSnapshots, landing };
const routes = { '/': 'landing', '/workspace': 'workspace-current', '/upload': 'upload', '/sources': 'sources', '/graph': 'graph', '/agents': 'agents', '/packages': 'packages' };
const cache = new Map();
function source(name) { if (!cache.has(name)) cache.set(name, new DOMParser().parseFromString(snapshots[name].body, 'text/html')); return cache.get(name); }
function part(name, selector) { return source(name).querySelector(selector)?.innerHTML || ''; }
const esc = (value) => String(value || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function load(key) { try { return JSON.parse(localStorage.getItem('mirror-' + key)) || []; } catch { return []; } }
function save(key, value) { try { localStorage.setItem('mirror-' + key, JSON.stringify(value)); } catch { /* Storage limits never interrupt browsing. */ } }

export function App() {
  const rootRef = useRef(null);
  useEffect(() => {
    const root = rootRef.current, $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)];
    let current = '', currentDoc = '', scope, collapsed = false, panelHTML = '', editingAgent = null;
    let scopes = load('scopes'), agents = load('agents'), files = load('files');
    const originals = [...source('workspace-current').querySelectorAll('.scope-item')].map((b, i) => ({ id: b.dataset.scope, name: b.querySelector('strong').textContent, description: ['metask视觉使用规范', 'metaskUI视觉规范', 'demo', '', '色彩理论、配色技巧与色彩偏好', '电影运镜与场面调度', '解析《我的叔叔唐吉坷德》', '全球通史', '在对话里保存的文件与结论'][i], count: [7294, 2, 44, 0, 1, 1, 1, 2, 0][i] || 0 }));
    scope = originals[0];
    function toast(message) { $('.mirror-toast')?.remove(); const box = document.createElement('div'); box.className = 'mirror-toast'; box.setAttribute('role', 'status'); box.textContent = message; root.append(box); setTimeout(() => box.remove(), 3200); }
    function addScopes() {
      const list = $('#scopeList'); if (!list) return;
      scopes.forEach(s => { if (list.querySelector('[data-scope="' + s.id + '"]')) return; const b = document.createElement('button'); b.className = 'scope-item'; b.dataset.scope = s.id; b.innerHTML = '<span class="scope-caret">▸</span>' + (list.querySelector('.tree-icon-scope')?.outerHTML || '') + '<strong>' + esc(s.name) + '</strong><span class="scope-meta">可用</span>'; list.append(b); });
      scopes.forEach(s => { const label = list.querySelector('[data-scope="' + s.id + '"] strong'); if (label) label.textContent = s.name; });
    }
    function savedAgents() {
      if (current !== 'agents') return;
      agents.forEach((a, i) => { const base = source('agents-templates').querySelectorAll('.agent-card')[1]?.cloneNode(true); if (!base) return; base.dataset.localAgent = i; base.querySelector('h2').textContent = a.name; if (base.querySelector('p')) base.querySelector('p').textContent = a.description; base.querySelectorAll('.agent-card-badges em').forEach(n => n.remove()); const badge = base.querySelector('.agent-card-badges span'); if (badge) badge.textContent = '我的智能体'; if (base.querySelector('button')) base.querySelector('button').textContent = '编辑'; $('#agentGrid').append(base); });
      if ($('#agentsMineCount')) $('#agentsMineCount').textContent = agents.length;
    }
    function localFiles() {
      const body = $('#fileTreeContainer tbody'); if (!body) return;
      body.querySelectorAll('[data-local-file]').forEach(n => n.remove());
      files.forEach(f => { const row = document.createElement('tr'); row.dataset.localFile = f.id; row.innerHTML = '<td><span class="file-badge badge-pre">P</span> ' + esc(f.name) + '</td><td>' + esc(f.type) + '</td><td>本地</td><td>未处理</td><td><button class="file-del" data-local-delete="' + f.id + '">✕</button></td>'; body.prepend(row); });
    }
    function applyScope() {
      $('#viewTitle').textContent = scope.name;
      if (scope.name !== 'metask视觉') {
        $('#view').innerHTML = $('#view').innerHTML.replaceAll('metask视觉使用规范', esc(scope.description)).replaceAll('metask视觉', esc(scope.name));
        $$('#countsRow strong').forEach((n, i) => n.textContent = i === 0 ? scope.count : 0);
        $('#sourceRankBlock').innerHTML = '<p class="muted">通过左侧目录浏览内容，或到「上传资料」添加本地文件。</p>';
        if ($('#generateArea .health-chip')) $('#generateArea .health-chip').textContent = scope.count ? '待评测' : '待添加资料';
      }
      $$('.scope-item').forEach(b => b.classList.toggle('active', b.dataset.scope === scope.id));
    }
    function render(name, preserve = true) {
      const sidebar = preserve && name !== 'landing' ? $('.sidebar')?.innerHTML : null, scroll = $('.sidebar-scroll')?.scrollTop || 0;
      current = name; root.innerHTML = snapshots[name].body; if (sidebar && $('.sidebar')) $('.sidebar').innerHTML = sidebar;
      document.body.className = snapshots[name].bodyClass; document.body.classList.toggle('sidebar-collapsed', collapsed); document.body.classList.remove('knowledge-panel-collapsed');
      document.title = name === 'landing' ? 'MetaMind · 让知识回到工作中' : 'MetaMind · 知识库';
      if (name === 'landing') { window.scrollTo({ top: 0, behavior: 'instant' }); return; }
      if ($('#accountPopover')) $('#accountPopover').hidden = true;
      addScopes();
      const nav = ['workspace-current', 'scope', 'document', 'new-scope-dialog'].includes(name) || name.startsWith('doc-') || name.startsWith('extra-') ? 'overview' : name.startsWith('agent') ? 'agents' : name;
      $$('#mainNav .nav').forEach(a => a.classList.toggle('active', a.dataset.view === nav));
      if ($('.sidebar-scroll')) $('.sidebar-scroll').scrollTop = scroll;
      if (name === 'scope') applyScope();
      savedAgents(); if (name === 'upload') localFiles();
      if (name === 'workspace-current') { const metrics = $$('.metric-grid strong'); if (metrics[0]) metrics[0].textContent = originals.length + scopes.length; }
      window.scrollTo({ top: 0, behavior: 'instant' });
      if (name === 'graph') wireGraph();
    }
    function nav(path, push = true) { if (push) history.pushState({}, '', path); currentDoc = ''; render(routes[path.split('?')[0]] || 'workspace-current'); }
    function openDoc(path, push = true) {
      if (!documents[path]) return toast('该文档可在原站查看');
      currentDoc = path; if (push) history.pushState({}, '', '/workspace?doc=' + encodeURIComponent(path)); render(documents[path]);
      $$('.doc-item').forEach(b => { b.classList.remove('active'); b.classList.toggle('is-open', b.dataset.doc === path); });
      const b = $$('.doc-item').find(n => n.dataset.doc === path); if (b) { b.parentElement.style.display = ''; const c = b.parentElement.previousElementSibling?.querySelector('.doc-dir-caret'); if (c) c.textContent = '▾'; }
    }
    async function copy(value, message = '已复制本地演示链接') { try { await navigator.clipboard.writeText(value); toast(message); } catch { toast('浏览器未允许复制，请使用地址栏链接'); } }
    function createScope(name, description) { name = name.trim(); if (!name) return toast('请填写知识库名称'); scope = { id: 'local-' + crypto.randomUUID(), name, description, count: 0 }; scopes.push(scope); save('scopes', scopes); history.replaceState({}, '', '/workspace?scope=' + encodeURIComponent(scope.id)); render('scope'); toast('本地知识库已创建'); }
    function editor(agent, index = null) { editingAgent = index; $('#agentEditorModal')?.remove(); $('#view').append(source('agent-editor').querySelector('#agentEditorModal').cloneNode(true)); if (agent) { $('#agentName').value = agent.name; $('#agentDescription').value = agent.description || ''; $('#saveAgentBtn').disabled = false; } $('#agentName').focus(); }
    async function addFiles(list) { for (const f of [...list]) { const item = { id: crypto.randomUUID(), name: f.webkitRelativePath || f.name, type: f.name.split('.').pop().toUpperCase(), size: f.size }; if (/\.(txt|md|json|csv|css|js|ts)$/i.test(f.name) && f.size < 500000) item.text = await f.text(); files.push(item); } save('files', files); localFiles(); toast('已添加 ' + list.length + ' 个文件，文件留在此浏览器中'); }
    function ask(form) {
      const input = form.querySelector('textarea'), text = input.value.trim(); if (!text) return;
      const log = form.id === 'kpGAskForm' ? $('#kpGAskLog') : $('#kpAskLog'); if (!log) return;
      const question = document.createElement('div'); question.className = 'kp-ask-turn mirror-user-turn'; question.textContent = text; log.append(question); input.value = '';
      const path = Object.keys(documents).find(p => text.includes(p.split('/').pop().replace('.md', ''))) || currentDoc || '项目概述/快速开始.md';
      const article = source(documents[path]).querySelector('#docBody'); let reply = article?.querySelector('p')?.textContent.slice(0, 230) || '可以通过左侧目录浏览知识文档。';
      if (text.includes('最近')) reply = '最近一次操作是《历史》生成·建图；此前上传了两份历史资料。更多记录可在首页「最近操作日志」查看。';
      if (/确认|未处理/.test(text)) reply = '「metask视觉」有 496 个文件待处理。进入上传资料页，可以使用状态标签查看文件。';
      const answer = document.createElement('div'); answer.className = 'kp-ask-turn'; answer.innerHTML = '<small class="muted">本地演示回答</small><p>' + esc(reply) + '</p><button class="secondary-button" data-open-doc="' + esc(path) + '">查看 ' + esc(path.split('/').pop().replace('.md', '')) + '</button>'; log.append(answer); log.scrollTop = log.scrollHeight;
    }
    function wireGraph() {
      const svg = $('#graphBoard svg'), group = svg?.querySelector('g'); if (!group) return;
      const base = group.getAttribute('transform') || ''; let x = 0, y = 0, zoom = 1, drag;
      const redraw = () => group.setAttribute('transform', `translate(${x},${y}) scale(${zoom}) ${base}`);
      svg.addEventListener('wheel', e => { e.preventDefault(); zoom = Math.min(3, Math.max(.35, zoom * (e.deltaY > 0 ? .9 : 1.1))); redraw(); }, { passive: false });
      svg.addEventListener('pointerdown', e => { drag = [e.clientX - x, e.clientY - y]; svg.setPointerCapture(e.pointerId); });
      svg.addEventListener('pointermove', e => { if (drag) { x = e.clientX - drag[0]; y = e.clientY - drag[1]; redraw(); } }); svg.addEventListener('pointerup', () => { drag = null; });
    }
    function targetMenu(open) { $('#uploadTargetPanel').hidden = !open; $('#uploadTargetScrim').hidden = !open; $('#uploadTargetTrigger').setAttribute('aria-expanded', open); $('.import-simple-card')?.classList.toggle('target-open', open); }
    function click(e) {
      if (e.target.id === 'uploadTargetScrim') return targetMenu(false);
      const t = e.target.closest('button,a,[data-doc-dir],[data-folder-toggle],.file-row'); if (!t) return; const id = t.id, text = t.textContent.trim();
      if (t.matches('a')) { const href = t.getAttribute('href') || ''; if (href.startsWith('#')) { if (current === 'landing') return; e.preventDefault(); document.getElementById(decodeURIComponent(href.slice(1)))?.scrollIntoView({ behavior: 'smooth' }); return; } if (t.dataset.view || routes[href]) { e.preventDefault(); return nav(href); } if (href.startsWith('/')) { e.preventDefault(); return toast('该入口需要在线服务；当前为本地 UI 镜像'); } }
      if (t.dataset.go === 'workspace') return nav('/workspace');
      if (t.dataset.openDoc || t.dataset.doc) return openDoc(t.dataset.openDoc || t.dataset.doc);
      if (t.dataset.docDir) { const list = t.nextElementSibling; if (!list) return; const open = list.style.display !== 'none'; list.style.display = open ? 'none' : ''; t.querySelector('.doc-dir-caret').textContent = open ? '▸' : '▾'; return; }
      if (t.dataset.scope) { const next = t.nextElementSibling; if (e.target.closest('.scope-caret') && next?.classList.contains('tree-list')) { const open = next.style.display !== 'none'; next.style.display = open ? 'none' : ''; t.querySelector('.scope-caret').textContent = open ? '▸' : '▾'; return; } scope = [...originals, ...scopes].find(s => s.id === t.dataset.scope); history.pushState({}, '', '/workspace?scope=' + encodeURIComponent(scope.id)); return render('scope'); }
      if (id === 'sidebarCollapse' || id === 'sidebarExpand') { collapsed = id === 'sidebarCollapse'; document.body.classList.toggle('sidebar-collapsed', collapsed); return; }
      if (id === 'accountTrigger') { $('#accountPopover').hidden = !$('#accountPopover').hidden; t.setAttribute('aria-expanded', !$('#accountPopover').hidden); return; }
      if (t.dataset.act && t.closest('#accountPopover')) { $('#accountPopover').hidden = true; return t.dataset.act === 'home' ? nav('/') : toast('账户设置需要连接在线服务'); }
      if (id === 'kpCollapse') { panelHTML = $('#sideInfo').innerHTML; $('#sideInfo').innerHTML = part('panel-collapsed', '#sideInfo'); document.body.classList.add('knowledge-panel-collapsed'); return; }
      if (id === 'kpExpand') { $('#sideInfo').innerHTML = panelHTML; document.body.classList.remove('knowledge-panel-collapsed'); return; }
      if (id === 'focusModeBtn') { document.body.classList.toggle('mirror-focus'); return; }
      if (t.dataset.tab) { $('#sideInfo').innerHTML = part(t.dataset.tab === 'relations' ? 'document-relations' : t.dataset.tab === 'apps' ? 'document-apps' : 'document', '#sideInfo'); return; }
      if (id === 'kpAskNew') { $('#kpAskLog').innerHTML = part('document', '#kpAskLog'); return; }
      if (id === 'kpAskHist') return toast('本地演示尚无历史会话');
      if (id === 'kpAskMax') { document.body.classList.toggle('mirror-ask-max'); return; }
      if (t.closest('#kpGAskQuick')) { $('#kpGAskInput').value = text; return ask($('#kpGAskForm')); }
      if (id === 'flowNewScope' || id === 'createScopeNavBtn') { history.pushState({}, '', '/workspace?new=1'); render('new-scope-dialog'); $('#newScopeName').focus(); return; }
      if (id === 'flowUpload' || t.dataset.jump === 'upload') return nav('/upload');
      if (id === 'flowGenerate') return render('scope');
      if (id === 'flowAddShared') return nav('/packages');
      if (id === 'flowMetask') return window.open('https://app.metask-ai.com/app', '_blank', 'noopener,noreferrer');
      if (id === 'copyInstall') return copy('MetaMind 本地 UI 演示：' + location.origin + '/workspace\n此版本不提供 MCP 或在线账号访问。', '已复制本地演示说明');
      if (id === 'editScopeBtn') { const modal = source('scope-edit').querySelector('#editScopeName')?.closest('.modal-overlay,.modal-backdrop,.modal'); if (modal) { root.append(modal.cloneNode(true)); $('#editScopeName').value = scope.name; $('#editScopeDesc').value = scope.description; } return; }
      const modal = t.closest('.modal-overlay,.modal-backdrop,.modal');
      if (modal && ['取消', '关闭', '×'].includes(text)) return modal.remove();
      if (modal && text === '保存') { scope.name = $('#editScopeName').value.trim() || scope.name; scope.description = $('#editScopeDesc').value; save('scopes', scopes); modal.remove(); render('scope'); return toast('本地修改已保存'); }
      if (['generateBtn', 'uploadGenerateBtn', 'assessBtn', 'uploadAssessBtn'].includes(id)) { if (id === 'uploadGenerateBtn') render('scope'); return toast(id.toLowerCase().includes('assess') ? '本地演示：健康度 62.9，496 个文件待处理' : '生成需要连接知识处理服务'); }
      if (id === 'clearScopeBtn' || id === 'deleteScopeBtn') { if (!scopes.some(s => s.id === scope.id)) return toast('原站示例数据只供浏览；可管理本地新建知识库'); if (confirm('仅操作此浏览器中的本地知识库，确定继续吗？')) { if (id === 'deleteScopeBtn') scopes = scopes.filter(s => s.id !== scope.id); save('scopes', scopes); nav('/workspace'); } return; }
      if (id === 'pkgCopyBtn' || id === 'kbCopyUuid') return copy(location.origin + '/packages#local-demo');
      if (id === 'pkgOpenBtn') return nav('/packages');
      if (id === 'pkgResetBtn') return toast('本地演示链接已重置');
      if (id === 'chooseFilesBtn' || id === 'chooseFolderBtn') return $(id === 'chooseFilesBtn' ? '#uploadFilesInput' : '#uploadFolderInput').click();
      if (id === 'addWebBtn') { const p = $('#webUrlPanel'); p.style.display = p.style.display === 'none' ? '' : 'none'; return; }
      if (id === 'webUrlSubmit') { const urls = $('#webUrlInput').value.trim().split(/\s+/).filter(Boolean); if (!urls.length || urls.some(u => !/^https?:\/\//i.test(u))) return toast('请填写有效的 http:// 或 https:// 网页地址'); $('#webUrlResult').textContent = '已记录 ' + urls.length + ' 个网页地址。本地镜像不执行在线抓取。'; return; }
      if (id === 'uploadTargetTrigger') return targetMenu($('#uploadTargetPanel').hidden);
      if (t.dataset.scopeId === '__new__') { targetMenu(false); $('#uploadNewScopeRow').hidden = false; return; }
      if (t.dataset.scopeId) { scope = [...originals, ...scopes].find(s => s.id === t.dataset.scopeId) || scope; $('#uploadTargetTrigger > span').textContent = text; targetMenu(false); return; }
      if (id === 'uploadNewScopeBtn') return createScope($('#uploadNewScopeName').value, $('#uploadNewScopeDesc').value);
      if (t.hasAttribute('data-state-filter')) { const f = t.dataset.stateFilter; $$('.type-count-filter').forEach(b => b.classList.toggle('active', b === t)); $$('#fileTreeContainer tbody tr').forEach(row => row.hidden = !!f && !row.querySelector('.badge-' + f)); return; }
      if (t.dataset.folderToggle) { const panel = t.parentElement; let body = panel.querySelector('.scope-folder-body'); if (!body) { body = source('sources-expanded').querySelector('.scope-folder-body').cloneNode(true); panel.append(body); } else body.hidden = !body.hidden; t.querySelector('.scope-folder-caret').textContent = body.hidden ? '▸' : '▾'; return; }
      if (t.dataset.localDelete) { files = files.filter(f => f.id !== t.dataset.localDelete); save('files', files); t.closest('tr').remove(); return; }
      if (t.matches('.file-del')) return toast('原始文件未复制；本地演示不会删除在线文件');
      if (id === 'agentsTabMine' || id === 'agentsTabTpl') return render(id === 'agentsTabMine' ? 'agents' : 'agents-templates');
      if (id === 'createAgentBtn') return editor();
      if (id === 'closeAgentEditor' || id === 'cancelAgentEditor') return $('#agentEditorModal').remove();
      if (t.closest('.agent-card') && t.tagName === 'BUTTON') { const c = t.closest('.agent-card'); return editor({ name: c.querySelector('h2')?.textContent, description: c.querySelector('p')?.textContent }, c.hasAttribute('data-local-agent') ? Number(c.dataset.localAgent) : null); }
      if (id === 'agentAiFillBtn') { const name = $('#agentName').value.trim(); if (!name) return toast('请先填写名称'); $('#agentDescription').value ||= name + '：整理资料、提炼结论并保留引用。'; $('#agentScenario').value ||= '资料阅读、主题研究与知识回查'; $('#agentStrategy').value ||= '按主题组织，区分事实、观点与待确认问题。'; $('#agentDirection').value ||= '核心结论、关键数据与原始出处'; return toast('已填入本地演示建议'); }
      if (t.dataset.kbTab) { $$('[data-kb-tab]').forEach(b => b.classList.toggle('active', b === t)); $('#kbList').hidden = t.dataset.kbTab === 'shared'; $('#kbDetail').hidden = t.dataset.kbTab === 'shared'; return; }
      if (t.dataset.kbPick) { $$('[data-kb-pick]').forEach(b => b.classList.toggle('active', b === t)); $('#kbDetail h2').textContent = t.querySelector('strong')?.textContent || t.firstElementChild?.textContent || text; return; }
      if (id === 'kbCopyKey') return copy('kf_local_demo_only_0000000000000000', '已复制本地演示 Key');
      if (id === 'kbRotateKey') return toast('本地演示 Key 已更新；不影响在线账号');
      if (id === 'kbSetDefault') return toast('已设为本地演示默认资源包');
      if (id === 'graphRefreshBtn') { render('graph'); return toast('图谱视图已重置'); }
      if (t.closest('.kb-file-list')) return toast('此处展示文件条目；原始附件保留在在线知识库');
    }
    function submit(e) { e.preventDefault(); const form = e.target; if (form.id === 'createFirstScopeForm') return createScope($('#newScopeName').value, $('#newScopeDesc').value); if (form.id === 'kpGAskForm' || form.id === 'kpAskForm') return ask(form); if (form.id === 'agentEditorForm') { const agent = { name: $('#agentName').value.trim(), description: $('#agentDescription').value }; if (editingAgent === null) agents.push(agent); else agents[editingAgent] = agent; save('agents', agents); render('agents'); return toast('智能体已保存到本地'); } if (form.id === 'kbAddForm') return toast('已记录链接；连接在线服务后可导入资源包'); }
    function input(e) { const t = e.target; if (t.id === 'agentName') $('#saveAgentBtn').disabled = !t.value.trim(); if (t.id === 'agentsSearchInput') $$('.agent-card').forEach(c => c.hidden = !c.textContent.toLowerCase().includes(t.value.toLowerCase())); if (t.id === 'sidebarSearchInput') { const q = t.value.trim().toLowerCase(); $$('.scope-item,.doc-dir,.doc-item').forEach(n => n.hidden = !!q && !n.textContent.toLowerCase().includes(q)); $$('#scopeList .tree-list').forEach(n => n.style.display = q ? 'block' : ''); } }
    function change(e) { if (e.target.id === 'uploadFilesInput' || e.target.id === 'uploadFolderInput') addFiles(e.target.files); if (e.target.id === 'graphScopeSelect') $('#graphBreadcrumb').textContent = e.target.selectedOptions[0].textContent + ' · 总结全貌（本地镜像）'; }
    function key(e) { if (e.key === 'Escape') { $('#agentEditorModal')?.remove(); $('.modal-overlay,.modal-backdrop,.modal')?.remove(); if ($('#accountPopover')) $('#accountPopover').hidden = true; } if (e.key === 'Enter' && !e.shiftKey && /^kp(?:GAsk|Ask)Input$/.test(e.target.id)) { e.preventDefault(); ask(e.target.closest('form')); } }
    function restore() { const u = new URL(location.href); if (u.searchParams.has('doc')) return openDoc(u.searchParams.get('doc'), false); const found = [...originals, ...scopes].find(s => s.id === u.searchParams.get('scope')); if (found) { scope = found; return render('scope'); } if (u.searchParams.has('new')) return render('new-scope-dialog'); nav(u.pathname, false); if (current === 'landing' && u.hash) document.getElementById(decodeURIComponent(u.hash.slice(1)))?.scrollIntoView(); }
    function drag(e) { if (e.target.closest('#uploadDropZone')) e.preventDefault(); }
    function drop(e) { if (e.target.closest('#uploadDropZone')) { e.preventDefault(); addFiles(e.dataTransfer.files); } }
    const listeners = { click, submit, input, change, keydown: key, dragover: drag, drop };
    Object.entries(listeners).forEach(([event, fn]) => root.addEventListener(event, fn)); window.addEventListener('popstate', restore);
    restore();
    return () => { Object.entries(listeners).forEach(([event, fn]) => root.removeEventListener(event, fn)); window.removeEventListener('popstate', restore); };
  }, []);
  return <div ref={rootRef} style={{ display: 'contents' }} />;
}
