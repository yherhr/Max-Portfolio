#!/usr/bin/env bash
# Every local image reference in the HTML and the gallery manifest must exist.
#
#     ./tools/check-images.sh
#
# A missing <img src> fails silently — the browser draws nothing and the layout
# just looks empty. This is how two hero images pointed at "-1400" variants that
# were never generated (the originals were only 1333px wide, so build-thumbs
# correctly skipped that size) and nobody noticed.
#
# img/work/*.jpg are reported separately: those are client screenshots and are
# expected to be absent until captured — the cards fall back deliberately.

set -euo pipefail
cd "$(dirname "$0")/.."

broken=0; posters=0; ok=0

while IFS= read -r ref; do
  if [[ -f "$ref" ]]; then
    ok=$((ok + 1))
  elif [[ "$ref" == img/work/* ]]; then
    printf '  pending   %s   (client screenshot)\n' "$ref"
    posters=$((posters + 1))
  else
    printf '  BROKEN    %s\n' "$ref"
    broken=$((broken + 1))
  fi
done < <(grep -hoE '["'"'"'(][^"'"'"'()[:space:]]+\.(jpg|jpeg|png|webp|svg|ico)["'"'"')]' \
           ./*.html js/gallery-data.js 2>/dev/null \
         | sed -E 's/^["'"'"'(]//; s/["'"'"')]$//' \
         | grep -v '^http' | grep -v '^data:' | sort -u)

echo
echo "$ok resolve, $posters pending screenshots, $broken broken."
[[ $broken -gt 0 ]] && { echo "Broken references render as nothing. Fix before deploying."; exit 1; }
exit 0
