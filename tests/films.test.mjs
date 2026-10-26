import test from 'node:test';
import assert from 'node:assert/strict';
import {publicContent,filmProjects,filmImages} from '../lib/content.mjs';
import {cmsConfiguration} from '../lib/cms-config.mjs';
const site={name:'墨岩',hero:'/assets/a.webp',homePhotos:[]};
const film=(id,extra={})=>({id,status:'published',category:'film',title:{zh:'排版测试',en:'Layout test'},cover:'/assets/cover.webp',images:['/assets/one.webp'],...extra});
test('public films sort newest first across date precision, then year, with undated last',()=>{
 const records=[film('unknown'),film('old',{year:'2024'}),film('year',{year:'2026',order:0}),film('month',{projectDate:'2026-05'}),film('day',{projectDate:'2026-05-02',featured:false}),film('draft',{status:'draft',projectDate:'2027'}),{...film('photo'),category:'documentary'}];
 const projects=publicContent(site,records).projects, before=JSON.stringify(projects);
 assert.deepEqual(filmProjects(projects).map(p=>p.id),['day','month','year','old','unknown']);
 assert.equal(JSON.stringify(projects),before);
});
test('film dates reject invalid calendar dates but keep optional legacy year',()=>{
 for(const date of ['2026-02-30','2025-02-29','2026-00','2026-13','2026-1','0000','yesterday','2026-01-01T00:00:00Z'])assert.throws(()=>publicContent(site,[film('invalid',{projectDate:date})]),/日期/);
 for(const date of ['2024-02-29','2026','2026-10','2026-10-26',''])assert.equal(publicContent(site,[film('valid',{projectDate:date})]).projects[0].projectDate,date);
 assert.equal(publicContent(site,[film('legacy',{year:'2025'})]).projects[0].year,'2025');
});
test('same-date films sort by author order and id deterministically',()=>{
 assert.deepEqual(filmProjects(publicContent(site,[film('b',{year:'2026',order:2}),film('a',{year:'2026',order:1}),film('c',{year:'2026',order:2})]).projects).map(p=>p.id),['a','b','c']);
});
test('film cover is independent, repeated cover is omitted from stills, remaining order stays',()=>{
 const p=publicContent(site,[film('one',{images:['/assets/two.webp','/assets/cover.webp','/assets/one.webp'],roles:{zh:'摄影',en:'DP'},concept:{zh:'阐述',en:'Statement'}})]).projects[0];
 assert.deepEqual(filmImages(p),{cover:'/assets/cover.webp',stills:['/assets/two.webp','/assets/one.webp']});
 assert.deepEqual(p.roles,{zh:'摄影',en:'DP'});assert.deepEqual(p.concept,{zh:'阐述',en:'Statement'});
 assert.equal(publicContent(site,[film('cover-only',{images:[]})]).projects[0].images.length,0);
 assert.throws(()=>publicContent(site,[film('no-images',{cover:'',images:[]})]),/图片/);
 assert.throws(()=>publicContent(site,[{...film('photo',{images:[]}),category:'documentary'}]),/图片/);
});
test('CMS supports project date and independently editable cover, stills and bilingual credits',()=>{
 const fields=cmsConfiguration({},true).config.collections.find(c=>c.name==='projects').fields;
 assert.equal(fields.find(f=>f.name==='projectDate').required,false);
 const pattern=new RegExp(fields.find(f=>f.name==='projectDate').pattern[0]);assert.ok(pattern.test('2026-10-26'));assert.ok(pattern.test('2026'));assert.ok(!pattern.test('2026-13'));
 assert.equal(fields.find(f=>f.name==='images').required,false);
 for(const name of ['roles','concept'])assert.deepEqual(fields.find(f=>f.name===name).fields.map(f=>f.name),['zh','en']);
 assert.ok(fields.find(f=>f.name==='cover'));
});
import {createFilmProject,updateFilmLanguage} from '../public/films.mjs';
test('film renderer keeps title, date, cover, stills and bilingual details in reading order',()=>{
 class Element{
  constructor(tag){this.tag=tag;this.children=[];this.attributes={};this.textContent='';this.dataset={};this.naturalWidth=0;this.naturalHeight=0;}
  append(...children){for(const child of children){child.parentNode=this;this.children.push(child);}}
  remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(child=>child!==this);}
  setAttribute(key,value){this.attributes[key]=value;}
  addEventListener(){}
  get childElementCount(){return this.children.length;}
 }
 const previous=globalThis.document;globalThis.document={createElement:tag=>new Element(tag)};
 try{
  const p=publicContent(site,[film('renderer',{title:{zh:'中文标题',en:'English title'},projectDate:'2026-10',roles:{zh:'中文职责',en:'English contribution'},concept:{zh:'中文阐述',en:'English statement'}})]).projects[0];
  const makeImage=()=>{const img=new Element('img');img.naturalWidth=1600;img.naturalHeight=670;return img;};
  const render=language=>createFilmProject({project:p,images:filmImages(p),language,t:key=>key,makeImage});
  const zh=render('zh'),en=render('en');
  assert.deepEqual(zh.children.map(e=>e.className),['film-project-heading','film-cover','film-stills','film-details']);
  assert.equal(zh.children[0].children[0].textContent,'中文标题');assert.equal(en.children[0].children[0].textContent,'English title');
  assert.equal(zh.children[0].children[1].attributes.datetime,'2026-10');
  assert.equal(zh.children[1].children[0].width/zh.children[1].children[0].height,1600/670);
  assert.equal(en.children[3].children[0].children[0].textContent,'English contribution');
  assert.equal(en.children[3].children[1].children[0].textContent,'English statement');
  assert.ok(en.children[3].children.every(section=>section.childElementCount===1&&section.children[0].tag==='p'));
  const lead=zh.children[1].children[0];updateFilmLanguage(zh,'en',key=>key);
  assert.equal(zh.children[1].children[0],lead);assert.equal(zh.children[0].children[0].textContent,'English title');assert.match(lead.alt,/English title/);
  const empty=createFilmProject({project:{...p,roles:{},concept:{}},images:{cover:p.cover,stills:[]},language:'zh',t:key=>key,makeImage});
  assert.deepEqual(empty.children.map(e=>e.className),['film-project-heading','film-cover']);
 }finally{globalThis.document=previous;}
});
