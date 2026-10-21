# PR documentation review

Before opening a PR, and after changing its scope, compare the diff with README
and the relevant guides. Check setup commands, required tools, deployment and
credential instructions, API/UI behavior, security boundaries, and claims about
what is complete or still planned. Verify changing third-party instructions
against official documentation. Keep historical observations clearly dated.

Update affected docs in the same PR. Record the documents inspected and the
evidence used in the PR body. If the docs already describe the resulting behavior,
explain why no edit is needed. A code-only or dependency PR still needs a review;
a maintainer can add the review to a bot's PR body after inspecting it.

Include this section even when creating a PR using a custom body file:

```markdown
## Documentation review

- [x] Reviewed setup instructions and documentation accuracy.
Docs reviewed: README.md, docs/deployment.md
Docs outcome: updated
Docs evidence: Describe the changed instructions and how they were verified.
```

Use exactly `updated` or `no change` for the outcome. Replace the example evidence
with a specific explanation. With `updated`, at least one Markdown file must be
changed in the PR. With `no change`, explain why the existing docs remain accurate.
List the actual docs reviewed, not a generic checklist of all docs.

The **Documentation review** GitHub check validates this record on PR creation,
body edits, reopening, and new commits. The main-branch ruleset requires this check
before merge, including administrator merges. This records an accountable review;
it does not automatically prove the truth of prose or force unnecessary doc edits.

The workflow uses `pull_request_target` to read current PR metadata and changed
filenames. It checks out only trusted `main`, executes no PR code, uses
read-only repository/PR permissions, and receives no production environment secret.
If the check fails, edit the PR description and it will run again.
