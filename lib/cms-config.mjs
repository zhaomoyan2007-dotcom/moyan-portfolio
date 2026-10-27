import {authConfig} from './oauth.mjs';

const categoryOptions = [
  {label:'纪实',value:'documentary'}, {label:'当代与情绪',value:'contemporary'},
  {label:'人像',value:'portrait'}, {label:'体育',value:'sports'},
  {label:'航拍',value:'aerial'}, {label:'自然风光',value:'nature'}, {label:'短片创作',value:'film'}
];
const pair = (name,label,widget='text',required=false) => ({
  name,label,widget:'object',collapsed:true,fields:[
    {name:'zh',label:'中文',widget,required}, {name:'en',label:'English',widget,required}
  ]
});
// Hidden legacy fields round-trip existing values without offering obsolete editing controls.
const hidden = name => ({name,widget:'hidden',required:false});
const imageField = (name,label,multiple=false) => ({
  name,label,widget:'image',required:true,choose_url:false,
  media_library:{allow_multiple:multiple,config:{multiple,max_file_size:100*1024*1024}},
  ...(multiple?{default:[],hint:'可批量上传，拖动缩略图排序。新照片请用自动压缩入口；图片库自带 Upload 不经过压缩。'}:{})
});
function aboutList(name,label) {
  return {
    name,label,widget:'list',required:false,default:[],collapsed:true,summary:'{{fields.title.zh}}',
    hint:'可添加、删除和拖动排序；空条目不显示。',
    fields:[pair('title','标题','string'),pair('body','正文'),...(name==='capabilities'?[{
      name:'projectId',label:'关联作品（可选）',widget:'relation',collection:'projects',
      search_fields:['title.zh','title.en','id'],value_field:'id',display_fields:['title.zh'],required:false,
      hint:'前台只链接公开作品；项目地址不随改名变化。'
    }]:[])]
  };
}
function siteFields() {
  return [
    {name:'schemaVersion',widget:'hidden',default:1},
    {name:'name',label:'01 · 开场／署名',widget:'string'},
    imageField('hero','01 · 开场／背景图片'),
    pair('identity','01 · 开场／署名下的身份文字','string',true),
    {...pair('intro','02 · 首页／自我介绍'),hint:'显示在署名下方；空一行分段。中文和英文独立维护。'},
    {...imageField('selectedPreview','03 · 剧场入口／背景图片'),hint:'双按钮下方的剧场照片；分类作品在左侧“作品项目”管理。'},
    {...pair('filmIntro','04 · 短片创作／栏目简介'),hint:'显示在短片总标题下方。具体影片请在“作品项目”中添加；可分段，留空不显示。'},
    {name:'aboutPage',label:'05 · 关于我 → 远期目标 → 与我合作',widget:'object',required:false,collapsed:false,fields:[
      pair('introTitle','关于我／主标题','string'),pair('introSubtitle','关于我／副标题（小字）','string'),
      {name:'introBlocks',label:'关于我／身份与简介（可增删排序）',widget:'list',required:false,default:[],collapsed:true,
        summary:'{{fields.text.zh}}',hint:'每段独立维护中英文，可换行和排序；用 **文字** 自定义加粗，留空不显示。',fields:[pair('text','自由文本／支持多行')]},
      pair('capabilitiesHeading','创作方向与实践／栏目标题','string'),aboutList('capabilities','创作方向与实践／条目'),
      pair('plansHeading','远期目标／栏目标题','string'),aboutList('plans','远期目标／条目'),
      pair('cooperationHeading','与我合作／栏目标题','string'),pair('cooperationLead','与我合作／标题下的引言'),
      aboutList('cooperation','与我合作／合作类型'),
      pair('contactsHeading','与我合作／联系方式标题','string'),
      {name:'contacts',label:'与我合作／联系方式（可增删排序）',widget:'list',required:false,default:[],collapsed:true,
        summary:'{{fields.label.zh}} · {{fields.value}}',hint:'这些内容会公开展示。微信号一般只填账号；链接可留空。',fields:[
          pair('label','名称','string'),{name:'value',label:'账号／联系内容',widget:'string',required:false},
          {name:'url',label:'可选点击链接',widget:'string',required:false,hint:'支持 https://、mailto:邮箱 或 tel:电话。'}
        ]},
      ...['eyebrow','heading','profileLine','directionsHeading','directions'].map(hidden)
    ]},
    ...['homePhotos','about','contactEmail','contactURL','contactLabel'].map(hidden)
  ];
}
function projectFields() {
  return [
    {name:'category',label:'01 · 选择作品栏目',widget:'project-category',options:categoryOptions},
    {...pair('title','02 · 项目名称','string',true),collapsed:false,hint:'用于全部作品目录和项目详情；首页摄影照片流不显示项目名称。'},
    {name:'subgroup',label:'人像子类（仅人像项目填写）',widget:'select',default:'none',options:[
      {label:'其他类别／不适用',value:'none'}, {label:'环境人像',value:'environment'}, {label:'棚拍人像',value:'studio'},
      {label:'历史体育值／保留即可',value:'basketball'}, {label:'历史体育值／保留即可',value:'football'}
    ],hint:'仅人像选择环境或棚拍；旧体育值保持原样，不影响照片流和排序。'},
    {name:'projectDate',label:'短片项目时间（仅短片填写）',widget:'string',required:false,
      pattern:['^[1-9]\\d{3}(?:-(?:0[1-9]|1[0-2])(?:-(?:0[1-9]|[12]\\d|3[01]))?)?$','请填写YYYY、YYYY-MM或YYYY-MM-DD'],
      hint:'例如2026-09。公开短片自动进入首页，按此时间由新到旧；月份需补零。不清楚月份可只填年份。'},
    {name:'year',label:'创作年份（摄影／旧项目，可选）',widget:'string',required:false,hint:'摄影详情的年份；旧短片未填项目时间时沿用此值。'},
    {...imageField('cover','03 · 封面／短片独立首图'),hint:'用于目录和详情；短片还会大幅显示。首图无需重复加入下面的切片。'},
    {...imageField('images','04 · 项目照片／短片其余切片',true),required:false,
      hint:'按显示顺序拖动排列。摄影至少一张；短片可留空。自动压缩只改变上传副本，不修改原片。'},
    {...pair('roles','05 · 短片／参与职责'),hint:'短片首图与切片下方显示；摄影项目通常留空。'},
    {...pair('concept','06 · 创作阐述'),hint:'短片首页显示在职责之后；摄影显示在项目详情中。'},
    {...pair('description','07 · 全部作品目录／简短介绍'),hint:'用于目录与详情，不会增加到首页摄影照片流中。'},
    {name:'featured',label:'08 · 摄影／加入首页照片流',widget:'boolean',default:false,
      hint:'仅摄影使用；关闭后仍可在全部作品目录显示。短片无需开启此选项。'},
    {name:'order',label:'09 · 排列顺序（数字小的在前）',widget:'number',value_type:'int',min:0,default:0,
      hint:'同一摄影栏目内按此排序；短片仅在日期相同时使用此顺序。'},
    {name:'status',label:'10 · 官网可见性',widget:'select',options:[
      {label:'隐藏／不在官网展示',value:'draft'}, {label:'公开展示',value:'published'}
    ],default:'draft',hint:'这是官网是否显示的开关，与顶部工作流“发布”不同。选择公开展示 → 保存草稿 → 预览 → 顶部发布 → 等待网站构建成功。'},
    {name:'id',label:'固定项目地址（自动生成，无需填写）',widget:'project-id',hint:'创建时自动生成并锁定；改项目名称不会改变地址。'}
  ];
}
export function cmsConfiguration(env={},local=false) {
  const repository=env.GITHUB_REPOSITORY||'';
  const origin=env.SITE_URL||'';
  let authReady=false;try{authConfig(env);authReady=true;}catch{}
  const configured=authReady&&/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)&&!!env.CLOUDINARY_CLOUD_NAME&&!!env.CLOUDINARY_API_KEY;
  const config={
    load_config_file:false,locale:'zh_Hans',show_preview_links:false,publish_mode:local?'simple':'editorial_workflow',
    backend:local?{name:'git-gateway'}:{name:'github',repo:repository,branch:env.GITHUB_BRANCH||'main',base_url:origin,auth_endpoint:'api/auth'},
    ...(local?{local_backend:{url:'http://127.0.0.1:8081/api/v1'}}:{}),
    media_folder:'public/uploads',public_folder:'/uploads',
    media_library:local?{name:'local-images'}:env.CLOUDINARY_CLOUD_NAME&&env.CLOUDINARY_API_KEY?{
      name:'moyan-cloud-images',config:{cloud_name:env.CLOUDINARY_CLOUD_NAME,api_key:env.CLOUDINARY_API_KEY}
    }:undefined,
    collections:[
      {name:'settings',label:'01 · 首页与关于',files:[{name:'site',label:'从首页到与我合作／按网页顺序编辑',file:'content/site.json',format:'json',fields:siteFields()}]},
      {name:'projects',label:'02 · 摄影与短片项目',label_singular:'项目',folder:'content/projects',create:true,delete:true,
        extension:'json',format:'json',identifier_field:'id',slug:'{{id}}',summary:'{{title.zh}} · {{status}}',
        sortable_fields:['order','projectDate','title.zh'],
        view_filters:[...categoryOptions.map(({label,value})=>({label,field:'category',pattern:`^${value}$`})),
          {label:'官网公开展示',field:'status',pattern:'^published$'}, {label:'官网隐藏',field:'status',pattern:'^draft$'}],
        fields:projectFields()}
    ]
  };
  return {config,configured:local||configured};
}
