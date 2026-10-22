import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { documentationErrors, isDependabotActionUpdate } = createRequire(import.meta.url)('../scripts/documentation-review.cjs');
const record = (outcome = 'updated') => `## Documentation review

- [x] Reviewed setup instructions and documentation accuracy.
Docs reviewed: README.md, docs/deployment.md
Docs outcome: ${outcome}
Docs evidence: Compared deployment commands with the workflow and corrected the token instructions.

## Merge Danger
Documentation only.`;

test('accepts documented updates and reasoned reviews without doc edits', () => {
  assert.deepEqual(documentationErrors(record(), ['README.md']), []);
  assert.deepEqual(documentationErrors(record('no change'), ['src/worker.js']), []);
});

test('rejects missing, unchecked, placeholder, and unsupported review records', () => {
  for (const body of [null, '', record().replace('[x]', '[ ]'), record('maybe'),
    record().replace('README.md, docs/deployment.md', '<!-- paths -->'),
    record().replace(/Docs evidence:.*/, 'Docs evidence: <!-- rationale -->'),
    record().replace(/Docs evidence:.*/, 'Docs evidence: TODO verify this against the latest workflow')]) {
    assert.ok(documentationErrors(body, ['README.md']).length > 0);
  }
  assert.ok(documentationErrors(record(), ['src/worker.js']).length > 0);
});

test('comments, fenced examples, and other sections do not count as a review', () => {
  for (const body of [`<!-- ${record()} -->`, `\`\`\`markdown\n${record()}\n\`\`\``,
    '## Documentation review\n\n## Other\n' + record().split('\n').slice(2).join('\n')]) {
    assert.ok(documentationErrors(body, ['README.md']).length > 0);
  }
  assert.deepEqual(documentationErrors(record().replaceAll('\n', '\r\n'), ['README.md']), []);
});

const bot = () => ({ user: { login: 'dependabot[bot]', type: 'Bot' },
  head: { ref: 'dependabot/github_actions/actions/checkout-7', repo: { full_name: 'QFREEE/spacecaveman' } },
  base: { repo: { full_name: 'QFREEE/spacecaveman' } } });
const actionFile = () => ({ filename: '.github/workflows/ci-deploy.yml', status: 'modified', additions: 1, deletions: 1,
  patch: `@@ -1 +1 @@\n-      - uses: actions/checkout@${'a'.repeat(40)} # v6\n+      - uses: actions/checkout@${'b'.repeat(40)} # v7` });

test('waives attestation only for same-repository Dependabot action-pin updates', () => {
  assert.equal(isDependabotActionUpdate(bot(), [actionFile()]), true);
  for (const pr of [{ ...bot(), user: { login: 'QFREEE', type: 'User' } },
    { ...bot(), user: { login: 'dependabot[bot]', type: 'User' } },
    { ...bot(), head: { ...bot().head, repo: { full_name: 'someone/fork' } } },
    { ...bot(), head: { ...bot().head, ref: 'feature/workflow' } }]) {
    assert.equal(isDependabotActionUpdate(pr, [actionFile()]), false);
  }
});

test('workflow behavior changes, missing patches and unrelated files require documentation review', () => {
  for (const file of [{ ...actionFile(), patch: undefined },
    { ...actionFile(), filename: 'src/worker.js' }, { ...actionFile(), status: 'added' },
    { ...actionFile(), additions: 2 },
    { ...actionFile(), patch: actionFile().patch + '\n+      run: echo changed' },
    { ...actionFile(), patch: actionFile().patch.replace('b'.repeat(40), 'v7') },
    { ...actionFile(), patch: actionFile().patch.replace('+      - uses: actions/checkout', '+      - uses: another/checkout') },
    { ...actionFile(), patch: actionFile().patch.replace('+      - uses:', '+    - uses:') }]) {
    assert.equal(isDependabotActionUpdate(bot(), [file]), false);
  }
  assert.equal(isDependabotActionUpdate(bot(), []), false);
  assert.equal(isDependabotActionUpdate(bot(), [actionFile(), { ...actionFile(), filename: 'README.md' }]), false);
});
