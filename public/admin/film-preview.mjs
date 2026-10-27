import {filmImages} from '../media.mjs';
export function filmPreview(data,h,getAsset) {
  const {cover,stills}=filmImages(data);
  const languages=['zh','en'].map(language=>{
    const frames=stills.map((src,index)=>h('figure',{key:index,className:'film-still'},
      h('img',{src:String(getAsset(src)),alt:`${language==='zh'?'切片':'Still'} ${index+1}`})));
    const details=['roles','concept'].flatMap(key=>data[key]?.[language]?.trim()?[
      h('section',{key,className:'film-detail'},h('p',{},data[key][language]))
    ]:[]);
    const project=h('article',{className:'film-project'},
      h('header',{className:'film-project-heading'},h('h3',{},data.title?.[language]||''),
        h('p',{className:'film-date'},data.projectDate||data.year||'')),
      cover?h('figure',{className:'film-cover'},h('img',{src:String(getAsset(cover)),alt:language==='zh'?'短片首图':'Key frame'})):null,
      frames.length?h('div',{className:'film-stills'},...frames):null,
      details.length?h('div',{className:'film-details'},...details):null);
    return h('section',{key:language,lang:language==='zh'?'zh-CN':'en',className:'cms-film-language'},
      h('p',{className:'cms-film-language-label'},language==='zh'?'中文预览':'ENGLISH PREVIEW'),project);
  });
  return h('article',{className:'cms-preview cms-film-preview'},...languages);
}
