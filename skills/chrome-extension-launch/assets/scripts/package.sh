#!/bin/sh
# SKILL NOTE: zips only runtime files (manifest.json, src, icons). Adjust the list if the extension has more folders.
# Builds the Chrome Web Store upload: only the files the extension runs (no tools, store art or docs).
set -e
cd "$(dirname "$0")/.."
VERSION=$(node -p "require('./manifest.json').version")
mkdir -p dist
OUT="dist/distract-$VERSION.zip"
rm -f "$OUT"
zip -q -r -X "$OUT" manifest.json src icons -x '*.DS_Store'
echo "$OUT"
unzip -l "$OUT"
