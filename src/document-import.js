const MAX_TEXT = 2_000_000;
export async function readDocumentFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  let text = '', method = '本地文本读取';
  if (ext === 'pdf') {
    const [pdfjs, worker] = await Promise.all([import('pdfjs-dist/build/pdf.mjs'), import('pdfjs-dist/build/pdf.worker.min.mjs?worker')]);
    if (!pdfjs.GlobalWorkerOptions.workerPort) pdfjs.GlobalWorkerOptions.workerPort = new worker.default();
    const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false, useSystemFonts: true });
    try {
      const pdf = await task.promise;
      if(pdf.numPages > 500) throw new Error('PDF 超过 500 页，请拆分后添加。');
      for(let i=1;i<=pdf.numPages;i++) { const page=await pdf.getPage(i);const content=await page.getTextContent();text += content.items.map(x=>x.str+(x.hasEOL?'\n':' ')).join('')+'\n\n';if(text.length>MAX_TEXT)throw new Error('提取的正文超过 200 万字符，请拆分后添加。'); }
      method = '本机 PDF 文本解析';
    } catch(error) { if(error.name==='PasswordException')throw new Error('PDF 已加密，请解锁后添加或补充文本。');throw error; }
    finally { await task.destroy(); }
    if(!text.trim())throw new Error('此 PDF 没有可提取的文字，可能是扫描件。请补充文本或接入 OCR。');
  } else if(ext === 'docx') {
    const mammoth=await import('mammoth/mammoth.browser.js');
    const result=await (mammoth.default || mammoth).extractRawText({arrayBuffer:await file.arrayBuffer()});
    text=result.value;method='本机 DOCX 文本解析';
  } else if(/html?/.test(ext)) {
    const dom=new DOMParser().parseFromString(await file.text(),'text/html');
    dom.querySelectorAll('script,style,iframe,object,form').forEach(n=>n.remove());
    text=dom.body.textContent;method='本地 HTML 正文提取';
  } else text=await file.text();
  if(text.length>MAX_TEXT)throw new Error('正文超过 200 万字符，请拆分后添加。');
  return {text,method};
}
