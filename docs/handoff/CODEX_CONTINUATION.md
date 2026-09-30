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

Accepted Cailloux checkpoint cd4f39b95a234f0fed5c819a7e81db8a1138d936 validated/pushed/clean/
remote-verified before Malo. Separate acceptance relayed by owner; three fresh lapsed-only
restorations verified 176/176, 176 distinct valid digests, zero stale/unexpected lapses and
173 unchanged unaffected approval records. Verdict docs/review/verdicts/2026-09-30-cailloux.json.
Frozen Cailloux reviewed SHA 6220f1e1e8f1476018759b514d86a946f78d937e, manifest
415bbf536f244ae90ef13a3ab3e17a4887d04ad9f33c69598e801c7258e7365c, preserved unchanged.
Accepted Pluie package likewise preserved. Canonical audit confirmed Malo was the final deferred
candidate. Malo is now integrated and frozen awaiting separate review, not accepted.
Four 1200x900 WebPs, twelve unchanged canonical lines (3/3/3/3), pageFrames [0,1,2,3].
Page 1 sleepy but awake dog/rooster; page 2 rooster head under wing, branch attempt aftermath
and fish visit; page 3 one paw tests cold water, home visible; page 4 curled nose-to-tail sleep.
README discloses moment choices; independent reviewer must judge against every canonical line.
Current 173 approved / exactly 3 review: m3-lang-07, m3-lang-16, m3-lang-20. 176 distinct fresh
digests, zero stale/unexpected lapses; 173 unaffected records unchanged against cd4f39b.
All 50 unrelated assets/media, canonical text, review history and accepted frozen packages unchanged.
20/20 integrated, 19/20 independently accepted, ten sequences, 31 intentionally retained SVGs.
Package docs/review/histoire-malo/ has 26 hashed files plus manifest SHA-256:
f76f81e72adef7810695da6cb2b29d6fde0aa4dc981e9abd43fc0f1289141603.
Resolve freeze SHA: git log -1 --format=%H -- docs/review/histoire-malo.
Next: complete final checkpoint/push, then STOP. Owner opens a fresh independent Codex session
using docs/review/histoire-malo/REVIEWER_PROMPT.md. No self-acceptance or restoration.
After final accepted verdict: reverify frozen bytes and exact impact; record external verdict
via full-review history for maternelle-3 weeks 2/4/5. Dry-run then approve-week --lapsed-only=true.
Compute fresh digests, never copy pending/prior values. Verify 176/176, 176 distinct current valid
digests, zero stale/unexpected lapses, 173 unchanged unaffected records and 20/20 independently
complete. Refresh current artifacts without changing frozen packages; validate/document/checkpoint/
push feature only, report and STOP. PR/develop/staging/release work needs new owner authorization.
No October or 2eme maternelle content work. Date rollover is continuation of September only.
Read docs/work/ACTIVE_TASK.md for latest checkpoint and validation freshness.

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
