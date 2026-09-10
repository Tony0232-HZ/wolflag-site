#!/usr/bin/env python3
"""校验 static/ 下每页的结构化数据（JSON-LD）是否合法、含哪些类型。
用法: python scripts/_check_schema.py
仅供本地验证用，不参与部署。
"""
import re, json, glob, os

print("=== 结构化数据校验 ===\n")
allok = True
for fp in sorted(glob.glob('static/**/*.html', recursive=True)):
    name = os.path.relpath(fp, 'static').replace(os.sep, '/')
    h = open(fp, encoding='utf-8').read()
    blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', h, re.S)
    types = []
    for b in blocks:
        try:
            d = json.loads(b)
            if '@graph' in d:
                types += [x.get('@type') for x in d['@graph']]
            else:
                types.append(d.get('@type'))
        except Exception as e:
            print("  [X] %s: JSON 解析失败 %s" % (name, e))
            allok = False
    flag = '[OK]' if blocks else '[--]'
    print("  %s %-40s %s" % (flag, name, types))

print("\n全部合法" if allok else "\n有解析错误")
