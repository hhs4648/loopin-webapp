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

$br = LoadSvgPng 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-map-bridge.svg'
$bmp = $br.bmp

# Find near-white blob in mid-right (patch artifact)
$minX=999;$maxX=-1;$minY=999;$maxY=-1;$n=0
for ($y=250; $y -lt 420; $y++) {
  for ($x=120; $x -lt 280; $x++) {
    $c=$bmp.GetPixel($x,$y)
    if ($c.R -gt 240 -and $c.G -gt 240 -and $c.B -gt 240) {
      $n++; if($x -lt $minX){$minX=$x}; if($x -gt $maxX){$maxX=$x}
      if($y -lt $minY){$minY=$y}; if($y -gt $maxY){$maxY=$y}
    }
  }
}
Write-Output ("white blob n={0} x{1}..{2} y{3}..{4}" -f $n,$minX,$maxX,$minY,$maxY)

# Heal: for each white-ish pixel, sample from right/below outside blob
function IsWhiteish($c) { return ($c.R -gt 235 -and $c.G -gt 235 -and $c.B -gt 235) }
function IsPath($c) { return ($c.R -gt 220 -and $c.G -gt 200 -and $c.B -lt 210 -and ($c.G-$c.B) -gt 25) }

if ($maxX -gt 0) {
  for ($y=$minY; $y -le $maxY; $y++) {
    for ($x=$minX; $x -le $maxX; $x++) {
      if (-not (IsWhiteish ($bmp.GetPixel($x,$y)))) { continue }
      $rep=$null
      foreach ($d in @(@(15,0),(25,0),(40,0),(0,15),(0,-15),(-15,0),(20,10),(-20,10))) {
        $nx=$x+$d[0]; $ny=$y+$d[1]
        if ($nx -lt 0 -or $ny -lt 0 -or $nx -ge $bmp.Width -or $ny -ge $bmp.Height) { continue }
        if ($nx -ge $minX -and $nx -le $maxX -and $ny -ge $minY -and $ny -le $maxY) {
          if (IsWhiteish ($bmp.GetPixel($nx,$ny))) { continue }
        }
        $c=$bmp.GetPixel($nx,$ny)
        if (IsWhiteish $c) { continue }
        if (IsPath $c) { $rep=$c; break }
        if ($null -eq $rep) { $rep=$c }
      }
      if ($null -ne $rep) { $bmp.SetPixel($x,$y,$rep) }
    }
  }
}

ToSvg $bmp 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-map-bridge.svg'
$prev=$bmp.Clone((New-Object System.Drawing.Rectangle(25,230,170,230)),$bmp.PixelFormat)
$big=New-Object System.Drawing.Bitmap($prev,340,460)
$big.Save('C:\Users\user\.cursor\projects\loopin-webapp\tools\bridge-lupin-erased.png',[System.Drawing.Imaging.ImageFormat]::Png)
Write-Output 'healed'
$prev.Dispose();$big.Dispose();$bmp.Dispose();$br.ms.Dispose()
