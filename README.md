# spacecaveman

A personal website and learning project, hosted on Cloudflare Workers Free with
Workers Static Assets. The goal is to help invited friends see NYC presence and
upcoming visits; private friend access and owner administration remain planned.

## Current status

- [Live homepage](https://spacecaveman.com/): bilingual React + Vite + TypeScript
  Qzone-style homepage with exactly three modules: **Am I in NYC?**, the flower
  vine, and a decorative visitor counter. The public NYC card shows **No update yet.**
  and is not connected to the private presence trial. The count is sample data.
  [Current behavior and screenshots](docs/three-module-homepage.md). English is
  the default; the English/中文 switch preserves flower state. The lunar header,
  walking caveman and pendant remain.
- The accepted lunar design is saved as `design/lunar-qzone-v1`. A typed theme
  registry and palette files support optional skins. The public style selector
  is temporarily hidden; Lunar ink stays the default. [How to extend a skin](docs/themes.md).
- [Visits page](https://spacecaveman.com/visits): the earlier minimal frontend,
  backed by `/api/visits` with fictional upcoming visits. Past visits are omitted;
  the list becomes empty when the sample dates have passed.
- Deployment is automated: pull request → checks → merge to `main` → checks →
  deploy the homepage, supporting assets, and Worker API together. The
  [first successful production run](https://github.com/QFREEE/spacecaveman/actions/runs/39596511494)
  completed on October 21, 2026 after [PR #10](https://github.com/QFREEE/spacecaveman/pull/10).
- The registrar remains Squarespace; Cloudflare serves the root custom domain.
  [Domain connection records](docs/domain-connection.md) describe the cutover and
  the DNSSEC observations made at that time.
- An isolated, protected Worker/D1 [presence trial](docs/presence-trial.md) accepts
  coarse reports using scoped credentials. It is separate from the public site
  and is not automatically deployed by the website workflow. Physical iPhone
  automation testing remains outstanding.
  The [repository-only iPhone setup guide](docs/iphone-shortcuts-setup.md)
  explains a manual publisher, Unknown/clear, and Arrive/Leave automation inputs.
  Setup pages are excluded from both production sites; former `/shortcuts`
  URLs return 410 Gone. `pnpm presence:check -- <private-bundle-path>`
  diagnoses the trial with a read-only request; it never replaces the report.

The public website contains demo content, not private plans or live presence.
Invited-friend authentication, persistent visits, owner editing, and integration
of current presence are tracked in [GitHub Issues](https://github.com/QFREEE/spacecaveman/issues).

## Local development

Use Node 24 (`.node-version`) and the pnpm version recorded in `package.json`. The pnpm lockfile is
the dependency source of truth.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Wrangler builds the React homepage, combines it with the existing static pages,
and serves the Worker and assets locally. Open the URL it prints. Opening an HTML
file directly does not run the API.

For the faster frontend-only preview:

```sh
pnpm demo:dev
```

Open http://127.0.0.1:4173/. This preview uses fictional local data; it does not run
the Worker. `pnpm demo:preview` serves the frontend production build on port 4174.

## Checks

```sh
pnpm exec playwright install chromium
pnpm verify
```

The browser suite checks the three modules, valid navigation, keyboard order,
desktop and touch-enabled phone layouts, both languages, flower growth and caps,
duplicate-care protection, the flag reward, enlarged text and reduced motion.
Historical full-homepage scenarios are retained outside the active suite in
`demo/previous-homepage-tests/`. Phone emulation does not
replace physical iOS/Android testing. On Linux, install Chromium dependencies with
`pnpm exec playwright install --with-deps chromium`, as CI does. Set
`DEMO_TEST_PORT` to an unused port if another preview already occupies port 4173.

`pnpm verify` is the shared local/CI command: syntax checks, Node tests, frontend
type/build checks, browser tests, and both Worker dry runs. It stops on failure.
The dry runs build/package code without publishing it or applying migrations.
See the [publishing guide](docs/qzone-publishing.md) for a smoke test against the
complete Worker package and [visual QA](design-qa.md) for the frontend review.

## Deployment

Use a pull request for changes. After its checks pass, merge to `main`; GitHub
Actions deploys through the official Wrangler action and checks the live homepage
and sample visits API. The production secret is configured. See the
[deployment guide](docs/deployment.md) for the workflow, exact credential settings,
rotation, manual recovery, and rollback limits.

Every PR also requires a [documentation review](docs/agents/pr-documentation.md):
revisit setup instructions and accuracy, then record the documents inspected and
either the updates made or why no edit is needed. The PR template and required
**Documentation review** check enforce that record.

Verified Dependabot PRs that only update immutable GitHub Action pins pass the
documentation gate without a written record. Full CI and the normal merge rules
still apply; workflow behavior changes require the regular review.

The main-branch rules also require the **Checks** job to pass before merging;
deployment checks are no longer the only gate for test/build failures. Agents
start with the [engineering guide](docs/agents/engineering.md).

GitHub deploys only the `spacecaveman` Worker. Changes to the presence trial, its
credentials, or D1 migrations require their separate workflow and verification.

## Architecture and references

`demo/` holds the React homepage. Wrangler runs `build:site` to combine its build
with `public/` in generated `dist/site/`, preserving the earlier homepage as
`visits.html`, the presence viewer, and security headers. Workers Static Assets
serves those files; only `/api/*` uses Worker-first routing. The public Worker has
no presence database binding; the trial uses its own D1 binding and credentials.

- [Deployment and rollback](docs/deployment.md)
- [Homepage publishing and package smoke tests](docs/qzone-publishing.md)
- [Homepage specification](docs/qzone-demo-spec.md) and [asset provenance](demo/ASSETS.md)
- [Presence trial](docs/presence-trial.md), [Shortcuts recipe](docs/iphone-shortcuts-setup.md), and [security design](docs/iphone-presence-design.md)
- [Cloudflare Static Assets routing](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/)
