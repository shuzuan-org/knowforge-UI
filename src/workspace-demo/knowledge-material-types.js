import {Archive,File,FileText,Image,Presentation,Video} from 'lucide-react';

export const knowledgeMaterialTypes = [
  {id:'document', label:'文档', icon:FileText, match:/\.(pdf|txt|md|markdown|docx?|odt|rtf|xlsx?|ods|csv|tsv|json)$/i},
  {id:'slides', label:'幻灯片', icon:Presentation, match:/\.(pptx?|odp|key)$/i},
  {id:'image', label:'图片', icon:Image, match:/^image\/|\.(png|jpe?g|webp|svg|gif|heic|avif|bmp|tiff?)$/i},
  {id:'video', label:'视频', icon:Video, match:/^video\/|\.(mp4|mov|webm|avi|mkv|m4v|ogv)$/i},
  {id:'archive', label:'压缩包', icon:Archive, match:/\.(zip|rar|7z|tar|gz|bz2|xz)$/i},
  {id:'other', label:'其他', icon:File},
];

export function knowledgeMaterialTypeOf(material) {
  if (material.type === '图像') return knowledgeMaterialTypes.find(type => type.id === 'image');
  return knowledgeMaterialTypes.find(type => type.label === material.type || type.match?.test(material.name) || type.match?.test(material.type)) ||
    ((material.type === '文本' || material.type?.startsWith('text/')) ? knowledgeMaterialTypes[0] : knowledgeMaterialTypes.at(-1));
}
