#!/usr/bin/env bash
# Generate responsive variants of every gallery image.
#
#     ./tools/build-thumbs.sh
#
# For img/gallery/<cat>/name.jpg (2000px) it writes:
#     img/gallery/<cat>/thumbs/name-400.jpg
#     img/gallery/<cat>/thumbs/name-800.jpg
#     img/gallery/<cat>/thumbs/name-1400.jpg
#
# build-gallery.sh picks these up and emits a srcset, so the browser downloads
# the size it actually needs instead of a 2000px file for a 190px phone tile.
#
# WHY
# The grid shows tiles at roughly 470px on a desktop and 190px on a phone. A
# 2000px original is ~4x oversampled on desktop and ~10x on mobile — which is
# most of why the gallery feels slow. The lightbox still gets the full 2000px
# file, because that's the one place the pixels are actually used.
#
# Existing variants are skipped, so re-running after adding photos only does
# the new ones. Requires ImageMagick.

set -euo pipefail
cd "$(dirname "$0")/.."

ROOT="img/gallery"
WIDTHS=(400 700 1000 1400)

MAGICK=magick
command -v magick >/dev/null 2>&1 || MAGICK=convert
command -v "$MAGICK" >/dev/null 2>&1 || { echo "ImageMagick not found. Install it first."; exit 1; }

[[ -d "$ROOT" ]] || { echo "No $ROOT folder."; exit 1; }

made=0; skipped=0; bytes=0

while IFS= read -r src; do
  dir=$(dirname "$src")
  base=$(basename "${src%.*}")
  mkdir -p "$dir/thumbs"
  ow=99999
  command -v identify >/dev/null 2>&1 && ow=$(identify -format '%w' "$src[0]" 2>/dev/null || echo 99999)
  for w in "${WIDTHS[@]}"; do
    # a variant at or above the original's width is just a second copy of it,
    # and produces a duplicate srcset descriptor
    if [[ "$w" -ge "$ow" ]]; then
      rm -f "$dir/thumbs/${base}-${w}.jpg"
      continue
    fi
    out="$dir/thumbs/${base}-${w}.jpg"
    if [[ -f "$out" && "$out" -nt "$src" ]]; then
      skipped=$((skipped + 1)); continue
    fi
    "$MAGICK" "$src" -auto-orient -resize "${w}x>" -strip \
              -sampling-factor 4:2:0 -interlace JPEG -quality 80 "$out"
    bytes=$((bytes + $(wc -c < "$out")))
    made=$((made + 1))
  done
done < <(find "$ROOT" -mindepth 2 -maxdepth 2 -type f \
           \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.webp' \) \
         | sort)

echo "  generated $made variants, skipped $skipped already current"
[[ $made -gt 0 ]] && echo "  $((bytes / 1024)) KB written"
echo
echo "Next:  ./tools/build-gallery.sh"
