## Agent skills

### Git worktrees

Before editing files for a new task, inspect `git worktree list` and `git status --short --branch`. Use a separate Git worktree and a `codex/` branch for each task; reuse an existing worktree only when it belongs to that task. In Codex, prefer the managed worktree tools and run subsequent commands in the returned workspace directory. Preserve uncommitted changes in the original checkout; leave them in place unless the user explicitly asks to move them. When continuing existing work, use its worktree and branch.

### Issue tracker

Plan work in GitHub Issues for `QFREEE/spacecaveman`. Before tracker operations, read `docs/agents/issue-tracker.md`.

### Triage labels

Use the five default triage labels. Before classifying or publishing work, read `docs/agents/triage-labels.md`.

### Domain docs

Use a single-context glossary and ADR layout. Before exploring or planning domain changes, read `docs/agents/domain.md` and the existing domain docs it identifies.
