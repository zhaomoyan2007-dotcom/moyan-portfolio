// Keep loaded film images when translating so their intrinsic sizes do not reset.
const localizers=new WeakMap();
export function updateFilmLanguage(article,language,t){localizers.get(article)?.(language,t);}
// Film projects use a static sequence; photography carousels remain independent.
export function createFilmProject({project,images,language,t,makeImage}) {
  const text=value=>value?.[language]||'';
  function node(tag,className,content){const element=document.createElement(tag);if(className)element.className=className;if(content)element.textContent=content;return element;}
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
    img.sizes=lead?'(max-width: 760px) calc(100vw - 52px), min(1120px, 90vw)':'(max-width: 760px) 26vw, (max-width: 1040px) 29vw, 276px';
    const dimensions=()=>{if(img.naturalWidth&&img.naturalHeight){img.width=img.naturalWidth;img.height=img.naturalHeight;}};
    img.addEventListener('load',dimensions,{once:true});dimensions();loadedImages.push({img,index,lead});return img;
  }
  const cover=node('figure','film-cover');cover.append(image(images.cover,0,true));article.append(cover);
  if(images.stills.length){const grid=node('div','film-stills');images.stills.forEach((src,index)=>{const frame=node('figure','film-still');frame.append(image(src,index,false));grid.append(frame);});article.append(grid);}
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
