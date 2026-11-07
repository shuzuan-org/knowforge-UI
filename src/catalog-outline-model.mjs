// Keep DOM heading indices so identical titles and skipped heading levels remain addressable.
export function catalogOutline(headings, title) {
  const normalized = text => String(text || '').replace(/\s+/g, ' ').trim();
  const entries = headings.map((heading, index) => ({...heading, index, text: normalized(heading.text)}))
    .filter(heading => heading.text && !(heading.index === 0 && heading.level === 1 && heading.text === normalized(title)));
  const base = Math.min(...entries.map(heading => heading.level));
  return entries.map(heading => ({...heading, depth: Math.max(0, heading.level - base)}));
}

export function plainDocumentHeadings(doc) {
  return [{text:doc.title,level:1}, ...(doc.paragraphs || []).flatMap(text => {
    const match = /^#{1,6}\s+([^\n]+)$/.exec(text);
    return match ? [{text:match[1],level:2}] : [];
  })];
}
