# Active Task

## Task

September rich-media continuation: histoire-pluie

## Objective

Finish one four-page ImageGen sequence, preserve canonical pedagogy and freeze independent
review evidence. Codex is the primary development environment; Claude Code is unavailable.

## Status

`awaiting_review`

## Branch

`codex/september-rich-media-pilot`

## Base Branch

Existing feature branch; recovery baseline `4b2648f462e4abd2467d3515a68822796c5005ee`.

## Started

2026-09-30

## Last Checkpoint

Baseline verified locally and remotely at `4b2648f`: clean, 176/176 valid approvals,
17/20 independently completed candidates, seven sequences, 31 retained SVGs, 69 hash-valid
tracked runtime files. Four Pluie frames generated; final drop corrected to visibly fall.
WebP delivery 1200x900 at quality 88; pages map [0, 1, 2, 3]; primary shared frame is page 2.
Exactly seven approvals lapsed through the existing mechanism; no approval restored.
Prior dated checkpoints preserved in `archive/2026-09-rich-media-batches-1-7.md`.

Implementation and technical QA complete; frozen package: `docs/review/histoire-pluie/`.
Frozen clean implementation checkpoint: `45b468301af2a9dae41e182d619ee9f024d56379`.
Manifest SHA-256: `1ff3bd59ee4a2d6a89a8a153e98d0f2314d6faaabc64ce0045b6a9e5d037ec2b`.
Current state: 169 approved / 7 review, 169 distinct valid standing approvals, all 176 current
computed digests distinct, zero stale or unexpected lapses. All unaffected lesson records,
50 unrelated media assets, canonical texts and review history match baseline.
18 candidates integrated, 17 independently complete, eight sequences, 31 retained SVGs.
72 runtime files decode/hash-validate; source PNGs retained locally.

## Scope

Only histoire-pluie, its exact dependencies, evidence, validation and Codex continuation docs.

## Out of Scope

Cailloux before Pluie review completes; Malo; October; 2eme maternelle; offline implementation;
unrelated refactoring; TV support; PR; merge; staging/production deployment or data mutation.

## Product Decisions

Owner authorized Codex-only work, built-in ImageGen, feature checkpoints/pushes and fresh
independent Codex review. Phone, tablet and laptop/MacBook only (ADR-050). Keep mixed SVG/WebP.

## Completed

- Recovered authoritative Git, documentation, approval, audit, registry and review state.
- Generated four coherent narrative frames from the unchanged ten canonical lines.
- Retained source PNGs locally; exported optimized WebPs and registered page mapping.
- Lapsed exactly m1-lang-09/10/15/20, m3-lang-03/21 and m3-art-04.
- Content validation passes; no review-history acceptance was written.

## In Progress

None. Awaiting fresh independent review; no generation or validation process remains running.

## Remaining

- Owner opens fresh independent Codex session; relay its verdict here.
- Restore affected approvals only after final explicit independent acceptance.

## Validation State

| Check                            | Result  | At                                                                            |
| -------------------------------- | ------- | ----------------------------------------------------------------------------- |
| recovery content/media/digests   | PASS    | 4b2648f                                                                       |
| integrated content validation    | PASS    | current four-frame implementation                                             |
| unaffected records and media     | PASS    | 169 records and 50 assets match 4b2648f                                       |
| format                           | PASS    | full repository; final checkpoint prose checked before commit                 |
| lint                             | PASS    | current implementation                                                        |
| typecheck                        | PASS    | Webpack build TypeScript check                                                |
| unit tests                       | PASS    | 438/438; generated weekly/QA/pgTAP artifacts current                          |
| database tests                   | NOT RUN | pgTAP not executed; generated reference assertions current; no DB operation   |
| Docker                           | STALE   | no container configuration changed                                            |
| secret scans                     | PASS    | 28 client files; all three fake server sentinels absent; no tracked .env      |
| production build/bundle scan     | PASS    | final Webpack production build and sentinel scan                              |
| E2E/responsive/visual inspection | PASS    | 42 existing tests plus 8 Pluie checks; 9 production-only skipped; 41 captures |
| independent pedagogical review   | NOT RUN | pending frozen package                                                        |

## Database State

No database operation or migration. Hosted DEV and PROD untouched.

## Deployment State

No deployment; last recorded production main is 51c83a22. No production verification claimed.

## Git State

`45b468301af2a9dae41e182d619ee9f024d56379` is the frozen implementation checkpoint.
Resolve it with `git log -1 --format=%H -- docs/review/histoire-pluie`. Feature durability push
is authorized; no PR or merge authorized. Final clean state and remote SHA verified at push.

## Blockers

None during implementation. Independent review is the required completion boundary.

## User Decisions Needed

Fresh independent review after the package is frozen; no routine implementation decision needed.

## Exact Resume Point

Owner opens a fresh Codex session in this repository and asks it to read and follow only
`docs/review/histoire-pluie/REVIEWER_PROMPT.md`. It must verify the manifest and inspect images
independently. Relay the verdict here. Restore nothing before final explicit acceptance;
verify frozen hashes first. Do not self-approve or begin Cailloux.

## Resume Verification

Read `docs/handoff/CODEX_CONTINUATION.md`, this checkpoint and recent Git history. Verify
`git status --short --branch`, `git log -5 --oneline`,
working tree, remote SHA, hashes and `node --import tsx scripts/lapse-approvals.ts --dry-run=true`.
Node's tsx loader avoids the sandbox's tsx CLI IPC restriction.
