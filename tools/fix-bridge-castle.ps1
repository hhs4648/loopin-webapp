$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

function LoadSvgPng($path) {
  $s = Get-Content -LiteralPath $path -Raw -Encoding UTF8
  [void]($s -match 'base64,([A-Za-z0-9+/=]+)')
  $ms = New-Object System.IO.MemoryStream(, [Convert]::FromBase64String($Matches[1]))
  $bmp = New-Object System.Drawing.Bitmap($ms)
  return @{ bmp = $bmp; ms = $ms }
}

function IsBg($c, $bg) {
  return ([Math]::Abs($c.R - $bg.R) -lt 18 -and [Math]::Abs($c.G - $bg.G) -lt 18 -and [Math]::Abs($c.B - $bg.B) -lt 18)
}

$longPath = (Get-ChildItem 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\*LONG.svg').FullName
$lg = LoadSvgPng $longPath
$srcW = $lg.bmp.Width

# Include full first castle top (bbox y691..748). Start a bit above.
$castleTop = 685
$tileStart = 1215
$joinRef = 696  # fullmap bottom correspondence
$bh = $tileStart - $castleTop

$bridgeSrc = $lg.bmp.Clone((New-Object System.Drawing.Rectangle(0, $castleTop, $srcW, $bh)), $lg.bmp.PixelFormat)

# Extract full red castle with transparency
$cx0 = 139; $cy0 = 685; $cw = 86; $ch = 70
$bg = $lg.bmp.GetPixel(5, 700)
$castle = New-Object System.Drawing.Bitmap($cw, $ch)
for ($y = 0; $y -lt $ch; $y++) {
  for ($x = 0; $x -lt $cw; $x++) {
    $c = $lg.bmp.GetPixel($cx0 + $x, $cy0 + $y)
    if (IsBg $c $bg) {
      $castle.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
    } else {
      $castle.SetPixel($x, $y, $c)
    }
  }
}

# Scale bridge + castle to 393 wide
$targetW = 393
$scale = $targetW / [double]$srcW
$targetH = [int][Math]::Round($bh * $scale)
$scaledBridge = New-Object System.Drawing.Bitmap($targetW, $targetH)
$g = [System.Drawing.Graphics]::FromImage($scaledBridge)
$g.DrawImage($bridgeSrc, 0, 0, $targetW, $targetH)

# Composite crisp full castle on top (same place)
$dx = [int][Math]::Round($cx0 * $scale)
$dy = [int][Math]::Round(($cy0 - $castleTop) * $scale)
$dw = [int][Math]::Round($cw * $scale)
$dh = [int][Math]::Round($ch * $scale)
$g.DrawImage($castle, $dx, $dy, $dw, $dh)
$g.Dispose()

# Save transparent castle asset (scaled)
$castleScaled = New-Object System.Drawing.Bitmap($castle, $dw, $dh)
$castlePngPath = 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\map-castle-red.png'
$castleScaled.Save($castlePngPath, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output ("castle asset {0}x{1}" -f $dw, $dh)

# Write bridge SVG
$sms = New-Object System.IO.MemoryStream
$scaledBridge.Save($sms, [System.Drawing.Imaging.ImageFormat]::Png)
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

$overlapSrc = $joinRef - $castleTop
$overlapFrame = [int][Math]::Round($overlapSrc * $scale) + 4
Write-Output ("bridge svg {0}x{1}" -f $targetW, $targetH)
Write-Output ("MAP_BRIDGE_H={0}" -f $targetH)
Write-Output ("MAP_BRIDGE_OVERLAP={0} (joinRef-castleTop={1}src +4)" -f $overlapFrame, $overlapSrc)
Write-Output ("castle overlay frame x={0} y={1} w={2} h={3}" -f $dx, $dy, $dw, $dh)

# Preview top of bridge
$prevH = [Math]::Min(120, $targetH)
$prev = $scaledBridge.Clone((New-Object System.Drawing.Rectangle(0, 0, $targetW, $prevH)), $scaledBridge.PixelFormat)
$prev.Save('C:\Users\user\.cursor\projects\loopin-webapp\tools\bridge-top-preview.png', [System.Drawing.Imaging.ImageFormat]::Png)
$prev.Dispose()

$castleScaled.Dispose(); $castle.Dispose()
$scaledBridge.Dispose(); $bridgeSrc.Dispose()
$lg.bmp.Dispose(); $lg.ms.Dispose()
