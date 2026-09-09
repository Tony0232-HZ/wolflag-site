# WOLFLAG 网站 — AI 接手说明书（先读我！）

> 本文件给接手本项目的 AI（Claude 等）和人类维护者。**动手改任何代码/内容前先完整读一遍**。
> 读完你应该能回答：这是什么网站？怎么构建？内容在哪？怎么加页面？哪些坑绝不能踩？改完怎么自检？

---

## 0. 项目一句话概况

复刻自原外贸独立站 **www.wolflag.com**（旗帜制造商：国家旗/羽毛旗/横幅/旗杆展架；原站由网易外贸通建站平台托管，现已换成自有站）。
技术栈：**纯静态站（手写 HTML/CSS/JS）+ JSON 内容外置 + Decap CMS 后台 + GitHub + Cloudflare Pages**，全程零费用零服务器。

- 线上：`https://www.wolflag.com`（备用 `https://wolflag-site.pages.dev`）
- 仓库：`https://github.com/Tony0232-HZ/wolflag-site`（远端 `origin`，主分支 `main`）
- 部署：Cloudflare Pages 自动构建（项目名 `wolflag-site`），构建命令 `node scripts/build.mjs`，输出目录 `static`

---

## 0.5 ⚠️ 会话开场前必须先主动询问的两件事（2026-09-07 用户要求）

> 本仓库的数据更新，**用户通过后台（Decap CMS）改的是 GitHub 仓库**（=线上网站的数据源），本地通常**落后于线上**。
> 因此每次开始工作前，**必须先主动问用户这两件事，得到批准后再动手**——只"询问+提示"，绝不擅自执行。

1. **要不要把网站上的更新同步到本地？**
   - 主动措辞："网站最近有没有更新？需要我把网站上的内容同步到本地吗？"
   - 同步操作 = `git fetch && git pull origin main`（本地工作区干净时为快进，安全；应先看 `git fetch` 后的 `git status -sb` 落后几个提交再决定）。
   - **必须先得到批准**才拉取/同步，避免覆盖/冲突用户本地的改动。

2. **要不要把网站新上传的图片转成 WebP 格式？**
   - 主动措辞："网站新上传的图片要不要转成 WebP 格式（更小、加载更快）？"
   - 只对**新上传/新出现且是大体积 PNG** 的 `media/` 图值得转；已是 WebP 或本就很小的一律不动。
   - 转换步骤 = Pillow 转 `.webp`（quality 80、尺寸不变）→ 更新引用该图的 JSON（`.png`→`.webp`）→ `node scripts/build.mjs` 重建。
   - **必须先得到批准**才转换。原 PNG 在 git 历史中可找回，删除安全。

> 两条都以**用户明确批准**为前提。若用户已在本条对话内批准过相同操作，可视为已授权，无需重复询问。

---

## 0.6 ⚠️ 每次改动被批准推送并同步到本地后，必须及时询问要不要写文档（2026-09-07 用户要求）

> 本仓库的 AI 行为准则：只要**改的是网站实际内容 / 功能 / 样式 / 数据 / 后台表单**，并且已经走完 **① 用户批准 → ② `git push` 推送成功 → ③ 本地与线上同步（`git status -sb` 无落后/超前）**，都要**主动问用户一句**：

> **"这次改动要不要同时写进 AI-GUIDE.md 和 README.md？"**

> 按用户回答执行：
> - 说**要** → 把本次改动要点（做了什么、改了哪些文件/字段、怎么用、有哪些坑、示例）补写进 `AI-GUIDE.md`（必要时含 `README.md`），遵守各文档现有章节结构并更新「最后更新」条；然后照常提交推送。
> - 说**不要** → 跳过不写。

> 补充：`后台管理操作说明书.html` 在**本仓库之外**（用户本机 `E:\wolflag 网站信息\2026 公司网站\` 下），如需补写/同步也要一并提醒用户。此规则仅为「询问+提示」，最终由用户拍板是否落笔。

---

## 1. 目录结构（每个目录的角色）

```
wolflag-site/
├── content/            ★ 网站内容（数据层），后台/手工编辑都改这里
│   ├── settings.json       导航/页脚/电话/邮箱/版权/Contact Us 按钮
│   ├── home.json           首页（首屏、简介区、主产品卡）
│   ├── about.json          关于我们（模块列表：文本/图片/图文/客户/FAQ，每模块可换背景色）
│   ├── products/           4 个专用产品页 JSON（字段各异，见 §2.3）
│   └── pages/              ★ 新增类目页放这（自动发现机制）
├── media/             ★ 图片库（唯一事实来源）：48张原站提取图 + 后台新上传
├── src/assets/        CSS/JS 源码（site.css / site.js）——改样式在这里
├── admin/             Decap CMS（index.html + config.yml）
├── templates/         空目录（预留，未用）
├── static/            ★ 构建产物 COPY！永远别手工改（每次 build 会重建）
├── scripts/
│   ├── extract.py     一次性迁移工具：离线HTML→media/图片+内容JSON（语义命名）
│   └── build.mjs      ★ 构建引擎（零依赖 Node≥18）——项目的心脏
├── README.md          部署向说明（给人的）
└── AI-GUIDE.md        本文件
```

**铁律**：`static/` 是生成的；改 `media/` 后必须重新构建；图片路径统一 `/assets/media/文件名.webp`。

---

## 2. 内容数据模型（每个 JSON 的完整语义）

### 2.1 settings.json
```json
{ "brand": "WOLFLAG",
  "logo": "/assets/media/logo.webp",
  "nav": [ { "label": "Home", "url": "/", "external": false }, ... ],   // 菜单；external=true 开新窗
  "contactButton": { "text": "Contact Us", "url": "mailto:tony@wolflag.com" },
  "catalogButton": { "text": "Download Catalog (PDF)", "file": "/assets/media/wolflag-catalog.pdf" },  // 首页首屏"下载手册"按钮(仅首页显示)；file=PDF路径
  "footer": {
    "sections": [ { "heading": "Wolflag factory", "lines": ["No 7 Weisan Road Zhapu Town", "Pinghu City Zhejiang Province CHINA"] },
                  { "heading": "Hangzhou Loyal Import & Export co, ltd", "lines": ["Room 620, Jinshaju Building 2,xuezheng St.", "hangzhou China"] } ],
    "phones": ["+86 (571) 28239823", "+86 159 9018 9075"],
    "email": "tony@wolflag.com",                 // 兼容字段
    "emails": ["tony@wolflag.com", "tony@wolflagdisplay.com"],
    "logo": "/assets/media/footer-logo.webp",
    "icons": [{ "icon": "/assets/media/footer-icon-1.webp", "url": "" }, ...],  // 社交图标 {icon,url}（2026-09-06 起支持链接；url 空→回退 mailto；旧纯字符串格式兼容）
    "copyright": "© 2011 WOLFLAG. All Rights Reserved." } }   // 2026-09-06 用户改为创办年份 2011（外贸始于 2011）
// 渲染：地址每个区块首行前自动加定位图标、其余行缩进对齐(.f-line-indent)；电话前电话图标、邮箱前邮箱图标（内嵌SVG线框、颜色随文字，footer() 用 ICO_PHONE/ICO_MAIL/ICO_PIN；2026-09-08）
```

### 2.2 home.json / about.json
- `home.json`：`seo{title,description}`、`hero{title,text,image,images[],interval,mode,features[2]}`（`images[]`=多图轮播（第一张默认，后台可拖排序；仅 1 张或 `mode:'single'` 时静止单图）、`interval`=轮播间隔秒数（默认5）、`mode`=`carousel`|`single`；轮播=淡入淡出+自动切换+悬停暂停+底部圆点+悬停左右箭头，JS 在 site.js 的 `hero-slider` 逻辑，CSS `.hero-slider*`，2026-09-08；`image` 为兼容/默认图，`ogImage` 用 `home.hero.image`；features=两个药丸 Professional/Reliable）、`intro{title,text,images[3]}`（**顺序敏感**：0=缝纫车间(home-factory)、1=旗帜喷印全景(home-workshop，中列药丸下方)、2=黄色印刷机(home-printing)；曾因 DOM 顺序≠视觉顺序而返工）、`categories{title,intro,items[4]}`（items：National flag→/national-flag.html、banner→/banner.html、Feather flag→/feather-flag.html、pole kits→/pole-display.html；**首页没有用 `factory` 字段，忽略它**）
- `about.json`：`seo`、`hero{title,subtitle,image}`（页头/顶部横幅，固定）、`blocks[{type,...}]`（**模块列表**，2026-09-07 起替代原 `paragraphs/factoryImage/collageImage/clients/faq` 字段；可拖排序/增删）。块类型：
  - `text`：`{text}`（支持 `**词**` 加粗）
  - `image`：`{image}`
  - `textImg`（图文组合）：`{direction:textLeft|textRight|textTop, ratio:"50:50"等, title, text(多段用空行分隔), images[{image,offset}](每图独立上下移,px)}`
  - `clients`：`{title,tagline,subtitle,logos[]}`（8 logo）
  - `faq`：`{items:[{q,a}]}`
  - `timeline`（年份大事记，2026-09-09 新增）：`{bg, title, autoPlay, interval, items[{year,text}]}`——年份横条+圆点，点年份切换对应大字+文字；**`items` 自动按 `year` 升序排序**（最左=最早、最右=最晚，build 时 `renderAboutBlock` 排好的，后台填错顺序也自动纠正）；`autoPlay`=自动播放开关（默认 true）；`interval`=自动切换间隔（秒，默认 5、建议 5~8）；点年份切换、**悬停在某年份上暂停自动播放、移开恢复**、到末位自动循环回第一个（site.js 的 `go/start/stop/restart`，`data-autoplay`/`data-interval` 属性驱动）；样式见 §4。
  **每个块都有 `bg`**（背景色=十六进制；后台用 Decap `color` 部件选色，字段显示色块。极简色板：白#ffffff/米白#fafaf9/淡灰#f8f8f8/浅沙#f5f0e8/米黄#faf7f5/灰绿#dfe3e2/鼠尾草#e8ece2/雾蓝#eef1f4/藕粉#f6f0ee/浅炭#f1f1ef）。渲染：`aboutBody()`→`renderAboutBlock()`，`aboutParas()` 拆段（支持 `**词**`）、`aboutBg()` 取背景色。图文排版：文左图右、文字与图间距 60px、段落间距 36px、clients Logo **右对齐**工厂图。

### 2.3 products/*.json（4 个专用类）+ page 声明

**每个产品 JSON 必须带 `"page": { "file", "layout", "nav" }`**，这是自动发现注册表的钥匙：

| 文件 | file | layout | 特有字段 |
|---|---|---|---|
| feather-flags.json | feather-flag.html | `feather` | badge(徽标行), bannerImage(顶部横幅,**可选**,不填则无横幅), products[{name,specs[{label,value}],subtitle,image}]（2026-09-08 起 size/material/desc → specs+subtitle，删除 cta） |
| banners.json | banner.html | `bannerCards` | tagline, bannerImage(顶部横幅,**可选**), products[{name,specs[{label,value}],subtitle,image}]（2026-09-08 起 desc/material/detail → specs+subtitle） |
| national-flags.json | national-flag.html | `flags` | tagline, bannerImage(顶部横幅,**可选**), products[{name,specs[{label,value}],subtitle(**可选**),image}]（2026-09-08 起 size/material/printing → specs；渲染为**品名加粗居中(.nf-card .p-name) → 属性表(.p-spec 新样式) → 可选宣传语**；原 p-size/p-material/p-chip 黑框印刷 chip 已移除；尺寸值去掉了旧文案 "popular size:" 前缀，拼写保留原样） |
| pole-display.json | pole-display.html | `pole` | subheading, subtext, featured[2]{name,desc,detail,tag,image}, ingredients{title,subtitle,items[6]{name,desc,image}} |

现有产品细节不要动，除非用户要求：feather 4 款（Feather/Leaf/Rectangle/Teardrop，Rect size 6.56ft*2.62ft、Teardrop 11.8ft*3.9ft；CTA 是**纯文本**非链接）；national-flags 6 旗（China/USA/EU/Malaysia/Kuwait/UN；**尺寸映射已验证**：China 3.15*2.1/4.72*3.15/6.3*4.2、USA 1.9*1/2.8*1.5/3.78*2、EU 3*5/3.3*6.6/4*6、Malaysia=Kuwait 2*1/4*2/6*3/8*4、UN 2*3/3*5/4*6）；banners 6 款（材质统一 comstom size/100% knitted polyester=原站拼写，**保留原拼写**）；pole 主卡2+配件6。

### 2.4 pages/*.json（新增类目页模板，见 §5）

> ⚠️ 只认 `.json`：`pages/` 与 `products/` 下的文件**必须**是 `.json`。后台已配置 `format: json`，正常会存成 `.json`；若看到 `.md` 说明格式不对，页面会被构建引擎**静默忽略、不生成**。

### 2.5 博客（blog，2026-09-06 新增）

- `content/blog/*.json` **自动发现**（类似 pages/，但独立目录）：每文件一篇，`draft:true` 不生成；排序规则：**`pinned` 置顶优先，多个置顶之间按 `date` 倒序（新置顶在前），未置顶按 `date` 倒序**
- 字段：`slug`（网址标识）、`title`、`date`、`coverImage`（可选）、`summary`（列表摘要）、`blocks[{type:p|h2|image,text,image}]`（正文：段落/小标题/插图块，**插图块任意位置数量不限**；纯文本 ESC 转义，非 Markdown；正文段落/小标题支持 `**文字**` 加粗→`<strong>`，见 build 的 `bold()` 函数）、`pinned`（置顶，2026-09-06 新增）、`draft`
- 页面：
  - 列表 `/blog.html`、`/blog-2.html`…（**每页 20 篇**，脚本按 BLOG_PER=20 分块静态生成，底部 blogPager 页码条）
  - 文章 `/blog/<slug>.html`：两栏布局（`.blog-post-cols`）——左正文（标题/日期/封面/内容/← Back to Blog），右侧 **All Posts 侧栏**（`.recent-box`：缩略图+标题+日期+置顶徽章；**每页 20 条**，首页静态渲染兜底，翻页由 site.js 读取 `<script id="blog-index">` JSON 客户端分页）
- 后台：config.yml `blog` collection（folder `content/blog`、`format: json`）——slug 英文小写无空格；**改 slug = 旧链接失效**，发布后勿改；`pinned` 勾选即置顶（取消勾选自动回到时间序）
- sitemap：列表页（含分页页）+ 全部文章页都在其中（2026-09-06 改动后 blogUrls 由 listingPages + 文章生成）
- CSS 块：`.blog-grid/.blog-card/.blog-meta/.blog-title/.blog-sum/.blog-more/.blog-cover/.blog-content/.blog-flag/.blog-pager/.blog-post-cols/.blog-aside/.recent-*/.blog-img`；导航项由 settings.nav 控制（当前在 About Us 之后）

### 2.6 产品详情页（detail 布局）与通用图文页（flex 布局，2026-09-06 新增）

- **页面发现**：`PAGE_DIRS = ['products','pages','product-details','specgrid']`（多了 `content/product-details/*.json` 与 `content/specgrid/*.json`，结构同 pages/：自带 `page{file,layout,nav}`）。`layout` 可选值现为 **simple/flags/feather/bannerCards/pole/detail/flex/specGrid**
- **detail（产品详情模板）**：字段在 config.yml 的 `product-details` collection——`products[{name,desc,images[]（多图，第一张主图，JS 切换）,specs[{label,value}]（自由增删属性，2026-09-07 起替代原 fabric/printing/size/moq/leadTime）,prices[{qty,price}]}]`（一个页面可放多个产品，上下排列）、`serviceCards[{icon,title,text}]`（3 张小卡，图标可传图；留空用 `DEFAULT_CARDS` 默认值：svc-support/shipping/returns.svg）、`textImg{title,text,images[]}`（三卡下方图文区）；**无购物车、无 Show Off 区**（用户要求，参考站 参考新页面.htm 裁切）。规格表 `productSpecRows(p)`：优先用 `p.specs`，旧字段 fabric/printing/size/moq/leadTime 作兜底；前台 `/car-flags.html` 默认 5 行（Fabric/Printing/Size/MOQ/Lead Time）。⚠️ **样式铁律**（2026-09-08 用户要求）：detail 模板的 `.pd-spec` 规格表与 `.pd-price` 价格表**保持原灰线框样式**（左栏 #f5f7fb、1px #e2e6ee 线框），**新建详情模板页面也一律保持原样**，勿改成属性表新样式；新样式只用于 `.f-spec`/`.p-spec`/`.sg-spec`（见 §4 产品卡行）
- **flex（通用图文模板）**：`sections[{show,title,text,images[]}]` 按顺序多组（标题+文字+多图），适合定制流程/公司介绍类页面；页面建在 `content/pages/*.json`（pages collection 已加 sections 字段）。**每块可加 `show` 开关**（boolean，勾选=显示、取消=隐藏且内容保留，默认 true；2026-09-08，与补充模块一致）。**simple 布局也渲染 sections**：build.mjs 的 `sectionsBlock(data)` 通用函数（`show!==false` 且标题/文字/图至少一项有内容才输出该块），`simpleBody` 末尾追加 `${sectionsBlock(data)}`、`flexBody` 也用同一函数——故 products.json（simple 布局）也能在产品列表下方显示图文区块
- **导航子菜单**：`settings.nav[].children[{label,url,external?}]`；build 的 `header()` 渲染 `li.has-children > a + ul.nav-drop`（桌面悬停/焦点显示，移动端展开为静态缩进列表）；子菜单子项命中 `active` 也高亮
- **示例**：`content/pages/products.json`（Products 合集 hub，simple 布局，含 bannerImage 横幅 + 卡片 link 可点击）、`content/product-details/car-flags.json`（detail：Car Flags）；flex 示例页 custom-flags **2026-09-06 已按用户要求删除**（模板仍可选）
- **两个后台入口的定位（用户 2026-09-07 确认的区分，写文档时照此）**：「新增类目页」（content/pages）面向**类目/列表型**页面（一个页面一类产品、每产品单图，模板可 7 选）；「产品详情页」（content/product-details）面向**单款产品详情**（多图 + **specs[{label,value}] 自由属性**（默认 fabric/printing/size/MOQ/交期 行，可加颜色、缝纫方式等）+ prices[\{qty,price\}] 阶梯价 + 页面级 serviceCards + textImg）。⚠️ **陷阱**：新增类目页的 layout 下拉虽含 `detail`，但其表单字段是通用版（无多图/价格表输入框）——用户要详情功能必须去「产品详情页」栏目建
- **specGrid（属性网格模板，2026-09-07 独立栏目）**：卡片式，品名(加粗居中)+自由属性表(specs)+宣传语(支持 `**词**` 加粗)+图片。**后台独立栏目**「属性网格类目页」= Decap collection `specgrid`，文件夹 `content/specgrid/`，产品字段**仅** `products[{name,subtitle,specs[{label,value}],image}]`（不混入其他模板字段，避免后台表单与页面不匹配）。渲染 `specGridBody()`；示例 `content/specgrid/stands-displays.json` → `/stands-displays.html`。CSS `.sg-*`；品名→属性表→宣传语顺序
- **全站产品图片点击放大**（site.js + `.site-lightbox` 全局浮窗）：产品图（国旗/横幅/羽毛旗/旗杆/属性网格/详情主图）**悬停显示右上角放大镜 `.zoom-badge`，点击弹出全屏大图**，点浮窗任意处或 ✕ 或 Esc 恢复；**链接卡**（首页分类/产品合集跳转的图）`closest('a')` 或含 `a` 则**跳过**，保留点击跳转；`.pd-thumb` 缩略图不放大（负责切换主图）——由 site.js 的 `ZOOM_SEL`（`.cat-img/.p-img/.f-img/.sg-img/.pd-main/.feat-card/.ing-card`）驱动，JS 运行时给容器加 `.zoom-wrap`
- **simpleBody 增强**（2026-09-06）：支持可选 `bannerImage`（页面顶部横幅，同 `.page-banner`）与产品 `link` 字段（卡片图片/标题变可点击链接，`.p-link`）
- 导航现状：Home / Feather flag / **Products（子菜单：Banners=banner.html、Car Flags）** / National Flag / Stands & Displays / Flagpoles & Accessories / About Us / Blog / Contact Us 按钮
- CSS：`.pd-cols/.pd-gallery/.pd-thumb/.pd-spec/.pd-price/.pd-meta/.pd-services/.svc-grid/.svc-card/.pd-textimg/.ti-imgs/.flex-section/.flex-imgs/.nav-drop/.p-link`；JS：site.js 的 `pd-thumb` 点击换主图

### 2.7 首页"下载产品手册"按钮（Download Catalog PDF）

- **只出现在首页**（`homeBody()`），**不在**共享顶栏。由 `settings.catalogButton` 驱动：
  `{ "text": "Download Catalog (PDF)", "file": "/assets/media/wolflag-catalog.pdf" }`
- 渲染为 `.hero-catalog-btn`，**绝对定位**（首页右上角、紧贴 Contact Us 下方，约 23px 缝隙，右边缘与首屏大图对齐）。改它**只在 `homeBody()` + site.css 的 `.home-hero .hero-catalog-btn`**，别动共享的 `header()`。
- PDF 放 `media/`（当前 `wolflag-catalog.pdf`，13.6MB），网站引用 `/assets/media/<file>.pdf`。
- **后台上传入口**：`/admin/` → 站点设置 → «产品手册下载按钮» → `file` 组件（`widget: file`）上传/替换 PDF，保存后自动生效。
- 配色=金黄橙：CSS 变量 `--catalog:#f59e0b`、`--catalog-dark:#d97706`（site.css `:root`），文字深藏青 `--navy`。**改色只改这两个变量**。

---

### 2.8 补充模块（页面底部图文区，2026-09-08 新增）

- **每页底部可加多个**：`content/{页面}.json` 的 `supplement` 是**数组**，每项 `{ show, title, text, image }`。渲染由 build.mjs 的 `supplementSection(data)`（遍历数组，兼容旧单对象），条件 `show!==false` 且至少一项有内容才渲染；多个模块按数组顺序从上到下。
- **已启用页面**：index(首页)、feather-flag、banner、national-flag、stands-displays 五个页面底部（均走各自 layout 函数里 `supplementSection(data)`；首页读 `home` 全局）。
- **字段**：`show`(boolean，勾选=显示、取消勾选=隐藏且内容保留)、`title`(可选)、`text`(支持 `**词**` 加粗)、`image`(可选；有图=图左文右，无图=文字居中)。
- **样式**：`.f-supp*`（`.f-supp` 浅米黄 #faf7f5 圆角面板、`.f-supp-img` 图(圆角)、`.f-supp-txt` 无图居中、`@media max-width:700px` 上下堆叠）。
- **后台表单**：5 个栏目（首页/羽毛旗/横幅/国旗/属性网格）的「补充模块」均为 `widget: list`，可 Add 添加多个；每项：显示/标题/文字/图片。
- 演示：羽毛旗页默认含 1 个模块(`show:false` 隐藏)，其余 4 页为 `[]` 空数组。

### 2.9 公告条（announce，2026-09-09 重构：从全站顶部挪进页面）

> 公告条 = 页面**内部**的一条滚动公告，**不是全站页头**（2026-09-09 从顶部挪进页面，只在 **首页 / 关于我们** 各一条，**各自独立配置**；顶部那条已删除）。

- **数据模型**：页面 JSON 的 `announce` 对象：`{ enabled, mode, bg, color, pause, scroll, items[{icon,text}] }`
  - `mode`：`inout`（首页：滚进→停→滚出→空窗→下一条，单条循环）/ `slide`（关于：**当前滚出时下一条同步滚进**，重叠无缝）
  - `pause`=每条停留秒数；`scroll`=滚进/滚出时长（越长越慢）；`items`=每条文字+可选小图标
  - ⚠️ `gap`（空窗秒数）已从后台移除——慢滚动下"空窗"实际由滚出/滚进主导（首页 scroll=10s 时可见约 6~7s 无字，用户已接受属预期）
  - 图标：`media/icon-*-.svg`（藏青线框 `#272e47`、20px、与文字同色；当前有 megaphone/factory/globe/email）
- **位置**：
  - 首页：`homeBody()` 里 `<section class="home-hero">` 之后、`<section class="section section-center">`（intro=「Flags, Banners and Pole Kits」）之前，`${announceBar(home.announce)}`
  - 关于：`aboutBody()` 里 `<div class="about-hero">` 之后、`${blocks}` 之前，替换掉原 `.about-marquee`（**marquee 已删除**），`${announceBar(data.announce)}`
- **渲染**：`build.mjs` 的 `announceBar(ann)`（复用）→ `.announce.announce-page`（`data-mode / data-pause / data-scroll`）> `.announce-bound`（=`.container` 左缘对齐）> `.announce-viewport`（定高 44px、overflow hidden、**左对齐**）> `.announce-track` > `.announce-item`
- **JS**：site.js `document.querySelectorAll('.announce')`，按 `data-mode` 分支：
  - `inout` → `play(el)`：transform W→0（滚进）→（`scroll+pause` 后）→-W（滚出）→（`+gap` 后）下一条
  - `slide` → `cycle()`：`outLeft(当前)` 与 `show(下一条)` 同时（重叠）。`W=vp.clientWidth`
- **样式**：`.announce{--ann-bg/--ann-fg,font-size:20px}`、`.announce-page{margin:8px 0 10px}`（原 24px 缩到 8px + `.home-hero{padding:76px 0 24px}`（原 71px 底带）→ 首页栏目图→公告条间距 95→32px）、`.announce-bound{max-width:var(--container);margin:0 auto;padding:0 24px}`、`.announce-item{justify-content:flex-start}`（左对齐）
- **后台**：`admin/config.yml` 的 `home`、`about` 两个 collection（files 型）各自 `announce` object：显示 / 播放模式(inout|slide) / 背景色 / 文字色 / 每条停留秒数 / 滚进滚出时长 / 公告内容(items=文字+小图标)。⚠️ 在后台编辑公告内容时，Decap 会按配置字段重写该对象——**`mode` 是配置字段之一（已加），别删它**，否则 slide 模式会回落成 inout。

---

## 3. 构建引擎 scripts/build.mjs 工作机制

1. **读内容**：`settings/home/about` + 自动扫描 `content/products/*` 与 `content/pages/*`（`PAGE_DIRS`）
2. **注册页**：固定 `index.html` + `about-us.html`；其余每个 JSON → 按 `page` 声明生成条目（`file/slug/layout/nav`）
3. **渲染**：`SITE` 常量（当前 `https://www.wolflag.com`，影响 sitemap/OG，改域名要同步改）；layout 分派函数：
   - `feather` → featherBody（横卡+CTA 文本）；`bannerCards` → bannerBody；`flags` → nfBody；`pole` → poleBody；**默认/未知 → simpleBody**（通用 3 列网格：名称/尺寸/材质/描述/图片）
4. **页脚策略**：**全站统一完整页脚**（2026-09-06 用户要求，见坑 #6）；`build.mjs` 中 `footerMode: 'full'` 对所有页面一视同仁；`minimalFooter()` 函数保留但已不被使用
5. **产物**：清理旧 html/assets/admin/sitemap/robots → 写 html → 拷贝 `src/`（css/js）、`media/`→`static/assets/media/`、`admin/`→`static/admin/` → 生成 sitemap.xml + robots.txt
6. `esc()` HTML 转义；导航 `.active` 由 `settings.nav[].url` 匹配 `page.nav`

---

## 4. 设计系统（原站实测参数，改动以测量为准）

| 项 | 值 |
|---|---|
| 品牌色 | #4c6aff（hover #364cd9）；正文 #272e47；页脚 #352a2a；hero 米黄 #faf7f5；面板 #f9fafb；FAQ #dfe3e2 |
| 导航 | 52px；菜单从 logo 旁锚定铺展：main=16px/#272e47/无active下划线、悬停/选中=浅沙 #f5f0e8 圆角胶囊(border-radius 6px、padding 6px 12px、margin 0 -10px 防撑宽、加粗深藏青；2026-09-08 由金色 #f59e0b 改浅沙)、gap 24px、`white-space:nowrap` 防多词菜单名折行、汉堡断点 `@media (max-width:1200px)`（原 900px）；Contact Us 右缘 #4c6aff 圆角6 |
| Home | h1 36px Catamaran #573d3d 左侧列397px；段落列 14px/21px **#312925** + `align-self:end`（与 H1 底对齐）;hero 图为**多图轮播**（`.hero-slider` 内 `.hero-slide` 绝对叠放、`opacity` 淡入淡出 .8s；容器高 419px、移动端 `aspect-ratio:1259/562`；悬停箭头淡入 `.hero-arrow`、底部圆点常显 `.hero-dots`；自动 5s、悬停暂停；2026-09-08）；米黄底延伸图下 24px【2026-09-09 自 71px 缩至 1/3，配合公告条间距】；`.hero-slide` object-fit：**首张=cover（保持原样裁边），第 2 张起=fill（完整显示、压缩/拉伸填满同一框、不裁剪）**【2026-09-09 用户要求：后张自适应第一张尺寸，变形没关系；`.hero-slide:not(:first-child)`】 |
| 简介区 | 标题 54px/1.1 #272e47；副文案 18px/1.7 #282f48；药丸 328×60/radius30/填充 #04101b、描边 #cfd3da（文字18px）；三图列 388fr/360fr/388fr 底对齐，侧图480高、中列(药丸+320图) justify:space-between，`.tag-pills{margin:-11px 0 0}` |
| 主产品 | eyebrow 36px/800 大字距 uppercase；导语 18px/24px uppercase #6b7280 max640；**卡片 600×384 #f9fafb 圆角10**（grid margin 0 -15px, gap 32），图 40%、title 20px/700 uppercase 无下划线 mb36、desc 14px/22px uppercase #6b7280 |
| 产品卡 | grid3: 卡 #f7f7f7、标题 Antic Slab 20px、尺寸14px、材质13px、印刷工艺 chip 描边；**
banner/通用卡(product-card)说明模块：品名(p-name)→属性表(.p-spec，Size/Material 可自由增删、对照 sg-spec；**新样式 2026-09-08：无内层灰线框，左栏雾蓝 #eef1f4 / 右栏米白 #fafaf9 双色块、单元格 3px 白缝 `border-spacing:3px`（`border-collapse:separate`），每格独立色块**)→宣传语(.p-sub 13px、pre-line)**（2026-09-08，desc/material/detail 换 specs+subtitle）；
feather 卡: 淡蓝边框 #d9e2f5 圆角10、说明模块=品名(f-title 18px/700)→属性表(f-spec，Size/Material 可自由增删、对照 sg-spec；**同 .p-spec 新样式 2026-09-08**，specGrid 的 .sg-spec 亦同)→宣传语(f-sub 13px 灰、pre-line)**（2026-09-08 起 size/material/desc 换 specs+subtitle、移除 CTA）；
国旗卡（flags 布局, 2026-09-08）：品名**加粗居中**（.nf-card .p-name，Serif 20px/700 居中）→属性表(.p-spec 新样式)→宣传语(可选)；原 p-size/p-material/p-chip（黑框印刷 chip）已移除；
feather/national/banner 页横幅: `.page-banner`（米黄 #faf7f5 底、pad 40px 0 8px）渲染于徽标行/标语之上，图 `width:100%; height:auto` 全幅不裁剪 + **border-radius: 12px 圆角**（用户 2026-09-06 要求）；移动端 pad 20px；`featherBody()/nfBody()/bannerBody()` 判断 `data.bannerImage` 存在才输出；对应 config.yml 的「顶部横幅图片」字段（image 组件，feather-flags / national-flags / banners 三个 collection 均有） |
| Pole | 46px/700 #1c1c1c 居中页头 + 16px 副文；大卡=**#f5f7ff 圆角12 554×614**、标题24px、desc15px、tag14px/700、图553×368 贴底全宽（负 margin -30px + max-width:none + flex-shrink:0）;BETTER INGREDIENTS = Bona Nova 28px/700 字距.18em；配件卡=无底色、图320×320 圆角16、标题 Rufina 20px、desc16px #272e47、列320px gap 94/75 居中 |
| About | hero 图 215px 高 cover（margin-top12）；marquee = **Acme 40px/700 #f15d49**（Quality Factory - 23 Years of Excellence，38s 循环），与正文同处 #f8f8f8 带内（pad 80px）；正文列 580px/16px/24px #272e47 **段距 36px**（`p + p`，2026-09-06 自 0-8 调大以对齐图列高度）、图列 480×400 **margin-top 0**（原 161px，自 2026-09-06 上移对齐首行文字）+ **border-radius:12px 圆角**（拼图 `.about-img-2` 圆角保持 0）+ 拼图 480×自动高/间隔 32px（`.about-img-2`）；客户区白底：label16px/700 #6b7280、tagline36px/45px #1f2937 max341、logo 128×86 4列 gap 31/16；FAQ #dfe3e2：标题44px、Q=Acme 20px/30px、A 16px/27px #545a6e、**箭头：关闭▼(rotate180)、展开▲(rotate0)** |
| 时间轴 `.tl`（timeline，2026-09-09） | 背景=`bg` 后台可换（演示=白 #ffffff）；标题 `.tl-title` 36px/700 左对齐 #272e47；年份横条 `.tl-track`：`justify-content:space-between`、圆点 `.tl-dot` 18px 白底、边框 #dfe3e2（同 FAQ 底）、横线 3px #dfe3e2（在 `top:55px` 穿圆点中心）；年份字 `.tl-year-txt` 14px #6b7280；**悬停/选中 → 鲑红 #f15d49**（同 marquee 上方滚动字）+ 加粗；悬停动效：圆点 `scale(1.35)` 变红、年份 `tlJiggle` 上跳 5px 动画；选中 `.is-active` 圆点变红放大+光环 `rgba(241,93,73,.15)`；下方 `.tl-panels`：大年份 `.tl-big` 64px/800 左对齐 #272e47、文字 `.tl-text` 16px/1.7 右对齐贴右缘；区块底部 `border-bottom:2px solid #f8f8f8` 浅米黄分隔线；自动播放：`.tl` 带 `data-autoplay[on|off]`/`data-interval`（build 输出），site.js 定时 `go(cur+1)`、到末位 `%years.length` 循环回第一个、悬停 `.tl-year` 暂停/移开恢复、手动点击 `go(i)+restart`；移动端年份条横向滚动（`scrollbar-width:none` 隐藏滚动条、加 `padding` 防圆点被裁） |
| 页脚 | `0.8fr 1fr 1fr auto` 列 + `column-gap: 48px`（2026-09-08 起：三块内容间距均匀拉开；末列 auto 收内容宽度自然贴容器右缘=与上方内容框右对齐；0.8fr 收窄 Logo 列防地址行折行）；h4 18px/500 #d6dfff（第3列15px）；p 14px #8395a0 行高29；首电话18px/500 #d6dfff；版权 14px #7d8085 + 上边框线 + pad 27/40；padding-top 100px；**联系信息带内嵌SVG线框图标**（地址=定位、电话=听筒、邮箱=信封，`.f-line` flex+gap 8、`.f-ico` 16px 颜色随文字 currentColor、地址续行 `.f-line-indent` 缩进24px；2026-09-08） |
| 字体 | Catamaran(home h1)/Antic Slab(国旗卡题)/Bona Nova(BETTER)/Rufina(配件题)/Acme(marquee+FAQ题)；Google Fonts link 在 shell()，离线回退 Arial/Georgia |
| 图片资产语义 | home-hero/workshop/printing/factory；home-cat-national|banner|feather|polekit；flag-01..06；banner-1..6；feather-1..4；pole-01..08；client-01..08；logo/footer-logo/footer-icon-1..3/favicon；about-hero/factory；pole-03..08 实物映射（03镀铬十字/04水罐/05水袋/06地钉/07方座/08张力展架） |

---

## 5. 新增类目页（自动发现机制）

> ⚠️ **两条铁律**：① 文件必须 `.json`（后台已配 `format: json`；若存成 `.md` 会被忽略、页面不出现）；② `slug`/`file`/`nav` 一律**英文小写、无空格**（如 `stands-displays`、`stands-displays.html`、`/stands-displays.html`），别用 "Stands & Displays"——否则文件名/网址大小写不匹配 → 404。

三步（用户视角在后台完成；代码侧只需保证机制完整）：
1. `content/pages/<slug>.json`，结构见 `content/pages/led-display.json`（内置示例，替换内容即可）：
   `slug` + `page{file,layout,nav}` + `seo` + `heading/tagline` + `products[{name,size,material,desc,image}]`
2. **同时**在 `admin/config.yml` 的 `pages` collection 已有通用字段；专用新模板（若布局是"flags"等4种已有布局）无需动配置；若未来要新增**专用字段模板**才需要加 collection
3. 导航菜单：`settings.json` nav 加一项（后台"站点设置"可做）；`layout` 可选 `simple|flags|feather|bannerCards|pole`，默认 simple

---

## 6. ⚠️ 坑清单（血泪教训，违反必翻车）

1. **原站是网易建站产物**：HTML 无语义标签、属性不带引号、文本被拆成小块（长句不是一个叶节点——按整句匹配会失败，用"遍历叶子+y范围过滤"兜底）
2. **DOM 顺序 ≠ 视觉顺序**：首页三图、旗杆6图、feather size 行数次出现"提取对、显示错"。判定权永远在**渲染后的测量/截图**，不在 DOM 文本顺序
3. **产品文案保留原站拼写/大小写**（如 `comstom size`、`silksreen`、`40"` 里的转义引号）——用户要的是复刻，不是修正
4. **全局 `img{max-width:100%}`** 会把负边距全宽图钳小（典型症状：图片左右有白边）→ 该图加 `max-width:none + display:block + flex-shrink:0`
5. `static/` 是构建产物，手改无效且会被覆盖；改完内容**必须**重建
6. **页面页脚**：产品页曾按原站保持极简版权带（minimal footer）；**2026-09-06 用户取消该行为，要求全站每个页面都显示完整页脚（公司+地址+电话+邮箱）**——现在 `footerMode` 全为 `'full'`，勿再改回 minimal
7. Decap media path = `media_folder: "media"` / `public_folder: "/assets/media"`；改路径约定要三处同步（config.yml + build.mjs 拷贝逻辑 + 内容引用）
8. 现有 4 类产品 JSON 必须保留 `page` 声明字段（自动发现的钥匙）
9. JSON 注释不支持；字符串含双引号须 `\"` 转义；UTF-8 保存
10. **国内网络**：GitHub 直连常断，走代理 `git config http.proxy http://127.0.0.1:7890`（**实测可用端口=7890**；旧文档写的 26001 已失效——该端口无监听、连不上）；pip 用清华源；Playwright 截图用系统 Edge（`channel="msedge"`）无须下载浏览器；Google Fonts 国内可能加载慢（有回退字体兜底，不必强求）
10b. **config.yml 内联行（`{...}`）分隔符必须半角逗号 `,`**：全角逗号 `，` 会被当成标量内容 → 后台报 "Flow map contains an unexpected :" 全线瘫痪（2026-09-07 事故：`label: 小图标（上传图），name:` 一行导致整站后台配置解析失败）。改 config.yml 后必做两步：① `python` 用 PyYAML `safe_load` 校验；② Playwright 打开 `/admin/` 确认无 "Error loading the CMS configuration"。全角标点在提示文字（hint/label 值内部）没事，只要不冒充分隔符
11. **不要过度自信"视觉修正"**：本会话模型的图片读取通道不可用，看截图全靠用户贴图+探针测量；用户标注（红圈文字）是最高优先级需求
12. **新增类目页曾踩坑 .md**（2026-09-04）：后台把类目页存成 `stands-displays.md`，而构建**只认 `.json`** → 页面静默不生成、产品不显示、菜单指向空页。已修：`admin/config.yml` 的 `pages` collection 加 `format: json`。若再遇"存了不显示"，先看文件是否 `.md` 且 slug 是否小写无空格。
13. **Download Catalog 按钮只在首页**：由 `settings.catalogButton` 驱动、在 `homeBody()` **绝对定位**渲染（首页右上角、紧贴 Contact Us 下方），**不**进共享 `header()`。改它别动 `header()`；色值用 CSS 变量 `--catalog` / `--catalog-dark`。PDF 放 `media/`，后台用 `widget: file` 上传。
14. 改动后回滚出口永远是 Git（`git revert <commit>`），每天渐进提交
15. **导航菜单多词名称折行**（2026-09-08）：菜单名改长（如 Products→Full Products、Feather flag→Feather flags）后，`.nav-menu` flex 空间不足会把词断到下一行叠起来。`site.css` 的 `.nav-menu a` 加 `white-space:nowrap` 强制单行；并收紧菜单间距（gap 31→24、margin-left 32→20），汉堡断点 `@media (max-width:1200px)`（原 900px）保证窄屏时「Contact Us」不被挤出屏幕。**教训**：改动体量较大的菜单文字后，一定要用 Playwright 在 1280 和偏窄宽度各截图，确认既不折行、也不溢出挤掉按钮
16. **Decap config.yml 字段缩进层级错误（2026-09-08 事故：specgrid 补充模块"消失"）**：给不同 collection 加同一个字段时，**`files:` 型与 `folder:` 型的字段缩进层级不同**——`files:` 型（home / feather-flags / banners / national-flags / pole-display 等）字段缩进为 **10 空格**（位于 `files[0].fields` 下）；`folder:` 型（specgrid / pages / product-details / blog 等）字段缩进为 **6 空格**（位于 collection 顶层 `fields` 下）。**若直接复制 `files:` 型字段块到 `folder:` 型而不改缩进，字段会被当成上一个字段（如 products）list 的**子字段**而静默嵌套**，后台表现为"这个栏目看不到 XX 字段"，但构建不报错、PyYAML 也解析通过——最隐蔽。**必须遵守**：
   - 改 config.yml 前，先确认该 collection 是 `files:` 还是 `folder:`，据此确定新字段体的缩进；
   - 加完后必做：① PyYAML `safe_load` 通过（坑 #10b）；② **用 python 打印该 collection 顶层字段名**，确认新字段在顶层、且没被嵌进 products 等 list 的 `fields`（`python -c "..."` 遍历 `collections`，files 型取 `files[0].fields`、folder 型取 `fields`，列出各字段 name）；③ 有 Playwright 就打开 `/admin/` 确认该栏目出现对应字段；
   - 现象判断：后台某个字段"突然不见/只看到一部分"→ 多半是缩进层级把它嵌进了上一字段，**先查 config.yml 层级，别先怀疑部署或缓存**；
   - 本例：specgrid 的 `supplement` 误用 10 空格嵌进 products → Stands & Displays 后台看不到"补充模块"；已改回 6 空格顶层字段修复。判断字段是否"在顶层"的脚本见 §7 自检。

---

## 7. 修改自检清单（每次改动后必做）

1. `node scripts/build.mjs` 构建无报错
2. `cd static && python -m http.server 8080` + Playwright 打开改动页：无 console error、无资源 404（`requestfailed` 监听）
3. 关键坐标用探针与**本文件 §4 参数表**对照（误差 ≤10px 达标；y/x/w/h 全含）
4. 若动样式：1280 三档截图（桌面/平板/手机 375）目检不破版
5. 内容回路验证：改 JSON → build → curl/渲染确认出现
6. 上线：`git add -A && git commit -m "..." && git push` → CF Pages 自动部署 → 1-3 分钟访问线上复查
7. 涉及域名/sitemap：同步 `SITE` 常量
8. 若改 `admin/config.yml`（加字段/改 collection）：① PyYAML `safe_load` 通过（坑 #10b）；② 用下面脚本确认新字段在**顶层**、没被嵌套进 products 等 list 的 `fields`（坑 #16）：
   `python -X utf8 -c "import yaml; c=[x for x in yaml.safe_load(open('admin/config.yml',encoding='utf-8'))['collections'] if x.get('name')=='<栏目名>'][0]; fs=c.get('fields') or c['files'][0]['fields']; print([f.get('name') for f in fs])"` → 输出的顶层字段列表**应含**新字段；且该 list 字段（如 products）的 `fields` 子字段列表里**不应**有它；③ 有 Playwright 就开 `/admin/` 核对（坑 #10b/#16）。

---

## 8. 其他已知事实

- 原站离线副本（只读）：`H:\工作总集\wolflag 网站信息\2026 公司网站\wolflag 离线版\`（6 个 .htm，SingleFile 格式，base64 图）
- 视觉基准截图：`screenshots-original/`（原站渲染）、`screenshots-new/`（新版渲染）、人工标注稿在用户桌面（001/004/011/016/019 等）——**用户截图即"标准"**
- 一次迁移工具 `scripts/extract.py`：含 48 张图的 md5→语义名映射表（改图命名必须同步此表）
- `admin/index.html`:jsdelivr CDN 载入 decap-cms@3.9.0
- **后台登录 OAuth 配置（2026-08-24 生效，2026-09-04 登录失效后实战修复、重新验证通过，最终配置未变）**：GitHub OAuth App `wolflag admin`（账号 Tony0232-HZ；Redirect URL 登记**纯净** `https://decap.tony222.workers.dev/callback`，无 `?provider` 尾巴）；Cloudflare Worker `decap`（密钥 GITHUB_OAUTH_ID=Ov23liV3OrfRG3tL4IlZ、GITHUB_OAUTH_SECRET=2026-09-04 重新生成的值，**勿写入文档**，看 GitHub 应用页）；config.yml 的 `repo/base_url` 已填实；本地克隆 `H:\工作总集\wolflag 网站信息\2026 公司网站\decap-proxy`（**已修改源码且此版本在线上运行**：handleCallback 删除 provider 检查 + /auth 跳转改 302+no-store + redirect_uri 纯净）——Wrangler 登录用 `CLOUDFLARE_API_TOKEN` 环境变量（api token：Edit Cloudflare Workers 模板、建 token 时删 Zone Resources 行）
- 登录排障三字诀：client_id（选中复制，连字符/大小写）、callback 登记值、redirect_uri 三处逐字核对；state 不变 = 浏览器缓存旧 301，用无痕窗口。**完整排障手册见 §9**（2026-09-04 实战整理，含 GitHub 报错页一眼判定表）
- 用户是中文母语、非程序员；沟通用中文、给可点击的步骤；一切改动以用户确认图片为准
- 全站目标对象：海外 B2B 买家（英文站点、询盘全靠邮箱/电话：tony@wolflag.com + tony@wolflagdisplay.com、+86 (571) 28239823）

---

## 9. 后台登录 OAuth 排障手册（2026-09-04 实战整理，本仓库专用）

> 现象：访问 `/admin/` 点登录后卡在 `github.com/login/oauth/authorize?...` 并报错。
> 链路：浏览器 → Worker `decap` 的 `/auth` → 302 跳 GitHub 授权页 → 用户授权 → GitHub 回跳 Worker `/callback` → 回传 token。
> **唯一可靠的现场证据 = 浏览器地址栏里的授权 URL**：`client_id=`、`redirect_uri=`、`state=` 三个参数都是关键线索。

### 9.1 一眼判定 GitHub 报错类型

| 打开的页面 | 含义 | 修法 |
|---|---|---|
| 沙漠 404（"This is not the web page you are looking for"） | **client_id 无效**：应用不存在/被删/在别的账号下/复制错 | 去 GitHub 应用页核对 Client ID（现为 `Ov23liV3OrfRG3tL4IlZ`），改 Worker 密钥或重建应用 |
| ⚠️ "Be careful! Invalid Redirect URI" | 应用认出来了，但 **redirect_uri 与登记值不一致**（多/少 `?provider=github`、大小写、斜杠） | 让「GitHub 应用页登记的 Redirect URL」与「地址栏 redirect_uri」逐字一致 |
| 正常 GitHub 登录页 | 通过，正常登录授权 | — |

### 9.2 三个环节必须逐字一致

1. **Client ID**：GitHub 应用页显示值 ＝ 授权 URL 的 `client_id=`（大小写敏感，用页面上的复制按钮，别手输）。
2. **Redirect URL 登记值**：GitHub 应用页「Authorization callback URL / Redirect URL」——本项目登记**纯净** `https://decap.tony222.workers.dev/callback`。
3. **Worker 实际发出的 redirect_uri**：就是地址栏授权 URL 里的那个值。本项目线上 Worker 跑的是**改版源码**（发出的 redirect_uri 无 `?provider=github` 尾巴，见 §8）——**判定线上 Worker 版本的唯一可靠办法：用无痕窗口全新点一次登录，看地址栏 redirect_uri 带不带 `?provider=github`**。本机 curl/WebFetch 直连 `workers.dev`/`github.com` 受网络/代理干扰，**不可当作判定依据**（2026-09-04 曾因此误判为"原版在跑"）。

### 9.3 标准修法（2026-09-04 实测有效）

1. 打开 https://github.com/settings/developers → OAuth Apps → **wolflag admin**（Tony0232-HZ 账号）核对：
   - Client ID = `Ov23liV3OrfRG3tL4IlZ`
   - Redirect URL = `https://decap.tony222.workers.dev/callback`（纯净，无 `?provider=github`）
   - 若怀疑 Secret 被改过：**Generate a new client secret**（只显示一次）→ 新值去同步给 Worker（第 2 步）
2. 修 Worker 密钥（本机已配 `CLOUDFLARE_API_TOKEN`，直接能在 decap-proxy 目录跑）：
   ```bash
   cd "H:/工作总集/wolflag 网站信息/2026 公司网站/decap-proxy"
   echo '<GitHub页面上的Client ID>'  | npx wrangler secret put GITHUB_OAUTH_ID
   echo '<新生成的Client Secret>'     | npx wrangler secret put GITHUB_OAUTH_SECRET
   ```
   成功标志：`✨ Success! Uploaded secret ...`
3. **无痕窗口**（Ctrl+Shift+N）打开 https://www.wolflag.com/admin/ 登录。普通窗口会命中浏览器缓存的旧 301/302，表现为"明明改了却不变、state 每次都是同一个"。
4. 验证通过后把本次生效值记回 §8（Client ID、Redirect URL、是否重置过 Secret）。

### 9.4 2026-09-04 故障复盘（本次事故）

- **现象**：后台登录跳 GitHub 后 404 沙漠页；用户以为"公司电脑能登、家里电脑不能"——**与电脑完全无关**（服务端配置对所有客户端一致），实为**当天配置被人动过**：Worker 密钥被指向了不存在的 Client ID `Ov23liQr6ymTNQ73b1u2`，而应用真实 ID 是 `Ov23liV3OrfRG3tL4IlZ` → GitHub 对无效 client_id 统一回 404。
- **修复过程**：① 把 Worker `GITHUB_OAUTH_ID` 改回真实 ID → 404 消失、client_id 对上了，但变成 "Invalid Redirect URI"（此时按"原版 Worker"的错误假设把 GitHub 登记值改成了带 `?provider=github`）；② 无痕窗口再试（state=全新值）发现线上 Worker 实际发出**纯净** redirect_uri（改版在跑）→ 把登记值改回**纯净** → 登录成功。
- **教训**：① 改任何环节前，先用无痕窗口拿到**当前真实**的授权 URL，以它为准，别拿历史截图/旧记录推断线上状态；② GitHub 的报错页类型（§9.1 表）本身就是定位器：404=ID 问题，Invalid Redirect URI=路径问题；③ Client Secret 只显示一次，改一边必须同步另一边。

---

*最后更新：2026-09-09。今日：**公告条重构**（从全站顶部挪进页面内，只在首页/关于我们各一条且**独立配置**；字段 `{enabled,mode,bg,color,pause,scroll,items[{icon,text}]}`，`mode`=inout(首页:滚进停滚出) / slide(关于:当前滚出时下一条同步滚进)；build `announceBar()` 复用渲染、site.js 按 `data-mode` 分支、`.announce*` 样式、`.home-hero` 底带 71→24px 让首页公告条与栏目图间距 95→32px；About 顶部原 `.about-marquee` 删除；后台 home/about collection 各加 announce 字段（含 mode 下拉，防编辑时丢失）；图标 media/icon-megaphone/factory/globe/email.svg；首屏顶部公告已移除；见 §2.9）+ **首页 hero 轮播首张 cover、后张 fill**（`.hero-slide` 默认 cover，`.hero-slide:not(:first-child){object-fit:fill}`→后张完整显示、压缩/拉伸填满同一框、不裁剪，首张保持原样；2026-09-09 用户要求，见 §4）。前次：2026-09-09。今日：**About 页新增时间轴（年份大事记）**（新增第 6 种 About 模块 `timeline`：`{bg,title,autoPlay,interval,items[{year,text}]}`；年份横条+圆点、点年份切对应大字+文字；`items` **build 时自动按 `year` 升序**（最左最早、最右最晚，后台填错顺序也自动纠正）；自动播放**默认开**，每 `interval` 秒（默认5，建议5~8）跳到下一年、**到末位 `%years.length` 循环回第一个**；**悬停在某年份上 `mouseenter` 暂停、`mouseleave` 恢复**；手动点击 `go(i)+restart`；后台 About→页面模块→时间轴：背景色/标题/**自动播放开关**/**间隔秒数**/里程碑增删拖序；悬停/选中=鲑红 #f15d49（同顶部 marquee），线+圆点 #dfe3e2（同 FAQ 底），背景白 + 区块底部浅米黄分隔线 #f8f8f8，FAQ 背景改 #f8f8f8；build.mjs `renderAboutBlock` 加 timeline 分支 + site.js `go/start/stop/restart`（`data-autoplay`/`data-interval` 驱动）+ CSS `.tl-*` + config.yml about blocks `types` 加 timeline（字段校验通过）；见 §2.2/§4）。前次：2026-09-08。今日：**国旗产品页改版**（national-flags 卡片改为 品名加粗居中(.nf-card .p-name)→属性表(specs 自由增删，Size/Fabric/Printing 三行)→可选宣传语；size/material/printing 字段→specs，尺寸值去 "popular size:" 前缀；黑框印刷 chip(p-chip) 移除；后台表单同步更换并校验通过，见 §2.3/§4）+ **属性表改版**（f-spec/p-spec/sg-spec 去掉内层灰线框，改为左栏雾蓝 #eef1f4 + 右栏米白 #fafaf9 双色块、单元格 3px 白色缝隙（border-spacing，每格独立色块）；**pd-spec/pd-price 按用户要求保持原线框样式**，详情模板新页面也保持原样，见 §2.6/§4）+ **页脚间距与右对齐**（`.footer-grid` 改 `0.8fr 1fr 1fr auto` + 48px 列距，三块内容（工厂/杭州/电话邮箱）均匀排开，末列 auto 贴容器右缘=与上方内容框右对齐；原 4×1fr+6px padding 视觉仅 12px 太挤；杭州地址后台误合并成一行 `...St.hangzhou China`，已拆回两行 `St.` / `Hangzhou China`；页脚 logo `1.png`(153KB)→`1.webp`(36KB, quality 80)；见 §2.1/§4）+ **导航栏折行修复**（改复数菜单名后多词被叠成两行；`.nav-menu a` 加 `white-space:nowrap`、菜单间距收紧 gap 31→24、汉堡断点 900→1200px，见 §4/坑#15）+ **导航菜单名改复数**（Feather flag→Feather flags、Products→Full Products、National Flag→National Flags，仅显示文字、URL 不变）+ **羽毛旗 Teardrop 产品图转 WebP**（水滴型沙滩旗02.png 2.2MB→.webp 162KB，并删除旧 PNG）+ **Pinpoint 旗帜图文件名修复**（去掉手误的单引号字符 `pinpoint-旗帜-定版’.jpg`→`pinpoint-flag.jpg`）+ **羽毛旗产品页说明模块改版**（说明模块改为 Stands & Displays 同款：品名→属性表(specs)→宣传语(subtitle)，删 CTA；后台 feather-flags 字段 size/material/desc 改 specs+subtitle，见 §2.3/§4）+ **横幅产品页说明模块改版**（品名→属性表(specs)→宣传语(subtitle)，对照 specGrid；后台 banners 字段 desc/material/detail 改 specs+subtitle，见 §2.3/§4）+ **界面动效**（两个主按钮 Contact Us / Download Catalog 悬停轻微上移 2px + 柔色阴影；导航菜单产品名称悬停/选中=浅沙 #f5f0e8 圆角胶囊 + 加粗（padding 6px 12px + margin 0 -10px 防撑宽导航，移动端整行高亮），见 §4）+ **页脚联系图标**（地址/电话/邮箱前加内嵌SVG线框图标（定位/听筒/信封），地址每区块一图标、续行缩进对齐，见 §2.1/§4）+ **补充模块**（每页底部可加多个图文区（show/title/text/image），铺到首页/羽毛旗/横幅/国旗/Stands & Displays 五页，build.mjs `supplementSection()` 通用函数、后台 5 栏目均为 `widget:list` 可 Add 多个；默认全隐藏，见 §2.8）+ **图文区块显示/隐藏 + simple 布局渲染 sections**（sections 每块加 `show` 开关，`sectionsBlock(data)` 通用函数，`simpleBody`/`flexBody` 都用；products.json 底部可显示图文区块，见 §2.6）+ **首页 hero 多图轮播**（hero 加 `images[]/interval/mode`；淡入淡出+自动5s+悬停暂停+底部圆点+悬停左右箭头；site.js `hero-slider` 逻辑 + CSS `.hero-slider*`，见 §2.2/§4）。前次：2026-09-07。今日：**About 页内容模块化**（blocks 列表：text/image/textImg/clients/faq 五类，每模块可选背景色（Decap `color` 部件、十六进制、极简 10 色板）；图文可调方向/比例/每图独立上下位置；见 §2.2）；**新增 §0.6「改动推送上线并同步本地后，主动询问是否写进 AI-GUIDE/README」准则**；**specGrid 属性网格独立栏目**（content/specgrid、后台「属性网格类目页」、字段仅 品名/宣传语/属性/图片，避免混入他模板字段；宣传语改多行文本并移到产品属性下方）+ **全站产品图片点击放大**（悬停放大镜、点击弹全屏大图、Esc/点击恢复；链接卡保留跳转）；**正文加粗标记**：正文 `**文字**` 自动转 `<strong>`（build.mjs `bold()`，About 段落 + 博客 p/h2 已支持，其余仍转义保安全；CSS `p strong` 同色加粗）；**产品详情页规格表改为「产品属性」自由增删列表**（`specs[{label,value}]` 替代原 fabric/printing/size/moq/leadTime，`productSpecRows()` 兜底兼容；见 §2.6/坑附录）；新增 §0.5「**会话开场前必须先主动询问的两件事**」（① 网站更新要不要同步到本地；② 新上传图片要不要转 WebP；均以用户批准为前提，2026-09-07 用户要求）；**config.yml 全角逗号导致后台全线崩溃，已修（坑 10b）**；Products 合集页加 bannerImage 横幅 + 卡片 p.link 可点击；删除 Custom Flags 示例页（用户不要 flex 页，模板保留）；「产品详情页 vs 新增类目页」定位确认（见 §2.6）。前次：2026-09-06 **Products 合集页 + 导航子菜单 + 两个新模板（detail 产品详情：多图画廊/规格表/价格表/MOQ/交期/3 张可编辑服务卡/图文区；flex 通用图文）**，Banner 改为 Products 子菜单项（详见 §2.6）；**Blog 博客模块增强**：正文插图块（type:image，数量不限）；文章页右侧 All Posts 侧栏（所有文章、20 条/页、JS 翻页）；列表分页 20 篇/页（/blog-2.html…）；置顶 `pinned`（多置顶按时间倒序、取消即回时间序）+ PINNED 徽章；**Blog 博客模块**（列表页 /blog.html + 文章页 /blog/<slug>.html，content/blog/*.json 自动发现、draft 草稿开关、后台「博客文章」栏目、自动进 sitemap，详见 §2.5）；最新导航：…About Us / Blog / Contact Us 按钮；Feather flag 页顶部横幅（`bannerImage` 字段，后台「羽毛旗产品页→顶部横幅图片」可换，素材 media/feather-banner.webp 2000×825）；National Flag 页同款横幅（media/national-banner.webp 2000×837）；Banner 页同款横幅（media/banners-banner.webp 1952×806）；CSS 类统一为 `.page-banner`（原 `.feather-banner` 改名）；三页横幅加 12px 圆角；About 页工厂图下新增拼图（段距调 36px 使左右两列高度≈对齐）、工厂图 12px 圆角；页脚原地址已由后台改为 No 7 Weisan Road Zhapu Town（Zhapu/平湖）；**全站页脚统一完整页脚**（页脚策略变更，见 §3/坑 #6）；随线上后台更新同步拉取并重建 static。前次：2026-09-04 导航改名「Flagpoles & Accessories」；修复并新增「Stands & Displays」类目页（.md→.json + `format: json` 治本）；首页新增「Download Catalog (PDF)」金色按钮 + 后台上传入口；**后台登录 OAuth 修复实战**（Worker 密钥被错指为不存在的 Client ID → 404；登记回调与线上 Worker 版本不一致 → Invalid Redirect URI；两处对齐 + 重置 Client Secret 后恢复，实测登录通过），并新增 §9 排障手册。版本号按 git log 追踪。*
