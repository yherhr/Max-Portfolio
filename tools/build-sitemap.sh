#!/usr/bin/env bash
# Rebuild sitemap.xml from whatever .html files are actually in the repo.
#
#   ./tools/build-sitemap.sh
#
# This is the point of the script: your services/ folder holds ~204 pages. Rather
# than hand-maintaining that list, this walks the repo and writes them all out,
# so the sitemap can never drift from reality. Run it after adding pages, and
# again after ./tools/set-site-url.sh.
#
# 404.html is excluded (it's noindex). Priorities: home 1.0, top-level 0.9,
# everything nested 0.6.

set -euo pipefail
cd "$(dirname "$0")/.."

BASE=$(grep -ohm1 'rel="canonical" href="[^"]*"' index.html \
       | head -1 | sed 's/.*href="//; s/\/*"$//')
: "${BASE:?Could not read the canonical URL from index.html}"

TODAY=$(date +%F)
OUT=sitemap.xml

{
  echo '<?xml version="1.0" encoding="UTF-8"?>'
  echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
} > "$OUT"

emit() {
  local loc="$1" pri="$2"
  {
    echo '  <url>'
    echo "    <loc>${loc}</loc>"
    echo "    <lastmod>${TODAY}</lastmod>"
    echo "    <priority>${pri}</priority>"
    echo '  </url>'
  } >> "$OUT"
}

n=0

# home
emit "${BASE}/" "1.0"; n=$((n + 1))

# top-level pages
while IFS= read -r f; do
  f="${f#./}"
  [[ "$f" == "index.html" || "$f" == "404.html" ]] && continue
  emit "${BASE}/${f}" "0.9"; n=$((n + 1))
done < <(find . -maxdepth 1 -name '*.html' | sort)

# nested pages (services/, and anything else you add later)
while IFS= read -r f; do
  f="${f#./}"
  case "$f" in node_modules/*|tools/*) continue ;; esac
  emit "${BASE}/${f}" "0.6"; n=$((n + 1))
done < <(find . -mindepth 2 -name '*.html' -not -path './node_modules/*' | sort)

echo '</urlset>' >> "$OUT"

echo "Wrote $OUT — $n URLs, base ${BASE}, lastmod ${TODAY}"

if command -v python3 >/dev/null 2>&1; then
  python3 -c "import xml.dom.minidom,sys; xml.dom.minidom.parse('$OUT'); print('XML is valid')"
fi
