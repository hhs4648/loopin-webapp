$dir = Join-Path $PSScriptRoot '..\public\assets'
$outDir = Join-Path $PSScriptRoot '..\tmp-curriculum'
$curr = Get-ChildItem -LiteralPath $dir -Filter '*.svg' | Where-Object {
  $_.Length -gt 4200000 -and $_.Length -lt 4300000 -and $_.Name -notlike 'onboarding-*'
} | Select-Object -First 1
$long = Get-ChildItem -LiteralPath $dir -Filter '*LONG.svg' | Select-Object -First 1

function Context-Around([string]$raw, [string]$needle, [string]$outName) {
  $idx = $raw.IndexOf($needle)
  if ($idx -lt 0) { Write-Host "not found: $needle"; return }
  $start = [Math]::Max(0, $idx - 300)
  $chunk = $raw.Substring($start, [Math]::Min(800, $raw.Length - $start))
  # strip base64
  $chunk = [regex]::Replace($chunk, 'data:image/png;base64,[A-Za-z0-9+/=]{20,}', 'data:image/png;base64,[...]')
  [IO.File]::WriteAllText((Join-Path $outDir $outName), $chunk)
  Write-Host "wrote $outName at idx=$idx"
}

$rawC = [IO.File]::ReadAllText($curr.FullName)
$rawL = [IO.File]::ReadAllText($long.FullName)

Context-Around $rawC 'height="1134" fill="white"' 'curr-white-full-ctx.txt'
Context-Around $rawL 'height="1468" fill="white"' 'long-white-full-ctx.txt'
Context-Around $rawC 'y="105.008"' 'curr-title-ctx.txt'

# Count major structural tags
foreach ($pair in @(@('CURR',$rawC), @('LONG',$rawL))) {
  $label=$pair[0]; $raw=$pair[1]
  Write-Host "=== $label structure ==="
  Write-Host ("  length={0}" -f $raw.Length)
  Write-Host ("  <g = {0}" -f ([regex]::Matches($raw,'<g[\s>]')).Count)
  Write-Host ("  </g> = {0}" -f ([regex]::Matches($raw,'</g>')).Count)
  Write-Host ("  <mask = {0}" -f ([regex]::Matches($raw,'<mask')).Count)
  Write-Host ("  <clipPath = {0}" -f ([regex]::Matches($raw,'<clipPath')).Count)
  Write-Host ("  fill=`"white`" full-ish = {0}" -f ([regex]::Matches($raw,'fill="white"')).Count)
}

# Find title text as paths near y=105 - look for nearby path fills #111827 or similar
# Extract all elements between title rect and course card
$i1 = $rawC.IndexOf('y="105.008"')
$i2 = $rawC.IndexOf('y="188"')
if ($i1 -gt 0 -and $i2 -gt $i1) {
  $mid = $rawC.Substring($i1, $i2 - $i1)
  Write-Host ("CURR between title and card: {0} chars, paths={1}" -f $mid.Length, ([regex]::Matches($mid,'<path')).Count)
  [IO.File]::WriteAllText((Join-Path $outDir 'curr-title-to-card.txt'), $mid)
}

# Does LONG have similar title block?
$i1L = $rawL.IndexOf('y="105')
Write-Host ("LONG y=105 idx={0}" -f $i1L)
if ($i1L -gt 0) {
  Write-Host $rawL.Substring([Math]::Max(0,$i1L-80), 200)
}
