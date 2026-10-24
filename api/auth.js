import { authConfig, createState, stateCookie } from '../lib/oauth.mjs';
export default function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET'){res.status(405).end('Method not allowed');return;}
  try {
    const config=authConfig();
    const state=createState(config.secret);
    res.setHeader('Set-Cookie',stateCookie(state.cookie));
    const url=new URL('https://github.com/login/oauth/authorize');
    url.search=new URLSearchParams({client_id:config.clientId,redirect_uri:`${config.origin}/api/callback`,scope:config.scope,state:state.state,code_challenge:state.challenge,code_challenge_method:'S256',login:config.owner,allow_signup:'false'}).toString();
    res.redirect(302,url.toString());
  }catch{res.status(503).end('作品后台的账户连接尚未配置完成。');}
}
