$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$s = Get-Content 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-map-bridge.svg' -Raw -Encoding UTF8
[void]($s -match 'base64,([A-Za-z0-9+/=]+)')
$ms = New-Object System.IO.MemoryStream(,[Convert]::FromBase64String($Matches[1]))
$bmp = New-Object System.Drawing.Bitmap($ms)
# first castle area (with pad 35, castle near top)
$c1 = $bmp.Clone((New-Object System.Drawing.Rectangle(120, 0, 160, 140)), $bmp.PixelFormat)
$c1b = New-Object System.Drawing.Bitmap($c1, ($c1.Width*2), ($c1.Height*2))
$c1b.Save('C:\Users\user\.cursor\projects\loopin-webapp\tools\baked-c1.png', [System.Drawing.Imaging.ImageFormat]::Png)
# second castle
$c2 = $bmp.Clone((New-Object System.Drawing.Rectangle(120, 330, 160, 140)), $bmp.PixelFormat)
$c2b = New-Object System.Drawing.Bitmap($c2, ($c2.Width*2), ($c2.Height*2))
$c2b.Save('C:\Users\user\.cursor\projects\loopin-webapp\tools\baked-c2.png', [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output 'saved baked-c1.png baked-c2.png'
$c1.Dispose(); $c1b.Dispose(); $c2.Dispose(); $c2b.Dispose()
$bmp.Dispose(); $ms.Dispose()

$sg = Get-Content 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-map-segment.svg' -Raw -Encoding UTF8
[void]($sg -match 'base64,([A-Za-z0-9+/=]+)')
$sms = New-Object System.IO.MemoryStream(,[Convert]::FromBase64String($Matches[1]))
$sb = New-Object System.Drawing.Bitmap($sms)
$c3 = $sb.Clone((New-Object System.Drawing.Rectangle(120, 50, 160, 140)), $sb.PixelFormat)
$c3b = New-Object System.Drawing.Bitmap($c3, ($c3.Width*2), ($c3.Height*2))
$c3b.Save('C:\Users\user\.cursor\projects\loopin-webapp\tools\baked-c3.png', [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output 'saved baked-c3.png'
$c3.Dispose(); $c3b.Dispose(); $sb.Dispose(); $sms.Dispose()
