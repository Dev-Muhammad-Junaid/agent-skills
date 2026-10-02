# Xcode wrapper, signing, container app, builds

Needs Xcode (check `xcode-select -p`, `xcrun --find safari-web-extension-converter`, `xcodebuild -version`). Work on a `safari` branch; the project lives in `safari/` in the same repo and **references** `manifest.json`, `src/` and `icons/` in place, so there is one source for both browsers.

## 1 · Check signing

```bash
security find-identity -v -p codesigning            # look for valid (not REVOKED) identities
defaults read com.apple.dt.Xcode IDEProvisioningTeamByIdentifier | grep -E "teamID|teamName"
```
Find the team ID for the profile's team in that list. Automatic signing + `-allowProvisioningUpdates` registers the bundle IDs and creates the Mac Team (dev) and Mac Team Store (distribution) profiles and the "3rd Party Mac Developer Installer" certificate on first export.

## 2 · Convert

```bash
git checkout -b safari
xcrun safari-web-extension-converter . --project-location safari --app-name <Name> \
  --bundle-identifier <bundle-prefix>.<name> --macos-only --swift --no-open --no-prompt --force
```
Then run the cleaner from the repo root:
```bash
python3 <skill>/assets/scripts/clean-converter-project.py --name <Name> --team <TEAM_ID> \
  --bundle <bundle-prefix>.<name> --version 1.2.0 --build 1 --category productivity
```
It flattens `safari/<Name>/…` to `safari/`, keeps only `manifest.json`, `src`, `icons` as extension resources (the converter adds **every** top-level item, including store videos and `safari/` itself), fixes the relative paths without touching runpaths, lower-cases the app bundle ID (the converter capitalises it), sets `DEVELOPMENT_TEAM`, `MARKETING_VERSION`, `CURRENT_PROJECT_VERSION`, `MACOSX_DEPLOYMENT_TARGET = 12.0`, the copyright, `LSApplicationCategoryType`, and `ITSAppUsesNonExemptEncryption = NO`, and removes the template's user-selected-files entitlement. It leaves the app's outgoing-network entitlement, which the template sets for its WKWebView window. Removing it hasn't been tested, so test the window first if you do.

Add `build/` to `.gitignore`.

## 3 · Container app (Canvas)

Copy `assets/container-app/` over the generated files:
- `Main.html`, `Style.css`, `Script.js` → `safari/<Name>/Resources/` (`Main.html` into `Base.lproj/`)
- `ViewController.swift` → `safari/<Name>/` (transparent title bar, canvas-coloured window, `show(isEnabled)`)
- Storyboard window size: replace `width="425" height="325"` with `width="460" height="500"` (3 places).

States: off/unknown = "almost there. switch it on in safari." + three numbered steps + blue **Open Safari Settings →**; on = "you're all set. open a feed." + grey button. The button calls `SFSafariApplication.showPreferencesForExtension` and quits (Apple's template behaviour).

## 4 · macOS icon

```bash
node <chrome-skill>/assets/scripts/icons.js mac /tmp/mac-1024.png   # tile on Apple's 1024 grid + soft shadow
SET=safari/<Name>/Assets.xcassets/AppIcon.appiconset
for s in 16 32 128 256 512; do sips -z $s $s /tmp/mac-1024.png --out $SET/mac-icon-$s@1x.png; d=$((s*2)); \
  [ $d = 1024 ] && cp /tmp/mac-1024.png $SET/mac-icon-$s@2x.png || sips -z $d $d /tmp/mac-1024.png --out $SET/mac-icon-$s@2x.png; done
sips -z 256 256 /tmp/mac-1024.png --out safari/<Name>/Resources/Icon.png
```
Look at the 1024 render before using it.

## 5 · Debug build and registration

```bash
cd safari && xcodebuild -project <Name>.xcodeproj -scheme <Name> -configuration Debug \
  -derivedDataPath ../build/safari -allowProvisioningUpdates build | grep -E "error:|BUILD"
open ../build/safari/Build/Products/Debug/<Name>.app          # registers the extension with Safari
pluginkit -m -v -A -D -i <bundle-prefix>.<name>.Extension  # must list exactly ONE path
```
- Dev-signed builds appear in Safari → Settings → Extensions without "Allow Unsigned Extensions".
- Check the bundle: `ls "<App>.app/Contents/PlugIns/<Name> Extension.appex/Contents/Resources"` → `icons manifest.json src` only.
- After every change: bump `CURRENT_PROJECT_VERSION`, rebuild, relaunch the app, and have the user quit and reopen Safari. Safari shows only the marketing version, so track builds yourself (`plutil -extract CFBundleVersion raw …/Info.plist`).

## 6 · Archive, export, upload

```bash
xcodebuild -project <Name>.xcodeproj -scheme <Name> -configuration Release -derivedDataPath ../build/safari \
  -archivePath ../build/safari/<Name>-b<N>.xcarchive -allowProvisioningUpdates archive
# the archive's intermediate app registers a second extension copy: remove it
pluginkit -r "../build/safari/Build/Intermediates.noindex/ArchiveIntermediates/<Name>/InstallationBuildProductsLocation/Applications/<Name>.app/Contents/PlugIns/<Name> Extension.appex"
rm -rf ../build/safari/Build/Intermediates.noindex/ArchiveIntermediates
# verify the shipped code is the fixed code
grep -c "<marker of latest fix>" "../build/safari/<Name>-b<N>.xcarchive/Products/Applications/<Name>.app/Contents/PlugIns/<Name> Extension.appex/Contents/Resources/src/content.js"
codesign -d --entitlements - --xml "<archive app>" | plutil -p -     # only what's needed (sandbox)
xcodebuild -exportArchive -archivePath ../build/safari/<Name>-b<N>.xcarchive -exportPath ../build/safari/upload-b<N> \
  -exportOptionsPlist ../build/safari/ExportOptions.plist -allowProvisioningUpdates
```
`ExportOptions.plist` (`assets/scripts/`) uses `method app-store-connect`, `destination upload`. Use `destination export` first if you only want the signed `.pkg` to inspect (`pkgutil --check-signature`). The upload needs the App Store Connect record to exist (bundle ID selectable). Processing takes ~10–30 minutes before the build can be attached.

## 7 · Versions

- Bump `manifest.json` `version` and `MARKETING_VERSION` together; Chrome and Safari share the version.
- `CURRENT_PROJECT_VERSION` (build) must increase on every upload. Never reuse.
