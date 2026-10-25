export const targetBytes=4*1024*1024;
export function scaledSize(width,height,max=3000){
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<1||height<1||width*height>60000000)throw new Error('图片尺寸无效或超过6000万像素，请先导出较小副本');
  const ratio=Math.min(1,max/Math.max(width,height));
  return {width:Math.max(1,Math.round(width*ratio)),height:Math.max(1,Math.round(height*ratio))};
}
export async function validateSource(file){
  if(!file.size||file.size>100*1024*1024)throw new Error('原文件需小于100MB');
  const bytes=new Uint8Array(await file.slice(0,65536).arrayBuffer());
  const ascii=(start,end)=>String.fromCharCode(...bytes.slice(start,end));
  if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';
  if(bytes[0]===137&&ascii(1,4)==='PNG'){
    if(ascii(0,bytes.length).includes('acTL'))throw new Error('暂不处理动画PNG，请使用静态照片');
    return 'image/png';
  }
  if(ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP'){
    if(ascii(0,bytes.length).includes('ANIM'))throw new Error('暂不处理动画WebP，请使用静态照片');
    return 'image/webp';
  }
  throw new Error('请使用静态JPEG、PNG或WebP；RAW、HEIC请先导出为JPEG');
}
export async function compressImage(file,dependencies={}){
  await validateSource(file);
  const bitmap=await (dependencies.decode||createImageBitmap)(file);
  let canvas;
  try{
    let {width,height}=scaledSize(bitmap.width,bitmap.height);
    const encode=dependencies.encode||((w,h,quality)=>{
      canvas||=(document.createElement('canvas'));canvas.width=w;canvas.height=h;
      const context=canvas.getContext('2d',{colorSpace:'srgb'});
      if(!context)throw new Error('浏览器无法处理图片，请换用新版Chrome或Safari');
      context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';context.drawImage(bitmap,0,0,w,h);
      return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('图片编码失败')),'image/webp',quality));
    });
    for(let resize=0;resize<4;resize++){
      for(const quality of [.86,.78,.68]){
        const blob=await encode(width,height,quality);
        if(blob.type!=='image/webp')throw new Error('浏览器不支持WebP编码，请更新浏览器');
        if(blob.size<=targetBytes){
          const filename=(file.name.replace(/\.[^.]+$/,'')||'photo')+'.webp';
          return {file:new File([blob],filename,{type:'image/webp'}),width,height,originalBytes:file.size};
        }
      }
      width=Math.max(1,Math.round(width*.8));height=Math.max(1,Math.round(height*.8));
    }
    throw new Error('无法将图片处理到4MB以内，请先导出较小副本');
  }finally{bitmap.close();if(canvas){canvas.width=1;canvas.height=1;}}
}
