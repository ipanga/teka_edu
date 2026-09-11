"""Structured extraction of the French cycle 1 programme tables (dev-only tool, not shipped).

Output: raw.json = {domainCode: [ {subdomain, competencies: [ {title, tables: [ {band, rows...} ]} ]} ]}
Every text is copied from the PDF; only line breaks, bullets and page breaks are normalised.
"""
import json, re, sys, unicodedata, collections
import pdfplumber

BANDS = [("before-4", "À aborder avant 4 ans"), ("from-4", "À partir de 4 ans"), ("from-5", "À partir de 5 ans")]
DOMAIN_TITLES = {
    "Agir, s’exprimer, comprendre à travers les activités physiques": "PHYS",
    "Agir, s’exprimer, comprendre à travers les activités artistiques": "ART",
    "Se repérer dans le temps et l’espace": "TIME-SPACE",
    "Découvrir le monde du vivant, de la matière et des objets": "WORLD",
    "Le développement et la structuration du langage oral et écrit": "LANG",
    "L’acquisition des premiers outils mathématiques": "MATH",
}
NON_COMPETENCY = {"Introduction", "Points de vigilance", "Points de vigilance :", "Principes", "Sommaire"}
BULLET_CHARS = "•"

DOCS = {
    "annex2026": dict(file="annex2026.pdf", margin=37.5, col=283, kind="2026", first_page=5),
    "lang": dict(file="annex1-2024.pdf", margin=44.5, col=172, kind="2024", domain="LANG", first_page=2),
    "math": dict(file="annex2-2024.pdf", margin=44.5, col=218, kind="2024", domain="MATH", first_page=2),
}


def nfc(s):
    return unicodedata.normalize("NFC", s)


def words_of(page):
    ws = page.extract_words(extra_attrs=["fontname", "size", "non_stroking_color"], keep_blank_chars=False, x_tolerance=1.5, y_tolerance=2)
    for w in ws:
        w["bold"] = "bold" in w["fontname"].lower()
        c = w.get("non_stroking_color") or ()
        w["blue"] = isinstance(c, (tuple, list)) and len(c) == 3 and c[2] > 0.3 and c[0] < 0.2
        w["text"] = nfc(w["text"])
    return ws


def assemble(words):
    """Group words (already one column) into lines by top."""
    words = sorted(words, key=lambda w: (w["top"], w["x0"]))
    lines = []
    for w in words:
        if lines and abs(lines[-1]["top"] - w["top"]) < 3:
            l = lines[-1]
            l["words"].append(w)
        else:
            lines.append({"top": w["top"], "words": [w]})
    out = []
    for l in lines:
        ws = sorted(l["words"], key=lambda w: w["x0"])
        text = ""
        prev = None
        for w in ws:
            if prev is not None and w["x0"] - prev["x1"] > 1.0:
                text += " "
            text += w["text"]
            prev = w
        boldchars = sum(len(w["text"]) for w in ws if w["bold"])
        allchars = sum(len(w["text"]) for w in ws)
        out.append({
            "top": l["top"], "x0": ws[0]["x0"], "text": re.sub(r"\s+", " ", text).strip(),
            "bold": boldchars * 2 > allchars, "size": max(round(w["size"], 1) for w in ws),
            "blue": ws[0]["blue"],
        })
    return out


def is_band(text):
    t = text.lstrip("• ").strip()
    for code, prefix in BANDS:
        if t.startswith(prefix):
            return code
    return None


def join_text(cur, nxt):
    if cur.endswith("-") and len(cur) > 1 and cur[-2].isalpha() and nxt[:1].islower():
        return cur + nxt
    return cur + " " + nxt


def parse(docname):
    cfg = DOCS[docname]
    result = collections.OrderedDict()
    domain = cfg.get("domain")
    subdomain = None
    pending_comp = None
    comp = None
    table = None  # {"band", "objectives": [], "examples": []}
    band = None
    in_table = False
    carried_col = cfg["col"]
    cur = {"L": None, "R": None}
    group = None
    pending_group = None
    last_heading = None  # (kind, top) for wrapped headings

    def get_sub():
        return result.setdefault(domain, [])

    def new_table():
        nonlocal comp, table
        if comp is None or comp["title"] != (pending_comp or subdomain["title"]) or comp.get("_closed"):
            title = pending_comp or subdomain["title"]
            comp = {"title": title, "tables": []}
            subdomain["competencies"].append(comp)
        table = {"band": band, "group": pending_group, "objectives": [], "examples": []}
        comp["tables"].append(table)

    with pdfplumber.open(cfg["file"]) as pdf:
        for pno, page in enumerate(pdf.pages, 1):
            if pno < cfg["first_page"]:
                continue
            ws = words_of(page)
            # Pass 1: full-width lines to find markers.
            full = assemble(ws)
            # Decide per line whether it is inside a table: we walk the full lines in order, and when inside
            # a table we re-assemble words by column for the band of tops until the table ends.
            i = 0
            # Build column lines for the whole page once; we pick them by top ranges.

            def header_col(top):
                if cfg["kind"] == "2026":
                    return cfg["col"]  # headers are centred in the 2026 annex; its columns are fixed
                ex = [w for w in ws if w["text"].startswith("Exemples") and abs(w["top"] - top) < 3]
                return ex[0]["x0"] - 3 if ex else cfg["col"]
            # Walk full-width lines; when a table header appears, switch to column lines until end marker.
            y_table_start = None
            events = []  # (top, kind, payload)
            for idx, l in enumerate(full):
                t = l["text"]
                if not t:
                    continue
                if t.startswith("Objectifs d’apprentissage") and "Exemples de réussite" in t:
                    events.append((l["top"], "table-header", l))
                    continue
                events.append((l["top"], "line", l))

            state_in_table = in_table
            # Determine table regions on this page: from each table-header (or page top if carried over)
            # until an end marker line.
            regions = []
            start = 0.0 if state_in_table else None
            col = carried_col
            for (top, kind, l) in events:
                if kind == "table-header":
                    if start is not None:
                        regions.append((start, top, col))
                    start = top + 1  # table body starts after the header
                    col = header_col(top)
                    continue
                if start is not None and top > start:
                    x0, t = l["x0"], l["text"]
                    at_margin = x0 < cfg["margin"]
                    heading_like = l["size"] >= 10 and cfg["kind"] == "2026" and at_margin
                    band_line = is_band(t) is not None and at_margin
                    if band_line or heading_like:
                        regions.append((start, top, col)); start = None
                    elif at_margin and cfg["kind"] == "2024":
                        if l["bold"]:
                            # A bold title directly followed by a table header starts the next table (group
                            # title); one followed by indented table content is an in-table row-group header.
                            nxt_any = next((e for e in events if e[0] > top + 1), None)
                            nxt = next((m for (tp, k, m) in events if tp > top + 1 and k == "line"), None)
                            if nxt_any is not None and nxt_any[1] != "table-header" and (nxt is None or nxt["x0"] >= cfg["margin"]):
                                continue
                        regions.append((start, top, col)); start = None
                    elif at_margin and cfg["kind"] == "2026":
                        regions.append((start, top, col)); start = None
            if start is not None:
                regions.append((start, 10_000, col))
                in_table = True
                carried_col = col
            else:
                in_table = False

            def in_region(top):
                return any(a <= top < b for (a, b, _) in regions)

            # Now process events outside regions as structure lines, and column lines inside regions.
            stream = []
            for (top, kind, l) in events:
                if kind == "table-header":
                    stream.append((top, 0, "table-header", l))
                elif not in_region(top):
                    stream.append((top, 0, "line", l))
            for (a, b, c) in regions:
                inside = [w for w in ws if a <= w["top"] < b]
                for side, part in (("L", [w for w in inside if w["x0"] < c]), ("R", [w for w in inside if w["x0"] >= c])):
                    for l in assemble(part):
                        stream.append((l["top"], 1 if side == "L" else 2, "col", dict(l, side=side, col=c)))
            stream.sort(key=lambda s: (s[0], s[1]))

            for (top, _, kind, l) in stream:
                t = l["text"]
                if kind == "table-header":
                    new_table()
                    cur = {"L": None, "R": None}
                    group = pending_group
                    pending_group = None
                    last_heading = None
                    continue
                if kind == "line":
                    b = is_band(t)
                    if b and l["x0"] < cfg["margin"]:
                        band = b
                        continue
                    if cfg["kind"] == "2026":
                        if l["size"] >= 13.5:
                            code = DOMAIN_TITLES.get(t)
                            if code:
                                domain = code; subdomain = None; pending_comp = None; comp = None
                            continue
                        if domain is None:
                            continue
                        if l["size"] >= 10.8 and l["x0"] < cfg["margin"]:
                            if t != "Principes":
                                subdomain = {"title": t, "competencies": []}
                                get_sub().append(subdomain)
                            else:
                                subdomain = None
                            pending_comp = None; comp = None
                            continue
                        if 9.8 <= l["size"] < 10.8 and l["x0"] < cfg["margin"]:
                            pending_comp = t
                            continue
                    else:
                        at_margin = l["x0"] < cfg["margin"]
                        if l["bold"] and l["size"] >= 10.8 and at_margin:
                            if last_heading and last_heading[0] == "sub" and top - last_heading[1] < 20 and subdomain:
                                subdomain["title"] += " " + t; last_heading = ("sub", top); continue
                            if t != "Principes":
                                subdomain = {"title": t, "competencies": []}
                                get_sub().append(subdomain)
                            else:
                                subdomain = None
                            pending_comp = None; comp = None; pending_group = None
                            last_heading = ("sub", top)
                            continue
                        if l["bold"] and l["blue"] and at_margin and t.rstrip(" :") not in NON_COMPETENCY and subdomain is not None:
                            if last_heading and last_heading[0] == "comp" and top - last_heading[1] < 14:
                                pending_comp += " " + t; last_heading = ("comp", top); continue
                            pending_comp = t
                            comp = None; pending_group = None
                            last_heading = ("comp", top)
                            continue
                        if l["bold"] and not l["blue"] and at_margin and subdomain is not None:
                            nxt = next((e for e in events if e[0] > top + 1), None)
                            if nxt is not None and nxt[1] == "table-header":
                                pending_group = t
                            last_heading = None
                            continue
                        last_heading = None
                    continue
                # Column line inside a table.
                side = l["side"]
                if (cfg["kind"] == "2024" and side == "L" and l["bold"]
                        and not re.match(r"^[-–]\s", t) and len(t) < 60):
                    # A bold, unbulleted line in the objectives column labels the rows that follow
                    # (e.g. "La longueur", "La masse", "Connaitre le nom des lettres").
                    group = t
                    cur = {"L": None, "R": None}
                    continue
                if t.startswith("Objectifs d’apprentissage") or t.startswith("Exemples de réussite"):
                    continue
                target = table["objectives"] if side == "L" else table["examples"]
                is_new = re.match(r"^[-–]\s", t) is not None
                is_sub = t[:1] in BULLET_CHARS
                heading_item = side == "R" and l["bold"] and not is_new and not is_sub and l["x0"] <= l["col"] + 11
                if is_new or heading_item or cur[side] is None:
                    item = {"text": re.sub(r"^[-–]\s*", "", t), "group": group, "page": pno, "heading": heading_item, "src": [(pno, t)]}
                    target.append(item); cur[side] = item
                    continue
                cur[side]["src"].append((pno, t))
                if is_sub:
                    cur[side]["text"] += "\n• " + t[1:].strip()
                elif re.match(r"^(Par exemple|Ou encore|Ainsi)", t):
                    cur[side]["text"] += "\n" + t
                else:
                    cur[side]["text"] = join_text(cur[side]["text"], t)
    return result


if __name__ == "__main__":
    out = {}
    for d in DOCS:
        for k, v in parse(d).items():
            out.setdefault(k, []).extend(v)
    json.dump(out, open("raw.json", "w"), ensure_ascii=False, indent=1)
    for code, subs in out.items():
        comps = sum(len(s["competencies"]) for s in subs)
        objs = sum(len(t["objectives"]) for s in subs for c in s["competencies"] for t in c["tables"])
        exs = sum(len(t["examples"]) for s in subs for c in s["competencies"] for t in c["tables"])
        tabs = sum(len(c["tables"]) for s in subs for c in s["competencies"])
        print(f"{code}: {len(subs)} subdomains, {comps} competencies, {tabs} tables, {objs} objective rows, {exs} examples")
