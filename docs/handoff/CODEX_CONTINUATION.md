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

Cailloux independently accepted without correction; owner relayed verdict on 2026-09-30.
Reviewed freeze: 6220f1e1e8f1476018759b514d86a946f78d937e; documentation d63b661.
Manifest: 415bbf536f244ae90ef13a3ab3e17a4887d04ad9f33c69598e801c7258e7365c.
All 26 package files, runtime frames and reviewed content matched before restoration.
Three accepted full-review entries (maternelle-3 weeks 2/3/4) recorded. Dry-run then established
approve-week --lapsed-only=true restored ONLY m3-lang-08, m3-lang-14 and m3-lang-18.
176 total/approved, zero review, 176 distinct current valid digests, zero stale/unexpected lapses;
all 173 unaffected approval records unchanged. No digest copied from old records/evidence.
External acceptance record: docs/review/verdicts/2026-09-30-cailloux.json.
Frozen Cailloux and accepted Pluie packages unchanged. Pluie accepted baseline b4f242d;
Pluie manifest 1ff3bd59ee4a2d6a89a8a153e98d0f2314d6faaabc64ce0045b6a9e5d037ec2b.
Nineteen of twenty candidates independently complete, nine sequences, 31 retained SVGs.
Next: validate/checkpoint/push accepted Cailloux, then verify final deferred histoire-malo
from canonical audit before implementation. Generate rich coherent ImageGen scenes, keep text
unchanged, lapse only true dependencies, validate/freeze/checkpoint/push, and STOP for a fresh
independent Codex review. No Malo acceptance/history/restoration without separate final acceptance.
Read docs/work/ACTIVE_TASK.md for validation freshness and exact checkpoint.

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
