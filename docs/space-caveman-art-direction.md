# Space Caveman — monochrome Qzone skin

Status: implemented for PR review, 2026-10-21. The owner authorized implementation of the recommended balanced monochrome direction after research. See [implementation and screenshots](lunar-qzone.md).

Tracker: https://github.com/QFREEE/spacecaveman/issues/15.

## Brief

Give the existing 2005–2008 Qzone-inspired personal homepage a recognizable Space Caveman skin: a caveman walking on the Moon, black and white backgrounds, and mostly simple line drawings (简笔画). Authentic Qzone composition remains the foundation. Keep the handmade personal-homepage character, compact modules, English by default, Chinese switch, and usable phone layout.

This changes the pale-blue palette and decoration into a monochrome lunar skin while retaining Qzone's visual language. The historical screenshots in docs/qzone-demo-spec.md remain the primary references for proportions, module density, controls, and layout. Production changes through the normal PR → checks → merge → deployment workflow.

The user also identified that the current page feels too much like a blog. Authenticity must include working gadgets, personal customization, and visitor rituals. A flower-watering gadget (浇花) is a required part of this redesign, not an optional later decoration. See the current-site review recorded in issue #15 and [historical gadget research](qzone-gadgets-research.md).

## Recommended composition: a Moon-themed QQ space

- A narrow centered page, approximately the current 960px desktop width.
- A shallow black sky above a white lunar horizon. A few white star dots and an occasional small planet leave the sky quiet.
- One small caveman walks along the horizon. A rounded head, shaggy hair, simple fur tunic, bare feet, and a tiny club distinguish him from an astronaut. A transparent bubble helmet can provide a playful space cue; it should not obscure the face.
- Two or three irregular craters and a short trail of footprints establish the Moon. The surface should read clearly at phone size.
- The title is modest: “Space Caveman”, with a short line such as “Small steps. Mostly wandering.” Use live, translated text rather than baking lettering into artwork.
- White content surfaces with thin gray/black frames, compact subtly graded title bars, dotted separators, small bitmap-style icons, and beveled rectangular buttons. Keep independently framed modules, uneven heights, tight spacing, and the existing multi-column desktop composition.
- Retain the compact top utility bar, personal-space masthead, horizontal navigation, announcement strip, profile sidebar, diary, albums, music box, guestbook, and decorative counter. The result should immediately read as an old QQ space with a custom skin.
- Keep hand-drawn artwork in the wallpaper, masthead, avatar, and small accents. Module frames and interface controls retain their period Qzone styling; avoid turning every module into a sketchbook page.
- Decoration stays at the masthead, margins, and module headings. Body text and forms stay clean and legible.

## Gadgets and playful behavior

The historical evidence supports decoration and music as core Qzone activities. Tencent's [2008 announcement](https://www.tencent.com/en-us/articles/80148.html) lists Dressing Up, Blog, Photo Album, Music Box, and Friends among the most-used features. The [museum methodology](https://qzone2000.com/about.html) documents pendants, floaties, cursors, and Flash players recovered from 2005–2009. Those are references for behavior and layering; use original assets. The exact early flower interface remains unverified, so our rules below are explicitly a period-inspired adaptation.

Follow-up from the user's [IT之家 article](https://it.ithome.com/archiver/635/977.htm): four flower attributes and direct care actions are described in 2022. A [2008-01-16 preserved article attributed to Tencent](https://soft.zhiding.cn/software_zone/2008/0116/710063.shtml) also describes four attributes, linked to space activity, and fruit/treasure gadgets. This supports a richer flower module than a generic water-click counter. It does not establish that the later direct-care rules or mobile artwork belonged to the earliest Qzone. See [the follow-up research](qzone-flower-followup-research.md) for evidence and access limitations.

### Required: 花藤 / 浇花

- Place a compact flower pot near the profile on desktop and before the diary on phones. It must be discoverable on arrival, with an obvious Water / 浇花 button.
- Draw a slightly odd flower growing in lunar soil, using the same monochrome 简笔画 language as the caveman. Reserve space for all poses so growth does not shift surrounding modules.
- Include four compact, labeled attributes: Rain / 雨露, Sunlight / 阳光, Love / 爱心, and Nutrition / 营养. Use tiny icons and short grayscale meters rather than a large game dashboard. Numeric fixtures never imply real traffic, replies, or spending.
- Use a deterministic local adaptation: four short actions Water / 浇水, Sun / 日照, Prune / 修剪, and Feed / 施肥 raise the corresponding attribute (rain, sunlight, care, nutrition) from 0 to 3. These one-to-one mappings and values are demo rules, not recovered historical formulas. The care controls are inspired by the later service described in IT之家; the compact framing follows the earlier desktop brief.
- Stage is the lowest of the four attributes: 0 sprout, 1 leaves, 2 bud, 3 bloom. Watering must visibly wet the soil or lift a leaf even when another attribute is limiting the overall stage. Explain “Care for all four to help it bloom” so progress is understandable. This replaces the earlier three-waterings-only proposal.
- Each action gives a distinct short response (droplets, sunbeams, snip, soil sparkle); lock repeated activation during the action. A capped attribute reports that it is full, and a bloom reports completion. Provide Reset demo, with no timer-based decay or waiting period.
- Keep state in page memory; display “Local demo · resets on refresh”. Never imply shared visitor progress, real scores, or a historical scoring formula. Language changes preserve progress.
- Provide a compact Properties / 属性 toggle with the four values and a short Care log / 照料记录 showing only actions performed in this page session. At 320px, arrange the four actions in a two-by-two group; the details panel must stay within the viewport.
- Use labeled semantic controls, keyboard activation, 44px touch targets, and a polite status announcement. Reduced motion changes the still pose and text immediately without droplets or movement.
- All four actions are available freely in the demo. Do not reproduce historical membership restrictions, daily lockouts, or purchase flows. No network writes, account, payment, reminders, or backend additions. Do not expand watering into a farming game.

### Required supporting personality

- A compact Dress up / 装扮空间 panel with a few local toggles for original lunar ornaments and wallpaper variants, plus restore default. Keep the black/white palette. This is a small demonstration, not a marketplace or full theme editor.
- At least one independent hanging ornament or sparse floating object in a reserved margin/header layer. Pair it with the walking caveman; do not add a separate busy animation to every module.
- A distinctive small music box with a disc/equalizer that animates only during actual playback. Keep no autoplay and honest playback/error states.
- One animation pause control covers ambient motion. All controls and content remain usable when motion is off.

### Optional after the core gadgets work

- A brief desktop click sparkle or tiny pointer trail, with a normal cursor retained. Disable for touch and reduced motion; never cover form controls or capture clicks.
- A compact fictional recent-visitors strip, clearly labeled sample data, or local guestbook stamps. No invented live social activity.
- A small lunar room scene if it fits the historical proportions without crowding content.
- A tiny local treasure drawer unlocked by the flower's bloom. The preserved 2008 article describes fruit and treasure tools; adapt this as one original lunar stamp or harmless ornament, rather than an inventory/shop. Historical prank names can inform a comic tone, but do not simulate surveillance of real friends or changes to another person's page.

## Drawing and palette rules

- Black and white are the principal colors. A very small amount of neutral gray may support disabled states and secondary labels. No colored accents or photographic wallpaper.
- Simple, mildly wobbly outlines with consistent apparent stroke thickness. Minimal hatching; no realistic lunar textures, glossy 3D, heavy shading, or elaborate scenery.
- The character should feel curious and a little awkward. Keep facial features minimal and the silhouette readable at roughly 48–72px tall.
- Underline links so interaction does not depend on color. Provide strong visible keyboard focus and distinguish selected states with borders or fill.
- Use readable system fonts for English and Chinese; reserve hand-drawn lettering for optional decorative artwork, never essential text.
- Create original artwork and retain generation/source provenance. Do not copy another site's mascot or illustrations.

## Motion

- Prototype a small stepped walk cycle, approximately 4–6 poses, with a slow bounded journey along the lunar strip. Aim for gentle, slightly clumsy steps rather than constant bouncing or parallax.
- Keep layout stable: the character moves within a reserved decoration region and never crosses navigation, copy, or controls.
- Provide a visible pause/resume control. Respect reduced-motion preferences with a still pose and no translation.
- Keep the character decorative and hidden from assistive technology; describe the scene once if it conveys meaningful identity.
- Use lightweight local artwork. Validate a consistent walk-cycle asset before committing to animation; a still frame is the fallback if the poses do not match.

## Existing modules

- Profile: simple caveman portrait and fictional profile details.
- Diary: retain the familiar Diary section name and short entries; lunar personality can appear in fictional entry content.
- Albums: preserve the gallery and dialog. During visual selection, decide whether original photos stay inside monochrome frames or are replaced with original lunar sketches. Do not indiscriminately filter all images or controls.
- Meetup availability: preserve actual dates, filters, and clear empty states. Lunar language is decorative, not a replacement for understandable time zones or statuses.
- Music: retain real user-initiated playback and honest player states. No autoplay.
- Guestbook: preserve validation, memory-only behavior, and explicit demo label.
- Visitor counter: keep sample-data labeling. This design plan adds no tracking.
- English remains the initial language, with the existing Chinese switch and interaction state preserved.

## Mobile composition

- Design a phone composition alongside desktop, checking 320, 390, and 430px widths.
- Use one column in meaningful reading order: compact profile, flower gadget, diary, meetup availability, albums, music, guestbook, and sample counter. Retain compact ink frames, at least 14px body text, 16px form inputs, practical 44px touch targets, and normal text zoom.
- Crop or recompose the lunar strip deliberately. Keep the caveman and at least one crater visible; do not shrink the entire desktop scene to fit.
- Keep the masthead short enough that navigation and the beginning of the profile appear promptly. Place the language and animation controls where they cannot overlap the drawing.
- No horizontal page scrolling, animation overflow, clipped Chinese labels, or mobile-only hover dependencies.

## Work sequence

1. Original planning step (superseded by the owner’s implementation request): produce three original Qzone skin options for this same brief, each showing desktop and phone: light modules over dark lunar wallpaper, white wallpaper with black lunar masthead, and balanced black/white lunar wallpaper. All three retain historical Qzone layout and controls and visibly include the flower gadget, dress-up entry, and independent ornaments. Recommend the balanced version; select one before changing UI code.
2. Finalize the chosen character, horizon, frame details, and still/animated poses. Record asset provenance and check legibility at actual displayed sizes.
3. Implement the selected skin in the existing React/Vite/TypeScript demo. Reuse the current module components and language system. Avoid adding an animation framework for this small scene.
4. Implement flower watering and its visible growth states, small dress-up controls, music-box playback animation, bounded ambient motion, pause/resume, reduced motion, and the mobile composition.
5. Run TypeScript/build, existing backend regressions, and automated browser interaction tests. Add meaningful coverage for each care action and attribute cap, all flower stages, water feedback while another attribute limits growth, repeated-click protection, full-growth state, reset/refresh, language switching with preserved progress, dress-up toggles/default restoration, paused/reduced motion, no network writes, and phone overflow. Review actual screenshots for drawing scale, contrast, and spacing.
6. Present a working local preview with desktop and phone evidence. Decide on publishing after that design review.

## Acceptance

- A visitor can identify both a caveman and the lunar setting without reading the title.
- The site is immediately recognizable as a 2005–2008 QQ space: narrow desktop shell, dense uneven modules, small title bars and icons, dotted separators, and beveled controls. The monochrome Moon/caveman skin decorates that structure.
- The site is predominantly black and white, with simple line art for decorative imagery. It does not drift into a modern portfolio or an illustrated notebook layout.
- The drawing does not overwhelm content, and animation can be paused or suppressed through reduced-motion preferences.
- A visitor can water the flower and see it respond and grow; the gadget is prominent on desktop and early in the phone reading order. It is not a decorative still image or a number-only simulation.
- The first screen communicates a personally decorated QQ space through a visible toy, ornament, and dress-up affordance. The diary does not dominate the entire identity.
- Local dress-up controls and the playback-linked music visualization work, and all gadget state survives language switching.
- All seven existing modules, language switching, keyboard interactions, and demo-only boundaries continue working.
- Desktop and phone browser checks pass with no new external dependencies or requests for artwork, fonts, or tracking.
- The chosen visual target and implementation screenshots are compared at matching viewport sizes before any publishing decision.
