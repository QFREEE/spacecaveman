# Publishing the Space Caveman homepage

The `spacecaveman` Worker serves https://spacecaveman.com/. The release source is
current `main`: the bilingual personal homepage, shared flower, real aggregate
counter, public coarse NYC read API and supporting assets.

## Verify locally

```sh
pnpm install --frozen-lockfile
pnpm exec wrangler d1 migrations apply spacecaveman-presence-trial --local
pnpm verify
```

The full Worker package can be checked with two terminals:

```sh
pnpm exec wrangler dev --config wrangler.jsonc --ip 127.0.0.1 --port 8799
node scripts/verify-deployment.mjs http://127.0.0.1:8799
```

The second command checks exact built assets and API contracts using GET only.
Browser tests use independent API fixtures. `pnpm demo:dev` alone does not run D1
or the Worker APIs.

## Release

Open a PR, wait for **Checks** and **Documentation review**, and merge to `main`.
GitHub Actions rebuilds and deploys the website, then runs the exact-build and API
verification. Follow the [deployment guide](deployment.md) for credentials and
rollback. Use manual Wrangler deployment only when explicitly requested.

The website binds the existing `spacecaveman-presence-trial` D1 database. Migrations
0002 and 0003 create the aggregate counter and shared flower and must exist before
those APIs can work. They are additive and were introduced with the production
homepage. Do not reset or seed the live counter or shared plant during validation.
The restoration does not change the separate phone Worker or its credentials.

`build:site` combines the frontend with supporting pages in generated `dist/site`.
It preserves `/presence` and `/visits`, security headers and Worker-first APIs.
The retired `/shortcuts` routes stay 410 Gone. The homepage uses `no-transform`
to prevent injected analytics scripts.

Do not re-run obsolete deployment jobs to release current work. Verify the merged
revision and the actual live build. An older queued run can show a stale overall
status even after its deployment job has been cancelled.