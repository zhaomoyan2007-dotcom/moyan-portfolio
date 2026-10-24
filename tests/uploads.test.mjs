import test from 'node:test';
import assert from 'node:assert/strict';
import { validateUpload, localRequestAllowed } from '../lib/local-upload.mjs';
import { cmsConfiguration } from '../lib/cms-config.mjs';
test('local upload validates file bytes, extension and size before writing',()=>{
  const png=Buffer.from([137,80,78,71,13,10,26,10,0]);
  assert.equal(validateUpload('photo.png',png),'.png');
  assert.throws(()=>validateUpload('photo.webp',png));
  assert.throws(()=>validateUpload('../secret.png',png));
  assert.throws(()=>validateUpload('photo.svg',Buffer.from('<svg/>')));
  assert.throws(()=>validateUpload('photo.png',Buffer.alloc(20*1024*1024+1)));
});
test('local upload accepts only same-origin local browser requests with a custom header',()=>{
  const good={host:'localhost:4319',origin:'http://localhost:4319','x-moyan-upload':'1'};
  assert.equal(localRequestAllowed(good,4319),true);
  assert.equal(localRequestAllowed({...good,origin:'https://evil.test'},4319),false);
  assert.equal(localRequestAllowed({...good,'x-moyan-upload':undefined},4319),false);
});
test('only local builds enable local backend and local image library',()=>{
  const local=cmsConfiguration({},true);
  assert.equal(local.config.media_library.name,'local-images');
  const prod=cmsConfiguration({},false);
  assert.equal(prod.config.local_backend,undefined);
  assert.equal(prod.configured,false);
  assert.equal(prod.config.publish_mode,'editorial_workflow');
  assert.equal(local.config.publish_mode,'simple');
  assert.equal(cmsConfiguration({GITHUB_REPOSITORY:'owner/site',SITE_URL:'https://example.com'},false).configured,false);
});
