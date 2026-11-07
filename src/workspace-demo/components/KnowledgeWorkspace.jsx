import { useRef } from 'react';
import { BookMarked, Plus } from 'lucide-react';
import { KnowledgeCreateDialog } from './KnowledgeCreateDialog.jsx';
import { KnowledgeOverview } from './KnowledgeOverview.jsx';
import '../knowledge-workspace.css';

export function KnowledgeWorkspace({ activeTab, notebooks, onCreate, onReceive, onOpenLibrary }) {
  const createDialog = useRef(null);
  const available = notebooks.filter(notebook => activeTab === 'all' || notebook.owner === activeTab);
  const isSharedTab = activeTab === 'shared';
  const addLabel = isSharedTab ? '添加共享知识库' : '新建知识库';
  const addLibrary = isSharedTab ? onReceive : () => createDialog.current?.open();

  return <main id="mm-main" className="kb-workspace kb-hub" tabIndex={-1}>
    <div className="kb-hub-content">
      <h1 className="kb-hub-content-title">知识库列表</h1>
      <KnowledgeOverview notebooks={available}/>
      <div className="kb-toolbar">
        <button type="button" className="kb-primary" onClick={addLibrary}><Plus size={17}/>{addLabel}</button>
      </div>
      <section className="kb-grid" aria-label="知识库列表">
        <button type="button" className={'kb-card kb-create-card' + (isSharedTab ? ' kb-add-shared-card' : '')} onClick={addLibrary}>
          <span className="kb-create-icon"><Plus size={25} strokeWidth={1.6}/></span>
          <span>{addLabel}</span>
          {isSharedTab && <small>粘贴分享链接，添加他人的知识库</small>}
        </button>
        {available.map(notebook => {
          const isShared = notebook.owner === 'shared';
          const ownerName = notebook.ownerName || '原创建者';
          return <button type="button" key={notebook.id} id={'kb-card-' + notebook.id} className="kb-card kb-notebook-card"
            aria-label={(notebook.available === false ? '查看状态 ' : '打开 ') + notebook.name} onClick={() => onOpenLibrary(notebook.id)}>
            <div className="kb-card-top">
              <span className="kb-book-icon"><BookMarked size={18} strokeWidth={1.5} aria-hidden="true"/></span>
              <h2 title={notebook.name}>{notebook.name}</h2>
              <span className={'kb-state ' + (notebook.contents > 0 ? 'is-ready' : '')}><span className="kb-state-dot" aria-hidden="true"/>{notebook.status}</span>
            </div>
            <p className="kb-description" title={notebook.description}>{notebook.description || '暂无资料'}</p>
            {isShared && activeTab === 'all' && <span className="kb-card-owner kb-card-shared-label">共享知识库</span>}
            <div className="kb-card-footer">
              <p className="kb-card-meta">{notebook.contents} 篇内容{notebook.pending > 0 && <span> · {notebook.pending} 份待整理</span>}</p>
              {isShared && <span className="kb-card-owner kb-card-owner-name" title={'所有者：' + ownerName}>所有者：{ownerName}</span>}
              {activeTab === 'all' && !isShared && <span className="kb-card-owner">我创建的</span>}
            </div>
          </button>;
        })}
      </section>
    </div>
    <KnowledgeCreateDialog ref={createDialog} onCreate={onCreate}/>
  </main>;
}
