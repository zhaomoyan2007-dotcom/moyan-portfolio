import { copy } from './copy.js';
import { imageURL } from './media.mjs';

Object.assign(copy.zh,{categoryEmpty:'这个分类暂时没有已发布的项目。',previewNote:'墨岩 · 图片摄影与电影摄影',testImageAlt:'短片入口的测试照片',projectMissing:'项目不存在或已撤下',imageError:'图片暂时无法加载',loadError:'暂时无法读取作品，请刷新页面重试。',viewSelectedProject:'查看项目'});
Object.assign(copy.en,{categoryEmpty:'No published projects in this category yet.',previewNote:'PHOTOGRAPHY & CINEMATOGRAPHY',testImageAlt:'A test photograph used for the short film section',projectMissing:'Project unavailable',imageError:'Image unavailable',loadError:'Unable to load the portfolio. Please refresh to try again.',viewSelectedProject:'VIEW PROJECT'});
const categories=['all','art','documentary','portrait','contemporary','film'];
const byId=id=>document.getElementById(id);
const home=byId('home-view'), archive=byId('archive-view'), dialog=byId('project-dialog');
let language='zh', data, filter='all', activeProject=null, returnHash='#all', projectTrigger=null;
try{language=localStorage.getItem('moyan-preview-language')==='en'?'en':'zh';}catch{}
const t=key=>copy[language][key]??copy.zh[key]??key;
const localized=value=>value?.[language]||'';
function node(tag,className,text){const element=document.createElement(tag);if(className)element.className=className;if(text)element.textContent=text;return element;}
function photograph(src,index=0,eager=false){
  const img=node('img');
  img.src=imageURL(src,1800);
  const small=imageURL(src,900);
  if(src.includes('res.cloudinary.com/'))img.srcset=`${small} 900w, ${img.src} 1800w`;
  else if(/^\/assets\/selected-photos\/\d+-1800\.webp$/.test(src))img.srcset=`${src.replace('-1800','-900')} 900w, ${src} 1800w`;
  img.sizes='(max-width: 760px) calc(100vw - 50px), 44vw';
  img.alt=language==='zh'?`作品照片 ${index+1}`:`Photograph ${index+1}`;
  img.width=1800;img.height=1800;
  img.loading=eager?'eager':'lazy';img.decoding='async';
  img.addEventListener('error',()=>{img.alt=t('imageError');img.classList.add('image-unavailable');});
  return img;
}
function card(project){
  const link=node('a','project-feature archive-card');link.href=`#project/${project.id}`;link.dataset.project=project.id;
  const frame=node('div','image-frame');frame.append(photograph(project.cover));
  const arrow=node('span','project-open','↗');arrow.setAttribute('aria-hidden','true');frame.append(arrow);
  const caption=node('div','project-caption');caption.append(node('h3','',localized(project.title)),node('p','',t(project.category)));
  link.append(frame,caption);return link;
}
function renderArchive(){
  const filters=byId('filters');filters.replaceChildren();
  categories.forEach(category=>{const button=node('button','',t(category));button.type='button';button.dataset.filter=category;button.setAttribute('aria-pressed',String(filter===category));if(language==='zh')button.append(node('span','',copy.en[category].toUpperCase()));filters.append(button);});
  const selected=data.projects.filter(p=>filter==='all'||(filter==='art'?p.category!=='film':p.category===filter));
  byId('archive-grid').replaceChildren(...selected.map(card));byId('archive-empty').hidden=selected.length>0;
}
function renderHome(){
  const {site,projects}=data;
  document.querySelector('.signature-han').textContent=site.name;document.querySelector('.brand-han').textContent=site.name;
  const introduction=byId('hero-introduction');
  const introText=localized(site.intro)||localized(site.about).split('\n')[0];
  introduction.replaceChildren(...introText.split(/\n\s*\n/).filter(Boolean).map(text=>node('p','',text)));
  document.querySelector('.hero-role').textContent=localized(site.identity);
  document.querySelectorAll('[data-site-image]').forEach(img=>{img.src=imageURL(site[img.dataset.siteImage],1800);img.removeAttribute('srcset');img.alt=language==='zh'?'墨岩的摄影作品':'Photography by 墨岩';});
  byId('home-photos').replaceChildren(...site.homePhotos.map((src,i)=>{const figure=node('figure');figure.append(photograph(src,i));return figure;}));
  byId('featured-photography').replaceChildren(...projects.filter(p=>p.featured&&p.category!=='film').map(card));
  byId('featured-films').replaceChildren(...projects.filter(p=>p.featured&&p.category==='film').map(card));
  byId('featured-photography').hidden=!byId('featured-photography').childElementCount;
  byId('featured-films').hidden=!byId('featured-films').childElementCount;
  byId('about-text').textContent=localized(site.about);
  const contact=byId('contact-content');contact.replaceChildren();
  if(site.contactEmail){const email=node('a','',site.contactEmail);email.href=`mailto:${site.contactEmail}`;contact.append(email);}
  if(site.contactURL){const link=node('a','',localized(site.contactLabel)||t('contactLabel'));link.href=site.contactURL;link.target='_blank';link.rel='noopener noreferrer';contact.append(link);}
}
function renderProject(){
  const project=data.projects.find(p=>p.id===activeProject);
  const body=node('article','dialog-body');
  const title=node('h2','',project?localized(project.title):t('projectMissing'));title.id='dialog-title';body.append(title);
  if(project){
    const meta=[t(project.category),project.year,localized(project.roles)].filter(Boolean).join(' / ');
    body.append(node('p','dialog-subtitle',meta));
    if(localized(project.description))body.append(node('p','project-description',localized(project.description)));
    const gallery=node('div','project-gallery');project.images.forEach((src,i)=>gallery.append(photograph(src,i,i===0)));body.append(gallery);
    if(localized(project.concept)){const concept=node('div','project-concept');concept.append(node('h3','',t('concept')),node('p','',localized(project.concept)));body.append(concept);}
  }
  byId('dialog-content').replaceChildren(body);
}
function setLanguage(next){
  language=next;document.documentElement.lang=language==='zh'?'zh-CN':'en';document.title=`${data.site.name} — ${language==='zh'?'图片摄影与电影摄影':'Photography & Cinematography'}`;
  document.querySelectorAll('[data-i18n]').forEach(element=>{element.innerHTML=t(element.dataset.i18n);});
  document.querySelectorAll('[data-alt]').forEach(element=>{element.alt=t(element.dataset.alt);});
  document.querySelectorAll('[data-language]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.language===language)));
  renderHome();renderArchive();if(activeProject)renderProject();
  try{localStorage.setItem('moyan-preview-language',language);}catch{}
}
function route(){
  const hash=location.hash||'#home';
  if(hash.startsWith('#project/')){
    activeProject=hash.slice(9);renderProject();
    if(!dialog.open){dialog.showModal();dialog.scrollTop=0;byId('dialog-close').focus({preventScroll:true});}
    return;
  }
  if(dialog.open)dialog.close();activeProject=null;
  const isArchive=hash==='#all'||hash.startsWith('#all/');
  const switched=home.hidden!==isArchive;home.hidden=isArchive;archive.hidden=!isArchive;
  if(isArchive){const category=hash.split('/')[1]||'all';filter=category==='photography'?'art':categories.includes(category)?category:'all';renderArchive();if(switched)window.scrollTo({top:0,behavior:'instant'});}
  else {const target=hash==='#home'?document.querySelector('.hero'):document.getElementById(hash.slice(1));if(target)requestAnimationFrame(()=>{target.scrollIntoView({behavior:switched||matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});if(target.hasAttribute('tabindex'))target.focus({preventScroll:true});});}
  returnHash=hash;
}
document.addEventListener('click',event=>{
  const lang=event.target.closest('[data-language]');if(lang){setLanguage(lang.dataset.language);return;}
  const category=event.target.closest('[data-filter]');if(category){location.hash=category.dataset.filter==='all'?'#all':`#all/${category.dataset.filter}`;return;}
  const project=event.target.closest('[data-project]');if(project){returnHash=location.hash||'#home';projectTrigger=project;return;}
  const anchor=event.target.closest('a[href^="#"]');if(anchor&&anchor.hash===location.hash){event.preventDefault();route();}
});
byId('dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
dialog.addEventListener('close',()=>{activeProject=null;if(location.hash.startsWith('#project/'))location.hash=returnHash;if(projectTrigger?.isConnected)projectTrigger.focus({preventScroll:true});});
window.addEventListener('hashchange',()=>{if(data)route();});
try{
  const response=await fetch('/content.json',{cache:'no-cache'});
  if(!response.ok)throw new Error('Content unavailable');data=await response.json();setLanguage(language);route();
}catch{const error=byId('load-error');error.hidden=false;error.textContent=t('loadError');}
