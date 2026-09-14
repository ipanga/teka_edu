# Active Task

<!--
  The checkpoint for the task in progress. A fresh Claude Code session reads this file, compares
  it with the repository, and resumes — see docs/RESUMABLE_WORKFLOW.md.

  Git wins over this file when the two disagree. Keep it current: an out-of-date checkpoint is
  worse than none, because it is believed.
-->

## Task

Apply the Week 1 pedagogical review feedback (13 items): correct objective traceability
in the September content, and make the review package show the reviewer the actual text.

## Objective

Give a qualified 3ème maternelle teacher a package they can judge — complete stories,
rhymes and questions, untruncated official excerpts, and objective claims that match what the
activities really do.

## Status

`in_progress`

## Branch

`fix/week-1-review-corrections`

## Base Branch

`develop` at `c8e9e0f`

## Started

2026-09-14

## Last Checkpoint

2026-09-14 — all 13 review items applied; full local suite green including a fresh database
reset. Next: docs, then mark PR #31 ready.

## Scope

- Review package generator: full story/rhyme text, comprehension questions, untruncated
  official excerpts, screen-time wording, pause/split guidance.
- Objective traceability fixes in `content/lessons/**` and the annual plan where the review
  showed the pacing was fitted to a wrong claim.
- « Ma bande des jours » redesign; market examples made family-adaptable.
- Regenerate all five review packages; full validation.

## Out of Scope

- October, and 1ère/2ème maternelle content.
- Approving any lesson. ISSUE-017 stays open.
- Rewriting the week: §12 of the review lists what must stay.

## Product Decisions

- Parent-led after-school répétiteur; 30-45 minutes, September stays at 35 (ADR-039).
- French Cycle 1 is the curriculum; DRC calendar and context; PNEM as compatibility (ADR-037).
- Media is repository SVG by stable id, $0 (ADR-042).
- The app opens on a class; a class with no lessons says so and borrows nothing (ADR-044).
- Animation is decoration: short, never looping, always off under `prefers-reduced-motion` (ADR-045).
- The parent is the voice. No synthesised speech for a word a child copies; audio only where a
  human recording exists, never autoplaying (ADR-046).
- The screen guides; it never replaces speaking, moving or handling real things.
- Never claim the app observed what it cannot see.

## Completed

- [x] Audited every activity claiming the three flagged objectives across all 22 September days
- [x] **Item 1** — stories, rhymes and comprehension questions are quoted in full in the package
- [x] **Item 2** — the daily read-aloud no longer claims O15; O15 moved to the two activities
      that genuinely link a story to the child's life (days 9 and 15)
- [x] **Item 3** — the endurance objective removed from « Cours et arrête-toi », and from three
      more activities the audit found making the same claim
- [x] **Item 4** — « Je me dessine en train de bouger » now carries `WORLD-S01-C02-O09`
- [x] **Item 5** — the pronoun objective kept, and made real: « À quoi sert le crayon ? »
      « Il sert à écrire. »
- [x] **Item 6** — the day-3 ritual maps to the taught corpus; the Kumu questions to `O09`
- [x] **Item 7** — the day strip is prepared in order by the adult, with a marker to move; no
      reading prerequisite. Market examples are now explicitly the family's own
- [x] **Item 8** — the take-away question is a typed, optional extension, shown as such
- [x] **Item 9** — official excerpts are no longer cut at their first line (43 are multi-line)
- [x] **Item 10** — « temps d'écran actif de l'enfant », with a note that the adult still reads
- [x] **Item 11** — the package states that 35 min is not a finish line
- [x] **Item 12** — nothing on the keep-list was touched
- [x] **Item 13** — packages regenerated; content, traceability, unit, pgTAP, E2E all green

## In Progress

- [ ] Documentation, PR ready, CI, merge, staging

## Remaining

- [ ] Items 2-8 content edits
- [ ] Items 1, 9, 10, 11 generator edits
- [ ] Tests: text present, no truncated bullet, traceability
- [ ] Regenerate packages, full validation, PR

## Validation State

| Check              | Result  | At                                |
| ------------------ | ------- | --------------------------------- |
| format             | PASS    | working tree                      |
| lint               | PASS    | working tree                      |
| typecheck          | PASS    | working tree                      |
| unit tests         | PASS    | working tree — 214 tests          |
| content validation | PASS    | working tree — 21 files           |
| database tests     | PASS    | fresh reset — 144 assertions      |
| build              | PASS    | working tree                      |
| E2E                | PASS    | working tree — 27 tests           |
| Docker             | NOT RUN | left to CI                        |
| secret scans       | PASS    | 0 tracked `.env*`; gitleaks in CI |

## Database State

- Local: 12 migrations; `db reset` + 144 pgTAP assertions pass.
- DEV: 12 migrations, local and remote identical; 38 media assets, 14 illustrated texts, 36
  tables, 0 approved lessons; security advisors clean.
- PROD: untouched.

## Deployment State

- Staging: deployed at `27e9054`; 20 E2E tests passed against the live deployment.
- Production: disabled; `main` at `1b95480`.

## Git State

- `develop` at `27e9054` plus this closing change. No feature branch, no open PR.

## Blockers

None.

## User Decisions Needed

- Which task comes next. The recommendation is to run one real September session with a child,
  following `docs/REAL_SESSION_TESTING.md`, before deciding between October, audio, or more
  visuals.

## Exact Resume Point

Update the documentation, mark PR #31 ready, wait for CI, squash-merge, verify staging.

## Resume Verification

1. `git branch --show-current` is `feat/september-child-experience`;
2. `git log -n 5 --oneline` — branch point is `ec4eb26`;
3. `git status --short` — read uncommitted work before discarding it;
4. `gh pr list --head feat/september-child-experience` — a Draft PR may exist;
5. `npx supabase migration list --linked` only if a migration was in flight;
6. `gh run list --branch develop --limit 3` before assuming a deployment is needed.

## Findings — the corrections this review requires

**The daily « Le temps de lecture » ritual (22 activities) claims `LANG-S02-C03-O15`
« Établir un lien entre la lecture effectuée et sa propre expérience », while its own text says
there are no questions.** The reviewer is right. But O15 _is_ genuinely exercised in September —
by `m3-lang-09-a2` and `m3-lang-15-a2`, whose guidance ends « Et toi, le premier jour, comment tu
te sentais ? ». So O15 moves to the two activities that do it, and the ritual takes
`LANG-S02-C03-O04` (comprehension of stories tied to everyday experience, `before-4`, legal for
this level and genuinely built by listening to a whole story). `O13` was rejected: the annual plan
places it at day 127, and pulling it into September would be acceleration.

**The annual plan must follow**: O15 was paced `introduceByDay: 3, daily, 12 revisits` because it
was pinned to a daily ritual that never did it. Corrected to the two real occurrences.

**`PHYS-S01-C01-O10` « Courir de plus en plus longtemps sans s'arrêter »** is claimed by four
activities that do not do it — `m3-phys-01-a1` (flagged by the reviewer), and, from the audit,
`m3-phys-10-a1`, `m3-phys-19-a1`, `m3-phys-22-a1`. It stays on `m3-phys-02-a1` and
`m3-phys-11-a1`, which genuinely run without stopping.

**`LANG-S01-C02-O01` « Diversifier les pronoms employés »** is genuinely exercised only by
`m3-lang-08-a2` « Il fait, elle fait ». Removed from the `m3-lang-08-a1` ritual. Kept on
`m3-lang-02-a2` by making the pronoun use real rather than assumed — « À quoi sert le crayon ? »
« Il sert à écrire. » — which is the reviewer's own second option, and not a grammar drill.
