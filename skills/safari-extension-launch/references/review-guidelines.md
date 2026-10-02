# App Review pre-check

Do this **before** Add for Review, every version. Guidelines change; quote the current text.

## 1 · Fetch the current guidelines

Scrape `https://developer.apple.com/app-store/review/guidelines/` (firecrawl `maxAge: 0`; the page is ~100 KB, so save the markdown and slice it with python). Note the "Last Updated" date in the review file. Read at least: 2.1, 2.3.3, 2.3.4, 2.3.5–2.3.7, 2.3.10, 2.4.5, 4.1, 4.2, **4.4 and 4.4.2**, 5.1.1, 5.2.1–5.2.3.

Text that matters most for Safari extensions (as of June 8, 2026):
- **4.4:** apps containing extensions must follow the Safari web extensions documentation, "should include some functionality, such as help screens and settings interfaces where possible", must "clearly and accurately disclose what extensions are made available in the app's marketing text", and the extensions "may not include marketing, advertising, or in-app purchases".
- **4.4.2:** "Safari extensions must run on the current version of Safari… may not interfere with System or Safari UI elements and must never include malicious or misleading content or code… should not claim access to more websites than strictly necessary to function."
- **2.4.5 (Mac App Store):** sandboxed; packaged with Xcode; self-contained; no auto-launch or lingering processes without consent; no downloaded code.
- **2.3.7:** no trademarked terms or other app names packed into name, subtitle or keywords; subtitle must not reference other apps.
- **5.2.1 / 5.2.2:** no third-party trademarks without permission; permission to use third-party services' content.

## 2 · Checklist

| Guideline | Check | How |
|---|---|---|
| 2.1 | Reviewer can test without your accounts | Review notes with exact steps on a site that works logged out |
| 2.3.3 | Screenshots show the app in use | Real popup in the templates |
| 2.3.4 | No motion-graphics preview | Skip previews |
| 2.3.7 | Name/subtitle/keywords free of third-party marks; keywords don't repeat name words | Read them |
| 2.3.10 | No other stores/platforms in metadata | Description, screenshots, **and the support page** |
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

## 4 · Prepared replies (Resolution Center)

Write them into `store/safari/review-check.md` (template in `assets/templates/`) before submitting, so a rejection is answered the same day:

**5.2.1** "The site names and logos appear only to identify which site a setting applies to (nominative use)… not affiliated with or endorsed by… Its name, icon, subtitle and keywords contain no third-party marks. We're happy to replace the logos in the screenshots with plain text if you prefer."

**5.2.2** "It doesn't access, download, display, redistribute or monetize any third-party content. It runs only in the user's own Safari, on pages the user has opened, and applies the user's own choice to hide sections of that page with CSS, like a content blocker. No network requests, no third-party APIs or accounts."

**4.4.2** "The extension needs access only to the sites it changes: … Safari asks the user before it runs on each site, and it doesn't run anywhere else."

If a reply isn't enough, fix, bump the build, upload, attach, and resubmit. Mention the change in the reply.
