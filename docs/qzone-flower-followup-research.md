# Flower-vine follow-up: more than a Water button

Research date: 2026-10-21. Planning evidence for a Space Caveman **Qzone** skin. Supplements `qzone-gadgets-research.md`; no implementation or tracker changes in this investigation.

## Read the provided article in context

The user's [archived IT之家 article](https://it.ithome.com/archiver/635/977.htm) links to the [full version](https://www.ithome.com/0/635/977.htm), dated 2022-08-19. It reports an August 18 team announcement, October 18 shutdown, and July 25 removal of the flower pendant. It names four attributes (爱心、阳光、雨露、营养), four care actions (日照、浇水、修剪、施肥), daily self/friend care, and a nonmember restriction on fertilizing. Its source attribution is IT之家; it does not link to the original announcement. These are late-life reports, not evidence that every rule existed in 2005.

The root agent visually inspected all three embedded images:

1. A **mobile** flower application with level/currency and a shutdown notice overlay.
2. **Mobile pendant settings**, with couple/weather/visitor choices and no visible flower choice.
3. A **mobile flower application**, with four attribute symbols, numeric totals, a plant and four vertical meters, plus Friends/Flower shop/Items/Crafting/Activity navigation.

The images do **not** show the old desktop 2005–2008 gadget or a labeled four-action toolbar. Care actions come from the article's text. The current web text extractor only exposes lazy-image placeholders; visual inspection was necessary.

## Better early-era leads

### Four attributes and social activity are supported in the target period

A contemporary [2008-01-16 Q-Zone feature article, part 4](https://soft.zhiding.cn/software_zone/2008/0116/710063.shtml), attributed by the publisher to **腾讯官方**, describes four plant indexes. It connects sunlight to visitors, rain/dew to replies, nutrition to decoration, and love to publishing/rewards. More flourishing plants can bear fruit that unlocks items in a treasure room. This is preserved official-attributed text on a third-party publisher, not an independently recovered Tencent original. Search returned its full relevant text; direct fetch failed.

The same series reports movable/overlapping/hideable/recolorable homepage modules in [part 1](https://soft.zhiding.cn/software_zone/2008/0116/710057.shtml), and the plant, decorative portraits, music, and multimedia plugins in [part 2](https://soft.zhiding.cn/software_zone/2008/0116/710060.shtml). These publication dates establish contemporary reporting, not exact feature launch dates.

A [2008-02-13 gardening guide](https://soft.zhiding.cn/software_zone/2008/0213/735137.shtml), attributed to a forum, independently describes adoption through the dress-up area, four attributes, stages, gardener levels, and 人参果. It offers another early-era corroboration, but its exact scoring is not first-party verified. Search text was available; direct fetch failed. Its linked original adoption page was inaccessible.

The high-confidence live first-party anchor remains Tencent's [2008-03-19 announcement](https://www.tencent.com/en-us/articles/80148.html): dress-up, blogs, albums, music box, and friends were prominent activities. An interactive decorated space is therefore a stronger interpretation than an article-led blog layout.

### There really were eccentric item mechanics

The same [official-attributed 2008 part 4](https://soft.zhiding.cn/software_zone/2008/0116/710063.shtml) names 猪头香, 狗仔队, 人气鼎, 疯狂肥料, 火星传送带, 醒目灯, 透视镜, 踏雪无痕鞋, and 照妖镜. It describes prank visitor identities, viewing someone's recent visits, and temporarily accelerating popularity. This supports investigating **little toys, inventories, visible rewards, and playful oddness**. It does not authorize reproducing surveillance, affecting other people, or fabricating popularity. For our demo, a harmless original ornament unlocked by tending a plant is the relevant adaptation.

## Confidence and chronology

| Claim | Evidence in/near 2022 | Evidence for 2005–2008 | Use in our plan |
| --- | --- | --- | --- |
| A flower belongs in the space as a social/decorative object | Reported and pictured | 2006 first-person watering accounts; 2008 plant reporting | Required, prominent gadget |
| Four attributes shape growth | Reported; four-symbol UI pictured | Explicit in official-attributed January 2008 reporting | Include all four, not a generic click count |
| Ordinary space activity contributes to the plant | Described across later guides | Explicit in January 2008 reporting | Consider a bounded local connection to guestbook/dress-up |
| Water, sunlight, pruning, fertilizing are distinct care actions | Reported in article text | Exact four-button interface not verified | A clearly adapted care panel |
| Exact action-to-attribute mapping | Later [2014 guide](https://m.jb51.net/qq/241344.html) describes it | Not verified from original target-period help | Label simplified rules as our demo |
| Daily limits and member-only fertilizing | Late reporting | Original early rules inaccessible | No paywall or real-day wait; deliberate adaptation |
| Rewards/treasure-room items | Late guides describe rewards | January/February 2008 reports describe fruit/items | Optional small local ornament reward |
| 2022 mobile application represents the old desktop layout | No; it is a later mobile surface | Not established | Never use these images as the desktop visual target |

## Recommended deeper flower gadget

Replace the earlier proposal of “three water clicks make a flower” with a small **花藤-inspired care object**. The following are proposed demo rules, not recovered Qzone rules:

- Put a lunar flower beside/below the profile, with a tiny title bar, original line-art plant, stage label, and four compact meters: **Sunlight / 阳光, Love / 爱心, Rain & dew / 雨露, Nutrition / 营养**.
- Keep **Water / 浇花** the obvious primary action. Add small Sun / 日照, Trim / 修剪, and Feed / 施肥 controls; all work and are free. Each plays a distinct short response and updates its associated meter.
- Seed the plant with explicitly fictional sample stats. Use a short deterministic growth path that visitors can complete immediately. Cap completed actions honestly (“Already cared for this visit”) with a replay/reset option; no real-world daily lockout or plant death from neglect.
- Show **Properties / 属性** and **Care log / 照料记录** in a small period-styled popover/panel. Record only actions in this visitor's demo session. Do not show invented friends as if they actually watered it.
- At a milestone, let the plant unfurl a leaf or bloom. Optionally award one original tiny lunar ornament in **My items / 我的物品**, with a real place/remove action. Keep this a light reward, not a shop or farming economy.
- A later refinement could connect one valid guestbook message to rain/dew or one dress-up choice to another stat, with per-session caps and a clear explanation. This would echo the space/activity relationship without tracking page visits or manipulating actual visitor counts.
- State “Local demo · resets on refresh.” Keep state in memory; a language change preserves it. No accounts, cross-visitor state, backend, payment, ranking, analytics, notifications, or external assets.

## Mobile and verification consequences

- Reserve a visible home for the plant early in the phone reading order. Essential controls are always available through tap and keyboard; do not hide them behind hover or require drag gestures.
- At 320px, put actions in a compact two-by-two arrangement with practical touch targets, and keep the properties panel within the viewport.
- Under reduced motion, show the completed still pose and status immediately. Stop ambient animation independently; care state changes remain functional.
- Meaningful automated checks cover each care action and affected meter, duplicate activation protection, stage thresholds, completed feedback, reset, language-state preservation, reduced motion, phone overflow, and zero network writes. If item rewards are added, verify placing/removing the reward too.

## Limits

No accessible original Tencent shutdown-article URL was discovered. The published notice image is evidence of a primary artifact reproduced by a secondary publisher; the surrounding feature summary remains secondary reporting. Old `qzone.qq.com/web/help/helpa01.shtml`, `helpc03.htm`, `qqapp.qq.com/app/1105477665.html`, linked Wayback copies, and the older adoption page could not be retrieved. We should say **period-inspired reconstruction** and avoid claiming exact historical scores, action counts, toolbar art, or release dates until those originals are recovered.
