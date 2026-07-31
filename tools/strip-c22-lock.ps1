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
function PathBounds([string]$d) {
  $nums = [regex]::Matches($d, '-?\d+(?:\.\d+)?') | ForEach-Object { [double]$_.Value }
  $minX=1e9;$maxX=-1e9;$minY=1e9;$maxY=-1e9
  for ($i=0;$i -lt $nums.Count-1;$i+=2) {
    $x=$nums[$i];$y=$nums[$i+1]
    if($x -lt $minX){$minX=$x}; if($x -gt $maxX){$maxX=$x}
    if($y -lt $minY){$minY=$y}; if($y -gt $maxY){$maxY=$y}
  }
  return @{minX=$minX;maxX=$maxX;minY=$minY;maxY=$maxY;w=($maxX-$minX);h=($maxY-$minY)}
}

# Castle22 orphan lock ~ (181.5, 2520). Also strip any lock-badge parts in that cluster.
# Keep c21 lock at (73.5, 2450).
$dropped = 0
foreach ($pm in @([regex]::Matches($raw, '<path\b[^>]*/>'))) {
  $tag = $pm.Value
  if ($tag -notmatch 'd="([^"]+)"') { continue }
  $d = $Matches[1]
  $a = PathAvg $d
  $b = PathBounds $d
  # Lock cluster for c22: near x=181.5 y=2520, small badge parts
  if ($a.y -lt 2488 -or $a.y -gt 2555) { continue }
  if ($a.x -lt 165 -or $a.x -gt 200) { continue }
  if ($b.w -gt 45 -or $b.h -gt 45) { continue }
  Write-Output ("drop ({0:n1},{1:n1}) size={2:n1}x{3:n1} fill/stroke tag" -f $a.x,$a.y,$b.w,$b.h)
  Write-Output ("  {0}" -f $tag.Substring(0,[Math]::Min(120,$tag.Length)))
  $raw = $raw.Replace($tag, '<!-- drop c22 lock -->')
  $dropped++
}

[IO.File]::WriteAllText($bakPath, $raw)
Write-Output "dropped=$dropped"

# Verify remaining locks
$locks=@()
foreach ($pm in [regex]::Matches($raw, '<path\b[^>]*fill="white"[^>]*/>')) {
  if ($pm.Value -notmatch 'd="([^"]+)"') { continue }
  $d=$Matches[1]; $b=PathBounds $d
  if ([Math]::Abs($b.w-30) -gt 3 -or [Math]::Abs($b.h-30) -gt 3) { continue }
  $a=PathAvg $d
  $locks += "({0:n1},{1:n1})" -f $a.x,$a.y
}
Write-Output "white locks left=$($locks.Count)"
$locks | ForEach-Object { Write-Output "  $_" }
