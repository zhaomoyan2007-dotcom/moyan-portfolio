import test from 'node:test';import assert from 'node:assert/strict';
import {publicContent,galleryLayout} from '../lib/content.mjs';
const site={name:'墨岩',hero:'/assets/a.webp',homePhotos:[]};
const record=(category,subgroup='none',count=3)=>({id:category+'-'+subgroup,status:'published',title:{zh:'内部名称',en:'Internal'},category,subgroup,featured:true,images:Array(count).fill('/assets/a.webp')});
test('gallery layout uses category and subgroup, football always scrolls',()=>{
 assert.equal(galleryLayout('documentary'),'carousel');assert.equal(galleryLayout('contemporary'),'carousel');
 assert.equal(galleryLayout('sports','basketball'),'fixed');assert.equal(galleryLayout('sports','football'),'football');
 assert.equal(galleryLayout('aerial'),'grid');assert.equal(galleryLayout('nature'),'grid');
});
test('new categories and portrait/sport subgroups survive public export',()=>{
 const result=publicContent(site,[record('sports','basketball'),record('sports','football'),record('aerial'),record('nature'),record('portrait','studio')]);
 assert.equal(result.projects.length,5);assert.equal(result.projects.find(p=>p.id==='portrait-studio').subgroup,'studio');
 assert.equal(publicContent(site,[record('portrait')]).projects[0].subgroup,'environment');
});
test('featured basketball and football require exactly three photos and one group each',()=>{
 assert.throws(()=>publicContent(site,[record('sports','basketball',2)]),/3/);
 assert.throws(()=>publicContent(site,[record('sports','football',4)]),/3/);
 assert.throws(()=>publicContent(site,[record('sports')]),/分组/);
 assert.throws(()=>publicContent(site,[record('sports','basketball'),{...record('sports','basketball'),id:'another'}]),/重复|一组/);
 assert.equal(publicContent(site,[{...record('sports','football',20),featured:false}]).projects[0].images.length,20);
 assert.equal(publicContent(site,[{...record('sports'),status:'draft'}]).projects.length,0);
});
test('homepage can publish with zero photos and no invented projects',()=>{
 const result=publicContent(site,[]);assert.deepEqual(result.site.homePhotos,[]);assert.deepEqual(result.projects,[]);
});
import {galleryPosition} from '../public/galleries.mjs';
test('carousel position follows actual variable-width image offsets',()=>{
 assert.equal(galleryPosition(0,[0,300,720]),0);assert.equal(galleryPosition(320,[0,300,720]),1);assert.equal(galleryPosition(700,[0,300,720]),2);assert.equal(galleryPosition(0,[]),0);
});
