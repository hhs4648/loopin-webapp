Add-Type -AssemblyName System.Drawing

$dir = Join-Path $PSScriptRoot '..\public\assets'
$files = @(
  (Get-ChildItem -LiteralPath $dir -Filter '*LONG.svg' | Select-Object -First 1),
  (Get-ChildItem -LiteralPath $dir -Filter '*메인화면.svg' | Where-Object { $_.Name -notlike '*LONG*' } | Select-Object -First 1),
  (Get-ChildItem -LiteralPath $dir | Where-Object { $_.Name -like '*커리큘럼*메인*' } | Select-Object -First 1)
)

foreach ($f in $files) {
  if (-not $f) { continue }
  Write-Host "=== $($f.Name) size=$($f.Length) ==="
  # read first 2KB as text for structure
  $fs = [IO.File]::OpenRead($f.FullName)
  $buf = New-Object byte[] 2048
  $n = $fs.Read($buf, 0, 2048)
  $fs.Close()
  $head = [Text.Encoding]::UTF8.GetString($buf, 0, $n)
  if ($head -match 'viewBox="([^"]+)"') { Write-Host "viewBox: $($Matches[1])" }
  if ($head -match 'width="([^"]+)"') { Write-Host "width: $($Matches[1])" }
  if ($head -match 'height="([^"]+)"') { Write-Host "height: $($Matches[1])" }
  $hasImage = $head.Contains('data:image/png') -or $head.Contains('image href')
  Write-Host "head has image? $($head.Contains('image'))"
}

# Specifically find curriculum main by listing all svgs with Korean
Write-Host "`n--- all svg names ---"
Get-ChildItem -LiteralPath $dir -Filter '*.svg' | ForEach-Object {
  $bytes = [Text.Encoding]::UTF8.GetBytes($_.Name)
  $hex = ($bytes | ForEach-Object { '{0:X2}' -f $_ }) -join ''
  if ($_.Name.Length -gt 20 -or $_.Name -match '[^\x00-\x7F]') {
    Write-Host ("{0}  bytes={1}" -f $_.Name, $_.Length)
  }
}
