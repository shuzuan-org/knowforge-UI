import React, { useState } from 'react';
import { Button, Modal } from './workbench-components.jsx';
import { copyText } from './copy-text.js';
import { AccessLinkFields } from './AccessLinkFields.jsx';
import './knowledge-use.css';

// Deliberately nonfunctional: never copy a captured account install link into the demo.
const accessUrl = 'https://YOUR_METAMIND_SERVER/i/YOUR_INSTALL_KEY#agent-install';

export function AgentAccessDialog({ notify, onClose }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  async function copyAccess() {
    setError('');
    try {
      try { await navigator.clipboard.writeText(accessUrl); }
      catch { await copyText(accessUrl); }
      setCopied(true); notify('已复制 Agent 接入链接示例，真实服务尚待接入');
    }
    catch { setCopied(false); setError('复制未完成，请选中上方地址后手动复制。'); }
  }
  return <Modal title="复制给 Agent" description="连接自己的 Agent，支持 MCP 和 Skill。" onClose={onClose}>
    <AccessLinkFields scope="账号内全部可访问知识，包含自己创建和已接收的共享知识。" address={accessUrl} status="示例 · 服务未连接" inputLabel="Agent 接入链接" permission="此链接代表你的账号访问权限，仅供自己的 Agent 使用，请勿转发。" error={error}/>
    <div className="mm-dialog-actions mm-agent-access-actions"><Button variant="primary" onClick={copyAccess} aria-live="polite">{copied ? '已复制示例' : '复制地址'}</Button></div>
  </Modal>;
}
