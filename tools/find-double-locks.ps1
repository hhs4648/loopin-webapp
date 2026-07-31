$ErrorActionPreference = 'Stop'
$svg = Join-Path $PSScriptRoot '..\public\assets\main-home-academy-map.svg' | Resolve-Path
$bak = Join-Path $PSScriptRoot '..\public\assets\main-home-academy-map.before-extend.svg' | Resolve-Path
$raw = [IO.File]::ReadAllText($bak)

function PathAvg([string]$d) {
  $nums = [regex]::Matches($d, '-?\d+(?:\.\d+)?') | ForEach-Object { [double]$_.Value }
  $sx=0;$sy=0;$n=0
  for ($i=0;$i -lt $nums.Count-1;$i+=2) { $sx+=$nums[$i]; $sy+=$nums[$i+1]; $n++ }
  if ($n -eq 0) { return @{x=-1;y=-1} }
  return @{x=$sx/$n;y=$sy/$n}
}

# White lock circles: fill white, ~30px round
Write-Output '=== white lock-size circles in backup ==='
$locks = @()
foreach ($pm in [regex]::Matches($raw, '<path\b[^>]*fill="white"[^>]*/>')) {
  if ($pm.Value -notmatch 'd="([^"]+)"') { continue }
  $d = $Matches[1]
  # circle pattern C... typical lock: contains 469 or similar, or size ~30
  $nums = [regex]::Matches($d, '-?\d+(?:\.\d+)?') | ForEach-Object { [double]$_.Value }
  if ($nums.Count -lt 8) { continue }
  $minX=1e9;$maxX=-1e9;$minY=1e9;$maxY=-1e9
  for ($i=0;$i -lt $nums.Count-1;$i+=2) {
    $x=$nums[$i];$y=$nums[$i+1]
    if($x -lt $minX){$minX=$x}; if($x -gt $maxX){$maxX=$x}
    if($y -lt $minY){$minY=$y}; if($y -gt $maxY){$maxY=$y}
  }
  $w=$maxX-$minX; $h=$maxY-$minY
  if ([Math]::Abs($w-30) -gt 3 -or [Math]::Abs($h-30) -gt 3) { continue }
  $a = PathAvg $d
  $locks += [pscustomobject]@{x=[math]::Round($a.x,1); y=[math]::Round($a.y,1); tag=$pm.Value}
  Write-Output ("  ({0:n1},{1:n1})" -f $a.x,$a.y)
}
Write-Output "count=$($locks.Count)"

# Find pairs within 20px
Write-Output "`n=== near-duplicate lock centers ==="
for ($i=0;$i -lt $locks.Count;$i++) {
  for ($j=$i+1;$j -lt $locks.Count;$j++) {
    $dx = [Math]::Abs($locks[$i].x - $locks[$j].x)
    $dy = [Math]::Abs($locks[$i].y - $locks[$j].y)
    if ($dx -lt 20 -and $dy -lt 20) {
      Write-Output ("DUP ({0},{1}) vs ({2},{3}) dist=({4:n1},{5:n1})" -f $locks[$i].x,$locks[$i].y,$locks[$j].x,$locks[$j].y,$dx,$dy)
    }
  }
}

# Our castle1 lock at 184,309 — any other white circle nearby?
Write-Output "`n=== near castle1 lock (184,309) all white fills ==="
foreach ($pm in [regex]::Matches($raw, '<path\b[^>]*fill="white"[^>]*/>|<rect\b[^>]*fill="white"[^>]*/>')) {
  $tag=$pm.Value
  if ($tag -match 'd="([^"]+)"') {
    $a=PathAvg $Matches[1]
    if ([Math]::Abs($a.x-184) -lt 40 -and [Math]::Abs($a.y-309) -lt 40) {
      Write-Output ("  path ({0:n1},{1:n1}) {2}" -f $a.x,$a.y,$tag.Substring(0,[Math]::Min(140,$tag.Length)))
    }
  } elseif ($tag -match 'x="([^"]+)"' -and $tag -match 'y="([^"]+)"') {
    $x=[double]$Matches[1]
    if ($tag -match 'y="([^"]+)"') { $y=[double]$Matches[1] } else { continue }
    if ([Math]::Abs($x-159) -lt 50 -and [Math]::Abs($y-284) -lt 50) {
      Write-Output "  rect $tag"
    }
  }
}

# Check filter0 still used?
Write-Output ("`nfilter0 refs={0}" -f ([regex]::Matches($raw,'filter0_d_6022_868')).Count)
Write-Output ("our lock M184 324={0}" -f ([regex]::Matches($raw,'M184 324C192\.284')).Count)

# Full lock badge groups: white circle + stroke circle nearby
Write-Output "`n=== #5B6470 lock body count ==="
Write-Output ([regex]::Matches($raw,'fill="#5B6470"')).Count
