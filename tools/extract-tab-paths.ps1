# Extract only the 4 tab icon+label path groups from nav (between tab cell rects)
$dir = Join-Path $PSScriptRoot '..\public\assets'
$outDir = Join-Path $PSScriptRoot '..\tmp-curriculum'

$curr = Get-ChildItem -LiteralPath $dir -Filter '*.svg' | Where-Object {
  $_.Length -gt 4200000 -and $_.Length -lt 4300000 -and $_.Name -notlike 'onboarding-*'
} | Select-Object -First 1
$raw = [IO.File]::ReadAllText($curr.FullName)

# Tab cell markers
$markers = @(
  'transform="translate(1 1024.86)" fill="white"',
  'transform="translate(131.77 1024.86)" fill="white"',
  'transform="translate(262.539 1024.86)" fill="white"',
  'transform="translate(393.309 1024.86)" fill="white"',
  'transform="translate(1 1100.72)"'
)

$idxs = @()
foreach ($m in $markers) {
  $i = $raw.IndexOf($m)
  Write-Host "marker '$($m.Substring(0,40))...' idx=$i"
  $idxs += $i
}

for ($t=0; $t -lt 4; $t++) {
  $start = $idxs[$t]
  $end = $idxs[$t+1]
  $chunk = $raw.Substring($start, $end - $start)
  # keep only path elements
  $paths = [regex]::Matches($chunk, '<path[^/]*/>|<path[\s\S]*?</path>')
  Write-Host "`n=== TAB $t paths=$($paths.Count) chunkLen=$($chunk.Length) ==="
  $sb = New-Object Text.StringBuilder
  [void]$sb.AppendLine("<!-- tab $t -->")
  foreach ($p in $paths) {
    $v = $p.Value
    if ($v.Length -gt 2000) {
      # likely label glyph - keep it
      [void]$sb.AppendLine($v)
      if ($v -match 'fill="([^"]+)"') { Write-Host "  path fill=$($Matches[1]) len=$($v.Length)" }
    } else {
      [void]$sb.AppendLine($v)
      if ($v -match 'fill="([^"]+)"') { Write-Host "  path fill=$($Matches[1]) len=$($v.Length)" }
    }
  }
  [IO.File]::WriteAllText((Join-Path $outDir ("tab-$t.svg")), $sb.ToString())
}
