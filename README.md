# spacecaveman

A small site for invited friends to see current and upcoming NYC visits.

## GitHub deployment

Pull requests run checks. Successful checks on `main` are followed by automatic
deployment of the homepage, supporting static assets, and Worker API using the
official Wrangler GitHub Action. The production environment needs its dedicated
Cloudflare token before deployment can succeed. See [deployment setup and rollback](docs/deployment.md).

The isolated presence trial is checked but not automatically deployed.

## Qzone homepage preview

The isolated React + Vite + TypeScript demo lives in `demo/`. It uses fictional
content, local assets, a local-only guestbook, and an original music-box sample.
English is the default; the top-bar English/中文 switch translates the interface
and sample content without resetting module state. Visitor-written messages are
never translated. The language selection is local to the page and resets to
English on refresh.
The existing Worker and presence trial remain separate.

## Publish the Qzone homepage

The main Worker now builds the Qzone demo as the site homepage. The earlier
visits page remains available at `/visits`, and `/presence` plus the existing
`/api/*` routes retain their behavior. The separate protected presence-trial
Worker uses its own configuration and is not redeployed by these commands.

```powershell
pnpm install --frozen-lockfile
pnpm demo:test
pnpm check
pnpm test
pnpm deploy:check
pnpm deploy
```

Wrangler runs `pnpm build:site` before serving or deploying the main Worker. This
builds the React app and combines it with the existing static files in
`dist/site/`, retaining security headers and copying the old homepage to
`visits.html`. Source files under `public/` stay intact. Deployment targets the
existing `spacecaveman` Worker and its configured custom domain.

```powershell
pnpm install
pnpm demo:dev
```

Open http://127.0.0.1:4173/. To check and build the demo:

```powershell
pnpm demo:build
pnpm exec playwright install chromium
pnpm demo:test
pnpm check
pnpm test
```

The browser suite covers desktop and touch-enabled phone contexts, narrow layouts,
albums, filters, guestbook validation/reset, and real audio controls. Build output
is isolated in `dist/qzone-demo/`; `pnpm demo:preview` serves that build at
http://127.0.0.1:4174/. These commands do not deploy anything.

See [the specification](docs/qzone-demo-spec.md), [asset provenance](demo/ASSETS.md),
and [visual QA](design-qa.md). Screenshots and the browser test report are under
`outputs/qzone-qa/` and `outputs/qzone-test-report/`. Phone viewport emulation is
not physical iOS/Android device testing.

## First milestone: local demo

- Plain HTML, CSS, and browser JavaScript. No frontend framework or build step.
- Cloudflare Workers Static Assets serves `public/`.
- A Worker serves `GET /api/visits` with clearly fictional fixtures.
- Show current and upcoming visits with confirmed/tentative filters. Past visits are omitted.
- No messaging or meetup-request functionality. There is no authentication or database yet.

## Run locally

Install Node.js LTS with npm, then from this repository:

```sh
npm install
npm run dev
```

Open the local URL printed by Wrangler. Wrangler runs the Worker locally alongside the static assets; no Cloudflare login is needed for this demo. Opening `index.html` directly won't run the API.

If you use pnpm instead, use `pnpm install` and `pnpm dev`. This checkout includes a pnpm lockfile.

```sh
npm run check
npm test
npm run deploy:check
```

The last command bundles the Worker without publishing it. It does not prove production authentication or account configuration.

## First deployment: sample site on workers.dev

Use the free Workers plan for this milestone. The site contains fictional visits only and has no private access yet.

From this checkout, run:

```sh
pnpm exec wrangler login
pnpm exec wrangler whoami
pnpm deploy:check
pnpm deploy
```

`login` opens a browser to authorize Wrangler. This is separate from the Cloudflare MCP connection used by Codex. `whoami` lets you verify the destination account before deployment. `deploy:check` bundles locally; `deploy` uploads the static files and Worker API to the Worker named `spacecaveman`. If that name already exists in the selected account, inspect it before deploying to avoid replacing another project.

Wrangler prints the deployment URL, normally `https://spacecaveman.<your-subdomain>.workers.dev`. It may prompt you to choose a workers.dev subdomain on first deployment. Open the returned URL, confirm the visits load, and open `/api/visits` on the same host to inspect the JSON response. This step requires no domain or nameserver changes.

With npm, substitute `npx wrangler` for `pnpm exec wrangler`, and `npm run deploy:check` / `npm run deploy` for the package scripts.

## Learning path

1. Inspect `/api/visits` in your browser's Network tab: the page fetches JSON and renders it.
2. Design invited-friend access and owner access before adding any real plans. Hidden URLs and frontend filters are not access controls.
3. Add D1 migrations for visits, then authenticated reads for friends and writes for the owner.
4. Run and test locally, then perform your first Wrangler login and deployment together.
5. Connect `spacecaveman.com` to Cloudflare while keeping the existing registrar. Review existing DNS records before any nameserver changes.

The sample site is deployed at https://spacecaveman.spacecaveman.workers.dev. The root domain `spacecaveman.com` is attached to that Worker; see [domain connection status](docs/domain-connection.md) for DNS propagation, HTTPS verification, and DNSSEC restoration. The demo is not an invitation-only production service.

## iPhone presence research

An isolated, protected Worker/D1 trial now accepts coarse presence reports and provides a private status viewer. It passes local and deployed HTTP checks; the iPhone automations still need to be created and tested on-device. Start with the [deployed trial guide](docs/presence-trial.md), then follow the [Shortcuts recipe](docs/iphone-shortcuts-setup.md). The [security design](docs/iphone-presence-design.md) also covers future invited-friend access and owner administration.

## Architecture

Browser → static HTML/CSS/JS → same-origin `/api/visits` → Worker

Only `/api/*` uses Worker-first routing. This keeps the API boundary explicit while other files use Static Assets.

References: [Worker and Static Assets routing](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/), [Wrangler](https://developers.cloudflare.com/workers/wrangler/), [D1](https://developers.cloudflare.com/d1/).
