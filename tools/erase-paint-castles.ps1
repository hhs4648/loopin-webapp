$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

function LoadLong() {
  $path = (Get-ChildItem 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\*LONG.svg').FullName
  $s = Get-Content -LiteralPath $path -Raw -Encoding UTF8
  [void]($s -match 'base64,([A-Za-z0-9+/=]+)')
  $ms = New-Object System.IO.MemoryStream(, [Convert]::FromBase64String($Matches[1]))
  $bmp = New-Object System.Drawing.Bitmap($ms)
  return @{ bmp = $bmp; ms = $ms }
}

function IsTeal($c, $bg) {
  return ([Math]::Abs($c.R - $bg.R) -lt 26 -and [Math]::Abs($c.G - $bg.G) -lt 26 -and [Math]::Abs($c.B - $bg.B) -lt 26)
}
function IsWarmCastle($c) {
  return ($c.R -gt 185 -and $c.G -lt 210 -and $c.B -lt 175 -and ($c.R - $c.B) -gt 35)
}
function IsPinkFlag($c) {
  return ($c.R -gt 200 -and $c.B -gt 130 -and $c.G -lt 190 -and ($c.R - $c.G) -gt 35)
}
function IsBrownPole($c) {
  return ($c.R -gt 90 -and $c.R -lt 170 -and $c.G -lt 120 -and $c.B -lt 100 -and ($c.R - $c.B) -gt 20)
}
function IsCastleish($c) {
  return (IsWarmCastle $c) -or (IsPinkFlag $c) -or (IsBrownPole $c) -or ($c.R -gt 235 -and $c.G -gt 235 -and $c.B -gt 230)
}
function IsCastleBody($c) {
  if (IsWarmCastle $c) { return $true }
  if (IsPinkFlag $c) { return $true }
  if (IsBrownPole $c) { return $true }
  if ($c.R -gt 230 -and $c.G -gt 230 -and $c.B -gt 230) { return $true }
  if ($c.R -gt 235 -and $c.G -gt 170 -and $c.B -lt 170) { return $true } # door
  return $false
}

function ToSvg($bmp, $path) {
  $ms = New-Object System.IO.MemoryStream
  $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
  $b64 = [Convert]::ToBase64String($ms.ToArray())
  $ms.Dispose()
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
  [System.IO.File]::WriteAllText($path, $svg)
}

$lg = LoadLong
$bg = $lg.bmp.GetPixel(5, 400)
$scale = 393.0 / 360.0

function MakeScaled($src, $y0, $y1) {
  $h = $y1 - $y0 + 1
  $crop = $src.Clone((New-Object System.Drawing.Rectangle(0, $y0, $src.Width, $h)), $src.PixelFormat)
  $scaled = New-Object System.Drawing.Bitmap($crop, 393, [int][Math]::Round($h * $scale))
  $crop.Dispose()
  return $scaled
}

# Clean tiles
$bridge = MakeScaled $lg.bmp 685 1214
$segment = MakeScaled $lg.bmp 1215 1526

# Extract solid flagged castle
$sx = 135; $sy = 332; $sw = 92; $sh = 100
$crop = $lg.bmp.Clone((New-Object System.Drawing.Rectangle($sx, $sy, $sw, $sh)), $lg.bmp.PixelFormat)
$mask = New-Object 'bool[,]' $sw, $sh
for ($y = 0; $y -lt $sh; $y++) {
  for ($x = 0; $x -lt $sw; $x++) {
    if (IsCastleBody ($crop.GetPixel($x, $y))) { $mask[$x, $y] = $true }
  }
}
for ($iter = 0; $iter -lt 4; $iter++) {
  $next = New-Object 'bool[,]' $sw, $sh
  for ($y = 0; $y -lt $sh; $y++) {
    for ($x = 0; $x -lt $sw; $x++) {
      if ($mask[$x, $y]) { $next[$x, $y] = $true; continue }
      $near = $false
      foreach ($d in @(@(1,0),@(-1,0),@(0,1),@(0,-1),@(1,1),@(1,-1),@(-1,1),@(-1,-1))) {
        $nx = $x + $d[0]; $ny = $y + $d[1]
        if ($nx -lt 0 -or $ny -lt 0 -or $nx -ge $sw -or $ny -ge $sh) { continue }
        if ($mask[$nx, $ny]) { $near = $true; break }
      }
      if ($near -and -not (IsTeal ($crop.GetPixel($x, $y)) $bg)) { $next[$x, $y] = $true }
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
$cw = [int][Math]::Round($sw * $scale)
$ch = [int][Math]::Round($sh * $scale)
$castle = New-Object System.Drawing.Bitmap($spriteSrc, $cw, $ch)
$spriteSrc.Dispose()
$castle.Save('C:\Users\user\.cursor\projects\loopin-webapp\public\assets\map-castle-red-flag.png', [System.Drawing.Imaging.ImageFormat]::Png)

function FindBands($bmp) {
  $list = @()
  $in = $false; $y0 = 0; $x0 = 0; $x1 = 0
  for ($y = 0; $y -lt $bmp.Height; $y++) {
    $cnt = 0; $rmin = -1; $rmax = -1
    for ($x = 0; $x -lt $bmp.Width; $x++) {
      if (IsWarmCastle ($bmp.GetPixel($x, $y))) {
        $cnt++; if ($rmin -lt 0) { $rmin = $x }; $rmax = $x
      }
    }
    if ($cnt -gt 18 -and ($rmax - $rmin) -gt 48) {
      if (-not $in) { $in = $true; $y0 = $y; $x0 = $rmin; $x1 = $rmax }
      else {
        if ($rmin -lt $x0) { $x0 = $rmin }
        if ($rmax -gt $x1) { $x1 = $rmax }
      }
    } elseif ($in) {
      $list += [pscustomobject]@{ y0 = $y0; y1 = ($y - 1); x0 = $x0; x1 = $x1; cx = [int](($x0 + $x1) / 2) }
      $in = $false
    }
  }
  return $list
}

function EraseThenPaint($bmp, $castle, $label) {
  $bands = FindBands $bmp
  Write-Output ("{0}: {1} castles" -f $label, $bands.Count)
  $teal = $bmp.GetPixel(8, 8)
  foreach ($b in $bands) {
    # erase old castle (+ room for flag above)
    $ex0 = [Math]::Max(0, $b.x0 - 12)
    $ex1 = [Math]::Min($bmp.Width - 1, $b.x1 + 12)
    $ey0 = [Math]::Max(0, $b.y0 - 45)
    $ey1 = [Math]::Min($bmp.Height - 1, $b.y1 + 8)
    for ($y = $ey0; $y -le $ey1; $y++) {
      for ($x = $ex0; $x -le $ex1; $x++) {
        $c = $bmp.GetPixel($x, $y)
        if (IsCastleish $c) {
          $bmp.SetPixel($x, $y, $teal)
        }
      }
    }
    # paint new
    $dx = [int]($b.cx - $castle.Width / 2)
    $dy = $b.y1 - $castle.Height + 6
    if ($dy -lt 0) {
      Write-Output ("  skip paint dy={0} (needs pad) band y{1}..{2}" -f $dy, $b.y0, $b.y1)
      # still record for overlay; for bake, pad canvas later
    }
    Write-Output ("  erase ({0}..{1},{2}..{3}) paint ({4},{5})" -f $ex0, $ex1, $ey0, $ey1, $dx, $dy)
  }

  # pad if needed
  $minDy = 0
  foreach ($b in $bands) {
    $dy = $b.y1 - $castle.Height + 6
    if ($dy -lt $minDy) { $minDy = $dy }
  }
  $pad = 0
  $canvas = $bmp
  if ($minDy -lt 0) {
    $pad = -$minDy
    $canvas = New-Object System.Drawing.Bitmap($bmp.Width, ($bmp.Height + $pad))
    $cg = [System.Drawing.Graphics]::FromImage($canvas)
    $cg.Clear($teal)
    $cg.DrawImage($bmp, 0, $pad)
    $cg.Dispose()
    $bmp.Dispose()
  }
  $g = [System.Drawing.Graphics]::FromImage($canvas)
  # re-find bands after erase? bottoms shifted by pad only
  foreach ($b in $bands) {
    $dx = [int]($b.cx - $castle.Width / 2)
    $dy = $b.y1 - $castle.Height + 6 + $pad
    $g.DrawImage($castle, $dx, $dy, $castle.Width, $castle.Height)
  }
  $g.Dispose()
  return @{ bmp = $canvas; pad = $pad }
}

$br = EraseThenPaint $bridge $castle 'bridge'
$sg = EraseThenPaint $segment $castle 'segment'

ToSvg $br.bmp 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-map-bridge.svg'
ToSvg $sg.bmp 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-map-segment.svg'
Write-Output ("bridge {0}x{1} pad={2}" -f $br.bmp.Width, $br.bmp.Height, $br.pad)
Write-Output ("segment {0}x{1} pad={2}" -f $sg.bmp.Width, $sg.bmp.Height, $sg.pad)

# previews
function SavePrev($bmp, $x, $y, $name) {
  $c = $bmp.Clone((New-Object System.Drawing.Rectangle($x, $y, 160, 140)), $bmp.PixelFormat)
  $b = New-Object System.Drawing.Bitmap($c, 320, 280)
  $b.Save("C:\Users\user\.cursor\projects\loopin-webapp\tools\$name", [System.Drawing.Imaging.ImageFormat]::Png)
  $c.Dispose(); $b.Dispose()
}
SavePrev $br.bmp 120 0 'baked-c1.png'
SavePrev $br.bmp 120 340 'baked-c2.png'
SavePrev $sg.bmp 120 50 'baked-c3.png'

$castle.Dispose()
$br.bmp.Dispose(); $sg.bmp.Dispose()
$lg.bmp.Dispose(); $lg.ms.Dispose()
