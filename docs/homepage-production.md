# Homepage production audit

Tracked in [issue #31](https://github.com/QFREEE/spacecaveman/issues/31).

| Surface                                  | Previous demo behavior                 | Production behavior                                                              |
| ---------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------- |
| Homepage badge/footer                    | Fictional/demo labels                  | Personal space copy matching real features                                       |
| Visitor counter                          | Hardcoded 001286                       | D1 aggregate starting at zero; includes reloads; loading/error/retry states      |
| Flower care                              | Per-page state lost on refresh         | One D1 plant shared by all visitors; atomic care, bounds and two-second cooldown |
| Flower reset                             | Any visitor could reset the local demo | No public destructive reset; care starts a new plant 24 hours after bloom        |
| Moon flag                                | Lost on reload                         | Appears automatically on bloom and remains visible on reload           |
| Pause button                             | Manual animation toggle                | Removed at the owner's request; device reduced-motion setting is respected       |
| NYC presence                             | Static Unknown card                    | Live coarse status and approximate update age                                    |
| `/api/visits`                            | Fictional named visit plans            | Empty public list until owner/invited-friend access exists                       |
| Old profile/diary/albums/music/guestbook | Fictional prototypes                   | Kept unmounted; no new public data or messaging features added                   |

## Data and API contract

`GET /api/visitors` reads the total. Same-origin `POST /api/visitors` increments it
atomically and returns `{ views }`. Each accepted page-load report counts, so this
is not unique-person analytics or a bot-resistant metric. Reads never increment.
A retry after an uncertain network failure may report another view.

`GET /api/flower` returns `{ stats, log, generation, bloomed_at }`.
Same-origin `POST /api/flower?care=rain|sun|love|food` accepts a bodyless request.
Only these fixed actions can select a stat. Values are bounded by the schema and
conditional UPDATE. The response is authoritative; the browser does not invent
successful care. A full attribute returns 409; cooldown returns 429 with a
`Retry-After` header. Both include current state so another visitor's care appears
immediately. Unavailable storage returns 503; the UI disables care and offers a
refresh. Other tabs refresh every 30 seconds or on window focus.

The bloom is retained for at least 24 hours. The next care action then atomically
starts a new generation and clears only the previous plant's care log. The flower card shows care actions and refresh, without a details panel or flag toggle. A bloom
rewards visitors who see it, whether they supplied the final care action or not.
No visitor identity is required or recorded. The last twelve care action names are
kept; no individual timestamps, names, IPs or cookies are stored by these features.
Platform request logs follow the existing Cloudflare configuration.

## Validation

Backend tests exercise real SQLite statements for concurrent counter increments,
origin/method checks, invalid care, cooldowns, full stats, bloom timing, replanting,
and unavailable databases. Browser tests cover persistence, bilingual copy,
rewards, failures and mobile layouts. The smoke script runs the built Worker with
real D1 storage and checks a second page sees the same flower. Deployed checks are
recorded on issue #31. Phone emulation is not physical-device testing.
