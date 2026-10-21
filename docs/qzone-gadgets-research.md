# Early Qzone gadgets and the missing “come play in my space” feeling

Research date: 2026-10-21. Scope: inform the monochrome Space Caveman **Qzone skin**, not replace it with a blog, notebook, game portal, or modern portfolio. This is research and proposed behavior, not implementation.

Update after the user's IT之家 reference: [follow-up research](qzone-flower-followup-research.md) adds the pictured later app and a preserved 2008 Tencent-attributed account of four attributes and treasure gadgets. The [current art-direction plan](space-caveman-art-direction.md) now specifies a four-attribute local flower gadget. That supersedes the initial three-waterings-only behavior proposed below. The historical source still does not establish the exact early widget artwork or later direct-care rules in 2005–2008.

## What the evidence supports

1. **Dress-up was a core Qzone activity, alongside content and friends.** Tencent's own 2008-03-19 announcement lists Dressing Up, Blog, Photo Album, Music Box, and Friends as the most-used features. This is strong period primary evidence that an authentic interpretation needs the visitor's sense of entering a decorated personal space, not only a tidy list of articles. [Tencent: Active Qzone Users Top 100 Million](https://www.tencent.com/en-us/articles/80148.html)

2. **There were multiple independent decorative layers.** The Qzone Museum creator documents an archive spanning 2005–2009 containing skins, pendants, floaties, cursors, title bars, and Flash players. The archive owner explains that item metadata came from the old mall catalog API, files came from Tencent's CDN/Internet Archive, animated cursors were decoded, and floatie movement was reconstructed from 2006 Tencent code. This is primary evidence about the archive's own recovery work, not an official Tencent chronology for every item. [Museum methodology](https://qzone2000.com/about.html)

3. **浇花 was already a social visiting ritual in 2006.** A dated first-person gaming memoir says a friend invited the author into a QQ space to help water flowers. A May 2006 personal diary describes visiting friends' spaces and leaving greeting images as watering. These are contemporaneous first-person accounts, useful evidence of the language and ritual, but they do **not** prove the exact controls or calculations of a 2006 plant widget. Search returned their text; direct page fetches failed in this run. [17173, 2006-05-17](https://cg.17173.com/content/2006-05-17/1147838314.shtml), [May 2006 diary](https://www.yaohonglou.de/2006/05)

4. **Flower growth and space activity were connected.** A dated 2008-03-04 reprint, attributed to the Qzone team, reports maintenance affecting plant levels, indexes, and visit statistics. A 2007 announcement reprint describes reading little notes adding flower-index points. These are preserved official-looking texts on a third-party publisher; the original official posts were not verified. They support a qualified historical reading, not exact replica rules. [2008 maintenance notice](https://m.cnbeta.com.tw/wap/view/50491.htm), [2007 little-note announcement](https://m.cnbeta.com.tw/wap/view/25212.htm)

## Important era boundaries

- **Do not assume all remembered flower controls existed in 2005–2008.** A contemporary article dated 2009-03-02 describes a **new flower** opening on February 26 to selected high-tier users, four selectable flowers, and a movable homepage plant. Its full page returned HTTP 403; the search extract was available. This is a lead identifying a later revision, not authoritative proof of a global launch date. [2009 new-flower article](https://www.arpun.com/article/2150.html)
- The familiar water/prune/sun/fertilize panel, four exact score formulas, later flower varieties, and **珍贵花馆** must not be presented as a verified 2006 reconstruction. Old Tencent help pages and the official app page were inaccessible here. Treat our simple watering interaction as an original period-inspired adaptation.
- **Flower care is not the same product as QQ Farm.** Tencent's 2009 annual report describes social applications/games driving growth that year; its Q1 2010 release names QQ Farm and QQ Ranch. Those establish the later social-game phase, not a 2005 launch for farm mechanics. This research did not independently establish Farm's exact launch day from an accessible first-party announcement. Do not add crop theft, plots, shops, currencies, or livestock to satisfy the flower request. [Tencent 2009 annual report, company filing](https://www.hkexnews.hk/listedco/listconews/sehk/2010/0329/ltn20100329461.pdf), [Tencent Q1 2010 release](https://static.www.tencent.com/storage/uploads/2019/11/09/2d84e69d6b8399c5966b79ae7ff96d65.pdf)

## What to bring into the Space Caveman design

These are design recommendations inferred from the evidence, not claims that these exact lunar gadgets existed on Qzone.

| Priority | Gadget | Proposed interpretation |
| --- | --- | --- |
| Required | 花藤 / 浇花 | A small pot of flowers growing in lunar soil, with a real Water / 浇花 button, brief watering-can/droplet action, visible growth response, and a compact properties panel. Make this a signature thing to do on arrival. |
| High | 装扮空间 | A local dress-up drawer for a few original black/white lunar skins and ornaments. Let visitors switch decorations and restore the default; no checkout, memberships, or account simulation. |
| High | 挂件 / 漂浮物 | A small hanging Moon charm and sparse original stars/asteroids in wallpaper margins, independent of module borders. The caveman belongs to this decorative layer. |
| High | 音乐盒 | An unmistakably skinned little player with original local music and a moving disc/equalizer only while playback really runs. Keep sound off until requested. |
| Medium | Animated cursor / click ornament | Optional desktop-only tiny star trail or click sparkle, confined to noninteractive decoration areas. Touch receives a tap equivalent where appropriate; no hidden hover-only feature. |
| Medium | Human traces | A small fictional “recent visitors” strip and stamp-like guestbook reactions can suggest reciprocal visits. Clearly mark sample/local-only behavior. Never invent live visitors or send messages. |

Adding more cards alone will not create the desired effect. A small number of **working toys, independent ornaments, visible customization, and social traces** should coexist with compact uneven modules. The writing should be one part of the space rather than its sole organizing purpose.

## Minimum watering behavior for the plan

1. Show the plant and a visible Water / 浇花 button immediately, not inside a diary entry or buried menu. On phones place it early in the single-column order, near the profile.
2. Use an original monochrome line-art pot/plant consistent with the caveman. Reserve artwork space so its changing poses cannot shift the page.
3. On activation, enter a short `watering` state; prevent duplicate activation during that action. Play a small can/droplet animation, then update a visible moisture number/bar and leaf/bloom pose. Announce the result once through a polite status message.
4. Use a simple deterministic demonstration: three waterings move from sprout to leafy plant to flower; at full growth say “Happy plant — fully watered” rather than silently discarding clicks. Offer a small explicit Reset demo control. These rules are our demo, not historical scoring.
5. Keep state in page memory by default, visibly labeled “Local demo · resets on refresh”. Do not imply other visitors share progress. Cross-visitor watering would require separately scoped server storage and is outside this plan.
6. Under reduced motion, skip moving droplets and use an immediate still-pose/status change. Keyboard Enter/Space and touch must work; controls need practical 44px targets without abandoning the small beveled visual style.
7. Pause/resume controls should stop ambient caveman/star/pendant motion. The visitor-triggered flower result still completes; reduced motion preserves all game state changes.
8. Automated browser checks should cover all growth stages, repeated-click protection, full state, reset, language switching without losing progress, reduced motion, no network writes, phone overflow, and refresh reset.

## Rights and research limits

- The museum explicitly says the recovered artwork belongs to Tencent. Use it to study behavior/proportions, not as a reusable asset library. Create original local assets and record their provenance.
- Accessible primary company pages strongly support dress-up/music/friends as central period features. The museum's own methodology is accessible. Detailed old flower help at `qzone.qq.com/web/help/helpa01.shtml`, `helpc03.htm`, and the linked Tencent app page (`qqapp.qq.com/app/1105477665.html`) could not be fetched; the linked Wayback snapshot also failed.
- Search extracts for several dated historical accounts/reprints were available when their direct pages were not. Exact early widget artwork, score formulas, and animation timing remain unverified. Do not market the eventual demo as a pixel-accurate recovery of a particular Qzone version.
