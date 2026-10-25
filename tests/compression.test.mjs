import test from 'node:test';
import assert from 'node:assert/strict';
import { scaledSize, validateSource, compressImage } from '../public/admin/compress.mjs';
import { uploadCookie, verifyUploadCookie, uploadTicket } from '../lib/cloud-upload.mjs';
test('scale preserves aspect, does not upscale and validates dimensions',()=>{
  assert.deepEqual(scaledSize(6000,4000),{width:3000,height:2000});
  assert.deepEqual(scaledSize(1000,2000),{width:1000,height:2000});
  assert.deepEqual(scaledSize(4000,6000),{width:2000,height:3000});
  assert.throws(()=>scaledSize(0,100));assert.deepEqual(scaledSize(10000,10000),{width:3000,height:3000});
});
test('reject unsupported and oversized input, identify actual image bytes',async()=>{
  await assert.rejects(validateSource(new File(['bad'],'a.jpg',{type:'image/jpeg'})));
  await assert.rejects(validateSource(new File(['GIF89a'],'a.gif',{type:'image/gif'})));
  await assert.rejects(validateSource({size:101*1024*1024}));
  assert.equal(await validateSource(new File([new Uint8Array([255,216,255,224])],'a.jpg')),'image/jpeg');
});
test('compression retries size and quality, releases bitmap, does not silently exceed target',async()=>{
  let closed=false,calls=0;const bitmap={width:3000,height:2000,close(){closed=true;}};
  const output=await compressImage(new File([new Uint8Array([255,216,255,192,0,17,8,15,160,23,112,3,1,17,0,2,17,0,3,17,0,255,217])],'large.jpg'),{
    decode:async()=>bitmap,encode:async(w,h,q)=>{calls++;return new Blob([new Uint8Array(q>.7?5*1024*1024:500000)],{type:'image/webp'});}
  });
  assert.ok(calls>1);assert.ok(closed);assert.equal(output.file.type,'image/webp');assert.equal(output.width,3000);assert.ok(output.file.size<4*1024*1024);
});
test('owner upload session expiry and tampering rejected',()=>{
  const secret='test-signing-key-'.repeat(3);const cookie=uploadCookie('owner',secret,100);
  assert.equal(verifyUploadCookie(cookie.split(';')[0],'owner',secret,101),true);
  assert.throws(()=>verifyUploadCookie(cookie.split(';')[0],'other',secret,101));
  assert.throws(()=>verifyUploadCookie(cookie.split(';')[0],'owner',secret,3701));
  assert.throws(()=>verifyUploadCookie(cookie.replace('=','=x'),'owner',secret,101));
});
test('ticket fixes destination and signed parameters, no secret in payload',()=>{
  const t=uploadTicket({CLOUDINARY_CLOUD_NAME:'test-cloud',CLOUDINARY_API_KEY:'123',CLOUDINARY_API_SECRET:'private-test-secret'},100);
  assert.equal(t.endpoint,'https://api.cloudinary.com/v1_1/test-cloud/image/upload');
  assert.equal(t.params.overwrite,'false');assert.equal(t.params.allowed_formats,'webp');
  assert.equal(t.signature.length,64);assert.ok(!JSON.stringify(t).includes('private-test-secret'));
});
import handler from '../api/upload-sign.js';
test('signing endpoint rejects cross-origin and missing/expired sessions, does not accept user parameters',()=>{
  const old={...process.env};Object.assign(process.env,{SITE_URL:'https://portfolio.example',GITHUB_CLIENT_ID:'test',GITHUB_CLIENT_SECRET:'test',OAUTH_STATE_SECRET:'test-session-key'.repeat(3),GITHUB_OWNER:'owner',CLOUDINARY_CLOUD_NAME:'test-cloud',CLOUDINARY_API_KEY:'123',CLOUDINARY_API_SECRET:'private-test-secret'});
  const run=(headers,method='POST')=>{const res={code:0,setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;}};handler({headers,method,body:{public_id:'attacker'}},res);return res;};
  try{
    assert.equal(run({origin:'https://other.example'}).code,403);
    assert.equal(run({origin:'https://portfolio.example'}).code,401);
    assert.equal(run({},'GET').code,405);
    const r=run({origin:'https://portfolio.example',cookie:uploadCookie('owner',process.env.OAUTH_STATE_SECRET).split(';')[0]});
    assert.equal(r.code,200);assert.notEqual(r.body.params.public_id,'attacker');
    delete process.env.CLOUDINARY_API_SECRET;
    assert.equal(run({origin:'https://portfolio.example',cookie:uploadCookie('owner',process.env.OAUTH_STATE_SECRET).split(';')[0]}).code,503);
  }finally{for(const key of Object.keys(process.env))if(!(key in old))delete process.env[key];Object.assign(process.env,old);}
});
import {uploadedUrls} from '../public/admin/cloud-media.mjs';
test('failed files retain selected order when a retry succeeds',()=>{
  const jobs=[{}, {url:'B'}, {url:'C'}];assert.deepEqual(uploadedUrls(jobs),['B','C']);
  jobs[0].url='A';assert.deepEqual(uploadedUrls(jobs),['A','B','C']);
});
import {cmsConfiguration} from '../lib/cms-config.mjs';
test('CMS exposes public cloud settings but never the signing secret',()=>{
  const {config}=cmsConfiguration({CLOUDINARY_CLOUD_NAME:'test-cloud',CLOUDINARY_API_KEY:'123',CLOUDINARY_API_SECRET:'never-public-secret'});
  assert.equal(config.media_library.name,'moyan-cloud-images');assert.ok(!JSON.stringify(config).includes('never-public-secret'));
});
