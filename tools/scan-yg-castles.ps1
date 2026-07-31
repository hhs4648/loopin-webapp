$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$path = (Get-ChildItem 'C:\Users\user\.cursor\projects\loopin-webapp\public\assets\*LONG.svg').FullName
$s = Get-Content -LiteralPath $path -Raw -Encoding UTF8
[void]($s -match 'base64,([A-Za-z0-9+/=]+)')
$ms = New-Object System.IO.MemoryStream(, [Convert]::FromBase64String($Matches[1]))
$lg = New-Object System.Drawing.Bitmap($ms)

function IsYG($c) {
  return ($c.R -gt 195 -and $c.G -gt 175 -and $c.B -lt 165 -and ($c.G - $c.B) -gt 40 -and ($c.R - $c.B) -gt 45)
}
function IsLupin($c) {
  return ($c.B -gt 145 -and $c.B -gt ($c.R + 30) -and $c.B -gt ($c.G + 10) -and $c.R -lt 175)
}

$in=$false;$y0=0;$x0=0;$x1=0
for ($y=400; $y -lt $lg.Height; $y++) {
  $cnt=0;$rmin=-1;$rmax=-1
  for ($x=0; $x -lt $lg.Width; $x++) {
    if (IsYG ($lg.GetPixel($x,$y))) { $cnt++; if($rmin -lt 0){$rmin=$x}; $rmax=$x }
  }
  if ($cnt -gt 20 -and ($rmax-$rmin) -gt 50) {
    if (-not $in) { $in=$true; $y0=$y; $x0=$rmin; $x1=$rmax }
    else { if($rmin -lt $x0){$x0=$rmin}; if($rmax -gt $x1){$x1=$rmax} }
  } elseif ($in) {
    $y1=$y-1
    $lupin=$false
    for ($fy=[Math]::Max(0,$y0-50); $fy -lt $y0; $fy++) {
      for ($fx=$x0; $fx -le $x1; $fx++) {
        if (IsLupin ($lg.GetPixel($fx,$fy))) { $lupin=$true; break }
      }
      if ($lupin) { break }
    }
    Write-Output ("YG y={0}..{1} x={2}..{3} h={4} lupinAbove={5}" -f $y0,$y1,$x0,$x1,($y1-$y0+1),$lupin)
    $in=$false
  }
}
$lg.Dispose(); $ms.Dispose()
