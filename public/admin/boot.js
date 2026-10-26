async function start(){
  const message=document.getElementById('setup-message');
  try{
    const [runtimeResponse,configResponse]=await Promise.all([fetch('runtime.json',{cache:'no-store'}),fetch('config.json',{cache:'no-store'})]);
    if(!runtimeResponse.ok||!configResponse.ok)throw new Error('无法读取管理配置');
    const runtime=await runtimeResponse.json(),config=await configResponse.json();
    if(runtime.mode==='unconfigured'){
      message.textContent='网站工程已就绪，线上作品后台尚未连接账户。';
      const list=document.createElement('ol');
      for(const text of ['连接你自己的GitHub网站仓库。','配置网站地址与GitHub登录授权。','连接Cloudinary图片账户，重新部署后启用后台。']){const item=document.createElement('li');item.textContent=text;list.append(item);}
      document.getElementById('setup-details').append(list);return;
    }
    window.CMS_MANUAL_INIT=true;
    const script=document.createElement('script');script.src='vendor/decap-cms.js';
    await new Promise((resolve,reject)=>{script.onload=resolve;script.onerror=()=>reject(new Error('管理界面载入失败，请刷新重试'));document.head.append(script);});
    if(runtime.mode==='local'){
      const media=document.createElement('script');media.src='local-media.js';
      await new Promise((resolve,reject)=>{media.onload=resolve;media.onerror=reject;document.head.append(media);});
      window.CMS.registerMediaLibrary(window.MoyanLocalMedia);
    }
    if(runtime.mode==='github'){
      const {cloudMedia}=await import('./cloud-media.mjs');
      window.CMS.registerMediaLibrary(cloudMedia);
    }
    const note=document.getElementById('mode-note');note.hidden=false;
    document.getElementById('mode-label').textContent=runtime.mode==='local'?'本地作品管理':'作品保存与上线';
    document.getElementById('mode-detail').textContent=runtime.mode==='local'?'本地模式只修改本机内容文件，不会上传到公网。保存后刷新网站查看结果。本地代理不支持线上草稿审核流程，保存修改会直接反映到本机页面。':'先保存草稿并预览，确认后再发布到主分支；选择“公开展示”的项目才进入作品目录。等待Vercel构建成功后网页才会更新。图片库可能要求另行登录Cloudinary。';
    const {projectIdControl}=await import('./project-id.mjs');
    window.CMS.registerWidget('project-id',projectIdControl(window.createClass,window.h));
    const {filmPreview}=await import('./film-preview.mjs');
    const Preview=window.createClass({render(){
      const data=this.props.entry.get('data').toJS();
      if(data.category==='film')return filmPreview(data,window.h,this.props.getAsset);
      const title=data.title?.zh||data.name||'';
      const raw=data.images||data.homePhotos||[];
      const images=typeof raw==='string'?[raw]:Array.isArray(raw)?raw:[];
      return window.h('article',{className:'cms-preview'},
        window.h('h1',{},title),window.h('p',{},data.description?.zh||data.intro?.zh||data.about?.zh||''),
        ...images.map((src,i)=>window.h('img',{key:i,src:String(this.props.getAsset(src)),alt:`照片 ${i+1}`})));
    }});
    window.CMS.registerPreviewStyle('/admin/preview.css');
    window.CMS.registerPreviewTemplate('projects',Preview);window.CMS.registerPreviewTemplate('site',Preview);
    window.CMS.init({config});document.getElementById('setup').hidden=true;
  }catch(error){message.textContent=error.message;const button=document.createElement('button');button.textContent='重新载入';button.onclick=()=>location.reload();document.getElementById('setup-details').append(button);}
}
start();
