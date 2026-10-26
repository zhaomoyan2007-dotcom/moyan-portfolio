import {filmImages} from '../media.mjs';
export function filmPreview(data,h,getAsset) {
  const {cover,stills}=filmImages(data);
  return h('article',{className:'cms-preview cms-film-preview'},...['zh','en'].map(language=>h('section',{key:language,lang:language,className:'cms-film-language'},
    h('p',{className:'cms-film-language-label'},language==='zh'?'中文预览':'English preview'),
    h('h1',{},data.title?.[language]||''),
    h('p',{className:'cms-film-date'},data.projectDate||data.year||''),
    ...(cover?[h('img',{className:'cms-film-cover',src:String(getAsset(cover)),alt:language==='zh'?'短片首图':'Key frame'})]:[]),
    h('div',{className:'cms-film-stills'},...stills.map((src,index)=>h('img',{key:index,src:String(getAsset(src)),alt:`${language==='zh'?'切片':'Still'} ${index+1}`}))),
    ...[['roles',language==='zh'?'个人职责':'CONTRIBUTIONS'],['concept',language==='zh'?'创作阐述':'CREATIVE STATEMENT']].flatMap(([key,label])=>data[key]?.[language]?[h('h2',{key:key+'-label'},label),h('p',{key},data[key][language])]:[])
  )));
}
