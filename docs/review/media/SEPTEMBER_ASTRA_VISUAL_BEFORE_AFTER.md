# September Astra before / after — local review checkpoint

**In progress; not ready for final visual reconfirmation.** Baseline `a0b743b`; production
`28dcb0a` is untouched. The owner selected **local-only** work: no further push, PR or staging
deployment. The early audit-only commit `ef12344` had already been pushed before that decision.

## Implemented locally

- Choice grids use the actual number of choices (up to four columns). At 1080p, the two animal
  pictures grow from 215 px to 352 px. The existing generic animal quiz behavior is a separately
  isolated correctness concern, not silently changed here.
- Two word cards share a row on a 320 px phone. The first render reduced pictures to 78 px;
  a follow-up padding correction targets at least 100 px and must be recaptured before acceptance.
- TV word labels grow from 24 px to 36 px. TV prompts grow to 30 px.
- On large screens a story picture sits beside its full, unchanged text. Lisa's picture changes
  from 480 px to 420 px, trading a little picture size for visible text and page controls.
- Attention feedback runs once for 700 ms, instead of twice for 900 ms. Reduced-motion behavior
  and all existing feedback text stay intact.

No UI wording was changed. “Jouer : je montre le mot” and “Montrer à l’enfant” remain distinct
controls because one starts an interaction and the other opens the clean presentation surface.

## Readable comparisons

These sheets preserve full screenshot resolution. The phone comparison is small enough to see
in one page; TV sheets can be opened and zoomed. The initial comparisons precede the final phone
padding adjustment and will be regenerated after validation.

- [Phone body words](astra-comparison/small-phone-m1-lang-11-a2.png)
- [TV animal choices](astra-comparison/tv-m3-world-02-a1.png)
- [TV Lisa story](astra-comparison/tv-m1-lang-03-a2.png)
- [TV word labels](astra-comparison/tv-m1-lang-11-a2.png)

The per-asset audit supplies teaching purpose, all activity IDs, affected lesson dependency lists,
quality decisions and proposed treatments: [independent audit](SEPTEMBER_ASTRA_VISUAL_AUDIT.md).

## Illustration candidate, not an integrated replacement

[Hand candidate before / after](astra-comparison/corps-main-draft.png).

The baseline hand is built from a separate oval palm and tubular digits. The candidate has five
connected digits, a continuous wrist and softer painted form. Native imagegen required three
attempts: the first looked too photographic; the second had nail-like fingertip patches on its
palm; the third removes those patches. [Exact prompts](astra-drafts/PROMPTS.md).

This candidate is **outside the media registry** and is not shown by the application. It is not
accepted as a final asset. No content hash, description or approval digest has changed. A future
integration must first finish in-activity QA, preserve the historical freeze, record real approval
lapses and generate the existing reconfirmation packages. Never copy an approval digest.

## Evidence and limits

- Both classes: 176 lessons, 302 activity initial states × six viewports = 1,812 per version.
- Before and initial after: no broken pictures, no detected horizontal overflow.
- Full captures are local in `private/astra-visual-evidence/`, separate from disposable E2E output.
- [Machine-readable responsive summary](astra-responsive-evidence.json).
- Source review covers all instructions; all 49 asset renders were inspected. Initial-state
  capture is **not equivalent to manual inspection of every interactive state**. The local
  interaction walker is collecting story pages, retries, reveal, success, counting and sorting.
- No physical TV-distance test or child recognition study is claimed.
- New layout checks: 7 passed before the padding follow-up; existing E2E 31 passed, unit 397,
  pgTAP/RLS 152, both local container smoke tests passed. Revalidation of the final padding
  adjustment is pending. Full current results belong in `docs/work/ACTIVE_TASK.md`.

## Approval and environment state

Before: 176 approved. Still valid: 176. Intentional lapses: 0. Unexpected lapses: 0.
Digest mismatches: 0. Child instructions, parent guidance, stories, questions, durations,
objectives, mappings, dates and progression: byte-identical to the baseline.

No new reconfirmation package is appropriate yet: no registered illustration has changed.
The existing reconfirmation documents are historical and have not been overwritten.

DEV: unchanged. Staging: unchanged, withheld by local-only instruction. Production: unchanged.

## Outstanding work, priority order

1. Finish the complete interaction-state audit and isolate renderer/content correctness findings.
2. Validate and recapture the final phone padding; retain meaningful screenshot evidence.
3. Produce and inspect the 16 redraws and 10 refinements, or document why quality remains inadequate.
   Two unused assets should not create unnecessary September implementation work.
4. Integrate only reviewed candidates, honestly lapse dependent approvals, produce per-level packages.
5. Independent review; staging only if the owner later changes the local-only instruction.

This is a recoverable checkpoint, **not completion of the full mission**.
