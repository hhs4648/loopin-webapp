$ErrorActionPreference = 'Stop'
$bak = Join-Path $PSScriptRoot '..\public\assets\main-home-academy-map.before-extend.svg' | Resolve-Path
$raw = [IO.File]::ReadAllText($bak)

# Find white circle locks - get surrounding XML for one of them
$idx = $raw.IndexOf('M287 469C295.284 469 302 462.284')
Write-Output "c2 lock idx=$idx"
Write-Output $raw.Substring([Math]::Max(0,$idx-200), 1200)

Write-Output "`n=== another lock (left castle ~992 area?) search white circles with r~15 ==="
# white filled circles as paths with Z and fill white size ~30
$matches = [regex]::Matches($raw, '<path d="M(\d+(?:\.\d+)?) (\d+(?:\.\d+)?)C[^"]+" fill="white"/>')
Write-Output "white circle paths=$($matches.Count)"
foreach ($m in $matches) {
  $x=[double]$m.Groups[1].Value; $y=[double]$m.Groups[2].Value
  # bottom of circle - center is y-15
  $cy = $y - 15
  if ($cy -lt 300 -or $cy -gt 1200) { continue }
  Write-Output ("circle bottom=({0},{1}) center~({0},{2:n0})" -f $x,$y,$cy)
}

# Look for lock icon group near first left-side lock (castle 3 ~670)
Write-Output "`n=== search #111827 lock fills count ==="
Write-Output ([regex]::Matches($raw, 'fill="#111827"')).Count

# Get a complete lock badge group - search for filter + white rect pattern used by locks
$lockIdx = $raw.IndexOf('fill="#111827"')
Write-Output "`nfirst #111827 context:"
Write-Output $raw.Substring([Math]::Max(0,$lockIdx-400), 900)
