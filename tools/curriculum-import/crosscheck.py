# Cross-check: every source line of every extracted item must equal (whitespace-normalised) a line that
# PDFKit (an independent extractor) finds on the same page.
import json, re, unicodedata, collections, sys
norm = lambda s: re.sub(r"\s+", "", unicodedata.normalize("NFC", s)).replace("", "").replace("•", "").lstrip("-–")
pk = {}
for doc, f in [("annex2026", "annex2026.lines.tsv"), ("lang", "annex1-2024.lines.tsv"), ("math", "annex2-2024.lines.tsv")]:
    d = collections.defaultdict(set)
    for row in open(f, encoding="utf-8"):
        p = row.rstrip("\n").split("\t")
        if len(p) >= 6: d[int(p[0])].add(norm(p[5]))
    pk[doc] = d
raw = json.load(open("raw.json"))
docof = {"PHYS": "annex2026", "ART": "annex2026", "TIME-SPACE": "annex2026", "WORLD": "annex2026", "LANG": "lang", "MATH": "math"}
total = bad = 0
for code, subs in raw.items():
    for s in subs:
        for c in s["competencies"]:
            for t in c["tables"]:
                for it in t["objectives"] + t["examples"]:
                    for (page, line) in it["src"]:
                        total += 1
                        n = norm(line)
                        lines = pk[docof[code]][page]
                        if n not in lines and not any(n in l for l in lines):
                            bad += 1
                            if bad <= 25: print(f"{code} p{page}: {line[:110]}")
print(f"source lines checked: {total}, not matched by PDFKit: {bad}")
