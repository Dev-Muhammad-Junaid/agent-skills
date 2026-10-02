---
name: chrome-extension-launch
description: >
  End-to-end playbook for building and launching a Chrome extension: pick a theme from the user's
  design system, research the target sites in the user's signed-in Chrome,
  build a Manifest V3 extension, verify it live and with automated tests, pass Chrome Web Store
  policy, set up a private GitHub repo with PRs and issues, generate every store asset (light + dark
  screenshots, promo tiles, icon), publish through the Developer Dashboard, and produce a
  motion-designed promo video, YouTube thumbnail and copy, and social cuts (Reels, X, Facebook).
  Use whenever the user wants to build, redesign, package, publish, update or market a Chrome
  extension, or asks for extension store assets, promo videos or launch posts, even if they only
  mention one of these steps. Also use it for listing-only work: writing store listing copy,
  generating store screenshots or promo tiles, filling the Developer Dashboard, privacy
  justifications, Google Analytics store metrics, or submitting an update for review.
---

# Chrome extension: build → verify → publish → promote

This skill is the whole pipeline, including the store listing. For listing-only or promo-only work (an existing extension that needs copy, store art, a video, a dashboard pass or an update), clone the repo where the user says, work on a branch, ask the two questions in [design-and-theme.md § existing extension](references/design-and-theme.md), and go straight to phases 4, 6, 7 and 8: [policy-compliance.md](references/policy-compliance.md), [store-assets.md](references/store-assets.md), [publishing.md](references/publishing.md).

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
| `assets/extension/brands.js` | `src/brands.js` (or `store/brands.js`) | Already has Google, Gmail, Drive, Docs, YouTube, LinkedIn, X, Instagram, Facebook, Figma, Notion, GitHub |
| `assets/extension/manifest.example.json` | `manifest.json` | Name, description, hosts, scripts |
| `assets/extension/PRIVACY.example.md`, `SUPPORT.example.md` | `PRIVACY.md`, `store/SUPPORT.md` | Rewrite for the product |
| `assets/scripts/icons.js`, `package.sh`, `e2e.js`, `nesting-test.js`, `popup-test.html`, `live-check-*.js` | `tools/` | The icon geometry, test assertions, and zone names |
| `assets/scripts/listing-audit.js` | `tools/` | Run it with the brand and keyword lists |
| `assets/templates/*` | `store/templates/` | Tokens in `store.css`, the `SHOTS` table, copy |
| `assets/scripts/render-store.js` | `store/render.js` | The job list |
| `assets/video/promo.example.html` (Distract) or `promo-react-frame.example.html` (Switchit), `render-video.js`, `soundtrack.js` | `store/video/promo.html`, `render.js`, `soundtrack.js` | Write a new storyboard, motion language and sound for each product; reuse only the engine |
| `assets/react-frame/*` (React/Next UIs only) | `app/store-shots/frame/page.tsx`, `store/serve.js`, `store/templates/overlay.js`, `page.js`, `store/fixtures/scenes.js` | The component, its props, the fixture accounts |

Rendering needs `playwright-core` (a devDependency, or `PW=<path>`), the cached "Chrome for Testing" binary (`~/Library/Caches/ms-playwright/chromium-*`, found automatically; `CHROME=` overrides), `ffmpeg` and macOS `sips`.

**UI built with React/Next (Switchit):** don't screenshot a bare fixture page. Render the real component in a frame route and reuse the same templates and video: [store-assets.md § frame pattern](references/store-assets.md).

## Publisher profile (ask once, keep out of the skill)

Personal and account details live in the agent's memory or a local note, never in this skill. If memory has a profile, use it; otherwise ask once and save it:
- name or company shown as publisher, Chrome Web Store publisher email, support/contact email
- GitHub account (for private repos and the policy gists)
- design system link (e.g. a claude.ai Design System artifact)
- website for marketing links

## The user's standing requirements

Apply these without being asked. Confirm only the items marked **ask**.

- **Theme: ask.** The first question on any new extension: "Which design system or theme should it use?" The user keeps design systems as claude.ai Design System artifacts (for example "Canvas"). Read the artifact's `project/README.md` and `project/tokens.json`, and build everything (popup, store art, video) on those tokens in light **and** dark. With no answer, propose two or three directions and wait.
- **Tone:** nothing overwordy. Direct, polished, works right away, no heavy overhead. UI copy is short; tooltips name things and don't explain obvious clicks.
- **Visual language (Canvas, when chosen):** lowercase display headlines ending in a period, split over two lines with the second in the accent colour. Warm canvas, one confident blue, soft tints with meaning, ledge buttons, generous radii. No gradients-for-decoration, no emoji, no glassmorphism.
- **Every promo is its own:** read what the product does (every state in its UI code) before storyboarding, and give each extension its own transitions and sound. Never copy another extension's video.
- **Delight, kept subtle:** a soft synthesised sound on key toggles, small physical motion, hover previews. Official platform logos (Simple Icons, CC0) wherever a platform is named in the UI.
- **Both themes everywhere:** popup, store screenshots, promo tiles.
- **Verify every step.** Research real structure in the user's signed-in Chrome, prove selectors on the live pages, run e2e tests on the packaged extension, and look at every rendered asset before handing it over. Report failures plainly.
- **Accounts:** come from the **publisher profile** (below), never hard-coded here.
  - Chrome Web Store publisher email. The dashboard URL carries an account index (`/u/<n>/`) that varies, so get it from the user.
  - GitHub account. New extension repos are **private**.
  - Privacy policy and support pages are **public GitHub gists** on that account (product repos are private and would 404 for reviewers).
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

### 9 · Safari (optional)
To ship the same extension to Safari on the Mac App Store, switch to the `safari-extension-launch` skill: compatibility fixes, Xcode wrapper, WebKit testing, App Review pre-check and App Store Connect.

### 10 · Hand-off report
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
| Iframe twice as tall as the UI | `getBoundingClientRect()` inside a zoomed document is already zoomed | Use the measured size as-is |
| Next page reloads mid-render behind the proxy | HMR WebSocket not proxied | Pass `upgrade` through (`serve.js` does) |
| Frame ignores the theme you posed | The app's ThemeProvider re-applies the system theme | Re-apply on `<html class>` mutations (`frame-page.tsx`) |
| Fixture code in the upload zip | Listing-only page removed, its chunks left behind | Delete chunks only that page referenced; `grep -rl __pose out` |
| Audio peaks at 0.0 dB after AAC | WAV normalised to −1 dBFS | Normalise to about −2 dBFS |
| `magick montage` errors on fonts | No default font configured | Tile with ffmpeg (`tile=5x1`) |
| Video "copies the other extension", features missing | Storyboard and motion reused instead of read from the product | List every UI state from the code first; new motion and sound per product (promo-video-and-social.md) |
| Reels look "zoomed out" | Landscape layout scaled into 9:16 | Separate vertical layout, UI at ~90 % width |
| Rolling caption never moves | `transform` on an inline `<span>` | `display: block` on the moving element |
| Hiding one section hid a much bigger one (X Composer → whole timeline) | Container tag placed while the page was half-loaded, never removed | `T.only()` + climb that refuses ancestors containing the sibling section; live check with planted wrong tags |
| Nothing hidden on some loads in WebKit/Safari | `document_start` before `<html>` exists | `whenRoot()` mount |
| Live sizes read 0 px in the user's Chrome | Their own installed copy already hides those sections | Disable `#distract-style` while measuring, restore after |
| Split light/dark shot looks broken in one set | The halves inherit the page's theme; scrim sits over the dark half | Each half gets its own tokens and scrim; one diagonal for page and UI |

## Credits

Contributed by **Muhammad Junaid** · [widgetsflow.com](https://widgetsflow.com) · [GitHub @Dev-Muhammad-Junaid](https://github.com/Dev-Muhammad-Junaid)
