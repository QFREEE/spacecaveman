# spacecaveman

The live site at https://spacecaveman.com is a personal lunar space with three
modules: current NYC presence, a local watercolor plant, and a real page-view counter.
The React frontend lives in `demo/` for historical reasons; Wrangler builds and
serves it as the production homepage.

## Homepage behavior

- NYC shows loading feedback until its first response, without
  flashing a default scene. Later refreshes keep the last confirmed state.
- The header Earth dial combines an analog clock and calendar in one drawing.
  It sits behind the Moon surface and foreground artwork.
  It always shows US Eastern time and date, including daylight-saving changes.
  It updates each minute and when returning to the tab.
  The accessible date/time and visible calendar follow the language selector.

- NYC status comes from `GET /api/presence/public`. The hourly iPhone Shortcut
  reports presence; the homepage refreshes every minute and shows the latest answer.
  Update age is approximate: within a few minutes (under five), within an hour,
  within three hours, or over three hours ago. No exact timestamp is displayed.
  Missing reports and reports older than six hours show “No update yet.” Report age is
  available for up to 30 days. No phone credentials are sent to the browser.
- Plant care is entirely browser-local. Water, Sun, Prune and Feed advance
  a fifty-point bar (eight clicks for sketch, six for pot, three for leaves, six for petals), with continuous clicking and no visible numbers.
  Ranked progress reveals sketch → pot → leaves → blooms, regardless of which
  action leads. Refresh preserves the selected plant and care in versioned
  `localStorage`; there is no flower request, polling or midnight reset.
- **New plant** cycles through Cosmos, Tulip, Sunflower, Poppy, Lavender and Calla
  lily and clears the current care and feedback. Separate browsers have separate
  plants. If browser storage is blocked, care remains usable for the current visit.
- p5 and p5.brush generate seeded watercolor textures on first use, then stop and
  release the hidden WebGL sketch. Cached canvas tiles retain transparent pigment,
  darker edges, crossing washes and visible black ink. Meters stay monochrome.
- Encouragement appears after three and six actions; ten earn a personal thank-you.
  New plant clears it. The fertilizer bag is used in both the Feed button and effect.
- [Watercolor plant art guide](docs/watercolor-plant-art.md) records the approved
  method and explains how to add designs without changing rendering or care.

- The counter starts at zero when its migration is applied and counts accepted
  page-load reports, including reloads. It is an aggregate, not a count of unique
  people, and is not bot-filtered analytics. The counter stores no IP addresses,
  cookies or browser identifiers. Loading and failed requests never show a fake
  number.
- English is the default. The English/中文 switch translates the interface without
  resetting module state. Animation follows the device's reduced-motion setting;
  there is no pause-animation button.

Homepage wording uses complete typed English and Chinese catalogs. See
[bilingual homepage](docs/bilingual-homepage.md) for message keys, bundle choices
and the primary references behind the approach.

The older `/visits` page remains reachable, but its API returns an empty list.
Fictional personal plans have been removed. Real plans need the owner and
invited-friend access tracked in GitHub issues #3, #4 and #5.
Earlier profile, diary, album, music and guestbook experiments remain in source
but are not mounted on the production homepage.

## Local development and verification

Use Node 24 and the pnpm version in `package.json`.

```powershell
pnpm install --frozen-lockfile
pnpm exec wrangler d1 migrations apply spacecaveman-presence-trial --local
pnpm dev
```

Use the URL printed by Wrangler. This runs the complete site with local D1.
`pnpm demo:dev` runs only the frontend; the API-dependent modules need the Worker.

```powershell
pnpm exec playwright install chromium
pnpm verify
```

The browser suite covers desktop and touch-enabled phone contexts, both languages,
local care, reload persistence, six plant designs, unavailable browser storage, and
responsive layouts. The backend suite executes the schema and conditional SQL
against SQLite. A dry run builds and packages the Worker without publishing it.

To test the complete Worker package, run these in separate terminals:

```powershell
pnpm exec wrangler dev --config wrangler.jsonc --ip 127.0.0.1 --port 8799
node scripts/qzone-deploy-smoke.mjs http://127.0.0.1:8799
```

The smoke test records page views and attempts one real Water action. It checks
local plant state across reload and a second page, phone layouts, languages, private
presence protection, preserved routes and security headers. It never resets the
local plant. Screenshots and browser reports are generated under `outputs/`.

## Release the main site

Push a task branch, open a pull request, wait for **Checks** and **Documentation
review**, then merge to `main`. GitHub Actions deploys the existing `spacecaveman`
Worker and custom domain. See the [deployment guide](docs/deployment.md) for
credentials, rollback and the explicitly requested manual-deployment path.

`build:site` combines the React build with supporting static files in
`dist/site/`. The homepage and separate phone trial use the existing D1 database;
flower and counter tables are independent of presence tables. Migrations 0002
and 0003 have already been applied to the current production database. A new
environment needs those migrations before serving the homepage. CI does not
apply migrations or redeploy the separate phone Worker. Retired `/shortcuts`
setup URLs remain 410 Gone.

## Phone presence

The protected phone publisher and its credentials remain separate from public
reading. The protected write contract remains documented in the trial guide. The public read exposes
only status, observation time and expiry, and the homepage shows approximate age.
Public reports older than 30 days are hidden; scheduled cleanup removes expired
report data without deleting credentials. No arrival/departure history is stored.

For local setup and the shared verification workflow, see the
[engineering guide](docs/agents/engineering.md).

Start with the [trial guide](docs/presence-trial.md) and
[Shortcuts recipe](docs/iphone-shortcuts-setup.md). See also the
[security design](docs/iphone-presence-design.md),
[domain status](docs/domain-connection.md),
[publishing guide](docs/qzone-publishing.md), and
[homepage production audit](docs/homepage-production.md).
