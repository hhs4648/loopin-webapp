# Bake curriculum-main sky title into a copy of 메인화면LONG.svg
$dir = Join-Path $PSScriptRoot '..\public\assets'
$outPath = Join-Path $dir 'curriculum-main-long.svg'

$curr = Get-ChildItem -LiteralPath $dir -Filter '*.svg' | Where-Object {
  $_.Length -gt 4200000 -and $_.Length -lt 4300000 -and $_.Name -notlike 'onboarding-*'
} | Select-Object -First 1
$long = Get-ChildItem -LiteralPath $dir -Filter '*LONG.svg' | Select-Object -First 1

Write-Host "src LONG: $($long.Name)"
Write-Host "src CURR: $($curr.Name)"
Write-Host "out: $outPath"

$rawC = [IO.File]::ReadAllText($curr.FullName)
$rawL = [IO.File]::ReadAllText($long.FullName)

# Extract title group
$idxTitle = $rawC.IndexOf('y="105.008"')
$gStart = $rawC.LastIndexOf('<g filter="url(#filter18_d_5959_3243)">', $idxTitle)
$idxChevron = $rawC.IndexOf('stroke="#4A93EE"', $idxTitle)
$gEnd = $rawC.IndexOf('</g>', $idxChevron)
$titleGroup = $rawC.Substring($gStart, $gEnd + 4 - $gStart)

# Extract filter18
$fMatch = [regex]::Match($rawC, '<filter id="filter18_d_5959_3243"[\s\S]*?</filter>')
if (-not $fMatch.Success) { throw 'filter18 not found' }
$titleFilter = $fMatch.Value

# Remap IDs to avoid collision with LONG filters
$titleGroup2 = $titleGroup.Replace('filter18_d_5959_3243', 'filter_curriculum_sky_title')
$titleFilter2 = $titleFilter.Replace('filter18_d_5959_3243', 'filter_curriculum_sky_title')

# Slight X/Y nudge to match LONG's coordinate scale (CURR is 524 wide, LONG is 523 — nearly 1:1)
# LONG card is at y=188.535 vs CURR y=188 — title can stay as-is

# Insert filter before </defs> in LONG
$defsEnd = $rawL.LastIndexOf('</defs>')
if ($defsEnd -lt 0) { throw 'no defs' }
$rawOut = $rawL.Insert($defsEnd, $titleFilter2 + "`n")

# Insert title group before LONG course card
$cardMarker = '<rect x="29.5508" y="188.535"'
$cardIdx = $rawOut.IndexOf($cardMarker)
if ($cardIdx -lt 0) { throw 'course card not found in LONG' }

# Find the wrapping <g filter=...> before the card
$gCardStart = $rawOut.LastIndexOf('<g filter=', $cardIdx)
if ($gCardStart -lt 0) { throw 'card group not found' }

$rawOut = $rawOut.Insert($gCardStart, $titleGroup2 + "`n")

# Update svg comment via width note - also bump nothing
[IO.File]::WriteAllText($outPath, $rawOut)
Write-Host ("wrote {0} bytes={1}" -f $outPath, (Get-Item -LiteralPath $outPath).Length)
Write-Host ("title injected before card at {0}" -f $gCardStart)
