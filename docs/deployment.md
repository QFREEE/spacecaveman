# GitHub checks and Cloudflare deployment

GitHub Actions runs checks for pull requests and pushes to `main`. After successful
checks on `main`, the official Cloudflare Wrangler action deploys the Worker named
`spacecaveman` and its `public/` static assets together. Manual workflow dispatch is
also supported from `main` and runs the same checks before deployment.

The isolated `spacecaveman-presence-trial` Worker is bundled during checks but is
not automatically deployed. Its D1 database, credentials and migrations remain
separate. The React demo is built and browser-tested but is not the production
frontend. Do not enable another deploy-on-push integration for the same Worker.

## One-time deployment credential

The existing interactive Wrangler and Cloudflare MCP logins are not CI credentials.
Create a dedicated, expiring Cloudflare API token and store it directly in GitHub;
never paste it into chat, source files, an issue, or a command argument.

1. In Cloudflare, create an API token named `spacecaveman-github-deploy`.
2. Grant the existing Worker deployment permissions in account
   `b72709d7edb8e1f6d064c69ee4b6d3c5`. Cloudflare currently documents Editor as
   sufficient for an existing Worker. Its Custom Domains API does not yet support
   per-Worker roles, so this custom-domain configuration currently needs the
   Workers Editor role at the account's Workers scope. Do not grant all accounts.
3. Scope Workers Routes Write to the `spacecaveman.com` zone for the custom-domain
   declaration managed by Wrangler. Do not grant general DNS Edit, account admin,
   D1, or token-management permissions. Review current permission names in the
   linked documentation when creating the token.
4. Choose an expiration and record a rotation reminder privately. Do not restrict
   the token to the owner's home IP; GitHub-hosted runners use different addresses.
5. In GitHub repository Settings → Environments → `production`, add environment
   secret `CLOUDFLARE_API_TOKEN` with that value. The environment permits deployment
   only from `main`. Pull request checks do not receive this secret.

The account ID is public configuration, not a secret. The scoped token still lets
its holder replace deployed code; treat it as a production credential. Revoke it
in Cloudflare and replace the GitHub secret if exposed. No token was generated or
copied from the existing interactive login for this setup.

## Local commands

Use Node 24 and the package manager version recorded in the project manifest.

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm demo:build
pnpm exec playwright install chromium
pnpm demo:test
pnpm deploy:check
pnpm presence:deploy:check
```

CI installs Chromium's Linux system dependencies too. Actions are pinned to
immutable commits; Dependabot checks for action updates monthly. Pull requests run
without deployment secrets and with a read-only GitHub token. Deployment jobs run
serially, and an in-progress production upload is not cancelled by another push.

## Verification and rollback

Inspect the GitHub Actions run and the Cloudflare deployment history. The deploy
job performs read-only HTTPS checks of the homepage and sample visits API; a failed
check marks the job failed but does not automatically undo a deployment. The API
may correctly return an empty visits list after the fictional dates pass.

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
- [Worker rollback limitations](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/)
