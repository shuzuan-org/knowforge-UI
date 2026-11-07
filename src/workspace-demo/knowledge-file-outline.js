// Keep source records intact: the drawer resolves content by the original full path.
export function fileOutline(sources) {
  const roots=[],folders=new Map();
  for(const [index,source] of sources.entries()) {
    const name=source.name||'';
    const isWeb=source.kind==='web'||source.type==='网页'||/^[a-z][a-z\d+.-]*:\/\//i.test(name);
    const parts=isWeb?[name]:name.replace(/\\/g,'/').split('/').filter(part=>part&&part!=='.');
    const filename=parts.pop()||name;
    let children=roots,path='';
    for(const part of parts) {
      path=path?path+'/'+part:part;
      let folder=folders.get(path);
      if(!folder) {
        folder={kind:'folder',key:'folder:'+path,name:part,path,children:[]};
        folders.set(path,folder);children.push(folder);
      }
      children=folder.children;
    }
    children.push({kind:'file',key:'file:'+index,name:filename,source});
  }
  return roots;
}
