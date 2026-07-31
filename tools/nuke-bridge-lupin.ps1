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
  if ($c.B -gt 140 -and $c.B -gt ($c.R + 25) -and $c.B -gt ($c.G + 5) -and $c.R -lt 180) { return $true }
  if ($c.R -gt 200 -and $c.B -gt 150 -and $c.G -lt 195 -and ($c.R - $c.G) -gt 40) { return $true }
  return $false
}
function IsPillBlue($c) {
  return ($c.B -gt 170 -and $c.R -lt 130 -and $c.G -gt 90 -and $c.G -lt 190 -and ($c.B - $c.R) -gt 70)
}
function IsYellowGreenCastle($c) {
  # yellow-lime castle body (not red)
  return ($c.R -gt 200 -and $c.G -gt 180 -and $c.B -lt 160 -and ($c.G - $c.B) -gt 40 -and ($c.R - $c.B) -gt 50)
}

$br = LoadSvgPng 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-map-bridge.svg'
$bmp = $br.bmp
$sky = $bmp.GetPixel(10, 10)

# Find lupin
$minX=999;$maxX=-1;$minY=999;$maxY=-1
for ($y=200; $y -lt 350; $y++) {
  for ($x=40; $x -lt 150; $x++) {
    if (IsLupin ($bmp.GetPixel($x,$y))) {
      if($x -lt $minX){$minX=$x}; if($x -gt $maxX){$maxX=$x}
      if($y -lt $minY){$minY=$y}; if($y -gt $maxY){$maxY=$y}
    }
  }
}
Write-Output ("lupin {0}..{1} x {2}..{3}" -f $minY,$maxY,$minX,$maxX)

# Find yellow-green castle body below
$cMinX=999;$cMaxX=-1;$cMinY=999;$cMaxY=-1
for ($y=280; $y -lt 420; $y++) {
  for ($x=40; $x -lt 180; $x++) {
    if (IsYellowGreenCastle ($bmp.GetPixel($x,$y))) {
      if($x -lt $cMinX){$cMinX=$x}; if($x -gt $cMaxX){$cMaxX=$x}
      if($y -lt $cMinY){$cMinY=$y}; if($y -gt $cMaxY){$cMaxY=$y}
    }
  }
}
Write-Output ("yg-castle {0}..{1} x {2}..{3}" -f $cMinY,$cMaxY,$cMinX,$cMaxX)

# Nuclear: fill a pad around lupin with sky (character completely gone)
$fx0=[Math]::Max(0,$minX-12); $fx1=[Math]::Min($bmp.Width-1,$maxX+12)
$fy0=[Math]::Max(0,$minY-10); $fy1=[Math]::Min($bmp.Height-1,$maxY+2)
# don't paint over castle body — stop at castle top
if ($cMinY -gt 0 -and $fy1 -ge $cMinY) { $fy1 = $cMinY - 1 }
Write-Output ("sky-fill ({0}..{1},{2}..{3})" -f $fx0,$fx1,$fy0,$fy1)
for ($y=$fy0; $y -le $fy1; $y++) {
  for ($x=$fx0; $x -le $fx1; $x++) {
    $bmp.SetPixel($x,$y,$sky)
  }
}

# Also remove any remaining lupin pixels that overlap castle top crenellations
$extra=0
for ($y=$cMinY; $y -le [Math]::Min($cMinY+25, $bmp.Height-1); $y++) {
  for ($x=$cMinX; $x -le $cMaxX; $x++) {
    $c=$bmp.GetPixel($x,$y)
    if (IsLupin $c -or ($c.R -lt 50 -and $c.G -lt 50 -and $c.B -lt 50)) {
      # replace with nearby castle color
      $rep=$null
      foreach ($d in @(@(0,3),(0,5),(0,8),(3,3),(-3,3))) {
        $nx=$x+$d[0]; $ny=$y+$d[1]
        if ($nx -lt 0 -or $ny -lt 0 -or $nx -ge $bmp.Width -or $ny -ge $bmp.Height) { continue }
        $nc=$bmp.GetPixel($nx,$ny)
        if (IsYellowGreenCastle $nc) { $rep=$nc; break }
      }
      if ($null -ne $rep) { $bmp.SetPixel($x,$y,$rep); $extra++ }
      else { $bmp.SetPixel($x,$y,$sky); $extra++ }
    }
  }
}
Write-Output ("crenellation cleanup px={0}" -f $extra)

# Remove 「현재 위치」 pill under this castle — find compact pill band
$pMinX=999;$pMaxX=-1;$pMinY=999;$pMaxY=-1
for ($y=$cMaxY; $y -lt [Math]::Min($bmp.Height-1, $cMaxY+60); $y++) {
  $cnt=0;$rmin=-1;$rmax=-1
  for ($x=[Math]::Max(0,$cMinX-30); $x -le [Math]::Min($bmp.Width-1,$cMaxX+30); $x++) {
    if (IsPillBlue ($bmp.GetPixel($x,$y))) {
      $cnt++; if($rmin -lt 0){$rmin=$x}; $rmax=$x
    }
  }
  if ($cnt -gt 25 -and ($rmax-$rmin) -gt 45) {
    if ($y -lt $pMinY) { $pMinY=$y }
    if ($y -gt $pMaxY) { $pMaxY=$y }
    if ($rmin -lt $pMinX) { $pMinX=$rmin }
    if ($rmax -gt $pMaxX) { $pMaxX=$rmax }
  }
}
if ($pMaxX -gt 0 -and ($pMaxY-$pMinY) -lt 40) {
  Write-Output ("pill erase y={0}..{1} x={2}..{3}" -f $pMinY,$pMaxY,$pMinX,$pMaxX)
  for ($y=$pMinY; $y -le $pMaxY; $y++) {
    for ($x=$pMinX; $x -le $pMaxX; $x++) {
      $c=$bmp.GetPixel($x,$y)
      if ((IsPillBlue $c) -or ($c.R -gt 210 -and $c.G -gt 210 -and $c.B -gt 210)) {
        $bmp.SetPixel($x,$y,$sky)
      }
    }
  }
} else { Write-Output 'no compact pill' }

# Save
$ms=New-Object System.IO.MemoryStream
$bmp.Save($ms,[System.Drawing.Imaging.ImageFormat]::Png)
$b64=[Convert]::ToBase64String($ms.ToArray()); $ms.Dispose()
$w=$bmp.Width;$h=$bmp.Height
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
"@ | Set-Content -LiteralPath 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-map-bridge.svg' -Encoding UTF8

$prev=$bmp.Clone((New-Object System.Drawing.Rectangle(40,220,140,200)),$bmp.PixelFormat)
$big=New-Object System.Drawing.Bitmap($prev,280,400)
$big.Save('C:\Users\user\.cursor\projects\loopin-webapp\tools\bridge-lupin-erased.png',[System.Drawing.Imaging.ImageFormat]::Png)
Write-Output 'done'
$prev.Dispose();$big.Dispose();$bmp.Dispose();$br.ms.Dispose()
