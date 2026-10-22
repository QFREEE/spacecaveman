import assert from "node:assert/strict";
import { appendFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export async function isLatestMain(
  { ref, sha, repository, token },
  request = fetch,
) {
  if (ref !== "refs/heads/main") return false;
  assert.ok(
    sha && repository && token,
    "Missing deployment context or GitHub token",
  );
  const response = await request(
    `https://api.github.com/repos/${repository}/git/ref/heads/main`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    },
  );
  assert.ok(response.ok, `Cannot read current main: HTTP ${response.status}`);
  const latest = (await response.json()).object?.sha;
  assert.match(latest || "", /^[a-f0-9]{40}$/, "Invalid main SHA from GitHub");
  return sha === latest;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const current = await isLatestMain({
    ref: process.env.GITHUB_REF,
    sha: process.env.GITHUB_SHA,
    repository: process.env.GITHUB_REPOSITORY,
    token: process.env.GITHUB_TOKEN,
  });
  await appendFile(process.env.GITHUB_OUTPUT, `current=${current}\n`);
  console.log(
    current
      ? "This run is current main; deployment may proceed."
      : "Skipping deployment: this run is not current main.",
  );
}
