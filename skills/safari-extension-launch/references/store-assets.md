# Mac App Store screenshots and icon

## Screenshots

- Mac sizes accepted: 1280×800, 1440×900, 2560×1600, **2880×1800** (use this), up to 10, no alpha.
- Reuse the Chrome store templates (`store/templates/screenshot.html?n=1..5`, which embed the real popup). They're browser-neutral; check them for "Chrome" or "Add to Chrome" text first (`grep -i chrome store/templates/*.html`).
- Render with the Chrome skill's `render-store.js` and a Safari target:
  ```js
  const SAFARI = ['light', 'dark'].flatMap((theme) => [1, 2, 3, 4, 5].map((n) => ({
    file: `safari/${theme}/screenshot-${n}-2880x1800.png`, url: `store/templates/screenshot.html?n=${n}`,
    w: 1280, h: 800, out: [2880, 1800], theme })));
  const TARGET = process.env.TARGET === 'safari' ? SAFARI : JOBS;
  ```
  Capture at `deviceScaleFactor: 3` (3840×2400) and downscale with `sips -z 1800 2880` to the exact size, which keeps the PNG opaque. Masters go to the temp dir, never next to the assets.
- Verify: `sips -g pixelWidth -g pixelHeight -g hasAlpha` → 2880, 1800, no. Look at a light and a dark one.
- Upload all ten in order: light 1, dark 2, light 3, dark 4, light 5, dark 1, light 2, dark 3, light 4, dark 5. **Upload one file at a time** and wait for "N of 10 Screenshots" before the next. A multi-file upload lands in random order, and reordering means deleting all.
- Third-party logos in screenshots only identify the site (nominative use). Don't make them the dominant element.

## App previews

Skip unless you have real screen recordings. Guideline 2.3.4: previews may only use video screen captures of the app itself. A motion-graphics promo will be rejected as a preview. Link it from the marketing site instead.

## App icon

- `node icons.js mac out.png` (Chrome skill): the tile drawn on Apple's 1024 grid (~806 px body, 82 px offset) with a soft drop shadow, transparent around it. Alpha is fine for macOS icons.
- Fill `AppIcon.appiconset` (16–512 @1x/@2x) with `sips`, and use a 256 px copy as the container window's `Icon.png`.
- App Store Connect shows "Included Assets: App Icon" on the attached build. Check it.
