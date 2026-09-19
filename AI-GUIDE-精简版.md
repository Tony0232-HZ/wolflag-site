# WOLFLAG 网站 — AI 工作手册（精炼版）

> **本文件是 `AI-GUIDE.md`（完整版）的精炼版。**
> 只保留**今天仍然有效**的规则、事实、待办与教训；删掉了「哪天怎么发现的、修复分几步」这类历史过程。
>
> 📌 **每条末尾都标了完整版的章节号**（如 `[§10.7]`）。
> **遇到需要细节、来历、证据，或本条看着不够用时，去 `AI-GUIDE.md` 查那一节** —— **完整版一字未删，永远是最权威的来源**。
> ⚠️ **两份文件的分工**：本文件 = **干活时先看这个**；完整版 = **查证据、查历史、查"为什么"时看那个**。
>
> **本文件的维护原则**：规则/事实变了就直接**改**本条（保持精炼）；但**"当初为什么会错"这类历史留在完整版**。
> ⚠️ **本文件里凡是与完整版冲突的，以本文件为准**——完整版里有些地方没跟着更新（已知 2 处，见 §11 附录）。

---

## 0. 项目一句话概况

复刻自原外贸独立站 **www.wolflag.com**（旗帜制造商：国家旗 / 羽毛旗 / 横幅 / 旗杆展架；原站由网易外贸通建站平台托管，现已换成自有站）。
技术栈：**纯静态站（手写 HTML/CSS/JS）+ JSON 内容外置 + Decap CMS 后台 + GitHub + Cloudflare Pages**，全程零费用零服务器。

| | |
|---|---|
| 线上 | `https://www.wolflag.com`（备用 `https://wolflag-site.pages.dev`） |
| 仓库 | `https://github.com/Tony0232-HZ/wolflag-site`（远端 `origin`，主分支 `main`） |
| 部署 | Cloudflare Pages 自动构建（项目名 `wolflag-site`），构建命令 `node scripts/build.mjs`，输出目录 `static` |
| 目标对象 | 海外 B2B 买家（**全站英文**；询盘靠邮箱/电话：tony@wolflag.com、tony@wolflagdisplay.com、+86 (571) 28239823） |
| 用户 | 中文母语、**非程序员**；靠 AI 维护本站 |

**当前 15 个页面**：`/` `/about-us` `/banner` `/blog` `/car-flags` `/custom-pennant-flags` `/feather-flag` `/hand-held-flags` `/international-maritime-signal-flags` `/national-flag` `/pole-display` `/products` `/stands-displays` `/table-flags` `/404`

**当前导航**：Home ／ Feather flags ／ **Full Products**（子菜单：Banners · Car Flags · Table & Desk Flags · Hand Held Flags · International Maritime Signal Flags · Custom Pennant Flags）／ National Flags ／ Stands & Displays ／ Flagpoles & Accessories ／ About Us ／ Blog ／ 右侧 Contact Us 按钮

---

## 0.1 🔒 最高优先级：四条铁律 + 两条开场动作

> ⚠️⚠️ **这些先于一切技术规则。违反 = 严重错误。**

### ① 严禁自行 `git push` `[§0.7]`

**AI 在任何情况下都不得自行推送上线**——即使改动已完成、已验证、已写好文档，也**必须先得到用户明确说「可以推送 / 推上线 / push」**。
- 用户只说「改 / 做 / 修 / 写文档」≠ 批准推送 → **不推**。改完把效果告诉用户，问一句「要推送上线吗？」
- 推送前先 `git fetch` + `git status -sb` 确认不落后/不冲突；落后就 `git pull --rebase`。
- 历史上曾有 AI 未获许可自行 push，被用户纠正。

### ② 任何改动必须同时管**电脑端 + 手机端** `[§0.8]`

- **动手前**先想清"这个改动在窄屏（390/375px）下会怎样"，尤其涉及**宽度 / 视口 / 文字**的逻辑。
- **改动后必须**用 Playwright 在**桌面 + 手机**各截图目检，并量三条溢出判据（见 §7）。
- **两端无法兼顾时**：**先停下来和用户商量**，由用户拍板。（用户原话：「有困难可以和我商量，我决定怎么办。」）

### ③ 改完并推送后，主动问要不要写文档 `[§0.6]`

改动走完 ①用户批准 → ②push 成功 → ③本地与线上同步 后，主动问：
**「这次改动要不要同时写进 AI-GUIDE.md 和 README.md？」**
> `后台管理操作说明书.html` 在**仓库外**（用户本机），要改先**向用户索取当前路径**（§0.3）。

### ④ 新模块默认**做成后台可编辑**，别写死 `[§10.29⑥、坑 #34]`

**用户是要自己维护网站的人。** 新模块 / 新文案默认就该进 `content/*.json` + `admin/config.yml`，
**不要写死在 `scripts/build.mjs` 里**。
- 判断"要不要给后台字段"时，**不能引用上次的同类决定**（上次用户说过"以后不改"是**特例**）——**要问"用户这次说了吗"**。
- 历史教训：2026-09-15 优势条被写死，用户随即在后台找不到它，连问两次「后台里有相应的模块吗？」「你写死在程序里了？」
- 例外：用户**明确说过**"这个以后不改"的固定值（如 FAQ 外观）才可写死。

### ➕ 开场必问的两件事 `[§0.5]`

> 后台（Decap）改的是 **GitHub 仓库**（= 线上数据源），**本地通常落后于线上**。

1. **「网站最近有没有更新？需要我把网站上的内容同步到本地吗？」**
2. **「网站新上传的图片要不要转成 WebP 格式？」**（只对**新上传的大体积 PNG** 值得转）

两条都必须**先得到用户明确批准**才动手。

### ➕ 审批是「一事一批」 `[§10.31]`

用户批准了 A 事，**不等于**批准了顺手发现的 B 事。**额外发现的问题：要么先问，要么只说、不动手。**

---

## 0.2 🧠 完整版（`AI-GUIDE.md`）的规矩 `[§0.1]`

- **完整版是「AI 的记忆」**：用户原话——「每次重新打开 AI，AI 一点都不记得以前做过什么，**这是 AI 的记忆**。」
- **完整版默认「只增加」，不轻易删改**。只有四种情况可删改：① 已失去作用 ② 有害 ③ 已失去价值 ④ 用户明确批准。
- 完整版里发现旧内容不准确 → **保留原文 + 加「⚠️ 更正（日期）」注解**，而不是覆盖。
- **变更日志在完整版文件末尾，只追加、不删旧条目。**
- ⚠️ **不要在完整版里"顺手整理"**：曾有 AI 因"看起来乱"重排章节号，内容没丢但用户记住的编号全变了——**记忆的价值在于稳定可寻，不在于整洁**。
- 📌 **本精炼版是用户 2026-09-19 明确要求另存的**（完整版一字未动），所以不受"只增不删"约束——**但改动范围仅限本文件**。

---

## 0.3 📌 仓库外「用户本机文件」不必记路径 `[§0.9]`

- **仓库外、属于用户本机的文件路径：不必记录**（典型：`后台管理操作说明书.html`、`SEO操作指南.html`）。
  提到时**只写文件名 + 用途**；要动手改，**直接向用户索取当前路径**——用户每次都会给。
- **仓库内部的路径：照常记录**。 **技术配置信息：照常记录**。
- 完整版里遗留的旧路径（`H:\工作总集\...`、`E:\...`）**一律视为可能过期**。

---

## 1. 目录结构

```
wolflag-site/
├── content/            ★ 网站内容（数据层），后台/手工编辑都改这里
│   ├── settings.json       导航 / 页脚 / 联系方式 / 版权 / Contact Us / 手册按钮 / 优势条
│   ├── home.json           首页（首屏、简介区、主产品卡、客户 logo 带、公告条、补充模块）
│   ├── about.json          关于我们（模块列表 blocks）
│   ├── products/           4 个专用产品页 JSON（feather-flags / banners / national-flags / pole-display）
│   ├── pages/              ★ 新增类目页（自动发现）—— products.json（Full Products）
│   ├── product-details/    ★ 产品详情页（detail 模板）—— car-flags、table-flags、hand-held-flags、
│   │                          international-maritime-signal-flags、custom-pennant-flags
│   ├── specgrid/           属性网格类目页（specGrid）—— stands-displays
│   └── blog/               博客文章
├── media/             ★ 图片库（唯一事实来源）：原站提取图 + 后台新上传
├── src/assets/        CSS/JS 源码（assets/css/site.css、assets/js/site.js）——改样式在这里
├── admin/             Decap CMS（index.html + config.yml）
├── static/            ★ 构建产物 COPY！永远别手工改（每次 build 会重建）
├── scripts/
│   ├── build.mjs           ★ 构建引擎（零依赖 Node≥18）——项目的心脏
│   ├── extract.py          一次性迁移工具（离线 HTML → media/ + 内容 JSON）
│   ├── _preview_server.py  本地预览服务器（模拟 Cloudflare clean URL 行为）
│   └── _check_links.py     遍历全站内部链接/sitemap，报告 404
├── templates/         空目录（预留，未用）
├── AI-GUIDE.md        ★ 完整版记忆（历史 + 全部细节，只增不删）
├── AI-GUIDE-精简版.md  ★ 本文件（干活时先看这个）
└── README.md          部署向说明（给用户看的）
```

**铁律**：`static/` 是生成的，手改无效且会被覆盖；改 `media/` 或内容后**必须**重新构建。
图片路径统一 `/assets/media/文件名.webp`。

---

## 2. 内容数据模型（JSON 语义）

> 📌 逐字段细节见 **完整版 §2**。下面只列"改内容时必须知道"的。

### 2.1 通用约定

- **每个页面 JSON 必须带 `page` 声明**：`{ "file": "xxx.html", "layout": "xxx", "nav": "/xxx" }` —— 自动发现的钥匙。
- ⚠️ **`page.file` 必须带 `.html`**（磁盘文件名）；**`page.nav` 与所有链接类字段一律无后缀**（§5.1）。
- **JSON 不支持注释**；字符串含双引号须 `\"` 转义；UTF-8 保存。
- `slug` / 文件标识：**英文小写、无空格**（如 `stands-displays`，别用 `Stands & Displays`）。
- 📌 **命名规则**：`slug=table-flags`、`file=table-flags.html`、`nav=/table-flags` —— **只有 `file` 带 `.html`，其余都不带**。

### 2.2 ⚠️ 图片列表项的格式（最容易出事）`[坑 #20、§10.18]`

**列表里的图片项有两种格式，数据必须与后台表单写法一致：**

| 后台写法 | 语义 | 数据形状 |
|---|---|---|
| `field: { ... }` | **单值** | `["/assets/media/a.webp", "/assets/media/b.webp"]` |
| `fields: [ {...}, {...} ]` | **一条记录** | `[{"image": "/assets/media/a.webp", "imageAlt": "..."}]` |

**两者对不上时后台会崩**，报错 `TypeError: this.getObjectValue(...).set is not a function`，
典型现象：**一上传/选中图片就崩** + 这些条目的**标题是空白的**。**构建端不报错、PyYAML 也通过——最隐蔽。**

📌 **判据**：凡改 `config.yml` 里**已有数据**的列表字段，**必须同时确认内容 JSON 里该项是字符串还是对象**。
**只改 config 不改数据 = 后台必崩。**
📌 **升级数据时只写后台真正配置了的子字段**（多写会被 Decap 保存时丢掉）。
📌 **必须与构建兼容一起做**——`build.mjs` 的 `imgSrc(im)` 两种格式都认；只升数据不改构建，图片会渲染成 `[object Object]`。
📌 已确认**只有 3 处**是 `fields:` 对象型：`home.hero.images`、`home.intro.images`、`product-details/*` 的 `products[].images`。其余列表在 config 里配的都是 `field:`（单值），本来就一致。

### 2.3 各页面 JSON 要点

| 文件 | layout | 要点 |
|---|---|---|
| `settings.json` | — | `nav[]`（菜单，`children[]` 子菜单）、`contactButton`、`catalogButton{text,file}`、`footer{sections,phones,emails,logo,icons[],copyright}`、**`benefits{enabled,title,items[{icon,label}]}`**（优势条，**6 页共用这一份**） |
| `home.json` | `home` | `hero{title,title2,titleSize,title2Size,sepColor,text,image,images[],interval,mode,features[2]}`、`intro{title,text,images[3]}`（**顺序敏感**：缝纫车间→喷印全景→印刷机）、`categories{items[4]}`、`clients{enabled,bg,eyebrow,title,subtitle,speed,row1[],row2[]}`、`announce{}`、`supplement[]` |
| `about.json` | `home` | `hero{}` + **`blocks[]`**（模块列表，可拖排序/增删）。当前顺序：`textImg` → `marquee` → `timeline` → `clients` → `faq`。**每个块都有 `bg`**（背景色） |
| `products/*.json` | 见右 | 4 个专用类：`feather`(羽毛旗) / `bannerCards`(横幅) / `flags`(国旗) / `pole`(旗杆展架) |
| `pages/*.json` | 可选 7 种 | 新增类目页（`simple` 通用网格 / `flex` 通用图文 等） |
| `product-details/*.json` | `detail` | 产品详情页（多图 + specs + prices + serviceCards + **`textImg[]` 图文区（列表，可加多套）**） |
| `specgrid/*.json` | `specGrid` | 属性网格类目页 |

**⚠️ 产品卡的"说明模块"统一写法**（2026-09-08 起）：**品名（加粗居中）→ 属性表 `specs[{label,value}]`（可自由增删）→ 宣传语 `subtitle`**。

> 🔴 **样式铁律**：**detail 模板**的 `.pd-spec` 规格表与 `.pd-price` 价格表 **必须保持原灰线框样式**（左栏 `#f5f7fb`、1px `#e2e6ee` 线框）——**新建详情页也一律保持原样**。
> 新样式（雾蓝/米白双色块、3px 白缝）**只用于** `.f-spec` / `.p-spec` / `.sg-spec`。

> 🔴 **详情页不加「优势条」** —— 用户明确说过「car-flags 和 table-flags 不需要」。**以后新增 detail 页不要顺手加。**

**「图文区」`textImg` 是列表**（2026-09-20 起，可加多套）：每套 `{show, direction, title, align, text, images[]}`。
- `direction`（文字/图片的位置）：`textTop`(默认，= 改版前的样子) / `textBottom` / `textLeft` / `textRight`，由后台下拉选择。
- **HTML 永远"先文字、后图片"**，四种位置靠 CSS `order` 换位（同 About 图文组合）；**`h2` 在行外面**。
- ⚠️ **`direction` 走白名单校验**，别把内容里的值直接拼进 class 名。
- ⚠️ **「左右两栏」必须文字和图片都在**才成立；缺一边 build 会**自动退回 `textTop`**（否则出现"文字只占半栏、右边空一大块"）。
- ⚠️ 手机上（≤760px）一律单列：左右两种退回"文在上"，**上下两种保持用户选的方向**。
- ⚠️ CSS 铁律：**默认的 `textTop` 故意一条规则都不写**（保持普通块级流）。给它套 flex+gap 会踩两个坑：
  ① `align-items:stretch` 遇 `max-width:760px` 时按 flex-start 落位 →「居中窄块」贴左；
  ② "只有文字没图片"时 gap 不生效 → **整页矮 24px**。
  另外 **flexbox 里 auto 外边距优先级高于 `stretch`** → 竖排模式下 `.ti-text` 必须整个 `margin:0`（只清上下不够，否则长段落被压成内容宽的一小条）。
- 📌 **通用教训：「多一种新能力」≠「默认那条也要走新代码路径」——默认路径改动越少越安全。** [§10.35]

**About 的 `blocks[]` 块类型**：`text` / `image` / `textImg`（图文组合，含 `direction`/`ratio`/`imgAlign`/`images[]`/`carousel{}`）/ `clients` / `faq` / `timeline`（年份大事记）/ `marquee`（无缝滚动横幅）。
> 📌 `carousel` 轮播功能**保留可用**，但**About 页现在没在用**（`enabled:false`）——已被滚动横幅取代。
> ⚠️ `carousel` **必须置于 `textImg` 的 `fields` 顶层**，不能塞进 `images` 子字段（坑 #16）。
> ⚠️ **轮播 ≥2 张才动**；只有 1 张时静止显示、不生成圆点/箭头——**这不是 bug**。
> ⚠️ **`marquee`**：`duration` = **滚动一圈的秒数**（默认 45，越大越慢）；命名刻意不用 `interval`（语义不同）。
> ⚠️ **`marquee` 的裁切/圆角必须落在 `.about-strip-clip` 上，不能加在 `.container` 上**（`.container` 有 `padding:0 24px`，`overflow:hidden` 会在 padding box 裁切 → 横幅宽出 48px 对不齐）。

### 2.4 博客 `content/blog/*.json` `[§2.5]`

- 字段：`slug` / `title` / `date` / `coverImage` / `summary` / `blocks[{type:p|h2|image}]` / `pinned` / `draft`
- **排序**：`pinned` 置顶优先（多个置顶之间按 `date` 倒序），其余按 `date` 倒序
- 列表页 `/blog`（每页 20 篇，`/blog-2`… 分页）；文章页 `/blog/<slug>`
- ⚠️ **发布后勿改 `slug`**（= 旧链接失效）
- ⚠️ **`.blog-content` 不要再加 `max-width`**：封面图 `.blog-cover` **不在该容器内**（渲染在它前面、同级），加限宽会让正文/插图比封面窄、右缘对不齐
- **封面只管封面**：`blogPostBody()` 不再输出 `.blog-cover`（正文要图请在正文加 `image` 插图块）；封面仍用于**列表页卡片、侧栏 56×56、og:image、Schema**
- 📌 **后台 hint 的尺寸规格**：封面 **1600×900、200KB 内**，**别用超 2:1 扁图**（手机列表裁约 30%）、**别用 4:3**（电脑列表裁左右约 29%）；正文插图 **1200~1600px、200KB 内、原比例不裁**
- 📌 **博客列表页的 title/description 硬编码在 `build.mjs` 里**（没有对应的 content 文件）

### 2.5 补充模块 / 公告条 `[§2.8、§2.9]`

- **补充模块 `supplement[]`**：每页底部可加多个图文区，每项 `{show, title, text, image}`；`show:false` = 隐藏但内容保留。
- **公告条 `announce{}`**：页面**内部**的滚动公告（**只在首页 / 关于我们**各一条，各自独立配置）。
  `mode`：`inout`（滚进→停→滚出）/ `slide`（重叠无缝，**需 ≥2 条**，只有 1 条会自动回退 inout）。
  ⚠️ **`pause`（停留秒数）应 > `scroll`（滚动时长）**，否则消息来不及完整显示。

### 2.6 优势条（Why Source from Wolflag?）`[§10.29]`

- **数据在 `settings.json` → `benefits`**（`enabled` / `title` / `items[{icon,label}]`），后台在 **「站点设置 → 优势条」**。
- **6 个页面共用这一份**（羽毛旗 / 国旗 / 展架 / 旗杆展架 / 横幅 / Full Products）——改一次全站生效。
- 🔴 **铁律：需要"悬停变色"的图标**必须是**内联 SVG**——`<img>` 引的 SVG 是独立文档，**CSS 管不到它的 fill**。`inlineSvg()` 会把 `#000`/`#000000` 转成 `currentColor`。
- 只接在 6 个 layout 函数上（`simpleBody` 也接，它是未知 layout 的兜底）。

### 2.7 首页客户 logo 跑马灯 `[§10.23]`

- `home.json → clients`：**row1 上排向左、row2 下排向右，两个列表完全独立**；每项必须是 `{image, imageAlt}` **对象**。
- **无缝原理**：同一排输出 2 份 + `translateX(-50%)`。
- ⚠️ **间距必须用 `margin-right`（56px，手机 40），不能用 flex `gap`** —— 否则循环拼接处会多出一份间距、看得出接缝。
- ⚠️ **`speed` 语义 = 每秒像素（默认 55），不是"一圈几秒"**；两排线速度恒等（下排不单独设速）。
- ⚠️ **悬停暂停只写 `.hp-cl-row:hover`，绝不写成通配** —— About 页的滚动横幅（`.about-strip-track`）**明确不能暂停**。
- ⚠️ **手机档必须与桌面同比例**（48:34 ≈ 150:106 ≈ 56:40）。
- **logo 必须透明底**（白底图在 `#f9f9f9` 上会显成白方块）；"某个 logo 看着偏小/偏大"是**图片自带留白**，裁图别改 CSS。

---

## 3. 构建引擎 `scripts/build.mjs` `[§3]`

1. **读内容**：`settings` / `home` / `about` + 自动扫描 `PAGE_DIRS = ['products','pages','product-details','specgrid']`
2. **注册页**：固定 `index.html` + `about-us.html`；其余每个 JSON 按 `page` 声明生成条目
3. **渲染**：按 `page.layout` 分派 → `home` / `about` / `feather` / `bannerCards` / `flags` / `pole` / `detail` / `flex` / `specGrid` / `simple`(默认) / `notFound` / `blog`
   ⚠️ **`content/product-details/` 下的文件即使缺 `layout` 也按 `detail` 渲染**（兜底，坑 #32）
4. **`SITE` 常量**（当前 `https://www.wolflag.com`）影响 sitemap / OG —— **改域名要同步改它**
5. **产物**：清理旧 html/assets/admin/sitemap/robots → 写 html → 拷贝 `src/`、`media/`、`admin/` → 生成 `sitemap.xml` + `robots.txt`
6. **页脚策略**：**全站统一完整页脚**（`footerMode: 'full'`）

### 3.1 ⚠️ 渲染长文字有**四套**函数，用错就不加粗/不换行 `[坑 #33]`

| 函数 | `**加粗**` | 换行 | 该用在哪 |
|---|---|---|---|
| `esc(s)` | ❌ | ❌ | **只适合单行的短字段**（品名、尺寸、材质、alt…） |
| `bold(s)` | ✅ | 靠 CSS `white-space:pre-line` | 补充模块、公告、subtitle、`sections[].text`、`products[].desc` |
| `aboutParas(s)` | ✅ | 每个回车都成一段 | About 页的文字模块 |
| `faqAnswer(s)` | ✅ | 空行→分段、单回车→`<br>` | FAQ 答案、**detail 图文区文字 `textImg.text`** |

**支持 `**加粗**` 的字段清单**：关于我们正文、博客正文、补充模块、产品宣传语、时间轴、首页 Clients 副标题、FAQ 答案、detail 图文区文字。

> 📌 **最强判据**：**看 CSS 里有没有 `.xxx strong` 的选择器** —— 有样式却没产出 `<strong>`，**基本可直接判定是 bug 而不是设计**。
> ⚠️ **顺序**：`faqAnswer()` 必须**先 `bold()` 再 `.replace(/\n/g,'<br>')`**（反了会把 `<br>` 也转义）。
> ⚠️ 全站有 `* { margin:0; padding:0 }` reset → **凡是把一段文字按空行渲染成多个 `<p>` 的区块，都必须自己补 `p + p` 的段距**（坑 #25）。已有：`.faq-a`(10px)、`.about-text`、`.about-it-text`、`.about-body .about-copy`、`.pd-textimg .ti-text`(12px)。

### 3.2 图片尺寸**必须自动读取，不能写死** `[§10.12]`

- `build.mjs` 有 `readImageSize()` / `parseImageSize()` / `dimAttrs(urlPath, scale)`（读不到返回空串）；全站写死尺寸的 `<img>` 已改用它。
- ✅ **保留 2 处固定 UI 尺寸不动**：导航 logo `36×36`、客户 logo `128×86`。
- 同理，`og:image:width/height` 也**自动读取**（读不到就不输出这两行，宁缺勿错）。
- 📌 **判据**：图片变形/旋转 → **先查 `width`/`height` 与真实尺寸是否相符**；「只有部分设备出问题」多指向**加载时序**（慢网才看得见），**不要因为电脑正常就认为没问题**。

---

## 4. 设计系统（**改动以实测为准**）

> 📌 **完整版 §4 是完整的参数表**（每个区块的尺寸/颜色/字号/断点都在那）。这里只列**改样式时最容易踩的**。

| 项 | 值 |
|---|---|
| 品牌色 | `#4c6aff`（hover `#364cd9`）；正文 `#272e47`；页脚 `#352a2a`；hero 米黄 `#faf7f5`；FAQ 区块底 `#F8F8F8` |
| **悬停红** | `#a33335`（优势条 / 服务卡 / FAQ）；**浅粉底** `#faf3f3`（= FAQ 悬停） |
| 导航 | 高 52px、gap 24px、`white-space:nowrap`；汉堡断点 **≤1200px**；悬停/选中 = 浅沙 `#f5f0e8` 圆角胶囊 |
| **手机端菜单**（`≤1200px`） | 主项行高 **53px**、子项 46px、每行 1px 分隔线（主项 `#ececec`/子项 `#f4f4f4`，`last-child` 去线）；**`.nav-menu a` 必须 `display:block`**（改回 inline → 垂直 padding 不生效 → **相邻项点击框重叠**）；容器 `align-items:stretch`（**整行可点**，改回 `flex-start` 会让行右侧点不到）；`max-height:calc(100vh - 52px)` + `overflow-y:auto`（**改行高或加菜单项后必须重测**） |
| 汉堡按钮 | 44×44、`border:1.5px solid var(--navy)`、圆角 8px；图标用 CSS `linear-gradient` 画（`font-size:0` 隐藏「☰」字符，无障碍名靠 `aria-label="Toggle menu"`）；**首次访问轻跳 3 下**（`.wl-nudge`，`localStorage` 只记一次，`prefers-reduced-motion` 下自动关）——⚠️ **别改成无限循环**（WCAG 2.2.2 + 抢转化按钮注意力） |
| **首页首屏 Hero** | `.home-hero` 上内边距 **桌面 106px / ≤900px 手机 76px**（⚠️ 压小会让窄屏 H1 撞上右上角金色按钮——按钮是 absolute `top:16px` + 高 43px）；`.hero-image` margin-top **54px**；H1 拆 `hero-line1`(36px) / `hero-line2`(26px)、居中 |
| ⚠️ Hero 的两个"别改回去" | ① **`.hero-part{white-space:nowrap}` 已废弃，不要再加回来**（曾在 iPhone 上把整页撑破，坑 #23）——现改为**空格只留在分隔符之后** ② **第二行的分隔符是小圆点 `•`（不是竖线）**，`.hero-sep{display:inline;font-size:.8em;margin-left:.34em}`，**不要改回 border 画法**；色 `#a89a99` |
| ⚠️ Hero 字号 | 后台字段 `titleSize`(36) / `title2Size`(26) **只注入 CSS 变量**（`--hero-l1/--hero-l2/--hero-sep`），**不写死 `font-size`**；安全范围：第一行 **32–42**（超 43 折行）、第二行 **22–28**（超 29 折行） |
| **优势条** | `#f9f9f9` 通栏；每栏 `flex:1 1 0%` + **`min-width:0`** + `border-right:1px solid #d3d3d3`（**这条就是那条"长浅色竖线"**，靠"栏被拉成等高"实现）；图标 75×75；悬停 = 图标与文字 `#a33335` + 图标 `translateY(-6px)`（热区 = 整栏）；`≤640px` 改两栏、末项跨列居中 |
| **car-flags 服务小卡** | 常态：卡片白 / **图标 `#3d3d3d`** / 标题 `#272e47`；悬停：卡片底 `#faf3f3`、图标与标题 `#a33335`、图标 `translateY(-6px)` |
| **详情页缩略图** | 未选中 `border:2px solid #e5e7eb`；**选中 `.on` → `#d1999a`** |
| **FAQ**（1:1 复刻参考站） | 外框 `1px solid #E5E5E5`、radius 4px、白底；问题 `18px/600/#1F2A30`、`padding:15px 20px`；悬停/展开 = `#FAF3F3` 底 + `#A33335` 字；箭头是 `::after` **border 画法的 V 形**（**不是 ▼ 字符**，`.chev` 是空 span）；答案 `#000`、行高 29.75px、下内边距 36px |
| 🔴 FAQ 的两处**有意异于参考站、别改回** | ① **与上面区块同宽、左右对齐**（参考站是窄的）② **答案区必须是白色**——它**必须比 FAQ 区块底色 `#F8F8F8` 更浅**，所以只能是白；**不能**写 `.faq-item:hover{background:…}` 这类整条变色 |
| **首页大标题字体** | Catamaran；国旗卡题 Antic Slab；Bona Nova；配件题 Rufina；Acme（marquee + FAQ 题） |
| 字号安全（通用） | ⚠️ **凡是"居中排列的 flex 列"里放长文字，都要同时写 `max-width:100%` + `overflow-wrap:break-word`**（只写后者没用，坑 #29） |
| About 客户 logo 断点 | `@media (max-width:1120px)` 时 logo 由 4 列改 **3 列**（≥1121px 仍 4 列；≤1000px 走单栏堆叠）。**别删这条**，它修的是 1001–1120px 的横向溢出死区（坑 #27） |

📌 **「颜色减淡一半」的算法**：`round(fg*a + bg*(1-a))`，`a=0.5`。**必须先实测它背后的真实底色**再算。

---

## 5. 网址与页面的铁律

### 5.1 全站网址**无 `.html` 后缀** `[§10.7]`

| | |
|---|---|
| ✅ 现在的网址 | `https://www.wolflag.com/national-flag` |
| ❌ 旧网址（会 308 跳转） | `https://www.wolflag.com/national-flag.html` |

- **为什么**：Cloudflare 对**所有** `/x.html` 返回 **308 跳转**到无后缀版；Google 抓到 `.html` 时只见"跳转页"，判定**不予收录** —— 这是此前"搜不到产品页"的**头号技术根因**。
- 🔴 **无后缀依赖 Cloudflare 的 "Pretty URLs"（默认开启）。请勿在 Cloudflare 后台关闭它，否则全站会 404。**
- ⚠️ **`page.file` 必须保留 `.html`**（磁盘文件名）；只去掉 `page.nav` 与所有链接类字段的后缀。**改 `page.file` 会导致构建出错误文件名。**
- 📌 **事实边界**：**加了 `.html` 也能打开**（只是多绕一跳、且 Google 会把带 `.html` 的当"跳转页"）。
  **「会不会打不开」与「该不该加」是两个问题，回答时要分开说。**
- 📌 后台建页面时：**页面文件名 = `custom-tents.html`（保留）**、**导航地址 = `/custom-tents`（去掉）**。
- 🔧 本地自检工具：`python scripts/_preview_server.py 8123`（**模拟 Cloudflare 的 clean URL 行为**）。
  ⚠️ **直接用 `python -m http.server` 测不可靠**——它不模拟 clean URL，会把 `/blog` 当成目录列表返回。

### 5.2 新增一个产品页：**「卡片」≠「页面」** `[坑 #31]`

> 🔴 **一句话：卡片和菜单都只是"指路牌"，页面本身必须单独建。只建卡片不建页面，点开就是 404。**

加一款新产品要建**三样**、在**三个栏目**：

| | 是什么 | 后台在哪 |
|---|---|---|
| ① **页面本身** | 点开后真正的网页（**一个独立文件**） | 「产品详情页」→ `content/product-details/*.json` |
| ② **卡片** | Full Products 上那张图 + 名字 | 「新增类目页」→ `products.json` 的 `products[]`（有 `link` 字段） |
| ③ **菜单入口** | 顶部导航 / 子菜单一条 | 「站点设置」→ 导航菜单 → `nav[].children` |

> ⚠️ 用户报「点了是 404 / 菜单里有但打不开」时，**第一步永远是核对 `content/` 下到底有没有那个文件**，
> **而不是**去查链接格式、`.html` 后缀、Cloudflare 设置。

### 5.3 两个"后台入口"的分工 `[§2.6]`

- **「新增类目页」**（`content/pages`）→ **类目/列表型**页面：一页放一类产品，每个产品配 1 张图，模板可 7 选。
- **「产品详情页」**（`content/product-details`）→ **单款产品详情**：多图 + 自由属性 `specs` + 阶梯价 `prices` + 服务卡 + 图文区。
- ⚠️ **陷阱**：「新增类目页」的模板下拉里也有 `detail`，但**它的表单字段是通用版**（没有多图/价格表输入框）——要详情功能**必须去「产品详情页」栏目建**。
- 📌 **`prices` 留空 = 不公开报价**（前台不显示价格表）。

### 5.4 新增类目页的三步 `[§5]`

1. 后台「新增类目页」→ 新建：填 `文件标识`（英文小写）/ `页面文件名`（带 .html）/ `导航地址`（无后缀）/ 模板
2. 「站点设置 → 导航菜单」加一条（名称 + 链接）
3. 1–3 分钟后线上出现，自动进 sitemap

> ⚠️ **新页面不出现？先查三点**：① 文件是 **`.json`** 不是 `.md`；② slug/文件名/网址**英文小写无空格**；③ 没重新构建（后台保存会自动触发）。
> 📌 现成范例：`content/pages/products.json`（Full Products，`simple` 模板）。

---

## 6. ⚠️ 坑清单（血泪教训，违反必翻车）

> 📌 完整版 §6 有全部 35 条的详细来历。这里保留**每条的判据**（"下次遇到该怎么判断"）。

### 6.1 数据与构建

| # | 坑 | 判据 |
|---|---|---|
| 9 | JSON 不支持注释；含双引号要 `\"` 转义 | 保存前用 `json.load()` 验 |
| 12 | 后台可能把类目页存成 `.md`，构建**只认 `.json`** → **静默不生成页面** | "存了不显示"先看文件扩展名与 slug |
| 5 | `static/` 是产物，手改无效且会被覆盖 | 改完内容**必须**重建 |
| 28 | 用脚本往模板字符串插 `${...}` 时，锚点别把**结尾的反引号**框进去（插到模板外 = 语法合法的死代码，构建不报错） | 插完**回读那几行**，并核对产物 HTML 里有没有出现该模块 |

### 6.2 `admin/config.yml`（改错整站后台瘫痪）

| # | 坑 | 判据 |
|---|---|---|
| 10b | 内联行（`{...}`）分隔符**必须半角逗号 `,`**；全角 `，` 会被当标量内容 → **后台全线崩溃** | 改完必跑 **PyYAML `safe_load`** + 开 `/admin/` 看有没有 `Error loading the CMS configuration` |
| 26 | `hint`/`label` 的**双引号字符串内部**绝不能出现半角 `"` → 会提前结束字符串、**整个 `/admin/` 打不开** | 要引用词语请用**中文引号「」**；**别用 `unicode_escape` 之类的"转义魔法"批量改**（会写出控制字符，越修越坏） |
| 16 | **`files:` 型字段缩进 10 空格、`folder:` 型 6 空格**——直接复制会**静默嵌进上一个字段的 list 里**，后台表现为"这个字段看不到"，但构建不报错、PyYAML 也通过（**最隐蔽**） | 加完字段用脚本打印该 collection 的**顶层字段名**，确认没被嵌套 |
| 20 | 列表字段从「单值」改成「一条记录」时，**旧数据必须同步升级** → 否则后台一编辑就崩，构建端**不报错** | 见 §2.2 |
| — | 🔴 **后台 `label` / `hint` 里绝不要出现用户看不见的内部代号**（`value`、字段名、CSS 类名） | 要指代选项就用**界面上显示的那个 label 原文** |
| — | 📌 **任何"全站网址/命名/格式"改动落地后**，把 `admin/config.yml` 里的 `hint:` 与 `label:` **逐行扫一遍旧示例值** | 用户是照后台提示填的，**提示错了看说明书也救不了** |

> **改完 `config.yml` 三步自检**：① PyYAML `safe_load` 通过；② 打印顶层字段名确认新字段在顶层、且没嵌进 list 的 `fields`；③ Playwright 打开 `/admin/` 确认无配置报错。
> ```bash
> python -X utf8 -c "import yaml; c=[x for x in yaml.safe_load(open('admin/config.yml',encoding='utf-8'))['collections'] if x.get('name')=='<栏目名>'][0]; fs=c.get('fields') or c['files'][0]['fields']; print([f.get('name') for f in fs])"
> ```

### 6.3 布局与 CSS

| # | 坑 | 判据 |
|---|---|---|
| 23 | 🔴 **`white-space:nowrap` 会把网格/弹性布局的「整条轨道」撑宽**（`1fr` 的最小值 = 内容的**最小宽度**）→ **兄弟元素甚至整页被推宽** | **"某个区块的兄弟、甚至整页被推宽"时，先查该网格/弹性容器里有没有 `nowrap` 或超长不可断行内容**；**网格列一律写 `minmax(0,1fr)`，不要写裸 `1fr`**；**能不 nowrap 就不 nowrap**——优先把断行点移到别处 |
| 24 | 📱 **只在 iPhone 出问题、安卓正常 → 先怀疑 iOS 的「文字自动放大」(font boosting)** | **CSS 逻辑错了通常两个平台一起错**；只在单一平台出问题，优先怀疑该平台特有的字体处理。修法：`html { -webkit-text-size-adjust:100%; text-size-adjust:100% }` |
| 27 | 📐 **断点之间的「死区」**：几个固定宽度拼一起，屏幕放不下却还没到换行断点 → **横向溢出** | 列出所有写死的宽度**求和**得"最小可用宽度"，`grep` 媒体查询确认断点覆盖它；**`1fr` 最小值 = 内容最小宽度，固定宽度子内容会把列撑宽而不是压窄**；**测宽度要扫连续区间**（只测 1366/1024/390 会藏住死区） |
| 29 | `align-items:center` 的 flex 列里，子元素按 **max-content** 定宽 —— **只写 `overflow-wrap` 挡不住撑破** | 居中排列的 flex 列里放长文字 → 同时写 **`max-width:100%` + `overflow-wrap:break-word`** |
| 21 | `prefers-reduced-motion` 里只写基础选择器 = **管不住权重更高的那条** | reduced-motion 块里要把**每个覆盖过的选择器都列全**；验证要**逐排**读 `animationName` |
| 4 | 全局 `img{max-width:100%}` 会把负边距全宽图钳小（症状：图片左右有白边） | 该图加 `max-width:none + display:block + flex-shrink:0` |
| 15 | 菜单名改长后 flex 空间不足 → 多词被断到下一行叠起来 | `.nav-menu a` 加 `white-space:nowrap`；改菜单文字后**在 1280 和偏窄宽度各截图**确认不折行、不挤掉按钮 |
| — | 垂直 padding **对行内元素不生效** | 要"整行可点/加行高"必须 `display:block` |

### 6.4 图片（**先量像素，别只看盒子**）

| # | 坑 | 判据 |
|---|---|---|
| 18 | 图片**自带透明边**，肉眼像"白边" —— `getBoundingClientRect()` 和 `naturalWidth` **都看不出**，只有实际绘制像素短一截 | **排查任何"白边/留白"问题，先量像素**（`PIL` 看 `im.mode` 是否 RGBA、alpha 的 bbox） |
| 22 | logo 图**白底**放在彩色底上会显示成白方块 | **用户换任何 logo/图，先确认它是不是透明底**（`PIL` 看 `im.mode`：`RGB` 一定是"有底"的） |
| 30 | 🔍 **量「有没有溢出」只看元素盒子会漏掉「文字溢出」** | **溢出判据三条一起量**：① `documentElement.scrollWidth > innerWidth+1`（整页）② 每个元素 `right > innerWidth`（**盒子**伸出）③ 每个元素 `scrollWidth > clientWidth+1` 且 `overflow:visible`（**文字**顶出）。**②③ 是坑 #18 的正反两面** |
| — | 换图后"变形/旋转" | 先查 `width`/`height` 声明是否与真实尺寸匹配（§3.2） |
| — | **扩展名必须与实际格式一致** | 曾发现 9 个 `.jpg` 实为 WebP（Cloudflare 按扩展名发 `Content-Type: image/jpeg`）；**改文件名/扩展名后必须同步 JSON 引用** |
| — | 🏷️ **后台媒体中心不能重命名图片**（只有 上传/复制路径/下载/删除）。**这不是"少个按钮"** —— 文件名被硬引用在 `content/**` 里，**一改名引用就指向不存在的文件 → 直接裂图** | 正确顺序：**改文件名 → 同步所有引用（含 `scripts/extract.py` 的 md5→语义名映射表）→ 重建 → 逐页验证零裂图**。**上传前就命名正确**最省事：英文小写连字符 + 说清是什么 |
| — | 🔴 **批量重命名/替换：永远用「完整路径 / 完整 token」匹配，绝不先剥前缀再匹配名字** | 实况：自校验里把 `/assets/media/` 剥掉后再替换，于是 **`flag-01.webp` 把 `car-flag-01.webp` 误伤成 `car-custom-china-national-flag.webp`**（**子串**）。修法：`re.sub(r'/assets/media/([^\s"\')]+)', ...)` 整段替换 + **幂等校验**（再跑一遍必须无变化）+ 替换后 JSON 仍可解析 |
| — | 🔎 **全局校验报"引用缺失"时，先看上下文再改代码** | 实况：报 `build.mjs → x.webp` 缺失 2 处，一查是**注释里的示例文本**，不是真引用 |
| — | 🖼️ **"图片没写 alt"要先分类，**绝不能全填** | **装饰性小图标**（公告条/服务卡/页脚社交/优势条）**按无障碍规范就该保持 `alt=""`**，填了对读屏用户反而是噪音 —— 而且**必须主动告诉用户"这是留空、不是没干完"**。只有**真实内容图**（产品图/横幅/工厂图/场景图）才逐张看图后起草，列表给用户批准再填；**只填当前为空的，已有的一个字不动**。📌 扫描时键名要同时覆盖 `image` 与 `bannerImage` [§10.37] |
| — | ⭐ **"证明只改了一个字段"的校验：改前与改后**两边都要**归一化，不能只归一化一边** | 连踩两版：① 只 `strip(改后)` 去比没处理的改前 → 连带抹掉文件里**本来就有**的 alt → 假警；② 回滚若用"删键"而非"恢复原值"，遇到 `"imageAlt": ""`（空串、键存在）又假警。✅ 正确：`strip_alts(改前) == strip_alts(改后)` [§10.37] |
| — | 📋 **给非程序员做审阅材料：让他"能在上面写字 + 一键复制"** | 实况：`scripts/_alt_report.py` 生成的「改前 vs 改后」对比 HTML（图片预览 + 可编辑意见栏 + 一键复制意见），比"表格截图"有用得多 [§10.37] |

### 6.5 内容 / 与用户协作

| # | 坑 | 判据 |
|---|---|---|
| 3 | **产品文案保留原站拼写/大小写**（如 `comstom size`、`silksreen`）——用户要的是**复刻**，不是修正 | 新增段落不必迁就旧拼写，但**不要"顺手修正"已有字段** |
| 34 | ⌨️ **用户在后台用「空格 / 空行」表达排版意图 —— 在 HTML 里一律无效**（连续空白折叠、行首空格丢弃） | **内容里出现"一堆空格/空行"时，别当脏数据清掉** —— 那是用户在表达"我想要这里空开/缩进/对齐"。正确回应：① 告诉他 HTML 会折叠空格 ② 问清要什么效果 ③ **在程序里给一个真正的控件（后台字段）** |
| 32/33 | 🧩 **"构建脚本有兜底默认值"的字段，要确认后台表单里到底能不能写到它** —— 默认值是给"人忘了写"兜底的，但**如果后台根本写不出来，这个字段在 CMS 流程里就等于不存在** | **看到"CSS 有样式、代码没产出"或"代码支持、后台没字段"的错配，基本可直接判定是 bug，不是设计**；**配了字段 ≠ 字段生效**——字段的"层级"必须与 `build.mjs` 读取的层级一致 |
| 35 | 🖼️ **"一个 alt 管多张图"** = 后台表单漏了字段（不是设计） | **判断"某处缺字段"是不是 bug，不要去猜设计意图，去比对「同一模式在站内其他地方怎么写的」**——站内不一致就是 bug。⚠️ **改 `src` 的地方要顺手想 `alt` 要不要一起改**；⚠️ 回答用户"这样好吗？"要**先给事实边界**（不违规 ≠ 没问题），别把"影响不大"说成"没问题" |
| 35+ | 🔁 **加了字段之后，要回头看一眼"那个地方实际会不会用到它"** | **同一个改法不能无脑复制到结构不同的地方**。实况：产品图库（固定 3 张图）留"整组兜底"的 alt 框值得；**图文区（通常只放 1 张图）不值得**——用户看到两个 alt 框会困惑。**已按用户要求把图文区那层删掉**，如今：**产品图库 = 2 个框**（每图自己的 + 产品级整组兜底，后者用户已在用）；**图文区 = 1 个框**（只有每图自己的）。⚠️ `build.mjs` 仍保留读 `ti.imageAlt` 仅为历史数据兜底，正常链路是「该图自己的 alt → 图文区标题 → 页面主标题」 |

### 6.6 环境与工具

| # | 坑 |
|---|---|
| 10 | **国内网络**：GitHub 直连常断，走代理 `git config http.proxy http://127.0.0.1:7890`（**实测可用端口 = 7890**）；pip 用清华源；Playwright 截图用**系统 Edge**（`channel="msedge"`）无须下载浏览器；Google Fonts 国内可能加载慢（有回退字体兜底） |
| 19 | **截页面局部做像素检查**：① 公告条高度是 JS 算的，而国内 Google Fonts 常加载失败 → `fonts.ready` 晚触发 → **截图瞬间页面重排**，量的和拍的对不上；② 元素截图/clip 截图坐标口径易混。**正确做法**：注入 `.announce{display:none}` 排除干扰 + **截图前后各量一次坐标、必须一致** |
| 11 | **不要过度自信"视觉修正"**：模型读图通道不总是可用；**用户标注（红圈文字）是最高优先级需求** |
| — | 🔴 **"全站/整体都报同一个错"时，先怀疑工具本身**，再相信结论（曾被 `<img src="">` 空占位图、`loading="lazy"` 未进视口、端口不一致各坑一次） |
| — | 📌 **报"老问题"之前一定要先证明它不是自己这两次弄的**（`git stash` 还原到很早以前复测），否则会误导用户 |
| — | 📌 核对"页面文字有没有变"**只比 `<body>`**，把 `<title>` 算进去会全站误报 |
| — | 📌 **Windows 下 `git show HEAD:<路径>` 必须把反斜杠换成正斜杠** |
| — | 📌 删媒体库文件**三道关**：引用数 0（含 `static/` 产物）+ 被 git 跟踪 + **用户明确批准** |

### 6.7 可复用的技法

- **本地"真后台"自检法**（验证 CMS 表单改动，**不碰线上后台**）：临时目录装 `decap-server`；拷 `admin/index.html` + `config.yml` 到副本并在**副本**最前面加 `local_backend: true`；起 `decap-server`（cwd = 仓库根）+ 本地 http server；Playwright 打开副本页 → Login（本地后端不需 GitHub）。
  ⚠️ 要点：A/B 对照用 `git show HEAD:content/<文件>.json`；列表条目用 `div[class*="listControlItem"]` 定位；**不要点 Publish**（本地后端会真写文件）；**用完删掉、绝不提交**。
- **给用户选视觉方案**：用 `page.add_style_tag()` 把两版样式注入同一页面、各截一张图让他挑，**比让他对着文字描述选**可靠得多。
- **量墨色/对齐**：不能只看元素盒子——「底边对齐」要**扫实际墨迹**（盒子齐平 ≠ 视觉齐平）；量最深墨色用 `deviceScaleFactor:4` 取最深的 0.5% 像素，**别拿 `getComputedStyle().color` 当结论**。
- **抄参考站**：必须**渲染后取计算样式**（`getComputedStyle`，属性用 camelCase、伪元素传 `'::after'`），**别读源码或肉眼估**。

---

## 7. 修改自检清单（每次改动后必做）

1. `node scripts/build.mjs` 构建无报错
2. 起本地预览 + Playwright 打开改动页：**无 console error、无资源 404**（监听 `requestfailed`）
   ```bash
   python scripts/_preview_server.py 8099
   ```
3. **关键坐标用探针与 §4 参数表对照**（误差 ≤10px 达标）
4. **双端多宽度实测**：
   - 宽度建议扫：`1920 / 1440 / 1366 / 1280 / 1240 / 1200 / 1024 / 900 / 768 / 430 / 390 / 375 / 320`
   - 🔴 **溢出判据三条一起量**（见坑 #30）
   - 🔴 **必须做一次"字号被放大"的压力测试**（`add_style_tag()` 把字号乘 1.5~2 再量一遍）—— **iOS 会自动放大文字而安卓不会**，不测这项"电脑好、安卓好、只有苹果坏"的 bug 会直接上线
5. **内容回路验证**：改 JSON → build → 渲染确认出现
6. **回归验证**：`git diff --stat static/` 确认"没改的地方真的没变"
7. 上线：`git add -A && git commit && git push` → CF Pages 自动部署 → 1–3 分钟访问线上复查
   🔴 **推送必须先得到用户批准**（§0.1①）
8. **若改 `admin/config.yml`**：跑 §6.2 的三步自检

---

## 8. 已知事实（环境 / 账号 / 配置）`[§8、§9]`

### 8.1 关键配置

| 项 | 值 |
|---|---|
| GitHub 仓库 | `Tony0232-HZ/wolflag-site` |
| Cloudflare Pages | 项目 `wolflag-site`，构建 `node scripts/build.mjs`，输出 `static` |
| **后台 OAuth App** | GitHub App **`wolflag admin`**（账号 `Tony0232-HZ`） |
| **Client ID** | `Ov23liV3OrfRG3tL4IlZ` |
| **Redirect URL 登记值** | `https://decap.tony222.workers.dev/callback`（**纯净**，无 `?provider=github`） |
| Cloudflare Worker | 名字 `decap`；密钥 `GITHUB_OAUTH_ID` / `GITHUB_OAUTH_SECRET`（**Secret 不写进文档**） |
| Worker 源码 | 跑的是**改版**（`handleCallback` 删掉 provider 检查 + `/auth` 跳转 302 + `redirect_uri` 纯净）——**本地克隆路径已过期，要动 Worker 先问用户当前路径** |
| DNS 托管 | **35互联**（`ns1.35.net`~`ns4.35.net`），后台 `https://www.35.com` → 域名管理 → DNS 解析 |
| GSC | 已绑定（`Domain` 类型，`wolflag.com`，DNS TXT 验证已通过） |
| **Schema 事实口径**（改动需用户同意）`[§10.11]` | 成立年份 **2003**；**两个地址都写**（工厂 Pinghu + 贸易公司 Hangzhou）；**产品价格不写**（B2B 询盘报价） |

### 8.2 后台登录排障（`/admin/` 登不进时照此走）`[§9]`

> **唯一可靠的现场证据 = 浏览器地址栏里的授权 URL**（`client_id=`、`redirect_uri=`、`state=`）。

| 打开的页面 | 含义 | 修法 |
|---|---|---|
| **沙漠 404**（"This is not the web page you are looking for"） | **client_id 无效** | 核对 Client ID（应为 `Ov23liV3OrfRG3tL4IlZ`），同步 Worker 密钥 |
| **⚠️ "Be careful! / Invalid Redirect URI"** | **回调地址不一致** | GitHub 应用页「Redirect URL」必须登记为**纯净** `https://decap.tony222.workers.dev/callback` |
| 地址栏 `state=` 每次登录都相同 | **浏览器缓存了旧跳转** | 换**无痕窗口**（Ctrl+Shift+N）重试 |

**标准修法**：
1. `https://github.com/settings/developers` → OAuth Apps → **wolflag admin**，核对 Client ID 与 Redirect URL
2. 修 Worker 密钥（本机已配 `CLOUDFLARE_API_TOKEN`）：
   ```bash
   cd "<decap-proxy 目录的当前路径>"   # ⚠️ 先向用户要当前路径
   echo '<Client ID>'     | npx wrangler secret put GITHUB_OAUTH_ID
   echo '<Client Secret>' | npx wrangler secret put GITHUB_OAUTH_SECRET
   ```
3. **无痕窗口**打开 `/admin/` 登录验证

> 📌 **教训**：改任何环节前，先用**无痕窗口**拿到**当前真实**的授权 URL，以它为准，别拿历史截图推断线上状态。
> 📌 **后台看不到新加的字段**时（多为浏览器缓存了旧 `config.yml`），让用户：① Ctrl+F5 ② **把后台标签页整个关掉再重开**（比 F5 有效）③ 无痕窗口。
> ⚠️ **用户已明确拒绝**「加 `_headers` 让 `config.yml` 不缓存」这类保险方案，**不要再提议**。
> 📌 `/admin/` 的 **favicon.ico 404 是浏览器层行为**，别误判成 `config.yml` 出错。

### 8.3 其他

- **后台登录页用 `noindex`，不要用 robots.txt 的 `Disallow`** —— Disallow 了爬虫读不到 noindex 指令，反可能仍被收录。
- **原站离线副本**：路径已过期，需要时**向用户索取**。
- **视觉基准截图**：`screenshots-original/`（原站）、`screenshots-new/`；**用户截图即"标准"**。
- **页脚社交图标**：三个（LinkedIn / Facebook / X）已换成**白色字形版**（`social-linkedin.svg` / `social-facebook.png` / `social-x.svg`）。
  ⚠️ **三个「链接地址」目前仍为空**（已实测确认）→ 点击走 `mailto:` 兜底；**用户填上主页链接后自动新窗口打开**。
  ⚠️ 换图标务必用**透明底 + 正方形**；页脚按 **20×20 硬拉伸**（无 `object-fit`），非正方形会被压扁。
- ⚠️ `media/wolflag-digital-flag-printing-machine.webp`（1024×1024 / 90KB / 当前无引用）**是用户决定保留的，不要再列入孤儿清理清单**。
- `scripts/extract.py` 含 48 张原站图的 md5→语义名映射表——**改那批图的名字要同步此表**（后台手动上传的文件不在表内，无需同步）。
- **成立年份三处不一致**（用户已知悉）：Schema `2003` ✅ / 文案 `23-year manufacturer` ✅ / **页脚版权 `© 2011` ❌**。**改动前必须问用户。**

---

## 9. SEO 现状与待办 `[§10]`

### 9.1 已完成（**不要再当待办做**）

- ✅ **GSC 绑定**（Domain 类型）+ sitemap 提交；Google 已发现 12 个页面
- ✅ **全站网址去 `.html` 后缀**（头号收录障碍，见 §5.1）
- ✅ **404 页面**（修复 Cloudflare 的"软 404"：无 `404.html` 时任意假路径都返回首页内容 + HTTP 200）
- ✅ **图片 alt 后台可填** + **产品图库/图文区支持每张图各写各的 alt**（§6.5 坑 #35）
- ✅ **图片文件名去中文**（全部改英文语义名）
- ✅ **结构化数据 Schema**（Organization / WebSite / BreadcrumbList / ItemList / FAQPage / BlogPosting）
- ✅ **og / Twitter 分享卡片**（绝对网址、按页输出、尺寸自动读取）
- ✅ **canonical + og:url**（全站补齐）
- ✅ **全站 title / description 优化**（title 50~60 字符、摘要 120~158，含采购意图词；**这些不显示在页面上，改动零版式影响**）
- ✅ **图片压缩**

> 🔴 **产品页为什么只标"产品清单"、不标"可购买的产品"** `[§10.16]`：
> Google 对"可购买的产品"标记有硬性要求——**必须同时给出价格，或用户评价/评分**。
> 本站是 **B2B 询盘、按用户决定不公开报价**，也没有评价 → **故意只标中性的 `ListItem`**。
> **只有当用户在页面上公开了价格（或起订价/价格区间）之后**才可把 `Product` + `offers` 加回来；**用户没主动提，就不要改回去**。
> 🔴 **千万不要**为了通过校验去填**假价格或假评分**——**违反 Google 政策会被真处罚**。
> 📌 结构化数据出错**不影响收录/排名/页面显示**（Google 官方口径：不扣分）。

### 9.2 待办

| 优先级 | 事项 | 备注 |
|---|---|---|
| 🔴 **P0-A** | **产品页内容太薄**（**头号问题，收益最大**） | 实测：羽毛旗 334 词、首页 281、横幅 244、国旗 199、Full Products 105。目标 **500~800 英文词/页**。**技术 SEO 已全部修完，现在的瓶颈 100% 是内容。** 优先用后台已有的 **`supplement`（补充模块）** 扩写；**写之前必须与用户确认产品事实，不要编造参数**；**须先出方案给用户批准** |
| 🔴 **P0-B** | **外链建设**（= 0，**站外工作，需用户亲自参与**） | Kompass / Europages / ThomasNet 等 B2B 目录 + LinkedIn 等社交矩阵。**AI 只能给清单 + 写文案，注册提交须用户本人操作**。⚠️ 注册后要把链接填回 `settings.json` 的 `footer.icons[].url`（**目前是空的**） |
| 🟢 P2 | 补 `about-us` 的 H1；改写首页 H1（现在没关键词） | ⚠️ **H1 是可见元素，会改变页面外观 → 须与用户确认文案 + 双端截图**（首页 H1 还驱动首屏版式） |
| 🟢 P2 | 博客只有 1 篇（且没搜索价值） | 博客是覆盖**长尾词**的主要手段；建议每月 2~4 篇，正文用内链指向产品页 |
| 🟢 P2 | 博客文章页标题偏短——建议给 blog collection 加可选 `seoTitle`/`seoDescription` | **属"新增后台字段"，须先批准**；用户尚未决定 |
| 🟢 P2 | 手机端直接在页头露出一排可横滑的主类目入口 | 属**页头结构改动**，须先出方案给用户看 |

### 9.3 已知遗留（**别擅自开工，先问**）

1. **两张第三方素材图** `[§10.10、§10.19]`：
   - `teardrop-feather-flag.webp`（羽毛旗「水滴型」产品图，画面是 **World Food Expo 展会**）——**仍是待办，需用户提供自有照片**。
   - `harvard-banner-building.webp`（Banners 产品页顶部横幅，**含哈佛校徽**）——
     🔴 **用户 2026-09-12 已明确指示「不用换、保持现状」**。**不要再当待办催**。
2. **首页轮播第 2 张**画面含 JOM 内衣广告海报 —— **用户表示"没关系"**，已知情选用。**不要再提。**
3. **`table-flags` 的 7 行规格值**是照 car-flags 惯例先填的，**待用户核对**。
4. **About 客户区在 761~800px（iPad 竖屏）**下两栏各约 294px、文字挤成窄长条——**改动前就存在**；可选后续把 `.about-it` 列排版断点从 760px 调大到约 900px。
5. **320px** 下 `.announce-item` / `.hp-cl-track` / `.intro-photos` 有溢出——历史遗留，未处理。

---

## 10. 用户与协作方式 `[§8]`

- 用户是**中文母语、非程序员**：沟通用中文、给**可点击的具体步骤**、**一切改动以用户确认的图片为准**。
- **用户标注（红圈 + 文字）是最高优先级需求。**
- 🔴 **在《后台管理操作说明书》或任何给用户的手册里承诺某个后台能力之前，必须先跑一遍产物确认它真的生效** ——
  历史上犯过**两次**（FAQ 加粗、图文区加粗：手册写了、代码没实现，用户照着用才发现）。
- **回答用户"这样好吗？"这类问题时**：① 先给**事实边界**（不违规 ≠ 没问题）② 再说真话（哪里不好、严重程度）③ **把"能不能改、怎么改、有什么代价"一起给出来**。
- **改动范围严格限定在用户要求的那件事里**：发现别的问题**先报告、不动手**；**"顺手整理"在这里是有害的**。
- **涉及视觉的选项，做出来给用户看**（截图/演示页）比让他对着文字选可靠得多。
- 📌 **用户偏好"能自己改"**：他会想改的东西默认就该做成后台字段；**拿不准就先问，别默默写死**。

---

## 11. 附录：本文件与完整版的已知冲突（**以本文件为准**）

| 完整版的位置 | 完整版的说法 | 实际情况（本文件为准） |
|---|---|---|
| §2.2 末（"优势条没有任何数据字段 / 硬编码在 build.mjs / 后台看不到"） | ❌ 过时 | **优势条数据在 `settings.json → benefits`，后台「站点设置 → 优势条」可改**（§2.1 与 §10.29 是对的，§2.2 那行没跟着更新） |
| §10.4 的"遗留小账"（`harvard-banner-building.webp` 属"换图"待办） | ❌ 过时 | **用户 2026-09-12 已明确指示"不用换、保持现状"**（§10.19 有记录） |
| §10.4 的 SEO 待办清单里，alt / Schema / canonical / og / title / 图片压缩 等条目 | ❌ 已完成 | 见 §9.1 已完成清单 |
| §4 "首页 Clients 底色 = 暖米黄 `#f1eeed`" | ⚠️ 有就地更正 | 现为 **`#f9f9f9`**（后台字段 `clients.bg`，已实测确认） |

> 📌 遇到**本文件没写、但完整版有**的内容：**完整版仍然有效**，去查它。
> 📌 遇到**两边冲突**：以上表为准；**表里没有的冲突，请实测后再下结论，并把结论补进本表。**

---

*本精炼版生成于 2026-09-19，由 `AI-GUIDE.md`（完整版）提炼。*
*完整版一字未删，**遇到任何需要细节、来历、证据的情况，请去查 `AI-GUIDE.md` 的对应章节**。*
