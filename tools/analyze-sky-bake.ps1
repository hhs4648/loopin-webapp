Add-Type -AssemblyName System.Drawing

$dir = Join-Path $PSScriptRoot '..\public\assets'
$outDir = Join-Path $PSScriptRoot '..\tmp-curriculum'

function Get-ImagePlacement([string]$path, [string]$label) {
  $raw = [IO.File]::ReadAllText($path)
  Write-Host "=== $label ==="
  if ($raw -match 'viewBox="([^"]+)"') { Write-Host "viewBox $($Matches[1])" }

  # find image with xlink or href and transform/clip
  $m = [regex]::Match($raw, '<image[\s\S]{0,500}?data:image/png')
  if ($m.Success) {
    Write-Host "image tag head:"
    Write-Host $m.Value.Substring(0, [Math]::Min(400, $m.Value.Length))
  }

  # Also look for use / pattern
  if ($raw -match 'transform="([^"]*)"[^>]{0,80}image|image[^>]{0,200}transform="([^"]*)"') {
    Write-Host "transform nearby"
  }
}

$long = Get-ChildItem -LiteralPath $dir -Filter '*LONG.svg' | Select-Object -First 1
$curr = Get-ChildItem -LiteralPath $dir -Filter '*.svg' | Where-Object {
  $_.Length -gt 4200000 -and $_.Length -lt 4300000 -and $_.Name -notlike 'onboarding-*'
} | Select-Object -First 1

Get-ImagePlacement $long.FullName 'LONG'
Get-ImagePlacement $curr.FullName 'CURR'

# Analyze LONG PNG content bounds - where non-gray content starts
$longPngPath = Join-Path $outDir 'long-full.png'
$rawL = [IO.File]::ReadAllText($long.FullName)
$m2 = [regex]::Match($rawL, 'data:image/png;base64,([A-Za-z0-9+/=]+)')
$b64 = $m2.Groups[1].Value
$pad = (4 - ($b64.Length % 4)) % 4
if ($pad -gt 0) { $b64 += ('=' * $pad) }
$bytes = [Convert]::FromBase64String($b64)
[IO.File]::WriteAllBytes($longPngPath, $bytes)
$bmp = [System.Drawing.Bitmap]::FromFile($longPngPath)
Write-Host "LONG png $($bmp.Width)x$($bmp.Height)"

# Find content bbox (non near-gray)
$minX=9999; $minY=9999; $maxX=0; $maxY=0; $found=0
for ($y=0; $y -lt $bmp.Height; $y += 4) {
  for ($x=0; $x -lt $bmp.Width; $x += 4) {
    $c = $bmp.GetPixel($x,$y)
    $isGray = [Math]::Abs([int]$c.R - [int]$c.G) -lt 8 -and [Math]::Abs([int]$c.G - [int]$c.B) -lt 8 -and $c.R -gt 180 -and $c.R -lt 220
    $isWhite = $c.R -gt 250 -and $c.G -gt 250 -and $c.B -gt 250
    if (-not $isGray -and -not $isWhite) {
      $found++
      if ($x -lt $minX) { $minX=$x }
      if ($y -lt $minY) { $minY=$y }
      if ($x -gt $maxX) { $maxX=$x }
      if ($y -gt $maxY) { $maxY=$y }
    }
  }
}
Write-Host ("LONG content bbox approx x={0}..{1} y={2}..{3} samples={4}" -f $minX,$maxX,$minY,$maxY,$found)

# Sample colors along left edge and center for top 200
Write-Host "LONG top samples:"
foreach ($y in @(0,20,40,60,80,100,120,150,180,220,260,300)) {
  $c = $bmp.GetPixel(1024, $y)
  Write-Host ("  y={0,4} RGB={1,3},{2,3},{3,3}" -f $y,$c.R,$c.G,$c.B)
}
$bmp.Dispose()

# Same for curriculum embed
$currPng = Join-Path $outDir 'curr-embed-0.png'
$bmp2 = [System.Drawing.Bitmap]::FromFile($currPng)
Write-Host "CURR png $($bmp2.Width)x$($bmp2.Height)"
$minX=9999; $minY=9999; $maxX=0; $maxY=0; $found=0
for ($y=0; $y -lt $bmp2.Height; $y += 4) {
  for ($x=0; $x -lt $bmp2.Width; $x += 4) {
    $c = $bmp2.GetPixel($x,$y)
    $isGray = [Math]::Abs([int]$c.R - [int]$c.G) -lt 8 -and [Math]::Abs([int]$c.G - [int]$c.B) -lt 8 -and $c.R -gt 180 -and $c.R -lt 220
    $isWhite = $c.R -gt 250 -and $c.G -gt 250 -and $c.B -gt 250
    if (-not $isGray -and -not $isWhite) {
      $found++
      if ($x -lt $minX) { $minX=$x }
      if ($y -lt $minY) { $minY=$y }
      if ($x -gt $maxX) { $maxX=$x }
      if ($y -gt $maxY) { $maxY=$y }
    }
  }
}
Write-Host ("CURR content bbox approx x={0}..{1} y={2}..{3} samples={4}" -f $minX,$maxX,$minY,$maxY,$found)
Write-Host "CURR top samples:"
foreach ($y in @(0,20,40,60,80,100,120,150,180,220,260,300,350,400,450)) {
  $c = $bmp2.GetPixel(1024, $y)
  Write-Host ("  y={0,4} RGB={1,3},{2,3},{3,3}" -f $y,$c.R,$c.G,$c.B)
}

# Save top 500 of curr with more detail
$h = 500
$crop = New-Object System.Drawing.Bitmap($bmp2.Width, $h)
$g = [System.Drawing.Graphics]::FromImage($crop)
$g.DrawImage($bmp2, 0, 0, (New-Object System.Drawing.Rectangle(0,0,$bmp2.Width,$h)), [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()
$crop.Save((Join-Path $outDir 'curr-top500.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$crop.Dispose()
$bmp2.Dispose()
Write-Host "saved curr-top500.png"
