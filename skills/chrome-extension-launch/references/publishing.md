# Packaging and publishing

## Package

`assets/scripts/package.sh` → `dist/<name>-<version>.zip` with only `manifest.json`, `src/`, `icons/`. Check with `unzip -l`. `dist/` is gitignored. Send the zip to the user with the file-sending tool; they can't browse the scratch workspace.

Version: bump `manifest.version` above the live store version for every upload. Record it in CHANGELOG.md.

## Privacy policy and support pages (public gists)

The user's pattern (Switchit, Distract): each page is a **public gist** on `Dev-Muhammad-Junaid`, because product repos are private and would 404 for reviewers.

```bash
gh gist create PRIVACY.md --public -d "<Name> Privacy Policy"
gh gist create store/SUPPORT.md --public -d "<Name>: help and support"
curl -s -o /dev/null -w '%{http_code}' <url>   # expect 200
gh gist edit <id> -f PRIVACY.md PRIVACY.md    # to update later
```

- Privacy policy structure: `assets/extension/PRIVACY.example.md`. Title "Privacy Policy for <Name>", **Last Updated**, then 1 Data Collection and Usage, 2 Third-Party Services, 3 Data Security, 4 Changes, 5 Contact. Be precise about what is stored and where.
- Support page: `assets/extension/SUPPORT.example.md` (getting started, tips, troubleshooting, known limits, privacy link, contact email).
- Record both URLs in `store/listing.md`.

## Dashboard walkthrough

Dashboard URL shape: `https://chrome.google.com/u/<n>/webstore/devconsole/<publisher-id>/<item-id>/edit/<tab>`. Get `<n>` and the IDs from the user. The account is `dev.muhammadjunaid@gmail.com`.

Access:
- Claude in Chrome **cannot** script Web Store pages. Use the built-in browser pane: open the dashboard URL, pick the account in the chooser, then hand over to the user for the passkey or password.
- If that isn't possible, give the user paste-ready copy for every field in chat plus the files, in dashboard order.
- First-time publishers must register and pay a one-time $5 fee. The user does that.

Order and fields:
1. **Package**: upload the zip, confirm the draft version.
2. **Store listing**:
   - Description (≤16,000; aim for real explanation) and category (for example Productivity → Workflow & Planning). The title and summary come from the package.
   - Store icon, screenshots 1–5, small tile, marquee, and the promo video (a YouTube URL only).
   - Additional fields: Official URL = None (needs a Search Console-verified site); Homepage URL and Support URL = the support gist; Mature content = No.
   - Listing GA4: opt in unless the user says no (that's store metrics, not in-extension analytics).
3. **Privacy**: single purpose, justifications, remote code = No, data usage, privacy policy URL.
4. **Distribution**: Public, all regions, free (unless the user says otherwise).
5. **Stop.** Summarise what's filled and what's missing, then wait for an explicit "submit" before clicking **Submit for review**.

## Google Analytics (two different things)

1. **Store listing GA4** (dashboard → Store listing → Additional metrics → "Opt in to Google Analytics"). Chrome provisions the property, and every publisher member sees store-level (not user-level) metrics. Opt in on new items unless the user says no. Docs: https://developer.chrome.com/docs/webstore/metrics
2. **In-extension GA** (gtag inside the extension). Only if the product actually collects analytics, disclosed on the Privacy tab and in the description. Never add it without asking. Docs: https://developer.chrome.com/docs/extensions/how-to/integrate/google-analytics-4

## Dashboard gotchas

- The live listing stays on the previous version while a newer draft sits on Package.
- "Why can't I submit?" usually means a missing required field: a screenshot, the icon, a privacy answer or the description.
- If a dashboard file picker fails, open the asset folder in Finder and let the user drop the files in.

## Reporting after an upload

Tell the user, in this order:
1. The draft vs live version.
2. The zip path (and send the file if they can't open the folder).
3. The screenshot, tile and marquee files (sent, grouped by dashboard slot).
4. What they still need to paste, drop or do (sign-in, the $5 fee, the video URL).
5. That review was **not** submitted.

## After submission

- Review usually takes from a few hours to a few days. The Chrome Web Store link `https://chromewebstore.google.com/detail/<item-id>` resolves once the item is published.
- Replace `LINK` placeholders in `store/youtube.md` and `store/social.md`, and post the socials.
- For updates: bump the version, `package.sh`, upload on Package, update the listing if features changed, then submit (with the user's yes).
