import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {copy} from '../public/copy.js';

test('selected entrance offers bilingual direct routes after the biography',async()=>{
 const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
 const hero=html.split('<section class="hero image-panel"')[1].split('</section>')[0];
 const selected=html.split('<section id="selected"')[1].split('</section>')[0];
 assert.doesNotMatch(hero,/data-i18n="enterSelected"/);
 assert.match(selected,/href="#photography"[^>]*data-i18n="stillImages"/);
 assert.match(selected,/href="#cinematography"[^>]*data-i18n="filmCreation"/);
 assert.equal(copy.zh.exploreSelected,'探索精选作品集');
 assert.equal(copy.zh.stillImages,'静态影像');assert.equal(copy.zh.filmCreation,'短片创作');
 assert.ok(copy.en.exploreSelected&&copy.en.stillImages&&copy.en.filmCreation);
 assert.match(selected,/data-site-image="selectedPreview"/);
});
