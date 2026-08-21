#!/usr/bin/env bash
# Stamp css/js links with a content hash so browsers can't serve a stale
# stylesheet against newer HTML.
#
#     ./tools/stamp-assets.sh
#
# Rewrites, in every .html file:
#     css/mkm.css          ->  css/mkm.css?v=a1b2c3d4
#     js/mkm.js            ->  js/mkm.js?v=e5f6a7b8
#     js/gallery-data.js   ->  js/gallery-data.js?v=...
#
# The hash is of the file's own contents, so it only changes when the file
# does, and the browser re-fetches exactly then and no other time.
#
# WHY THIS EXISTS
# HTML and CSS deploy as separate files. A browser (or a CDN) that still holds
# the previous stylesheet will happily apply it to the new markup, and any rule
# added since renders unstyled — text dumps inline, icons render at their
# intrinsic size. It looks like a code bug and isn't one. Run this after any
# change to css/ or js/, before you commit.

set -euo pipefail
cd "$(dirname "$0")/.."

hash_of() {
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | cut -c1-8
  else
    sha256sum "$1" | cut -c1-8
  fi
}

ASSETS=(css/mkm.css js/mkm.js js/gallery-data.js)

for asset in "${ASSETS[@]}"; do
  [[ -f "$asset" ]] || { echo "skip  $asset (not found)"; continue; }
  v=$(hash_of "$asset")
  n=0
  # '|' is the alternation character, so it can't also be the sed delimiter.
  # '.' in the filename must be escaped or it matches any character.
  esc=$(printf '%s' "$asset" | sed 's/\./\\./g')
  for f in ./*.html; do
    [[ -f "$f" ]] || continue
    # strip any existing ?v=... then append the current one
    sed -E "s#([\"'])${esc}(\?v=[a-f0-9]+)?([\"'])#\1${asset}?v=${v}\3#g" \
        "$f" > "$f.tmp" && mv "$f.tmp" "$f"
    grep -q "${asset}?v=${v}" "$f" && n=$((n + 1))
  done
  printf "  %-22s v=%s  (%d files)\n" "$asset" "$v" "$n"
done

echo
echo "Stamped. Commit the HTML along with whatever you changed in css/ or js/."
