$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Join-Path $PSScriptRoot '..' | Resolve-Path
$svgPath = Join-Path $root 'public\assets\main-home-academy-map.svg'
$previewDir = Join-Path $root 'tmp-castle-align'
New-Item -ItemType Directory -Force -Path $previewDir | Out-Null

$svg = [IO.File]::ReadAllText($svgPath)
if ($svg -match 'viewBox="[^"]+\s+(\d+(?:\.\d+)?)"') {
  Write-Output "viewBoxH=$($Matches[1])"
}
$m = [regex]::Match($svg, 'xlink:href="data:image/png;base64,([^"]+)"')
if (-not $m.Success) {
  $m = [regex]::Match($svg, 'href="data:image/png;base64,([^"]+)"')
}
if (-not $m.Success) { throw 'no embedded png' }

$bytes = [Convert]::FromBase64String($m.Groups[1].Value)
$ms = New-Object IO.MemoryStream(,$bytes)
$bmp = [Drawing.Bitmap]::FromStream($ms)
Write-Output "png=$($bmp.Width)x$($bmp.Height)"

$grass = [Drawing.Color]::FromArgb(255, 171, 231, 219)
function RowNonGrass([Drawing.Bitmap]$b, [int]$y) {
  $n = 0
  for ($x = 40; $x -lt $b.Width - 40; $x += 4) {
    $c = $b.GetPixel($x, $y)
    if ([Math]::Abs($c.R - $grass.R) + [Math]::Abs($c.G - $grass.G) + [Math]::Abs($c.B - $grass.B) -gt 45) {
      $n++
    }
  }
  return $n
}

foreach ($y in @(2500, 2560, 2565, 2570, 2600, 2618, 4700, 4757, 4800)) {
  if ($y -ge $bmp.Height) { continue }
  Write-Output ("y={0} nongrass={1}" -f $y, (RowNonGrass $bmp $y))
}

foreach ($sy in @(2565, 4757, 6949, 9141)) {
  $top = [Math]::Max(0, $sy - 120)
  $h = 240
  if ($top + $h -gt $bmp.Height) { $h = $bmp.Height - $top }
  $crop = New-Object Drawing.Bitmap $bmp.Width, $h
  $g = [Drawing.Graphics]::FromImage($crop)
  $g.DrawImage(
    $bmp,
    0, 0,
    (New-Object Drawing.Rectangle 0, $top, $bmp.Width, $h),
    [Drawing.GraphicsUnit]::Pixel
  )
  $g.Dispose()
  $out = Join-Path $previewDir ("check-seam-$sy.png")
  $crop.Save($out, [Drawing.Imaging.ImageFormat]::Png)
  $crop.Dispose()
  Write-Output "wrote $out"
}

$bmp.Dispose()
$ms.Dispose()
Write-Output 'DONE'
