#!/usr/bin/env node
/**
 * WOLFLAG static site builder — zero dependencies, Node >= 18.
 * Reads content/*.json → renders static/*.html, copies media/ and admin/.
 *
 * Usage: node scripts/build.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, cpSync, readdirSync, existsSync, rmSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'content');
const MEDIA = join(ROOT, 'media');
const ADMIN = join(ROOT, 'admin');
const STATIC = join(ROOT, 'static');
const TMPL = join(ROOT, 'templates');

const j = (p) => JSON.parse(readFileSync(p, 'utf8'));

const settings = j(join(CONTENT, 'settings.json'));
const home = j(join(CONTENT, 'home.json'));
const about = j(join(CONTENT, 'about.json'));

/* 自动发现：content/products/* 与 content/pages/* 与 content/product-details/* 均注册为页面 */
const PAGE_DIRS = ['products', 'pages', 'product-details', 'specgrid'];
const pageFiles = {};   // key: json 文件名(不带扩展) -> 内容
for (const dir of PAGE_DIRS) {
  const abs = join(CONTENT, dir);
  if (!existsSync(abs)) continue;
  for (const f of readdirSync(abs)) {
    if (f.endsWith('.json')) pageFiles[f.replace(/\.json$/, '')] = j(join(abs, f));
  }
}

const SITE = 'https://www.wolflag.com';

/* ---------------- page registry（首页/关于页固定 + 产品页自动发现） ---------------- */

/** 文件在磁盘上仍叫 x.html，但对外公布的网址一律去掉 .html 后缀（2026-09-10）
 *  原因：Cloudflare Pages 对 /x.html 返回 308 → /x。若 sitemap/内链继续用 .html，
 *  Google 只能抓到"重定向页"，页面会以 "Page with redirect" 被排除收录。
 *  → 详见 AI-GUIDE.md §10.8。 */
const cleanUrl = (f) => {
  const noSlash = String(f).replace(/^\/+/, '');          // 先去掉前导斜杠（p.nav 可能自带 /）
  const stripped = noSlash.replace(/index\.html$/, '').replace(/\.html$/, '');
  return '/' + stripped;                                   // 首页 index.html → '/'
};

const PAGES = [
  { file: 'index.html', slug: '/', title: home.seo.title, desc: home.seo.description, nav: '/' },
  { file: 'about-us.html', slug: cleanUrl('about-us.html'), title: about.seo.title, desc: about.seo.description, nav: cleanUrl('about-us.html') },
];
for (const [key, data] of Object.entries(pageFiles)) {
  const p = data.page || {};
  const file = p.file || `${key.replace(/-$/, '')}.html`;
  if (!/(^|\.)html$/.test(file)) throw new Error(`bad page.file for ${key}: ${file}`);
  const url = cleanUrl(file);
  PAGES.push({
    file,
    slug: url,
    title: (data.seo && data.seo.title) || `${data.heading || key} - WOLFLAG`,
    desc: (data.seo && data.seo.description) || 'WOLFLAG products.',
    layout: p.layout || 'grid3',
    // nav 用于菜单高亮比对；内容 JSON 的 p.nav 可能仍带 .html（后台旧数据），去掉后缀再比对
    nav: p.nav ? cleanUrl(p.nav) : url,
    data,
  });
}

/* ---------------- helpers ---------------- */
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** 图片 alt：优先用内容里的 imageAlt/blockImageAlt 字段，没填则回退到兜底值。
 *  2026-09-10 新增——配合 config.yml 的「图片说明(alt)」字段（22 处）。
 *  用法：altOf(对象, '兜底文字')  或  altOf(对象, '兜底', 'blockImageAlt') */
const altOf = (obj, fallback = '', key = 'imageAlt') => {
  const v = obj && typeof obj === 'object' ? obj[key] : '';
  return esc(v && String(v).trim() ? v : fallback);
};

/** 列表型图片项取「图片路径」：同时兼容两种数据格式
 *  ① 纯字符串（旧格式，如 "/assets/media/x.webp"）
 *  ② 对象 { image, imageAlt }（后台「图片 + 图片说明」格式）
 *  2026-09-12 新增：后台的轮播图/简介照片/详情页多图早已是②，而旧数据是①——
 *  两者不一致会让 Decap 编辑该类列表时崩（TypeError: ...set is not a function），
 *  故数据升级为②的同时，构建端改为两种都认（零依赖、不改变任何现有输出）。 */
const imgSrc = (im) => (typeof im === 'string' ? im : (im && im.image) || '');

/** 正文加粗标记：**文字** -> <strong>文字</strong>；其余内容仍做 HTML 转义以保安全（无标记时等价 esc()）。
 *  规则：一对 ** 视为加粗段（中间不含星号、可含空格），可多处加粗混排。 */
const bold = (s) => String(s ?? '').split(/(\*\*[^*]+\*\*)/g).map((part) => {
  if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
    return `<strong>${esc(part.slice(2, -2))}</strong>`;
  }
  return esc(part);
}).join('');

// 页面内公告条（独立可编辑；一次一条居中、滚进→停→滚下一条→循环；ann=页面 JSON 的 announce 对象）
function announceBar(ann) {
  if (!ann || ann.enabled === false) return '';
  const items = (ann.items || []).filter((i) => i && i.text);
  if (!items.length) return '';
  const itemHtml = (it) => `<div class="announce-item">${it.icon ? `<img class="announce-ico" src="${esc(it.icon)}" alt="" loading="lazy">` : ''}<span class="announce-txt">${esc(it.text)}</span></div>`;
  const itms = items.map(itemHtml).join('');
  return `<div class="announce announce-page" data-mode="${ann.mode || 'inout'}" data-pause="${parseInt(ann.pause, 10) || 5}" data-scroll="${parseFloat(ann.scroll) || 7}" data-gap="${parseFloat(ann.gap) || 1.5}" style="--ann-bg:${esc(ann.bg || '#faf7f5')};--ann-fg:${esc(ann.color || '#272e47')}">
    <div class="announce-bound"><div class="announce-viewport"><div class="announce-track">${itms}</div></div></div>
  </div>`;
}

/* ---------------- 自动读取图片真实尺寸（2026-09-10，零依赖）
 *  背景：此前全站 HTML 把产品图尺寸写死成 width="280" height="320"（比例 0.875），
 *  但用户 2026-09-08 在后台把羽毛旗首图换成了 1536×2048 的竖图（比例 0.750）。
 *  声明与实际不符 → 浏览器按错误比例预留占位框，配合 object-fit:cover，
 *  在**慢速手机**上图片加载完成前产生严重视觉畸变（用户看到"旋转 90°"），
 *  快网/已缓存时加载极快，故电脑与另一台手机看不出问题。
 *  修法：构建时读取每张图的真实宽高，HTML 里填真值 —— 用户以后换任何图都自动适配。
 *  → 详见 AI-GUIDE.md §10.12 */
const imgSizeCache = new Map();

/** 读取图片真实尺寸。支持 WebP / JPEG / PNG / GIF；SVG 返回 null（矢量图不需要）。
 *  只读文件头几十字节，不整文件解码，构建开销可忽略。找不到或读不出返回 null。 */
function readImageSize(urlPath) {
  if (!urlPath || typeof urlPath !== 'string') return null;
  if (/\.svg$/i.test(urlPath)) return null;
  if (imgSizeCache.has(urlPath)) return imgSizeCache.get(urlPath);

  let result = null;
  // 内容里写的是 /assets/media/x.webp，磁盘上是 media/x.webp
  const rel = urlPath.replace(/^\/assets\/media\//, '').replace(/^\//, '');
  const abs = join(MEDIA, rel);
  try {
    if (existsSync(abs)) {
      const buf = readFileSync(abs);
      result = parseImageSize(buf);
    }
  } catch { result = null; }
  imgSizeCache.set(urlPath, result);
  return result;
}

/** 从图片字节里解析宽高（纯 Node，无依赖） */
function parseImageSize(buf) {
  if (buf.length < 24) return null;
  // PNG: 89 50 4E 47 0D 0A 1A 0A，IHDR 紧跟其后
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  // GIF
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
    return { w: buf.readUInt16LE(6), h: buf.readUInt16LE(8) };
  }
  // WebP: RIFF....WEBP
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const fmt = buf.toString('ascii', 12, 16);
    if (fmt === 'VP8 ') {          // 有损：帧头里 14 位宽高
      return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
    }
    if (fmt === 'VP8L') {          // 无损：位打包
      const b = buf.readUInt32LE(21);
      return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 };
    }
    if (fmt === 'VP8X') {          // 扩展：24 位宽高减一
      const w = (buf[24] | (buf[25] << 8) | (buf[26] << 16)) + 1;
      const h = (buf[27] | (buf[28] << 8) | (buf[29] << 16)) + 1;
      return { w, h };
    }
    return null;
  }
  // JPEG: 逐段扫描 SOF0/1/2 标记
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) { i++; continue; }
      const m = buf[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
        return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
      }
      if (m === 0xd8 || m === 0xd9 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  return null;
}

/** 生成 <img> 的 width/height 属性片段；读不到尺寸就返回空串（退化到旧行为，不会更糟）。
 *  scale 用于限制输出像素（如卡片图实际只显示 ~340px 宽，没必要写 1536）。 */
function dimAttrs(urlPath, scale) {
  const s = readImageSize(urlPath);
  if (!s || !s.w || !s.h) return '';
  let w = s.w, h = s.h;
  if (scale && scale < 1) { w = Math.round(w * scale); h = Math.round(h * scale); }
  return ` width="${w}" height="${h}"`;
}

/* ---------------- 结构化数据 Schema.org（2026-09-10 新增）
 *  目的：把"我们是谁/这是什么产品/常见问题"明确告诉 Google，争取富媒体展示。
 *  用户确认：成立 2003；工厂(平湖)+贸易公司(杭州)两个地址都写；产品不写价格。
 *  → 详见 AI-GUIDE.md §10.12 */
const ORG_ID = `${SITE}/#organization`;
const WEBSITE_ID = `${SITE}/#website`;

const ORG_ADDRESS = [
  { '@type': 'PostalAddress', streetAddress: 'No 7 Weisan Road, Zhapu Town',
    addressLocality: 'Pinghu', addressRegion: 'Zhejiang', addressCountry: 'CN' },
  { '@type': 'PostalAddress', streetAddress: 'Room 620, Jinshaju Building 2, Xuezheng St.',
    addressLocality: 'Hangzhou', addressRegion: 'Zhejiang', addressCountry: 'CN' },
];

/** 全站 Organization + LocalBusiness：每页都输出 */
function orgSchema() {
  const phones = (settings.footer.phones || []).map((p) => p.replace(/[^+\d]/g, ''));
  const mails = settings.footer.emails || [settings.footer.email];
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': ORG_ID,
      name: 'WOLFLAG',
      alternateName: 'Hangzhou Loyal Import & Export Co., Ltd',
      url: SITE,
      logo: absUrl(settings.logo),
      image: absUrl(home.hero.image),
      foundingDate: '2003',
      description: 'WOLFLAG is a professional manufacturer of custom flags, banners, feather flags, national flags, flagpoles and display stands, exporting from China since 2011.',
      address: ORG_ADDRESS,
      telephone: phones[0] || '',
      email: mails[0] || '',
      contactPoint: [{
        '@type': 'ContactPoint',
        contactType: 'sales',
        telephone: phones[0] || '',
        email: mails[0] || '',
        availableLanguage: ['en', 'zh'],
      }],
      sameAs: (settings.footer.icons || [])
        .map((i) => (i && typeof i === 'object' ? i.url : ''))
        .filter(Boolean),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': WEBSITE_ID,
      url: SITE,
      name: 'WOLFLAG',
      publisher: { '@id': ORG_ID },
      inLanguage: 'en',
    },
  ];
}

/** 面包屑：首页 > 本页（子页输出；首页自身不输出） */
function breadcrumbSchema(name, path) {
  if (!path || path === '/') return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name, item: `${SITE}${path}` },
    ],
  };
}

/** 产品列表 → ItemList（B2B 不写价格，只列品名/图/描述）
 *
 *  ⚠️ 2026-09-11：条目类型由 `Product` 改为中性的 `ListItem`（方案 A）。
 *  【为什么改】Google 对 Product 富媒体的硬性要求是「`offers` / `review` / `aggregateRating`
 *   三者至少有一项」，否则报 **Critical**：
 *   "Either 'offers', 'review', or 'aggregateRating' should be specified"（2026-09-11 用户收到 GSC 邮件）。
 *   而本站是 **B2B 询盘站、按用户决定「故意不公开价格」**，也没有评价与评分
 *   → **那个富媒体位本来就不可能拿到**（见 §10.11「产品价格：不写」）。
 *   既然拿不到，就没有理由继续声称「这是可购买的产品」——降级为「这是一份产品清单」，
 *   报错即消失，且**依旧不写价格**，页面可见内容**零变化**。
 *
 *  ⚠️ **绝对不要**为了通过校验去填假价格或假评分——那违反 Google 政策，**会被真处罚**。
 *  📌 以后若用户愿意在页面上公开价格/起订价，可再把 `Product` + `offers` 加回来。 */
function productListSchema(products, pageName, path) {
  const items = (products || []).filter((p) => p && p.name);
  if (!items.length) return null;
  const pageUrl = `${SITE}${path}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: pageName,
    url: pageUrl,
    numberOfItems: items.length,
    itemListElement: items.map((p, i) => {
      const img = p.image || (Array.isArray(p.images) && p.images[0]) ||
        (Array.isArray(p.images) && p.images[0] && p.images[0].image);
      const desc = p.subtitle || p.desc;
      return {
        '@type': 'ListItem',
        position: i + 1,
        name: p.name,
        // 有独立产品链接就用它；没有则指向本页（Google 要求 ListItem 至少有 url 或 item）
        url: p.link ? absUrl(p.link) : pageUrl,
        ...(desc ? { description: String(desc).slice(0, 300) } : {}),
        ...(img ? { image: absUrl(typeof img === 'string' ? img : img.image) } : {}),
      };
    }),
  };
}

/** FAQ → FAQPage（仅当页面有 FAQ 数据时） */
function faqSchema(items) {
  const qs = (items || []).filter((x) => x && x.q && x.a);
  if (!qs.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: qs.map((x) => ({
      '@type': 'Question',
      name: String(x.q).replace(/^Q\.\s*/, ''),
      acceptedAnswer: { '@type': 'Answer', text: String(x.a).replace(/^A\.\s*/, '') },
    })),
  };
}

/** 由若干 schema 片段组成 @graph（null 自动剔除） */
function schemaGraph(...parts) {
  const flat = parts.flat().filter(Boolean);
  if (!flat.length) return null;
  return { '@context': 'https://schema.org', '@graph': flat.map((p) => {
    const { '@context': _c, ...rest } = p;   // 外层统一给 @context，内层去掉
    return rest;
  }) };
}

function header(active) {
  // 菜单/子菜单网址一律走 cleanUrl 输出无后缀（.html → 无后缀，外链原样保留）；2026-09-10
  const navUrl = (u) => (typeof u === 'string' && u.endsWith('.html') ? cleanUrl(u) : u);
  const menu = settings.nav.map((item) => {
    const children = item.children || [];
    const cls = navUrl(item.url) === active ? 'active' : item.external ? 'more' : '';
    const ext = item.external ? ' target="_blank" rel="noopener"' : '';
    if (!children.length) {
      return `<li><a class="${cls}" href="${esc(navUrl(item.url))}"${ext}>${esc(item.label)}</a></li>`;
    }
    const sub = children.map((c) => {
      const cCls = navUrl(c.url) === active ? 'active' : '';
      const cExt = c.external ? ' target="_blank" rel="noopener"' : '';
      return `<li><a class="${cCls}" href="${esc(navUrl(c.url))}"${cExt}>${esc(c.label)}</a></li>`;
    }).join('\n          ');
    return `<li class="has-children">
        <a class="${cls}" href="${esc(navUrl(item.url))}"${ext}>${esc(item.label)}<span class="caret" aria-hidden="true">&#9662;</span></a>
        <ul class="nav-drop">
          ${sub}
        </ul>
      </li>`;
  }).join('\n      ');
  return `<header class="site-header">
  <nav class="navbar">
    <a class="nav-logo" href="/" aria-label="WOLFLAG home">
      <img src="${settings.logo}" alt="WOLFLAG logo" width="36" height="36">
    </a>
    <button class="nav-toggle" aria-label="Toggle menu" aria-expanded="false">&#9776;</button>
    <ul class="nav-menu">
      ${menu}
    </ul>
    <a class="nav-cta" href="${esc(settings.contactButton.url)}">${esc(settings.contactButton.text)}</a>
  </nav>
</header>`;
}

// 页脚联系信息线框图标（内嵌 SVG，颜色随文字 currentColor；电话/邮箱/地址；2026-09-08）
const ICO_PHONE = `<svg class="f-ico" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
const ICO_MAIL = `<svg class="f-ico" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`;
const ICO_PIN = `<svg class="f-ico" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;

function footer() {
  const cols = settings.footer.sections.map((s) =>
    `    <div class="footer-col">
      <h4>${esc(s.heading)}</h4>
      ${s.lines.map((l, i) => i === 0
        ? `<p class="f-line">${ICO_PIN}<span>${esc(l)}</span></p>`
        : `<p class="f-line-indent">${esc(l)}</p>`).join('\n      ')}
    </div>`).join('\n');
  const mails = (settings.footer.emails || [settings.footer.email]).map((e) =>
    `<p><a class="f-line" href="mailto:${e}" style="color:inherit">${ICO_MAIL}<span>${esc(e)}</span></a></p>`).join('\n');
  const phoneRows = settings.footer.phones.slice(1).map((p) =>
    `<p><a class="f-line" href="tel:${p.replace(/[^+\d]/g, '')}" style="color:inherit">${ICO_PHONE}<span>${esc(p)}</span></a></p>`).join('\n');
  // 社交图标：新格式 {icon,url}（url 为空则回退 mailto）；兼容旧格式字符串
  const socialIcons = settings.footer.icons.map((i) => {
    const url = i && typeof i === 'object' ? i.url : '';
    const src = i && typeof i === 'object' ? i.icon : i;
    const href = url ? esc(url) : `mailto:${settings.footer.email}`;
    const ext = url ? ' target="_blank" rel="noopener"' : '';
    return `<a href="${href}"${ext} aria-label="Social media"><img src="${esc(src)}" alt=""></a>`;
  }).join('\n');
  return `<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-col">
        <div class="f-brand"><img src="${settings.footer.logo}" alt="wolflag"></div>
        <div class="footer-social">${socialIcons}</div>
      </div>
      ${cols}
      <div class="footer-col">
        <p class="f-phone-main f-line">${ICO_PHONE}<span>${esc(settings.footer.phones[0] || '')}</span></p>
        ${phoneRows}
        ${mails}
      </div>
    </div>
    <div class="footer-bottom">${esc(settings.footer.copyright)}</div>
  </div>
</footer>`;
}

function minimalFooter() {
  return `<footer class="site-footer site-footer-minimal">
  <div class="container">
    <div class="footer-bottom">${esc(settings.footer.copyright)}</div>
  </div>
</footer>`;
}

/** 把站内图片路径补成绝对网址（og:image / twitter:image 规范要求绝对网址，否则抓不到）
 *  2026-09-10：此前 og:image 全站写的是 /assets/... 相对路径 → 微信/LinkedIn/Facebook 分享
 *  时取不到图、卡片空白。 */
const absUrl = (u) => (!u ? '' : (/^https?:\/\//i.test(u) ? u : `${SITE}${u.startsWith('/') ? '' : '/'}${u}`));

function shell({ title, desc, body, active, ogImage, footerMode, path, type, schema }) {
  // path = 本页对外网址路径（无后缀）。canonical 与 og:url 均按页输出（2026-09-10）
  const url = `${SITE}${!path || path === '/' ? '/' : path}`;
  const ogImg = absUrl(ogImage);
  // og:image:width/height 必须与该图真实尺寸一致（2026-09-11 修复）
  //   此前写死 1200x630，而实际图各页不同（首页 1259x562、产品页 1600x66x、汽车旗 944x944…）
  //   → 社交平台按「错误比例」预留卡片位置 → 裁切错位 / 个别抓取器不显示图。
  //   这与 §10.12「图片尺寸必须自动读取，不能写死」是同一类问题，且同样是换图后会过期。
  //   读不到尺寸就「不输出这两行」（宁缺勿错，退回平台自动判断）。
  const ogSize = ogImage ? readImageSize(ogImage) : null;
  const ogDim = ogSize && ogSize.w && ogSize.h
    ? `\n  <meta property="og:image:width" content="${ogSize.w}">\n  <meta property="og:image:height" content="${ogSize.h}">`
    : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${url}">
  <meta property="og:site_name" content="WOLFLAG">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:type" content="${type || 'website'}">
  <meta property="og:url" content="${url}">
  <meta property="og:locale" content="en_US">
  ${ogImg ? `<meta property="og:image" content="${esc(ogImg)}">${ogDim}` : ''}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(desc)}">
  ${ogImg ? `<meta name="twitter:image" content="${esc(ogImg)}">` : ''}
  <link rel="icon" type="image/png" href="/assets/media/favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Catamaran:wght@400;700&family=Antic+Slab&family=Bona+Nova:wght@400;700&family=Rufina&family=Acme&family=Roboto+Condensed:wght@400;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/site.css">
${schema ? `  <script type="application/ld+json">${JSON.stringify(schema, null, 0).replace(/</g, '\\u003c')}</script>` : ''}
</head>
<body>
${header(active)}
<main>
${body}
</main>
${footerMode === 'minimal' ? minimalFooter() : footer()}
<div class="site-lightbox" id="site-lightbox"><span class="sl-close" aria-hidden="true">✕</span><img src="" alt=""></div>
<script src="/assets/js/site.js"></script>
</body>
</html>`;
}

/* ---------------- page bodies ---------------- */

function homeBody() {
  const pills = home.hero.features.map((f, i) =>
    `<span class="tag-pill ${i === 0 ? 'fill' : 'line'}">${esc(f)}</span>`).join('');
  const imgs = home.intro.images;
  const photos = `
      <img src="${esc(imgSrc(imgs[0]))}" alt="${altOf(imgs[0], 'WOLFLAG printing workshop')}" loading="lazy" decoding="async"${dimAttrs(imgSrc(imgs[0]), 0.5)}>
      <div class="mid">
        <div class="tag-pills">${pills}</div>
        <img src="${esc(imgSrc(imgs[1]))}" alt="${altOf(imgs[1], 'Flags printing line')}" loading="lazy" decoding="async"${dimAttrs(imgSrc(imgs[1]), 0.5)}>
      </div>
      <img src="${esc(imgSrc(imgs[2]))}" alt="${altOf(imgs[2], 'Banner production machine')}" loading="lazy" decoding="async"${dimAttrs(imgSrc(imgs[2]), 0.5)}>`;
  const cards = home.categories.items.map((c, i) =>
    `<a class="cat-card ${i % 2 === 1 ? 'flip' : ''}" href="${esc(c.link)}">
       <span class="cat-img"><img src="${c.image}" alt="${altOf(c, c.title)}" loading="lazy" decoding="async"${dimAttrs(c.image, 0.5)}></span>
       <span class="cat-info">
         <span class="cat-title">${esc(c.title)}</span>
         <span class="cat-desc">${esc(c.text)}</span>
       </span>
     </a>`).join('\n');
  const supplement = supplementSection(home);
  const clients = homeClients();
  const heroImgs = (home.hero.images && home.hero.images.length ? home.hero.images : (home.hero.image ? [home.hero.image] : []));
  /* 2026-09-14 首页大标题拆两行：第一行 title（主标题，字大）+ 第二行 title2（副标题，字稍小）。
     两行字号由后台 hero.titleSize / hero.title2Size 控制，以 CSS 变量 --hero-l1 / --hero-l2 注入；
     未填则用 site.css 里的默认值。手机端字号在 CSS 里按同一比例自动缩小（见 .home-hero h1 的 900px 断点）。
     兼容旧数据：title2 为空 = 只显示一行，与改动前完全一致。 */
  const heroL1 = Math.round(Number(home.hero.titleSize)) || 0;
  const heroL2 = Math.round(Number(home.hero.title2Size)) || 0;
  /* 竖线分隔符颜色：后台「第二行竖线颜色」。只接受 #RRGGBB 这种合法值，防止拼进 style 属性出问题。 */
  const heroSepColor = /^#[0-9a-fA-F]{3,8}$/.test(String(home.hero.sepColor || '').trim())
    ? String(home.hero.sepColor).trim() : '';
  const heroSizeStyle = (heroL1 > 0 || heroL2 > 0 || heroSepColor)
    ? ` style="${heroL1 > 0 ? `--hero-l1:${heroL1}px;` : ''}${heroL2 > 0 ? `--hero-l2:${heroL2}px;` : ''}${heroSepColor ? `--hero-sep:${heroSepColor};` : ''}"`
    : '';
  const heroLine2 = String(home.hero.title2 || '').trim();
  /* 第二行的英文逗号 → 细竖线分隔符（2026-09-14 用户要求）。
     后台仍按普通句子填（用逗号分隔即可），这里自动拆成「片段 + 竖线」；
     竖线本身是纯装饰（aria-hidden），紧跟一个对读屏软件/搜索引擎可见的逗号，语义不丢。 */
  /* 分隔符「跟着前一段走」，但**不用 white-space:nowrap**（2026-09-14 晚修正，见 §10.26.10）：
     分隔符紧跟在前一段文字之后（中间**不留空格**），而空格只留在它的**后面**。
     空格才是断行点 → 换行时浏览器只能断在分隔符之后 → 分隔符自然落在行尾。
     这比 nowrap 安全：nowrap 会让「文字+分隔符」变成不可断行的整体，
     在 iOS「文字自动放大」等字号变大的场合会把网格列撑宽（实测复现，页面横向溢出）。
     2026-09-14 用户选定：分隔符由「1px 竖线」改为**小圆点 •**（用户原话「如果不好控制，
     就用小圆点代替竖线」）——点是**文字里真实存在的字符**，所以位置由字体自带、
     **不会像"边框画的线"那样跟着字体度量跑位**（竖线那一版就因此跑到基线下面去了）。
     圆点放在 span 里（不再是空 span），`aria-hidden` 保持装饰性，逗号语义仍由后面那个 sr-only 补。 */
  const heroParts = heroLine2.split(',').map((s) => s.trim()).filter(Boolean);
  const heroLine2Html = heroParts.length
    ? heroParts.map((s, i) =>
      esc(s) + (i < heroParts.length - 1 ? '<span class="hero-sep" aria-hidden="true">&#8226;</span><span class="sr-only">, </span>' : '')
    ).join(' ')
    : '';
  const heroTitleHtml = `<span class="hero-line1">${esc(home.hero.title)}</span>${heroLine2 ? `\n        <span class="hero-line2">${heroLine2Html}</span>` : ''}`;
  return `
  <section class="home-hero">
    ${settings.catalogButton ? `<a class="hero-catalog-btn" href="${esc(settings.catalogButton.file)}" download>${esc(settings.catalogButton.text)}</a>` : ''}
    <div class="container hero-row">
      <h1${heroSizeStyle}>${heroTitleHtml}</h1>
      <p class="hero-text">${esc(home.hero.text)}</p>
    </div>
    <div class="container hero-image">
      <div class="hero-slider" data-interval="${esc(String(home.hero.interval || 5))}" data-mode="${esc(home.hero.mode || 'carousel')}">
        ${heroImgs.map((im, i) => `<img class="hero-slide${i === 0 ? ' is-active' : ''}" src="${esc(imgSrc(im))}" alt="${altOf(im, 'WOLFLAG factory and products')}" ${i === 0 ? dimAttrs(imgSrc(im), 1).trim() : 'loading="lazy"'} decoding="async">`).join('\n        ')}
      </div>
    </div>
  </section>

  ${announceBar(home.announce)}

  <section class="section section-center">
    <div class="container">
      <h2 class="section-title">${esc(home.intro.title)}</h2>
      <p class="section-sub">${esc(home.intro.text)}</p>
      <div class="intro-photos">${photos}</div>
    </div>
  </section>

  <section class="main-products">
    <div class="container">
      <h2 class="eyebrow">${esc(home.categories.title)}</h2>
      <p class="intro">${esc(home.categories.intro)}</p>
      <div class="cat-grid">${cards}</div>
    </div>
  </section>${supplement}${clients}`;
}

/* ---------------- 首页「Clients & Partners」双排 logo 跑马灯（2026-09-13 新增）
 *  参考 AI-MICH Group 站同名区块，按本站规格重做：
 *   · 上排向左滚、下排向右滚；未悬停时整体灰阶，鼠标悬停某个 logo → 恢复彩色并微微放大。
 *   · 显示窗口套 .container + 内层 .hp-cl-clip 裁切 → 左右与上下模块对齐（同 About 跑马灯 §10.17）。
 *   · 无缝原理（与 .about-strip 同）：同一排 logo 输出 2 份、整体平移 -50%（= 正好一份宽）。
 *     ⚠️ 每个 logo 的间距用 **margin-right**（不是 flex gap）——轨道宽 = 2×(n 项 + n 间距)，
 *        半数恰好是一份；若用 gap，总宽是 2n 项 + (2n-1) 个间距，-50% 会差半个 gap，循环处跳一下。
 *   · 两排线速度一致：构建时读每张 logo 的真实宽高 → 算出该排“渲染宽度”总和 →
 *     按速度比分配两排各自的时长（--cl-dur / --cl-dur2）。否则 13 个与 12 个一排会一快一慢。
 *   · 同时把渲染尺寸写成 width/height 属性：logo 加载前就占好位，否则轨道宽度会边加载边变、画面抖动。
 *  数据：content/home.json 的 clients { enabled, bg, eyebrow, title, subtitle, speed, row1[], row2[] }
 *  排布：**row1 = 上排（向左滚）、row2 = 下排（向右滚），两个列表各自独立**（用户 2026-09-13 要求，
 *        原来是单个 logos 列表自动对半分，已废弃；下面的 logos 回退分支只为旧数据兜底）。 */
function homeClients() {
  const c = home.clients;
  if (!c || c.enabled === false) return '';
  const clean = (arr) => (Array.isArray(arr) ? arr : []).filter((l) => l && imgSrc(l));
  let rows = [clean(c.row1), clean(c.row2)];
  if (!rows[0].length && !rows[1].length && Array.isArray(c.logos)) {
    // 旧数据兜底：单个 logos 列表 → 对半分
    const half = Math.ceil(clean(c.logos).length / 2);
    rows = [clean(c.logos).slice(0, half), clean(c.logos).slice(half)];
  }
  if (!rows[0].length && !rows[1].length) return '';

  // 与 site.css 的 .hp-cl-* 桌面档一致（H=48 / MAXW=150 / GAP=56）；
  // 手机档按同比例缩小（34 / 106 / 40），故两排宽度之比不变、时长可直接复用。
  const H = 48, MAXW = 150, GAP = 56;
  const renderW = (l) => {
    const sz = readImageSize(imgSrc(l));
    const ar = sz && sz.w && sz.h ? sz.w / sz.h : 3;   // 读不到（SVG 等）按 3:1 估
    return Math.max(1, Math.round(Math.min(H * ar, MAXW)));
  };

  // 速度：`speed` = **每秒滚动多少像素**（数字越大越快）。两排各自按自己的宽度算时长
  //   dur = 该排宽度 / speed → 两排**线速度恒等**，且与 logo 数量无关。
  //   ⚠️ 这里刻意**不用**“一圈几秒”：那样一旦两排 logo 数量悬殊（比如上排 2 个、下排 15 个），
  //     就会算出 300+ 秒这种荒唐时长（实测踩到过）。按像素速度定义就永远正常。
  //   下排不单独设速度——两排不同速会明显看得出来（详见 site.css 注释）。
  const widthOf = (r) => r.reduce((s, l) => s + renderW(l) + GAP, 0);
  const speed = Number(c.speed) > 0 ? Number(c.speed) : 55;   // px/s
  const w1 = rows[0].length ? widthOf(rows[0]) : 0;
  const w2 = rows[1].length ? widthOf(rows[1]) : 0;
  const dur1 = w1 ? w1 / speed : (w2 ? w2 / speed : 40);
  const dur2 = w2 ? w2 / speed : dur1;

  const style = `--cl-dur:${dur1.toFixed(1)}s;--cl-dur2:${dur2.toFixed(1)}s;--cl-bg:${esc(c.bg || '#ffffff')}`;
  const item = (l, dup) => {
    const w = renderW(l);
    return `<li class="hp-cl-item"${dup ? ' aria-hidden="true"' : ''}>`
      + `<img class="hp-cl-logo" src="${esc(imgSrc(l))}" alt="${dup ? '' : altOf(l, '')}"`
      + ` width="${w}" height="${H}" decoding="async"></li>`;
  };
  // 不做 loading="lazy"：懒加载按“是否进入视口”判定，而滚动带里排在右侧的 logo
  // 一开始在视口外 → 不预载，等滚进来才开始下载 → 会看到空白/闪一下（同 .about-strip 的处理）。
  const track = (r) => `<ul class="hp-cl-track">${r.map((l) => item(l, false)).join('')}${r.map((l) => item(l, true)).join('')}</ul>`;

  const head = (c.eyebrow || c.title || c.subtitle)
    ? `<div class="hp-cl-header">
        ${c.eyebrow ? `<span class="hp-cl-eyebrow">${esc(c.eyebrow)}</span>` : ''}
        ${c.title ? `<h2 class="hp-cl-title">${esc(c.title)}</h2>` : ''}
        <div class="hp-cl-line"></div>
        ${c.subtitle ? `<p class="hp-cl-sub">${bold(c.subtitle)}</p>` : ''}
      </div>` : '';

  return `
  <section class="hp-clients" id="clients" style="${style}">
    <div class="container">
      ${head}
      <div class="hp-cl-clip">
        ${rows[0].length ? `<div class="hp-cl-row hp-cl-row--ltr">${track(rows[0])}</div>` : ''}
        ${rows[1].length ? `<div class="hp-cl-row hp-cl-row--rtl">${track(rows[1])}</div>` : ''}
      </div>
    </div>
  </section>`;
}

function nfBody(data) {
  // 2026-09-08: 国家旗卡片改为品名(加粗居中) + 属性表(specs, 雾蓝/米白/3px 新样式) + 可选宣传语
  const cards = data.products.map((p) => {
    const specRows = productSpecRows(p);
    const specHtml = specRows.length
      ? '<table class="p-spec">' + specRows.map((sp) => '<tr><th>' + esc(sp.label) + '</th><td>' + esc(sp.value) + '</td></tr>').join('') + '</table>'
      : '';
    return `
    <article class="product-card nf-card">
      <span class="p-img"><img src="${p.image}" alt="${altOf(p, p.name)}" loading="lazy" decoding="async"${dimAttrs(p.image, 0.5)}></span>
      <div class="p-body">
        <h2 class="p-name">${esc(p.name)}</h2>
        ${specHtml}
        ${p.subtitle ? `<p class="p-sub">${bold(p.subtitle)}</p>` : ''}
      </div>
    </article>`;
  }).join('');
  const banner = data.bannerImage ? `
  <section class="page-banner">
    <div class="container"><img src="${esc(data.bannerImage)}" alt="${altOf(data, 'National flags')}"></div>
  </section>` : '';
  const supplement = supplementSection(data);
  return `
  ${banner}
  <section class="page-hero">
    <div class="container"><h1>${esc(data.tagline)}</h1></div>
  </section>
  <section class="section">
    <div class="container">
      <div class="product-grid-3">${cards}</div>
    </div>
  </section>${supplement}${benefitsSection()}`;
}

/* ---------------- 「Why Source from Wolflag?」优势条（2026-09-15 新增） ----------------
   版式来源：用户指定的同行参考站 BuildASign 的 benefit-badges 模块，用 Playwright
   渲染后取 getComputedStyle 实测复刻（1600px 视口）：
     底条背景 #f9f9f9 ｜ 标题 24px·600·#333·居中·行高 32px ｜ 标题→栏 间距 24px
     每栏 padding 32px ｜ 图标 75×75 ｜ 文字 16px·500·#333·与图标间距 16px
     竖线 = 每栏 border-right 1px #d3d3d3（最后一栏不画）
   本站改造（用户要求，与参考站有意不同，勿当 bug 改回）：
     ① 参考站纯静态无交互；本站悬停 → 图标+文字变酒红 #A33335（同 FAQ 深红）
        ，图标上跳 6px（同首页药丸/按钮的 translateY 上浮语言）
     ② 悬停热区 = 整栏（不只图标），手机上手指也点得准
     ③ 内容套 .container，与上方区块左右同宽对齐（参考站是 1440px 满铺）
     ④ 响应式：>900px 五栏横排 ｜ ≤900px 三栏 ｜ ≤600px 两栏（末项居中跨列）
   图标：从参考站 SVG 抠出后清洗——去 <defs>/<style>、去重复 id、fill 改 currentColor。
   位置：加在 feather / flags / specGrid / pole 四种布局的正文末尾（= 页脚正上方）。 */
const BEN_ICONS = {
  price: '<svg fill="currentColor" xmlns=http://www.w3.org/2000/svg viewBox="0 0 384.75 384.75"><g><path d=M.75,181.89c.98-7.38,1.62-14.83,3-22.14C14.78,101.32,46.24,57.02,97.42,26.91,128.62,8.55,162.72.49,198.89,1.63c33.22,1.05,64.18,10.15,92.75,27.18,3.97,2.36,5.13,5.5,3.26,8.6-1.82,3.03-5.16,3.5-9.16,1.12-29.25-17.38-60.97-26.38-94.93-25.53-63.87,1.59-113.98,29.28-149.49,82.2-23.05,34.35-31.91,72.8-28.38,113.88,3.23,37.57,17.25,70.91,41.53,99.87.4.48.8.96,1.25,1.39.15.14.44.14,1.05.3.35-5.11.69-10.14,1.04-15.18.12-1.74.22-3.49.46-5.22.51-3.76,2.93-5.99,6.09-5.71,3.33.29,5.48,3.03,5.23,6.94-.5,7.84-1.1,15.67-1.65,23.51-.22,3.11-.33,6.23-.63,9.33-.46,4.69-2.78,6.67-7.43,6.36-10.72-.71-21.44-1.44-32.15-2.23-4.62-.34-7.02-2.66-6.73-6.31.29-3.63,3-5.38,7.69-5.05,5.92.41,11.84.76,18.54,1.19-2.66-3.37-4.84-6.05-6.93-8.79C17.19,279.25,4.16,245.19,1.37,207.24c-.07-.97-.41-1.93-.62-2.89,0-7.49,0-14.97,0-22.46Z></path><path d=M181.5,384.75c-7.16-.96-14.36-1.73-21.48-2.92-23.52-3.94-45.5-12.12-65.98-24.33-4.08-2.43-5.23-5.39-3.41-8.56,1.8-3.11,5.12-3.68,9.1-1.3,21.39,12.8,44.44,21.03,69.15,24.07,50.37,6.19,96.09-5.76,135.96-37.34,37.78-29.93,59.73-69.28,66.92-116.86.34-2.22.48-4.46.84-6.68.61-3.75,3.09-5.91,6.24-5.54,3.36.39,5.64,3.26,4.98,7.07-1.85,10.67-2.96,21.59-6.13,31.88-21.93,71.32-69.07,116.79-141.61,135.43-9.37,2.41-19.21,3.01-28.82,4.47-.85.13-1.68.4-2.51.6h-23.25Z></path><path d=M384.75,189.38c-.27.22-.61.39-.81.67-1.6,2.24-3.66,3.37-6.45,2.56-2.95-.86-4.03-3.01-4.17-5.93-.75-16.13-3.27-31.96-8.14-47.38-7.14-22.61-18.26-43.07-33.46-61.3-.56-.67-1.12-1.34-1.71-1.98-.15-.17-.41-.24-1.11-.62-.38,4.97-.75,9.73-1.11,14.48-.16,2.11-.14,4.25-.45,6.34-.53,3.66-3.21,5.88-6.33,5.46-3.2-.42-5.23-3.09-5-6.79.45-7.22.98-14.43,1.48-21.64.27-3.85.45-7.72.87-11.56.5-4.55,2.73-6.43,7.22-6.13,10.84.71,21.69,1.45,32.52,2.26,4.56.34,6.87,2.79,6.44,6.52-.4,3.47-3.03,5.13-7.52,4.83-5.92-.4-11.85-.76-18.63-1.2,2.65,3.38,4.81,6.05,6.88,8.77,22.66,29.72,35.6,63.18,38.79,100.4.09,1.1.43,2.18.66,3.26v8.98Z></path><path d=M179.89,304.46c-9.82-2.79-19.21-4.87-28.16-8.14-10.59-3.86-19.74-10.19-26.31-19.63-7.36-10.59-5.51-23.76,4.36-31.85,5.98-4.91,12.57-5.4,18.98-1.04,3.5,2.38,6.47,5.55,10.04,7.8,5.55,3.5,11.39,6.56,17.16,9.7,1.02.55,2.31.61,3.93,1,0-3.22-.09-5.95.02-8.66.15-3.43,2.52-5.8,5.6-5.79,3.1,0,5.56,2.34,5.66,5.79.15,5.11.17,10.23,0,15.34-.15,4.54-3.1,6.44-8.53,5.64-10.99-1.63-20.81-5.98-29.52-12.85-3.33-2.63-6.63-5.3-9.89-8.01-2.69-2.24-4.93-1.61-7.16.74-4.65,4.92-5.11,10.52-.9,16.27,6.23,8.5,15.04,13.57,24.82,16.54,7.58,2.3,15.53,3.53,23.39,4.69,6.23.92,7.82,2.2,7.83,8.47,0,4.24-.05,8.48.02,12.72.06,3.79,2.02,5.96,5.23,5.96,3.21,0,5.21-2.16,5.26-5.94.07-4.99,0-9.98.03-14.97.03-4.6,1.38-6.24,5.9-7.13,12.78-2.51,24.48-7.2,33.23-17.31,10.74-12.41,13.31-27.29,12.26-43.06-1.27-19.24-11.18-32.94-27.94-41.83-5.93-3.15-12.19-5.73-18.42-8.26-3.49-1.41-5.08-3.53-5.07-7.31.08-19.21.02-38.42.05-57.63,0-5.43,2.68-7.44,8.17-6.79,9.47,1.12,18.05,4.72,26.48,8.87,4.57,2.25,6.44,1.88,8.81-1.34,3.27-4.45,3.87-9.55.81-12.27-2.46-2.19-5.43-4.01-8.46-5.33-9.04-3.93-18.7-5.25-28.45-5.94-5.61-.4-7.34-2.07-7.37-7.58-.02-3.87.02-7.73-.01-11.6-.04-4.35-1.94-6.65-5.38-6.59-3.28.06-5.1,2.31-5.14,6.43-.04,4.37.03,8.73-.02,13.1-.05,4.5-1.71,5.9-6.03,7.08-8.02,2.2-16.39,3.9-23.76,7.54-18.09,8.96-24.58,24.82-23.85,44.24.69,18.41,10.5,30.72,26.44,38.6,7.02,3.47,14.38,6.32,21.7,9.14,3.95,1.52,5.65,3.9,5.56,8.15-.19,9.6,0,19.21-.09,28.82-.03,3.72-2.41,6.19-5.62,6.24-3.2.05-5.52-2.43-5.69-6.11-.04-.87-.02-1.75-.02-2.62,0-6.74-.15-13.48.07-20.21.1-3.06-.91-4.35-3.79-5.68-9.48-4.37-19.36-8.35-27.89-14.22-17.73-12.18-23.51-30.27-21.9-51.04,2.34-30.22,22.8-46.55,49.22-52.71,1.33-.31,2.67-.61,4.31-.98,0-3.68-.08-7.28.02-10.88.24-9.2,7.5-16.38,16.53-16.43,9-.04,16.38,7.15,16.65,16.3.09,3.1.01,6.21.01,9.5,5.95,1.09,11.72,1.94,17.39,3.23,8.09,1.84,15.85,4.61,22.28,10.12,6.52,5.58,8.22,12.57,5.52,20.6-2.6,7.74-6.88,14.29-15.76,15.01-3.84.31-8-1.32-11.78-2.69-5.68-2.06-11.17-4.66-17.63-7.42v5.07c0,13.85.09,27.7-.07,41.54-.03,2.91.88,4.16,3.55,5.51,8.54,4.33,17.32,8.48,25.05,14.04,15.05,10.83,21.91,26.43,23,44.67.58,9.77-.21,19.46-3.23,28.83-6.83,21.24-21.7,34.05-42.78,40.25-1.55.46-3.12.88-4.67,1.34-.23.07-.41.27-.87.58,0,3.94.09,8.05-.02,12.15-.23,9.19-7.51,16.38-16.54,16.42-9,.05-16.38-7.15-16.64-16.31-.1-3.59-.02-7.18-.02-9.89Z></path><path d=M201.76,237.77c0-9.22-.03-18.44,0-27.66.03-6.63,3.85-8.87,9.86-5.91,11.5,5.67,20.06,13.75,22.82,26.86,4.12,19.52-5.17,36.13-23.51,41.8-6.01,1.86-9.15-.41-9.17-6.69-.03-9.47,0-18.94,0-28.41ZM213.28,259.47c8-4.82,10.5-11.68,10.51-19.84.02-8.53-2.85-15.6-10.51-20.96v40.81Z></path><path d=M191.23,141c0,8.11.04,16.21-.01,24.32-.04,6-3.8,8.68-9.1,6.02-5.87-2.94-12.08-5.78-16.94-10.03-15.52-13.58-11.99-38.17,6.5-47.26,3.76-1.85,7.92-3.06,12.03-3.97,4.75-1.06,7.46,1.35,7.51,6.22.08,8.23.02,16.46.02,24.7ZM179.66,123.43c-7.34,1.54-12.28,7.46-12.51,14.8-.3,9.32,4.52,16.67,12.51,18.94v-33.73Z></path></g></svg>',   // Competitive Prices
  design: '<svg fill="currentColor" xmlns=http://www.w3.org/2000/svg viewBox="0 0 384 384"><g><path d=M241.03,294.92c0,2.9-.02,5.26,0,7.61.06,6.6,3.08,9.84,9.65,10.36,10.3.82,16.82,10.59,13.4,20.07-2.15,5.96-7.7,9.81-14.5,9.84-16.09.05-32.18.02-48.28.02-21.58,0-43.16.06-64.74-.03-10.71-.05-17.92-10-14.44-19.81,2.11-5.96,6.54-9.31,12.79-10.03,7.73-.89,10.28-3.59,10.3-11.27,0-2.1,0-4.2,0-6.77h-4.22c-27.82,0-55.64,0-83.45,0-19.5,0-32.09-12.56-32.09-32.02,0-50.52-.01-101.04,0-151.57,0-19.46,12.58-31.98,32.11-31.99,15.72,0,31.44,0,47.15,0,1.35,0,2.71,0,4.55,0-1.13-5.84,2.63-9.43,5.48-13.42,7.16-10.05,14.35-20.09,21.54-30.12,4.11-5.74,7.61-5.9,12.23-.53,9.6,11.16,19.12,22.38,28.8,33.47,2.57,2.95,4.67,5.87,3.66,10.31h18.15c0-1.23,0-2.55,0-3.87,0-12.1-.02-24.2,0-36.3.01-5.36,2.11-7.43,7.51-7.44,20.96-.02,41.91-.02,62.87,0,5.35,0,7.43,2.12,7.44,7.51.03,11.98,0,23.95,0,35.93,0,1.35,0,2.69,0,4.46,1.63,0,2.96,0,4.29,0,16.09,0,32.18-.03,48.28,0,18.48.04,31.25,12.81,31.26,31.33.03,50.9.03,101.79,0,152.69,0,18.76-12.73,31.53-31.43,31.54-27.94.03-55.89,0-83.83,0-1.35,0-2.7,0-4.5,0ZM276.96,91.32v4.74c0,43.53,0,87.06,0,130.59,0,6.59-1.82,8.38-8.47,8.38-20.21,0-40.41,0-60.62,0-7.1,0-8.76-1.67-8.76-8.83,0-43.41,0-86.81,0-130.22v-4.41h-17.96c0,5.35,0,10.45,0,15.55,0,30.68.11,61.37-.05,92.05-.1,20.07-16.19,35.9-36,35.85-19.76-.05-35.7-15.96-35.77-36.09-.12-34.3-.04-68.6-.04-102.9,0-1.46,0-2.92,0-4.72-1.6,0-2.81,0-4.03,0-16.09,0-32.18-.01-48.27,0-12.17.01-19.55,7.39-19.56,19.57-.01,44.03,0,88.06,0,132.09,0,1.3,0,2.61,0,3.83h311.39v-3.47c0-44.28.01-88.56,0-132.84,0-11.69-7.51-19.15-19.2-19.18-13.97-.03-27.94,0-41.91,0-3.46,0-6.92,0-10.74,0ZM37.6,259.18c-1.96,16.15,8.18,24.02,21.97,23.96,89.65-.37,179.3-.19,268.95-.19,14.36,0,22.04-9.1,19.91-23.77H37.6ZM211.29,211.09v11.74h53.44V43.71h-53.43v11.68c3.67,0,7.14-.03,10.6,0,4.41.05,7.09,2.32,7.12,5.94.03,3.62-2.67,5.96-7.05,6.02-3.56.05-7.12,0-10.89,0v11.83c9.24.47,11.92,1.61,11.85,5.61-.15,8.13-6.82,6.06-11.58,6.69v11.8c3.74,0,7.22-.04,10.7.01,4.34.06,7.04,2.46,6.97,6.08-.07,3.51-2.67,5.79-6.82,5.87-3.58.06-7.17.01-10.89.01v11.83c4.73.52,11.25-1.36,11.52,5.76.3,7.97-6.86,5.91-11.56,6.5v11.31c.28.25.37.4.46.4,3.49.05,6.98.06,10.47.13,4.15.09,6.75,2.35,6.82,5.86.07,3.64-2.62,6.03-6.97,6.09-3.57.05-7.14.01-10.69.01v11.8c9.12.6,11.84,1.86,11.6,5.93-.46,7.76-6.84,5.85-11.63,6.34v11.86c1.96,0,3.69,0,5.41,0,1.87,0,3.74-.04,5.61.01,4.1.12,6.7,2.48,6.67,6.01-.02,3.51-2.64,5.86-6.74,5.94-3.59.07-7.18.01-10.99.01ZM151.2,115.7c0,10.82.02,22.39,0,33.97,0,4.72-2.23,7.47-5.95,7.49-3.73.03-6-2.72-6.01-7.42-.03-10.35,0-20.69,0-31.04,0-1.33,0-2.65,0-2.95-6.44-3.07-12.09-5.77-17.96-8.57,0,.65,0,1.59,0,2.53,0,19.57-.04,39.14.01,58.71.04,13.93,10.33,24.58,23.71,24.68,13.57.1,24.11-10.55,24.16-24.6.07-19.69.02-39.39,0-59.08,0-.89-.19-1.77-.22-2.06-5.84,2.75-11.52,5.42-17.73,8.34ZM157.19,295.07c0,3.14.03,5.87,0,8.6-.17,11.45-8.21,20.16-19.6,21.12-2.15.18-4.25.38-4.22,3.06.04,2.95,2.34,3.01,4.59,3.01,36.79-.02,73.58-.02,110.37,0,2.26,0,4.55-.11,4.55-3.05,0-2.67-2.12-2.84-4.26-3.03-11.37-.96-19.4-9.7-19.56-21.16-.04-2.82,0-5.65,0-8.57h-71.87ZM142.94,47.15c-7.21,10.07-14.05,19.55-20.77,29.13-.7,1-.87,2.56-.85,3.85.18,10.54,7.84,19.95,18.14,22.42,10.67,2.56,21.81-1.98,26.6-11.73,3.94-8.03,5.21-11.59-1.56-18.74-7.42-7.84-14.16-16.31-21.56-24.93ZM121.29,196.26c-.36,11.13,3.7,19.34,13.21,24.17,8.92,4.52,17.65,3.45,25.59-2.63,6.72-5.14,10.29-14.33,8.48-21.15-15.61,11.32-31.22,11.24-47.28-.39Z></path><path d=M73.36,133.25c3.87,0,7.74-.08,11.6.02,3.82.11,6.33,2.57,6.33,5.96,0,3.39-2.52,5.9-6.35,5.94-7.73.1-15.47.1-23.2,0-3.82-.05-6.33-2.57-6.32-5.96,0-3.4,2.51-5.84,6.34-5.94,3.86-.1,7.73-.02,11.6-.02Z></path><path d=M67.01,121.23c-2,0-4,.14-5.98-.03-3.32-.28-5.59-2.79-5.6-5.91,0-3.12,2.26-5.76,5.57-5.92,4.23-.2,8.48-.2,12.71,0,3.32.15,5.6,2.76,5.61,5.89.01,3.11-2.27,5.66-5.57,5.94-2.23.18-4.49.03-6.73.04Z></path><path d=M241.03,132.87c0-22.83,0-45.66,0-68.49,0-1.25-.12-2.52.09-3.73.58-3.23,2.58-5.17,5.88-5.18,3.31,0,5.3,1.95,5.89,5.17.22,1.21.1,2.49.1,3.73,0,45.91,0,91.81,0,137.72,0,.37,0,.75,0,1.12-.03,5.05-2.16,7.84-5.99,7.84-3.84,0-5.98-2.76-5.98-7.83-.01-23.45,0-46.91,0-70.36Z></path></g></svg>',   // Customization Made Easy
  expertise: '<svg fill="currentColor" xmlns=http://www.w3.org/2000/svg viewBox="0 0 384 384"><g><path d=M.75,216.33c2.47-5.22,7.54-3.74,11.19-4.17.77-6.47,1.23-12.54,2.32-18.5.59-3.25,2.21-6.32,3.43-9.44,1.82-4.68,5.14-7.27,9.96-9.21,8.86-3.57,17.36-8.07,25.85-12.49,5.16-2.68,7.89-2.25,10.8,2.75,3.14,5.37,6.23,10.78,9.69,16.78,3.27-5.66,6.28-10.9,9.31-16.14,3.38-5.84,5.83-6.33,11.82-2.99,6.94,3.87,14.03,7.46,21.48,11.4.64-2.61,1.04-4.54,1.58-6.42.96-3.35,1.96-6.68,3-10,1.79-5.7,5.42-8.9,11.22-11.29,11.82-4.86,23.19-10.86,34.59-16.7,5.65-2.9,8.01-2.55,11.24,3.03,4,6.9,7.97,13.82,11.97,20.72.6,1.04,1.3,2.02,2.25,3.49,2.04-3.49,3.86-6.55,5.64-9.63,3.06-5.28,6.05-10.61,9.18-15.85,2.24-3.74,5.32-4.77,8.82-2.64,12.92,7.86,26.34,14.62,40.7,19.5,1.67.57,3.47,2.33,4.14,3.98,2.33,5.74,4.2,11.67,6.2,17.55.39,1.15.58,2.36,1.04,4.28,7.55-4.01,14.73-7.7,21.79-11.62,5.55-3.09,8.12-2.55,11.29,2.88,3.06,5.26,6.1,10.52,9.51,16.4,3.3-5.69,6.32-10.9,9.34-16.1,3.4-5.86,5.74-6.14,11.81-3,8.94,4.63,18.22,8.59,27.21,13.12,2.39,1.21,4.87,3.09,6.25,5.31,5.05,8.14,7.12,17.19,6.79,26.78-.04,1.23,0,2.46,0,4.15,1.62,0,3.09.04,4.55,0,2.96-.1,5.45.65,6.76,3.61,1.32,2.99.05,5.27-1.98,7.39-7.94,8.29-15.85,16.6-23.77,24.91-5.42,5.68-10.84,11.36-15.11,15.84,12.03,12.68,23.88,25.17,35.73,37.65,1.29,1.36,3.08,2.43,3.86,4.02.91,1.84,1.85,4.5,1.15,6.08-.78,1.77-3.3,2.89-5.26,3.95-.87.47-2.2.1-3.33.1-35.43,0-70.86.03-106.29-.06-3.1,0-5.12.76-7.17,3.34-35.41,44.58-103.33,44.23-138.39-.66-1.57-2.01-3.15-2.68-5.61-2.67-35.8.07-71.61,0-107.41.11-3.72.01-6.83-.63-9.13-3.71,0-1.5,0-2.99,0-4.49,4.98-5.02,10.01-9.99,14.91-15.08,8.96-9.29,17.85-18.66,26.92-28.15-6.05-6.34-12.78-13.32-19.44-20.38-7.5-7.96-14.94-15.98-22.4-23.97,0-1.25,0-2.5,0-3.74ZM192.35,187.64c-43.35.48-76.77,34.56-76.34,77.86.4,41.35,35.41,75.36,77.15,74.94,42.05-.42,76.06-35.16,75.6-77.24-.46-41.94-34.92-76.03-76.4-75.56ZM363.08,303.69c-1.41-1.48-2.24-2.39-3.11-3.24-9.87-9.7-19.75-19.39-29.61-29.09-4.61-4.54-4.68-7.03-.25-11.68,10.15-10.65,20.32-21.27,30.48-31.91.88-.92,1.69-1.91,2.93-3.32h-92.06c6.1,12.75,9.26,25.8,9.29,39.58.03,13.85-3.4,26.92-9.24,39.66h91.58ZM113.27,303.69c-12.35-26.53-12.37-52.77-.14-79.13H21.29c1.41,1.57,2.35,2.68,3.36,3.73,9.99,10.46,20,20.89,29.97,31.36,4.44,4.67,4.37,7.18-.22,11.69-9.86,9.7-19.75,19.39-29.61,29.09-.92.9-1.78,1.86-3.11,3.25h91.59ZM56.37,175.55c-8.6,3.79-16.8,7.38-24.96,11.03-.86.38-1.87.94-2.3,1.71-4.11,7.4-5.41,15.29-4.12,23.65h89.59c0-5.91-.03-11.51.01-17.11.02-2.84,1.29-6.42,0-8.32-1.41-2.1-5.14-2.6-7.81-3.89-4.99-2.41-9.94-4.89-15.02-7.4-3.99,6.92-7.82,13.61-11.72,20.27-3.61,6.18-8.54,6.13-12.18-.11-3.89-6.65-7.73-13.34-11.5-19.83ZM269.65,211.91h90.17c1-7.94.02-15.24-3.42-22.13-.57-1.14-1.49-2.42-2.58-2.92-8.33-3.83-16.74-7.48-25.44-11.32-3.25,5.59-6.63,11.52-10.12,17.39-1.79,3.02-2.87,6.91-7.43,6.98-4.61.07-5.73-3.82-7.52-6.83-3.53-5.95-6.94-11.96-10.24-17.66-7.46,3.44-14.47,6.63-21.42,9.93-.83.4-1.9,1.45-1.92,2.21-.14,8.07-.09,16.15-.09,24.35ZM170.17,143.01c-11.09,5.02-21.74,10.09-32.62,14.61-3.12,1.3-4.86,2.96-5.82,6.01-4.11,12.96-5.46,26.27-5.2,39.8,0,.26.35.52.61.87,17.22-18.11,38.22-27.75,62.03-28.68-6.37-10.94-12.84-22.05-19-32.61ZM258.28,204.99c.04-15.58-1.05-29.97-6.3-43.77-.39-1.02-1.41-2.09-2.41-2.54-11.53-5.2-23.11-10.29-35.01-15.55-6.18,10.52-12.74,21.68-19.11,32.5,24.03.95,44.94,10.6,62.83,29.36Z></path><path d=M153.9,74.94c-1.63-21.03,14.16-39.07,35.88-40.99,20.05-1.77,39.31,13.65,40.73,33.95,1.17,16.75-2.6,32.83-12.91,46.55-12.37,16.46-32.42,17.58-47,2.98-10.46-10.48-14.77-23.68-16.38-38.01-.17-1.49-.21-2.98-.32-4.48ZM192.45,45.81c-13.2-.05-24.98,9.74-26.31,22.85-1.31,12.88,1.68,25.09,9.17,35.77,11.07,15.81,27.24,14.64,36.27-2.45,4.49-8.5,6.29-17.75,7.14-27.25,1.39-15.59-10.64-28.87-26.26-28.93Z></path><path d=M313.1,158.23c-8.71-.13-14.53-2.67-19.13-7.33-12.2-12.36-16.53-27.55-13.19-44.28,2.94-14.75,17.65-24.68,32.27-23.32,15.89,1.48,28.47,13.65,28.71,29.27.19,12.73-2.71,25.04-10.81,35.45-5,6.42-11.51,10.18-17.86,10.22ZM310.78,95.18c-8.8-.02-17.41,6.28-18.61,14.87-1.65,11.7,1.01,22.65,9.31,31.48,6.51,6.93,14.7,6.24,20.42-1.35,1.55-2.06,3.05-4.38,3.76-6.82,1.6-5.46,3.06-11.01,3.93-16.63,1.76-11.39-7.27-21.52-18.81-21.55Z></path><path d=M105.03,115.16c-.68,9.4-2.49,18.51-6.94,26.93-6.02,11.4-15.54,17.13-26.38,15.92-5.26-.59-9.71-2.97-13.71-6.31-11.63-9.71-18.24-32-13.81-46.52,4.64-15.23,20.1-24.34,36.12-21.29,14.51,2.76,25.78,17.03,24.72,31.28ZM92.83,117.49c.87-12.01-5.95-20.34-16.14-22.06-9.36-1.57-19.34,4.71-21.18,14.18-2.07,10.63.62,20.62,6.92,29.32,7.54,10.42,18.05,9.66,24.51-1.45,3.98-6.83,5.38-14.38,5.9-20Z></path><path d=M155.7,310.27c1.1-8.13,1.95-16.45,3.44-24.65.79-4.38-.08-7.42-3.35-10.52-5.79-5.47-11.06-11.49-16.63-17.2-2-2.05-3.46-4.54-2-6.98,1.11-1.85,3.5-3.61,5.61-4.08,8.75-1.93,17.58-3.46,26.43-4.89,2.42-.39,3.64-1.53,4.71-3.56,3.98-7.61,8.15-15.12,12.17-22.71,1.41-2.66,3-4.98,6.37-4.95,3.38.03,4.9,2.44,6.3,5.08,4.08,7.7,8.14,15.41,12.46,22.98.77,1.36,2.61,2.62,4.15,2.94,8.65,1.78,17.37,3.27,26.07,4.83,2.82.5,5.39,1.35,6.33,4.43.92,3.01-.49,5.22-2.53,7.32-6.09,6.25-12.18,12.5-18.04,18.95-1.15,1.26-1.97,3.5-1.79,5.16.91,8.54,2.18,17.04,3.37,25.55.43,3.05.74,6.02-2.14,8.16-2.75,2.04-5.39.99-8.06-.32-7.72-3.77-15.49-7.43-23.18-11.25-2.04-1.02-3.68-1.19-5.86-.08-8.21,4.17-16.52,8.15-24.88,12-4.95,2.28-9.16-.7-8.95-6.2ZM230.03,256.78c-6.73-1.28-12.88-2.78-19.11-3.52-4.64-.55-7.39-2.66-9.37-6.76-2.72-5.64-5.88-11.08-9.18-17.19-3.55,6.59-6.83,12.43-9.85,18.4-1.62,3.2-3.95,4.81-7.48,5.36-6.62,1.03-13.2,2.36-20.37,3.66,5.02,5.28,9.54,10.24,14.29,14.95,2.65,2.62,3.52,5.39,2.88,9.08-1.12,6.55-1.84,13.18-2.8,20.32,6.62-3.18,12.75-5.93,18.67-9.04,3.35-1.76,6.25-1.57,9.52.11,5.91,3.04,11.97,5.8,18.45,8.91-.99-7.28-1.78-13.95-2.85-20.57-.55-3.37.14-6,2.6-8.45,4.83-4.83,9.45-9.86,14.58-15.26Z></path></g></svg>',   // Industry Expertise
  shipping: '<svg fill="currentColor" xmlns=http://www.w3.org/2000/svg viewBox="0 0 384.75 384"><g><path d=M384.75,315.88c-4.3,13.73-15.5,13.14-26.99,12.49-2.03,15.16-9.15,26.9-22.46,34.35-8.54,4.78-17.75,6.31-27.46,4.81-15.86-2.45-33.31-15.06-36.29-38.75h-100.41c-1.17,4.13-2.13,8.35-3.58,12.41-1.69,4.76-4.63,6.43-8.03,5.09-3.4-1.33-4.2-4.46-2.37-9.18,7.23-18.55-2.91-38.4-21.99-43.09-13.36-3.28-27.36,2.48-34.62,14.22-7.17,11.6-6.13,26.64,2.56,37.03,9.02,10.79,23.68,14.5,36.58,9.24,1.04-.42,2.03-.94,3.05-1.42,3.7-1.74,6.81-1.03,8.38,1.91,1.61,3.02.47,6.04-3.15,7.99-6.73,3.62-13.96,5.4-21.57,5.08-21.09-.87-37.79-15.74-41.25-36.56-.14-.86-.37-1.7-.6-2.77h-5.03c0,2.9.05,5.62-.01,8.33-.1,4.44-2.03,6.44-6.38,6.48-7.11.07-14.22.05-21.33,0-4.05-.03-6.55-2.25-6.53-5.62.02-3.35,2.53-5.54,6.59-5.58,5.34-.06,10.68-.01,16.22-.01v-3.84c-4.35,0-8.56.02-12.77,0-8.58-.04-12.66-4.07-12.68-12.55-.02-11.48-.03-22.95.02-34.43,0-1.98-.17-3.29-2.43-4.29-1.45-.65-2.96-3.05-2.92-4.63.05-1.75,1.45-4.13,2.97-5,1.85-1.05,2.44-1.98,2.38-3.95-.12-4.21-.04-8.44-.04-13-1.62-.09-2.94-.22-4.26-.22-9.85-.02-19.71.02-29.56-.03-4.71-.02-7.29-2.11-7.25-5.68.04-3.54,2.6-5.45,7.38-5.52.87-.01,1.75,0,2.62,0,8.86,0,17.71,0,26.57,0,1.35,0,2.69,0,4.27,0v-54.29c-3.91,0-7.85,0-11.78,0-2.49,0-4.99.04-7.48-.01-4.07-.08-6.58-2.21-6.61-5.54-.04-3.35,2.48-5.62,6.5-5.66,6.36-.06,12.71-.02,19.13-.02.22-.37.47-.64.56-.95,2.37-8.26,6.83-11.66,15.5-11.66,41.41-.01,82.83,0,124.24,0,5.47,0,10.94,0,16.56,0-1.01-5.32-2.28-10.25-2.86-15.27-4.67-40.84,13.55-76.3,49.39-96.2,1.93-1.07,2.61-2.24,2.55-4.37-.13-4.99-.1-9.98-.02-14.97.13-8.6,5.21-13.66,13.87-13.69,18.71-.06,37.42-.06,56.13,0,8.7.03,13.66,5.05,13.75,13.72.05,4.49.21,8.99-.06,13.47-.19,3.13.75,4.88,3.66,6.38,9.62,4.97,17.93,11.72,25.13,19.8,2.5,2.81,2.33,6.16-.13,8.31-2.32,2.03-5.48,1.77-8.05-.68-.45-.43-.85-.91-1.28-1.36-11.34-11.99-24.97-20.05-41-24.09-48.15-12.12-96.42,20.78-102.88,70.13-1.53,11.67-.56,23.1,2.51,34.44.87,3.21,2.13,4.51,5.8,4.47,23.2-.22,46.4-.03,69.6-.16,7.75-.04,13.93,2.6,19.1,8.45,9.17,10.37,18.64,20.48,27.98,30.69.92,1,1.86,1.98,2.95,3.15,9.16-5.7,16.74-12.86,22.67-21.59,18.03-26.55,20.69-54.63,7.74-84.09-.25-.57-.56-1.12-.79-1.69-1.43-3.46-.47-6.61,2.42-7.98,2.99-1.41,6.37-.37,7.65,3.19,3.07,8.52,5.77,17.17,8.44,25.83.8,2.58,1,5.35,1.48,8.03v15.72c-.22.94-.53,1.87-.65,2.82-3.43,27.81-16.51,49.97-38.97,66.66-.67.5-1.28,1.09-2.04,1.74.85,1,1.54,1.86,2.28,2.67,10.16,11.13,20.26,22.32,30.54,33.35,3.87,4.15,7.33,8.44,8.84,14.01v53.89ZM53.99,266.81c2.56,0,4.78,0,7.01,0,5.61,0,11.23-.09,16.84.08,3.54.1,5.87,2.47,5.89,5.52.03,3.04-2.32,5.36-5.81,5.58-1.86.12-3.74.05-5.61.05-6.07,0-12.15,0-18.26,0v12.85c.65.09,1.12.22,1.6.22,14.47.01,28.94.07,43.4-.06,1.46-.01,3.07-.85,4.34-1.7,14.77-9.94,33.85-9.93,48.6-.04,1.53,1.03,3.61,1.73,5.45,1.74,18.21.13,36.42.08,54.63.07,1.08,0,2.16-.14,3.23-.22v-118.44c-.98-.06-1.71-.15-2.44-.15-51.51,0-103.02.01-154.54-.05-3.41,0-4.56,1.26-4.54,4.65.11,19.71.05,39.41.07,59.12,0,.95.16,1.9.28,3.18,1.56,0,2.91,0,4.26,0,6.49,0,12.97-.07,19.46.06,3.52.07,5.87,2.45,5.89,5.49.02,3.03-2.31,5.35-5.82,5.61-1.86.14-3.74.06-5.61.06-6.06,0-12.11,0-18.31,0v16.37ZM373.32,283.16c-7.54-.87-9.56-1.96-9.58-5.58-.03-6.74,5.45-5.73,9.41-6.14,1.36-6.31-.28-11.22-4.88-15.17-1.13-.97-2.16-2.1-3.02-3.31-1.46-2.04-3.33-2.59-5.78-2.57-15.34.09-30.68.06-46.03.03-1.49,0-3.04,0-4.44-.42-2.58-.75-3.82-2.7-3.73-5.38.08-2.69,1.45-4.5,4.07-5.12,1.31-.31,2.72-.28,4.09-.28,11.48-.02,22.95,0,34.43-.02,1.27,0,2.53-.11,4.48-.19-1.37-1.57-2.17-2.5-3-3.41-16.32-17.87-32.96-35.45-48.8-53.73-6.22-7.18-12.73-10.92-22.23-9.66-4.29.57-8.72.08-13.08.11-.95,0-1.89.21-2.92.32v66.37c1.47.07,2.81.18,4.15.19,6.36.02,12.72,0,19.08.01,5.71,0,8.43,1.88,8.35,5.69-.08,3.69-2.76,5.52-8.18,5.53-7.11.02-14.22.03-21.33,0-9.16-.04-13.45-4.37-13.45-13.59-.01-19.96,0-39.92,0-59.87,0-1.44,0-2.89,0-4.39h-23.86v118.23c.5.14.73.27.96.27,19.33.02,38.67.07,58-.02,1.35,0,2.85-.74,4.02-1.53,15.25-10.25,33.91-10.24,49.19.08.9.61,1.94,1.43,2.93,1.44,10.32.11,20.64.06,31.16.06v-7.95ZM282.78,324.8c-.07,17.63,14.07,31.98,31.65,32.11,17.43.12,31.99-14.29,32.09-31.76.1-17.56-14.09-31.88-31.74-32.02-17.6-.15-31.92,14.03-32,31.68ZM259.27,43.49c20.75-6.82,40.9-6.61,61.31-.12,0-4.47-.12-8.33.04-12.18.11-2.61-.87-3.48-3.47-3.45-8.48.12-16.96.04-25.43.04-9.6,0-19.2,0-28.8,0-1.79,0-3.66-.17-3.65,2.47,0,4.22,0,8.43,0,13.23ZM215.44,302.61h-50.37c1.87,4.92,3.66,9.64,5.45,14.37h44.92v-14.37ZM227.04,302.53v14.58h44.68c1.89-5,3.7-9.77,5.52-14.58h-50.2ZM90.31,302.56h-36.18v14.6h30.66c1.84-4.87,3.63-9.59,5.52-14.6ZM373.48,302.67h-21.47c1.88,4.98,3.66,9.7,5.51,14.6,3.65,0,7.38.06,11.1-.02,2.69-.06,4.65-1.35,4.81-4.17.2-3.44.05-6.9.05-10.41Z></path><path d=M123.61,114.2c-15.71,0-31.41,0-47.12-.01-1.36,0-3.14.3-3.99-.41-1.65-1.39-3.56-3.24-3.94-5.18-.51-2.59,1.3-4.74,4.13-5.34,1.32-.28,2.73-.27,4.09-.27,31.54-.01,63.08-.01,94.61,0,1.37,0,2.77-.02,4.09.26,2.81.58,4.28,2.45,4.3,5.3.02,2.85-1.42,4.75-4.21,5.38-1.32.3-2.72.27-4.09.27-15.96.02-31.91.01-47.87.01Z></path><path d=M145.59,85.24c-15.32,0-30.64.02-45.96-.02-1.47,0-3.03-.09-4.38-.6-2.51-.94-4.03-3.18-3.15-5.6.69-1.9,2.67-3.46,4.37-4.81.71-.56,2.17-.19,3.29-.19,30.64,0,61.28,0,91.92,0,.75,0,1.5-.02,2.24.02,3.44.23,5.82,2.55,5.77,5.61-.04,2.89-2.32,5.21-5.53,5.55-.99.1-1.99.04-2.99.04-15.2,0-30.39,0-45.59,0Z></path><path d=M127.51,342.96c-9.98-.07-18.04-8.26-17.9-18.18.14-9.98,8.3-17.95,18.26-17.87,9.9.08,18.07,8.39,17.93,18.24-.14,9.95-8.29,17.88-18.3,17.81ZM127.77,318.15c-3.77-.05-6.89,3.04-6.89,6.83,0,3.69,2.84,6.61,6.54,6.73,3.83.12,7.01-2.81,7.13-6.57.11-3.69-3.04-6.94-6.77-6.99Z></path><path d=M295.62,127.51c4.47,0,8.33-.07,12.19.02,4.44.1,6.81,2.19,6.74,5.77-.07,3.48-2.3,5.37-6.62,5.42-5.61.06-11.22.06-16.83,0-4.71-.05-6.67-1.95-6.68-6.52-.04-12.84-.04-25.69,0-38.53.01-4.08,2.15-6.61,5.46-6.68,3.41-.07,5.71,2.6,5.73,6.86.05,9.73.02,19.45.02,29.18,0,1.34,0,2.68,0,4.49Z></path><path d=M156.06,140.03c-7.85,0-15.7.03-23.54-.01-4.12-.02-6.61-2.08-6.73-5.39-.12-3.48,2.46-5.8,6.72-5.81,15.94-.04,31.89-.04,47.83,0,4.01.01,6.58,2.31,6.58,5.62,0,3.32-2.53,5.55-6.57,5.57-8.1.05-16.19.01-24.29.01Z></path><path d=M96.6,140.03c-3.99,0-7.97.06-11.96-.02-3.82-.08-6.12-2.24-6.12-5.56,0-3.3,2.31-5.57,6.11-5.61,7.97-.09,15.95-.1,23.92,0,3.71.05,6.07,2.51,5.97,5.78-.1,3.11-2.41,5.29-5.96,5.38-3.98.1-7.97.02-11.96.02Z></path><path d=M17.42,217.31c-3.35,0-6.71.1-10.06-.03-3.55-.13-5.81-2.35-5.84-5.46-.03-3.11,2.17-5.53,5.72-5.63,6.7-.18,13.41-.18,20.11,0,3.79.1,5.94,2.54,5.77,5.89-.16,3.2-2.28,5.04-6.02,5.24-.25.01-.5.01-.74.01-2.98,0-5.96,0-8.94,0,0,0,0-.01,0-.02Z></path><path d=M14.62,266.85c2.49,0,4.98-.14,7.46.04,3.49.25,5.82,2.67,5.56,5.75-.28,3.34-2.27,5.23-5.6,5.31-4.97.12-9.95.15-14.92-.01-3.34-.11-5.5-2.38-5.59-5.34-.09-3.11,2.11-5.47,5.63-5.72,2.47-.17,4.97-.03,7.46-.03Z></path><path d=M284.43,68.35c0-1.37-.12-2.75.02-4.11.33-3.15,2.1-5.03,5.33-5.16,3.26-.13,5.28,1.72,5.68,4.77.37,2.82.28,5.73.07,8.58-.24,3.17-2.83,5.38-5.73,5.28-2.96-.1-5.15-2.37-5.37-5.63-.08-1.24-.01-2.49-.01-3.74,0,0,0,0,.01,0Z></path><path d=M354.83,138.63c-1.49,0-3,.13-4.47-.03-2.85-.32-4.52-2.05-4.77-4.87-.27-2.97,1.05-5.37,4.04-5.79,3.28-.46,6.7-.45,10-.11,2.99.31,4.57,2.55,4.45,5.52-.12,3.15-1.92,5.04-5.15,5.3-1.36.11-2.73.02-4.1.02,0-.01,0-.02,0-.03Z></path><path d=M225.07,138.63c-1.49,0-3,.14-4.47-.03-3.05-.37-4.69-2.37-4.81-5.28-.11-2.75,1.35-5.04,4.16-5.39,3.3-.42,6.71-.44,10.01-.09,2.98.32,4.52,2.51,4.4,5.54-.12,3.03-1.8,4.85-4.81,5.22-1.47.18-2.98.03-4.47.03Z></path><path d=M128.6,227.04c-5.84-6.29-12.1-13.23-18.58-19.96-5.02-5.21-5.01-6.74-.19-12.09,6.48-7.19,14.15-10.67,23.68-7.79,3.21.97,6.4,2.92,8.89,5.2,7.8,7.16,15.33,14.63,22.84,22.1,7.53,7.49,7.51,17.4-.02,24.85-7.44,7.36-14.94,14.67-22.52,21.89-9.31,8.87-21.9,8.58-31.03-.56-7.37-7.38-7.26-8.2-.04-15.52,6.04-6.12,11.76-12.54,16.97-18.12ZM121.15,199.88c6.84,7.44,13.47,14.73,20.2,21.93,3.56,3.8,3.65,6.53-.09,10.22-4.61,4.56-9.26,9.09-13.93,13.59-2.47,2.38-5.02,4.69-7.54,7.03,4.92,4.66,10.25,5.03,14.54,1,7.91-7.42,15.65-15.04,23.36-22.68,2.58-2.56,2.66-5.41.11-7.95-7.87-7.83-15.76-15.65-23.91-23.18-4.14-3.83-9.51-3.18-12.75.03Z></path><path d=M77.95,230.52c-2.99,0-5.97.05-8.96-.01-4.03-.08-6.46-2.27-6.42-5.68.04-3.28,2.38-5.46,6.19-5.51,6.22-.08,12.44-.07,18.66,0,3.84.05,6.15,2.18,6.21,5.47.06,3.45-2.32,5.63-6.36,5.72-3.11.06-6.22.01-9.33.01Z></path><path d=M332.59,324.79c.09,10.08-7.79,18.1-17.84,18.17-10.01.06-18.17-7.89-18.27-17.83-.1-9.87,8.05-18.16,17.92-18.23,10.02-.07,18.09,7.87,18.18,17.89ZM314.77,331.72c3.87-.08,6.7-3.12,6.56-7.03-.13-3.66-3.11-6.55-6.75-6.54-3.74,0-6.9,3.19-6.84,6.91.05,3.74,3.22,6.75,7.03,6.66Z></path></g></svg>',   // Fast, Reliable Shipping
  quality: '<svg fill="currentColor" xmlns=http://www.w3.org/2000/svg viewBox="0 0 384 384"><g><path d=M172.22,157.19h-4.89c-38.55,0-77.1,0-115.65,0-12.99,0-20.23-7.18-20.23-20.06,0-34.56,0-69.11,0-103.67,0-12.72,7.24-19.98,19.92-19.98,94.56,0,189.13,0,283.69,0,12.43,0,19.74,7.33,19.75,19.79.01,34.68.01,69.36,0,104.04,0,12.62-7.32,19.87-20.04,19.88-10.85.01-21.71.08-32.56-.04-3.15-.04-5.44,1.04-7.45,3.43-7.48,8.87-15.14,17.58-22.59,26.48-3.51,4.19-7.68,6.43-13.11,5.25-5.32-1.16-8.05-4.94-9.42-10.04-1.74-6.49-3.68-12.94-5.57-19.39-1.3-4.43-2.91-5.63-7.51-5.66-4.85-.03-9.7,0-15.12,0,3,20.21,1.77,39.93-3.76,59.88h4.23c18.21,0,36.43.08,54.64-.03,9.15-.05,16.94,2.56,21.16,11.21,4.41,9.03,2.73,17.76-3.09,25.68-1.49,2.03-1.92,3.34-.65,5.81,6.19,12.05,3.48,26.31-6.43,35.62-.81.76-1.64,1.5-2.68,2.45,3.76,6.76,5.09,13.94,3.51,21.58-1.6,7.74-5.53,13.8-12.25,17.42.44,4.16,1.49,8.12,1.14,11.96-1.2,13.3-13.02,23.76-27.24,23.92-21.08.24-42.17.41-63.24-.11-13.18-.32-24.27-6.01-32.67-16.45-4.54-5.64-10.5-8.7-17.64-9.44-3.41-.35-6.4-.1-9,3.07-2.95,3.6-7.39,5-12.08,5.01-14.1.04-28.2.13-42.29-.02-9.83-.1-17.63-7.84-17.65-17.67-.1-38.05-.09-76.1,0-114.15.02-10.02,7.84-17.73,17.89-17.81,13.97-.11,27.95-.11,41.92,0,7.06.06,12.46,3.34,15.74,9.61.98,1.87,2.09,2.2,4,2.4,12.02,1.24,19.96-4.47,25.56-14.5,6.44-11.53,9.26-24.11,10.87-37.05.32-2.59.5-5.2.8-8.41ZM261.68,180.72c1.45-1.65,2.42-2.75,3.38-3.86,6.98-8.15,13.99-16.26,20.91-24.46,4.13-4.9,9.26-7.29,15.7-7.22,10.97.11,21.95.04,32.93.03,6.35,0,8.23-1.88,8.23-8.24,0-34.42,0-68.85,0-103.27,0-6.37-1.87-8.24-8.22-8.25-26.19,0-52.38,0-78.58,0-68.1,0-136.2,0-204.3,0-6.01,0-8.29,1.86-8.3,7.03-.03,35.3-.03,70.59,0,105.89,0,4.46,2.26,6.81,6.62,6.82,40.16.04,80.32.04,120.48-.07,1.07,0,2.66-1.14,3.11-2.15,4.42-9.86,12.47-14.07,22.71-14.1,10.16-.03,18.14,4.2,22.12,14.1.77,1.92,1.77,2.31,3.59,2.27,4.86-.1,9.73-.05,14.59-.03,9.79.03,16.18,4.82,18.96,14.28,2,6.81,3.9,13.64,6.06,21.22ZM133.4,334.7c3.23.3,6.36.38,9.41.92,8.41,1.48,14.72,6.44,20.11,12.75,6.21,7.26,14.01,12.03,23.54,12.22,21.2.42,42.41.39,63.61.06,6.52-.1,12.08-3.39,14.82-9.76,2.39-5.56-.66-9.54-4.62-13.03-.09-.08-.18-.17-.26-.27-2.95-3.57-1.35-8.56,3.15-9.73,1.32-.34,2.71-.45,4.04-.76,5.9-1.36,9.67-5.89,9.97-11.96.3-6.15-2.32-10.95-6.48-15.34-1.46-1.54-2.61-4.64-2.05-6.47.56-1.83,3.22-3.71,5.31-4.24,4.5-1.16,7.63-3.57,9.56-7.63,3.19-6.71,2.15-15.92-3.56-20.62-3.52-2.89-3.09-6.59.36-9.6,1.4-1.23,2.95-2.36,4.1-3.81,3.15-3.98,5.27-8.43,2.89-13.47-2.22-4.69-6.75-4.98-11.25-4.91-1.12.02-2.25,0-3.37,0-17.96,0-35.92.02-53.88,0-9.79-.02-14.99-7.33-11.91-16.64.35-1.06.8-2.1,1.09-3.18,5.43-20.45,4.49-41.01.68-61.54-1.06-5.72-6.81-9.05-13.25-8.45-5.9.55-9.93,4.73-10.47,10.78-.72,8.07-1.27,16.16-2.32,24.19-1.58,12.16-4.22,24.06-10.4,34.86-6.48,11.34-16.05,18.21-29.16,19.71-3.16.36-6.38.32-9.62.47v105.45ZM121.26,280.33c0-18.46,0-36.93,0-55.39,0-5.87-1.99-7.85-7.85-7.86-12.72-.02-25.45-.02-38.17,0-5.88,0-7.86,1.98-7.86,7.85-.01,36.68-.01,73.35,0,110.03,0,5.87,1.99,7.86,7.85,7.87,12.6.02,25.2.01,37.8,0,6.36,0,8.24-1.87,8.24-8.23,0-18.09,0-36.18,0-54.27Z></path><path d=M71.04,67.57c4.31-.24,9.69,1,12.64-1.13,2.8-2.02,3.08-7.55,4.42-11.55,1.14-3.42,2.2-6.87,3.32-10.3.91-2.76,2.79-4.5,5.73-4.56,3.12-.07,5.11,1.71,6.06,4.62,2.21,6.74,4.47,13.47,6.54,20.25.58,1.9,1.46,2.53,3.41,2.5,6.86-.11,13.71.02,20.57-.07,3.19-.04,5.78.89,6.83,4.04,1.1,3.28-.36,5.72-3.1,7.66-5.39,3.81-10.61,7.88-16.09,11.56-2.22,1.49-2.46,2.85-1.62,5.22,2.19,6.22,4.07,12.55,6.18,18.79,1.02,3.01.93,5.74-1.72,7.76-2.81,2.13-5.56,1.39-8.22-.59-5.3-3.94-10.76-7.67-15.96-11.73-2.1-1.64-3.49-1.46-5.48.07-5.24,4.02-10.67,7.78-15.98,11.7-2.54,1.88-5.18,2.63-7.92.71-2.9-2.03-3-4.84-1.94-8,2.18-6.49,4.13-13.05,6.37-19.51.66-1.91.3-2.88-1.3-4-5.51-3.86-10.87-7.93-16.38-11.8-2.84-2-4.54-4.44-3.34-7.91,1.15-3.34,3.98-4.1,7.25-3.98,3.24.12,6.48.03,9.72.03v.22ZM79.68,79.87c2.81,2.72,7.29,5.15,8.4,8.65,1.14,3.59-1.01,8.22-1.8,12.82,2.33-1.68,4.48-3.13,6.53-4.72,2.97-2.3,5.86-2.35,8.88-.1,2.12,1.58,4.32,3.04,7.41,5.21-1.11-3.47-1.78-5.83-2.62-8.13-1.4-3.81-.57-6.76,2.91-9.02,2.17-1.41,4.17-3.07,7.11-5.26-3.87,0-6.48-.06-9.09.01-3.75.1-6.12-1.54-7.19-5.19-.75-2.54-1.7-5.01-2.63-7.71-2,4.16-2.89,9.16-5.84,11.25-3.1,2.2-8.17,1.6-12.06,2.18Z></path><path d=M166.54,67.34c3.37,0,6.74-.14,10.1.05,2.37.14,3.54-.58,4.23-2.97,1.69-5.86,3.73-11.61,5.55-17.43,1.08-3.44,2.2-6.92,6.61-6.97,4.4-.06,5.66,3.32,6.74,6.8,1.82,5.82,3.85,11.58,5.54,17.43.72,2.5,1.93,3.24,4.49,3.16,6.6-.2,13.21,0,19.82-.09,3.2-.04,5.75.95,6.78,4.1,1.01,3.1-.24,5.53-2.88,7.41-5.48,3.9-10.84,7.99-16.37,11.81-1.95,1.35-2.51,2.52-1.66,4.87,2.16,5.96,3.97,12.05,5.98,18.07,1.09,3.25,1.71,6.44-1.5,8.81-3.18,2.35-6.03,1-8.83-1.11-4.98-3.75-10.13-7.26-15.06-11.07-2.09-1.62-3.6-1.79-5.79-.08-5.21,4.05-10.66,7.79-15.98,11.71-2.55,1.88-5.2,2.57-7.92.64-2.71-1.93-2.99-4.62-1.97-7.67,2.02-6.02,3.67-12.17,5.98-18.07,1.32-3.38.48-5.06-2.36-6.92-5.1-3.34-9.89-7.16-14.89-10.66-2.86-2-4.49-4.49-3.26-7.93,1.11-3.12,3.76-4.02,6.93-3.91,3.24.11,6.48.02,9.72.02ZM182.28,100.61c3.38-1.83,7.01-5.33,10.62-5.31,3.8.02,7.58,3.4,11.67,5.47-.79-2.5-1.49-4.98-2.35-7.4-1.32-3.69-.44-6.53,2.86-8.71,2.2-1.46,4.26-3.12,7.27-5.34-3.7,0-6.16.02-8.63,0-4.86-.04-6.28-1.09-7.88-5.75-.8-2.33-1.63-4.65-2.78-7.92-1.18,3.48-2.1,5.8-2.74,8.19-1.08,4.03-3.66,5.68-7.71,5.5-2.53-.11-5.06-.02-7.75-.02,3.38,3.21,7.87,5.59,8.99,9.06,1.16,3.6-.93,8.25-1.56,12.23Z></path><path d=M262.71,67.34c2.87,0,5.77-.26,8.59.07,3.34.39,4.84-.81,5.74-4.03,1.7-6.11,3.92-12.07,5.8-18.13.95-3.06,2.69-5.18,5.99-5.22,3.49-.05,5.27,2.16,6.26,5.37,1.98,6.42,4.25,12.75,6.17,19.19.67,2.24,1.75,2.86,3.97,2.81,6.48-.14,12.97.03,19.45-.08,3.38-.06,6.37.53,7.55,4.09,1.22,3.71-.85,6.06-3.76,8.08-4.81,3.33-9.38,7.03-14.28,10.23-2.93,1.92-3.85,3.68-2.45,7.2,2.29,5.77,3.87,11.82,5.86,17.71,1.02,3.02.89,5.74-1.77,7.74-2.82,2.11-5.57,1.34-8.22-.64-4.89-3.65-9.98-7.06-14.74-10.87-2.75-2.2-4.79-2.45-7.64-.1-4.42,3.64-9.25,6.76-13.84,10.19-2.83,2.12-5.7,3.95-9.13,1.53-3.64-2.56-2.61-6.01-1.46-9.45,1.97-5.9,3.73-11.88,5.86-17.72.82-2.24.23-3.32-1.56-4.57-5.21-3.63-10.24-7.54-15.46-11.15-3.03-2.1-5.26-4.49-3.9-8.35,1.32-3.74,4.6-4.06,8.03-3.93,2.99.11,5.98.02,8.98.02ZM270.27,78.81c.13.4.26.81.4,1.21,2.25,1.65,4.5,3.32,6.76,4.96,2.77,2,3.65,4.56,2.55,7.85-.88,2.63-1.64,5.29-2.78,9.01,2.98-2.14,5.05-3.5,6.98-5.04,3.2-2.58,6.29-2.53,9.5-.04,1.97,1.53,4.05,2.92,6.07,4.37-.22-3.15-.99-5.75-1.86-8.32-1.11-3.28-.24-5.82,2.57-7.81,2.28-1.62,4.5-3.33,7.67-5.68-3.94,0-6.75-.01-9.56,0-3.44.02-5.62-1.61-6.66-4.88-.84-2.63-1.77-5.22-2.67-7.83-.35-.2-.7-.41-1.06-.61-.75,11.5-6.8,15.67-17.93,12.81Z></path><path d=M95.09,241.03c4.74,0,9.48-.05,14.22.02,4.15.06,6.7,2.38,6.72,5.93.02,3.55-2.54,5.98-6.64,6.01-9.48.07-18.96.06-28.44,0-4.09-.03-6.74-2.45-6.77-5.93-.03-3.48,2.63-5.94,6.69-6,4.74-.07,9.48-.02,14.22-.02Z></path><path d=M95.06,276.96c4.74,0,9.48-.05,14.22.02,4.16.06,6.71,2.35,6.75,5.9.04,3.55-2.52,6-6.62,6.03-9.48.07-18.96.06-28.44,0-4.09-.02-6.75-2.43-6.79-5.91-.04-3.48,2.62-5.96,6.66-6.03,4.74-.08,9.48-.02,14.22-.02Z></path><path d=M95.06,318.87c-4.74,0-9.48.06-14.22-.02-4.04-.07-6.71-2.56-6.66-6.04.04-3.48,2.69-5.88,6.79-5.9,9.48-.06,18.96-.06,28.44,0,4.1.03,6.66,2.47,6.62,6.03-.04,3.55-2.59,5.85-6.75,5.91-4.74.07-9.48.02-14.22.02Z></path></g></svg>',   // Stellar Customer Service
};

const BEN_ITEMS = [
  ['price',     'Factory-Direct Pricing'],
  ['design',    'Custom Designs, Low MOQ'],
  ['expertise', '23 Years Factory Expertise'],
  ['shipping',  'Fast Turnaround & Global Delivery'],
  ['quality',   '100% Quality Guaranteed'],
];

function benefitsSection() {
  const tiles = BEN_ITEMS.map(([key, label]) => `
    <div class="wl-ben-tile">
      <span class="wl-ben-ico" aria-hidden="true">${BEN_ICONS[key]}</span>
      <p class="wl-ben-label">${esc(label)}</p>
    </div>`).join('');
  return `
<section class="wl-benefits">
  <div class="container">
    <h2 class="wl-ben-title">Why Source from Wolflag?</h2>
    <div class="wl-ben-row">${tiles}
    </div>
  </div>
</section>`;
}

// 补充模块（可加多个：每个 图 + 标题 + 文字；show!==false 且至少一项有内容才渲染；兼容旧版单对象；2026-09-08 全站通用）
function supplementSection(data) {
  const raw = data && data.supplement;
  const items = Array.isArray(raw) ? raw : (raw ? [raw] : []);
  return items.filter((s) => s && s.show !== false && (s.text || s.title || s.image))
    .map((s) => `
    <section class="section">
      <div class="container">
        <div class="f-supp${s.image ? '' : ' f-supp-txt'}">
          ${s.image ? `<div class="f-supp-img"><img src="${esc(s.image)}" alt="${altOf(s, s.title || '', 'imageAlt')}" decoding="async"></div>` : ''}
          <div class="f-supp-body">
            ${s.title ? `<h2 class="f-supp-title">${esc(s.title)}</h2>` : ''}
            <div class="f-supp-text">${bold(s.text || '')}</div>
          </div>
        </div>
      </div>
    </section>`).join('');
}

function featherBody(data) {
  const cards = data.products.map((p) => {
    const specRows = productSpecRows(p);
    const specHtml = specRows.length
      ? '<table class="f-spec">' + specRows.map((sp) => '<tr><th>' + esc(sp.label) + '</th><td>' + esc(sp.value) + '</td></tr>').join('') + '</table>'
      : '';
    return `
    <article class="f-card">
      <span class="f-img"><img src="${p.image}" alt="${altOf(p, p.name)}" loading="lazy" decoding="async"${dimAttrs(p.image, 0.5)}></span>
      <div class="f-body">
        <h2 class="f-title">${esc(p.name)}</h2>
        ${specHtml}
        ${p.subtitle ? `<p class="f-sub">${bold(p.subtitle)}</p>` : ''}
      </div>
    </article>`;
  }).join('');
  const banner = data.bannerImage ? `
  <section class="page-banner">
    <div class="container"><img src="${esc(data.bannerImage)}" alt="${altOf(data, 'Feather flags')}"></div>
  </section>` : '';
  const supplement = supplementSection(data);
  return `
  ${banner}
  <section class="section" style="padding-bottom:0">
    <div class="container"><h1 class="page-badge">${esc(data.badge)}</h1></div>
  </section>
  <section class="section">
    <div class="container">
      <div class="product-grid-2">${cards}</div>
    </div>
  </section>${supplement}${benefitsSection()}`;
}

function bannerBody(data) {
  const cards = data.products.map((p) => {
    const specRows = productSpecRows(p);
    const specHtml = specRows.length
      ? '<table class="p-spec">' + specRows.map((sp) => '<tr><th>' + esc(sp.label) + '</th><td>' + esc(sp.value) + '</td></tr>').join('') + '</table>'
      : '';
    return `
    <article class="product-card">
      <span class="p-img"><img src="${p.image}" alt="${altOf(p, p.name)}" loading="lazy" decoding="async"${dimAttrs(p.image, 0.5)}></span>
      <div class="p-body">
        <h2 class="p-name">${esc(p.name)}</h2>
        ${specHtml}
        ${p.subtitle ? `<p class="p-sub">${bold(p.subtitle)}</p>` : ''}
      </div>
    </article>`;
  }).join('');
  const banner = data.bannerImage ? `
  <section class="page-banner">
    <div class="container"><img src="${esc(data.bannerImage)}" alt="${altOf(data, 'Banners')}"></div>
  </section>` : '';
  const supplement = supplementSection(data);
  return `
  ${banner}
  <section class="page-hero">
    <div class="container"><h1>${esc(data.tagline)}</h1></div>
  </section>
  <section class="section">
    <div class="container">
      <div class="product-grid-3">${cards}</div>
    </div>
  </section>${supplement}${benefitsSection()}`;
}

function poleBody(data) {
  const feat = data.featured.map((p) => `
    <article class="feat-card">
      <div class="feat-text">
        <h2>${esc(p.name)}</h2>
        <p class="feat-desc">${esc(p.desc)}</p>
        ${p.detail ? `<p class="feat-desc">${esc(p.detail)}</p>` : ''}
        <p class="feat-tag">${esc(p.tag)}</p>
      </div>
      <img src="${p.image}" alt="${altOf(p, p.name)}" loading="lazy" decoding="async"${dimAttrs(p.image, 0.5)}>
    </article>`).join('');
  const ing = data.ingredients.items.map((p) => `
    <article class="ing-card">
      <img src="${p.image}" alt="${altOf(p, p.name)}" loading="lazy" decoding="async"${dimAttrs(p.image, 0.5)}>
      <h4>${esc(p.name)}</h4>
      <p>${esc(p.desc)}</p>
    </article>`).join('');
  return `
  <section class="page-hero pole-hero">
    <div class="container">
      <h1>${esc(data.subheading)}</h1>
      <p class="pole-subtext">${esc(data.subtext)}</p>
    </div>
  </section>
  <section class="section pole-featured">
    <div class="container">
      <div class="featured-2">${feat}</div>
    </div>
  </section>
  <section class="ingredients">
    <div class="container">
      <h3>${esc(data.ingredients.title)}</h3>
      <p class="ing-sub">${esc(data.ingredients.subtitle)}</p>
      <div class="ing-grid">${ing}</div>
    </div>
  </section>${benefitsSection()}`;
}

/** 把多段文字按空行拆成多个 <p>，支持 **词** 加粗 */
function aboutParas(text) {
  return String(text || '').split(/\n+/).map((p) => p.trim()).filter(Boolean).map((p) => `<p>${bold(p)}</p>`).join('\n      ');
}

/** FAQ 答案：后台填的换行要保留（2026-09-14）。
    原先整个答案被塞进一个 <p>，HTML 会把换行折成空格 —— 用户精心排的
    「空行分段 + • 分点」在网页上糊成一整段。现改为：
      · 空行 → 分成多个段落（<p>，沿用浏览器默认段间距，单段答案外观与改动前完全一致）
      · 段内单个换行 → <br>（这样 • 分点各自成行、间距紧凑，像正常的列表）
    先 esc() 转义再补 <br>，顺序不能反（否则 <br> 会被转义掉）。 */
function faqAnswer(text) {
  return String(text || '')
    .split(/\n\s*\n/)
    // 2026-09-14 修：这里原先用 esc() → 后台写 **加粗** 会**原样显示星号**。
    // 但《后台管理操作说明书》一直写着「FAQ 答案里可以用 ** 加粗」→ **文档与实现不符**。
    // 现改用 bold()（它内部对不含标记的部分仍做 esc()，安全性不变）。
    // ⚠️ 顺序：必须在 bold() **之后**再把换行换成 <br>（bold 只转义、不动换行符）。
    .map((para) => bold(para.trim()).replace(/\n/g, '<br>'))
    .filter(Boolean)
    .map((para) => `<p>${para}</p>`)
    .join('');
}

/** 模块可选背景色映射（后台 bg 下拉，国际极简风色板，低饱和高级中性色） */
const ABOUT_BG = {
  white: '#ffffff',     // 纯白
  offwhite: '#fafaf9',  // 米白
  grey: '#f8f8f8',      // 淡灰
  sand: '#f5f0e8',      // 浅沙(暖)
  cream: '#faf7f5',     // 米黄
  green: '#dfe3e2',     // 灰绿
  sage: '#e8ece2',      // 鼠尾草
  mist: '#eef1f4',      // 雾蓝(冷)
  blush: '#f6f0ee',     // 藕粉
  charcoal: '#f1f1ef',  // 浅炭
};
function aboutBg(b) {
  if (b.bg) {
    if (ABOUT_BG[b.bg]) return ABOUT_BG[b.bg];
    if (/^#/.test(b.bg)) return b.bg;   // 颜色选择器存的是十六进制，直接使用
  }
  if (b.type === 'clients') return ABOUT_BG.white;
  if (b.type === 'faq') return ABOUT_BG.green;
  return ABOUT_BG.grey;
}

/** 逐模块渲染 About 页（blocks 列表，可拖排序/增删） */
function renderAboutBlock(b) {
  if (!b) return '';
  if (b.type === 'text') return `<section class="about-grey about-mod" style="background:${aboutBg(b)}"><div class="container"><div class="about-text">\n      ${aboutParas(b.text)}\n    </div></div></section>`;
  if (b.type === 'image') return `<section class="about-grey about-mod" style="background:${aboutBg(b)}"><div class="container"><img class="about-img-solo" src="${esc(b.image)}" alt="${altOf(b, 'WOLFLAG factory and products')}" loading="lazy" decoding="async"></div></section>`;
  if (b.type === 'textImg') {
    const dir = b.direction || 'textLeft';
    const rt = String(b.ratio || '50:50').split(':');
    const t = parseInt(rt[0], 10) || 50;
    const i = parseInt(rt[1], 10) || 50;
    // 图片垂直位置（2026-09-11 新增）：mid=与左侧文字中间对齐 / bottom=底部对齐；
    // top（默认值）沿用 align-items:flex-start，不输出类名
    const alignCls = b.imgAlign === 'mid' ? ' about-it-mid' : (b.imgAlign === 'bottom' ? ' about-it-end' : '');
    const fallbackAlt = b.title || 'WOLFLAG custom flags and displays';

    // ① 固定图片（不轮播）：沿用原逻辑，多张纵向堆叠、可各自调 offset
    const imgs = (b.images || []).map((im) => {
      const src = (typeof im === 'string') ? im : (im.image || '');
      const off = (im && typeof im === 'object') ? (parseInt(im.offset, 10) || 0) : 0;
      // alt 取该图自己的 imageAlt，没填则回退到所在图文块的标题，再回退到兜底文案
      return `<img src="${esc(src)}" alt="${altOf(im, fallbackAlt)}" loading="lazy" decoding="async" style="margin-top:${off}px">`;
    }).join('');

    // ② 轮播区（2026-09-10 新增）：位于固定图片下方；只有 1 张时静止显示，≥2 张才轮播
    const car = b.carousel || {};
    const carImgs = (car.images || []).filter((x) => x && (typeof x === 'string' ? x : x.image));
    let carousel = '';
    if (car.enabled !== false && carImgs.length) {
      const slides = carImgs.map((im, n) => {
        const src = typeof im === 'string' ? im : im.image;
        return `<img class="it-slide${n === 0 ? ' is-active' : ''}" src="${esc(src)}" alt="${altOf(im, fallbackAlt)}" loading="lazy" decoding="async">`;
      }).join('\n          ');
      const multi = carImgs.length > 1;
      // ≥2 张才带 data-interval；单张时不输出，JS 直接静止显示
      carousel = `
        <div class="it-carousel${multi ? '' : ' is-single'}"${multi ? ` data-interval="${parseInt(car.interval, 10) || 5}"` : ''}>
          ${slides}
        </div>`;
    }

    return `
    <section class="about-grey about-mod" style="background:${aboutBg(b)}"><div class="container">
      <div class="about-it about-it-${dir}${alignCls}" style="--it-t:${t};--it-i:${i};">
        <div class="about-it-text">${b.title ? `<h4>${esc(b.title)}</h4>` : ''}${b.text ? `\n        ${aboutParas(b.text)}` : ''}</div>
        <div class="about-it-imgs">${imgs}${carousel}</div>
      </div>
    </div></section>`;
  }
  if (b.type === 'clients') {
    const c = b;
    return `
    <section class="clients" style="background:${aboutBg(b)}">
      <div class="container">
        <div>
          <p class="cl-label">${esc(c.title)}</p>
          <h2>${esc(c.tagline)}</h2>
          <p class="cl-sub">${esc(c.subtitle)}</p>
        </div>
        <div class="cl-logos">
          ${(c.logos || []).map((l) => `<img src="${esc(l)}" alt="Client logo" loading="lazy" decoding="async" width="128" height="86">`).join('\n        ')}
        </div>
      </div>
    </section>`;
  }
  if (b.type === 'faq') {
    const items = (b.items || []).map((f, idx) => `
      <div class="faq-item ${idx === 0 ? 'open' : ''}">
        <button class="faq-q" aria-expanded="${idx === 0}">
          <span>${esc(f.q)}</span>
          ${/* 右侧「大于号」箭头：**空 span**，形状由 CSS 的 border 画出来（2026-09-14 改版，
               与参考站同一做法，故形状/颜色一致）。不要再放 ▼ 字符——那会和 border 叠加。 */''}
          <span class="chev" aria-hidden="true"></span>
        </button>
        <div class="faq-a">${faqAnswer(f.a)}</div>
      </div>`).join('');
    return `
    <section class="faq-section" style="background:${aboutBg(b)}">
      <div class="container">
        <h2>FAQ</h2>
        ${items}
      </div>
    </section>`;
  }
  if (b.type === 'timeline') {
    // 自动按年份从小到大排序（最早在最左、最晚在最右），后台无论填什么顺序都不会错
    const items = (b.items || []).filter((it) => it && it.year).sort((a, b) => (parseInt(a.year, 10) || 0) - (parseInt(b.year, 10) || 0));
    if (!items.length) return '';
    const track = items.map((it, i) => `
        <button type="button" class="tl-year${i === 0 ? ' is-active' : ''}" data-i="${i}" aria-expanded="${i === 0}">
          <span class="tl-year-txt">${esc(it.year)}</span>
          <span class="tl-dot" aria-hidden="true"></span>
        </button>`).join('');
    const panels = items.map((it, i) => `
        <div class="tl-panel${i === 0 ? ' is-active' : ''}" data-i="${i}">
          <div class="tl-big">${esc(it.year)}</div>
          <p class="tl-text">${bold(it.text)}</p>
        </div>`).join('');
    return `
    <section class="about-grey about-mod tl-section" style="background:${aboutBg(b)}"><div class="container">
      ${b.title ? `<h2 class="tl-title">${esc(b.title)}</h2>` : ''}
      <div class="tl" data-timeline data-autoplay="${b.autoPlay === false ? 'off' : 'on'}" data-interval="${parseInt(b.interval, 10) || 5}">
        <div class="tl-track">
          ${track}
        </div>
        <div class="tl-panels">
          ${panels}
        </div>
      </div>
    </div></section>`;
  }
  if (b.type === 'marquee') {
    // 无缝滚动横幅（2026-09-11 新增）：同一张超宽横图输出两次、整体左移 50%（= 正好一张图宽），
    // 终点画面与起点像素级一致 → 无限循环看不出接缝。纯 CSS 动画，不需要 JS。
    // 宽度：套 .container，与上下区块同宽、左右对齐（用户看过效果后的要求；初版做的通栏已收窄）。
    const src = b.image;
    if (!src) return '';                                  // 后台没填图 → 不渲染空区块
    const dur = parseFloat(b.duration) > 0 ? parseFloat(b.duration) : 45;
    // 第二张是纯装饰副本：alt 置空 + aria-hidden，避免读屏软件把同一张图念两遍
    // 有意不加 dimAttrs()：高度由 CSS 固定（桌面 260px / 手机 160px），尺寸属性会被 CSS 覆盖、无防抖收益
    return `
    <section class="about-strip" style="background:${aboutBg(b)}">
      <div class="container">
        <div class="about-strip-clip">
          <div class="about-strip-track" style="--strip-duration:${dur}s">
            <img src="${esc(src)}" alt="${altOf(b, 'WOLFLAG factory production line')}" loading="lazy" decoding="async">
            <img src="${esc(src)}" alt="" aria-hidden="true" loading="lazy" decoding="async">
          </div>
        </div>
      </div>
    </section>`;
  }
  return '';
}

function aboutBody(data) {
  const blocks = (data.blocks || []).map(renderAboutBlock).join('\n');
  return `
  <div class="about-hero">
    <img src="${data.hero.image}" alt="${altOf(data.hero, 'WOLFLAG factory workshop')}"${dimAttrs(data.hero.image, 0.5)}>
  </div>
  ${announceBar(data.announce)}
  ${blocks}`;
}

/* ---------------- render ---------------- */

/** 通用产品页布局：标题+标语+产品网格（name/desc/image/specs 均可选；bannerImage 可选横幅；p.link 让卡片可点击） */
function simpleBody(data) {
  const banner = data.bannerImage ? `
  <section class="page-banner">
    <div class="container"><img src="${esc(data.bannerImage)}" alt="${altOf(data, data.heading || '')}"></div>
  </section>` : '';
  const products = (data.products || []).map((p) => {
    const nameStyle = data.titleFontSerif ? '' : 'style="font-family:Arial;font-weight:700;font-size:14px;letter-spacing:0;text-transform:none"';
    const link = p.link ? `class="p-link" href="${esc(p.link)}"` : '';
    const img = p.link
      ? `<a ${link}><img src="${esc(p.image)}" alt="${altOf(p, p.name)}" loading="lazy" decoding="async"${dimAttrs(p.image, 0.5)}></a>`
      : `<img src="${esc(p.image)}" alt="${altOf(p, p.name)}" loading="lazy" decoding="async"${dimAttrs(p.image, 0.5)}>`;
    const name = p.link
      ? `<a ${link}><h2 class="p-name" ${nameStyle}>${esc(p.name)}</h2></a>`
      : `<h2 class="p-name" ${nameStyle}>${esc(p.name)}</h2>`;
    return `
    <article class="product-card">
      <span class="p-img">${img}</span>
      <div class="p-body">
        ${name}
        ${p.size ? `<p class="p-size">${esc(p.size)}</p>` : ''}
        ${p.material ? `<p class="p-material">${esc(p.material)}</p>` : ''}
        ${p.desc ? `<p class="p-desc">${esc(p.desc)}</p>` : ''}
        ${(p.specs || []).map((sp) => `<p class="p-material">${esc(sp)}</p>`).join('')}
      </div>
    </article>`;
  }).join('');
  return `
  ${banner}
  <section class="page-hero">
    <div class="container">
      <h1>${esc(data.heading || '')}</h1>
      ${data.tagline ? `<p class="tagline" style="letter-spacing:0;text-transform:none">${esc(data.tagline)}</p>` : ''}
    </div>
  </section>
  <section class="section">
    <div class="container">
      <div class="product-grid-3">${products}</div>
    </div>
  </section>
  ${sectionsBlock(data)}${benefitsSection()}`;
}

/** specGrid 属性网格模板：品名(加粗居中)+宣传语+规格表(specs)；桌面统一卡片高度、超出隐藏、悬停完整弹出+图放大；手机全显 */
function specGridBody(data) {
  const banner = data.bannerImage ? `
  <section class="page-banner">
    <div class="container"><img src="${esc(data.bannerImage)}" alt="${altOf(data, data.heading || '')}"></div>
  </section>` : '';
  const products = (data.products || []).map((p) => {
    const specRows = (p.specs || []).filter((sp) => sp.label || sp.value);
    const specHtml = specRows.length
      ? `<table class="sg-spec">\n      ` + specRows.map((sp) => `<tr><th>${esc(sp.label)}</th><td>${esc(sp.value)}</td></tr>`).join('\n      ') + '\n    </table>'
      : '';
    const info = `
      <div class="sg-body">
        <h3 class="sg-name">${esc(p.name)}</h3>
        ${specHtml}
        ${p.subtitle ? `<p class="sg-sub">${bold(p.subtitle)}</p>` : ''}
      </div>`;
    const img = p.image ? `<img src="${esc(p.image)}" alt="${altOf(p, p.name)}" loading="lazy" decoding="async">` : '';
    return `
    <article class="sg-card">
      <div class="sg-img">${img}</div>
      <div class="sg-info">${info}</div>
    </article>`;
  }).join('');
  const supplement = supplementSection(data);
  return `
  ${banner}
  <section class="page-hero">
    <div class="container">
      <h1>${esc(data.heading || '')}</h1>
      ${data.tagline ? `<p class="tagline" style="letter-spacing:0;text-transform:none">${esc(data.tagline)}</p>` : ''}
    </div>
  </section>
  <section class="section">
    <div class="container">
      <div class="sg-grid">${products}</div>
    </div>
  </section>${supplement}${benefitsSection()}`;
}

/* ---------------- 产品详情布局（detail）+ 通用图文布局（flex） ---------------- */
const DEFAULT_CARDS = [
  { icon: '/assets/media/svc-support.svg', title: '24/7 Customer Service', text: 'If you have any questions about ordering or customization, email us any time — our team replies around the clock.' },
  { icon: '/assets/media/svc-shipping.svg', title: 'Factory-Direct Prices', text: 'We ship directly from our factory with no middlemen, so you get the best factory-direct price.' },
  { icon: '/assets/media/svc-returns.svg', title: 'Easy & Free Returns', text: 'Changed your mind? Just let us know — our return policy is easy and designed to keep things simple.' },
];

/** 把 media/ 里的 .svg 图标读进来「内联」进 HTML，并把品牌蓝 #4c6aff 换成 currentColor。
 *  2026-09-15 新增，用途：产品详情页底部三张服务小卡（car-flags）。
 *  为什么必须内联：<img src="x.svg"> 引入的 SVG 是独立文档，CSS 的 color/fill 管不到它
 *  —— 而用户要求这三个图标「常态深灰 → 悬停酒红 + 上跳」，不内联就做不到变色。
 *  文件本身保持原样（仍是蓝色），替换只发生在这里，别的用途不受影响。
 *  返回 null 表示「不是 svg / 读不到」→ 调用方回退成原来的 <img>，用户自己上传的图照常显示。 */
const svgInlineCache = new Map();
function inlineSvg(urlPath) {
  if (!urlPath || typeof urlPath !== 'string' || !/\.svg$/i.test(urlPath)) return null;
  if (svgInlineCache.has(urlPath)) return svgInlineCache.get(urlPath);
  let out = null;
  const abs = join(MEDIA, urlPath.replace(/^\/assets\/media\//, '').replace(/^\//, ''));
  try {
    if (existsSync(abs)) {
      out = readFileSync(abs, 'utf8')
        .replace(/<\?xml[\s\S]*?\?>/g, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/\s+/g, ' ')
        .replace(/#4c6aff/gi, 'currentColor')
        .trim();
    }
  } catch { out = null; }
  svgInlineCache.set(urlPath, out);
  return out;
}

/** 汇总某产品的规格表行：优先用自由属性的 specs 数组；旧字段(fabric/printing/size/moq/leadTime)作兜底，保证兼容 */
function productSpecRows(p) {
  if (p.specs && p.specs.length) return p.specs.filter((s) => s.label || s.value);
  const rows = [];
  if (p.fabric) rows.push({ label: 'Fabric', value: p.fabric });
  if (p.printing) rows.push({ label: 'Printing', value: p.printing });
  if (p.size) rows.push({ label: 'Size', value: p.size });
  if (p.moq) rows.push({ label: 'MOQ', value: p.moq });
  if (p.leadTime) rows.push({ label: 'Lead Time', value: p.leadTime });
  return rows;
}

function detailBody(data) {
  const products = (data.products || []).map((p) => {
    const imgs = (p.images && p.images.length ? p.images : (p.image ? [p.image] : [])) || [];
    const srcs = imgs.map(imgSrc);
    const main = srcs[0] || home.hero.image;
    // alt 回退顺序（2026-09-12 修正）：该图自己的 imageAlt（若将来配了）→ 产品级「图片说明(alt)」→ 品名。
    // 此前只读每图层级，而后台「图片说明(alt)」字段配在**产品**层级 → 该字段填了也不生效（形同摆设）。
    const altFallback = (p.imageAlt && String(p.imageAlt).trim()) ? p.imageAlt : p.name;
    const thumbs = srcs.map((im, j) => `
          <button class="pd-thumb${j === 0 ? ' on' : ''}" data-src="${esc(im)}" aria-label="Image ${j + 1}"><img src="${esc(im)}" alt="${altOf(imgs[j], altFallback)}" loading="lazy" decoding="async"></button>`).join('\n');
    const specRows = productSpecRows(p);
    let specs = '';
    if (specRows.length) {
      specs = specRows.map((r) => `<tr><th>${esc(r.label)}</th><td>${esc(r.value)}</td></tr>`).join('\n      ');
    }
    const priceRows = (p.prices || []).map((r) => `<tr><td>${esc(r.qty)}</td><td>${esc(r.price)}</td></tr>`).join('\n        ');
    return `
  <section class="pd-block">
    <div class="container pd-cols">
      <div class="pd-gallery">
        ${imgs.length > 1 ? `<div class="pd-main"><img src="${esc(main)}" alt="${altOf(imgs[0], altFallback)}"></div>
      <div class="pd-thumbs">${thumbs}</div>` : `<div class="pd-main"><img src="${esc(main)}" alt="${altOf(imgs[0], altFallback)}"></div>`}
      </div>
      <div class="pd-info">
        <h2 class="pd-name">${esc(p.name)}</h2>
        ${p.desc ? `<p class="pd-desc">${esc(p.desc)}</p>` : ''}
        ${specs ? `<table class="pd-spec">${specs}</table>` : ''}
        ${priceRows ? `<h3 class="pd-sub">Price List</h3>
      <table class="pd-price"><thead><tr><th>Quantity</th><th>Price</th></tr></thead><tbody>
        ${priceRows}
      </tbody></table>` : ''}
      </div>
    </div>
  </section>`;
  }).join('\n');
  const svcCards = ((data.serviceCards && data.serviceCards.length) ? data.serviceCards : DEFAULT_CARDS).map((c) => {
    // 图标（2026-09-15）：media 里的 .svg 走内联（悬停才能靠 CSS 变酒红，见 inlineSvg 注释）；
    // 用户自己上传的其他图（png/webp 等）仍走 <img>，行为与以前完全一致。
    const svg = inlineSvg(c.icon);
    const icon = !c.icon ? ''
      : svg ? `<span class="svc-icon" aria-hidden="true">${svg}</span>`
            : `<img class="svc-icon" src="${esc(c.icon)}" alt="">`;
    return `
    <div class="svc-card">
      ${icon}
      <h4>${esc(c.title)}</h4>
      <p>${esc(c.text)}</p>
    </div>`;
  }).join('');
  const ti = data.textImg || {};
  // alt 回退顺序（2026-09-12 修正）：该图自己的 imageAlt → 图文区级「图片说明(alt)」→ 图文区标题 → 页面主标题。
  // 原写法有两处问题：① 兜底用了作用域外的 p.name（图文区一旦加图且未填标题会抛 ReferenceError）；
  // ② 后台配在图文区层级的 imageAlt 字段被完全忽略（填了不生效）。
  const tiAlt = (ti.imageAlt && String(ti.imageAlt).trim()) ? ti.imageAlt : (ti.title || data.heading || '');
  const tiImgs = (ti.images || []).map((im) => `<img src="${esc(imgSrc(im))}" alt="${altOf(im, tiAlt, 'imageAlt')}" loading="lazy" decoding="async">`).join('');
  const textImg = (ti.title || ti.text || tiImgs) ? `
  <section class="pd-textimg">
    <div class="container">
      ${ti.title ? `<h2>${esc(ti.title)}</h2>` : ''}
      ${ti.text ? `<p class="ti-text">${esc(ti.text)}</p>` : ''}
      ${tiImgs ? `<div class="ti-imgs">${tiImgs}</div>` : ''}
    </div>
  </section>` : '';
  return `
  <section class="page-hero">
    <div class="container"><h1>${esc(data.heading || '')}</h1>${data.tagline ? `<p class="tagline" style="letter-spacing:0;text-transform:none">${esc(data.tagline)}</p>` : ''}</div>
  </section>
  ${products}
  <section class="section pd-services">
    <div class="container svc-grid">${svcCards}</div>
  </section>
  ${textImg}`;
}

// 图文区块（sections，flex 通用图文）：遍历渲染，show!==false 且至少一项有内容才输出该块；2026-09-08 支持显示/隐藏
function sectionsBlock(data) {
  const list = (data && data.sections) || [];
  return list.filter((s) => s && s.show !== false && (s.title || s.text || (s.images && s.images.length)))
    .map((s) => {
      const imgs = (s.images || []).map((im) => `<img src="${esc(imgSrc(im))}" alt="${altOf(im, s.title || '', 'imageAlt')}" loading="lazy" decoding="async">`).join('');
      return `
  <section class="flex-section">
    <div class="container">
      ${s.title ? `<h2>${esc(s.title)}</h2>` : ''}
      ${s.text ? `<p class="flex-text">${esc(s.text)}</p>` : ''}
      ${imgs ? `<div class="flex-imgs">${imgs}</div>` : ''}
    </div>
  </section>`;
    }).join('\n');
}

function flexBody(data) {
  return `
  <section class="page-hero">
    <div class="container"><h1>${esc(data.heading || '')}</h1>${data.tagline ? `<p class="tagline" style="letter-spacing:0;text-transform:none">${esc(data.tagline)}</p>` : ''}</div>
  </section>
  ${sectionsBlock(data)}`;
}

/** 按 layout 分派 body 渲染 */
function renderBody(p) {
  if (p.layout === 'feather') return featherBody(p.data);
  if (p.layout === 'bannerCards') return bannerBody(p.data);
  if (p.layout === 'flags') return nfBody(p.data);
  if (p.layout === 'pole') return poleBody(p.data);
  if (p.layout === 'detail') return detailBody(p.data);
  if (p.layout === 'flex') return flexBody(p.data);
  if (p.layout === 'specGrid') return specGridBody(p.data);
  return simpleBody(p.data); // 默认通用布局（新类目页）
}

/* ---------------- blog（列表页 /blog.html + 文章页 /blog/<slug>.html） ---------------- */
const BLOG_DIR = join(CONTENT, 'blog');
const BLOG_PER = 20; // 列表每页 20 篇 / 侧栏 All Posts 每页 20 条

function scanBlogs() {
  if (!existsSync(BLOG_DIR)) return [];
  return readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => j(join(BLOG_DIR, f)))
    .filter((b) => b && b.slug && !b.draft)
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || String(b.date).localeCompare(String(a.date)));
}

function pinnedTag() { return '<span class="blog-flag">PINNED</span> '; }

function blogCard(b) {
  return `
    <article class="blog-card">
      <a class="blog-thumb" href="/blog/${esc(b.slug)}"><img src="${esc(b.coverImage || home.hero.image)}" alt="${altOf(b, b.title)}" loading="lazy" decoding="async"></a>
      <div class="blog-body">
        <p class="blog-meta">${b.pinned ? pinnedTag() : ''}${esc(b.date)}</p>
        <h2 class="blog-title"><a href="/blog/${esc(b.slug)}">${esc(b.title)}</a></h2>
        ${b.summary ? `<p class="blog-sum">${esc(b.summary)}</p>` : ''}
        <a class="blog-more" href="/blog/${esc(b.slug)}">Read More</a>
      </div>
    </article>`;
}

function blogPager(page, totalPages) {
  if (totalPages <= 1) return '';
  let h = '<nav class="blog-pager">';
  h += page > 1 ? `<a class="pager-arrow" href="/blog${page > 2 ? '-' + (page - 1) : ''}">&larr; Prev</a>` : '';
  for (let i = 1; i <= totalPages; i++) {
    const href = i === 1 ? '/blog' : `/blog-${i}`;
    h += i === page ? `<span class="pager-num active">${i}</span>` : `<a class="pager-num" href="${href}">${i}</a>`;
  }
  h += page < totalPages ? `<a class="pager-arrow" href="/blog-${page + 1}">Next &rarr;</a>` : '';
  return h + '</nav>';
}

function blogListBody(blogs, page, totalPages) {
  const cards = (blogs || []).map((b) => blogCard(b)).join('');
  return `
  <section class="page-hero">
    <div class="container"><h1>${esc(settings.blogTitle || 'Blog')}</h1></div>
  </section>
  <section class="section">
    <div class="container">
      <div class="blog-grid">${cards || '<p class="blog-empty">No posts yet. Check back soon!</p>'}</div>
      ${blogPager(page, totalPages)}
    </div>
  </section>`;
}

function recentItem(b) {
  return `<div class="recent-item">
    <img src="${esc(b.coverImage || home.hero.image)}" alt="${altOf(b, b.title)}" loading="lazy" decoding="async">
    <div class="rt">
      <a href="/blog/${esc(b.slug)}">${esc(b.title)}</a>
      ${b.pinned ? pinnedTag() : ''}
      <div class="rd">${esc(b.date)}</div>
    </div>
  </div>`;
}

function blogPostBody(b, blogs) {
  const blocks = (b.blocks || []).map((bl) => {
    if (bl.type === 'image') return `<img class="blog-img" src="${esc(bl.image)}" alt="${altOf(bl, bl.text || '', 'blockImageAlt')}">`;
    if (bl.type === 'h2') return `<h2>${bold(bl.text)}</h2>`;
    return `<p>${bold(bl.text)}</p>`;
  }).join('\n');
  // 侧边「All Posts」：静态渲染前 20 条（无 JS 兜底），JS 用 blog-index JSON 分页
  const index = blogs.map((x) => ({ t: x.title, s: x.slug, d: x.date, i: x.coverImage || '', p: !!x.pinned }));
  return `
  <section class="page-hero">
    <div class="container"><h1>${esc(b.title)}</h1></div>
  </section>
  <article class="blog-post">
    <div class="container blog-post-cols">
      <div class="blog-main">
        <p class="blog-meta">${b.pinned ? pinnedTag() : ''}${esc(b.date)}</p>
        <div class="blog-content">${blocks}</div>
        <p class="blog-back"><a href="/blog">&larr; Back to Blog</a></p>
      </div>
      <aside class="blog-aside">
        <div class="recent-box">
          <h2>All Posts</h2>
          <div id="all-posts">${blogs.slice(0, BLOG_PER).map((x) => recentItem(x)).join('\n')}</div>
          <nav class="recent-pager" id="all-pager"></nav>
        </div>
      </aside>
    </div>
  </article>
  <script id="blog-index" type="application/json">${JSON.stringify(index).replace(/</g, '\\u003c')}</script>`;
}

/* 404 页面（2026-09-10 新增）
 * 背景：Cloudflare Pages 在 static/ 找不到 404.html 时，会把「任意不存在的路径」
 * 一律返回首页内容 + HTTP 200（软 404）。后果：浪费 Google 抓取配额、掩盖真实
 * 死链、可能被视作重复内容。放一个 404.html 后，Cloudflare 会自动用它处理，
 * 并正确返回 HTTP 404。详见 AI-GUIDE.md §10.10。 */
function notFoundBody() {
  const links = [
    ['Feather flags', '/feather-flag'],
    ['Banners', '/banner'],
    ['National Flags', '/national-flag'],
    ['Stands & Displays', '/stands-displays'],
    ['Flagpoles & Accessories', '/pole-display'],
    ['All Products', '/products'],
  ].map(([label, url]) => `<li><a href="${esc(url)}">${esc(label)}</a></li>`).join('\n        ');
  return `
  <section class="section section-center">
    <div class="container" style="max-width:760px;text-align:center;padding:70px 0 90px">
      <p style="font-size:88px;font-weight:800;color:#4c6aff;line-height:1;margin:0 0 8px">404</p>
      <h1 style="font-size:32px;margin:0 0 16px">Sorry, we couldn't find that page</h1>
      <p style="font-size:17px;color:#545a6e;margin:0 0 32px">
        The page you're looking for doesn't exist or may have moved.<br>
        Here are some popular pages instead:
      </p>
      <ul style="list-style:none;padding:0;margin:0 0 36px;display:flex;flex-wrap:wrap;justify-content:center;gap:12px 14px">
        ${links}
      </ul>
      <p><a href="/" style="display:inline-block;background:#4c6aff;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600">Back to Home</a></p>
      <p style="margin-top:36px;font-size:15px;color:#6b7280">
        Still need help? Email us at
        <a href="mailto:${esc(settings.footer.email)}" style="color:#4c6aff">${esc(settings.footer.email)}</a>
      </p>
    </div>
  </section>`;
}


/* wipe old html */
for (const f of readdirSync(STATIC)) {
  if (f.endsWith('.html') || f === 'assets' || f === 'admin' || f === 'sitemap.xml' || f === 'robots.txt' || f === 'blog') {
    rmSync(join(STATIC, f), { recursive: true, force: true });
  }
}

for (const p of PAGES) {
  const title = p.title || 'WOLFLAG — Professional manufacturer of flags, banners, and poles';
  const body = p.file === 'index.html' ? homeBody() : p.file === 'about-us.html' ? aboutBody(about) : renderBody(p);

  // 页面级 og:image：优先用该页自己的横幅图/首图，回退到首页 hero（2026-09-10 改为按页输出）
  const d = p.data || {};
  const firstProd = (d.products || [])[0] || {};
  const firstProdImg = firstProd.image ||
    (Array.isArray(firstProd.images) && firstProd.images[0] &&
      (typeof firstProd.images[0] === 'string' ? firstProd.images[0] : firstProd.images[0].image));
  const pageOgImage = d.bannerImage || firstProdImg || (d.hero && d.hero.image) || home.hero.image;

  // 结构化数据：每页都带 Organization + WebSite；子页加面包屑；有产品的加 ItemList；有 FAQ 的加 FAQPage
  const faqItems = (about.blocks || []).filter((b) => b.type === 'faq').flatMap((b) => b.items || []);
  // 产品数据：多数布局用 products[]；pole-display 用 featured[] + ingredients.items[]
  const pageProducts = (d.products && d.products.length)
    ? d.products
    : [...(d.featured || []), ...((d.ingredients && d.ingredients.items) || [])];
  const schema = schemaGraph(
    orgSchema(),
    breadcrumbSchema(p.title || title, p.slug),
    productListSchema(pageProducts, d.heading || title, p.slug),
    p.file === 'about-us.html' ? faqSchema(faqItems) : null,
  );

  const html = shell({
    title,
    desc: p.desc,
    body,
    active: p.nav,
    path: p.slug,
    ogImage: pageOgImage,
    type: p.slug === '/blog/welcome-to-wolflag-blog' || /^\/blog\//.test(p.slug || '') ? 'article' : 'website',
    schema,
    footerMode: 'full', // 2026-09-06: 用户要求全站页面统一完整页脚（联系方式+地址）
  });
  writeFileSync(join(STATIC, p.file), html);
  console.log('built', p.file, '→ layout:', p.layout || 'home');
}

/* 404 页面：Cloudflare Pages 检测到 static/404.html 后，会用它对未匹配的路径返回 HTTP 404 */
writeFileSync(join(STATIC, '404.html'), shell({
  title: 'Page not found - WOLFLAG',
  desc: 'The page you are looking for could not be found. Browse WOLFLAG flags, banners, national flags, flagpoles and display products instead.',
  body: notFoundBody(),
  active: '',
  path: '/404',           // canonical 指向自身，避免 404 页被当成首页副本
  ogImage: home.hero.image, // 2026-09-11: 此前 404 页无 og:image，补上（全站统一）
  schema: schemaGraph(orgSchema()),
  footerMode: 'full',
}));
console.log('built 404.html → layout: notFound');

/* blog: listing（分页 20/页） + article pages */
const blogs = scanBlogs();
const listingPages = [];
for (let i = 0; i < blogs.length; i += BLOG_PER) listingPages.push(blogs.slice(i, i + BLOG_PER));
if (listingPages.length === 0) listingPages.push([]);
listingPages.forEach((chunk, idx) => {
  const page = idx + 1;
  const file = page === 1 ? 'blog.html' : `blog-${page}.html`;
  writeFileSync(join(STATIC, file), shell({
    // 2026-09-11 标题/摘要优化：原为 'Blog - WOLFLAG'(14 字符)、摘要 66 字符，均远低于 Google 可用长度
    title: page === 1
      ? 'Custom Flags & Banners Blog: Buying Guides & News | WOLFLAG'
      : `Custom Flags & Banners Blog: Guides & News (Page ${page}) | WOLFLAG`,
    desc: 'Practical buying guides and factory news from WOLFLAG: how to choose custom flags and banners, compare materials, prepare artwork and order wholesale.',
    body: blogListBody(chunk, page, listingPages.length),
    active: '/blog',
    path: page === 1 ? '/blog' : `/blog-${page}`,
    ogImage: home.hero.image,
    schema: schemaGraph(orgSchema(), breadcrumbSchema('Blog', page === 1 ? '/blog' : `/blog-${page}`)),
    footerMode: 'full',
  }));
  console.log('built', file, '→ layout: blog(p' + page + ')');
});
const BLOG_OUT = join(STATIC, 'blog');
mkdirSync(BLOG_OUT, { recursive: true });
for (const b of blogs) {
  const html = shell({
    title: `${b.title} - WOLFLAG`,
    desc: `${b.summary || b.title} — WOLFLAG blog`,
    body: blogPostBody(b, blogs),
    active: '/blog',
    path: `/blog/${b.slug}`,
    type: 'article',
    ogImage: b.coverImage || home.hero.image,
    schema: schemaGraph(orgSchema(), breadcrumbSchema(b.title, `/blog/${b.slug}`), {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: b.title,
      description: b.summary || b.title,
      datePublished: b.date,
      ...(b.coverImage ? { image: absUrl(b.coverImage) } : {}),
      author: { '@type': 'Organization', name: 'WOLFLAG', '@id': ORG_ID },
      publisher: { '@id': ORG_ID },
      mainEntityOfPage: `${SITE}/blog/${b.slug}`,
    }),
    footerMode: 'full',
  });
  writeFileSync(join(BLOG_OUT, `${b.slug}.html`), html);
  console.log('built blog/' + b.slug + '.html');
}

/* static assets (css/js sources) */
const SRC = join(ROOT, 'src');
if (existsSync(SRC)) cpSync(SRC, STATIC, { recursive: true });

/* media */
if (existsSync(MEDIA)) cpSync(MEDIA, join(STATIC, 'assets', 'media'), { recursive: true });

/* admin (Decap CMS) */
if (existsSync(ADMIN)) cpSync(ADMIN, join(STATIC, 'admin'), { recursive: true });

/* sitemap */
const blogUrls = [
  ...listingPages.map((_, i) => `${SITE}${i === 0 ? '/blog' : `/blog-${i + 1}`}`),
  ...blogs.map((b) => `${SITE}/blog/${b.slug}`),
];
/* lastmod：Google 用它判断"这页多久没更新"。
 * 静态站没有可靠的每页修改时间，这里统一用构建日期（每次部署即刷新）——
 * 诚实反映"网站整体在更新"，不会被误判为长期不维护。详见 AI-GUIDE.md §10.12 */
const BUILD_DATE = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.map((p) => `  <url><loc>${SITE}${p.slug}</loc><lastmod>${BUILD_DATE}</lastmod><changefreq>weekly</changefreq></url>`).join('\n')}
${blogUrls.map((u) => `  <url><loc>${u}</loc><lastmod>${BUILD_DATE}</lastmod><changefreq>weekly</changefreq></url>`).join('\n')}
</urlset>`;
writeFileSync(join(STATIC, 'sitemap.xml'), sitemap);

/* robots */
writeFileSync(join(STATIC, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);

console.log('build complete →', STATIC);
