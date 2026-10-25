import {compressImage} from './compress.mjs';
const make=(tag,text)=>{const node=document.createElement(tag);if(text)node.textContent=text;return node;};
const size=bytes=>`${(bytes/1024/1024).toFixed(2)} MB`;
export const uploadedUrls=jobs=>jobs.filter(job=>job.url).map(job=>job.url);
let libraryScript;
function loadLibrary(){
  if(window.cloudinary?.createMediaLibrary)return Promise.resolve();
  if(!libraryScript)libraryScript=new Promise((resolve,reject)=>{const script=make('script');script.src='https://media-library.cloudinary.com/global/all.js';script.onload=resolve;script.onerror=()=>{libraryScript=null;script.remove();reject(new Error('图片库加载失败，请检查网络后重试'));};document.head.append(script);});
  return libraryScript;
}
function sendFile(ticket,file,onProgress,signal){
  return new Promise((resolve,reject)=>{
    const request=new XMLHttpRequest();request.open('POST',ticket.endpoint);request.timeout=120000;
    const cancel=()=>request.abort();signal.addEventListener('abort',cancel,{once:true});
    const cleanup=()=>signal.removeEventListener('abort',cancel);
    request.upload.onprogress=event=>{if(event.lengthComputable)onProgress(Math.round(event.loaded/event.total*100));};
    request.onerror=()=>{cleanup();reject(new Error('网络连接失败，请重试'));};
    request.ontimeout=()=>{cleanup();reject(new Error('上传超时，请重试'));};
    request.onabort=()=>{cleanup();reject(new Error('已取消上传'));};
    request.onload=()=>{cleanup();try{
      const result=JSON.parse(request.responseText);
      if(request.status<200||request.status>=300)throw new Error(result.error?.message||'Cloudinary上传失败');
      const url=new URL(result.secure_url);
      const cloud=ticket.endpoint.split('/')[4];
      if(url.origin!=='https://res.cloudinary.com'||!url.pathname.startsWith(`/${cloud}/image/upload/`))throw new Error('上传返回了无效图片地址');
      resolve(url.href);
    }catch(error){reject(error);}};
    const form=new FormData();form.append('file',file);form.append('api_key',ticket.apiKey);form.append('signature',ticket.signature);
    for(const [key,value] of Object.entries(ticket.params))form.append(key,value);
    if(signal.aborted){reject(new Error('已取消上传'));return;}request.send(form);
  });
}
export const cloudMedia={name:'moyan-cloud-images',init:async({options={},handleInsert})=>{
  let panel,controller,busy=false,library;
  const close=()=>{controller?.abort();panel?.remove();panel=null;};
  async function show(field={}){
    close();controller=new AbortController();const signal=controller.signal;
    const multiple=field.allowMultiple!==false&&field.config?.multiple!==false;
    const jobs=[];busy=false;
    panel=make('dialog');panel.className='local-media cloud-media';
    panel.append(make('p','MOYAN / IMAGE STUDIO'),make('h2','上传照片'));
    const hint=make('p','自动生成网页副本：长边最多3000像素、保持比例、目标4MB以内。保留透明背景，不修改电脑原文件。支持静态JPEG、PNG、WebP。压缩为有损WebP，会移除拍摄与定位信息；请保留原片备份。');
    const controls=make('div');controls.className='local-media-controls';
    const label=make('label','选择照片并自动压缩');label.className='cloud-upload-label';
    const input=make('input');input.type='file';input.multiple=multiple;input.accept='.jpg,.jpeg,.png,.webp';input.setAttribute('aria-label','选择照片并自动压缩');label.append(input);
    const browse=make('button','从Cloudinary图片库选择');browse.type='button';
    const insert=make('button','插入已上传照片（0）');insert.type='button';insert.disabled=true;
    const cancel=make('button','关闭');cancel.type='button';cancel.onclick=close;
    const feedback=make('p');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
    const list=make('div');list.className='cloud-upload-list';
    const update=()=>{const count=uploadedUrls(jobs).length;insert.disabled=busy||!count;insert.textContent=`插入已上传照片（${multiple?count:Math.min(1,count)}）`;input.disabled=busy;browse.disabled=busy;};
    insert.onclick=()=>{const urls=uploadedUrls(jobs);handleInsert(multiple?urls:urls.at(-1));close();};
    browse.onclick=async()=>{
      browse.disabled=true;feedback.textContent='正在打开图片库…';
      try{
        await loadLibrary();if(signal.aborted)return;
        library?.destroy?.();
        library=window.cloudinary.createMediaLibrary({...options.config,multiple,z_index:'99999',insert_transformation:false},{hideHandler:()=>{if(!signal.aborted&&panel&&!panel.open)panel.showModal();},insertHandler:data=>{
          if(signal.aborted)return;
          const urls=data.assets.map(asset=>asset.secure_url).filter(url=>typeof url==='string'&&url.startsWith(`https://res.cloudinary.com/${options.config.cloud_name}/image/upload/`));
          if(!urls.length){feedback.textContent='请选择有效的图片';return;}
          handleInsert(multiple?urls:urls[0]);close();library.hide();
        }});
        panel.close();library.show();feedback.textContent='图片库自带的Upload会直接上传原文件；大图请使用本页“选择照片并自动压缩”。';
      }catch(error){feedback.textContent=error.message;if(!signal.aborted&&!panel.open)panel.showModal();}finally{if(!signal.aborted)update();}
    };
    async function run(job){
      job.retry.hidden=true;
      try{
        job.status.textContent='正在压缩…';
        const result=await compressImage(job.source);
        if(signal.aborted)return;
        job.status.textContent=`${size(job.source.size)} → ${size(result.file.size)} · ${result.width} × ${result.height} · 正在取得上传授权…`;
        const response=await fetch('/api/upload-sign',{method:'POST',credentials:'same-origin',signal});
        const ticket=await response.json();if(!response.ok)throw new Error(ticket.error||'无法取得上传授权');
        const url=await sendFile(ticket,result.file,percent=>{job.status.textContent=`${size(result.file.size)} · 上传 ${percent}%${percent===100?'，正在确认…':''}`;},signal);
        if(signal.aborted)return;
        job.url=url;
        job.status.textContent=`上传成功 · ${size(job.source.size)} → ${size(result.file.size)} · ${result.width} × ${result.height}`;
        job.source=null;
      }catch(error){if(!signal.aborted){job.status.textContent=`未上传：${error.message}`;job.retry.hidden=false;}}
    }
    input.onchange=async()=>{
      const files=[...input.files];input.value='';if(!files.length||busy)return;busy=true;update();
      for(const source of files){
        if(signal.aborted)break;
        const row=make('div');row.className='cloud-upload-row';const status=make('p');const retry=make('button','重试这张');retry.type='button';retry.hidden=true;
        row.append(make('strong',source.name),status,retry);list.append(row);
        const job={source,status,retry};jobs.push(job);
        retry.onclick=async()=>{if(busy)return;busy=true;update();await run(job);busy=false;update();};
        await run(job);
      }
      if(signal.aborted)return;busy=false;feedback.textContent=`已上传 ${jobs.filter(job=>job.url).length} / ${jobs.length} 张。成功的照片可插入；失败项可重试。`;update();
    };
    controls.append(label,browse,insert,cancel);panel.append(hint,controls,feedback,list);document.body.append(panel);panel.showModal();panel.addEventListener('cancel',close,{once:true});
  }
  return {show,hide:close,enableStandalone:()=>true};
}};
