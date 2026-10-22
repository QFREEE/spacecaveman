# Extending a Qzone skin

The accepted design is saved at Git tag **`design/lunar-qzone-v1`**, pointing to
commit `96dd705fa2f8443409c6729d2f11abc6d22b19bc` before theme extraction. The
**Lunar ink** entry remains the default. **Blue hour** is an optional palette
that demonstrates extension; switching does not change the owner's fictional
content or reset any interactive module.

The current [three-module homepage](three-module-homepage.md) does not mount
`DressUp.tsx`. It uses Stars and the pendant, with the earned flag controlled
inside the flower. The registry, palettes, extension points and saved design tag
remain. To restore the public **Space style** selector, first restore a settings
surface using `DressUp`, then set `showThemeSelector` to `true` in
`demo/src/themes/settings.ts`. The selector is currently absent from both keyboard
and screen-reader navigation. The wallpaper and pendant controls described below
belong to the retained full-homepage implementation.

## Where to change things

| Change                                                | File                                                |
| ----------------------------------------------------- | --------------------------------------------------- |
| Palette, page wallpaper, font, desktop dimensions     | `demo/src/themes/lunar.css` or a new theme CSS file |
| Available skins, label, scene and portrait            | `demo/src/themes/registry.ts`                       |
| Theme selection state                                 | `demo/src/themes/ThemeProvider.tsx`                 |
| Shared responsive space composition and gadgets       | `demo/src/styles/space.css`                         |
| Current three-module composition and NYC card          | `demo/src/styles/home.css`                          |
| Shared Qzone typography, controls and module defaults | `demo/src/styles/qzone.css`                         |
| New translated labels                                 | `demo/src/lunarCopy.ts`                             |

The shared Qzone sheet includes neutral fallback colors for small labels and
legacy controls. Palette variables control the space surfaces, frames, headings,
buttons, links, wallpaper, scene and plant. A new skin can add **scoped** rules for
more substantial changes without rewriting the shared layout. Never add global
selectors to a theme-specific file: use `[data-theme="your-id"]`.

## Add a palette

1. Copy `themes/blue-hour.css` to a new local CSS file and rename its selector,
   for example `[data-theme="garden"]`. It inherits any unspecified tokens from
   the default lunar palette. Adjust semantic `--skin-*` colors instead of
   searching through feature code. Optional `--space-*` tokens control width,
   sidebar width, gaps, header heights, font and wallpaper image/size.
2. Import the new stylesheet in `themes/registry.ts`, then add an entry to the
   `themes` array. `ThemeId` and the Dress up buttons derive from that array.

```tsx
// In themes/registry.ts, after importing the local CSS and scene:
{
  id: "garden",
  label: "花园空间",
  Scene: GardenScene,
  portrait: { src: "/assets/garden-avatar.svg", alt: "虚构花园主人的头像" },
},
```

Add English translations for the label/alt text to `lunarCopy.ts`. A palette-only
theme can reuse `LunarScene` and the existing portrait, as Blue hour does. Record
provenance for any new original or licensed assets in `demo/ASSETS.md`.

The existing Stars/Paper wallpaper buttons are independent of theme selection.
For Stars, `--space-wallpaper-image` accepts a local `url(...)` or CSS gradient;
`--space-wallpaper-size` controls its tiling. Paper keeps the existing subtle
stripe treatment using the active palette.

## Replace decorative artwork

Use a named React scene satisfying `SceneProps`: `{ ornaments: boolean;
treasure: boolean }`. It renders **decoration only** inside the reserved header
region. It can read the active CSS tokens and supply theme-scoped selectors.
Honor both prop values so the pendant and earned ornament controls remain honest.
Retain the pause convention (`.motion-off`) and a reduced-motion still state;
keep drawing clear of text, navigation and phone controls.

Theme-provided portraits feed the profile and sample guestbook avatars. Album
images are fictional **content**, so a palette switch deliberately leaves them
alone. Theme selection never changes the flower rules, guestbook storage,
availability data, audio source or language.

## State and defaults

`ThemeProvider` stores only the selected ID in memory. The application applies
`data-theme` to the existing space wrapper and selects the configured scene. It
does not key/remount the application or its modules. Flower progress, drafts,
posted local messages, filters, expanded diary entries, playback, language and
ornament choices survive switching. **Restore default skin** selects Lunar ink,
restores Stars and the pendant, and removes the flag from the scene; an earned
reward and flower progress remain. Refresh resets all demo state.

The first registry entry defines the default. Keep Lunar ink first to preserve
the accepted design. Changing an optional palette must not edit the lunar CSS or
the saved Git tag. No localStorage, account, network write or theme dependency is
required.

## Verification

Run `pnpm demo:build` and `pnpm demo:test`. The current suite has 18 desktop and
touch-phone Chromium checks for the three-module page. The previous full-homepage
tests are preserved in `demo/previous-homepage-tests/`, outside the active test
directory. Restore and adapt them when restoring those modules. Two historical
theme-switching cases are conditional on `showThemeSelector`; they retain the coverage for
theme switching while audio plays,
flower/message/draft continuity, restore, bilingual labels, reduced motion and
320/390/430px overflow. It compares profile/header screenshots before switching
and after restoring within the same run, avoiding platform-dependent committed
golden images. Physical iOS/Android devices remain untested.

The current source, phone visual and keyboard order is NYC status → Flower →
Visitors, with no CSS `order` or positive `tabindex`. The active suite checks real
Tab transitions and overflow in both languages at 320/390/430/720/1440px.

In the previous full homepage, source and phone visual order agreed: Profile, Flower, Diary, Meetups, Albums,
Music, Dress up, Guestbook, Visitors. Its
desktop used grid placement rather than CSS `order`; Guestbook and the sample
counter occupy the lower row. A regression test uses real Tab presses across
Albums → Music and Dress up → Guestbook in both languages at 320/390/430/720/1440px.

During extraction, 320px and 390px default lunar viewport screenshots were
byte-identical to captures from before refactoring. Desktop comparison found zero
changed pixels outside the Dress up column in the 1440×1000 viewport; that column
gained a Space style selector. A subsequent accessibility review moved the desktop
counter to the lower grid row so phone visual and source order remain identical;
the artwork, palette and phone composition stay the same.
