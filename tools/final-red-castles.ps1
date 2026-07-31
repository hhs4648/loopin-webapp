$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$path = (Get-ChildItem 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\*LONG.svg').FullName
$s = Get-Content -LiteralPath $path -Raw -Encoding UTF8
[void]($s -match 'base64,([A-Za-z0-9+/=]+)')
$ms = New-Object System.IO.MemoryStream(, [Convert]::FromBase64String($Matches[1]))
$lg = New-Object System.Drawing.Bitmap($ms)
$bg = $lg.GetPixel(5, 400)
$scale = 393.0 / 360.0

function IsTeal($c, $bg) {
  return ([Math]::Abs($c.R - $bg.R) -lt 28 -and [Math]::Abs($c.G - $bg.G) -lt 28 -and [Math]::Abs($c.B - $bg.B) -lt 28)
}
function IsWarmCastle($c) {
  return ($c.R -gt 170 -and $c.G -lt 205 -and $c.B -lt 170 -and ($c.R - $c.B) -gt 30 -and $c.G -le ($c.R + 5))
}
function IsPinkFlag($c) {
  return ($c.R -gt 200 -and $c.B -gt 145 -and $c.G -lt 200 -and ($c.R - $c.G) -gt 30)
}
function IsBrownPole($c) {
  return ($c.R -gt 90 -and $c.R -lt 170 -and $c.G -lt 120 -and $c.B -lt 100 -and ($c.R - $c.B) -gt 20)
}
function IsYellowPath($c) {
  return ($c.R -gt 230 -and $c.G -gt 205 -and $c.B -lt 205 -and ($c.G - $c.B) -gt 30)
}
function IsCastleResidue($c, $bg) {
  if (IsTeal $c $bg) { return $false }
  if (IsYellowPath $c) { return $false }
  if (IsWarmCastle $c) { return $true }
  if (IsPinkFlag $c) { return $true }
  if (IsBrownPole $c) { return $true }
  # soft anti-aliased castle edge (pinkish/peach blend)
  if ($c.R -gt 150 -and ($c.R - $c.B) -gt 18 -and ($c.R - $c.G) -gt 0 -and $c.G -lt 210) { return $true }
  return $false
}
function IsCastleBody($c) {
  if (IsWarmCastle $c) { return $true }
  if (IsPinkFlag $c) { return $true }
  if (IsBrownPole $c) { return $true }
  if ($c.R -gt 240 -and $c.G -gt 240 -and $c.B -gt 235) { return $true }
  if ($c.R -gt 235 -and $c.G -gt 160 -and $c.G -lt 220 -and $c.B -lt 150) { return $true }
  return $false
}
function ToSvg($bmp, $outPath) {
  $m = New-Object System.IO.MemoryStream
  $bmp.Save($m, [System.Drawing.Imaging.ImageFormat]::Png)
  $b64 = [Convert]::ToBase64String($m.ToArray()); $m.Dispose()
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
"@ | Set-Content -LiteralPath $outPath -Encoding UTF8
}
function MakeScaled($y0, $y1) {
  $hh = $y1 - $y0 + 1
  $crop = $lg.Clone((New-Object System.Drawing.Rectangle(0, $y0, $lg.Width, $hh)), $lg.PixelFormat)
  $scaled = New-Object System.Drawing.Bitmap($crop, 393, [int][Math]::Round($hh * $scale))
  $crop.Dispose(); return $scaled
}
function FillSample($bmp, $x, $y, $ex0, $ex1, $ey0, $ey1, $teal, $bg) {
  foreach ($rad in @(1, 2, 4, 7, 11, 16, 22)) {
    $any = $null
    for ($yy = $y - $rad; $yy -le $y + $rad; $yy++) {
      for ($xx = $x - $rad; $xx -le $x + $rad; $xx++) {
        if ($xx -lt 0 -or $yy -lt 0 -or $xx -ge $bmp.Width -or $yy -ge $bmp.Height) { continue }
        if ($xx -ge $ex0 -and $xx -le $ex1 -and $yy -ge $ey0 -and $yy -le $ey1) { continue }
        $c = $bmp.GetPixel($xx, $yy)
        if (IsCastleResidue $c $bg) { continue }
        if (IsYellowPath $c) { return $c }
        if ($null -eq $any) { $any = $c }
      }
    }
    if ($null -ne $any) { return $any }
  }
  return $teal
}

$bridgeStart = 650
$bridge = MakeScaled $bridgeStart 1214
$segment = MakeScaled 1215 1526

$sx = 135; $sy = 328; $sw = 92; $sh = 104
$crop = $lg.Clone((New-Object System.Drawing.Rectangle($sx, $sy, $sw, $sh)), $lg.PixelFormat)
$mask = New-Object 'bool[,]' $sw, $sh
for ($y = 0; $y -lt $sh; $y++) {
  for ($x = 0; $x -lt $sw; $x++) {
    if (IsCastleBody ($crop.GetPixel($x, $y))) { $mask[$x, $y] = $true }
  }
}
for ($iter = 0; $iter -lt 2; $iter++) {
  $next = New-Object 'bool[,]' $sw, $sh
  for ($y = 0; $y -lt $sh; $y++) {
    for ($x = 0; $x -lt $sw; $x++) {
      if ($mask[$x, $y]) { $next[$x, $y] = $true; continue }
      $near = $false
      foreach ($d in @(@(1,0),@(-1,0),@(0,1),@(0,-1))) {
        $nx = $x + $d[0]; $ny = $y + $d[1]
        if ($nx -lt 0 -or $ny -lt 0 -or $nx -ge $sw -or $ny -ge $sh) { continue }
        if ($mask[$nx, $ny]) { $near = $true; break }
      }
      if (-not $near) { continue }
      $c = $crop.GetPixel($x, $y)
      if (IsTeal $c $bg) { continue }
      if (IsYellowPath $c) { continue }
      $next[$x, $y] = $true
    }
  }
  $mask = $next
}
$spriteSrc = New-Object System.Drawing.Bitmap($sw, $sh, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
for ($y = 0; $y -lt $sh; $y++) {
  for ($x = 0; $x -lt $sw; $x++) {
    if ($mask[$x, $y]) {
      $c = $crop.GetPixel($x, $y)
      $spriteSrc.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $c.R, $c.G, $c.B))
    } else {
      $spriteSrc.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
    }
  }
}
$crop.Dispose()
$cw = [int][Math]::Round($sw * $scale); $ch = [int][Math]::Round($sh * $scale)
$castle = New-Object System.Drawing.Bitmap($spriteSrc, $cw, $ch)
$spriteSrc.Dispose()
$castle.Save('C:\Users\user\.cursor\projects\loopin-webapp\public\assets\map-castle-red-flag.png', [System.Drawing.Imaging.ImageFormat]::Png)

function FindBands($bmp) {
  $list = @(); $in = $false; $y0 = 0; $x0 = 0; $x1 = 0
  for ($y = 0; $y -lt $bmp.Height; $y++) {
    $cnt = 0; $rmin = -1; $rmax = -1
    for ($x = 0; $x -lt $bmp.Width; $x++) {
      if (IsWarmCastle ($bmp.GetPixel($x, $y))) {
        $cnt++; if ($rmin -lt 0) { $rmin = $x }; $rmax = $x
      }
    }
    if ($cnt -gt 18 -and ($rmax - $rmin) -gt 48) {
      if (-not $in) { $in = $true; $y0 = $y; $x0 = $rmin; $x1 = $rmax }
      else { if ($rmin -lt $x0) { $x0 = $rmin }; if ($rmax -gt $x1) { $x1 = $rmax } }
    } elseif ($in) {
      $list += [pscustomobject]@{ y0 = $y0; y1 = ($y - 1); x0 = $x0; x1 = $x1; cx = [int](($x0 + $x1) / 2) }
      $in = $false
    }
  }
  return $list
}

function ErasePaint($bmp, $castle, $label) {
  $bands = FindBands $bmp
  Write-Output ("{0}: {1}" -f $label, $bands.Count)
  $teal = $bmp.GetPixel(8, 50)
  foreach ($b in $bands) {
    $ex0 = [Math]::Max(0, $b.x0 - 14)
    $ex1 = [Math]::Min($bmp.Width - 1, $b.x1 + 14)
    $ey0 = [Math]::Max(0, $b.y0 - 48)
    $ey1 = [Math]::Min($bmp.Height - 1, $b.y1 + 10)
    $pts = New-Object System.Collections.Generic.List[object]
    for ($y = $ey0; $y -le $ey1; $y++) {
      for ($x = $ex0; $x -le $ex1; $x++) {
        if (IsCastleResidue ($bmp.GetPixel($x, $y)) $bg) { $pts.Add(@($x, $y)) }
      }
    }
    foreach ($p in $pts) {
      $bmp.SetPixel($p[0], $p[1], (FillSample $bmp $p[0] $p[1] $ex0 $ex1 $ey0 $ey1 $teal $bg))
    }
  }
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
  foreach ($b in $bands) {
    $dx = [int]($b.cx - $castle.Width / 2)
    $dy = $b.y1 - $castle.Height + 8
    if ($dy -lt 0) { $dy = 0 }
    Write-Output ("  paint ({0},{1})" -f $dx, $dy)
    $g.DrawImage($castle, $dx, $dy, $castle.Width, $castle.Height)
  }
  $g.Dispose()
}

ErasePaint $bridge $castle 'bridge'
ErasePaint $segment $castle 'segment'
ToSvg $bridge 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-map-bridge.svg'
ToSvg $segment 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-map-segment.svg'
$overlap = [int][Math]::Round((696 - $bridgeStart) * $scale) + 4
Write-Output ("MAP_BRIDGE_H={0} OVERLAP={1} SEG={2}" -f $bridge.Height, $overlap, $segment.Height)

function SavePrev($bmp, $x, $y, $name) {
  $c = $bmp.Clone((New-Object System.Drawing.Rectangle($x, $y, 160, 140)), $bmp.PixelFormat)
  $b = New-Object System.Drawing.Bitmap($c, 320, 280)
  $b.Save("C:\Users\user\.cursor\projects\loopin-webapp\tools\$name", [System.Drawing.Imaging.ImageFormat]::Png)
  $c.Dispose(); $b.Dispose()
}
SavePrev $bridge 120 20 'baked-c1.png'
SavePrev $bridge 120 360 'baked-c2.png'
SavePrev $segment 120 50 'baked-c3.png'
$castle.Dispose(); $bridge.Dispose(); $segment.Dispose(); $lg.Dispose(); $ms.Dispose()
