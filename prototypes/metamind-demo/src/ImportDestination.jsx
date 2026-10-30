import { ActionButton } from './ActionControls.jsx';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { orderedImportLibraries } from './import-model.mjs';

// A select-only combobox: the page, not the OS menu, controls its downward anchor.
export function ImportDestination({ id, libraries, recent, value, onChange }) {
  const items = [...orderedImportLibraries(libraries, recent), { id: '__new__', name: '新建知识库' }];
  const selected = items.findIndex(item => item.id === value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(Math.max(0, selected));
  const [maxHeight, setMaxHeight] = useState(320);
  const root = useRef(null), trigger = useRef(null), menu = useRef(null), typed = useRef({ text: '', at: 0 });
  const listId = id + '-options';
  const optionId = index => id + '-option-' + index;
  function reveal(index = Math.max(0, selected)) {
    setActive(index); setOpen(true);
    const r = trigger.current.getBoundingClientRect();
    if ((window.visualViewport?.height || window.innerHeight) - r.bottom < 120) trigger.current.scrollIntoView({ block: 'center' });
  }
  function choose(index) {
    onChange(items[index].id); setOpen(false);
  }
  useLayoutEffect(() => {
    if (!open) return;
    const measure = () => {
      const r = trigger.current.getBoundingClientRect(), viewport = window.visualViewport;
      const bottom = (viewport?.height || window.innerHeight) + (viewport?.offsetTop || 0);
      setMaxHeight(Math.max(44, Math.min(320, bottom - r.bottom - 14)));
    };
    measure(); window.addEventListener('resize', measure); window.addEventListener('scroll', measure, true);
    window.visualViewport?.addEventListener('resize', measure);
    return () => { window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true); window.visualViewport?.removeEventListener('resize', measure); };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const outside = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', outside, true);
    return () => document.removeEventListener('pointerdown', outside, true);
  }, [open]);
  useEffect(() => {
    if (open) menu.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);
  function keyDown(event) {
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      if (!open) reveal(event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : Math.max(0, selected));
      else setActive(index => event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); if (open) choose(active); else reveal();
    } else if (event.key === 'Escape' && open) {
      event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current.focus({ preventScroll: true });
    } else if (event.key === 'Tab') setOpen(false);
    else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = Date.now(); typed.current = { text: now - typed.current.at < 700 ? typed.current.text + event.key : event.key, at: now };
      const index = items.findIndex(item => item.name.toLocaleLowerCase().startsWith(typed.current.text.toLocaleLowerCase()));
      if (index >= 0) { event.preventDefault(); if (!open) reveal(index); else setActive(index); }
    }
  }
  return <div className="mm-import-destination-field" ref={root}>
    <ActionButton icon={false} ref={trigger} id={id} type="button" role="combobox" className="mm-import-destination-trigger" aria-haspopup="listbox" aria-expanded={open} aria-controls={listId} aria-activedescendant={open ? optionId(active) : undefined} onClick={() => open ? setOpen(false) : reveal()} onKeyDown={keyDown}>
      <span>{selected >= 0 ? items[selected].name : '请选择知识库'}</span>
    </ActionButton>
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
    {open && <div ref={menu} className="mm-import-destination-menu" role="listbox" id={listId} aria-label="选择保存到的知识库" style={{ maxHeight }}>
      <div className="mm-import-destination-options">
        {items.length === 1 && <p className="mm-import-destination-empty">还没有知识库</p>}
        {items.slice(0, -1).map((item, index) => <div role="option" id={optionId(index)} key={item.id} aria-selected={value === item.id} data-active={active === index} className="mm-import-destination-option" onPointerMove={() => setActive(index)} onMouseDown={event => event.preventDefault()} onClick={() => choose(index)}>
          <span>{item.name}</span>{value === item.id && <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="m5 12 4 4L19 6" /></svg>}
        </div>)}
      </div>
      <div role="option" id={optionId(items.length - 1)} aria-selected={value === '__new__'} data-active={active === items.length - 1} className="mm-import-destination-option mm-import-destination-create" onPointerMove={() => setActive(items.length - 1)} onMouseDown={event => event.preventDefault()} onClick={() => choose(items.length - 1)}><span aria-hidden="true">＋</span><span>新建知识库</span></div>
    </div>}
  </div>;
}
