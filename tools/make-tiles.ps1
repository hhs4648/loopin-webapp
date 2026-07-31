$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$svgPath = (Get-ChildItem "C:\Users\user\.cursor\projects\loopin-webapp\public\assets\*LONG.svg").FullName
$svg = Get-Content -LiteralPath $svgPath -Raw -Encoding UTF8
[void]($svg -match 'base64,([A-Za-z0-9+/=]+)')
$bytes = [Convert]::FromBase64String($Matches[1])
$ms = New-Object System.IO.MemoryStream(,$bytes)
$bmp = New-Object System.Drawing.Bitmap($ms)
$W = $bmp.Width
$out = "C:\Users\user\.cursor\projects\loopin-webapp\tools"

function Crop($top,$bot,$name){
  $h = $bot - $top + 1
  $rect = New-Object System.Drawing.Rectangle(0,$top,$W,$h)
  $crop = $bmp.Clone($rect,$bmp.PixelFormat)
  $crop.Save((Join-Path $out $name), [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Output ("{0}: src y{1}..{2} h={3}" -f $name,$top,$bot,$h)
  $crop.Dispose()
}

# single-period seamless tile (path at seam: cx~224 pw~28)
Crop 1064 1375 "tile-single.png"
# double period (L-R richer, less repetitive)
Crop 1064 1687 "tile-double.png"

# stack single x3 to check seam continuity
$src = [System.Drawing.Bitmap]::FromFile((Join-Path $out "tile-single.png"))
$sh = $src.Height
$stack = New-Object System.Drawing.Bitmap($W, ($sh*3))
$g = [System.Drawing.Graphics]::FromImage($stack)
for ($i=0;$i -lt 3;$i++){ $g.DrawImage($src, 0, $i*$sh) }
$g.Dispose()
$stack.Save((Join-Path $out "tile-single-stack3.png"), [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output ("stack3 {0}x{1}" -f $W, ($sh*3))
$src.Dispose(); $stack.Dispose()

$bmp.Dispose(); $ms.Dispose()
