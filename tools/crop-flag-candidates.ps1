$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

function LoadSvgPng($path) {
  $s = Get-Content -LiteralPath $path -Raw -Encoding UTF8
  [void]($s -match 'base64,([A-Za-z0-9+/=]+)')
  $ms = New-Object System.IO.MemoryStream(, [Convert]::FromBase64String($Matches[1]))
  $bmp = New-Object System.Drawing.Bitmap($ms)
  return @{ bmp = $bmp; ms = $ms }
}

$lg = LoadSvgPng ((Get-ChildItem 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\*LONG.svg').FullName)

# Crop candidate around first red castle with room for flag (y ~350-430, x 130-230)
# and around bridge one (y ~670-760)
function SaveCrop($bmp, $x, $y, $w, $h, $name) {
  $c = $bmp.Clone((New-Object System.Drawing.Rectangle($x, $y, $w, $h)), $bmp.PixelFormat)
  $big = New-Object System.Drawing.Bitmap($c, ($w * 3), ($h * 3))
  $out = "C:\Users\user\.cursor\projects\loopin-webapp\tools\$name"
  $big.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Output ("saved {0} from ({1},{2}) {3}x{4}" -f $name, $x, $y, $w, $h)
  $c.Dispose(); $big.Dispose()
}

SaveCrop $lg.bmp 130 340 100 100 'long-castle-a.png'
SaveCrop $lg.bmp 130 660 100 110 'long-castle-b.png'

# fullmap first red castle area (star1) — scale coords: 899 wide
# FULL_MAP_STAR_1 roughly center ~198 frame → src ~453
SaveCrop ((LoadSvgPng 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-full-map.svg').bmp) 380 700 160 200 'fm-castle-1.png'

$lg.bmp.Dispose(); $lg.ms.Dispose()
