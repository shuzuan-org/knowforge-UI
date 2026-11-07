import {useId, useRef} from 'react';
import {Ellipsis} from 'lucide-react';

export function ChatMaterialMenu({name, actions}) {
  const id = useId();
  const trigger = useRef(null);

  function position(event) {
    if (event.newState !== 'open') return;
    const menu = event.currentTarget;
    const anchor = trigger.current.getBoundingClientRect();
    const below = window.innerHeight - anchor.bottom - 8;
    const above = anchor.top - 8;
    const opensAbove = menu.scrollHeight + 4 > below && above > below;
    menu.style.maxHeight = Math.max(0, (opensAbove ? above : below) - 4) + 'px';
    menu.style.left = Math.max(8, anchor.right - menu.offsetWidth) + 'px';
    menu.style.top = (opensAbove ? anchor.top - menu.offsetHeight - 4 : anchor.bottom + 4) + 'px';
    menu.querySelector('button')?.focus({preventScroll:true});
  }

  return <>
    <button ref={trigger} type="button" className="uw-icon-button uw-material-more"
      aria-label={'更多操作 ' + name} title="更多" popoverTarget={id}><Ellipsis size={17}/></button>
    <div id={id} popover="auto" className="uw-material-menu" role="group" aria-label={'素材操作 ' + name} onToggle={position}>
      {actions.map(({label, icon:Icon, run}) => <button key={label} type="button" onClick={event => {
        event.currentTarget.parentElement.hidePopover();
        trigger.current.focus({preventScroll:true});
        run();
      }}><Icon size={15} aria-hidden="true"/>{label}</button>)}
    </div>
  </>;
}
