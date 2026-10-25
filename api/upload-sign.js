import {authConfig} from '../lib/oauth.mjs';
import {verifyUploadCookie,uploadTicket} from '../lib/cloud-upload.mjs';
export default function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST'){res.status(405).json({error:'Method not allowed'});return;}
  let config;
  try{config=authConfig();}catch{res.status(503).json({error:'后台授权未配置'});return;}
  if(req.headers.origin!==config.origin){res.status(403).json({error:'请从原来的作品管理后台上传'});return;}
  try{verifyUploadCookie(req.headers.cookie,config.owner,config.secret);}catch(error){res.status(401).json({error:error.message});return;}
  try{res.status(200).json(uploadTicket(process.env));}catch(error){res.status(503).json({error:error.message});}
}
