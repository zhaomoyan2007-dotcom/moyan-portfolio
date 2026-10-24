import { createHmac, randomBytes, timingSafeEqual, createHash } from 'node:crypto';
const maxAge = 600;
export const cookieName = '__Host-moyan_oauth';
export function configuredOrigin(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('SITE_URL需要完整HTTPS站点来源，不含路径或查询参数');
  }
  return url.origin;
}
function sign(value, secret) {
  if (!secret || secret.length < 32) throw new Error('OAuth签名密钥未配置');
  return createHmac('sha256', secret).update(value).digest('base64url');
}
export function createState(secret, now = Math.floor(Date.now()/1000)) {
  const state = randomBytes(32).toString('base64url');
  const verifier = randomBytes(48).toString('base64url');
  const payload = Buffer.from(JSON.stringify({state, verifier, iat:now})).toString('base64url');
  return { state, cookie: `${payload}.${sign(payload,secret)}`, challenge:createHash('sha256').update(verifier).digest('base64url') };
}
export function verifyState(cookie, state, secret, now = Math.floor(Date.now()/1000)) {
  const parts = String(cookie || '').split('.');
  if (parts.length !== 2) throw new Error('登录状态缺失，请重新登录');
  const [payload, signature] = parts;
  const expected = sign(payload,secret);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature),Buffer.from(expected))) throw new Error('登录状态签名无效');
  const parsed = JSON.parse(Buffer.from(payload,'base64url').toString());
  if (!parsed.state || parsed.state !== state || !Number.isFinite(parsed.iat) || now-parsed.iat > maxAge || now<parsed.iat || typeof parsed.verifier !== 'string') throw new Error('登录状态失效，请重新登录');
  return parsed;
}
export function stateCookie(value, clear = false) {
  return `${cookieName}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${clear?0:maxAge}`;
}
export function readStateCookie(header = '') {
  return header.split(';').map(x=>x.trim()).find(x=>x.startsWith(`${cookieName}=`))?.slice(cookieName.length+1) || '';
}
const scriptJSON = value => JSON.stringify(value).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
export function callbackPage(origin, result, success = true) {
  const message = `authorization:github:${success?'success':'error'}:${JSON.stringify(result)}`;
  return `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="referrer" content="no-referrer"><title>登录授权</title><body><p>正在返回作品后台。如果没有自动返回，请关闭此窗口后重试。</p><script>
const origin=${scriptJSON(configuredOrigin(origin))};
const message=${scriptJSON(message)};
if(window.opener){
  const receive=event=>{if(event.source!==window.opener||event.origin!==origin)return;window.opener.postMessage(message,origin);window.removeEventListener('message',receive);window.close();};
  window.addEventListener('message',receive);
  window.opener.postMessage('authorizing:github',origin);
}
</script></body></html>`;
}
export function authConfig(env = process.env) {
  const origin = configuredOrigin(env.SITE_URL);
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.OAUTH_STATE_SECRET || env.OAUTH_STATE_SECRET.length < 32 || !env.GITHUB_OWNER) throw new Error('后台授权尚未完成配置');
  return {origin, clientId:env.GITHUB_CLIENT_ID, clientSecret:env.GITHUB_CLIENT_SECRET,
    secret:env.OAUTH_STATE_SECRET, owner:env.GITHUB_OWNER.toLowerCase(),
    scope:env.GITHUB_OAUTH_SCOPE === 'public_repo'?'public_repo':'repo'};
}
