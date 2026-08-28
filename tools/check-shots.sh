#!/usr/bin/env bash
# Which client cards are still missing their screenshot?
#
#     ./tools/check-shots.sh
#
# Cards look for img/work/<slug>.jpg. A missing file isn't an error — the card
# falls back to a name-and-domain panel — but it's the difference between a
# portfolio that shows the work and one that describes it.

set -euo pipefail
cd "$(dirname "$0")/.."

# slugs come from the markup, so this can't drift from what the cards look for
mapfile -t slugs < <(grep -ho 'img/work/[a-z0-9-]*\.jpg' ./*.html \
                     | sed 's|img/work/||; s|\.jpg||' | sort -u)

if [[ ${#slugs[@]} -eq 0 ]]; then
  echo "No client cards found."
  exit 0
fi

have=0; miss=0
for s in "${slugs[@]}"; do
  if [[ -f "img/work/${s}.jpg" ]]; then
    printf '  ok       %-26s %s KB\n' "$s" "$(( $(wc -c < "img/work/${s}.jpg") / 1024 ))"
    have=$((have + 1))
  else
    printf '  MISSING  %s\n' "$s"
    miss=$((miss + 1))
  fi
done

echo
echo "$have of $((have + miss)) cards have a screenshot."
if [[ $miss -gt 0 ]]; then
  echo
  echo "To fill them:"
  echo "  npm i -D playwright && npx playwright install chromium"
  echo "  node tools/shots.mjs"
  echo
  echo "Or drop your own in img/work/ with those exact filenames — roughly 16:10,"
  echo "at least 1440px wide. Cards crop from the top."
fi
