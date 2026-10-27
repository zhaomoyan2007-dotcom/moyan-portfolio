const pair = (name,label,widget='text',required=false) => ({name,label,widget:'object',fields:[{name:'zh',label:'中文',widget,required},{name:'en',label:'English',widget,required}]});
const imageField = (name,label,multiple=false) => ({name,label,widget:'image',required:true,choose_url:false,
  media_library:{allow_multiple:multiple,config:{multiple,max_file_size:100*1024*1024}},
  ...(multiple?{default:[],hint:'可一次选择多张照片；拖动缩略图调整顺序。线上选择照片时可自动缩图压缩；图片库自带Upload不经过自动压缩。'}:{})});
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
    media_library:local?{name:'local-images'}:env.CLOUDINARY_CLOUD_NAME&&env.CLOUDINARY_API_KEY?{name:'moyan-cloud-images',config:{cloud_name:env.CLOUDINARY_CLOUD_NAME,api_key:env.CLOUDINARY_API_KEY}}:undefined,
    collections:[{
      name:'settings',label:'首页与个人资料',files:[{name:'site',label:'网站资料',file:'content/site.json',format:'json',fields:[
        {name:'schemaVersion',widget:'hidden',default:1},
        {name:'name',label:'署名',widget:'string'},pair('identity','身份介绍','string',true),
        imageField('hero','首页开场图片'),imageField('selectedPreview','精选入口图片'),
        {...pair('intro','首页自我介绍'),hint:'显示在首屏署名下方。空一行分段；请同时维护中文与英文。'},
        {...pair('filmIntro','首页短片创作简介'),hint:'显示在“短片创作”总标题下方；可分段，请分别填写中文和英文。留空不显示。'},
        {...imageField('homePhotos','旧版未分类精选（当前留空）',true),required:false,hint:'新版分类照片流请在“作品项目”添加照片并启用首页精选；此处留空。'},pair('about','关于／个人简介'),
        {name:'aboutPage',label:'关于区域／标题、能力、合作与规划',widget:'object',required:false,fields:[
          pair('introTitle','关于我／主标题','string'),pair('introSubtitle','标题下方的小字','string'),
          {name:'introBlocks',label:'身份与经历／自由文本（可增删排序）',widget:'list',required:false,default:[],summary:'{{fields.text.zh}}',hint:'每段都是独立的中英文多行文本框，可填写身份、学校、工作坊经历或其他介绍。支持换行、增删和拖动排序；用 **文字** 标记加粗重点；留空不显示。',fields:[pair('text','自由文本／支持多行')]},
          ...['eyebrow','heading','profileLine'].map(name=>({name,widget:'hidden',required:false})),
          ...['directionsHeading','directions'].map(name=>({name,widget:'hidden',required:false})),
          pair('cooperationLead','合作区域／重点标题'),pair('contactsHeading','左侧联系方式／标题','string'),
          {name:'contacts',label:'左侧联系方式（可增删排序）',widget:'list',required:false,default:[],summary:'{{fields.label.zh}} · {{fields.value}}',hint:'填入微信、邮箱、电话等。内容为空不显示；链接可留空。此处填写的信息会公开展示。',fields:[pair('label','名称','string'),{name:'value',label:'联系内容／账号',widget:'string',required:false},{name:'url',label:'可选点击链接',widget:'string',required:false,hint:'支持 https://、mailto:邮箱 或 tel:电话；微信号一般不填链接。'}]},
          ...[['capabilities','能力地图'],['cooperation','与我合作'],['plans','远期目标']].flatMap(([name,label])=>[
            pair(`${name}Heading`,`${label}／栏目标题`,'string'),
            {name,label:`${label}／条目（可增删排序）`,widget:'list',required:false,default:[],summary:'{{fields.title.zh}}',fields:[pair('title','标题','string'),pair('body','正文'),...(name==='capabilities'?[{name:'projectId',label:'关联真实作品（可选）',widget:'relation',collection:'projects',search_fields:['title.zh','title.en','id'],value_field:'id',display_fields:['title.zh'],required:false,hint:'选择作品后显示封面和项目入口；未发布或已撤下的作品不会链接。'}]:[])]}
          ])
        ]},
        {name:'contactEmail',label:'公开邮箱',widget:'string',required:false},
        {name:'contactURL',label:'公开联系链接（HTTPS）',widget:'string',required:false},pair('contactLabel','联系入口文字','string',false)
      ]}]
    },{
      name:'projects',label:'作品项目／首页展示',label_singular:'项目',folder:'content/projects',create:true,delete:true,extension:'json',format:'json',identifier_field:'id',slug:'{{id}}',summary:'{{title.zh}} · {{status}}',
      fields:[
        {name:'id',label:'固定项目地址（自动生成）',widget:'project-id',hint:'系统自动生成并锁定，无需填写；修改项目名称不会改变地址。'},
        {name:'status',label:'公开状态',widget:'select',options:[{label:'草稿／已撤下',value:'draft'},{label:'公开展示',value:'published'}],default:'draft',hint:'选择公开展示，先保存草稿并预览，确认后发布，再等待网站构建成功。本地模式保存即生效。'},
        {...pair('title','项目名称','string',true),hint:'短片首页显示名称；摄影首页照片流不显示项目名称。'},
        {name:'category',label:'作品类别',widget:'select',options:[{label:'纪实',value:'documentary'},{label:'当代与情绪',value:'contemporary'},{label:'人像',value:'portrait'},{label:'体育',value:'sports'},{label:'航拍',value:'aerial'},{label:'自然风光',value:'nature'},{label:'短片',value:'film'}]},
        {name:'subgroup',label:'人像子分组（其他类别忽略）',widget:'select',default:'none',options:[{label:'其他类别（不分组）',value:'none'},{label:'环境人像',value:'environment'},{label:'棚拍人像',value:'studio'},{label:'旧数据兼容：篮球',value:'basketball'},{label:'旧数据兼容：足球',value:'football'}],hint:'仅人像项目选择环境或棚拍。其他类别忽略此字段；旧体育分组仅为保留历史数据，不影响展示。'},
        {name:'featured',label:'加入首页摄影照片流',widget:'boolean',default:false,hint:'仅用于摄影项目。短片设为公开展示并发布后自动进入首页，按项目时间从新到旧排列。'},
        {name:'order',label:'排列顺序（数字小的在前）',widget:'number',value_type:'int',min:0,default:0,hint:'摄影按此顺序排列；短片仅在时间相同时以此排序。'},
        {name:'year',label:'创作年份',widget:'string',required:false,hint:'例如2026。旧短片未填写项目日期时，沿用此年份排序。'},
        {name:'projectDate',label:'短片项目时间',widget:'string',required:false,pattern:['^[1-9]\\d{3}(?:-(?:0[1-9]|1[0-2])(?:-(?:0[1-9]|[12]\\d|3[01]))?)?$','请填写YYYY、YYYY-MM或YYYY-MM-DD'],hint:'可填2026、2026-10或2026-10-26。首页短片按此时间由新到旧；不清楚的月份或日期不必补写。'},
        {...imageField('cover','封面／短片首图'),hint:'短片首图单独大幅显示，无需重复放入切片列表。'},
        {...imageField('images','项目照片／短片其余切片（可批量排序）',true),required:false,hint:'短片在首图下方直接展开这些切片，可留空。摄影项目至少需要一张；拖动缩略图决定顺序。'},
        pair('description','项目介绍'),{...pair('concept','创作观念／短片创作阐述'),hint:'短片首页显示在个人职责之后，请分别维护中文和英文。'},pair('roles','个人参与职责')
      ]
    }]
  };
  return {config,configured:local||configured};
}
import { authConfig } from './oauth.mjs';
