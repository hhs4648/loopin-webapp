$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

function LoadSvgPng($path) {
  $s = Get-Content -LiteralPath $path -Raw -Encoding UTF8
  [void]($s -match 'base64,([A-Za-z0-9+/=]+)')
  $ms = New-Object System.IO.MemoryStream(, [Convert]::FromBase64String($Matches[1]))
  $bmp = New-Object System.Drawing.Bitmap($ms)
  return @{ bmp = $bmp; ms = $ms }
}

$br = LoadSvgPng 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-map-bridge.svg'
# crop around blue blobs
$c1 = $br.bmp.Clone((New-Object System.Drawing.Rectangle(40, 240, 120, 90)), $br.bmp.PixelFormat)
$b1 = New-Object System.Drawing.Bitmap($c1, 360, 270)
$b1.Save('C:\Users\user\.cursor\projects\loopin-webapp\tools\bridge-blue-1.png', [System.Drawing.Imaging.ImageFormat]::Png)

$c2 = $br.bmp.Clone((New-Object System.Drawing.Rectangle(30, 350, 120, 80)), $br.bmp.PixelFormat)
$b2 = New-Object System.Drawing.Bitmap($c2, 360, 240)
$b2.Save('C:\Users\user\.cursor\projects\loopin-webapp\tools\bridge-blue-2.png', [System.Drawing.Imaging.ImageFormat]::Png)

# Also scan fullmap lower area (below star2) for character - frame y after ~600
# fullmap 899x1750, scale 899/393
$fm = LoadSvgPng 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-full-map.svg'
# look at region around start mascot vs lower - MASCOT_WAVE at y=300 frame → src y ~300*899/393
# Character further down - maybe near praise calendar or mid map
$c3 = $fm.bmp.Clone((New-Object System.Drawing.Rectangle(180, 650, 200, 220)), $fm.bmp.PixelFormat)
$b3 = New-Object System.Drawing.Bitmap($c3, 300, 330)
$b3.Save('C:\Users\user\.cursor\projects\loopin-webapp\tools\fm-mid-char.png', [System.Drawing.Imaging.ImageFormat]::Png)

# start point character area
$c4 = $fm.bmp.Clone((New-Object System.Drawing.Rectangle(150, 550, 250, 280)), $fm.bmp.PixelFormat)
$b4 = New-Object System.Drawing.Bitmap($c4, 375, 420)
$b4.Save('C:\Users\user\.cursor\projects\loopin-webapp\tools\fm-start-char.png', [System.Drawing.Imaging.ImageFormat]::Png)

Write-Output 'saved crops'
$c1.Dispose(); $b1.Dispose(); $c2.Dispose(); $b2.Dispose()
$c3.Dispose(); $b3.Dispose(); $c4.Dispose(); $b4.Dispose()
$br.bmp.Dispose(); $br.ms.Dispose()
$fm.bmp.Dispose(); $fm.ms.Dispose()
