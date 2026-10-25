# 上传前自动压缩

用户已要求实现上传前自动缩图与压缩，批量、原文件保留、错误可见。采用浏览器WebP副本，长边3000px、不放大、目标4MB，必要时降低质量/尺寸。仅静态JPEG/PNG/WebP；拒绝动画和不支持的格式。源文件上限100MB/6000万像素。已有Cloudinary库选择保留。

- [x] 添加压缩/授权边界测试，先观察失败。
- [x] 实现客户端压缩模块和批量上传媒体库；复用Cloudinary官方库选择已有图片。
- [x] GitHub所有者回调签发1小时HttpOnly上传会话；服务端固定签名参数，拒绝跨源/匿名请求，不在前台暴露Secret。增加CLOUDINARY_API_SECRET配置。
- [x] 更新后台配置、接入说明、测试并构建。
- [ ] 浏览器验证真实大图处理、失败/重试与现有选择入口；上传公开代码并验证部署。真实上传需作者在Vercel加入Secret后验收。

Verification: 22 tests, syntax/content check and build passed. Browser verified 28,155,691-byte JPEG to 3,320,662-byte WebP (3000x2000), orientation 6 to upright 200x300, transparent PNG not enlarged, batch error/retry and local simulated upload. No fixture photo was sent to Cloudinary. Real upload remains pending user secret configuration.
