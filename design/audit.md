# Anna AI Studios 网站设计审查

target: https://anna-ai-studios.pages.dev/ and https://anna-ai-studios.pages.dev/zh/
goal: 在保留高端、生产级 AI 工程品牌感的前提下，更快建立信任并转化合格咨询。
reviewed: 2026-07-31；桌面 1440×900、手机 390×844；中英文首页、服务、案例、联系、SEO、表单与主要静态资源。

## 结论

视觉完成度高，响应式、SEO、无障碍基础和资源策略也明显高于一般工作室网站。当前主要瓶颈不是“做得不够漂亮”，而是：

1. 高端生产级 AI 工程、面向中小企业的增长自动化、独立产品三套叙事挤在同一首页，定位被稀释。
2. 首页约 20,000 px、10 个 section、75 个段落；手机端接近 25 个视口，核心证据和联系入口到达过晚。
3. 服务导航存在真实错位：Header 的“服务 / Services”指向增长服务子区，而不是完整能力区；带 hash 的深链也会被动态 Hero 高度变化推离目标。
4. 案例很诚实，但大多是内部或进行中项目，证明了工程纪律，还没有充分证明客户结果。
5. 联系表单收集个人数据，但目前只有 FormSubmit 隐私 PDF 和一句同意文本，缺少 Anna AI Studios 自己的分层隐私说明。

## 优先级问题

| # | area | issue | sev | concrete fix | eff |
|---|---|---|---|---|---|
| 1 | positioning | “生产级 AI 系统”“AI 电话前台/评价管理/获客网站”“DateLens/FrameFetch”共用一条首页叙事，三个 ICP 互相稀释 | HIGH | 首页只保留一个核心承诺；在首屏后明确分成“创意与技术团队的生产 AI”与“业务增长自动化”两条入口；Products 独立为二级页面 | M |
| 2 | navigation | Header“服务 / Services”链接到 `#services`，直接落在“三套业务一线系统”，跳过 `#capabilities` 的四项生产 AI 能力 | HIGH | Header 服务链接统一改为 `#capabilities`；将增长服务改成独立导航项或落地页 | S |
| 3 | navigation | 新开 `/#capabilities` 时，Hero 动态扩高后锚点发生约 1,684 px 偏移；Hero 的“跳到服务内容”实测停在 Journey 最后一幕，而非服务区 | HIGH | Journey 初始化、字体和媒体尺寸稳定后，若存在 `location.hash`，用两帧 `requestAnimationFrame` 再执行目标 `scrollIntoView()`；同时避免 Hero 增强造成布局高度二次变化 | S |
| 4 | flow | 桌面首页约 19,000–20,000 px；中文手机约 20,819 px；手机 Hero Journey 单独占 2,532 px | HIGH | 首页压缩到约 8–12 个视口；手机取消 3 屏滚动叙事，改成 1 屏 Hero + 静态四步条；产品详情和完整案例移到子页面 | M |
| 5 | proof | 现有案例证明“系统复杂度”，但缺少商业/生产结果；465 镜、SHA 血缘、人工门禁是规模与方法，不是结果指标 | HIGH | 每个案例使用“问题 → 约束 → 架构 → 结果 → 当前状态”结构；仅加入真实测量的交付周期、返工率、人工审片时间、失败隔离率、成本或采用率 | M |
| 6 | privacy/trust | 表单采集姓名、邮箱、公司和项目说明，却没有 Anna 自有隐私页说明控制者、处理目的、依据、第三方、保留期限和数据主体权利 | HIGH | 新增中英文 `/privacy/`；表单旁使用两层说明并明确 FormSubmit；由合格人员复核 UK GDPR 适用性 | M |
| 7 | conversion | “发起合作 / Start a project”承诺感较高；“两个工作日内回复”只在页面最底部出现 | MED | 首屏主 CTA 改为“预约 30 分钟系统评估 / Book a 30-min systems review”，副 CTA 为“查看生产案例”；首屏立即显示“2 个工作日内回复” | S |
| 8 | localisation | “前沿部署式工程”是 Forward Deployed Engineering 的直译，对中文买家不够直接；手机标题断成“让 AI 真 / 正进入” | MED | 中文定位改为“生产级 AI 系统落地”或“面向真实工作流的 AI 工程”；用语义化 span/断点控制标题换行，避免拆开“真正” | S |
| 9 | credibility | `pages.dev` 域名和个人 Gmail 与高端工程服务的品牌等级不匹配；DNEG 身份与独立工作室关系也可更明确 | MED | 启用自有域名和 `hello@...` 邮箱，并配置 SPF/DKIM/DMARC；在 Studio/footer 明确工作室独立性，避免雇主或客户背书歧义 | S |
| 10 | measurement | 页面未观察到分析脚本，无法知道用户在哪个区段流失、哪个案例促成咨询 | MED | 加一套最小化、第一方或隐私友好的事件模型：`hero_cta`、`case_open`、`product_open`、`form_start`、`form_submit_success`、`language_switch` | M |
| 11 | semantics/perf | 手机 Logo 文件自然尺寸 72×72，但 HTML `width="320" height="80"`，内在宽高比与资源不符 | LOW | 为桌面/手机 Logo 使用各自正确的尺寸属性或 `<picture>`，避免初始占位比例和最终 CSS 比例不一致 | S |

## 建议的新信息架构

### 首页

1. Hero：为谁、解决什么、为什么可信；一个主 CTA、一个案例 CTA。
2. Proof strip：真实且获准公开的数字、客户类别、部署状态。
3. 两条解决方案路径：
   - Production AI Systems：多模态、Agent、集成、评估与人工门禁。
   - Growth Automation：电话前台、评价工作流、获客网站。
4. 三个精选案例摘要，每个只展示一个约束、一个系统图、一个结果。
5. 四步交付流程。
6. Ke Wang / Studio 信任区。
7. 简化联系入口。

### 子页面

- `/systems/production-ai/`
- `/systems/growth-automation/`
- `/lab/nameless-god/`
- `/lab/fireworks/`
- `/lab/tangxi/`
- `/products/`
- `/studio/`
- `/contact/`
- `/privacy/` 和 `/zh/privacy/`

首页负责判断与路由，子页面负责证明深度。不要在首页同时承担完整作品集、产品目录、方法论和询盘表单四种角色。

## 建议首屏文案

### 中文

**生产级 AI 系统，真正进入你的工作流。**

Anna AI Studios 为创意与技术团队设计、集成并运营可控、可观测、有人类审批门禁的 AI 系统。

- 主 CTA：预约 30 分钟系统评估
- 次 CTA：查看生产案例
- 信任微文案：伦敦 / 全球交付 · 2 个工作日内回复

### English

**Production AI systems that survive real work.**

We design, integrate and operate controllable AI systems for creative and technical teams—from multimodal workflows to human-gated agents.

- Primary CTA: Book a 30-min systems review
- Secondary CTA: See production cases

## 应保留的部分

- 黑、铜、青色系统和电路叙事有明确识别度；英文 Hero 尤其强。
- 中英文 canonical、hreflang、sitemap、robots、Open Graph、Twitter Card、JSON-LD 均已配置。
- 图片有明确尺寸，绝大多数下方图片采用 lazy loading；Hero poster 预加载。
- CSS/JS 约 104 KB；Hero 视频约 354 KB（mobile MP4）/ 681 KB（desktop WebM），静态资源规模合理。
- 有 skip link、`:focus-visible`、`prefers-reduced-motion`、表单 label/autocomplete/error 描述，手机主触控目标达到约 44–52 px。
- 案例明确标注“进行中”和生产边界，没有伪造客户结果，这一点应保留。

## 隐私说明

ICO 当前指南说明，直接收集个人数据时应在收集时提供清晰、易访问的隐私信息，包括处理目的、合法依据、接收方、保留期限和个人权利等。指南在 2026 年法律更新后仍在复审，因此隐私页完成后应做一次正式合规复核：

- https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/the-right-to-be-informed/what-privacy-information-should-we-provide/

## AI 增强建议

表单改成自有后端后，可增加“只辅助、不自动发送”的线索处理：

`contact form → spam/rate limit → structured lead → service/urgency classification → draft response → human approval → reply`

不要把保密制作素材或完整项目说明默认发送给第三方模型；先做字段级最小化、供应商数据政策确认和人工审批。

## 推荐实施顺序

1. 修锚点与 Header 服务链接。
2. 改首屏中文定位、CTA 和手机换行。
3. 拆分 Production AI / Growth Automation 两条路径并压缩首页。
4. 建三个独立案例页，补真实结果指标。
5. 上自有域名、品牌邮箱、隐私页和最小事件分析。

notes: 已检查 DOM、主要视觉断点、表单语义、触控尺寸、SEO 和静态资源；未做真实屏幕阅读器、完整键盘遍历、真实网络节流或生产表单提交测试。
verdict: 这是一个已经有强品牌识别的站点；优先修复定位、路径和证据层，会比继续增加动画或视觉细节带来更高回报。
