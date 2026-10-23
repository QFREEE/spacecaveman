# Bilingual homepage

The active homepage has two complete catalogs: `demo/src/i18n/en.ts` and
`demo/src/i18n/zh.ts`. English defines the message keys; Chinese must satisfy the
same shape. TypeScript rejects missing translations, extra keys and unknown
keys in active callers. Wording is a value, so editing Chinese no longer changes
the lookup key.

Messages use semantic names grouped by purpose, such as `presence.inNyc` and
`flower.care.water`. Keep complete sentences together. Translate labels,
accessible names, errors, descriptions and status feedback from the same catalogs.
Flower notices retain message keys and translate when rendered, so
switching language keeps current state and changes existing feedback too.
The combined Earth clock/calendar uses `clock.label` for its screen-reader label
and `Intl.DateTimeFormat` for localized calendar and accessible date/time text.
It always uses `America/New_York` (US Eastern), with no timezone selector or label.

Both small catalogs ship together for immediate switching without a translation
request. Retired diary, profile and guestbook wording lives behind
`demo/src/legacy/Language.ts`; only retired source files import it. Its permissive
translator exists for that historical source and is excluded from the homepage
import graph. Production callers use the typed translator in `Language.tsx`.

English remains the default on every reload. The selector uses native language
names, individual language attributes and pressed state. Switching updates the
document language and description. The name `Yuntong’s space` is identical in
both languages and marked as English in visible branding. Vite fills the initial
HTML title and description from the English catalog, sharing their source with
the runtime metadata.

## Change or add wording

1. Find the semantic key in `demo/src/i18n/en.ts`. Edit its value and the same
   key in `demo/src/i18n/zh.ts`; keep the key stable when changing wording.
2. For new text, add a descriptive key to both catalogs, then render it with
   `const { t } = useLanguage()` and `t("flower.newPlant")`. Avoid inline language
   conditionals and do not import the legacy translator into active code.
3. Store message keys or domain IDs for feedback/history, not translated text.
   Translate at render time so existing content follows the language switch.
4. Run `pnpm verify`. In a browser, switch English → 中文 → English after an
   interaction and check labels, existing feedback, metadata and narrow layouts.
5. Open a PR with the documentation review record. Merge after required checks
   pass; merging triggers production deployment. Use a manual Wrangler deployment
   only when the owner explicitly requests it.

For example, the same call renders the matching wording in either language:

```tsx
const { t } = useLanguage();
return <button>{t("flower.newPlant")}</button>;
```

To change the name or description, edit `site.title` or `site.description` in
both catalogs. Vite fills the initial HTML from English, and the language provider
updates runtime metadata. Keep Yuntong's name unchanged in Chinese.

## Sources and choices

- [i18next TypeScript guidance](https://www.i18next.com/overview/typescript)
  demonstrates checking translation keys against typed resources. This site uses
  TypeScript directly because its needs are small.
- [i18next namespaces](https://www.i18next.com/principles/namespaces)
  groups messages by purpose and distinguishes small catalogs from content worth
  loading separately. Here, separating historical content gives more benefit
  than asynchronously loading a few dozen Chinese messages.
- [W3C language declarations](https://www.w3.org/International/questions/qa-html-language-declarations.en)
  calls for the document language on `html` and language attributes around text
  in another language. The selector and visible English branding follow this.

No new localization dependency is required. If separate translated URLs, plural
rules, interpolation or third-party translation tooling become necessary,
reconsider an established localization package then.

Run `pnpm demo:check` for catalog and caller checks, `pnpm demo:test` for language
switching and retained state, and `pnpm build:site` to verify generated metadata
and the production bundle.
