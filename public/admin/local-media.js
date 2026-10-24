(() => {
  function make(tag,text){const n=document.createElement(tag);if(text)n.textContent=text;return n;}
  window.MoyanLocalMedia={name:'local-images',init:async({handleInsert})=>{
    let panel,multiple=true,selected=new Set();
    const close=()=>{panel?.remove();panel=null;};
    async function show(options={}){
      close();multiple=options.allowMultiple!==false&&options.config?.multiple!==false;selected=new Set();
      panel=make('dialog');panel.className='local-media';
      const heading=make('h2','本地图片库');const hint=make('p','批量上传网页展示副本，选中后插入；项目内可继续拖动排序。');
      const closeButton=make('button','取消');closeButton.type='button';closeButton.onclick=close;
      const upload=make('input');upload.type='file';upload.multiple=true;upload.accept='.jpg,.jpeg,.png,.webp,.gif,.avif';upload.setAttribute('aria-label','批量上传图片');
      const feedback=make('p');feedback.setAttribute('role','status');
      const grid=make('div');grid.className='local-media-grid';
      const insert=make('button','插入已选图片（0）');insert.type='button';insert.disabled=true;
      insert.onclick=()=>{const images=[...selected];handleInsert(multiple?images:images[0]);close();};
      const controls=make('div');controls.className='local-media-controls';controls.append(upload,insert,closeButton);
      panel.append(heading,hint,controls,feedback,grid);document.body.append(panel);panel.showModal();
      panel.addEventListener('cancel',close,{once:true});
      function update(){insert.disabled=selected.size===0;insert.textContent=`插入已选图片（${selected.size}）`;grid.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(selected.has(button.dataset.src))));}
      function item(src){
        const button=make('button');button.type='button';button.dataset.src=src;button.setAttribute('aria-label',`选择 ${src.split('/').at(-1)}`);button.setAttribute('aria-pressed',String(selected.has(src)));
        const image=make('img');image.src=src;image.alt='本地照片';image.loading='lazy';button.append(image);
        button.onclick=()=>{if(selected.has(src))selected.delete(src);else{if(!multiple)selected.clear();selected.add(src);}update();};grid.append(button);
      }
      upload.onchange=async()=>{
        const files=[...upload.files];upload.disabled=true;insert.disabled=true;let done=0;const failures=[];
        for(const file of files){
          feedback.textContent=`正在上传 ${done+1} / ${files.length}…`;
          try{
            if(file.size>20*1024*1024)throw new Error('超过20MB');
            const response=await fetch('/api/local-upload',{method:'POST',headers:{'Content-Type':'application/octet-stream','X-Moyan-Upload':'1','X-Upload-Name':encodeURIComponent(file.name)},body:file});
            const result=await response.json();if(!response.ok)throw new Error(result.error||'上传失败');
            if(!multiple)selected.clear();selected.add(result.src);item(result.src);done++;
          }catch(error){failures.push(`${file.name}：${error.message}`);}
        }
        feedback.textContent=`已上传 ${done} 张。${failures.length?'未成功的文件可重新选择重试：'+failures.join('；'):''}`;
        upload.disabled=false;upload.value='';update();
      };
      try{const response=await fetch('/api/local-images');if(!response.ok)throw new Error('图片库读取失败');const {images}=await response.json();images.forEach(item);}catch(error){feedback.textContent=error.message;}
    }
    return {show,hide:close,enableStandalone:()=>true};
  }};
})();
