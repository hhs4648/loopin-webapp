$dir = Join-Path $PSScriptRoot '..\public\assets'
$outDir = Join-Path $PSScriptRoot '..\tmp-curriculum'

$long = Get-ChildItem -LiteralPath $dir -Filter '*LONG.svg' | Select-Object -First 1
$curr = Get-ChildItem -LiteralPath $dir -Filter '*.svg' | Where-Object {
  $_.Length -gt 4200000 -and $_.Length -lt 4300000 -and $_.Name -notlike 'onboarding-*'
} | Select-Object -First 1

function SkyElements([string]$path, [string]$label) {
  $raw = [IO.File]::ReadAllText($path)
  Write-Host "=== $label sky y<410 ==="

  # All rects with y < 410
  $rects = [regex]::Matches($raw, '<rect\b[^>/]*?/?>')
  foreach ($r in $rects) {
    $v = $r.Value
    $y = $null
    if ($v -match '\by="([0-9.]+)"') { $y = [double]$Matches[1] }
    elseif ($v -match '\bwidth=' -and $v -notmatch '\by=') { $y = 0 } # top-level
    if ($null -ne $y -and $y -lt 410) {
      Write-Host $v.Substring(0, [Math]::Min(220, $v.Length))
    }
  }

  # paths with low starting coords - hard; look for fill white rounded-ish near sky
  # foreignObject / text as path?
  $fo = [regex]::Matches($raw, '<foreignObject[\s\S]{0,500}?</foreignObject>')
  Write-Host "foreignObjects: $($fo.Count)"
  foreach ($f in $fo) {
    Write-Host $f.Value.Substring(0, [Math]::Min(300, $f.Value.Length))
  }
}

SkyElements $curr.FullName 'CURR'
SkyElements $long.FullName 'LONG'

# Extract sky-only visual by finding clip of elements - instead rasterize via browser later
# For now, extract the sky UI group from CURR: everything before map green rect (y=410)
# Strategy: copy CURR sky UI overlays (title + course card area y 0-410) onto LONG asset

# List CURR unique sky rects not in LONG
Write-Host "`n=== CURR-only sky card details ==="
$rawC = [IO.File]::ReadAllText($curr.FullName)
# Get a chunk around title and course card (search for y="105"
$idx = $rawC.IndexOf('y="105.008"')
if ($idx -gt 0) {
  $chunk = $rawC.Substring([Math]::Max(0,$idx-200), 2500)
  [IO.File]::WriteAllText((Join-Path $outDir 'curr-title-chunk.txt'), $chunk)
  Write-Host "wrote title chunk"
}
$idx2 = $rawC.IndexOf('y="188"')
if ($idx2 -gt 0) {
  $chunk = $rawC.Substring([Math]::Max(0,$idx2-100), 4000)
  [IO.File]::WriteAllText((Join-Path $outDir 'curr-card-chunk.txt'), $chunk)
  Write-Host "wrote card chunk"
}

$rawL = [IO.File]::ReadAllText($long.FullName)
$idx3 = $rawL.IndexOf('y="188.535"')
if ($idx3 -gt 0) {
  $chunk = $rawL.Substring([Math]::Max(0,$idx3-100), 4000)
  [IO.File]::WriteAllText((Join-Path $outDir 'long-card-chunk.txt'), $chunk)
  Write-Host "wrote long card chunk"
}

# Does LONG have title at ~105?
if ($rawL -match 'y="105') { Write-Host 'LONG has y=105' } else { Write-Host 'LONG NO y=105 title' }
if ($rawL -match '236\.0') { Write-Host 'LONG has 236 width maybe title' }
