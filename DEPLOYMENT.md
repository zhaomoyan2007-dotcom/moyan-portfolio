# 账户接入与部署

## 1. GitHub

目标仓库为`zhaomoyan2007-dotcom/moyan-portfolio`，用户已选择保持公开，仅上传可公开的网站文件。密钥、账户凭据、原片、本地路径记录不提交。源码仓库公开与正式网站发布是不同步骤。

`main`作为正式分支；Decap工作流创建`cms/`草稿分支，最终发布才合并主分支。若以后添加必需CI检查，注意CMS草稿分支被禁止生成公开预览，不应要求该预览部署通过才能发布。

## 2. Vercel

登录自己的Vercel账户，导入此GitHub仓库，Root Directory选仓库根目录。配置文件已设定构建命令`npm run build`与输出目录`dist`，无需选择Next.js或其他框架。

第一次可以不填账户变量，只发布静态网页和后台接入说明。取得真实的HTTPS站点地址后，使用它配置后续授权；不要在域名尚未购买、解析时提前填入不可用网址。

使用免费套餐前核对Vercel非商业个人用途规则与额度。域名购买独立计费；任何付费升级必须另行确认。

## 3. GitHub OAuth App

这是网站作者登录作品后台所需的应用，与本次协助上传代码的ChatGPT Codex Connector不是同一应用。

在GitHub自己的Developer settings中新建OAuth App：Homepage URL填实际站点来源；Authorization callback URL填同一来源后加`/api/callback`。生产OAuth只允许配置的网站来源，并校验登录者为网站所有者。

Client ID和Client Secret写入Vercel环境变量，Secret不能写进仓库或发到聊天。对于当前公开仓库，`GITHUB_OAUTH_SCOPE`使用`public_repo`；这是GitHub OAuth对公开仓库的权限范围，不能进一步用该参数缩小到单个仓库。授权时应了解这一范围；若需要单仓库精细授权，需另行改为GitHub App方案。

## 4. Cloudinary

使用作者自己的账户，取得Cloud name与API key，填到对应Vercel变量。API key用于媒体库连接，可以出现在客户端配置；不要把API secret填到任何公开配置。已有图片库继续使用账户登录授权。新增自动压缩上传需要将API secret仅填入Vercel的CLOUDINARY_API_SECRET（Production、Sensitive）。它只由服务端签名接口读取，不进入config.json或网页，也不要发到聊天。

免费额度由存储、处理与传输共同消耗；需要用实际图片与访问规模验证。原片继续保留原有备份。

## 5. Vercel环境变量

| 名称 | 用途 |
| --- | --- |
| SITE_URL | 实际HTTPS来源，不能含子路径、查询或账号密码 |
| GITHUB_REPOSITORY | `zhaomoyan2007-dotcom/moyan-portfolio` |
| GITHUB_BRANCH | `main` |
| GITHUB_OWNER | `zhaomoyan2007-dotcom` |
| GITHUB_CLIENT_ID | 自建OAuth App的Client ID |
| GITHUB_CLIENT_SECRET | 自建OAuth App的Secret，仅服务器使用 |
| OAUTH_STATE_SECRET | 密码管理器生成的至少32字符随机值，仅服务器使用 |
| GITHUB_OAUTH_SCOPE | 当前公开仓库使用`public_repo` |
| CLOUDINARY_CLOUD_NAME | 图片账户的Cloud name |
| CLOUDINARY_API_KEY | 图片账户的公开API key |
| CLOUDINARY_API_SECRET | 自动压缩上传签名，仅服务器使用 |

变量填好后重新部署，`/admin/`才进入线上登录。`.env.example`只列变量名；不得提交填入真实值的`.env`文件。平台环境变量的真实值不打印到检查记录。

## 6. 正式发布验收

- GitHub所有者账号能登录，其他账号不能取得后台授权。
- 实际批量上传至Cloudinary，预览并检查图片色彩与压缩质量。
- 新建草稿、编辑已有作品保存草稿时，正式站仍显示旧版；完成发布并等待构建后才出现改动。
- `cms/`分支不能生成可公开的预览部署；不依赖某个账户的默认预览保护设置。
- 取消授权、登录超时、上传或构建失败时，不显示虚假的成功状态。
- 发布与撤下后检查项目链接、首页精选、全部分类和双语显示。
- 使用国内普通网络、海外网络分别测试图片加载；保留设备、地区与测试时间记录。
- 原始测试图、介绍和版式在用户后续内容迭代时再调整，正式首发前确认可公开资料。

## 7. 域名

`zhaomoyan.com`已选定，购买状态尚未确认。待网站与后台接通后，再通过Vercel项目Domains页面取得实际DNS记录，在域名服务商配置。不预先写死IP地址。

若将SITE_URL切换到独立域名，OAuth App的Homepage和callback也要同步更新，并重新部署。后续采用大陆托管或大陆加速时，再按实际资源办理备案；仅购买域名不代表完成备案。

## 自动压缩上传（2026-10-25）

- 后台继续从原vercel.app地址进入。保存新变量并部署后，先退出CMS再用GitHub登录，以取得1小时有效的HttpOnly上传会话。过期会明确提示重新登录。CMS退出不会立即撤销该上传会话，共享设备应清除本站数据。
- “选择照片并自动压缩”在本地处理副本并直接上传；“从Cloudinary图片库选择”保留已有图片选择。Cloudinary库内原生Upload不经过自动压缩，请用新入口上传大图。
- 静态JPEG、PNG、WebP转WebP，最长边3000、不放大、保留透明、目标4MB以内，必要时降低质量和尺寸。有损转换移除EXIF/定位信息，浏览器使用sRGB画布。高要求作品请比对色彩，网页副本不能代替原片备份。
- 不支持RAW、HEIC和动画，拒绝超过100MB或6000万像素的照片。批量顺序处理，显示逐张进度、失败和重试；成功项可以插入。关闭窗口会取消剩余任务，但已成功上传的图片仍保留在Cloudinary。
- 当前网站已完成真实登录、Cloudinary上传、工作流发布，新域名moyan.ddnsfree.com已通过用户不挂代理的访问测试。本次新增签名上传需配置新Secret后再做真实上传验收。

## 初始接入记录（历史状态）

真实Vercel账户导入、Cloudinary账户绑定、自建OAuth App、域名购买与解析、跨地区验收。不把本机测试替代这些步骤。
