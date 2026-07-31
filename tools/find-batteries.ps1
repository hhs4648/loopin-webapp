$ErrorActionPreference = 'Stop'
$bak = Join-Path $PSScriptRoot '..\public\assets\main-home-academy-map.before-extend.svg' | Resolve-Path
$ext = Join-Path $PSScriptRoot '..\public\assets\main-home-academy-map.svg' | Resolve-Path

function PathAvgY([string]$d) {
  $nums = [regex]::Matches($d, '-?\d+(?:\.\d+)?') | ForEach-Object { [double]$_.Value }
  $sy=0;$n=0
  for ($i=1;$i -lt $nums.Count;$i+=2) { $sy+=$nums[$i]; $n++ }
  if ($n -eq 0) { return -1 }
  return $sy/$n
}
function PathAvgX([string]$d) {
  $nums = [regex]::Matches($d, '-?\d+(?:\.\d+)?') | ForEach-Object { [double]$_.Value }
  $sx=0;$n=0
  for ($i=0;$i -lt $nums.Count;$i+=2) { $sx+=$nums[$i]; $n++ }
  if ($n -eq 0) { return -1 }
  return $sx/$n
}

foreach ($label in @('backup',$bak), @('extended',$ext)) {
  $name = $label[0]; $path = $label[1]
  $raw = [IO.File]::ReadAllText($path)
  Write-Output "===== $name ====="
  Write-Output ("111827 count={0}" -f ([regex]::Matches($raw,'fill="#111827"')).Count)
  Write-Output ("7F40FF count={0}" -f ([regex]::Matches($raw,'fill="#7F40FF"')).Count)

  # battery body signature
  Write-Output ("battery body M330={0}" -f ([regex]::Matches($raw,'M330\.999')).Count)
  Write-Output ("battery nub M336={0}" -f ([regex]::Matches($raw,'M336 20\.1992')).Count)

  Write-Output '--- #111827 by Y ---'
  foreach ($pm in [regex]::Matches($raw, '<path\b[^>]*fill="#111827"[^>]*/>')) {
    if ($pm.Value -notmatch 'd="([^"]+)"') { continue }
    $d=$Matches[1]; $ay=PathAvgY $d; $ax=PathAvgX $d
    Write-Output ("  ({0:n1},{1:n1})" -f $ax,$ay)
  }

  # Look for translated batteries: same relative shape with different Y
  # Status battery outer is ~width 16 height 6 at y~18
  Write-Output '--- horizontal dark roundrects (w>h, small) any fill ---'
  $n=0
  foreach ($pm in [regex]::Matches($raw, '<path\b[^>]*/>')) {
    $tag=$pm.Value
    if ($tag -notmatch 'd="([^"]+)"') { continue }
    $d=$Matches[1]
    $nums = [regex]::Matches($d, '-?\d+(?:\.\d+)?') | ForEach-Object { [double]$_.Value }
    if ($nums.Count -lt 8) { continue }
    $minX=1e9;$maxX=-1e9;$minY=1e9;$maxY=-1e9
    for ($i=0;$i -lt $nums.Count-1;$i+=2) {
      $x=$nums[$i]; $y=$nums[$i+1]
      if ($x -lt $minX){$minX=$x}; if ($x -gt $maxX){$maxX=$x}
      if ($y -lt $minY){$minY=$y}; if ($y -gt $maxY){$maxY=$y}
    }
    $w=$maxX-$minX; $h=$maxY-$minY
    if ($w -lt 12 -or $w -gt 22) { continue }
    if ($h -lt 4 -or $h -gt 10) { continue }
    if ($w -lt $h * 1.5) { continue }
    if ($minY -lt 50) { continue } # skip status bar area in report... actually include all
    $fill = if ($tag -match 'fill="([^"]+)"') { $Matches[1] } else { '-' }
    if ($fill -eq 'white' -or $fill -match 'url\(' -or $fill -eq '#ADE4DE') { continue }
    if ($fill -match '#[EeFf].*[EeFf]' -and $fill.Length -eq 7) { continue } # light
    Write-Output ("  fill=$fill bounds=[{0:n0}-{1:n0}]x[{2:n0}-{3:n0}] w={4:n1} h={5:n1}" -f $minX,$maxX,$minY,$maxY,$w,$h)
    $n++
    if ($n -ge 40) { break }
  }
}

# Extract full status bar / battery group from backup for inspection
$raw = [IO.File]::ReadAllText($bak)
$idx = $raw.IndexOf('M317.199 18.1992')
if ($idx -lt 0) { $idx = $raw.IndexOf('M330.999 18.1992') }
Write-Output "`n===== status battery context ====="
Write-Output $raw.Substring([Math]::Max(0,$idx-500), 900)
