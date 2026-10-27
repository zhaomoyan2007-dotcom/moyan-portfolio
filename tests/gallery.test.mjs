import test from 'node:test';import assert from 'node:assert/strict';
import {publicContent,galleryLayout} from '../lib/content.mjs';
const site={name:'墨岩',hero:'/assets/a.webp',homePhotos:[]};
const record=(category,subgroup='none',count=3)=>({id:category+'-'+subgroup,status:'published',title:{zh:'内部名称',en:'Internal'},category,subgroup,featured:true,images:Array(count).fill('/assets/a.webp')});
test('sports projects share the standard carousel regardless of legacy subgroup',()=>{
 assert.equal(galleryLayout('documentary'),'carousel');assert.equal(galleryLayout('contemporary'),'carousel');
 assert.equal(galleryLayout('sports','basketball'),'carousel');assert.equal(galleryLayout('sports','football'),'carousel');
 assert.equal(galleryLayout('aerial'),'grid');assert.equal(galleryLayout('nature'),'grid');
});
test('new categories and portrait/sport subgroups survive public export',()=>{
 const result=publicContent(site,[record('sports','basketball'),record('sports','football'),record('aerial'),record('nature'),record('portrait','studio')]);
 assert.equal(result.projects.length,5);assert.equal(result.projects.find(p=>p.id==='portrait-studio').subgroup,'studio');
 assert.equal(publicContent(site,[record('portrait')]).projects[0].subgroup,'environment');
});
test('sports accepts independent projects, arbitrary photo counts and legacy groups without losing content',()=>{
 const old=record('sports','basketball',2), second={...record('sports','basketball',12),id:'second-sports',order:1};
 const fresh={...record('sports','none',7),id:'new-sports',order:2};
 const result=publicContent(site,[fresh,second,old]).projects;
 assert.deepEqual(result.map(p=>p.id),[old.id,second.id,fresh.id]);
 assert.deepEqual(result.map(p=>p.images.length),[2,12,7]);
 assert.equal(result[0].subgroup,'basketball');
 assert.deepEqual(result[1].images,second.images);
 assert.equal(publicContent(site,[{...fresh,status:'draft'}]).projects.length,0);
});
test('homepage can publish with zero photos and no invented projects',()=>{
 const result=publicContent(site,[]);assert.deepEqual(result.site.homePhotos,[]);assert.deepEqual(result.projects,[]);
});
import {galleryPosition} from '../public/galleries.mjs';
test('carousel position follows actual variable-width image offsets',()=>{
 assert.equal(galleryPosition(0,[0,300,720]),0);assert.equal(galleryPosition(320,[0,300,720]),1);assert.equal(galleryPosition(700,[0,300,720]),2);assert.equal(galleryPosition(0,[]),0);
});

test('opening and selected entrance covers survive publishing without gallery projects',()=>{
 const result=publicContent({...site,hero:'/assets/opening.webp',selectedPreview:'/assets/entrance.webp'},[]);
 assert.equal(result.site.hero,'/assets/opening.webp');
 assert.equal(result.site.selectedPreview,'/assets/entrance.webp');
 assert.deepEqual(result.site.homePhotos,[]);assert.deepEqual(result.projects,[]);
});

import {photoPreview} from '../public/admin/photo-preview.mjs';
import {cmsConfiguration} from '../lib/cms-config.mjs';
test('admin preview follows grid or standard sports carousel without dropping photos',()=>{
 const h=(tag,props,...children)=>({tag,props,children});
 for(const category of ['aerial','nature','sports']){
  const data=record(category,'basketball',12);const preview=photoPreview(data,h,x=>x,galleryLayout(data.category,data.subgroup));
  assert.match(preview.props.className,category==='sports'?/cms-photo-carousel/:/cms-photo-grid/);
  assert.equal(preview.children[0].children.length,12);
  assert.deepEqual(preview.children[0].children.map(e=>e.props.src),data.images);
 }
 const field=cmsConfiguration({},true).config.collections.find(c=>c.name==='projects').fields.find(f=>f.name==='subgroup');
 assert.match(field.hint,/仅人像/);assert.doesNotMatch(field.hint,/恰好3|必须选篮球/);
});
