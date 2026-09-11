# Curriculum import (one-off developer tool)

Imports the **official** learning objectives and success examples of the French cycle 1
programme from the ministry's PDF annexes into
`content/curriculum/<curriculum>/objectives/<DOMAIN>.json`.

It is **not part of the application**: no npm script, no CI job, no runtime dependency. It is
kept in the repository so that the provenance of official curriculum data can be audited and
the import repeated for a future programme version. The imported JSON is the source of truth
once reviewed (ADR-028, ADR-031).

## Sources

The documents, their citations and the SHA-256 of the exact PDFs that were imported are
recorded in `content/curriculum/maternelle-cycle1-cd-2026/curriculum.json` (`sources`).
Re-download them and check the hashes before re-running an import.

Both texts are freely reusable: education.gouv.fr publishes its content under the Licence
Ouverte (etalab-2.0) and states that official regulatory documents may be reproduced freely.
Each objective keeps its `sourceId` and page number.

## Running it

Requires Python 3.9+ and macOS (the cross-check uses PDFKit through Swift).

```bash
cd tools/curriculum-import
python3 -m venv venv && ./venv/bin/pip install pdfplumber
# Download the three PDFs named in curriculum.json into this directory as
# annex2026.pdf, annex1-2024.pdf and annex2-2024.pdf, then check their SHA-256.
./venv/bin/python extract.py                       # -> raw.json (structure + provenance)
swift pdflines.swift annex2026.pdf > annex2026.lines.tsv      # (and the other two)
python3 crosscheck.py                              # 0 unmatched lines required
./venv/bin/python build_content.py ../../content/curriculum/maternelle-cycle1-cd-2026/objectives
```

## How it works

- `extract.py` reads each PDF with `pdfplumber`, using position, font weight and colour to
  recognise domains, parts, competencies, age bands and the two table columns (objectives on
  the left, success examples on the right). The column boundary is taken from each table's own
  "Exemples de réussite" header, because it moves from table to table.
- `crosscheck.py` verifies every extracted source line against an **independent** extraction
  made by PDFKit. The import is only accepted when no line is unmatched and the number of
  bulleted lines matches exactly.
- `build_content.py` writes the content files: it gives each item a stable code, keeps the row
  groups of the official tables, and merges an objective repeated word for word in several age
  bands into one objective carrying several bands (never one copy per level).

## What it does not do

- It does not invent, summarise or reword anything: statements are copied verbatim.
- Success examples are attached to their competency and age band, not to a single objective,
  because the official tables do not align them row by row (docs/CURRICULUM.md).
