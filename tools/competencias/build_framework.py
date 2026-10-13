import json, sys, re
dl = sys.argv[1]; out = sys.argv[2]
ohrm = {r["name"]: r for r in json.load(open(f"{dl}/ohrm_full.json", encoding="utf-8"))}
unhcr = {r["name"]: r for r in json.load(open(f"{dl}/unhcr_framework.json", encoding="utf-8"))}
for r in ohrm.values():
    r["neg"] = [re.sub(r"\s*notes$", "", x) for x in r["neg"]]
# key, grupo (da base Notion), nome Notion, id Notion, nome OHRM, nome UNHCR, grupo UNHCR
ROWS = [
 ("integrity", "valor", "Integrity", "1e4b0f6321678083a3bae15af82e0b0e", "Integrity", "Integrity"),
 ("professionalism", "valor", "Professionalism", "1e4b0f6321678014b064e138b59ab159", "Professionalism", "Professionalism"),
 ("diversity", "valor", "Respect for Diversity", "1e4b0f6321678025b28af5b2e0e2f1a2", "Respect for Diversity", "Respect for Diversity"),
 ("communication", "core", "Communication", "1bcb0f632167813b8deed27142ceb2e6", "Communication", "Communication"),
 ("teamwork", "core", "Teamwork", "1bcb0f63216781348c1eff2e8652c291", "Teamwork", "Teamwork and Collaboration"),
 ("accountability", "core", "Accountability", "1bcb0f63216781868eefcef21c58a98b", "Accountability", "Accountability"),
 ("creativity", "core", "Innovation and Creativity", "1bcb0f63216781758b6cc6c75731f768", "Creativity", "Innovation and Creativity"),
 ("planning", "core", "Planning and Organizing", "1bcb0f63216781db8a54ceea3020e27b", "Planning and Organizing", "Planning and Organizing"),
 ("client", "core", "Client (&Result) Orientation", "1bcb0f63216781b6ba61f8d3151ed495", "Client Orientation", "Client and Result Orientation"),
 ("learning", "core", "Commitment to Continuous Learning", "1bcb0f63216781febe2ad009e0b22edf", "Commitment to Continuous Learning", "Commitment to Continuous Learning"),
 ("technology", "core", "Technological Awareness", "1bcb0f63216781cd9befde15c4533134", "Technological Awareness", "Technological Awareness"),
 ("leadership", "managerial", "Leadership", "1e4b0f63216780df8b44dcee739f3f90", "Leadership", "Leadership"),
 ("vision", "managerial", "Strategic Planning and Vision", "1e4b0f63216780f09b50d4f833460922", "Vision", "Strategic Planning and Vision"),
 ("empowering", "managerial", "Empowering Others", "1e4b0f63216780be8847e05d17d0b532", "Empowering Others", "Empowering and Building Trust"),
 ("trust", "managerial", "Bulding Trust", "1e4b0f632167804a8475e2f0485f311b", "Building Trust", "Empowering and Building Trust"),
 ("performance", "managerial", "Managerial Performance", "1e4b0f632167801b8deadd5184558abf", "Managing Performance", "Managing Performance"),
 ("judgement", "managerial", "Judgment/Decison Making", "1e4b0f632167808ebbccc5484ac2228e", "Judgement/Decisionmaking", "Judgment and Decision Making"),
 ("resources", "managerial", "Managing Resources", "1e4b0f6321678078a695cd52a92d47a6", None, "Managing Resources"),
 ("negotiation", "cross", "Negotiation and Conflict Resolution", "1e4b0f6321678004bff8deeb3ec5dad0", None, "Negotiation and Conflict Resolution"),
 ("analytical", "cross", "Analytical Thinking", "1e4b0f6321678085a2cbc34824363ef4", None, "Analytical Thinking"),
 ("policy", "cross", "Policy Development and Research", "1e4b0f63216780d8ad32d0265edffb99", None, "Policy Development and Research"),
 ("political", "cross", "Political Awareness", "1e4b0f63216780abb017d1e6fff7cd5c", None, "Political Awareness"),
 ("stakeholder", "cross", "Stakeholder Management", "1e4b0f63216780d19a0df6a930da1797", None, "Stakeholder Management"),
 ("change", "cross", "Change Capability and Adaptability", "1e4b0f63216780149c85d519e24c50e3", None, "Change Capability and Adaptability"),
]
UNHCR_GROUP = {}
for r in unhcr.values(): UNHCR_GROUP[r["name"]] = r["group"]
comps = []
for key, grupo, nome, nid, on, un in ROWS:
    c = {"key": key, "grupo": grupo, "nome": nome, "notionId": nid}
    if on:
        o = ohrm[on]
        c["ohrm"] = {"nome": on, "pos": o["pos"], "neg": o["neg"], "perguntas": o["questions"]}
    if un:
        u = unhcr[un]
        c["unhcr"] = {"nome": un, "grupo": u["group"], "def": u["def"], "niveis": u["levels"], "perguntas": u["questions"]}
    comps.append(c)
extra = unhcr["Organizational Awareness"]
data = {
  "versao": 1,
  "fontes": {
    "ohrm": "United Nations, Office of Human Resources Management. Competency-based Interviewing Guide (modelo 'UN Competencies for the Future', 1999).",
    "unhcr": "UNHCR. Best Practice Interview Guide for Interviewers: Skills and processes (quadro de competências do PAMS, 2008)."
  },
  "competencias": comps,
  "foraDaBase": [{"key": "orgawareness", "nome": "Organizational Awareness", "grupoUnhcr": "core", "def": extra["def"], "niveis": extra["levels"], "perguntas": extra["questions"]}],
  "escalas": {
    "unhcr": [
      {"n": "NE", "rotulo": "No evidence", "desc": "Candidate produced no evidence for interviewer/s to observe this competency"},
      {"n": 1, "rotulo": "Marginal", "desc": "Very few indicators observed"},
      {"n": 2, "rotulo": "Poor", "desc": "Few, partially achieved indicators were observed, but many were absent or were outweighed by negative behavior"},
      {"n": 3, "rotulo": "Acceptable", "desc": "Some positive evidence though scope for further development. Some indicators were fully or partially observed, but other behaviours omitted"},
      {"n": 4, "rotulo": "Good", "desc": "Clear, unambiguous evidence of competency. Many indicators observed in full, and others partially"},
      {"n": 5, "rotulo": "Outstanding", "desc": "Multiple examples of a high level of competency. Most indicators observed in full, with no significant omissions"}
    ],
    "ohrm": [
      {"n": "NE", "rotulo": "No Evidence", "desc": "Candidate unable to provide examples"},
      {"n": 1, "rotulo": "Marginal", "desc": "Fails to meet most of the competency definition"},
      {"n": 2, "rotulo": "Less than Acceptable", "desc": "Meets half of the competency definition"},
      {"n": 3, "rotulo": "Acceptable", "desc": "Meets half of the competency definition"},
      {"n": 4, "rotulo": "More than Acceptable", "desc": "Meets more than half of the competency definition"},
      {"n": 5, "rotulo": "Superior", "desc": "Meets most parts of the competency definition"}
    ]
  }
}
json.dump(data, open(out, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
import os
print("bytes", os.path.getsize(out), "comps", len(comps))
for c in comps: print(c["key"], "ohrm" in c, "unhcr" in c, len(c.get("ohrm",{}).get("perguntas",[])), len(c.get("unhcr",{}).get("perguntas",[])))
