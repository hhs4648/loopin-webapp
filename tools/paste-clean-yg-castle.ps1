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
  $w=$bmp.Width; $h=$bmp.Height
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

$lg = LoadSvgPng ((Get-ChildItem 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\*LONG.svg').FullName)
$br = LoadSvgPng 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-map-bridge.svg'
$scale = 393.0 / 360.0

# Clean YG castle LONG 631..667 (no lupin). Crop with sky above + ground below.
$sx=18; $sy=580; $sw=120; $sh=160
$clean = $lg.bmp.Clone((New-Object System.Drawing.Rectangle($sx,$sy,$sw,$sh)), $lg.bmp.PixelFormat)
$tw=[int][Math]::Round($sw*$scale)
$th=[int][Math]::Round($sh*$scale)
$patch = New-Object System.Drawing.Bitmap($clean, $tw, $th)
$clean.Dispose()

# Align clean castle top (LONG 631) to lupin castle top (LONG 954)
# dest_y so that crop offset (631-sy) lands at bridge (954-650)*scale
$destY = [int][Math]::Round(($sy - 327) * $scale)  # see calc: (Sy-327)*scale
$destX = [int][Math]::Round($sx * $scale)
Write-Output ("paste {0}x{1} at ({2},{3})" -f $tw,$th,$destX,$destY)

$g=[System.Drawing.Graphics]::FromImage($br.bmp)
$g.DrawImage($patch, $destX, $destY, $tw, $th)
$g.Dispose()

ToSvg $br.bmp 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-map-bridge.svg'

$prev=$br.bmp.Clone((New-Object System.Drawing.Rectangle(25,230,170,230)),$br.bmp.PixelFormat)
$big=New-Object System.Drawing.Bitmap($prev,340,460)
$big.Save('C:\Users\user\.cursor\projects\loopin-webapp\tools\bridge-lupin-erased.png',[System.Drawing.Imaging.ImageFormat]::Png)
Write-Output 'done'
$prev.Dispose();$big.Dispose();$patch.Dispose()
$br.bmp.Dispose();$br.ms.Dispose()
$lg.bmp.Dispose();$lg.ms.Dispose()
