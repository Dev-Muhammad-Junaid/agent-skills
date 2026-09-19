---
name: chrome-web-store-listing
description: Prepare Chrome Web Store listings — package zip, 1280x800 screenshots, 1400x560 marquee, 440x280 small promo, policy-safe descriptions (5-brand cap, keyword spam), privacy justifications, and GA4 store metrics. Use when publishing or updating a Chrome extension, writing store listing copy, generating store screenshots or promo tiles, submitting for review, or launching a new Chrome extension idea.
---

# Chrome Web Store listing

Launch playbook for Chrome Web Store items. Do not submit, publish, or roll out unless the user explicitly asks.

Ask for the publisher Google account and item ID before opening the developer console. Never type passwords or passkeys. If login blocks you, stop and report it. Prefer the user's already-signed-in Chrome over an unsigned-in embedded browser.

Item URLs (after you have publisher + item id):

- Package: `…/edit/package`
- Listing: `…/edit/listing`
- Privacy: `…/edit/privacy`

## Hard rules

1. **Do not submit for review** until the user says so.
2. Listing **text** may name at most **five** websites/brands. Extra sites go in screenshots or a link, never in title, summary, or description.
3. Do not repeat a keyword (including the primary purpose word) more than **five** times. No keyword lists, location lists, or fake testimonials.
4. Store images must not show live emails, real inboxes, or personal accounts. Use fixture names (`alex@example.com`).
5. Screenshots show **product UI + site backdrop only** — no browser tabs, address bar, or desktop.
6. New permissions need a one-sentence justification on Privacy. Users see a prompt.
7. Bump `version` in the extension manifest (and `package.json` if the repo has one). Upload must be newer than the live store version.
8. Do not push, force-push, or commit unless asked.

Official policy pages: [reference.md](reference.md).

## New extension idea

Before any listing work:

1. One clear single purpose. If it needs more than one job, split or cut.
2. Minimum permissions. Every host and API gets a Privacy justification.
3. Decide the five brands that may appear in listing text. Everything else is screenshot-only.
4. No product analytics unless disclosed on Privacy and in the description. CWS listing GA4 is separate (see below).
5. Independent-product disclaimer if the UI mentions other companies.

## Asset specs

| Asset | Size | Format | Notes |
|---|---|---|---|
| Store icon | 128×128 | PNG | Required |
| Screenshots | 1280×800 (or 640×400) | JPEG or 24-bit PNG, **no alpha** | 1–5. Product UI + page only |
| Small promo | 440×280 | JPEG or 24-bit PNG, no alpha | Required for discovery |
| Marquee | 1400×560 | JPEG or 24-bit PNG, no alpha | Optional; brand-first, little text |

Promo tiles: saturated color or clean white, fill the canvas, readable at half size, no “#1” / “Editor’s Choice”. Platform icons may appear **in images** even when those brands are not in the listing text.

## Generate images

If the repo has a fixture renderer:

```
npm run package       # versioned zip, manifest at zip root
npm run store-shots   # listing screenshots + promo tiles
npm run store-promo   # marquee only
```

- Keep a committed listing file (for example `qa/store-listing.txt`) and a current-asset folder (for example `qa/store/`)
- Overlay or dark UI on a light canvas must set its own foreground (`text-card-foreground` or a local `.dark` wrapper) so labels do not inherit page text color
- Marquee: capture at **2×**, export 24-bit PNG (preferred) and JPEG
- Strip listing-only pages (such as `/store-shots`) from the upload zip
- If dashboard file pickers fail, open the asset folder in Finder and let the user drop files

## Description

- **Summary** (short): ≤132 characters. Lead with the action and at most five brands.
- **Detailed description**: ≤16,000. Aim 3–6k of real explanation, not stuffing.
- Open with what it does. Then who it’s for, features, permissions, how to use, disclaimer.
- Count brand names and purpose words. Each ≤5.
- No extra platforms in text. Point to screenshots instead.

Permission justification example (`clipboardWrite`):

```
Used only when the user clicks the link icon in the overlay to copy the current page URL. The extension does not read the clipboard.
```

## Google Analytics

Two different things:

1. **Store listing GA4** (dashboard → Store listing → Additional metrics → Opt in to Google Analytics). Chrome provisions the property. Publisher members see **non-user-level** store metrics. Docs: https://developer.chrome.com/docs/webstore/metrics
2. **In-extension GA** (gtag in the extension). Only if the product actually collects analytics — disclose it on Privacy and in the listing.

For a new item: opt in to listing GA4 unless the user says to stay opted out. Never add in-extension GA without asking.

## Submission process

```
- [ ] Version bumped above live
- [ ] Single purpose + minimum permissions
- [ ] Privacy justifications filled (every permission + host)
- [ ] Short description ≤132, ≤5 brands
- [ ] Long description policy-checked (brands + keyword counts)
- [ ] 128 icon
- [ ] 1–5 screenshots 1280×800, fixtures, no browser chrome
- [ ] Small promo 440×280
- [ ] Marquee 1400×560 (if using)
- [ ] Package zip uploaded (draft)
- [ ] Listing GA4 opted in or explicitly skipped
- [ ] User reviewed assets
- [ ] Submit for review only after the user says so
```

Order of dashboard work:

1. Package → Upload new package. Confirm draft version.
2. Privacy → justifications, data use, remote code = no.
3. Store listing → description, category, screenshots, promo tiles.
4. Distribution → public / unlisted as the user wants.
5. Stop. Tell the user it is ready. Submit only on request.

## After upload

Tell the user, in this order:

1. Draft vs live version
2. Zip path
3. Screenshot / marquee / promo paths
4. What they still need to paste or drop
5. That review was **not** submitted

Policy URLs and the keyword-count method: [reference.md](reference.md).
