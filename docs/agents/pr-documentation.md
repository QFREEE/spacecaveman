# PR documentation review

Before opening a PR, and after changing its scope, compare the diff with README
and the relevant guides. Check setup commands, required tools, deployment and
credential instructions, API/UI behavior, security boundaries, and claims about
what is complete or still planned. Verify changing third-party instructions
against official documentation. Keep historical observations clearly dated.

Update affected docs in the same PR. Record the documents inspected and the
evidence used in the PR body. If the docs already describe the resulting behavior,
explain why no edit is needed. A code-only PR still needs a review.

Verified `dependabot[bot]` PRs from this repository's `dependabot/github_actions/`
branches are exempt from the written record only when all changes replace
immutable Action pins in existing workflow `uses:` lines. The action identity and
indentation must stay the same. Commands, permissions, inputs, new workflows,
other files, missing/truncated patches, and other authors take the normal review
path. This exemption does not waive the required **Checks** job or automatically
merge updates. Review major-version compatibility and wait for full CI.

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

## Maintaining the hook

Run `node --test test/documentation-review.test.js` when changing the validator.
Use a draft PR to verify that an incomplete description fails and that completing
the record passes. Do not use a passing check as proof that the prose is accurate.

The intended main-branch rule is recorded in
`.github/rulesets/documentation-review.json`; repository Settings → Rules → Rulesets
holds the live configuration. Editing that JSON does not apply a rule change.
The rule requires the GitHub Actions check and has no configured bypass actors.
