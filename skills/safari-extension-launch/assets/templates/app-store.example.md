<!-- Example from Distract 1.2.0 (Safari build 3). Keep the structure; replace the product, sections, IDs and results. -->

# Mac App Store listing: Distract for Safari

Copy for App Store Connect. App: `safari/Distract.xcodeproj` (team <developer name>, `<TEAM_ID>`).
Screenshots: `store/assets/safari/{light,dark}/` (2880×1800, no alpha). Regenerate with `TARGET=safari node store/render.js`.

## App information

| Field | Value |
|---|---|
| Name (30) | Distract: Feed Blocker ("Distract" was taken) |
| Apple ID | <assigned by App Store Connect> |
| Subtitle (30) | Hide distracting page sections |
| Bundle ID | <bundle-prefix>.distract |
| SKU | distract-safari-mac |
| Primary category | Productivity |
| Secondary category | Utilities |
| Content rights | No, it does not contain, show or access third-party content |
| Age rating | 4+ (every questionnaire answer: None / No) |
| Price | Free, all territories |
| Copyright | <year> <copyright holder> |

URLs:
- Support: https://gist.github.com/<github-user>/<support-gist-id>
- Privacy policy: https://gist.github.com/<github-user>/<privacy-gist-id>
- Marketing: https://<your-site>/

## Version 1.2.0

**Promotional text (170):**
Click the parts of a page you don't want and they're gone. Feeds, short videos, suggestions and sidebars: hide them on the sites that eat your time.

**Keywords (100, no brand names):**
focus,productivity,distraction,hide,minimal,attention,detox,social,clean,declutter,calm,quiet

("feed" and "blocker" are already in the name, so they're left out.)

**Description:**
Distract turns the page you're on into a simple map of blocks. Click a block and that part of the site disappears. Click it again and it comes back.

Works on YouTube, X, Facebook and Instagram:
• YouTube: Shorts, the home feed, topic chips and shelves, Up next, comments, end cards, live chat, ads and the notification bell
• X: Trending, Today's news, Who to follow, promoted posts, Premium upsells, Grok, the composer and the timeline
• Facebook: Reels, Stories, suggested posts, the sponsored panel, friend requests, contacts, Marketplace and the shortcuts sidebar
• Instagram: Reels, Stories, sponsored and suggested posts, the right rail, notifications and the Messages pill

How it works
• Click the Distract button in Safari's toolbar. The popup draws the current page as a wireframe laid out like the real site.
• Hover a block to see that section outlined on the page. Hover a hidden one to peek at it.
• Colours tell you what a block is: blue for page areas, pink for feed clutter, amber for buttons.
• Pause Distract on any site with one switch, or bring everything back with "show all".
• Hiding Shorts opens Shorts links in the normal player. Hiding Up next centres the video.

Getting started
Open Distract once, then turn it on in Safari Settings → Extensions and allow it on the four sites.

Private by design
Distract has no account, no analytics and makes no network requests. Your choices stay in Safari.

Distract is not affiliated with or endorsed by Google, YouTube, X Corp., or Meta. Product names are used only to show which site a setting applies to.

**What's new:** First release for Safari.

**Screenshots (Mac, 2880×1800, up to 10):** upload all ten. Suggested order: light 1, dark 2, light 3, dark 4, light 5, then dark 1, light 2, dark 3, light 4, dark 5.

**App preview (optional):** skip for 1.2.0. The promo video is motion graphics rather than screen footage, which App Review often rejects as a preview. Link it from the marketing URL instead.

## App Privacy

- Data collection: **No, we do not collect data from this app.** The label shows "Data Not Collected".
- Tracking: none.

## Export compliance

`ITSAppUsesNonExemptEncryption = NO` is set in the app's Info.plist, so App Store Connect doesn't ask.

## App Review information

- Sign-in required: No
- Contact: <name> · <support email> · <phone, typed by the user>
- Notes:

> Distract is a Safari Web Extension. To test it:
> 1. Open the Distract app once, then click "Open Safari Settings" and tick Distract in Safari → Settings → Extensions.
> 2. Open https://www.youtube.com in Safari, click the Distract button in the toolbar and choose "Always Allow on This Website" (or use the "Allow on these sites" button in the popup).
> 3. The popup shows the page as blocks. Click "Shorts" or "Home feed" and that section disappears from YouTube. Click it again to bring it back.
> YouTube works without an account. The extension collects no data and makes no network requests.
