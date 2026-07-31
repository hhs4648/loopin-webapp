$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$svgPath = (Get-ChildItem "C:\Users\user\.cursor\projects\loopin-webapp\public\assets\*LONG.svg").FullName
$svg = Get-Content -LiteralPath $svgPath -Raw -Encoding UTF8
[void]($svg -match 'base64,([A-Za-z0-9+/=]+)')
$bytes = [Convert]::FromBase64String($Matches[1])
$ms = New-Object System.IO.MemoryStream(,$bytes)
$bmp = New-Object System.Drawing.Bitmap($ms)
$W = $bmp.Width; $H = $bmp.Height
Write-Output ("PNG {0}x{1}" -f $W,$H)

# background teal sample
$bg = $bmp.GetPixel(5,5)
Write-Output ("bg #{0:X2}{1:X2}{2:X2}" -f $bg.R,$bg.G,$bg.B)

function IsPath($c) { return ($c.R -gt 235 -and $c.G -gt 225 -and $c.B -lt 205 -and ($c.R-$c.B) -gt 25) }
function IsWarmCastle($c) { return ($c.R -gt 200 -and $c.G -gt 90 -and $c.B -lt 170 -and ($c.R-$c.B) -gt 45 -and $c.G -lt 210) }
function IsBlue($c) { return ($c.B -gt 180 -and ($c.B-$c.R) -gt 25 -and $c.G -lt 210) }
function IsBg($c) {
  return ([Math]::Abs($c.R-$bg.R) -lt 14 -and [Math]::Abs($c.G-$bg.G) -lt 14 -and [Math]::Abs($c.B-$bg.B) -lt 14)
}

# For each row in the repeating region (say y=950..2620): compute
#  - path center x (avg of path pixels)
#  - path width
#  - hasCastle, hasBlue
Write-Output "row profile (y, pathCx, pathW, castle, blue):"
$rows = @{}
for ($y=950; $y -lt $H; $y++) {
  $pmin=-1;$pmax=-1;$pc=0
  $castle=$false;$blue=$false
  for ($x=0; $x -lt $W; $x++) {
    $c=$bmp.GetPixel($x,$y)
    if (IsPath $c) { if($pmin -lt 0){$pmin=$x}; $pmax=$x; $pc++ }
    if (IsWarmCastle $c) { $castle=$true }
    if (IsBlue $c) { $blue=$true }
  }
  $cx = if ($pmin -ge 0) { [int](($pmin+$pmax)/2) } else { -1 }
  $rows[$y] = [pscustomobject]@{ y=$y; cx=$cx; pw=($pmax-$pmin+1); castle=$castle; blue=$blue; pc=$pc }
}

# Clean rows: no castle, no blue, single path band, path width moderate (30..120)
$clean = $rows.Values | Where-Object { -not $_.castle -and -not $_.blue -and $_.cx -ge 0 -and $_.pw -ge 25 -and $_.pw -le 130 } | Sort-Object y
Write-Output ("clean row count: {0}" -f $clean.Count)
Write-Output "clean rows sample (every 5th):"
$idx=0
foreach ($r in $clean) {
  if ($idx % 5 -eq 0) { Write-Output ("  y={0} cx={1} pw={2}" -f $r.y,$r.cx,$r.pw) }
  $idx++
}

$bmp.Dispose(); $ms.Dispose()
