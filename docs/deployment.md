# GitHub checks and Cloudflare deployment

## Verified status

Automatic deployment is active. [PR #10](https://github.com/QFREEE/spacecaveman/pull/10)
merged as `c058e31c276ccfa5059044a9fca44b447fd43d4d`. The
[first production run](https://github.com/QFREEE/spacecaveman/actions/runs/39596511494)
passed on October 21, 2026: checks, deployment, and live HTTPS verification.
The `production` environment contains `CLOUDFLARE_API_TOKEN` and permits the `main`
branch. This is a record of that verification, not a promise about future runs.

## Normal release path

Open a pull request, wait for its checks, and merge to `main`. Track the release
in [GitHub Actions](https://github.com/QFREEE/spacecaveman/actions). No local
Cloudflare login or manual upload is needed for this path.

Both **Checks** and **Documentation review** are required main-branch merge
checks from GitHub Actions, with no configured bypass actors. Their intended
rules are recorded in `.github/rulesets/`; repository Settings → Rules → Rulesets
holds the live configuration. Editing those JSON files does not apply a rule.

GitHub Actions runs checks for pull requests and pushes to `main`. After successful
checks on `main`, the official Cloudflare Wrangler action deploys the Worker named
`spacecaveman` and its built static assets together. Wrangler runs the existing
`build:site` pipeline to combine the React homepage and supporting pages in
`dist/site/`. Manual workflow dispatch is
also supported from `main` and runs the same checks before deployment.

The isolated `spacecaveman-presence-trial` Worker is bundled during checks but is
not automatically deployed. The website reads its existing D1 database for public presence
and stores flower/counter state in separate tables. Credentials stay protected;
CI does not apply migrations. The current production database already has homepage
migrations 0002 and 0003; provision those before serving a new environment. The React homepage is built and browser-tested before deployment. The
existing visits and presence pages are retained by the site build. Deployment
keeps existing dashboard variables. Do not enable another deploy-on-push
integration for the same Worker.

## Credential setup and rotation

The dedicated CI token is already configured. These instructions are for replacing
it or setting up another environment. Interactive Wrangler and Cloudflare MCP
logins are separate from the CI credential. Keep token values in Cloudflare and
GitHub's secret form, outside chat, source files, issues, and command arguments.

1. In [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens),
   create a custom token named `spacecaveman-github-deploy`.
2. The token form used for the successful deployment exposes these permissions:

   | Category | Permission      | Access | Resource scope                                          |
   | -------- | --------------- | ------ | ------------------------------------------------------- |
   | Account  | Workers Scripts | Edit   | Include only account `b72709d7edb8e1f6d064c69ee4b6d3c5` |
   | Zone     | Workers Routes  | Edit   | Include only `spacecaveman.com`                         |

   The summary should show the specific account, rather than **All accounts**.
   `Workers Editor` is role terminology in newer authorization documentation;
   `Workers Scripts → Edit` is the label verified in this token form. No D1,
   general DNS Edit, account admin, or token-management permission is needed for
   this website deployment. Account-scoped script editing still covers the other
   Workers in that account; it is not limited to the website Worker.

3. Choose an expiration and record a rotation reminder privately. Do not restrict
   the token to the owner's home IP; GitHub-hosted runners use different addresses.
4. In [GitHub repository Settings → Environments](https://github.com/QFREEE/spacecaveman/settings/environments),
   open the existing **production** environment, then **Add environment secret**
   (or edit the existing secret). Name the secret **CLOUDFLARE_API_TOKEN** and paste
   the token as its value. The environment name and secret name are different;
   an environment named after the secret will not supply it to this workflow.
5. Keep the deployment branch rule set to `main`. Pull request checks do not
   receive the production secret. Run **Check and deploy → Run workflow** on
   `main` to verify a replacement, then revoke the old token in Cloudflare.

The account ID is public configuration, not a secret. The scoped token still lets
its holder replace deployed code; treat it as a production credential. If exposed,
revoke it immediately in Cloudflare and replace the GitHub secret. GitHub does not
reveal saved secret values or move them between environments; reuse your securely
held original value or create a replacement token.

## Local commands

Use Node 24 and the package manager version recorded in the project manifest.

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm verify
```

`pnpm verify` runs the same sequence locally and in the CI **Checks** job. See
`package.json` for its individual commands. Node's major version is recorded in
`.node-version` and used by both workflow jobs.

CI installs Chromium's Linux system dependencies too. Actions are pinned to
immutable commits; Dependabot checks for action updates monthly. Pull requests run
without deployment secrets and with a read-only GitHub token. Deployment jobs run
serially, and an in-progress production upload is not cancelled by another push.

## Verification and rollback

Inspect the GitHub Actions run and the Cloudflare deployment history. The deploy
job performs read-only HTTPS checks of the homepage and empty public visits API; a failed
check marks the job failed but does not automatically undo a deployment. The public visits list stays empty until owner/friend authorization exists.

For an exceptional manual upload, authenticate locally with
`pnpm exec wrangler login`, verify the target with `pnpm exec wrangler whoami`,
run `pnpm deploy:check`, then `pnpm run deploy`. The `run` is intentional:
`pnpm deploy` is also a pnpm command with different behavior. Manual deployment
bypasses the GitHub check gate, so use the normal release path for routine changes.

For a bad code release, revert its commit through a pull request and merge the
revert to redeploy a reviewed previous source state. To recover urgently, inspect
`pnpm exec wrangler deployments list --config wrangler.jsonc` and run
`pnpm exec wrangler rollback <version-id> --config wrangler.jsonc` with a verified
previous version ID. Then reconcile `main` before the next deployment. A rollback
does not restore D1 data, migrations, DNS, or other connected resources. The urgent
rollback path is documented, not exercised against production by this setup.

## References

- [Cloudflare's GitHub Actions guide](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)
- [Official Wrangler action](https://github.com/cloudflare/wrangler-action)
- [Workers roles and permissions](https://developers.cloudflare.com/workers/authorization/workers/)
- [API token permission names](https://developers.cloudflare.com/fundamentals/api/reference/permissions/)
- [Worker rollback limitations](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/)

## Exact build verification

The release check compares the public HTML title and JS/CSS paths and contents
with the generated dist/site build, then verifies the public presence, flower,
visitor and empty-visits contracts plus protected and retired routes. It uses
GET only and rejects the old demo even when it responds with HTTP 200.

Issue #39 tracked a release that replaced the newer uncommitted homepage with the
older main tree. PR #41 reconciled the intended production source into main; the
stronger verification catches stale frontend artifacts on subsequent releases.
