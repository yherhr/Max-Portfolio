# Install client screenshots captured by Claude in Chrome.
#
#   From the repo root:   .\tools\import-shots.ps1
#
# Claude in Chrome writes screenshots to your Windows temp folder, which the
# assistant can't read back - this is the bridge.
#
# It finds the capture folder, lists what's in it, proposes a mapping and asks
# you to confirm before copying. Filenames don't matter, so re-captures and
# discarded shots are fine.

$ErrorActionPreference = 'Stop'

$Slugs = @('rokiovertime','cme-detailing','bx-realty','nutraviva')
$Dest  = Resolve-Path (Join-Path $PSScriptRoot '..\img\work')

$SrcDir = Get-ChildItem "$env:TEMP\claude-chrome-screenshots-*" -Directory -ErrorAction SilentlyContinue |
          Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $SrcDir) {
  Write-Host "No claude-chrome-screenshots-* folder found in $env:TEMP" -ForegroundColor Red
  Write-Host "Drop the JPGs into img\work\ yourself, named: $($Slugs -join '.jpg, ').jpg"
  exit 1
}

$files = @(Get-ChildItem $SrcDir.FullName -Filter *.jpg | Sort-Object CreationTime)
if (-not $files) { Write-Host "No .jpg files in $($SrcDir.FullName)" -ForegroundColor Red; exit 1 }

Write-Host "Source: $($SrcDir.FullName)"
Write-Host "Found $($files.Count) capture(s), oldest first:`n"
for ($i = 0; $i -lt $files.Count; $i++) {
  Write-Host ("  [{0}] {1,-40} {2,6} KB   {3}" -f $i, $files[$i].Name,
              [math]::Round($files[$i].Length / 1KB), $files[$i].CreationTime.ToString('HH:mm:ss'))
}

# If the count matches, propose straight capture order. Otherwise ask.
$pick = @{}
if ($files.Count -eq $Slugs.Count) {
  for ($i = 0; $i -lt $Slugs.Count; $i++) { $pick[$Slugs[$i]] = $files[$i] }
} else {
  Write-Host "`n$($files.Count) files but $($Slugs.Count) cards - tell me which is which." -ForegroundColor Yellow
  foreach ($s in $Slugs) {
    $n = Read-Host "  index for $s (blank to skip)"
    if ($n -ne '' -and [int]$n -lt $files.Count) { $pick[$s] = $files[[int]$n] }
  }
}

Write-Host "`nProposed:`n"
foreach ($s in $Slugs) {
  if ($pick.ContainsKey($s)) { Write-Host ("  {0,-24} <- {1}" -f "$s.jpg", $pick[$s].Name) }
  else                       { Write-Host ("  {0,-24} <- (skipped)" -f "$s.jpg") -ForegroundColor Yellow }
}

if ((Read-Host "`nCopy these into img\work\? (y/n)") -notmatch '^y') { Write-Host "Nothing copied."; exit 0 }

$n = 0
foreach ($s in $pick.Keys) {
  Copy-Item $pick[$s].FullName (Join-Path $Dest "$s.jpg") -Force
  Write-Host ("  copied  {0}.jpg" -f $s) -ForegroundColor Green
  $n++
}

Write-Host "`n$n copied into $Dest"
Write-Host "`nNext:  bash tools/check-images.sh"
Write-Host "       bash tools/stamp-assets.sh"
