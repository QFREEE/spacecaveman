"""Build secret-free shortcut sources; signing/import must happen on a Mac.

Encoding references are documented in docs/iphone-easier-install.md.
Only Python's standard library is used. This does not read local credentials.
"""
from pathlib import Path
import plistlib
import uuid
import zipfile

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / 'outputs' / 'iphone-shortcuts-mac'
DEST.mkdir(parents=True, exist_ok=True)
ENDPOINT = 'https://spacecaveman-presence-trial.spacecaveman.workers.dev/api/presence'


def text(*parts):
    value = {'string': ''}
    attachments = {}
    for part in parts:
        if isinstance(part, dict):
            attachments['{%d, 1}' % len(value['string'])] = part
            value['string'] += '\ufffc'
        else:
            value['string'] += part
    if attachments:
        value['attachmentsByRange'] = attachments
    return {'WFSerializationType': 'WFTextTokenString', 'Value': value}


def fields(items):
    return {'WFSerializationType': 'WFDictionaryFieldValue', 'Value': {
        'WFDictionaryFieldValueItems': [
            {'WFItemType': 0, 'WFKey': text(key), 'WFValue': value}
            for key, value in items
        ]}}


def shortcut(name, status):
    actions = []

    def action(identifier, output_name, **parameters):
        identifier_uuid = str(uuid.uuid4()).upper()
        actions.append({'WFWorkflowActionIdentifier': 'is.workflow.actions.' + identifier,
                        'WFWorkflowActionParameters': dict(parameters, UUID=identifier_uuid)})
        return {'Type': 'ActionOutput', 'OutputUUID': identifier_uuid, 'OutputName': output_name}

    action('comment', 'Comment', WFCommentActionText=(
        'Private presence trial. Configure the Text field below with your WRITE credential only. '
        'This reports ' + status + '. No coordinates are collected. '
        'Do not share this shortcut after adding your credential.'))
    credential = action('gettext', 'Text', WFTextActionText='PASTE_WRITE_CREDENTIAL_HERE')
    date = action('date', 'Date', WFDateActionMode='Current Date')
    observed = action('format.date', 'Formatted Date', WFDate=text(date),
                      WFDateFormatStyle='ISO 8601', WFISO8601IncludeTime=True)
    first = action('number.random', 'Random Number', WFRandomNumberMinimum=100000000, WFRandomNumberMaximum=999999999)
    second = action('number.random', 'Random Number', WFRandomNumberMinimum=100000000, WFRandomNumberMaximum=999999999)
    event = action('gettext', 'Text', WFTextActionText=text(observed, '-', first, '-', second))
    action('downloadurl', 'Contents of URL', WFURL=text(ENDPOINT), WFHTTPMethod='POST', WFHTTPBodyType='JSON',
           WFHTTPHeaders=fields([('Authorization', text('Bearer ', credential)), ('Content-Type', text('application/json'))]),
           WFJSONValues=fields([('status', text(status)), ('observed_at', text(observed)), ('event_id', text(event))]))
    return {
        'WFWorkflowName': name,
        'WFWorkflowActions': actions,
        'WFWorkflowClientVersion': '2300',
        'WFWorkflowMinimumClientVersion': 900,
        'WFWorkflowIcon': {'WFWorkflowIconStartColor': 4282601983, 'WFWorkflowIconGlyphNumber': 61440},
        'WFWorkflowInputContentItemClasses': [],
        'WFWorkflowTypes': [],
        'WFWorkflowImportQuestions': [{
            'ActionIndex': 1, 'Category': 'Parameter', 'ParameterKey': 'WFTextActionText',
            'DefaultValue': '', 'Text': 'Paste your Spacecaveman WRITE credential from your private setup email (without Bearer).',
        }],
    }


names = ['Spacecaveman In NYC', 'Spacecaveman Left NYC']
for name, status in zip(names, ['in_nyc', 'not_in_nyc']):
    workflow = shortcut(name, status)
    raw = plistlib.dumps(workflow, fmt=plistlib.FMT_XML, sort_keys=False)
    # Serialization check only: an Apple-device import/run is still required.
    assert plistlib.loads(raw) == workflow
    (DEST / (name + '.unsigned.shortcut')).write_bytes(raw)

installer = '''#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
if [ "$(uname -s)" != "Darwin" ]; then
  echo "Run this on your Mac, not Windows."
  exit 1
fi
if ! command -v shortcuts >/dev/null 2>&1; then
  echo "Apple's Shortcuts command is required (macOS Monterey or later)."
  exit 1
fi
mkdir -p signed
for name in "Spacecaveman In NYC" "Spacecaveman Left NYC"; do
  /usr/bin/plutil -lint "$name.unsigned.shortcut"
  /usr/bin/plutil -convert binary1 -o "signed/$name.input.shortcut" "$name.unsigned.shortcut"
  /usr/bin/shortcuts sign --mode anyone --input "signed/$name.input.shortcut" --output "signed/$name.shortcut"
  /bin/rm "signed/$name.input.shortcut"
done
echo "Signing finished. Open each signed .shortcut file and choose Add Shortcut."
echo "Paste your WRITE credential when asked. If no question appears, edit the first Text action before running."
echo "The templates still need their first import and execution test on your Apple devices."
/usr/bin/open signed
'''
(DEST / 'Sign on Mac.command').write_bytes(installer.encode('utf-8'))

readme = '''SPACECAVEMAN: EASIER SHORTCUT SETUP

This package contains two credential-free shortcut templates and a Mac signing helper.
They were generated and their plist structure checked on Windows. They have NOT yet
been imported or run on a Mac/iPhone. Signing alone does not validate execution.
No third-party software needs to be installed.

ON YOUR MAC
1. Extract this ZIP. Open Terminal in the extracted folder.
2. Run: bash "Sign on Mac.command"
   Apple receives the secret-free templates for validation. This uses the Mac's
   built-in shortcuts sign command. It may require you to be signed in to iCloud.
3. In the opened signed folder, open "Spacecaveman In NYC.shortcut" and add it.
   Repeat for "Spacecaveman Left NYC.shortcut". Do not open the unsigned sources.
4. Paste the WRITE credential from your earlier setup email when asked.
   Paste only the credential; do not include "Bearer". If no import question appears,
   edit the first Text action (after the comment) and replace its placeholder.
   Never put the READ credential in either shortcut.
5. Enable Shortcuts iCloud Sync on your Mac and iPhone using the same Apple account.
   On iOS 17: Settings > Shortcuts > iCloud Sync. Inspect both shortcuts on iPhone.
   If sync is unavailable, AirDrop the SIGNED files and configure them on the phone.

ON YOUR IPHONE
6. Run the shortcut matching your actual current state once. Resolve permissions
   and check that its response contains accepted: true. Wait at least 10 seconds
   before another report. Verify it in the private viewer using your READ credential:
   https://spacecaveman-presence-trial.spacecaveman.workers.dev/presence
7. Create Automation > Arrive > choose your place/circle > Run Immediately >
   Run Shortcut "Spacecaveman In NYC".
8. Create Automation > Leave for the SAME place/circle > Run Immediately >
   Run Shortcut "Spacecaveman Left NYC".
9. Test both crossings with the phone locked. A circle may represent a station or
   neighborhood rather than all of NYC. These personal automations do not sync.

Reports expire after six hours; a longer visit needs a fresh manual report.
The shortcuts contain no menu, credential prompt, or confirmation at runtime.
The import question configures the Text action once, rather than asking each run.
Keep shortcuts private after adding your credential. iCloud Sync includes their
configured contents. Never share an iCloud link to a configured copy.

IF IMPORT OR RUN FAILS
Do not repeatedly report a guessed state. Keep the generated files and report the
error and which action failed, with the token hidden. The existing manual recipe
remains the fallback; these generated encodings need Apple-device validation.
'''
(DEST / 'START HERE.txt').write_bytes(readme.encode('utf-8'))
archive = ROOT / 'outputs' / 'spacecaveman-iphone-shortcuts-mac.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as zipped:
    for name in [*(n + '.unsigned.shortcut' for n in names), 'Sign on Mac.command', 'START HERE.txt']:
        zipped.write(DEST / name, arcname='spacecaveman-iphone-shortcuts/' + name)
print('Built secret-free Mac setup ZIP with 2 unsigned shortcut sources and signing instructions.')
