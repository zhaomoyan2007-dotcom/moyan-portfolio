// Inspect a bounded header before asking the browser to decode camera-sized files.
const headerBytes=1024*1024;
function orientation(view,start,end){
  try{
    if(view.getUint32(start)===0x45786966)start+=6;
    const little=view.getUint16(start)===0x4949;
    if(!little&&view.getUint16(start)!==0x4d4d)return 1;
    const u16=offset=>{if(offset<start||offset+2>end)throw new Error();return view.getUint16(offset,little);};
    const u32=offset=>{if(offset<start||offset+4>end)throw new Error();return view.getUint32(offset,little);};
    if(u16(start+2)!==42)return 1;
    const directory=start+u32(start+4),count=Math.min(u16(directory),4096);
    for(let i=0;i<count;i++){
      const entry=directory+2+i*12;
      if(u16(entry)===0x112&&u16(entry+2)===3&&u32(entry+4)===1){const value=u16(entry+8);return value>=1&&value<=8?value:1;}
    }
  }catch{}
  return 1;
}
export async function readImageInfo(file){
  const bytes=new Uint8Array(await file.slice(0,headerBytes).arrayBuffer()),view=new DataView(bytes.buffer);
  const ascii=(offset,count)=>String.fromCharCode(...bytes.slice(offset,offset+count));
  let width,height,rotation=1;
  if(bytes[0]===255&&bytes[1]===216){
    let pos=2;
    while(pos+3<bytes.length){
      if(bytes[pos++]!==255)break;
      while(bytes[pos]===255)pos++;
      const marker=bytes[pos++];
      if(marker===0xda||marker===0xd9)break;
      if(marker===1||(marker>=0xd0&&marker<=0xd7))continue;
      if(pos+2>bytes.length)break;
      const length=view.getUint16(pos),start=pos+2,end=pos+length;
      if(length<2||end>file.size)throw new Error('JPEG文件头不完整，请重新导出照片');
      if(end>bytes.length)break;
      if(marker===0xe1&&ascii(start,6)==='Exif\0\0')rotation=orientation(view,start,end);
      if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)&&length>=8){height=view.getUint16(start+1);width=view.getUint16(start+3);}
      pos=end;
    }
  }else if(bytes[0]===137&&ascii(1,3)==='PNG'&&bytes.length>=24){
    width=view.getUint32(16);height=view.getUint32(20);
    let pos=8;
    while(pos+12<=bytes.length){
      const length=view.getUint32(pos),type=ascii(pos+4,4),end=pos+12+length;
      if(type==='acTL')throw new Error('暂不处理动画PNG，请使用静态照片');
      if(type==='IDAT'||end>bytes.length)break;
      if(type==='eXIf')rotation=orientation(view,pos+8,end-4);
      pos=end;
    }
  }else if(ascii(0,4)==='RIFF'&&ascii(8,4)==='WEBP'){
    let pos=12;
    while(pos+8<=bytes.length){
      const type=ascii(pos,4),length=view.getUint32(pos+4,true),start=pos+8,end=start+length;
      if(type==='VP8X'&&start+10<=bytes.length){
        if(bytes[start]&2)throw new Error('暂不处理动画WebP，请使用静态照片');
        const u24=offset=>bytes[offset]+bytes[offset+1]*256+bytes[offset+2]*65536;
        width=1+u24(start+4);height=1+u24(start+7);
      }else if(type==='VP8 '&&start+10<=bytes.length&&!width){width=view.getUint16(start+6,true)&0x3fff;height=view.getUint16(start+8,true)&0x3fff;}
      else if(type==='VP8L'&&start+5<=bytes.length&&!width){const bits=view.getUint32(start+1,true);width=1+(bits&0x3fff);height=1+((bits>>>14)&0x3fff);}
      if(end>bytes.length)break;
      if(type==='EXIF')rotation=orientation(view,start,end);
      pos=end+(length%2);
    }
  }
  if(!width||!height)throw new Error('无法读取图片尺寸，文件可能不完整或含过大的元数据，请重新导出JPEG');
  return rotation>=5?{width:height,height:width}:{width,height};
}
