# Compare sky regions: 커리큘럼 메인화면 vs curriculum-main-long, export sky crop
Add-Type -AssemblyName System.Drawing

$dir = Join-Path $PSScriptRoot '..\public\assets'
$outDir = Join-Path $PSScriptRoot '..\tmp-curriculum'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$curr = Get-ChildItem -LiteralPath $dir -Filter '*.svg' | Where-Object {
  $_.Length -gt 4200000 -and $_.Length -lt 4300000 -and $_.Name -notlike 'onboarding-*' -and $_.Name -notlike 'curriculum-main-long*'
} | Select-Object -First 1

Write-Host "curr main: $($curr.Name) $($curr.Length)"

# User reference shows title+subtitle side by side, dropdown, card with Day 6
# Extract sky-only SVG from curriculum main: viewBox 0 0 524 ~410 (through card)
$raw = [IO.File]::ReadAllText($curr.FullName)

# Find text-like content near title area - look for path fills #1E242F near y=105-140
# Also check card content differences

# Key sky UI rects from earlier:
# title chip: 145.027, 105.008, 236x59 - OR title is free text?
# Looking at user image: title is LEFT aligned "특별 내신코스", subtitle to the RIGHT - NOT in a centered white chip
# Current LONG bake has centered white chip with dropdown style

# So we need the curriculum main's ACTUAL sky layout - maybe different from the title chip we baked

# Search for elements that look like left-aligned title (x around 20-40)
$rects = [regex]::Matches($raw, '<rect\b[^>/]*?/?>')
Write-Host "low-y rects:"
foreach ($r in $rects) {
  $v = $r.Value
  $y = $null; $x = $null
  if ($v -match '\by="([0-9.]+)"') { $y = [double]$Matches[1] }
  if ($v -match '\bx="([0-9.]+)"') { $x = [double]$Matches[1] }
  if ($null -ne $y -and $y -lt 400) {
    Write-Host $v.Substring(0, [Math]::Min(200, $v.Length))
  }
}

# Check if curriculum main has left title (not just chip at 145)
# Look for filter groups in sky
$filters = [regex]::Matches($raw, '<g filter="url\(#filter\d+_d_5959_3243\)">')
Write-Host "`nfilter groups: $($filters.Count)"
foreach ($f in $filters) {
  $idx = $f.Index
  $snippet = $raw.Substring($idx, [Math]::Min(180, $raw.Length-$idx))
  Write-Host $snippet
  Write-Host '---'
}
