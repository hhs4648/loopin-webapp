# Extract sky region from curriculum main SVG and compare with LONG map top
Add-Type -AssemblyName System.Drawing

$dir = Join-Path $PSScriptRoot '..\public\assets'
$outDir = Join-Path $PSScriptRoot '..\tmp-curriculum'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

# Find curriculum main by size/name pattern - the one that is vector-heavy (~4MB)
$cands = Get-ChildItem -LiteralPath $dir -Filter '*.svg' | Where-Object { $_.Length -gt 2MB -and $_.Name -notlike '*LONG*' }
Write-Host "candidates:"
$cands | ForEach-Object { Write-Host ("  {0} {1}" -f $_.Name, $_.Length) }

$curr = $cands | Select-Object -First 1
$long = Get-ChildItem -LiteralPath $dir -Filter '*LONG.svg' | Select-Object -First 1

Write-Host "curriculum: $($curr.FullName)"
Write-Host "long: $($long.FullName)"

# Parse gradient stops from curriculum SVG defs (search near end)
$raw = [IO.File]::ReadAllText($curr.FullName)
# Find paint0 linearGradient
if ($raw -match 'id="paint0_linear[^"]*"[\s\S]{0,800}?</linearGradient>') {
  Write-Host "paint0 block:"
  Write-Host $Matches[0].Substring(0, [Math]::Min(500, $Matches[0].Length))
}

# Count images
$imgCount = ([regex]::Matches($raw, 'data:image/png;base64,')).Count
Write-Host "embedded png count: $imgCount"

# Extract first embedded PNG if any and save preview of top
$m = [regex]::Match($raw, 'data:image/png;base64,([A-Za-z0-9+/=]+)')
if ($m.Success) {
  $b64 = $m.Groups[1].Value
  $pad = (4 - ($b64.Length % 4)) % 4
  if ($pad -gt 0) { $b64 += ('=' * $pad) }
  $bytes = [Convert]::FromBase64String($b64)
  [IO.File]::WriteAllBytes((Join-Path $outDir 'curr-embed0.png'), $bytes)
  $bmp = [System.Drawing.Bitmap]::FromFile((Join-Path $outDir 'curr-embed0.png'))
  Write-Host "first embed: $($bmp.Width)x$($bmp.Height)"
  # crop top 300px
  $h = [Math]::Min(300, $bmp.Height)
  $crop = New-Object System.Drawing.Bitmap($bmp.Width, $h)
  $g = [System.Drawing.Graphics]::FromImage($crop)
  $g.DrawImage($bmp, 0, 0, (New-Object System.Drawing.Rectangle(0,0,$bmp.Width,$h)), [System.Drawing.GraphicsUnit]::Pixel)
  $g.Dispose()
  $crop.Save((Join-Path $outDir 'curr-sky-preview.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  $crop.Dispose()
  $bmp.Dispose()
  Write-Host "saved curr-sky-preview.png"
}

# LONG top preview
$rawL = [IO.File]::ReadAllText($long.FullName)
$m2 = [regex]::Match($rawL, 'data:image/png;base64,([A-Za-z0-9+/=]+)')
if ($m2.Success) {
  $b64 = $m2.Groups[1].Value
  $pad = (4 - ($b64.Length % 4)) % 4
  if ($pad -gt 0) { $b64 += ('=' * $pad) }
  $bytes = [Convert]::FromBase64String($b64)
  $ms = New-Object IO.MemoryStream(,$bytes)
  $bmp = [System.Drawing.Bitmap]::FromStream($ms)
  Write-Host "LONG embed: $($bmp.Width)x$($bmp.Height)"
  $h = [Math]::Min(400, $bmp.Height)
  $crop = New-Object System.Drawing.Bitmap($bmp.Width, $h)
  $g = [System.Drawing.Graphics]::FromImage($crop)
  $g.DrawImage($bmp, 0, 0, (New-Object System.Drawing.Rectangle(0,0,$bmp.Width,$h)), [System.Drawing.GraphicsUnit]::Pixel)
  $g.Dispose()
  $crop.Save((Join-Path $outDir 'long-top-preview.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  $crop.Dispose()
  $bmp.Dispose(); $ms.Dispose()
  Write-Host "saved long-top-preview.png"
}

# Also dump linearGradient ids/stops near end of curriculum file
$idx = $raw.LastIndexOf('<defs')
if ($idx -lt 0) { $idx = $raw.LastIndexOf('<linearGradient') }
if ($idx -ge 0) {
  $tail = $raw.Substring($idx, [Math]::Min(3000, $raw.Length - $idx))
  $tailPath = Join-Path $outDir 'curr-defs-tail.txt'
  [IO.File]::WriteAllText($tailPath, $tail)
  Write-Host "wrote defs tail ($($tail.Length) chars)"
}
