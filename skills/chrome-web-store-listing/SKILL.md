---
name: chrome-web-store-listing
description: Prepare Chrome Web Store listings — package zip, 1280x800 screenshots (light + dark), 1400x560 marquee, 440x280 small promo, padded store icon, policy-safe descriptions (5-brand cap, keyword spam), privacy justifications, privacy/support URLs as public gists, promo video URL, and GA4 store metrics. Use when publishing or updating a Chrome extension, writing store listing copy, generating store screenshots or promo tiles, filling the Developer Dashboard, submitting for review, or launching a new Chrome extension idea.
---

# Chrome Web Store listing

Launch playbook for Chrome Web Store items. Do not submit, publish, or roll out unless the user explicitly asks.

For the full pipeline (theme, build, testing, promo video, social posts), use the companion skill **`chrome-extension-launch`**. This skill is the store-listing part, and that one follows it.

Ask for the publisher Google account and item ID before opening the developer console. The user's publisher account is `dev.muhammadjunaid@gmail.com`. The dashboard URL carries an account index (`/u/<n>/`) that varies, so take it from the user.

Item URLs (after you have publisher + item id):

- Package: `…/edit/package`
- Listing: `…/edit/listing`
- Privacy: `…/edit/privacy`
- Distribution: `…/edit/distribution`

## Getting into the dashboard

- **Chrome blocks every extension from scripting Web Store pages**, including Claude in Chrome ("The extensions gallery cannot be scripted"). The user's signed-in Chrome can't be driven there, and computer use only gets view access to browsers.
- What works:
  1. Open the dashboard URL in the app's **built-in browser pane**, pick the account in Google's chooser, and hand over to the user for the passkey or password. Once they're in, fill the fields there.
  2. If that's not possible, give **paste-ready copy for every field** in chat, in dashboard order, and send every file.
- Never type passwords or passkeys. If login blocks you, stop and report it.
- First-time publishers must register and pay a one-time **$5** fee. The user does that.

## Hard rules

1. **Do not submit for review** until the user says so.
2. Listing **text** may name at most **five** websites/brands. Extra sites go in screenshots or a link, never in title, summary, or description.
3. Do not repeat a keyword (including the primary purpose word) more than **five** times. No keyword lists, location lists, or fake testimonials. Check with `listing-audit.js` (see Description).
4. Store images must not show live emails, real inboxes, or personal accounts. Use fixture names (`alex@example.com`).
5. Screenshots show **product UI + site backdrop only**: no browser tabs, address bar, or desktop.
6. New permissions need a one-sentence justification on Privacy. Users see a prompt.
7. Bump `version` in the extension manifest (and `package.json` if the repo has one). Upload must be newer than the live store version.
8. Do not push, force-push, or commit unless asked.
9. Only **exact store sizes** go in the asset folder the user uploads from. A 2× master next to the real files gets uploaded by mistake and rejected for dimensions.

Official policy pages: [reference.md](reference.md).

## New extension idea

Before any listing work:

1. One clear single purpose. If it needs more than one job, split or cut.
2. Minimum permissions. Every host and API gets a Privacy justification. `tabs` is rarely needed: `sendMessage`/`connect` work without it, and host permissions let the popup read `tab.url` on those sites.
3. Decide the five brands that may appear in listing text. Everything else is screenshot-only.
4. No product analytics unless disclosed on Privacy and in the description. CWS listing GA4 is separate (see below).
5. Independent-product disclaimer if the UI mentions other companies.
6. Ask which theme or design system to use. Store art follows it, in light **and** dark.

## Asset specs

| Asset | Size | Format | Notes |
|---|---|---|---|
| Store icon | 128×128 | PNG | 96 px artwork centred with 16 px transparent padding (the only asset with alpha) |
| Screenshots | 1280×800 (or 640×400) | JPEG or 24-bit PNG, **no alpha** | 1–5. Product UI + page only |
| Small promo | 440×280 | JPEG or 24-bit PNG, no alpha | Required for discovery |
| Marquee | 1400×560 | JPEG or 24-bit PNG, no alpha | Optional; brand-first, little text |
| Promo video | — | a **YouTube URL** | The dashboard doesn't take files; upload to YouTube (Public or Unlisted) first |

Promo tiles: saturated colour or clean white, fill the canvas, readable at half size, no "#1" / "Editor's Choice". Platform icons may appear **in images** even when those brands are not in the listing text.

## Generate images

If the repo has a fixture renderer:

```
npm run package       # versioned zip, manifest at zip root
npm run store-shots   # listing screenshots + promo tiles
npm run store-promo   # marquee only
```

Otherwise use the HTML templates + renderer from `chrome-extension-launch` (`assets/templates/`, `assets/scripts/render-store.js`). They embed the real popup via a stubbed-`chrome.*` test page and render every asset in light and dark.

Quality rules (each one learned from a real rejection or complaint):

- **Sharp, not grainy:** enlarge UI with CSS `zoom` (it re-lays out crisply), never `transform: scale` (it stretches pixels). Capture at `deviceScaleFactor: 2`, then downscale to the exact size with `sips -z H W` (macOS) or lanczos. A canvas `toDataURL` export adds an alpha channel; `sips` from an opaque capture doesn't.
- **2× masters go to a temp dir**, never into the upload folder.
- **Light and dark sets** (`store/assets/light/`, `store/assets/dark/`). The user may mix them (the store allows 5 screenshots in total).
- **Verify every file** before handing over: `sips -g pixelWidth -g pixelHeight -g hasAlpha` (loop per file; paths may contain spaces). Then look at each image for clipped labels, wrapped headlines, and tooltips or decoration covering the UI.
- Re-rendering can shift anti-aliasing by a pixel. Don't commit or re-send images that didn't change on purpose.
- Keep a committed listing file (for example `store/listing.md` or `qa/store-listing.txt`) and a current-asset folder.
- Overlay or dark UI on a light canvas must set its own foreground (`text-card-foreground` or a local `.dark` wrapper) so labels do not inherit page text colour.
- Strip listing-only pages (such as `/store-shots`) and tools from the upload zip. Zip only runtime files (`manifest.json`, `src/`, `icons/`) and check with `unzip -l`.
- If dashboard file pickers fail, open the asset folder in Finder and let the user drop files. When the session works in a scratch folder the user can't open, **send the files** (zip, images) with the file-sending tool, grouped by dashboard slot.

## Description

- **Summary** (short): ≤132 characters. It comes from `manifest.description`. Lead with the action and at most five brands.
- **Detailed description**: ≤16,000. Aim for 1.5–6k of real explanation, not stuffing.
- Open with what it does. Then who it's for, features, permissions, how to use, disclaimer.
- Count brand names and purpose words, and keep each ≤5. Automate it:
  ```
  node listing-audit.js copy.txt --brands "YouTube,X,Facebook,Instagram" --words "hide,feed,block,<name>" --parents "Google,Meta,X Corp"
  ```
  (`chrome-extension-launch/assets/scripts/listing-audit.js`; exits 1 on any failure.)
- No extra platforms in text. Point to screenshots instead.
- Category: pick the closest the dashboard offers (for example Productivity → Workflow & Planning).

Permission justification example (`clipboardWrite`):

```
Used only when the user clicks the link icon in the overlay to copy the current page URL. The extension does not read the clipboard.
```

`storage` example:

```
Saves which sections you hid and whether the extension is paused on each site, so your choices apply on every visit. Stored with chrome.storage and never sent anywhere.
```

## Privacy policy, homepage and support URLs

The user's pattern (Switchit, Distract): **public GitHub gists** on `Dev-Muhammad-Junaid`, because extension repos are private and would 404 for reviewers.

```
gh gist create PRIVACY.md --public -d "<Name> Privacy Policy"
gh gist create SUPPORT.md --public -d "<Name>: help and support"
curl -s -o /dev/null -w '%{http_code}' <gist-url>   # expect 200
```

- Privacy policy sections: title, **Last Updated**, 1 Data Collection and Usage, 2 Third-Party Services, 3 Data Security, 4 Changes, 5 Contact. State exactly what is stored and where.
- Support page: getting started, tips, troubleshooting, known limits, privacy link, contact email.
- Store listing → Additional fields: **Official URL** = None (needs a Search Console-verified site), **Homepage URL** and **Support URL** = the support gist, **Mature content** = No.
- Privacy tab → **Privacy policy URL** = the privacy gist.

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
- [ ] Remote code = No; data usage answered; three certifications checked
- [ ] Privacy policy URL (public gist, returns 200)
- [ ] Short description ≤132, ≤5 brands
- [ ] Long description policy-checked (listing-audit.js passes)
- [ ] 128 icon (96 px art + 16 px padding)
- [ ] 1–5 screenshots 1280×800, no alpha, fixtures, no browser chrome
- [ ] Small promo 440×280
- [ ] Marquee 1400×560 (if using)
- [ ] Homepage / Support URLs (support gist), Official URL = None
- [ ] Promo video YouTube URL (if using)
- [ ] Package zip uploaded (draft)
- [ ] Listing GA4 opted in or explicitly skipped
- [ ] User reviewed assets
- [ ] Submit for review only after the user says so
```

Order of dashboard work:

1. Package → Upload new package. Confirm draft version.
2. Privacy → single purpose, justifications, data use, remote code = no, privacy policy URL.
3. Store listing → description, category, icon, screenshots, promo tiles, video URL, additional fields.
4. Distribution → public / unlisted as the user wants.
5. Stop. Tell the user it is ready. Submit only on request.

## After upload

Tell the user, in this order:

1. Draft vs live version
2. Zip path (and send the file if they can't open the folder)
3. Screenshot / marquee / promo paths (sent as files, grouped by slot)
4. What they still need to paste, drop or do (sign-in, $5 fee, video URL)
5. That review was **not** submitted

After approval, the listing lives at `https://chromewebstore.google.com/detail/<item-id>`. Update any `LINK` placeholders in YouTube and social copy.

Policy URLs, the keyword-count method and dashboard notes: [reference.md](reference.md).
