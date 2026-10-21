# Qzone personal homepage demo

Status: implemented, verified, and published. This document retains the original local-preview scope; its restrictions on publishing were superseded by the owner's later deployment authorization recorded in Further Notes. Use the [publishing guide](qzone-publishing.md) and [deployment guide](deployment.md) for the current release process. Tracker: https://github.com/QFREEE/spacecaveman/issues/1.

## Problem Statement

Build a working personal homepage demo that feels like authentic 2005–2008 QQ空间, rather than a modern portfolio with nostalgic decorations. The code should be straightforward for coding agents to navigate and change. The existing application serves fictional upcoming visits and includes a separate presence trial; this preview must avoid coupling to real presence or personal information.

## Solution

Use React, Vite, TypeScript, and custom CSS to build a compact, pale-blue homepage with independently framed modules and local fictional fixtures. Provide a working local preview and check its appearance and behavior on desktop and phone widths. Keep the existing Worker and presence trial intact. Do not deploy or publish the website.

Historical screenshots are the primary visual references:

- https://www.uml.org.cn/itnews/images/201506090101.jpg
- https://www.uml.org.cn/itnews/images/201506090102.jpg
- https://www.uml.org.cn/itnews/images/201506090103.jpg

Additional references:

- https://qzone2000.com/
- https://qzone2000.com/site/

The three historical images initially failed to load but were successfully retrieved and visually inspected during implementation. The museum site was also accessible and its rendered example was inspected. Reference assets and personal content are not licensed for reuse merely because they are visible online; the demo uses original local images and fictional text.

## User Stories

1. As a visitor, I want a narrow, centered desktop homepage, so that its proportions feel like an early QQ space.
2. As a visitor, I want pale-blue wallpaper and restrained period decorations, so that the page feels personal and handmade.
3. As a visitor, I want compact modules with uneven heights, so that the page retains the dense historical composition.
4. As a visitor, I want small Chinese text, blue links, thin borders, dotted separators, subtle gradient title bars, tiny bitmap-style icons, and beveled buttons, so that the visual language matches the brief.
5. As a phone visitor, I want modules to reflow into a readable order, so that I can use the page without horizontal page scrolling.
6. As a visitor, I want a fictional profile with an original or appropriately licensed image, so that the demo feels inhabited without exposing anyone's personal information.
7. As a visitor, I want short fictional diary entries and updates, so that the homepage has personal content.
8. As a visitor, I want to open a photo album and inspect its images, so that the album module works beyond its cover thumbnails.
9. As a visitor, I want upcoming sample meetup availability with explicit dates and time zone, so that availability is understandable.
10. As a visitor, I want to filter confirmed and tentative availability, so that I can try the demo's scheduling interaction.
11. As a visitor, I want an obvious empty state when a filter matches nothing, so that the module remains understandable.
12. As a visitor, I want music to remain paused on arrival, so that loading the homepage never starts sound.
13. As a visitor, I want working play, pause, seek, and volume controls for a local original or licensed sample track, so that the player is a real demo.
14. As a visitor, I want to submit a guestbook message locally, so that I can try the form without sending it to a server.
15. As a visitor, I want input validation and a clear submission result, so that guestbook interactions are understandable.
16. As a visitor, I want submitted text displayed as text, so that markup typed into the guestbook cannot execute.
17. As a visitor, I want the guestbook labeled as a local demo and its reset behavior explained, so that I understand messages are not published or permanent.
18. As a visitor, I want a decorative counter explicitly labeled sample data, so that it cannot be mistaken for measured traffic.
19. As a keyboard user, I want usable navigation, visible focus, labeled controls, and accessible album dismissal, so that the demo is operable without a mouse.
20. As a reviewer, I want all displayed names, images, dates, and content to be fictional and unrelated to this conversation, so that the preview contains no personal information.
21. As a maintainer, I want named modules, typed fixtures, and clear ownership of state, so that an agent can make a focused change.
22. As a maintainer, I want the existing visits API and protected presence trial to remain operational, so that the frontend work does not break existing behavior.
23. As a reviewer, I want a documented local preview command and URL, so that I can inspect the result without deployment.
24. As a phone visitor, I want readable Chinese body text and generous touch targets inside compact retro frames, so that the historical styling stays comfortable to use.
25. As a phone visitor, I want the guestbook to remain usable with the onscreen keyboard open, so that I can enter, review, and submit a message.
26. As a phone visitor, I want albums, filters, and music controls to work by touch without hover, so that all core interactions are available on my device.

## Implementation Decisions

- Use React and TypeScript with Vite for a frontend-only demo. This adds a build step to the current plain HTML/CSS/JavaScript stack; it is a deliberate change requested during the framework discussion.
- Give the demo an isolated frontend entry and local development command. The preview may serve the homepage at its own local root; do not replace the existing site's production homepage or change domain routing as part of this task.
- Keep the existing Worker, API behavior, protected presence viewer, credentials, and deployment workflows intact. The demo reads local fixtures and makes no requests to presence or visit APIs.
- Keep generated frontend output separate from source static assets. Verify asset paths and production build locally without publishing. Document how the demo is run separately from the existing application.
- Use components named for Profile, Diary, PhotoAlbums, MeetupAvailability, MusicPlayer, and Guestbook, plus a decorative counter and a small shared ModuleFrame. Extract smaller components only when they have meaningful reuse or behavior.
- Keep fixture types and data discoverable in a dedicated module. Use stable identifiers and explicitly fictional sample dates. Availability must not disappear merely because the computer's real date advances; use a clearly labeled sample timeline.
- Keep independent interaction state inside its module. Use props for the small amount of shared information. No global state library or routing library is needed.
- Follow the project's installed Vercel React Best Practices skill where relevant to a client-rendered Vite application. Derive filtered lists during rendering, handle user actions in event handlers, define components at module scope, and avoid speculative memoization.
- Use plain CSS with shared skin variables and module-specific classes. Measure reference proportions before implementation; an approximately 900–1000 CSS-pixel desktop shell and narrow side column are starting hypotheses to refine against available references.
- Preserve small period-style typography on desktop while using readable sizes and practical control targets on phones. Choose the responsive breakpoint based on content fit, not a forced scaled-down desktop screenshot.
- Use native semantic controls and a native dialog where suitable for album viewing. Provide keyboard dismissal, a labeled close control, focus restoration, image alternatives, and visible focus styling.
- Produce original visual assets or use assets with verified reuse rights and recorded attribution. Do not copy historical users' profile images, diary text, museum decorations, or commercial music. Prefer local asset files, system Chinese font fallbacks, and a compact icon set that fits the period.
- Guestbook messages exist in memory for the current page session and reset on refresh. Label that behavior visibly. Apply length limits, reject whitespace-only submissions, and render values through React text interpolation.
- Use a local audio file and browser audio playback initiated by the visitor. Show paused, playing, ended, and load-error states honestly; do not simulate successful playback.
- Keep counters static and explicitly marked as sample data. Avoid external requests, analytics, notifications, authentication, and backend additions.

### Mobile acceptance requirements

Mobile is a first-class design and acceptance target. Establish a working phone composition alongside the first desktop shell, rather than postponing it until final QA.

- At narrow widths, reflow modules in a meaningful document order: profile, updates/diary, meetup availability, albums, music, guestbook, and decorative counter. Keep secondary profile details compact so visitors can reach the content promptly.
- Retain pale-blue frames, compact title bars, thin borders, dotted rules, and restrained wallpaper. Adapt the column structure and text sizes while preserving those period details.
- Start with at least 14px Chinese body text, comfortable line spacing, and 16px form inputs. Essential content must remain readable without pinch zoom; allow normal browser zoom and text enlargement.
- Aim for at least 44 by 44 CSS-pixel touch areas for interactive controls. Small bitmap icons may sit inside larger targets; visible button styling can remain compact and beveled. Space adjacent controls to avoid accidental taps.
- Wrap navigation and filters into rows as needed. Keep long messages, dates, images, and player controls inside their module at 320px width. Fix layout causes of overflow instead of hiding clipped content.
- Fit album dialogs to the available viewport height, with scrollable content and a reachable close button. Keep music and guestbook controls usable without hover, dragging as the only option, or device-specific volume assumptions; native media controls are acceptable where appropriate.
- Ensure the guestbook remains usable when the software keyboard reduces the viewport. Avoid fixed overlays that cover inputs, validation messages, or the submit button.
- Treat mobile overflow, unreadable essential copy, unreachable controls, and broken touch interactions as release-blocking defects. A good desktop screenshot cannot compensate for these failures.

### Implementation sequence

1. **Reference and asset preparation:** retry and inspect the historical screenshots; capture accessible references; inventory proportions, palette, typography, and needed assets; record provenance and access limitations.
2. **Frontend foundation:** add the isolated React/Vite/TypeScript entry, typed fixtures, local commands, shared skin, and ModuleFrame. Confirm the old app and presence files remain available.
3. **Complete visual shell:** implement all seven requested modules using realistic fictional content and final local assets. Establish desktop density and a usable phone composition together; check a 390px phone layout during this step before adding decorative polish.
4. **Interaction completion:** connect navigation, diary expansion where shown, album viewing, availability filters, audio controls, and local guestbook validation/submission. Remove decorative controls that imply unsupported actions.
5. **Verification and handoff:** implement and run automated browser interaction tests, type and build checks, existing regression tests, and visual browser checks; fix visible or functional problems; document the result and leave the local preview running. Do not deploy.

Each step is complete only when its visible behavior or artifact can be reviewed. A production build or HTTP response alone does not count as visual verification.

## Testing Decisions

Confirmed primary test boundary: the complete browser-rendered homepage. The user explicitly requested automated browser interaction tests in addition to visual checks, TypeScript/build checks, and existing backend regression tests.

- Test externally observable behavior instead of component internals, hook calls, or CSS implementation details.
- Inspect the full page at 1280px and 1440px desktop widths and at 320px, 390px, and 430px phone widths. Check intermediate reflow, phone landscape, readable Chinese text, uneven module heights, image loading, keyboard focus, and absence of page overflow.
- Perform every core visitor path at phone width: navigate between modules, filter availability, open and close an album, operate music controls, and submit invalid and valid guestbook messages. Recheck long text, 200% text enlargement, and short viewport heights. Capture initial and interactive mobile states as QA evidence.
- Check touch operation and software-keyboard behavior in an available mobile browser or emulator. Viewport resizing alone cannot verify these behaviors. Record actual browser/device coverage and explicitly disclose any untested real-device behavior; do not claim iOS Safari or Android Chrome testing from a desktop viewport alone.
- Compare desktop screenshots with accessible historical/reference evidence. Check typography, module proportions, spacing density, pale-blue palette, borders, decoration restraint, and actual content separately. Record reference limitations instead of declaring pixel-perfect fidelity.
- Exercise album open/close and keyboard behavior, availability filters and empty results, guestbook invalid/valid submission and refresh reset, and music play/pause/seek/volume. Verify silence before user interaction and honest load-error behavior.
- Inspect browser console and network activity. Confirm demo content comes from local assets/fixtures, guestbook submission makes no network request, and no presence or analytics requests occur.
- Run TypeScript checking and a production build; Vite compilation alone is not a substitute for type checking.
- Run existing Node tests for Worker and presence behavior as regression checks. These already test HTTP-level behavior and are prior art for using high-level boundaries. Existing visit tests depend on the real clock; if they fail because fixtures have expired, report that separately from frontend regressions.
- Add a small Playwright end-to-end suite that starts the isolated local preview and exercises the actual page. Use accessible roles and labels to locate controls, deterministic local fixtures, and fresh browser contexts between tests. Avoid arbitrary sleeps, assertions about component internals, and pixel snapshots as the sole definition of correctness.
- Run the core interaction suite in desktop Chromium and a phone-sized touch-enabled Chromium project. Cover module navigation, availability filters and an empty result, album open/close and return of focus, guestbook invalid/valid submission and refresh reset, and rendering markup-like guestbook input as literal text.
- Cover music remaining paused on initial load, playback initiated by a click, pause, seek, and any supported volume control using the real local audio asset and observable media state. Ensure automated browser settings do not silently waive the autoplay restriction being tested; browser media state does not by itself prove audible output or device-specific audio behavior.
- Add focused responsive checks for page overflow and reachable dialog/form controls at 320px, 390px, and 430px. Retain manual screenshot review for historical fidelity, readability, and visual density, and separate device checks for software keyboards and platform-specific media controls.
- Expose one documented command for the automated browser suite. On failures, retain traces or screenshots for diagnosis. Completion requires the suite to pass; report browser/device coverage and any environment blockers accurately.
- Save visual QA findings and final evidence before handoff. Completion requires working interactions, resolved material visual defects, successful relevant checks, and an accessible local preview.

## Out of Scope

Deployment, publishing, production homepage replacement, DNS changes, authentication, a backend or database for the demo, real presence integration, invitations, meetup requests, message delivery, notifications, analytics, real visitor counting, persistent guestbook storage, a theme editor, a broad component library, server rendering, and support for actual 2005-era browsers.

Avoid modern portfolio styling, oversized typography, pill buttons, glassmorphism, excessive whitespace, equal-height dashboard cards, and elaborate illustrated scrapbook layouts.

## Further Notes

- The user subsequently authorized pushing and deployment after testing. That
  authorization supersedes the initial local-only restriction below: deploy the
  Qzone homepage to the existing main Worker, preserve the visits page at
  `/visits` and the presence/API functionality, and leave the separate protected
  presence-trial Worker unchanged. See the publishing guide for commands.

- Follow-up requirement (Issue #8): English is the default on each fresh page
  load, with an accessible English/中文 switch. Both locales translate sample
  content, controls, accessible labels, metadata, and status messages. Switching
  preserves local module state and keeps all visitor-written content literal.
  Longer English labels must fit the same narrow phone layouts. No persistent
  language preference or external translation service is added.

- Target tracker: QFREEE/spacecaveman. The test boundary is confirmed; classify this implementation spec with the existing ready-for-agent triage label.
- Planning does not authorize deploying the website. The explicit deliverable remains a local preview.
