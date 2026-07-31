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

# Start from CURRENT bridge (has red flags) — only fix yellow-castle character zone
$br = LoadSvgPng 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-map-bridge.svg'
$bmp = $br.bmp

# Sample true background from quiet area (right side, upper)
$sky = $bmp.GetPixel(300, 40)
Write-Output ("sky sample #{0:X2}{1:X2}{2:X2}" -f $sky.R,$sky.G,$sky.B)

# Hard rect covering known character + previous bad fill: x50..130, y220..287
# Yellow castle top starts ~288
for ($y=220; $y -le 287; $y++) {
  for ($x=50; $x -le 130; $x++) {
    $bmp.SetPixel($x,$y,$sky)
  }
}

# Clean castle top rows 288..320: replace non-castle leftover with vertical sample from body
function IsYG($c) {
  return ($c.R -gt 190 -and $c.G -gt 170 -and $c.B -lt 175 -and ($c.G - $c.B) -gt 30)
}
for ($y=288; $y -le 320; $y++) {
  for ($x=50; $x -le 160; $x++) {
    $c=$bmp.GetPixel($x,$y)
    # leftover blue/pink/dark/wrong-sky
    $bad = ($c.B -gt ($c.R + 15) -and $c.B -gt 130) -or `
      ($c.R -gt 200 -and $c.B -gt 150 -and $c.G -lt 190 -and ($c.R-$c.G) -gt 40) -or `
      ($c.R -lt 55 -and $c.G -lt 55 -and $c.B -lt 55) -or `
      ([Math]::Abs($c.R - $sky.R) -lt 8 -and [Math]::Abs($c.G - $sky.G) -lt 8 -and [Math]::Abs($c.B - $sky.B) -lt 8)
    if ($bad) {
      $rep=$null
      for ($dy=8; $dy -le 40; $dy+=4) {
        $nc=$bmp.GetPixel($x, [Math]::Min(409, $y+$dy))
        if (IsYG $nc) { $rep=$nc; break }
      }
      if ($null -eq $rep) { $rep = $bmp.GetPixel(100, 350) }
      $bmp.SetPixel($x,$y,$rep)
    }
  }
}

# Erase 「현재 위치」 pill — detect by finding blue horizontal band with white text
$pillRows = @()
for ($y=360; $y -lt 420; $y++) {
  $blue=0; $white=0; $rmin=-1; $rmax=-1
  for ($x=40; $x -lt 160; $x++) {
    $c=$bmp.GetPixel($x,$y)
    $isBlue = ($c.B -gt 150 -and ($c.B-$c.R) -gt 50 -and $c.R -lt 150)
    $isWhite = ($c.R -gt 210 -and $c.G -gt 210 -and $c.B -gt 210)
    if ($isBlue) { $blue++; if($rmin -lt 0){$rmin=$x}; $rmax=$x }
    if ($isWhite) { $white++ }
  }
  if ($blue -gt 30 -and ($rmax-$rmin) -gt 40) {
    $pillRows += [pscustomobject]@{ y=$y; x0=$rmin; x1=$rmax; blue=$blue; white=$white }
  }
}
if ($pillRows.Count -gt 0) {
  $p0 = ($pillRows | Measure-Object -Property y -Minimum).Minimum
  $p1 = ($pillRows | Measure-Object -Property y -Maximum).Maximum
  $px0 = ($pillRows | Measure-Object -Property x0 -Minimum).Minimum
  $px1 = ($pillRows | Measure-Object -Property x1 -Maximum).Maximum
  Write-Output ("pill y{0}..{1} x{2}..{3} rows={4}" -f $p0,$p1,$px0,$px1,$pillRows.Count)
  for ($y=$p0; $y -le $p1; $y++) {
    for ($x=$px0; $x -le $px1; $x++) {
      $c=$bmp.GetPixel($x,$y)
      $isBlue = ($c.B -gt 140 -and ($c.B-$c.R) -gt 40 -and $c.R -lt 160)
      $isWhite = ($c.R -gt 200 -and $c.G -gt 200 -and $c.B -gt 200)
      if ($isBlue -or $isWhite) { $bmp.SetPixel($x,$y,$sky) }
    }
  }
} else { Write-Output 'pill rows not found' }

ToSvg $bmp 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-map-bridge.svg'
$prev=$bmp.Clone((New-Object System.Drawing.Rectangle(40,220,140,200)),$bmp.PixelFormat)
$big=New-Object System.Drawing.Bitmap($prev,280,400)
$big.Save('C:\Users\user\.cursor\projects\loopin-webapp\tools\bridge-lupin-erased.png',[System.Drawing.Imaging.ImageFormat]::Png)
Write-Output 'ok'
$prev.Dispose();$big.Dispose();$bmp.Dispose();$br.ms.Dispose()
