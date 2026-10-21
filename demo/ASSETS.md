# Local demo assets

All displayed names, diary entries, messages, dates, and sample arrangements are
fictional fixtures authored for this preview. They are unrelated to conversation
participants. The visitor counter is static sample data. Guestbook entries exist
only in memory and reset on refresh.

## Images

The four JPGs in `public/assets/` were generated with the built-in ImageGen tool
for this demo. Original outputs remain in the user's Codex generated-images
directory; project copies are locally optimized JPEGs. No reference screenshots,
museum decorations, third-party profile images, or externally hosted photos are
served by the demo.

Final prompt set:

- `sky.jpg`: Original website wallpaper asset, historical-scene: a pale cyan blue
  sky with soft white clouds, faint film grain, a tiny white paper airplane in the
  far upper right. Very understated low contrast optimistic early 2000s personal
  homepage background. Wide landscape composition, expansive empty pale blue
  center for HTML content overlay. No text, no logos, no watermarks, not an
  illustration or scrapbook. Save as a landscape image.
- `coast.jpg`: Original fictional personal photo album asset: casual 2007 digital
  compact camera snapshot of an empty blue seaside, quiet white surf, distant
  hazy headland, pale summer sky, slightly overexposed and softly grainy. No people,
  no text, no logos. Landscape 4:3.
- `street.jpg`: Original fictional personal photo album asset: nostalgic 2007
  compact digital camera snapshot of a quiet narrow lane with pale stucco houses,
  leafy trees and a blue bicycle parked against a wall. Natural light, slight
  washed out film grain. No people, no readable text, no logos. Landscape 4:3.
- `avatar.jpg`: Original fictional profile image: small white ceramic rabbit
  sitting on a wooden windowsill beside a blue glass vase, soft daylight and pale
  blue sky, casual slightly grainy 2007 digital camera snapshot. Square
  composition. No people, no text, no logos, no watermark.

The wallpaper uses a pale CSS overlay to match the requested skin and maintain
text contrast. Album photos remain separate assets at their intended aspect ratio.

## Icons

Eight icons are copied from the npm `pixelarticons` package, version recorded in
the project lockfile. Source: https://github.com/halfmage/pixelarticons. MIT license
is retained at `public/assets/icons/LICENSE.txt`. CSS masks apply the skin color
to the original library SVGs; the icons are not handwritten approximations.

## Audio

`public/assets/summer.wav` is an original 24-second synthesized music-box melody.
Regenerate it with `python scripts/demo-audio.py` from the repository root. It
contains no samples or commercial recordings and never autoplays.

## Reference study

The three UML-hosted historical screenshots supplied in the specification were
successfully downloaded and visually inspected during implementation after the
initial connectivity failure. They remain under `work/qzone-references/` for
study only. The additional Qzone museum example was inspected in the browser.
The implementation is an original pale-blue adaptation, not a pixel-for-pixel
copy of a particular historical skin.
