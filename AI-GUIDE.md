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

## 1. 目录结构（每个目录的角色）

```
wolflag-site/
├── content/            ★ 网站内容（数据层），后台/手工编辑都改这里
│   ├── settings.json       导航/页脚/电话/邮箱/版权/Contact Us 按钮
│   ├── home.json           首页（首屏、简介区、主产品卡）
│   ├── about.json          关于我们（5段介绍、8客户logo、4条FAQ）
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
```

### 2.2 home.json / about.json
- `home.json`：`seo{title,description}`、`hero{title,text,image,features[2]}`（features=两个药丸 Professional/Reliable）、`intro{title,text,images[3]}`（**顺序敏感**：0=缝纫车间(home-factory)、1=旗帜喷印全景(home-workshop，中列药丸下方)、2=黄色印刷机(home-printing)；曾因 DOM 顺序≠视觉顺序而返工）、`categories{title,intro,items[4]}`（items：National flag→/national-flag.html、banner→/banner.html、Feather flag→/feather-flag.html、pole kits→/pole-display.html；**首页没有用 `factory` 字段，忽略它**）
- `about.json`：`seo`、`hero{title,subtitle,image}`（image=about-hero 顶部横幅）、`paragraphs[5]`（正文支持 `**文字**` 加粗标记，见 `bold()`）、`factoryImage`（about-factory 480×400 右列）、`collageImage`（**可选**，工厂图下方拼图，≈483×360，后台「工厂下方补充图片」）、`clients{title:"Our Clients",tagline:"Trusted by over 70+ clients",subtitle,logos[8]}`（8 张 client-01..08）、`faq[4]{q,a}`

### 2.3 products/*.json（4 个专用类）+ page 声明

**每个产品 JSON 必须带 `"page": { "file", "layout", "nav" }`**，这是自动发现注册表的钥匙：

| 文件 | file | layout | 特有字段 |
|---|---|---|---|
| feather-flags.json | feather-flag.html | `feather` | badge(徽标行), bannerImage(顶部横幅,**可选**,不填则无横幅), products[{name,size,material,desc,image}], cta |
| banners.json | banner.html | `bannerCards` | tagline, bannerImage(顶部横幅,**可选**), products[{name,desc,material,detail,image}] |
| national-flags.json | national-flag.html | `flags` | tagline, bannerImage(顶部横幅,**可选**), products[{name,size,material,printing,image}] |
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

- **页面发现**：`PAGE_DIRS = ['products','pages','product-details']`（多了一个 `content/product-details/*.json`，结构同 pages/：自带 `page{file,layout,nav}`）。`layout` 可选值现为 **simple/flags/feather/bannerCards/pole/detail/flex**
- **detail（产品详情模板）**：字段在 config.yml 的 `product-details` collection——`products[{name,desc,images[]（多图，第一张主图，JS 切换）,specs[{label,value}]（自由增删属性，2026-09-07 起替代原 fabric/printing/size/moq/leadTime）,prices[{qty,price}]}]`（一个页面可放多个产品，上下排列）、`serviceCards[{icon,title,text}]`（3 张小卡，图标可传图；留空用 `DEFAULT_CARDS` 默认值：svc-support/shipping/returns.svg）、`textImg{title,text,images[]}`（三卡下方图文区）；**无购物车、无 Show Off 区**（用户要求，参考站 参考新页面.htm 裁切）。规格表 `productSpecRows(p)`：优先用 `p.specs`，旧字段 fabric/printing/size/moq/leadTime 作兜底；前台 `/car-flags.html` 默认 5 行（Fabric/Printing/Size/MOQ/Lead Time）
- **flex（通用图文模板）**：`sections[{title,text,images[]}]` 按顺序多组（标题+文字+多图），适合定制流程/公司介绍类页面；页面建在 `content/pages/*.json`（pages collection 已加 sections 字段）
- **导航子菜单**：`settings.nav[].children[{label,url,external?}]`；build 的 `header()` 渲染 `li.has-children > a + ul.nav-drop`（桌面悬停/焦点显示，移动端展开为静态缩进列表）；子菜单子项命中 `active` 也高亮
- **示例**：`content/pages/products.json`（Products 合集 hub，simple 布局，含 bannerImage 横幅 + 卡片 link 可点击）、`content/product-details/car-flags.json`（detail：Car Flags）；flex 示例页 custom-flags **2026-09-06 已按用户要求删除**（模板仍可选）
- **两个后台入口的定位（用户 2026-09-07 确认的区分，写文档时照此）**：「新增类目页」（content/pages）面向**类目/列表型**页面（一个页面一类产品、每产品单图，模板可 7 选）；「产品详情页」（content/product-details）面向**单款产品详情**（多图 + **specs[{label,value}] 自由属性**（默认 fabric/printing/size/MOQ/交期 行，可加颜色、缝纫方式等）+ prices[\{qty,price\}] 阶梯价 + 页面级 serviceCards + textImg）。⚠️ **陷阱**：新增类目页的 layout 下拉虽含 `detail`，但其表单字段是通用版（无多图/价格表输入框）——用户要详情功能必须去「产品详情页」栏目建
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
| 导航 | 52px；菜单从 logo 旁锚定铺展：main=16px/#272e47/无active下划线、active=#4c6aff bold+2px 蓝下划线、gap 31px；Contact Us 右缘 #4c6aff 圆角6 |
| Home | h1 36px Catamaran #573d3d 左侧列397px；段落列 14px/21px **#312925** + `align-self:end`（与 H1 底对齐）;hero 图 1259×562 显示为 1202×419 cover；米黄底延伸图下 71px |
| 简介区 | 标题 54px/1.1 #272e47；副文案 18px/1.7 #282f48；药丸 328×60/radius30/填充 #04101b、描边 #cfd3da（文字18px）；三图列 388fr/360fr/388fr 底对齐，侧图480高、中列(药丸+320图) justify:space-between，`.tag-pills{margin:-11px 0 0}` |
| 主产品 | eyebrow 36px/800 大字距 uppercase；导语 18px/24px uppercase #6b7280 max640；**卡片 600×384 #f9fafb 圆角10**（grid margin 0 -15px, gap 32），图 40%、title 20px/700 uppercase 无下划线 mb36、desc 14px/22px uppercase #6b7280 |
| 产品卡 | grid3: 卡 #f7f7f7、标题 Antic Slab 20px、尺寸14px、材质13px、印刷工艺 chip 描边；**
feather 卡: 淡蓝边框 #d9e2f5 圆角10、size 行15px灰、标题18px/700、描述+CTA 12px**（用户要求非链接）；
feather/national/banner 页横幅: `.page-banner`（米黄 #faf7f5 底、pad 40px 0 8px）渲染于徽标行/标语之上，图 `width:100%; height:auto` 全幅不裁剪 + **border-radius: 12px 圆角**（用户 2026-09-06 要求）；移动端 pad 20px；`featherBody()/nfBody()/bannerBody()` 判断 `data.bannerImage` 存在才输出；对应 config.yml 的「顶部横幅图片」字段（image 组件，feather-flags / national-flags / banners 三个 collection 均有） |
| Pole | 46px/700 #1c1c1c 居中页头 + 16px 副文；大卡=**#f5f7ff 圆角12 554×614**、标题24px、desc15px、tag14px/700、图553×368 贴底全宽（负 margin -30px + max-width:none + flex-shrink:0）;BETTER INGREDIENTS = Bona Nova 28px/700 字距.18em；配件卡=无底色、图320×320 圆角16、标题 Rufina 20px、desc16px #272e47、列320px gap 94/75 居中 |
| About | hero 图 215px 高 cover（margin-top12）；marquee = **Acme 40px/700 #f15d49**（Quality Factory - 23 Years of Excellence，38s 循环），与正文同处 #f8f8f8 带内（pad 80px）；正文列 580px/16px/24px #272e47 **段距 36px**（`p + p`，2026-09-06 自 0-8 调大以对齐图列高度）、图列 480×400 **margin-top 0**（原 161px，自 2026-09-06 上移对齐首行文字）+ **border-radius:12px 圆角**（拼图 `.about-img-2` 圆角保持 0）+ 拼图 480×自动高/间隔 32px（`.about-img-2`）；客户区白底：label16px/700 #6b7280、tagline36px/45px #1f2937 max341、logo 128×86 4列 gap 31/16；FAQ #dfe3e2：标题44px、Q=Acme 20px/30px、A 16px/27px #545a6e、**箭头：关闭▼(rotate180)、展开▲(rotate0)** |
| 页脚 | 4等宽列（pad 0 6px）；h4 18px/500 #d6dfff（第3列15px）；p 14px #8395a0 行高29；首电话18px/500 #d6dfff；版权 14px #7d8085 + 上边框线 + pad 27/40；padding-top 100px |
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

---

## 7. 修改自检清单（每次改动后必做）

1. `node scripts/build.mjs` 构建无报错
2. `cd static && python -m http.server 8080` + Playwright 打开改动页：无 console error、无资源 404（`requestfailed` 监听）
3. 关键坐标用探针与**本文件 §4 参数表**对照（误差 ≤10px 达标；y/x/w/h 全含）
4. 若动样式：1280 三档截图（桌面/平板/手机 375）目检不破版
5. 内容回路验证：改 JSON → build → curl/渲染确认出现
6. 上线：`git add -A && git commit -m "..." && git push` → CF Pages 自动部署 → 1-3 分钟访问线上复查
7. 涉及域名/sitemap：同步 `SITE` 常量

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

*最后更新：2026-09-07。今日：**正文加粗标记**：正文 `**文字**` 自动转 `<strong>`（build.mjs `bold()`，About 段落 + 博客 p/h2 已支持，其余仍转义保安全；CSS `p strong` 同色加粗）；**产品详情页规格表改为「产品属性」自由增删列表**（`specs[{label,value}]` 替代原 fabric/printing/size/moq/leadTime，`productSpecRows()` 兜底兼容；见 §2.6/坑附录）；新增 §0.5「**会话开场前必须先主动询问的两件事**」（① 网站更新要不要同步到本地；② 新上传图片要不要转 WebP；均以用户批准为前提，2026-09-07 用户要求）；**config.yml 全角逗号导致后台全线崩溃，已修（坑 10b）**；Products 合集页加 bannerImage 横幅 + 卡片 p.link 可点击；删除 Custom Flags 示例页（用户不要 flex 页，模板保留）；「产品详情页 vs 新增类目页」定位确认（见 §2.6）。前次：2026-09-06 **Products 合集页 + 导航子菜单 + 两个新模板（detail 产品详情：多图画廊/规格表/价格表/MOQ/交期/3 张可编辑服务卡/图文区；flex 通用图文）**，Banner 改为 Products 子菜单项（详见 §2.6）；**Blog 博客模块增强**：正文插图块（type:image，数量不限）；文章页右侧 All Posts 侧栏（所有文章、20 条/页、JS 翻页）；列表分页 20 篇/页（/blog-2.html…）；置顶 `pinned`（多置顶按时间倒序、取消即回时间序）+ PINNED 徽章；**Blog 博客模块**（列表页 /blog.html + 文章页 /blog/<slug>.html，content/blog/*.json 自动发现、draft 草稿开关、后台「博客文章」栏目、自动进 sitemap，详见 §2.5）；最新导航：…About Us / Blog / Contact Us 按钮；Feather flag 页顶部横幅（`bannerImage` 字段，后台「羽毛旗产品页→顶部横幅图片」可换，素材 media/feather-banner.webp 2000×825）；National Flag 页同款横幅（media/national-banner.webp 2000×837）；Banner 页同款横幅（media/banners-banner.webp 1952×806）；CSS 类统一为 `.page-banner`（原 `.feather-banner` 改名）；三页横幅加 12px 圆角；About 页工厂图下新增拼图（段距调 36px 使左右两列高度≈对齐）、工厂图 12px 圆角；页脚原地址已由后台改为 No 7 Weisan Road Zhapu Town（Zhapu/平湖）；**全站页脚统一完整页脚**（页脚策略变更，见 §3/坑 #6）；随线上后台更新同步拉取并重建 static。前次：2026-09-04 导航改名「Flagpoles & Accessories」；修复并新增「Stands & Displays」类目页（.md→.json + `format: json` 治本）；首页新增「Download Catalog (PDF)」金色按钮 + 后台上传入口；**后台登录 OAuth 修复实战**（Worker 密钥被错指为不存在的 Client ID → 404；登记回调与线上 Worker 版本不一致 → Invalid Redirect URI；两处对齐 + 重置 Client Secret 后恢复，实测登录通过），并新增 §9 排障手册。版本号按 git log 追踪。*
