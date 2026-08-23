# WOLFLAG 网站（复刻版 + 管理后台）

本仓库由原外贸独立站 www.wolflag.com（网易外贸通建站，已离线保存）完整复刻，所有内容可视化管理，部署于 GitHub + Cloudflare Pages，全程免费。

## 仓库结构

```
wolflag-site/
├── content/                 # 网站内容（JSON）—— 管理后台编辑的就是这些文件
│   ├── settings.json        # 导航/页脚/联系方式/版权
│   ├── home.json            # 首页内容
│   ├── about.json           # 关于我们 + FAQ
│   └── products/            # 4 个产品页（羽毛旗/横幅/国旗/旗杆展架）
├── media/                   # 图片库（原站 48 张图提取 + 后台可上传新图）
├── src/assets/              # 样式与脚本源文件
├── admin/                   # Decap CMS 管理后台
├── static/                  # 构建产物（Cloudflare Pages 直接发布这个目录）
├── scripts/
│   ├── extract.py           # 【一次性】从离线网页提取图片与内容
│   └── build.mjs            # 构建脚本（零依赖 Node ≥18）
└── README.md
```

## 本地预览

```bash
node scripts/build.mjs                 # 每次改完内容重新构建
cd static && python -m http.server 8080   # 打开 http://localhost:8080
```

## 部署到 GitHub + Cloudflare Pages（免费）

### 1. 推送 GitHub

```bash
git add .
git commit -m "WOLFLAG site"
# 在 github.com 新建仓库 wolflag-site（不要初始化 README），然后：
git remote add origin https://github.com/<你的用户名>/wolflag-site.git
git push -u origin main
```

### 2. Cloudflare Pages 绑定仓库

1. 登录 dash.cloudflare.com → **Workers & Pages → 创建 → Pages → 连接到 Git**
2. 选择 wolflag-site 仓库，配置：
   - **构建命令**: `node scripts/build.mjs`
   - **输出目录**: `static`
   - Node 版本: 18 或以上（默认即可）
3. 部署完成后网址为 `<项目名>.pages.dev`（本仓库 Sitemap 默认写 `wolflag.pages.dev`，如网址不同请改 `scripts/build.mjs` 顶部 `SITE` 常量再构建）
4. 将前置域名接入：项目 → **自定义域** → 添加 `wolflag.com` 或 `www.wolflag.com`，按提示在域名商处改 DNS（Cloudflare 域名免费托管则零配置）

后续每次 `git push` 自动重新构建重新发布（约 1-2 分钟）。

### 3. 开启管理后台（Decap CMS）

后台地址：`https://<项目名>.pages.dev/admin/`（或绑定的域名 `/admin/`）。

需要一次性配置 GitHub 登录（10 分钟）：

1. **创建 GitHub OAuth App**：github.com → Settings → Developer settings → OAuth Apps → New
   - Homepage URL: `https://<你的代理域名>.workers.dev`（先建 Worker，见下）
   - Authorization callback URL: 同上 + `/callback`
   - 记下 Client ID 与 Client Secret
2. **部署 OAuth 代理 Worker**（官方推荐方案，一次部署长期用）：
   ```bash
   git clone https://github.com/sterlingwes/decap-proxy
   cd decap-proxy
   cp wrangler.toml.sample wrangler.toml     # 修改 name 为 decap-wolflag 等
   npx wrangler login
   npx wrangler secret put GITHUB_OAUTH_ID       # 填 Client ID
   npx wrangler secret put GITHUB_OAUTH_SECRET   # 填 Client Secret
   npx wrangler deploy
   ```
3. **改本仓库配置** `admin/config.yml` 两处后推送 GitHub：
   ```yaml
   backend:
     name: github
     repo: <你的GitHub用户名>/wolflag-site
     base_url: https://decap-wolflag.<你的账号>.workers.dev
   ```
4. 访问 `/admin/` 用 GitHub 登录即可。

> 代理若需要访问私有仓库，修改 decap-proxy 的 `src/index.ts` 中 scope 为 `'repo,user'` 后重新部署。

### 4. 日常更新内容

1. 打开 `https://<你的域名>/admin/`
2. 登录（GitHub 账号）
3. 左侧栏目：**站点设置 / 首页 / 关于我们 / 各产品页**，选中即改：文字、图片（上传新图）、产品、FAQ、联系方式
4. 点 **保存**（Publish）→ 自动提交 GitHub → 1-3 分钟后线上自动更新

改坏也不会丢：每次发布都是一个 GitHub commit，可在 GitHub 网页上查看历史、随时回滚。

## SEO 说明

- 每页标题/描述可在各自 content JSON 的 `seo` 字段管理
- `sitemap.xml`、`robots.txt` 由构建脚本自动生成；域名确定后请修改 `SITE` 常量
- 图片已压缩为 WebP（原站 60MB → 1.6MB，加载速度大幅提升）

## 与原站差异（均为有意为之）

1. 原站产品页页脚只有版权栏 → 统一改为完整页脚（含联系方式），方便客户询盘
2. 版权行由 "© 2022 NetEase Zhuyou" 改为 "© 2026 WOLFLAG"
3. 原站 6 个页面链接改为适合自发布站点的清晰路径（/national-flag.html 等）
