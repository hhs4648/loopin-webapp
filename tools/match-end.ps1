$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
function IsPath($c) { return ($c.R -gt 235 -and $c.G -gt 225 -and $c.B -lt 205 -and ($c.R - $c.B) -gt 25) }
function PathCx($bmp, $y) {
  $pmin = -1; $pmax = -1
  for ($x = 0; $x -lt $bmp.Width; $x++) {
    if (IsPath ($bmp.GetPixel($x, $y))) { if ($pmin -lt 0) { $pmin = $x }; $pmax = $x }
  }
  if ($pmin -lt 0) { return $null }
  return ($pmin + $pmax) / 2.0
}

$svg = Get-Content -LiteralPath 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-full-map.svg' -Raw -Encoding UTF8
[void]($svg -match 'base64,([A-Za-z0-9+/=]+)')
$ms = New-Object System.IO.MemoryStream(, [Convert]::FromBase64String($Matches[1]))
$fm = New-Object System.Drawing.Bitmap($ms)
$s = $fm.Width / 393.0
# signature of last 30 frame-px of fullmap (every 5)
$sig = @()
for ($fy = 735; $fy -le 764; $fy += 5) {
  $cx = (PathCx $fm ([int]($fy * $s))) / $s
  $sig += $cx
  Write-Output ("fm fy={0} cx={1:N1}" -f $fy, $cx)
}
$fm.Dispose(); $ms.Dispose()

$longPath = (Get-ChildItem 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\*LONG.svg').FullName
$lsvg = Get-Content -LiteralPath $longPath -Raw -Encoding UTF8
[void]($lsvg -match 'base64,([A-Za-z0-9+/=]+)')
$lms = New-Object System.IO.MemoryStream(, [Convert]::FromBase64String($Matches[1]))
$lb = New-Object System.Drawing.Bitmap($lms)
$ts = $lb.Width / 393.0
$step = [int](5 * $ts)

Write-Output 'top matches (end-weighted):'
$hits = @()
for ($y = 200; $y -lt 1200; $y++) {
  $err = 0.0; $ok = $true; $endErr = 0.0
  for ($i = 0; $i -lt $sig.Count; $i++) {
    $cx = PathCx $lb ($y + $i * $step)
    if ($null -eq $cx) { $ok = $false; break }
    $d = [Math]::Abs(($cx / $ts) - $sig[$i])
    $err += $d
    if ($i -ge ($sig.Count - 2)) { $endErr += $d }
  }
  if (-not $ok) { continue }
  if ($err -lt 50 -and $endErr -lt 12) {
    $endY = $y + ($sig.Count - 1) * $step
    $hits += [pscustomobject]@{ y = $y; endY = $endY; err = [Math]::Round($err, 1); endErr = [Math]::Round($endErr, 1) }
  }
}
$hits | Sort-Object @{Expression = 'endErr' }, err | Select-Object -First 12 | ForEach-Object {
  Write-Output ("  startY={0} endY={1} err={2} endErr={3}" -f $_.y, $_.endY, $_.err, $_.endErr)
}

# Also: find any LONG row with cxF ~= 155 and slope matching (+right over prev 20)
Write-Output 'rows with cxF~155 going right:'
for ($y = 400; $y -lt 1200; $y++) {
  $cx = PathCx $lb $y
  if ($null -eq $cx) { continue }
  $fcx = $cx / $ts
  if ([Math]::Abs($fcx - 155) -gt 4) { continue }
  $cxPrev = PathCx $lb ($y - 15)
  if ($null -eq $cxPrev) { continue }
  $dx = $fcx - ($cxPrev / $ts)
  if ($dx -gt 2) {
    Write-Output ("  y={0} cxF={1:N1} dx15={2:N1}" -f $y, $fcx, $dx)
  }
}
$lb.Dispose(); $lms.Dispose()
