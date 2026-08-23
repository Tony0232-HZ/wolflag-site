# -*- coding: utf-8 -*-
"""
一次性迁移脚本：从 SingleFile 离线页中解码全部 base64 图片 → media/
带转换：无 alpha 的 PNG 与 JPEG → WebP（q82）；带 alpha 的 PNG 保留原格式。
图片语义命名映射见 IMAGE_MAP（依据离线页 alt 文件名与页面位置分析得到）。

用法：python scripts/extract.py   （输出目录默认 ../media）
"""
import base64, hashlib, io, os, re, sys
from PIL import Image

SRC_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "wolflag 离线版")
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "media")

# 源 base64 的 md5(前10位) -> 目标文件名
IMAGE_MAP = {
    # 站点通用
    "1ef8aa693d": "favicon.png",      # 64x64 favicon
    "fa59d4747a": "logo.png",         # 1613x1517 导航 logo
    "74663b86fe": "footer-logo.png",  # 120x32 页脚 logo
    "4951509c29": "footer-icon-1.png",  # 48x48 页脚图标 1
    "2b786b6b55": "footer-icon-2.png",  # 48x48 页脚图标 2
    "f5423ed697": "footer-icon-3.png",  # 48x48 页脚图标 3
    # Home
    "354223e6c6": "home-hero.png",        # 旗帜001 宽幅hero 1259x562
    "5c710e4c6e": "home-workshop.jpg",    # printing workshop.jpg
    "0bbe1a2f60": "home-printing.jpg",    # Congo Flag--printing.jpg
    "a6239afc13": "home-factory.jpg",     # 045.jpg 960x540
    "d4f0047f33": "home-cat-national.jpg",  # 分类卡：National flag（法国旗旗杆图）
    "49f969e361": "home-cat-banner.jpg",    # 分类卡：banner（黄色鸡横幅图）
    "5815876234": "home-cat-feather.png",   # 分类卡：Feather flag（三面 LOGO 羽毛旗）
    "f779642b35": "home-cat-polekit.png",   # 分类卡：pole kits（旗杆袋套装）
    # About
    "c93fcaf1bc": "about-factory.png",   # 1259x944 工厂图
    "eb07498bdd": "about-hero.jpg",      # flags-1500x575 顶部横幅
    "e96bb3d943": "client-01.png",
    "1284cb238f": "client-02.jpg",
    "a50c8653de": "client-03.png",
    "f7ad5ab8f6": "client-04.png",
    "a48bba4407": "client-05.png",
    "ef7ab9decf": "client-06.png",
    "c105958eb7": "client-07.png",
    "d1d5fb1922": "client-08.png",
    # Feather flag
    "4bd37089f8": "feather-1.png",   # 沙滩旗001
    "c0af1fd327": "feather-2.png",   # 002
    "5323dde5e1": "feather-3.png",   # 003
    "cfb9730e86": "feather-4.png",   # 005
    # National Flag (01=China 02=USA 03=EU 04=Malaysia 05=Kuwait 06=UN)
    "e839543a54": "flag-01.png",
    "49a4bbe001": "flag-02.png",
    "2cc6fc0826": "flag-03.png",
    "b876cd226f": "flag-04.png",
    "75fe9bab70": "flag-05.png",
    "c5c68f9f07": "flag-06.png",
    # Banner
    "97e255f945": "banner-1.png",
    "3bca803b77": "banner-2.png",
    "269de529d1": "banner-3.png",
    "959530070c": "banner-4.png",
    "53dfc3b283": "banner-5.png",
    "5dc840bcf5": "banner-6.png",
    # Pole & Display
    "a6aedd8f7d": "pole-01.png",
    "e2dda51519": "pole-02.png",
    "988f65d0cc": "pole-03.png",
    "881ddd213b": "pole-04.png",
    "b9ac4ea49b": "pole-05.png",
    "f51b39246d": "pole-06.png",
    "bff79d001e": "pole-07.png",
    "a88d558dae": "pole-08.png",
}

def hash_of(b64):
    return hashlib.md5(b64.encode()).hexdigest()[:10]

def convert(name, raw):
    """返回 (bytes, ext)。带 alpha 的 PNG 保留 PNG，其余转 WebP。"""
    try:
        img = Image.open(io.BytesIO(raw))
    except Exception:
        return raw, name.rsplit(".", 1)[-1]
    if img.format == "PNG" and img.mode in ("RGBA", "LA", "P") and "transparency" in img.info:
        # 带透明通道 -> 保留 PNG
        return raw, "png"
    buf = io.BytesIO()
    img2 = img.convert("RGB") if img.mode not in ("RGB", "L") else img
    img2.save(buf, "WebP", quality=82, method=6)
    return buf.getvalue(), "webp"

def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    found = {}
    for f in sorted(os.listdir(SRC_DIR)):
        if not f.lower().endswith((".htm", ".html")):
            continue
        s = open(os.path.join(SRC_DIR, f), encoding="utf-8", errors="ignore").read()
        for m in re.finditer(r"data:image/(\w+);base64,([A-Za-z0-9+/=]+)", s):
            h = hash_of(m.group(2))
            found.setdefault(h, (m.group(1), m.group(2), f))
    print("unique images found:", len(found))
    missing = [h for h in IMAGE_MAP if h not in found]
    if missing:
        print("!! hashes not found:", missing)
    converted = {}
    for h, name in IMAGE_MAP.items():
        if h not in found:
            continue
        fmt, b64, src_page = found[h]
        raw = base64.b64decode(b64)
        data, ext = convert(name, raw)
        base = name.rsplit(".", 1)[0]
        out = os.path.join(OUT_DIR, f"{base}.{ext}")
        with open(out, "wb") as fh:
            fh.write(data)
        converted[base] = (ext, len(data), fmt, src_page)
    # 汇总：文件大小前后对比
    print(f"{'name':24s} {'ext':5s} {'size':>8s}  srcfmt  page")
    for base, (ext, size, fmt, page) in sorted(converted.items()):
        print(f"{base:24s} {ext:5s} {size/1024:8.0f}KB  {fmt:6s}  {page}")
    # 输出一张对照表供后续 build 使用：hash->最终文件
    total = sum(v[1] for v in converted.values())
    print(f"total written: {len(converted)} files, {total/1048576:.1f} MB")

if __name__ == "__main__":
    main()
