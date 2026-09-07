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
const PAGE_DIRS = ['products', 'pages', 'product-details'];
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
const PAGES = [
  { file: 'index.html', slug: '/', title: home.seo.title, desc: home.seo.description, nav: '/' },
  { file: 'about-us.html', slug: '/about-us.html', title: about.seo.title, desc: about.seo.description, nav: '/about-us.html' },
];
for (const [key, data] of Object.entries(pageFiles)) {
  const p = data.page || {};
  const file = p.file || `${key.replace(/-$/, '')}.html`;
  if (!/(^|\.)html$/.test(file)) throw new Error(`bad page.file for ${key}: ${file}`);
  PAGES.push({
    file,
    slug: '/' + file,
    title: (data.seo && data.seo.title) || `${data.heading || key} - WOLFLAG`,
    desc: (data.seo && data.seo.description) || 'WOLFLAG products.',
    layout: p.layout || 'grid3',
    nav: p.nav || ('/' + file),
    data,
  });
}

/* ---------------- helpers ---------------- */
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** 正文加粗标记：**文字** -> <strong>文字</strong>；其余内容仍做 HTML 转义以保安全（无标记时等价 esc()）。
 *  规则：一对 ** 视为加粗段（中间不含星号、可含空格），可多处加粗混排。 */
const bold = (s) => String(s ?? '').split(/(\*\*[^*]+\*\*)/g).map((part) => {
  if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
    return `<strong>${esc(part.slice(2, -2))}</strong>`;
  }
  return esc(part);
}).join('');

function header(active) {
  const menu = settings.nav.map((item) => {
    const children = item.children || [];
    const cls = item.url === active ? 'active' : item.external ? 'more' : '';
    const ext = item.external ? ' target="_blank" rel="noopener"' : '';
    if (!children.length) {
      return `<li><a class="${cls}" href="${esc(item.url)}"${ext}>${esc(item.label)}</a></li>`;
    }
    const sub = children.map((c) => {
      const cCls = c.url === active ? 'active' : '';
      const cExt = c.external ? ' target="_blank" rel="noopener"' : '';
      return `<li><a class="${cCls}" href="${esc(c.url)}"${cExt}>${esc(c.label)}</a></li>`;
    }).join('\n          ');
    return `<li class="has-children">
        <a class="${cls}" href="${esc(item.url)}"${ext}>${esc(item.label)}<span class="caret" aria-hidden="true">&#9662;</span></a>
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

function footer() {
  const cols = settings.footer.sections.map((s) =>
    `    <div class="footer-col">
      <h4>${esc(s.heading)}</h4>
      ${s.lines.map((l) => `<p>${esc(l)}</p>`).join('\n      ')}
    </div>`).join('\n');
  const mails = (settings.footer.emails || [settings.footer.email]).map((e) =>
    `<p><a href="mailto:${e}" style="color:inherit">${esc(e)}</a></p>`).join('\n');
  const phoneRows = settings.footer.phones.slice(1).map((p) =>
    `<p><a href="tel:${p.replace(/[^+\d]/g, '')}" style="color:inherit">${esc(p)}</a></p>`).join('\n');
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
        <p class="f-phone-main">${esc(settings.footer.phones[0] || '')}</p>
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

function shell({ title, desc, body, active, ogImage, footerMode }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${SITE}/">
  ${ogImage ? `<meta property="og:image" content="${esc(ogImage)}">` : ''}
  <link rel="icon" type="image/png" href="/assets/media/favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Catamaran:wght@400;700&family=Antic+Slab&family=Bona+Nova:wght@400;700&family=Rufina&family=Acme&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/site.css">
</head>
<body>
${header(active)}
<main>
${body}
</main>
${footerMode === 'minimal' ? minimalFooter() : footer()}
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
      <img src="${imgs[0]}" alt="WOLFLAG printing workshop" loading="lazy" decoding="async" width="1005" height="757">
      <div class="mid">
        <div class="tag-pills">${pills}</div>
        <img src="${imgs[1]}" alt="Flags printing line" loading="lazy" decoding="async" width="1110" height="758">
      </div>
      <img src="${imgs[2]}" alt="Banner production machine" loading="lazy" decoding="async" width="960" height="540">`;
  const cards = home.categories.items.map((c, i) =>
    `<a class="cat-card ${i % 2 === 1 ? 'flip' : ''}" href="${esc(c.link)}">
       <span class="cat-img"><img src="${c.image}" alt="${esc(c.title)}" loading="lazy" decoding="async" width="700" height="700"></span>
       <span class="cat-info">
         <span class="cat-title">${esc(c.title)}</span>
         <span class="cat-desc">${esc(c.text)}</span>
       </span>
     </a>`).join('\n');
  return `
  <section class="home-hero">
    ${settings.catalogButton ? `<a class="hero-catalog-btn" href="${esc(settings.catalogButton.file)}" download>${esc(settings.catalogButton.text)}</a>` : ''}
    <div class="container hero-row">
      <h1>${esc(home.hero.title)}</h1>
      <p class="hero-text">${esc(home.hero.text)}</p>
    </div>
    <div class="container hero-image">
      <img src="${home.hero.image}" alt="Flags of the world at WOLFLAG flags showroom" width="1259" height="562">
    </div>
  </section>

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
  </section>`;
}

function nfBody(data) {
  const cards = data.products.map((p) => `
    <article class="product-card">
      <span class="p-img"><img src="${p.image}" alt="${esc(p.name)}" loading="lazy" decoding="async" width="332" height="332"></span>
      <div class="p-body">
        <h2 class="p-name">${esc(p.name)}</h2>
        <p class="p-size">${esc(p.size)}</p>
        <p class="p-material">${esc(p.material)}</p>
        <span class="p-chip">${esc(p.printing)}</span>
      </div>
    </article>`).join('');
  const banner = data.bannerImage ? `
  <section class="page-banner">
    <div class="container"><img src="${esc(data.bannerImage)}" alt="National flags"></div>
  </section>` : '';
  return `
  ${banner}
  <section class="page-hero">
    <div class="container"><h1>${esc(data.tagline)}</h1></div>
  </section>
  <section class="section">
    <div class="container">
      <div class="product-grid-3">${cards}</div>
    </div>
  </section>`;
}

function featherBody(data) {
  const cards = data.products.map((p) => `
    <article class="f-card">
      <span class="f-img"><img src="${p.image}" alt="${esc(p.name)}" loading="lazy" decoding="async" width="280" height="320"></span>
      <div class="f-body">
        ${p.size ? `<p class="f-name-lite">${esc(p.size)}</p>` : ''}
        <h2 class="f-title">${esc(p.name)}</h2>
        <p class="f-desc">${esc(p.material)}<br>${esc(p.desc)}</p>
        <p class="f-cta">${esc(data.cta)}</p>
      </div>
    </article>`).join('');
  const banner = data.bannerImage ? `
  <section class="page-banner">
    <div class="container"><img src="${esc(data.bannerImage)}" alt="Feather flags"></div>
  </section>` : '';
  return `
  ${banner}
  <section class="section" style="padding-bottom:0">
    <div class="container"><h1 class="page-badge">${esc(data.badge)}</h1></div>
  </section>
  <section class="section">
    <div class="container">
      <div class="product-grid-2">${cards}</div>
    </div>
  </section>`;
}

function bannerBody(data) {
  const cards = data.products.map((p) => `
    <article class="product-card">
      <span class="p-img"><img src="${p.image}" alt="${esc(p.name)}" loading="lazy" decoding="async" width="332" height="332"></span>
      <div class="p-body">
        <h2 class="p-name">${esc(p.name)}</h2>
        <p class="p-desc">${esc(p.desc)}</p>
        <p class="p-material">${esc(p.material)}</p>
        <p class="p-desc">${esc(p.detail)}</p>
      </div>
    </article>`).join('');
  const banner = data.bannerImage ? `
  <section class="page-banner">
    <div class="container"><img src="${esc(data.bannerImage)}" alt="Banners"></div>
  </section>` : '';
  return `
  ${banner}
  <section class="page-hero">
    <div class="container"><h1>${esc(data.tagline)}</h1></div>
  </section>
  <section class="section">
    <div class="container">
      <div class="product-grid-3">${cards}</div>
    </div>
  </section>`;
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
      <img src="${p.image}" alt="${esc(p.name)}" loading="lazy" decoding="async" width="553" height="368">
    </article>`).join('');
  const ing = data.ingredients.items.map((p) => `
    <article class="ing-card">
      <img src="${p.image}" alt="${esc(p.name)}" loading="lazy" decoding="async" width="318" height="318">
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

function aboutBody(data) {
  const paras = data.paragraphs.map((p) => `<p>${bold(p)}</p>`).join('\n      ');
  const faqItems = data.faq.map((f, i) => `
    <div class="faq-item ${i === 0 ? 'open' : ''}">
      <button class="faq-q" aria-expanded="${i === 0}">
        <span>${esc(f.q)}</span>
        <span class="chev" aria-hidden="true">&#9660;</span>
      </button>
      <div class="faq-a"><p>${esc(f.a)}</p></div>
    </div>`).join('');
  return `
  <div class="about-hero">
    <img src="${data.hero.image}" alt="WOLFLAG factory workshop" width="1500" height="575">
  </div>
  <section class="about-grey">
  <div class="about-marquee" aria-hidden="true">
    <div class="track">
      ${`<span>${esc(data.hero.title)}</span>`.repeat(8)}
    </div>
  </div>
  <div class="container about-body">
    <div class="about-copy">
      ${paras}
    </div>
    <div class="about-img"><img src="${data.factoryImage}" alt="WOLFLAG factory building" loading="lazy" decoding="async" width="1259" height="944">${data.collageImage ? `
      <img class="about-img-2" src="${esc(data.collageImage)}" alt="WOLFLAG team and factory scene" loading="lazy" decoding="async">` : ''}</div>
  </div>
  </section>
  <section class="clients">
    <div class="container">
      <div>
        <p class="cl-label">${esc(data.clients.title)}</p>
        <h2>${esc(data.clients.tagline)}</h2>
        <p class="cl-sub">${esc(data.clients.subtitle)}</p>
      </div>
      <div class="cl-logos">
        ${data.clients.logos.map((l) => `<img src="${l}" alt="Client logo" loading="lazy" decoding="async" width="128" height="86">`).join('\n        ')}
      </div>
    </div>
  </section>
  <section class="faq-section">
    <div class="container">
      <h2>FAQ</h2>
      ${faqItems}
    </div>
  </section>`;
}

/* ---------------- render ---------------- */

/** 通用产品页布局：标题+标语+产品网格（name/desc/image/specs 均可选；bannerImage 可选横幅；p.link 让卡片可点击） */
function simpleBody(data) {
  const banner = data.bannerImage ? `
  <section class="page-banner">
    <div class="container"><img src="${esc(data.bannerImage)}" alt="${esc(data.heading || '')}"></div>
  </section>` : '';
  const products = (data.products || []).map((p) => {
    const nameStyle = data.titleFontSerif ? '' : 'style="font-family:Arial;font-weight:700;font-size:14px;letter-spacing:0;text-transform:none"';
    const link = p.link ? `class="p-link" href="${esc(p.link)}"` : '';
    const img = p.link
      ? `<a ${link}><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" decoding="async" width="600" height="600"></a>`
      : `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" decoding="async" width="600" height="600">`;
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
  </section>`;
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
          <button class="pd-thumb${j === 0 ? ' on' : ''}" data-src="${esc(im)}" aria-label="Image ${j + 1}"><img src="${esc(im)}" alt="" loading="lazy" decoding="async"></button>`).join('\n');
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
        ${imgs.length > 1 ? `<div class="pd-main"><img src="${esc(main)}" alt="${esc(p.name)}"></div>
      <div class="pd-thumbs">${thumbs}</div>` : `<div class="pd-main"><img src="${esc(main)}" alt="${esc(p.name)}"></div>`}
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
  const tiImgs = (ti.images || []).map((im) => `<img src="${esc(im)}" alt="" loading="lazy" decoding="async">`).join('');
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

function flexBody(data) {
  const sections = (data.sections || []).map((s) => {
    const imgs = (s.images || []).map((im) => `<img src="${esc(im)}" alt="" loading="lazy" decoding="async">`).join('');
    return `
  <section class="flex-section">
    <div class="container">
      ${s.title ? `<h2>${esc(s.title)}</h2>` : ''}
      ${s.text ? `<p class="flex-text">${esc(s.text)}</p>` : ''}
      ${imgs ? `<div class="flex-imgs">${imgs}</div>` : ''}
    </div>
  </section>`;
  }).join('\n');
  return `
  <section class="page-hero">
    <div class="container"><h1>${esc(data.heading || '')}</h1>${data.tagline ? `<p class="tagline" style="letter-spacing:0;text-transform:none">${esc(data.tagline)}</p>` : ''}</div>
  </section>
  ${sections}`;
}

/** 按 layout 分派 body 渲染 */
function renderBody(p) {
  if (p.layout === 'feather') return featherBody(p.data);
  if (p.layout === 'bannerCards') return bannerBody(p.data);
  if (p.layout === 'flags') return nfBody(p.data);
  if (p.layout === 'pole') return poleBody(p.data);
  if (p.layout === 'detail') return detailBody(p.data);
  if (p.layout === 'flex') return flexBody(p.data);
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
      <a class="blog-thumb" href="/blog/${esc(b.slug)}.html"><img src="${esc(b.coverImage || home.hero.image)}" alt="${esc(b.title)}" loading="lazy" decoding="async"></a>
      <div class="blog-body">
        <p class="blog-meta">${b.pinned ? pinnedTag() : ''}${esc(b.date)}</p>
        <h2 class="blog-title"><a href="/blog/${esc(b.slug)}.html">${esc(b.title)}</a></h2>
        ${b.summary ? `<p class="blog-sum">${esc(b.summary)}</p>` : ''}
        <a class="blog-more" href="/blog/${esc(b.slug)}.html">Read More</a>
      </div>
    </article>`;
}

function blogPager(page, totalPages) {
  if (totalPages <= 1) return '';
  let h = '<nav class="blog-pager">';
  h += page > 1 ? `<a class="pager-arrow" href="/blog${page > 2 ? '-' + (page - 1) : ''}.html">&larr; Prev</a>` : '';
  for (let i = 1; i <= totalPages; i++) {
    const href = i === 1 ? '/blog.html' : `/blog-${i}.html`;
    h += i === page ? `<span class="pager-num active">${i}</span>` : `<a class="pager-num" href="${href}">${i}</a>`;
  }
  h += page < totalPages ? `<a class="pager-arrow" href="/blog-${page + 1}.html">Next &rarr;</a>` : '';
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
    <img src="${esc(b.coverImage || home.hero.image)}" alt="" loading="lazy" decoding="async">
    <div class="rt">
      <a href="/blog/${esc(b.slug)}.html">${esc(b.title)}</a>
      ${b.pinned ? pinnedTag() : ''}
      <div class="rd">${esc(b.date)}</div>
    </div>
  </div>`;
}

function blogPostBody(b, blogs) {
  const blocks = (b.blocks || []).map((bl) => {
    if (bl.type === 'image') return `<img class="blog-img" src="${esc(bl.image)}" alt="${esc(bl.text || '')}">`;
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
        ${b.coverImage ? `<img class="blog-cover" src="${esc(b.coverImage)}" alt="${esc(b.title)}">` : ''}
        <div class="blog-content">${blocks}</div>
        <p class="blog-back"><a href="/blog.html">&larr; Back to Blog</a></p>
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

/* wipe old html */
for (const f of readdirSync(STATIC)) {
  if (f.endsWith('.html') || f === 'assets' || f === 'admin' || f === 'sitemap.xml' || f === 'robots.txt' || f === 'blog') {
    rmSync(join(STATIC, f), { recursive: true, force: true });
  }
}

for (const p of PAGES) {
  const title = p.title || 'WOLFLAG — Professional manufacturer of flags, banners, and poles';
  const body = p.file === 'index.html' ? homeBody() : p.file === 'about-us.html' ? aboutBody(about) : renderBody(p);
  const html = shell({
    title,
    desc: p.desc,
    body,
    active: p.nav,
    ogImage: home.hero.image,
    footerMode: 'full', // 2026-09-06: 用户要求全站页面统一完整页脚（联系方式+地址）
  });
  writeFileSync(join(STATIC, p.file), html);
  console.log('built', p.file, '→ layout:', p.layout || 'home');
}

/* blog: listing（分页 20/页） + article pages */
const blogs = scanBlogs();
const listingPages = [];
for (let i = 0; i < blogs.length; i += BLOG_PER) listingPages.push(blogs.slice(i, i + BLOG_PER));
if (listingPages.length === 0) listingPages.push([]);
listingPages.forEach((chunk, idx) => {
  const page = idx + 1;
  const file = page === 1 ? 'blog.html' : `blog-${page}.html`;
  writeFileSync(join(STATIC, file), shell({
    title: page === 1 ? 'Blog - WOLFLAG' : `Blog - Page ${page} - WOLFLAG`,
    desc: 'WOLFLAG news, product releases, announcements and company updates.',
    body: blogListBody(chunk, page, listingPages.length),
    active: '/blog.html',
    ogImage: home.hero.image,
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
    active: '/blog.html',
    ogImage: b.coverImage || home.hero.image,
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
  ...listingPages.map((_, i) => `${SITE}${i === 0 ? '/blog.html' : `/blog-${i + 1}.html`}`),
  ...blogs.map((b) => `${SITE}/blog/${b.slug}.html`),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.map((p) => `  <url><loc>${SITE}${p.slug}</loc><changefreq>weekly</changefreq></url>`).join('\n')}
${blogUrls.map((u) => `  <url><loc>${u}</loc><changefreq>weekly</changefreq></url>`).join('\n')}
</urlset>`;
writeFileSync(join(STATIC, 'sitemap.xml'), sitemap);

/* robots */
writeFileSync(join(STATIC, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);

console.log('build complete →', STATIC);
