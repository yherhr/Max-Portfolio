#!/usr/bin/env bash
# Point the whole site at a different URL, in one command.
#
#   ./tools/set-site-url.sh https://yherhr.github.io/Max-Portfolio
#   ./tools/set-site-url.sh https://maxkmedia.com.au
#
# Rewrites canonical, og:url, og:image, twitter:image and the JSON-LD "url"
# fields across every .html, plus the Sitemap: line in robots.txt and every
# <loc> in sitemap.xml.
#
# Nothing else needs touching — all internal links and asset paths are
# depth-relative, so they already work at a domain root, on a GitHub Pages
# project sub-path, and from file:// locally.

set -euo pipefail
cd "$(dirname "$0")/.."

NEW="${1:?usage: set-site-url.sh https://example.com   (no trailing slash)}"
NEW="${NEW%/}"

# The base URL the files currently point at. Read it from index.html only —
# every other page's canonical ends in a filename, which would give us a page
# URL instead of the site root.
OLD=$(grep -m1 -o 'rel="canonical" href="[^"]*"' index.html \
      | sed 's/.*href="//; s/"$//; s#/$##')

if [[ -z "$OLD" ]]; then
  echo "Could not find an existing canonical URL to replace." >&2
  exit 1
fi

if [[ "$OLD" == "$NEW" ]]; then
  echo "Already set to $NEW — nothing to do."
  exit 0
fi

echo "  from : $OLD"
echo "    to : $NEW"
echo

count=0
for f in ./*.html robots.txt sitemap.xml; do
  [[ -f "$f" ]] || continue
  if grep -q "$OLD" "$f"; then
    # portable in-place edit (GNU sed and BSD/macOS sed disagree on -i)
    sed "s|${OLD}|${NEW}|g" "$f" > "$f.tmp" && mv "$f.tmp" "$f"
    printf "  updated  %s\n" "$f"
    count=$((count + 1))
  fi
done

echo
echo "Done — $count files updated."
echo "Now regenerate the sitemap so lastmod is current:  ./tools/build-sitemap.sh"
