# Anna AI Studios 官网

面向创意与技术团队的双语生产级 AI 系统官网。

## 路由与结构

- `/`：英文主站
- `/zh/`：简体中文站
- `/systems/production-ai/` 与 `/zh/systems/production-ai/`：生产级 AI 系统
- `/systems/growth-automation/` 与 `/zh/systems/growth-automation/`：增长自动化系统
- `/products/` 与 `/zh/products/`：DateLens 与 FrameFetch 产品目录
- `/privacy/` 与 `/zh/privacy/`：咨询数据隐私说明
- `styles.css`：共享视觉系统与响应式布局
- `script.js`：桌面主片滚动映射、稳定深链、导航与留言表单逻辑
- `shader-background.js`：Three.js 铜互连和光子叠加层
- `assets/brand/`：公开品牌资产、响应式 Logo、社交分享卡、Sora 提示词和主视觉媒体
- `assets/cases/`：已批准并完成网页压缩的 Anna Lab 案例图片
- `assets/products/`：已版本化并完成网页压缩的 DateLens 与 FrameFetch 宣传图
- `assets/contact/`：公开使用的裁切版微信二维码；手机原始截图不进入发布目录

公开网站保持静态，不使用行为分析或广告 Cookie。结构化留言通过 Cloudflare Turnstile 验证后，以原生 POST 交给 Google Apps Script 发送工作室通知与自动回执，并保留邮箱、WhatsApp 和微信直达入口。邮件后端在 Script Properties 中保存有限的投递与反滥用台账，与公开网站分开维护。

## 联系方式与留言命名

中英文表单统一使用以下邮件主题：

```text
[ANNA-LEAD][EN|ZH][SERVICE-CODE] ANNA-YYYYMMDDhhmmss-XXXX
```

邮件主题使用 ASCII 路由信息和 Lead ID 方便对应查询；姓名、公司／团队与项目正文在提交的邮件字段中保留原文，包括中文内容。每条留言同时包含可排序 Lead ID、UTC 接收时间、语言与来源页面。所有者已授权发信与外部请求权限，Apps Script Web App 第 1 版于 2026 年 10 月 24 日部署，两种语言使用同一实际端点。后端源码、manifest 与离线测试保存在 `backend/apps-script/`，不会进入静态发布目录。授权预检显示当天剩余 100 个邮件收件人额度、验证密钥已配置；已部署后端现已启用，等待受控实收验证。保留 Turnstile 服务端验证与隐藏反垃圾字段；token 的 cData 必须与 Lead ID 相符，内容修改或验证过期后须重新验证。Gmail 可用 `subject:"[ANNA-LEAD]"` 筛出网站咨询，用 `subject:"[ANNA-RECEIPT]"` 筛出回执。MailApp 接受发送不代表最终送达；中英文通知与回执都需真实实收后才能完成验收。

当前个人 Google Apps Script 免费额度为每天 100 个邮件收件人。后端采用更低的滚动限制：24 小时最多 20 条咨询、每小时 5 条、同一提交邮箱 24 小时 2 条，并预留 2 个收件人额度。每条咨询发送两封邮件，发送前检查实时剩余额度，不足时停止且不切换付费服务。安全验证另限制为 24 小时 200 次、每分钟 10 次；无效请求也可能消耗共享验证额度，因此不宣称具备 DDoS 防护能力。调整前需重新核对 [Google 官方额度](https://developers.google.com/apps-script/guides/services/quotas)。Google 服务在中国大陆的直接可达性尚未验证，必须保留直接联系方式，不宣称大陆可用。

- 邮箱：`keke19870699@gmail.com`
- WhatsApp：页面显示 `+44 7516 141043`，链接使用 `+447516141043`
- 微信：`kewangfx`，二维码为 `assets/contact/wechat-kewangfx-qr.png`

国际格式不能写成 `+44 075...`；使用英国国家码后必须去掉本地号码前导 `0`。

## 首页性能

桌面端保留一段有边界的电路滚动叙事。手机端使用单屏静态 Hero，不加载章节视频和 WebGL。完整服务与产品内容进入独立页面，首页只承担定位、交付证据和咨询转化。

## Anna Lab 案例

- 《无名神》：Codex + Seedance 2.5 长片制作控制系统。
- 《烟花》：具备资产血缘和反退化门禁的 Codex + Seedance 2.5 动画短片工作流。
- 汤喜馄饨：AI 辅助双语品牌识别与宣传物料交付。

`assets/cases/` 只保存已批准的网页派生图，不复制原始制作目录。包装信息和产品声明继续保留人工生产门禁。

## 产品

- `DateLens`：注重隐私的媒体证据产品预览；卡片会根据真实服务状态明确标注实时分析是否可用。
- `FrameFetch`：解析已获授权的公开视频链接、选择可用清晰度，并通过浏览器或桌面助手交付媒体。

两张产品卡只使用经过核实的正式网址、功能边界和状态文案。产品可用性、价格或能力变化时，必须同步更新状态说明并提升宣传图版本。

## 客户增长系统

- `AI 电话前台`
- `自动化评价管理`
- `获客型网站`

三个服务 CTA 会把稳定服务代码自动带入咨询表单；核心 FDE 项目类型仍排在下拉选项前部。

## 本地预览

```powershell
cd D:\job\codex\keWang_website
npm run preview
```

访问 `http://localhost:4174/` 和 `http://localhost:4174/zh/`。

## 主视觉媒体

正式提示词保存在 `assets/brand/circuit-hero-prompt.txt`。仓库当前包含一条由晶圆 poster 生成的 8 秒轻量动态占位片；Sora 成片通过后可直接同名替换。

Header、移动端标记、页脚与社交分享分别使用品牌系统的独立 v1 导出。后续修改必须提升版本号。由于电路主片和案例文件还没有内容哈希，公开媒体采用一天缓存加后台重新验证，不再对未哈希路径使用一年 immutable。

短 GOP 编码用于提升滚动拖帧响应，具体命令见英文 README。视频只会在允许动态且未开启省流量模式时挂载；Three.js 在桌面端首屏完成后按需加载。移动端、减少动态和省流量路径不会下载 WebGL 依赖。

## 构建与部署

```powershell
npm run validate
npm run cf:build
npm run cf:deploy
```

目标 Cloudflare Pages 项目为 `anna-ai-studios`。构建脚本会清空并重建 `cloudflare-release/`，只发布公司站、品牌与联系资产、精选产品和案例图片、本地 Three.js 和核心成员照片；旧作品集、手机原始截图及家庭素材继续保存在仓库中，但不会公开发布。

## GitHub Pages 镜像

独立源码仓库为 `KeWangFX/anna-ai-studios`。每次推送到 `main` 后，`.github/workflows/deploy-pages.yml` 会重新执行同一套公开白名单构建，并且只把 `cloudflare-release/` 上传到 GitHub Pages。Cloudflare 保持 canonical 正式域名，GitHub Pages 作为部署镜像。
