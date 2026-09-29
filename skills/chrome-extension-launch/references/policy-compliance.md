# Chrome Web Store policy compliance

Official sources (check them when unsure; policies change):
- Program policies: https://developer.chrome.com/docs/webstore/program-policies
- Listing requirements: https://developer.chrome.com/docs/webstore/program-policies/listing-requirements
- Spam FAQ (5 brands, keyword repetition): https://developer.chrome.com/docs/webstore/program-policies/spam-faq
- User data FAQ: https://developer.chrome.com/docs/webstore/program-policies/user-data-faq
- Remote code / MV3: https://developer.chrome.com/docs/extensions/develop/migrate/remote-hosted-code
- Images: https://developer.chrome.com/docs/webstore/images

## Pre-submission checklist

**Product**
- [ ] One single purpose you can say in one sentence. The Privacy tab asks for it.
- [ ] Minimum permissions, and every permission and host has a one-sentence justification.
- [ ] No remote code: no `eval`/`new Function` on fetched text, no CDN scripts, everything bundled.
- [ ] No hidden data collection. If there's none, say so, and answer the data-use form with no data types.
- [ ] Doesn't modify or break the host sites beyond what the user chose, and stays fully reversible ("show all", pause).
- [ ] No affiliate injection, no ads, no crypto mining, no obfuscated code (minification is fine).

**Listing text** (title, summary, description)
- [ ] Summary ≤132 characters. It comes from `manifest.description` and leads with the action.
- [ ] At most **5** websites or brands named. Parent companies may appear in a one-line disclaimer.
- [ ] No keyword more than **5** times, and no keyword lists. Run `node assets/scripts/listing-audit.js copy.txt --brands … --words … --parents …`.
- [ ] No "#1", "best", fake reviews, or claims of endorsement.
- [ ] Disclaimer when naming other companies: "X is not affiliated with or endorsed by Google, YouTube, X Corp., or Meta."

**Images**
- [ ] Screenshots are 1280×800 (or 640×400), 1–5 of them, JPEG or 24-bit PNG with **no alpha**.
- [ ] Small tile 440×280 and marquee 1400×560, no alpha. Store icon 128×128, 96 px artwork with 16 px transparent padding.
- [ ] Show the real product UI with fixture data. No real emails, inboxes or personal accounts.
- [ ] Platform logos in images only identify the site. Not the dominant element of promo tiles.

**Privacy tab**
- [ ] Single purpose text.
- [ ] Justification for each permission and for host access.
- [ ] "Are you using remote code?" → No.
- [ ] Data usage: tick only what's actually collected (usually nothing) and certify all three statements.
- [ ] Privacy policy URL: a public gist (required if any user data is handled; recommended anyway).

## Justification templates

- `storage`: "Saves [the user's choices, e.g. which sections are hidden] so they apply on every visit. Stored with chrome.storage and never sent anywhere."
- Host permissions: "The content script [does X] on [sites] only, and the popup reads which site and page type the current tab shows so it can [show Y]. No other sites are accessed."
- `clipboardWrite`: "Used only when the user clicks [control] to copy [thing]. The extension never reads the clipboard."
- `tabs` (only if truly needed): "Reads the active tab's URL to [feature]. No browsing history is stored."

## Single purpose template

"[Name] lets you [one verb phrase] on [sites] so [outcome]."
Example: "Distract lets you hide chosen sections of YouTube, X, Facebook and Instagram pages (feeds, Shorts, Reels, suggestions, sidebars) so those sites are less distracting."

## Common rejection causes and fixes

| Rejection | Fix |
|---|---|
| Keyword spam or too many brands | Trim to ≤5 brands; move the extra sites into screenshots |
| Excessive permissions | Drop unused ones (`tabs` is often unnecessary: `sendMessage` works without it) |
| Missing privacy justification | Fill every permission, including host access |
| Image dimensions or alpha | Re-render at exact sizes; no `@2x` files; opaque PNGs |
| Misleading functionality | The description must match what the build does today (no roadmap features) |
