$ErrorActionPreference = 'Stop'
$bak = Join-Path $PSScriptRoot '..\public\assets\main-home-academy-map.before-extend.svg' | Resolve-Path
$raw = [IO.File]::ReadAllText($bak)

function PathAvg([string]$d) {
  $nums = [regex]::Matches($d, '-?\d+(?:\.\d+)?') | ForEach-Object { [double]$_.Value }
  $sx=0;$sy=0;$n=0
  for ($i=0;$i -lt $nums.Count-1;$i+=2) { $sx+=$nums[$i]; $sy+=$nums[$i+1]; $n++ }
  if ($n -eq 0) { return @{x=-1;y=-1} }
  return @{x=$sx/$n;y=$sy/$n}
}

Write-Output '=== #7F40FF remaining ==='
Write-Output ([regex]::Matches($raw,'#7F40FF')).Count

Write-Output '`n=== purple-ish fills near path start / mid ==='
foreach ($fill in @('#7F40FF','#981AF2','#8B5CF6','#A78BFA','#9B6BFF','#B794F6','#C4B5FD')) {
  $n = ([regex]::Matches($raw, [regex]::Escape("fill=`"$fill`""))).Count
  if ($n -gt 0) { Write-Output "$fill count=$n" }
}

# Orange/yellow small triangle flags (castle flags are pink; this may be orange)
Write-Output '`n=== small warm fills (possible orange flags) y 250-400 x<100 ==='
foreach ($pm in [regex]::Matches($raw, '<path\b[^>]*/>')) {
  $tag=$pm.Value
  if ($tag -notmatch 'fill="([^"]+)"') { continue }
  $fill=$Matches[1]
  if ($fill -notmatch '^#(F[FD]|E[89A-F]|FFA|FFB|F90|DE8)') { continue }
  if ($tag -notmatch 'd="([^"]+)"') { continue }
  $a=PathAvg $Matches[1]
  if ($a.y -lt 240 -or $a.y -gt 420) { continue }
  if ($a.x -lt 0 -or $a.x -gt 100) { continue }
  Write-Output ("fill=$fill avg=({0:n1},{1:n1}) {2}" -f $a.x,$a.y,$tag.Substring(0,[Math]::Min(120,$tag.Length)))
}

# Look for vertical capsule poles near x 30-60
Write-Output '`n=== tall thin paths near start (possible poles) ==='
foreach ($pm in [regex]::Matches($raw, '<path\b[^>]*/>|<rect\b[^>]*/>')) {
  $tag=$pm.Value
  if ($tag -match 'd="([^"]+)"') {
    $d=$Matches[1]
    $nums=[regex]::Matches($d,'-?\d+(?:\.\d+)?')|ForEach-Object{[double]$_.Value}
    if($nums.Count -lt 4){continue}
    $minX=1e9;$maxX=-1e9;$minY=1e9;$maxY=-1e9
    for($i=0;$i -lt $nums.Count-1;$i+=2){
      $x=$nums[$i];$y=$nums[$i+1]
      if($x -lt $minX){$minX=$x};if($x -gt $maxX){$maxX=$x}
      if($y -lt $minY){$minY=$y};if($y -gt $maxY){$maxY=$y}
    }
    $w=$maxX-$minX;$h=$maxY-$minY
    if($w -gt 12 -or $h -lt 25){continue}
    if($minY -lt 250 -or $minY -gt 380){continue}
    if($minX -gt 80){continue}
    $fill=if($tag -match 'fill="([^"]+)"'){$Matches[1]}else{'-'}
    Write-Output ("fill=$fill bounds=[{0:n0}-{1:n0}]x[{2:n0}-{3:n0}]" -f $minX,$maxX,$minY,$maxY)
    Write-Output ("  {0}" -f $tag.Substring(0,[Math]::Min(140,$tag.Length)))
  }
}

# How many times start flag paths appear in extended
$ext = [IO.File]::ReadAllText((Join-Path $PSScriptRoot '..\public\assets\main-home-academy-map.svg'|Resolve-Path))
Write-Output '`n=== React flag asset ==='
Get-Item (Join-Path $PSScriptRoot '..\public\assets\flag.svg'|Resolve-Path) | Select-Object Length
