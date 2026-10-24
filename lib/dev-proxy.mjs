import net from 'node:net';
export function ensurePortAvailable(port){
  return new Promise((resolve,reject)=>{
    const server=net.createServer();
    server.once('error',()=>reject(new Error(`本地端口 ${port} 已被占用，请先关闭对应开发服务。`)));
    server.listen(port,'127.0.0.1',()=>server.close(resolve));
  });
}
export function waitForProxy(child,timeout=15000){
  return new Promise((resolve,reject)=>{
    let logs='';
    const timer=setTimeout(()=>fail(new Error('本地内容代理启动超时')),timeout);
    function clean(){clearTimeout(timer);child.off('error',fail);child.off('exit',exit);child.stdout.off('data',data);}
    function fail(error){clean();child.kill();reject(error);}
    function exit(){fail(new Error('本地内容代理未成功启动'));}
    function data(chunk){logs+=chunk.toString();if(logs.includes('Proxy Server listening')){clean();resolve();}}
    child.once('error',fail);child.once('exit',exit);child.stdout.on('data',data);
  });
}
