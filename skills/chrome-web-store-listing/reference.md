# Chrome Web Store reference

## Official docs

- Listing requirements: https://developer.chrome.com/docs/webstore/program-policies/listing-requirements
- Spam FAQ (5 brands, keyword caps): https://developer.chrome.com/docs/webstore/program-policies/spam-faq
- Program policies: https://developer.chrome.com/docs/webstore/program-policies
- User data FAQ: https://developer.chrome.com/docs/webstore/program-policies/user-data-faq
- Remote hosted code (MV3): https://developer.chrome.com/docs/extensions/develop/migrate/remote-hosted-code
- Best listing: https://developer.chrome.com/docs/webstore/best-listing
- Images / promo tiles: https://developer.chrome.com/docs/webstore/images
- Listing tab fields: https://developer.chrome.com/docs/webstore/cws-dashboard-listing
- Store metrics + listing GA4: https://developer.chrome.com/docs/webstore/metrics
- In-extension GA4 (only if product collects analytics): https://developer.chrome.com/docs/extensions/how-to/integrate/google-analytics-4

## Keyword and brand audit

After drafting listing copy, count case-insensitive mentions. Fail if any brand or purpose word exceeds 5, or if a 6th website/brand is named.

Automated: `node listing-audit.js copy.txt --brands "A,B,C" --words "verb,noun,<name>" --parents "Parent Co"` (from `chrome-extension-launch/assets/scripts/`). It matches whole words, reports every count, and exits 1 on failure. Put the title, summary and description in `copy.txt`.

Typical purpose words to count: the product's name and main verb (for example switch/switcher, hide/distract), account, overlay, feed, productivity.

Family products of one brand (for example Gmail, Drive, Docs under Google) stay grouped under that one brand. They do not use up extra slots.

Screenshot-only brands must never appear in title, summary, or description. A disclaimer may name the parent company of a listed brand (for example Meta for Facebook, Google for YouTube, X Corp. for X).

## Suggested repo layout

Either layout works; keep whichever the repo already uses.

| Purpose | Next.js-style repo (Switchit) | Plain extension repo (Distract) |
|---|---|---|
| Listing copy | `qa/store-listing.txt` | `store/listing.md` |
| Current store art | `qa/store/` | `store/assets/light/`, `store/assets/dark/`, `store/assets/store-icon-128.png` |
| Templates / renderer | `app/store-shots/`, `scripts/` | `store/templates/`, `store/render.js` |
| Versioned archive | `qa/v{version}/` | git tags + CHANGELOG.md |
| Upload zip | `qa/v{version}/{slug}-{version}.zip` (gitignored) | `dist/{slug}-{version}.zip` (gitignored) |
| Privacy / support | public gists | public gists (`PRIVACY.md`, `store/SUPPORT.md` in repo) |

## Dashboard notes

- Chrome blocks extensions (including Claude in Chrome) from scripting `chrome.google.com/webstore`. Use the app's built-in browser pane with the user signing in, or hand over paste-ready copy.
- Live store can stay on the previous version while a newer draft sits on Package.
- Title and summary come from the package (`manifest.name`, `manifest.description`). Change them in the manifest and re-upload.
- Promo video accepts only a YouTube URL.
- Official URL lists only sites verified in Google Search Console. Leave it as None otherwise.
- `clipboardWrite` is write-only; never claim clipboard read.
- Listing GA4 opt-in grants every publisher member store-level (not user-level) metrics.
- "Why can't I submit?" usually means a missing required field (screenshot, icon, privacy answer, or description).
- Rejected for image size: an upscaled or 2× file slipped in. Only exact sizes, no alpha on screenshots and tiles.
