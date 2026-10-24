import { extname, basename, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { readdir, mkdir, writeFile } from 'node:fs/promises';
export const maxUploadBytes=20*1024*1024;
export function validateUpload(name,bytes){
  if(!name||name!==basename(name)||/[\\/]/.test(name))throw new Error('文件名不合法');
  if(bytes.length>maxUploadBytes)throw new Error('图片超过20MB，请先导出网页副本');
  const ext=extname(name).toLowerCase();
  const matches={
    '.jpg':bytes[0]===255&&bytes[1]===216&&bytes[2]===255,
    '.jpeg':bytes[0]===255&&bytes[1]===216&&bytes[2]===255,
    '.png':bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),
    '.webp':bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP',
    '.gif':['GIF87a','GIF89a'].includes(bytes.toString('ascii',0,6)),
    '.avif':bytes.toString('ascii',4,8)==='ftyp'&&['avif','avis'].includes(bytes.toString('ascii',8,12))
  };
  if(!matches[ext])throw new Error('仅支持内容与后缀相符的JPG、PNG、WebP、GIF或AVIF图片');
  return ext;
}
export function localRequestAllowed(headers,port){
  const hosts=[`localhost:${port}`,`127.0.0.1:${port}`];
  return hosts.includes(headers.host)&&headers.origin===`http://${headers.host}`&&headers['x-moyan-upload']==='1';
}
export async function localMediaRoute(req,res,root,port){
  const path=new URL(req.url,'http://localhost').pathname;
  if(!['/api/local-images','/api/local-upload'].includes(path))return false;
  const json=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(body));};
  if(path==='/api/local-images'&&req.method==='GET'){
    const uploads=await readdir(join(root,'public/uploads'));
    const fixed=Array.from({length:6},(_,i)=>`/assets/selected-photos/${String(i+1).padStart(2,'0')}-1800.webp`);
    json(200,{images:[...fixed,...uploads.filter(x=>/\.(jpe?g|png|webp|gif|avif)$/i.test(x)).map(x=>`/uploads/${x}`)]});return true;
  }
  if(path!=='/api/local-upload'||req.method!=='POST'){json(405,{error:'操作不支持'});return true;}
  if(!localRequestAllowed(req.headers,port)){json(403,{error:'仅允许本机后台上传'});return true;}
  try{
    if(Number(req.headers['content-length'])>maxUploadBytes)throw new Error('图片超过20MB');
    const chunks=[];let size=0;
    for await(const chunk of req){size+=chunk.length;if(size>maxUploadBytes)throw new Error('图片超过20MB');chunks.push(chunk);}
    const bytes=Buffer.concat(chunks);
    const ext=validateUpload(decodeURIComponent(req.headers['x-upload-name']||''),bytes);
    const filename=`${randomUUID()}${ext}`;
    await mkdir(join(root,'public/uploads'),{recursive:true});
    await writeFile(join(root,'public/uploads',filename),bytes,{flag:'wx'});
    json(201,{src:`/uploads/${filename}`});
  }catch(error){json(400,{error:error.message});}
  return true;
}
