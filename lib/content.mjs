const categories = new Set(['documentary', 'portrait', 'contemporary', 'film']);
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
const text = value => typeof value === 'string' ? value : '';
const bilingual = value => ({ zh: text(value?.zh), en: text(value?.en) });
function media(value, label) {
  if(Array.isArray(value)&&value.length===1)value=value[0];
  if (!safeMediaURL(value)) throw new Error(`${label}图片URL无效`);
  return value;
}
function imageList(value, label) {
  if(typeof value==='string')value=[value];
  if (!Array.isArray(value) || value.length > 500) throw new Error(`${label}图片列表须为0～500张`);
  return value.map(src => media(src, label));
}
export function publicContent(site, records) {
  if (!site || !text(site.name).trim()) throw new Error('请填写网站署名');
  const ids = new Set();
  const projects = records.map(record => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.id || '')) throw new Error('项目地址必须为小写英文、数字和连字符');
    if (ids.has(record.id)) throw new Error('项目地址重复 duplicate');
    ids.add(record.id);
    if (!['draft', 'published'].includes(record.status)) throw new Error('项目状态无效');
    if (record.status !== 'published') return null;
    if (!categories.has(record.category)) throw new Error(`项目 ${record.id} 分类无效`);
    const title = bilingual(record.title);
    if (!title.zh.trim() || !title.en.trim()) throw new Error(`项目 ${record.id} 缺少中英标题`);
    const images = imageList(record.images, record.id);
    if (!images.length) throw new Error(`项目 ${record.id} 至少需要一张图片`);
    return {
      id: record.id, title, description: bilingual(record.description), concept: bilingual(record.concept),
      roles: bilingual(record.roles), year: text(record.year), category: record.category,
      featured: record.featured === true, order: Number.isFinite(record.order) ? record.order : 0,
      cover: media(record.cover || images[0], record.id), images
    };
  }).filter(Boolean).sort((a,b) => a.order - b.order || a.id.localeCompare(b.id));
  const contactURL = text(site.contactURL);
  if (contactURL && !/^https:\/\/[^\s]+$/.test(contactURL)) throw new Error('联系链接需要HTTPS网址');
  const contactEmail = text(site.contactEmail);
  if (contactEmail && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(contactEmail)) throw new Error('联系邮箱格式不正确');
  return {
    site: { name: text(site.name), identity: bilingual(site.identity), about: bilingual(site.about),
      hero: media(site.hero, '首页'), selectedPreview: media(site.selectedPreview || site.hero, '精选入口'),
      homePhotos: imageList(site.homePhotos || [], '首页精选'), contactEmail, contactURL,
      contactLabel: bilingual(site.contactLabel) },
    projects
  };
}
