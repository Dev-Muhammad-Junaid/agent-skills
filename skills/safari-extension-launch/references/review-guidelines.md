# App Review pre-check

Do this **before** Add for Review, every version. Guidelines change; quote the current text.

## 1 · Fetch the current guidelines

Scrape `https://developer.apple.com/app-store/review/guidelines/` (firecrawl `maxAge: 0`; the page is ~100 KB, so save the markdown and slice it with python). Note the "Last Updated" date in the review file. Read at least: "Before You Submit", 2.1, **2.3.1(a)**, 2.3.3, 2.3.4, 2.3.5–2.3.7, 2.3.10, **2.3.14**, 2.4.5, **2.5.19**, 4.1, 4.2, **4.4 and 4.4.2**, 5.1.1, 5.2.1–5.2.3. Then diff the new text against the copy you saved last time (normalise links/images, `difflib.unified_diff`) and read every changed line. Most changes are wording; the real ones are few and easy to miss in a skim.

Text that matters most for Safari extensions (as of October 16, 2026):
- **4.4:** apps containing extensions must follow the Safari web extensions documentation, "should include some functionality, such as help screens and settings interfaces where possible", must "clearly and accurately disclose what extensions are made available in the app's marketing text", and the extensions "may not include marketing, advertising, or in-app purchases".
- **4.4.2:** "Safari extensions must run on the current version of Safari… may not interfere with System or Safari UI elements and must never include malicious or misleading content or code… should not claim access to more websites than strictly necessary to function."
- **2.4.5 (Mac App Store):** sandboxed; packaged with Xcode; self-contained; no auto-launch or lingering processes without consent; no downloaded code.
- **2.3.7:** no trademarked terms or other app names packed into name, subtitle or keywords; subtitle must not reference other apps.
- **5.2.1 / 5.2.2:** no third-party trademarks without permission; permission to use third-party services' content.
- **2.3.1(a):** "All new features, functionality, and product changes must be described with specificity in the Notes for Review section of App Store Connect (generic descriptions will be rejected) and accessible for review." This applies to **every update**, not only the first submission.
- **2.5.19 (new, October 16, 2026):** "Don't include any hidden, dormant, or undocumented features in your app; your app's functionality should be clear to end users and App Review. Attempting to hide undocumented features in your app binary, such as through code obfuscation or other methods, is grounds for removal of your app from the App Store and termination of your developer account."
- **2.3.14 (new, October 16, 2026):** creative assets (product page header, search results) "must pertain to your app's content and functionality or overarching brand, follow standard metadata guidelines, and be appropriate for all audiences" — no inappropriate content, misleading references to other apps, unverifiable claims, or specific/discounted pricing.

## 2 · Checklist

| Guideline | Check | How |
|---|---|---|
| Before You Submit | Contact info current; regulatory documentation if a feature needs approval (rare for extensions) | App Review Information |
| 2.1 | Reviewer can test without your accounts | Review notes with exact steps on a site that works logged out |
| 2.3.1(a) | **Review notes describe this version's changes specifically**, each with how to test it | Compare the notes with CHANGELOG/What's New; old notes on an update = rejection risk |
| 2.5.19 | No hidden, dormant or undocumented features; nothing obfuscated | Every behaviour (including automatic ones with no UI, e.g. self-healing) is in the description, What's New or notes; ship readable JS (no obfuscator; plain minification only if needed) |
| 2.3.3 | Screenshots show the app in use | Real popup in the templates |
| 2.3.4 | No motion-graphics preview | Skip previews |
| 2.3.7 | Name/subtitle/keywords free of third-party marks; keywords don't repeat name words | Read them |
| 2.3.10 | No other stores/platforms in metadata | Description, screenshots, **and the support page** |
| 2.3.14 | Creative assets (if used) pertain to the app/brand, all audiences, no claims/pricing/other apps | Review each asset like a screenshot |
| 2.4.5 | Sandbox on; entitlements minimal | `codesign -d --entitlements - --xml <app>` on the **archive**, app and appex |
| 4.2 | More than a repackaged website | The extension is the product; container has setup/help |
| 4.4 | Description says it's a Safari extension; help screen; no ads/IAP in the extension | Read description; container window |
| 4.4.2 | Runs on current Safari; host list minimal | Guided pass on the current macOS; review `host_permissions` |
| 5.1.1 | Privacy policy URL loads, names **this** app and platform, matches the label | Open the gist; "Data Not Collected" only if nothing leaves the device |
| 5.2.x | Third-party names used only to identify sites; "not affiliated" line in the description | Description and screenshots |
| Links | Support, marketing, privacy URLs all load; no `apps.apple.com` link before release | `curl -sL -o /dev/null -w '%{http_code}'` each |
| Export | `ITSAppUsesNonExemptEncryption = NO` in Info.plist | `plutil -p <app>/Contents/Info.plist` |

## 3 · Risks seen so far

| Risk | Likelihood | Fix |
|---|---|---|
| Privacy/support pages describe only the Chrome version, or say "Chrome Web Store" | Medium | Update the gists in place to cover Safari first (same URLs) |
| Site names/logos in the popup and screenshots | Low–medium | Prepared reply; swap screenshot logos for text if Apple insists |
| Extension changes third-party sites' display | Low | Prepared reply (local display preference, like a content blocker) |
| A legacy domain in `host_permissions` that only redirects (e.g. twitter.com) | Low | Prepared reply, or drop it next build |
| Template entitlements the app doesn't use | Low | `clean-converter-project.py` drops user-selected files |
| An update submitted with the previous version's review notes (new features undescribed) | **High** (2.3.1(a): "generic descriptions will be rejected") | Rewrite the notes for every version: what's new, where it appears, how to test it, and that nothing new is collected or downloaded. The notes field stays editable while "Waiting for Review" |
| Automatic behaviour with no UI (background re-detection, self-healing, remote rules) | Medium (2.5.19) | Name it in the description/What's New and the notes; never fetch or hide logic |

## 4 · Prepared replies (Resolution Center)

Write them into `store/safari/review-check.md` (template in `assets/templates/`) before submitting, so a rejection is answered the same day:

**5.2.1** "The site names and logos appear only to identify which site a setting applies to (nominative use)… not affiliated with or endorsed by… Its name, icon, subtitle and keywords contain no third-party marks. We're happy to replace the logos in the screenshots with plain text if you prefer."

**5.2.2** "It doesn't access, download, display, redistribute or monetize any third-party content. It runs only in the user's own Safari, on pages the user has opened, and applies the user's own choice to hide sections of that page with CSS, like a content blocker. No network requests, no third-party APIs or accounts."

**4.4.2** "The extension needs access only to the sites it changes: … Safari asks the user before it runs on each site, and it doesn't run anywhere else."

If a reply isn't enough, fix, bump the build, upload, attach, and resubmit. Mention the change in the reply.

## 5 · Change log of the guidelines (what to re-check)

| Date | Change | What it means for a Safari extension |
|---|---|---|
| Oct 16, 2026 | New **2.5.19**: hidden, dormant or undocumented features, and hiding them "through code obfuscation or other methods", are grounds for removal and account termination | Document every behaviour; ship readable code |
| Oct 16, 2026 | **2.3.1(a)** keeps "all new features… described with specificity in the Notes for Review… (generic descriptions will be rejected)" as its lead rule | Fresh review notes per version |
| Oct 16, 2026 | New **2.3.14** creative assets | Same rules as other metadata if you use them |
| Oct 16, 2026 | **1.2** user-generated content now covers any app that lets users create, generate, upload or share content, including AI content creation; adds nonconsensual intimate imagery; failing safeguards can breach the Developer Code of Conduct | Usually not applicable to page-hiding extensions |
| Oct 16, 2026 | "Before You Submit" adds regulatory documentation; **3.1.1(a)** external purchase links go to region-approved "permitted destinations" | Only if the app sells something |
| Oct 16, 2026 | Wording ("e.g." → "such as") and new help links throughout | None |
