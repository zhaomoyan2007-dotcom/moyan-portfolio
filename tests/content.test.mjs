import test from 'node:test';
import assert from 'node:assert/strict';
import { publicContent, imageURL, safeMediaURL } from '../lib/content.mjs';

const project = (id, status = 'published', order = 0) => ({
  id, status, order, category: 'contemporary', featured: true,
  title: { zh: '测试', en: 'Test' }, description: { zh: '', en: '' },
  images: ['/assets/test.webp'], cover: '/assets/test.webp'
});
const site = { name: '墨岩', homePhotos: ['/assets/test.webp'], hero: '/assets/test.webp' };

test('public export excludes drafts and unpublished projects and sorts published projects', () => {
  const result = publicContent(site, [project('draft', 'draft'), project('last', 'published', 2), project('first', 'published', 1)]);
  assert.deepEqual(result.projects.map(p => p.id), ['first', 'last']);
  assert.equal(JSON.stringify(result).includes('draft'), false);
});
test('a failed content validation stops publishing instead of silently losing work', () => {
  assert.throws(() => publicContent(site, [project('same'), project('same')]), /重复|duplicate/);
  assert.throws(() => publicContent(site, [{ ...project('bad'), images: ['javascript:alert(1)'] }]), /图片|image|URL/);
});
test('500 images preserve order and can move between draft and published', () => {
  const p = { ...project('large'), images: Array.from({length:500}, (_,i) => `/uploads/photo-${i}.webp`) };
  assert.equal(publicContent(site, [p]).projects[0].images.length, 500);
  assert.equal(publicContent(site, [{ ...p, status: 'draft' }]).projects.length, 0);
});
test('media URLs reject scripting, traversal, SVG uploads and insecure remote sources', () => {
  for (const url of ['javascript:alert(1)', '//evil.test/a.jpg', '/uploads/../secret.jpg', '/uploads/a.svg', 'http://example.com/a.jpg']) {
    assert.equal(safeMediaURL(url), false, url);
  }
  assert.equal(safeMediaURL('/assets/test.webp'), true);
  assert.equal(safeMediaURL('https://res.cloudinary.com/demo/image/upload/v1/photo.jpg'), true);
});
test('Cloudinary optimization only transforms image upload URLs and preserves local paths', () => {
  assert.equal(imageURL('/assets/test.webp', 900), '/assets/test.webp');
  assert.match(imageURL('https://res.cloudinary.com/demo/image/upload/v1/a.jpg', 900), /image\/upload\/f_auto,q_auto,w_900,c_limit\/v1\/a.jpg/);
  assert.equal(imageURL('https://example.com/photo.jpg', 900), 'https://example.com/photo.jpg');
});
test('single-image media library results normalize consistently for gallery and cover fields',()=>{
  const p={...project('single'),images:'/assets/test.webp',cover:['/assets/test.webp']};
  const result=publicContent({...site,hero:['/assets/test.webp']},[p]);
  assert.deepEqual(result.projects[0].images,['/assets/test.webp']);
  assert.equal(result.projects[0].cover,'/assets/test.webp');
  assert.equal(result.site.hero,'/assets/test.webp');
});
