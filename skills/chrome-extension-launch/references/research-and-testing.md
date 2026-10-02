# Site research, live checks and tests

## Researching in the user's signed-in Chrome

Tools: Claude in Chrome (`tabs_context_mcp`, `navigate`, `javascript_tool`, `computer`, `browser_batch`). Load them all with one ToolSearch call.

1. Create or reuse one tab in the MCP group. Close it when done.
2. For each site and page type, run small probes that return compact JSON (selector → count + rect of the first visible match). Big outputs get truncated, so keep each result under about 1 KB.
3. Map stable hooks: `data-testid` (X), custom elements (`ytd-*` on YouTube), `aria-label` and `role` (Facebook, Instagram). Note which are English-only.
4. Find the real container of a section: climb from a marker and log `tag/testid/role/aria + rect` for each ancestor. Pick the level whose parent holds the sibling sections.
5. Feed items are lazy and virtualised. Scroll to load; feeds only load while the window is visible.
6. Read-only. Never click like, follow, post or settings controls.

**Hidden-window problem:** when Chrome sits behind other apps, `document.visibilityState === "hidden"`, rendering pauses and feeds stop loading. Ask the user to bring Chrome to the front (AskUserQuestion). Computer use can't click in browsers; they're read-only there.

**Web Store pages can't be scripted:** Chrome blocks all extensions on `chrome.google.com/webstore` ("The extensions gallery cannot be scripted"). For the dashboard, use the built-in browser pane (the user signs in there, you never enter credentials) or hand over paste-ready copy.

## Live selector checks without installing

`assets/scripts/live-check-pack.js <platform>` packs one platform's zones and tagger with `live-check-harness.js` into a snippet. Paste it via `javascript_tool`:
- `__dxReport()`: per zone, per selector, the count and rect of the first match. Look for **too big** (a selector matching the whole column) as much as for 0.
- `__dxHide([...zones])`: injects the real hide CSS. Screenshot the result, and check that nothing unrelated disappeared.
- Page CSP doesn't block this (DevTools evaluation), but `eval` inside the page may be. The pack inlines everything.
- Another extension may already hide parts (0-height matches before you hide anything). If it's the user's own copy (`#distract-style` exists), set `style.disabled = true` while measuring and restore it after.
- Read **sizes**, not just counts. A tag on an element 10,000 px tall is a bug even when the count looks right.
- **Planted wrong tags:** mark the page wrapper/main column with every container zone, run the tagger once, and confirm the tags moved to the right elements and nothing stayed behind. Also test with the anchor missing. This is what catches half-loaded-page tagging bugs.
- Escape non-ASCII to `\uXXXX` before pasting a snippet through `javascript_tool`.

## Popup preview with a stubbed chrome API

`tools/popup-test.html` loads the real popup CSS/JS with a fake `chrome.*`:
- `?p=<platform>&v=<view>&hide=a,b&absent=c` sets the state, `p=none` shows the off-site screen and `p=reload` the reload-needed screen.
- `&bare=1` drops the test backdrop, and `&focus=<zone>` shows a block in its hover state (used by store art and video).
- `window.__log` records `storage.set` and port messages, so clicks and hovers can be asserted.

Serve it over HTTP (a preview server from `.claude/launch.json`, or Playwright with a tiny `http.createServer`). Check both colour schemes (`resize_window colorScheme`, or Playwright `colorScheme`).

## End-to-end test of the packaged extension

`assets/scripts/e2e.js` pattern (Playwright core + the cached "Chrome for Testing" binary, headless works with extensions):
- `launchPersistentContext(tmpdir, { headless: true, args: ['--disable-extensions-except=EXT', '--load-extension=EXT'] })`.
- Extension ID for an unpacked path: the sha256 of the absolute path, with the first 32 hex chars mapped to `a–p`.
- Open `chrome-extension://ID/src/popup.html?tab=<tabId>`, then click, hover and assert on the page tab with `getComputedStyle`.
- Cover: injection at document_start, route attribute, probe, hover highlight, click hides, storage, hidden state, peek, un-peek, pause and resume, redirects, show all.
- Use logged-out public pages (YouTube works logged out). Signed-in-only sites get the live-check treatment instead.

Find the binary: `~/Library/Caches/ms-playwright/chromium-*/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`. Install `playwright-core` into a scratch folder (`npm i playwright-core`) rather than the project.

## Interaction regression tests

`assets/scripts/nesting-test.js`: for every view, hover each block and assert that `elementFromPoint` at each nested block's centre is still that nested block. **Prove it catches the bug:** inject the old CSS (`.blk{z-index:auto!important} .z:hover{z-index:5!important}`) and expect failures before trusting the pass.

## When to re-run what

| Change | Re-run |
|---|---|
| zones or selectors | live-check on that platform, e2e |
| popup CSS/JS | popup-test visual check in light and dark, nesting-test, e2e |
| manifest or packaging | e2e (loads the unpacked folder), `package.sh` + `unzip -l` |
| store templates | `render-store.js`, then look at every image |
