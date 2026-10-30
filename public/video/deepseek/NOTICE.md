# DeepSeek 透明动画

上游：[PC2005-cloud/dsh-pet](https://github.com/PC2005-cloud/dsh-pet)。按 manifest 固定提交下载，文件字节与 Git blob/SHA256 校验一致。

素材许可见保留的 UPSTREAM-README.md「许可」段：允许开源使用，禁止商用；衍生作品须附上原作者 GitHub 地址。角色形象原型「溟月」来自上善无形，鲸鱼女仆设计来自 ZipZipPipe，形象按 CC BY-NC-SA 4.0。不是 DeepSeek 官方形象。上游软件代码 MIT 不覆盖这些形象权益。

本项目引入十段透明 WebM，直接由浏览器视频解码播放。待机与行走可循环，互动动作按单次事件播放；食物/抚摸通过对应片段表达。源文件保留完整画面，显示区域另行做透明边界检查。
