# Borough presence payload

The Shortcut determines the borough locally and sends exactly two JSON fields to
`POST /api/presence`. ZIP codes, coordinates, addresses and location lookup results
stay on the phone.

```json
{
  "borough": "queens",
  "observed_at": "2026-10-24T14:30:00-04:00"
}
```

`borough` is one of `manhattan`, `brooklyn`, `queens`, `bronx`, `staten_island`,
or `outside_nyc`. Use `outside_nyc` for a confirmed observation outside NYC.
An unsuccessful location lookup should stop the Shortcut without sending a report;
it is not evidence of being outside NYC. Empty, missing or unknown enum values are
rejected. Do not send a ZIP code, `status`, or event ID with this payload.

`observed_at` is the observation time, formatted once with a timezone using ISO
8601 or RFC 2822 (for example `Sat, 24 Oct 2026 14:30:00 -0400`). It must be no more
than five minutes old or one minute ahead. Reports must be strictly newer than the
previous report, and successful writes must be at least ten seconds apart. The
timestamp identifies the observation, so no separate event ID is needed.

Use the existing endpoint and write credential in the Authorization header:
`Authorization: Bearer <write credential>`. Send JSON using Get Contents of URL,
method POST, with the two variables above. Successful writes return only
`{"accepted":true}`. Credentials belong only in the private Shortcut configuration.

The Worker derives `in_nyc` from any of the five boroughs and `not_in_nyc` from
`outside_nyc`. Both read APIs include `borough` alongside the existing `status`,
`observed_at`, and `expires_at` fields. A public borough is visible to any visitor.
Only the latest observation is stored; no borough history is kept by the app.
Expiry hides the borough after six hours (or earlier credential expiry), and
revocation or credential deletion clears it. The daily 30-day retention cleanup
also removes the stored borough. Request bodies and credentials are not logged.

Existing installed clients using `status`, `observed_at` and `event_id` remain
accepted during rollout, including the legacy `unknown` clear action. Such a
report clears the stored borough because it does not identify one. The new
two-field payload is the preferred format.

## Rollout

Apply `migrations/0006_presence_borough.sql` to the shared presence D1 database
before deploying either Worker with this code. It adds the constrained nullable
borough column and updates credential cleanup triggers, preserving existing
reports, credentials and observation ordering. Older Worker code can still use
the migrated schema. CI does not apply remote migrations.

The site and dedicated phone trial are separate deployments. The usual PR merge
deploys the main website only; the trial must also be updated before a Shortcut
using the new payload is enabled. Update both Workers before accepting borough
reports. If rolling back after that, roll back both together: old write-handler
code does not clear the borough on subsequent legacy updates. See
[deployment](deployment.md). No device
Shortcut or remote database is changed by editing this repository.
