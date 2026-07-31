# Find left title glyphs and full sky header structure in 커리큘럼 메인화면
$dir = Join-Path $PSScriptRoot '..\public\assets'
$outDir = Join-Path $PSScriptRoot '..\tmp-curriculum'

$curr = Get-ChildItem -LiteralPath $dir -Filter '*.svg' | Where-Object {
  $_.Length -gt 4200000 -and $_.Length -lt 4300000 -and $_.Name -notlike 'onboarding-*' -and $_.Name -notlike 'curriculum-main-long*'
} | Select-Object -First 1
$longAsset = Join-Path $dir 'curriculum-main-long.svg'

$rawC = [IO.File]::ReadAllText($curr.FullName)
$rawL = [IO.File]::ReadAllText($longAsset)

# Search for fill="#1E242F" or similar dark text in sky y region - path with M x < 100
$darkPaths = [regex]::Matches($rawC, '<path d="(M[\d.]+ [\d.]+)[^"]*" fill="#1E242F"[^/]*/>')
Write-Host "CURR #1E242F paths: $($darkPaths.Count)"
foreach ($p in $darkPaths) {
  if ($p.Groups[1].Value -match 'M([\d.]+) ([\d.]+)') {
    $x=[double]$Matches[1]; $y=[double]$Matches[2]
    if ($y -lt 200) { Write-Host ("  x={0:N1} y={1:N1} len={2}" -f $x,$y,$p.Value.Length) }
  }
}

# Also #111827, #374151, black
foreach ($color in @('#111827','#374151','#1F2937','black','#000000','#2D3436')) {
  $ms = [regex]::Matches($rawC, "<path d=`"(M[\d.]+ [\d.]+)[^`"]{0,80}" fill=`"$color`"")
  if ($ms.Count -gt 0) {
    Write-Host "`nCURR fill=$color count=$($ms.Count) sky samples:"
    $n=0
    foreach ($p in $ms) {
      if ($p.Groups[1].Value -match 'M([\d.]+) ([\d.]+)') {
        $y=[double]$Matches[2]
        if ($y -lt 180 -and $n -lt 8) {
          Write-Host ("  x={0} y={1}" -f $Matches[1],$Matches[2])
          $n++
        }
      }
    }
  }
}

# LONG sky title paths
Write-Host "`n=== LONG asset sky dark paths ==="
$darkL = [regex]::Matches($rawL, '<path d="(M[\d.]+ [\d.]+)[^"]*" fill="#1E242F"[^/]*/>')
Write-Host "LONG #1E242F: $($darkL.Count)"
foreach ($p in $darkL) {
  if ($p.Groups[1].Value -match 'M([\d.]+) ([\d.]+)') {
    $x=[double]$Matches[1]; $y=[double]$Matches[2]
    if ($y -lt 200) { Write-Host ("  x={0:N1} y={1:N1} len={2}" -f $x,$y,$p.Value.Length) }
  }
}

# Check if LONG has left title group - search "특별" won't work on paths
# Look for large path near x=29-50 y=70-100
Write-Host "`nLONG paths with y~70-100 and x<80:"
$allP = [regex]::Matches($rawL, '<path d="M([\d.]+) ([\d.]+)[^"]{20,}" fill="([^"]+)"')
$n=0
foreach ($p in $allP) {
  $x=[double]$p.Groups[1].Value; $y=[double]$p.Groups[2].Value; $f=$p.Groups[3].Value
  if ($y -ge 60 -and $y -le 120 -and $x -lt 100 -and $n -lt 15) {
    Write-Host ("  M={0:N1},{1:N1} fill={2} dlen~" -f $x,$y,$f)
    $n++
  }
}
