# Deployed iPhone presence trial

Deployed 2026-10-20 to the existing Cloudflare account, separately from the public sample site.

- Viewer: https://spacecaveman-presence-trial.spacecaveman.workers.dev/presence.html
- API: https://spacecaveman-presence-trial.spacecaveman.workers.dev/api/presence
- Worker: `spacecaveman-presence-trial`
- Database: `spacecaveman-presence-trial`, binding `PRESENCE_DB`
- Config: `wrangler.presence.jsonc`

## Finish on the iPhone

Open the local `.presence-private/iphone-setup.txt` file for your credentials. It is ignored by Git and outside the deployed `public/` directory. Do not paste it into chat or share a populated shortcut. The credentials expire January 18, 2027 at approximately 10:54 p.m. Eastern.

1. Follow [the action recipe](iphone-shortcuts-setup.md): Date → Format Date (ISO 8601 with time zone) → fresh event ID → URL → Get Contents of URL.
2. Use the API URL above, method **POST**, JSON body, and the **Authorization** header from the private file. Use the write credential only.
3. Supply exactly `status`, `observed_at`, and `event_id`. Start with a manual `not_in_nyc` report; confirm the response is `{"accepted":true}`. Use your actual current state when reporting real presence.
4. Open the viewer and enter the separate read credential. Confirm the report and time. Credentials stay in tab memory; there is no localStorage, cookie session, or token in the URL.
5. Attach the action sequence to **Arrive** and **Leave** for the same chosen circle; use `in_nyc` on arrival and `not_in_nyc` on departure. Enable automatic execution. Check the circle on the phone before calling it NYC.
6. Test crossing that boundary with the phone locked. Follow the recipe's offline, reboot, and long-visit checks. These tests have not been performed from Windows.

This is a private owner trial. The public visits remain fictional; full invited-friend login, an owner administration page, and manual override semantics remain future work. The [public homepage card](three-module-homepage.md) shows Unknown without querying this trial; it is not a live presence badge.

## Implemented contract

- `POST /api/presence`: write credential only, acknowledgment only. At most 1 KiB JSON, exactly three fields; unexpected fields are rejected. Event IDs are 1–128 ASCII letters, digits, underscore, period, colon, plus or minus.
- `GET /api/presence`: separate read credential only; returns status and report/expiry timestamps, or Unknown. Never accepts the write credential.
- Observation timestamps include a timezone; at most five minutes old or one minute ahead. Only newer observations can replace status. Reused event IDs are rejected within the acceptance window; old timestamps remain rejected after that window.
- Successful writes are at least ten seconds apart. Rejected duplicate/old/rate/revoked races return 409; do not fabricate a fresh timestamp to retry an old geofence event.
- Status expires six hours after observation, capped at writer credential expiry. The API checks expiry at read time, and the viewer clears an expired report even when refresh fails. Revocation/deletion clears that credential's status through database triggers.
- Credentials contain a random public ID and 256-bit random secret; D1 stores only the secret digest, scope, expiry and revocation flag. Secret digests are compared in constant time. Active credential checks are repeated in conditional SQL to handle revocation races.
- Current status overwrites one row. Deduplication hashes contain no status or raw event IDs; expired hashes are pruned on the next authorized write. No arrival/departure history table exists. Provider backups/metadata have separate retention.
- The dedicated trial disables Workers logs and traces to avoid recording private trial requests. Application code does not read IP/geographic metadata or log bodies/credentials.

## Local development and validation

Requires the existing Node 24 runtime for the SQLite tests. Use `pnpm` in this checkout.

```powershell
$env:WRANGLER_LOG_PATH = Join-Path (Get-Location) '.wrangler/logs'
pnpm exec wrangler d1 migrations apply PRESENCE_DB --config wrangler.presence.jsonc --local
# Existing checkout already has credentials. Generate once only in a fresh checkout:
# pnpm run presence:credentials
pnpm exec wrangler d1 execute PRESENCE_DB --config wrangler.presence.jsonc --local --file .presence-private/provision.sql
pnpm run presence:dev
```

The provisioning file inserts credentials once; do not reapply it to a database where those IDs already exist. Open http://127.0.0.1:8791/presence.html. Port 8791 keeps this trial separate from an existing demo dev server.

```powershell
pnpm run check
pnpm test
pnpm run presence:deploy:check
node scripts/presence-smoke.mjs
```

Validation completed: nine Node/SQLite tests, Wrangler dry run, actual local Workers runtime smoke tests, deployed HTTPS smoke tests, and visual inspection of the private viewer. The HTTPS smoke test used a synthetic report, which was cleared afterward. No iPhone delivery or geofence test has run yet. Smoke tests write synthetic presence; use them only before real phone testing or when deliberately replacing the trial report.

## Revoke access

The private `revoke.sql` file revokes both trial credentials and clears presence. Execute only against this dedicated trial database:

```powershell
pnpm exec wrangler d1 execute PRESENCE_DB --config wrangler.presence.jsonc --remote --file .presence-private/revoke.sql
```

There is intentionally no public credential-management endpoint. To rotate, revoke first, retain the old revocation file as needed, then generate a new bundle in a fresh private directory/checkout, provision the new digest records, and manually replace the phone/viewer credentials. Do not delete an existing bundle without preserving any credentials still needed for access.
