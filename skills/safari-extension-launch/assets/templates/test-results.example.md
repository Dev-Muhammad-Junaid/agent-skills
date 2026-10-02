<!-- Example from Distract 1.2.0 (Safari build 3). Keep the structure; replace the product, sections, IDs and results. -->

# Test results: Distract 1.2.0 (Safari build 3, Chrome 1.2.0)

Run on 2026-10-02 against [TEST-PLAN.md](../../TEST-PLAN.md). macOS 27, Xcode 27, Playwright WebKit 2359 / Chromium 1228.

## Bugs found and fixed during this run

| # | Found by | Bug | Fix |
|---|---|---|---|
| 1 | A (WebKit) | WebKit can run `document_start` scripts before `<html>` exists; `content.js` crashed on `html.appendChild`, so nothing was hidden on that page load | `content.js` mounts the stylesheet through `whenRoot()` (MutationObserver, still before first paint) |
| 2 | L (live X) | The composer tag could land on the whole primary column while X was loading and was never removed, so hiding **Composer** would hide the **Timeline** | `T.only()`: one current tag per container; tags that contain the timeline are dropped |
| 4 | S (Safari, user) | On YouTube in Safari, hovering a block drew no outline on the page (X, Facebook, Instagram fine). The engine draws it (A passes), so the long-lived popup port was being lost on YouTube | Hover now uses one-off `tabs.sendMessage` (the probe's channel) with a 1 s heartbeat; the page clears the outline after 2.5 s without beats. Content script runs in the top frame only |
| 3 | L (live) | Same never-cleared pattern in Facebook feed and right rail, Instagram feed, stories, right rail and suggested box (seen as 0×0 tags on a half-loaded Instagram page) | All container taggers use `T.only()` with a rule for what each container must not contain |

## Layer A · WebKit (`node tools/webkit-test.js`): 75 passed, 0 failed

- SAFE-01 unsupported site untouched
- Popup in light and dark: every platform and view, hidden + absent states, off-site, reload, access. All fit (≤ 460 × 600), no overflow, no errors (POP-14, SAFE-02)
- Popup interactions, light and dark: click hides and saves, click again shows, Enter on a focused block, footer count, show all, tab switch, power switch, Allow on these sites (POP-03/06/07/10/11/12, ACC-02)
- Live YouTube in WebKit with the real content script:
  - stylesheet before render; route attribute on home, watch, search (PER-01, PER-05)
  - home: Sidebar, Home feed, Shorts, Topic shelves, Ads hide and come back (YT-01/03/04/05/06)
  - watch: Shorts, Ads, Up next, Comments, Live chat hide and come back; Up next hidden centres the player (8 px) (YT-04/06/08/09/10)
  - search: Sidebar, Shorts (4), Ads (4) (YT-01/04/06)
  - peek + outline on hover, cleared on leave and on popup close (POP-04/05)
  - pause / resume (POP-11); after reload the sidebar never paints (PER-01)
  - `/shorts/ID` → `/watch?v=ID` (YT-04); no Distract errors (SAFE-02)
- `BROWSER=webkit node tools/nesting-test.js`: 15 nested checks, 0 failures (POP-08)

## Layer C · Chromium

- `node tools/e2e.js`: 16 passed, 0 failed
- `node tools/nesting-test.js`: 15 nested checks, 0 failures

## Layer L · live, signed-in (Chrome), with the fixed taggers

Each section measured on the real page; the user's own Distract stylesheet was switched off while measuring and restored after.

| Site | Section | Result |
|---|---|---|
| X | Explore, Notifications, Grok (nav + drawer), Premium (nav) | nav items 259×50, drawer 400×55 |
| X | Composer | 598×120 only; hiding it leaves the timeline visible (bug 2 fixed) |
| X | Timeline | 598×10785 |
| X | Promoted posts | one post, labelled "Ad" |
| X | Live on X, Today's news, Trending, Who to follow | one sidebar card each, ~350 px wide |
| Facebook | Reels, Marketplace (nav), Shortcuts (360×716), Composer, Stories | correct boxes |
| Facebook | News feed | 680×1408, holds neither composer nor stories |
| Facebook | Sponsored 360×447, Friend requests 360×150 | separate sections |
| Facebook | Reels units in feed | 2 tagged after scrolling 40+ units |
| Facebook | Contacts | not on this account's rail today; popup shows it as "not on this page" |
| Facebook | Chat bubble | fixed container tagged; hides the New message button |
| Instagram | Reels, Notifications, Also from Meta (nav) | 48×56 each |
| Instagram | Stories 630×124, Feed 630×3159, Right rail 383×772, Suggested 319×351 | each holds only its own content |
| Instagram | Sponsored | the one ad post (470×674) |
| Instagram | Messages pill | 251×56 |
| All three | Planted wrong tags on the page wrapper / rail | all moved to the right element, none left behind (bugs 2–3 fixed) |

Not on screen during this run, so not measured live: X in-timeline Who to follow module, Facebook Suggested units, Instagram suggested posts. Their rules are unchanged from the last verified run.

## Layer S · Safari (guided)

| Group | Result |
|---|---|
| 1 · Load the build | PASS: Distract 1.2.0 ticked, allowed on facebook.com, instagram.com, twitter.com, x.com, youtube.com |
| 2 · YouTube popup, hide, sound, hover | Hover outline failed on YouTube (bug 4); PASS on build 3 (user confirmed) |
| 4 · X: Composer, Trending, Who to follow (timeline stays) | PASS (user confirmed) |
| 8 · Restart Safari, choices kept | PASS (user confirmed) |
| 9 · Access screen → Allow on these sites | PASS (user confirmed) |
| 3, 5, 6, 7, 10 | User reported "all good"; not reported step by step. Covered by layers A, C and L |

## App Store Connect

- Build 3 (1.2.0 (3)) uploaded and attached to version 1.2.0; build 1 detached. Listing, screenshots, review contact and notes verified after reload. Ready for Add for Review.
