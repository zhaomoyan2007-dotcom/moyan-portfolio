import {loadPortfolio} from './bootstrap.mjs';
import { aboutContent } from './about.mjs';
import { archiveFilterGroups } from './archive-filters.mjs';
import { copy } from './copy.js';
import { imageURL,galleryLayout,filmProjects,filmImages } from './media.mjs';
import { createFilmProject,updateFilmLanguage } from './films.mjs';
import { createGallery,emptyGallery } from './galleries.mjs';
import { createPhotoViewer } from './photo-viewer.mjs';

Object.assign(copy.zh,{categoryEmpty:'这个分类暂时没有已发布的项目。',previewNote:'墨岩 · 图片摄影与电影摄影',testImageAlt:'短片入口的测试照片',projectMissing:'项目不存在或已撤下',imageError:'图片暂时无法加载',loadError:'暂时无法读取作品，请刷新页面重试。',viewSelectedProject:'查看项目'});
Object.assign(copy.en,{categoryEmpty:'No published projects in this category yet.',previewNote:'PHOTOGRAPHY & CINEMATOGRAPHY',testImageAlt:'A test photograph used for the short film section',projectMissing:'Project unavailable',imageError:'Image unavailable',loadError:'Unable to load the portfolio. Please refresh to try again.',viewSelectedProject:'VIEW PROJECT'});
Object.assign(copy.zh,{art:'摄影作品',contemporary:'当代与情绪',sports:'体育',aerial:'航拍',nature:'自然风光',environment:'环境人像',studio:'棚拍人像',basketball:'篮球赛',football:'足球赛',previousPhoto:'上一张照片',nextPhoto:'下一张照片',workPending:'作品整理中',unclassified:'未分类精选',archiveNote:'纪实、当代与情绪、人像、体育、航拍与自然风光。<br>从图片摄影，到短片创作。'});
Object.assign(copy.en,{art:'Photography',contemporary:'Contemporary & Mood',sports:'Sports',aerial:'Aerial',nature:'Nature & Landscape',environment:'Environmental Portraits',studio:'Studio Portraits',basketball:'Basketball',football:'Football',previousPhoto:'Previous photograph',nextPhoto:'Next photograph',workPending:'WORK IN PROGRESS',unclassified:'Selected photographs',archiveNote:'Documentary, contemporary work, portraits, sports, aerial and landscape.<br>From still photographs to short films.'});
const photoCategories=['documentary','contemporary','portrait','sports','aerial','nature'];
const categories=['all','art',...photoCategories,'film'];
const byId=id=>document.getElementById(id);
const home=byId('home-view'), archive=byId('archive-view'), dialog=byId('project-dialog');
let language='zh', data, filter='all', activeProject=null, returnHash='#all', projectTrigger=null;
try{language=localStorage.getItem('moyan-preview-language')==='en'?'en':'zh';}catch{}
const t=key=>copy[language][key]??copy.zh[key]??key;
const localized=value=>value?.[language]||'';
const photoViewer=createPhotoViewer(byId('photo-dialog'),t);
let galleryDisposers=[];
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
  filters.setAttribute('aria-label',language==='zh'?'作品分类':'Project categories');
  archiveFilterGroups(filter).forEach((group,index)=>{
    const row=node('div',index?'filter-children':'filter-parents');row.setAttribute('role','group');row.setAttribute('aria-label',index?(language==='zh'?'摄影分类':'Photography categories'):(language==='zh'?'作品类型':'Project type'));
    group.forEach(category=>{const button=node('button','',t(category));button.type='button';button.dataset.filter=category;const active=filter===category||(category==='art'&&photoCategories.includes(filter));button.setAttribute('aria-pressed',String(active));if(language==='zh')button.append(node('span','',copy.en[category].toUpperCase()));row.append(button);});filters.append(row);
  });
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
  document.querySelectorAll('[data-site-image]').forEach(img=>{if(['hero','selectedPreview'].includes(img.dataset.siteImage)){img.removeAttribute('width');img.removeAttribute('height');}const src=imageURL(site[img.dataset.siteImage],1800);if(img.getAttribute('src')!==src)img.src=src;img.removeAttribute('srcset');img.alt=language==='zh'?'墨岩的摄影作品':'Photography by 墨岩';});
  renderPhotoSections(site,projects);
  document.getElementById('selected-visual').classList.toggle('is-empty',!site.selectedPreview);
  const filmIntroduction=byId('film-introduction');
  filmIntroduction.textContent=localized(site.filmIntro);filmIntroduction.hidden=!filmIntroduction.textContent.trim();
  const films=filmProjects(projects);
  const filmRoot=byId('film-projects');
  const existingFilms=new Map([...filmRoot.children].map(element=>[element.dataset.filmId,element]));
  filmRoot.replaceChildren(...films.map(project=>{
    const existing=existingFilms.get(project.id);
    if(existing){updateFilmLanguage(existing,language,t);return existing;}
    return createFilmProject({project,images:filmImages(project),language,t,makeImage:photograph});
  }));
  byId('film-empty').hidden=films.length>0;
  byId('about-content').replaceChildren(aboutContent((tag,props,...children)=>{const element=node(tag,props.className||'');Object.entries(props).forEach(([key,value])=>{if(key!=='className'&&value!=null)element.setAttribute(key,String(value));});children.flat().filter(child=>child!==null&&child!==undefined).forEach(child=>element.append(child));return element;},site,language,projects,src=>imageURL(src,900)));
}
function renderPhotoSections(site,projects){
  const positions=new Map([...document.querySelectorAll('[data-gallery]')].map(element=>[element.dataset.gallery,element.querySelector('.photo-track').scrollLeft]));
  galleryDisposers.forEach(dispose=>dispose());galleryDisposers=[];
  const root=byId('photography-categories');root.replaceChildren();
  const index=byId('photography-index');index.replaceChildren();index.setAttribute('aria-label',language==='zh'?'摄影分类':'Photography categories');
  function addRow(parent,key,images,layout,labelKey){
    const gallery=createGallery({id:key,images,layout,label:t(labelKey),language,makeImage:photograph,onOpen:(list,i,trigger)=>photoViewer.open(list,i,labelKey,trigger)});
    parent.append(gallery.element);galleryDisposers.push(gallery.destroy);
    if(positions.has(key))gallery.element.querySelector('.photo-track').scrollLeft=positions.get(key);
  }
  if(site.homePhotos.length){
    const legacy=node('section','photography-category');legacy.append(node('h3','category-title',t('unclassified')));addRow(legacy,'legacy',site.homePhotos,'carousel','unclassified');root.append(legacy);
  }
  photoCategories.forEach(category=>{
    const section=node('section','photography-category');section.id=`photography-${category}`;section.tabIndex=-1;
    const title=node('h3','category-title',t(category));title.id=`heading-${category}`;section.setAttribute('aria-labelledby',title.id);
    section.append(node('p','eyebrow',copy.en[category].toUpperCase()),title);
    const anchor=node('a','',t(category));anchor.href=`#photography-${category}`;index.append(anchor);
    const selected=projects.filter(p=>p.featured&&p.category===category);
    const subgroups=category==='portrait'?['environment','studio']:['none'];
    subgroups.forEach(subgroup=>{
      const group=node('div','category-group');
      if(subgroup!=='none'){const heading=node('h4','subgroup-title',t(subgroup));if(language==='zh')heading.append(node('span','',copy.en[subgroup].toUpperCase()));group.append(heading);}
      const rows=subgroup==='none'?selected:selected.filter(p=>p.subgroup===subgroup);
      const layout=galleryLayout(category,subgroup);
      if(rows.length)rows.forEach(project=>addRow(group,project.id,project.images,layout,subgroup==='none'?category:subgroup));
      else{
        const count=['documentary','contemporary'].includes(category)?2:1;
        for(let i=0;i<count;i++)group.append(emptyGallery(layout,3));
        group.append(node('p','category-pending',t('workPending')));
      }
      section.append(group);
    });
    root.append(section);
  });
}
function renderProject(){
  const project=data.projects.find(p=>p.id===activeProject);
  const body=node('article','dialog-body');
  const title=node('h2','',project?localized(project.title):t('projectMissing'));title.id='dialog-title';body.append(title);
  if(project){
    const meta=[t(project.category),project.category==='film'?(project.projectDate||project.year):project.year,localized(project.roles)].filter(Boolean).join(' / ');
    body.append(node('p','dialog-subtitle',meta));
    if(localized(project.description))body.append(node('p','project-description',localized(project.description)));
    const gallery=node('div','project-gallery');
    const film=project.category==='film'?filmImages(project):null;
    const frames=film?[film.cover,...film.stills]:project.images;
    frames.forEach((src,i)=>gallery.append(photograph(src,i,i===0)));body.append(gallery);
    if(localized(project.concept)){const concept=node('div','project-concept');concept.append(node('h3','',t('concept')),node('p','',localized(project.concept)));body.append(concept);}
  }
  byId('dialog-content').replaceChildren(body);
}
function setLanguage(next){
  const scrollPosition=window.scrollY;
  language=next;document.documentElement.lang=language==='zh'?'zh-CN':'en';document.title=`${data.site.name} — ${language==='zh'?'图片摄影与电影摄影':'Photography & Cinematography'}`;
  document.querySelectorAll('[data-i18n]').forEach(element=>{element.innerHTML=t(element.dataset.i18n);});
  document.querySelectorAll('[data-alt]').forEach(element=>{element.alt=t(element.dataset.alt);});
  document.querySelectorAll('[data-language]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.language===language)));
  renderHome();renderArchive();if(activeProject)renderProject();photoViewer.refresh();
  // Rebuilding image sections can temporarily shrink the document and clamp scrollY.
  requestAnimationFrame(()=>window.scrollTo({top:scrollPosition,behavior:'instant'}));
  try{localStorage.setItem('moyan-preview-language',language);}catch{}
}
function route(){
  if(byId('photo-dialog').open)byId('photo-dialog').close();
  const hash=location.hash||'#home';
  if(hash.startsWith('#project/')){
    activeProject=hash.slice(9);renderProject();
    if(!dialog.open){dialog.showModal();dialog.scrollTop=0;byId('dialog-close').focus({preventScroll:true});}
    return;
  }
  if(dialog.open)dialog.close();activeProject=null;
  // About belongs to both views; keep the current view to avoid image layout shifts during the scroll.
  if(hash==='#about'||hash==='#collaborate'){
    const target=byId(hash.slice(1))||byId('about');
    requestAnimationFrame(()=>{target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});target.focus({preventScroll:true});});
    returnHash=hash;return;
  }
  const isArchive=hash==='#all'||hash.startsWith('#all/');
  const switched=home.hidden!==isArchive;home.hidden=isArchive;archive.hidden=!isArchive;
  if(isArchive){const category=hash.split('/')[1]||'all';filter=category==='photography'?'art':categories.includes(category)?category:'all';renderArchive();if(switched)window.scrollTo({top:0,behavior:'instant'});}
  else {const target=hash==='#home'?document.querySelector('.hero'):document.getElementById(hash.slice(1));if(target)requestAnimationFrame(()=>{target.scrollIntoView({behavior:(switched&&hash!=='#about')||matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});if(target.hasAttribute('tabindex'))target.focus({preventScroll:true});});}
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
  data=await loadPortfolio();setLanguage(language);route();
}catch{const error=byId('load-error');error.hidden=false;error.textContent=t('loadError');}
