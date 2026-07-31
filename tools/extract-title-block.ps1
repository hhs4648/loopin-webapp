$dir = Join-Path $PSScriptRoot '..\public\assets'
$outDir = Join-Path $PSScriptRoot '..\tmp-curriculum'
$outAssets = Join-Path $PSScriptRoot '..\public\assets'

$curr = Get-ChildItem -LiteralPath $dir -Filter '*.svg' | Where-Object {
  $_.Length -gt 4200000 -and $_.Length -lt 4300000 -and $_.Name -notlike 'onboarding-*'
} | Select-Object -First 1
$long = Get-ChildItem -LiteralPath $dir -Filter '*LONG.svg' | Select-Object -First 1

$rawC = [IO.File]::ReadAllText($curr.FullName)
$rawL = [IO.File]::ReadAllText($long.FullName)

# Find title group: look backwards from y="105.008" for <g
$idxTitle = $rawC.IndexOf('y="105.008"')
Write-Host "title idx=$idxTitle"
$searchStart = [Math]::Max(0, $idxTitle - 500)
$before = $rawC.Substring($searchStart, $idxTitle - $searchStart)
Write-Host "before title:"
Write-Host $before

# Find end of title group - after chevron path, </g>
$idxChevron = $rawC.IndexOf('stroke="#4A93EE"', $idxTitle)
$idxEndG = $rawC.IndexOf('</g>', $idxChevron)
$titleBlock = $rawC.Substring($searchStart + $before.LastIndexOf('<g'), ($idxEndG + 4) - ($searchStart + $before.LastIndexOf('<g')))
Write-Host "title block length=$($titleBlock.Length)"
[IO.File]::WriteAllText((Join-Path $outDir 'title-block.svg'), $titleBlock)

# Check if LONG already has similar title text path (루핀-like)
if ($rawL -match 'M175\.709 141') { Write-Host 'LONG already has title glyph' } else { Write-Host 'LONG missing title glyph' }
if ($rawL -match 'filter19_d_5846') { Write-Host 'LONG has filter19' }

# Also extract status bar icons from CURR sky (cellular/wifi paths near y=27)
# For bake: copy LONG to ASCII name, inject title group before course card filter group

$insertMarker = '<g filter="url(#filter19_d_5846_4978)">'
# LONG course card uses filter - find it
$m = [regex]::Match($rawL, '<g filter="url\(#filter\d+_d_5846_4978\)">\s*<rect x="29\.5508" y="188\.535"')
if (-not $m.Success) {
  $m = [regex]::Match($rawL, '<rect x="29\.5508" y="188\.535"')
}
Write-Host "LONG card marker success=$($m.Success) idx=$($m.Index)"

# Simpler approach: just copy LONG to curriculum-main-long.svg as-is first
# Then inject title block (with filter id remapped if needed)

# Check CURR title filter
if ($titleBlock -match 'filter="url\(#([^\"]+)\)"') {
  Write-Host "title uses filter $($Matches[1])"
}
# Get that filter def from CURR
if ($titleBlock -match 'filter="url\(#([^\"]+)\)"') {
  $fid = $Matches[1]
  $fMatch = [regex]::Match($rawC, "<filter id=`"$fid`"[\s\S]*?</filter>")
  if ($fMatch.Success) {
    [IO.File]::WriteAllText((Join-Path $outDir 'title-filter.svg'), $fMatch.Value)
    Write-Host "title filter len=$($fMatch.Value.Length)"
  }
}
