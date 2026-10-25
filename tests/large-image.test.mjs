import test from 'node:test';import assert from 'node:assert/strict';
import {readImageInfo,scaledSize,compressImage} from '../public/admin/compress.mjs';
function jpeg(width,height,orientation=1){
 const exif=new Uint8Array([69,120,105,102,0,0,73,73,42,0,8,0,0,0,1,0,18,1,3,0,1,0,0,0,orientation,0,0,0,0,0,0,0]);
 const marker=new Uint8Array([255,225,0,exif.length+2]);
 const sof=new Uint8Array([255,192,0,17,8,height>>8,height&255,width>>8,width&255,3,1,17,0,2,17,0,3,17,0,255,217]);
 return new File([new Uint8Array([255,216]),marker,exif,sof],'large.jpg',{type:'image/jpeg'});
}
test('100-megapixel JPEG dimensions are read before decode and scaled safely',async()=>{
 assert.deepEqual(await readImageInfo(jpeg(11656,8742)),{width:11656,height:8742});
 assert.deepEqual(scaledSize(11656,8742),{width:3000,height:2250});
 assert.throws(()=>scaledSize(30000,30000));
});
test('EXIF rotation is included when computing decode dimensions',async()=>{
 assert.deepEqual(await readImageInfo(jpeg(6000,4000,6)),{width:4000,height:6000});
 assert.deepEqual(await readImageInfo(jpeg(6000,4000,8)),{width:4000,height:6000});
});
test('decoder receives bounded dimensions and only bounded bitmap reaches canvas',async()=>{
 let options,closed=false;
 const result=await compressImage(jpeg(11656,8742),{decode:async(file,opts)=>{options=opts;return {width:3000,height:2250,close(){closed=true;}};},encode:async()=>new Blob(['encoded'],{type:'image/webp'})});
 assert.equal(options.resizeWidth,3000);assert.equal(options.resizeHeight,2250);assert.equal(options.imageOrientation,'from-image');assert.ok(closed);assert.equal(result.height,2250);
});
test('decoder that ignores resize is closed and rejected before encoding',async()=>{
 let closed=false,encoded=false;
 await assert.rejects(compressImage(jpeg(11656,8742),{decode:async()=>({width:11656,height:8742,close(){closed=true;}}),encode:async()=>{encoded=true;}}),/浏览器/);
 assert.ok(closed);assert.equal(encoded,false);
});
test('corrupt dimensions are rejected before native decode',async()=>{
 let decoded=false;
 await assert.rejects(compressImage(new File([new Uint8Array([255,216,255,224])],'broken.jpg'),{decode:async()=>{decoded=true;}}));assert.equal(decoded,false);
});
