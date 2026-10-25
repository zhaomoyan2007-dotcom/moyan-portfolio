import { authConfig, verifyState, readStateCookie, stateCookie, callbackPage } from '../lib/oauth.mjs';
import { uploadCookie } from '../lib/cloud-upload.mjs';
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET'){res.status(405).end('Method not allowed');return;}
  let config;
  try {config=authConfig();}catch{res.status(503).end('作品后台的账户连接尚未配置完成。');return;}
  res.setHeader('Set-Cookie',stateCookie('',true));
  try {
    const params=new URL(req.url,config.origin).searchParams;
    const session=verifyState(readStateCookie(req.headers.cookie),params.get('state'),config.secret);
    const code=params.get('code');
    if(!code || params.has('error'))throw new Error('登录未完成');
    const response=await fetch('https://github.com/login/oauth/access_token',{
      method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},
      body:JSON.stringify({client_id:config.clientId,client_secret:config.clientSecret,code,redirect_uri:`${config.origin}/api/callback`,code_verifier:session.verifier}),signal:AbortSignal.timeout(15000)
    });
    if(!response.ok)throw new Error('授权服务暂不可用');
    const token=await response.json();
    if(typeof token.access_token!=='string')throw new Error('未取得授权');
    const identity=await fetch('https://api.github.com/user',{headers:{Authorization:`Bearer ${token.access_token}`,Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(15000)});
    if(!identity.ok || (await identity.json()).login?.toLowerCase()!==config.owner)throw new Error('请使用网站所有者的GitHub账号');
    res.setHeader('Set-Cookie',[stateCookie('',true),uploadCookie(config.owner,config.secret)]);
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.status(200).send(callbackPage(config.origin,{token:token.access_token,provider:'github'}));
  }catch{
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.status(400).send(callbackPage(config.origin,{message:'登录未完成或已过期，请关闭窗口并重试。'},false));
  }
}
