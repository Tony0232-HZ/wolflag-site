# WOLFLAG 网站 — AI 接手说明书（先读我！）

> 🧠 **本文件是 AI 的记忆。** 每次新对话，AI 对过去一无所知——**读完这一份，就等于把网站几个月来的演变历史、踩过的坑、做过的决定，一次性装进脑子里。**
> **🔒 因此：默认「只增加」，不轻易删改。** 详见 **§0.1 第一条铁律**（含四种可删改的例外情况）。
>
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

## 0.1 🧠 第一条铁律：本文件是 AI 的「记忆」，不是普通文档（2026-09-10 用户强调）

> ⚠️⚠️ **最高优先级，先于一切技术规则。**

### 这份文件是什么

**每次重新打开对话，AI 对以前发生过什么一无所知——没有记忆。** 而本文件，**就是这份记忆的载体**。

用户原话：

> "AI-GUIDE 很重要，因为每次重新打开 AI，AI 一点都不记得以前做过什么，**这是 AI 的记忆**。
> 删除了，等于 AI 没有记忆了。我只要 AI 读一下这个 AI-GUIDE，它就详细地知道这个网站是如何一点一滴改进演变的历史，**它更懂网站**。"

**读这份文件 = 把过去几个月踩过的坑、做过的决定、走过的弯路，一次性装进 AI 脑子里。**

### 🔒 因此：不要轻易删改记忆

**默认行为是「只增加」。** 需要修正时，**加注解，而不是覆盖**。

**只有以下四种情况**才可以删除或改写：

| # | 情况 | 说明 |
|---|---|---|
| 1 | **已失去作用** | 例：某个已废弃的功能、已删除的页面、已不存在的字段的说明 |
| 2 | **有害** | 例：会误导后来者做出错误操作的描述 |
| 3 | **已失去价值** | 例：过时的第三方信息、已被更完整章节取代的碎片 |
| 4 | **已获用户明确批准** | 用户说了"删掉/改掉这段" |

**除以上四种，一律：**

- ✅ **只增加**新内容；
- ✅ 发现旧内容**不准确** → **保留原文 + 加一条「⚠️ 更正（日期）」注解**，说明原来写的是什么、实际情况如何、为什么错；
  - 📌 **范例**：§10.6 就是正确做法——保留了当时误判的记录，另加"实测后确认该 AI 这条其实说对了"的更正说明。**这样后来者既知道结论，也知道当初为什么会错——这本身也是宝贵信息。**
- ❌ **不要**因为"看起来乱了/顺序不好/不够整洁"就重排、重写、删减；
- ❌ **不要**为了"更好看"而合并或精简章节——**冗余在这里不一定是坏事，丢失才是**。

> **反面教训（2026-09-10）**：AI 被要求"把待办清单写详细点"，写完后**顺手把 §10.9~§10.12 的章节顺序重排了**（当时顺序为 10.10→10.12→10.11→10.9）。虽然内容一字未丢，但**用户以前记住的章节号全变了**，需要重新核对"到底动了什么"。用户指出：**这超出了授权范围**。
>
> **教训**：① 改动范围严格限定在用户要求的那件事里；② 发现别的问题**先报告、不动手**；③ **"顺手整理"在这里是有害的**——因为记忆的价值在于**稳定可寻**，不在于整洁。

### 变更日志（文件末尾）的正确用法

- ✅ **只追加**新条目（"最后更新"一行持续往后接）；
- ✅ 把"今天做了什么"写清楚，**这是记忆的主线**；
- ❌ **不要**删除旧条目——**旧条目就是历史，是这份记忆的价值所在**；
- 📌 条目可以长，**不怕啰嗦**——宁可写多，不可少写。

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

## 0.7 🔒 铁律：AI 严禁自行推送，必须得到用户明确批准（2026-09-09 用户强调）

> ⚠️⚠️ 最高优先级，违反 = 严重错误。**AI 在任何情况下都不得自行执行 `git push` / 推送上线 / 部署**——即使改动已经完成、已验证、已写好文档，也**必须先得到用户明确说"可以推送 / 推上线 / push"**，得到批准后才能推送。未获批准时，只能把改动留在本地、展示给用户看。

> - 用户若只说「改 / 做 / 修 / 写文档」，并未明确说「推送 / 上线 / push」→ **不要推送**。改完把改动和效果告诉用户，并问一句「要推送上线吗？」。
> - 推送前先 `git fetch` + `git status -sb`，确认本地不落后/不冲突；若落后于 `origin/main`（通常是后台 Decap 有编辑），先 `git pull --rebase` 合并（有冲突则按用户意图解决），再确认无误后推送。
> - 2026-09-09 曾有 AI 未经许可自行 push 的行为，被用户提醒纠正。**今后一律先请示、后推送。**

---

## 0.8 🖥️📱 铁律：任何改动必须同时考虑电脑端与手机端显示（2026-09-09 用户强调，公告条手机 bug 教训）

> ⚠️ 最高优先级。**任何修改 / 改进 / 新增区块 / 调整样式或功能，都必须同时考虑电脑端（约 1280px / 1366px 宽）与手机端（约 390px / 375px 宽）两种显示**，绝不能只按电脑尺寸做——否则会出现"手机端文字被切 / 下一条和前一条重叠"这类问题。
>
> - **动手之前**：先想清"这个改动在窄屏（手机）下会怎样？"。尤其涉及 **宽度 / 视口 / 文字** 的逻辑（滚动距离、宽度计算、`.container`、`padding`、`white-space`、`max-content`、媒体查询断点 640px / 1200px 等）。
> - **改动之后**：按 §7 自检，**必须**用 Playwright 在**桌面宽度 + 手机宽度（375px 左右）**各截一张相关页面目检——确认双端都不破版、不重叠、不裁切。
> - **两端无法兼顾时**：**先停下来和用户商量**，说清冲突点和可选方案，由用户拍板。（用户 2026-09-09 原话："有困难可以和我商量，我决定怎么办。"）
> - **本条来历（2026-09-09 教训）**：公告条 `announce` 原先只按电脑设计（`white-space:nowrap + width:max-content`），电脑宽屏单行完美，但手机窄屏长句**被切一半**、且滚动距离按视口宽 `W=vp.clientWidth` 算而 item 宽 > W → **下一条和上一条重叠**。已修（见 §2.9 / 坑 #17）：改允许换行 + `width:100%` + 容器高度按内容自适应。

---

## 0.9 📌 仓库外「用户本机文件」不必记路径（2026-09-11 用户要求）

> 用户 2026-09-11 说明：**像《后台管理操作说明书.html》这类放在用户本机、仓库之外的文件，不必在文档里记录它们的路径**——用户每次都会当场给出准确路径。

> ⚠️ **注意：这不是"所有路径都不许记"。** 起初曾把本条误立为"一律不记录任何本机路径"，被用户当场纠正。**仓库内部的相对路径与技术配置信息照常记录**——那些是项目结构的一部分，随仓库走、不会过期。

**规则**：

1. **仓库外、属于"用户本机文件"的路径：不必记录。** 典型就是用户的两份交付文档（`后台管理操作说明书.html`、`SEO操作指南.html`），以及用户本地的工具/临时目录。
   - 提到这类文件时，**只写文件名 + 用途**（例："`后台管理操作说明书.html`（仓库外，用户本机）" ✅），**不写它在哪个盘哪个目录**；
   - 要动手改这类文件时，**直接向用户索取当前路径**——用户每次都会给。
2. **仓库内部的路径：照常记录**（目录结构、`content/**`、`scripts/**`、`src/**`、`admin/**` 等）。
3. **技术配置信息：照常记录**（如 Cloudflare/GitHub 的相关设置、API 地址、字段名等——这些不是"本机磁盘路径"）。

**来历与教训（2026-09-11）**：同步《后台管理操作说明书.html》时发现，本文件历史记录的若干本机路径（`H:\工作总集\...`、`E:\2026 公司网站\...`）**在用户当前电脑上已对不上**（用户换过电脑/盘符）。用户指示：**这些路径不必存、也不必改，注释一下即可**，并明确"**我每次都会给出具体的路径**"。
> 📌 **给未来 AI 的提醒**：用户是说要"不记某一类路径"，**不是**要"禁止记录一切路径"。**别把用户的指示放大成更宽的规则**——这与 §0.1 末尾那条教训（"改动范围严格限定在用户要求的那件事里"）是同一个道理。

**📍 本文件中已存在的历史路径（保留原文，仅供参考，一律视为可能过期）**：

| 位置 | 记的是什么 |
|---|---|
| §0.6 正文 | `后台管理操作说明书.html`（仓库外）的位置 |
| §8「其他已知事实」 | 原站离线副本目录、`decap-proxy` 本地克隆目录 |
| §9.3 标准修法 | `cd` 到 `decap-proxy` 的命令 |
| §10.14 用户交付文档 | `SEO操作指南.html`、`后台管理操作说明书.html` 的位置 |
| §10.15.5 体检方法论 | 体检脚本放在仓库外的临时目录 |

> 💡 **以后碰到这些地方要动手时**：**先向用户要路径**，别照着上面的旧路径去找。

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
  - `textImg`（图文组合）：`{direction:textLeft|textRight|textTop, ratio:"50:50"等, title, text(多段用空行分隔), images[{image,imageAlt,offset}](固定图片，多张纵向堆叠、每图可独立上下移), carousel{enabled, interval, images[{image,imageAlt}]}(**轮播区，2026-09-10 新增**，渲染在固定图片**下方**；≥2 张才自动轮播，1 张时静止显示且不生成圆点/箭头；enabled:false 则整块隐藏)}`
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
  - 图标：`media/icon-*.svg`（藏青线框 `#272e47`、20px、与文字同色；**2026-09-09 起后台「小图标」为 select 下拉**，内置 16 项：无 / 🔊喇叭megaphone / 🏭工厂factory / 🌐地球globe / ✉信封email / 🤝握手handshake / ❤️爱心heart / 🛡️盾勾shield-check / ⭐星星star / ✔️圆圈勾check-circle / 🏅奖杯award / 🚚卡车truck / 🕐时钟clock / 📦包裹package / 💡灯泡lightbulb / 👍点赞thumbs-up）。图标字段值是路径（`/assets/media/icon-*.svg`），build 渲染 `<img class="announce-ico" src="${icon}">`；选「无」则纯文字。新增图标=做 `media/icon-xxx.svg` + config.yml select options 加一项。
- **位置**：
  - 首页：`homeBody()` 里 `<section class="home-hero">` 之后、`<section class="section section-center">`（intro=「Flags, Banners and Pole Kits」）之前，`${announceBar(home.announce)}`
  - 关于：`aboutBody()` 里 `<div class="about-hero">` 之后、`${blocks}` 之前，替换掉原 `.about-marquee`（**marquee 已删除**），`${announceBar(data.announce)}`
- **渲染**：`build.mjs` 的 `announceBar(ann)`（复用）→ `.announce.announce-page`（`data-mode / data-pause / data-scroll`）> `.announce-bound`（=`.container` 左缘对齐）> `.announce-viewport`（定高 44px、overflow hidden、**左对齐**）> `.announce-track` > `.announce-item`
- **JS**：site.js `document.querySelectorAll('.announce')`，按 `data-mode` 分支：
  - `inout` → `play(el)`：transform W→0（滚进）→（`scroll+pause` 后）→-W（滚出）→（`+gap` 后）下一条
  - `slide` → `cycle()`：`outLeft(当前)` 与 `show(下一条)` 同时（重叠）。`W=vp.clientWidth`。⚠️ **slide 需 ≥2 条消息**（About 3 条正常）；**只有 1 条时自动回退 inout**（site.js 判定 `mode==='slide' && items.length>=2`，否则走 inout）——否则单条 slide 会"同一元素被 outLeft/show 轮番操作 → 闪跳、越来越快"（2026-09-09 用户发现的 bug，已修）。⚠️ **slide 停留时长的坑（2026-09-09 用户发现）**：原 `setTimeout(cycle, pause)` 是从**切换开始**计时，消息滑入还要花 `scroll` 秒，所以**完整停留 = pause - scroll**；当 `scroll > pause`（如首页 scroll 10 > pause 6）时停留为**负** → 消息**还没滚进完就被下一条顶掉**，表现为"从右边出来就消失、不像往左滚出"。**修复**：`setTimeout(cycle, scroll + pause)`（先滑入 scroll，完整停留 pause，再滚出）。**注意事项**：`pause`（停留）应 **> scroll**（滚动时长），否则消息来不及完整显示；建议 `pause ≥ scroll+1`。
- **样式**：`.announce{--ann-bg/--ann-fg,font-size:20px}`、`.announce-page{margin:8px 0 10px}`（原 24px 缩到 8px + `.home-hero{padding:76px 0 24px}`（原 71px 底带）→ 首页栏目图→公告条间距 95→32px）、`.announce-bound{max-width:var(--container);margin:0 auto;padding:0 24px}`、`.announce-item{justify-content:flex-start}`（左对齐；**2026-09-09 手机修复**：`width:max-content+white-space:nowrap` → `width:100%+white-space:normal`——长句在窄屏换行完整显示、item 宽=视口宽=滚动距离 W 正好匹配不重叠；`@media(max-width:640px)` 字号 20→15px；容器高度由 site.js `sizeVp()` 依 `scrollHeight` 自适应撑高，见坑 #17 / §0.8）
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

   > ⚠️ **更正（2026-09-11）**：上面提到的 `content/pages/led-display.json` **已于 2026-09-11 按用户要求删除**（它是模板示例页，仅 26 词、不在导航中、内容与配图不符，却进了 sitemap 会被 Google 收录，反拖低整站质量）。**现存的同类参考页是 `content/pages/products.json`**（Full Products，同为 `simple` 模板）。本行保留原文只为记录历史，照做时请改用 products.json 的结构。详见 §10.15。
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
17. **公告条手机端显示缺失（2026-09-09 教训）**：`announce` 的 CSS 曾用 `white-space:nowrap + width:max-content`（只按电脑宽屏设计），手机窄屏下长句**被裁一半**；且滚动距离按视口宽 `W=vp.clientWidth` 算，但 item 实际宽度 > W → 前一条还没滚出视口、下一条就滚进，**重叠**。**已修**（§2.9）：`.announce-item` 改 `width:100% + white-space:normal`（长句换行、完整显示，item 宽=视口宽=W 正好匹配、不重叠）；容器高度由 site.js `sizeVp()` 依 `el.scrollHeight` 自适应（长句换行后 >44px 也能撑高、不裁切，`resize`/`load`/`document.fonts.ready` 时重算）。**教训**：涉"宽度 / 滚动 / 文字"的组件手机必测；见 §0.8。

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
  > ⚠️ **更正（2026-09-11）**：此路径**已过期**（用户换过电脑/盘符，照它去找会找不到）。**需要这份离线副本时，直接向用户索取当前路径**。本行按要求保留原文，仅为记录历史（见 §0.9）。
- 视觉基准截图：`screenshots-original/`（原站渲染）、`screenshots-new/`（新版渲染）、人工标注稿在用户桌面（001/004/011/016/019 等）——**用户截图即"标准"**
- 一次迁移工具 `scripts/extract.py`：含 48 张图的 md5→语义名映射表（改图命名必须同步此表）
- `admin/index.html`:jsdelivr CDN 载入 decap-cms@3.9.0
- **后台登录 OAuth 配置（2026-08-24 生效，2026-09-04 登录失效后实战修复、重新验证通过，最终配置未变）**：GitHub OAuth App `wolflag admin`（账号 Tony0232-HZ；Redirect URL 登记**纯净** `https://decap.tony222.workers.dev/callback`，无 `?provider` 尾巴）；Cloudflare Worker `decap`（密钥 GITHUB_OAUTH_ID=Ov23liV3OrfRG3tL4IlZ、GITHUB_OAUTH_SECRET=2026-09-04 重新生成的值，**勿写入文档**，看 GitHub 应用页）；config.yml 的 `repo/base_url` 已填实；本地克隆 `H:\工作总集\wolflag 网站信息\2026 公司网站\decap-proxy`（**已修改源码且此版本在线上运行**：handleCallback 删除 provider 检查 + /auth 跳转改 302+no-store + redirect_uri 纯净）——Wrangler 登录用 `CLOUDFLARE_API_TOKEN` 环境变量（api token：Edit Cloudflare Workers 模板、建 token 时删 Zone Resources 行）
  > ⚠️ **更正（2026-09-11）**：`decap-proxy` 的上述**本地克隆路径已过期**（用户换过电脑/盘符，照它去找会找不到）。要动 Worker 时，**先问用户当前 `decap-proxy` 目录在哪**。本行保留原文仅为记录历史（见 §0.9）。其余配置事实（OAuth App、Worker 名、Client ID、密钥存放位置）仍然有效。
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
   cd "<decap-proxy 目录的当前路径>"    # ⚠️ 2026-09-11：原此行写的是 H:/工作总集/... 已过期；动 Worker 前先向用户要当前路径（见 §0.9）
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

## 10. SEO 基础设施（Google Search Console，2026-09-10 建立）

> 本节记录**站外**的 SEO 配置。站内 SEO 代码层面的待办见 §10.4。

### 10.1 GSC 资源绑定（已完成）

- **资源类型**：`Domain`（网域），值 `wolflag.com`（**不带** www / 协议 / 斜杠）——一次覆盖全部子域名与 http/https 版本。
- **验证方式**：DNS TXT 记录（Google 推荐项）。
- **验证码（⚠️ 永久保留，勿删）**：
  `google-site-verification=wvPOwteX0Htduhos3Q_9L5Qu9ha72NTRdhdLT6Ds6dM`
- **DNS 托管商**：**35互联**（厦门 35.com，NS = `ns1.35.net` ~ `ns4.35.net`，注册商同名 → 一处管理）。
- **后台入口**：`https://www.35.com` → 域名管理 → DNS 解析。
- ⚠️ **TXT 记录必须"新增"而非"覆盖"**：`@` 上已有一条 SPF（`v=spf1 include:spf.wm.ntesmail.com -all`），是企业邮箱（腾讯企业邮）的命根子。覆盖会冲掉它 → 发信进垃圾箱。**两条 TXT 并存才是正确状态。**
- 验证结果：`Ownership verified`。可用 `nslookup -type=TXT wolflag.com 8.8.8.8` 复核（应返回**两条** TXT）。

### 10.2 Sitemap 提交（已完成）

- GSC → `Sitemaps` → 填**完整网址** `https://www.wolflag.com/sitemap.xml` → SUBMIT。
- ⚠️ **坑**：只填 `sitemap.xml`（相对路径）会报 `Invalid sitemap address` —— 该 sitemap 早在 **2024-03-20** 就提交过（当年网易建站配套），Google 的"添加新站点地图"框只接受**未提交过**的。填完整网址可强制刷新。
- **提交前后对比**（关键收获）：

  | 字段 | 提交前 | 提交后 |
  |---|---|---|
  | Last read | 2026-01-21（8 个月前） | **2026-09-10（当天）** |
  | Discovered pages | **6**（老站旧账本） | **12**（新站全部页面） |
  | Status | Success | Success |

- **这解释了「搜 wolflag 能搜到、搜 feather flags 搜不到」**：域名 2024 年就被 Google 认识，但它手里一直是老网站的旧账本（仅 6 页），从未读过新站的产品页。

### 10.3 结论：搜不到产品词的真正原因

> ⚠️ **GSC 只解决"让 Google 看见"，不解决"让 Google 觉得值得排"。** 后者靠内容。**不要指望绑定 GSC 后排名立刻改善。**

三条根因（详见 §10.4）：

1. **产品页内容太薄**（首要）：羽毛旗页整页仅 **334 词**、横幅 244、国旗 199、首页 281；`feather flags` / `banners` 是行业竞争最惨的大词，凭这个体量排不上去是必然。
2. **外链 = 0**：新域名 + 零外链，Google 本就有 3~6 个月观察期。
3. **无结构化数据**：全站 0 个 JSON-LD。

### 10.4 📋 SEO 待办清单（**给未来接手的 AI：照此执行**）

> **文件定位**：这是本仓库的**唯一一份 SEO 待办清单**。2026-09-10 建立。
>
> **给未来 AI 的三条使用说明：**
> 1. **每一条都写清了「为什么做」**——先读懂原因再动手，不要机械执行、更不要凭自己的理解"优化"成别的样子。
> 2. **两条铁律**（见 §0.7 / §0.8）：**① 严禁自行 `git push`**，改完必须请用户批准；**② 任何改动都要同时考虑电脑端 + 手机端**，并用 Playwright 双端截图验证。
> 3. **本清单全部完成后，请删除整节 §10.4**（连标题一起删），并在变更日志里写一条简短总结（做了什么、结果如何）。**清单是"待办"，不是"历史"——做完了就不该再占地方；历史留给变更日志。**
>    - 💡 **为什么这里可以删**：本节性质是**待办清单**（做完了就无意义，符合 §0.1 的"已失去作用"例外）。**但变更日志、【坑】清单、各条教训记录等"记忆性"内容，一律只增不删** —— 见 **§0.1**。
>
> **开工前必做**：按 §0.5 先问用户"网站最近有没有更新？要不要同步到本地？"——后台（Decap）改的是 GitHub 仓库，本地通常落后。

---

#### 🔴 P0-A：产品页内容太薄（**头号问题，收益最大**）

**为什么必须做**（这段最重要，请读懂）：

2026-09-10 查明：**用户搜不到自己产品（如 `feather flags`）的头号原因就是这个。** 实测全站正文字数：

| 页面 | 正文词数 | 判断 |
|---|---|---|
| `about-us` | 798 | 尚可 |
| `stands-displays` | 384 | 偏薄 |
| **`feather-flag`** | **334** | ❌ 严重不足（**产品描述常常只有一句话**） |
| **`index`（首页）** | **281** | ❌ 严重不足 |
| **`banner`** | **244** | ❌ 严重不足 |
| **`national-flag`** | **199** | ❌ 严重不足 |
| `products` | 105 | ❌ 几乎空白 |

**为什么"内容薄"就排不上去**：

- `flags` / `banners` / `feather flags` 是**行业竞争最惨烈的大词**，全球数万家厂商在抢；
- Google 判断"这页值不值得排"，很大程度看**这页讲得够不够全面**；
- 竞争对手的同名词页面普遍 **500~800 词**，讲透材质、工艺、尺寸、应用场景、MOQ、交期；
- 用户这页只有 334 词、产品描述仅一句 → **Google 认为信息量不足，不给排名**。

> ⚠️ **技术 SEO 已全部修完**（网址后缀、404、alt、Schema、og 卡片、图片压缩，见 §10.7~§10.12）。
> **现在的瓶颈 100% 是内容**——再修技术也没用。

**怎么做**：

1. **目标**：每个核心产品页正文达到 **500~800 英文词**（不含页脚/导航）。
2. **改哪里**：
   - `content/products/feather-flags.json` → `products[].subtitle` 扩展，或加 `supplement[]` 图文模块；
   - 同理 `banners.json` / `national-flags.json` / `pole-display.json`；
   - 首页 `content/home.json` → `intro.text`、`categories.intro`、`supplement[]`；
   - **优先用后台已有的 `supplement`（补充模块）字段**——它本就是为此设计的图文区，不必改代码。
3. **每个产品页建议覆盖的内容**（B2B 买家真正关心的）：
   - **材质**：110g knitted polyester / 100D woven polyester 等，各自适用场景；
   - **印刷工艺**：dye sublimation（热升华）/ silkscreen（丝印）的区别与选择；
   - **尺寸与选型**：常见规格、如何按场景选（如 3m 杆 vs 5m 杆）；
   - **底座/配件**：ground spike / cross base / square base 的适配；
   - **应用场景**：展会、门店开业、房产中介、餐厅促销、路演等；
   - **B2B 采购要点**：MOQ、打样周期、交期、出货方式、设计文件格式要求（Vector PDF/AI）；
   - **抗风/耐用性**：能扛几级风、寿命多久。
4. **写作要求**：
   - **英文**，面向海外 B2B 买家（网站全站英文）；
   - **自然写作，不要堆砌关键词**（堆砌会被判作弊，反而有害）；
   - 内容要**真实准确**——写之前**请与用户确认产品事实**（材质、尺寸、MOQ 等），**不要编造参数**；
   - ⚠️ **产品现有文案的原始拼写/大小写要保留**（如 `comstom size`、`silksreen`）——用户明确要求复刻原站，见坑 #3。**新增的段落不必迁就旧拼写，但不要"顺手修正"已有字段。**
5. **验收标准**：
   - 相关页面正文 ≥ 500 词；
   - `node scripts/build.mjs` 无报错；
   - **桌面端 + 手机端截图**（§0.8 铁律）；
   - 页面可见文字**只增不减**，原有内容一字不改。

**⚠️ 须先做**：出方案给用户过目（要写哪些内容、改哪些字段），**批准后再动手**。

---

#### 🔴 P0-B：外链建设（= 0，**站外工作，需用户亲自参与**）

**为什么必须做**：

- Google 判断网站可信度的核心信号之一是**有多少其他网站链接到你**（叫"外链"/backlink）；
- 本站是**新域名 + 零外链**。新域名本就有 **3~6 个月观察期**，零外链更是雪上加霜；
- **这是"搜不到"的第二大原因**（第一大是内容，见 P0-A）；
- **纯站内优化做不出外链**——必须在别的网站上留下你的链接。

**怎么做**（AI 能做的是"给清单 + 写文案"，**注册与提交须用户本人操作**）：

1. **国际 B2B 目录**（免费为主，逐个注册公司档案）：
   - **Kompass**（kompass.com）——全球工业目录，B2B 采购常用；
   - **Europages**（europages.com）——欧洲 B2B 目录；
   - **ThomasNet**（thomasnet.com）——北美工业采购；
   - 其他可考虑：Alibaba、Made-in-China、Global Sources（用户可能已在用，检查档案是否完整并链回官网）。
2. **社交矩阵**（既是外链也是品牌信号）：
   - LinkedIn Company Page（B2B 最重要）、YouTube（工厂实拍/工艺视频）、Facebook、X；
   - ⚠️ **注册后要把链接填回网站**：`content/settings.json` 的 `footer.icons[].url`——**目前这几个社交图标是空的**（点击仍是 mailto 兜底），见 §2.1。
3. **AI 可帮的部分**：
   - 列**逐平台注册清单**（网址、需要填哪些字段、审核要多久）；
   - 起草**中英文公司简介**（不同平台字数不同，可出 50/100/300 词多版本）；
   - 起草**关键词描述**（各平台的 "products / services" 字段）；
   - 整理**统一的事实表**（成立年份、地址、电话、员工数、产能、认证），保证各平台信息一致——**信息不一致会削弱可信度**。
4. **验收标准**：能在 Google 搜到 `site:kompass.com wolflag` 之类，且**档案里的官网链接可点**。

> ⚠️ **务必提醒用户**：目录网站注册通常需**邮箱验证 + 可能人工审核**，有的会推销付费版。**免费档足够，不必付费。**

---

#### 🟢 P2-A：`about-us.html` 没有 H1

**为什么做**：H1 是页面**权重最高的标题标签**，Google 靠它判断"这页主题是什么"。About 页现在是 **0 个 h1、3 个 h2**——等于把最重要的位置空着。

**怎么做**：
- `build.mjs` 的 `aboutBody()` 里，给页头横幅（`.about-hero`）下方或正文起始处加一个 `<h1>`；
- 文字建议含关键词，如 `About WOLFLAG — Custom Flag & Banner Manufacturer Since 2003`；
- ⚠️ **H1 是可见元素，会改变页面外观**——须与用户确认文案，并双端截图确认排版不破。

**验收**：该页恰好 1 个 `<h1>`，双端显示正常。

---

#### 🟢 P2-B：首页 H1 没关键词

**为什么做**：首页 H1 现在是：

```
BESPOKE FLAGS MADE WITH YOUR DESIGNS AND SPECIFICATIONS!
```

- **是纯大写喊话**，读起来像广告标语而非主题陈述；
- **一个搜索关键词都没有**（没有 flags manufacturer / custom flags 这类买家会搜的词）；
- 首页 H1 是全站**最重要的一个标题位**，现在等于浪费。

**怎么做**：
- 改 `content/home.json` 的 `hero.title`；
- 建议方向（**须用户拍板**）：保留"定制"语气但植入关键词，如
  `Custom Flags, Banners & Pole Kits Manufacturer | WOLFLAG`；
- ⚠️ 该字段**驱动首页首屏视觉排版**（36px Catamaran、左侧列 397px，见 §4），**改文案会改变换行与版式**——**必须双端截图确认**，必要时与用户商量版式调整。

**验收**：H1 含目标关键词，双端不破版。

---

#### 🟢 P2-C：各页 `<title>` 太短、缺采购意图词

**为什么做**：Google 允许 **50~60 字符**的标题，本站普遍只用了一半，**等于白送一半展位**。且**没有采购意图词**（买家真正会搜的词）。

现状实测：

| 页面 | 现在的 title | 字符数 |
|---|---|---|
| `banner` | `Banner - WOLFLAG` | 16 |
| `blog` | `Blog - WOLFLAG` | 14 |
| `car-flags` | `Car Flags - WOLFLAG` | 19 |
| `feather-flag` | `Feather flag - WOLFLAG` | 22 |
| 首页 | `Professional manufacturer of flags, banners, and poles \| WOLFLAG` | 64（略超） |

**B2B 买家的采购意图词**：`custom`、`wholesale`、`manufacturer`、`supplier`、`factory`、`OEM`、`bulk`。

**怎么做**：
- 改各自的 `content/**/*.json` → `seo.title` 字段（后台「SEO 标题」）；
- 参考公式：`Custom [产品名(复数)] Wholesale Manufacturer | WOLFLAG`；
- 例：`Feather flag` → `Custom Feather Flags & Teardrop Banners Wholesale | WOLFLAG`；
- **每页标题必须唯一**（现状已唯一，改时保持）；
- ⚠️ **`<title>` 不显示在页面上**（只在浏览器标签栏和搜索结果里），**不影响页面版式**，改动风险低。

**验收**：各页 title 在 50~60 字符、含采购意图词、互不重复。

---

#### 🟢 P2-D：博客只有 1 篇

**为什么做**：
- 现有唯一一篇是 `welcome-to-wolflag-blog.json`（"欢迎来到我们的博客"）——**没有任何搜索价值**，没人会搜这个；
- 博客是**覆盖长尾关键词**的主要手段：大词（`feather flags`）抢不过大厂，但**长尾词**（`how to choose feather flag size`、`feather flag vs teardrop flag`）竞争小、意图明确、转化好；
- 博客文章还能**给产品页做内链**，把权重导过去。

**怎么做**：
1. **选题方向**（都是海外买家的真实疑问）：
   - *Feather Flag vs. Teardrop Flag: Which One Fits Your Business?*
   - *How to Choose the Right Fabric for Long-Lasting Outdoor Flags*
   - *Standard Flagpole Sizes and Wind Resistance Guide*
   - *Single-Sided vs. Double-Sided Custom Flags: A Complete Buyer Guide*
   - *What Artwork File Format Should You Send for Custom Flags?*
2. **怎么发**：后台 `/admin/` → 博客文章 → 新建（`content/blog/*.json` 自动发现，见 §2.5）；
3. **每篇要点**：
   - `slug` 英文小写无空格，**发布后勿改**（改 = 旧链接失效）；
   - `title` 含长尾关键词；`summary` 写清价值；`coverImage` 配图（注意 alt 字段）；
   - 正文用 `blocks[]`（p / h2 / image），**支持 `**词**` 加粗**；
   - **正文里用内链指向对应产品页**（如谈羽毛旗尺寸就链到 `/feather-flag`）；
4. **节奏建议**：每月 2~4 篇，稳定输出比一次猛发更有效。

**验收**：新文章能访问、进 sitemap、正文有到产品页的内链。

---

#### ⚠️ 附：两个"遗留小账"（非 SEO，但别忘）

1. **成立年份三处不一致**（2026-09-10 用户知情）：
   - Schema 写 `foundingDate: 2003`（用户选定）；
   - 网站文案 `"23-year manufacturer"` → 对应 2003 ✅；
   - 页脚版权 `© 2011 WOLFLAG` → 对应 2011 ❌（2011 至今仅 15 年）。
   **建议**：日后与用户确认口径，统一三处。**改动前必须问用户。**

2. **两张第三方素材图**（属"换图"非"改名"，2026-09-10 用户选择暂不处理）：
   - `harvard-banner-building.webp` —— 横幅页顶部横幅，**画面含哈佛校徽**（第三方标识）；
   - `teardrop-feather-flag.webp` —— 羽毛旗「水滴型」产品图，**画面是 World Food Expo 展会**（非自家工厂）。
   **建议**：日后换成自有素材（**需用户提供照片**）。**不影响功能，不影响 SEO。**

3. **裸域名 `wolflag.com`（不带 www）https 打不开** —— 详见 §10.5，**独立小项目，须单独安排**。

### 10.5 ⚠️ 待修：裸域名 `wolflag.com`（不带 www）https 打不开

- **现象**：`https://wolflag.com` 连不上。`https://www.wolflag.com` 正常。
- **原因**：DNS 的 `@ → A → 154.18.236.136` 指向**网易老建站服务器**（nginx/1.18.0），该机**无 https 证书**；而 `www → CNAME → wolflag-site.pages.dev` 才是本站。网易建站服务**已过期、需付费续用**（用户 2026-09-10 确认），不予续费。
- **当前该老机仍在工作**：`http://wolflag.com` 会 301 → `http://www.wolflag.com`（实测 Location 头正确）。故 **`@` 的 A 记录暂不可删**——删了 http 也废，问题从"一半坏"变"全坏"。
- **正确修法**：把 DNS 解析整体迁移到 **Cloudflare**（裸域名 CNAME 展平 + 自动 SSL，邮箱记录一并搬）。**这是一次独立的小项目**，须单独开工，步骤：
  1. 备份现有全部 DNS 记录（截图存档）
  2. Cloudflare 建站、导入记录
  3. **逐条核对 MX / DKIM（`default._domainkey`）/ DMARC / SPF 是否搬齐** ← 最易漏，漏了邮箱出问题
  4. 改 NS（35互联 → Cloudflare）
  5. 观察 24~48h，确认邮箱与网站均正常
- **过渡期约定**：所有对外露出的网址**统一用 `www.wolflag.com`**（邮件签名、名片、报价单、展会资料、B2B 平台档案）。

### 10.6 第三方 AI 建议的核验结果

> 用户 2026-09-10 提供的某 AI 诊断报告，逐条核验如下。

**✅ 该 AI 说对的关键一条（此前曾误判为错误，后经实测纠正）：**

> **「URL 混用 `.html` 与无后缀，需统一」——这条说对了。**

2026-09-10 实测发现：Cloudflare Pages 对**所有** `/x.html` 返回 **308 → /x**（见 §10.8）。当时只看了本地文件与 sitemap，未实测跳转行为，误判为"本来就一致"。**该 AI 实际指出了本站最致命的收录障碍。**

**✅ 其他说对的部分**：补图片 alt、图片文件名语义化、加 Schema、丰富产品页文本、优化 TDK、持续写博客、提交 B2B 目录外链——均已收入 §10.4。

**❌ 仍属错误、勿采纳的部分：**

| 该 AI 的说法 | 实际 |
|---|---|
| "站点用 UmiJS/React 前端框架开发，爬虫不执行 JS 只能抓到极短描述" | ❌ **不成立**。本站是**纯静态 HTML**（`node scripts/build.mjs` 预渲染）。实测 `curl https://www.wolflag.com/`，H1/正文/产品文字**全部在源码中**，无需执行 JS。该 AI 应是拿了旧站（网易外贸通）资料或凭空生成。 |
| "需改成 `/products/feather-flags/` 目录式路径" | ❌ **不必**。Cloudflare 已把无后缀作为规范形式，顺着它走即可（见 §10.8）。改目录式是更大的动作，且要重配大量跳转，收益不成比例。 |
| "全站仅 3 个页面被有效索引" | ❌ **数字存疑**。以 GSC `Pages` 面板为准。2026-09-10 已确认 Google 至少发现 **12** 个页面。 |

> 💡 **教训**：核验外部建议时，**必须实测运行中的行为**（HTTP 状态、跳转链），不能只看静态文件或 sitemap 内容。本次的误判源于此。

### 10.7 🔑 全站网址去 `.html` 后缀（2026-09-10 修复，**头号收录障碍**）

> ⚠️ **这是 2026-09-10 最关键的发现与修复。** 此前"搜 wolflag 能搜到、搜 feather flags 完全搜不到"的真正技术根因。

#### 问题现象

Cloudflare Pages 默认开启 **Pretty URLs**（美化网址），行为实测如下（**全站无一例外**）：

| 请求 | 响应 |
|---|---|
| `/national-flag.html` | **308** → `https://www.wolflag.com/national-flag` |
| `/about-us.html` | **308** → `/about-us` |
| `/blog/welcome-to-wolflag-blog.html` | **308** → `/blog/welcome-to-wolflag-blog` |
| `/index.html` | **308** → `/` |
| `/national-flag`（无后缀） | **200**，返回正确页面 |
| `/blog` | **200**，返回 `blog.html`（**优先于** `/blog/` 目录） |

**连锁反应**：
1. sitemap 与全站内链写的都是 `.html` → Google 只能抓到 **308 重定向页**；
2. Google 判定 → `Page is not indexed: **Page with redirect**`（页面被重定向，**不收录**）；
3. Google 自行推断真正的规范网址是**无后缀**版本（GSC 显示 `Google-selected canonical: https://www.wolflag.com/national-flag`），但 sitemap 里**根本没有无后缀版本**；
4. 结果：**两边都悬着，页面不被收录**。GSC 实测 four 个产品页全部命中此状态。

**对照证据**：`banner.html` / `feather-flag.html` 当时显示 `URL is unknown to Google`；`national-flag.html` / `pole-display.html` 显示 `Page with redirect`（Last crawl 2026-08-25，`Page fetch: Successful`、`Crawl allowed: Yes` —— 证明**网站本身没问题、能正常抓取，唯一障碍就是这个 308**）。

#### 修复方案：顺着 Cloudflare，全站改用无后缀

> **为什么选无后缀而非带 `.html`**：308 是 Cloudflare 平台层行为，关不掉（改设置会牵动其他行为）。顺着它走最省事。

**改动清单（已完成）**：

| 文件 | 改了什么 |
|---|---|
| `scripts/build.mjs` | 新增 `cleanUrl()` 助手（第 ~44 行）；`PAGES[].slug/nav` 改用无后缀；`header()` 加 `navUrl()` 让菜单/子菜单输出无后缀；blog 卡片/侧栏/分页器/Back to Blog 链接去后缀；sitemap 生成去后缀；`active` 传 `/blog` |
| `scripts/build.mjs` | `shell()` 新增 `path` 参数 → 按页输出 **`<link rel="canonical">`**（全站此前完全缺失）并修复 **`og:url`**（此前 11 页全写死首页） |
| `src/assets/js/site.js` | 博客侧栏客户端分页的链接去后缀（第 64 行） |
| `content/settings.json` | 导航全部去后缀 |
| `content/home.json` | 首页 4 个分类卡链接 |
| `content/pages/products.json`、`content/pages/led-display.json` | 卡片 `link` + `page.nav` |
| `content/products/*.json`（4 个）、`content/product-details/car-flags.json`、`content/specgrid/stands-displays.json` | `page.nav` |

**⚠️ 关键约定：`page.file` 字段必须保留 `.html`**（那是**磁盘文件名**，生成产物仍是 `x.html`）。只去掉 `page.nav` 与所有链接类字段的后缀。**改 `page.file` 会导致构建出错误文件名。**

#### 修复后的实测结果（2026-09-10）

- ✅ 12 个页面、11 个内部链接、sitemap 全部 12 个 URL —— **全部 200，零 404**
- ✅ **页面可见文字与改动前逐页比对：12 页 100% 一致**（零显示变化）
- ✅ 导航 `active` 高亮逐页核对：各页命中 1 处（`led-display.html` 本来就不在菜单中，改动前后一致，非回归）

#### ⚠️ 依赖与风险

**无后缀网址能用，完全依赖 Cloudflare Pages 的 Pretty URLs 功能**（默认开启）。若将来有人在 Cloudflare 后台关闭它，**全站会集体 404**。**请勿关闭该设置。**

#### 🔧 本地自检工具（新增，仅供验证，不参与部署）

两个 Python 脚本已放 `scripts/`：
- `scripts/_preview_server.py` —— 本地预览服务器，**模拟 Cloudflare 的 clean URL 行为**（`/foo`→`foo.html` 200；`/foo.html`→308→`/foo`；`/foo` 优先于 `/foo/` 目录）。用法：`python scripts/_preview_server.py 8123`
- `scripts/_check_links.py` —— 遍历全部页面与内部链接、逐个验证 sitemap URL，报告 404。用法：`python scripts/_check_links.py http://127.0.0.1:8123`

> 注意：直接用 `python -m http.server` 测试**不可靠**——它不模拟 clean URL，会把 `/blog` 当成目录列表返回。

#### 📌 后续新增页面时的填法变化

后台「新增类目页」等处，**`page.nav`（导航地址）填无后缀**：

```
文件标识：    led-display
页面文件名：  led-display.html    ← 保留 .html（实际文件名）
导航地址：    /led-display        ← 去掉 .html
```

> build.mjs 的 `nav` 处理虽已对旧数据做 `cleanUrl()` 兜底（带 `.html` 也能正确高亮），但**建议后台直接填无后缀**，避免混淆。

### 10.8 🚫 404 页面（2026-09-10 新增，修复「软 404」）

#### 问题现象

Cloudflare Pages 在 `static/` 下**找不到 `404.html`** 时，会把**任意不存在的路径**一律返回**首页内容 + HTTP 200**。实测（修复前）：

| 请求 | 响应 |
|---|---|
| `/zzz-nonexistent` | **200** + 首页完整内容（12049 字节，Title 与首页完全相同） |
| `/about-usweekly` | **200** + 首页完整内容 |
| `/testing123` | **200** + 首页完整内容 |

**直接访问 `wolflag-site.pages.dev/zzz-nonexistent` 同样如此** → 证明是 Cloudflare Pages 层的行为，与自定义域名无关。

**危害（软 404 / soft 404）**：
1. **浪费抓取配额**（Crawl Budget）——Google 以为大量页面存在，抓回来全是首页副本；
2. **掩盖真实死链**——站内若有写错的链接，本应 404 立即暴露，现在被伪装成正常页；
3. **可能被判重复内容**——同一份首页内容对应无限多个 URL。

#### 修复

新增 `static/404.html`（由 `build.mjs` 的 `notFoundBody()` 生成，沿用全站 `shell()` + 导航 + **完整页脚**）。Cloudflare Pages 检测到该文件后，会自动用它应答未匹配路径，**并正确返回 HTTP 404**。

- 404 页**不进入 sitemap**；
- 其 `canonical` 指向自身（`/404`）而非首页，避免被当作首页副本；
- 内容：大号 404 + 英文提示 + 6 个热门页面链接 + Back to Home 按钮 + 联系邮箱。

#### 验证结果（2026-09-10）

| 项目 | 结果 |
|---|---|
| 假路径 `/zzz-nonexistent` `/about-usweekly` `/testing123` | ✅ **HTTP 404**（本地模拟 + 线上实测均通过） |
| 全部 12 个真实页面 | ✅ HTTP 200，**可见文字与线上逐页比对 100% 一致** |
| 内部链接 / sitemap | ✅ 全部 200，零 404 |
| 双端显示 | ✅ 桌面 1366px + 手机 390px 截图确认，不破版 |

#### 相关工具更新

`scripts/_preview_server.py` **已同步模拟 404 行为**（找不到的文件返回 `404.html` 内容 + HTTP 404），本地自检才与线上一致。

### 10.9 🖼️ 图片 alt 后台可填（2026-09-10 新增）

> 背景：全站 149 张图曾有大面积 `alt=""`。审计后分为三类——**①装饰性图标**（页脚社交图标、公告条小图标、服务卡图标）空 alt 是 **a11y 规范正确做法**，保持不变；**②JS 动态填充的占位图**（`.site-lightbox` 的 `<img src="" alt="">`）本就该空；**③真实内容图**（产品图、横幅图、About 图片、详情页多图、博客封面）——**这类已清零**。

#### 数据模型：`imageAlt` / `blockImageAlt` 字段

新增 22 个可选字符串字段，**一律可选**，命名规律：

| 字段名 | 用在哪 |
|---|---|
| `imageAlt` | 绝大多数图片（产品图、横幅图、About 图、轮播图、详情页图、博客封面等） |
| `blockImageAlt` | 博客正文插图块 `blocks[].image` 专用（避免与同级的 `imageAlt` 语义混淆） |

**位置清单**（22 处，均与对应 image 字段同级）：

| collection | 字段路径 |
|---|---|
| home | `hero.images[].imageAlt`、`intro.images[].imageAlt`、`categories.items[].imageAlt`、`supplement[].imageAlt` |
| about | `hero.imageAlt`、`blocks[type=image].imageAlt`、`blocks[type=textImg].images[].imageAlt` |
| pages / specgrid / feather-flags / banners / national-flags | `imageAlt`（顶部横幅）+ `products[].imageAlt` + `supplement[].imageAlt`（仅 pages/specgrid/feather/banners/national 有） |
| product-details | `products[].images[].imageAlt`、`textImg.images[].imageAlt` |
| pole-display | `featured[].imageAlt`、`ingredients.items[].imageAlt` |
| blog | `imageAlt`（封面）、`blocks[].blockImageAlt`（插图） |

> ⚠️ **列表型图片字段（hero 轮播、简介照片、详情页多图）从 `field:` 简写改成了 `fields:` 完整写法**——因为要在一个条目里放「图片 + 说明」两个子字段。**旧数据（纯字符串数组）仍向后兼容**，见下。

#### build.mjs：`altOf()` 助手

```js
const altOf = (obj, fallback = '', key = 'imageAlt') => {
  const v = obj && typeof obj === 'object' ? obj[key] : '';
  return esc(v && String(v).trim() ? v : fallback);
};
```

- **优先**取内容里的 `imageAlt`/`blockImageAlt`；
- **没填则回退**到传入的兜底值（通常是品名 `p.name`、页面 `heading`、或区块标题）；
- **兜底也为空时**才输出空 alt；
- **兼容旧数据**：图片项若是纯字符串（如 `"/assets/media/x.webp"`），`typeof obj === 'object'` 为 false → 直接走兜底，**不会报错**。

**用法示例**：`alt="${altOf(p, p.name)}"`、`alt="${altOf(data, data.heading || '')}"`、`alt="${altOf(bl, bl.text || '', 'blockImageAlt')}"`。

#### 验证结果（2026-09-10）

| 项目 | 结果 |
|---|---|
| PyYAML `safe_load` | ✅ 通过 |
| 22 个新字段的 `widget`/`label` 解析 | ✅ 全部正确，无被全角逗号破坏（坑 #10b） |
| 字段层级（是否被嵌进 products） | ✅ 全部在正确层级，无嵌套错误（坑 #16） |
| 后台 `/admin/` 打开 | ✅ 正常渲染登录页，**无** `Error loading the CMS configuration` |
| **12 页可见文字与线上比对** | ✅ **100% 一致**（alt 属属性，不影响可见内容） |
| **真实内容图空 alt** | ✅ **62 处 → 0 处**（剩余 44 处装饰图标 + 12 处 JS 占位图，**应保持为空**） |
| 内部链接 / sitemap | ✅ 全部 200，零 404 |
| 双端显示 | ✅ 桌面 1366px + 手机 390px 截图确认 |

#### 📌 用户操作方式

后台每个图片字段**下方**多了一个「**图片说明(alt)**」输入框：

- **填了** → 该图用您写的文字当 alt；
- **留空** → **自动用当前位置已有的文字兜底**（产品用「品名」、页面横幅用「页面主标题」、区块图用「区块标题」），**不会留空**；
- 建议写**英文**、含产品关键词（如 `Custom teardrop feather flag wholesale`）。

#### ✅ 图片文件名已去中文（2026-09-10 完成）

详见 §10.10。

---

### 10.10 🏷️ 图片文件名去中文（2026-09-10 完成）

Google 会读**图片文件名**判断内容，中文名对英文搜索无帮助。本次把媒体库所有中文名改为**英文语义名**。

> ⚠️ **命名原则：先看图、再命名，不做字面直译。** 中文名常与实际画面不符（例：`1.webp` 实际是页脚大号 logo；`car-flag-米黄背景.webp` 实际是 4 面带杆汽车旗，并无米黄背景）。**改名前必须逐张查看实际内容。**

#### 改名对照表

| 原名 | 新名 | 实际内容 |
|---|---|---|
| `1.webp` | `wolflag-logo.webp` | 页脚大号 WOLFLAG logo（591×363） |
| `a型展架-remax.jpg` | `a-frame-sign-remax.jpg` | A 型展架，画面为 RE/MAX 房地产牌 |
| `banner-新横幅.webp` | `harvard-banner-building.jpg` | 哈佛楼前红色横幅 |
| `car-flag-米黄背景.webp` | `custom-car-flags.jpg` | 4 面带杆定制汽车旗 |
| `h-stake-网站图.webp` | `h-stake-yard-signs.jpg` | H 型地钉 + 庭院牌 |
| `product横幅-.jpg` | `factory-direct-banner.jpg` | WOLFLAG 工厂直供宣传横幅 |
| `x展架08.jpg` | `x-banner-stand.jpg` | X 型展架 |
| `太阳能-灯箱-网站图.webp` | `solar-light-box.jpg` | 太阳能灯箱 |
| `易拉宝02.webp` | `roll-up-banner-stand.jpg` | 易拉宝/拉网展架 |
| `横幅-关于我们.webp` | `world-flags-banner.jpg` | 各国国旗特写（About 页头横幅） |
| `横幅-示意图.webp` | `street-pole-banner.jpg` | 路灯杆挂旗 |
| `水滴型沙滩旗02.webp` | `teardrop-feather-flag.jpg` | 水滴型沙滩旗 |

**同步更新了 7 个内容 JSON 的引用**：`content/settings.json`（页脚 logo）、`about.json`、`pages/products.json`、`product-details/car-flags.json`、`products/banners.json`、`products/feather-flags.json`、`specgrid/stands-displays.json`。

> 注意 `car-flag-米黄背景.webp` 被 **2 处**引用（products.json 与 car-flags.json），改名时两处都须更新。

#### 删除的废弃文件

`media/水滴型旗子.jpg`（892KB）—— 与 `teardrop-feather-flag.jpg` 是**同一张图**（md5 不同但画面/构图相同，仅尺寸与格式不同），**无任何内容引用**，已删除。

#### 验证结果

| 项目 | 结果 |
|---|---|
| 全站图片引用（75 个） | ✅ **全部 200，0 缺失（无图裂）** |
| 12 页可见文字与线上比对 | ✅ **100% 一致** |
| 新文件名出现在页面上 | ✅ 已抽查确认 |
| 双端显示 | ✅ 桌面 + 手机截图正常 |
| 媒体库残留中文名 | ✅ **已清零**（92 个文件） |
| 线上复验 | ✅ 75 个图片引用全部 200；中文名引用 0 个 |

> ⚠️ **旧链接会失效**：这些图若曾被外部引用（几乎不可能，均为站内资产），旧文件名将 404。站内引用已全部同步，无影响。

#### 📌 记入待办（本次**未**处理，因属"换图"而非"改名"）

- **③ `harvard-banner-building.jpg`** 用于 banner 产品页顶部横幅，画面含**哈佛校徽**（第三方标识）。
- **⑫ `teardrop-feather-flag.jpg`** 用于羽毛旗「水滴型」产品图，画面是 **World Food Expo 展会**（第三方活动，非自家工厂）。

→ 两处**不影响功能**，但**若要做品牌合规 / 展示自家实力**，建议日后换成自有素材。**换图需用户提供或另行挑选。**

#### ⚠️ 后续注意事项

新增图片时，**上传前就改成英文小写连字符名**（如 `custom-teardrop-feather-flag-wholesale.webp`）。

> 重命名**已入库的文件**代价较高——必须同步改所有 JSON 引用 + 重建 + 验证，且**每次都要逐张看图**确认中文名是否与实际画面相符。**上传时命名正确，是最省事的做法。**
>
> 另注：`scripts/extract.py` 的「48 张原站图 md5→语义名映射表」**不包含**本次这 12 个文件（它们是后来手动上传/转换的），故本次改名**无需同步该脚本**。

---

### 10.11 📊 结构化数据 Schema + og/Twitter Card + 图片压缩（2026-09-10）

#### 10.12.1 结构化数据（Schema.org）

**此前全站 0 个 JSON-LD。** 现每页输出 `<script type="application/ld+json">`（一个 `@graph` 包裹多个类型）。

**用户确认的关键事实**（写进 Schema，**改动需用户同意**）：

| 项目 | 值 | 说明 |
|---|---|---|
| 成立年份 | **2003** | 按网站"23-year manufacturer"推算。⚠️ **与版权行 `© 2011` 不一致**——用户选 2003，建议日后理顺 |
| 地址 | **两个都写** | 工厂（Pinghu, Zhejiang）+ 贸易公司（Hangzhou, Zhejiang） |
| 产品价格 | **不写** | B2B 询盘报价，写了易误导且难维护 |

**构建器**（`build.mjs`，均在 `header()` 之前定义）：

| 函数 | 输出 | 用在哪 |
|---|---|---|
| `absUrl(u)` | 站内路径 → 绝对网址 | og:image / twitter:image / logo / image 等**所有需要绝对网址**处 |
| `orgSchema()` | `Organization` + `WebSite`（`@id` 互链：`#organization` / `#website`） | **每页**（含 404 页） |
| `breadcrumbSchema(name, path)` | `BreadcrumbList`（Home > 本页） | 所有子页（首页自身返回 null） |
| `productListSchema(products, name, path)` | `ItemList` 内嵌 `Product`（品名/描述/图/品牌/manufacturer，**无价格**） | 有产品的页 |
| ☝️ **⚠️ 更正（2026-09-11）**：条目类型**已由 `Product` 改为中性的 `ListItem`**（品名/描述/图/独立链接或本页链接），**不再输出 `Product` / `brand` / `manufacturer`**。原因见 **§10.16**：Google 对 `Product` 富媒体硬性要求「`offers`/`review`/`aggregateRating` 至少一项」，而本站 B2B 不公开价格、也无评价评分 → GSC 报 Critical 错误。**上表这一行保留原文仅为记录历史。** | — | — |
| `faqSchema(items)` | `FAQPage`（自动去掉 `Q.` / `A.` 前缀） | 仅 About 页（6 条 FAQ） |
| `schemaGraph(...parts)` | 合并为 `@graph`，自动剔除 null、内层去重 `@context` | 统一入口 |

**`shell()` 新增 `type` 与 `schema` 两个参数**；`@context` 由 `schemaGraph` 在外层统一给出。

**⚠️ pole-display 的陷阱**：该页产品在 `featured[]` + `ingredients.items[]`，**不在 `products[]`**。构建循环里已做兼容：

```js
const pageProducts = (d.products && d.products.length)
  ? d.products
  : [...(d.featured || []), ...((d.ingredients && d.ingredients.items) || [])];
```

**实际输出**（2026-09-10 实测）：

| 页面 | Schema 类型 |
|---|---|
| 首页 / 404 | Organization, WebSite |
| 所有子页 | + BreadcrumbList |
| 产品页（羽毛旗/横幅/国旗/旗杆/展架/产品合集/汽车旗/LED） | + ItemList |
| 关于我们 | + FAQPage |
| 博客文章 | + BlogPosting |

#### 10.12.2 og:image 与 Twitter Card（修复）

**问题**：`og:image` 此前是**相对路径**（`/assets/media/home-hero.webp`），且**全站都是同一张首页图**。

**后果**：微信 / LinkedIn / Facebook / X 抓取时**取不到图** → 分享卡片空白，品牌观感差。

**修复**：
1. 新增 `absUrl()`，og:image / twitter:image 一律输出**绝对网址**；
2. **按页输出**：优先该页 `bannerImage` → 首个产品图 → 回退首页 hero；
3. 补 `og:site_name` / `og:locale` / `og:image:width|height`；
4. 新增 **Twitter Card**（`summary_large_image` + title/description/image）——此前完全缺失。

#### 10.12.3 sitemap `lastmod`

每个 `<url>` 增加 `<lastmod>`，取**构建日期**（`new Date().toISOString().slice(0,10)`）。

> 静态站没有可靠的每页修改时间，用构建日期是**诚实**的近似：每次部署即刷新，反映"站点在维护"，不会被误判为长期不更新。

#### 10.12.4 图片压缩与「扩展名≠实际格式」修复

**压缩 14 张 >100KB 图片**（横幅类宽 2000→1600、正文图长边→1200~1400、quality 78~82）：

- `factory-direct-banner`：**341.8KB → 23.3KB（-93%）**
- `feather-banner`：317.8 → 189.3 KB
- **首页图片总量：1211KB → 991KB**

**⚠️ 同时修掉一个隐蔽问题**：**9 个文件的扩展名与实际格式不符**——扩展名是 `.jpg`，内容其实是 **WebP**。

> **为什么必须修**：Cloudflare 按**扩展名**返回 `Content-Type: image/jpeg`，而内容实为 WebP。多数浏览器能靠内容嗅探显示，但**严格环境（部分 CDN / 邮件客户端 / 社交抓取器）可能拒收**。已全部改为 `.webp` 并同步 JSON 引用。
>
> `factory-direct-banner.jpg` 是**真 JPEG**，一并转为 WebP 后改名为 `.webp`。

**⚠️ 改图片扩展名/文件名后必须同步 JSON 引用**（本次涉及 6 个 JSON）。

---

### 10.12 🖼️ 图片尺寸必须自动读取，不能写死（2026-09-10 修复，含重要教训）

#### 现象

用户反馈：羽毛旗页**黄色首图在部分手机上"旋转 90°"**，但**另一台手机与电脑都正常**。

#### 根因（Playwright 实测确认）

| 环节 | 事实 |
|---|---|
| **2026-09-08** | 用户在后台把该图从 `feather-1.webp`（280×320）**换成了 1536×2048 的竖图**（比例 0.750） |
| **但 HTML 里** | 仍写死 `width="280" height="320"`（比例 0.875）——**声明与实际不符** |
| **后果** | 浏览器按**错误比例**预留占位框 → 配合 `object-fit: cover` → 图片加载完成前产生严重视觉畸变（**看起来像转了 90°**） |
| **该图 1.5MB** | 慢网手机上加载需数秒 → **畸变可见数秒**；电脑/已缓存手机加载极快 → 畸变仅数十毫秒，**肉眼看不见** |
| **因此** | **"两台手机表现不同"完全由此解释** |

> 📌 **关键认知**：`width`/`height` 属性写的是"占位框比例"，浏览器靠它在图片到达**之前**排好版。**写错 = 给图片预留了一个比例错误的坑，图片掉进去就会变形。**

#### 修复（一劳永逸）

**`build.mjs` 新增三个函数（零依赖）：**

| 函数 | 作用 |
|---|---|
| `readImageSize(urlPath)` | 读图片真实宽高；**带缓存**（`imgSizeCache`）；SVG 返回 null；找不到返回 null |
| `parseImageSize(buf)` | 从字节头解析：**JPEG**（扫 SOF0/1/2 标记）、**WebP**（VP8 有损 / VP8L 无损 / VP8X 扩展）、**PNG**（IHDR）、**GIF** |
| `dimAttrs(urlPath, scale)` | 生成 ` width="W" height="H"` 片段；**读不到返回空串**（退化到旧行为，不会更糟）；`scale` 用于限制输出像素（卡片图实显 ~350px，无需写 1536） |

**全站 13 处写死尺寸的 `<img>` 改为调用 `dimAttrs()`**：

- 首页：轮播图、简介三图、产品分类卡
- 产品页：羽毛旗（`.f-img`）、国旗/横幅（`.p-img`）、旗杆（主打 + 配件）
- simple/flex 布局的产品卡（含可跳转 / 不可跳转两个分支）
- About 页头图

**保留 2 处固定 UI 尺寸**（不动）：导航 logo `36×36`、客户 logo `128×86`——它们是固定尺寸的界面元素，与内容图无关。

> ✅ **最大价值**：**用户以后在后台换任何图，尺寸都会自动适配**，不会再出现这个问题。

#### 顺带压缩

| 文件 | 前 → 后 | 降幅 |
|---|---|---|
| `digital-printing-feather-flag` | 1505KB → **120KB** | -92% |
| `pinpoint-flag` | 3326KB → **92KB** | -97% |
| `leaf-shape-feather-flag` | 1101KB → **136KB** | -88% |
| `rectangular-flag` | 516KB → **73KB** | -86% |

**合计 6.3MB → 411KB。** 4 个文件转为 WebP 并把扩展名改为 `.webp`（修正「扩展名 .jpg 实为 WebP」的不一致）。

#### 验证

| 项目 | 结果 |
|---|---|
| 羽毛旗页 6 张图：声明比例 vs 真实比例 | ✅ **100% 相符** |
| Playwright 390px 窄屏：`attrRatio == naturalRatio == renderedRatio` | ✅ |
| 双端截图 | ✅ 黄旗竖直显示，无旋转/变形 |
| 12 页可见文字与线上对比 | ✅ **100% 一致** |
| 图片引用 / 内部链接 | ✅ 75 个引用 0 缺失，零 404 |
| 线上复验 | ✅ 6 张图尺寸声明全部正确 |

#### ⚠️ 教训（写给未来 AI）

1. **看到"图片变形 / 旋转 / 拉伸"类问题，先查 `width`/`height` 属性是否与真实尺寸相符**——这是最常见的根因，且极易被忽略。
2. **"只有部分设备/只有手机出问题"往往指向"加载时序"**：慢加载放大了"错误占位框"的影响。**不要因为电脑正常就认为没问题。**
3. **用户换了图 → 必须检查该图尺寸是否与 HTML 声明匹配**。本次根因就是 2026-09-08 换图埋下的，**两天后才在特定手机上暴露**。
4. **能用"自动读取"就别"写死数字"**——写死的数字在内容会变动的站点上**必然**会过期。

---

### 10.13 🎠 About 图文组合新增轮播区（2026-09-10 新增）

#### 需求

用户在后台看到工厂介绍的「图文组合」模块里有两张图（工厂外景 + 车间内部），要求：

> **第一张工厂图固定不变、静止；第二张图改为轮播，展示工厂内部的更多场景。**
> 参照首页轮播、**轮播时长要能在后台自己调整**。

#### 数据模型（`content/about.json` → `blocks[type=textImg]`）

**原有** `images[]` 语义收窄为「**固定图片**」，**新增** `carousel` 对象承载轮播：

```json
{
  "type": "textImg",
  "direction": "textLeft",
  "ratio": "55:45",
  "text": "...",
  "images":  [ { "image": "/assets/media/about-factory.webp", "offset": 0 } ],
  "carousel": {
    "enabled": true,
    "interval": 8,
    "images": [ { "image": "/assets/media/about-us-picture-5.webp" } ]
  }
}
```

> ⚠️ **向后兼容**：`images` 仍支持多张（纵向堆叠）+ `offset`；`carousel` 不存在时**不影响**原有渲染。
> 本次迁移即：原 `images[0]` → 留在 `images`（固定图）；原 `images[1]` → 移入 `carousel.images`。

#### 后台字段（`admin/config.yml` → about → blocks → textImg）

| 字段 | 类型 | 说明 |
|---|---|---|
| `images` | list（**改标签**为「固定图片（不轮播）」） | 子字段不变：`image` / `imageAlt` / `offset` |
| `carousel` | **object（新增）** | 见下 |
| `carousel.enabled` | boolean，默认 true | 取消勾选 = 整块轮播区隐藏（内容保留） |
| `carousel.interval` | number，默认 5 | 秒；**用户要求本次设为 8** |
| `carousel.images` | list | 子字段：`image` / `imageAlt`（无 offset——轮播图统一尺寸） |

> ⚠️ **`carousel` 必须置于 `textImg` 的 `fields` 顶层**，不能塞进 `images` 的子字段里（坑 #16）。
> 2026-09-10 已验证：PyYAML 通过、`textImg` 顶层字段为 `[bg, direction, ratio, title, text, images, carousel]`、
> `images` 的子字段未被污染。

#### 渲染（`build.mjs` → `renderAboutBlock()` 的 `textImg` 分支）

- 固定图：沿用原逻辑（`.about-it-imgs` 内，多张纵向堆叠、各自 `margin-top: offset`）。
- 轮播区：紧跟固定图之后，输出

  ```html
  <div class="it-carousel" data-interval="8">      <!-- ≥2 张 -->
    <img class="it-slide is-active" src="..." alt="...">
    <img class="it-slide" src="..." alt="...">
  </div>
  <div class="it-carousel is-single">              <!-- 1 张：不带 data-interval -->
    <img class="it-slide is-active" src="..." alt="...">
  </div>
  ```

- `alt` 走 `altOf(im, fallbackAlt)`（优先 `imageAlt`，回退模块 `title`，再回退兜底文案）。
- **单张时不输出 `data-interval`**，JS 据此直接静止。

#### 样式（`site.css` → `.it-carousel*`）

| 选择器 | 要点 |
|---|---|
| `.it-carousel` | `position:relative; overflow:hidden; border-radius:12px; margin-top:20px`（与固定图间距同 `.about-it-imgs` 的 gap） |
| `.it-carousel` | **`aspect-ratio: 1200/899`** —— 与固定图同比例，**避免图片加载时高度跳动**；`background:#f1f1ef` 兜底底色 |
| `.it-slide` | `position:absolute; inset:0; object-fit:cover; opacity:0; transition:opacity .8s`（淡入淡出） |
| `.it-slide.is-active` | `opacity:1` |
| `.is-single` | 覆盖为 `position:relative` + `aspect-ratio:auto`（单张静止、按原始比例显示） |
| `.it-dots` / `.it-dot` | 底部居中圆点，白色半透明；`.is-active` 变实心并 `scale(1.2)` |
| `.it-arrow` | 左右箭头，**默认 `opacity:0`，悬停容器淡入**；`@media (max-width:760px)` 下**常显**且缩小到 34px（手机没有 hover） |

#### 交互（`site.js` → `document.querySelectorAll('.it-carousel')`）

与首页 hero 轮播同思路，但**独立实现**（首页那个绑定 `.hero-slider`，与之无耦合）：

- **`if (slides.length < 2) return;`** —— 单张直接返回，**不生成圆点/箭头、不启动定时器**。
  > 📌 这条很关键：避免出现"只有一个圆点"的怪异观感。
- 自动切换 `setInterval`（`data-interval` 秒，默认 5）；
- **`mouseenter` 暂停 / `mouseleave` 恢复**（方便细看）；
- 圆点可点击跳转；左右箭头切换；
- 到末位循环（`(n + len) % len`）。

#### 验证（2026-09-10）

| 项目 | 结果 |
|---|---|
| 临时加 4 张图实测 | ✅ 每 3 秒自动切换、循环正常，圆点 4 个 / 箭头 2 个 |
| 恢复为 1 张 | ✅ 容器带 `is-single`，无圆点箭头 |
| 桌面端 1366px + 手机端 390px 截图 | ✅ 不破版；手机端箭头缩小常显、不挡图 |
| 12 页可见文字与线上比对 | ✅ **100% 一致**（纯结构变更，未动文字） |
| 内部链接 / 图片引用 | ✅ 零 404 / 75 个 0 缺失 |
| 后台配置 | ✅ PyYAML 通过、层级正确（坑 #10b / #16） |

#### ⚠️ 给未来 AI 的提示

- **轮播图与固定图的比例最好接近**（固定图为 1200×899 ≈ 4:3 横图）。轮播区按此比例设了 `aspect-ratio`，
  加入**竖图**会被 `object-fit:cover` 裁掉较多。**站点已能自动读取图片尺寸（§10.12），故不会出现变形/旋转，最多是裁切不理想。**
- 用户若反馈"轮播不动了"，**先确认 `carousel.images` 是否 ≥2 张**——1 张时设计上就是静止的，不是 bug。
- 用户要改间隔：**后台「轮播间隔（秒）」直接改即可**，无需动代码。

---

### 10.14 用户交付文档

> ⚠️ **更正（2026-09-11）**：下面两行原写的 `E:\2026 公司网站\...` 路径**已过期**（实际不在该位置）。按 **§0.9**，这类"仓库外的用户本机文件"**不必记录路径**——**需要这两份文件时向用户索取**。原文保留仅为记录历史。

- **`E:\2026 公司网站\SEO操作指南.html`**（仓库外，用户本机）——面向用户的中文图文操作指南，含本次全部截图（图片存 `E:\2026 公司网站\SEO操作指南图片\`）。日后 GSC 相关操作变更，应同步更新此文件。
- **`E:\2026 公司网站\后台管理操作说明书.html`**（仓库外，用户本机）——日常操作手册，第 18 章为本次 SEO 变更。**改动站点的网址 / 收录 / 搜索相关行为后，应同步更新它**（改前先备份）。
  > ✅ **2026-09-11 已同步更新一次**：新增 18.13（全站标题优化 + 分享卡片尺寸修复 + 删除 LED 示例页），并修正 5 处已过期的 LED 示例页指引；页脚"最后更新"改为 2026-09-11。改前已备份（备份文件名含 `_20260911备份`）。

---

### 10.15 🏷️ 全站 SEO 元数据优化 + 分享卡片尺寸修复 + 删除 LED 示例页（2026-09-11）

> 来源：用户 2026-09-11 要求「看看有没有可以做的小的 SEO，也仔细再检查一下网站」。先做**只读体检**，出报告给用户过目，用户批准后再动手（本批全部为「**不显示在页面上**」的零风险改动）。
> 本节性质：**记忆性内容，只增不删**。§5 与 §10.7 中提及 `content/pages/led-display.json` 的旧位置已失效（该文件同日删除），已在 §5 就地加更正注解。

#### 10.15.0 全站体检结果（2026-09-11）

**健康（无需处理）**：13 页全部 200；**0 断链 / 0 裂图**（12 页 × 桌面 1366 + 手机 390 双端）；**0 横向溢出 / 0 文字被裁 / 0 控制台报错**；线上 `308` 跳转、真 `404`、sitemap、canonical、Schema 全部正常。

**发现的问题**（详见下面各小节）：

| # | 问题 | 性质 | 处理 |
|---|---|---|---|
| 1 | `og:image:width/height` 全站写死 1200×630，与实际图不符 | **真 bug** | ✅ 本次修复 |
| 2 | 页脚三个社交图标全部 `href="mailto:..."` | **真 bug（UX）** | ⏸ 用户决定**保持现状**（后台「站点设置→页脚→社交图标→链接地址」本就可填，等有内容用户自己加；留空即回退 mailto） |
| 3 | `/led-display` 是占位示例页、却在 sitemap 里（薄内容+孤岛页） | 内容问题 | ✅ 用户选择**直接删除** |
| 4 | 11 个页面 `<title>` 仅 14~33 字符、无采购意图词 | SEO | ✅ 本次优化 |
| 5 | 4 个页面 description 超长（176~208，会被截）、4 个偏短 | SEO | ✅ 本次优化 |
| 6 | `about-us` 无 H1、首页/旗杆/博客列表 H1 无关键词 | SEO（**会改版式**） | ⏸ **未动**，须与用户逐句商量（见「未处理」） |
| 7 | 404 页缺 `og:image`；`/admin/` 可被 Google 抓取 | 小细节 | ✅ 本次修复 |
| 8 | 首页 logo 声明 `36×36`、实际 `1613×1517`（差 6%） | 极轻微 | ⏸ 未动（圆形 logo 用 `object-fit:cover` 裁切，肉眼不可见；§10.12 已将其列为「有意保留的固定 UI 尺寸」） |

#### 10.15.1 `og:image:width/height` 改为自动读取（**本次最重要的修复**）

**问题**：`shell()` 里写死 `<meta property="og:image:width" content="1200">` / `height 630`，**全站 12 页无一例外**；而每页实际用的分享图各不相同：

| 页面 | 实际分享图 |
|---|---|
| 首页 / 关于 / 旗杆 / 博客列表 / 404 | 1259×562 |
| 羽毛旗 / 横幅 / 国旗 / 产品合集 / Stands / 博客文章 | 1600×66x |
| 汽车旗 / （原 LED） | 944×944 |

**后果**：社交平台**先读这两行、再下图**，按**错误比例**预留卡片位置 → 裁切错位 / 留白；严格些的抓取器可能干脆不显示图。

> 📌 **这与 §10.12「图片尺寸必须自动读取，不能写死」是同一类问题**——`og:image:width/height` 与 `<img width/height>` 的作用完全一样，都是「图片到达前先占好位」。**§10.11 做 og:image 时把图片换成了绝对网址，却把尺寸写死了，等于自己犯了 §10.12 刚总结过的错。**
> **教训**：**凡是"声明某个尺寸"的地方，都不能写死；这个站点换图很频繁，写死的数字必然会过期。**

**修复**（`build.mjs` 的 `shell()`）：

```js
const ogSize = ogImage ? readImageSize(ogImage) : null;   // 复用 §10.12 已有的能力
const ogDim = ogSize && ogSize.w && ogSize.h
  ? `\n  <meta property="og:image:width" content="${ogSize.w}">\n  <meta property="og:image:height" content="${ogSize.h}">`
  : '';   // 读不到就不输出这两行（宁缺勿错，退回平台自动判断）
```

> ✅ **用户以后换任何分享图，尺寸都会自动适配**，不会再出现这个问题。

#### 10.15.2 全站 `<title>` 与 description 优化

**改哪里**：`content/**/*.json` 的 `seo.title` / `seo.description`（后台各页的「SEO → 页面标题 / 页面描述」）；**博客列表页**比较特殊，它的标题/摘要在 `build.mjs` 里硬编码（无对应 content 文件），已就地修改。

**改动前后**（标题目标 50~60 字符、摘要 120~158 字符；**全部唯一、含采购意图词**）：

| 页面 | 旧 title（字符数） | 新 title（字符数） |
|---|---|---|
| index | Professional manufacturer of flags, banners, and poles \| WOLFLAG (64) | Custom Flags, Banners & Flagpoles Manufacturer \| WOLFLAG (56) |
| about-us | About Us - WOLFLAG (18) | About WOLFLAG: Custom Flag & Banner Manufacturer in China (57) |
| feather-flag | Feather flag - WOLFLAG (22) | Custom Feather Flags & Teardrop Banners Wholesale \| WOLFLAG (59) |
| banner | Banner - WOLFLAG (16) | Custom Banners & Street Pole Banners Manufacturer \| WOLFLAG (59) |
| national-flag | National Flag - WOLFLAG (23) | Custom National Flags & Country Flags Wholesale \| WOLFLAG (57) |
| pole-display | Flagpoles & Accessories - WOLFLAG (33) | Flagpoles & Accessories Wholesale Manufacturer \| WOLFLAG (56) |
| stands-displays | Stands & Displays - WOLFLAG (27) | Trade Show Displays & Exhibition Stands Wholesale \| WOLFLAG (59) |
| products | Full Products - WOLFLAG (23) | All Custom Flags, Banners & Displays Wholesale \| WOLFLAG (56) |
| car-flags | Car Flags - WOLFLAG (19) | Custom Car Flags & Car Window Flags Wholesale \| WOLFLAG (55) |
| blog（列表） | Blog - WOLFLAG (14) | Custom Flags & Banners Blog: Buying Guides & News \| WOLFLAG (59) |

**description** 同步重写（超长的缩短、过短的加长）：about-us 208→149、banner 176→152、feather-flag 182→151、national-flag 187→149、index 183→151、blog 66→150、stands-displays 111→149、car-flags 118→150；pole-display / products 微调。

> ✅ **这两项都不显示在网页上**，只出现在**搜索结果**与**浏览器标签栏**，**改动页面版式零影响**（已逐页比对确认）。

**⚠️ 仍偏短、故意未改的两处**：
- `404.html` 标题 24 字符——404 页本就不该被收录，无意义；
- **博客文章页** `${b.title} - WOLFLAG`（37 字符）——该标题**由文章标题自动拼接**，而文章标题同时是页面上可见的 H1，**不能为 SEO 去改**。
  **💡 建议**：给 `admin/config.yml` 的 `blog` collection 加两个**可选**字段（`seoTitle` / `seoDescription`，空则回退现有逻辑），并让 `build.mjs` 优先读取——这样以后每篇博客都能单独设搜索标题。**2026-09-11 已向用户报告，用户尚未决定；本条属"新增后台字段"，须先批准再动。**

#### 10.15.3 其他小修

- **404 页补 `og:image`**（`build.mjs` 的 404 `shell()` 调用加 `ogImage: home.hero.image`）——此前全站唯一没有分享图的页面。
- **`/admin/` 加 `noindex`**（`admin/index.html`）：后台登录页无对外内容。⚠️ **用 `noindex` 而不用 robots.txt 的 `Disallow`**——若 Disallow 了，爬虫读不到这条指令，反而可能仍被收录。

#### 10.15.4 删除 `/led-display` 占位页（用户决定）

**为什么删**：`content/pages/led-display.json` 是当初做「新增类目页」模板时留的**示例**——全页仅 **26 个英文词**、**不在任何导航里、全站无任何链接指向它**（「孤岛页」），内容写 `P10 Outdoor LED Display` 却配了张旗帜图；但它**在 sitemap 里**，等于主动请 Google 收录。**又薄又不对的页面被收录，会拖低整站质量评分。**

**怎么删**：`git rm content/pages/led-display.json` → 重新构建。该页由自动发现机制生成，删源文件即消失；**无需改导航**（本就不在导航里）。

**连带清理**：`admin/config.yml` 里三处把 `led-display` 当示例的提示文字（`slug` / `page.file` / `page.nav` 三个字段的 label/hint），已改为现存的 `stands-displays`——否则用户照提示填会指向一个已不存在的页面。

**结果**：`static/led-display.html` 消失、sitemap **12 → 11 条**、`/led-display` 正确返回 **404**（非软 404）。
> ⚠️ 若 Google 此前已收录该页，短期内可能仍能搜到，属正常缓存，会自行消失。

#### 10.15.5 验证结果（2026-09-11）

| 项目 | 结果 |
|---|---|
| **页面可见文字（改动前后逐页比对）** | ✅ **12/12 页 100% 一致**（**这是本次最关键的一条**：证明动的全是"看不见"的元数据） |
| 正文 `<img alt>` 属性 | ✅ 12/12 一致 |
| `og:image` 声明尺寸 vs 真实尺寸 | ✅ **12/12 全部相符**（改前 12/12 全错） |
| `node scripts/build.mjs` | ✅ 无报错 |
| 内部链接 / sitemap URL | ✅ 全部 200，零 404 |
| 图片加载（**滚动到底触发懒加载后**再统计） | ✅ **零裂图**（12 页 × 双端） |
| 手机端横向溢出 / 文字被裁 / 控制台报错 | ✅ 全部 0 |
| `/led-display` | ✅ HTTP **404** |
| `admin/config.yml`（坑 #10b / #16） | ✅ PyYAML 通过、顶层字段层级正确、未误嵌进 `products.fields` |
| 双端截图目检 | ✅ 桌面 1366 + 手机 390 正常 |
| 线上复验 | ✅ 已推送，见下方变更日志 |

> **✅ 体检方法论（可复用）**：本次新建了两个只读检查脚本（**放在仓库外的临时目录，不污染仓库**；临时目录路径无长期价值，故不记录）：`site_check.mjs`（逐页 × 双端：控制台报错 / 资源失败 / 横向溢出 / 文字裁切 / 坏图）与 `img_check.mjs`（**先滚完整页触发懒加载，再统计真实裂图**）。
>
> ⚠️ **一个必须记住的坑（本次踩到）**：**不滚动就统计"坏图"会严重误报**——`loading="lazy"` 的图片在进入视口前根本没开始下载，`naturalWidth` 为 0，会被当成裂图。**必须先滚到底、等一会儿，再统计**。第一次跑出"首页 3 张坏图"，实际是误报。
>
> ⚠️ **另一个：核对"页面文字有没有变"时必须只比 `<body>`**。第一版脚本把 `<title>` 也算进"可见文字"，导致 10 个页面误报"文字变了"——而标题本来就是要改的。**只比 `<body>` 内的文字，才是正确的比对。**

#### 10.15.6 ⏸ 本次**未**处理（等用户决定，勿擅自开工）

1. **`about-us` 缺 H1**（§10.4 P2-A）——H1 是页面上可见的大标题，加了会改变外观，须先确认文案。
2. **首页 / 旗杆 / 博客列表 / 羽毛旗 的 H1 无关键词**——均**驱动首屏版式**（如首页 H1 是 36px Catamaran、左栏固定 397px），改文案会改换行与版式，须逐句商量 + 双端截图。
3. **博客文章页标题偏短**——建议加 `seoTitle`/`seoDescription` 可选字段（见 §10.15.2）。
4. **页脚社交图标指向 mailto**——用户 2026-09-11 决定**保持现状**，等有账号内容后自己在后台补链接（后台字段已就绪，见 §2.1）。
5. **相对重要的「大工程」**：产品页正文太薄（§10.4 P0-A）、外链建设（P0-B）、博客选题（P2-D）——**均未动**。

---

### 10.16 ⚠️ 产品清单 Schema：`Product` → `ListItem`（2026-09-11，GSC 报错修复）

> **起因**：用户 2026-09-11 收到 Google Search Console 自动邮件——
> **"Product snippets structured data issues detected in wolflag.com"**
> `Top critical issues`：**Either "offers", "review", or "aggregateRating" should be specified**
> 邮件类别 `[WNC-10030322]`，为**自动批量通知，不是人工处罚**。

#### 问题根因

Google 对 **Product 富媒体**（搜索结果里带价格/星级的产品卡片）有硬性要求：
**条目标为 `Product` 时，`offers` / `review` / `aggregateRating` 三者至少要有一样。**

而本站 **7 个页面**（羽毛旗 / 横幅 / 国旗 / 旗杆展架 / Stands & Displays / 产品合集 / 汽车旗）由 `productListSchema()` 输出了 `ItemList` **内嵌 `Product`**，且按 §10.11 用户决定「**B2B 不写价格**」，也没有真实评价与评分
→ **Google 判为 Critical 错误。**

> 📌 **关键认知**：**那个富媒体位本来就拿不到**——它必须要价格或评分。所以这段 `Product` 标记的现状是：**拿不到展示位 + 让 GSC 报警 + 可能被反复邮件提醒**，**零收益**。
> ⚠️ **不要为了通过校验去填假价格或假评分**——那**违反 Google 政策，会被真处罚**（比丢一个展示位严重得多）。

#### 影响评估（先想清楚再动手）

| 会不会…… | 答案 |
|---|---|
| 影响页面被收录？ | ❌ 不会 |
| 影响搜索排名？ | ❌ 不会（**结构化数据出错不扣分**，这是 Google 官方口径） |
| 影响页面显示？ | ❌ 不会（这段代码在网页背后，客户看不到） |
| 影响什么？ | 只是**拿不到那个本来也拿不到的"带价格的产品卡片"** |

#### 修复（方案 A，用户 2026-09-11 批准）

`build.mjs` 的 `productListSchema()`：**条目类型 `Product` → 中性的 `ListItem`**，不再输出 `brand` / `manufacturer`（那是 `Product` 的属性，`Thing`/`ListItem` 没有）。

```js
{
  "@type": "ListItem",
  "position": i + 1,
  "name": p.name,
  "url": p.link ? absUrl(p.link) : pageUrl,   // 无独立产品链接时指向本页（Google 要求 ListItem 至少有 url 或 item）
  ...(desc ? { description: desc.slice(0,300) } : {}),
  ...(img  ? { image: absUrl(...) } : {}),
}
```

外层仍是 `ItemList`（`name` / `url` / `numberOfItems` / `itemListElement`），**依然不写价格**。
> 💡 **为什么保留 `ItemList` 而不是整段删掉**：`ItemList` 本身是合法且无害的（传达"这是一份产品清单"），沿用比整段移除改动更小、也保住了"清单"这个语义。

#### ⚠️ 什么条件下可以改回 `Product`

**只有当用户在页面上公开了价格（或起订价/价格区间）之后**，才可以把 `Product` + `offers` 加回来，那时才有资格拿产品富媒体位。**用户没主动提，就不要改回去。**

#### 验证结果（2026-09-11）

| 项目 | 结果 |
|---|---|
| **页面可见内容改前改后逐页比对** | ✅ **12/12 页 100% 一致**（又是一个"只动网页背后"的改动） |
| 改动落点 | ✅ 只在 `<head>`（羽毛旗页为第 24 行；`<body>` 自第 29 行起）——**正文零改动** |
| 全站 `Product` 标记 | ✅ **已清零** |
| JSON-LD 解析 | ✅ 全部合法，无语法错误 |
| 其余 Schema 未受影响 | ✅ Organization 12 / WebSite 12 / BreadcrumbList 10 / FAQPage 1 / BlogPosting 1 / **ItemList 7** |
| 内链 / 图片（双端 1366+390） | ✅ 零断链、零裂图 |
| 横向溢出 / 控制台报错 | ✅ 全部 0 |
| 构建 | ✅ 无报错 |

> ⚠️ **上线后 GSC 的红字不会立刻消失**：Google 要**重新抓取**这些页面才更新状态，通常**几天到几周**。判断标准＝GSC 里"商品摘要"错误数归零 / 该邮件不再重复。

#### 🔧 本次踩到的两个"自己工具的坑"（提醒未来 AI）

1. **用 `git show HEAD:<路径>` 取旧版本做对比时，Windows 下必须把反斜杠换成正斜杠**——`glob` 返回的是 `static\404.html`，直接拼成 `HEAD:static\404.html` 会取不到内容，**导致 12 个页面全部误报"内容变了"**。
2. **本地预览服务的端口要和检查脚本里写的一致**——本次把服务开在 8125、脚本里却写死 8123 → 全部 `ERR_CONNECTION_REFUSED`，**又一次全站误报**。
> 📌 教训：**"全站同时报错"几乎不可能是真问题**，先怀疑工具本身（与 §10.15.5 记的"不滚动就统计坏图会误报"同类）。**先验证工具，再相信结论。**

---

*最后更新：2026-09-11。**今日补充（二）：产品清单 Schema 由 `Product` 改为 `ListItem`（新增 §10.16）**——用户收到 GSC 自动邮件「Product snippets structured data issues」，Top critical issue 为「Either "offers", "review", or "aggregateRating" should be specified」。根因：**7 个产品页**由 `productListSchema()` 输出 `ItemList` 内嵌 `Product`，而按 §10.11 用户决定 **B2B 不写价格**、也无评价评分 → 触发 Critical。**关键判断**：Google 的 Product 富媒体**必须要价格或评分**，所以这段标记**本来就拿不到展示位**，现状是"零收益 + GSC 报警 + 可能反复收邮件"。⚠️ 明确记入：**绝不可为通过校验填假价格/假评分**（违反 Google 政策，会被真处罚）。**用户批准方案 A**：条目类型 `Product` → 中性 `ListItem`（不再输出 `brand`/`manufacturer`；`url` 优先用产品独立链接、没有则指向本页；外层 `ItemList` 保留），**依旧不写价格**。同时新增「**什么条件下可以改回 `Product`**」：仅当用户在页面上公开价格之后。验证：**12/12 页可见内容 100% 一致**、改动仅落在 `<head>`（正文零改动）、全站 `Product` 标记清零、JSON-LD 全部合法、其余 Schema 未受影响、双端零断链零裂图零溢出零报错。另记入**本次踩到的两个"自己工具的坑"**（提醒未来 AI）：① Windows 下 `git show HEAD:<路径>` 必须用正斜杠，否则取不到旧版 → 12 页全部**误报**"内容变了"；② 预览服务端口须与检查脚本一致（本次 8125 vs 8123 → 全部 `ERR_CONNECTION_REFUSED` **误报**）。**教训：全站同时报错几乎不可能是真问题，先怀疑工具本身——先验证工具，再相信结论。** 另已在 §10.11 的构建器表下就地加「⚠️ 更正（2026-09-11）」注解（保留原文不删，§0.1 铁律）。**今日补充：新增 §0.9「仓库外『用户本机文件』不必记路径」**——起因：同步《后台管理操作说明书.html》时发现 AI-GUIDE 里历史记录的 `H:\工作总集\...`、`E:\2026 公司网站\...` 等路径**在用户当前电脑上已对不上**（用户换过电脑/盘符）；用户指示**不改路径、加注释即可**，并说明"**我每次都会给出具体的路径**"。已加注解 5 处：§8（离线副本、`decap-proxy` 克隆）、§9.3（`cd` 命令）、§10.14（两份用户交付文档）、§0.6/§10.15.5（清单与说明），README 里那处路径同步去掉；历史路径**保留原文不动**（§0.1 铁律）。⚠️ **本次走过一段弯路，教训已写入 §0.9**：起初把用户的意思**放大成了"一律不记录任何本机路径"**的通用铁律（还据此改了 README、并往用户的全局记忆里写了一条），被用户当场纠正——"**我指的是不需要记《后台管理操作说明书.html》的路径，不是所有的路径都不用记**"。已全部回退/收窄：**规则改为只管"仓库外、属用户本机的文件"**，仓库内相对路径与技术配置信息**照常记录**；用户全局记忆里的那条已删除。**给未来 AI 的提醒已写进 §0.9**：用户是说要"不记某一类路径"，**不是**禁止记录一切路径——**别把用户指示放大成更宽的规则**（同 §0.1 末尾"改动范围严格限定在用户要求的那件事里"）。另：本次已**按用户批准同步更新了《后台管理操作说明书.html》**（新增 18.13 讲全站标题优化/分享卡片修复/删除 LED 示例页，并修正 5 处已过期的 LED 示例页指引、更新 6.1 SEO 字段说明、9.2 入口对比表、18.2 填写对照表、第 16 章页面清单、目录与页脚；改前已备份；HTML 标签闭合、25 个锚点、章节配平均校验通过，浏览器实开无报错）。**今日：全站 SEO 元数据优化 + 分享卡片尺寸修复 + 删除 LED 示例页（新增 §10.15）**——用户要求「看看有没有可以做的小的 SEO，也仔细再检查一下网站」。**先做只读体检、出报告给用户过目，批准后才动手**；本批全部为「**不显示在页面上**」的零风险改动。**① 体检结论**：13 页全 200、**0 断链 / 0 裂图 / 0 横向溢出 / 0 文字被裁 / 0 控制台报错**（双端 1366+390），线上 308、真 404、sitemap、canonical、Schema 均正常。**② 发现并修复的头号问题 `og:image:width/height` 写死 1200×630**（§10.15.1）：全站 12 页无一例外，而实际分享图各页不同（首页 1259×562、产品页 1600×66x、汽车旗 944×944）→ 社交平台按**错误比例**预留卡片位置、裁切错位甚至不显示图；修复=复用 §10.12 已有的 `readImageSize()`，**构建时自动读取真实尺寸**，读不到则不输出（宁缺勿错）。⚠️ **教训：这与 §10.12「图片尺寸必须自动读取」是同一类问题**——§10.11 做 og:image 时换了绝对网址却把尺寸写死，等于自己犯了刚总结过的错；**凡"声明尺寸"处都不能写死**。**③ 全站 `<title>`/description 优化**（§10.15.2）：标题原仅 14~33 字符（Google 可用 50~60）且无采购意图词，现全部改写为 **55~59 字符、含 custom/wholesale/manufacturer**；摘要超长的（176~208，会被截）缩短、过短的（66）加长至 135~152；改的是 `content/**/*.json` 的 `seo` 字段，**博客列表页因无对应 content 文件、在 `build.mjs` 中硬编码，已就地修改**。**④ 其他小修**（§10.15.3）：404 页补 `og:image`；`/admin/` 加 `noindex`（**用 noindex 而非 robots.txt Disallow**——Disallow 会让爬虫读不到该指令）。**⑤ 按用户要求删除 `/led-display` 占位页**（§10.15.4）：该页仅 26 词、不在导航、全站无入链（孤岛页）、内容写 LED 屏却配旗帜图，却进了 sitemap 会被收录，**反拖低整站质量评分**；`git rm content/pages/led-display.json` 后重建，页面消失、sitemap **12→11**、`/led-display` 正确 404；连带把 `admin/config.yml` 三处把 `led-display` 当示例的提示改为现存的 `stands-displays`。**⑥ 用户决定保持现状**：页脚三个社交图标仍指向 `mailto:`（后台「站点设置→页脚→社交图标→链接地址」本就可填，等用户有账号内容后自行补链）。**⑦ 验证（最关键）**：**12/12 页可见文字改动前后 100% 一致**（证明动的全是看不见的元数据）、`<img alt>` 12/12 一致、`og:image` 声明尺寸 12/12 与实际相符（改前全错）、零断链零裂图（双端）、构建无报错、`config.yml` PyYAML+层级校验通过、双端截图目检正常。**⚠️ 踩到两个统计坑并已纠正**：**不滚动就统计"坏图"会严重误报**（`loading=lazy` 的图未进视口根本没下载，`naturalWidth=0` 被当成裂图——首轮误报"首页 3 张坏图"，须**先滚到底再统计**）；**核对"文字有没有变"必须只比 `<body>`**（首版把 `<title>` 也算进去，导致 10 页误报"文字变了"，而标题本就该改）。**⑧ 本次未处理（等用户决定，勿擅自开工）**：`about-us` 缺 H1、首页/旗杆/博客列表/羽毛旗的 H1 无关键词（**均驱动首屏版式，改动会改外观**）、博客文章页标题偏短（建议加 `seoTitle`/`seoDescription` 可选字段，属新增后台字段须先批准）、以及内容/外链/博客三项大工程（§10.4）。**§5 中"结构见 led-display.json"已就地加「⚠️ 更正（2026-09-11）」注解，保留原文不删**（§0.1 铁律）。前次：2026-09-10。**今日补充（四）：§10.13 About 图文组合新增轮播区**——用户要求「工厂介绍第一张图固定不变、第二张图改为轮播展示工厂内部场景，参照首页轮播，且轮播时长要能在后台自己调整」。实现：`content/about.json` 的 textImg 块将原 `images` 语义收窄为「固定图片」，新增 `carousel{enabled, interval, images}`（原第 2 张移入轮播、interval 按用户要求设 8 秒）；`admin/config.yml` 的 textImg 新增 carousel 对象字段（原 images 改名「固定图片（不轮播）」）；`build.mjs` 渲染轮播容器（≥2 张才带 `data-interval`）；`site.css` 新增 `.it-carousel/.it-slide/.it-dot/.it-arrow`（淡入淡出、圆点、悬停淡入箭头、手机端箭头常显且缩小、`aspect-ratio:1200/899` 防高度跳动）；`site.js` 新增独立轮播逻辑（**单张时直接 return，不生成圆点箭头**）；轮播图与固定图均可后台增删改。验证：临时 4 张图实测自动切换正常、恢复单张后无圆点箭头、12 页文字 100% 一致、双端截图不破版、后台配置 PyYAML 与层级校验通过。⚠️ 已提示用户：轮播图比例宜与固定图（4:3 横图）接近，竖图会被裁切较多（但不会变形，因 §10.12 已自动读尺寸）。**今日补充（三）：§10.12 图片尺寸自动读取**——用户反馈羽毛旗页黄旗图在部分手机"旋转 90°"而另一台手机/电脑正常；Playwright 实测确诊：该图 2026-09-08 被用户在后台换成 1536×2048 竖图（比例 0.750），但 HTML 仍写死 width=280 height=320（比例 0.875）→ 浏览器按**错误比例**预留占位框，配合 object-fit:cover 在图片加载完成前产生严重视觉畸变；该图 1.5MB，慢网加载数秒故畸变可见，快网/已缓存则仅数十毫秒故看不见——**"两台手机不同"由此解释**。修复：build.mjs 新增零依赖的 readImageSize/parseImageSize(JPEG/PNG/GIF/WebP 三种)/dimAttrs，全站 13 处写死尺寸改为自动读取（保留 2 处固定 UI 尺寸）；**用户以后换任何图尺寸都自动适配**。顺带压缩 4 张大图 6.3MB→411KB（黄旗图 -92%），并修正「.jpg 实为 WebP」的扩展名。验证：6 张图声明比例与真实比例 100% 相符、Playwright 窄屏 attr==natural==rendered、双端截图正常、12 页文字 100% 一致、零 404。⚠️ 教训已写入 §10.12：图片变形/旋转先查 width/height；「只有部分设备出问题」往往指向加载时序，别因电脑正常就以为没事；**用户换图后必须检查尺寸声明是否匹配**。**今日补充：新增 §0.1「本文件是 AI 的记忆」第一条铁律**——用户强调本文件是 AI 跨会话的唯一记忆载体，**默认只增不删**；仅四种情况可删改（已失去作用 / 有害 / 已失去价值 / 用户明确批准）；发现旧内容不准确时应「保留原文 + 加更正注解」而非覆盖（§10.6 即为范例）；**禁止因"看起来乱/不够整洁"而重排或精简**（附当日反面教训：AI 写详细待办时顺手重排了章节号，内容未丢但用户记忆的编号全变，属超出授权）；同步在文件头加醒目提示、在 §10.4 说明「为何待办清单可删而记忆性内容不可删」。今日（两个阶段）：**① 建立 Google Search Console SEO 基础设施**（GSC 以 `Domain` 方式绑定 `wolflag.com`，DNS TXT 验证通过（验证码见 §10.1，**永久保留**）；35互联 DNS 后台**新增** TXT 而非覆盖 → 企业邮箱未受影响，双节点 `nslookup` 复核两条 TXT 并存；重新提交 sitemap（**须填完整网址**，只填 `sitemap.xml` 会报 `Invalid sitemap address`）→ Google 时隔 8 个月重新读取，`Discovered pages` **6 → 12**；产出用户侧图文指南 `E:\2026 公司网站\SEO操作指南.html`）。**② 修复头号收录障碍：全站网址去 `.html` 后缀（§10.7）**——GSC `URL Inspection` 实测发现 Google 对**全站所有 `.html` 网址**拿到 **308 重定向**（Cloudflare Pretty URLs），页面因而被判 `Page with redirect`、**不被收录**；`national-flag`/`pole-display` 命中该状态，`banner`/`feather-flag` 则 `URL is unknown to Google`。修复：`build.mjs` 新增 `cleanUrl()`、菜单/内链/博客/sitemap 全部改输出无后缀，`content/*.json` 的 `nav`/`link` 同步去后缀（**`page.file` 保留 `.html`**）；顺带补上全站缺失的 **`<link rel="canonical">`** 并修复 **`og:url`**（原 11 页全写死首页）。验证：**12 页可见文字与改动前逐页比对 100% 一致**、内部链接与 sitemap 全部 200 零 404、导航高亮逐页正常；新增本地自检工具 `scripts/_preview_server.py`（模拟 Cloudflare clean URL）与 `scripts/_check_links.py`。**纠正 §10.6**：此前误判"URL 混用"为非问题，实测后确认该 AI 这条**说对了**；教训已记入。⚠️ 无后缀依赖 Cloudflare Pretty URLs，**勿关闭该设置**。**⑤ 图片 alt 后台可填（§10.9）**——新增 **22 个 `imageAlt`/`blockImageAlt` 可选字段**（home/about/pages/specgrid/4 个产品页/product-details/pole-display/blog 全覆盖，含轮播图、简介照片、详情页多图等**列表型图片从 `field:` 简写改成 `fields:` 完整写法**，旧纯字符串数据仍兼容）；新增 `build.mjs` 的 **`altOf(对象, 兜底)` 助手**（优先读字段、没填回退品名/标题、兼容旧数据）；**真实内容图空 alt 62 处 → 0 处**（剩 44 处装饰图标 + 12 处 JS 占位图，属**规范上应保持为空**）；PyYAML + 字段层级 + 后台 `/admin/` 打开三项校验通过（无坑 #10b/#16）；**12 页可见文字与线上 100% 一致**；双端截图确认。**⑥ 图片文件名去中文（§10.10）**——12 个中文名 + `1.webp` 全部改为英文语义名（**逐张查看实际内容后命名，非字面直译**，如 `1.webp` 实为页脚 logo）；同步更新 7 个 JSON 引用（`car-flag-米黄背景` 被 2 处引用）；删除无引用的重复文件 `水滴型旗子.jpg`(892KB)；**验证：全站 75 个图片引用全部 200 零缺失、12 页可见文字 100% 一致、媒体库中文名清零**，线上复验通过。**⑦ Schema 结构化数据 + og/Twitter Card + 图片压缩（§10.11）**——此前全站 **0 个 JSON-LD**，现每页输出 Organization+WebSite，子页加 BreadcrumbList、产品页加 ItemList(内嵌 Product，**不写价格**)、About 加 FAQPage(6 条)、博客文章加 BlogPosting（用户确认：**成立 2003**、**工厂+贸易公司两个地址都写**、**不写价格**；⚠️ 2003 与版权行 2011 不一致，用户已知悉）；**og:image 由相对路径改为绝对网址并按页输出**（此前全站同一张相对路径图 → 社交分享卡片空白）、**补 Twitter Card**、**sitemap 加 lastmod**；**压缩 14 张大图**（首页图片 1211KB→991KB，`factory-direct-banner` -93%）；**修掉 9 个「扩展名 .jpg 实为 WebP」的文件**（服务端按扩展名回 image/jpeg 与内容不符）。验证：14 页 JSON-LD 全部合法、75 个图片引用 0 缺失、双端截图正常。另记入待办：`harvard-banner-building.webp`(含哈佛校徽) 与 `teardrop-feather-flag.jpg`(World Food Expo 展会图) 两处**属"换图"而非"改名"，本次未动**。**③ 新增 404.html 修复「软 404」（§10.8）**——实测发现 Cloudflare Pages 在无 `404.html` 时，把任意不存在的路径一律返回**首页内容 + HTTP 200**（`/zzz-nonexistent`、`/about-usweekly`、`pages.dev` 直连均复现），浪费抓取配额、掩盖真实死链；新增由 `notFoundBody()` 生成的 `static/404.html` 后，假路径正确返回 **HTTP 404**，12 个真实页面复检 100% 一致；`_preview_server.py` 同步模拟该行为。**④ 证伪某 AI 对 sitemap 的误判**——该 AI 称「sitemap.xml 格式严重畸变、URL 与 changefreq 拼接（如 `about-usweekly`）」，经 **XML 解析器实测证伪**（12 条 loc/changefreq 完全分离、标签闭合正常、`Content-Type: application/xml`）；其"畸形"实为**阅读工具剥离 XML 标签后的显示假象**（已本地复现），讽刺的是它警告的"大面积 404"恰恰反了——真实毛病是**该 404 时不 404**。另：裸域名 `wolflag.com` https 打不开待修（§10.5）；站内 SEO 待办清单见 **§10.4**（alt、Schema、canonical、og 等**已于同日完成**，详见其后各条；剩余为内容/外链/H1/Title/博客）。前次：2026-09-09。今日：**公告条手机端显示修复**（根因：`announce-item` 用 `white-space:nowrap + width:max-content` 只按电脑宽屏设计，手机窄屏长句被裁一半、滚动距离按视口宽算导致下一条和上一条重叠；已改 `width:100% + white-space:normal` 允许换行、容器高度由 site.js `sizeVp()` 依 `scrollHeight` 自适应；电脑端单行不受影响，双端 Playwright 截图验证通过）+ **新增 §0.8「任何改动必须同时考虑电脑端与手机端显示」最高优先级铁律**（用户 2026-09-09 强调：今后任何修改/改进/新增区块都需兼顾手机，两端难兼顾时先与用户商量）+ **坑 #17**（公告条手机显示教训）。前次：2026-09-09。今日：**公告条重构**（从全站顶部挪进页面内，只在首页/关于我们各一条且**独立配置**；字段 `{enabled,mode,bg,color,pause,scroll,items[{icon,text}]}`，`mode`=inout(首页:滚进停滚出) / slide(关于:当前滚出时下一条同步滚进)；build `announceBar()` 复用渲染、site.js 按 `data-mode` 分支、`.announce*` 样式、`.home-hero` 底带 71→24px 让首页公告条与栏目图间距 95→32px；About 顶部原 `.about-marquee` 删除；后台 home/about collection 各加 announce 字段（含 mode 下拉，防编辑时丢失）；图标 media/icon-megaphone/factory/globe/email.svg；首屏顶部公告已移除；见 §2.9）+ **首页 hero 轮播首张 cover、后张 fill**（`.hero-slide` 默认 cover，`.hero-slide:not(:first-child){object-fit:fill}`→后张完整显示、压缩/拉伸填满同一框、不裁剪，首张保持原样；2026-09-09 用户要求，见 §4）。前次：2026-09-09。今日：**About 页新增时间轴（年份大事记）**（新增第 6 种 About 模块 `timeline`：`{bg,title,autoPlay,interval,items[{year,text}]}`；年份横条+圆点、点年份切对应大字+文字；`items` **build 时自动按 `year` 升序**（最左最早、最右最晚，后台填错顺序也自动纠正）；自动播放**默认开**，每 `interval` 秒（默认5，建议5~8）跳到下一年、**到末位 `%years.length` 循环回第一个**；**悬停在某年份上 `mouseenter` 暂停、`mouseleave` 恢复**；手动点击 `go(i)+restart`；后台 About→页面模块→时间轴：背景色/标题/**自动播放开关**/**间隔秒数**/里程碑增删拖序；悬停/选中=鲑红 #f15d49（同顶部 marquee），线+圆点 #dfe3e2（同 FAQ 底），背景白 + 区块底部浅米黄分隔线 #f8f8f8，FAQ 背景改 #f8f8f8；build.mjs `renderAboutBlock` 加 timeline 分支 + site.js `go/start/stop/restart`（`data-autoplay`/`data-interval` 驱动）+ CSS `.tl-*` + config.yml about blocks `types` 加 timeline（字段校验通过）；见 §2.2/§4）。前次：2026-09-08。今日：**国旗产品页改版**（national-flags 卡片改为 品名加粗居中(.nf-card .p-name)→属性表(specs 自由增删，Size/Fabric/Printing 三行)→可选宣传语；size/material/printing 字段→specs，尺寸值去 "popular size:" 前缀；黑框印刷 chip(p-chip) 移除；后台表单同步更换并校验通过，见 §2.3/§4）+ **属性表改版**（f-spec/p-spec/sg-spec 去掉内层灰线框，改为左栏雾蓝 #eef1f4 + 右栏米白 #fafaf9 双色块、单元格 3px 白色缝隙（border-spacing，每格独立色块）；**pd-spec/pd-price 按用户要求保持原线框样式**，详情模板新页面也保持原样，见 §2.6/§4）+ **页脚间距与右对齐**（`.footer-grid` 改 `0.8fr 1fr 1fr auto` + 48px 列距，三块内容（工厂/杭州/电话邮箱）均匀排开，末列 auto 贴容器右缘=与上方内容框右对齐；原 4×1fr+6px padding 视觉仅 12px 太挤；杭州地址后台误合并成一行 `...St.hangzhou China`，已拆回两行 `St.` / `Hangzhou China`；页脚 logo `1.png`(153KB)→`1.webp`(36KB, quality 80)；见 §2.1/§4）+ **导航栏折行修复**（改复数菜单名后多词被叠成两行；`.nav-menu a` 加 `white-space:nowrap`、菜单间距收紧 gap 31→24、汉堡断点 900→1200px，见 §4/坑#15）+ **导航菜单名改复数**（Feather flag→Feather flags、Products→Full Products、National Flag→National Flags，仅显示文字、URL 不变）+ **羽毛旗 Teardrop 产品图转 WebP**（水滴型沙滩旗02.png 2.2MB→.webp 162KB，并删除旧 PNG）+ **Pinpoint 旗帜图文件名修复**（去掉手误的单引号字符 `pinpoint-旗帜-定版’.jpg`→`pinpoint-flag.jpg`）+ **羽毛旗产品页说明模块改版**（说明模块改为 Stands & Displays 同款：品名→属性表(specs)→宣传语(subtitle)，删 CTA；后台 feather-flags 字段 size/material/desc 改 specs+subtitle，见 §2.3/§4）+ **横幅产品页说明模块改版**（品名→属性表(specs)→宣传语(subtitle)，对照 specGrid；后台 banners 字段 desc/material/detail 改 specs+subtitle，见 §2.3/§4）+ **界面动效**（两个主按钮 Contact Us / Download Catalog 悬停轻微上移 2px + 柔色阴影；导航菜单产品名称悬停/选中=浅沙 #f5f0e8 圆角胶囊 + 加粗（padding 6px 12px + margin 0 -10px 防撑宽导航，移动端整行高亮），见 §4）+ **页脚联系图标**（地址/电话/邮箱前加内嵌SVG线框图标（定位/听筒/信封），地址每区块一图标、续行缩进对齐，见 §2.1/§4）+ **补充模块**（每页底部可加多个图文区（show/title/text/image），铺到首页/羽毛旗/横幅/国旗/Stands & Displays 五页，build.mjs `supplementSection()` 通用函数、后台 5 栏目均为 `widget:list` 可 Add 多个；默认全隐藏，见 §2.8）+ **图文区块显示/隐藏 + simple 布局渲染 sections**（sections 每块加 `show` 开关，`sectionsBlock(data)` 通用函数，`simpleBody`/`flexBody` 都用；products.json 底部可显示图文区块，见 §2.6）+ **首页 hero 多图轮播**（hero 加 `images[]/interval/mode`；淡入淡出+自动5s+悬停暂停+底部圆点+悬停左右箭头；site.js `hero-slider` 逻辑 + CSS `.hero-slider*`，见 §2.2/§4）。前次：2026-09-07。今日：**About 页内容模块化**（blocks 列表：text/image/textImg/clients/faq 五类，每模块可选背景色（Decap `color` 部件、十六进制、极简 10 色板）；图文可调方向/比例/每图独立上下位置；见 §2.2）；**新增 §0.6「改动推送上线并同步本地后，主动询问是否写进 AI-GUIDE/README」准则**；**specGrid 属性网格独立栏目**（content/specgrid、后台「属性网格类目页」、字段仅 品名/宣传语/属性/图片，避免混入他模板字段；宣传语改多行文本并移到产品属性下方）+ **全站产品图片点击放大**（悬停放大镜、点击弹全屏大图、Esc/点击恢复；链接卡保留跳转）；**正文加粗标记**：正文 `**文字**` 自动转 `<strong>`（build.mjs `bold()`，About 段落 + 博客 p/h2 已支持，其余仍转义保安全；CSS `p strong` 同色加粗）；**产品详情页规格表改为「产品属性」自由增删列表**（`specs[{label,value}]` 替代原 fabric/printing/size/moq/leadTime，`productSpecRows()` 兜底兼容；见 §2.6/坑附录）；新增 §0.5「**会话开场前必须先主动询问的两件事**」（① 网站更新要不要同步到本地；② 新上传图片要不要转 WebP；均以用户批准为前提，2026-09-07 用户要求）；**config.yml 全角逗号导致后台全线崩溃，已修（坑 10b）**；Products 合集页加 bannerImage 横幅 + 卡片 p.link 可点击；删除 Custom Flags 示例页（用户不要 flex 页，模板保留）；「产品详情页 vs 新增类目页」定位确认（见 §2.6）。前次：2026-09-06 **Products 合集页 + 导航子菜单 + 两个新模板（detail 产品详情：多图画廊/规格表/价格表/MOQ/交期/3 张可编辑服务卡/图文区；flex 通用图文）**，Banner 改为 Products 子菜单项（详见 §2.6）；**Blog 博客模块增强**：正文插图块（type:image，数量不限）；文章页右侧 All Posts 侧栏（所有文章、20 条/页、JS 翻页）；列表分页 20 篇/页（/blog-2.html…）；置顶 `pinned`（多置顶按时间倒序、取消即回时间序）+ PINNED 徽章；**Blog 博客模块**（列表页 /blog.html + 文章页 /blog/<slug>.html，content/blog/*.json 自动发现、draft 草稿开关、后台「博客文章」栏目、自动进 sitemap，详见 §2.5）；最新导航：…About Us / Blog / Contact Us 按钮；Feather flag 页顶部横幅（`bannerImage` 字段，后台「羽毛旗产品页→顶部横幅图片」可换，素材 media/feather-banner.webp 2000×825）；National Flag 页同款横幅（media/national-banner.webp 2000×837）；Banner 页同款横幅（media/banners-banner.webp 1952×806）；CSS 类统一为 `.page-banner`（原 `.feather-banner` 改名）；三页横幅加 12px 圆角；About 页工厂图下新增拼图（段距调 36px 使左右两列高度≈对齐）、工厂图 12px 圆角；页脚原地址已由后台改为 No 7 Weisan Road Zhapu Town（Zhapu/平湖）；**全站页脚统一完整页脚**（页脚策略变更，见 §3/坑 #6）；随线上后台更新同步拉取并重建 static。前次：2026-09-04 导航改名「Flagpoles & Accessories」；修复并新增「Stands & Displays」类目页（.md→.json + `format: json` 治本）；首页新增「Download Catalog (PDF)」金色按钮 + 后台上传入口；**后台登录 OAuth 修复实战**（Worker 密钥被错指为不存在的 Client ID → 404；登记回调与线上 Worker 版本不一致 → Invalid Redirect URI；两处对齐 + 重置 Client Secret 后恢复，实测登录通过），并新增 §9 排障手册。版本号按 git log 追踪。*
