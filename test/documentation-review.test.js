import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { documentationErrors } = createRequire(import.meta.url)('../scripts/documentation-review.cjs');
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
