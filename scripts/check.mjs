import { readdir,readFile,stat } from 'node:fs/promises';
import { join,resolve,extname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { root,readContent } from './build.mjs';
async function files(path){const result=[];for(const item of await readdir(path,{withFileTypes:true})){const full=join(path,item.name);if(item.isDirectory()){if(item.name!=='vendor')result.push(...await files(full));}else result.push(full);}return result;}
const scripts=(await Promise.all(['public','lib','api','scripts'].map(dir=>files(join(root,dir))))).flat().filter(file=>['.js','.mjs'].includes(extname(file)));
for(const script of scripts){const result=spawnSync(process.execPath,['--check',script],{encoding:'utf8'});if(result.status!==0)throw new Error(result.stderr);}
const data=await readContent();
for(const src of [data.site.hero,data.site.selectedPreview,...data.site.homePhotos,...data.projects.flatMap(p=>[p.cover,...p.images])]){
  if(src.startsWith('/')){const path=resolve(root,'public',`.${src}`);if(!(await stat(path)).isFile())throw new Error(`图片缺失：${src}`);}
}
const html=await readFile(join(root,'public/index.html'),'utf8');
if(/reference-landscape|reference-portrait|hasselblad\.com/.test(html))throw new Error('正式页面仍依赖第三方参考图片');
console.log(`Checked ${scripts.length} scripts, content schema and all local content images.`);
