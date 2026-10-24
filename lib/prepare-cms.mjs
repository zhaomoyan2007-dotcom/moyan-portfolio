import { access, mkdir, readFile, readdir, copyFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const version='3.17.1';
const integrity='0epqKYflLqinF/UKYXQkOkQf3g3oSfc+Dy5tqDmzWhQuLTgrOEXadp7fS16Mo4kA9j2+du/nVhus1J8XWssPDg==';
export async function prepareCMS(root){
  const destination=join(root,'public/admin/vendor');
  try{await access(join(destination,'decap-cms.js'));return;}catch{}
  const cache=join(root,'.cache');await mkdir(cache,{recursive:true});
  const packed=spawnSync('npm',['pack',`decap-cms@${version}`,'--ignore-scripts','--pack-destination',cache,'--json'],{encoding:'utf8',maxBuffer:1024*1024});
  if(packed.status!==0)throw new Error('无法从npm取得已固定版本的Decap CMS，请检查构建网络。');
  const archive=join(cache,`decap-cms-${version}.tgz`);
  if(createHash('sha512').update(await readFile(archive)).digest('base64')!==integrity)throw new Error('Decap CMS包完整性校验未通过');
  const unpack=join(cache,'cms');await mkdir(unpack,{recursive:true});
  const extracted=spawnSync('tar',['-xzf',archive,'-C',unpack,'package/dist'],{encoding:'utf8'});
  if(extracted.status!==0)throw new Error('无法解压已验证的CMS运行资源');
  await mkdir(destination,{recursive:true});
  for(const name of await readdir(join(unpack,'package/dist'))){
    if(!name.endsWith('.map'))await copyFile(join(unpack,'package/dist',name),join(destination,name));
  }
}
