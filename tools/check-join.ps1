$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
function IsPath($c) { return ($c.R -gt 235 -and $c.G -gt 225 -and $c.B -lt 205 -and ($c.R - $c.B) -gt 25) }

$svg = Get-Content -LiteralPath 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-full-map.svg' -Raw -Encoding UTF8
[void]($svg -match 'base64,([A-Za-z0-9+/=]+)')
$ms = New-Object System.IO.MemoryStream(, [Convert]::FromBase64String($Matches[1]))
$bmp = New-Object System.Drawing.Bitmap($ms)
$W = $bmp.Width; $H = $bmp.Height; $s = $W / 393.0
Write-Output ("fullmap {0}x{1}" -f $W, $H)
Write-Output 'fullmap last rows:'
for ($sy = $H - 50; $sy -lt $H; $sy += 2) {
  $pmin = -1; $pmax = -1
  for ($x = 0; $x -lt $W; $x++) {
    if (IsPath ($bmp.GetPixel($x, $sy))) { if ($pmin -lt 0) { $pmin = $x }; $pmax = $x }
  }
  $fy = [Math]::Round($sy / $s, 1)
  if ($pmin -ge 0) {
    Write-Output ("  srcY={0} frameY={1} cx={2:N1} pw={3:N1}" -f $sy, $fy, (($pmin + $pmax) / 2 / $s), (($pmax - $pmin + 1) / $s))
  } else {
    Write-Output ("  srcY={0} frameY={1} NO_PATH" -f $sy, $fy)
  }
}
$bmp.Dispose(); $ms.Dispose()

$segSvg = Get-Content -LiteralPath 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-map-segment.svg' -Raw -Encoding UTF8
[void]($segSvg -match 'base64,([A-Za-z0-9+/=]+)')
$sms = New-Object System.IO.MemoryStream(, [Convert]::FromBase64String($Matches[1]))
$seg = New-Object System.Drawing.Bitmap($sms)
Write-Output ("segment {0}x{1}" -f $seg.Width, $seg.Height)
Write-Output 'segment first rows:'
for ($y = 0; $y -lt 24; $y += 2) {
  $pmin = -1; $pmax = -1
  for ($x = 0; $x -lt $seg.Width; $x++) {
    if (IsPath ($seg.GetPixel($x, $y))) { if ($pmin -lt 0) { $pmin = $x }; $pmax = $x }
  }
  if ($pmin -ge 0) {
    Write-Output ("  y={0} cx={1:N1} pw={2}" -f $y, (($pmin + $pmax) / 2.0), ($pmax - $pmin + 1))
  } else {
    Write-Output ("  y={0} NO_PATH" -f $y)
  }
}
Write-Output 'segment last rows:'
for ($y = $seg.Height - 12; $y -lt $seg.Height; $y += 2) {
  $pmin = -1; $pmax = -1
  for ($x = 0; $x -lt $seg.Width; $x++) {
    if (IsPath ($seg.GetPixel($x, $y))) { if ($pmin -lt 0) { $pmin = $x }; $pmax = $x }
  }
  if ($pmin -ge 0) {
    Write-Output ("  y={0} cx={1:N1} pw={2}" -f $y, (($pmin + $pmax) / 2.0), ($pmax - $pmin + 1))
  } else {
    Write-Output ("  y={0} NO_PATH" -f $y)
  }
}
$seg.Dispose(); $sms.Dispose()
