#!/usr/bin/env sh
# Builds the upload for itch.io. itch requires index.html at the ZIP ROOT —
# a zip of the repo folder will not run. Nothing is minified or rewritten:
# the file uploaded is the file in the repo.
#   sh tools/make-itch-zip.sh
set -e
cd "$(dirname "$0")/.."
OUT="dist/the-company-itch.zip"
mkdir -p dist
rm -f "$OUT"
zip -q -X "$OUT" index.html manifest.webmanifest sw.js icons/icon-192.png icons/icon-512.png icons/maskable-512.png
echo "built $OUT"
unzip -l "$OUT"
