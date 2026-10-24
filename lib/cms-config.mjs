const pair = (name,label,widget='text',required=false) => ({name,label,widget:'object',fields:[{name:'zh',label:'中文',widget,required},{name:'en',label:'English',widget,required}]});
const imageField = (name,label,multiple=false) => ({name,label,widget:'image',required:true,choose_url:false,
  media_library:{allow_multiple:multiple,config:{multiple,max_file_size:20*1024*1024}},
  ...(multiple?{default:[],hint:'可一次选择多张照片；拖动缩略图调整顺序。使用网页展示副本，建议每张不超过20MB。'}:{})});
export function cmsConfiguration(env={},local=false) {
  const repository=env.GITHUB_REPOSITORY || '';
  const origin=env.SITE_URL || '';
  let authReady=false;try{authConfig(env);authReady=true;}catch{}
  const configured=authReady&&/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)&&!!env.CLOUDINARY_CLOUD_NAME&&!!env.CLOUDINARY_API_KEY;
  const config={
    load_config_file:false,locale:'zh_Hans',show_preview_links:false,publish_mode:local?'simple':'editorial_workflow',
    backend:local?{name:'git-gateway'}:{name:'github',repo:repository,branch:env.GITHUB_BRANCH||'main',base_url:origin,auth_endpoint:'api/auth'},
    ...(local?{local_backend:{url:'http://127.0.0.1:8081/api/v1'}}:{}),
    media_folder:'public/uploads',public_folder:'/uploads',
    media_library:local?{name:'local-images'}:env.CLOUDINARY_CLOUD_NAME&&env.CLOUDINARY_API_KEY?{name:'cloudinary',config:{cloud_name:env.CLOUDINARY_CLOUD_NAME,api_key:env.CLOUDINARY_API_KEY}}:undefined,
    collections:[{
      name:'settings',label:'首页与个人资料',files:[{name:'site',label:'网站资料',file:'content/site.json',format:'json',fields:[
        {name:'schemaVersion',widget:'hidden',default:1},
        {name:'name',label:'署名',widget:'string'},pair('identity','身份介绍','string',true),
        imageField('hero','首页开场图片'),imageField('selectedPreview','精选入口图片'),
        imageField('homePhotos','首页精选照片',true),pair('about','个人简介'),
        {name:'contactEmail',label:'公开邮箱',widget:'string',required:false},
        {name:'contactURL',label:'公开联系链接（HTTPS）',widget:'string',required:false},pair('contactLabel','联系入口文字','string',false)
      ]}]
    },{
      name:'projects',label:'作品项目',label_singular:'项目',folder:'content/projects',create:true,delete:true,extension:'json',format:'json',identifier_field:'id',slug:'{{id}}',summary:'{{title.zh}} · {{status}}',
      fields:[
        {name:'id',label:'固定项目地址',widget:'string',pattern:['^[a-z0-9]+(?:-[a-z0-9]+)*$','请使用小写英文、数字和连字符'],hint:'例如 first-series。创建后不要修改，改标题不会改变项目地址。'},
        {name:'status',label:'公开状态',widget:'select',options:[{label:'草稿／已撤下',value:'draft'},{label:'公开展示',value:'published'}],default:'draft',hint:'选择公开展示，先保存草稿并预览，确认后发布，再等待网站构建成功。本地模式保存即生效。'},
        pair('title','项目名称','string',true),
        {name:'category',label:'作品类别',widget:'select',options:[{label:'纪实',value:'documentary'},{label:'人像',value:'portrait'},{label:'当代创作',value:'contemporary'},{label:'短片',value:'film'}]},
        {name:'featured',label:'加入首页精选',widget:'boolean',default:false},
        {name:'order',label:'排列顺序（数字小的在前）',widget:'number',value_type:'int',min:0,default:0},
        {name:'year',label:'创作年份',widget:'string',required:false},
        imageField('cover','封面'),imageField('images','项目照片（可批量添加与排序）',true),
        pair('description','项目介绍'),pair('concept','创作观念'),pair('roles','参与职责','string')
      ]
    }]
  };
  return {config,configured:local||configured};
}
import { authConfig } from './oauth.mjs';
