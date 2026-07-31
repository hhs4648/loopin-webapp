# 1~21 castles x 5 sets — continuous join using natural castle period 2192.
# Seam: source (CROP-PERIOD) aligns with dest CROP so path/castles loop.
# Wipe c22 stub + mid-map battery poles. Self-check + preview strips.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$assets = Join-Path $PSScriptRoot '..\public\assets' | Resolve-Path
$bakPath = Join-Path $assets 'main-home-academy-map.before-extend.svg'
$srcPath = Join-Path $assets 'main-home-academy-map.svg'
$previewDir = (Resolve-Path (Join-Path $PSScriptRoot '..\tmp-castle-align')).Path
New-Item -ItemType Directory -Force -Path $previewDir | Out-Null

if (-not (Test-Path $bakPath)) { throw "missing backup: $bakPath" }
Copy-Item -LiteralPath $bakPath -Destination $srcPath -Force

# Natural period: castle1.floor(426) → next center(2618)
$PERIOD = 2192
$CROP_H = 2565                 # after c21, before c22
$BUNDLE_START = $CROP_H - $PERIOD  # 373 — seam-aligned (skips y~300 battery)
$SETS = 5
$EXTRA = $SETS - 1
$NEW_H = $CROP_H + ($PERIOD * $EXTRA)
$W = 360
$GRASS = [Drawing.Color]::FromArgb(255, 171, 231, 219)

Write-Output "period=$PERIOD bundleStart=$BUNDLE_START crop=$CROP_H newH=$NEW_H"
Write-Output "set2 c1 floor=$((426+$PERIOD))"

$raw = [IO.File]::ReadAllText($srcPath)

function PathMaxY([string]$d) {
  $nums = [regex]::Matches($d, '-?\d+(?:\.\d+)?') | ForEach-Object { [double]$_.Value }
  $maxY = -1.0
  for ($i = 1; $i -lt $nums.Count; $i += 2) {
    $y = $nums[$i]
    if ($y -gt $maxY -and $y -lt 3000) { $maxY = $y }
  }
  return $maxY
}
function PathMinY([string]$d) {
  $nums = [regex]::Matches($d, '-?\d+(?:\.\d+)?') | ForEach-Object { [double]$_.Value }
  $minY = 99999.0
  for ($i = 1; $i -lt $nums.Count; $i += 2) {
    $y = $nums[$i]
    if ($y -lt $minY -and $y -gt 0 -and $y -lt 3000) { $minY = $y }
  }
  if ($minY -gt 90000) { return -1.0 }
  return $minY
}

$bandPaths = New-Object System.Collections.Generic.List[string]
$stripped = 0
foreach ($pm in [regex]::Matches($raw, '<path\b[^>]*/>')) {
  $tag = $pm.Value
  if ($tag -notmatch 'd="([^"]+)"') { continue }
  $d = $Matches[1]
  $maxY = PathMaxY $d
  $minY = PathMinY $d
  if ($maxY -ge $CROP_H) {
    $raw = $raw.Replace($tag, '<!-- drop below set1 -->')
    $stripped++
    continue
  }
  # Drop orphan castle22 lock (~y 2520) — full badge (circle/stroke/body/shackle)
  if ($tag -match 'M181\.5 2534|M181\.501 2533|M177\.5 2516\.5V2513|M185\.101 2516\.5H177') {
    $raw = $raw.Replace($tag, '<!-- drop c22 lock -->')
    $stripped++
    continue
  }
  # Never tile status-bar chrome / purple poles / dark battery marks
  if ($tag -match 'fill="#7F40FF"' -or $tag -match 'fill="#111827"' -or $tag -match 'stroke="#111827"') {
    $raw = $raw.Replace($tag, '<!-- drop battery/status chrome -->')
    $stripped++
    continue
  }
  # Include full castle1 (lock may be < bundleStart) up through set1 end
  if ($maxY -ge 300 -and $minY -lt $CROP_H) {
    $bandPaths.Add($tag)
  }
}
Write-Output "stripped=$stripped bandPaths=$($bandPaths.Count)"

function IsBatteryPurple([Drawing.Color]$c) {
  return ($c.B -gt 200 -and $c.R -gt 100 -and $c.R -lt 200 -and $c.G -gt 120 -and $c.G -lt 200 -and ($c.B - $c.G) -gt 40)
}
function IsCastleWarm([Drawing.Color]$c) {
  return ($c.R -gt 190 -and $c.B -lt 170 -and ($c.R - $c.B) -gt 35 -and $c.G -lt 230)
}
function IsPathYellow([Drawing.Color]$c) {
  return ($c.R -gt 220 -and $c.G -gt 190 -and $c.B -lt 210 -and ($c.G - $c.B) -gt 30)
}

$m = [regex]::Match($raw, 'xlink:href="data:image/png;base64,([^"]+)"')
if (-not $m.Success) { throw 'no png' }
$png = New-Object Drawing.Bitmap ([IO.MemoryStream]::new([Convert]::FromBase64String($m.Groups[1].Value)))
$pngTile = [Drawing.Bitmap]$png.Clone()

# Wipe battery pole on tile source (won't appear at seams)
for ($y = 250; $y -le 380; $y++) {
  for ($x = 0; $x -le 55; $x++) {
    if (IsBatteryPurple ($pngTile.GetPixel($x, $y))) { $pngTile.SetPixel($x, $y, $GRASS) }
  }
}
# Wipe c22 stub on base
for ($y = 2510; $y -lt [Math]::Min(2623, $png.Height); $y++) {
  for ($x = 130; $x -le 240; $x++) {
    if (IsCastleWarm ($png.GetPixel($x, $y))) { $png.SetPixel($x, $y, $GRASS) }
  }
}

$ext = New-Object Drawing.Bitmap $W, $NEW_H
$g = [Drawing.Graphics]::FromImage($ext)
$g.CompositingMode = [Drawing.Drawing2D.CompositingMode]::SourceCopy
$g.Clear($GRASS)

$g.DrawImage($png, (New-Object Drawing.Rectangle 0, 0, $W, $CROP_H), (New-Object Drawing.Rectangle 0, 0, $W, $CROP_H), [Drawing.GraphicsUnit]::Pixel)
for ($y = 2510; $y -lt $CROP_H; $y++) {
  for ($x = 130; $x -le 240; $x++) {
    if (IsCastleWarm ($ext.GetPixel($x, $y))) { $ext.SetPixel($x, $y, $GRASS) }
  }
}

for ($t = 0; $t -lt $EXTRA; $t++) {
  $destY = $CROP_H + ($t * $PERIOD)
  $g.DrawImage(
    $pngTile,
    (New-Object Drawing.Rectangle 0, $destY, $W, $PERIOD),
    (New-Object Drawing.Rectangle 0, $BUNDLE_START, $W, $PERIOD),
    [Drawing.GraphicsUnit]::Pixel
  )
  for ($y = $destY; $y -le [Math]::Min($destY + 25, $NEW_H - 1); $y++) {
    for ($x = 0; $x -le 55; $x++) {
      if (IsBatteryPurple ($ext.GetPixel($x, $y))) { $ext.SetPixel($x, $y, $GRASS) }
    }
  }
}
$g.Dispose(); $png.Dispose(); $pngTile.Dispose()

# --- self-check ---
$fail = @()
function HasContent([Drawing.Bitmap]$b, [int]$y0, [int]$y1) {
  for ($y = $y0; $y -le $y1; $y++) {
    for ($x = 30; $x -le 330; $x += 3) {
      $c = $b.GetPixel($x, $y)
      $grass = ($c.G -gt 200 -and $c.B -gt 180 -and $c.R -lt 200 -and [Math]::Abs([int]$c.R - [int]$c.G) -lt 55)
      if (-not $grass) { return $true }
    }
  }
  return $false
}
function PathCentroidX([Drawing.Bitmap]$b, [int]$y) {
  $sum = 0; $n = 0
  for ($x = 0; $x -lt $W; $x++) {
    if (IsPathYellow ($b.GetPixel($x, $y))) { $sum += $x; $n++ }
  }
  if ($n -lt 5) { return -1 }
  return [int]($sum / $n)
}

for ($t = 1; $t -le $EXTRA; $t++) {
  $seam = $CROP_H + (($t - 1) * $PERIOD)
  if (-not (HasContent $ext ($seam - 10) ($seam + 10))) { $fail += "EMPTY gap at seam $seam" }
  $bat = 0
  for ($y = $seam; $y -le $seam + 20; $y++) {
    for ($x = 0; $x -le 50; $x++) { if (IsBatteryPurple ($ext.GetPixel($x, $y))) { $bat++ } }
  }
  if ($bat -gt 20) { $fail += "battery=$bat at seam $seam" }

  $xAbove = PathCentroidX $ext ($seam - 8)
  $xBelow = PathCentroidX $ext ($seam + 8)
  if ($xAbove -ge 0 -and $xBelow -ge 0) {
    $dx = [Math]::Abs($xAbove - $xBelow)
    Write-Output "seam $seam pathX above=$xAbove below=$xBelow dx=$dx"
    if ($dx -gt 80) { $fail += "path jump dx=$dx at seam $seam" }
  }
}

$c1y = 426 + $PERIOD
$warm = 0
for ($y = $c1y - 70; $y -le $c1y; $y++) {
  for ($x = 150; $x -le 220; $x++) { if (IsCastleWarm ($ext.GetPixel($x, $y))) { $warm++ } }
}
Write-Output "set2 c1 warm=$warm floor=$c1y (castles are mostly SVG vectors — warm is advisory)"
# Raster may be light; require only that area isn't a pure empty grass slab
if (-not (HasContent $ext ($c1y - 70) $c1y)) { $fail += "set2 castle1 zone empty grass floor~$c1y" }

foreach ($seam in @($CROP_H, ($CROP_H + $PERIOD))) {
  $y0 = [Math]::Max(0, $seam - 70)
  $crop = $ext.Clone((New-Object Drawing.Rectangle 0, $y0, $W, 160), $ext.PixelFormat)
  $crop.Save("$previewDir\check-seam-$seam.png", [Drawing.Imaging.ImageFormat]::Png)
  $crop.Dispose()
}

if ($fail.Count -gt 0) {
  $fail | ForEach-Object { Write-Output "FAIL: $_" }
  $ext.Dispose()
  throw "self-check failed"
}
Write-Output "SELF-CHECK OK"

$ms = New-Object IO.MemoryStream
$ext.Save($ms, [Drawing.Imaging.ImageFormat]::Png)
$b64 = [Convert]::ToBase64String($ms.ToArray())
$ms.Dispose(); $ext.Dispose()

$raw2 = $raw.Remove($m.Groups[1].Index, $m.Groups[1].Length).Insert($m.Groups[1].Index, $b64)
$raw2 = [regex]::Replace($raw2, '(<image id="image0_6022_868" width="360" height=")2623(")', "`${1}$NEW_H`${2}")
$sy = [string]::Format([Globalization.CultureInfo]::InvariantCulture, '{0:G8}', (1.0 / $NEW_H))
$raw2 = [regex]::Replace($raw2, 'transform="scale\(0\.00277778 0\.000381243\)"', "transform=`"scale(0.00277778 $sy)`"")
foreach ($pair in @(
  @('(<svg[^>]*height=")2623(")', "`${1}$NEW_H`${2}"),
  @('(viewBox="0 0 360 )2623(")', "`${1}$NEW_H`${2}"),
  @('(<clipPath id="clip0_6022_868">\s*<rect width="360" height=")2623(")', "`${1}$NEW_H`${2}"),
  @('(<rect width="360" height=")2623(" fill="#ADE4DE"/>)', "`${1}$NEW_H`${2}"),
  @('(<rect width="360" height=")2623(" fill="url\(#pattern0_6022_868\)"/>)', "`${1}$NEW_H`${2}"),
  @('(<rect width="360" height=")2623(" fill="white"/>)', "`${1}$NEW_H`${2}")
)) { $raw2 = [regex]::Replace($raw2, $pair[0], $pair[1]) }

$sb = New-Object Text.StringBuilder
[void]$sb.AppendLine("<!-- continuous x$SETS period=$PERIOD -->")
for ($t = 1; $t -le $EXTRA; $t++) {
  $dy = $PERIOD * $t
  [void]$sb.AppendLine("<g id=`"map-bundle-$t`" transform=`"translate(0 $dy)`">")
  foreach ($tag in $bandPaths) { [void]$sb.AppendLine($tag) }
  [void]$sb.AppendLine('</g>')
}
$raw2 = $raw2.Insert($raw2.LastIndexOf('<defs>'), $sb.ToString())
[IO.File]::WriteAllText($srcPath, $raw2)
Write-Output "wrote $srcPath bytes=$((Get-Item $srcPath).Length)"
