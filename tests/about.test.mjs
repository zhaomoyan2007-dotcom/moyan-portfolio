import test from 'node:test';
import assert from 'node:assert/strict';
import {aboutContent} from '../public/about.mjs';
import {archiveFilterGroups} from '../public/archive-filters.mjs';
import {publicContent} from '../lib/content.mjs';
import {cmsConfiguration} from '../lib/cms-config.mjs';
const pair=(zh,en)=>({zh,en});
const page={introTitle:pair('关于我','About me'),introSubtitle:pair('ABOUT ME','关于我'),introBlocks:[{text:pair('身份第一行\n第二行','Identity line one\nLine two')},{text:pair('工作坊经历','Workshop experience')}],heading:pair('观看','Seeing'),capabilitiesHeading:pair('能力','Practice'),capabilities:[{title:pair('摄影','Photography'),body:pair('拍摄','Capture')},{title:pair('剪辑','Editing'),body:pair('节奏','Rhythm')}],cooperation:[],plans:[]};
const h=(tag,props,...children)=>({tag,...props,children:children.flat().filter(c=>c!=null)});
const flatten=value=>typeof value==='string'?value:Array.isArray(value)?value.map(flatten).join(' '):flatten(value?.children||[]);
test('about export preserves editable bilingual headings, ordered entries and optional old content',()=>{
 const site={name:'墨岩',hero:'/assets/test.webp',aboutPage:page};
 const result=publicContent(site,[]).site.aboutPage;
 assert.deepEqual(result.capabilities,page.capabilities);
 assert.deepEqual(result.heading,page.heading);
 assert.deepEqual(result.introBlocks,page.introBlocks);
 assert.deepEqual(publicContent({...site,aboutPage:undefined},[]).site.aboutPage.capabilities,[]);
 assert.throws(()=>publicContent({...site,aboutPage:{capabilities:'bad'}},[]),/关于/);
 assert.throws(()=>publicContent({...site,aboutPage:{plans:Array(31).fill({})}},[]),/关于/);
});
test('shared website and CMS about composition uses selected language, omits empty entries and respects order',()=>{
 const data={about:pair('个人简介','Biography'),aboutPage:page};
 const zh=flatten(aboutContent(h,data,'zh')),en=flatten(aboutContent(h,data,'en'));
 assert.match(zh,/关于我[\s\S]*身份第一行[\s\S]*工作坊经历[\s\S]*能力.*摄影.*剪辑/);
 assert.match(en,/About me[\s\S]*Identity line one[\s\S]*Workshop experience[\s\S]*Practice.*Photography.*Editing/);
 assert.doesNotMatch(en,/观看|摄影|undefined|Biography|Seeing/);
 assert.doesNotMatch(zh,/个人简介|观看/);
 assert.equal(aboutContent(h,{aboutPage:{capabilities:[{title:{},body:{}}]}},'zh').children.length,1);
});
test('CMS exposes all about headings and arbitrary ordered bilingual lists',()=>{
 const site=cmsConfiguration({},true).config.collections[0].files[0];
 const fields=site.fields.find(f=>f.name==='aboutPage').fields;
 for(const name of ['capabilities','cooperation','plans']){
  const field=fields.find(f=>f.name===name);assert.equal(field.widget,'list');assert.equal(field.max,undefined);
  assert.deepEqual(field.fields.filter(f=>f.name!=='projectId').map(f=>f.name),['title','body']);
  if(name==='capabilities')assert.equal(field.fields.find(f=>f.name==='projectId').widget,'relation');
  assert.ok(field.fields.filter(f=>f.name!=='projectId').every(f=>f.fields.map(v=>v.name).join(',')==='zh,en'));
  assert.ok(fields.find(f=>f.name===`${name}Heading`));
 }
});
test('archive keeps type filters and photography subcategories in distinct groups',()=>{
 assert.deepEqual(archiveFilterGroups('film'),[['all','art','film']]);
 for(const filter of ['all','art','sports']){
  const groups=archiveFilterGroups(filter);assert.equal(groups.length,2);
  assert.deepEqual(groups[0],['all','art','film']);assert.ok(groups[1].includes('sports'));
  assert.ok(!groups[1].some(key=>groups[0].includes(key)));
 }
});

test('creator profile keeps editable positioning, current directions and project references',()=>{
 const aboutPage={...page,profileLine:pair('摄影创作者','Image maker'),directionsHeading:pair('正在关注','Current focus'),directions:[{title:pair('静态','Still'),body:pair('日常','Everyday')}],capabilities:[{...page.capabilities[0],projectId:'real-work'}],cooperationLead:pair('摄影与短片合作','Collaborate'),contactNote:pair('按项目沟通','Discuss each project')};
 const result=publicContent({name:'墨岩',hero:'/assets/test.webp',aboutPage},[]).site.aboutPage;
 assert.deepEqual(result.profileLine,aboutPage.profileLine);assert.deepEqual(result.directions,aboutPage.directions);
 assert.equal(result.capabilities[0].projectId,'real-work');assert.deepEqual(result.cooperationLead,aboutPage.cooperationLead);
});
test('evidence only links available projects and contacts never create unsafe or empty buttons',()=>{
 const data={name:'墨岩',aboutPage:{...page,capabilities:[{...page.capabilities[0],projectId:'published'},{...page.capabilities[1],projectId:'missing'}]},contactURL:'javascript:alert(1)'};
 const projects=[{id:'published',title:pair('真实作品','Real work'),cover:'/assets/work.webp'}];
 const tree=aboutContent(h,data,'en',projects),links=[];
 const visit=v=>{if(!v||typeof v!=='object')return;if(v.tag==='a')links.push(v);(v.children||[]).forEach(visit);};visit(tree);
 assert.ok(links.some(link=>link.href==='#project/published'));assert.ok(links.every(link=>!link.href?.includes('missing')&&!link.href?.startsWith('javascript:')));
 assert.match(flatten(tree),/Real work/);assert.doesNotMatch(flatten(tree),/真实作品/);
});

test('intro CMS uses independently editable bilingual multiline blocks and skips blank entries',()=>{
 const fields=cmsConfiguration({},true).config.collections[0].files[0].fields.find(f=>f.name==='aboutPage').fields;
 const blocks=fields.find(f=>f.name==='introBlocks');assert.equal(blocks.widget,'list');
 assert.ok(blocks.fields[0].fields.every(field=>field.widget==='text'&&!field.required));
 const tree=aboutContent(h,{aboutPage:{introBlocks:[{text:pair('一\n二','One\nTwo')},{text:pair('','')},{text:pair('三','Three')}]}});
 const intro=tree.children[0];assert.equal(intro.children[2].children.length,2);
 assert.equal(intro.children[2].children[0].children[0],'一\n二');
 assert.throws(()=>publicContent({name:'墨岩',hero:'/assets/test.webp',aboutPage:{introBlocks:'bad'}},[]),/关于/);
});

test('about omits current focus, places long-term goals before cooperation and provides a focusable cooperation target',()=>{
 const data={aboutPage:{...page,directions:[{title:pair('旧关注','Old focus'),body:{}}],plansHeading:pair('远期目标','Long-term goals'),plans:[{title:pair('未来方向','Future direction'),body:{}}],cooperationHeading:pair('与我合作','Work with me'),cooperationLead:pair('期待创作','Create together'),cooperation:[{title:pair('摄影合作','Photography'),body:{}}]}};
 for(const lang of ['zh','en']){
  const tree=aboutContent(h,data,lang),classes=tree.children.map(v=>v.className);
  assert.deepEqual(classes,['about-intro','about-practice','about-future','about-collaborate']);
  assert.doesNotMatch(flatten(tree),/旧关注|Old focus/);
  const cooperation=tree.children.at(-1);assert.equal(cooperation.id,'collaborate');assert.equal(cooperation.tabindex,'-1');
  const heading=cooperation.children.find(v=>v.className==='about-cooperation-heading').children[0];
  assert.equal(heading.tag,'h3');assert.equal(heading.className,'about-major-title');
 }
});

test('cooperation contacts preserve order, support editable labels and never render unsafe actions or removed notes',()=>{
 const contacts=[{label:pair('微信','WeChat'),value:'sample-handle',url:''},{label:pair('作品邮箱','Email'),value:'artist@example.com',url:'mailto:artist@example.com'},{label:pair('无效链接','Invalid link'),value:'plain text',url:'javascript:alert(1)'},{label:pair('空项','Empty'),value:'',url:''}];
 const site={name:'墨岩',hero:'/assets/test.webp',aboutPage:{...page,cooperationHeading:pair('与我合作','Work with me'),contactNote:pair('删除说明','Removed note'),contactsHeading:pair('联系方式','Contact'),contacts}};
 const exported=publicContent(site,[]).site.aboutPage;
 assert.deepEqual(exported.contacts,contacts);assert.equal(exported.contactNote,undefined);
 for(const language of ['zh','en']){
  const tree=aboutContent(h,site,language),text=flatten(tree),links=[];
  const walk=n=>{if(!n||typeof n!=='object')return;if(n.tag==='a')links.push(n);(n.children||[]).forEach(walk);};walk(tree);
  assert.match(text,/sample-handle.*artist@example.com.*plain text/);assert.doesNotMatch(text,/删除说明|Removed note|空项|Empty/);
  assert.ok(links.some(v=>v.href==='mailto:artist@example.com'));assert.ok(links.every(v=>!v.href.startsWith('javascript:')));
 }
 const fields=cmsConfiguration({},true).config.collections[0].files[0].fields.find(f=>f.name==='aboutPage').fields;
 assert.ok(!fields.some(f=>f.name==='contactNote'));assert.equal(fields.find(f=>f.name==='contacts').widget,'list');
 assert.deepEqual(fields.find(f=>f.name==='contacts').fields.map(f=>f.name),['label','value','url']);
});

test('contacts alone keep the cooperation area visible and malformed contact lists fail explicitly',()=>{
 const contacts=[{label:pair('微信','WeChat'),value:'sample-handle',url:''}];
 const tree=aboutContent(h,{aboutPage:{contacts}},'en');assert.match(flatten(tree),/Contact.*WeChat.*sample-handle/);
 for(const value of ['bad',Array(31).fill({})])assert.throws(()=>publicContent({name:'墨岩',hero:'/assets/test.webp',aboutPage:{contacts:value}},[]),/联系方式/);
});

test('intro emphasis supports editable bold spans without treating text as HTML or changing line breaks',()=>{
 const value='普通 **关键能力**\n<script>alert(1)</script> 与 **核心软件**';
 const tree=aboutContent(h,{aboutPage:{introBlocks:[{text:pair(value,'Plain **Key skill**')}]}});
 const p=tree.children[0].children[2].children[0];
 assert.deepEqual(p.children.filter(n=>n?.tag==='strong').map(flatten),['关键能力','核心软件']);
 assert.ok(p.children.some(n=>typeof n==='string'&&n.includes('\n<script>')));
 assert.equal(flatten(p).replaceAll(' ',''),value.replaceAll('**','').replaceAll(' ',''));
});
