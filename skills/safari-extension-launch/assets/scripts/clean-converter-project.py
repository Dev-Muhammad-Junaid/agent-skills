#!/usr/bin/env python3
"""Tidy the project that `xcrun safari-web-extension-converter . --project-location safari` creates.

Run from the extension repo root, right after the converter:
  python3 clean-converter-project.py --name Distract --team <TEAM_ID> \
      --bundle com.yourcompany.distract --copyright "© 2026 Your Company LLC" --version 1.2.0 --build 1 --category productivity

What it does
- Flattens safari/<Name>/{<Name>.xcodeproj,<Name>,<Name> Extension} to safari/.
- Keeps only the web extension's runtime files as resources (default: manifest.json, src, icons).
  The converter adds every top-level item of the repo, including store assets and safari/ itself.
- Rewrites the resource paths for the flatter layout (file references only, never runpaths).
- Lower-cases the app bundle ID (the converter capitalises it) and sets team, versions, deployment
  target, copyright, App Store category and ITSAppUsesNonExemptEncryption = NO.
- Drops the template's user-selected-files entitlement (the app never opens files).
"""
import argparse, os, re, shutil, sys

ap = argparse.ArgumentParser()
ap.add_argument('--name', required=True)
ap.add_argument('--team', required=True)
ap.add_argument('--bundle', required=True, help='app bundle id, e.g. com.yourcompany.distract')
ap.add_argument('--version', required=True)
ap.add_argument('--build', default='1')
ap.add_argument('--category', default='productivity', help='public.app-category.<this>')
ap.add_argument('--copyright', required=True, help='e.g. "© 2026 Your Company LLC"')
ap.add_argument('--keep', default='manifest.json,src,icons')
ap.add_argument('--min-macos', default='12.0')
a = ap.parse_args()

base = 'safari'
nested = os.path.join(base, a.name)
proj_dir = os.path.join(base, f'{a.name}.xcodeproj')

# 1. Flatten (the app folder has the same name as its parent, so go through a temp name).
if os.path.isdir(os.path.join(nested, f'{a.name}.xcodeproj')):
    tmp = os.path.join(base, '__converter_tmp')
    os.rename(nested, tmp)
    for item in os.listdir(tmp):
        shutil.move(os.path.join(tmp, item), os.path.join(base, item))
    os.rmdir(tmp)
    print('flattened into safari/')

pbx = os.path.join(proj_dir, 'project.pbxproj')
if not os.path.exists(pbx):
    sys.exit(f'not found: {pbx}')
s = open(pbx).read()

# 2. Drop file references to repo items that aren't extension runtime files.
keep = set(a.keep.split(','))
drop = set()
for m in re.finditer(r'^\s*([0-9A-F]{24}) /\* (.+?) \*/ = \{isa = PBXFileReference;[^\n]*path = (\.\./)+([^;]+);', s, re.M):
    ref_id, name, _, target = m.group(1), m.group(2), m.group(3), m.group(4).strip('"')
    if target in ('..', '../..') or target.split('/')[-1] not in keep:
        drop.add(ref_id)
for m in re.finditer(r'^\s*([0-9A-F]{24}) /\* [^*]+ \*/ = \{isa = PBXBuildFile; fileRef = ([0-9A-F]{24})', s, re.M):
    if m.group(2) in drop:
        drop.add(m.group(1))
lines = [l for l in s.split('\n') if not any(l.strip().startswith(d) for d in drop)]
s = '\n'.join(lines)
print(f'removed {len(drop)} non-extension references')

# 3. One directory less between the project and the repo root: fix file-reference paths only.
s = '\n'.join(
    re.sub(r'path = \.\./\.\./\.\./', 'path = ../../', l) if 'isa = PBXFileReference' in l else l
    for l in s.split('\n'))

# 4. Settings.
s = re.sub(r'PRODUCT_BUNDLE_IDENTIFIER = [^;]+\.Extension;', f'PRODUCT_BUNDLE_IDENTIFIER = {a.bundle}.Extension;', s)
s = re.sub(r'PRODUCT_BUNDLE_IDENTIFIER = (?![^;]*\.Extension;)[^;]+;', f'PRODUCT_BUNDLE_IDENTIFIER = {a.bundle};', s)
if 'DEVELOPMENT_TEAM' not in s:
    s = s.replace('CODE_SIGN_STYLE = Automatic;', f'CODE_SIGN_STYLE = Automatic;\n\t\t\t\tDEVELOPMENT_TEAM = {a.team};')
s = re.sub(r'MARKETING_VERSION = [^;]+;', f'MARKETING_VERSION = {a.version};', s)
s = re.sub(r'CURRENT_PROJECT_VERSION = [^;]+;', f'CURRENT_PROJECT_VERSION = {a.build};', s)
s = re.sub(r'MACOSX_DEPLOYMENT_TARGET = [^;]+;', f'MACOSX_DEPLOYMENT_TARGET = {a.min_macos};', s)
s = re.sub(r'INFOPLIST_KEY_NSHumanReadableCopyright = [^;]*;', f'INFOPLIST_KEY_NSHumanReadableCopyright = "{a.copyright}";', s)
app_marker = f'INFOPLIST_KEY_CFBundleDisplayName = {a.name};'
if 'LSApplicationCategoryType' not in s:
    s = s.replace(app_marker, app_marker
                  + '\n\t\t\t\tINFOPLIST_KEY_ITSAppUsesNonExemptEncryption = NO;'
                  + f'\n\t\t\t\tINFOPLIST_KEY_LSApplicationCategoryType = "public.app-category.{a.category}";')
s = re.sub(r'\n\t+ENABLE_USER_SELECTED_FILES = [^;]+;', '', s)
open(pbx, 'w').write(s)

# 5. Report.
left = re.findall(r'name = ([^;]+); path = \.\./\.\./([^;]+);', s)
print('extension resources:', ', '.join(sorted({p for _, p in left})))
print('team refs:', s.count(f'DEVELOPMENT_TEAM = {a.team}'), '· bundle:', a.bundle)
bad = re.findall(r'"@executable_path/[^"]*"', s)
print('runpaths:', sorted(set(bad)))
