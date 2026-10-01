# Store assets: screenshots, tiles, icon, thumbnail

## Sizes (exact)

| Asset | Size | Notes |
|---|---|---|
| Store icon | 128×128 PNG | 96 px artwork centred with 16 px transparent padding (the only asset with alpha) |
| Screenshots | 1280×800 | 1–5, JPEG or 24-bit PNG, **no alpha** |
| Small promo tile | 440×280 | no alpha, brand-first, readable at half size |
| Marquee | 1400×560 | no alpha, optional but worth doing |
| YouTube thumbnail | 1280×720 | ≤2 MB, huge 2–3 word headline |

## The template system (assets/templates)

- `store.css`: the design tokens (light, plus dark under `prefers-color-scheme: dark`) and shared classes: `.mark` (icon + wordmark), `.headline` with `.accent` line, `.lead`, `.panel.blue|amber|pink`, `.popup`, decorative `.pill`s.
- `screenshot.html?n=1..5`: headline pair on the left, the real popup on a tinted panel on the right. Edit the `SHOTS` table (headline pair, lead, tone, popup query). Each shot should show a different site or state (hover, hidden, other page type).
- `promo-small.html`: icon + wordmark + one line.
- `marquee.html`: a big headline pair + lead + popup.
- `thumbnail.html`: "shorts. / reels. / gone."-style headline, platform glyph row, the popup tilted -3° bleeding off the edge, and a cursor with a click burst on the key block.

The popup is always the **real UI**, loaded in an iframe from `tools/popup-test.html?bare=1&…`. Enlarge it with CSS `zoom` on the iframe document (`d.documentElement.style.zoom = 1.46`) and size the iframe to `440*Z × scrollHeight*Z`. **Never use `transform: scale`**: it stretches pixels and looks grainy.

Wordmark detail: put the text and the dot inside one `<span>` next to the `<img>`. Otherwise the flex `gap` separates the period from the word.

## Rendering (assets/scripts/render-store.js)

- Serves the repo on a random localhost port (iframes need a real origin), renders each job in `light` and `dark` (`colorScheme`), at `deviceScaleFactor: 2`.
- Writes the 2× capture to the OS temp dir and downscales with `sips -z H W` straight into `store/assets/<theme>/`. The result is opaque with a clean high-quality resample.
- Also writes `store/assets/store-icon-128.png` (transparent padding) and the YouTube thumbnail (light only).
- Each template sets `document.documentElement.dataset.ready = '1'` when the iframe has loaded and sized. The renderer waits for it.

After rendering:
1. Check sizes and alpha: `sips -g pixelWidth -g pixelHeight -g hasAlpha` on every file. Loop over files; the paths have spaces.
2. **Look at every image** (Read the PNGs). Check for clipped labels ("End ca…"), headline wrapping, tooltips covering labels, decoration overlapping the popup.
3. Don't commit re-rendered images that didn't change on purpose (anti-aliasing noise). `git checkout -- store/assets/...`. `ONLY=screenshot-5 node store/render.js` re-renders one piece.
4. For a quick look at many images, tile them with ffmpeg (`-i light/screenshot-%d.png -vf scale=640:400,tile=5x1`); ImageMagick `montage` fails without a configured font.

## React / Next.js UIs (e.g. Switchit): the frame pattern

A bare `/store-shots` page that screenshots the UI on a plain background looks flat next to Distract. Use the same templates and video, with the real component in a frame:

| Skill file (`assets/react-frame/`) | Project path |
|---|---|
| `frame-page.tsx` | `app/store-shots/frame/page.tsx`: renders one component, exposes `window.__pose(props)` (synchronous via `flushSync`) and `window.__imagesReady()` |
| `serve.js` | `store/serve.js`: one origin for `/store/*`, `/public/*` and `next dev` (proxied, **including the HMR WebSocket upgrade**; without it the Next client can reload mid-render). Exports `start()` and `chromePath()` |
| `overlay.js` | `store/templates/overlay.js`: `Overlay.mount(iframe, props, zoom)` → `{ pose, setZoom, center(sel), row(i) }` |
| `page.js` | `store/templates/page.js`: a quiet mock of the site behind the UI (header with glyph, skeleton body, optional signed-in avatar) |
| `scenes.example.js` | `store/fixtures/scenes.js`: fixture accounts → `Scene(id, { theme, highlightedIndex, query, activeId, … })` |

Rules learned on Switchit:
- **Theme per frame.** The app's ThemeProvider follows the system theme; the frame re-applies the posed theme with a MutationObserver on `<html class>`. That's what lets one video show a light and a dark overlay side by side.
- **Zoom maths.** Inside a document with `style.zoom = Z`, `getBoundingClientRect()` already returns zoomed pixels. Size the iframe from the measured height as-is; multiplying by Z again doubles it.
- **Strip it from the upload.** Remove the `store-shots` export **and** the JS chunks only it referenced (scan its HTML for `static/chunks/*.js`, delete those no shipped file mentions). Check with `grep -rl __pose out`.
- **Bundle what the render needs:** download stock avatars into `store/fixtures/avatars/`, the display font as woff2 into `store/fonts/`, and use `BrandUrl()` data URLs for favicons. Renders then work offline and never change underneath you.
- **Matching the product palette:** when the user picks "match the product" over Canvas, convert the app's OKLCH tokens to hex for `store.css` (light + dark), keep Canvas's layout rules (lowercase two-line headlines, tinted panels, pills), and give the tints the product's meanings (Switchit: cyan = switch, emerald = active/access, rose = no access).
- Wire `npm run store-shots`, `promo-video`, `promo-social` in `package.json`, add `playwright-core` as a devDependency, and write a short `store/README.md`.

### Screenshot ideas that worked
- A **site mock behind the real UI** with a light scrim, the UI floating centred like the product shows it.
- A **pointer** resting on the highlighted row (`o.center(o.row(i), 0.56, 0.6)`).
- **Light/dark split**: the same UI twice, the dark copy clipped on a diagonal. Give each half its own token block (so it reads the same in the light and dark sets), and compute the iframe's clip from one panel-level line so the page cut and the UI cut are collinear.
- **Key caps** (`.key`) next to the lead when the feature is a shortcut.

## Overlays on a light canvas

An overlay or dark UI placed on a light page must set its own foreground (`text-card-foreground`, or a local `.dark` wrapper). Otherwise labels inherit the page's text colour and vanish.

## Screenshot content rules

- Five screenshots, each with one idea and a two-line lowercase headline: the main action, another site, another site plus hover, the hover/peek feature, another page type (for example the YouTube watch page).
- Fixture data only. The popup test page shows no personal info by design.
- Offer light and dark sets. The user can mix them (light 1, dark 2, …); the store allows 5 in total.
- No browser chrome (tabs or address bar) in screenshots. The browser window mock is fine in the promo video.

## Sending to the user

The user can't open the scratch workspace. Send the files (a download card for each) grouped per use: the store icon, screenshots 1–5, the small tile, the marquee. Say which dashboard slot each one goes in.
