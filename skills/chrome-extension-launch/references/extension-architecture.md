# Manifest V3 architecture

Distract is the reference implementation (private repo `Dev-Muhammad-Junaid/distract`): `manifest.json`, `src/zones.js` (site map), `src/content.js` (engine), `src/popup.*`, `src/brands.js`.

## Layout

```
<name>/
  manifest.json
  src/            runtime code only (content, popup, shared data)
  icons/          16/32/48/128 PNG (tools/icons.js)
  tools/          tests, popup-test.html, package.sh, live-check scripts
  store/          templates/, assets/light|dark/, render.js, listing.md, SUPPORT.md, youtube.md, social.md, video/
  PRIVACY.md  README.md  CHANGELOG.md  .gitignore (dist/, .DS_Store, store/video/out/*.wav)
```

The upload zip contains only `manifest.json`, `src/` and `icons/` (`package.sh`).

## Manifest

Start from `assets/extension/manifest.example.json`:
- `permissions`: the minimum (Distract: `storage` only). No `tabs`, `activeTab` or `scripting` unless a feature needs them.
- `host_permissions` equal to the `content_scripts.matches` list. This also lets the popup read `tab.url` on those sites for the "reload this tab" state.
- `content_scripts[].run_at: "document_start"` for anything that hides or restyles, so there's no flash.
- `minimum_chrome_version` matching the CSS/JS you use (`:has()` needs 105; Distract uses 110). `author.email` is the publisher.
- Only `description` (≤132 chars) goes into the listing summary.

## Content script engine (hide/restyle pattern)

1. **Shared map** (`zones.js`, loaded first in both the content script and the popup): platforms, zones (`css` selectors, `tag: true` for JS-tagged ones, `views` to scope by page type, `extra` CSS such as layout fixes), and views (`match(path)` plus the popup wireframe layout).
2. **One `<style>` element** appended to `documentElement` at `document_start`. Rule per hidden zone:
   ```css
   html:not([data-dx-peek="ZONE"]):is([data-dx-view="home"]) :is(sel1, sel2, [data-dx~="ZONE"]) { display: none !important }
   ```
   `:is()` is forgiving, so one bad selector doesn't kill the rest.
3. **Route attribute** `html[data-dx-view]`, updated on `popstate`, `navigation.navigatesuccess`, site events (YouTube `yt-navigate-finish`) and an 800 ms `location.href` check. Scope ambiguous selectors by view.
4. **Taggers** for obfuscated markup: find a stable marker (heading text, `aria-label`, link pattern) and `climb()` to the right container with a structural stop rule ("the parent also contains the footer", "the parent holds another heading"). Use `set(el, zone, bool)` so reused feed nodes get untagged. Run them in a `MutationObserver` coalesced with `requestAnimationFrame`, which runs before paint so there's no flash, and only while a tagged zone is hidden.
5. **Redirects** as a cheap bonus where it helps (hidden YouTube Shorts: `/shorts/ID` → `/watch?v=ID`).
6. **Settings:** `chrome.storage.sync` `{ hidden: {zone: true}, paused: {platform: true} }`, applied on `storage.onChanged`.

## Popup ↔ page

- `chrome.tabs.sendMessage(tabId, {type: 'probe'})` returns the platform, the current view and which zones exist right now. The popup dims absent zones.
- `chrome.tabs.connect(tabId, {name: 'popup'})`: while hovering a block, send `hover`/`leave`. The page draws a highlight overlay; hovering a hidden zone sets `data-dx-peek` so it shows briefly. `port.onDisconnect` clears everything when the popup closes.
- After a click, suppress the peek for that block until the pointer leaves ("settled"). Otherwise the section reappears under the cursor.
- Allow `popup.html?tab=<id>` so tests can open the popup as a page bound to a tab.
- No response to the probe: check `tab.url`. A supported host means "reload this tab"; anything else shows the off-site screen.

## Performance rules

- CSS first. JS only for what CSS can't see.
- No polling loops besides the 800 ms href check. No work while paused.
- Avoid geometry reads (`getBoundingClientRect`) inside taggers. A hidden element measures 0, which can make climbers overshoot.

## Icons

`assets/scripts/icons.js` writes 16/32/48/128 PNGs without dependencies (4× supersampling). The store icon is separate: 96 px artwork centred on a 128 px transparent canvas (`render-store.js` makes it).
