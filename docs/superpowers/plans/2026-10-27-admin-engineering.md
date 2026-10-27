# 后台流程与工程整理 Implementation Plan

> **For agentic workers:** Execute inline with superpowers:executing-plans; no delegation or publishing.

**Goal:** 保持官网外观和正式内容不变，按页面顺序整理后台并修复预览偏差。

**Architecture:** 保留 settings/site 和 projects 集合名称及现有 JSON 路径；隐藏停用字段而非迁移内容。浏览器只加载共享媒体助手，服务端校验继续放在 lib。后台预览复用现有 about 和 films 样式。

**Tech Stack:** 原生 JS、Decap 3.17.1、Node test runner。

### 1. 配置与编辑顺序
- [x] tests/cms-workflow.test.mjs 添加首页、关于、项目顺序与停用字段隐藏的检查，运行 `node --test tests/cms-workflow.test.mjs` 确认失败。
- [x] lib/cms-config.mjs 按 hero → intro → selectedPreview → filmIntro → aboutPage 排列；关于内容按 intro → capabilities → plans → cooperation → contacts 排列。
- [x] 隐藏 homePhotos/about/contactEmail/contactURL/contactLabel，保留历史 JSON；项目类别置前、影像与职责在介绍前、发布及固定地址置后；添加按官网栏目排列的 view_filters。

### 2. 浏览器与服务端边界
- [x] tests/cms-workflow.test.mjs 验证浏览器模块只导出媒体函数、不导出 publicContent；使用既有媒体安全用例确认行为不变。
- [x] public/media.mjs 提取 galleryLayout/safeMediaURL/imageURL/filmProjects/filmImages；lib/content.mjs 重导出旧 API；scripts/build.mjs 不再将服务端校验复制到浏览器。
- [x] tests/auth.test.mjs 检查未设置 scope 时使用 public_repo，显式 repo 继续兼容；lib/oauth.mjs 仅改变缺省授权范围。

### 3. 预览与操作提示
- [x] 新增 public/admin/project-category.mjs：委托原生 select，仅提供界面类别标识；admin.css 通过语义字段容器隐藏无关项，值仍挂载保留。已在实际后台切换短片→人像→短片验证。
- [x] public/admin/site-preview.mjs 展示开场、介绍、剧场、短片简介及关于；提供区域定位链接，中英均能预览。
- [x] public/admin/film-preview.mjs 使用 film-project/film-stills/film-details 结构，移除前台已删除的职责与阐述标签；boot.js 引入 films.css，所有摄影项目统一调用 photoPreview。
- [x] public/admin/preview.css 仅做后台适配，桌面切片三列，与官网同一规则；不修改 public/films.css 或官网 CSS。
- [x] tests/cms-workflow.test.mjs 验证预览顺序、全部切片保留、职责在阐述前以及旧数据兼容。

### 4. 验证与交付
- [x] `npm test`、`npm run check`、`npm run build` 全部通过。
- [x] 比较重构前后 publicContent 导出的内容完全一致；确认 content/ 无改动。
- [x] 实际浏览本地后台的首页资料、项目筛选、表单顺序和中英预览，并检查前台外观未变。
- [x] README 更新当前操作说明，给出本地入口与简短文件清单；不提交、不推送、不发布。

验收证据见 docs/reviews/2026-10-27-admin-engineering.md。
