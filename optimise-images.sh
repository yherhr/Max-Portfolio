#!/usr/bin/env bash
# Resize and compress camera originals for the web, into the gallery folders.
#
#   ./tools/optimise-images.sh <source-folder> <category>
#
#   ./tools/optimise-images.sh ~/Pictures/studio-shoot-aug studio
#   ./tools/optimise-images.sh ~/Pictures/acme-products    product
#
# Writes img/gallery/<category>/ at 2000px on the longest edge, quality 82,
# EXIF stripped. Then run ./tools/build-gallery.sh to pick them up.
#
# WHY THIS MATTERS MORE THAN ANY HOSTING DECISION
# A 6000px camera JPEG is roughly 8 MB. The gallery displays it at about 500px
# wide, so you're shipping something like 40x the pixels anyone can see. 500 MB
# of originals typically lands around 40-60 MB after this — which fits GitHub
# Pages comfortably and loads far faster. Do this before you decide where to
# host anything.
#
# Requires ImageMagick:  brew install imagemagick  /  sudo apt install imagemagick

set -euo pipefail
cd "$(dirname "$0")/.."

SRC="${1:?usage: optimise-images.sh <source-folder> <category>}"
CAT="${2:?usage: optimise-images.sh <source-folder> <category>}"
DEST="img/gallery/${CAT}"

command -v magick >/dev/null 2>&1 || MAGICK=convert
MAGICK="${MAGICK:-magick}"
command -v "$MAGICK" >/dev/null 2>&1 || { echo "ImageMagick not found. Install it first."; exit 1; }

mkdir -p "$DEST"

before=0; after=0; n=0

shopt -s nullglob nocaseglob
for f in "$SRC"/*.{jpg,jpeg,png,tif,tiff,heic}; do
  base=$(basename "${f%.*}")
  out="${DEST}/${base}.jpg"

  b=$(wc -c < "$f")
  "$MAGICK" "$f" -auto-orient -resize '2000x2000>' -strip \
            -sampling-factor 4:2:0 -interlace JPEG -quality 82 "$out"
  a=$(wc -c < "$out")

  before=$((before + b)); after=$((after + a)); n=$((n + 1))
  printf "  %-40s %6s KB -> %6s KB\n" "$base" "$((b/1024))" "$((a/1024))"
done
shopt -u nullglob nocaseglob

if [[ $n -eq 0 ]]; then
  echo "No images found in $SRC"
  exit 1
fi

echo
printf "%d images: %d MB -> %d MB" "$n" "$((before/1048576))" "$((after/1048576))"
[[ $before -gt 0 ]] && printf "  (%d%% smaller)" "$(( 100 - (after * 100 / before) ))"
echo
echo
echo "Next:  ./tools/build-gallery.sh"
