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
  <link href="https://fonts.googleapis.com/css2?family=Catamaran:wght@400;700&family=Antic+Slab&family=Bona+Nova:wght@400;700&family=Rufina&family=Acme&display=swap" rel="stylesheet">
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
      <img src="${imgs[0]}" alt="WOLFLAG printing workshop" loading="lazy" decoding="async"${dimAttrs(imgs[0], 0.5)}>
      <div class="mid">
        <div class="tag-pills">${pills}</div>
        <img src="${imgs[1]}" alt="Flags printing line" loading="lazy" decoding="async"${dimAttrs(imgs[1], 0.5)}>
      </div>
      <img src="${imgs[2]}" alt="Banner production machine" loading="lazy" decoding="async"${dimAttrs(imgs[2], 0.5)}>`;
  const cards = home.categories.items.map((c, i) =>
    `<a class="cat-card ${i % 2 === 1 ? 'flip' : ''}" href="${esc(c.link)}">
       <span class="cat-img"><img src="${c.image}" alt="${altOf(c, c.title)}" loading="lazy" decoding="async"${dimAttrs(c.image, 0.5)}></span>
       <span class="cat-info">
         <span class="cat-title">${esc(c.title)}</span>
         <span class="cat-desc">${esc(c.text)}</span>
       </span>
     </a>`).join('\n');
  const supplement = supplementSection(home);
  const heroImgs = (home.hero.images && home.hero.images.length ? home.hero.images : (home.hero.image ? [home.hero.image] : []));
  return `
  <section class="home-hero">
    ${settings.catalogButton ? `<a class="hero-catalog-btn" href="${esc(settings.catalogButton.file)}" download>${esc(settings.catalogButton.text)}</a>` : ''}
    <div class="container hero-row">
      <h1>${esc(home.hero.title)}</h1>
      <p class="hero-text">${esc(home.hero.text)}</p>
    </div>
    <div class="container hero-image">
      <div class="hero-slider" data-interval="${esc(String(home.hero.interval || 5))}" data-mode="${esc(home.hero.mode || 'carousel')}">
        ${heroImgs.map((src, i) => `<img class="hero-slide${i === 0 ? ' is-active' : ''}" src="${esc(src)}" alt="${altOf(src, 'WOLFLAG factory and products')}" ${i === 0 ? dimAttrs(src, 1).trim() : 'loading="lazy"'} decoding="async">`).join('\n        ')}
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
  </section>${supplement}`;
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
  </section>${supplement}`;
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
  </section>${supplement}`;
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
  </section>${supplement}`;
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
  </section>`;
}

/** 把多段文字按空行拆成多个 <p>，支持 **词** 加粗 */
function aboutParas(text) {
  return String(text || '').split(/\n+/).map((p) => p.trim()).filter(Boolean).map((p) => `<p>${bold(p)}</p>`).join('\n      ');
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
          <span class="chev" aria-hidden="true">&#9660;</span>
        </button>
        <div class="faq-a"><p>${esc(f.a)}</p></div>
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
  ${sectionsBlock(data)}`;
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
  </section>${supplement}`;
}

/* ---------------- 产品详情布局（detail）+ 通用图文布局（flex） ---------------- */
const DEFAULT_CARDS = [
  { icon: '/assets/media/svc-support.svg', title: '24/7 Customer Service', text: 'If you have any questions about ordering or customization, email us any time — our team replies around the clock.' },
  { icon: '/assets/media/svc-shipping.svg', title: 'Factory-Direct Prices', text: 'We ship directly from our factory with no middlemen, so you get the best factory-direct price.' },
  { icon: '/assets/media/svc-returns.svg', title: 'Easy & Free Returns', text: 'Changed your mind? Just let us know — our return policy is easy and designed to keep things simple.' },
];

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
    const main = imgs[0] || home.hero.image;
    const thumbs = imgs.map((im, j) => `
          <button class="pd-thumb${j === 0 ? ' on' : ''}" data-src="${esc(im)}" aria-label="Image ${j + 1}"><img src="${esc(im)}" alt="${altOf(im, p.name)}" loading="lazy" decoding="async"></button>`).join('\n');
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
        ${imgs.length > 1 ? `<div class="pd-main"><img src="${esc(main)}" alt="${altOf(main, p.name)}"></div>
      <div class="pd-thumbs">${thumbs}</div>` : `<div class="pd-main"><img src="${esc(main)}" alt="${altOf(main, p.name)}"></div>`}
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
  const svcCards = ((data.serviceCards && data.serviceCards.length) ? data.serviceCards : DEFAULT_CARDS).map((c) => `
    <div class="svc-card">
      ${c.icon ? `<img class="svc-icon" src="${esc(c.icon)}" alt="">` : ''}
      <h4>${esc(c.title)}</h4>
      <p>${esc(c.text)}</p>
    </div>`).join('');
  const ti = data.textImg || {};
  const tiImgs = (ti.images || []).map((im) => `<img src="${esc(im)}" alt="${altOf(im, ti.title || p.name, 'imageAlt')}" loading="lazy" decoding="async">`).join('');
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
      const imgs = (s.images || []).map((im) => `<img src="${esc(im)}" alt="${altOf(im, s.title || '', 'imageAlt')}" loading="lazy" decoding="async">`).join('');
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
        ${b.coverImage ? `<img class="blog-cover" src="${esc(b.coverImage)}" alt="${altOf(b, b.title)}">` : ''}
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
