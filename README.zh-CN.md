# Anna AI Studios 官网

面向创意与技术团队的双语前沿部署式 AI 工程官网。

## 路由与结构

- `/`：英文主站
- `/zh/`：简体中文站
- `styles.css`：共享视觉系统与响应式布局
- `script.js`：滚动视频映射、导航与内容显现
- `shader-background.js`：Three.js 铜互连和光子叠加层
- `assets/brand/`：公开品牌资产、Sora 提示词和主视觉媒体
- `assets/cases/`：已批准并完成网页压缩的 Anna Lab 案例图片

首版为纯静态站，不使用分析脚本、Cookie、表单或数据库。咨询入口直接使用邮件。

## Anna Lab 案例

- 《无名神》：Codex + Seedance 2.5 长片制作控制系统。
- 《烟花》：具备资产血缘和反退化门禁的 Codex + Seedance 2.5 动画短片工作流。
- 汤喜馄饨：AI 辅助双语品牌识别与宣传物料交付。

`assets/cases/` 只保存已批准的网页派生图，不复制原始制作目录。包装信息和产品声明继续保留人工生产门禁。

## 本地预览

```powershell
git clone https://github.com/KeWangFX/anna-ai-studios.git
cd anna-ai-studios
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

目标 Cloudflare Pages 项目为 `anna-ai-studios`。构建脚本会清空并重建 `cloudflare-release/`，只发布公司站、品牌资产、精选案例图片、本地 Three.js 和创始人照片；旧作品集、家庭素材和私有制作源文件不包含在此仓库中。

## GitHub Pages 镜像

独立源码仓库为 `KeWangFX/anna-ai-studios`。每次推送到 `main` 后，`.github/workflows/deploy-pages.yml` 会重新执行同一套公开白名单构建，并且只把 `cloudflare-release/` 上传到 GitHub Pages。Cloudflare 保持 canonical 正式域名，GitHub Pages 作为部署镜像。
