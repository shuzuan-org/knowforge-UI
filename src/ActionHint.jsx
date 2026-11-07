import React,{useEffect,useId,useLayoutEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import './feature-hint.css';

// Describe an existing action without adding a wrapper or another icon/button.
export function ActionHint({children,text}) {
  const id=useId(),anchor=useRef(null),bubble=useRef(null),timer=useRef(null),dismissal=useRef(null);
  const [open,setOpen]=useState(false),[position,setPosition]=useState(null);
  const cancel=()=>{clearTimeout(timer.current);clearTimeout(dismissal.current);};
  const close=()=>{cancel();setOpen(false);};
  const schedule=event=>{cancel();anchor.current=event.currentTarget;setPosition(null);timer.current=setTimeout(()=>setOpen(true),2000);};
  const leave=()=>{cancel();dismissal.current=setTimeout(()=>setOpen(false),120);};
  useEffect(()=>()=>cancel(),[]);
  useLayoutEffect(()=>{
    if(!open||!anchor.current?.isConnected)return;
    const rect=anchor.current.getBoundingClientRect(),tip=bubble.current.getBoundingClientRect();
    const width=document.documentElement.clientWidth,height=window.innerHeight,below=rect.bottom+8;
    setPosition({left:Math.max(12,Math.min(rect.left,width-tip.width-12)),top:below+tip.height<=height-12?below:Math.max(12,rect.top-tip.height-8)});
    const outside=event=>{if(!anchor.current?.contains(event.target)&&!bubble.current?.contains(event.target))close();};
    const escape=event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();}};
    window.addEventListener('resize',close);window.addEventListener('scroll',close,true);
    document.addEventListener('pointerdown',outside,true);document.addEventListener('keydown',escape,true);
    return()=>{window.removeEventListener('resize',close);window.removeEventListener('scroll',close,true);document.removeEventListener('pointerdown',outside,true);document.removeEventListener('keydown',escape,true);};
  },[open]);
  const child=React.Children.only(children);
  return <>{React.cloneElement(child,{
    'aria-describedby':[child.props['aria-describedby'],id].filter(Boolean).join(' '),
    onPointerEnter:event=>{child.props.onPointerEnter?.(event);if(event.pointerType!=='touch')schedule(event);},
    onPointerLeave:event=>{child.props.onPointerLeave?.(event);if(event.pointerType!=='touch')leave();},
    onFocus:event=>{child.props.onFocus?.(event);schedule(event);},
    onBlur:event=>{child.props.onBlur?.(event);close();},
    onClick:event=>{close();child.props.onClick?.(event);},
  })}{createPortal(<span id={id} ref={bubble} role="tooltip" hidden={!open} className="mm-feature-tooltip"
    style={{fontFamily:'var(--font-sans),sans-serif',...(open?{...position,visibility:position?'visible':'hidden'}:{})}}
    onPointerEnter={cancel} onPointerLeave={leave}>{text}</span>,anchor.current?.closest('dialog')||document.body)}</>;
}
