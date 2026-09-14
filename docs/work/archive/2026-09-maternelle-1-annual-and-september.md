# Active Task

<!--
  The checkpoint for the task in progress. A fresh Claude Code session reads this file, compares
  it with the repository, and resumes — see docs/RESUMABLE_WORKFLOW.md.

  Git wins over this file when the two disagree. Keep it current: an out-of-date checkpoint is
  worse than none, because it is believed.
-->

## Task

1ère maternelle: verify the `before-4` band, audit its objective corpus, build the full
2026-2027 annual progression, check 189-day feasibility — and only then author September.

## Objective

A verified, defensible year plan for the youngest class, then one month of lessons, through
the ADR-047 review gate.

## Status

`completed`

## Branch

`feat/maternelle-1-annual-and-september`

## Base Branch

`develop` at `ead8d8b`

## Started

2026-09-15

## Last Checkpoint

2026-09-15 — PR #35 merged as `5a9387f`; migration applied to Supabase DEV and 28 tests green
against live staging.

## Scope

- Verify `before-4` against the authoritative programme; document the interpretation.
- Audit the 1ère maternelle objective corpus.
- Full 2026-2027 annual progression + 189-day feasibility.
- September lessons **only**, then weekly review packages.

## Out of Scope

- October. 2ème maternelle. Production. `main`.
- Marking anything `approved`: that needs the review gate (ADR-047).
- A second planning engine: the runtime model stays level-agnostic.

## Product Decisions

- Parent-led after-school répétiteur; 30-45 minutes, September stays at 35 (ADR-039).
- French Cycle 1 is the curriculum; DRC calendar and context; PNEM as compatibility (ADR-037).
- Media is repository SVG by stable id, $0 (ADR-042).
- The app opens on a class; a class with no lessons says so and borrows nothing (ADR-044).
- Animation is decoration, always off under `prefers-reduced-motion` (ADR-045).
- The parent is the voice; no synthesised speech for a word a child copies (ADR-046).
- **The pedagogical gate is an independent review, not necessarily a human one** (ADR-047).
  AI-assisted review is the active development gate; a teacher's is optional future assurance.
  Every approval records which kind it was. Never write "teacher approved" unless one did.
- An activity claims only what it actually works; a mis-mapped ritual means auditing the month.
- A reviewer must see what they are asked to judge: generation fails if the package cannot.
- Never claim the app observed what it cannot see.

## Completed

- [x] **Band verified.** `maternelle-1` → reference section `PS` → `before-4`
      (« À aborder avant 4 ans »), declared in `content/curriculum/.../curriculum.json` with the
      arrêté du 16 avril 2026 as its source. The method is confirmed by arithmetic: the same
      rule gives `from-5` = **162**, exactly the count the 3ème annual plan was built on.
- [x] **Corpus audited: 116 objectives applicable to `before-4`** of 398 total — 106 exclusive,
      plus 10 that also belong to a later band (6 span all three, 4 span before-4 and from-4).
      By domain: LANG 27 · ART 24 · TIME-SPACE 22 · MATH 17 · WORLD 14 · PHYS 12.
- [x] **Provenance complete**: 0 objectives missing a source. No duplicates. Nothing found that
      is too advanced for the band — the corpus reads correctly for three-year-olds (count to
      three or four, the number rhyme to six, sort by shape, say what you are doing).

- [x] **Annual plan generated**: `maternelle-1-annual-plan.json`, 116 objectives over 189 days,
      6 periods. P1 40 · P2 22 · P3 19 · P4 13 · P5 22 · **P6 0** (the last period reprises).
- [x] **The builder is now one engine, parameterised by level** (`tools/annual-plan/levels/`).
      Regenerating 3ème is byte-identical apart from one objective — see below.
- [x] **`npm run plan:report`**: load per period, domain balance, revisit distribution,
      home feasibility, first month. 904 objective-passages over 189 days = 4.8/day.
- [x] September trimmed from 31 objectives to **24**, all introduced by day 13

## In Progress

Nothing. The 1ère maternelle annual plan and September are finished and archived.

## Remaining

Nothing here. The five 1ère review packages await the ADR-047 gate — a separate task.

## Validation State

| Check              | Result | At                                   |
| ------------------ | ------ | ------------------------------------ |
| format             | PASS   | CI on `5a9387f`                      |
| lint               | PASS   | CI on `5a9387f`                      |
| typecheck          | PASS   | CI on `5a9387f`                      |
| unit tests         | PASS   | CI on `5a9387f` — 218 tests          |
| content validation | PASS   | CI on `5a9387f` — 30 files           |
| database tests     | PASS   | CI on `5a9387f` — 149 assertions     |
| build              | PASS   | CI on `5a9387f`                      |
| E2E                | PASS   | live staging on `5a9387f` — 28 tests |
| Docker             | PASS   | CI on `5a9387f`                      |
| secret scans       | PASS   | CI on `5a9387f`; 0 tracked `.env*`   |

## Database State

- Local: 12 migrations; `db reset` + 144 pgTAP assertions pass.
- DEV: 12 migrations, local and remote identical; 38 media assets, 14 illustrated texts, 36
  tables, 0 approved lessons; security advisors clean.
- PROD: untouched.

## Deployment State

Migration `20260915100000_maternelle_1_september.sql` applied to Supabase **DEV**. Staging
redeployed from `develop` at `5a9387f`. PROD untouched; `main` at `1b95480`.

## Git State

- `develop` at `27e9054` plus this closing change. No feature branch, no open PR.

## Blockers

None.

## User Decisions Needed

- Which task comes next. The recommendation is to run one real September session with a child,
  following `docs/REAL_SESSION_TESTING.md`, before deciding between October, audio, or more
  visuals.

## Exact Resume Point

Finished. Next: submit `docs/review/2026-2027-maternelle-1-semaine-1.md` to the review gate.

## Resume Verification

1. `git branch --show-current` is `feat/september-child-experience`;
2. `git log -n 5 --oneline` — branch point is `ec4eb26`;
3. `git status --short` — read uncommitted work before discarding it;
4. `gh pr list --head feat/september-child-experience` — a Draft PR may exist;
5. `npx supabase migration list --linked` only if a migration was in flight;
6. `gh run list --branch develop --limit 3` before assuming a deployment is needed.

## Findings — the 1ère maternelle interpretation, stated so it can be argued with

**`before-4` is right, and it is a floor rather than a bracket.** The programme's bands are
developmental, not ages: each is worded « ou dès que les apprentissages précédents ont pu être
observés ». 1ère maternelle maps to Petite Section, where children are three turning four, so
« à aborder avant 4 ans » is the band whose learning the year is _introducing_.

**The structural difference from 3ème maternelle**: `before-4` is the **earliest** band, so this
level has no earlier band to draw on. The rule that a lesson may use its own band or an earlier
one gives 3ème three bands to reinvest from and 1ère exactly one. Every objective a 1ère lesson
touches is one it is introducing.

**116 objectives over 189 days, against 162 for 3ème.** Fewer objectives across the same year is
the correct shape, not a gap to fill: a three-year-old learns by repetition, so the plan should
buy revisits with the spare days rather than invent objectives.

**Ten objectives are shared with a later band** (`LANG-S01-C01-O02`, `MATH-S01-C01-O05` and
eight others). They are introduced here and deepened in 2ème/3ème; the plan schedules them, and
the later levels' plans already treat them as their own.

## A defect this work exposed

Regenerating the **3ème** plan did not reproduce the committed file. The Week 1 review had me
correct `LANG-S02-C03-O15`'s pacing **by editing the generated JSON directly**, so the generator
still held the old values and would have silently reverted them the next time anyone ran it.
That is precisely the failure ADR-028 exists to prevent, and I caused it.

Fixed at the source: the objective's day moved to 9 in `levels/maternelle-3.ts`, and a
`cadenceOverrides` field records that this one objective is periodic inside a daily domain. The
regenerated plan now differs from the committed one **only** on that objective's derived fields
(`reinforceUntilDay`, `consolidateByDay`, `plannedRevisits`), which my hand edit had left stale.
Every one of the other 161 entries is identical.
