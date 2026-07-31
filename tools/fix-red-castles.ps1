$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

function LoadSvgPng($path) {
  $s = Get-Content -LiteralPath $path -Raw -Encoding UTF8
  [void]($s -match 'base64,([A-Za-z0-9+/=]+)')
  $ms = New-Object System.IO.MemoryStream(, [Convert]::FromBase64String($Matches[1]))
  $bmp = New-Object System.Drawing.Bitmap($ms)
  return @{ bmp = $bmp; ms = $ms }
}

function IsTeal($c, $bg) {
  return ([Math]::Abs($c.R - $bg.R) -lt 24 -and [Math]::Abs($c.G - $bg.G) -lt 24 -and [Math]::Abs($c.B - $bg.B) -lt 24)
}

function IsYellowPath($c) {
  # path glow — exclude pinkish door/flag by requiring green strongly above blue and not too red-dominant pink
  return ($c.R -gt 230 -and $c.G -gt 210 -and $c.B -lt 200 -and ($c.G - $c.B) -gt 45 -and ($c.R - $c.G) -lt 50)
}

function IsCastleBody($c) {
  # red/orange body, pink flag, brown pole, white window, warm door
  if ($c.R -gt 200 -and $c.G -lt 210 -and $c.B -lt 180 -and ($c.R - $c.B) -gt 25) { return $true }
  if ($c.R -gt 90 -and $c.R -lt 160 -and $c.G -lt 110 -and $c.B -lt 90) { return $true } # brown pole
  if ($c.R -gt 230 -and $c.G -gt 230 -and $c.B -gt 230) { return $true } # white window
  if ($c.R -gt 240 -and $c.G -gt 180 -and $c.B -lt 160) { return $true } # door yellow-orange
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

$lg = LoadSvgPng ((Get-ChildItem 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\*LONG.svg').FullName)
$bg = $lg.bmp.GetPixel(5, 400)
$scale = 393.0 / 360.0

# --- 1) Rebuild clean bridge (LONG 685..1214) & segment (1215..1526) ---
function MakeScaledCrop($src, $y0, $y1) {
  $h = $y1 - $y0 + 1
  $crop = $src.Clone((New-Object System.Drawing.Rectangle(0, $y0, $src.Width, $h)), $src.PixelFormat)
  $tw = 393
  $th = [int][Math]::Round($h * $scale)
  $scaled = New-Object System.Drawing.Bitmap($crop, $tw, $th)
  $crop.Dispose()
  return $scaled
}

$bridge = MakeScaledCrop $lg.bmp 685 1214
$segment = MakeScaledCrop $lg.bmp 1215 1526
Write-Output ("clean bridge {0}x{1} segment {1}" -f $bridge.Width, $bridge.Height, $segment.Height)
Write-Output ("segment {0}x{1}" -f $segment.Width, $segment.Height)

# --- 2) Extract flagged castle with safe mask ---
$sx = 135; $sy = 332; $sw = 92; $sh = 100
$crop = $lg.bmp.Clone((New-Object System.Drawing.Rectangle($sx, $sy, $sw, $sh)), $lg.bmp.PixelFormat)

# seed castle mask from body pixels, dilate a few times
$mask = New-Object 'bool[,]' $sw, $sh
for ($y = 0; $y -lt $sh; $y++) {
  for ($x = 0; $x -lt $sw; $x++) {
    if (IsCastleBody ($crop.GetPixel($x, $y))) { $mask[$x, $y] = $true }
  }
}
for ($iter = 0; $iter -lt 3; $iter++) {
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
      # only dilate into non-teal (soft edge / sparkle / shadow)
      if ($near -and -not (IsTeal ($crop.GetPixel($x, $y)) $bg)) { $next[$x, $y] = $true }
    }
  }
  $mask = $next
}

$out = New-Object System.Drawing.Bitmap($sw, $sh, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
for ($y = 0; $y -lt $sh; $y++) {
  for ($x = 0; $x -lt $sw; $x++) {
    if ($mask[$x, $y]) {
      $c = $crop.GetPixel($x, $y)
      $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $c.R, $c.G, $c.B))
    } else {
      $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
    }
  }
}
$crop.Dispose()

$cw = [int][Math]::Round($sw * $scale)
$ch = [int][Math]::Round($sh * $scale)
$castle = New-Object System.Drawing.Bitmap($out, $cw, $ch)
$out.Dispose()
$castle.Save('C:\Users\user\.cursor\projects\loopin-webapp\public\assets\map-castle-red-flag.png', [System.Drawing.Imaging.ImageFormat]::Png)

# hole check
$hole = 0
for ($y = [int]($ch * 0.65); $y -lt ($ch - 1); $y++) {
  for ($x = 15; $x -lt ($cw - 15); $x++) {
    if ($castle.GetPixel($x, $y).A -lt 40) { $hole++ }
  }
}
Write-Output ("castle {0}x{1} lower holes={2}" -f $cw, $ch, $hole)

$prev = New-Object System.Drawing.Bitmap(($cw + 40), ($ch + 40))
$g = [System.Drawing.Graphics]::FromImage($prev)
$g.Clear([System.Drawing.Color]::FromArgb(255, 172, 230, 220))
$g.DrawImage($castle, 20, 20)
# also draw on yellow path strip to verify no crack
$g.Dispose()
$prev.Save('C:\Users\user\.cursor\projects\loopin-webapp\tools\castle-flag-fixed.png', [System.Drawing.Imaging.ImageFormat]::Png)
$prev.Dispose()

# --- 3) Bake castles into clean bridge/segment (bottom-aligned, y>=0 for body; allow negative clip for flag on first) ---
function IsWarm($c) {
  return ($c.R -gt 200 -and $c.G -gt 60 -and $c.G -lt 200 -and $c.B -lt 160 -and ($c.R - $c.B) -gt 50)
}
function FindBands($bmp) {
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
      $list += [pscustomobject]@{ bottom = ($y - 1); cx = [int](($x0 + $x1) / 2); y0 = $y0 }
      $in = $false
    }
  }
  return $list
}

function Bake($bmp, $castle, $label) {
  $bands = FindBands $bmp
  Write-Output ("{0} bands={1}" -f $label, $bands.Count)
  # For first band near top: pad canvas so flag fits
  $minDy = 0
  foreach ($b in $bands) {
    $dy = $b.bottom - $castle.Height + 6
    if ($dy -lt $minDy) { $minDy = $dy }
  }
  $pad = 0
  if ($minDy -lt 0) { $pad = -$minDy }
  $canvas = $bmp
  if ($pad -gt 0) {
    $canvas = New-Object System.Drawing.Bitmap($bmp.Width, ($bmp.Height + $pad))
    $cg = [System.Drawing.Graphics]::FromImage($canvas)
    # fill pad with teal sampled from top
    $cg.Clear($bmp.GetPixel(5, 2))
    $cg.DrawImage($bmp, 0, $pad)
    $cg.Dispose()
    Write-Output ("  padded top by {0}px" -f $pad)
  }
  $g = [System.Drawing.Graphics]::FromImage($canvas)
  foreach ($b in $bands) {
    $dx = [int]($b.cx - $castle.Width / 2)
    $dy = $b.bottom - $castle.Height + 6 + $pad
    Write-Output ("  paint ({0},{1})" -f $dx, $dy)
    $g.DrawImage($castle, $dx, $dy, $castle.Width, $castle.Height)
  }
  $g.Dispose()
  if ($pad -gt 0 -and $bmp -ne $canvas) { $bmp.Dispose() }
  return @{ bmp = $canvas; pad = $pad }
}

$brR = Bake $bridge $castle 'bridge'
$sgR = Bake $segment $castle 'segment'

ToSvg $brR.bmp 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-map-bridge.svg'
ToSvg $sgR.bmp 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-map-segment.svg'
Write-Output ("FINAL bridge {0}x{1} pad={2}" -f $brR.bmp.Width, $brR.bmp.Height, $brR.pad)
Write-Output ("FINAL segment {0}x{1} pad={2}" -f $sgR.bmp.Width, $sgR.bmp.Height, $sgR.pad)
Write-Output ("MAP_BRIDGE_H should be {0}" -f $brR.bmp.Height)
Write-Output ("MAP_BRIDGE_OVERLAP should be {0}" -f (16 + $brR.pad))
Write-Output ("MAP_SEGMENT_H should be {0}" -f $sgR.bmp.Height)

$castle.Dispose()
$brR.bmp.Dispose(); $sgR.bmp.Dispose()
$lg.bmp.Dispose(); $lg.ms.Dispose()
