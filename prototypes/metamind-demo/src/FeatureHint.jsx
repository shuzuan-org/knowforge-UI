import { ActionButton, ActionIcon } from './ActionControls.jsx';
import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './feature-hint.css';

// Keep feature explanations out of the working area, with an explicit touch fallback.
export function FeatureHint({ children, text, label }) {
  const id = useId(), anchor = useRef(null), bubble = useRef(null);
  const delay = useRef(null), dismissal = useRef(null);
  const [open, setOpen] = useState(false), [position, setPosition] = useState(null);
  const visible = useRef(false); visible.current = open;
  const cancel = () => { clearTimeout(delay.current); clearTimeout(dismissal.current); };
  const close = () => { cancel(); setOpen(false); };
  const schedule = () => { cancel(); delay.current = setTimeout(() => setOpen(true), 2000); };
  const leave = () => { cancel(); dismissal.current = setTimeout(() => setOpen(false), 120); };
  useEffect(() => {
    const escape = e => { if (e.key === 'Escape') { if (visible.current) { e.preventDefault(); e.stopPropagation(); } close(); } };
    document.addEventListener('keydown', escape, true);
    return () => { cancel(); document.removeEventListener('keydown', escape, true); };
  }, []);
  useLayoutEffect(() => {
    if (!open) return;
    const rect = anchor.current.getBoundingClientRect(), tip = bubble.current.getBoundingClientRect();
    const width = document.documentElement.clientWidth, height = window.innerHeight;
    const left = Math.max(12, Math.min(rect.left, width - tip.width - 12));
    const below = rect.bottom + 8;
    setPosition({ left, top: below + tip.height <= height - 12 ? below : Math.max(12, rect.top - tip.height - 8) });
    const outside = e => { if (!anchor.current?.contains(e.target) && !bubble.current?.contains(e.target)) close(); };
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    document.addEventListener('pointerdown', outside, true);
    return () => {
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
      document.removeEventListener('pointerdown', outside, true);
    };
  }, [open]);
  return <span className="mm-feature-hint" ref={anchor}
    onPointerEnter={e => { if (e.pointerType !== 'touch') schedule(); }} onPointerLeave={e => { if (e.pointerType !== 'touch') leave(); }}
    onFocusCapture={schedule} onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget)) close(); }}>
    <span>{children}</span>
    <ActionButton type="button" className="mm-feature-hint-trigger" aria-label={label || '关于' + children}
      aria-describedby={id} aria-expanded={open} onClick={() => { cancel(); setOpen(v => !v); }}>
      <ActionIcon name="info"/>
    </ActionButton>
    {createPortal(<span id={id} ref={bubble} role="tooltip" hidden={!open} className="mm-feature-tooltip"
      style={open ? { ...position, visibility: position ? 'visible' : 'hidden' } : undefined}
      onPointerEnter={cancel} onPointerLeave={e => { if (e.pointerType !== 'touch') leave(); }}>{text}</span>, anchor.current?.closest('dialog') || document.body)}
  </span>;
}
