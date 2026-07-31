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

# Sample full-map bottom signature (frameY 740,750,760 → src)
$svg = Get-Content -LiteralPath 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-full-map.svg' -Raw -Encoding UTF8
[void]($svg -match 'base64,([A-Za-z0-9+/=]+)')
$ms = New-Object System.IO.MemoryStream(, [Convert]::FromBase64String($Matches[1]))
$fm = New-Object System.Drawing.Bitmap($ms)
$s = $fm.Width / 393.0
$sig = @()
foreach ($fy in @(740, 745, 750, 755, 760, 764)) {
  $sy = [int]($fy * $s)
  $cx = PathCx $fm $sy
  $sig += ($cx / $s)
  Write-Output ("fm fy={0} cx={1:N1}" -f $fy, ($cx / $s))
}
$fm.Dispose(); $ms.Dispose()

$longPath = (Get-ChildItem 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\*LONG.svg').FullName
$lsvg = Get-Content -LiteralPath $longPath -Raw -Encoding UTF8
[void]($lsvg -match 'base64,([A-Za-z0-9+/=]+)')
$lms = New-Object System.IO.MemoryStream(, [Convert]::FromBase64String($Matches[1]))
$lb = New-Object System.Drawing.Bitmap($lms)
$ts = $lb.Width / 393.0
# offsets in LONG src for the 6 sample points (same frame deltas)
$deltas = @(0, 5, 10, 15, 20, 24) | ForEach-Object { [int]($_ * $ts) }

Write-Output 'best LONG matches to fullmap bottom signature:'
$best = @()
for ($y = 200; $y -lt $lb.Height - 30; $y++) {
  $err = 0.0; $ok = $true
  for ($i = 0; $i -lt $sig.Count; $i++) {
    $cx = PathCx $lb ($y + $deltas[$i])
    if ($null -eq $cx) { $ok = $false; break }
    $fcx = $cx / $ts
    $err += [Math]::Abs($fcx - $sig[$i])
  }
  if (-not $ok) { continue }
  if ($err -lt 40) {
    $best += [pscustomobject]@{ y = $y; err = [Math]::Round($err, 1) }
  }
}
$best | Sort-Object err | Select-Object -First 15 | ForEach-Object {
  Write-Output ("  y={0} err={1}" -f $_.y, $_.err)
}
$lb.Dispose(); $lms.Dispose()
