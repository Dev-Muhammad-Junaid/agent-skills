# Safari compatibility audit and code fixes

Safari runs MV3 web extensions and accepts the `chrome.*` namespace with callbacks. Most code ports unchanged. Audit these points and apply the fixes in the shared source, so Chrome gets them too.

## Audit checklist

Run `grep -rnoE "chrome\.[a-zA-Z]+\.[a-zA-Z]+|AudioContext|:has\(|document\.documentElement|tabs\.connect|all_frames" manifest.json src` and check each hit:

| Area | Safari behaviour | Action |
|---|---|---|
| `document_start` content scripts | Can run **before `document.documentElement` exists** | Mount through `whenRoot()` (below) |
| Host permissions | Not granted at install; the user allows per site ("Allow for One Day" / "Always Allow") or all sites | Access screen in the popup (below) |
| `tabs.query` → `tab.url` | Empty for sites without access (also in Chrome without `tabs`) | Don't infer "off-site" from a missing URL; check `permissions.contains` |
| `tabs.connect` long-lived ports | Can drop on busy SPA pages (seen on YouTube) | Use one-off `tabs.sendMessage` for anything that must arrive; keep the port only for "popup closed" cleanup |
| Frames | Don't rely on `all_frames: false` alone | `if (window.top !== window) return;` in the content script |
| `storage.sync` | Works; stays in Safari on that Mac | Privacy policy wording per browser |
| `permissions.request/contains` | Supported, callback style; prompt needs a user gesture | Call from a button click in the popup |
| `:has()`, `:is()`, `isolation`, `checkVisibility()` | Supported in current Safari | Nothing (keep `minimum` Safari at current for 4.4.2) |
| Web Audio in the popup | Works after a click | Keep sounds tied to clicks; wrap in try/catch |
| Popup size | Safari sizes the popover to the content (fits ~800×600) | Keep fixed width (440 px worked); no scrollbars |
| `manifest.minimum_chrome_version`, `author` | Ignored | Leave |
| `tabs.reload`, `window.close()` from popup | Work | Nothing |

## Fix 1 · Mount when `<html>` exists

```js
// Safari can run document_start scripts before <html> exists. Everything that touches the root
// waits for it; a MutationObserver fires before the first paint, so nothing flashes.
const root = () => document.documentElement;
function whenRoot(fn) {
  if (root()) return fn();
  const o = new MutationObserver(() => { if (root()) { o.disconnect(); fn(); } });
  o.observe(document, { childList: true });
}
whenRoot(() => { root().appendChild(style); route(); });
```
Replace every cached `const html = document.documentElement` with `root()`, and make the router return early while `!root()` (the periodic route check catches up).

## Fix 2 · Access screen

```js
const HOSTS = chrome.runtime.getManifest().host_permissions || [];
const hasAccess = () => new Promise((resolve) => {
  try { chrome.permissions.contains({ origins: HOSTS }, (ok) => resolve(chrome.runtime.lastError ? true : !!ok)); }
  catch (e) { resolve(true); }
});
// boot(): probe failed →
if (platformForHost(host)) render('reload');           // supported tab opened before install
else render(host || (await hasAccess()) ? 'offsite' : 'access');
// click #grant →
chrome.permissions.request({ origins: HOSTS }, (ok) => { if (ok) boot(); });
```
Screen copy (Canvas): "one more step. / let distract in." + "Your browser asks before an extension runs on a site. Allow it on these four." + site tiles + **Allow on these sites →**. Chrome shows it too when site access is "on click", which is correct.

## Fix 3 · Hover over one-off messages with a heartbeat

Popup:
```js
let beat = 0;
function hover(zone) {
  clearInterval(beat);
  if (!state.tabId || state.view !== state.currentView) return;
  const send = (msg) => { try { chrome.tabs.sendMessage(state.tabId, msg, () => void chrome.runtime.lastError); } catch (e) {} };
  if (!zone) return send({ type: 'leave' });
  send({ type: 'hover', zone });
  beat = setInterval(() => send({ type: 'hover', zone }), 1000);
}
```
Content script:
```js
let hovered = null, expire = 0;
function clearHover() { clearTimeout(expire); hovered = null; setPeek(null); unhighlight(); }
function onHover(msg) {
  if (msg.type === 'leave') return clearHover();
  if (msg.type !== 'hover') return;
  clearTimeout(expire);
  expire = setTimeout(clearHover, 2500);   // beats stopped: popup closed or message lost
  if (msg.zone === hovered) return;        // a beat for the same zone only refreshes the timer
  hovered = msg.zone;
  setPeek(hidden[msg.zone] && !paused ? msg.zone : null);
  highlight(msg.zone);
}
chrome.runtime.onMessage.addListener((msg, _s, reply) => { if (msg.type !== 'probe') return onHover(msg); /* probe… */ });
chrome.runtime.onConnect.addListener((port) => { port.onMessage.addListener(onHover); port.onDisconnect.addListener(clearHover); });
```

## Fix 4 · Self-correcting taggers

Any tagger that climbs from a marker to a container can tag the wrong (too big) element while the page is half-loaded. A plain `mark` never removes it, so hiding that zone later hides far more (on X, "Composer" took the whole timeline). Add to the tagger helper `T`:

```js
/** Make `el` the one container tagged `zone`. Tags elsewhere move to `el`; tags that `bad`
 *  rejects are dropped even when no `el` is found. `except` skips per-item tags (e.g. posts). */
only(el, zone, bad, except) {
  for (const old of document.querySelectorAll(`[data-dx~="${zone}"]`)) {
    if (old === el || (except && old.matches(except))) continue;
    if (el || (bad && bad(old))) T.set(old, zone, false);
  }
  if (el) T.mark(el, zone);
},
```
Use `T.only` for every container zone, with a `bad` rule for what it must never contain (the timeline, composer, stories, posts). Containers must also never contain the thing they sit next to: `climb(label, el => !el.contains(region) && el.parentElement?.contains(region))`. For multi-section rails, recompute the set each run and untag the rest. Keep per-item tags (`T.set(post, zone, on)`) as they are.

Mirror the helper in the live-check harness so live tests run the same code.
