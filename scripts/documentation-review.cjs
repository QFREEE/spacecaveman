// Parse text only. PR descriptions and filenames are untrusted input, never code.
function documentationErrors(body, files) {
  const text = String(body || '').replace(/<!--[\s\S]*?-->/g, '').replace(/```[\s\S]*?```/g, '');
  const section = /^## Documentation review\s*\r?\n([\s\S]*?)(?=^## |$(?![\s\S]))/m.exec(text)?.[1];
  if (!section) return ['Add a Documentation review section using the repository PR template.'];
  const errors = [];
  if (!/^- \[x\] Reviewed setup instructions and documentation accuracy\.\s*$/mi.test(section)) {
    errors.push('Confirm that setup instructions and documentation accuracy were reviewed.');
  }
  const field = name => new RegExp(`^Docs ${name}:[ \\t]*(.+)$`, 'mi').exec(section)?.[1].trim() || '';
  if (!/(?:^|[\s,`])(?:[\w.-]+\/)*[\w.-]+\.md(?:$|[\s,`])/i.test(field('reviewed'))) {
    errors.push('Docs reviewed must name the Markdown documents inspected.');
  }
  const outcome = field('outcome').toLowerCase();
  if (!['updated', 'no change'].includes(outcome)) errors.push('Docs outcome must be updated or no change.');
  const evidence = field('evidence');
  if (evidence.length < 20 || /^(?:todo|tbd|n\/?a|describe\b|what was verified\b|replace\b)/i.test(evidence)) {
    errors.push('Docs evidence must give a specific explanation of the review or why no update is needed.');
  }
  if (outcome === 'updated' && !files.some(path => /\.md$/i.test(path))) {
    errors.push('Docs outcome is updated, but this PR changes no Markdown files.');
  }
  return errors;
}

function isDependabotActionUpdate(pr, files) {
  if (pr.user?.login !== 'dependabot[bot]' || pr.user?.type !== 'Bot' ||
      !pr.head?.ref?.startsWith('dependabot/github_actions/') ||
      !pr.head?.repo?.full_name || pr.head.repo.full_name !== pr.base?.repo?.full_name ||
      !files.length) return false;

  return files.every(file => {
    if (file.status !== 'modified' || !/^\.github\/workflows\/[^/]+\.ya?ml$/.test(file.filename) ||
        typeof file.patch !== 'string') return false;
    const removed = [], added = [];
    for (const line of file.patch.split('\n')) {
      if (!/^[+-]/.test(line)) continue;
      // Preserve indentation, action identity and immutable pins. A change to
      // run commands, permissions or inputs therefore requires normal review.
      const match = /^([ \t]*(?:-[ \t]+)?uses:[ \t]+)([\w.-]+\/[\w./-]+)@([a-f0-9]{40})(?:[ \t]+#.*)?$/.exec(line.slice(1));
      if (!match) return false;
      (line[0] === '+' ? added : removed).push({ prefix: match[1], action: match[2] });
    }
    return added.length > 0 && added.length === removed.length &&
      added.length === file.additions && removed.length === file.deletions &&
      added.every((entry, index) => entry.prefix === removed[index].prefix && entry.action === removed[index].action);
  });
}

module.exports = { documentationErrors, isDependabotActionUpdate };
