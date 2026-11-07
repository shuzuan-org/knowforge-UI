// Every line represents membership or a recorded page reference in the current scope.
export function buildKnowledgeNetwork(model,{mode='points',topic='',center,query=''}={}){
  const needle=query.trim().toLocaleLowerCase(),matches=value=>!needle||value.toLocaleLowerCase().includes(needle);
  const nodes=[],links=[];
  const addPage=(page,primary=false)=>nodes.push({id:'page:'+page.id,title:page.title,kind:'page',page,primary});
  if(mode==='points'){
    const points=model.knowledgePoints.filter(point=>matches(point.term)),ids=new Set(points.flatMap(point=>point.documentIds));
    for(const point of points){nodes.push({id:'point:'+point.term,title:point.term,kind:'point',point,primary:true,count:point.documentIds.length});for(const id of point.documentIds)if(model.byId.has(id))links.push({from:'point:'+point.term,to:'page:'+id,kind:'membership'});}
    for(const page of model.pages)if(ids.has(page.id))addPage(page);
  }else if(mode==='topics'){
    const categories=model.categories.filter(category=>(!topic||topic===category)&&(matches(category)||model.pages.some(page=>(page.category||'未分类')===category&&matches(page.title))));
    for(const category of categories){const pages=model.pages.filter(page=>(page.category||'未分类')===category&&(!needle||matches(category)||matches(page.title)));nodes.push({id:'topic:'+category,title:category,kind:'topic',topic:category,primary:true,count:pages.length});for(const page of pages){addPage(page);links.push({from:'topic:'+category,to:'page:'+page.id,kind:'membership'});}}
  }else{
    const focus=model.byId.get(center)||model.pages[0];
    if(focus){const ids=new Set([focus.id]);for(const edge of model.edges){if(edge.from===focus.id)ids.add(edge.to);if(edge.to===focus.id)ids.add(edge.from);}
      for(const page of model.pages)if(ids.has(page.id)&&(page.id===focus.id||matches(page.title)))addPage(page,page.id===focus.id);
      const visible=new Set(nodes.map(node=>node.page.id));for(const edge of model.edges)if(visible.has(edge.from)&&visible.has(edge.to))links.push({from:'page:'+edge.from,to:'page:'+edge.to,kind:'reference'});
    }
  }
  const degree=new Map();for(const link of links){degree.set(link.from,(degree.get(link.from)||0)+1);degree.set(link.to,(degree.get(link.to)||0)+1);}
  for(const node of nodes){node.degree=degree.get(node.id)||0;node.radius=node.primary?Math.min(19,11+Math.sqrt(node.count??node.degree)):Math.min(8,4+Math.sqrt(node.degree)*.6);}
  return {nodes,links};
}

// A deterministic spring layout avoids a new dependency and random movement on redraw.
export function layoutKnowledgeNetwork(network,width,height){
  const nodes=network.nodes.map((node,index)=>{const angle=index*2.399963229728653,radius=Math.min(width,height)*(node.primary?0.2:0.37);return {...node,x:width/2+Math.cos(angle)*radius,y:height/2+Math.sin(angle)*radius};});
  if(!nodes.length)return nodes;
  const byId=new Map(nodes.map((node,index)=>[node.id,index]));
  const edges=network.links.map(link=>[byId.get(link.from),byId.get(link.to)]).filter(([a,b])=>a!==undefined&&b!==undefined);
  const k=Math.sqrt(width*height/nodes.length)*.66;
  for(let iteration=0;iteration<180;iteration++){
    const delta=nodes.map(()=>({x:0,y:0}));
    for(let a=0;a<nodes.length;a++)for(let b=a+1;b<nodes.length;b++){
      const dx=nodes[a].x-nodes[b].x||.1,dy=nodes[a].y-nodes[b].y||.1,d=Math.max(1,Math.hypot(dx,dy));
      const separation=nodes[a].radius+nodes[b].radius+(nodes[a].primary&&nodes[b].primary?32:12);
      const force=k*k/d*(nodes[a].primary&&nodes[b].primary?1.6:1)+Math.max(0,separation-d)*4;
      const x=dx/d*force,y=dy/d*force;delta[a].x+=x;delta[a].y+=y;delta[b].x-=x;delta[b].y-=y;
    }
    for(const [a,b] of edges){const dx=nodes[a].x-nodes[b].x,dy=nodes[a].y-nodes[b].y,d=Math.max(1,Math.hypot(dx,dy)),force=d*d/k*.16;const x=dx/d*force,y=dy/d*force;delta[a].x-=x;delta[a].y-=y;delta[b].x+=x;delta[b].y+=y;}
    const temperature=8*(1-iteration/180)+.15;
    for(let index=0;index<nodes.length;index++){
      const node=nodes[index],v=delta[index];v.x+=(width/2-node.x)*.15;v.y+=(height/2-node.y)*.15;
      const length=Math.max(1,Math.hypot(v.x,v.y));node.x+=v.x/length*Math.min(temperature,length);node.y+=v.y/length*Math.min(temperature,length);
      const pad=node.primary?node.radius+27:node.radius+12;node.x=Math.max(pad,Math.min(width-pad,node.x));node.y=Math.max(pad,Math.min(height-pad-6,node.y));
    }
  }
  return nodes;
}
