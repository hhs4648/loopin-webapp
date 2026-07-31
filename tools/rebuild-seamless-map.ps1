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
function ScaleCrop($src, $y0, $y1) {
  $hh = $y1 - $y0 + 1
  $crop = $src.Clone((New-Object System.Drawing.Rectangle(0, $y0, $src.Width, $hh)), $src.PixelFormat)
  $tw = 393
  $th = [int][Math]::Round($hh * 393.0 / 360.0)
  $scaled = New-Object System.Drawing.Bitmap($crop, $tw, $th)
  $crop.Dispose()
  return $scaled
}

$lg = LoadSvgPng ((Get-ChildItem 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\*LONG.svg').FullName)

# --- Seamless repeating tile: path enters/exits at same x (period 312) ---
# Previously measured: y1215..1526
$seg = ScaleCrop $lg.bmp 1215 1526
ToSvg $seg 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-map-segment.svg'
Write-Output ("segment {0}x{1}" -f $seg.Width, $seg.Height)

# --- Bridge: fullmap end (~696) → tile start (1215) ---
$bridge = ScaleCrop $lg.bmp 696 1214
Write-Output ("bridge raw {0}x{1}" -f $bridge.Width, $bridge.Height)

# Replace lupin yellow-castle (LONG ~954) with clean twin (LONG ~631), same relative layout
# Source clean: LONG x18..137, y580..739 (sky + castle + below, no lupin)
# Dest: LONG 696-based → bridge coords
$scale = 393.0 / 360.0
$srcX = 18; $srcY = 580; $srcW = 120; $srcH = 160
$clean = $lg.bmp.Clone((New-Object System.Drawing.Rectangle($srcX, $srcY, $srcW, $srcH)), $lg.bmp.PixelFormat)
$pw = [int][Math]::Round($srcW * $scale)
$ph = [int][Math]::Round($srcH * $scale)
$patch = New-Object System.Drawing.Bitmap($clean, $pw, $ph)
$clean.Dispose()

# Align: clean castle top LONG631 → lupin castle top LONG954
# bridgeY(longY) = (longY - 696) * scale
# destY so crop's (631-srcY) maps to bridgeY(954)
$destY = [int][Math]::Round(((954 - 696) - (631 - $srcY)) * $scale)
$destX = [int][Math]::Round($srcX * $scale)
Write-Output ("clean castle patch {0}x{1} at ({2},{3})" -f $pw, $ph, $destX, $destY)
$g = [System.Drawing.Graphics]::FromImage($bridge)
$g.DrawImage($patch, $destX, $destY, $pw, $ph)
$g.Dispose()
$patch.Dispose()

ToSvg $bridge 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-map-bridge.svg'
Write-Output ("bridge final {0}x{1}" -f $bridge.Width, $bridge.Height)
Write-Output ("MAP_BRIDGE_H={0}" -f $bridge.Height)
Write-Output ("MAP_SEGMENT_H={0}" -f $seg.Height)
# overlap: bridge starts at LONG696 = fullmap end, so overlap small hairline only
Write-Output 'MAP_BRIDGE_OVERLAP=4 (bridge starts at fullmap-end match)'

# stack preview: segment x3 to prove seamless
$stack = New-Object System.Drawing.Bitmap($seg.Width, ($seg.Height * 3))
$sg = [System.Drawing.Graphics]::FromImage($stack)
for ($i = 0; $i -lt 3; $i++) { $sg.DrawImage($seg, 0, $i * $seg.Height) }
$sg.Dispose()
$stack.Save('C:\Users\user\.cursor\projects\loopin-webapp\tools\segment-stack3.png', [System.Drawing.Imaging.ImageFormat]::Png)
$stack.Dispose()

# bridge join preview (bottom of fullmap conceptually + bridge top + first segment)
$join = New-Object System.Drawing.Bitmap(393, 500)
$jg = [System.Drawing.Graphics]::FromImage($join)
$jg.Clear([System.Drawing.Color]::FromArgb(255, 173, 230, 220))
$srcY = $bridge.Height - 200
$dst1 = New-Object System.Drawing.Rectangle(0, 0, 393, 200)
$src1 = New-Object System.Drawing.Rectangle(0, $srcY, 393, 200)
$jg.DrawImage($bridge, $dst1, $src1, [System.Drawing.GraphicsUnit]::Pixel)
$dst2 = New-Object System.Drawing.Rectangle(0, 200, 393, 300)
$src2 = New-Object System.Drawing.Rectangle(0, 0, 393, 300)
$jg.DrawImage($seg, $dst2, $src2, [System.Drawing.GraphicsUnit]::Pixel)
$jg.Dispose()
$join.Save('C:\Users\user\.cursor\projects\loopin-webapp\tools\bridge-seg-join.png', [System.Drawing.Imaging.ImageFormat]::Png)
$join.Dispose()

# lupin area preview
$lp = $bridge.Clone((New-Object System.Drawing.Rectangle(20, 220, 160, 220)), $bridge.PixelFormat)
$lp2 = New-Object System.Drawing.Bitmap($lp, 320, 440)
$lp2.Save('C:\Users\user\.cursor\projects\loopin-webapp\tools\bridge-castle-clean.png', [System.Drawing.Imaging.ImageFormat]::Png)
$lp.Dispose(); $lp2.Dispose()

$seg.Dispose(); $bridge.Dispose()
$lg.bmp.Dispose(); $lg.ms.Dispose()
Write-Output 'assets ready'
