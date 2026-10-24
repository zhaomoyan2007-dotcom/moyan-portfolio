import { readFile, readdir, mkdir, cp, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { publicContent } from '../lib/content.mjs';
import { cmsConfiguration } from '../lib/cms-config.mjs';
import { prepareCMS } from '../lib/prepare-cms.mjs';
export const root=fileURLToPath(new URL('../',import.meta.url));
export function guardBuild(env){
  if(env.VERCEL&&String(env.VERCEL_GIT_COMMIT_REF||'').startsWith('cms/'))throw new Error('CMS草稿分支不生成公开预览；请在作品后台内预览。');
}
export async function readContent() {
  const site=JSON.parse(await readFile(join(root,'content/site.json'),'utf8'));
  const files=(await readdir(join(root,'content/projects'))).filter(x=>x.endsWith('.json')).sort();
  const records=await Promise.all(files.map(async file=>{
    const record=JSON.parse(await readFile(join(root,'content/projects',file),'utf8'));
    if(file!==`${record.id}.json`)throw new Error(`项目文件名与固定地址不一致：${file}`);
    return record;
  }));
  return publicContent(site,records);
}
export async function build({local=false,env=process.env}={}) {
  guardBuild(env);
  // Validate all content before replacing output so failed local builds preserve the last good site.
  const data=await readContent();
  await prepareCMS(root);
  const {config,configured}=cmsConfiguration(env,local);
  const output=join(root,'dist');
  await rm(output,{recursive:true,force:true});
  await mkdir(output,{recursive:true});
  await cp(join(root,'public'),output,{recursive:true});
  await mkdir(join(output,'admin'),{recursive:true});
  await writeFile(join(output,'content.json'),JSON.stringify({...data,build:{time:new Date().toISOString(),revision:env.VERCEL_GIT_COMMIT_SHA||'local'}},null,2));
  await writeFile(join(output,'admin/config.json'),JSON.stringify(config,null,2));
  await writeFile(join(output,'admin/runtime.json'),JSON.stringify({mode:local?'local':configured?'github':'unconfigured',cloudinary:!!config.media_library}));
  await cp(join(root,'lib/content.mjs'),join(output,'media.mjs'));
  return {projects:data.projects.length,photos:data.site.homePhotos.length,mode:local?'local':configured?'github':'unconfigured'};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try{console.log('Build complete:',await build());}catch(error){console.error('Build failed:',error.message);process.exitCode=1;}
}
