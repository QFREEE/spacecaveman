# Qzone demo visual and interaction QA

final result: passed

## English-default follow-up

- User requested English by default with an optional Chinese switch. The top
  bar now provides accessible English/中文 pressed-state buttons. Document
  language, title, description, alt text, controls, sample fixtures, and status
  messages update together. Refresh returns to English.
- State remains in the mounted modules: changing language preserves expanded
  diaries, filters, playback, draft inputs, and submitted guestbook entries.
  Visitor-written text is never translated; only marked seed messages are.
- English-specific spacing reduces title tracking and removes duplicate English
  subtitle labels. The mobile top bar keeps both 44px language controls visible.
- Refreshed desktop and 320/390/430px captures show no clipping or overlap.
  The historical palette, frames, typography hierarchy, and module structure
  remain intact. `outputs/qzone-qa/language-comparison.png` compares the prior
  Chinese desktop preview with the updated English state at the same scale.
  Full captures and the English guestbook/dialog states were opened for review.
- All **28** browser tests pass (the original 20 plus 8 locale checks), including
  English defaults, absence of untranslated Chinese content outside the language
  switch, English interactions, locale-aware errors, preserved user content,
  ongoing playback during switching, and both locales at 320/390/430/800/1440px.
- TypeScript/build, existing syntax checks, and all 9 backend tests pass.
  Physical mobile-device coverage limitations below still apply.
- Current full-page image dimensions differ from the initial Chinese captures
  listed below because translated content wraps differently. They are recorded
  in `outputs/qzone-qa/language-image-sizes.txt`; images remain at density 1.

The following sections preserve the original implementation review history;
the follow-up above describes the current English-default version.

## Evidence and scope

- Source visual truth: `work/qzone-references/01.jpg` (660 × 439), `02.jpg`
  (644 × 479), and `03.jpg` (632 × 447), all successfully retrieved and opened.
  The Qzone museum's additional example was also inspected in the in-app browser.
- Implementation: `outputs/qzone-qa/1440.png` (1440 × 1756), `1280.png`,
  `390.png` (390 × 2975), `320.png` (320 × 3129), and `430.png`.
- Browser captures use deviceScaleFactor 1: one image pixel per CSS pixel.
  Desktop viewports: 1440 × 1000 and 1280 × 1000. Phone viewports:
  320/390/430 × 844. The interaction suite also checks 720 × 390 landscape.
- Initial state: all sample fixtures, diary entries collapsed, music paused,
  guestbook reset, album dialog closed. Additional state captures:
  `phone-album.png` and `phone-guestbook.png`.
- Combined comparison: `outputs/qzone-qa/comparison.png`, opened and reviewed.
  It places all three reference skins beside a crop of the implemented modules.
  Reference images are fitted within 600 × 325 slots; the 960px implementation
  content crop is proportionally resized to 745px for composition review. This
  is a historical-inspired adaptation with different content and a requested
  pale-blue palette, not a same-state pixel-match claim.
- Focused review: full-resolution desktop image, unscaled 390 × 844 phone-top
  crop, album dialog, and submitted guestbook capture. These were opened to
  assess typography, controls, form readability, and image crops independently
  of the scaled comparison board.

## Findings and comparison history

1. Initial desktop inspection found the generated wallpaper too saturated for
   the requested pale-blue skin, reducing masthead contrast (P2). Added a pale
   overlay; captured the implementation again at desktop and phone widths.
   Final screenshots show subdued decoration, legible dark-blue masthead text,
   and clear framed modules. This finding is resolved.
2. Collapsed diary controls initially referenced an absent content element (P2,
   accessibility). Keep the target paragraph in the DOM with `hidden` toggled
   by expansion. Browser tests verify expanded content appears and then hides.
   The final screenshots preserve the intended collapsed diary density.
3. No remaining actionable P0/P1/P2 visual or interaction findings within the
   tested environments. Platform-specific physical-device behavior remains a
   disclosed coverage gap, not a claim of completed real-device testing.

## Required fidelity surfaces

- **Typography:** small Chinese system typography, restrained 29px desktop site
  title, 12px desktop body, 14px phone body, and 16px form inputs. Blue text links,
  small metadata, and compact title bars preserve the historical hierarchy.
  Chinese font appearance depends on system font availability. Enlarged text was
  exercised with a 200% text-style override; this is not a claim of browser zoom
  or an actual mobile OS text-size setting test.
- **Spacing/layout:** centered 960px desktop shell, 210px side modules, 12px gaps,
  uneven module heights, narrow frames, dotted separators, and beveled controls.
  Phone layouts reflow in document order; controls enlarge while frames remain
  compact. No page overflow at the checked widths, including long messages.
- **Colors/tokens:** pale blue wallpaper and panels, darker blue links, subtle
  title-bar gradients, thin cool-blue borders, and limited status accents.
  The original screenshots' pink/dark/book skins inform structure rather than
  supplying a palette or copied decoration.
- **Images/icons:** four original generated local images, clean image crops,
  individually framed album covers, and MIT-licensed Pixelarticons assets.
  Reference photos, characters, diary content, and museum assets are not reused.
- **Copy/content:** fictional profile, diary, albums, comments, dates, and sample
  timeline. Sample counter, arrangements, and local guestbook limitations are
  identified. Player uses an original local audio file and never autoplays.

## Verification

- TypeScript check and Vite production build pass.
- Existing syntax checks and all 9 Worker/presence regression tests pass.
- All 20 Playwright checks pass: 10 paths across desktop Chromium and a phone
  context with touch support. Explicit tap tests cover album controls and filters.
- Tests cover navigation, diary expansion, availability/date filtering, empty
  states, dialog dismissal/focus restoration, guestbook validation, literal-text
  rendering, no message writes over the network, refresh reset, and local assets.
- Real audio checks cover initial pause, user-initiated playback, pause, seeking,
  volume, end state, stop, and failure handling. Chromium is launched with
  `--autoplay-policy=user-gesture-required`. Audible speaker output is not tested.
- Browser page-error capture is empty. Requests remain local; the demo makes no
  presence, visits API, or analytics requests.
- Narrow/short viewport and enlarged-text tests pass. The short viewport is a
  software-keyboard layout approximation, not an actual device keyboard test.
- Production static build was separately loaded in Chromium; the seven modules
  and all local images loaded, with no page errors.

## Coverage limits and follow-up polish

- Actual iOS Safari, Android Chrome, OS software keyboards, native audio volume
  restrictions, and physical-device screen readers were not available for testing.
- P3: historical bitmap font rendering varies across operating systems; system
  Chinese fonts are used to keep the preview self-contained.
- No screenshot-based pixel matching is asserted because the brief requests an
  original pale-blue skin and fictional content inspired by multiple references.

## Implementation checklist

- [x] Inspect primary historical images and additional reference.
- [x] Implement seven modules and their local interactions.
- [x] Review desktop and phone captures, including interactive states.
- [x] Resolve saturation and expansion-control issues and recheck.
- [x] Pass automated interactions, type/build checks, and backend regressions.
- [x] Document asset provenance, commands, and test limits.
- [x] Keep a working local preview; do not deploy.
