#!/bin/bash
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
