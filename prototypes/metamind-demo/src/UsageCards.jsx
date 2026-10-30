import { ActionLink } from './ActionControls.jsx';
import React from 'react';
import { Button } from './workbench-components.jsx';
import './usage-cards.css';

export function UsageCards({ onAsk, onCopyMcp }) {
  return <div className="mm-use-cards">
    <article className="mm-use-card"><span className="mm-use-card-tag">当前平台</span><h3>直接阅读和提问</h3><p>查概念、条款和数据，回答可以回到出处核验。</p>{onAsk ? <Button variant="primary" onClick={onAsk}>在此知识库提问 <span aria-hidden="true">→</span></Button> : <ActionLink className="mm-button mm-button-primary" href="/workspace?ask=1">打开知识库 <span aria-hidden="true">→</span></ActionLink>}</article>
    <article className="mm-use-card"><span className="mm-use-card-tag">Metask</span><h3>在 Metask 对话中使用</h3><p>同账号开启“知识库”，在对话中深入分析、统计或形成方案。</p><ActionLink className="mm-button" href="https://app.metask-ai.com/app" target="_blank" rel="noopener noreferrer">打开 Metask <span aria-hidden="true">↗</span></ActionLink></article>
    <article className="mm-use-card"><span className="mm-use-card-tag">MCP · Skill</span><h3>连接其他 AI 工具</h3><p>复制接入链接给自己的 Agent，结合知识写文档、做表格或完成多步任务。</p>{onCopyMcp ? <Button onClick={onCopyMcp} aria-haspopup="dialog">复制给 Agent <span aria-hidden="true">→</span></Button> : <ActionLink className="mm-button" href="/workspace?use=tools">复制给 Agent <span aria-hidden="true">→</span></ActionLink>}</article>
  </div>;
}
