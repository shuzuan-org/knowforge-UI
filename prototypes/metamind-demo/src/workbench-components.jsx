import React, { useEffect, useRef, useId } from 'react';
import { ActionIcon, ActionButton } from './ActionControls.jsx';

export function Icon({ name = 'archive' }) { return <span className="nav-icon mm-line-icon" aria-hidden="true"><ActionIcon name={name === 'archive' ? 'library' : name} size={18}/></span>; }
Icon.isActionIcon = true;
export function Button({ variant = 'secondary', className = '', children, ...props }) {
  return <ActionButton type="button" className={'mm-button mm-button-' + variant + ' ' + className} {...props}>{children}</ActionButton>;
}
export function Empty({ title, children, action }) {
  return <div className="mm-empty"><span className="mm-empty-mark"><Icon /></span><h2>{title}</h2><div className="mm-subtle">{children}</div>{action}</div>;
}
export function Modal({ title, description, onClose, children, drawer = false }) {
  const ref = useRef(null);
  const titleId=useId();
  useEffect(() => {
    const node = ref.current;
    if (!node.open) node.showModal();
    node.querySelector('input:not([readonly]),textarea:not([readonly]),select')?.focus();
    return () => { if (node.open) node.close(); };
  }, []);
  return <dialog aria-labelledby={titleId} ref={ref} className={'mm-dialog' + (drawer ? ' mm-drawer' : '')} onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="mm-dialog-heading"><div><h2 id={titleId}>{title}</h2>{description && <p>{description}</p>}</div><Button className="mm-close" onClick={onClose} aria-label="关闭">×</Button></div>
    {children}
  </dialog>;
}
export function Status({ state, children }) {
  return <span className={'mm-status mm-status-' + state}><span aria-hidden="true" />{children || ({ waiting: '待开始', processing: '整理中', ready: '可使用', attention: '需处理', example: '只读记录', skipped: '不处理' }[state])}</span>;
}
