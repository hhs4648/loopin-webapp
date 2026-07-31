# Extract bottom nav icon paths + labels from 커리큘럼 메인화면
$dir = Join-Path $PSScriptRoot '..\public\assets'
$outDir = Join-Path $PSScriptRoot '..\tmp-curriculum'

$curr = Get-ChildItem -LiteralPath $dir -Filter '*.svg' | Where-Object {
  $_.Length -gt 4200000 -and $_.Length -lt 4300000 -and $_.Name -notlike 'onboarding-*'
} | Select-Object -First 1

$raw = [IO.File]::ReadAllText($curr.FullName)

# Nav section starts at translate(1 1023.53)
$navStart = $raw.IndexOf('transform="translate(1 1023.53)"')
$navEnd = $raw.IndexOf('transform="translate(1 1100.72)"')
# include home indicator + a bit more until title filter group
$titleG = $raw.IndexOf('<g filter="url(#filter18_d_5959_3243)">', $navEnd)
if ($titleG -lt 0) { $titleG = $raw.IndexOf('<g filter=', $navEnd) }

Write-Host "navStart=$navStart navEnd=$navEnd titleG=$titleG"
$navBlock = $raw.Substring($navStart - 80, $titleG - ($navStart - 80))
# strip nothing huge
[IO.File]::WriteAllText((Join-Path $outDir 'nav-block.svg'), $navBlock)
Write-Host "nav block len=$($navBlock.Length)"

# Also dump paths with fill near bottom - classify by approximate x
$pathMatches = [regex]::Matches($navBlock, '<path d="([^"]{0,2000})" fill="([^"]+)"[^/]*/>')
Write-Host "paths in nav: $($pathMatches.Count)"
foreach ($p in $pathMatches) {
  $d = $p.Groups[1].Value
  $fill = $p.Groups[2].Value
  # first M x coordinate
  if ($d -match 'M([\d.]+)\s+([\d.]+)') {
    Write-Host ("  M={0,8} {1,8} fill={2} dlen={3}" -f $Matches[1], $Matches[2], $fill, $d.Length)
  }
}
