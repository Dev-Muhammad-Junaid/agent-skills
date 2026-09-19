# Chrome Web Store reference

## Official docs

- Listing requirements: https://developer.chrome.com/docs/webstore/program-policies/listing-requirements
- Spam FAQ (5 brands, keyword caps): https://developer.chrome.com/docs/webstore/program-policies/spam-faq
- Program policies: https://developer.chrome.com/docs/webstore/program-policies
- Best listing: https://developer.chrome.com/docs/webstore/best-listing
- Images / promo tiles: https://developer.chrome.com/docs/webstore/images
- Listing tab fields: https://developer.chrome.com/docs/webstore/cws-dashboard-listing
- Store metrics + listing GA4: https://developer.chrome.com/docs/webstore/metrics
- In-extension GA4 (only if product collects analytics): https://developer.chrome.com/docs/extensions/how-to/integrate/google-analytics-4

## Keyword and brand audit

After drafting listing copy, count case-insensitive mentions. Fail if any brand or purpose word exceeds 5, or if a 6th website/brand is named.

Typical purpose words to count: the product’s main verb (for example switch/switcher), account, overlay, productivity.

Family products of one brand (for example Gmail, Drive, Docs under Google) stay grouped under that one brand. They do not use up extra slots.

Screenshot-only brands must never appear in title, summary, or description. A disclaimer may name the parent company of a listed brand (for example Meta for Facebook).

## Suggested repo layout

- Listing copy: `qa/store-listing.txt`
- Current shots + promo: `qa/store/`
- Versioned archive: `qa/v{version}/`
- Upload zip: `qa/v{version}/{extension-slug}-{version}.zip` (gitignored)

## Dashboard notes

- Live store can stay on the previous version while a newer draft sits on Package.
- `clipboardWrite` is write-only; never claim clipboard read.
- Listing GA4 opt-in grants every publisher member store-level (not user-level) metrics.
- “Why can’t I submit?” usually means a missing required field (screenshot, icon, privacy answer, or description).
