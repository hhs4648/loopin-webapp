$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

function LoadSvgPng($path) {
  $s = Get-Content -LiteralPath $path -Raw -Encoding UTF8
  [void]($s -match 'base64,([A-Za-z0-9+/=]+)')
  $ms = New-Object System.IO.MemoryStream(, [Convert]::FromBase64String($Matches[1]))
  $bmp = New-Object System.Drawing.Bitmap($ms)
  return @{ bmp = $bmp; ms = $ms }
}

function KeepPixel($c, $bg) {
  # teal background
  if ([Math]::Abs($c.R - $bg.R) -lt 22 -and [Math]::Abs($c.G - $bg.G) -lt 22 -and [Math]::Abs($c.B - $bg.B) -lt 22) {
    return $false
  }
  # yellow path / glow — warm yellow, not pink flag
  $isYellowPath = ($c.R -gt 230 -and $c.G -gt 200 -and $c.B -lt 210 -and ($c.R - $c.B) -gt 30 -and $c.G -gt ($c.B + 40))
  if ($isYellowPath) { return $false }

  # keep: castle warm, pink flag, brown pole, white window, yellow sparkle, soft shadows
  return $true
}

$lg = LoadSvgPng ((Get-ChildItem 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\*LONG.svg').FullName)
$bg = $lg.bmp.GetPixel(5, 400)

# Full castle with flag: from crop long-castle-a — expand a bit for flag top
# Flag top near y=340 area; body to ~425. Use x=135..225, y=335..430
$sx = 135; $sy = 332; $sw = 92; $sh = 100
$crop = $lg.bmp.Clone((New-Object System.Drawing.Rectangle($sx, $sy, $sw, $sh)), $lg.bmp.PixelFormat)

$out = New-Object System.Drawing.Bitmap($sw, $sh, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
for ($y = 0; $y -lt $sh; $y++) {
  for ($x = 0; $x -lt $sw; $x++) {
    $c = $crop.GetPixel($x, $y)
    if (KeepPixel $c $bg) {
      $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $c.R, $c.G, $c.B))
    } else {
      $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
    }
  }
}

# Scale to frame width coords: LONG 360 → 393
$scale = 393.0 / 360.0
$tw = [int][Math]::Round($sw * $scale)
$th = [int][Math]::Round($sh * $scale)
$scaled = New-Object System.Drawing.Bitmap($out, $tw, $th)

$asset = 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\map-castle-red-flag.png'
$scaled.Save($asset, [System.Drawing.Imaging.ImageFormat]::Png)

# preview on teal
$prev = New-Object System.Drawing.Bitmap(($tw + 40), ($th + 40))
$g = [System.Drawing.Graphics]::FromImage($prev)
$g.Clear([System.Drawing.Color]::FromArgb(255, 172, 230, 220))
$g.DrawImage($scaled, 20, 20, $tw, $th)
$g.Dispose()
$prev.Save('C:\Users\user\.cursor\projects\loopin-webapp\tools\castle-flag-preview.png', [System.Drawing.Imaging.ImageFormat]::Png)

Write-Output ("asset {0}x{1} -> {2}" -f $tw, $th, $asset)

# Check corners alpha
foreach ($p in @(@(0,0), @(($tw-1),0), @(0,($th-1)), @(($tw-1),($th-1)))) {
  $c = $scaled.GetPixel($p[0], $p[1])
  Write-Output ("corner ({0},{1}) A={2}" -f $p[0], $p[1], $c.A)
}

$prev.Dispose(); $scaled.Dispose(); $out.Dispose(); $crop.Dispose()
$lg.bmp.Dispose(); $lg.ms.Dispose()
