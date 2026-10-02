# App Store Connect

Drive `appstoreconnect.apple.com` with Claude in Chrome (one tab in the MCP group). The user signs in; never type their password. App ID URLs: `/apps/<AppleID>/distribution/…`.

## Driving the forms

- Most fields are React-controlled; `form_input` and plain clicks on `<select>` often don't stick. Set values with the native setter, then fire events:
  ```js
  const set = (el, v) => {
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
  };
  ```
  Field IDs on the version page: `promotionalText`, `description`, `keywords`, `supportUrl`, `marketingUrl`, `versionString`, `copyright`, `contactFirstName`, `contactLastName`, `contactPhone`, `contactEmail`, `notes`, `appStoreReviewDetails_demoAccountRequired`, release radios `MANUAL`/`AFTER_APPROVAL`/`SCHEDULED`.
- Custom dropdowns (price) need real clicks; dialogs shift layout, so re-screenshot before clicking coordinates.
- Pages load slowly. After `navigate` or `reload`, wait ~6 s, then read `document.body.innerText`. An empty result means it's still loading; retry.
- **Reload after saving and re-read the fields.** A save that fails validation can silently drop a whole section (review contact info did, until the phone number was filled).

## 1 · Create the app record

Apps → Add Apps (first app) or ＋ → New App:
- Platform **macOS**; **Company Name** appears only on the account's first app and is **permanent** (it's the developer name on the store): use the profile's developer name.
- Name ≤30 chars and globally unique. If "already being used", stop and **ask** with 3–4 fallbacks (`Brand: Benefit`, no third-party marks). Distract became "Distract: Feed Blocker".
- Primary language English (U.S.); Bundle ID `<bundle-prefix>.<name>` (registered by the first Xcode signing run); SKU `<name>-safari-mac`; User Access: Full.

## 2 · Version page (macOS App → 1.x Prepare for Submission)

- Screenshots: see store-assets.md (one at a time, in order; dismiss the "used for all Mac sizes" OK dialog).
- Promotional text (170), description (4,000, says it's a Safari extension, ends with the "not affiliated" line), keywords (100, comma-separated, no spaces, no third-party marks, no words already in the name), support URL (gist), marketing URL (profile website), version, copyright `<year> <copyright holder>`.
- Build: **Add Build** lists processed uploads. To swap, use **Delete** on the attached row (this only detaches it), then Add Build → pick → Done → Save.
- Sign-in required: **off** (unless truly needed). Contact: name, email, **phone with +country code** (required; ask the user to type it). Notes: exact reviewer steps (open the app, Open Safari Settings, tick it, open a logged-out site, allow access, click two blocks, what to expect).
- Release: **Manually release this version**.

## 3 · App Information

Subtitle (30, no other app names), primary category Productivity, secondary Utilities. **Content Rights** → Edit → "No, it does not contain, show, or access third-party content" (it changes the user's own view, like a content blocker). **Age Ratings** → Set Up: 7 steps of No/None; a loop that clicks the `false`/`NONE` radio for every question name and presses Next works. It ends at 4+, "Not Applicable" override; Save. Save the page.

## 4 · Pricing and Availability

Add Pricing → base country United States (USD) → Price → **$0.00** → Next → Next → Confirm. Set Up Availability → All Countries or Regions → Next → Confirm. The price can change any time later without review (paid needs the Paid Applications Agreement plus banking and tax; existing free users keep it free; consider the Small Business Program, 15%).

## 5 · App Privacy

Privacy Policy URL (the gist) → Save. Get Started → "No, we do not collect data from this app" → Save → **Publish** → Publish. It shows "Data Not Collected". It's only public once the app is live.

## 6 · Account-level, once

- **EU DSA**: Business → Digital Services Act. An LLC distributing apps is a **trader**; contact details (address, phone, email) are shown on EU product pages, so use business ones. Record in the profile once verified.
- Agreements: Free Apps is active. Paid needs the Paid Applications Agreement.

## 7 · Hand-off

Reload the version page and confirm: right build attached (number), 10 of 10 screenshots, all fields kept, **Add for Review** enabled. Then stop. The user clicks **Add for Review → Submit to App Review**, and later **Release**. Summarise what's set, what the reviewer will do, and the prepared replies.

## Status meanings

Prepare for Submission → Waiting for Review → In Review → Pending Developer Release (approved, manual release) → Ready for Distribution. "Rejected" / "Metadata Rejected" → read the Resolution Center message, answer from `review-check.md` or fix with a new build.
