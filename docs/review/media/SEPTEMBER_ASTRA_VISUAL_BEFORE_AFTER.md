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

## Four-body-word follow-up

Browser-only substitution of the four candidates exposed a 3+1 TV wrap, putting the parent
return control below the viewport. The final count-aware grid now places all four cards in one
row at 1080p; an E2E assertion checks the card row and return-control bounds. No teaching text
or interaction logic changed. [Phone draft preview](astra-comparison/body-candidates-phone.png),
[TV draft preview](astra-comparison/body-candidates-tv.png),
[72/128/256 px baseline comparison](astra-comparison/body-candidates.png).

Hand: continuous silhouette and five fingers improve recognition. Foot: five connected toes,
credible ankle/instep; the corrected candidate avoids the first attempt's sixth toe. Head:
friendly connected portrait, but finely rendered texture must be checked against the final
family. Belly: first draft overemphasized the face; the refinement uses a downward gaze and tighter framing to strengthen the tummy gesture. Final family consistency and independent review remain pending.
All four remain unregistered drafts, with no approval impact.

## Small-phone pagination and scroll reachability

The story page counter now stays on one line beside long titles; story wording and paging are
unchanged. [Rendered phone example](astra-comparison/phone-story-pagination.png).
The follow-up scroll audit checked 302 initial activities on phone and TV: 91 phone screens
need scrolling, none on TV; all parent-return controls were reachable at the bottom.
[Scroll measurements](astra-scroll-evidence.json). Five longest bottom captures were manually
inspected. This does not establish manual inspection of every later interaction or scroll frame.
The 1,812 initial and 1,606 interaction capture sets predate this narrow pagination fix; the
follow-up scroll captures and 39 passing E2E checks validate the correction.

## Evidence and limits

- Both classes: 176 lessons, 302 activity initial states × six viewports = 1,812 per version.
- Before and final after: no broken pictures, no detected horizontal overflow.
- Full captures are local in `private/astra-visual-evidence/`, separate from disposable E2E output.
- [Machine-readable responsive summary](astra-responsive-evidence.json).
- Source review covers all instructions; all 49 asset renders were inspected. Initial-state
  capture is **not equivalent to manual inspection of every interactive state**. The completed local
  interaction walker captured 1,606 states across all 302 activities on phone/TV: story pages,
  retries, reveal, success, counting and sorting. No missing files, broken images or overflow.
  [Final interaction summary](astra-interaction-evidence.json).
- No physical TV-distance test or child recognition study is claimed.
- Final padding revalidation passed: 8 new layout checks + 31 existing E2E, unit 397,
  pgTAP/RLS 152, both local container smoke tests. Nine production-only E2E tests intentionally
  skipped for this local run. Full current results belong in `docs/work/ACTIVE_TASK.md`.

## Approval and environment state

Before: 176 approved. Still valid: 176. Intentional lapses: 0. Unexpected lapses: 0.
Digest mismatches: 0. Child instructions, parent guidance, stories, questions, durations,
objectives, mappings, dates and progression: byte-identical to the baseline.

No new reconfirmation package is appropriate yet: no registered illustration has changed.
The existing reconfirmation documents are historical and have not been overwritten.

DEV: unchanged. Staging: unchanged, withheld by local-only instruction. Production: unchanged.

## Outstanding work, priority order

1. Finish the complete interaction-state audit and isolate renderer/content correctness findings.
2. Review the four body candidates in context; final phone padding and recapture are complete.
3. Produce and inspect the 16 redraws and 10 refinements, or document why quality remains inadequate.
   Two unused assets should not create unnecessary September implementation work.
4. Integrate only reviewed candidates, honestly lapse dependent approvals, produce per-level packages.
5. Independent review; staging only if the owner later changes the local-only instruction.

This is a recoverable checkpoint, **not completion of the full mission**.


## Five-choice TV feedback follow-up (2026-09-25)

The five-word school/home games wrapped 4+1; after reveal/success the return controls extended below the TV viewport. Wide child grids now use five columns for five choices. Feedback text grows from 18px to 30px on wide child screens. No lesson wording, answer rules or registered media changed.

Local development verification: nine layout E2E tests pass across six sizes. For five-word `m3-lang-02-a2` and eight-shape `m3-math-03-a1`, retry/reveal/success all retain the parent-return bottom at 1056px within 1080px. Both reveal screenshots were visually inspected. Evidence is local in `private/astra-visual-evidence/five-choice-fix/`. Standard Turbopack build remains blocked by port binding. Webpack production build passes after moving the health-route helper to a regular module, preserving endpoint behavior. After the approval-service reset, normal approved retries passed 40 production-build browser tests (9 skipped). The full-scroll capture has 1,606 states, 1,042 scroll images and no unreachable returns; only six scroll sample images manually inspected. This is not a completed release validation.
