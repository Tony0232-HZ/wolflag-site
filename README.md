# WOLFLAG 网站（复刻版 + 管理后台）

本仓库由原外贸独立站 www.wolflag.com（网易外贸通建站，已离线保存）完整复刻，所有内容可视化管理，部署于 GitHub + Cloudflare Pages，全程免费。

## 仓库结构

```
wolflag-site/
├── content/                 # 网站内容（JSON）—— 管理后台编辑的就是这些文件
│   ├── settings.json        # 导航/页脚/联系方式/版权
│   ├── home.json            # 首页内容
│   ├── about.json           # 关于我们（模块列表：文本/图片/图文/客户/FAQ，每模块可独立换背景色）
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

> **⚠️ 后台登录报错速查（2026-09-04 实测整理，详见仓库 AI-GUIDE.md §9）**
> 登录出问题时，先用**无痕窗口**打开 `/admin/` 点登录，然后看**地址栏授权 URL**（`client_id=`、`redirect_uri=` 两个值是关键）：
>
> - 页面是**沙漠 404**（"This is not the web page you are looking for"）→ **client_id 无效**：去 GitHub 应用页核对 Client ID（应为 `Ov23liV3OrfRG3tL4IlZ`），并把 Worker 密钥 `GITHUB_OAUTH_ID` 同步成它；
> - 页面是 **⚠️ "Be careful! / Invalid Redirect URI"** → **回调地址不一致**：GitHub 应用页「Redirect URL」必须登记为**纯净**地址 `https://decap.tony222.workers.dev/callback`（去掉 `?provider=github`，本项目 Worker 是改版，只发纯净地址）；
> - 地址栏 `state=` 每次登录都相同 → **浏览器缓存了旧跳转**，换无痕窗口（Ctrl+Shift+N）重试。
>
> 修 Worker 密钥（本机 `CLOUDFLARE_API_TOKEN` 已配好，在 decap-proxy 目录执行）：
> `echo '<值>' | npx wrangler secret put GITHUB_OAUTH_ID`（`GITHUB_OAUTH_SECRET` 同理，改 GitHub 应用页 secret 后同步）。
>
> 注意：Client ID 大小写敏感，务必用 GitHub 页面上的复制按钮；Client Secret 只显示一次。

### 4. 日常更新内容

1. 打开 `https://<你的域名>/admin/`
2. 登录（GitHub 账号）
3. 左侧栏目：**站点设置 / 首页 / 关于我们 / 各产品页 / 博客文章**，选中即改：文字、图片（上传新图）、产品、FAQ、联系方式、发布新闻/公告。**关于我们**已成"模块列表"：可拖顺序、加删模块（文字/图片/图文组合/客户/FAQ），**每个模块可单独选背景色**（后台颜色选择器，字段显示色块），图文可调排版方向、文字/图片比例、每张图上下位置。
4. 点 **保存**（Publish）→ 自动提交 GitHub → 1-3 分钟后线上自动更新

> **页脚联系信息**：网站自动在地址、电话、邮箱前显示对应的小图标（**内嵌 SVG 线框图标，无需上传图标文件**，颜色跟随文字）。只需在「站点设置 → 页脚」里改地址/电话/邮箱，保存即生效（2026-09-08）。页脚三块内容（工厂/杭州/电话邮箱）间距 48px 均匀排开，电话邮箱右缘与页面内容框右缘对齐（2026-09-08）。

> **首页横幅（Hero）多图轮播**（2026-09-08）：首页顶部大横幅可做成多图轮播。后台 `/admin/` → 首页 → 首屏(Hero)：①「轮播图片」Add 加多张、拖动手柄调顺序；②「图片模式」选 `carousel`（多图轮播）或 `single`（只显示第一张，固定）；③「轮播间隔（秒）」填数字。展示为**淡入淡出**切换、自动按间隔播放、鼠标悬停横幅暂停、底部**小圆点**常显、悬停时**左右箭头**淡入可手动切换。只有 1 张图时会静止显示（不轮播）。建议所有横幅图用同一比例（如 1259×562 宽横幅），切换更顺。

> **博客文章**：`/admin/` → 博客文章 → 新建。填 文件标识(英文小写)/标题/日期/封面/摘要/正文（段落、小标题）→ 保存即上线（列表页 `/blog.html`）；不想上线可勾选「草稿」。文章自动进入 sitemap。想加粗正文里的字，把要加粗的字用 `**词**` 包起来即可（如 `这家工厂**值得信赖**`，About 段落同样支持）。

改坏也不会丢：每次发布都是一个 GitHub commit，可在 GitHub 网页上查看历史、随时回滚。

## 新增产品类目页（自动发现机制）

网站构建时会**自动扫描** `content/products/` 与 `content/pages/` 两个目录，每个 JSON 自动生成一个页面并进入 sitemap。

新增一个类目页（例如 LED Display）只需三步：

1. **后台创建内容文件**：打开 `/admin/` → **新增类目页** → 新建（示例页 `led-display.html` 已存在，可直接复制修改）
   - `页面声明` 填三项：文件标识 `led-display` / 页面文件名 `led-display.html` / 排版模板 `simple`（通用）/ 导航地址 `/led-display.html`
   - 填 SEO 标题、页面主标题、标语、上传产品图片并填写产品列表 → 保存
2. **加导航菜单**：`/admin/` → 站点设置 → 导航菜单 → 添加一项（名称「LED Display」、链接 `/led-display.html`）→ 保存
3. 1-3 分钟后线上出现新页面，自动进入 sitemap

> ⚠️ **新页面不出现？先检查这三点**：
> ① `content/pages/` 里对应文件是 **`.json`** 不是 `.md`（后台已配 `format: json`，正常为 `.json`；若是 `.md` 会被忽略）；
> ②「文件标识(slug)」、文件名、网址都**英文小写、无空格**（如 `stands-displays`，别用 "Stands & Displays"）；
> ③ 页面没重新生成——后台保存会自动触发 Cloudflare 重新构建，约 1-3 分钟。

> 排版模板选择（7 种）：`simple` 通用网格 | `flags` 国旗式 | `feather` 横卡式 | `bannerCards` 横幅式 | `pole` 旗杆展架式 | `detail` 产品详情 | `flex` 通用图文。
> 参考：`content/pages/led-display.json`（仓库里已内置 LED 示例页，可直接替换内容）。

> **图文区块（可加多组，每组可显隐，2026-09-08）**：新增类目页底部可加多组"图文区块"（小标题 + 文字 + 多张图）。每组顶部有「**显示此图文区块**」勾选框：勾上=显示、取消=隐藏（内容保留）。`simple` 与 `flex` 两种布局都会在产品列表下方渲染这些图文区块（例：Full Products 页）。

## 产品详情页（detail 模板）与 Products 子菜单

**两种页面入口的区别（用哪个）**：
- **新增类目页**（`content/pages/`）→ 类目/列表型页面：一个页面放一类产品，每个产品配 1 张图（名称/尺寸/材质/描述），模板可选（simple/flags/feather/bannerCards/pole/flex）。如 Products 合集页。注：Stands & Displays 现在用的是「**属性网格类目页**」栏目（见下）。
- **产品详情页**（`content/product-details/` 目录，后台「产品详情页」栏目）→ 单款产品详情：**多张实拍图**（点击缩略图切换）+ 品名 + **自由增删的『产品属性』**（面料 / 印刷 / 尺寸 / MOQ / 交期作为默认行，可加颜色、缝纫方式等）+ **数量↔价格表**（阶梯价）+ 页面底部 3 张可编辑服务小卡 + 图文区。例：`/car-flags.html`。
- ⚠️ 注意：「新增类目页」的模板下拉里也有 detail，但该表单字段是通用版（无多图/价格表输入框）——要详情功能请去「产品详情页」栏目建。

**导航子菜单**：顶部菜单现在支持下拉子菜单（如 Products ▾ → Banners / Car Flags）。配置：`/admin/` → 站点设置 → 导航菜单 → 菜单项展开可「+ 添加 子菜单」（子菜单文字 + 链接）。新增子页面后，用此入口挂到 Products 下。

**Products 合集页**：`/products.html`（`content/pages/products.json`）：顶部横幅 `bannerImage` + 产品卡可点击跳转（每卡填 `link` 字段）——通用 simple 模板的页面都支持这两项。

## 属性网格类目页（specGrid 模板）与全站图片放大

**属性网格类目页**（`content/specgrid/`，后台「**属性网格类目页**」栏目）→ 卡片式产品：**品名（加粗居中）+ 自由增删的『产品属性』表 + 宣传语 + 图片**。后台字段只有这 4 项，干净且与页面完全匹配。例：`/stands-displays.html`（`content/specgrid/stands-displays.json`）。

**羽毛旗产品页**（`/feather-flag.html`）：产品说明模块现同样为「品名 → 产品属性表 → 宣传语」（每个产品横向卡：左图 + 右说明）。后台「羽毛旗产品页」里每个产品的字段为『产品属性(specs，可自由增删)』+『宣传语(subtitle)』+ 图片；原『底部引导语(CTA)』字段已移除（2026-09-08）。

**横幅产品页**（`/banner.html`）：产品说明模块现同样为「品名 → 产品属性表 → 宣传语」（3 列网格卡：图在上、文字居中）。后台「横幅产品页」里每个产品的字段为『产品属性(specs，可自由增删)』+『宣传语(subtitle)』+ 图片；原『描述/材质/细节说明』字段已移除（2026-09-08）。

**全站产品图片点击放大**（所有产品页面通用）：鼠标放到产品图上 → 右上角出现**放大镜**图标；**点击 → 弹出全屏大图**；再点一下（或点 ✕、按 Esc）→ 恢复原图。首页分类卡、产品合集跳转卡这类"点图去别的页面"的链接图**保持跳转**，不触发放大。

## 补充模块（页面底部图文区，2026-09-08 新增）

**补充模块**是页面底部的一块"图文区"，可放引导/补充说明并配图。它和"产品"一样是**可添加多个**的列表。

- **哪些页面有**：首页、羽毛旗产品页、横幅产品页、国旗产品页、属性网格类目页（Stands & Displays）——共 5 个页面底部都有。
- **怎么加**：后台打开对应页面 → 滚到最底下的「补充模块」→ 点「**Add 补充模块 +**」可加多个，每个都能独立填 **显示/标题/文字/图片**（文字可用 `**词**` 加粗；图片上传后图左文右，不传图则文字居中）。
- **显示/隐藏**：勾选「显示此补充模块」＝显示；取消勾选＝隐藏（内容不丢，勾回来恢复）。默认全部隐藏，等填好再显示。
- 演示：羽毛旗页默认含 1 个隐藏模块，其余 4 页为空。

## 导航栏（顶部菜单）说明

顶部菜单的文字在 `content/settings.json` 的 `nav` 字段（后台修改路径：站点设置 → 导航菜单）。菜单项名称已改为英语复数规范：`Feather flags` / `Full Products` / `National Flags`（网址路径未变，仅显示文字）。

布局说明（2026-09-08）：菜单项用 `white-space:nowrap` 强制单行展示，不会因名称变长而折成两行；屏幕宽度 ≤1200px 时会自动收起为汉堡菜单，顶部「Contact Us」按钮始终可见、不会被挤出屏幕。

交互效果（2026-09-08）：鼠标悬停或选中（当前页）某个菜单项时，显示**浅沙色 #f5f0e8 圆角胶囊高亮 + 加粗文字**（与页面浅色系一致）；主按钮「Contact Us」和「Download Catalog (PDF)」悬停时会轻微上移 2px 并带柔色阴影。

## 产品手册下载按钮（Download Catalog PDF）

首页首屏右上角有一个金色「Download Catalog (PDF)」按钮（**只出现在首页**），点击可下载产品手册。相关配置：

- **数据**：`content/settings.json` → `catalogButton`（`text` 按钮文字、`file` PDF 路径）。当前 PDF：`media/wolflag-catalog.pdf`（13.6MB），网站引用 `/assets/media/wolflag-catalog.pdf`。
- **后台更新手册**：`/admin/` → 站点设置 →「产品手册下载按钮」→ 用文件组件上传/替换 PDF → 保存，线上自动生效。
- **配色**：金黄橙 `#f59e0b`（hover `#d97706`）+ 深藏青字，CSS 变量在 `src/assets/css/site.css` 的 `:root`（`--catalog` / `--catalog-dark`）。改色只改这两个变量。
- **为何在首页而非顶栏**：早期放共享顶栏导致菜单拥挤且间距难调，故移到首页首屏（`homeBody()` 里用绝对定位渲染，右边缘与首屏大图对齐）。

## SEO 说明

- 每页标题/描述可在各自 content JSON 的 `seo` 字段管理
- `sitemap.xml`、`robots.txt` 由构建脚本自动生成；域名确定后请修改 `SITE` 常量
- 图片已压缩为 WebP（原站 60MB → 1.6MB，加载速度大幅提升）

## 与原站差异（均为有意为之）

1. 版权行由 "© 2022 NetEase Zhuyou" 改为 "© 2011 WOLFLAG"（2011=用户外贸起步年份，2026-09-06 由后台改为 2011）
2. 原站 6 个页面链接改为适合自发布站点的清晰路径（/national-flag.html 等）
3. 产品页页脚：曾与原站一致（深色 #212327 版权带）；2026-09-06 起**全站所有页面统一完整页脚**（公司名称、地址、电话、邮箱）
