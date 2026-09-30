# Codex continuation

Current authorization: owner request of 2026-09-30. Codex is the primary implementation,
QA and authoring-time ImageGen environment. Claude Code is unavailable and is no longer
a dependency. `CODEX_TO_CLAUDE_CODE_HANDOFF.md` is historical; preserve its evidence.

## Verified recovery baseline

- Branch: `codex/september-rich-media-pilot`.
- HEAD and remote: `4b2648f462e4abd2467d3515a68822796c5005ee`; clean before work.
- September: 176 approved, 0 review, 176 distinct valid digests, 0 stale approvals.
- 51 assets, 69 tracked runtime files, all SHA-256 values verified; 7,597,868 bytes.
- 17/20 independently completed candidates; seven sequences; 31 retained SVGs.
- Remaining canonical order: `histoire-pluie`, `histoire-cailloux`, `histoire-malo`.
- Recovery validation: 31 content files valid; lapse dry run zero.

## Current phase and next action

Pluie implementation and technical QA are complete; independent review is pending. Frozen
package: `docs/review/histoire-pluie/`. Resolve the implementation SHA with
`git log -1 --format=%H -- docs/review/histoire-pluie`.
Frozen implementation: `45b468301af2a9dae41e182d619ee9f024d56379`; clean at freeze.
Manifest SHA-256: `1ff3bd59ee4a2d6a89a8a153e98d0f2314d6faaabc64ce0045b6a9e5d037ec2b`.
Current state: 169 approved / 7 review / zero stale or unexpected lapses; 18 candidates
integrated, 17 independently complete, eight sequences, 31 retained SVGs. All 169 unaffected
lessons and 50 unrelated media assets match baseline; canonical texts/review history unchanged.
Owner opens a fresh session to follow `docs/review/histoire-pluie/REVIEWER_PROMPT.md` and relays
the verdict here. Do not begin Cailloux before Pluie completes review and restoration.
Read `docs/work/ACTIVE_TASK.md` for the latest milestone and validation freshness.

Canonical Pluie text: `la-pluie-sur-le-toit` in `content/texts/maternelle-3.json`.
Ten unchanged lines render four pages (3/3/3/1); registered `pageFrames: [0, 1, 2, 3]`.
Page 1: gray sky, moving leaves, Tito watching from the doorway, first rain.
Page 2: rain on the roof, Tito visibly closes both eyes to listen.
Page 3: runoff between stones, rain stops, one shining drop remains on a leaf.
Page 4: Tito outside, finger beneath the leaf, drop falling into his hand.
Use page 2 as the primary shared rhyme/activity frame, following Lisa's precedent.

## Policies

- Phone, tablet, laptop/MacBook only (ADR-050); TV/Smart TV excluded. Representative
  widths: 320/360/390/430, 768/1024, 1280/1440.
- Built-in ImageGen for complex story scenes; retain high-quality local masters under
  ignored `private/astra-visual-evidence/`. Commit optimized WebP application assets.
- Preserve accepted WebPs and 31 intentional SVGs. No paid API or runtime generation.
- Canonical text controls images; never change pedagogy to accommodate generated art.
- Calculate exact media dependencies, lapse only affected approvals, preserve unaffected
  records, validate fresh digests and zero unintended stale approvals (ADR-048).
- Freeze canonical mapping, comparison, final frames, 256 px and responsive evidence,
  hashes and approval impact in a committed isolated package.
- The implementation session cannot self-approve. Owner opens a fresh independent Codex
  session and relays `accepted`, `accepted-with-modifications` or `rejected`.
- Restore only after an explicit final independent acceptance supports restoration;
  use existing full-review history and `approve-week --lapsed-only=true`, fresh digests.
- No October, 2eme maternelle, offline implementation, unrelated refactoring, PR, merge
  or production deployment. Feature checkpoints and pushes are authorized.
- Keep DEV/PROD separate, RLS intact, secrets private, `.env*` untracked and server secrets
  out of client bundles. No production data mutation or force-push.

## Completion boundary

After all three stories are independently accepted: verify 176/176 approvals, 176 distinct
valid digests, zero stale/unexpected lapses and 20/20 candidates, then report and stop.
The intended next phase requires owner authorization: PR to develop, CI/staging and
owner visual inspection of the complete September release.
