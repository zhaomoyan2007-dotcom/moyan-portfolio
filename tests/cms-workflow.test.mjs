import test from 'node:test';
import assert from 'node:assert/strict';
import {cmsConfiguration} from '../lib/cms-config.mjs';
const collections=cmsConfiguration({},true).config.collections;
const site=collections.find(c=>c.name==='settings').files.find(f=>f.name==='site');
const projects=collections.find(c=>c.name==='projects');
const inOrder=(fields,names)=>{
 const positions=names.map(name=>fields.findIndex(f=>f.name===name));
 assert.ok(positions.every(index=>index>=0),`Missing fields: ${names}`);
 assert.deepEqual(positions,[...positions].sort((a,b)=>a-b));
};
test('site editing follows the homepage and hides obsolete controls without removing their data slots',()=>{
 inOrder(site.fields,['hero','intro','selectedPreview','filmIntro','aboutPage']);
 for(const name of ['homePhotos','about','contactEmail','contactURL','contactLabel'])assert.equal(site.fields.find(f=>f.name===name)?.widget,'hidden',name);
 const about=site.fields.find(f=>f.name==='aboutPage').fields;
 inOrder(about,['introTitle','introSubtitle','introBlocks','capabilitiesHeading','capabilities','plansHeading','plans','cooperationHeading','cooperationLead','cooperation','contactsHeading','contacts']);
});
test('projects follow creation, images, credits, archive text, visibility and permanent ID order',()=>{
 inOrder(projects.fields,['category','title','cover','images','roles','concept','description','featured','status','id']);
 assert.deepEqual(projects.view_filters.filter(f=>f.field==='category').map(f=>f.pattern),['^documentary$','^contemporary$','^portrait$','^sports$','^aerial$','^nature$','^film$']);
 assert.equal(projects.fields.find(f=>f.name==='description').collapsed,true);
 assert.equal(projects.fields.find(f=>f.name==='id').widget,'project-id');
});
test('browser media entry does not expose server content validation',async()=>{
 const browser=await import('../public/media.mjs');
 const server=await import('../lib/content.mjs');
 assert.equal(browser.publicContent,undefined);
 for(const name of ['safeMediaURL','imageURL','galleryLayout','filmProjects','filmImages'])assert.equal(browser[name],server[name],name);
});
const h=(tag,props,...children)=>({tag,props,children:children.flat()});
const walk=node=>node&&typeof node==='object'?[node,...node.children.flatMap(walk)]:[];
test('film preview uses the public film structure, preserves all stills and omits removed labels',async()=>{
 const {filmPreview}=await import('../public/admin/film-preview.mjs');
 const tree=filmPreview({title:{zh:'中文',en:'English'},cover:'/assets/cover.webp',images:Array.from({length:14},(_,i)=>`/assets/${i}.webp`),roles:{zh:'摄影',en:'DP'},concept:{zh:'阐述正文',en:'Statement'}},h,x=>x);
 const nodes=walk(tree);
 assert.equal(nodes.filter(n=>n.props?.className==='film-project').length,2);
 const grids=nodes.filter(n=>n.props?.className==='film-stills');
 assert.equal(grids.length,2);assert.ok(grids.every(n=>n.children.length===14));
 assert.equal(nodes.filter(n=>n.props?.className==='film-details').length,2);
 assert.ok(!nodes.some(n=>n.tag==='h2'));
});
test('site preview covers all editable homepage areas in order, with no invented content',async()=>{
 const {sitePreview}=await import('../public/admin/site-preview.mjs');
 const tree=sitePreview({name:'墨岩',identity:{zh:'身份',en:'Identity'},hero:'/assets/hero.webp',selectedPreview:'/assets/theatre.webp',intro:{zh:'真实介绍',en:'Real intro'},filmIntro:{zh:'短片简介',en:'Film intro'},aboutPage:{}},h,x=>x,[]);
 const nodes=walk(tree);
 assert.deepEqual(nodes.filter(n=>n.props?.['data-preview-section']).map(n=>n.props['data-preview-section']),['opening','entrance','films','about','opening','entrance','films','about']);
 assert.equal(nodes.filter(n=>n.tag==='img'&&n.props.src==='/assets/hero.webp').length,2);
 assert.equal(nodes.filter(n=>n.tag==='img'&&n.props.src==='/assets/theatre.webp').length,2);
});

test('preview navigation stays inside the preview document and project links open the real website',async()=>{
 const {sitePreview}=await import('../public/admin/site-preview.mjs');
 const tree=sitePreview({aboutPage:{capabilities:[{title:{zh:'作品'},projectId:'real-project'}]}},h,x=>x,[{id:'real-project',title:{zh:'真实作品'}}]);
 const nodes=walk(tree);
 const buttons=nodes.filter(n=>n.tag==='button');assert.equal(buttons.length,4);
 let target='',scrolled=false;
 buttons[3].props.onClick({currentTarget:{ownerDocument:{getElementById:id=>{target=id;return {scrollIntoView(){scrolled=true;}};}}}});
 assert.equal(target,'preview-zh-about');assert.equal(scrolled,true);
 assert.ok(!nodes.some(n=>n.props?.href?.startsWith('#')));
 const link=nodes.find(n=>n.props?.href==='/#project/real-project');
 assert.equal(link.props.target,'_blank');assert.match(link.props.rel,/noopener/);
});

test('category control exposes only UI context and forwards normal select editing without changing content',async()=>{
 const {projectCategoryControl}=await import('../public/admin/project-category.mjs');
 const Select=()=>null;
 const control=projectCategoryControl(spec=>spec,h,Select);
 const onChange=()=>{};
 for(const category of ['film','portrait','sports','documentary']){
   const props={value:category,onChange,forID:'category-input'};
   const tree=control.render.call({props});
   assert.equal(tree.props['data-project-category'],category);
   assert.equal(tree.children[0].tag,Select);
   assert.equal(tree.children[0].props.onChange,onChange);
   assert.equal(tree.children[0].props.value,category);
 }
 assert.equal(projects.fields.find(f=>f.name==='category').widget,'project-category');
});
