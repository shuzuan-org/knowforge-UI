import { actionIconName, actionPaths } from './action-icon-model.mjs';

// Decorate the saved marketing markup before React mounts it. Copy stays intact.
export function homeActionIcons(html) {
  const doc=new DOMParser().parseFromString(html,'text/html');
  for(const node of doc.querySelectorAll('button,summary,a[href^="/"],a.kf-home-enter,a.kf-home-primary,a.kf-home-text-link,.kf-home-hero-actions>a,.kf-home-steps a')) {
    if(node.querySelector('svg'))continue;
    const name=node.tagName==='SUMMARY'?'chevron-down':actionIconName(node.textContent,{href:node.getAttribute('href')||''});
    const walker=doc.createTreeWalker(node,NodeFilter.SHOW_TEXT);
    while(walker.nextNode())walker.currentNode.nodeValue=walker.currentNode.nodeValue.replace(/\s*[↗→]\s*$/,'');
    node.classList.add('mm-action-control','mm-action-simple');
    node.insertAdjacentHTML('afterbegin','<svg class="mm-action-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+actionPaths[name].map(d=>'<path d="'+d+'"/>').join('')+'</svg>');
  }
  return doc.body.innerHTML;
}
