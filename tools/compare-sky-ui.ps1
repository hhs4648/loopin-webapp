$dir = Join-Path $PSScriptRoot '..\public\assets'
$outDir = Join-Path $PSScriptRoot '..\tmp-curriculum'

$long = Get-ChildItem -LiteralPath $dir -Filter '*LONG.svg' | Select-Object -First 1
$curr = Get-ChildItem -LiteralPath $dir -Filter '*.svg' | Where-Object {
  $_.Length -gt 4200000 -and $_.Length -lt 4300000 -and $_.Name -notlike 'onboarding-*'
} | Select-Object -First 1

function Dump-Head([string]$path, [string]$label, [int]$chars=2500) {
  $raw = [IO.File]::ReadAllText($path)
  Write-Host "=== $label head ==="
  # Skip past huge base64 - find first 1500 chars that aren't base64 heavy
  $head = $raw.Substring(0, [Math]::Min($chars, $raw.Length))
  # If contains base64 mid-way, truncate before it
  $idx = $head.IndexOf('data:image')
  if ($idx -gt 0) { $head = $head.Substring(0, $idx) + '...[IMAGE]...' }
  [IO.File]::WriteAllText((Join-Path $outDir "$label-head.txt"), $head)
  Write-Host $head
}

Dump-Head $long.FullName 'long' 3000
Dump-Head $curr.FullName 'curr' 3000

# Compare top UI elements in curr - status bar, titles around y<410
$raw = [IO.File]::ReadAllText($curr.FullName)
# Find text elements
$texts = [regex]::Matches($raw, '<text[\s\S]{0,200}?</text>')
Write-Host "`nCURR text elements: $($texts.Count)"
foreach ($t in $texts) {
  Write-Host $t.Value.Substring(0, [Math]::Min(220, $t.Value.Length))
}

# Find elements with y < 420 that might be sky UI (title cards etc)
Write-Host "`nCURR elements with low y:"
# Look for rounded rects in sky area
$skyRects = [regex]::Matches($raw, '<rect[^>]*y="([0-9.]+)"[^/]*/>')
$n=0
foreach ($r in $skyRects) {
  $y = [double]$r.Groups[1].Value
  if ($y -lt 420) {
    Write-Host $r.Value.Substring(0, [Math]::Min(200, $r.Value.Length))
    $n++
    if ($n -gt 30) { break }
  }
}

# LONG sky rects
$rawL = [IO.File]::ReadAllText($long.FullName)
Write-Host "`nLONG gradients:"
$grads = [regex]::Matches($rawL, 'id="(paint\d+_linear[^"]*)"[\s\S]{0,300}?</linearGradient>')
foreach ($g in $grads) {
  Write-Host $g.Value.Substring(0, [Math]::Min(250, $g.Value.Length))
  Write-Host '---'
}

Write-Host "`nLONG low-y rects:"
$skyRects = [regex]::Matches($rawL, '<rect[^>]*y="([0-9.]+)"[^/]*/>')
$n=0
foreach ($r in $skyRects) {
  $y = [double]$r.Groups[1].Value
  if ($y -lt 200) {
    Write-Host $r.Value.Substring(0, [Math]::Min(200, $r.Value.Length))
    $n++
    if ($n -gt 25) { break }
  }
}
