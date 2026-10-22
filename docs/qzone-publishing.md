# Publishing the homepage

The main Worker serves the English-default personal homepage, live coarse NYC
status, a shared flower and a real aggregate page-view counter. See
[production behavior](homepage-production.md) and [translation editing](bilingual-homepage.md).

## Build and check

Use Node 24 and the pnpm version pinned in package.json.

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm verify
```

The shared verification performs syntax checks, real SQLite tests, the frontend
build, browser tests and both Worker dry runs. It does not publish or migrate
production. Use `pnpm exec playwright install --with-deps chromium` on Linux.

For a complete local preview, apply the D1 migrations locally, then run `pnpm dev`.
`pnpm demo:dev` serves only the frontend; endpoints need the Worker.

## Release

Push a task branch and open a PR with the documentation review record. Merge
after **Checks** and **Documentation review** pass. GitHub Actions builds and
deploys the main Worker and assets. The separate phone Worker is not deployed.
See [deployment](deployment.md) for credentials, rollback and exceptional manual
deployment, which requires an explicit owner request.

The current production D1 database already has migrations 0002 and 0003. A new
environment needs those applied before serving the homepage; CI does not apply
migrations automatically. Never include credentials or private bundles in Git.

The build retains supporting visits/presence pages and security headers. Retired
setup URLs remain 410 Gone. The read-only deployment check expects an empty
public visits list, not fictional plans.

Historical browser smoke scripts may write page views or care for the shared
flower. Use the normal browser suite with intercepted responses for routine
frontend checks. Read any smoke script before running it against production.
