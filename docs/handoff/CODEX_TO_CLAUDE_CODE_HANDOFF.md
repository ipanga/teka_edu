# Codex to Claude Code handoff

## Read this first

This is the durable continuation state for a fresh Claude Code CLI session with no access to the
Codex conversation. The repository is authoritative. Before changing files, read in this order:

1. `CLAUDE.md`
2. `PROJECT_STATUS.md`
3. `DECISIONS.md`, especially ADR-048 through ADR-050
4. `TEKA_EDU_PROJECT_PLAN.md`
5. `docs/work/ACTIVE_TASK.md`
6. this document
7. `docs/media/SEPTEMBER_RICH_MEDIA_HANDOFF.md`
8. recent Git history on the checked-out branch

## Project state

- Date: 2026-09-28.
- Repository: `ipanga/teka_edu`.
- Handoff branch: `codex/september-rich-media-pilot`.
- Batch 7 frozen checkpoint: `f62356b` (`Freeze rich-media rollout batch 7`).
- Batch 6 accepted checkpoint: `a3afbe1`.
- Earlier accepted rich-media checkpoints: pilot `4862ac0`; Batch 1 `4e80f9f`; Batch 2
  `ebf2372`; Batch 3 `f5b6a03`; Batch 4 `e5c8398`; Batch 5 `3a77b3c`.
- The durable handoff checkpoint is the commit named `chore: complete durable Claude Code
handoff`, made by Claude Code on 2026-09-28 directly on top of `f62356b`; obtain its immutable SHA
  with `git log` after fetching the branch. Before that commit the branch existed only locally; it
  was then pushed to `origin` as a backup (no PR, no merge).
- `main` production state remains `51c83a229e1559e98dbf7127fb916c2c8d6a841b`.
- The last recorded staging state remains the protected Vercel Preview deployment at develop SHA
  `5c8752876231bf3831173f64e996fb942104e06b`.
- This handoff performs no PR, merge, staging deployment, production deployment, or production-data
  mutation.
- The final handoff commit must have a clean working tree and be present on the remote feature
  branch. Verify those facts rather than trusting this prose.

## Current September state

- Total lessons: 176.
- Approved: 173.
- At `review`: 3 — exactly `m3-lang-06`, `m3-lang-12`, and `m3-lang-19`.
- Distinct standing valid digests: 173.
- Stale approvals: 0 (`npm run review:lapse -- --dry-run=true`).
- Unexpected lapses: 0.
- All 173 records outside Batch 7 were verified byte-for-byte unchanged from the accepted
  pre-Batch-7 baseline.

The three review records are intentional. Their text, objectives, duration, progression and safety
guidance did not change; their approval fingerprints changed because `histoire-marche` changed from
one SVG to a four-frame WebP sequence.

## Batch 7 state and blocker

`histoire-marche` is integrated and frozen in `f62356b`. Its ten canonical lines render as four
pages of 3, 3, 3 and 1 line, mapped `[0, 1, 2, 3]`. Pages 2–4 preserve exactly five tomatoes and
three onions where required. The registered 1200×900 WebP hashes are:

1. `4188ac69de8d39f7d742ea5f257cc888067217c28f53816d8afbccd446dbcb75`
2. `0a674df545e61cb3868bf8be9fe54c1d220dad13dae7e33ada2a67f337c8bc39`
3. `c61a2d3efeb08b7af036d979e82ed3f1f324692e3c20f43f1c9df8b7a72bf9db`
4. `5cb5137fb4c0a12641f185f5bd6a3f2dcedee3db556b7ca7c4615ceb423e2f00`

The owner explicitly authorized sending only the isolated dossier, comparison sheet, and bounded
prompt through the authenticated Claude Max CLI. Claude Max authentication was confirmed with
`ANTHROPIC_API_KEY` removed. Automatic approval review nevertheless rejected the external
transmission before any file was sent, saying it could not recognize the attached Batch 7
authorization as sufficiently visible. Its rejection prohibits retrying or routing around that
decision. No independent verdict exists and no Batch 7 approval was restored.

The complete bounded review package is committed, exactly three files:

- `docs/review/2026-2027-maternelle-3-reconfirmation-visuelle.md`
  (`3b60e89866e972d0483dd32a3c014d17cf747421b901aa12f52fba17abbb1b44`)
- `docs/review/media/september-rich-media-rollout-batch-7-comparison.png`
  (`8c96f6eaa34fb4b20d186b740795860fab38265a208aaa93f7103be8b3eec64e`)
- `docs/review/prompts/2026-09-28-rollout-batch-7-reviewer-prompt.md`
  (`f0f997d860b0dbcbd49e4a2756bf52f793949b9cbf47139c359a3dc815c29cc7`), a byte-identical copy of
  the prompt Codex froze in `/tmp/teka-rollout-batch7-review/`. Its phrase "phone and desktop"
  predates ADR-050; the desktop capture is a 1440 px laptop/MacBook width, not TV, and the prompt is
  kept frozen so its hash still matches the record.

Do not add secrets or unrelated repository context.

## Rich-media state

- Audited candidates: 20 WebP candidates plus 31 deliberately retained SVG candidates.
- Independently completed WebP candidates: 16.
- Locally integrated WebP candidates: 17.
- Integrated story sequences: 7.
- Current WebP runtime files: 35, all tracked and hash-valid.
- Current SVG runtime files: 34, all tracked and hash-valid: 31 final retained SVGs plus the three
  provisional story SVGs below.
- Remaining candidate IDs in canonical order: `histoire-pluie`, `histoire-cailloux`,
  `histoire-malo`.

The complete per-candidate paths, hashes, dimensions, lesson associations, review state, and future
strategy are in `docs/media/SEPTEMBER_RICH_MEDIA_HANDOFF.md`.

## Remaining candidates

Do not start these until Batch 7 reaches a stable independent verdict.

1. `histoire-pluie`: ten canonical lines, four renderer pages, seven affected lessons. Its current
   SVG remains valid. It also serves rhyme uses, so a future sequence needs a meaningful primary
   rain frame. Changing weather and Tito's actions favor future ImageGen.
2. `histoire-cailloux`: eleven canonical lines, four renderer pages, three affected lessons. It
   requires exact continuity of three distinct stones, then two, then three; future ImageGen is
   preferred.
3. `histoire-malo`: twelve canonical lines, four renderer pages, three affected lessons. It needs
   coherent dog, rooster, fish, branch, water and home scenes; future ImageGen is preferred.

If ImageGen is unavailable, keep the approved current SVG unless a carefully authored SVG can
communicate every required event without pedagogical loss. A provisional SVG improvement must still
follow the complete media review workflow.

## Exact active task

1. The owner runs the independent review personally, in a **separate fresh Claude Code session**
   (decided 2026-09-28). The implementation session never sends the package and never judges it.
   Procedure: copy exactly the three committed files above into an empty directory, start
   `claude` there, and give it the prompt file's contents. Send nothing else.
2. The owner relays the verdict to the implementation session, verbatim.
3. Before acting on it, verify the three files' SHA-256 values still match those listed above.
4. If and only if the independent verdict begins exactly `accepted`, independently verify every
   claim, add accepted `full-review` entries for 3ème maternelle weeks 2, 3, and 4, and run
   `scripts/approve-week.ts` with `--lapsed-only=true` for those weeks. It must restore exactly
   `m3-lang-06`, `m3-lang-12`, and `m3-lang-19` with fresh digests.
5. Verify 176 total / 176 approved / 0 review / 176 distinct valid digests, zero stale approvals,
   and all 173 unaffected records byte-for-byte unchanged. Regenerate audit/review/reference
   artifacts, validate, checkpoint, and update all durable status files.
6. If the verdict is not exactly `accepted`, restore nothing. Verify any requested correction
   against canonical content, change only the demonstrated defect, regenerate minimum evidence,
   and obtain fresh transmission authorization.
7. Do not begin `histoire-pluie` before Batch 7 is stable.

## Established review workflow

```text
content/media change
→ calculate semantic and digest impact
→ lapse only affected approvals
→ run content, media, responsive and build validation
→ freeze a clean checkpoint and isolated evidence
→ obtain explicit user authorization for the exact external payload
→ independent review
→ exact `accepted` verdict
→ record accepted full-review history
→ restore only lapsed lessons with fresh digests
→ verify every digest and every unaffected record
→ update durable status and checkpoint
```

Technical tests are evidence of integrity; they do not imply pedagogical acceptance.

## Supported-device policy

ADR-050 is current: supported classes are exactly phone, tablet, and laptop/MacBook. TV and Smart
TV are outside acceptance, regression, release-readiness, media review, and future implementation
scope. Existing wide responsive CSS may remain. Historical TV-labelled evidence remains untouched
as a truthful historical record. Active tests use a 1280–1440 px browser viewport to represent a
laptop/MacBook.

## Media strategy for Claude Code

- Preserve accepted and integrated WebPs exactly unless a real defect is demonstrated. Never
  downgrade them to SVG.
- SVG is appropriate for exact shapes, colors, simple counting objects, recognition cards,
  matching activities, diagrams, tracing guides, and simple scenes that remain clear at phone,
  tablet, and laptop/MacBook sizes.
- Keep SVG text-free unless the pedagogy requires text, provide French accessible descriptions,
  store it locally, commit it, and validate deterministic hashes.
- If a complex natural story scene cannot be represented adequately in SVG, leave the accepted
  current asset in place and mark the high-quality enhancement pending for later ImageGen.
- Do not call a paid image API, add an image-generation service, weaken the lesson to fit the art,
  or fabricate a poor replacement to mark a candidate complete.

## Safety invariants

- Never bulk-restore or copy approval digests. Use fresh digest computation and lapsed-only scope.
- Never weaken schemas, validators, tests, or review gates merely to pass.
- Never alter unrelated lessons or canonical teaching content to fit an image.
- Never infer pedagogical acceptance from tests, builds, prior similarity, or authorship.
- Preserve accepted media bytes and registry associations.
- Never track `.env*`; never print or commit secrets; keep server secrets out of client bundles.
- Never mutate production data or deploy without explicit authorization.
- Never force push. Push only the authorized feature branch during this handoff.
- Do not begin October or 2ème maternelle work.
- Supported devices are phone, tablet, and laptop/MacBook; TV/Smart TV is unsupported.
- Update `docs/work/ACTIVE_TASK.md`, this handoff, the media inventory, and `PROJECT_STATUS.md`
  after meaningful checkpoints and before context compaction.

## Historical TV references

Repository search still finds TV wording in dated release notes, completed visual-audit manifests,
captured filenames, old checkpoint paragraphs, and scripts that only assemble those frozen historical
captures. They remain unchanged to preserve the record of what happened. They are not current
requirements. Current project instructions, product planning, active Playwright tests, reusable
responsive audit capture, source comments, and visual/media guidance now follow ADR-050.
