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
    "sections": [ { "heading": "Wolflag factory", "lines": ["JianAn Rd., Fengjing Town,", "Jinshan District, Shanghai CHINA"] },
                  { "heading": "Hangzhou Loyal Import & Export co, ltd", "lines": ["Room 620, ...", "hangzhou China"] } ],
    "phones": ["+86 (571) 28239823", "+86 159 9018 9075"],
    "email": "tony@wolflag.com",                 // 兼容字段
    "emails": ["tony@wolflag.com", "tony@wolflagdisplay.com"],
    "logo": "/assets/media/footer-logo.webp",
    "icons": ["/assets/media/footer-icon-1.webp", "-2", "-3"],           // 社交图标
    "copyright": "© 2026 WOLFLAG. All Rights Reserved." } }
```

### 2.2 home.json / about.json
- `home.json`：`seo{title,description}`、`hero{title,text,image,features[2]}`（features=两个药丸 Professional/Reliable）、`intro{title,text,images[3]}`（**顺序敏感**：0=缝纫车间(home-factory)、1=旗帜喷印全景(home-workshop，中列药丸下方)、2=黄色印刷机(home-printing)；曾因 DOM 顺序≠视觉顺序而返工）、`categories{title,intro,items[4]}`（items：National flag→/national-flag.html、banner→/banner.html、Feather flag→/feather-flag.html、pole kits→/pole-display.html；**首页没有用 `factory` 字段，忽略它**）
- `about.json`：`seo`、`hero{title,subtitle,image}`（image=about-hero 顶部横幅）、`paragraphs[5]`、`factoryImage`（about-factory 480×400 右列）、`clients{title:"Our Clients",tagline:"Trusted by over 70+ clients",subtitle,logos[8]}`（8 张 client-01..08）、`faq[4]{q,a}`

### 2.3 products/*.json（4 个专用类）+ page 声明

**每个产品 JSON 必须带 `"page": { "file", "layout", "nav" }`**，这是自动发现注册表的钥匙：

| 文件 | file | layout | 特有字段 |
|---|---|---|---|
| feather-flags.json | feather-flag.html | `feather` | badge(徽标行), products[{name,size,material,desc,image}], cta |
| banners.json | banner.html | `bannerCards` | tagline, products[{name,desc,material,detail,image}] |
| national-flags.json | national-flag.html | `flags` | tagline, products[{name,size,material,printing,image}] |
| pole-display.json | pole-display.html | `pole` | subheading, subtext, featured[2]{name,desc,detail,tag,image}, ingredients{title,subtitle,items[6]{name,desc,image}} |

现有产品细节不要动，除非用户要求：feather 4 款（Feather/Leaf/Rectangle/Teardrop，Rect size 6.56ft*2.62ft、Teardrop 11.8ft*3.9ft；CTA 是**纯文本**非链接）；national-flags 6 旗（China/USA/EU/Malaysia/Kuwait/UN；**尺寸映射已验证**：China 3.15*2.1/4.72*3.15/6.3*4.2、USA 1.9*1/2.8*1.5/3.78*2、EU 3*5/3.3*6.6/4*6、Malaysia=Kuwait 2*1/4*2/6*3/8*4、UN 2*3/3*5/4*6）；banners 6 款（材质统一 comstom size/100% knitted polyester=原站拼写，**保留原拼写**）；pole 主卡2+配件6。

### 2.4 pages/*.json（新增类目页模板，见 §5）

> ⚠️ 只认 `.json`：`pages/` 与 `products/` 下的文件**必须**是 `.json`。后台已配置 `format: json`，正常会存成 `.json`；若看到 `.md` 说明格式不对，页面会被构建引擎**静默忽略、不生成**。

### 2.5 首页"下载产品手册"按钮（Download Catalog PDF）

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
4. **页脚策略**：`index.html` 与 `about-us.html` 用**完整页脚**；其余页用 **minimalFooter**（#212327、精确 384px 高、仅版权行——这是**原站行为**，不要"好心"统一成完整页脚）
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
feather 卡: 淡蓝边框 #d9e2f5 圆角10、size 行15px灰、标题18px/700、描述+CTA 12px**（用户要求非链接） |
| Pole | 46px/700 #1c1c1c 居中页头 + 16px 副文；大卡=**#f5f7ff 圆角12 554×614**、标题24px、desc15px、tag14px/700、图553×368 贴底全宽（负 margin -30px + max-width:none + flex-shrink:0）;BETTER INGREDIENTS = Bona Nova 28px/700 字距.18em；配件卡=无底色、图320×320 圆角16、标题 Rufina 20px、desc16px #272e47、列320px gap 94/75 居中 |
| About | hero 图 215px 高 cover（margin-top12）；marquee = **Acme 40px/700 #f15d49**（Quality Factory - 22 Years of Excellence，38s 循环），与正文同处 #f8f8f8 带内（pad 80px）；正文列 580px/16px/24px #272e47 段距0-8、图列 480×400 + margin-top161；客户区白底：label16px/700 #6b7280、tagline36px/45px #1f2937 max341、logo 128×86 4列 gap 31/16；FAQ #dfe3e2：标题44px、Q=Acme 20px/30px、A 16px/27px #545a6e、**箭头：关闭▼(rotate180)、展开▲(rotate0)** |
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
6. **产品页页脚就是极简版权带**（minimal footer），与首页完整页脚并存是**原站正确行为**，不要统一
7. Decap media path = `media_folder: "media"` / `public_folder: "/assets/media"`；改路径约定要三处同步（config.yml + build.mjs 拷贝逻辑 + 内容引用）
8. 现有 4 类产品 JSON 必须保留 `page` 声明字段（自动发现的钥匙）
9. JSON 注释不支持；字符串含双引号须 `\"` 转义；UTF-8 保存
10. **国内网络**：GitHub 直连常断，走代理 `git config http.proxy http://127.0.0.1:7890`（**实测可用端口=7890**；旧文档写的 26001 已失效——该端口无监听、连不上）；pip 用清华源；Playwright 截图用系统 Edge（`channel="msedge"`）无须下载浏览器；Google Fonts 国内可能加载慢（有回退字体兜底，不必强求）
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
- **后台登录 OAuth 已配置完成并实测通过（2026-08-24）**：GitHub OAuth App `wolflag admin`（Callback 登记**纯净** `https://decap.tony222.workers.dev/callback`，无 `?provider` 尾巴）；Cloudflare Worker `decap`（密钥 GITHUB_OAUTH_ID=Ov23liV3OrfRG3tL4IlZ、GITHUB_OAUTH_SECRET 见 wrangler secret）；config.yml 的 `repo/base_url` 已填实；本地克隆 `H:\工作总集\wolflag 网站信息\2026 公司网站\decap-proxy`（**已修改源码**：handleCallback 删除 provider 检查 + /auth 跳转改 302+no-store + redirect_uri 纯净）——Wrangler 登录用 `CLOUDFLARE_API_TOKEN` 环境变量（api token：Edit Cloudflare Workers 模板、建 token 时删 Zone Resources 行）
- 登录排障三字诀：client_id（选中复制，连字符/大小写）、callback 登记值、redirect_uri 三处逐字核对；state 不变 = 浏览器缓存旧 301，用无痕窗口
- 用户是中文母语、非程序员；沟通用中文、给可点击的步骤；一切改动以用户确认图片为准
- 全站目标对象：海外 B2B 买家（英文站点、询盘全靠邮箱/电话：tony@wolflag.com + tony@wolflagdisplay.com、+86 (571) 28239823）

---

*最后更新：2026-09-04。今日新增：导航改名「Flagpoles & Accessories」；修复并新增「Stands & Displays」类目页（.md→.json + `format: json` 治本）；首页新增「Download Catalog (PDF)」金色按钮 + 后台上传入口。版本号按 git log 追踪。*
