import json, re, sys
src, out = sys.argv[1], sys.argv[2]
L = open(src, encoding="utf-8").read().split("\n")
NAMES = ["Integrity", "Professionalism", "Respect for Diversity", "Communication", "Teamwork", "Planning and Organizing",
         "Accountability", "Client Orientation", "Creativity", "Technological Awareness", "Commitment to Continuous Learning",
         "Vision", "Leadership", "Empowering Others", "Managing Performance", "Building Trust", "Judgement/Decisionmaking"]
def split_line(line, col):
    # split at the whitespace run closest to the header column
    best = None
    for m in re.finditer(r"\s{2,}", line):
        if m.end() >= col - 8 and m.start() <= col + 4:
            d = abs(m.end() - col)
            if best is None or d < best[0]: best = (d, m)
    if best: m = best[1]; return line[:m.start()], line[m.end():]
    if len(line.rstrip()) and len(line) - len(line.lstrip()) >= col - 6: return "", line
    return line, ""
def bullets(chunks):
    items, cur = [], None
    for c in chunks:
        c = c.strip()
        if not c or c in ("?", "+", "-", "-+"): continue
        if c.startswith("•"):
            if cur: items.append(cur)
            cur = c.lstrip("• ").strip()
        elif cur is not None: cur += " " + c
    if cur: items.append(cur)
    return [re.sub(r"\s+", " ", i) for i in items]
res = []
for i, line in enumerate(L):
    if "Positive Indicators" in line and "Negative Indicators" in line:
        col = line.index("Negative Indicators")
        # competency name: nearest preceding line matching a known name
        name = None
        for j in range(i - 1, max(0, i - 40), -1):
            t = L[j].strip()
            hit = [n for n in NAMES if t == n or t.replace(" ", "") == n.replace(" ", "")]
            if hit: name = hit[0]; break
        pos, neg = [], []
        for k in range(i + 1, len(L)):
            if L[k].strip().startswith("Sample Questions"): break
            a, b = split_line(L[k], col)
            pos.append(a); neg.append(b)
        res.append({"name": name, "pos": bullets(pos), "neg": bullets(neg)})
json.dump(res, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for r in res: print(r["name"], len(r["pos"]), len(r["neg"]))
