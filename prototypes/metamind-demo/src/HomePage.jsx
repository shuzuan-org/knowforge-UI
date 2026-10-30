import { UsageCards } from './UsageCards.jsx';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import landing from './landing.json';
import { homeActionIcons } from './home-action-icons.mjs';
import './mirror.css';
import './home.css';

export function HomePage() {
  const root = useRef(null);
  const html = useMemo(() => ({ __html: homeActionIcons(landing.body) }), []);
  const [slot, setSlot] = useState(null);
  useEffect(() => {
    document.body.className = landing.bodyClass;
    document.documentElement.dataset.theme = 'light';
    document.title = 'MetaMind · 让知识回到工作中';
    setSlot(root.current.querySelector('#home-usage-slot'));
  }, []);
  useEffect(() => {
    if (!slot || !location.hash) return;
    const frame = requestAnimationFrame(() => {
      const id = decodeURIComponent(location.hash.slice(1));
      document.getElementById(id)?.scrollIntoView();
    });
    return () => cancelAnimationFrame(frame);
  }, [slot]);
  return <>
    <div ref={root} style={{ display: 'contents' }} dangerouslySetInnerHTML={html} />
    {slot && createPortal(<HomeUsage />, slot)}
  </>;
}

function HomeUsage() {
  return <section className="kf-home-usage" id="workflow" aria-labelledby="home-usage-heading">
    <div className="kf-home-usage-heading"><h2 id="home-usage-heading">知识库使用</h2><p>同一份知识，在你习惯的地方使用。</p></div>
    <UsageCards />
  </section>;
}
