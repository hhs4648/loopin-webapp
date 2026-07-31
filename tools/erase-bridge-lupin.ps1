$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

function LoadSvgPng($path) {
  $s = Get-Content -LiteralPath $path -Raw -Encoding UTF8
  [void]($s -match 'base64,([A-Za-z0-9+/=]+)')
  $ms = New-Object System.IO.MemoryStream(, [Convert]::FromBase64String($Matches[1]))
  $bmp = New-Object System.Drawing.Bitmap($ms)
  return @{ bmp = $bmp; ms = $ms }
}

function IsLupin($c) {
  # body blue
  if ($c.B -gt 150 -and $c.B -gt ($c.R + 35) -and $c.B -gt ($c.G + 15) -and $c.R -lt 170) { return $true }
  # pink blush / cheek / ear inner
  if ($c.R -gt 200 -and $c.B -gt 150 -and $c.G -lt 180 -and ($c.R - $c.G) -gt 40) { return $true }
  # black eyes/mouth
  if ($c.R -lt 50 -and $c.G -lt 50 -and $c.B -lt 50) { return $false } # handle separately in bbox
  return $false
}

function IsPillBlue($c) {
  # 「현재 위치」 pill — solid mid blue, flatter than lupin soft blue
  return ($c.B -gt 180 -and $c.R -lt 120 -and $c.G -gt 100 -and $c.G -lt 180 -and ($c.B - $c.R) -gt 80)
}

function IsTeal($c, $bg) {
  return ([Math]::Abs($c.R - $bg.R) -lt 28 -and [Math]::Abs($c.G - $bg.G) -lt 28 -and [Math]::Abs($c.B - $bg.B) -lt 28)
}

function IsYellow($c) {
  return ($c.R -gt 220 -and $c.G -gt 190 -and $c.B -lt 210 -and ($c.G - $c.B) -gt 25)
}

function IsCastleWarm($c) {
  return ($c.R -gt 180 -and $c.G -gt 140 -and $c.B -lt 160 -and ($c.R - $c.B) -gt 30)
}

$br = LoadSvgPng 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-map-bridge.svg'
$bmp = $br.bmp
$bg = $bmp.GetPixel(5, 5)

# Find lupin bbox more tightly — around known area y~263-303 x~63-98, expand for arms
$x0 = 50; $x1 = 115; $y0 = 230; $y1 = 320
# refine by scanning
$minX = 999; $maxX = -1; $minY = 999; $maxY = -1
for ($y = 200; $y -lt 340; $y++) {
  for ($x = 40; $x -lt 140; $x++) {
    if (IsLupin ($bmp.GetPixel($x, $y))) {
      if ($x -lt $minX) { $minX = $x }; if ($x -gt $maxX) { $maxX = $x }
      if ($y -lt $minY) { $minY = $y }; if ($y -gt $maxY) { $maxY = $y }
    }
  }
}
Write-Output ("lupin bbox x={0}..{1} y={2}..{3}" -f $minX, $maxX, $minY, $maxY)

# Also find nearby 「현재 위치」 pill below castle
$pillMinX = 999; $pillMaxX = -1; $pillMinY = 999; $pillMaxY = -1
for ($y = 300; $y -lt 420; $y++) {
  for ($x = 30; $x -lt 160; $x++) {
    if (IsPillBlue ($bmp.GetPixel($x, $y))) {
      if ($x -lt $pillMinX) { $pillMinX = $x }; if ($x -gt $pillMaxX) { $pillMaxX = $x }
      if ($y -lt $pillMinY) { $pillMinY = $y }; if ($y -gt $pillMaxY) { $pillMaxY = $y }
    }
  }
}
if ($pillMaxX -gt 0) {
  Write-Output ("pill bbox x={0}..{1} y={2}..{3}" -f $pillMinX, $pillMaxX, $pillMinY, $pillMaxY)
} else {
  Write-Output 'no pill found'
}

function FillSample($bmp, $x, $y, $ex0, $ex1, $ey0, $ey1, $bg) {
  foreach ($rad in @(1, 2, 4, 8, 14, 22)) {
    $pathC = $null; $any = $null; $castle = $null
    for ($yy = $y - $rad; $yy -le $y + $rad; $yy++) {
      for ($xx = $x - $rad; $xx -le $x + $rad; $xx++) {
        if ($xx -lt 0 -or $yy -lt 0 -or $xx -ge $bmp.Width -or $yy -ge $bmp.Height) { continue }
        if ($xx -ge $ex0 -and $xx -le $ex1 -and $yy -ge $ey0 -and $yy -le $ey1) { continue }
        $c = $bmp.GetPixel($xx, $yy)
        if (IsLupin $c) { continue }
        if (IsPillBlue $c) { continue }
        if (IsYellow $c) { return $c }
        if (IsCastleWarm $c) { if ($null -eq $castle) { $castle = $c } }
        if ($null -eq $any) { $any = $c }
      }
    }
    # prefer castle color when erasing character standing ON castle top
    if ($null -ne $castle -and $y -lt ($ey0 + ($ey1 - $ey0) * 0.7)) { return $castle }
    if ($null -ne $any) { return $any }
  }
  return $bg
}

function EraseRect($bmp, $ex0, $ex1, $ey0, $ey1, $pred, $bg, $label) {
  $pts = New-Object System.Collections.Generic.List[object]
  for ($y = $ey0; $y -le $ey1; $y++) {
    for ($x = $ex0; $x -le $ex1; $x++) {
      $c = $bmp.GetPixel($x, $y)
      if (& $pred $c) { $pts.Add(@($x, $y)) }
      # also dark facial features inside lupin area
      elseif ($label -eq 'lupin' -and $c.R -lt 60 -and $c.G -lt 60 -and $c.B -lt 60) {
        # only if near lupin-colored neighbors
        $near = $false
        foreach ($d in @(@(1,0),@(-1,0),@(0,1),@(0,-1),@(2,0),@(-2,0),@(0,2),@(0,-2))) {
          $nx = $x + $d[0]; $ny = $y + $d[1]
          if ($nx -lt $ex0 -or $ny -lt $ey0 -or $nx -gt $ex1 -or $ny -gt $ey1) { continue }
          if (IsLupin ($bmp.GetPixel($nx, $ny))) { $near = $true; break }
        }
        if ($near) { $pts.Add(@($x, $y)) }
      }
    }
  }
  Write-Output ("erase {0}: {1} px in ({2}..{3},{4}..{5})" -f $label, $pts.Count, $ex0, $ex1, $ey0, $ey1)
  foreach ($p in $pts) {
    $bmp.SetPixel($p[0], $p[1], (FillSample $bmp $p[0] $p[1] $ex0 $ex1 $ey0 $ey1 $bg))
  }
}

if ($maxX -gt 0) {
  $pad = 6
  EraseRect $bmp ([Math]::Max(0, $minX - $pad)) ([Math]::Min($bmp.Width - 1, $maxX + $pad)) `
    ([Math]::Max(0, $minY - $pad)) ([Math]::Min($bmp.Height - 1, $maxY + $pad)) `
    ${function:IsLupin} $bg 'lupin'
}

# Also erase baked 「현재 위치」 pill in bridge (duplicate of React overlay)
if ($pillMaxX -gt 0) {
  $pad = 4
  EraseRect $bmp ([Math]::Max(0, $pillMinX - $pad)) ([Math]::Min($bmp.Width - 1, $pillMaxX + $pad)) `
    ([Math]::Max(0, $pillMinY - $pad)) ([Math]::Min($bmp.Height - 1, $pillMaxY + $pad)) `
    ${function:IsPillBlue} $bg 'pill'
  # white text inside pill
  for ($y = $pillMinY; $y -le $pillMaxY; $y++) {
    for ($x = $pillMinX; $x -le $pillMaxX; $x++) {
      $c = $bmp.GetPixel($x, $y)
      if ($c.R -gt 220 -and $c.G -gt 220 -and $c.B -gt 220) {
        $bmp.SetPixel($x, $y, (FillSample $bmp $x $y $pillMinX $pillMaxX $pillMinY $pillMaxY $bg))
      }
    }
  }
}

# Save preview
$prev = $bmp.Clone((New-Object System.Drawing.Rectangle(40, 220, 140, 200)), $bmp.PixelFormat)
$big = New-Object System.Drawing.Bitmap($prev, 280, 400)
$big.Save('C:\Users\user\.cursor\projects\loopin-webapp\tools\bridge-lupin-erased.png', [System.Drawing.Imaging.ImageFormat]::Png)
$prev.Dispose(); $big.Dispose()

# Write SVG
$ms = New-Object System.IO.MemoryStream
$bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
$b64 = [Convert]::ToBase64String($ms.ToArray()); $ms.Dispose()
$w = $bmp.Width; $h = $bmp.Height
$svg = @"
<svg width="$w" height="$h" viewBox="0 0 $w $h" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<rect width="$w" height="$h" fill="url(#pat)"/>
<defs>
<pattern id="pat" patternContentUnits="objectBoundingBox" width="1" height="1">
<use xlink:href="#img" transform="scale($(1.0/$w) $(1.0/$h))"/>
</pattern>
<image id="img" width="$w" height="$h" preserveAspectRatio="none" xlink:href="data:image/png;base64,$b64"/>
</defs>
</svg>
"@
[System.IO.File]::WriteAllText('C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-map-bridge.svg', $svg)
Write-Output 'updated bridge svg'

$bmp.Dispose(); $br.ms.Dispose()
