Add-Type -AssemblyName System.Drawing

$dir = Join-Path $PSScriptRoot '..\public\assets'
$outDir = Join-Path $PSScriptRoot '..\tmp-curriculum'

function Dump-ImageUsage([string]$path, [string]$label) {
  $raw = [IO.File]::ReadAllText($path)
  Write-Host "=== $label ==="
  # Find pattern defs and uses referencing image
  $patterns = [regex]::Matches($raw, '<pattern[\s\S]{0,400}?</pattern>')
  Write-Host "patterns: $($patterns.Count)"
  foreach ($p in $patterns) {
    Write-Host $p.Value.Substring(0, [Math]::Min(350, $p.Value.Length))
    Write-Host '---'
  }
  $uses = [regex]::Matches($raw, '<use[^/]*/>|<use[\s\S]{0,200}?</use>')
  Write-Host "uses: $($uses.Count)"
  for ($i=0; $i -lt [Math]::Min(10, $uses.Count); $i++) {
    Write-Host $uses[$i].Value.Substring(0, [Math]::Min(250, $uses[$i].Value.Length))
  }
  # Find rects that use fill url pattern
  $fillRects = [regex]::Matches($raw, '<rect[^>]*fill="url\(#pattern[^"]+\)"[^/]*/>')
  Write-Host "pattern-fill rects: $($fillRects.Count)"
  foreach ($r in $fillRects) { Write-Host $r.Value }
}

$long = Get-ChildItem -LiteralPath $dir -Filter '*LONG.svg' | Select-Object -First 1
$curr = Get-ChildItem -LiteralPath $dir -Filter '*.svg' | Where-Object {
  $_.Length -gt 4200000 -and $_.Length -lt 4300000 -and $_.Name -notlike 'onboarding-*'
} | Select-Object -First 1

Dump-ImageUsage $long.FullName 'LONG'
Dump-ImageUsage $curr.FullName 'CURR'

# Alpha-aware sampling of CURR
$bmp = [System.Drawing.Bitmap]::FromFile((Join-Path $outDir 'curr-embed-0.png'))
Write-Host "CURR alpha samples:"
foreach ($y in @(0,100,200,300,350,400,450,500,600,800,1000)) {
  $c = $bmp.GetPixel(1024, $y)
  Write-Host ("  y={0,4} RGBA={1,3},{2,3},{3,3},{4,3}" -f $y,$c.R,$c.G,$c.B,$c.A)
}
# Find first opaque colorful row
for ($y=0; $y -lt $bmp.Height; $y += 2) {
  $c = $bmp.GetPixel(1024, $y)
  if ($c.A -gt 200 -and -not ($c.R -gt 240 -and $c.G -gt 240 -and $c.B -gt 240)) {
    Write-Host ("first opaque nonwhite center y={0} RGBA={1},{2},{3},{4}" -f $y,$c.R,$c.G,$c.B,$c.A)
    break
  }
}
# Find opaque content bbox
$minY=9999; $maxY=0; $minX=9999; $maxX=0
for ($y=0; $y -lt $bmp.Height; $y += 8) {
  for ($x=0; $x -lt $bmp.Width; $x += 8) {
    $c = $bmp.GetPixel($x,$y)
    if ($c.A -gt 200) {
      if ($x -lt $minX) { $minX=$x }
      if ($y -lt $minY) { $minY=$y }
      if ($x -gt $maxX) { $maxX=$x }
      if ($y -gt $maxY) { $maxY=$y }
    }
  }
}
Write-Host ("CURR opaque bbox x={0}..{1} y={2}..{3}" -f $minX,$maxX,$minY,$maxY)
$bmp.Dispose()

$bmp2 = [System.Drawing.Bitmap]::FromFile((Join-Path $outDir 'long-full.png'))
Write-Host "LONG alpha samples:"
foreach ($y in @(0,100,200,300,400,500,600,800,1000)) {
  $c = $bmp2.GetPixel(1024, $y)
  Write-Host ("  y={0,4} RGBA={1,3},{2,3},{3,3},{4,3}" -f $y,$c.R,$c.G,$c.B,$c.A)
}
$minY=9999; $maxY=0; $minX=9999; $maxX=0
for ($y=0; $y -lt $bmp2.Height; $y += 8) {
  for ($x=0; $x -lt $bmp2.Width; $x += 8) {
    $c = $bmp2.GetPixel($x,$y)
    if ($c.A -gt 200) {
      if ($x -lt $minX) { $minX=$x }
      if ($y -lt $minY) { $minY=$y }
      if ($x -gt $maxX) { $maxX=$x }
      if ($y -gt $maxY) { $maxY=$y }
    }
  }
}
Write-Host ("LONG opaque bbox x={0}..{1} y={2}..{3}" -f $minX,$maxX,$minY,$maxY)
$bmp2.Dispose()
