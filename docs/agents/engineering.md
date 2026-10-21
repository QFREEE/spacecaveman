# Engineering workflow

## Start from the repository

Inspect Git status, the remote, and the latest `origin/main` before creating a
task branch. Preserve concurrent work. Use the checked-out repository as the
source of truth; avoid copying changes between personal workspace folders.

Read the relevant GitHub issue and domain docs, then inspect the affected code.
Track work in the configured issue tracker. Root `AGENTS.md` is authoritative;
`CLAUDE.md` is a relative symlink to it (Windows may check it out as a text link).

## Repository map

| Area | Responsibility |
| --- | --- |
| `demo/src/` | Published React homepage; fictional fixtures and browser-local guestbook |
| `public/` | Supporting static pages and security headers; visits and presence viewer |
| `src/worker.js`, `src/presence.js` | Visits API and scoped presence handler |
| `wrangler.jsonc` | Website Worker and generated `dist/site/` assets |
| `wrangler.presence.jsonc`, `migrations/` | Separate private presence trial and D1 schema |
| `test/`, `demo/e2e/` | Node API/storage tests and Playwright browser tests |

`scripts/build-site.mjs` combines the homepage build with supporting pages.
Edit source assets, then rebuild; `dist/` is generated output.

## Setup and verification

Use Node 24 (`.node-version`) and the pnpm version in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm verify
```

On Linux, use `pnpm exec playwright install --with-deps chromium` for the browser
setup step. `pnpm verify` runs the existing syntax checks, Node tests, frontend
type/build checks, browser tests, and both Worker dry runs, stopping on failure.
It does not deploy, provision credentials, or apply D1 migrations. CI runs this
same command after installing dependencies and Chromium.

For iteration, run the relevant individual script from `package.json` first.
Before a code PR, complete the shared verification and report actual results.
For documentation-only changes, check links and factual claims; CI still runs
the full sequence. Set `DEMO_TEST_PORT` to an unused port if a local frontend
preview already occupies 4173. Prefer a dedicated test server when verifying
this checkout (`CI=true` disables Playwright's reuse of an existing server).

Tests should exercise external behavior. Use fixed clocks for time-sensitive
fixtures. Local SQLite tests check SQL behavior behind the D1 API shape; they do
not establish deployed Cloudflare behavior. Phone viewport emulation does not
establish physical iOS automation behavior.

## Security boundaries

- Keep real plans private until server-side owner/friend authorization exists.
  Public fixtures and browser-local demo content are explicitly fictional.
- Keep phone geofence detection local. Accept only coarse presence and event
  metadata; never upload or store GPS coordinates. Enforce credential scope,
  revocation, event ordering, and expiry. A missed departure must become unknown.
- Keep credentials outside source, public assets, chat, command arguments, and
  logs. Private bundles belong in ignored `.presence-private/`; CI deployment
  credentials belong in GitHub's `production` environment.
- Treat website and presence-trial deployments as separate targets. Local tests
  use local storage. Verify config, bindings, account, and environment before
  remote changes; website deployment does not migrate or redeploy the trial.

## Finish through a PR

Review documentation using [the PR review guide](pr-documentation.md), and include
its record even when supplying a custom PR body. Require both **Checks** and
**Documentation review** before merging. Distinguish local results, CI results,
deployment results, and device tests in the handoff. The
[deployment guide](../deployment.md) covers normal release and rollback.
