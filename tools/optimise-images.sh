#!/usr/bin/env bash
# The gallery loads full-size camera JPEGs from jsDelivr. Resizing the longest
# edge to 1600px typically cuts the payload by 70-80% with no visible change at
# the sizes the site actually displays.
#
#   ./tools/optimise-images.sh /path/to/original/photos
#
# Writes into img/. Then find-and-replace the CDN base URL with img/ in
# js/mkm.js (the CDN constant at the top) and in the four HTML files.

SRC="${1:?usage: optimise-images.sh <folder-of-originals>}"
mkdir -p img

command -v magick >/dev/null 2>&1 || { echo "ImageMagick not found — install it first."; exit 1; }

for f in "$SRC"/*.{jpg,JPG,jpeg,png,PNG}; do
  [ -e "$f" ] || continue
  out="img/$(basename "${f%.*}").jpg"
  magick "$f" -auto-orient -resize '1600x1600>' -strip -quality 80 "$out"
  printf "%-34s %s\n" "$(basename "$out")" "$(du -h "$out" | cut -f1)"
done
