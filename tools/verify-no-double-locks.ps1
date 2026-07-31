$ErrorActionPreference = 'Stop'
$bak = Join-Path $PSScriptRoot '..\public\assets\main-home-academy-map.before-extend.svg' | Resolve-Path
$ext = Join-Path $PSScriptRoot '..\public\assets\main-home-academy-map.svg' | Resolve-Path
$raw = [IO.File]::ReadAllText($bak)

function PathAvg([string]$d) {
  $nums = [regex]::Matches($d, '-?\d+(?:\.\d+)?') | ForEach-Object { [double]$_.Value }
  $sx=0;$sy=0;$n=0
  for ($i=0;$i -lt $nums.Count-1;$i+=2) { $sx+=$nums[$i]; $sy+=$nums[$i+1]; $n++ }
  if ($n -eq 0) { return @{x=-1;y=-1} }
  return @{x=$sx/$n;y=$sy/$n}
}

Write-Output '=== leftovers near c22 lock zone in backup ==='
foreach ($pm in [regex]::Matches($raw, '<path\b[^>]*/>')) {
  if ($pm.Value -notmatch 'd="([^"]+)"') { continue }
  $a = PathAvg $Matches[1]
  if ($a.y -lt 2495 -or $a.y -gt 2545) { continue }
  if ($a.x -lt 165 -or $a.x -gt 200) { continue }
  Write-Output ("({0:n1},{1:n1}) {2}" -f $a.x,$a.y,$pm.Value.Substring(0,[Math]::Min(140,$pm.Value.Length)))
}

# Also check extended for double locks near seams: y~2501 and y~2520
$raw2 = [IO.File]::ReadAllText($ext)
Write-Output "`n=== white 30px locks near seam y 2480-2550 in extended (incl translated) ==="
# Need to account for translate groups - easier to search path coords and also check bundle
$lockYs = @()
foreach ($pm in [regex]::Matches($raw2, '<path\b[^>]*fill="white"[^>]*/>')) {
  if ($pm.Value -notmatch 'd="([^"]+)"') { continue }
  $d=$Matches[1]
  $nums = [regex]::Matches($d, '-?\d+(?:\.\d+)?') | ForEach-Object { [double]$_.Value }
  if ($nums.Count -lt 8) { continue }
  $minX=1e9;$maxX=-1e9;$minY=1e9;$maxY=-1e9
  for ($i=0;$i -lt $nums.Count-1;$i+=2) {
    $x=$nums[$i];$y=$nums[$i+1]
    if($x -lt $minX){$minX=$x}; if($x -gt $maxX){$maxX=$x}
    if($y -lt $minY){$minY=$y}; if($y -gt $maxY){$maxY=$y}
  }
  if ([Math]::Abs(($maxX-$minX)-30) -gt 3) { continue }
  if ([Math]::Abs(($maxY-$minY)-30) -gt 3) { continue }
  $a=PathAvg $d
  $lockYs += [pscustomobject]@{x=$a.x;y=$a.y;base=$true}
}

# Bundle translates: same paths + 2192*t
Write-Output "base white locks=$($lockYs.Count)"
$all = @()
foreach ($L in $lockYs) {
  $all += $L
  for ($t=1;$t -le 4;$t++) {
    $all += [pscustomobject]@{x=$L.x;y=($L.y+2192*$t);base=$false}
  }
}
Write-Output "total with translates=$($all.Count)"

Write-Output 'near-duplicate across all sets:'
$dups=0
for ($i=0;$i -lt $all.Count;$i++) {
  for ($j=$i+1;$j -lt $all.Count;$j++) {
    $dx=[Math]::Abs($all[$i].x-$all[$j].x)
    $dy=[Math]::Abs($all[$i].y-$all[$j].y)
    if ($dx -lt 18 -and $dy -lt 18) {
      Write-Output ("DUP ({0:n1},{1:n1}) vs ({2:n1},{3:n1})" -f $all[$i].x,$all[$i].y,$all[$j].x,$all[$j].y)
      $dups++
    }
  }
}
Write-Output "dupPairs=$dups"
