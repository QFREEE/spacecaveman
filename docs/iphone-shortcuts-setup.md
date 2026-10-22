# iPhone Shortcuts presence setup

Researched 2026-10-20 for the previously supplied iOS 17 device. The protected server trial is now deployed; see [the live trial and private credential setup](presence-trial.md). The action recipe still needs testing on the actual phone. Full invited-friend access is not implemented.

## Reusable publisher (2026-10-21)

The phone-readable [Publish NYC Status guide](../public/shortcuts.html) is served
at `/shortcuts.html` on the website and isolated trial after their separate
deployments. It contains no credentials, scripts, storage, or API requests. It
is an action recipe, not a signed/installable `.shortcut` file. The public
homepage remains Unknown; this flow currently reports to the private viewer.

Build one **Publish NYC Status** shortcut. With no input, its menu offers In NYC,
Not in NYC, or Unknown / clear report. With input, it uses that input without a
menu. Each execution captures a fresh date once, formats it with a timezone,
generates an event ID, POSTs exactly the existing three JSON fields, and returns
the `accepted` Boolean. The guide spells out the action order and variable
wiring. Do not type variable names as literal values.

Arrive and Leave automations contain **Text** (`in_nyc` or `not_in_nyc`) followed
by **Run Shortcut → Publish NYC Status**, with Input explicitly set to that Text
output. This shares the HTTP recipe while keeping unattended execution free of
menus. Run manually first to resolve permissions and verify actual acceptance.

The write API now also accepts `status: "unknown"`. It clears visibility while
retaining the observation watermark and existing duplicate/rate protections.
A delayed arrival cannot undo that clear; a genuinely later automation report
can. All manual and automated reports use observation time ordering, not a
persistent manual override. No schema migration or credential rotation is needed.

For a read-only check after phone setup, run from the checkout:

```powershell
pnpm presence:check -- 'C:\path\to\.presence-private\credentials.json'
```

The optional path selects the existing private bundle; omitted, it defaults to
this checkout's `.presence-private/credentials.json`. This command never writes
a report or prints credentials. Do not use `presence-smoke.mjs` to diagnose real
phone reports: that older script deliberately overwrites status with test data.

For the credential-free guide's packaged browser check, start `pnpm dev --port
8798`, then run `node scripts/shortcuts-guide-smoke.mjs`. It checks actual Worker
headers, 320/390/430/1440 widths, enlarged text, no credential fields or scripts,
and no API requests. An explicit HTTPS origin can check the deployed guide.
Screenshots go to ignored `outputs/iphone-shortcuts/`. This supplements
`pnpm verify`; it does not exercise iOS Shortcuts.

Apple's versioned iOS 17 API, travel-trigger, and automatic-execution guides
linked below were rechecked on 2026-10-21. This establishes documented capability,
not the exact action picker labels, variable wiring, or execution on the owner's
phone. Manual, locked-device, offline, reboot and lease tests remain outstanding
in [issue #7](https://github.com/QFREEE/spacecaveman/issues/7).

## Feasibility decision

Proceed with a small phone trial. Apple documents automatic Arrive and Leave automations on iOS 17, and Get Contents of URL supports POST with a JSON body. This is enough to send a coarse presence event directly to an HTTPS Cloudflare Worker. It does not require opening Safari on every event. [Automatic execution](https://support.apple.com/en-euro/guide/shortcuts/apd602971e63/7.0/ios/17.0), [API requests](https://support.apple.com/en-euro/guide/shortcuts/apd58d46713f/7.0/ios/17.0).

The main feasibility question is the meaning of the location trigger. Arrive/Leave watches an adjustable circle. Apple's iOS 17 guide documents choosing a place, changing that circle, and selecting Any time. It does not promise a whole-city polygon or document a maximum radius. Inspect the achievable circle on the actual phone before treating it as NYC. If it only covers a station or neighborhood, label it accordingly or use manual city status instead. [Travel triggers, iOS 17](https://support.apple.com/guide/shortcuts/travel-triggers-apd8ebfc4e8e/7.0/ios/17.0).

## Trial prerequisites

- A separate HTTPS test endpoint controlled by this project; do not use a public request inspector for real presence or credentials.
- A test-only application token limited to presence writes. Never put a Cloudflare account API token on the phone.
- The deployed write endpoint returns only `{"accepted":true}`; verify status and timestamps separately through the read-credential-protected viewer. Never echo a token or private plans, and keep raw request logging disabled.
- A phone trial first using fictional/manual state, followed by an actual boundary crossing. A successful manual HTTP request does not prove geofence delivery.

Use the deployed isolated trial endpoint:

```text
https://spacecaveman-presence-trial.spacecaveman.workers.dev/api/presence
```

## Action recipe for an arrival

Build this action sequence inside the personal automation where possible. The names below describe the intended iOS 17 actions; exact picker labels and header/date controls still need verification on the phone.

1. Add a **Date** action using Current Date. Capture it once; do not regenerate the observation time if retrying the same event.
2. Add **Format Date** using that captured date. Select **ISO 8601**, including time and time zone. A value such as `2026-10-20T19:30:00-04:00` represents an unambiguous instant. The server should parse the offset and normalize to UTC. Do not append a literal `Z` to local clock time. Apple documents ISO 8601 dates with time and zone; the exact format picker must be checked on-device. [Technical date standards, iOS 17](https://support.apple.com/guide/shortcuts/technical-standards-apdfd459e13d/7.0/ios/17.0).
3. Create a fresh event identifier. Do not assume a built-in **Generate UUID** action exists on iOS 17: this research did not verify one in Apple's documentation. A proposed first-party-only construction is two **Random Number** actions, each from 100000000 to 999999999, followed by a **Text** action combining the formatted date and both outputs with hyphens. This is an engineering proposal requiring on-device action verification; it is a deduplication identifier, not an authentication secret or a cryptographic UUID. The server must accept a bounded opaque string rather than require UUID syntax.
4. Add a **URL** action with the fixed test endpoint above. Do not add query parameters containing the token or location.
5. Add **Get Contents of URL** using that URL. Expand its options, choose **POST**, and choose **JSON** for Request Body. Apple's iOS 17 guide explicitly documents JSON bodies and variables for POST. [API requests](https://support.apple.com/en-euro/guide/shortcuts/apd58d46713f/7.0/ios/17.0).
6. In its Headers controls, add `Authorization` with value `Bearer <test-presence-token>`. Verify on-device that the header reaches the controlled endpoint. This precise header configuration has not been tested here. JSON mode should supply an appropriate Content-Type; inspect it in the controlled test and set `Content-Type: application/json` if necessary.
7. Add exactly three text fields to the JSON body:

   | Key | Value |
   | --- | --- |
   | `status` | Literal `in_nyc` |
   | `observed_at` | Formatted Date output from step 2 |
   | `event_id` | Text output from step 3 |

8. Run manually once against the test endpoint. Inspect only the constructed body and redacted test result. Confirm there is no latitude, longitude, address, Location object, or device identifier in the request. Stop on authorization or validation errors; do not assume a returned response means the update was accepted.

Using explicit JSON fields prevents accidentally forwarding a preceding location output. The automation itself performs the region detection; this recipe does not need Get Current Location.

## Attach the two triggers

In **Shortcuts → Automation → +**, create **Arrive**, choose the location, adjust its circle, and select **Any** time. Set automatic execution: choose **Run Immediately** if that is the displayed control, or disable **Ask Before Running** and confirm. Apple's versioned guide uses the latter wording and lists both Arrive and Leave as automatic-capable; it also warns that individual actions can need their own configuration. [Automatic execution, iOS 17](https://support.apple.com/en-euro/guide/shortcuts/apd602971e63/7.0/ios/17.0).

Use the action sequence above. Create a matching **Leave** automation with the same place and boundary, changing only `status` to `not_in_nyc`. Both executions generate a new observation time and ID. Do not use leaving home as evidence of arriving in NYC, or leaving one of several overlapping circles as evidence of leaving the whole city.

Personal automation shortcuts do not sync across devices; ordinary reusable shortcuts can sync when iCloud Sync is enabled. If either automation invokes a reusable shortcut containing the token, that token is within the reusable shortcut's sync/sharing footprint. Keep populated shortcuts private. Personal-automation non-sync is not a claim about backups or non-exportable storage. [Apple: sync behavior, iOS 17](https://support.apple.com/en-euro/guide/shortcuts/apdb3a4240b0/7.0/ios/17.0).

## Acceptance trial

| Trial | Required observation |
| --- | --- |
| Run arrival and departure manually | Controlled endpoint accepts exactly the three fields; token is redacted; timestamps parse correctly. |
| Cross chosen boundary with screen locked and Safari closed | Both events arrive without manual confirmation after permissions have been resolved. Record observed delay privately. |
| Normal commute using a different entry route | The selected circle matches the product's intended meaning of NYC closely enough. |
| Disable network while crossing, then reconnect | Observe actual failure/recovery; assume no automatic replay until demonstrated. |
| Reboot/unlock and repeat; disable a required permission and repeat | Failures do not leave an indefinite positive status. |
| Stay in the region longer than the lease | Status becomes Unknown unless a fresh observation renews it. |
| Re-send the identical event, then send an older event after a departure | Neither extends or replaces the newer observation. |
| Revoke the phone token | Later writes fail and its current positive status is cleared. |

There is no tested delivery or retry guarantee. Use the proposed six-hour server lease so a missed departure becomes **Unknown**. Arrival/Leave alone cannot keep a long visit positive forever; add a manual check-in or separately tested scheduled fresh location classification if that is needed. Never schedule blind resubmission of the previous `in_nyc` value.

A **Choose from Menu** manual fallback may select In NYC / Not in NYC before the same HTTP sequence. Keep that interactive menu out of the unattended automation.

## What is still unverified

This Windows research cannot establish the actual iOS 17 radius limits, action picker details, time formatter output, header delivery, permissions, lock-screen execution, latency, or offline recovery. All remain phone acceptance tests. No shortcut file was generated or signed, and no automation was installed. Trial credentials were generated locally and provisioned as digests in the isolated trial database; see the trial guide.
