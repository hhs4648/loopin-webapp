$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$svgPath = (Get-ChildItem "C:\Users\user\.cursor\projects\loopin-webapp\public\assets\*LONG.svg").FullName
$svg = Get-Content -LiteralPath $svgPath -Raw -Encoding UTF8
[void]($svg -match 'base64,([A-Za-z0-9+/=]+)')
$ms = New-Object System.IO.MemoryStream(,[Convert]::FromBase64String($Matches[1]))
$bmp = New-Object System.Drawing.Bitmap($ms)
$W=$bmp.Width;$H=$bmp.Height
$bg = $bmp.GetPixel(5,700)

function IsPath($c){ return ($c.R -gt 235 -and $c.G -gt 225 -and $c.B -lt 205 -and ($c.R-$c.B) -gt 25) }
function IsWarm($c){ return ($c.R -gt 200 -and $c.G -gt 90 -and $c.B -lt 170 -and ($c.R-$c.B) -gt 45 -and $c.G -lt 210) }
function IsBlue($c){ return ($c.B -gt 180 -and ($c.B-$c.R) -gt 25 -and $c.G -lt 210) }

# frame cx target ~155 (full-map bottom). LONG src cx = frameCx * 360/393
$targetSrc = [int](155 * 360.0/393.0)  # ~142
Write-Output "target src cx ~$targetSrc"

$hits = @()
for ($y=960; $y -lt $H; $y++){
  $pmin=-1;$pmax=-1;$castle=$false;$blue=$false
  for ($x=0;$x -lt $W;$x++){
    $c=$bmp.GetPixel($x,$y)
    if(IsPath $c){ if($pmin -lt 0){$pmin=$x}; $pmax=$x }
    if(IsWarm $c){ $castle=$true }
    if(IsBlue $c){ $blue=$true }
  }
  if($pmin -ge 0 -and -not $castle -and -not $blue){
    $cx=[int](($pmin+$pmax)/2); $pw=$pmax-$pmin+1
    if([Math]::Abs($cx-$targetSrc) -le 12 -and $pw -ge 18 -and $pw -le 60){
      $hits += [pscustomobject]@{y=$y;cx=$cx;pw=$pw}
    }
  }
}
Write-Output ("hits near target: {0}" -f $hits.Count)
foreach($h in $hits){ Write-Output ("  y={0} cx={1} pw={2} (frameCx={3:N0})" -f $h.y,$h.cx,$h.pw, ($h.cx*393.0/360.0)) }

# find pairs ~312 apart
Write-Output "period-aligned pairs (~312 apart):"
foreach($a in $hits){
  foreach($b in $hits){
    $d=$b.y-$a.y
    if($d -gt 290 -and $d -lt 335){
      Write-Output ("  {0} -> {1} (d={2}) cx {3}->{4}" -f $a.y,$b.y,$d,$a.cx,$b.cx)
    }
  }
}
$bmp.Dispose(); $ms.Dispose()
