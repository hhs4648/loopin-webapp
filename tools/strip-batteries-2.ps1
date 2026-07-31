$ErrorActionPreference = 'Stop'
$bakPath = Join-Path $PSScriptRoot '..\public\assets\main-home-academy-map.before-extend.svg' | Resolve-Path
$raw = [IO.File]::ReadAllText($bakPath)

function PathAvg([string]$d) {
  $nums = [regex]::Matches($d, '-?\d+(?:\.\d+)?') | ForEach-Object { [double]$_.Value }
  $sx=0;$sy=0;$n=0
  for ($i=0;$i -lt $nums.Count-1;$i+=2) { $sx+=$nums[$i]; $sy+=$nums[$i+1]; $n++ }
  if ($n -eq 0) { return @{x=-1;y=-1} }
  return @{x=$sx/$n;y=$sy/$n}
}

Write-Output 'remaining #111827:'
foreach ($pm in [regex]::Matches($raw, '<path\b[^>]*fill="#111827"[^>]*/>')) {
  if ($pm.Value -notmatch 'd="([^"]+)"') { continue }
  $a = PathAvg $Matches[1]
  Write-Output ("  avg=({0:n1},{1:n1}) {2}" -f $a.x,$a.y,$pm.Value.Substring(0,[Math]::Min(160,$pm.Value.Length)))
}

# Drop path-start dark battery at ~y312 (and any remaining mid-map dark chrome)
foreach ($pm in @([regex]::Matches($raw, '<path\b[^>]*fill="#111827"[^>]*/>'))) {
  if ($pm.Value -notmatch 'd="([^"]+)"') { continue }
  $a = PathAvg $Matches[1]
  # Keep only sky-area UI if any (y < 200 under naive avg). Drop grass-area.
  if ($a.y -ge 200) {
    Write-Output "dropping y=$($a.y)"
    $raw = $raw.Replace($pm.Value, '<!-- drop map battery -->')
  }
}

# Also drop remaining status-bar stroke paths that still tile (wifi arc etc with #111827 stroke)
foreach ($pm in @([regex]::Matches($raw, '<path\b[^>]*stroke="#111827"[^>]*/>'))) {
  if ($pm.Value -notmatch 'd="([^"]+)"') { continue }
  $d = $Matches[1]
  # status bar wifi/signal near top-right
  if ($d -match 'M29[0-9]|M30[0-9]|M31[0-9]|M33[0-9]|M28[0-9]') {
    $raw = $raw.Replace($pm.Value, '<!-- drop status stroke -->')
    Write-Output "drop status stroke"
  }
}

[IO.File]::WriteAllText($bakPath, $raw)
Write-Output ("111827 left={0}" -f ([regex]::Matches($raw,'#111827')).Count)
