# iPhone presence: feasibility and security design

Investigated 2026-10-20. Device version supplied by owner: iOS 17. A protected Worker/D1 trial with scoped write/read credentials is now deployed; see [trial status and setup](presence-trial.md). The sections below retain the broader proposed production design. Owner administration, invited-friend login, manual overrides, and iPhone automations have not been implemented or installed.

## Recommendation

Use iOS 17 Arrive/Leave personal automations as a best-effort coarse presence signal, with an expiring status and a manual fallback. Keep the owner webpage for future visits and availability notes. Current presence does not imply availability to meet, and a future visit does not establish current presence.

Do not claim always-current tracking. A missed arrival produces no positive status; a missed departure leaves a bounded stale positive until expiration. An exact NYC municipal boundary and guaranteed unattended delivery are not established by Shortcuts documentation.

## Cloudflare feasibility and implementation path

Rechecked 2026-10-20 against current Cloudflare documentation and this checkout. The isolated Worker/D1 trial passes local and deployed HTTP smoke checks; the uncertainty is phone-side region detection and unattended delivery. This is not a completed device or production test. See [the practical iPhone setup recipe](iphone-shortcuts-setup.md).

Proposed flow: iPhone Arrive/Leave automation → HTTPS `POST /api/presence` → Worker validates a limited credential and event → D1 replaces the current status → authenticated friends read it through the Worker. Keep future visits independent from this status.

| Component | Role and decision |
| --- | --- |
| Existing Worker | `src/worker.js` now dispatches presence writes and authenticated reads in the dedicated trial, alongside fictional `GET /api/visits`. Presence stays unavailable without the trial's D1 binding. |
| D1 | Store current status, observation/expiry times, and credential lifecycle records. Use conditional SQL updates to reject older observations and check active credentials atomically. Use primary reads for authorization and freshest presence. Cloudflare documents primary routing and the Sessions API's `first-primary` constraint. [D1 consistency](https://developers.cloudflare.com/d1/best-practices/read-replication/) |
| KV | Avoid for authoritative presence and credential revocation: updates can take 60 seconds or longer to reach other locations, and KV does not provide the atomic ordering needed here. [KV consistency](https://developers.cloudflare.com/kv/concepts/how-kv-works/) |
| Worker secrets | Keep any server-side application secrets out of source and frontend files. The phone receives only its restricted application credential; it never needs a Cloudflare account API token. [Workers secrets](https://developers.cloudflare.com/workers/configuration/secrets/) |
| Friend/owner login | Implement before showing real presence or plans. A browser login screen must not sit in the unattended shortcut's request path; its limited API credential needs its own server-enforced route authorization. |

Expected hosting cost for this small personal workload: Workers Free and D1 Free should be sufficient, subject to measured CPU and total account usage. Workers Free currently includes 100,000 dynamic requests/day with 10 ms CPU per invocation; D1 Free includes 5 million rows read/day, 100,000 rows written/day and 5 GB total storage. For illustration, 20 open friend tabs polling once/minute for eight hours produce 9,600 reads/day, before other traffic. This is a workload estimate, not an account quota check or a production benchmark. [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/)

The proposed body stays small:

```json
{
  "status": "in_nyc",
  "observed_at": "2026-10-20T19:00:00-04:00",
  "event_id": "<fresh event identifier>"
}
```

An ISO 8601 timestamp with an explicit timezone offset represents the same instant as UTC; the server should normalize it. Do not label local time with a literal `Z`. The timestamp above is illustrative and must never be reused for a real event.

Build and validate in this order:

1. Add invited-friend reads and separate owner authentication.
2. Implement D1 state and scoped presence writes locally, including expiry, duplicate/old-event handling, credential revocation and strict body validation.
3. Publish an isolated HTTPS test endpoint with a restricted test credential, and verify a manual shortcut POST. The current deployed demo has no presence endpoint.
4. Create Arrive and Leave automations on the iPhone, then test locked-phone arrival/departure, offline transitions, reboot, long visits and boundary accuracy.
5. Show real status only after those tests; label it “Last reported in NYC” with its observation time, and show Unknown after expiry. Start with the proposed six-hour lease and tune from actual use.

Do not rely on a Cloudflare cron job to wake the iPhone or determine its location. A server schedule cannot substitute for a fresh phone-side observation. Arrive/Leave alone will also allow a long visit to expire; improving that requires separately tested fresh-location reconciliation or a manual update, not repeating the previous arrival.

## Verified Apple capabilities

Apple's versioned iOS 17 guide explicitly lists Arrive and Leave among automations that can run automatically. Its instructions describe disabling Ask Before Running; the on-device UI may offer Run Immediately. Individual actions may still need permissions. Before I Commute is excluded. Do not apply newer-version lock-screen settings to iOS 17. [Apple: automatic execution, iOS 17](https://support.apple.com/en-euro/guide/shortcuts/apd602971e63/7.0/ios/17.0)

Arrive/Leave triggers use a location with an adjustable circular boundary. The docs do not establish a city-polygon trigger or the maximum usable circle on this particular phone. An NYC label is therefore an approximation unless the chosen boundary has been tested. A Grand Central trigger alone means arrival near Grand Central, not presence anywhere in all five boroughs. Leaving home does not imply arrival in NYC. Avoid multiple overlapping circles with unconditional departure writes: exiting one circle could falsely mark a departure while still inside another. [Apple: travel triggers, iOS 17](https://support.apple.com/guide/shortcuts/travel-triggers-apd8ebfc4e8e/7.0/ios/17.0)

Get Contents of URL supports POST and a JSON request body on iOS 17. The proposed request uses a fixed HTTPS endpoint and an Authorization header; verify header configuration on-device during setup. No Safari page is needed for each update. [Apple: API requests, iOS 17](https://support.apple.com/en-euro/guide/shortcuts/apd58d46713f/7.0/ios/17.0)

The iOS 17 guide says reusable shortcuts can sync through iCloud and personal automations do not sync. Putting the credential in a reusable shortcut called by an automation exposes it to that shortcut's sync/sharing footprint. Disabling sync does not prove absence from device backups. A credential embedded as action text is inspectable by someone who can edit the shortcut; it is not a non-exportable device key. [Apple: sync, iOS 17](https://support.apple.com/en-euro/guide/shortcuts/apdb3a4240b0/7.0/ios/17.0)

Apple documents permission prompts and per-shortcut access controls. Run the exact actions manually once and resolve legitimate permissions before testing unattended operation. Do not include Ask for Input, menus, credential prompts, or browser sign-in in the automated path. [Apple: privacy settings](https://support.apple.com/guide/shortcuts/adjust-privacy-settings-apd961a4fc65/ios)

These documents provide no end-to-end delivery guarantee, retry SLA, or trigger latency guarantee. Offline networking, device shutdown/reboot, disabled permissions, and region detection uncertainty must be treated as failures. Apple's Core Location documentation discusses system-driven region detection and post-reboot constraints, but those developer APIs are not a contract for Shortcuts internals. [Apple: region monitoring](https://developer.apple.com/documentation/corelocation/monitoring-the-user-s-proximity-to-geographic-regions)

## Data boundary

The location decision happens locally on the iPhone. The shortcut constructs a fresh dictionary containing only:

```json
{
  "status": "in_nyc",
  "observed_at": "<ISO 8601 timestamp with timezone generated for this event>",
  "event_id": "<random event identifier>"
}
```

Departure uses `not_in_nyc`. No location object, coordinates, geofence center, address, route, Wi-Fi identifier, or device identifier enters the request. Do not pipe a location action's output into the HTTP action. Local timestamp and random ID support freshness and duplicate handling; they are not location data.

Strictly reject extra fields and oversized bodies without logging their content. This limits accepted data; only inspecting the shortcut's constructed request can establish that GPS data is never transmitted. Do not upload real coordinates for testing.

HTTPS necessarily exposes network metadata such as source IP and timing to Cloudflare. Workers can also receive IP-derived geography in `request.cf`. Do not read, store, log, or use it to infer presence. The application can avoid GPS uploads and location history, but cannot promise that the network provider sees no metadata. [Cloudflare: Request metadata](https://developers.cloudflare.com/workers/runtime-apis/request/)

Keep one current-status record, not a travel-event history. Overwrite the old record; retain only bounded, short-lived deduplication metadata. Avoid raw request/response logging and redact Authorization from all telemetry. D1 backups and provider logs have their own retention: no history UI is not a promise of immediate physical erasure everywhere.

## Credential and authorization proposal

Use an application-issued opaque bearer token with 256 random bits. It is not a Cloudflare account API token, D1 credential, admin cookie, or friend-view session. A bearer token is usable by anyone who obtains it; TLS and protection at rest are necessary. [IETF: bearer token usage](https://www.rfc-editor.org/rfc/rfc6750)

- Permit exactly `POST /api/presence`, for this owner's single presence record, with scope `presence:write`. Return only an acknowledgment, never plans or administrative data.
- Deny this credential on every presence-read, plans, owner, token-management, and admin route. Check scope on the server; CORS and an obscure URL are not authorization.
- Transmit it only as `Authorization: Bearer …` over HTTPS to one fixed host. Never place it in URL parameters, shortcut names, logs, screenshots, Git, or frontend JavaScript. Avoid redirects on this route.
- Store only a SHA-256 token digest, fixed scope, owner binding, expiration, and revocation state in D1. Compare fixed-size digests with a constant-time comparison. Use prepared queries. Workers provides Web Crypto and `timingSafeEqual`. [Cloudflare: timing-safe comparison](https://developers.cloudflare.com/workers/examples/protect-against-timing-attacks/)
- Propose a 90-day credential lifetime, independently of status expiration. The owner page issues/revokes/rotates it under separate owner authentication; replacement in Shortcuts is a manual maintenance step. Do not put an admin-capable renewal secret on the phone.
- Check expiry and revocation at each write against the authoritative database. Include the active-credential predicate in the atomic status update to avoid a check/write revocation race. No isolate-global authorization cache or stale replica for revocation. Default D1 queries target primary unless the Sessions API is used. [Cloudflare: D1 consistency](https://developers.cloudflare.com/d1/best-practices/read-replication/)
- On revocation, invalidate any current positive status sourced from that credential. In-flight operations already committed cannot be retroactively prevented; the revocation operation must clear their resulting status too.
- Add conservative request limits and bounded inputs. Cloudflare's Rate Limiting binding is approximate and per-location, not a global abuse budget. It complements authorization. [Cloudflare: rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)

Leak impact remains meaningful: a holder can lie about presence and repeatedly renew it until revocation or credential expiry. They cannot read plans or perform admin actions. Status expiration protects against a missed departure; it does not stop an attacker with a still-valid token. The token also does not prove that an iPhone geofence fired.

Shortcuts risk controls: configure the token only on the owner's device, never share/export a populated shortcut, avoid screenshots of its actions, audit reusable-shortcut sync, protect the device and Apple account, and provide a clear revoke button in the separately authenticated owner page. Password-manager retrieval that requires Face ID or unlock is safer against extraction but can defeat unattended execution. Plain Shortcuts does not provide evidence of a native non-exportable signing-key facility for this flow.

## Expiration and ordering proposal

Treat presence as a lease, with three viewer states: In NYC, Not in NYC, and Unknown.

- Proposed initial lease: six hours for either reported status, adjustable server-side after commute testing. Shorter leases reduce stale positives but make long visits become Unknown sooner.
- The server computes expiry from the event observation time plus its fixed lease, never from a caller-provided expiry. Accept only fresh timestamps (proposed: at most five minutes old and at most one minute ahead); otherwise require a new observation.
- A missed departure causes In NYC to become Unknown at expiry. Unknown does not claim departure. Neither future visits nor an old arrival may renew current presence.
- Evaluate expiry on every authorized read, send `Cache-Control: no-store`, and make an already-open page clear the badge at expiry. A cleanup cron is optional and must not be required for correctness. On failed refresh, retain the original expiry and show Unknown when it elapses.
- Apply only newer observations atomically; reject stale/equal conflicting events. Duplicate event IDs do not extend the original lease. Bound any retry to the original event's freshness window; do not resend an old arrival with a newly fabricated timestamp after a later departure.
- Store event-deduplication hashes only through the acceptance window and prune them. Do not build an arrival/departure history table.
- A manual shortcut fallback reports a freshly selected state using the same limited token. The owner page can also set/clear presence under owner authentication. Make any deliberate manual override a separate, expiring override so later automated writes do not unexpectedly replace it.

Arrival and departure alone do not continuously refresh a six-hour lease. Do not run a timer that blindly republishes the last status: that would preserve a missed departure indefinitely. Optional scheduled reconciliation must make a new local location decision, send only the coarse result, and be tested separately on iOS 17. Do not depend on an indefinite Wait/Repeat loop.

## Complementary owner and friend access

The owner page manages upcoming visits, availability notes, manual presence, and credential lifecycle. It needs separate strong owner login and CSRF protection for cookie-authenticated changes. Friends get authenticated, invited-only read access. A phone presence token is never accepted as a friend credential. Show current presence independently from future visits, and continue omitting past visits and messaging.

The existing unauthenticated `/api/visits` is still a fictional local demo. It must not contain real private plans before invited-friend access is implemented. Likewise a new presence-read route must not make real presence publicly readable before that boundary exists.

## Validation before relying on automation

1. On the actual iOS 17 device, confirm Arrive/Leave can be configured for automatic execution and inspect the achievable circle. Check it against normal NYC travel, including routes that avoid Grand Central and areas near the city boundary. Do not call a broad circle an exact city polygon.
2. Against an isolated HTTPS test endpoint, inspect the exact outgoing dictionary and confirm no coordinates. Run once manually to handle permissions, then test arrival and departure with the phone locked and Safari closed.
3. Exercise offline transitions, reconnect, reboot then unlock, disabled location access, boundary oscillation, and a visit longer than the lease. Expect uncertainty, not guaranteed recovery.
4. Test expired/revoked/wrong-scope credentials, private-plan/admin route denial, unknown JSON fields, payload limits, duplicate events, old/reordered events, manual override, and the expiry edge with a controlled server clock.
5. Revoke during concurrent writes and confirm no positive status survives it. Verify logs, traces, browser responses, and static source do not expose the token or GPS fields.

These phone tests have not been performed from this Windows workspace. The private trial's authenticated reads and write boundary now pass local and deployed smoke checks. Invited-friend distribution remains pending full login and phone acceptance testing.

## When to choose a different client

If testing shows Shortcuts' boundary accuracy or delivery is inadequate, use a small native iOS companion app. It can classify location locally, keep its credential in Keychain (or use an appropriately designed device-held signing key), and implement bounded retries and reconciliation. It adds app development, installation/distribution, permission, and maintenance work; iOS background scheduling and loss of connectivity still preclude a guarantee of real-time status. [Apple: Keychain services](https://developer.apple.com/documentation/security/keychain-services), [Apple: region monitoring](https://developer.apple.com/documentation/corelocation/monitoring-the-user-s-proximity-to-geographic-regions)

A web page alone cannot replace unattended iPhone geofencing. A location-service intermediary would add another party receiving data and is not the default for this privacy requirement. Start with Shortcuts only if approximate, expiring, best-effort presence is acceptable.
