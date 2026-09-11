"""raw.json -> content/curriculum/<curriculum>/objectives/<DOMAIN>.json (dev-only import tool).

Objectives repeated word for word in several age bands become ONE objective with several bands.
Success examples stay attached to their competency + age band (+ row group), because the official
tables do not align them with individual objectives.
"""
import json, re, sys, unicodedata, collections, pathlib

CURRICULUM = "maternelle-cycle1-cd-2026"
SOURCES = {
    "annex2026": "programme-2026",
    "lang": "programme-2024-langage",
    "math": "programme-2024-mathematiques",
}
DOC_OF = {"PHYS": "annex2026", "ART": "annex2026", "TIME-SPACE": "annex2026", "WORLD": "annex2026",
          "LANG": "lang", "MATH": "math"}
BAND_ORDER = ["before-4", "from-4", "from-5"]


def clean(text):
    t = unicodedata.normalize("NFC", text).strip()
    t = re.sub(r"[ \t]+", " ", t)
    t = re.sub(r" *\n *", "\n", t)
    return t.strip(" ;")


def key(text):
    return re.sub(r"[^a-zà-ÿ0-9]", "", clean(text).lower())


def build(raw, out_dir):
    out_dir.mkdir(parents=True, exist_ok=True)
    counts = {}
    for domain, subs in raw.items():
        doc = DOC_OF[domain]
        payload = {
            "curriculumId": CURRICULUM,
            "domainCode": domain,
            "sourceId": SOURCES[doc],
            "subdomains": [],
        }
        for si, sub in enumerate(subs, 1):
            scode = f"{domain}-S{si:02d}"
            sd = {"code": scode, "position": si, "title": clean(sub["title"]), "competencies": []}
            for ci, comp in enumerate(sub["competencies"], 1):
                ccode = f"{scode}-C{ci:02d}"
                objectives = collections.OrderedDict()  # key -> objective
                examples = []
                for table in comp["tables"]:
                    band = table["band"]
                    group = clean(table["group"]) if table.get("group") else None
                    for o in table["objectives"]:
                        text = clean(o["text"])
                        if not text:
                            continue
                        ogroup = clean(o["group"]) if o.get("group") else group
                        k = (ogroup, key(text))
                        if k in objectives:
                            if band not in objectives[k]["ageBands"]:
                                objectives[k]["ageBands"].append(band)
                        else:
                            objectives[k] = {
                                "code": None, "position": 0, "group": ogroup, "statement": text,
                                "ageBands": [band], "sourcePage": o["page"],
                            }
                    for ei, e in enumerate(table["examples"], 1):
                        text = clean(e["text"])
                        if not text:
                            continue
                        examples.append({
                            "ageBand": band, "position": len(examples) + 1,
                            "group": clean(e["group"]) if e.get("group") else group,
                            "statement": text, "sourcePage": e["page"],
                        })
                objs = list(objectives.values())
                for oi, o in enumerate(objs, 1):
                    o["code"] = f"{ccode}-O{oi:02d}"
                    o["position"] = oi
                    o["ageBands"].sort(key=BAND_ORDER.index)
                sd["competencies"].append({
                    "code": ccode, "position": ci, "title": clean(comp["title"]),
                    "objectives": objs, "successExamples": examples,
                })
            payload["subdomains"].append(sd)
        path = out_dir / f"{domain}.json"
        path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        counts[domain] = (
            len(payload["subdomains"]),
            sum(len(c["competencies"]) for c in payload["subdomains"]),
            sum(len(o["objectives"]) for s in payload["subdomains"] for o in s["competencies"]),
            sum(len(o["successExamples"]) for s in payload["subdomains"] for o in s["competencies"]),
        )
    return counts


if __name__ == "__main__":
    raw = json.load(open("raw.json"))
    out = pathlib.Path(sys.argv[1])
    counts = build(raw, out)
    total_o = total_e = 0
    for d, (s, c, o, e) in counts.items():
        print(f"{d}: {s} subdomains, {c} competencies, {o} objectives, {e} success examples")
        total_o += o; total_e += e
    print(f"TOTAL: {total_o} objectives, {total_e} success examples")
