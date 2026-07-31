# Erase baked start flag from academy map backup PNG (keep React flag.svg only).
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$assets = Join-Path $PSScriptRoot '..\public\assets' | Resolve-Path
$bakPath = Join-Path $assets 'main-home-academy-map.before-extend.svg'
$previewDir = Join-Path $PSScriptRoot '..\tmp-castle-align' | Resolve-Path
$raw = [IO.File]::ReadAllText($bakPath)
$m = [regex]::Match($raw, 'xlink:href="data:image/png;base64,([^"]+)"')
if (-not $m.Success) { throw 'no png' }

$bmp = New-Object Drawing.Bitmap ([IO.MemoryStream]::new([Convert]::FromBase64String($m.Groups[1].Value)))
$GRASS = [Drawing.Color]::FromArgb(255, 171, 231, 219)

function IsFlagPole([Drawing.Color]$c) {
  # lavender pole #7969D3 / #9ABEEE
  return ($c.B -gt 150 -and $c.R -gt 85 -and $c.R -lt 210 -and $c.G -gt 85 -and $c.G -lt 210 -and ($c.B - $c.G) -gt 15 -and ($c.B - $c.R) -ge 5)
}
function IsFlagCloth([Drawing.Color]$c) {
  # yellow→orange flag
  return ($c.R -gt 190 -and $c.G -gt 130 -and $c.B -lt 160 -and ($c.R - $c.B) -gt 50 -and ($c.G - $c.B) -gt 20)
}
function IsFlagPixel([Drawing.Color]$c) {
  return (IsFlagPole $c) -or (IsFlagCloth $c)
}

# Sample grass near the pole (right of flag)
$sample = $GRASS
foreach ($pt in @(@(70,300),@(80,310),@(60,340),@(90,280))) {
  $c = $bmp.GetPixel($pt[0], $pt[1])
  if (-not (IsFlagPixel $c) -and $c.G -gt 180 -and $c.B -gt 160) {
    $sample = $c
    break
  }
}

$erased = 0
# Pole ~x34-45 y260-333; flag extends right to ~70
for ($y = 255; $y -le 340; $y++) {
  for ($x = 28; $x -le 78; $x++) {
    $c = $bmp.GetPixel($x, $y)
    if (IsFlagPixel $c) {
      $bmp.SetPixel($x, $y, $sample)
      $erased++
    }
  }
}
Write-Output "erased=$erased grass=($($sample.R),$($sample.G),$($sample.B))"

$after = $bmp.Clone((New-Object Drawing.Rectangle 20,250,90,100), $bmp.PixelFormat)
$after.Save("$previewDir\flag-baked-after.png", [Drawing.Imaging.ImageFormat]::Png)
$after.Dispose()

$ms = New-Object IO.MemoryStream
$bmp.Save($ms, [Drawing.Imaging.ImageFormat]::Png)
$b64 = [Convert]::ToBase64String($ms.ToArray())
$ms.Dispose(); $bmp.Dispose()

$raw2 = $raw.Remove($m.Groups[1].Index, $m.Groups[1].Length).Insert($m.Groups[1].Index, $b64)
[IO.File]::WriteAllText($bakPath, $raw2)
Write-Output "updated backup"
