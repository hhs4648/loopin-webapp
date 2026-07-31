# Replace all map castles with map-castle-red-flag.png
# Full teal wipe of each bbox (kills pale-yellow castles that look like the path),
# then restore only a thin path ribbon at the bottom.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$assets = 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets'
$out = 'C:\Users\user\.cursor\projects\loopin-webapp\tmp-curriculum'

function LoadSvgPng([string]$path) {
  $raw = [System.IO.File]::ReadAllText($path)
  $m = [regex]::Match($raw, 'base64,([A-Za-z0-9+/=]+)')
  $ms = New-Object System.IO.MemoryStream(,([Convert]::FromBase64String($m.Groups[1].Value)))
  return [System.Drawing.Bitmap]::FromStream($ms)
}

function WriteSvgPng([string]$path, [System.Drawing.Bitmap]$bmp) {
  $ms = New-Object System.IO.MemoryStream
  $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
  $b64 = [Convert]::ToBase64String($ms.ToArray()); $ms.Dispose()
  $w = $bmp.Width; $h = $bmp.Height
  @"
<svg width="$w" height="$h" viewBox="0 0 $w $h" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<rect width="$w" height="$h" fill="url(#pat)"/>
<defs>
<pattern id="pat" patternContentUnits="objectBoundingBox" width="1" height="1">
<use xlink:href="#img" transform="scale($(1.0/$w) $(1.0/$h))"/>
</pattern>
<image id="img" width="$w" height="$h" preserveAspectRatio="none" xlink:href="data:image/png;base64,$b64"/>
</defs>
</svg>
"@ | Set-Content -LiteralPath $path -Encoding utf8
}

function IsYellowPath([System.Drawing.Color]$c) {
  return ($c.R -gt 225 -and $c.G -gt 195 -and $c.B -lt 215 -and ($c.G - $c.B) -gt 35 -and ($c.R - $c.B) -gt 25)
}
function IsLupinBlue([System.Drawing.Color]$c) {
  return ($c.B -gt 180 -and $c.B -gt $c.R + 40 -and $c.B -gt $c.G + 20 -and $c.R -lt 160)
}

function ReplaceSlot(
  [System.Drawing.Bitmap]$dst,
  [System.Drawing.Bitmap]$src,
  [System.Drawing.Bitmap]$sprite,
  [hashtable]$s,
  [System.Drawing.Color]$bg
) {
  $ex0 = [Math]::Max(0, [int]$s.ex0)
  $ey0 = [Math]::Max(0, [int]$s.ey0)
  $ex1 = [Math]::Min($dst.Width - 1, [int]$s.ex1)
  $ey1 = [Math]::Min($dst.Height - 1, [int]$s.ey1)
  $cx = [int]$s.cx; $floorY = [int]$s.floorY; $tw = [int]$s.w

  # local grass
  $localBg = $bg
  foreach ($rad in @(2, 6, 12, 20)) {
    $found = $false
    foreach ($pt in @(@(($ex0 - $rad), [int](($ey0+$ey1)/2)), @(($ex1 + $rad), [int](($ey0+$ey1)/2)), @($cx, ($ey0 - $rad)))) {
      $px = $pt[0]; $py = $pt[1]
      if ($px -lt 0 -or $py -lt 0 -or $px -ge $src.Width -or $py -ge $src.Height) { continue }
      $c = $src.GetPixel($px, $py)
      if (-not (IsYellowPath $c) -and -not (IsLupinBlue $c) -and $c.G -gt ($c.R + 20) -and $c.G -gt 180) {
        $localBg = $c; $found = $true; break
      }
    }
    if ($found) { break }
  }

  # wipe castle / pale-yellow / path-yellow / windows inside box — keep teal, trees, gray locks
  for ($y = $ey0; $y -le $ey1; $y++) {
    for ($x = $ex0; $x -le $ex1; $x++) {
      $c = $src.GetPixel($x, $y)
      # keep grass
      if ([Math]::Abs($c.R - $localBg.R) -lt 22 -and [Math]::Abs($c.G - $localBg.G) -lt 22 -and [Math]::Abs($c.B - $localBg.B) -lt 22) { continue }
      # keep gray lock
      if ([Math]::Abs($c.R - $c.G) -lt 18 -and [Math]::Abs($c.G - $c.B) -lt 18 -and $c.R -gt 80 -and $c.R -lt 200) { continue }
      # keep green trees / dino
      if ($c.G -gt ($c.R + 25) -and $c.G -gt ($c.B + 10) -and $c.G -gt 120 -and $c.R -lt 160) { continue }
      if (IsLupinBlue $c) { continue }
      # keep path only at left/right edges (center yellow = pale-yellow castle base — wipe it)
      if ($y -ge ($floorY - 8) -and (IsYellowPath $c) -and ($x -le ($ex0 + 14) -or $x -ge ($ex1 - 14))) { continue }
      # wipe warm castle, pale yellow, path yellow, white windows, brown pole, pink flag
      $warm = ($c.R -gt 150 -and ($c.R - $c.B) -gt 15 -and $c.G -gt 40)
      $white = ($c.R -gt 230 -and $c.G -gt 230 -and $c.B -gt 220)
      $pink = ($c.R -gt 195 -and $c.B -gt 130 -and $c.G -lt 205 -and ($c.R - $c.G) -gt 20)
      $brown = ($c.R -gt 85 -and $c.R -lt 175 -and $c.G -lt 125 -and $c.B -lt 105 -and ($c.R - $c.B) -gt 18)
      if ($warm -or $white -or $pink -or $brown) { $dst.SetPixel($x, $y, $localBg) }
    }
  }

  # paint new castle
  $g2 = [System.Drawing.Graphics]::FromImage($dst)
  $g2.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
  $g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $th = [int]([Math]::Round($tw * $sprite.Height / [double]$sprite.Width))
  $dx = [int]($cx - $tw / 2)
  $dy = $floorY - $th + 2
  if ($dx -lt 0) { $dx = 0 }
  if ($dy -lt 0) { $dy = 0 }
  $g2.DrawImage($sprite, $dx, $dy, $tw, $th)
  $g2.Dispose()
  Write-Output ("  cx=$cx floorY=$floorY")
}

# Real castle slots from LONG (red + pale-yellow variants). Boxes cover full old footprint.
$slots = @(
  @{ cx = 182; floorY = 424; ex0 = 138; ey0 = 288; ex1 = 226; ey1 = 430; w = 70 }
  @{ cx = 286; floorY = 535; ex0 = 248; ey0 = 455; ex1 = 328; ey1 = 542; w = 72 }
  @{ cx = 74;  floorY = 625; ex0 = 38;  ey0 = 545; ex1 = 118; ey1 = 632; w = 62 }
  @{ cx = 182; floorY = 748; ex0 = 138; ey0 = 675; ex1 = 226; ey1 = 755; w = 70 }
  @{ cx = 286; floorY = 871; ex0 = 248; ey0 = 790; ex1 = 328; ey1 = 878; w = 72 }
  @{ cx = 74;  floorY = 948; ex0 = 38;  ey0 = 870; ex1 = 118; ey1 = 955; w = 62 }
  @{ cx = 182; floorY = 1060; ex0 = 138; ey0 = 988; ex1 = 226; ey1 = 1067; w = 70 }
  @{ cx = 286; floorY = 1168; ex0 = 248; ey0 = 1090; ex1 = 328; ey1 = 1175; w = 72 }
  @{ cx = 74;  floorY = 1260; ex0 = 38;  ey0 = 1180; ex1 = 118; ey1 = 1268; w = 62 }
  @{ cx = 182; floorY = 1369; ex0 = 138; ey0 = 1295; ex1 = 226; ey1 = 1376; w = 70 }
  @{ cx = 286; floorY = 1480; ex0 = 248; ey0 = 1405; ex1 = 328; ey1 = 1488; w = 72 }
)

$sprite = [System.Drawing.Bitmap]::FromFile((Join-Path $assets 'map-castle-red-flag.png'))
$src = LoadSvgPng (Join-Path $assets 'main-home-map-long.svg')
$dst = [System.Drawing.Bitmap]$src.Clone()
$bg = $src.GetPixel(5, 400)
Write-Output 'LONG'
foreach ($s in $slots) { ReplaceSlot $dst $src $sprite $s $bg }

$fullCrop = $dst.Clone((New-Object System.Drawing.Rectangle(0, 0, $dst.Width, 700)), $dst.PixelFormat)
$fullOut = New-Object System.Drawing.Bitmap(899, 1750)
$g = [System.Drawing.Graphics]::FromImage($fullOut)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($fullCrop, 0, 0, 899, 1750)
$g.Dispose(); $fullCrop.Dispose()
WriteSvgPng (Join-Path $assets 'main-home-full-map.svg') $fullOut
Write-Output 'wrote full-map'

$cleared = [System.Drawing.Bitmap]$fullOut.Clone()
$sx = 899.0 / 360.0; $sy = 1750.0 / 700.0
$cbg = $cleared.GetPixel(40, 900)
$ex0 = [int](78 * $sx); $ex1 = [int](165 * $sx)
$ey0 = [int](260 * $sy); $ey1 = [int](355 * $sy)
for ($y = $ey0; $y -le $ey1; $y++) {
  for ($x = $ex0; $x -le $ex1; $x++) {
    $c = $cleared.GetPixel($x, $y)
    if (IsLupinBlue $c) { $cleared.SetPixel($x, $y, $cbg); continue }
    if ($c.B -gt 200 -and $c.R -lt 130 -and $c.G -gt 110 -and $c.G -lt 190) { $cleared.SetPixel($x, $y, $cbg); continue }
    if ($c.R -gt 240 -and $c.G -gt 240 -and $c.B -gt 240 -and $y -gt ($ey0 + 45)) { $cleared.SetPixel($x, $y, $cbg) }
  }
}
WriteSvgPng (Join-Path $assets 'main-home-full-map-cleared.svg') $cleared
$cleared.Dispose(); $fullOut.Dispose()
Write-Output 'wrote cleared'

$bridgeStart = 697; $bridgeEnd = 1176
$bh = $bridgeEnd - $bridgeStart + 1
$brCrop = $dst.Clone((New-Object System.Drawing.Rectangle(0, $bridgeStart, $dst.Width, $bh)), $dst.PixelFormat)
$br = New-Object System.Drawing.Bitmap(393, 524)
$g = [System.Drawing.Graphics]::FromImage($br)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($brCrop, 0, 0, 393, 524)
$g.Dispose(); $brCrop.Dispose()
$bbg = $br.GetPixel(20, 40)
for ($y = 0; $y -lt $br.Height; $y++) {
  for ($x = 0; $x -lt $br.Width; $x++) {
    if (IsLupinBlue ($br.GetPixel($x, $y))) { $br.SetPixel($x, $y, $bbg) }
  }
}
WriteSvgPng (Join-Path $assets 'main-home-map-bridge.svg') $br
$br.Clone((New-Object System.Drawing.Rectangle(0, 0, 393, 300)), $br.PixelFormat).Save((Join-Path $out 'castles-bridge.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$br.Dispose()
Write-Output 'wrote bridge'

$segStart = 1177; $segEnd = 1488
$sh = $segEnd - $segStart + 1
$sgCrop = $dst.Clone((New-Object System.Drawing.Rectangle(0, $segStart, $dst.Width, $sh)), $dst.PixelFormat)
$sg = New-Object System.Drawing.Bitmap(393, 341)
$g = [System.Drawing.Graphics]::FromImage($sg)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($sgCrop, 0, 0, 393, 341)
$g.Dispose(); $sgCrop.Dispose()
WriteSvgPng (Join-Path $assets 'main-home-map-segment.svg') $sg
$sg.Save((Join-Path $out 'castles-segment.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$sg.Dispose()
Write-Output 'wrote segment'

$fm = LoadSvgPng (Join-Path $assets 'main-home-full-map.svg')
$fp = New-Object System.Drawing.Bitmap(393, 765)
$g = [System.Drawing.Graphics]::FromImage($fp); $g.DrawImage($fm, 0, 0, 393, 765); $g.Dispose()
$fp.Clone((New-Object System.Drawing.Rectangle(40, 280, 330, 460)), $fp.PixelFormat).Save((Join-Path $out 'castles-main-home-full-map.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$fp.Clone((New-Object System.Drawing.Rectangle(40, 600, 100, 120)), $fp.PixelFormat).Save((Join-Path $out 'curr-castle3.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$fp.Dispose(); $fm.Dispose()

$src.Dispose(); $dst.Dispose(); $sprite.Dispose()
Write-Output 'done'
