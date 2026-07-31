Add-Type -AssemblyName System.Drawing

$dir = Join-Path $PSScriptRoot '..\public\assets'
$outDir = Join-Path $PSScriptRoot '..\tmp-curriculum'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

# Pick specifically the curriculum main (~4269206) by excluding known ASCII names
$curr = Get-ChildItem -LiteralPath $dir -Filter '*.svg' | Where-Object {
  $_.Length -gt 4200000 -and $_.Length -lt 4300000 -and $_.Name -notlike 'onboarding-*'
} | Select-Object -First 1

Write-Host "curriculum main: $($curr.Name) $($curr.Length)"

$raw = [IO.File]::ReadAllText($curr.FullName)

# Structure summary
$imgMatches = [regex]::Matches($raw, '<image[^>]*>')
Write-Host "image tags: $($imgMatches.Count)"
foreach ($im in $imgMatches) {
  $t = $im.Value
  $x=''; $y=''; $w=''; $h=''
  if ($t -match 'x="([^"]+)"') { $x=$Matches[1] }
  if ($t -match 'y="([^"]+)"') { $y=$Matches[1] }
  if ($t -match 'width="([^"]+)"') { $w=$Matches[1] }
  if ($t -match 'height="([^"]+)"') { $h=$Matches[1] }
  Write-Host ("  image x={0} y={1} w={2} h={3} len={4}" -f $x,$y,$w,$h,$t.Length)
}

# Gradients
$grads = [regex]::Matches($raw, 'id="(paint\d+_linear[^"]*)"[\s\S]{0,400}?</linearGradient>')
Write-Host "gradients: $($grads.Count)"
foreach ($g in $grads) {
  Write-Host $g.Value.Substring(0, [Math]::Min(280, $g.Value.Length))
  Write-Host '---'
}

# Top-level rects
$rects = [regex]::Matches($raw, '<rect [^/]*/>')
Write-Host "rects: $($rects.Count) (showing first 15)"
for ($i=0; $i -lt [Math]::Min(15, $rects.Count); $i++) {
  Write-Host $rects[$i].Value.Substring(0, [Math]::Min(160, $rects[$i].Value.Length))
}

# Extract all PNGs
$pngMatches = [regex]::Matches($raw, 'data:image/png;base64,([A-Za-z0-9+/=]+)')
Write-Host "png embeds: $($pngMatches.Count)"
for ($i=0; $i -lt $pngMatches.Count; $i++) {
  $b64 = $pngMatches[$i].Groups[1].Value
  $pad = (4 - ($b64.Length % 4)) % 4
  if ($pad -gt 0) { $b64 += ('=' * $pad) }
  $bytes = [Convert]::FromBase64String($b64)
  $path = Join-Path $outDir ("curr-embed-{0}.png" -f $i)
  [IO.File]::WriteAllBytes($path, $bytes)
  $bmp = [System.Drawing.Bitmap]::FromFile($path)
  Write-Host ("  embed[{0}]: {1}x{2} -> {3}" -f $i, $bmp.Width, $bmp.Height, $path)

  # top sky crop
  $hh = [Math]::Min(450, $bmp.Height)
  $crop = New-Object System.Drawing.Bitmap($bmp.Width, $hh)
  $g = [System.Drawing.Graphics]::FromImage($crop)
  $g.DrawImage($bmp, 0, 0, (New-Object System.Drawing.Rectangle(0,0,$bmp.Width,$hh)), [System.Drawing.GraphicsUnit]::Pixel)
  $g.Dispose()
  $crop.Save((Join-Path $outDir ("curr-embed-{0}-top.png" -f $i)), [System.Drawing.Imaging.ImageFormat]::Png)
  $crop.Dispose()
  $bmp.Dispose()
}

# Text content (titles)
$textMatches = [regex]::Matches($raw, '>([^<>]{2,40})<')
$seen = @{}
foreach ($t in $textMatches) {
  $s = $t.Groups[1].Value.Trim()
  if ($s -and $s -notmatch '^\d' -and $s.Length -lt 40 -and -not $seen.ContainsKey($s)) {
    if ($s -match '[가-힣A-Za-z]') {
      $seen[$s] = $true
      Write-Host ("text: {0}" -f $s)
    }
  }
}
