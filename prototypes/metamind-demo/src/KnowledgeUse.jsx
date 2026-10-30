import { ActionLink } from './ActionControls.jsx';
import React from 'react';
import { Button, Modal } from './workbench-components.jsx';
import { AgentAccessDialog } from './AgentAccessDialog.jsx';
import './knowledge-use.css';

export function KnowledgeUse({ mode, notify, onClose }) {
  if (mode === 'tools') return <AgentAccessDialog notify={notify} onClose={onClose} />;
  return <Modal title="在 Metask 对话中使用" description="用同一个账号登录，开启对话输入框里的“知识库”开关后直接提问。" onClose={onClose}>
    <div className="mm-dialog-body mm-agent-access-body">
      <ol className="mm-metask-use-steps"><li>打开 Metask，用同一个账号登录。</li><li>开启对话输入框左下方的“知识库”开关。</li><li>直接提问；收到别人的分享时，将分享链接粘贴到对话框。</li></ol>
      <div className="mm-notice">当前浏览器的资料尚未同步到线上账号；打开 Metask 不会自动上传当前浏览器中的知识。</div>
    </div>
    <div className="mm-dialog-actions mm-agent-access-actions"><Button onClick={onClose}>关闭</Button><ActionLink className="mm-button mm-button-primary" href="https://app.metask-ai.com/app" target="_blank" rel="noopener noreferrer">打开 Metask <span aria-hidden="true">↗</span></ActionLink></div>
  </Modal>;
}
