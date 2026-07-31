$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$svgPath = (Get-ChildItem "C:\Users\user\.cursor\projects\loopin-webapp\public\assets\*LONG.svg").FullName
$svg = Get-Content -LiteralPath $svgPath -Raw -Encoding UTF8
[void]($svg -match 'base64,([A-Za-z0-9+/=]+)')
$ms = New-Object System.IO.MemoryStream(,[Convert]::FromBase64String($Matches[1]))
$bmp = New-Object System.Drawing.Bitmap($ms)
$W=$bmp.Width
$out="C:\Users\user\.cursor\projects\loopin-webapp\tools"

$top=1215; $bot=1526; $h=$bot-$top+1
$rect = New-Object System.Drawing.Rectangle(0,$top,$W,$h)
$tile = $bmp.Clone($rect,$bmp.PixelFormat)
$tile.Save("$out\tile-join.png", [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output ("tile-join src y{0}..{1} h={2}" -f $top,$bot,$h)

# stack 3x for seam check
$stack = New-Object System.Drawing.Bitmap($W, ($h*3))
$g=[System.Drawing.Graphics]::FromImage($stack)
for($i=0;$i -lt 3;$i++){ $g.DrawImage($tile,0,$i*$h) }
$g.Dispose()
$stack.Save("$out\tile-join-stack3.png", [System.Drawing.Imaging.ImageFormat]::Png)
$stack.Dispose()

# scaled 393-wide seamless SVG asset
$targetW=393; $targetH=[int][Math]::Round($h * 393.0/360.0)
$scaled = New-Object System.Drawing.Bitmap($tile, $targetW, $targetH)
$sms = New-Object System.IO.MemoryStream
$scaled.Save($sms, [System.Drawing.Imaging.ImageFormat]::Png)
$b64=[Convert]::ToBase64String($sms.ToArray())
$sms.Dispose()
$svgOut="C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-map-segment.svg"
$svgTxt = @"
<svg width="$targetW" height="$targetH" viewBox="0 0 $targetW $targetH" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<rect width="$targetW" height="$targetH" fill="url(#pat_seg)"/>
<defs>
<pattern id="pat_seg" patternContentUnits="objectBoundingBox" width="1" height="1">
<use xlink:href="#img_seg" transform="scale($(1.0/$targetW) $(1.0/$targetH))"/>
</pattern>
<image id="img_seg" width="$targetW" height="$targetH" preserveAspectRatio="none" xlink:href="data:image/png;base64,$b64"/>
</defs>
</svg>
"@
[System.IO.File]::WriteAllText($svgOut, $svgTxt)
Write-Output ("segment svg {0}x{1} -> {2} bytes" -f $targetW,$targetH,(Get-Item $svgOut).Length)
Write-Output ("MAP_SEGMENT_H should be {0}" -f $targetH)

$scaled.Dispose(); $tile.Dispose(); $bmp.Dispose(); $ms.Dispose()
