$ErrorActionPreference = 'Stop'
$bakPath = Join-Path $PSScriptRoot '..\public\assets\main-home-academy-map.before-extend.svg' | Resolve-Path
$raw = [IO.File]::ReadAllText($bakPath)

function NaiveYs([string]$d) {
  $nums = [regex]::Matches($d, '-?\d+(?:\.\d+)?') | ForEach-Object { [double]$_.Value }
  $ys = @()
  for ($i = 1; $i -lt $nums.Count; $i += 2) { $ys += $nums[$i] }
  return $ys
}

# 1) Drop status-bar battery (and nearby status chrome that tiles wrongly)
# Full battery group with clip2
$batteryPatterns = @(
  '(?s)<g clip-path="url\(#clip2_6022_868\)">.*?</g>',
  '<path d="M330\.999 18\.1992[^"]+" fill="#111827"/>',
  '<path d="M336 20\.1992[^"]+" fill="#111827"[^/]*/>',
  '<path d="M331\.402 16\.6016[^"]+" stroke="#111827"[^/]*/>'
)

$dropped = 0
foreach ($pat in $batteryPatterns) {
  $before = $raw.Length
  $raw = [regex]::Replace($raw, $pat, '<!-- drop status battery -->')
  if ($raw.Length -lt $before) {
    $dropped++
    Write-Output "dropped pattern: $($pat.Substring(0,[Math]::Min(50,$pat.Length)))"
  }
}

# 2) Drop ALL purple poles (#7F40FF) — roof accents on castles also use colors but 7F40FF was pole
$purple = [regex]::Matches($raw, '<path\b[^>]*fill="#7F40FF"[^>]*/>')
Write-Output "purple paths before drop=$($purple.Count)"
foreach ($pm in @($purple)) {
  $raw = $raw.Replace($pm.Value, '<!-- drop purple pole -->')
  $dropped++
}

# 3) Drop dark #111827 paths that sit in the grass map (y~300+) — path-start battery remnant
$dark = [regex]::Matches($raw, '<path\b[^>]*fill="#111827"[^>]*/>')
foreach ($pm in @($dark)) {
  if ($pm.Value -notmatch 'd="([^"]+)"') { continue }
  $ys = NaiveYs $Matches[1]
  # real-ish: if any naive-y in 280..400 and avg of ys that are < 400 is in that band
  $mapYs = @($ys | Where-Object { $_ -ge 200 -and $_ -le 500 })
  if ($mapYs.Count -ge 2) {
    Write-Output "drop dark map path: $($pm.Value.Substring(0,[Math]::Min(120,$pm.Value.Length)))"
    $raw = $raw.Replace($pm.Value, '<!-- drop map battery -->')
    $dropped++
  }
}

# Also drop stroke-only battery outlines if any remain near top-right
$raw = [regex]::Replace($raw,
  '<path d="M331\.402 16\.6016[^"]+"[^/]*/>',
  '<!-- drop status battery stroke -->')

[IO.File]::WriteAllText($bakPath, $raw)
Write-Output "backup updated dropped~$dropped bytes=$((Get-Item $bakPath).Length)"
Write-Output ("remaining 7F40FF={0}" -f ([regex]::Matches($raw,'fill="#7F40FF"')).Count)
Write-Output ("remaining M330.999={0}" -f ([regex]::Matches($raw,'M330\.999')).Count)
Write-Output ("remaining 111827={0}" -f ([regex]::Matches($raw,'fill="#111827"')).Count)
