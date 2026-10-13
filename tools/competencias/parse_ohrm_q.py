import json, re, sys
src, ind_path, out = sys.argv[1], sys.argv[2], sys.argv[3]
L = open(src, encoding="utf-8").read().replace("\f", "\n").split("\n")
ind = json.load(open(ind_path, encoding="utf-8"))
NAMES = {r["name"] for r in ind} | {"Teamwork", "Judgement/Decision-making", "Judgement/Decisionmaking", "Core Values", "Core", "Values", "Managerial", "Competencies", "Core Competencies", "Managerial Competencies", "CoreValues", "Assessment", "Sheet"}
blocks, cur = [], None
for raw in L:
    line = re.sub(r"\s+notes\s*$", "", raw.rstrip())
    t = line.strip()
    if t.startswith("Sample Questions"):
        cur = []; blocks.append(cur); continue
    if cur is None: continue
    if t.startswith("Positive Indicators") or t in NAMES or t.startswith("Assessment"):
        cur = None; continue
    if not t or t in ("?", "notes", "-+", "+", "-") or t.startswith("Continued on next page"): continue
    bullet = t.startswith("•")
    t2 = t.lstrip("•").strip()
    if not t2: continue
    indented = bullet or (len(line) - len(line.lstrip()) >= 2)
    if not cur:
        cur.append({"q": t2, "probes": []}); continue
    q = cur[-1]
    if not indented:
        if not q["probes"] and not re.search(r"[?.]$", q["q"]): q["q"] += " " + t2
        else: cur.append({"q": t2, "probes": []})
    else:
        if q["probes"] and not bullet and not re.search(r"[?.]$", q["probes"][-1]): q["probes"][-1] += " " + t2
        elif not q["probes"] and not bullet and not re.search(r"[?.]$", q["q"]): q["q"] += " " + t2
        else: q["probes"].append(t2)
print("blocks:", len(blocks), "indicators:", len(ind))
for r, b in zip(ind, blocks):
    r["questions"] = b
    print(f'{r["name"]:36} Q={len(b)} probes={sum(len(x["probes"]) for x in b)}')
json.dump(ind, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
