# Easier iPhone installation

Researched 2026-10-21 for iOS 17. A credential-free Mac setup ZIP has now been generated in `outputs/spacecaveman-iphone-shortcuts-mac.zip`. Its XML plist structure and ZIP integrity were checked on Windows. It has not been signed, imported, or executed on an Apple device; no iCloud link or phone automation was created.

## Prepared package

The package contains two fixed-state templates: **Spacecaveman In NYC** and **Spacecaveman Left NYC**, plus `Sign on Mac.command` and `START HERE.txt`. On the Mac, extract the ZIP and run `bash "Sign on Mac.command"` from that folder. The helper uses only Apple's built-in `plutil`, `shortcuts sign` and Finder opening; no third-party software is installed. It sends credential-free source to Apple for signing, then opens the output folder. Import the two signed files, answer the write-credential question, enable Shortcuts iCloud Sync, and create the two local iPhone triggers. If the question does not appear, replace the placeholder in the first Text action after the comment before running.

The generator is `scripts/build-iphone-shortcuts.py` and uses Python's standard library. Each template captures Current Date, formats ISO 8601 with time, creates a deduplication ID from the date and two random numbers, and sends the existing three-field JSON contract with an Authorization header. No runtime prompts or location-reading action is included.

Action encoding was checked against upstream implementation/reference sources: [ScPL Text](https://docs.scpl.dev/actions/text), [ScPL Random Number](https://docs.scpl.dev/actions/randomnumber), [ScPL Format Date](https://docs.scpl.dev/actions/formatdate), [Shortcuts Playground parameter encoding](https://github.com/viticci/shortcuts-playground-plugin/blob/main/claude/skills/shortcuts-playground/PARAMETER_TYPES.md), and [an exported import-question example](https://github.com/extratone/i/blob/main/shortcuts/Generate%20Shortcuts%20Run%20Links%20List.json). These are source-format evidence, not an execution test on iOS 17. The helper passes `bash -n` through Git Bash; its first Mac execution, Apple signing, import, and phone report remain unverified.

## Recommended approach

The owner has confirmed access to a Mac. Generate a credential-free template here, sign it with Apple's command on that Mac, import and inspect it, then distribute it through an iCloud link if desired. A signed-file import can also be used directly on the iPhone. This avoids manually constructing most HTTP actions on the phone. [Apple: command-line signing](https://support.apple.com/guide/shortcuts-mac/run-shortcuts-from-the-command-line-apd455c82f02/mac).

The proposed reusable **Spacecaveman Presence** shortcut would let the owner open the link/file, review it, tap Add/Get Shortcut, supply configuration once, and create two small personal automations that run it. This is an installation flow with a few user steps, not fully automatic installation. Apple documents iCloud link sharing and adding the received shortcut. [Apple: share shortcuts, iOS 17](https://support.apple.com/en-euro/guide/shortcuts/apdf01f8c054/7.0/ios/17.0).

Proposed final phone flow:

1. Open a reviewed, credential-free iCloud template and add it.
2. Configure the fixed HTTPS endpoint and a narrowly scoped presence token locally. Use a Text action for each value and import questions attached to those text fields, if those parameters are available in the iOS 17 editor. This exact template must be tested before distribution.
3. Run it manually once to resolve permissions and verify an accepted request.
4. Create **Arrive → Text `in_nyc` → Run Shortcut Spacecaveman Presence** and **Leave → Text `not_in_nyc` → Run Shortcut Spacecaveman Presence**, passing the Text output as shortcut input. Configure the same circle and automatic execution for both.

The reusable shortcut would validate its input, generate the timestamp/event ID, and send the JSON request described in [the full setup recipe](iphone-shortcuts-setup.md). It must not prompt for input during an automated execution. Manual menu selection belongs in a separate wrapper or an explicit manual-only branch.

Apple supports import questions for available action parameters, and clears the associated field when sharing. Nevertheless, publish a template with empty placeholders and inspect the shared export rather than assuming all possible copies of a secret disappear. Configure the real token only after installation and never re-share the populated shortcut. [Apple: import questions, iOS 17](https://support.apple.com/guide/shortcuts/add-import-questions-to-shared-shortcuts-apdf330fd3a0/7.0/ios/17.0).

## What the link cannot install

Apple documents personal automations as device-specific, backed up to iCloud but not synced to other devices. The supported sharing workflow above adds an ordinary shortcut to the collection. Our recommendation therefore requires creating the Arrive/Leave triggers on the phone; this research found no Apple-supported iCloud-link mechanism to install those geofences for the owner. [Apple: personal automation, iOS 17](https://support.apple.com/guide/shortcuts/intro-to-personal-automation-apd690170742/7.0/ios/17.0).

## Creating the template from this Windows workspace

| Route | Assessment |
| --- | --- |
| Build once on an iPhone/iPad, then Copy iCloud Link | Supported Apple route. Requires one initial authoring session on an Apple device. Subsequent installation is much easier. |
| Generate a credential-free `.shortcut`, then sign on a Mac | Practical proposed route if a Mac is available. Apple documents `shortcuts sign` on macOS. Import and test the generated actions before sharing; successful signing is not execution validation. |
| Generate a raw plist on Windows and rename it `.shortcut` | Produces source material, not a verified importable installation. Do not promise that renaming bypasses signing. |
| Use a website that signs uploaded shortcuts | Adds another service receiving the file; unnecessary for this project. No signer service was selected or used. |

Apple's Mac command is:

```sh
shortcuts sign --mode anyone --input "Spacecaveman.template.shortcut" --output "Spacecaveman.signed.shortcut"
```

Apple receives a copy for validation when signing, so the input should contain no real token. The command is an Apple-documented signing route; support for our eventual generated action encoding and its iOS 17 behavior remains to be tested. [Apple: command-line signing](https://support.apple.com/guide/shortcuts-mac/run-shortcuts-from-the-command-line-apd455c82f02/mac).

## Third-party source inspection

- **Wuvomi/shortcut-cli:** its upstream Python source checks for macOS before signing and invokes Apple's `shortcuts sign` subprocess. Unsigned compilation is cross-platform; installing this tool on Windows does not solve signing. It could assist source generation, but is optional. [Upstream source](https://github.com/Wuvomi/shortcut-cli/blob/main/shortcut_cli.py).
- **0xilis/shortcut-sign:** its upstream README targets Linux/macOS and requires a signing private key plus auth data. Its documented acquisition path involves dumping Apple ID material from a jailbroken iPhone or modified Mac. It is a reverse-engineering tool, not the simpler supported installation path recommended here. [Upstream project](https://github.com/0xilis/shortcut-sign).

These projects were read only. Neither was installed or run, and no signing credentials were accessed. There is currently no ready-made project iCloud link to offer; the template must first be built and tested on an Apple device or signed through a Mac.
