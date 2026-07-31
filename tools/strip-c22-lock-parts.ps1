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
  return @{w=($maxX-$minX);h=($maxY-$minY)}
}

$dropped = 0
foreach ($pm in @([regex]::Matches($raw, '<path\b[^>]*/>'))) {
  $tag = $pm.Value
  if ($tag -notmatch 'd="([^"]+)"') { continue }
  $d = $Matches[1]
  $a = PathAvg $d
  $b = PathBounds $d
  # c22 lock parts: around (181.5, 2520), small
  if ($a.y -lt 2505 -or $a.y -gt 2535) { continue }
  if ($a.x -lt 170 -or $a.x -gt 195) { continue }
  if ($b.w -gt 40 -or $b.h -gt 40) { continue }
  Write-Output ("drop ({0:n1},{1:n1}) {2:n1}x{3:n1}" -f $a.x,$a.y,$b.w,$b.h)
  Write-Output ("  {0}" -f $tag.Substring(0,[Math]::Min(130,$tag.Length)))
  $raw = $raw.Replace($tag, '<!-- drop c22 lock part -->')
  $dropped++
}

[IO.File]::WriteAllText($bakPath, $raw)
Write-Output "dropped=$dropped 5B6470=$(([regex]::Matches($raw,'#5B6470')).Count)"
