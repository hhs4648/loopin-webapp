Add-Type -AssemblyName System.Drawing

function Inspect-Svg([string]$path) {
  Write-Host "=== $(Split-Path $path -Leaf) ==="
  $raw = Get-Content -LiteralPath $path -Raw -Encoding UTF8
  if ($raw -match 'viewBox="([^"]+)"') { Write-Host "viewBox: $($Matches[1])" }
  if ($raw -match 'width="([^"]+)"') { Write-Host "width: $($Matches[1])" }
  if ($raw -match 'height="([^"]+)"') { Write-Host "height: $($Matches[1])" }

  $m = [regex]::Match($raw, 'data:image/png;base64,([A-Za-z0-9+/=]+)')
  if (-not $m.Success) {
    Write-Host "no embedded png"
    return
  }
  $b64 = $m.Groups[1].Value
  $pad = (4 - ($b64.Length % 4)) % 4
  if ($pad -gt 0) { $b64 += ('=' * $pad) }
  $bytes = [Convert]::FromBase64String($b64)
  $ms = New-Object IO.MemoryStream(,$bytes)
  $bmp = [System.Drawing.Bitmap]::FromStream($ms)
  Write-Host "embedded png: $($bmp.Width)x$($bmp.Height)"

  # sample sky rows: average RGB of top rows
  for ($y = 0; $y -lt [Math]::Min(40, $bmp.Height); $y += 10) {
    $c = $bmp.GetPixel([int]($bmp.Width / 2), $y)
    Write-Host ("  y={0,4} mid RGB={1,3},{2,3},{3,3}" -f $y, $c.R, $c.G, $c.B)
  }
  # find where sky ends roughly (first row with lots of green/non-sky)
  for ($y = 0; $y -lt [Math]::Min(400, $bmp.Height); $y += 5) {
    $c = $bmp.GetPixel([int]($bmp.Width / 2), $y)
    # sky-ish: high blue or light cyan
    $isSky = ($c.B -gt 180 -and $c.G -gt 160) -or ($c.R -gt 200 -and $c.G -gt 220 -and $c.B -gt 230)
    if (-not $isSky -and $y -gt 20) {
      Write-Host ("  ~sky-end candidate y={0} RGB={1},{2},{3}" -f $y, $c.R, $c.G, $c.B)
      break
    }
  }

  $bmp.Dispose()
  $ms.Dispose()
}

$dir = Join-Path $PSScriptRoot '..\public\assets'
Get-ChildItem -LiteralPath $dir | Where-Object {
  $_.Name -like '*LONG*' -or $_.Name -like '*커리큘럼*'
} | ForEach-Object { Inspect-Svg $_.FullName }
