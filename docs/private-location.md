# Private coordinate history

The owner selected precise, encrypted coordinate history retained **until explicitly
deleted**. This is server-side encryption; the private Worker can decrypt history.
Cloudflare and privileged deployment/account operators remain trusted. The public
site receives only borough/status and observation/expiry timestamps.

## Resources and rollout state

- Private Worker: `spacecaveman-location`, source `src/location-worker.js`.
- Intended endpoint: `https://location.spacecaveman.com/api/location`.
- Private D1: `spacecaveman-location-private`, ID
  `1bdb68ae-c55d-4388-98bd-f78aaac77441`, private schema in
  `migrations/location-private/`.
- Public projection: `location_public` in the existing
  `spacecaveman-presence-trial` database, additive migration
  `migrations/0006_location_projection.sql`. Existing counters and tables stay in place.
- Only the private Worker binds both databases. The public Worker has neither
  the private database binding nor its encryption secret.

Provisioned on 2026-10-24: the private D1 database, private schema, scoped credential
digests, public projection table and production GitHub environment secret
`LOCATION_KEYS`. No real coordinate was uploaded. Key/credential files are in the
ignored `.presence-private/location/` directory in the implementation checkout.
This is a record of provisioning, not a claim that ingestion is deployed.

Deployment and public cutover are disabled by default. The current CLI login
cannot manage Access (Access API returned 403); an account owner must configure
the Access application/service credentials before enabling ingestion.

## Phone payload

```json
{
  "latitude": 40.75,
  "longitude": -73.99,
  "observed_at": "2026-10-24T14:30:00-04:00"
}
```

These example coordinates are synthetic fixtures. Latitude/longitude must be JSON
numbers, within [-90,90] and [-180,180]. `accuracy_m` may be omitted or null when
Shortcuts does not expose measured horizontal accuracy; otherwise it must be a
nonnegative finite number no greater than 100,000. The precision selector is not a
measurement and must not be copied into `accuracy_m`.

`observed_at` accepts ISO 8601 or RFC 2822 with a timezone. Reports may be no more
than five minutes old or one minute ahead. Successful writes must be strictly
newer and at least ten seconds apart. Retries retain the original observation
time. Never refresh the timestamp of an old or cached sample to bypass ordering.
The body limit is 1 KiB. Unknown fields, address objects, ZIP codes, client-supplied
status/borough and numeric strings are rejected. Writes return only
`{"accepted":true}` after canonical encrypted persistence; public publication may
lag and retries once a minute without extending the original expiry.

### Change the existing Shortcut after backend setup

Duplicate the current Shortcut and leave its old automation attached until the
new backend is verified. Add these actions:

1. **Get Current Location** once. Set the requested precision deliberately; it
   does not guarantee a measured accuracy. Resolve device location permissions.
2. Extract **Latitude** and **Longitude** using **Get Details of Locations**, or
   by selecting each property of the same blue Current Location variable. Both
   values must refer to that same captured location.
3. Capture/format observation time with timezone. Use sample timestamp metadata
   if available; otherwise capture Current Date immediately when acquiring the
   fresh sample and document that it is the acquisition time. Do not reuse cached
   samples. Physical-device behavior must be tested.
4. **Get Contents of URL**, method **POST**, Request Body **JSON**. Remove the
   old `status`, `event_id` and `cord` fields. Add `latitude` and `longitude` as
   **Number** fields using the extracted outputs, and `observed_at` as formatted
   date text. Do not send the whole Current Location object: text coercion
   produces an address.
5. Add `Authorization: Bearer <location write credential>`,
   `CF-Access-Client-Id`, and `CF-Access-Client-Secret`. The phone gets only its
   own write-only application credential and phone-specific Access token.
   Keep populated shortcuts and token screenshots private.
6. Run manually once, verify acceptance using the private diagnostic, then attach
   to the existing hourly schedule. Remove unconditional Arrive/Leave status
   literals: leaving one NYC neighborhood is not evidence of leaving NYC.
   Verify locked-phone, offline, permission-failure and stale-status behavior.

No accurate location, credential or measured device accuracy has been verified
from the Windows environment. A local runtime test does not establish iPhone
delivery or background execution.

## Private read, export and deletion

All private routes require Cloudflare's authenticated Access runtime context with
the configured audience AND an application bearer credential with the exact scope.

| Route                          | Scope              | Behavior                                                                                                             |
| ------------------------------ | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| POST `/api/location`           | `location:write`   | Validate, encrypt, append, update current observation and publication outbox atomically                              |
| GET `/api/location/current`    | `location:read`    | Decrypt current sample and indicate `stale` after the six-hour lease; null after a clear/revocation                  |
| GET `/api/location/history`    | `location:history` | Decrypt a bounded, paginated history window                                                                          |
| GET `/api/location/export`     | `location:history` | Same paginated JSON contract for private exports                                                                     |
| DELETE `/api/location/history` | `location:delete`  | Delete samples at/before the JSON `before` timestamp, clear matching current/public state, retain ordering watermark |

History/export parameters: ISO timestamps `from` and `to` for a window up to 31
days, `limit` from 1 to 100, and an optional millisecond `after` cursor. Without
dates, the window is the last 31 days. Follow `next_after` until null, or issue
additional date windows to export older retained history. Readers cannot write
or delete, and the phone cannot read history. Responses use `Cache-Control: no-store`.

Generated application credentials expire after 90 days. Renew credentials through
scoped credential provisioning and revoke their predecessors; do not regenerate
the whole bundle or lose the history encryption keys when renewing phone access.

Add owner/tool-specific `access_client_id` and `access_client_secret` to the local
private `credentials.json` before using the CLI. It prints metadata only and writes
exports to ignored private files, never terminal coordinates:

```powershell
pnpm location:client current
pnpm location:client export '2026-10-01T00:00:00Z' '2026-10-25T00:00:00Z'
# Destructive, explicit owner action; preview/export before choosing a cutoff:
pnpm location:client delete '2026-10-01T00:00:00Z'
```

Application history has no automatic retention deletion. Deleting a row does not
immediately remove it from D1 Time Travel: recovery is up to 7 days on Free and 30
days on Paid. Old ciphertext remains decryptable while its key remains available.
Credential revocation stops access/public sharing and does not erase owner history.

## Encryption, boundary data and logs

Each observation uses AES-256-GCM with a new random 96-bit nonce. The ciphertext
contains coordinates, nullable accuracy and normalized observation time. Row ID,
ordering time, receipt time, credential ID, envelope version and key ID are
authenticated as additional data. Ordering times remain visible SQL metadata.
Never replace encryption with a hash. Keys are stored only in `LOCATION_KEYS`, a
JSON key-ID-to-base64url-key map bound as a secret to the private Worker.

Rotation: add a new key ID while retaining all keys needed by existing history,
deploy with `LOCATION_ACTIVE_KEY` set to it, and let the private cron re-encrypt
at most 100 older records per minute. Verify no live history uses the old key
before removing it, and separately decide recovery of old backups. Losing a key
can make its historical ciphertext unrecoverable. Do not promise cryptographic
erasure while recoverable keys/backups still exist.

Boroughs come from NYC DCP's official **water-inclusive** polygons, bundled in
`src/data/nyc-boroughs.json` with source URL, download date and checksum. No private
location goes to NYC Open Data or a geocoder. Refresh with
`node scripts/update-borough-boundaries.mjs` and review geometry tests/diff.
Water-inclusive data keeps ferry/river observations within NYC where applicable.
Points within an approximate policy margin of max(100 m, measured accuracy) of a polygon edge
are unknown; unknown accuracy uses the 100 m policy margin without pretending
it is measured. Accuracy worse than 5 km yields unknown publicly. Published
borough expires after six hours, capped by writer credential expiry.

No request bodies, tokens, coordinates, URLs or exception messages are logged by
the private module. Private observability is intentionally disabled in its config;
sanitized event names can still be inspected through a deliberately authorized
tail session. Audit account-level log sinks before enabling any additional
telemetry. Never copy the original workspace's raw-body debug flag into this Worker.

## Setup and deployment

1. The new private database and public projection schema are already provisioned
   as recorded above. For a fresh environment, update binding IDs and apply only
   the private migration directory to `LOCATION_DB`; never run homepage migrations
   against that private database. Local tests use isolated synthetic state.
2. `pnpm location:credentials` creates a **new**, non-overwriting bundle in
   `.presence-private/location/` with four separate credentials and an encryption
   key. Do not run it again to replace the provisioned bundle. Protect these files
   and any backups with your OS/account access controls; gitignore is not encryption.
3. In Cloudflare Zero Trust configure an Access self-hosted application for
   `location.spacecaveman.com`, with a **Service Auth** policy including specifically
   selected phone/owner service tokens. Use separate tokens per device/tool,
   enable strict service-token authentication, and record the application's
   audience tag as GitHub repository variable `LOCATION_ACCESS_AUD`. The private
   Worker has no assets/router, `workers.dev` or preview URLs; its code also rejects
   invocations without the expected trusted Access runtime context. Do not use
   a bypass policy. Test all hostnames for denial without authentication.
4. Production GitHub environment secret `LOCATION_KEYS` is already staged. Keep
   it scoped to the private deployment job. Future rotation updates that secret
   and the active-key config together. The website job must not receive it.
5. Review/merge the implementation PR through normal checks. Set repository
   variable `LOCATION_DEPLOY_ENABLED=true` only after Access audience/policy and
   migration readiness are verified. The gated private deployment job uses the
   same current-main guard and production environment as the website. No local
   manual Wrangler deployment is part of this setup.
6. Test synthetic ingestion on the deployed private endpoint first; confirm that
   private SQL contains ciphertext and the public projection has no coordinates.
   Only then replace/enable the phone automation, with fresh actual observations.
7. After the private phone pipeline is verified, make a follow-up website PR
   changing `LOCATION_PUBLIC_READ` in `wrangler.jsonc` from `false` to `true`.
   This switches reads to the projection and retires the website's legacy write
   route. Revoke old trial write credentials/automations so they cannot race the
   private pipeline. The old trial stays available during migration, but its
   legacy table is ignored after public cutover.

The private outbox is latest-only: encrypted history is stored transactionally
with current state; sanitized publication to the other database retries safely.
Public writes compare observation time and revision, so an older retry cannot
replace a newer sample or undo a revocation/deletion. Revocation/clear publication
may lag until the next successful one-minute cron. Missing public database/schema
never causes plaintext fallback. Missing keys prevent acceptance.

Rollback: disable/revoke coordinate ingestion, retain the isolated encrypted
database, and allow public status to expire or publish unknown. Do not restore
plaintext writes or bind private storage/keys to the website. Do not delete keys
or the database automatically as part of rollback.

## Verification and references

`pnpm verify` includes Node security/storage tests, the local workerd/D1 smoke,
frontend build/browser coverage and three Worker dry runs. The smoke creates
temporary databases and generated synthetic credentials; it never reads the real
bundle or calls a remote location API. Production Access policy, live delivery and
device automation require separate checks after setup.

Sources: [Cloudflare D1 security](https://developers.cloudflare.com/d1/reference/data-security/),
[Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/),
[Web Crypto](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/),
[Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/),
[Access and runtime context](https://developers.cloudflare.com/workers/configuration/cloudflare-access/),
[service tokens](https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/),
[NYC borough boundaries including water](https://data.cityofnewyork.us/City-Government/Borough-Boundaries-water-areas-included-/53n2-m85m).
