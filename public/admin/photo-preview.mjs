export function photoPreview(data,h,getAsset,layout) {
 const raw=data.images||[];const images=Array.isArray(raw)?raw:typeof raw==='string'?[raw]:[];
 const grid=layout==='grid';
 return h('article',{className:`cms-preview cms-photo-preview ${grid?'cms-photo-grid':'cms-photo-carousel'}`},
  h('div',{className:'cms-photo-track'},...images.map((src,index)=>h('img',{key:index,src:String(getAsset(src)),alt:`${index+1}`}))));
}
