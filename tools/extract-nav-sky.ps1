# Extract bottom nav + sky region coords from 커리큘럼 메인화면.svg
$dir = Join-Path $PSScriptRoot '..\public\assets'
$outDir = Join-Path $PSScriptRoot '..\tmp-curriculum'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$curr = Get-ChildItem -LiteralPath $dir -Filter '*.svg' | Where-Object {
  $_.Length -gt 4200000 -and $_.Length -lt 4300000 -and $_.Name -notlike 'onboarding-*'
} | Select-Object -First 1

$raw = [IO.File]::ReadAllText($curr.FullName)
Write-Host "file: $($curr.Name)"

# Bottom nav area - earlier we saw y~1023 transforms
# Find F4F6FA / bottom bar related
$idx = $raw.IndexOf('#F4F6FA')
Write-Host "F4F6FA idx=$idx"
if ($idx -gt 0) {
  $chunk = $raw.Substring([Math]::Max(0,$idx-800), 2000)
  $chunk = [regex]::Replace($chunk, 'data:image/png;base64,[A-Za-z0-9+/=]{40,}', '[IMG]')
  [IO.File]::WriteAllText((Join-Path $outDir 'nav-chunk.txt'), $chunk)
}

# Find all transforms with translate near bottom (y > 1000)
$transforms = [regex]::Matches($raw, 'transform="translate\(([^)]+)\)"')
Write-Host "transforms: $($transforms.Count)"
$seen = @{}
foreach ($t in $transforms) {
  $v = $t.Groups[1].Value
  if ($v -match '([\d.]+)\s+([\d.]+)') {
    $ty = [double]$Matches[2]
    if ($ty -gt 980 -and -not $seen.ContainsKey($v)) {
      $seen[$v] = $true
      # get surrounding element
      $start = [Math]::Max(0, $t.Index - 120)
      $el = $raw.Substring($start, [Math]::Min(280, $raw.Length - $start))
      $el = [regex]::Replace($el, 'd="[^"]{80,}"', 'd="..."')
      Write-Host "y~$ty : $el"
      Write-Host '---'
    }
  }
}

# Sky ends around y=410 (map green starts). Title at 105, card at 188-342
Write-Host "`nSky UI bounds (SVG coords): gradient+title+card roughly y=0..342, map at y=410"
Write-Host ("Frame scale 393/523 = {0}" -f (393.0/523))
Write-Host ("Sky pin height if card bottom: {0}" -f (342 * 393.0/523))
Write-Host ("Sky pin height if map start 410: {0}" -f (410 * 393.0/523))
Write-Host ("Nav height 97.162 * scale: {0}" -f (97.162 * 393.0/523))
Write-Host ("Home indicator 33.27 * scale: {0}" -f (33.2747 * 393.0/523))
Write-Host ("Total bottom chrome: {0}" -f ((97.162+33.2747) * 393.0/523))

# Look for text paths that might be 홈/단어장 labels near bottom - search Korean in path fills near end
# Extract path fills with #4F91EB or similar active tab color near bottom
$bluePaths = [regex]::Matches($raw, 'fill="#4F91EB"|fill="#2AA3FF"|fill="#155DFC"')
Write-Host "blue fills: $($bluePaths.Count)"
