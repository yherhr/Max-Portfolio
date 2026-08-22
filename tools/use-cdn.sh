#!/usr/bin/env bash
# Point the gallery at a CDN, or back at this repo.
#
#     ./tools/use-cdn.sh https://cdn.jsdelivr.net/gh/yherhr/mkm-media@main
#     ./tools/use-cdn.sh --local
#
# Writes img/gallery/cdn.txt, rebuilds the manifest, re-stamps the asset links,
# and checks that a sample of the generated URLs actually resolve — because a
# manifest full of 404s looks exactly like a broken gallery.
#
# NOTE ON jsDelivr: the /gh/ endpoint caps files at 20 MB and a whole repo at
# 50 MB. The optimised gallery is well inside that, but check before you assume
# the next batch is too.

set -euo pipefail
cd "$(dirname "$0")/.."

TARGET="${1:?usage: use-cdn.sh <base-url> | --local}"
CDNFILE="img/gallery/cdn.txt"
HEADER=$(sed -n '1,7p' "$CDNFILE" 2>/dev/null | grep '^#' || true)

if [[ "$TARGET" == "--local" ]]; then
  printf '%s\n' "$HEADER" > "$CDNFILE"
  echo "Serving locally from this repo."
else
  TARGET="${TARGET%/}"
  { printf '%s\n' "$HEADER"; echo; echo "$TARGET"; } > "$CDNFILE"
  echo "Base URL set to $TARGET"
fi

echo
./tools/build-gallery.sh | tail -n 4
./tools/stamp-assets.sh > /dev/null
echo "Asset links re-stamped."

# Verify a sample actually resolves. Only URLs under the base we just set —
# entries from remote.txt are deliberately hosted elsewhere and are not ours
# to validate here.
if [[ "$TARGET" == "--local" ]]; then
  echo
  echo "Gallery paths are local. Nothing to check."
  exit 0
fi

echo
echo "Checking a sample of generated URLs..."
mapfile -t urls < <(grep -o 'src: "[^"]*"' js/gallery-data.js \
                    | sed 's/src: "//; s/"$//' | grep -F "$TARGET" | head -4)
if [[ ${#urls[@]} -eq 0 ]]; then
  echo "  no URLs under $TARGET in the manifest — is img/gallery/ empty?"
  exit 1
fi
fail=0
for u in "${urls[@]}"; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$u" || echo 000)
  printf '  %s  %s\n' "$code" "$u"
  [[ "$code" == "200" ]] || fail=1
done
if [[ $fail -eq 1 ]]; then
  echo
  echo "Some URLs did not return 200. Usual causes:"
  echo "  - the media repo isn't pushed yet, or is private (jsDelivr needs public)"
  echo "  - the branch or tag in the URL doesn't exist"
  echo "  - the repo doesn't mirror the img/gallery/... path structure"
  echo "  - jsDelivr hasn't cached it yet — it can take a minute on first request"
  exit 1
fi
echo
echo "All good."
