$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

function LoadSvgPng($path) {
  $s = Get-Content -LiteralPath $path -Raw -Encoding UTF8
  [void]($s -match 'base64,([A-Za-z0-9+/=]+)')
  $ms = New-Object System.IO.MemoryStream(, [Convert]::FromBase64String($Matches[1]))
  $bmp = New-Object System.Drawing.Bitmap($ms)
  return @{ bmp = $bmp; ms = $ms }
}

# pink/magenta flag pixels
function IsPinkFlag($c) {
  return ($c.R -gt 200 -and $c.B -gt 140 -and $c.G -lt 180 -and ($c.R - $c.G) -gt 40)
}

$lg = LoadSvgPng ((Get-ChildItem 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\*LONG.svg').FullName)
Write-Output ("LONG {0}x{1}" -f $lg.bmp.Width, $lg.bmp.Height)

Write-Output 'pink flag hits in LONG (sample):'
$hits = 0
for ($y = 0; $y -lt $lg.bmp.Height; $y += 2) {
  for ($x = 0; $x -lt $lg.bmp.Width; $x += 2) {
    if (IsPinkFlag ($lg.bmp.GetPixel($x, $y))) {
      Write-Output ("  ({0},{1}) #{2:X2}{3:X2}{4:X2}" -f $x, $y, $lg.bmp.GetPixel($x,$y).R, $lg.bmp.GetPixel($x,$y).G, $lg.bmp.GetPixel($x,$y).B)
      $hits++
      if ($hits -ge 20) { break }
    }
  }
  if ($hits -ge 20) { break }
}
Write-Output ("early hits shown, continuing band search...")

# Find red castles WITH pink flag nearby (above)
function IsWarmRed($c) {
  return ($c.R -gt 200 -and $c.G -gt 60 -and $c.G -lt 200 -and $c.B -lt 160 -and ($c.R - $c.B) -gt 50)
}

$bands = @()
$in = $false; $y0 = 0; $x0 = 0; $x1 = 0
for ($y = 200; $y -lt $lg.bmp.Height; $y++) {
  $cnt = 0; $rmin = -1; $rmax = -1
  for ($x = 0; $x -lt $lg.bmp.Width; $x++) {
    if (IsWarmRed ($lg.bmp.GetPixel($x, $y))) {
      $cnt++; if ($rmin -lt 0) { $rmin = $x }; $rmax = $x
    }
  }
  if ($cnt -gt 18 -and ($rmax - $rmin) -gt 45) {
    if (-not $in) { $in = $true; $y0 = $y; $x0 = $rmin; $x1 = $rmax }
    else {
      if ($rmin -lt $x0) { $x0 = $rmin }
      if ($rmax -gt $x1) { $x1 = $rmax }
    }
  } elseif ($in) {
    $y1 = $y - 1
    # look for pink above this band
    $flag = $false
    $fy0 = [Math]::Max(0, $y0 - 40)
    for ($fy = $fy0; $fy -lt $y0; $fy++) {
      for ($fx = $x0; $fx -le $x1; $fx++) {
        if (IsPinkFlag ($lg.bmp.GetPixel($fx, $fy))) { $flag = $true; break }
      }
      if ($flag) { break }
    }
    Write-Output ("band y={0}..{1} x={2}..{3} h={4} flag={5}" -f $y0, $y1, $x0, $x1, ($y1 - $y0 + 1), $flag)
    $bands += [pscustomobject]@{ y0 = $y0; y1 = $y1; x0 = $x0; x1 = $x1; flag = $flag }
    $in = $false
  }
}

$lg.bmp.Dispose(); $lg.ms.Dispose()

# also check fullmap for red+flag
$fm = LoadSvgPng 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-full-map.svg'
Write-Output ("fullmap {0}x{1}" -f $fm.bmp.Width, $fm.bmp.Height)
$hits = 0
for ($y = 400; $y -lt 1200; $y += 3) {
  for ($x = 100; $x -lt 800; $x += 3) {
    if (IsPinkFlag ($fm.bmp.GetPixel($x, $y))) {
      if ($hits -lt 15) {
        Write-Output ("fm pink ({0},{1})" -f $x, $y)
      }
      $hits++
    }
  }
}
Write-Output ("fullmap pink pixels ~{0}" -f $hits)
$fm.bmp.Dispose(); $fm.ms.Dispose()
