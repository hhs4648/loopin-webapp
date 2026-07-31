$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

function LoadSvgPng($path) {
  $s = Get-Content -LiteralPath $path -Raw -Encoding UTF8
  [void]($s -match 'base64,([A-Za-z0-9+/=]+)')
  $ms = New-Object System.IO.MemoryStream(, [Convert]::FromBase64String($Matches[1]))
  $bmp = New-Object System.Drawing.Bitmap($ms)
  return @{ bmp = $bmp; ms = $ms }
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

function IsLupin($c) {
  if ($c.B -gt 135 -and $c.B -gt ($c.R + 20) -and $c.B -gt ($c.G + 0) -and $c.R -lt 185 -and $c.G -lt 215) { return $true }
  if ($c.R -gt 195 -and $c.B -gt 145 -and $c.G -lt 195 -and ($c.R - $c.G) -gt 35) { return $true }
  return $false
}
function IsPillBlue($c) {
  return ($c.B -gt 160 -and $c.R -lt 140 -and $c.G -gt 80 -and $c.G -lt 200 -and ($c.B - $c.R) -gt 60)
}
function IsYellowGreen($c) {
  return ($c.R -gt 195 -and $c.G -gt 175 -and $c.B -lt 170 -and ($c.G - $c.B) -gt 35)
}

# Rebuild bridge from LONG again (clean), then surgical fix
$longPath = (Get-ChildItem 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\*LONG.svg').FullName
$lg = LoadSvgPng $longPath
$scale = 393.0 / 360.0
$bridgeStart = 650
$bh = 1214 - $bridgeStart + 1
$crop = $lg.bmp.Clone((New-Object System.Drawing.Rectangle(0, $bridgeStart, $lg.bmp.Width, $bh)), $lg.bmp.PixelFormat)
$bridge = New-Object System.Drawing.Bitmap($crop, 393, [int][Math]::Round($bh * $scale))
$crop.Dispose()
$sky = [System.Drawing.Color]::FromArgb(255, 172, 230, 220) # known map teal

function IsPinkFlagHelper($c) { return ($c.R -gt 200 -and $c.B -gt 145 -and $c.G -lt 200 -and ($c.R-$c.G) -gt 30) }
function IsBrown($c) { return ($c.R -gt 90 -and $c.R -lt 170 -and $c.G -lt 120 -and $c.B -lt 100 -and ($c.R-$c.B) -gt 20) }

# Re-bake red castles quickly using existing map-castle-red-flag.png if present
$flagPath = 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\map-castle-red-flag.png'
if (Test-Path $flagPath) {
  $flag = [System.Drawing.Bitmap]::FromFile($flagPath)
  function IsWarmRed($c) {
    return ($c.R -gt 185 -and $c.G -lt 200 -and $c.B -lt 165 -and ($c.R - $c.B) -gt 35 -and $c.G -lt ($c.R - 5))
  }
  $bands = @(); $in=$false; $y0=0;$x0=0;$x1=0
  for ($y=0; $y -lt $bridge.Height; $y++) {
    $cnt=0;$rmin=-1;$rmax=-1
    for ($x=0; $x -lt $bridge.Width; $x++) {
      if (IsWarmRed ($bridge.GetPixel($x,$y))) { $cnt++; if($rmin -lt 0){$rmin=$x}; $rmax=$x }
    }
    if ($cnt -gt 18 -and ($rmax-$rmin) -gt 48) {
      if (-not $in) { $in=$true; $y0=$y; $x0=$rmin; $x1=$rmax }
      else { if($rmin -lt $x0){$x0=$rmin}; if($rmax -gt $x1){$x1=$rmax} }
    } elseif ($in) {
      $bands += [pscustomobject]@{ y0=$y0; y1=($y-1); cx=[int](($x0+$x1)/2) }
      $in=$false
    }
  }
  $g = [System.Drawing.Graphics]::FromImage($bridge)
  foreach ($b in $bands) {
    $dx = [int]($b.cx - $flag.Width/2)
    $dy = [Math]::Max(0, $b.y1 - $flag.Height + 8)
    for ($yy=$b.y0-40; $yy -le $b.y1+6; $yy++) {
      if ($yy -lt 0 -or $yy -ge $bridge.Height) { continue }
      for ($xx=$b.cx-55; $xx -le $b.cx+55; $xx++) {
        if ($xx -lt 0 -or $xx -ge $bridge.Width) { continue }
        $c=$bridge.GetPixel($xx,$yy)
        if ((IsWarmRed $c) -or (IsPinkFlagHelper $c) -or (IsBrown $c)) { $bridge.SetPixel($xx,$yy,$sky) }
      }
    }
    $g.DrawImage($flag, $dx, $dy, $flag.Width, $flag.Height)
  }
  $g.Dispose(); $flag.Dispose()
  Write-Output ("rebaked red: {0}" -f $bands.Count)
}

# Find lupin on yellow castle
$minX=999;$maxX=-1;$minY=999;$maxY=-1
for ($y=200;$y -lt 360;$y++) {
  for ($x=40;$x -lt 150;$x++) {
    if (IsLupin ($bridge.GetPixel($x,$y))) {
      if($x -lt $minX){$minX=$x}; if($x -gt $maxX){$maxX=$x}
      if($y -lt $minY){$minY=$y}; if($y -gt $maxY){$maxY=$y}
    }
  }
}
Write-Output ("lupin y{0}..{1} x{2}..{3}" -f $minY,$maxY,$minX,$maxX)

# Yellow castle body
$cMinX=999;$cMaxX=-1;$cMinY=999;$cMaxY=-1
for ($y=270;$y -lt 430;$y++) {
  for ($x=30;$x -lt 190;$x++) {
    if (IsYellowGreen ($bridge.GetPixel($x,$y))) {
      if($x -lt $cMinX){$cMinX=$x}; if($x -gt $cMaxX){$cMaxX=$x}
      if($y -lt $cMinY){$cMinY=$y}; if($y -gt $cMaxY){$cMaxY=$y}
    }
  }
}
Write-Output ("yg y{0}..{1} x{2}..{3}" -f $cMinY,$cMaxY,$cMinX,$cMaxX)

# Fill character zone with exact sky (above castle top)
$fx0=[Math]::Max(0,$minX-14); $fx1=[Math]::Min(392,$maxX+14)
$fy0=[Math]::Max(0,$minY-12); $fy1=[Math]::Min(616, $cMinY-1)
for ($y=$fy0;$y -le $fy1;$y++) {
  for ($x=$fx0;$x -le $fx1;$x++) { $bridge.SetPixel($x,$y,$sky) }
}

# Clean top 30px of castle: any lupin/dark/non-castle → sample from lower castle body
for ($y=$cMinY; $y -le [Math]::Min($cMinY+28, $cMaxY); $y++) {
  for ($x=$cMinX; $x -le $cMaxX; $x++) {
    $c=$bridge.GetPixel($x,$y)
    $bad = (IsLupin $c) -or ($c.R -lt 60 -and $c.G -lt 60 -and $c.B -lt 60) -or `
      ([Math]::Abs($c.R-172) -lt 20 -and [Math]::Abs($c.G-230) -lt 20 -and [Math]::Abs($c.B-220) -lt 20)
    if (-not $bad -and -not (IsYellowGreen $c) -and $c.R -lt 240) {
      # soft edge leftover that's not white window
      if (($c.B -gt $c.R) -and ($c.B -gt 120)) { $bad = $true }
    }
    if ($bad) {
      $rep = $bridge.GetPixel($x, [Math]::Min($cMaxY, $y+20))
      if (-not (IsYellowGreen $rep)) { $rep = $bridge.GetPixel([int](($cMinX+$cMaxX)/2), [int](($cMinY+$cMaxY)/2)) }
      $bridge.SetPixel($x,$y,$rep)
    }
  }
}

# Erase pill — scan wider under castle
$pMinX=999;$pMaxX=-1;$pMinY=999;$pMaxY=-1
for ($y=$cMaxY-5; $y -lt [Math]::Min(616,$cMaxY+70); $y++) {
  $cnt=0;$rmin=-1;$rmax=-1
  for ($x=[Math]::Max(0,$cMinX-40); $x -le [Math]::Min(392,$cMaxX+40); $x++) {
    if (IsPillBlue ($bridge.GetPixel($x,$y))) { $cnt++; if($rmin -lt 0){$rmin=$x}; $rmax=$x }
  }
  if ($cnt -gt 20 -and ($rmax-$rmin) -gt 40) {
    if($y -lt $pMinY){$pMinY=$y}; if($y -gt $pMaxY){$pMaxY=$y}
    if($rmin -lt $pMinX){$pMinX=$rmin}; if($rmax -gt $pMaxX){$pMaxX=$rmax}
  }
}
if ($pMaxX -gt 0) {
  Write-Output ("pill y{0}..{1} x{2}..{3}" -f $pMinY,$pMaxY,$pMinX,$pMaxX)
  for ($y=$pMinY; $y -le $pMaxY; $y++) {
    for ($x=$pMinX; $x -le $pMaxX; $x++) {
      $c=$bridge.GetPixel($x,$y)
      if ((IsPillBlue $c) -or ($c.R -gt 200 -and $c.G -gt 200 -and $c.B -gt 200)) {
        $bridge.SetPixel($x,$y,$sky)
      }
    }
  }
} else { Write-Output 'pill not found' }

ToSvg $bridge 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-map-bridge.svg'
$prev=$bridge.Clone((New-Object System.Drawing.Rectangle(40,220,140,200)),$bridge.PixelFormat)
$big=New-Object System.Drawing.Bitmap($prev,280,400)
$big.Save('C:\Users\user\.cursor\projects\loopin-webapp\tools\bridge-lupin-erased.png',[System.Drawing.Imaging.ImageFormat]::Png)
Write-Output 'saved'
$prev.Dispose();$big.Dispose();$bridge.Dispose()
$lg.bmp.Dispose();$lg.ms.Dispose()
