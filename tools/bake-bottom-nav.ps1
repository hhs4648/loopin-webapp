# Crop bottom nav bar from 커리큘럼 메인화면 into a standalone SVG asset
Add-Type -AssemblyName System.Drawing

$dir = Join-Path $PSScriptRoot '..\public\assets'
$outDir = Join-Path $PSScriptRoot '..\tmp-curriculum'
$outSvg = Join-Path $dir 'curriculum-bottom-nav.svg'

$curr = Get-ChildItem -LiteralPath $dir -Filter '*.svg' | Where-Object {
  $_.Length -gt 4200000 -and $_.Length -lt 4300000 -and $_.Name -notlike 'onboarding-*'
} | Select-Object -First 1

$raw = [IO.File]::ReadAllText($curr.FullName)

# Nav chrome in SVG: y=1023.53 .. 1134 (end of viewBox)
# Extract elements: from the hairline rect through home indicator
$navStart = $raw.IndexOf('<rect width="523.077" height="1.33099" transform="translate(1 1023.53)"')
# End just before the title filter group (하늘 타이틀) — nav is before that in file? 
# Actually looking at earlier analysis, nav appears BEFORE title in document order at idx 56583,
# while title is at 99792. So nav block is continuous.

# Find end: home indicator bar + closing before next major UI
# Home indicator: translate(1 1100.72) and black pill at y=1116.7
$afterNav = $raw.IndexOf('<g filter="url(#filter18_d_5959_3243)">') # title
if ($afterNav -lt 0) { throw 'title marker not found' }

$navInner = $raw.Substring($navStart, $afterNav - $navStart)
Write-Host "navInner len=$($navInner.Length)"

# Shift Y by -1023.53 so nav sits at y=0 in new viewBox
# Also need defs for nothing special in nav paths (solid fills only for icons/labels)
# Check if navInner references url(#
$refs = [regex]::Matches($navInner, 'url\(#([^)]+)\)')
Write-Host "url refs: $($refs.Count)"
foreach ($r in $refs) { Write-Host "  $($r.Groups[1].Value)" }

# Build shifted SVG: replace translate(..., 1023.53/1024.86/1100.72) and absolute y attrs
# Simpler approach: keep absolute coords, set viewBox="0 1023.53 523.077 110.47"
$vbY = 1023.53
$vbH = 1134 - 1023.53  # 110.47
$vbW = 523.077

$svg = @"
<svg width="523" height="110" viewBox="0 $vbY $vbW $vbH" fill="none" xmlns="http://www.w3.org/2000/svg">
$navInner
</svg>
"@

[IO.File]::WriteAllText($outSvg, $svg)
Write-Host "wrote $outSvg bytes=$((Get-Item -LiteralPath $outSvg).Length)"

# Preview: also list tab hit areas (4 equal cells)
# cells at translate x: 1, 131.77, 262.539, 393.309 — width 130.769
# In frame coords (393/523):
$scale = 393.0 / 523
Write-Host ("NAV_ASSET_H frame ~= {0}" -f ($vbH * $scale))
Write-Host ("tab W frame ~= {0}" -f (130.769 * $scale))
Write-Host ("design NAV_H=81 — use 81 for layout, asset may include home indicator")
