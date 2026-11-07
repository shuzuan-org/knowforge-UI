export function readableHtml(html,title,editing=false) {
  const doc=new DOMParser().parseFromString(html||'','text/html');
  doc.querySelectorAll('script,iframe,object,embed,form,base,meta,link,animate,animateMotion,animateTransform,set,audio,video,source,track').forEach(node=>node.remove());
  doc.querySelectorAll('style').forEach(node=>{if(!node.closest('svg')||/@import|https?:|\\|url\(\s*["']?(?!#)/i.test(node.textContent))node.remove();});
  doc.querySelectorAll('*').forEach(node=>{
    [...node.attributes].forEach(attribute=>{
      if(/^(srcset|srcdoc|poster)$/i.test(attribute.name)||attribute.name==='style'&&/url\(|@import|\\/i.test(attribute.value)||/^on/i.test(attribute.name)||/^(href|src|xlink:href)$/i.test(attribute.name)&&/^\s*(javascript|vbscript):/i.test(attribute.value))node.removeAttribute(attribute.name);
    });
    if(!node.closest('svg'))node.removeAttribute('style');
  });
  doc.querySelectorAll('a').forEach(link=>{
    if(!editing){link.dataset.knowledgeHref=link.getAttribute('href')||'';
    link.dataset.knowledgePath=link.getAttribute('data-source-path')||link.getAttribute('data-cite-path')||'';
    link.setAttribute('href','#');}
    link.removeAttribute('target');
    link.removeAttribute('download');
  });
  doc.querySelectorAll('img,image').forEach(image=>{
    const src=image.getAttribute('src')||image.getAttribute('href')||image.getAttribute('xlink:href')||'';
    if(src==='#source'||!/^data:image\//i.test(src)&&!src.startsWith('#'))image.remove();
  });
  if(!editing)[...doc.querySelectorAll('h1,h2,h3,h4,h5')].forEach(heading=>{
    const replacement=doc.createElement('h'+(Number(heading.tagName.slice(1))+1));
    [...heading.attributes].forEach(attribute=>replacement.setAttribute(attribute.name,attribute.value));
    replacement.append(...heading.childNodes);
    heading.replaceWith(replacement);
  });
  const first=doc.body.firstElementChild;
  if(first?.tagName===(editing?'H1':'H2')&&first.textContent.trim()===title)first.remove();
  return doc.body.innerHTML;
}

