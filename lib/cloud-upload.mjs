import {createHmac,createHash,randomUUID,timingSafeEqual} from 'node:crypto';
const cookieName='__Host-moyan_upload';
const age=3600;
function sign(value,secret){
  if(typeof secret!=='string'||secret.length<32)throw new Error('上传授权未配置');
  return createHmac('sha256',secret).update(value).digest('base64url');
}
export function uploadCookie(owner,secret,now=Math.floor(Date.now()/1000)){
  const body=Buffer.from(JSON.stringify({owner,iat:now})).toString('base64url');
  return `${cookieName}=${body}.${sign(body,secret)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${age}`;
}
export function verifyUploadCookie(header='',owner,secret,now=Math.floor(Date.now()/1000)){
  const value=header.split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1)||'';
  const [body,signature,...extra]=value.split('.');
  if(!body||!signature||extra.length)throw new Error('请退出后台并重新使用GitHub登录，以取得上传授权');
  const expected=sign(body,secret);
  if(signature.length!==expected.length||!timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))throw new Error('上传授权无效，请重新登录');
  const session=JSON.parse(Buffer.from(body,'base64url').toString());
  if(session.owner!==owner||!Number.isFinite(session.iat)||now<session.iat||now-session.iat>=age)throw new Error('上传授权已过期，请退出后台再登录');
  return true;
}
export function uploadTicket(env,now=Math.floor(Date.now()/1000)){
  if(!/^[a-zA-Z0-9_-]+$/.test(env.CLOUDINARY_CLOUD_NAME||'')||!/^\d+$/.test(env.CLOUDINARY_API_KEY||'')||!env.CLOUDINARY_API_SECRET)throw new Error('请在Vercel添加CLOUDINARY_API_SECRET并重新部署；不要把密钥发到聊天');
  // Destination, folder, resource type and overwrite behavior cannot be chosen by the browser.
  const params={timestamp:String(now),public_id:`moyan-web/${randomUUID()}`,overwrite:'false',allowed_formats:'webp'};
  const payload=Object.keys(params).sort().map(key=>`${key}=${params[key]}`).join('&');
  return {endpoint:`https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,apiKey:env.CLOUDINARY_API_KEY,params,signature:createHash('sha256').update(payload+env.CLOUDINARY_API_SECRET).digest('hex')};
}
