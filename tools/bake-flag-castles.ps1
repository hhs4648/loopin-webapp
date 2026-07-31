$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

function LoadSvgPng($path) {
  $s = Get-Content -LiteralPath $path -Raw -Encoding UTF8
  [void]($s -match 'base64,([A-Za-z0-9+/=]+)')
  $ms = New-Object System.IO.MemoryStream(, [Convert]::FromBase64String($Matches[1]))
  $bmp = New-Object System.Drawing.Bitmap($ms)
  return @{ bmp = $bmp; ms = $ms }
}

function IsBgOrPath($c, $bg) {
  if ([Math]::Abs($c.R - $bg.R) -lt 24 -and [Math]::Abs($c.G - $bg.G) -lt 24 -and [Math]::Abs($c.B - $bg.B) -lt 24) {
    return $true
  }
  # yellow path / soft glow connected to map (not pink flag)
  if ($c.R -gt 225 -and $c.G -gt 195 -and $c.B -lt 215 -and ($c.G - $c.B) -gt 35 -and ($c.R - $c.B) -gt 25 -and $c.G -gt 180) {
    return $true
  }
  return $false
}

function ExtractFlagCastle($src, $sx, $sy, $sw, $sh, $bg) {
  $crop = $src.Clone((New-Object System.Drawing.Rectangle($sx, $sy, $sw, $sh)), $src.PixelFormat)
  # flood-fill removable bg/path from edges → keep castle body + flag + door glow intact
  $kill = New-Object 'bool[,]' $sw, $sh
  $q = New-Object System.Collections.Generic.Queue[object]
  for ($x = 0; $x -lt $sw; $x++) {
    foreach ($y in @(0, ($sh - 1))) {
      if (IsBgOrPath ($crop.GetPixel($x, $y)) $bg) {
        if (-not $kill[$x, $y]) { $kill[$x, $y] = $true; $q.Enqueue(@($x, $y)) }
      }
    }
  }
  for ($y = 0; $y -lt $sh; $y++) {
    foreach ($x in @(0, ($sw - 1))) {
      if (IsBgOrPath ($crop.GetPixel($x, $y)) $bg) {
        if (-not $kill[$x, $y]) { $kill[$x, $y] = $true; $q.Enqueue(@($x, $y)) }
      }
    }
  }
  while ($q.Count -gt 0) {
    $p = $q.Dequeue()
    $x = $p[0]; $y = $p[1]
    foreach ($d in @(@(1, 0), @(-1, 0), @(0, 1), @(0, -1))) {
      $nx = $x + $d[0]; $ny = $y + $d[1]
      if ($nx -lt 0 -or $ny -lt 0 -or $nx -ge $sw -or $ny -ge $sh) { continue }
      if ($kill[$nx, $ny]) { continue }
      if (IsBgOrPath ($crop.GetPixel($nx, $ny)) $bg) {
        $kill[$nx, $ny] = $true
        $q.Enqueue(@($nx, $ny))
      }
    }
  }

  $out = New-Object System.Drawing.Bitmap($sw, $sh, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  for ($y = 0; $y -lt $sh; $y++) {
    for ($x = 0; $x -lt $sw; $x++) {
      if ($kill[$x, $y]) {
        $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
      } else {
        $c = $crop.GetPixel($x, $y)
        $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $c.R, $c.G, $c.B))
      }
    }
  }
  $crop.Dispose()
  return $out
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

$lg = LoadSvgPng ((Get-ChildItem 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\*LONG.svg').FullName)
$bg = $lg.bmp.GetPixel(5, 400)

# Source flagged castle in LONG
$sx = 135; $sy = 332; $sw = 92; $sh = 100
$castleSrc = ExtractFlagCastle $lg.bmp $sx $sy $sw $sh $bg
$scale = 393.0 / 360.0
$cw = [int][Math]::Round($sw * $scale)
$ch = [int][Math]::Round($sh * $scale)
$castle = New-Object System.Drawing.Bitmap($castleSrc, $cw, $ch)
$castle.Save('C:\Users\user\.cursor\projects\loopin-webapp\public\assets\map-castle-red-flag.png', [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output ("castle sprite {0}x{1}" -f $cw, $ch)

# Preview
$prev = New-Object System.Drawing.Bitmap(($cw + 40), ($ch + 40))
$pg = [System.Drawing.Graphics]::FromImage($prev)
$pg.Clear([System.Drawing.Color]::FromArgb(255, 172, 230, 220))
$pg.DrawImage($castle, 20, 20)
$pg.Dispose()
$prev.Save('C:\Users\user\.cursor\projects\loopin-webapp\tools\castle-flag-fixed.png', [System.Drawing.Imaging.ImageFormat]::Png)
$prev.Dispose()

# --- Paint into bridge ---
function LoadBridgeOrSeg($path) {
  return LoadSvgPng $path
}

function FindRedBottoms($bmp) {
  function IsWarm($c) {
    return ($c.R -gt 200 -and $c.G -gt 60 -and $c.G -lt 200 -and $c.B -lt 160 -and ($c.R - $c.B) -gt 50)
  }
  $list = @()
  $in = $false; $y0 = 0; $x0 = 0; $x1 = 0
  for ($y = 0; $y -lt $bmp.Height; $y++) {
    $cnt = 0; $rmin = -1; $rmax = -1
    for ($x = 0; $x -lt $bmp.Width; $x++) {
      if (IsWarm ($bmp.GetPixel($x, $y))) {
        $cnt++; if ($rmin -lt 0) { $rmin = $x }; $rmax = $x
      }
    }
    if ($cnt -gt 20 -and ($rmax - $rmin) -gt 50) {
      if (-not $in) { $in = $true; $y0 = $y; $x0 = $rmin; $x1 = $rmax }
      else {
        if ($rmin -lt $x0) { $x0 = $rmin }
        if ($rmax -gt $x1) { $x1 = $rmax }
      }
    } elseif ($in) {
      $list += [pscustomobject]@{ y0 = $y0; y1 = ($y - 1); x0 = $x0; x1 = $x1; cx = [int](($x0 + $x1) / 2); bottom = ($y - 1) }
      $in = $false
    }
  }
  return $list
}

function PaintCastles($bmp, $castle, $label) {
  $bands = FindRedBottoms $bmp
  Write-Output ("{0} red bands: {1}" -f $label, $bands.Count)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  foreach ($b in $bands) {
    $dx = [int]($b.cx - $castle.Width / 2)
    $dy = $b.bottom - $castle.Height + 8  # slight overlap so bottom covers door area
    Write-Output ("  paint at ({0},{1}) covering band y{2}..{3}" -f $dx, $dy, $b.y0, $b.bottom)
    $g.DrawImage($castle, $dx, $dy, $castle.Width, $castle.Height)
  }
  $g.Dispose()
}

$br = LoadBridgeOrSeg 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-map-bridge.svg'
PaintCastles $br.bmp $castle 'bridge'
ToSvg $br.bmp 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-map-bridge.svg'
Write-Output 'updated bridge svg'

$sg = LoadBridgeOrSeg 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-map-segment.svg'
PaintCastles $sg.bmp $castle 'segment'
ToSvg $sg.bmp 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-map-segment.svg'
Write-Output 'updated segment svg'

# check holes in new sprite
$hole = 0
for ($y = [int]($castle.Height * 0.7); $y -lt $castle.Height - 2; $y++) {
  for ($x = 20; $x -lt ($castle.Width - 20); $x++) {
    if ($castle.GetPixel($x, $y).A -lt 40) { $hole++ }
  }
}
Write-Output ("lower interior transparent px: {0}" -f $hole)

$castle.Dispose(); $castleSrc.Dispose()
$br.bmp.Dispose(); $br.ms.Dispose()
$sg.bmp.Dispose(); $sg.ms.Dispose()
$lg.bmp.Dispose(); $lg.ms.Dispose()
