# Free-Tier Operation (current development phase)

**Constraint (ADR-027):** during the current development phase Teka Edu runs only on **Vercel Hobby** and **Supabase Free** (`teka-edu-dev` and `teka-edu-prod`). The target platform cost is **$0/month**. Nothing is upgraded, no add-on is bought, and no billing information is entered. When a need cannot be met for free, the limitation is documented and a free workaround is preferred.

This page was reviewed on 2026-09-11 against official documentation. Re-check it before a public production launch, because free-tier terms change.

Classification:

- **OK**: fine for development.
- **Monitor**: watch it or act on it periodically.
- **Blocker before public production**: must be solved before real users or real child data.

## Cost today

| Platform                   | Plan  | Billing possible?                                                                        | Cost |
| -------------------------- | ----- | ---------------------------------------------------------------------------------------- | ---- |
| Vercel (team TEKA)         | Hobby | No: no payment method is on file, and Hobby pauses usage at its caps instead of charging | $0   |
| Supabase `teka-edu-dev`    | Free  | No paid add-on enabled                                                                   | $0   |
| Supabase `teka-edu-prod`   | Free  | No paid add-on enabled                                                                   | $0   |
| GitHub (public repository) | Free  | Standard runners are free for public repositories                                        | $0   |

A future custom domain is the only expected non-platform cost. It is not needed now; staging uses `teka-edu-staging.vercel.app`.

## Vercel Hobby: limits that matter

Sources: [Hobby plan](https://vercel.com/docs/plans/hobby), [limits](https://vercel.com/docs/limits), [Functions limitations](https://vercel.com/docs/functions/limitations), [container registry limits](https://vercel.com/docs/container-registry/limits-and-pricing), [fair use](https://vercel.com/docs/limits/fair-use-guidelines).

| Limit (Hobby)                                 | Value                                                                                     | Class                                                                                             | Notes                                                                                                                                                 |
| --------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Usage eligibility                             | "Non-commercial personal use only"                                                        | **Blocker before public production** if the product becomes commercial or anyone involved is paid | Fine for building and staging. Decide before launch.                                                                                                  |
| Container deployments                         | Supported, `container` preset                                                             | OK                                                                                                | Verified live. Secure Compute and static IPs are not available for containers (not needed).                                                           |
| Container registry: **images per repository** | **50**                                                                                    | **Monitor**                                                                                       | Every staging deploy pushes one image (about 73 MB compressed). There were 4 on 2026-09-11. No automatic cleanup is documented, so see Optimizations. |
| Container registry storage                    | 10 GB/month included                                                                      | Monitor                                                                                           | About 0.3 GB used. It cannot be bought on Hobby.                                                                                                      |
| Function memory / CPU                         | 2 GB / 1 vCPU (fixed)                                                                     | OK                                                                                                | The container uses a fraction of this.                                                                                                                |
| Max duration                                  | 300 s                                                                                     | OK                                                                                                | Keep requests short.                                                                                                                                  |
| Request/response body                         | **4.5 MB**                                                                                | Monitor                                                                                           | Large media must not be served through the container; use Supabase Storage or static CDN assets later.                                                |
| Active CPU / provisioned memory               | 4 CPU-h / 360 GB-h per month                                                              | Monitor                                                                                           | Memory is billed for the instance lifetime. Preview instances scale down after 30 s idle, production after 5 min.                                     |
| Invocations / edge requests                   | 1M / 1M per month                                                                         | OK                                                                                                |                                                                                                                                                       |
| Fast Data Transfer / Origin Transfer          | 100 GB / 10 GB per month                                                                  | OK                                                                                                | Every request reaches the container (no CDN caching yet, ISSUE-006).                                                                                  |
| Deployments                                   | 100/day, 1 concurrent build, 45 min per build, 100 MB CLI upload                          | OK                                                                                                | The source upload is about 0.6 MB.                                                                                                                    |
| Deployment retention                          | 30 days (the Hobby maximum). The last 10 deployments and any alias target are always kept | OK                                                                                                | Already active on the project. Old deployments expire on their own.                                                                                   |
| Runtime logs                                  | 1 hour                                                                                    | Monitor                                                                                           | Investigate issues promptly.                                                                                                                          |
| Function regions                              | Single region; `cdg1` verified                                                            | OK                                                                                                |                                                                                                                                                       |
| Deployment Protection                         | Vercel Authentication, Standard Protection (previews protected)                           | OK                                                                                                | The docs conflict on protecting a production domain on Hobby. A 2026-09-09 changelog says it is now possible on every plan. Re-check before launch.   |
| Custom domains                                | 50 per project                                                                            | OK                                                                                                | None needed now.                                                                                                                                      |
| Exceeding any cap                             | The feature pauses for up to 30 days; no charge                                           | Monitor                                                                                           | A paused staging deployment blocks testing, not billing.                                                                                              |

**Cold starts:** after 60 s idle, the first request took about 3.6 s, then about 1 s (measured 2026-09-11). **OK** for staging. For production, keep the container lean.

**Architecture verdict:** `GitHub Actions → Vercel container (Hobby) → Next.js` is technically suitable on the free tier. There is no incompatibility, so the architecture stays as it is.

## Supabase Free: limits that matter

Sources: [pricing](https://supabase.com/pricing), [billing FAQ](https://supabase.com/docs/guides/platform/billing-faq), [database size](https://supabase.com/docs/guides/platform/database-size), [pausing](https://supabase.com/docs/guides/platform/free-project-pausing), [backups](https://supabase.com/docs/guides/platform/backups), [compute](https://supabase.com/docs/guides/platform/compute-and-disk), [auth rate limits](https://supabase.com/docs/guides/auth/rate-limits).

| Limit (Free)              | Value                                                                                                                                                          | Class                                                  | Notes                                                                                                                                                                                      |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Database size             | 500 MB, then **read-only**                                                                                                                                     | OK / Monitor                                           | Curriculum stays in Git (ADR-019). Only user data will live here.                                                                                                                          |
| File storage              | 1 GB, 50 MB per upload                                                                                                                                         | OK                                                     | Not used yet.                                                                                                                                                                              |
| Egress                    | 5 GB + 5 GB cached per month                                                                                                                                   | OK                                                     |                                                                                                                                                                                            |
| Auth monthly active users | 50,000                                                                                                                                                         | OK                                                     |                                                                                                                                                                                            |
| **Built-in auth email**   | **2 emails/hour, only to team addresses**                                                                                                                      | **Blocker before public production** (when auth ships) | Configure a custom SMTP sender before real sign-ups. Free SMTP tiers exist.                                                                                                                |
| Connections (Nano)        | 60 direct, 200 pooler clients                                                                                                                                  | OK                                                     | The app uses the pooler.                                                                                                                                                                   |
| Projects                  | 2 active free projects (paused projects don't count)                                                                                                           | OK                                                     | Both slots are used: DEV and PROD.                                                                                                                                                         |
| **Pausing**               | After about 7 days of low activity. Restore from the dashboard (90 days to 1 year, sources differ); after that, only the last logical backup can be downloaded | **Monitor** (DEV) / OK (empty PROD)                    | DEV: staging deploys touch it through the migration steps. If it pauses, restore it from the dashboard for free. PROD: pausing an empty project is harmless; restore it before production. |
| **Backups / PITR**        | **None on Free**                                                                                                                                               | **Blocker before real PROD data**                      | Use the zero-cost backup design below.                                                                                                                                                     |
| Compliance                | No SOC 2 report or HIPAA on Free. Region alone does not make an app GDPR compliant                                                                             | **Blocker before public production**                   | Legal/privacy review before storing children's data.                                                                                                                                       |
| Over-quota                | Grace period, then read-only, pausing or HTTP 402. Lifted at the next cycle                                                                                    | Monitor                                                | No charge on Free.                                                                                                                                                                         |

## Project safety rules (current phase)

- **No real personal data of children or parents anywhere in the cloud.** DEV uses synthetic test data only. PROD stays essentially empty until production readiness is explicitly approved.
- **Never use `teka-edu-prod` for development or testing.** Staging uses `teka-edu-dev` only, and the env guard enforces an exact project match (ADR-015).
- **Prefer the local Supabase stack** (`npm run db:start`, `db:reset`, `db:test`) for everyday development and database testing. DEV is only for staging.

## `DIRECT_DATABASE_URL` (IPv6-only)

- **Nothing in Teka Edu needs a direct database connection today.** The app has no database code yet. Future runtime code uses the transaction pooler (`DATABASE_URL`, port 6543).
- **The CLI already uses the pooler.** `supabase link` / `db push` connect through the **session pooler** (port 5432, IPv4). CI migrations work that way (verified in every staging run).
- **Backup and migration tooling over IPv4** should use the session-pooler connection string (pooler host, port 5432, user `postgres.<ref>`), which is Supabase's documented free alternative. Do not use transaction mode (6543) for dumps or migrations.
- The IPv4 add-on is paid and is **not needed**.

## Zero-cost backup design for `teka-edu-prod` (design only, not implemented)

Implement this **before the first real production data**, and only with explicit approval. Supabase's own recommendation for Free projects is regular `supabase db dump` exports kept off-site.

- **What:** three logical dumps (Supabase's official procedure: [backup and restore using the CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)):
  - `supabase db dump --db-url "$SESSION_POOLER_URL" -f roles.sql --role-only`
  - `supabase db dump --db-url "$SESSION_POOLER_URL" -f schema.sql`
  - `supabase db dump --db-url "$SESSION_POOLER_URL" -f data.sql --use-copy --data-only`
  - Storage objects are **not** included and must be exported separately once Storage is used.
- **How:** a scheduled GitHub Actions workflow (free on public repositories; Docker is available on the runner).
  - It runs in the protected `production` environment, which requires owner approval, or with a dedicated read-only backup role.
  - It takes a new `BACKUP_DB_URL` secret (session pooler) and never uses a developer machine.
- **Encryption:** encrypt before the dumps leave the runner.
  - Use `age` (free, open source) with a **public** recipient key stored as a GitHub secret. The **private** key stays offline with the owner, for example in a password manager.
  - An unencrypted dump must never be uploaded anywhere.
- **Where:** not as GitHub Actions artifacts of this repository, because it is public and artifacts are downloadable by anyone with read access. Options:
  - (a) the owner's own cloud drive, pulled manually
  - (b) a separate **private** GitHub repository or release asset, encrypted
  - (c) a free object-storage tier
  - Never commit dumps to this repository.
- **How often:** daily once real data exists, weekly while it is small. Also run it immediately before every production migration.
- **Retention:** 7 daily + 4 weekly + 3 monthly copies (grandfather-father-son), pruned automatically.
- **Restore:**
  - Test restores into the **local** stack or DEV every month: `psql --single-transaction --variable ON_ERROR_STOP=1 --file roles.sql --file schema.sql --command 'SET session_replication_role = replica' --file data.sql --dbname <target>`.
  - Record the result in `PROJECT_STATUS.md`.
- **Caveats:** logical dumps give a point in time, not continuous recovery. Webhooks, extensions and role passwords may need to be set up again after a restore.

## Optimizations to stay within the free tiers

1. **Container images (most important, Monitor):**
   - Prune old images when the repository nears about 40 of the 50 allowed, keeping those used by retained deployments and the current staging alias.
   - The command is `vercel vcr image ls dockerfile --project teka-edu --scope teka10`, then `vercel vcr image rm …`. This is a deletion, so it needs owner approval each time. A scripted cleanup can be proposed later.
2. **Fewer staging builds:** consider skipping the staging deploy for documentation-only merges (`paths-ignore` on the push trigger). PR CI still runs, and each skipped build saves one registry image. This is not implemented because it changes CD behaviour and needs owner approval.
3. **Batch changes:** fewer, larger PRs into `develop` mean fewer container builds.
4. **Local first:** run database work against the local Supabase stack. Staging deploys touch DEV only for the migration step.
5. **Old deployments:** the failed and early preview deployments are private, unaliased, and expire under the 30-day retention policy. No manual deletion is needed.
6. **CI:** free on a public repository. Playwright reports are uploaded only on failure and kept for 7 days.

## Future paid capabilities: NOT REQUIRED NOW

Listed so the trade-offs are known. **Do not enable any of these in the current phase.**

| Capability                            | Would give                                                                                                                  | Status                                                        |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Vercel Pro                            | Commercial use, a `staging` Custom Environment, more registry and usage, longer logs, rollback to any production deployment | NOT REQUIRED NOW                                              |
| Supabase Pro (per project)            | Daily backups, point-in-time recovery (add-on), no pausing, larger database, SOC 2 access on higher tiers                   | NOT REQUIRED NOW                                              |
| Supabase IPv4 add-on                  | Direct connections over IPv4                                                                                                | NOT REQUIRED NOW (the session pooler is the free alternative) |
| Custom domain                         | Branded production URL                                                                                                      | NOT REQUIRED NOW                                              |
| Vercel Advanced Deployment Protection | Password protection, extra production protection options                                                                    | NOT REQUIRED NOW                                              |
