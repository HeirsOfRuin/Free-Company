#!/usr/bin/env sh
# Package a static build for an itch.io HTML upload, and verify it.
#   sh make-itch-zip.sh BUILD_DIR OUT.zip
# e.g. sh make-itch-zip.sh dist release/mygame-itch.zip
#
# Rules learned shipping five games to itch:
#  - index.html must be at the ZIP ROOT. A zip of the folder will not run.
#  - Strip service-worker registration from the itch build (set a build flag)
#    unless you have measured you need it: a worker on itch's shared origin can
#    keep serving the old build after your next upload (Silk Road). The embed is
#    never installable anyway: browsers only install a top-level page.
#  - Then PLAY THE ZIP: unpack, serve over http, open it in a cross-origin
#    sandboxed iframe with storage blocked, and confirm the game still starts
#    (The Company was a black screen in exactly that frame).
set -e
BUILD="${1:?build dir}"
OUT="${2:?output zip}"
[ -f "$BUILD/index.html" ] || { echo "no index.html in $BUILD"; exit 1; }
mkdir -p "$(dirname "$OUT")"
ABS_OUT="$(cd "$(dirname "$OUT")" && pwd)/$(basename "$OUT")"
rm -f "$ABS_OUT"
( cd "$BUILD" && zip -q -r -X "$ABS_OUT" . -x '*.map' -x '.DS_Store' )
unzip -l "$OUT" | awk 'NR>3 && $4 != "" {print $4}' | grep -qx 'index.html' \
  || { echo "!! index.html is not at the zip root"; exit 1; }
if unzip -p "$OUT" index.html | grep -q "serviceWorker.register"; then
  echo "note: index.html still registers a service worker — intended for itch?"
fi
SIZE=$(wc -c < "$OUT")
echo "built $OUT ($SIZE bytes)"
unzip -l "$OUT" | tail -n +4 | head -n -2
