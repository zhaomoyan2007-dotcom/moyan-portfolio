import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join, extname, resolve, sep } from 'node:path';
import { build,readContent,root } from './build.mjs';
import { localMediaRoute } from '../lib/local-upload.mjs';
import { ensurePortAvailable,waitForProxy } from '../lib/dev-proxy.mjs';
import { cmsConfiguration } from '../lib/cms-config.mjs';
import {renderDocument} from '../lib/page.mjs';
const port=Number(process.env.DEV_PORT||4319);
const output=join(root,'dist');
await ensurePortAvailable(port);await ensurePortAvailable(8081);
await build({local:true});
const proxy=spawn(process.execPath,[join(root,'node_modules/decap-server/dist/index.js')],{cwd:root,env:{...process.env,BIND_HOST:'127.0.0.1',PORT:'8081',LOG_LEVEL:'info'},stdio:['ignore','pipe','pipe']});
proxy.stderr.on('data',data=>process.stderr.write(data));
await waitForProxy(proxy);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.ttf':'font/ttf','.wasm':'application/wasm'};
const server=http.createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  const allowedHosts=new Set([`localhost:${port}`,`127.0.0.1:${port}`]);
  if(!allowedHosts.has(req.headers.host)){res.writeHead(403);res.end('Local host only');return;}
  try{
    if(await localMediaRoute(req,res,root,port))return;
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
    let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(pathname==='/'||pathname==='/index.html'){
      res.setHeader('Content-Type','text/html; charset=utf-8');
      const data=await readContent();
      const html=renderDocument(await readFile(join(root,'public/index.html'),'utf8'),{...data,build:{revision:'local'}});
      res.end(req.method==='HEAD'?'':html);return;
    }
    if(pathname==='/admin/runtime.json'||pathname==='/admin/config.json'){
      res.setHeader('Content-Type','application/json; charset=utf-8');
      res.end(JSON.stringify(pathname.endsWith('runtime.json')?{mode:'local',cloudinary:false}:cmsConfiguration(process.env,true).config));return;
    }
    if(pathname==='/content.json') {
      const content=await readContent();
      res.setHeader('Content-Type','application/json; charset=utf-8');
      res.end(JSON.stringify({...content,build:{time:new Date().toISOString(),revision:'local'}}));return;
    }
    const path=resolve(output,`.${pathname.endsWith('/')?pathname+'index.html':pathname}`);
    if(!path.startsWith(output+sep)){res.writeHead(403);res.end();return;}
    let actual=path;
    const source=resolve(root,'public',`.${pathname.endsWith('/')?pathname+'index.html':pathname}`);
    try{if((await stat(source)).isFile())actual=source;}catch{}
    if((await stat(actual)).isDirectory())actual=join(actual,'index.html');
    res.setHeader('Content-Type',mime[extname(actual)]||'application/octet-stream');
    res.end(req.method==='HEAD'?'':await readFile(actual));
  }catch(error){res.writeHead(error.code==='ENOENT'?404:500);res.end('无法加载此内容，请查看本地服务记录。');if(error.code!=='ENOENT')console.error(error.message);}
});
server.listen(port,'127.0.0.1',()=>console.log(`网站：http://localhost:${port}/\n作品后台：http://localhost:${port}/admin/\n仅限本机访问；本地模式没有云端账户认证。`));
let stopping=false;
function stop(){if(stopping)return;stopping=true;proxy.kill('SIGTERM');server.close(()=>process.exit());}
proxy.once('exit',()=>{if(!stopping){console.error('内容代理已停止，关闭网站服务以避免编辑错误工程。');stop();}});
process.on('SIGINT',stop);process.on('SIGTERM',stop);
