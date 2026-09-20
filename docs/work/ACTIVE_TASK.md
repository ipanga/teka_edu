# Active Task

<!--
  The checkpoint for the task in progress. A fresh Claude Code session reads this file, compares
  it with the repository, and resumes — see docs/RESUMABLE_WORKFLOW.md.

  Git wins over this file when the two disagree. Keep it current: an out-of-date checkpoint is
  worse than none, because it is believed.
-->

## Task

Finish ISSUE-011: make the container-registry prune work now that `VERCEL_VCR_TOKEN` exists.

## Objective

A deploy prunes the registry by itself — or the reason it cannot is written down precisely enough
that nobody has to rediscover it.

## Status

`blocked`

## Branch

`docs/issue-011-vcr-api-not-reachable`

## Base Branch

`develop` at `d066db5`

## Started

2026-09-20

## Last Checkpoint

2026-09-20 — credential verified read-only in CI: it reaches the project (HTTP 200) and not the
registry (404). Deletion switch deliberately left unset. Registry at 43 of 50.

## Scope

- Verify `VERCEL_VCR_TOKEN` read-only before anything can delete.
- Run the dry run against the real registry and read what it would do.
- Prune for real only if the credential works and the threshold justifies it.

## Out of Scope

- Pedagogical review of Week 5, or any content change.
- Pruning with the owner's local CLI credential. It works, and using it would hide the fact that
  the automation does not.
- Creating another Vercel token. The diagnostic proves scope is not the problem.
- October, 2ème maternelle, production, `main`, anything paid.

## Product Decisions

- The registry check is read-only on **every** deploy, and the deletion sits behind
  `REGISTRY_PRUNE_ENABLED` — the same kind of switch that already gates staging and production
  deploys. A deletion running on every merge should have a kill switch.
- The failure diagnostic prints HTTP statuses only. A 404 from the registry reads identically
  whether the scope is wrong or the API is out of reach, and those need opposite fixes.

## Completed

- [x] `staging / VERCEL_VCR_TOKEN` confirmed to exist; value never read, printed or stored
- [x] Read-only verification step added and run in CI **before** anything could delete
- [x] Deletion moved behind `REGISTRY_PRUNE_ENABLED`, left **unset**
- [x] Credential diagnosed in CI: reads the project **200**, `/v2/user` 404 (team-scoped, as
      intended), registry **404**
- [x] Established that the Vercel CLI's _user session_ gets **200** on the identical request, so
      the difference is the credential kind, not the URL or the scope
- [x] Finding recorded in `PROJECT_STATUS.md` and `docs/DEPLOYMENT.md` with the manual prune
      command

## In Progress

- [ ] PR into `develop`, CI, squash-merge, staging verification

## Remaining

- [ ] **Owner: prune by hand before 50.** 43 of 50, no automated warning is possible.
- [ ] **Owner: ask Vercel** whether `/v1/vcr/repository/*` is usable with an access token. If it
      is, the automation needs nothing but the credential.
- [ ] Then: hand `docs/review/2026-2027-maternelle-3-semaine-5.md` to ChatGPT for its first pass.

## Validation State

| Check              | Result | At                                |
| ------------------ | ------ | --------------------------------- |
| format             | PASS   | working tree                      |
| lint               | PASS   | working tree                      |
| typecheck          | PASS   | working tree                      |
| unit tests         | PASS   | working tree — 347 tests          |
| content validation | PASS   | working tree — 31 files           |
| build              | PASS   | CI on every PR                    |
| E2E                | PASS   | CI — 28 local, 28 live            |
| Docker             | PASS   | CI — both images                  |
| secret scans       | PASS   | 0 tracked `.env*`; gitleaks in CI |

## Database State

- Local: 25 migrations; last fresh reset + 152 pgTAP assertions passed.
- DEV: up to date; no migration in this round (no content changed).
- PROD: untouched.

## Deployment State

- Staging: green on every merge this round; alias moved each time; 28 live E2E each time.
- Container registry: **43 of 50**, unreadable from CI, pruned only by hand.
- Production: disabled; `main` at `1b95480`.

## Git State

- PRs #68 and #69 merged into `develop`. `docs/issue-011-vcr-api-not-reachable` open.

## Blockers

**ISSUE-011 is blocked on platform access, not on a credential.** `VERCEL_VCR_TOKEN` exists and is
scoped correctly — CI shows it reading the project with HTTP 200 — but `/v1/vcr/repository/*`
answers 404 for it and for the deploy token, while the CLI's user session gets 200 on the
identical request. A third token would not help.

The registry is at 43 of 50 and CI cannot read the count, so nothing will warn before the cap
blocks `develop`.

## User Decisions Needed

1. **Prune by hand, soon.** `vercel vcr image ls dockerfile --project teka-edu --scope teka10`,
   then `… image rm … <id>` oldest first, never the image behind the live deployment.
2. **Ask Vercel** whether `/v1/vcr/repository/*` can be used with an access token, and under
   which scope.

## Exact Resume Point

Merge the documentation PR, then stop. The next pedagogical task is ChatGPT's first pass on
Week 5; it does not depend on ISSUE-011.

## Resume Verification

1. `git branch --show-current`;
2. `git log -n 5 --oneline`;
3. `git status --short` — read uncommitted work before discarding it;
4. `vercel vcr image ls dockerfile --project teka-edu --scope teka10 | grep -c image_` — the
   count moves with every merge, so re-read it rather than trusting this file;
5. `gh run list --branch develop --limit 3` before assuming a deployment is needed.
