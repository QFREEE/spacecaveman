# Homepage production audit

Tracked in [issue #31](https://github.com/QFREEE/spacecaveman/issues/31).

| Surface                                  | Previous demo behavior                 | Production behavior                                                                    |
| ---------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------- |
| Homepage badge/footer                    | Fictional/demo labels                  | Personal space copy matching real features                                             |
| Visitor counter                          | Hardcoded 001286                       | Cumulative visits; IP + browser counted once per New York day; loading/error/retry states |
| Flower care                              | Per-page state lost on refresh         | Per-browser saved plant and progress; six watercolor designs; no care network requests |
| Flower reset                             | Any visitor could reset the local demo | New plant shuffles designs and clears local care; no automatic reset                     |
| Pause button                             | Manual animation toggle                | Removed at the owner's request; device reduced-motion setting is respected             |
| NYC presence                             | Static Unknown card                    | Live coarse status and approximate update age                                          |
| `/api/visits`                            | Fictional named visit plans            | Empty public list until owner/invited-friend access exists                             |
| Old profile/diary/albums/music/guestbook | Fictional prototypes                   | Kept unmounted; no new public data or messaging features added                         |

## Data and API contract

`GET /api/visitors` reads the total. Same-origin `POST /api/visitors` returns
`{ views }`, incrementing only for the first IP + User-Agent combination on each
New York calendar day. Refreshes, simultaneous loads and retries count once.
The daily identifier uses HMAC-SHA-256 with a random salt shared through D1 for
that day and includes the hostname. Raw IPs and User-Agent strings are never
stored. Cloudflare's `CF-Connecting-IP` header is used; forwarding lists are ignored.
If either identity header is missing (including plain local requests), the endpoint
reads the total without incrementing. GET never creates an identity or increments.

Migration `0005_daily_visitors.sql` adds daily salts, hashes and an insert trigger
that increments the aggregate atomically only for a new unique identifier. The
existing hourly website job deletes previous days' salts and cascading hashes,
even without new traffic. Cleanup requires the website Worker cron to be running;
Cloudflare backups/Time Travel follow their separate retention policies.
The existing aggregate is preserved as a historical page-view baseline; earlier
views cannot be deduplicated retroactively. Returning on a later day adds another
visit. This estimates daily visitors, not distinct people across all time, and
does not filter bots. People sharing IP and browser information may be combined;
network or browser changes may count someone again.

## Local plant care

The homepage does not call `/api/flower`. `localPlant.ts` reads and validates
`spacecaveman:plant:v1` from browser localStorage and saves accepted care and the
selected design. Missing, malformed or obsolete data starts a fresh Cosmos.
Blocked storage falls back to working in-memory care for the visit. No care,
plant choice or recognition state is sent to the server. Visitors in separate
browsers have independent plants; this is not a shared daily garden.

Water, Sun, Prune and Feed advance their stat in stage-dependent steps, capped at fifty.
In completion order, empty bars take six clicks for sketch, four for pot, three for leaves and five for petals. Inputs remain available without a cooldown.
Values are ranked highest to lowest to reveal sketch, pot, leaves and blooms;
any first full bar finishes the sketch, then pot, then leaves, then blooms.
The UI exposes only monochrome bars, not numeric counts or levels. Full attempts
are silent. There is no In full color label or separate bloom notice.

**New plant** (新植物) replaces Refresh plant. It shuffles Cosmos, Tulip,
Sunflower, Poppy, Lavender and Calla lily, clears care and feedback, and saves the
new selection. Reload preserves selection and progress. Nothing resets at midnight.
Care shows no encouragement, thank-you or action-status messages. Progress is
communicated through the drawing and bars.
Animation respects reduced motion. Feed uses a drawn fertilizer bag in its button
and floating effect.

`plantDesigns.ts` contains geometry, marks and colors. `WatercolorFlower.tsx`
interprets any design using the same four layers. `watercolorAtlas.ts` lazily loads
p5 and p5.brush, paints seeded swatches once per page, exports offscreen 2D tiles,
and removes its WebGL sketch. Care reveals cached tiles with multiply blending;
black SVG ink stays above them. Fallback canvas washes retain progress when
initialization fails. No data-image URLs, external CDN or CSP expansion is needed.
See [the preserved painting method and extension guide](watercolor-plant-art.md).

## Legacy flower endpoint

The existing D1 `/api/flower` GET/POST contract and migrations remain available
for older deployed clients. Its fifty-point bounds and New York daily reset are
legacy backend behavior; the current homepage does not use or synchronize them.
Moving plant care into the browser did not erase server state or require a plant
migration. Daily visitor counting separately requires migration 0005 above.

## Validation

Backend tests retain coverage for the legacy flower API and live visitor counter.
Browser checks exercise local reload persistence, separate browsers, malformed or
blocked storage, no flower requests, rapid capped care, six distinct complete
silhouettes, New plant resets, midnight continuity, bilingual labels, reduced
motion and phone layouts. The built-Worker smoke check verifies local care and
persistence alongside the real visitor/presence endpoints. Emulation does not
establish physical-device behavior.
