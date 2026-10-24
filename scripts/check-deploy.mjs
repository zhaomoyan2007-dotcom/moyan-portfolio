import { authConfig } from '../lib/oauth.mjs';
const required=['SITE_URL','GITHUB_REPOSITORY','GITHUB_OWNER','GITHUB_CLIENT_ID','GITHUB_CLIENT_SECRET','OAUTH_STATE_SECRET','CLOUDINARY_CLOUD_NAME','CLOUDINARY_API_KEY'];
const missing=required.filter(name=>!process.env[name]);
if(missing.length){console.error(`尚未接入的配置项：${missing.join('、')}。不要把真实值发到聊天或提交Git。`);process.exitCode=1;}
else{try{authConfig();console.log('Required account configuration is present. Real OAuth, media upload, deployment and regional access still require acceptance.');}catch(error){console.error(error.message);process.exitCode=1;}}
