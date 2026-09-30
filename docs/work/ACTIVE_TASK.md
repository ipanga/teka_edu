# Active Task

## Task

September rich-media continuation: histoire-cailloux

## Objective

Implement four canonical story frames with exact stone quantities and freeze evidence for a
separate independent Codex review. Preserve lesson text, approval integrity and accepted media.

## Status

`awaiting_review`

## Branch

`codex/september-rich-media-pilot`

## Base Branch

Accepted Pluie checkpoint `b4f242d77ecde3b7e67bdba37e14dcbe56d6061c`, clean and remote-verified.

## Started

2026-09-30

## Last Checkpoint

Pluie independently accepted and seven fresh approvals restored. 176 total/approved,
176 distinct valid digests, zero review/stale/unexpected lapses, 169 unaffected records unchanged.
Eighteen of twenty candidates independently complete, eight sequences, 31 retained SVGs.
Cailloux four-frame package is now frozen: 173 approved / exactly 3 review, 176 distinct fresh
digests, zero stale/unexpected lapses. All 173 unaffected records, 50 unrelated assets/media,
canonical texts, review history and Pluie package unchanged against b4f242d. Malo untouched.
Manifest SHA-256: 415bbf536f244ae90ef13a3ab3e17a4887d04ad9f33c69598e801c7258e7365c;
26 package files verified. No Cailloux acceptance/history/restoration.
Pluie completed record preserved in `archive/2026-09-pluie-accepted.md`.

## Scope

Only histoire-cailloux, its three exact dependencies, generation, evidence and validation.
Canonical text les-trois-cailloux-de-tito: 11 lines, four renderer pages (3/3/3/2), mapping
[0,1,2,3]. Page 1 collects round/flat/pointed stones into pocket (three). Page 2 sister hides
pointed stone behind her back (two visible). Page 3 Tito identifies round/flat and missing
pointed stone (two visible). Page 4 sister reveals/returns pointed stone (three restored).

## Out of Scope

Malo before Cailloux review/restoration; October; 2eme maternelle; offline implementation;
TV/Smart TV; unrelated refactoring; PR/merge; staging/production or database operations.

## Product Decisions

Codex and built-in ImageGen only; preserve Tito from accepted Pluie, exact stone identities,
warm preschool painted style and supported phone/tablet/laptop-MacBook matrix.
Implementation cannot self-approve. Owner opens a fresh independent Codex session at freeze.

## Completed

- Accepted/restored/validated/checkpointed/pushed Pluie at b4f242d.
- Verified canonical continuation order, story text, page count and expected three-lesson impact.

- Generated/inspected four rich frames at full size and 256 px; masters preserved locally.
- Integrated optimized WebPs and lapsed exactly three dependencies through established tool.
- Refreshed audit/review/reference artifacts; frozen isolated package and supported captures.
- Passed 438 unit and 58 local browser tests, nine production-only checks skipped.

## In Progress

Final formatting, integrity and checkpoint/push before stopping for independent review.

## Remaining

- Final checkpoint/push and clean-tree verification.
- Fresh independent review; restore nothing before final explicit acceptance.
- After acceptance: fresh-digest lapsed-only weeks 2/3/4, verify 176/176 and preserve other 173
  records, update artifacts/status, validate/checkpoint/push before considering Malo.

## Validation State

| Check              | Result  | At                                                          |
| ------------------ | ------- | ----------------------------------------------------------- |
| format             | PASS    | full repository Prettier check                              |
| lint               | PASS    | current Cailloux implementation                             |
| typecheck          | PASS    | current implementation                                      |
| unit tests         | PASS    | 438/438 current implementation                              |
| content validation | PASS    | 31 files; lapse dry run zero                                |
| database tests     | NOT RUN | assertions regenerated, no DB operations                    |
| build              | PASS    | production Webpack build, no deployment                     |
| E2E                | PASS    | 58 local; eight Cailloux viewports; nine production skipped |
| Docker             | STALE   | no container configuration changes                          |
| secret scans       | PASS    | 28 client files, three fake sentinels absent                |
| independent review | NOT RUN | frozen package; fresh session required                      |

## Database State

No operations; hosted DEV and PROD unchanged.

## Deployment State

No staging/production deployment. Production unchanged, no live verification claimed.

## Git State

Baseline b4f242d pushed and clean before this task. Feature checkpoints/pushes authorized.
No PR or merge authorized. Generation masters retained locally in ignored evidence paths.

## Blockers

No implementation blocker. Separate independent acceptance required before restoration.

## User Decisions Needed

Independent verdict required for frozen Cailloux; no other decision.

## Exact Resume Point

Finish checkpoint/push and stop. Owner opens a fresh independent Codex session using
docs/review/histoire-cailloux/REVIEWER_PROMPT.md. Do not approve Cailloux or start Malo.

## Resume Verification

Read continuation and this checkpoint; run `git status --short --branch`, `git log -5 --oneline`,
verify runtime/package hashes and `node --import tsx scripts/lapse-approvals.ts --dry-run=true`.
