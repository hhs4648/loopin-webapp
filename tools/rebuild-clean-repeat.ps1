$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

function LoadSvgPng([string]$path) {
  $s = Get-Content -LiteralPath $path -Raw -Encoding UTF8
  [void]($s -match 'base64,([A-Za-z0-9+/=]+)')
  $ms = New-Object System.IO.MemoryStream(, [Convert]::FromBase64String($Matches[1]))
  return New-Object System.Drawing.Bitmap($ms)
}
function ToSvg([System.Drawing.Bitmap]$bmp, [string]$outPath) {
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
function ScaleCrop([System.Drawing.Bitmap]$src, [int]$y0, [int]$y1) {
  $hh = $y1 - $y0 + 1
  $rect = New-Object System.Drawing.Rectangle
  $rect.X = 0; $rect.Y = $y0; $rect.Width = $src.Width; $rect.Height = $hh
  $crop = $src.Clone($rect, $src.PixelFormat)
  $tw = 393
  $th = [int][Math]::Round($hh * 393.0 / 360.0)
  $scaled = New-Object System.Drawing.Bitmap($crop, $tw, $th)
  $crop.Dispose()
  return $scaled
}

$assets = 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets'
$tools = 'C:\Users\user\.cursor\projects\loopin-webapp\tools'
$long = LoadSvgPng ((Get-ChildItem (Join-Path $assets '*LONG.svg') | Select-Object -First 1).FullName)

# Patch lupin with period twin FIRST (same as before)
$px = 16; $pyBad = 810; $pyClean = 498; $pw = 115; $ph = 221
$rClean = New-Object System.Drawing.Rectangle
$rClean.X = $px; $rClean.Y = $pyClean; $rClean.Width = $pw; $rClean.Height = $ph
$clean = $long.Clone($rClean, $long.PixelFormat)
$gLong = [System.Drawing.Graphics]::FromImage($long)
$gLong.DrawImage($clean, $px, $pyBad, $pw, $ph)
$gLong.Dispose()
$clean.Dispose()

# Perfect seamless tile: rowDiff=0 at y=1177, P=312
$P = 312
$tileStart = 1177
$tileEnd = $tileStart + $P - 1  # 1488
$bridgeStart = 697
$bridgeEnd = $tileStart - 1     # 1176

$seg = ScaleCrop $long $tileStart $tileEnd
$bridge = ScaleCrop $long $bridgeStart $bridgeEnd
Write-Output ("bridge {0}x{1} (LONG {2}..{3})" -f $bridge.Width, $bridge.Height, $bridgeStart, $bridgeEnd)
Write-Output ("seg {0}x{1} (LONG {2}..{3})" -f $seg.Width, $seg.Height, $tileStart, $tileEnd)

ToSvg $bridge (Join-Path $assets 'main-home-map-bridge.svg')
ToSvg $seg (Join-Path $assets 'main-home-map-segment.svg')

# Verify stack seam: last row of seg vs first row
$diff = 0
for ($x = 0; $x -lt $seg.Width; $x++) {
  $a = $seg.GetPixel($x, ($seg.Height - 1))
  $b = $seg.GetPixel($x, 0)
  $diff += [Math]::Abs([int]$a.R - $b.R) + [Math]::Abs([int]$a.G - $b.G) + [Math]::Abs([int]$a.B - $b.B)
}
Write-Output ("seg bottom-vs-top avgDiff={0}" -f [int]($diff / $seg.Width))

# Previews
$fm = LoadSvgPng (Join-Path $assets 'main-home-full-map.svg')
$fmS = New-Object System.Drawing.Bitmap($fm, 393, 765)
$overlap = 4

$stack = New-Object System.Drawing.Bitmap($seg.Width, ($seg.Height * 3))
$sg = [System.Drawing.Graphics]::FromImage($stack)
for ($i = 0; $i -lt 3; $i++) { $sg.DrawImage($seg, 0, ($i * $seg.Height)) }
$sg.Dispose()
# draw red lines at seams for debug? skip - save clean
$stack.Save((Join-Path $tools 'preview-segment-stack3.png'), [System.Drawing.Imaging.ImageFormat]::Png)

# zoom seam of stack
$seamY = $seg.Height - 40
$sr = New-Object System.Drawing.Rectangle; $sr.X=0; $sr.Y=$seamY; $sr.Width=393; $sr.Height=80
$seam = $stack.Clone($sr, $stack.PixelFormat)
$seam2 = New-Object System.Drawing.Bitmap($seam, 786, 160)
$seam2.Save((Join-Path $tools 'preview-seg-seam.png'), [System.Drawing.Imaging.ImageFormat]::Png)

$joinH = 280
$join = New-Object System.Drawing.Bitmap(393, $joinH)
$jg = [System.Drawing.Graphics]::FromImage($join)
$r1 = New-Object System.Drawing.Rectangle; $r1.X=0; $r1.Y=0; $r1.Width=393; $r1.Height=90
$s1 = New-Object System.Drawing.Rectangle; $s1.X=0; $s1.Y=(765-90); $s1.Width=393; $s1.Height=90
$jg.DrawImage($fmS, $r1, $s1, [System.Drawing.GraphicsUnit]::Pixel)
$bt = 90 - $overlap
$bh = $joinH - $bt
$r2 = New-Object System.Drawing.Rectangle; $r2.X=0; $r2.Y=$bt; $r2.Width=393; $r2.Height=$bh
$s2 = New-Object System.Drawing.Rectangle; $s2.X=0; $s2.Y=0; $s2.Width=393; $s2.Height=$bh
$jg.DrawImage($bridge, $r2, $s2, [System.Drawing.GraphicsUnit]::Pixel)
$jg.Dispose()
$join.Save((Join-Path $tools 'preview-fixed-bridge-join.png'), [System.Drawing.Imaging.ImageFormat]::Png)

$totalH = 765 - $overlap + $bridge.Height + ($seg.Height * 2)
$full = New-Object System.Drawing.Bitmap(393, $totalH)
$fg = [System.Drawing.Graphics]::FromImage($full)
$fg.DrawImage($fmS, 0, 0)
$y = 765 - $overlap
$fg.DrawImage($bridge, 0, $y)
$y += $bridge.Height
$fg.DrawImage($seg, 0, $y)
$y += $seg.Height
$fg.DrawImage($seg, 0, $y)
$fg.Dispose()
$prev = New-Object System.Drawing.Bitmap($full, [int](393 * 0.28), [int]($totalH * 0.28))
$prev.Save((Join-Path $tools 'preview-full-repeat.png'), [System.Drawing.Imaging.ImageFormat]::Png)

# bridge→seg join
$bs = New-Object System.Drawing.Bitmap(393, 200)
$bg = [System.Drawing.Graphics]::FromImage($bs)
$by0 = $bridge.Height - 80
$br = New-Object System.Drawing.Rectangle; $br.X=0; $br.Y=0; $br.Width=393; $br.Height=80
$bsrc = New-Object System.Drawing.Rectangle; $bsrc.X=0; $bsrc.Y=$by0; $bsrc.Width=393; $bsrc.Height=80
$bg.DrawImage($bridge, $br, $bsrc, [System.Drawing.GraphicsUnit]::Pixel)
$br2 = New-Object System.Drawing.Rectangle; $br2.X=0; $br2.Y=80; $br2.Width=393; $br2.Height=120
$bsrc2 = New-Object System.Drawing.Rectangle; $bsrc2.X=0; $bsrc2.Y=0; $bsrc2.Width=393; $bsrc2.Height=120
$bg.DrawImage($seg, $br2, $bsrc2, [System.Drawing.GraphicsUnit]::Pixel)
$bg.Dispose()
$bs.Save((Join-Path $tools 'preview-bridge-seg-join.png'), [System.Drawing.Imaging.ImageFormat]::Png)

Write-Output ("MAP_BRIDGE_H={0}" -f $bridge.Height)
Write-Output ("MAP_SEGMENT_H={0}" -f $seg.Height)
Write-Output ("MAP_BRIDGE_OVERLAP=4")

$prev.Dispose(); $full.Dispose(); $seam.Dispose(); $seam2.Dispose()
$stack.Dispose(); $join.Dispose(); $bs.Dispose(); $fmS.Dispose(); $fm.Dispose()
$seg.Dispose(); $bridge.Dispose(); $long.Dispose()
Write-Output 'done'
