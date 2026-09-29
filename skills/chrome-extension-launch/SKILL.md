---
name: chrome-extension-launch
description: >
  End-to-end playbook for building and launching a Chrome extension the way Muhammad Junaid ships
  them: pick a theme from his design system, research the target sites in his signed-in Chrome,
  build a Manifest V3 extension, verify it live and with automated tests, pass Chrome Web Store
  policy, set up a private GitHub repo with PRs and issues, generate every store asset (light + dark
  screenshots, promo tiles, icon), publish through the Developer Dashboard, and produce a
  motion-designed promo video, YouTube thumbnail and copy, and social cuts (Reels, X, Facebook).
  Use whenever the user wants to build, redesign, package, publish, update or market a Chrome
  extension, or asks for extension store assets, promo videos or launch posts, even if they only
  mention one of these steps.
---

# Chrome extension: build → verify → publish → promote

This skill is the whole pipeline. It works with the narrower `chrome-web-store-listing` skill (dashboard field rules, 5-brand cap, GA4). When both apply, follow this one and use that one's reference links for policy detail.

Reference files. Read the one for the phase you're in:

| Phase | File |
|---|---|
| Theme and UI rules | [references/design-and-theme.md](references/design-and-theme.md) |
| MV3 architecture, content scripts, popup | [references/extension-architecture.md](references/extension-architecture.md) |
| Site research, live checks, e2e tests | [references/research-and-testing.md](references/research-and-testing.md) |
| Chrome Web Store policy compliance | [references/policy-compliance.md](references/policy-compliance.md) |
| Store screenshots, tiles, icon | [references/store-assets.md](references/store-assets.md) |
| Packaging, dashboard, URLs, submission | [references/publishing.md](references/publishing.md) |
| Promo video, YouTube, social cuts | [references/promo-video-and-social.md](references/promo-video-and-social.md) |
| GitHub repo, branches, issues | [references/github-workflow.md](references/github-workflow.md) |

Starter files. Copy them to these paths in the new project; the scripts assume the layout:

| Skill file | Project path | Adapt |
|---|---|---|
| `assets/extension/brands.js` | `src/brands.js` | Add or remove platforms |
| `assets/extension/manifest.example.json` | `manifest.json` | Name, description, hosts, scripts |
| `assets/extension/PRIVACY.example.md`, `SUPPORT.example.md` | `PRIVACY.md`, `store/SUPPORT.md` | Rewrite for the product |
| `assets/scripts/icons.js`, `package.sh`, `e2e.js`, `nesting-test.js`, `popup-test.html`, `live-check-*.js` | `tools/` | The icon geometry, test assertions, and zone names |
| `assets/scripts/listing-audit.js` | `tools/` | Run it with the brand and keyword lists |
| `assets/templates/*` | `store/templates/` | Tokens in `store.css`, the `SHOTS` table, copy |
| `assets/scripts/render-store.js` | `store/render.js` | The job list |
| `assets/video/promo.example.html`, `render-video.js`, `soundtrack.js` | `store/video/promo.html`, `render.js`, `soundtrack.js` | Scenes and cue times |

Rendering needs `playwright-core` (install it in a scratch folder), the cached "Chrome for Testing" binary (`~/Library/Caches/ms-playwright/chromium-*`), `ffmpeg` and macOS `sips`. Run the scripts with `PW=<playwright-core path> CHROME=<binary>`.

## The user's standing requirements

Apply these without being asked. Confirm only the items marked **ask**.

- **Theme: ask.** The first question on any new extension: "Which design system or theme should it use?" The user keeps design systems as claude.ai Design System artifacts (for example "Canvas"). Read the artifact's `project/README.md` and `project/tokens.json`, and build everything (popup, store art, video) on those tokens in light **and** dark. With no answer, propose two or three directions and wait.
- **Tone:** nothing overwordy. Direct, polished, works right away, no heavy overhead. UI copy is short; tooltips name things and don't explain obvious clicks.
- **Visual language (Canvas, when chosen):** lowercase display headlines ending in a period, split over two lines with the second in the accent colour. Warm canvas, one confident blue, soft tints with meaning, ledge buttons, generous radii. No gradients-for-decoration, no emoji, no glassmorphism.
- **Delight, kept subtle:** a soft synthesised sound on key toggles, small physical motion, hover previews. Official platform logos (Simple Icons, CC0) wherever a platform is named in the UI.
- **Both themes everywhere:** popup, store screenshots, promo tiles.
- **Verify every step.** Research real structure in the user's signed-in Chrome, prove selectors on the live pages, run e2e tests on the packaged extension, and look at every rendered asset before handing it over. Report failures plainly.
- **Accounts:**
  - Chrome Web Store publisher: `dev.muhammadjunaid@gmail.com`. The dashboard URL carries an account index (`/u/<n>/`) that varies, so get it from the user.
  - GitHub: `Dev-Muhammad-Junaid`. New extension repos are **private**.
  - Privacy policy and support pages are **public GitHub gists**, following the Switchit and Distract format.
- **Files the user can't see:** when the session runs in a scratch workspace, the user can't browse it. Send deliverables with the file-sending tool (zip, images, videos), and offer to move the work into a real folder (the user likes `~/Projects/<name>`).
- **Never:** type passwords or passkeys, pay the $5 developer fee, click **Submit for review**, merge or publish without an explicit yes in chat. Stop and hand over at each of these.

## Workflow

### 0 · Kickoff (ask only what's needed)
1. Theme or design system (**ask**, see above).
2. Name, one-line purpose and target sites. Push for one single purpose.
3. Publisher account and whether a CWS item already exists (item ID, dashboard URL).

Then state the approach you recommend in 3–5 lines (for example "a saved site map plus runtime detection, CSS-first hiding"), and go.

### 1 · Research the target sites
Use the user's signed-in Chrome (Claude in Chrome tools) to map each site's real DOM. Read-only: never post, like, follow or change settings. Details and pitfalls: [research-and-testing.md](references/research-and-testing.md). The big ones:
- A Chrome window hidden behind other apps stops rendering (feeds never load, `visibilityState: "hidden"`). Ask the user to bring Chrome to the front for a few minutes.
- Prefer stable hooks (`data-testid`, custom elements, `aria-*`, `role`). Where markup is obfuscated (Facebook, Instagram), use a small JS tagger that marks elements with `data-*` attributes.

### 2 · Build (Manifest V3)
Follow [extension-architecture.md](references/extension-architecture.md): minimal permissions, `document_start` CSS injection so nothing flashes, taggers only while needed, SPA route detection, `chrome.storage.sync`, and a popup that talks to the page over `sendMessage` plus a long-lived port. Generate icons with `assets/scripts/icons.js` (no dependencies).

### 3 · Verify
- **Live:** paste `live-check-pack.js` output into the signed-in tabs and confirm each selector matches exactly the intended box (right size, nothing bigger). Hide everything and screenshot.
- **Popup:** use `popup-test.html` (stubbed `chrome.*`) in the built-in browser, in light and dark, covering every state (on-site, off-site, reload-needed, paused).
- **Packaged extension:** `e2e.js` loads it unpacked in a throwaway headless Chromium and asserts behaviour end to end.
- **Interaction regressions:** for overlapping or nested clickable UI, a test like `nesting-test.js`. Prove the test fails on the old bug before trusting it.

### 4 · Compliance pass
Run the checklist in [policy-compliance.md](references/policy-compliance.md) and `listing-audit.js` on the copy. Fix, don't argue.

### 5 · Repo and tracking
Private repo, a `launch` branch, a PR with a policy and test summary, issues for every known limitation, and a CHANGELOG. See [github-workflow.md](references/github-workflow.md).

### 6 · Store assets
Copy `assets/templates/` + `render-store.js`, and theme the templates with the design tokens. Render 5 screenshots, the small tile and the marquee, in **light and dark**, plus the padded store icon and a YouTube thumbnail. Look at every image. Only exact store sizes go in the asset folder. See [store-assets.md](references/store-assets.md).

### 7 · Publish
`package.sh` → zip. Walk the dashboard (Package, Store listing, Privacy, Distribution) using [publishing.md](references/publishing.md). Publish the privacy policy and support pages as public gists. Stop before **Submit for review** and show a summary.

### 8 · Promote
Promo video (30 s, deterministic timeline, frame-exact render, synthesised soundtrack), YouTube title, description, tags and thumbnail, then social cuts (vertical 1080×1920 and supersampled landscape) with platform captions. See [promo-video-and-social.md](references/promo-video-and-social.md).

### 9 · Hand-off report
Lead with what was verified and what wasn't. Then list: the files sent, the dashboard steps that remain for the user (sign-in, fee, video URL, submit), the PR link, and the open issues.

## Pitfalls already paid for (don't repeat them)

| Symptom | Cause | Fix |
|---|---|---|
| Feeds don't load while researching | Chrome window hidden behind other apps | Ask the user to bring Chrome to the front |
| Can't click anything on chrome.google.com/webstore | Chrome blocks extensions (including Claude in Chrome) from scripting the Web Store | Use the app's built-in browser pane (the user signs in there), or give the user paste-ready copy |
| Store rejects screenshots for size | `@2x` masters sat next to real assets | Write masters to a temp dir. Only exact sizes go in `store/assets/` |
| Store images "grainy" | UI enlarged with CSS `transform: scale` at 1× | Enlarge with CSS `zoom` (re-lays out crisply), render at `deviceScaleFactor: 2`, downscale with `sips` |
| PNG has an alpha channel | Canvas `toDataURL` export | Downscale with `sips` from an opaque capture |
| Nested blocks unreachable on hover | `:hover { z-index }` lifted the parent over its children | Stack by nesting depth (`--z` per block). Hover adds a small offset only |
| Leftover captions in later video scenes | Scenes hidden with `visibility`; a `visible` child overrides it | Hide scenes with `display: none` |
| Re-render changes committed images by a pixel | Non-deterministic anti-aliasing | Don't commit untouched assets. `git checkout --` them |
| A cancelled long command still deleted files | The process started before the cancel | Check `git status` after any interrupt and restore from git |
| Listing flagged as spam | Too many brands or repeated keywords | ≤5 brands, each keyword ≤5 times (`listing-audit.js`) |
