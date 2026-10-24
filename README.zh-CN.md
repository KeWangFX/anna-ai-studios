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

公开页面保持静态，不使用行为分析或广告 Cookie。中英文留言通过 Cloudflare Turnstile 验证后，以原生 POST 提交至 `https://anna-ai-studios.pages.dev/api/contact`，由只处理该路径的 Cloudflare Pages Worker 将原始请求转交 Google Apps Script，并在工作室域名显示结果。访客提交与查看结果无需直接打开 Google 域名，同时保留微信和邮箱人工联系入口。邮件后端在 Script Properties 中保存有限的投递与反滥用台账，与公开网站分开维护。

## 联系方式与留言命名

中英文表单统一使用以下邮件主题：

```text
[ANNA-LEAD][EN|ZH][SERVICE-CODE] ANNA-YYYYMMDDhhmmss-XXXX
```

邮件主题使用 ASCII 路由信息和 Lead ID 方便对应查询；姓名、公司／团队与项目正文在提交的邮件字段中保留原文，包括中文内容。每条留言同时包含可排序 Lead ID、UTC 接收时间、语言与来源页面。姓名、工作邮箱、项目类型、项目说明与隐私确认是必填项，公司／团队选填。原生字段校验、隐藏反垃圾字段与 Turnstile 用于减少滥用，不增加客户端追踪。

所有者已授权发信与外部请求权限。Apps Script Web App 第 3 版通过 `/exec?transport=relay-v1` 提供结构化响应，协议为 `anna-contact-relay-v1`；与旧版直接 POST 路径共用邮件校验、限额和幂等台账。查询选择项作为单值传输元数据严格校验并剥离，原有十二个业务字段保持不变。后端源码、manifest 与离线测试保存在 `backend/apps-script/`；转发程序与测试位于 `deploy/cloudflare/`。这些源码可以保存在 GitHub 仓库，后端文件不会进入公开静态构建，密钥则绝不能进入仓库。

转发程序只有一个固定上游，不转交访客 Cookie 或凭据，对请求和响应限制大小，仅跟随允许的 Google 结果重定向，不自动重复邮件 POST。只有通知和回执均获后端接受时才显示已提交处理；超时、部分发送或异常响应仍标记为无法确认，并提供人工联系入口。转发程序不会主动保存或记录咨询正文。

2026 年 10 月 24 日较早的直接 POST 实测曾在所有者控制的 Gmail 邮箱收到中英文通知与本地化回执共四封，并保留原始文本。该历史证据不代表新转发链路或中国大陆环境已经验证成功。第 3 版转发链路仍须取得自身的生产协议及真实邮件验收证据后才能标记通过。MailApp 接受发送本身不代表最终送达。Gmail 可用 `subject:"[ANNA-LEAD]"` 筛出咨询，用 `subject:"[ANNA-RECEIPT]"` 筛出回执。

保留 Turnstile 服务端验证，不在公开咨询中包含保密制作素材。token 的 cData 必须与 Lead ID 相符，内容修改或验证过期后须重新验证。验证 API 加载超时为 18 秒；自动验证阶段卡住 60 秒后会恢复发送按钮，人工验证期间暂停计时。

当前个人 Google Apps Script 免费额度为每天 100 个邮件收件人。后端采用更低的滚动限制：24 小时最多 20 条咨询、每小时 5 条、同一提交邮箱 24 小时 2 条，并预留 2 个收件人额度。每条咨询发送两封邮件，发送前检查实时剩余额度，不足时停止且不切换付费服务。安全验证另限制为 24 小时 200 次、每分钟 10 次；无效请求也可能消耗共享验证额度，因此不宣称具备 DDoS 防护能力。投递测试或调整限额前需重新核对 [Google 官方额度](https://developers.google.com/apps-script/guides/services/quotas)和账户实时余额。

Cloudflare Pages Functions 与同账户 Workers Free 共用每天 100,000 次请求额度，在 UTC 零点重置。本站只有 `/api/contact` 调用 Worker，静态资源绕过该程序。账户保持免费计划，发布前检查共享剩余额度，不启用付费升级或付费备用服务。提供商上限不等于当前可用余量。参见 2026 年 10 月 24 日核对的 [Cloudflare Pages Functions 价格说明](https://developers.cloudflare.com/pages/functions/pricing/)。

移除访客与 Google 的直连要求，并不代表中国大陆或微信内置浏览器能够稳定访问；网站域名和 Turnstile 仍须可达。大陆网络及真实微信设备证据应与桌面模拟、故障注入测试分别记录。GitHub 镜像共享 Cloudflare 咨询端点，不是独立的表单后端，也不是保证可用的大陆访问线路。

- 邮箱：`keke19870699@gmail.com`
- WhatsApp：页面显示 `+44 7516 141043`，链接使用 `+447516141043`
- 微信：`kewangfx`，二维码为 `assets/contact/wechat-kewangfx-qr.png`

双语备用入口提供“复制咨询内容”和“复制微信号”，无需调用邮件或验证服务。复制由访客明确操作，仅在本地整理文本，不发送咨询、不持久保存草稿；仅包含可见联系字段，允许内容尚未填完。剪贴板不可用或被拒绝时显示可选中的手动复制文本。访客检查后，自行通过微信或常用邮箱发送。二维码提示仅在提供识别选项时使用同手机长按，否则搜索微信号；无需微信 SDK 或付费集成。

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
cd C:\Users\kewang\Documents\job
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

目标 Cloudflare Pages 项目为 `anna-ai-studios`。构建脚本会清空并重建 `cloudflare-release/`，仅复制公司站、品牌与联系资产、精选产品和案例图片、本地 Three.js 和核心成员照片。Cloudflare 构建额外加入 `_worker.js`，并用 `_routes.json` 将调用范围限制为 `/api/contact`。Google 后端源码、测试、密钥、旧作品集、手机原始截图及家庭素材均不进入公开静态文件。

应先发布兼容的 Apps Script 版本并验证结构化转发响应，再切换公开表单；随后部署和验证 Cloudflare 端点，最后发布镜像。部署成功或离线测试通过，本身不代表生产协议和真实收件已验收。

## GitHub Pages 镜像

独立源码仓库为 `KeWangFX/anna-ai-studios`。推送到 `main` 后，`.github/workflows/deploy-pages.yml` 运行同一组测试，并以 `python scripts/build_cloudflare_dist.py --static-only` 构建，仅上传公开静态白名单，排除 Worker 程序和路由文件。Cloudflare 保持 canonical 正式域名。镜像表单仍提交至同一 Cloudflare 端点，有效结果页会返回原镜像对应语言页面；端点不可用时仍保留微信与邮箱人工联系入口。

## 本次链路发布检查

- 核对中英文表单、隐私说明、微信号和镜像返回地址一致。
- 分别测试剪贴板正常、拒绝和不可用；复制内容明确未发送，且不含隐藏字段。
- 单独记录生产转发协议、异常处理和通知／回执真实实收证据。
- 保留大陆网络与真实微信设备的测试范围限制，不将模拟测试写成实际可达性结论。
