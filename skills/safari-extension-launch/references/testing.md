# Testing A to Z

App Review times are long; a rejection costs days. Test every feature before upload, and never upload a build that hasn't passed. Write the plan first, then run four layers, then record results.

## What Claude can and can't drive

| Browser | Access | Use it for |
|---|---|---|
| Safari | **Read-only** (computer-use screenshots). No clicks, typing, navigation, or scripting workarounds (AppleScript `do JavaScript`, `safaridriver`). | Watching the guided pass; reading Settings → Extensions |
| Chrome (Claude in Chrome) | Full, signed in to the user's accounts | Live selector checks on feeds that need an account |
| Playwright WebKit | Full, headless, logged out | Safari's engine with the real content script |
| Playwright Chromium | Full, headless | The packaged extension end to end |

If the user asks "why not test in Safari yourself", explain this once, plainly, and continue.

## The plan (`TEST-PLAN.md`)

Start from `assets/templates/TEST-PLAN.example.md`. Sections, each case with an ID, steps, expected result and layer:
1. Mac app and install (APP-xx)
2. Site access (ACC-xx): first run, Allow, per-site prompt, one-day access, off-site, reload screen
3. Popup (POP-xx): header, tabs, layout, hover outline, peek, click hide/show + sound, nested blocks, absent blocks, footer, power switch, keyboard, dark mode, size
4. Persistence and page behaviour (PER-xx): reload without flash, restart, new tab, two tabs live update, SPA navigation, per-site pause, long scroll
5. **Every hideable section on every site**, with its special behaviour (redirects, centring, messages)
6. Safety and privacy (SAFE-xx): unsupported sites untouched, no console errors, no network requests, show all = no extension, disable restores
7. App Review run-through (REV-xx): reviewer notes word for word on a clean profile, description claims, screenshots match, URLs load, launch/quit
8. Known limits (documented, not failures)

## Layer A · WebKit suite

`tools/webkit-test.js` (from `assets/scripts/webkit-test.example.js`):
- A `chrome.*` shim (storage backed by `localStorage` so it survives reloads, captured `onMessage`/`onConnect` listeners, `__dx.set/probe/send/port` helpers) is injected with `addInitScript`, followed by `zones.js` and `content.js`. Init scripts run at document start, often **before `<html>` exists**, which is exactly Safari's behaviour and what caught the mount crash.
- Live page sweeps: for each zone present and allowed on the current view, hide it alone → all its elements gone and the landmarks still there → show it → back. Skip zones whose `views` exclude the page.
- Peek/outline through the port **and** through one-off messages, heartbeat keep-alive, and self-clear after the beats stop.
- Pause/resume, reload with `polling: 'raf'` to prove the section never paints, special behaviours (redirects, centring), unsupported site untouched, no extension errors.
- The popup through `tools/popup-test.html` (stubbed `chrome`): every platform × view, hidden + absent, off-site, reload, access, in light and dark; fits ≤460×600 with no overflow; interactions (click, click again, Enter on a focused block, footer count, show all, tab switch, power, Allow).
- Save screenshots to `$OUT` and **look at them** (a contact sheet with ffmpeg `hstack/vstack` is quick).

Run: `PW=<playwright-core> OUT=<dir> node tools/webkit-test.js`. Also `BROWSER=webkit node tools/nesting-test.js`.

## Layer C · Chromium

`node tools/e2e.js` (packaged extension, real popup page bound to a tab with `?tab=`) and `node tools/nesting-test.js`. The e2e hover check uses the real popup, so it exercises the one-off message path too.

## Layer L · live signed-in checks (Chrome)

For sites that need an account (X, Facebook, Instagram):
1. Build a snippet with `live-check-pack.js <platform>`; escape non-ASCII to `\uXXXX` before pasting through `javascript_tool`.
2. If the user's own copy of the extension runs in that Chrome (`#distract-style` exists), set `style.disabled = true` while measuring and restore it after. Their hidden sections otherwise measure 0 px.
3. Read sizes, not just counts: each zone must match exactly its own box. A tag on something 10,000 px tall is a bug.
4. **Planted wrong tags check:** mark the page wrapper (`main` / `[role=main]` / the primary column / the rail) with every container zone, run the tagger once, and assert the tags moved to the right elements and nothing stayed on the wrapper. Also test with the anchor missing (e.g. no composer yet): a tag that contains what it must not is still dropped.
5. Scroll to load lazy units (reels, suggested, ads) and re-check. Note anything that wasn't on screen as "not measured".

## Layer S · guided Safari pass

Before starting: bump the build, rebuild, relaunch the app, `pluginkit` shows one registration, ask the user to **quit and reopen Safari**.

Send groups one at a time; the user replies "done N"; check with `app_screenshot` of Safari (read tier) before the next. Ask about sound explicitly. The groups that found real bugs or matter most to App Review are marked ★:

1. ★ Load the build: Settings → Extensions shows the version, ticked, and the allowed domains.
2. ★ Main site: open the popup, hover a block (outline on the page), click two blocks (hidden, sound).
3. Reload: hidden sections stay, no flash; a second page type (e.g. watch) with its special behaviour.
4. ★ Each other site: hide the sections most likely to over-hide (on X, Composer must leave the timeline).
5–6. Remaining sites.
7. Pause and resume on one site.
8. ★ Quit and reopen Safari: choices kept; then show all.
9. ★ Access screen: Settings → Websites → set the site to **Ask**; the popup shows the access screen; **Allow on these sites** works. This is the reviewer's first screen.
10. The Mac app shows the "on" state.

A failure in S with A passing means Safari plumbing (permissions, messaging, storage), not the engine.

## Results

`store/safari/test-results-<version>.md` (template in `assets/templates/`): the build tested, every bug found (layer that found it, cause, fix), per-layer pass counts, the live measurement table, the guided pass per group (mark user-confirmed vs "reported all good"), and what wasn't verified. Commit it with the fix commits.

## Fix loop

Fix in the shared source → re-run A and C (and L if a tagger changed) → bump `CURRENT_PROJECT_VERSION` → rebuild → the user re-tests the failed S group → record. Only then archive and upload.
