$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$svg = Join-Path $PSScriptRoot '..\public\assets\main-home-academy-map.svg' | Resolve-Path
$raw = [IO.File]::ReadAllText($svg)
$m = [regex]::Match($raw, 'xlink:href="data:image/png;base64,([^"]+)"')
$bmp = [Drawing.Bitmap]::FromStream((New-Object IO.MemoryStream(,[Convert]::FromBase64String($m.Groups[1].Value))))
Write-Output ("png={0}x{1}" -f $bmp.Width,$bmp.Height)

function IsPurplePole([Drawing.Color]$c) {
  # lavender pole ~ #7969D3 / #9ABEEE mid
  return ($c.B -gt 160 -and $c.R -gt 90 -and $c.R -lt 200 -and $c.G -gt 90 -and $c.G -lt 200 -and ($c.B - $c.G) -gt 20 -and ($c.B - $c.R) -gt 10)
}
function IsOrangeFlag([Drawing.Color]$c) {
  return ($c.R -gt 200 -and $c.G -gt 140 -and $c.G -lt 230 -and $c.B -lt 140 -and ($c.R - $c.B) -gt 60)
}

# Scan for purple pole + orange flag clusters
$hits = @()
for ($y = 250; $y -lt [Math]::Min(500, $bmp.Height); $y++) {
  for ($x = 0; $x -le 90; $x++) {
    $c = $bmp.GetPixel($x, $y)
    if (IsPurplePole $c -or IsOrangeFlag $c) {
      $hits += [pscustomobject]@{x=$x;y=$y;r=$c.R;g=$c.G;b=$c.B;kind=$(if(IsPurplePole $c){'P'}else{'O'})}
    }
  }
}
Write-Output ("start-zone hits={0}" -f $hits.Count)
if ($hits.Count -gt 0) {
  Write-Output ("x={0}..{1} y={2}..{3}" -f ($hits|Measure x -Minimum).Minimum,($hits|Measure x -Maximum).Maximum,($hits|Measure y -Minimum).Minimum,($hits|Measure y -Maximum).Maximum)
}

# Mid-map seams / tile starts: BUNDLE_START was 373, tiles every 2192 from 2565
$PERIOD=2192; $CROP=2565
foreach ($sy in @($CROP, ($CROP+$PERIOD), ($CROP+2*$PERIOD))) {
  $y0 = $sy; $y1 = [Math]::Min($sy+80, $bmp.Height-1)
  $n=0; $minX=999;$maxX=-1;$minY=999;$maxY=-1
  for ($y=$y0;$y -le $y1;$y++) {
    for ($x=0;$x -le 80;$x++) {
      $c=$bmp.GetPixel($x,$y)
      if (IsPurplePole $c -or IsOrangeFlag $c) {
        $n++; if($x -lt $minX){$minX=$x}; if($x -gt $maxX){$maxX=$x}; if($y -lt $minY){$minY=$y}; if($y -gt $maxY){$maxY=$y}
      }
    }
  }
  Write-Output ("seam-ish y={0}..{1} flagHits={2} x={3}..{4} yHit={5}..{6}" -f $y0,$y1,$n,$minX,$maxX,$minY,$maxY)
}

# Also scan whole map for orange flag triangles (count clusters)
$allOrange=0
for ($y=0;$y -lt $bmp.Height;$y+=2) {
  for ($x=0;$x -lt 100;$x+=2) {
    if (IsOrangeFlag ($bmp.GetPixel($x,$y))) { $allOrange++ }
  }
}
Write-Output ("orange samples left-col={0}" -f $allOrange)

# Save crop of start area from PNG
$outDir = Join-Path $PSScriptRoot '..\tmp-castle-align' | Resolve-Path
$crop = $bmp.Clone((New-Object Drawing.Rectangle 0,250,100,120), $bmp.PixelFormat)
$crop.Save("$outDir\flag-start-raster.png", [Drawing.Imaging.ImageFormat]::Png)
$crop.Dispose()
Write-Output "wrote flag-start-raster.png"
$bmp.Dispose()
