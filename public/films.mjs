import { filmRatio, filmRows, filmRowStyle } from './film-layout.mjs';

function node(tag,className,content){const element=document.createElement(tag);if(className)element.className=className;if(content)element.textContent=content;return element;}

export function createFilmMedia(images, makeImage) {
  const cover = node('figure', 'film-cover');
  const lead = makeImage(images.cover, 0, true);
  lead.sizes = '(max-width: 760px) calc(100vw - 52px), min(1120px, 90vw)';
  cover.append(lead);
  if (!images.stills.length) return [cover];

  const gallery = node('div', 'film-stills');
  const frames = images.stills.map((src, index) => {
    const frame = node('figure', 'film-still');
    const img = makeImage(src, index, false);
    img.sizes = '(max-width: 760px) 42vw, 420px';
    frame.append(img);
    return { img, frame, ratio: filmRatio(img) };
  });
  let pending = false;
  function layout() {
    pending = false;
    let offset = 0;
    const rows = filmRows(frames.map(frame => frame.ratio)).map(row => {
      const element = node('div', 'film-still-row');
      Object.assign(element.style, filmRowStyle(row));
      for (let i = 0; i < row.columns.length; i++) element.append(frames[offset++].frame);
      return element;
    });
    gallery.replaceChildren(...rows);
  }
  for (const frame of frames) {
    frame.img.addEventListener('load', () => {
      const ratio = filmRatio(frame.img);
      if (!ratio || ratio === frame.ratio) return;
      frame.ratio = ratio;
      if (!pending) {
        pending = true;
        requestAnimationFrame(layout);
      }
    }, { once: true });
  }
  layout();
  return [cover, gallery];
}

// Keep loaded film images when translating so their intrinsic sizes do not reset.
const localizers=new WeakMap();
export function updateFilmLanguage(article,language,t){localizers.get(article)?.(language,t);}
// Film projects use a static sequence; photography carousels remain independent.
export function createFilmProject({project,images,language,t,makeImage}) {
  const text=value=>value?.[language]||'';
  const article=node('article','film-project');article.dataset.filmId=project.id;
  const loadedImages=[];
  const headingId=`film-title-${project.id}`;article.setAttribute('aria-labelledby',headingId);
  const header=node('header','film-project-heading');
  const title=node('h3','',text(project.title));title.id=headingId;header.append(title);
  const date=project.projectDate||project.year;
  if(date){const valid=/^[1-9]\d{3}(?:-\d{2})?(?:-\d{2})?$/.test(date);const time=node(valid?'time':'p','film-date',date);if(valid)time.setAttribute('datetime',date);header.append(time);}
  article.append(header);
  function image(src,index,lead){
    const img=makeImage(src,index);
    img.alt=`${text(project.title)} · ${t(lead?'filmCover':'filmStill')}${lead?'':` ${index+1}`}`;
    const dimensions=()=>{if(img.naturalWidth&&img.naturalHeight){img.width=img.naturalWidth;img.height=img.naturalHeight;}};
    img.addEventListener('load',dimensions,{once:true});dimensions();loadedImages.push({img,index,lead});return img;
  }
  article.append(...createFilmMedia(images,image));
  let details;
  function translate(nextLanguage,nextT){
    language=nextLanguage;t=nextT;title.textContent=text(project.title);
    for(const {img,index,lead} of loadedImages)img.alt=`${text(project.title)} · ${t(lead?'filmCover':'filmStill')}${lead?'':` ${index+1}`}`;
    details?.remove();details=node('div','film-details');
    for(const key of ['roles','concept']){
      const value=text(project[key]);if(!value.trim())continue;
      const section=node('section','film-detail');section.append(node('p','',value));details.append(section);
    }
    if(details.childElementCount)article.append(details);
  }
  localizers.set(article,translate);translate(language,t);
  return article;
}
