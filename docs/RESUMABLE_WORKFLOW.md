# Resumable work

How a long task survives an interruption. Decision: ADR-041.

A substantial task — authoring a month of content, a migration plus its data, a phase of UI —
takes hours and spans several operations that can each be cut short: a context reset, a closed
terminal, a restart, a dropped network, a crash, or simply stopping and coming back tomorrow.

**Chat memory is not a place to keep progress.** The repository is. Everything a fresh session
needs to continue accurately must be readable from files and from Git.

## The two levels of state

| File                                          | Holds                                                                 | Cadence                    |
| --------------------------------------------- | --------------------------------------------------------------------- | -------------------------- |
| [`PROJECT_STATUS.md`](../PROJECT_STATUS.md)   | Where the project stands: phases done, architecture, open issues, next | Once per phase or decision |
| [`work/ACTIVE_TASK.md`](work/ACTIVE_TASK.md)  | Where **this** task stands, in detail, and the exact next action       | Every milestone            |

`PROJECT_STATUS.md` is not a work log. `ACTIVE_TASK.md` is not a second status file: it covers
one task and is archived when that task ends. There is normally exactly **one** active task.

## The active-task checkpoint

`docs/work/ACTIVE_TASK.md` must answer, without any chat history: what was being done, why, on
which branch, what is finished, what remains, what failed, what was verified, whether anything is
uncommitted, and **what the exact next action is**.

Its sections are fixed, because a fresh session reads them mechanically: Task · Objective ·
Status · Branch · Base Branch · Started · Last Checkpoint · Scope · Out of Scope · Product
Decisions · Completed · In Progress · Remaining · Validation State · Database State · Deployment
State · Git State · Blockers · User Decisions Needed · Exact Resume Point · Resume Verification.

`Status` is one of `planned`, `in_progress`, `blocked`, `awaiting_user`, `awaiting_ci`,
`awaiting_review`, `completed`.

A unit test checks the structure, the status value and the validation vocabulary, so the protocol
is enforced rather than merely described.

## Checkpoint discipline

Update the checkpoint at **milestones**, not after every edit:

- a design or model is settled;
- a migration is written;
- generated content lands;
- a week of content is finished;
- a UI section works;
- local tests pass;
- a migration reaches DEV;
- a PR is opened; CI starts; staging starts; staging is verified.

**Before** anything long or interruptible — bulk content generation, `supabase db reset`, a full
CI run, Docker builds, a deployment, a large import — write down what is about to run and what
the next session should do if it never comes back. **After** it, record what actually happened,
and whether earlier validation is still current.

Never leave the file claiming an operation is still running once it has finished.

## Git as the other half

The checkpoint says what happened; Git holds what was produced.

- **Create the feature branch early**, before the first substantial edit.
- **Open a Draft PR early** for a major phase, once there is a meaningful first commit. It gives
  a durable remote record of branch, commits, scope and CI state that outlives any session.
- **Commit at recoverable milestones**, not after every tiny edit. Good checkpoint commits:

  ```text
  chore: checkpoint annual pacing model
  feat: add september weeks 1-2 content
  feat: add parent lesson flow
  test: validate september programme
  docs: finalize phase documentation
  ```

- **Push after each coherent checkpoint.** A checkpoint that exists only on the laptop does not
  survive a dead laptop. Never push secrets, and never push something known to be broken in a way
  that would mislead a reader.
- Checkpoint commits cost nothing at the end: the branch is **squash-merged** into `develop`, so
  history stays one commit per change while the branch stays granular during the work.

## Resuming

At the start of any substantial session, before changing anything:

```text
read CLAUDE.md, PROJECT_STATUS.md, docs/work/ACTIVE_TASK.md
  ↓
git status · git branch --show-current · git log -n 5 --oneline
  ↓
reconcile: does the repository match the checkpoint?
  ↓
check remote state if the task depends on it (CI run, deployment, DEV migrations)
  ↓
find the first incomplete milestone
  ↓
update the checkpoint, then continue
```

**When the checkpoint and the repository disagree, the repository wins.** The file can be stale;
commits and files cannot.

### After an interruption

A checkpoint that says `in_progress` means the previous session may have been cut off mid-step.
Do not rerun everything. Establish first:

- which files exist, and whether generated output is complete;
- which commits exist, and what was pushed;
- whether a remote operation finished **after** the session ended — a CI run or a deployment
  usually completes on its own;
- whether migrations were applied;
- which test results are still valid.

Then continue from the first incomplete milestone. Do not redo completed work unless something
shows it is wrong.

### Uncommitted changes

Inspect them, decide whether they are complete, partial or invalid, compare them with the
checkpoint, keep what is valid, and discard only clearly invalid generated output. Write down the
decision. **Never** blindly `git reset --hard`, and never blindly regenerate.

## Validation freshness

A green test proves nothing about code changed after it ran. The checkpoint records, per check,
one of:

| Value     | Meaning                                                      |
| --------- | ------------------------------------------------------------ |
| `PASS`    | Passed, at the commit named next to it                        |
| `FAIL`    | Failed; the reason belongs in Blockers                        |
| `NOT RUN` | Never run for this task                                       |
| `STALE`   | Passed once, but relevant code or content has changed since   |

Always record the commit: `unit tests: PASS at 0ea23a2`. When a later change invalidates a
result, move it to `STALE` in the same edit that makes the change — not later, and never leave it
at `PASS`.

## Database and deployment recovery

**Never** infer remote state from the fact that a session ended. Look.

```bash
npx supabase migration list --linked        # local vs DEV, side by side
gh run list --branch develop --limit 3      # did that workflow finish?
gh pr checks <n>                            # did CI finish?
```

- A migration whose session was interrupted may well have been applied. Compare the three lists —
  repository files, local, DEV — before re-running anything.
- A deployment whose session was interrupted usually finished. Inspect the run; **do not trigger
  another deployment** just because the conversation ended.
- Checkpoints record migration **filenames and applied/not-applied only**. Never a connection
  string, password, token or key.

## Long operations should be restartable

Where practical, make the work itself recoverable: deterministic scripts, stable ids, independent
units. Content is authored and validated by **month → school week → instructional day**, not as
one indivisible year, so a resumed session can say "weeks 1 and 2 are complete, week 3 is in
progress" and continue without rewriting what exists.

## Finishing a task

1. Make sure every required check is current, not `STALE`.
2. Merge through the normal workflow (Draft PR → ready → required CI → squash merge).
3. Update `PROJECT_STATUS.md` with the durable outcome.
4. Mark `ACTIVE_TASK.md` `completed`, with the final PR, the merge commit, the staging result and
   what remains open.
5. Copy it to `docs/work/archive/<YYYY-MM>-<task>.md`, then reset `ACTIVE_TASK.md` for the next
   task.

The archive keeps one summary per major task — enough to reconstruct what was done and why, not a
diary. `PROJECT_STATUS.md` stays the concise high-level truth.
