$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

function LoadSvgPng($path) {
  $s = Get-Content -LiteralPath $path -Raw -Encoding UTF8
  [void]($s -match 'base64,([A-Za-z0-9+/=]+)')
  $ms = New-Object System.IO.MemoryStream(, [Convert]::FromBase64String($Matches[1]))
  $bmp = New-Object System.Drawing.Bitmap($ms)
  return @{ bmp = $bmp; ms = $ms }
}

# Lupin blue body — strong blue, not path yellow / teal bg / castle
function IsLupinBlue($c) {
  return ($c.B -gt 160 -and $c.B -gt ($c.R + 40) -and $c.B -gt ($c.G + 20) -and $c.R -lt 160 -and $c.G -lt 200)
}

function ScanBlue($bmp, $label) {
  Write-Output ("=== {0} {1}x{2} ===" -f $label, $bmp.Width, $bmp.Height)
  $in = $false; $y0 = 0; $x0 = 0; $x1 = 0; $n = 0
  for ($y = 0; $y -lt $bmp.Height; $y++) {
    $cnt = 0; $rmin = -1; $rmax = -1
    for ($x = 0; $x -lt $bmp.Width; $x++) {
      if (IsLupinBlue ($bmp.GetPixel($x, $y))) {
        $cnt++; if ($rmin -lt 0) { $rmin = $x }; $rmax = $x
      }
    }
    if ($cnt -gt 6) {
      if (-not $in) { $in = $true; $y0 = $y; $x0 = $rmin; $x1 = $rmax; $n = $cnt }
      else {
        if ($rmin -lt $x0) { $x0 = $rmin }
        if ($rmax -gt $x1) { $x1 = $rmax }
        $n += $cnt
      }
    } elseif ($in) {
      Write-Output ("  blue blob y={0}..{1} x={2}..{3} h={4} px~{5}" -f $y0, ($y - 1), $x0, $x1, ($y - $y0), $n)
      $in = $false
    }
  }
  if ($in) { Write-Output ("  blue blob y={0}..end x={1}..{2}" -f $y0, $x0, $x1) }
}

$fm = LoadSvgPng 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-full-map.svg'
$br = LoadSvgPng 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-map-bridge.svg'
$sg = LoadSvgPng 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-map-segment.svg'
$cl = LoadSvgPng 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-full-map-cleared.svg'

ScanBlue $fm.bmp 'fullmap'
ScanBlue $cl.bmp 'fullmap-cleared'
ScanBlue $br.bmp 'bridge'
ScanBlue $sg.bmp 'segment'

$fm.bmp.Dispose(); $fm.ms.Dispose()
$br.bmp.Dispose(); $br.ms.Dispose()
$sg.bmp.Dispose(); $sg.ms.Dispose()
$cl.bmp.Dispose(); $cl.ms.Dispose()
