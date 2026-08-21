#!/usr/bin/env bash
# Which client sites will actually render inside an <iframe>?
# A site cannot be framed if it sends X-Frame-Options: DENY/SAMEORIGIN, or a
# Content-Security-Policy with a frame-ancestors directive that excludes us.
#
#   ./tools/check-embeds.sh
#
# The cards ship as screenshots (data-embed="poster"), which always works, so
# you do not need this to launch. Run it only if you want to switch a card to a
# live iframe: anything reported OK can safely take data-embed="live" on its
# .frame__view. Anything BLOCKED must stay a screenshot.

SITES=(
  "https://www.rokiovertime.com"
  "https://cmedetailing.net"
  "https://www.nutraviva.com.au"
  "https://yherhr.github.io/Krause_Photography/"
)

printf "%-46s %s\n" "SITE" "RESULT"
printf '%.0s-' {1..80}; printf '\n'

for url in "${SITES[@]}"; do
  headers=$(curl -sIL --max-time 15 -A "Mozilla/5.0" "$url" | tr -d '\r')
  xfo=$(grep -i '^x-frame-options:'  <<<"$headers" | tail -1 | cut -d' ' -f2-)
  csp=$(grep -i '^content-security-policy:' <<<"$headers" | grep -io 'frame-ancestors[^;]*' | tail -1)

  if [[ -n "$xfo" ]]; then
    printf "%-46s BLOCKED  (X-Frame-Options: %s)\n" "$url" "$xfo"
  elif [[ -n "$csp" ]]; then
    printf "%-46s BLOCKED  (CSP %s)\n" "$url" "$csp"
  elif [[ -z "$headers" ]]; then
    printf "%-46s UNREACHABLE\n" "$url"
  else
    printf "%-46s OK — leave data-embed=\"live\"\n" "$url"
  fi
done
