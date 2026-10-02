<!-- Example from Distract 1.2.0 (Safari build 3). Keep the structure; replace the product, sections, IDs and results. -->

# App Review check: Distract: Feed Blocker 1.2.0 (3)

Checked 2026-10-02 against the App Review Guidelines (last updated June 8, 2026) and the submitted build (`Distract-b3.xcarchive`).

## Passes

| Guideline | Check |
|---|---|
| 2.1 Completeness | Review notes give exact steps; YouTube works without an account |
| 2.3.3 Screenshots | Show the real popup in use, with text overlays (allowed) |
| 2.3.5 / 2.3.6 | Productivity / Utilities; age rating answered (4+) |
| 2.3.7 Metadata | Name, subtitle and keywords hold no trademarks or other app names |
| 2.4.5 Mac App Store | Sandboxed, built and uploaded with Xcode, no auto-launch, no login items, no downloaded code |
| 4.2 Minimum functionality | The extension is the product; the app has a setup/help screen |
| 4.4 Extensions | Description says it's a Safari extension; app has a help screen; no ads or IAP in the extension |
| 4.4.2 Safari extensions | Runs on current Safari (macOS 27, tested); doesn't touch Safari UI; access limited to the supported sites |
| 5.1.1 / privacy label | No data leaves the device; "Data Not Collected" is accurate |
| Export compliance | `ITSAppUsesNonExemptEncryption = NO` |

## Risks, and the fix for each

| Risk | Guideline | Likelihood | Fix |
|---|---|---|---|
| ~~Privacy policy and support pages described only the Chrome extension~~ | 5.1.1, 2.3.10 | Fixed 2026-10-02 | Both gists updated in place: Safari first, Chrome second, Mac app covered. Add the apps.apple.com link once the app is live (it 404s until release) |
| YouTube, X, Facebook and Instagram names and logos in the popup and screenshots | 5.2.1 | Low–medium | Reply below; if Apple insists, swap the logos in screenshots for plain text labels |
| Extension changes how third-party sites display | 5.2.2 | Low | Reply below (local display preference, like a content blocker) |
| `*://*.twitter.com/*` host access when twitter.com redirects to x.com | 4.4.2 "not more websites than strictly necessary" | Low | Drop twitter.com in the next build if asked |
| Unneeded template entitlements: `files.user-selected.read-only` (app + extension), `network.client` (app) | 2.4.5(i) | Low | Remove in the next build |

## Prepared replies (for Resolution Center)

**5.2.1 (third-party names/logos)**
> Distract is a Safari extension that lets each user hide parts of four websites in their own browser. The site names and logos appear only to identify which site a setting applies to (nominative use), the same way a browser's site settings do. Distract is not affiliated with, endorsed by, or presented as a product of Google, YouTube, X Corp., or Meta, and says so in its description. Its name, icon, subtitle and keywords contain no third-party marks. We're happy to replace the logos in the screenshots with plain text if you prefer.

**5.2.2 (third-party sites)**
> Distract doesn't access, download, display, redistribute or monetize any third-party content. It runs only in the user's own Safari, on pages the user has opened, and applies the user's own choice to hide sections of that page with CSS, like a content blocker. It makes no network requests and uses no third-party APIs or accounts.

**4.4.2 (website access)**
> The extension needs access only to the sites it changes: youtube.com, x.com, facebook.com and instagram.com (twitter.com is included because old links still open there before redirecting). Safari asks the user before it runs on each site, and it doesn't run anywhere else.
