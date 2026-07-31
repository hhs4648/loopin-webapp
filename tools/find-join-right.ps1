$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
function IsPath($c) { return ($c.R -gt 235 -and $c.G -gt 225 -and $c.B -lt 205 -and ($c.R - $c.B) -gt 25) }
function IsWarm($c) { return ($c.R -gt 200 -and $c.G -gt 90 -and $c.B -lt 170 -and ($c.R - $c.B) -gt 45 -and $c.G -lt 210) }
function IsBlue($c) { return ($c.B -gt 180 -and ($c.B - $c.R) -gt 25 -and $c.G -lt 210) }

function PathCx($bmp, $y) {
  $pmin = -1; $pmax = -1
  for ($x = 0; $x -lt $bmp.Width; $x++) {
    if (IsPath ($bmp.GetPixel($x, $y))) { if ($pmin -lt 0) { $pmin = $x }; $pmax = $x }
  }
  if ($pmin -lt 0) { return $null }
  return [pscustomobject]@{ cx = ($pmin + $pmax) / 2.0; pw = ($pmax - $pmin + 1) }
}

# --- full-map path slope near bottom ---
$svg = Get-Content -LiteralPath 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\main-home-full-map.svg' -Raw -Encoding UTF8
[void]($svg -match 'base64,([A-Za-z0-9+/=]+)')
$ms = New-Object System.IO.MemoryStream(, [Convert]::FromBase64String($Matches[1]))
$fm = New-Object System.Drawing.Bitmap($ms)
$s = $fm.Width / 393.0
Write-Output 'fullmap path every 10px from frameY 650..765:'
for ($fy = 650; $fy -le 765; $fy += 10) {
  $sy = [int]($fy * $s)
  if ($sy -ge $fm.Height) { break }
  $p = PathCx $fm $sy
  if ($p) { Write-Output ("  fy={0} cx={1:N1} pw={2:N1}" -f $fy, ($p.cx / $s), ($p.pw / $s)) }
  else { Write-Output ("  fy={0} NO" -f $fy) }
}
$fm.Dispose(); $ms.Dispose()

# --- LONG: find start rows where path ~155 AND going RIGHT (cx increases over next 8 rows) ---
$longPath = (Get-ChildItem 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\*LONG.svg').FullName
$lsvg = Get-Content -LiteralPath $longPath -Raw -Encoding UTF8
[void]($lsvg -match 'base64,([A-Za-z0-9+/=]+)')
$lms = New-Object System.IO.MemoryStream(, [Convert]::FromBase64String($Matches[1]))
$lb = New-Object System.Drawing.Bitmap($lms)
$ts = $lb.Width / 393.0
$target = 155 * $ts
Write-Output ("LONG target srcCx~{0:N1}" -f $target)
Write-Output 'candidates: cx~155, going RIGHT, clean (no castle/blue):'

for ($y = 900; $y -lt $lb.Height - 20; $y++) {
  $p0 = PathCx $lb $y
  if (-not $p0) { continue }
  if ([Math]::Abs($p0.cx - $target) -gt 10) { continue }
  $p8 = PathCx $lb ($y + 8)
  if (-not $p8) { continue }
  $dx = $p8.cx - $p0.cx
  if ($dx -lt 3) { continue } # must go right
  # clean check on this row
  $castle = $false; $blue = $false
  for ($x = 0; $x -lt $lb.Width; $x++) {
    $c = $lb.GetPixel($x, $y)
    if (IsWarm $c) { $castle = $true }
    if (IsBlue $c) { $blue = $true }
  }
  if ($castle -or $blue) { continue }
  Write-Output ("  y={0} cx={1:N1}(f={2:N0}) pw={3} dx8={4:N1}" -f $y, $p0.cx, ($p0.cx / $ts), $p0.pw, $dx)
}
$lb.Dispose(); $lms.Dispose()
