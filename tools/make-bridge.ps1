$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$longPath = (Get-ChildItem 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\*LONG.svg').FullName
$lsvg = Get-Content -LiteralPath $longPath -Raw -Encoding UTF8
[void]($lsvg -match 'base64,([A-Za-z0-9+/=]+)')
$lms = New-Object System.IO.MemoryStream(, [Convert]::FromBase64String($Matches[1]))
$lb = New-Object System.Drawing.Bitmap($lms)

# fullmap end ≈ LONG y695; repeating tile starts y1215
$start = 696
$tileStart = 1215
$bh = $tileStart - $start
$bridgeSrc = $lb.Clone((New-Object System.Drawing.Rectangle(0, $start, $lb.Width, $bh)), $lb.PixelFormat)

$targetW = 393
$targetH = [int][Math]::Round($bh * 393.0 / 360.0)
$scaled = New-Object System.Drawing.Bitmap($bridgeSrc, $targetW, $targetH)
$sms = New-Object System.IO.MemoryStream
$scaled.Save($sms, [System.Drawing.Imaging.ImageFormat]::Png)
$b64 = [Convert]::ToBase64String($sms.ToArray())
$sms.Dispose()

$svgOut = 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-map-bridge.svg'
$svgTxt = @"
<svg width="$targetW" height="$targetH" viewBox="0 0 $targetW $targetH" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<rect width="$targetW" height="$targetH" fill="url(#pat_bridge)"/>
<defs>
<pattern id="pat_bridge" patternContentUnits="objectBoundingBox" width="1" height="1">
<use xlink:href="#img_bridge" transform="scale($(1.0/$targetW) $(1.0/$targetH))"/>
</pattern>
<image id="img_bridge" width="$targetW" height="$targetH" preserveAspectRatio="none" xlink:href="data:image/png;base64,$b64"/>
</defs>
</svg>
"@
[System.IO.File]::WriteAllText($svgOut, $svgTxt)
Write-Output ("bridge svg {0}x{1} bytes={2}" -f $targetW, $targetH, (Get-Item $svgOut).Length)
Write-Output ("MAP_BRIDGE_H = {0}" -f $targetH)

# preview: last 120px of fullmap + bridge + first 160 of tile
function LoadPngFromSvg($path) {
  $s = Get-Content -LiteralPath $path -Raw -Encoding UTF8
  [void]($s -match 'base64,([A-Za-z0-9+/=]+)')
  $m = New-Object System.IO.MemoryStream(, [Convert]::FromBase64String($Matches[1]))
  $b = New-Object System.Drawing.Bitmap($m)
  return @{ bmp = $b; ms = $m }
}

$fm = LoadPngFromSvg 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-full-map.svg'
$seg = LoadPngFromSvg 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-map-segment.svg'

# scale fullmap bottom strip to 393 wide
$fmW = 393
$fmScale = $fmW / $fm.bmp.Width
$fmH = [int]($fm.bmp.Height * $fmScale)
$fmScaled = New-Object System.Drawing.Bitmap($fm.bmp, $fmW, $fmH)
$tailH = 120
$bridgeH = $targetH
$segHead = 160
$previewH = $tailH + $bridgeH + $segHead
$fmTailY = $fmH - $tailH
$segY = $tailH + $bridgeH
$preview = New-Object System.Drawing.Bitmap($fmW, $previewH)
$g = [System.Drawing.Graphics]::FromImage($preview)
$dst1 = New-Object System.Drawing.Rectangle(0, 0, $fmW, $tailH)
$src1 = New-Object System.Drawing.Rectangle(0, $fmTailY, $fmW, $tailH)
$g.DrawImage($fmScaled, $dst1, $src1, [System.Drawing.GraphicsUnit]::Pixel)
$g.DrawImage($scaled, 0, $tailH)
$dst2 = New-Object System.Drawing.Rectangle(0, $segY, $fmW, $segHead)
$src2 = New-Object System.Drawing.Rectangle(0, 0, $seg.bmp.Width, $segHead)
$g.DrawImage($seg.bmp, $dst2, $src2, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()
$preview.Save('C:\Users\user\.cursor\projects\loopin-webapp\tools\bridge-join-preview.png', [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output 'wrote bridge-join-preview.png'

$scaled.Dispose(); $bridgeSrc.Dispose()
$fmScaled.Dispose(); $fm.bmp.Dispose(); $fm.ms.Dispose()
$seg.bmp.Dispose(); $seg.ms.Dispose()
$preview.Dispose()
$lb.Dispose(); $lms.Dispose()
