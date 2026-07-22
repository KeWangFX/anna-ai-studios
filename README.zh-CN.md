# Anna AI Studios 官网

面向创意与技术团队的双语前沿部署式 AI 工程官网。

## 路由与结构

- `/`：英文主站
- `/zh/`：简体中文站
- `styles.css`：共享视觉系统与响应式布局
- `script.js`：主片滚动映射、信号路径动画、导航与留言表单逻辑
- `shader-background.js`：Three.js 铜互连和光子叠加层
- `assets/brand/`：公开品牌资产、Sora 提示词和主视觉媒体
- `assets/cases/`：已批准并完成网页压缩的 Anna Lab 案例图片
- `assets/contact/`：公开使用的裁切版微信二维码；手机原始截图不进入发布目录

网站保持纯静态，不使用分析脚本、Cookie 或数据库。结构化留言通过 FormSubmit 转发到 `keke19870699@gmail.com`，并保留邮箱、WhatsApp 和微信直达入口。

## 联系方式与留言命名

中英文表单统一使用以下邮件主题：

```text
[ANNA-LEAD][SERVICE-CODE][EN|ZH][YYYYMMDD] Company / Name
```

每条留言同时包含可排序 Lead ID、UTC 提交时间、语言与来源页面。FormSubmit 端点已经激活，保留 reCAPTCHA 与隐藏反垃圾字段。Gmail 可用 `subject:"[ANNA-LEAD]"` 单独筛出网站咨询。

- 邮箱：`keke19870699@gmail.com`
- WhatsApp：页面显示 `+44 7516 141043`，链接使用 `+447516141043`
- 微信：`kewangfx`，二维码为 `assets/contact/wechat-kewangfx-qr.png`

国际格式不能写成 `+44 075...`；使用英国国家码后必须去掉本地号码前导 `0`。

## 滚动信号路径

交付方式与案例之间新增一段“唱片沟槽 × 晶圆蚀刻”的程序化视觉。滚动进度映射到 8 秒的捕捉、编排、控制、决策四阶段。Canvas 使用确定性几何、DPR 上限 1.5，并且只在滚动或尺寸变化时重绘；移动端、短视口和减少动态模式使用静态画面与普通纵向内容。

## Anna Lab 案例

- 《无名神》：Codex + Seedance 2.5 长片制作控制系统。
- 《烟花》：具备资产血缘和反退化门禁的 Codex + Seedance 2.5 动画短片工作流。
- 汤喜馄饨：AI 辅助双语品牌识别与宣传物料交付。

`assets/cases/` 只保存已批准的网页派生图，不复制原始制作目录。包装信息和产品声明继续保留人工生产门禁。

## 本地预览

```powershell
cd D:\job\codex\keWang_website
npm run preview
```

访问 `http://localhost:4174/` 和 `http://localhost:4174/zh/`。

## 主视觉媒体

正式提示词保存在 `assets/brand/circuit-hero-prompt.txt`。仓库当前包含一条由晶圆 poster 生成的 8 秒轻量动态占位片；Sora 成片通过后可直接同名替换。当视频文件不存在、加载失败或设备开启减少动态效果时，页面自动使用晶圆 poster 与 WebGL 降级效果。

短 GOP 编码用于提升滚动拖帧响应，具体命令见英文 README。

## 构建与部署

```powershell
npm run cf:build
npm run cf:deploy
```

目标 Cloudflare Pages 项目为 `anna-ai-studios`。构建脚本会清空并重建 `cloudflare-release/`，只发布公司站、品牌与联系资产、精选案例图片、本地 Three.js 和核心成员照片；旧作品集、手机原始截图及家庭素材继续保存在仓库中，但不会公开发布。

## GitHub Pages 镜像

独立源码仓库为 `KeWangFX/anna-ai-studios`。每次推送到 `main` 后，`.github/workflows/deploy-pages.yml` 会重新执行同一套公开白名单构建，并且只把 `cloudflare-release/` 上传到 GitHub Pages。Cloudflare 保持 canonical 正式域名，GitHub Pages 作为部署镜像。
