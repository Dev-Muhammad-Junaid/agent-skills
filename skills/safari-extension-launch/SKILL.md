---
name: safari-extension-launch
description: >
  Playbook for taking a Manifest V3 web extension (usually one already built for Chrome) to Safari on
  the Mac App Store: compatibility audit and Safari-specific code
  fixes, the Xcode app wrapper (converter, signing with the user's Apple team, Canvas-styled setup window,
  macOS icon), A-to-Z testing (WebKit engine suite, Chromium suite, live signed-in checks, a guided
  Safari pass), App Review guideline pre-check, Mac App Store screenshots, App Store Connect setup
  (app record, listing, age rating, pricing, privacy label, EU DSA, review notes), build upload and
  swaps, and post-submission follow-up. Use whenever the user wants a Safari extension, a Safari or
  Mac App Store version of an extension, Safari testing, App Store Connect work for an extension, an
  App Review pre-check, or help with a Safari extension rejection, even if they only mention one step.
---

# Safari extension: audit → wrap → test → pre-check → submit

Safari extensions ship **inside a Mac app** from the Mac App Store. The web extension code stays the same; Apple wraps it in an Xcode project with a small container app. App Store Connect lists it as a macOS app, and Safari's **Settings → Extensions → Add Extensions** button surfaces it.

Building the extension itself (theme, MV3 architecture, Chrome store, promo video) lives in the `chrome-extension-launch` skill. Use that first for a new extension, then this one for Safari.

Reference files. Read the one for the phase you're in:

| Phase | File |
|---|---|
| Safari compatibility audit and code fixes | [references/compatibility-audit.md](references/compatibility-audit.md) |
| Xcode wrapper, signing, container app, icon, builds | [references/xcode-wrapper.md](references/xcode-wrapper.md) |
| Test plan, WebKit suite, live checks, guided Safari pass | [references/testing.md](references/testing.md) |
| Mac App Store screenshots and icon | [references/store-assets.md](references/store-assets.md) |
| App Review guidelines pre-check, risks, prepared replies | [references/review-guidelines.md](references/review-guidelines.md) |
| App Store Connect: record, listing, pricing, privacy, DSA, submit | [references/app-store-connect.md](references/app-store-connect.md) |

Starter files. Copy them into the extension repo:

| Skill file | Project path | Adapt |
|---|---|---|
| `assets/scripts/clean-converter-project.py` | run once, not copied | Team, versions, category |
| `assets/container-app/*` | `safari/<App>/Resources/`, `safari/<App>/ViewController.swift` | App name, steps text, Canvas tokens |
| `assets/scripts/webkit-test.example.js` | `tools/webkit-test.js` | The page sweeps and zone list |
| `assets/scripts/ExportOptions.plist` | `build/safari/ExportOptions.plist` (gitignored) | Team ID |
| `assets/templates/TEST-PLAN.example.md` | `TEST-PLAN.md` | Every feature and section of this extension |
| `assets/templates/test-results.example.md` | `store/safari/test-results-<version>.md` | Fill in as tests run |
| `assets/templates/app-store.example.md` | `store/safari/app-store.md` | Listing copy and IDs |
| `assets/templates/review-check.example.md` | `store/safari/review-check.md` | Risks and replies for this extension |

The macOS app icon comes from `chrome-extension-launch/assets/scripts/icons.js` (`node icons.js mac out.png`). Mac screenshots come from that skill's `render-store.js` with `TARGET=safari`. Install both skills.

## Publisher profile (ask once, keep out of the skill)

Personal and account details live in the agent's memory or a local note, never in this skill. If memory has a profile, use it; otherwise ask once and save it:
- Apple developer account email, **team name and team ID** (`security find-identity` / Xcode accounts list them), bundle ID prefix (e.g. `com.yourcompany`)
- App Store developer name (set on the account's first app, permanent), copyright holder, marketing website
- support/contact email for review notes, and whether EU DSA trader status is already verified for the account
- GitHub account for the policy gists; design system link

## The user's standing requirements

Apply these without being asked. Confirm only the items marked **ask**.

- **Apple developer account and App Store identity:** from the **publisher profile** (below). Bundle IDs: `<bundle-prefix>.<name>` and `<bundle-prefix>.<name>.Extension`. The account should already be signed in to Xcode so automatic signing with `-allowProvisioningUpdates` works. **Ask** before using a team that isn't in the profile.
- **Privacy and support pages** are public GitHub gists that cover **both** browsers: Safari first, Chrome second, plus the Mac app. Never link the `apps.apple.com` URL before release (it 404s for reviewers).
- **Design:** the container app window uses the same design system as the popup (e.g. Canvas: lowercase two-line headline, accent second line, ledge button), light and dark.
- **Claude's browser limits:** Safari is **read-only** for Claude (screenshots only, no clicks, no navigation, no scripting workarounds). Chrome is drivable via Claude in Chrome. So: engine and logic tests are automated in WebKit and Chromium, signed-in selector checks run in Chrome, and Safari-only plumbing is a **guided pass**: the user clicks, Claude verifies screenshots.
- **Verify every step** and say plainly what wasn't verified. "Works in most features" is not a pass.
- **Never:** type passwords or passkeys, pay, click **Submit to App Review** / **Add for Review**, click **Release**, merge a PR, or edit a public gist without an explicit yes in chat. Release is always set to **manual**.
- **Files the user can't see:** in a scratch workspace, offer to move the work to `~/Projects/<name>` and send key files with the file-sending tool.

## Workflow

### 0 · Kickoff
1. Confirm the extension repo and that the Chrome version is current (Safari work starts from the same source).
2. Name: check it's free on the App Store early. Names are global and often taken (e.g. "Distract" was); have 3–4 fallbacks in the form `Brand: Benefit` (≤30 chars, no third-party marks). **Ask** the user to pick from them.
3. Mac only first. iPhone/iPad is a separate project (mobile site markup, popup as a sheet).

### 1 · Compatibility audit and code fixes
Follow [compatibility-audit.md](references/compatibility-audit.md). The fixes that bit in production:
- Content scripts at `document_start` can run **before `<html>` exists** in WebKit. Mount through a `whenRoot()` MutationObserver.
- Safari withholds host access until the user allows each site. `tab.url` is unreadable before that. Add an **access screen** with `chrome.permissions.request`.
- **Long-lived ports drop** on busy pages (YouTube) in Safari. Send hover/peek as one-off `tabs.sendMessage` with a heartbeat; the page clears itself when beats stop.
- Run content scripts in the **top frame only**.
- Taggers must be **self-correcting** (`T.only`): a tag placed while a page is half-loaded must move or drop, never stick on a big wrapper.

### 2 · Xcode wrapper
Follow [xcode-wrapper.md](references/xcode-wrapper.md): `xcrun safari-web-extension-converter` into `safari/` (macOS only, Swift, no copy), then `clean-converter-project.py` to flatten, strip non-extension resources, set the team, versions, category and the encryption key. Canvas container window, macOS icon. Build, launch once, check `pluginkit` shows exactly one registration.

### 3 · Test A to Z
Follow [testing.md](references/testing.md). Write `TEST-PLAN.md` first (every feature, every hideable section, IDs and layers), then run:
- **A** `tools/webkit-test.js`: real content script on live pages in WebKit + the popup in every state, light and dark.
- **C** the Chromium e2e and nesting tests (`BROWSER=webkit` too).
- **L** live signed-in checks in Chrome for sites that need an account, including the **planted wrong tags** check.
- **S** the guided Safari pass, one group at a time.
Record everything in `store/safari/test-results-<version>.md`. Fix, bump the build number, re-run.

### 4 · Mac App Store assets
[store-assets.md](references/store-assets.md): 2880×1800 screenshots in light and dark, no alpha; the app icon from the 1024 grid. No app preview video unless it is real screen capture.

### 5 · App Review pre-check
[review-guidelines.md](references/review-guidelines.md): fetch the **current** guidelines (`developer.apple.com/app-store/review/guidelines/`, note the "Last Updated" date), walk the checklist, inspect the archived build's entitlements, and write `store/safari/review-check.md` with risks and prepared Resolution Center replies. Fix every medium risk before submission (privacy/support pages are the usual one).

### 6 · App Store Connect
[app-store-connect.md](references/app-store-connect.md): the user signs in (Claude in Chrome on `appstoreconnect.apple.com`). Create the record, fill the listing, screenshots in order, app information, age rating, content rights, pricing and availability, privacy label, review notes; archive, upload, attach the build. Stop at **Add for Review** with a summary.

### 7 · After submission
- Keep the prepared replies ready. If App Review asks, answer from `review-check.md` or ship a build with a new build number.
- At release, add the `apps.apple.com/app/id<AppleID>` link to the privacy and support pages and README.
- Port any shared fixes back to Chrome (same source) and ship a Chrome update.
- Save IDs and state to memory (Apple ID, bundle, build, what's pending).

## Pitfalls already paid for (don't repeat them)

| Symptom | Cause | Fix |
|---|---|---|
| Nothing hides on some page loads in Safari; fine in Chrome | `document_start` before `<html>` exists; `html.appendChild` throws | `whenRoot()` MutationObserver mount |
| Hover outline works on X/Facebook/Instagram, not YouTube | Safari drops the popup's long-lived port on YouTube | One-off `tabs.sendMessage` + 1 s heartbeat; page clears after 2.5 s |
| Hiding "Composer" also hid the whole timeline | Tagger marked the primary column while X was loading; tag never removed | `T.only(el, zone, bad)`: move/drop stale container tags |
| Converter bundled the whole repo (store videos, tools, even `safari/`) into the extension | Converter run on the repo root adds every top-level item | `clean-converter-project.py` keeps only manifest, src, icons |
| Two "Distract" entries in Safari Settings | The Release archive's intermediate app registered too | `pluginkit -r <path>` and delete `ArchiveIntermediates` after archiving |
| Runpath broke after a path rewrite | Blind `../../../` replace also hit `@executable_path/../../../../Frameworks` | The script rewrites only file references |
| "Distract" name rejected in App Store Connect | Names are global | Prepared fallbacks, user picks |
| Review contact wouldn't save | Phone number is required (with `+country`) | Ask the user to type it (personal data) |
| Screenshots in random order | Multi-file upload completes out of order | Delete all, upload one at a time, waiting for the count |
| Selects/inputs ignore `form_input` in App Store Connect | React-controlled fields | Native value setter + `input`/`change` events via `javascript_tool` |
| Privacy/support URLs described only Chrome | Pages written for the first store | Update gists in place (same URLs), both browsers |
| Buggy build already attached when bugs were found | Uploaded before testing finished | Detach (version page → Build → Delete), upload build N+1, attach once processed (~10–30 min) |
| Asked to "test it yourself" in Safari | Safari is read-only for Claude | Explain once; automate in WebKit/Chrome, guide the Safari pass |

## Credits

Contributed by **Muhammad Junaid** · [widgetsflow.com](https://widgetsflow.com) · [GitHub @Dev-Muhammad-Junaid](https://github.com/Dev-Muhammad-Junaid)
