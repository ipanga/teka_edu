# September visual upgrade — production release record

Released 2026-09-24. The reconfirmed September visual upgrade for **1ère and 3ème maternelle**,
on top of Beta 0.1 (`docs/releases/BETA_0_1_READINESS.md`). Every value below was read from the
live services or the workflow log, and names where it came from.

**Verdict: SEPTEMBER VISUAL UPGRADE PRODUCTION RELEASE: SUCCESS.**

## What shipped

- 41 of 49 September pictures redrawn or refined under one illustration system; the 8 shapes
  unchanged; frozen (`SEPTEMBER_VISUAL_ASSETS_FROZEN_FOR_RECONFIRMATION`).
- The child's screen: tinted stage, sequential lists that are never invisible, a TV-sized child
  view, one rule for which picture leads a story or rhyme; audio plumbing with zero recordings.
- Pedagogical state: **176/176 approved**, reconfirmed by AI-assisted review (ChatGPT) for both
  classes after the visual change; 10/10 weekly packages accepted.

## Before the release

| Step                 | Result                                                                                                                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Registry prune       | Owner-authorised; `planRegistryPrune` on the CLI's JSON listing: **44 → 35**, 9 oldest deleted; production `a7297228f173` and staging protected                                           |
| Supabase CLI pin     | 2.117.0 in `ci.yml`, `deploy-staging.yml`, `deploy-production.yml`; `tests/unit/supabase-cli-pin.test.ts` (PR #83, `22d7b3a`)                                                             |
| Staging              | `22d7b3a`, `dpl_GxFyze4amNh5A5srt46JnP9cSWuS` READY, smoke 31 passed (run 35982180315, dispatched: GitHub created no run for the merge push)                                              |
| `develop` validation | 176/176, 176 distinct digests, 0 review, 0 content change since `e882c10`; format, lint, types, unit 397, content, build, bundle, E2E 31, pgTAP 152, Docker ×2, gitleaks 186 — all exit 0 |

## The release

| Step               | Result                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| Promotion          | PR #84 `develop` → `main`, 5/5 checks incl. Promotion source, merge commit **`28dcb0a`**                  |
| Workflow           | Deploy production, run **35983628116**, attempt 1, approved by the owner in the `production` environment  |
| Vercel preflight   | « Vercel project reached: teka-edu »                                                                      |
| Supabase preflight | « Supabase project: teka-edu-prod (ACTIVE_HEALTHY) »; CLI 2.117.0                                         |
| Migrations         | dry run, then `20260923192024_september_visual_upgrade` applied; **PROD 41 → 42**                         |
| Deployment         | **`dpl_22DjVFzGbinNs4xkCrEzgMM5Svh7`**, `target=production`, Ready, aliased `https://teka-edu.vercel.app` |
| Workflow smoke     | 31 passed, asserting SHA `28dcb0a`, environment `production`, the PROD ref                                |

## Verified after the release (anonymous, 2026-09-24)

| Check                     | Result                                                                                                                                                                        |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/health`             | `production`, commit `28dcb0a…`, ref `eganrivpkjhozkkahyxy` (PROD)                                                                                                            |
| Public suite              | `production-public.spec.ts` against the canonical URL, no login, bypass or cookie: **9/9**                                                                                    |
| Pictures served           | all **49/49** fetched anonymously, `image/svg+xml`, SHA-256 equal to the frozen hashes                                                                                        |
| Visual walk               | 13 activities × phone 390 / tablet 820 / TV 1920, fresh browser each: **0 broken images**; eyes-on review                                                                     |
| `m3-art-04-a1`            | « Le bruit de la pluie » shows `histoire-pluie.svg` only, at all three sizes                                                                                                  |
| Supabase PROD (read-only) | 42/42 migrations = repository; 176 lessons, 88 + 88 approved, 176 distinct digests, all `ai-assisted`; 36/36 public tables with RLS; no child, user, progress or session rows |
| Protection                | canonical 200; staging alias 302; team alias 302; generated `teka-2idtmre2e-teka10.vercel.app` 302                                                                            |
| Registry                  | 36 before the production push, **37** after; production `28dcb0a73243` and staging `22d7b3a4ead2` present                                                                     |

## Known, non-blocking

- ISSUE-011 remains an automation limitation only: CI still cannot list the registry, so pruning
  stays manual; 37 of 50 leaves about 8 merges before the 45 line.
- On a television the animal-choice tiles in « Les parties de l'animal » are small for the
  screen; a polish item, not a regression.
- pgTAP is not installed on DEV or PROD, by design (no hosted schema edits); the same suite runs
  on a fresh database in CI for every change.

## Cost

$0. Vercel Hobby and Supabase Free; no add-on, no paid service.
