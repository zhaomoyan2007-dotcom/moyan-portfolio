import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const template=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
const data={site:{name:'墨岩',hero:'https://res.cloudinary.com/test/image/upload/v1/opening.webp',selectedPreview:'/uploads/theatre.webp',identity:{zh:'静态影像与短片创作'},intro:{zh:'第一段\n\n第二段'}},projects:[],build:{revision:'test'}};

test('source template never requests obsolete test photos before content initializes',()=>{
 assert.doesNotMatch(template,/selected-photos\/01-|墨岩的测试照片|透过粉色窗帘/);
});
test('first HTML response already contains the published opening image and biography',async()=>{
 const {renderDocument}=await import('../lib/page.mjs');
 const html=renderDocument(template,data);
 const hero=html.match(/<img\b[^>]*data-site-image="hero"[^>]*>/)?.[0];
 assert.match(hero,/src="https:\/\/res\.cloudinary\.com\/test\/image\/upload\/f_auto,q_auto,w_1800,c_limit\/v1\/opening.webp"/);
 assert.doesNotMatch(hero,/srcset|width="2536"|selected-photos/);
 assert.match(html,/<p>第一段<\/p><p>第二段<\/p>/);
 assert.match(html,/静态影像与短片创作/);
 assert.match(html,/<link rel="preload" as="image"[^>]*opening.webp/);
 assert.match(html,/<img\b[^>]*data-site-image="selectedPreview"[^>]*src="\/uploads\/theatre.webp"/);
 assert.deepEqual(JSON.parse(html.match(/<script id="portfolio-data" type="application\/json">([\s\S]*?)<\/script>/)[1]),data);
});
test('initial content cannot escape HTML attributes or the JSON script element',async()=>{
 const {renderDocument}=await import('../lib/page.mjs');
 const hostile={...data,site:{...data.site,name:'<script>bad()</script>&"',intro:{zh:'</script><img src=x onerror=bad()>\u2028\u2029'}}};
 const html=renderDocument(template,hostile);
 assert.doesNotMatch(html,/<script>bad|<img src=x/);
 const json=html.match(/<script id="portfolio-data" type="application\/json">([\s\S]*?)<\/script>/)[1];
 assert.doesNotMatch(json,/[<\u2028\u2029]/);
 assert.deepEqual(JSON.parse(json),hostile);
});
test('startup uses the embedded publication without waiting for a second content request',async()=>{
 const {loadPortfolio}=await import('../public/bootstrap.mjs');
 let requests=0;
 const result=await loadPortfolio({document:{getElementById:()=>({textContent:JSON.stringify(data)})},fetch:async()=>{requests++;throw Error('Simulated slow/offline content request');}});
 assert.deepEqual(result,data);assert.equal(requests,0);
});
test('unbuilt or malformed bootstrap falls back to the current content endpoint and reports failure',async()=>{
 const {loadPortfolio}=await import('../public/bootstrap.mjs');
 for(const text of [null,'{invalid','{}']){
  let requests=0;
  assert.deepEqual(await loadPortfolio({document:{getElementById:()=>text===null?null:{textContent:text}},fetch:async url=>{assert.equal(url,'/content.json');requests++;return {ok:true,json:async()=>data};}}),data);
  assert.equal(requests,1);
 }
 await assert.rejects(()=>loadPortfolio({document:{getElementById:()=>null},fetch:async()=>({ok:false})}),/Content unavailable/);
});
