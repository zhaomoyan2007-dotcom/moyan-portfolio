# 第三方素材和软件

- Decap CMS 3.17.1：从npm官方注册表的精确版本包获取，MIT许可；`public/admin/vendor/`包含运行时分块及依赖许可证文件。npm包完整性：`sha512-0epqKYflLqinF/UKYXQkOkQf3g3oSfc+Dy5tqDmzWhQuLTgrOEXadp7fS16Mo4kA9j2+du/nVhus1J8XWssPDg==`。上游：https://github.com/decaporg/decap-cms 。未复制source map。
- decap-server 3.11.3：仅用于本机开发，精确版本与依赖记录在package-lock.json，不作为公开上传服务部署。simple-git固定为4.0.2以使用已修复的参数处理依赖。
- Outfit Light字体沿用原预览，OFL许可随字体保存于 `public/assets/fonts/OFL.txt`。
- 6张摄影测试图来自作者明确指定的深圳工作坊成品文件夹，沿用原预览导出的网页副本，不修改原图。来源校验记录保留在 `../moyan-preview/SELECTED_PHOTOS.json`。
- 正式工程不携带或请求哈苏参考照片；旧预览仍保留历史设计研究记录。
- Signature-Han.ttf：Google Fonts官方按“墨岩”两字提供的Noto Sans SC Regular子集，OFL许可保存在NotoSansSC-OFL.txt。来源：https://github.com/google/fonts/tree/main/ofl/notosanssc 。字体随站点托管，浏览器不请求Google Fonts。
- Signature-Latin.ttf：Google Fonts官方按MOYAN提供的Outfit Regular子集，沿用Outfit的OFL许可。不是哈苏专有字体；以开源字体重新实现几何字形、字重与字距关系。
