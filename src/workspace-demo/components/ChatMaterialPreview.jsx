import {useEffect, useRef, useState} from 'react';
import {X} from 'lucide-react';
import {readMaterialFile} from '../chat-attachments';

const textLimit = 128 * 1024;

export function materialPreviewType({type, name}) {
  if (/^image\/(png|jpeg|gif|webp|svg\+xml|avif|bmp)$/i.test(type) || /\.(png|jpe?g|gif|webp|svg|avif|bmp)$/i.test(name)) return 'image';
  if (/^video\/(mp4|webm|ogg)$/i.test(type) || /\.(mp4|webm|ogv)$/i.test(name)) return 'video';
  if (type?.startsWith('text/') || /\.(txt|md|markdown|csv|tsv|json|html?|log)$/i.test(name)) return 'text';
  return null;
}

export function ChatMaterialPreview({material, onClose}) {
  const dialog = useRef(null);
  const [content, setContent] = useState(null);
  const kind = materialPreviewType(material);

  useEffect(() => {
    dialog.current.showModal();
  }, []);

  useEffect(() => {
    let active = true;
    let url;
    async function load() {
      const file = await readMaterialFile(material.id);
      if (!active) return;
      if (kind === 'text') {
        const text = await file.slice(0, textLimit).text();
        if (active) setContent({text, truncated:file.size > textLimit});
        return;
      }
      url = URL.createObjectURL(file);
      setContent({url});
    }
    load().catch(() => {
      if (active) setContent({error:'无法预览原文件，请重新上传后再试。'});
    });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [material.id, kind]);

  return <dialog ref={dialog} className="uw-material-preview" aria-labelledby="uw-material-preview-title" onClose={onClose}>
    <header className="kb-wiki-drawer-header">
      <h2 id="uw-material-preview-title">{material.name}</h2>
      <button type="button" className="kb-wiki-drawer-close" aria-label="关闭预览" onClick={() => dialog.current.close()}><X size={20}/></button>
    </header>
    <div className="uw-material-preview-body">
      {!content ? <p role="status">正在读取素材…</p> : content.error ? <p role="alert">{content.error}</p> :
        kind === 'image' ? <img src={content.url} alt={material.name} onError={() => setContent({error:'浏览器无法预览这张图片。'})}/> :
        kind === 'video' ? <video src={content.url} controls aria-label={material.name} onError={() => setContent({error:'浏览器无法播放此视频。'})}/> :
        <><pre>{content.text}</pre>{content.truncated && <p>仅预览前 128 KB，可下载查看完整文件。</p>}</>}
    </div>
  </dialog>;
}
