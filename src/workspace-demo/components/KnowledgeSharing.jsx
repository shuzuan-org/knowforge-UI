import { createContext, useContext, useState } from 'react';
import { ArrowUpRight, Bot, ChartNoAxesColumn, Check, Code2, Copy, Download, Eye, Info, Link2, MousePointer2, SquareTerminal, UserRound, UsersRound } from 'lucide-react';
import { AgentAccessDialog } from '../../AgentAccessDialog.jsx';
import { copyText } from '../../copy-text.js';
import { downloadJSON } from '../../FeaturePanels.jsx';
import { createLibraryShare, resetKnowledgeShare, revokeKnowledgeShare } from '../../knowledge-model.mjs';
import { libraryDocuments } from '../../workbench-docs.js';
import '../knowledge-sharing.css';
import '../knowledge-share-channels.css';

export const WorkspaceSharingContext = createContext(null);

const views = [['channels', '知识库分享', Link2], ['insights', '数据查看', ChartNoAxesColumn]];
const platforms = [['Cursor', MousePointer2], ['VS Code', Code2], ['Claude Code', SquareTerminal], ['Codex', Bot]];

function moveTabFocus(event) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const tabs = [...event.currentTarget.querySelectorAll('[role="tab"]')];
  const current = tabs.indexOf(document.activeElement);
  const index = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 :
    (current + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
  tabs[index]?.focus();
  tabs[index]?.click();
}

export function KnowledgeSharing({ library, documents }) {
  const { items, sources, state, setState, notify } = useContext(WorkspaceSharingContext);
  const [view, setView] = useState('channels');
  const [dataTab, setDataTab] = useState('members');
  const [copied, setCopied] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [error, setError] = useState('');
  const packages = state.resourcePackages.filter(item => item.kind === 'library-share' && item.sourceLibraryId === library.id);
  const active = Object.entries(state.localShares).find(([, share]) => !share.revoked && packages.some(item => item.id === share.packageId && item.enabled !== false));
  const link = active ? location.origin + '/workspace?tab=shared&receive=1&demoShare=' + encodeURIComponent(active[0]) : '';
  const received = state.receivedShares.filter(receipt => active && receipt.sourceShareId === active[0] && receipt.enabled !== false);

  function toggle(enabled) {
    setError('');
    setCopied(false);
    try {
      if (!enabled && active) {
        setState(previous => revokeKnowledgeShare(previous, active[1].packageId));
        return;
      }
      const libraryItem = items.find(item => item.id === library.id);
      const sourceDocuments = libraryDocuments(libraryItem, sources);
      const args = { library: libraryItem, documents: sourceDocuments, packageId: 'library-share-' + crypto.randomUUID(), shareId: crypto.randomUUID() };
      createLibraryShare(state, args);
      setState(previous => createLibraryShare(previous, args));
    } catch (reason) { setError(reason.message); }
  }

  function reset() {
    setError('');
    setCopied(false);
    try {
      const shareId = crypto.randomUUID();
      resetKnowledgeShare(state, active[1].packageId, shareId);
      setState(previous => resetKnowledgeShare(previous, active[1].packageId, shareId));
      notify('已生成新链接，旧链接失效');
    } catch (reason) { setError(reason.message); }
  }

  async function copyLink() {
    try { await copyText(link); setCopied(true); }
    catch { setError('未能自动复制，请选中链接手动复制。'); }
  }

  if (library.isShare) return <section className="kb-sharing kb-section-scroll" aria-label="分享与链接">
    <div className="kb-received-privacy" role="note"><Info size={20}/><p>所有者 {library.ownerName}，暂无数据查看权限</p></div>
  </section>;

  return <section className="kb-sharing kb-section-scroll kb-link-sharing" aria-label="分享与链接">
    <div className="kb-share-view-tabs kb-share-data-tabs" role="tablist" aria-label="分享与链接视图" onKeyDown={moveTabFocus}>
      {views.map(([id, label, Icon]) => <button key={id} type="button" role="tab" id={'kb-share-view-' + id}
        aria-controls={'kb-share-view-panel-' + id} aria-selected={view === id} tabIndex={view === id ? 0 : -1}
        onClick={() => setView(id)}><Icon size={16}/>{label}</button>)}
    </div>
    {error && <p className="kb-share-service-error" role="alert">{error}</p>}
    <div>
      <section className="kb-share-channels" hidden={view !== 'channels'} role="tabpanel" id="kb-share-view-panel-channels" aria-labelledby="kb-share-view-channels">
        <header className="kb-channels-toolbar">
          <h2><Link2 size={18}/>分享链接</h2>
          <label className="kb-share-switch">
            <span>{active ? '分享已开启' : '分享已关闭'}</span>
            <input type="checkbox" role="switch" aria-label="知识库分享" checked={Boolean(active)}
              disabled={!active && !documents.length} onChange={event => toggle(event.target.checked)}/>
          </label>
        </header>
        <div className="kb-channel-link-row">
          <input className="kb-channel-value" aria-label="知识库分享链接" readOnly value={link}
            placeholder={documents.length ? '开启分享后即可生成链接' : '添加知识内容后可生成链接'}
            onFocus={event => event.target.select()}/>
          <button className="kb-primary kb-channel-copy" disabled={!link} onClick={copyLink}>
            {copied ? <Check size={15}/> : <Copy size={15}/>} {copied ? '已复制' : '复制链接'}
          </button>
        </div>
        <p className="kb-channel-link-help">分享链接在当前浏览器中有效。跨浏览器可使用导出的分享文件。</p>
        {active && <div className="mm-demo-share-actions">
          <button className="kb-secondary" onClick={() => downloadJSON(active[1].manifest, library.name + '.metamind.json')}><Download size={15}/>导出分享文件</button>
          <button className="kb-secondary" onClick={reset}>重置分享链接</button>
        </div>}
        <section className="kb-channel-uses" aria-labelledby="kb-agent-use-heading">
          <h3 id="kb-agent-use-heading"><Bot size={17}/>接入外部 Agent</h3>
          <div className="kb-agent-platforms">{platforms.map(([name, Icon]) => <button key={name}
            type="button" onClick={() => setAgentOpen(true)} aria-label={'查看 ' + name + ' 接入方式'}>
            <Icon size={17}/><span>{name}</span><ArrowUpRight size={13}/>
          </button>)}</div>
          <details className="kb-agent-other"><summary>其他平台接入指南</summary>
            <p>当前为本地演示。可查看 MCP 配置示例。</p>
            <button className="kb-secondary" onClick={() => setAgentOpen(true)}>查看接入示例</button>
          </details>
        </section>
      </section>
      <section className="kb-share-insights" role="tabpanel" hidden={view !== 'insights'}
        id="kb-share-view-panel-insights" aria-labelledby="kb-share-view-insights">
        <dl className="kb-sharing-metrics" aria-label="分享与链接统计">
          {[['总访问量', '—', Eye], ['独立访客', '—', UserRound], ['Agent 调用', '—', Bot], ['共享成员', received.length, UsersRound]].map(([label, value, Icon]) =>
            <div key={label}><dt><span>{label}</span><Icon size={16}/></dt><dd>{value}</dd></div>)}
        </dl>
        <div className="kb-share-data">
          <div className="kb-share-data-bar"><div className="kb-share-data-tabs" role="tablist" aria-label="分享数据" onKeyDown={moveTabFocus}>
            {[['members','共享名单', received.length], ['activity','访问记录', 0]].map(([id, label, count]) =>
              <button key={id} role="tab" id={'share-tab-' + id} aria-controls="share-data-panel" aria-selected={dataTab === id}
                tabIndex={dataTab === id ? 0 : -1} onClick={() => setDataTab(id)}>{label}<span>{count}</span></button>)}
          </div></div>
          <div role="tabpanel" id="share-data-panel" aria-labelledby={'share-tab-' + dataTab}>
            {dataTab === 'members' && received.length
              ? <ul>{received.map(receipt => <li key={receipt.id}>{receipt.name} · 当前浏览器</li>)}</ul>
              : <div className="kb-sharing-empty"><Eye size={25} strokeWidth={1.4}/>
                <h3>{dataTab === 'members' ? '暂无共享成员' : '暂无访问记录'}</h3>
                <p>{dataTab === 'members' ? '在本机接收分享后会显示在这里。' : '当前演示未接入访问统计。'}</p>
              </div>}
          </div>
        </div>
      </section>
    </div>
    {agentOpen && <AgentAccessDialog notify={notify} onClose={() => setAgentOpen(false)}/>}
  </section>;
}
