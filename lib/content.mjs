const categories = new Set(['documentary', 'portrait', 'contemporary', 'sports', 'aerial', 'nature', 'film']);
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
const text = value => typeof value === 'string' ? value : '';
const bilingual = value => ({ zh: text(value?.zh), en: text(value?.en) });
function aboutPage(value={}) {
  const result={};
  for(const field of ['introTitle','introSubtitle','eyebrow','heading','profileLine','directionsHeading','capabilitiesHeading','cooperationHeading','cooperationLead','contactNote','plansHeading'])result[field]=bilingual(value?.[field]);
  const introBlocks=value?.introBlocks??[];
  if(!Array.isArray(introBlocks)||introBlocks.length>30)throw new Error('关于介绍文本须为0～30段');
  result.introBlocks=introBlocks.map(item=>({text:bilingual(item?.text)}));
  for(const field of ['directions','capabilities','cooperation','plans']){
    const items=value?.[field]??[];
    if(!Array.isArray(items)||items.length>30)throw new Error('关于栏目列表须为0～30项');
    result[field]=items.map(item=>({title:bilingual(item?.title),body:bilingual(item?.body),...(field==='capabilities'&&text(item?.projectId)?{projectId:text(item.projectId)}:{})}));
  }
  return result;
}
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
function projectDate(value) {
  const date=text(value).trim();
  if(!date)return '';
  if(!/^[1-9]\d{3}(?:-(?:0[1-9]|1[0-2])(?:-(?:0[1-9]|[12]\d|3[01]))?)?$/.test(date))throw new Error('项目日期请填写有效的YYYY、YYYY-MM或YYYY-MM-DD');
  if(date.length===10&&new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)throw new Error('项目日期不存在，请检查月份与天数');
  return date;
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
    const images = imageList(record.images || [], record.id);
    if (!images.length && record.category!=='film') throw new Error(`项目 ${record.id} 至少需要一张图片`);
    let subgroup='none';
    if(record.category==='portrait'){
      subgroup=record.subgroup==='studio'?'studio':'environment';
    }
    if(record.category==='sports'&&['basketball','football'].includes(record.subgroup))subgroup=record.subgroup;
    return {
      id: record.id, title, description: bilingual(record.description), concept: bilingual(record.concept),
      roles: bilingual(record.roles), year: text(record.year), projectDate: record.category==='film'?projectDate(record.projectDate):'', category: record.category, subgroup,
      featured: record.featured === true, order: Number.isFinite(record.order) ? record.order : 0,
      cover: media(record.cover || images[0], record.id), images
    };
  }).filter(Boolean).sort((a,b) => a.order - b.order || a.id.localeCompare(b.id));
  const contactURL = text(site.contactURL);
  if (contactURL && !/^https:\/\/[^\s]+$/.test(contactURL)) throw new Error('联系链接需要HTTPS网址');
  const contactEmail = text(site.contactEmail);
  if (contactEmail && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(contactEmail)) throw new Error('联系邮箱格式不正确');
  return {
    site: { name: text(site.name), identity: bilingual(site.identity), intro: bilingual(site.intro), filmIntro: bilingual(site.filmIntro), about: bilingual(site.about), aboutPage: aboutPage(site.aboutPage),
      hero: media(site.hero, '首页'), selectedPreview: media(site.selectedPreview || site.hero, '精选入口'),
      homePhotos: imageList(site.homePhotos || [], '首页精选'), contactEmail, contactURL,
      contactLabel: bilingual(site.contactLabel) },
    projects
  };
}
