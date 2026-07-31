$ErrorActionPreference = 'Stop'
$svgPath = Join-Path $PSScriptRoot '..\public\assets\main-home-academy-map.svg' | Resolve-Path
# Read only structural bits — file is huge
$fs = [IO.File]::OpenText($svgPath)
$head = New-Object Text.StringBuilder
for ($i = 0; $i -lt 80 -and -not $fs.EndOfStream; $i++) {
  [void]$head.AppendLine($fs.ReadLine())
}
$fs.Close()
Write-Output '--- HEAD ---'
Write-Output $head.ToString()

$raw = [IO.File]::ReadAllText($svgPath)
Write-Output ("len={0}" -f $raw.Length)
Write-Output ("bundles={0}" -f ([regex]::Matches($raw, 'id="map-bundle-\d+"')).Count)
Write-Output ("continuousComment={0}" -f ($raw -match 'continuous x5 period=2192'))
Write-Output ("clipRects={0}" -f ([regex]::Matches($raw, 'clipPath[^>]*>[\s\S]*?</clipPath>')).Count)

# sample clipPath / viewBox / image height
foreach ($pat in @(
  'viewBox="[^"]+"',
  'height="\d+"',
  'clipPath id="[^"]+"[\s\S]{0,120}',
  'id="map-bundle-1" transform="[^"]+"',
  'id="map-bundle-4" transform="[^"]+"'
)) {
  $m = [regex]::Match($raw, $pat)
  if ($m.Success) { Write-Output ("MATCH: {0}" -f $m.Value.Substring(0, [Math]::Min(160, $m.Value.Length))) }
}

# Check if translated paths would be clipped by outer clip
$clipH = if ($raw -match 'clipPath id="clip0_6022_868">\s*<rect[^>]*height="(\d+)"') { [int]$Matches[1] } else { -1 }
Write-Output "clipH=$clipH"

# Count paths inside first bundle by rough parse
$b1 = [regex]::Match($raw, '<g id="map-bundle-1"[^>]*>([\s\S]*?)</g>')
if ($b1.Success) {
  $pc = ([regex]::Matches($b1.Groups[1].Value, '<path\b')).Count
  Write-Output "bundle1_paths=$pc"
}

# Verify pattern height transform
if ($raw -match 'transform="scale\(([^)]+)\)"') {
  Write-Output "patternScale=$($Matches[1])"
}
