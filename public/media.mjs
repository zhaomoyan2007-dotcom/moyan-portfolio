// Shared by the website, CMS previews and server content validation.
export function galleryLayout(category,subgroup='none') {
  return ['aerial','nature'].includes(category)?'grid':'carousel';
}
const raster = /\.(?:jpe?g|png|webp|avif|gif)$/i;
export function safeMediaURL(value) {
  if (typeof value !== 'string' || /[\s\\<>"']/.test(value)) return false;
  let decoded;
  try { decoded = decodeURIComponent(value); } catch { return false; }
  if (decoded.split(/[/?#]/).includes('..') || /[\x00-\x1f]/.test(decoded)) return false;
  if (value.startsWith('/assets/') || value.startsWith('/uploads/')) return raster.test(value);
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && raster.test(url.pathname);
  } catch { return false; }
}
export function imageURL(src, width) {
  if (!safeMediaURL(src)) return '';
  if (/^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(src)) {
    const size = [480, 900, 1800].includes(width) ? width : 900;
    return src.replace('/image/upload/', `/image/upload/f_auto,q_auto,w_${size},c_limit/`);
  }
  return src;
}
export function filmProjects(projects) {
  const time=p=>Number((p.projectDate||(/^[1-9]\d{3}$/.test(p.year||'')?p.year:'')).replaceAll('-','').padEnd(8,'0'));
  return projects.filter(p=>p.category==='film').slice().sort((a,b)=>time(b)-time(a)||a.order-b.order||a.id.localeCompare(b.id));
}
export function filmImages(project) {
  const images=Array.isArray(project.images)?project.images:typeof project.images==='string'?[project.images]:[];
  const cover=(Array.isArray(project.cover)?project.cover[0]:project.cover)||images[0]||'';
  return {cover,stills:images.filter(src=>src!==cover)};
}
