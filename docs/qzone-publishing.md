# Publishing the Qzone demo

The main `spacecaveman` Worker serves the English-default Qzone homepage at
https://spacecaveman.com/ and https://spacecaveman.spacecaveman.workers.dev/.
The English/中文 switch and all demo content remain client-side. Guestbook
messages are never stored on the server.

## Build and verify

```powershell
pnpm install --frozen-lockfile
pnpm demo:test
pnpm check
pnpm test
pnpm deploy:check
```

`build:site` combines the React production build with the existing static assets
in `dist/site/`. It preserves `_headers`, `/presence`, and the API routing, and
retains the earlier homepage at `/visits`. The source files in `public/` remain
intact. The separate protected presence-trial Worker is not redeployed.

For a test of the exact Worker package, run the following in separate terminals:

```powershell
pnpm exec wrangler dev --config wrangler.jsonc --ip 127.0.0.1 --port 8799
node scripts/qzone-deploy-smoke.mjs http://127.0.0.1:8799
```

The smoke test checks the real security headers, local-only guestbook actions,
both languages, albums, audio, phone layouts, and preserved routes. Its guestbook
message exists only in the test browser. It does not write to any API.

## Deploy

Open a pull request and merge to `main` after checks pass. GitHub Actions builds
and deploys the homepage and Worker API, preserving existing dashboard variables.
The [deployment guide](deployment.md) is the source for credentials, manual
recovery, and rollback. The first automated production deployment passed on
October 21, 2026; its run is linked in that guide.

The CI smoke check verifies HTTPS for the homepage and sample visits API. For the
broader browser smoke check described above, run:

```powershell
node scripts/qzone-deploy-smoke.mjs https://spacecaveman.com
```

The configuration pins the existing account and domain. Secrets are managed
separately and are never committed.

The homepage sends `Cache-Control: public, no-cache, no-transform` so edge
optimizations do not inject an analytics beacon into its HTML. The existing
Content Security Policy remains unchanged. Cloudflare's documented behavior:
https://developers.cloudflare.com/web-analytics/get-started/.

Before this homepage deployment, the main Worker version was
`b4e60ab3-e2f4-4a6e-bc70-85a4fa2d203c`. Keep deployment/version history available
when investigating a regression. Local tools, credentials, downloaded historical
references, test reports, and generated output are excluded from Git.
