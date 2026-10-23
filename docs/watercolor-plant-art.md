# Watercolor plant drawing method

This records the approved drawing method, preserved in code rather than a
flattened generated image. The homepage has twelve designs: Cosmos (the original),
Tulip, Sunflower, Poppy, Lavender, Calla lily, Rose, Daisy, Iris, Daffodil,
Hydrangea and Lily of the valley.

## Visual rules

- Draw modest, slightly irregular black contours. Keep the ink visible above paint.
- Use transparent, blunt-ended, roughly rectangular flat-brush marks. Do not mask
  paint precisely into petal or leaf silhouettes. A little overshoot is intentional.
- Leaves point outward from their stem attachment, with curved, varied contours.
- Use a distinct combination of leaf and blossom shades for each plant. Alternate
  related pigments within each bloom. Leaves range from olive and sage to emerald
  and blue-green; flowers include coral, raspberry, gold, violet and cool blue.
- Petal washes radiate outward with slightly crossing angles. A weaker second
  pass crosses the main wash; multiplication naturally deepens overlaps.
- Pigment is uneven: clear interiors, denser irregular rims and a reverse glaze
  at the outward tip. Preserve paper grain and some white gaps.
- Keep the small flower center, no smiley. The original pot uses broad terracotta
  strokes; the four UI meters always stay monochrome.

## Code and interface

`demo/src/plantDesigns.ts` is the extension seam. A `PlantDesign` declares:

- stable `id`, bilingual name key, ordered `ink` paths;
- `pot`, `leaves`, and `flowers` arrays of directional `BrushMark` records;
- an optional colored circle `center` with position and radius.

A mark gives position, angle in degrees, length, width and pigment color. An
optional `outline` contributes a sketch path; `cross: false` avoids the secondary
petal wash for tiny lavender flowers or narrow folded details. The design helper
assembles pot, stem, leaf, bloom, center and ground paths in drawing order.
The first two ink paths are the always-visible pot. At zero care the renderer
adds a seed; the first care step draws a shared sprout. Above 16% leading-bar
progress, the remaining ink paths progressively replace the sprout. All paths
finish when the leading bar reaches its maximum.
`leaf()` and `petal()` convert local contour coordinates to sketch paths.

`WatercolorFlower({ stats, plantId })` is the drawing interface. It ranks the four
care values, reveals ink and interprets the chosen design. It has no special
branches for plant IDs. Pot/leaf/bloom arrays each finish at their ranked bar's
maximum. Centers appear at the end of the bloom layer.

`watercolorAtlas.ts` paints all discovered pigment swatches using p5 2.3.4 and
p5.brush 2.2.3. A fixed seed stabilizes texture. The palette discovers colors from
the registry and assigns pot/leaf/petal/center roles, so new colors do not require
editing the painting engine. Preserve the original palette prefix to retain its
seed order. Pixel-density-aware canvas cropping keeps colors in their own tiles.

Current petal settings are fill texture 0.65, border intensity 0.95, pigment 205,
and reverse tip glaze 135. After rendering, a varying alpha mask leaves the belly
more transparent than the rims. Other roles keep pigment 115 and texture/border
0.42/0.55. These are art parameters, not care rules.

The engine loads dynamically, paints once, crops into offscreen canvas tiles,
then removes the WebGL sketch. A visible 2D canvas composites those cached marks
under SVG ink. No image data URLs, remote assets or CSP changes are needed.
Failed painting initialization has a simple translucent canvas fallback. Care
clicks never restart p5 or block waiting for a painting frame.

## Add a design

1. Add a stable ID and bilingual name in `i18n/en.ts` and `i18n/zh.ts`.
2. Add one registry entry using the design helper, or supply a full `PlantDesign`.
3. Keep ink and washes within the 200 × 153 viewBox. The shared pot sits near
   y=110–145; keep new stems connected and avoid stray branches.
4. Declare its stems, green marks and blossom marks. Mark colors are discovered
   automatically. Use an optional center only where the flower needs one.
5. Inspect seed, sprout, sketch-only, pot-only, leaves and full-color stages. Verify
   stroke direction, ink visibility, overlap and phone scale.
6. Run `pnpm verify`. Add the ID to the twelve-design browser gallery as the collection
   grows, and compare silhouettes, not just different colors of the same flower.

## Local care

`localPlant.ts` owns the versioned `spacecaveman:plant:v1` record. It validates IDs,
integer bounds and counters before using stored data. The UI writes only to browser
localStorage; it does not call the legacy flower endpoint. In completion order, empty bars take six clicks for sketch, four for pot, three for leaves and five for petals.
Partly filled bars keep their normalized progress when the click rate changes. Ranked care reveals sketch → pot → leaves → blooms, independent of button
order. Reload preserves care. New plant uses a saved shuffled order, showing every design once per round without consecutive repeats and clears care and
feedback; there is no midnight reset. If storage is blocked, the visit still works
in memory. This record is per browser/origin, not synchronized across devices.

## Local review gallery

With `pnpm demo:dev` running, open `/plant-preview.html` to compare the active palettes per plant. The default view shows roses, irises and
hydrangeas; select any species or all twelve. Controls show seed, sprout, ink,
leaves and watercolor states, with incremental care for the full progression.
This separate development entry is not included in the production homepage build.
Existing saved shuffle queues finish their current round before drawing a new
twelve-plant round, preserving the user's current plant and care.

## Natural palette varieties

`plantPalettes.ts` defines coordinated natural palettes per species, including
leaf shades and fixed accents such as iris beards and calla spadices. The renderer
caches palette-specific designs and discovers their pigments in the shared atlas.
New plants save a `paletteId` in the existing versioned local record. Missing or
invalid palette metadata keeps the original colors without losing care.
The local gallery compares rose, iris and hydrangea by default, with a selector
for any species or all 29 active variants. Stage buttons and incremental care demonstrate
the existing seed-to-ink-to-watercolor progression.

Near-duplicate review IDs 02, 08, 14, 15, 29, 30 and 36 are retired from new
plant choices and the gallery. Existing saves retain their palette and care.
Reference numbers stay fixed, with gaps for retired options. Palette 16 uses
deeper apricot pigment.

Review 35 now depicts Bluebell, using a dedicated silhouette and bilingual name.
Its historical `lily-of-the-valley:ivory` key is retained for saved-care compatibility.
The twelve shuffle slots therefore cover thirteen depicted species across 29 active
choices. Sunflowers use pointed curved petals, warm darker disks with sparse
crosshatching, and double-line stems. The review gallery keeps its original numbers.
