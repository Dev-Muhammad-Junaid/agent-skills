<!-- Example from Distract 1.2.0 (Safari build 3). Keep the structure; replace the product, sections, IDs and results. -->

# Distract test plan

Run before every store submission (Chrome Web Store and Mac App Store). Every feature has a case; every case has an owner layer:

| Layer | What runs it | Covers |
|---|---|---|
| **A** WebKit (auto) | `node tools/webkit-test.js` | The real `zones.js` + `content.js` in Safari's engine on live YouTube, and the popup in every state, light and dark |
| **C** Chromium (auto) | `node tools/e2e.js`, `node tools/nesting-test.js` | The packaged extension end to end, nested-block hover |
| **L** Live signed-in (semi-auto) | `node tools/pack-test.js <platform>` pasted in signed-in tabs | Every zone's selector on X, Facebook and Instagram feeds that need an account |
| **S** Safari (guided) | A person clicks, the tester checks screenshots | Safari-only plumbing: site access, popup, messaging, storage, sound, the Mac app |

Results go in `store/safari/test-results-<version>.md`. A case passes only when its expected result was seen, not assumed.

## 1 · Mac app and install (S)

| ID | Steps | Expected |
|---|---|---|
| APP-01 | Open Distract.app with the extension off | Window: icon, "almost there. switch it on in safari.", three steps, blue button |
| APP-02 | Click **Open Safari Settings →** | Safari Settings opens on Extensions with Distract selected; the app quits |
| APP-03 | Tick Distract, reopen the app | "you're all set. open a feed." with a grey button |
| APP-04 | Switch macOS to dark / light | Window follows: dark canvas or warm canvas, readable text, no white flash |
| APP-05 | Drag the window by its background, close it | Moves; closing quits the app (no orphan Dock icon) |

## 2 · Site access (S, A for the screen)

| ID | Steps | Expected |
|---|---|---|
| ACC-01 | Fresh install, open youtube.com, click the toolbar icon | Popup shows "one more step. let distract in." with four site tiles and **Allow on these sites** |
| ACC-02 | Click **Allow on these sites** | Safari asks for permission; after allowing, the popup moves on (reload screen or the wireframe) |
| ACC-03 | Instead use Safari's own prompt: **Always Allow on This Website** | Same result for that site only |
| ACC-04 | Allow for One Day | Works today; tomorrow ACC-01 shows again |
| ACC-05 | Open an unsupported site (apple.com), click the icon | "nothing to hide here. open a feed." and the four sites with hidden counts; each link opens the site |
| ACC-06 | A supported tab that was open before install | "almost there. reload this tab." → **Reload tab** reloads it and closes the popup |

## 3 · Popup (A for rendering, S for behaviour in Safari)

| ID | Steps | Expected |
|---|---|---|
| POP-01 | Open on each site | Header: wordmark, site chip with the official logo, power switch |
| POP-02 | View tabs | Current view is selected with a blue dot; each tab shows its hidden count |
| POP-03 | Switch tabs | Wireframe changes to that view's layout; hover/peek only acts on the live view |
| POP-04 | Hover a block | Tooltip shows only the section name; the real section gets a blue outline on the page |
| POP-05 | Hover a hidden block | The section briefly reappears on the page (peek) and hides again on leave |
| POP-06 | Click a block | It turns hatched with an eye-off icon and strikethrough; falling blip sound; section disappears from the page immediately |
| POP-07 | Click it again | Back to normal; rising blip; section returns |
| POP-08 | Nested blocks (Shorts inside Home feed, Promoted inside Timeline, Stories/Feed inside Instagram Feed) | The inner block is reachable and clickable while the outer one is hovered |
| POP-09 | A section the page doesn't have | Block is dimmed; tooltip adds "· not on this page" |
| POP-10 | Footer | "N hidden on <site> · show all"; **show all** unhides every section on that site |
| POP-11 | Power switch off / on | Off: every section on that site shows, wireframe greys out; On: hiding resumes |
| POP-12 | Keyboard: Tab to a block, press Enter/Space | Same as a click; focus ring visible; tooltip shows on focus |
| POP-13 | Dark mode | Popup uses dark tokens, everything readable, hatching visible |
| POP-14 | Size in Safari | No scrollbars, nothing clipped, fits Safari's popover |

## 4 · Persistence and page behaviour (A, C, S)

| ID | Steps | Expected |
|---|---|---|
| PER-01 | Hide a section, reload the page | Still hidden, with no flash of it while loading (document_start CSS) |
| PER-02 | Quit and reopen Safari | Choices kept |
| PER-03 | Open the site in a new tab | Choices apply there too |
| PER-04 | Two tabs of the same site, change a choice in one | The other tab updates without reload |
| PER-05 | YouTube: home → watch → home without reloading | Hiding follows the page; popup opens on the right view |
| PER-06 | Pause one site | Other sites keep hiding |
| PER-07 | Scroll a long feed with sections hidden | Smooth; newly loaded posts are hidden too (ads, suggested, Shorts shelves) |

## 5 · Every section, every site (A for YouTube, L + S for X, Facebook, Instagram)

Each row: hide it → gone from the page, nothing bigger disappears with it; show it → back exactly as before.

**YouTube** (home, watch, other pages)

| ID | Section | Where to look | Special |
|---|---|---|---|
| YT-01 | Sidebar | Home, Subscriptions | Content re-centres, no empty gutter |
| YT-02 | Topic chips | Home | |
| YT-03 | Home feed | Home | "Feed hidden · search for what you came for." message |
| YT-04 | Shorts | Home shelf, sidebar entry, search results | `/shorts/ID` opens as `/watch?v=ID` |
| YT-05 | Topic shelves | Home | |
| YT-06 | Ads & promos | Home, watch | |
| YT-07 | Notifications | Masthead bell | |
| YT-08 | Up next | Watch | Player centres; live chat still shows on live streams |
| YT-09 | Comments | Watch | |
| YT-10 | Live chat | A live stream | |
| YT-11 | End cards | Last 20 s of a video | |

**X** (home, other pages)

| ID | Section | Special |
|---|---|---|
| X-01 | Explore (nav) | |
| X-02 | Notifications (nav) | |
| X-03 | Grok (nav and drawer) | |
| X-04 | Premium upsells | Nav item and sidebar card |
| X-05 | Live on X | Sidebar card only |
| X-06 | Today's news | Sidebar card only |
| X-07 | Trending | Sidebar card only, not the whole sidebar |
| X-08 | Who to follow | Sidebar and in-timeline module |
| X-09 | Composer | Home only |
| X-10 | Timeline | Home only |
| X-11 | Promoted posts | Only posts labelled Ad |

**Facebook** (home, other pages)

| ID | Section | Special |
|---|---|---|
| FB-01 | Reels | Feed reels unit and nav |
| FB-02 | Marketplace | Nav |
| FB-03 | Shortcuts | Left column |
| FB-04 | Composer | |
| FB-05 | Stories | |
| FB-06 | News feed | Composer and stories stay unless hidden separately |
| FB-07 | Suggested | "Suggested for you" units |
| FB-08 | Sponsored | Right-rail ads (feed ads: known limit) |
| FB-09 | Friend requests | Right rail |
| FB-10 | Contacts & chats | Right rail |
| FB-11 | Chat bubble | New-message button |

**Instagram** (home, other pages)

| ID | Section | Special |
|---|---|---|
| IG-01 | Reels | Nav |
| IG-02 | Notifications | Nav |
| IG-03 | Also from Meta | Threads link |
| IG-04 | Stories | Home tray |
| IG-05 | Feed | Home |
| IG-06 | Sponsored | Posts labelled Ad / Sponsored |
| IG-07 | Suggested | Suggested posts and accounts |
| IG-08 | Right rail | Home |
| IG-09 | Messages pill | Bottom-right |

## 6 · Safety and privacy (A, C, S)

| ID | Check | Expected |
|---|---|---|
| SAFE-01 | Unsupported sites | No `distract-style`, no `data-dx` attributes, nothing hidden |
| SAFE-02 | Console | No errors from Distract on any supported page or the popup |
| SAFE-03 | Network | The extension makes no requests of its own (privacy label: Data Not Collected) |
| SAFE-04 | Everything shown (show all + power on) | Page identical to having no extension |
| SAFE-05 | Disable or uninstall | Sites return to normal after reload |

## 7 · App Review run-through (S)

| ID | Check | Expected |
|---|---|---|
| REV-01 | Follow the App Review notes word for word on a clean Safari profile, logged out | Every step works as written; YouTube needs no account |
| REV-02 | Description claims | Each listed section on each site verified in section 5 |
| REV-03 | Screenshots | Match the shipped popup (labels, colours, layout) |
| REV-04 | Privacy | SAFE-03 passes; privacy policy URL loads |
| REV-05 | Support and marketing URLs | Both load |
| REV-06 | App launch and quit | No crash, no hang, no permission prompts besides Safari's |

## Known limits (documented, not failures)

- Facebook scrambles the "Sponsored" label inside feed posts; only right-rail ads are hidden.
- Some rules read English labels ("Who to follow", "Stories"). Other interface languages may miss those sections.
- Sites change their markup. A failing L case means updating `src/zones.js`, then re-running A, C and L.
