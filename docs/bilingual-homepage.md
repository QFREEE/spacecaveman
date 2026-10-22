# Bilingual homepage

The active homepage has two complete catalogs: `demo/src/i18n/en.ts` and
`demo/src/i18n/zh.ts`. English defines the message keys; Chinese must satisfy the
same shape. TypeScript rejects missing translations, extra keys and unknown
keys in active callers. Wording is a value, so editing Chinese no longer changes
the lookup key.

Messages use semantic names grouped by purpose, such as `presence.inNyc` and
`flower.care.water`. Keep complete sentences together. Translate labels,
accessible names, errors, descriptions and status feedback from the same catalogs.
Flower notices and history retain message keys and translate when rendered, so
switching language keeps current state and changes existing feedback too.

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
