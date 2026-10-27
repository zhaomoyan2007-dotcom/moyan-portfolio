import {aboutContent} from '../about.mjs';

// Field order and preview order mirror the homepage; no sample copy is injected.
export function sitePreview(data,h,getAsset,projects=[]) {
  const previewElement=(tag,props,...children)=>{
    if(tag==='a'&&props?.href?.startsWith('#project/'))props={...props,href:`/${props.href}`,target:'_blank',rel:'noopener noreferrer'};
    return h(tag,props,...children);
  };
  const image=(src,className)=>typeof src==='string'&&src?h('img',{className,src:String(getAsset(src)),alt:''}):null;
  return h('article',{className:'cms-site-preview cms-about-preview'},
    h('nav',{className:'cms-preview-navigation','aria-label':'预览区域'},
      ...[['opening','开场'],['entrance','剧场入口'],['films','短片简介'],['about','关于与合作']].map(([key,label])=>h('button',{key,type:'button',onClick:event=>event.currentTarget.ownerDocument.getElementById(`preview-zh-${key}`)?.scrollIntoView({block:'start'})},label))),
    ...['zh','en'].map(language=>{
      const text=value=>value?.[language]||'';
      const section=(key,...children)=>h('section',{key,id:`preview-${language}-${key}`,'data-preview-section':key,className:'cms-site-section'},...children);
      return h('section',{key:language,lang:language==='zh'?'zh-CN':'en',className:'cms-site-language'},
        h('p',{className:'cms-film-language-label'},language==='zh'?'中文预览':'ENGLISH PREVIEW'),
        section('opening',image(data.hero,'cms-opening-image'),h('h1',{},data.name||''),h('p',{},text(data.identity)),h('p',{},text(data.intro)||text(data.about))),
        section('entrance',h('h2',{},language==='zh'?'剧场入口':'Selected works entrance'),image(data.selectedPreview||data.hero,'cms-entrance-image')),
        section('films',h('h2',{},language==='zh'?'短片创作':'Short films'),h('p',{},text(data.filmIntro))),
        section('about',aboutContent(previewElement,data,language,projects,src=>String(getAsset(src)))));
    }));
}
