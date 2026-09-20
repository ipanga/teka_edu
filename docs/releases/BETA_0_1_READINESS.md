# Teka Edu Beta 0.1 — release readiness

The first public release. Its purpose is to let real families evaluate the lesson model, the
parent guidance, the child experience, class selection and the September progression for
**1ère and 3ème maternelle**.

**Nothing here may be marked complete before it is true.** A row is `DONE` only when it has been
verified, and the verification is named.

- **Decision:** the product owner asked for a public release as soon as September is
  pedagogically ready for both classes (2026-09-15).
- **Gate:** both classes' September must pass the Teka Edu pedagogical review (ADR-047). Human
  teacher review is **not** required and does not block (ISSUE-017).
- **Production remains disabled until every gate below is `DONE`.**

## Scope

|                 | Beta 0.1                                                     |
| --------------- | ------------------------------------------------------------ |
| 1ère maternelle | September lessons available                                  |
| 2ème maternelle | visible on Home, « En préparation », **no fallback content** |
| 3ème maternelle | September lessons available                                  |

October, 2ème content, paid audio, full illustration coverage, profiles, gamification and
analytics are **out of scope** and must not delay the release.

## 1. Pedagogy

**9 of 10 weekly packages accepted · 164 of 176 September lessons `approved`**, all
`ai-assisted`, all `accepted`. No teacher has read any of it.

**1ère maternelle September is complete — 88/88.** **3ème maternelle Weeks 1 to 4 are
approved — 76/88.** What remains for the Beta pedagogy gate is **3ème maternelle Week 5**, the
last 12 lessons, never yet read.

Getting here was not a straight line, and the record says so. Weeks 1–3 were approved, then their
approvals lapsed when the Week 4 review found defects those weeks carried identically — and again
when the approval digest was found not to cover the pictures a child is shown. Both times the
digests were allowed to fail rather than being re-stamped. The 31 occurrences were corrected with
0 unexpected substantive changes across 2,552 compared fields, and ChatGPT reconfirmed the weeks
on a compact diff. The digest now covers the bytes of every referenced illustration, so a picture
cannot be redrawn under an approval without it lapsing.

| Item                                         | State    | Evidence                                                                                  |
| -------------------------------------------- | -------- | ----------------------------------------------------------------------------------------- |
| 1ère September authored                      | **DONE** | 88 lessons, 132 activities, 22 days                                                       |
| 1ère Week 1 reviewed                         | **DONE** | 2 passes + reconfirmation; 16 lessons `approved`, `ai-assisted`                           |
| 1ère Week 2 reviewed                         | **DONE** | 2 passes + reconfirmation; 20 lessons `approved`                                          |
| 1ère Week 3 reviewed                         | **DONE** | 2 passes + reconfirmation; 20 lessons `approved`                                          |
| 1ère Week 4 reviewed                         | **DONE** | 2 passes; 20 lessons `approved`                                                           |
| 1ère Week 5 reviewed                         | **DONE** | 2 passes (accepted-with-modifications → accepted); 12 lessons `approved`                  |
| 3ème September authored                      | **DONE** | 88 lessons, 170 activities, 22 days                                                       |
| 3ème Week 1 reviewed                         | **DONE** | 4 passes (3 accepted-with-modifications → accepted); 16 lessons `approved`, `ai-assisted` |
| 3ème Week 2 reviewed                         | **DONE** | 4 passes (3 accepted-with-modifications → accepted); 20 lessons `approved`, `ai-assisted` |
| 3ème Week 3 reviewed                         | **DONE** | 3 passes (2 accepted-with-modifications → accepted); 20 lessons `approved`, `ai-assisted` |
| 3ème Week 4 reviewed                         | **DONE** | 3 passes; 14 corrections applied; 20 lessons `approved`                                   |
| 3ème Week 5 reviewed                         | **TODO** | pass 1 accepted-with-modifications; 8 corrections applied, **final pass pending**         |
| No content falsely labelled teacher-approved | **DONE** | `reviewKind` on every approval; tests forbid it                                           |

**The two 3ème gaps are resolved**, one by authoring and one by pacing. `LANG-S02-C01-O13`
(auditory memory) now has a genuine second occurrence on day 21, where the child already had to
hold syllables across a pause and rebuild the word — the work was happening and only the claim
was missing. `ART-S02-C02-O08` (creating a soundscape) is a `periodic` objective introduced on
day 13 and reinforced until day 58, so **one appearance inside September is what its pacing asks
for**; a second soundscape was not invented to make a number larger. The day-21 change must be
covered by 3ème's Week 5 review before release.

### Pre-Beta consistency debt (non-blocking)

**`Je trace`, days 5 and 12.** These two approved activities keep the older, less explicit
graphic-practice wording — « Prends le crayon et trace avec moi », with no gesture named. The
Week 5 version, which asks for vertical strokes from top to bottom and says that a scribble is
not a failure, is now the preferred pattern.

They were **not** changed: doing so would invalidate their approval digests and create
re-confirmation work while the September gate is still being completed. **Before the public Beta,
decide whether to normalise them** — and if changed, run the targeted re-confirmation of the
affected approved lessons.

## 2. Technical

Every check must pass on the release commit. Current state on `develop`:

| Check                                                      | State                                          |
| ---------------------------------------------------------- | ---------------------------------------------- |
| format · lint · typecheck                                  | **DONE**                                       |
| unit tests                                                 | **DONE** (322)                                 |
| content validation                                         | **DONE** (31 files)                            |
| curriculum / annual-plan / progression validation          | **DONE**                                       |
| review-package validation                                  | **DONE** (generation fails on missing content) |
| database tests · pgTAP · RLS                               | **DONE** (152 assertions, fresh reset)         |
| build                                                      | **DONE**                                       |
| E2E · responsive                                           | **DONE** (28)                                  |
| Docker portable · Docker Vercel                            | **DONE** (CI)                                  |
| client-bundle secret scan · gitleaks · tracked `.env*` = 0 | **DONE**                                       |

## 3. Live staging validation

To be re-run on the release candidate: Home · 1ère maternelle · 3ème maternelle · 2ème
« En préparation » · calendar · daily lesson · parent view · child view · pause/resume ·
navigation · illustrations · phone layout · desktop/TV-like layout.

**State: DONE for the current `develop`** — the 28-test suite runs against the live staging
deployment on every merge. It must be re-confirmed on whatever commit is promoted.

## 3b. Production preconditions

Production stays closed (ADR-027), and these must be true **before** it is opened:

| Precondition                                    | Why                                                                                                                                                                                       |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `teka-edu-prod` is `ACTIVE_HEALTHY`, not paused | Supabase Free pauses an inactive project, and PROD is deliberately inactive. An inactivity warning arrived on 2026-09-18. A migration against a paused project fails partway (ISSUE-012). |
| The production `VERCEL_TOKEN` exists            | There is none today, by design.                                                                                                                                                           |
| `PRODUCTION_DEPLOY_ENABLED` is set              | Unset today, at both repository and environment level.                                                                                                                                    |
| `NEXT_PUBLIC_APP_URL` and a domain are decided  | PD-012.                                                                                                                                                                                   |
| The zero-cost backup design is implemented      | No backups on Free (ISSUE-009).                                                                                                                                                           |

Resuming a paused project is done by the owner in the Supabase dashboard and costs nothing. **No
keep-alive job is created**: it would add fake activity to a database that is meant to be empty.

## 4. Privacy

Audited 2026-09-15. Beta 0.1 stores **no personal data of any kind**.

| Asked about                                      | Stored? |
| ------------------------------------------------ | ------- |
| Child name, age, birth date, school              | **No**  |
| Child profile or account                         | **No**  |
| Learning results, scores, behaviour observations | **No**  |
| Parent identity, email, device id                | **No**  |

What exists: two `localStorage` keys per instructional day — the position reached in a session,
and the session-observation note a tester writes about _the session_. Both live in that browser
only. **The application makes no client-side network write at all**: no `fetch` POST, no
Supabase write from the browser, no analytics. Supabase serves reference content and is written
only by migrations.

**This design is preserved for Beta 0.1.** No accounts, no profiles, no collection is to be added
for the public test. If that changes, stop before production and review.

## 5. Production configuration

| Item                             | State                                                                                                                                                |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Beta feedback mechanism          | **DECIDED, not built** — reuse the local observation note, add a beta indicator and a copy button. No backend, no third party, **no new data flow**. |
| `PRODUCTION_DEPLOY_ENABLED`      | **off — required until the gate is met**                                                                                                             |
| Production Vercel token          | **TODO**                                                                                                                                             |
| Production environment variables | **TODO**                                                                                                                                             |
| Public URL / domain              | **TODO** — decision needed                                                                                                                           |
| Deployment Protection            | **TODO** — see below                                                                                                                                 |
| PROD database migrated           | **TODO** — never touched so far                                                                                                                      |
| PROD content loaded              | **TODO** — only accepted content                                                                                                                     |
| Rollback procedure rehearsed     | **TODO**                                                                                                                                             |

### Deployment Protection

The intended model, and **not** a global disabling of protection:

```text
Preview / staging  → protected (unchanged)
Production domain  → publicly reachable, no Vercel login
```

Vercel's standard setting for this is Deployment Protection scoped to preview deployments only.
Turning protection off account-wide would expose every preview and is not acceptable.

**Anonymous access test, required before the release is called public:** open the production
domain in a genuinely signed-out private window and confirm it loads; in the same session
confirm a preview URL still asks for a Vercel login. Expected: production **PUBLIC**, previews
**PROTECTED**.

## 6. Database rule for the release

1. compare local migrations · 2. compare DEV · 3. verify PROD state · 4. write an explicit PROD
   migration plan · 5. apply only reviewed migrations · 6. load only accepted content ·
2. post-migration tests · 8. verify RLS · 9. verify project isolation.

**Production never points at Supabase DEV, and staging never points at PROD.** `lib/env` enforces
the separation and a test covers it.

## 7. Backup

**Beta 0.1 stores no user-generated data**, so there is nothing to lose if the database is reset:
everything in Supabase is reference content regenerated from `content/` by migrations. The
zero-cost export design in `FREE_TIER.md` becomes a prerequisite only when real user data is
first stored, which Beta 0.1 does not do.

## 8. Feedback during the beta

**Approved by the product owner (2026-09-15); not yet implemented.** The model, which adds
**no data flow at all**:

- The existing session-observation form already produces a Markdown note in the tester's own
  browser, with a copy button. Add a short beta banner explaining that this is a test release and
  inviting testers to send that note by whatever channel they already use.
- **No new backend, no form service, no analytics, no email provider, no collection about
  children.** Nothing leaves the tester's device unless they choose to send it.

The alternative — a hosted form or an issue tracker — would collect data on a third-party service
and is not proposed for a product used by families with small children.

## 9. Cost

Vercel **Hobby** · Supabase **Free** · existing GitHub plan · **$0/month**, unchanged.

Free-tier risk to watch once the release is public: Vercel Hobby bandwidth and function
invocations, and Supabase's free project pausing on inactivity. Neither is a problem at test
scale. **No upgrade without the product owner's explicit approval**; if a limit becomes a real
risk, report the exact limit and the expected impact rather than upgrading.

## 10. Release workflow, when the gates are met

```text
develop → PR to main → required CI → Promotion source check
  → product-owner production approval → merge to main
  → controlled production deployment → production smoke tests
  → anonymous public-access test → rollback readiness confirmed
```

No deployment from a feature branch; no bypass of the protected-branch model.
