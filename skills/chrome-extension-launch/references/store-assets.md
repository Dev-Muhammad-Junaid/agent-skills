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
3. Don't commit re-rendered images that didn't change on purpose (anti-aliasing noise). `git checkout -- store/assets/...`.

## Repos with their own renderer (Next.js style, e.g. Switchit)

Keep the repo's flow instead of adding templates:

```
npm run package       # versioned zip, manifest at zip root
npm run store-shots   # listing screenshots + promo tiles (a /store-shots route with fixture data)
npm run store-promo   # marquee only
```

- Layout: listing copy in `qa/store-listing.txt`, current art in `qa/store/`, a versioned archive in `qa/v{version}/`, and the zip at `qa/v{version}/{slug}-{version}.zip` (gitignored).
- Strip listing-only pages (such as `/store-shots`) from the upload zip.
- The same quality rules apply: 2× capture, exact-size downscale, no alpha, check every image.

## Overlays on a light canvas

An overlay or dark UI placed on a light page must set its own foreground (`text-card-foreground`, or a local `.dark` wrapper). Otherwise labels inherit the page's text colour and vanish.

## Screenshot content rules

- Five screenshots, each with one idea and a two-line lowercase headline: the main action, another site, another site plus hover, the hover/peek feature, another page type (for example the YouTube watch page).
- Fixture data only. The popup test page shows no personal info by design.
- Offer light and dark sets. The user can mix them (light 1, dark 2, …); the store allows 5 in total.
- No browser chrome (tabs or address bar) in screenshots. The browser window mock is fine in the promo video.

## Sending to the user

The user can't open the scratch workspace. Send the files (a download card for each) grouped per use: the store icon, screenshots 1–5, the small tile, the marquee. Say which dashboard slot each one goes in.
