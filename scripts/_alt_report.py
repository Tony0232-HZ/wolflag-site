# -*- coding: utf-8 -*-
"""2026-09-20 一次性：生成「图片 ALT 改前 vs 改后」对比 HTML，供用户审阅。
输出到仓库外（与《后台管理操作说明书.html》同目录）。用完即删。"""
import subprocess, re, os, sys, io, html as H
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

REPO = os.path.abspath('.')
OUT = os.path.join(os.path.dirname(REPO), '图片ALT对比-20260920.html')
BASE = os.path.basename(REPO)          # wolflag-site（HTML 与仓库同级 → 相对路径可用）
OLD_REF = 'a4badaf'                     # 填 alt 之前的最后一次提交

PAGES = [('index', '首页'), ('about-us', '关于我们'), ('products', 'Full Products'),
         ('banner', '横幅产品页'), ('national-flag', '国旗产品页'), ('stands-displays', '展架页'),
         ('car-flags', '汽车旗详情页'), ('table-flags', '桌旗详情页'),
         ('hand-held-flags', '手持旗详情页'), ('international-maritime-signal-flags', '海事信号旗详情页'),
         ('custom-pennant-flags', '三角旗详情页'), ('blog/welcome-to-wolflag-blog', '博客文章')]

def pairs(txt):
    """从页面 HTML 里抽出 (文件名, alt)"""
    out = []
    for m in re.finditer(r'<img[^>]*?src="([^"]*)"[^>]*?alt="([^"]*)"', txt):
        fn = os.path.basename(m.group(1)); alt = H.unescape(m.group(2))
        if fn: out.append((fn, alt))
    return out

rows = []
for slug, label in PAGES:
    try:
        old = subprocess.run(['git', 'show', f'{OLD_REF}:static/{slug}.html'],
                             capture_output=True).stdout.decode('utf-8')
    except Exception:
        old = ''
    newp = f'static/{slug}.html'
    if not old or not os.path.exists(newp): continue
    new = open(newp, encoding='utf-8').read()
    # ⚠️ 去重：同一张图可能在同一页出现多次（例如 About 的无缝滚动横幅**故意输出两份**，
    #    第二份 alt="" + aria-hidden 是**正确做法**、不是"漏填"）。这里同一 (页,图) 只取**非空**的那份。
    def best(plist):
        m = {}
        for fn, a in plist:
            if fn not in m or (not m[fn] and a): m[fn] = a
        return m
    om, nm = best(pairs(old)), best(pairs(new))
    for fn, a in nm.items():
        before = om.get(fn, '（之前这一页没有这张图）')
        if before == a: continue                       # 没变化的不列
        if not a.strip(): continue                     # 本身就该为空的（装饰性/重复输出）不列
        rows.append({'page': label, 'file': fn, 'before': before, 'after': a})

# 按「是否真的是这次填的」排序：把 before 是自动兜底的排前面
rows.sort(key=lambda r: (r['page'], r['file']))

def esc(s): return H.escape(str(s))

tr = []
for i, r in enumerate(rows):
    ext = os.path.splitext(r['file'])[1].lower()
    fuzzy = '<span class="tag">原为自动兜底</span>' if r['before'] in ('', '（新图/之前无）') else ''
    tr.append(f"""  <tr>
    <td class="n">{i+1}</td>
    <td class="pg">{esc(r['page'])}</td>
    <td class="img"><img src="{BASE}/media/{esc(r['file'])}" alt="" loading="lazy"><div class="fn">{esc(r['file'])}</div></td>
    <td class="old">{esc(r['before'])} {fuzzy}</td>
    <td class="new">{esc(r['after'])}</td>
    <td class="note" contenteditable="true" data-ph="在这里写您的意见…"></td>
  </tr>""")

doc = f"""<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8">
<title>图片 ALT 改前 / 改后 对比（2026-09-20）</title>
<style>
  :root {{ --line:#e5e7eb; --ink:#1f2937; --dim:#6b7280; --brand:#a33335; }}
  * {{ box-sizing:border-box; }}
  body {{ margin:0; padding:28px 22px 60px; font:15px/1.65 "Microsoft YaHei",system-ui,sans-serif; color:var(--ink); background:#fafafa; }}
  h1 {{ font-size:23px; margin:0 0 6px; }}
  .sub {{ color:var(--dim); font-size:13.5px; margin:0 0 18px; }}
  .box {{ background:#fff; border:1px solid var(--line); border-radius:10px; padding:16px 18px; margin:0 0 18px; }}
  .box h2 {{ font-size:16px; margin:0 0 8px; }}
  .box ul {{ margin:6px 0 0; padding-left:20px; }} .box li {{ margin:3px 0; }}
  .warn {{ background:#fff7f7; border-color:#f3d6d6; }}
  table {{ width:100%; border-collapse:collapse; background:#fff; border:1px solid var(--line); border-radius:10px; overflow:hidden; }}
  th,td {{ border-bottom:1px solid var(--line); padding:10px 12px; vertical-align:top; text-align:left; }}
  th {{ background:#f3f4f6; font-size:13px; color:#374151; position:sticky; top:0; z-index:2; }}
  tr:last-child td {{ border-bottom:0; }}
  td.n {{ width:38px; color:var(--dim); font-size:13px; }}
  td.pg {{ width:96px; font-size:13px; color:var(--dim); }}
  td.img {{ width:190px; }}
  td.img img {{ width:100%; max-width:170px; max-height:110px; object-fit:contain; background:#fff; border:1px solid var(--line); border-radius:6px; display:block; }}
  .fn {{ font:11.5px/1.35 Consolas,monospace; color:#9ca3af; margin-top:5px; word-break:break-all; }}
  td.old {{ width:28%; color:#9a3412; background:#fffaf5; font-size:13.5px; }}
  td.new {{ width:30%; color:#166534; background:#f6fef9; font-size:13.5px; }}
  td.note {{ width:190px; background:#fffbeb; font-size:13.5px; min-height:60px; }}
  td.note:empty::before {{ content:"在这里写您的意见…"; color:#c4b48a; }}
  td.note:focus {{ outline:2px solid #f0a500; outline-offset:-2px; }}
  .tag {{ display:inline-block; font-size:11px; background:#fee2e2; color:#b91c1c; border-radius:4px; padding:1px 6px; margin-left:4px; }}
  .bar {{ position:fixed; right:18px; bottom:18px; display:flex; gap:8px; }}
  .bar button {{ background:#a33335; color:#fff; border:0; border-radius:8px; padding:11px 16px; font-size:14px; cursor:pointer; box-shadow:0 4px 14px rgba(0,0,0,.18); }}
  .bar button.ghost {{ background:#fff; color:#374151; border:1px solid var(--line); }}
</style></head><body>

<h1>🏷️ 图片 ALT：改前 / 改后 对比</h1>
<p class="sub">生成于 2026-09-20 · 共 {len(rows)} 张图有变化 · 图片按页面分组</p>

<div class="box">
  <h2>📖 怎么看这份对比</h2>
  <ul>
    <li><b>「改前」</b>那一栏 = 之前网站<b>自动兜底</b>用的文字（多数是"品名"，所以偏简单）。</li>
    <li><b>「改后」</b>那一栏 = 这次<b>我按图片实际内容</b>逐张看图后写的 alt。</li>
    <li><b>最后一栏可以直接写字</b> —— 您觉得哪条要改，点进去写意见就行。</li>
    <li>右下角有 <b>「复制我的意见」</b> 按钮，写完点一下，就能把意见贴给我。</li>
  </ul>
</div>

<div class="box warn">
  <h2>⚠️ 两点说明</h2>
  <ul>
    <li><b>装饰性小图标（公告条 / 服务卡 / 页脚社交 / 优势条，共 16 处）我没有填</b> —— 按无障碍规范，这类纯装饰图标<b>就该是空的</b>，填了对读屏用户反而是噪音。这是<b>刻意留空，不是漏了</b>。</li>
    <li><b>这些图之前都不是"空的"</b> —— 网站会自动用品名兜底，所以没出现过空 alt。这次是把兜底文案换成<b>更有信息量、含关键词</b>的版本。</li>
  </ul>
</div>

<table>
  <thead><tr><th>#</th><th>页面</th><th>图片</th><th>改前（自动兜底）</th><th>改后（本次填写）</th><th>您的意见</th></tr></thead>
  <tbody>
{chr(10).join(tr)}
  </tbody>
</table>

<div class="bar">
  <button class="ghost" onclick="window.print()">🖨️ 打印/存 PDF</button>
  <button onclick="copyNotes()">📋 复制我的意见</button>
</div>
<script>
function copyNotes(){{
  var out=[]; var i=0;
  document.querySelectorAll('tbody tr').forEach(function(tr){{
    i++;
    var n=tr.querySelector('.note').innerText.trim();
    if(n) out.push('第'+i+'条（'+tr.querySelector('.fn').innerText+'）：'+n);
  }});
  var txt = out.length ? out.join('\\n') : '（我还没写意见）';
  navigator.clipboard.writeText(txt).then(function(){{
    alert('已复制，直接粘贴给我就行：\\n\\n'+txt);
  }},function(){{
    prompt('请手动复制：', txt);
  }});
}}
</script>
</body></html>"""

open(OUT, 'w', encoding='utf-8', newline='\n').write(doc)
print(f'✅ 已生成：{OUT}')
print(f'   共 {len(rows)} 行（有变化的图）')
for r in rows[:6]: print(f'     {r["page"]:12s} {r["file"][:40]:42s} {r["before"][:34]} → {r["after"][:40]}')
