import json, re, sys
src, out = sys.argv[1], sys.argv[2]
lines = [l.strip() for l in open(src, encoding="utf-8")]
start = next(i for i, l in enumerate(lines) if l == "CORE VALUES")
end = next(i for i, l in enumerate(lines) if l.startswith("Candidate Assessment Chart"))
body = lines[start:end]
HEADS = ["Integrity", "Professionalism2", "Respect for Diversity", "Accountability", "Teamwork and Collaboration",
         "Communication", "Commitment to Continuous Learning", "Client and Result Orientation", "Organizational Awareness",
         "Empowering and Building Trust", "Managing Performance", "Judgment and Decision Making", "Strategic Planning and Vision",
         "Leadership", "Managing Resources", "Analytical Thinking", "Innovation and Creativity", "Technological Awareness",
         "Negotiation and Conflict Resolution", "Planning and Organizing", "Policy Development and Research", "Political Awareness",
         "Stakeholder Management", "Change Capability and Adaptability"]
GROUP = {"CORE VALUES": "valor", "CORE COMPETENCIES": "core", "MANAGERIAL COMPETENCIES": "managerial", "CROSS-FUNCTIONAL COMPETENCIES": "cross"}
items, cur, group = [], None, None
noise = re.compile(r"^(\d{1,2}|[-•\s]*|Verbal|Listening|Written)$")
for l in body:
    if l in GROUP: group = GROUP[l]; continue
    if l in HEADS:
        cur = {"name": l.rstrip("2"), "group": group, "def": [], "levels": {}, "questions": []}
        items.append(cur); state = "def"; continue
    if cur is None or noise.match(l): continue
    m = re.match(r"^L([1-4])\s*[-–]\s*(.*)$", l)
    if m: state = "L" + m.group(1); cur["levels"][state] = m.group(2).strip(); continue
    if l.startswith("Q.") or l.startswith("Q "):
        state = "Q"; cur["questions"].append({"q": l[2:].strip(), "probes": []}); continue
    if l.startswith(""):
        l2 = l.lstrip(" ").strip()
        if cur["questions"]: cur["questions"][-1]["probes"].append(l2)
        continue
    if state == "def": cur["def"].append(l)
    elif state.startswith("L"): cur["levels"][state] += " " + l
    elif state == "Q":
        q = cur["questions"][-1]
        if q["probes"] or q["q"].endswith("?"): q["probes"].append(l)  # bullets rendered without glyph
        else: q["q"] += " " + l
for it in items:
    it["def"] = " ".join(it["def"]).replace("  ", " ").strip()
json.dump(items, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for it in items:
    print(f'{it["group"]:10} {it["name"]:38} def={len(it["def"]):4} L={sorted(it["levels"])} Q={len(it["questions"])}')
