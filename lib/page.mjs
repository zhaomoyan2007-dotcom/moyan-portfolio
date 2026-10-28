import {imageURL} from '../public/media.mjs';

const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const scriptJSON=value=>JSON.stringify(value).replace(/[<>&\u2028\u2029]/g,char=>`\\u${char.charCodeAt(0).toString(16).padStart(4,'0')}`);

// The first response and the interactive app use the same published snapshot.
// Never ship a placeholder image that can paint before JavaScript starts.
export function renderDocument(template,data) {
  const {site}=data;
  const opening=imageURL(site.hero,1800);
  let html=template.replace(/<img\b(?=[^>]*\bdata-site-image="(hero|selectedPreview)")[^>]*>/g,(tag,field)=>{
    const src=imageURL(site[field]||site.hero,1800);
    if(!src)throw new Error(`首页图片无效：${field}`);
    const attributes=tag.slice(0,-1).replace(/\s(?:src|srcset|width|height|alt)="[^"]*"/g,'');
    return `${attributes} src="${escapeHTML(src)}" alt="${escapeHTML(site.name)}的摄影作品">`;
  });
  html=html.replace(/(<span\b[^>]*data-site-text="name"[^>]*>)[\s\S]*?<\/span>/g,(_,start)=>`${start}${escapeHTML(site.name)}</span>`);
  html=html.replace(/(<p\b[^>]*class="hero-role"[^>]*>)[\s\S]*?<\/p>/,(_,start)=>`${start}${escapeHTML(site.identity?.zh)}</p>`);
  const intro=site.intro?.zh||site.about?.zh?.split('\n')[0]||'';
  const paragraphs=intro.split(/\n\s*\n/).filter(Boolean).map(text=>`<p>${escapeHTML(text)}</p>`).join('');
  html=html.replace('<!-- hero-introduction -->',()=>paragraphs);
  html=html.replace('<!-- hero-preload -->',()=>`<link rel="preload" as="image" href="${escapeHTML(opening)}" fetchpriority="high">`);
  if(!html.includes('<!-- portfolio-bootstrap -->'))throw new Error('Missing portfolio bootstrap slot');
  return html.replace('<!-- portfolio-bootstrap -->',()=>`<script id="portfolio-data" type="application/json">${scriptJSON(data)}</script>`);
}
