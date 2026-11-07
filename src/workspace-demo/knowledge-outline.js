const normalize=value=>(value||'').trim().toLocaleLowerCase();

// A topic document is the parent only when its title matches its recorded category.
// Categories without their own document remain directly readable, top-level entries.
export function wikiOutline(pages){
  const categories=new Map();
  for(const page of pages){const category=page.category||'未分类';if(!categories.has(category))categories.set(category,[]);categories.get(category).push(page);}
  return [...categories.entries()].flatMap(([category,documents])=>{
    const parent=documents.find(page=>normalize(page.title)===normalize(category));
    return parent?[{page:parent,children:documents.filter(page=>page.id!==parent.id)}]:documents.map(page=>({page,children:[]}));
  });
}
