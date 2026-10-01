# Promo video, YouTube and social cuts

## Approach: a deterministic timeline, not screen recording

The video is an HTML page (`assets/video/promo.example.html`) where `window.seek(t)` poses the whole frame as a pure function of time. `render-video.js` calls `seek(i/FPS)`, screenshots each frame and pipes the PNGs into ffmpeg. Every frame is exact: no dropped frames, no timing jitter, and any moment is reproducible (`promo.html?t=12` freezes it; opening it without params plays it live).

Building blocks in the example:
- Easing (`E.out`, `E.inOut`, `E.expo`, `E.back`), `prog(t, a, b)`, `env()` in/out envelopes, and `along(stops, t)` for eased cursor paths.
- Scenes with time windows in `S`. Hide scenes with **`display: none`**, never `visibility` (a visible child shows through a hidden parent).
- **The real UI in iframes** (`tools/popup-test.html?bare=1…`), enlarged with CSS `zoom`. `pose(frame, {hidden, hover, paused})` drives state through the popup's own `state` and `render()`. Inject `*{transition:none;animation:none}` into each iframe so frames never catch a half-finished transition.
- `blockCenter(frame, zone)` maps a block inside a zoomed or transformed iframe to stage coordinates, for the cursor and click ripples.
- Word-by-word caption rises (`captionWords`), a brand-pill wipe transition, a click ripple and press-scale on the cursor.

## Every extension gets its own film (read this before storyboarding)

The first Switchit cut reused Distract's storyboard, pill wipes and blip sounds, and skipped what the product actually does. The user's verdict: information missed out, and "it seems to copy exactly what Distract does". So:

1. **Read the product before the storyboard.** Open the main UI component and the provider/content code and list every state: loading, discovery ("Finding accounts…"), in-progress work (spinners while access is checked), results, automatic choices (Switchit highlights the one account with access), settings/edit mode, per-site extras (YouTube "Choose", Notion "Add account"), keyboard paths (Alt+L, number keys, search + Enter). Each state that matters gets screen time, and the real UI shows it (frame modes, `spin` for spinners).
2. **Show cause and effect.** Key press → overlay; spinners → results → auto-pick; Enter → page reloads → URL and header avatar change. Small callouts name what the UI is doing ("checking each account…", "Casey can open it, so it's picked").
3. **Own motion language, derived from the product's UI.** Never reuse another extension's transitions. Switchit's: captions type like the search field and the accent line rolls like a list landing; presses pulse the pressed element's outline. Distract's: brand pills wiping, word rises.
4. **Own sound palette.** Distract: pad, 120 bpm pulse, falling blips. Switchit: plucked arpeggio at 112 bpm, two-tone toggle per switch, a scanner tick while checking that resolves into chimes, bubble pops per discovered account. Write a new `soundtrack.js` per product; keep only the cue mechanism.
5. **No title cards between parts.** A full-screen chapter card (Switchit's first rebuild had a rising band with a number) reads as dead frames; the user asked to remove it. Cut straight into the next feature with a short dip (out 0.2 s, in 0.25 s) and make sure the next part's content starts at the cut, not half a second later.
6. **Length follows features.** One-trick extension: about 30 s. Several features (Switchit): 45–50 s with brisk beats (0.2–0.6 s steps), which also allows YouTube chapters.
7. **The vertical cut is its own layout,** not the landscape scaled down: the UI at about 90 % of the width (zoom ≈ 2.0 for a 480 px overlay), captions 86–92 px, callouts under the UI (or above it when there's no room), key caps under the callout, everything between 230 and 1,600 px. The user rejected the first Reels cut as "zoomed out".

## Distract's brief (an example of the shape, not a template)

| Time | Scene | Beats |
|---|---|---|
| 0–3 s | Intro | Brand pills slide in and fold into the icon (back-ease pop), the wordmark rises letter by letter, the accent dot drops with a bounce, the tagline fades up |
| 3–6 s | Problem | Headline "your feed is full of detours."; the problem words pop in as chips and drift; a pill wipe clears them |
| 6–13 s | Hero demo | A browser mock of the target site; the real popup drops from the toolbar icon; the cursor clicks three blocks and the page reacts each time (sections collapse, the grid reflows); then a hover draws the on-page outline |
| 13–19 s | Breadth | A carousel of the real popup on each supported site; each hides something as it passes the centre; platform names highlight in sync |
| 19–23 s | Themes and control | A circular wipe from light to dark; the cursor toggles the power switch |
| 23–26 s | Trust | "private by design." plus three badges |
| 26–30 s | Outro | Icon + wordmark, "free on the Chrome Web Store", platforms line, brand pills; fade out |

Style: Canvas tokens, big lowercase display captions, ease-out entrances with ease-in exits, 0.07 s word staggers, nothing linear, no hard cuts except the wipes.

## Cues: one list, owned by the timeline

`promo.html` publishes `window.CUES` (clicks, keys, types, enter, pops, ticks, access, whooshes, pause; `clickTone: 'down'` for hide blips) and `window.COVER_T`. `render-video.js` reads them and passes them to `soundtrack.js`, so moving a beat in the timeline moves its sound too. Define beat constants once (`DEMO_CLICK = 10.3`) and use them in both the scene code and `CUES`.

Per-frame singletons (callout, pulse, key caps) are reset once at the top of `seek()`; helper calls only ever show them. A helper that hides when out of range breaks the moment a second call for another time window runs in the same frame.

An element you roll or move with `transform` must not be `display: inline` (a bare `<span>`): inline boxes ignore transforms, so the roll silently never happens.

Pose real-UI frames only when their props change (`JSON.stringify(props)` as a cache key); a flushSync re-render per frame for 8 iframes is wasted time.

## QA before the full render

1. `STILLS=1 node store/video/render.js` writes `out/stills-landscape.jpg` and `out/stills-vertical.jpg` (a frame every 0.5 s). `STILLS=1 TIMES=8.1,10.3 …` writes full-size frames for a close look. Gitignore `out/*.jpg`.
2. Check for leaked elements between scenes, overlapping cards, labels cut off, and the cursor landing on the right block.
3. After rendering, sample the MP4 (`fps=0.5,tile=5x3`), look at a transition strip (`-ss 5.3 -t 1.5 -vf fps=5,tile=4x2`), and check audio with `-af volumedetect` (target: mean about −20 dB, peak about −1.5 dB). Normalise the WAV to about −2 dBFS (`0.79 / peak`): AAC overshoots, and −1 dBFS came out at 0.0 dB peak.

## Render (assets/video/render-video.js)

- Default: landscape 1920×1080 at 1×, `libx264 -preset slow -crf 14`, 30 fps. That's the YouTube and store cut, rendered in about 1 minute.
- `SOCIAL=1`: vertical 1080×1920 **and** landscape, captured at `deviceScaleFactor: 2`, downscaled in ffmpeg with `scale=W:H:flags=lanczos:out_color_matrix=bt709`, `-tune animation`, BT.709 tags, AAC at 320k. About 2.5 min per format. Visibly crisper.
- Optional 4K master (3840×2160) for YouTube's higher bitrate tier: same pipeline at 2× without the downscale. Ask first; it takes minutes and the user may not need it.
- The soundtrack (`soundtrack.js`) is synthesised: a four-chord pad, a soft 120 bpm pulse, whooshes on wipes, and the extension's own hide blip on every click. **Update the cue arrays whenever the timeline changes.** It also writes a silent cut for the user's own music.

## Vertical layout (`?format=vertical`)

- A layout table `L` holds every position that differs between formats (caption top, window and popup placement, carousel spacing and zoom, badge positions, chip positions). CSS overrides go under `html[data-format="vertical"]`.
- Reels safe zone: keep text and UI between about 230 and 1,600 px of 1,920. Top is the account header, bottom is the caption and buttons, right edge is the action buttons.
- Make the UI bigger for phones (popup zoom 1.5–1.6) and the captions about 80 px.

## YouTube upload copy (store/youtube.md)

- **Title** (≤100; the first ~60 characters matter): "<Name>: <Main benefit with top keywords> | Chrome Extension".
- **Description**: what it does, a store link near the top, how it works, what it hides/does per platform, why people use it, privacy, "In this video" timestamps, privacy and support links, feedback email, disclaimer, and 3 hashtags at the end (they show above the title).
- Timestamps: a video under 30 s can't have chapters (needs ≥3 chapters of ≥10 s). Start the list at 0:03, not 0:00, so they stay plain links.
- **Tags** ≤500 characters in total: the product name plus real search phrases ("hide youtube shorts", "block instagram reels", "distraction blocker", "digital wellbeing").
- Settings: not made for kids, Science & Technology, English, Public (Unlisted is fine for the store field), an end screen over the outro, and a pinned comment with the store link.
- Paste the YouTube URL into the dashboard's Promo video field.

## Social posts (store/social.md)

| File | Where |
|---|---|
| `social/<name>-reels-1080x1920.mp4` | Instagram Reels, Facebook Reels, X (vertical), YouTube Shorts, TikTok |
| `social/<name>-landscape-1920x1080.mp4` | X, Facebook, LinkedIn feeds |
| `social/reels-cover-1080x1920.png` | Reels cover, written by the `SOCIAL=1` render at `window.COVER_T` (the finished intro lockup, which survives the 3:4 grid crop) |

Captions: open with the headline line ("your feed, minus the detours."), then 2–3 short lines, the privacy line, and the call to action.
- **Instagram:** link in bio, 3–5 hashtags.
- **Facebook:** the link inline.
- **X:** ≤280 characters including the link (23 characters counted); pin it for launch week.
- **LinkedIn:** a builder story in the first person.

Replace `LINK` once the store listing is live. For an extension that's already published, put the real store link in from the start (find it with a web search for the listing name).
