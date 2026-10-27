// Website and CMS share this composition; personal copy comes only from editable content.
export function aboutContent(h,site,language='zh',projects=[],resolveImage=src=>src) {
  const page=site.aboutPage||{};
  const text=value=>typeof value?.[language]==='string'?value[language]:'';
  const el=(tag,className,...children)=>h(tag,{className},...children);
  const items=field=>(Array.isArray(page[field])?page[field]:[]).filter(item=>text(item.title).trim()||text(item.body).trim());
  const notes=field=>items(field).map(item=>el('div','about-note',text(item.title)?el('h4','',text(item.title)):null,text(item.body)?el('p','',text(item.body)):null));
  const evidence=item=>{
    const project=projects.find(project=>project.id===item.projectId&&/^[A-Za-z0-9_-]+$/.test(project.id));
    if(!project)return null;
    const title=text(project.title);if(!title)return null;
    return h('a',{className:'about-evidence','data-project':project.id,href:`#project/${project.id}`},
      project.cover?h('img',{src:resolveImage(project.cover),alt:'',loading:'lazy',width:600,height:400}):null,
      el('span','about-evidence-caption',title,el('span','about-link-arrow','↗')));
  };
  const contact=[];
  if(/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(site.contactEmail||''))contact.push(h('a',{className:'about-contact-action',href:`mailto:${site.contactEmail}`},site.contactEmail,el('span','','↗')));
  try{const url=new URL(site.contactURL);if(url.protocol==='https:'&&!url.username&&!url.password)contact.push(h('a',{className:'about-contact-action',href:url.href,target:'_blank',rel:'noopener noreferrer'},text(site.contactLabel)||url.hostname,el('span','','↗')));}catch{}
  return el('div','about-composition about-editorial',
    el('header','about-intro',
      el('h2','about-intro-title',text(page.introTitle)||(language==='zh'?'关于我':'About me')),
      el('p','about-intro-subtitle',text(page.introSubtitle)||(language==='zh'?'ABOUT ME':'关于我')),
      el('div','about-intro-blocks',...(Array.isArray(page.introBlocks)?page.introBlocks:[])
        .filter(item=>text(item.text).trim()).map(item=>el('p','about-intro-text',text(item.text))))),
    items('capabilities').length?el('section','about-practice',
      text(page.capabilitiesHeading)?el('h3','about-section-title',text(page.capabilitiesHeading)):null,
      ...items('capabilities').map((item,index)=>el('div','about-practice-row',
        el('span','about-index',String(index+1).padStart(2,'0')),
        el('div','about-practice-copy',text(item.title)?el('h4','',text(item.title)):null,text(item.body)?el('p','',text(item.body)):null),evidence(item)))):null,
    items('plans').length?el('section','about-future',
      text(page.plansHeading)?el('h3','about-major-title',text(page.plansHeading)):null,
      el('div','about-future-notes',...notes('plans'))):null,
    items('cooperation').length||contact.length||text(page.cooperationHeading)?h('section',{className:'about-collaborate',id:'collaborate',tabindex:'-1'},
      ...['top','bottom','left','right'].map(side=>h('span',{className:`film-perforation film-perforation-${side}`,'aria-hidden':'true'})),
      h('span',{className:'film-edge-mark','aria-hidden':'true'},'BFA / MOYAN'),
      el('div','about-cooperation-heading',text(page.cooperationHeading)?el('h3','about-major-title',text(page.cooperationHeading)):null,
        text(page.cooperationLead)?el('p','about-cooperation-lead',text(page.cooperationLead)):null,
        text(page.contactNote)?el('p','about-contact-note',text(page.contactNote)):null,
        contact.length?el('div','about-contact-actions',...contact):null),
      el('div','about-cooperation-notes',...notes('cooperation'))):null);
}
