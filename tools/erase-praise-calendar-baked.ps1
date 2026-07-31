# 맵에 구워진 ★칭찬캘린더 흰 버튼을 주변 잔디색으로 지운다.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

function LoadSvgPng([string]$path) {
  $s = Get-Content -LiteralPath $path -Raw -Encoding UTF8
  if (-not ($s -match 'xlink:href="data:image/png;base64,([A-Za-z0-9+/=]+)"')) {
    if (-not ($s -match 'base64,([A-Za-z0-9+/=]+)')) {
      throw "No PNG in $path"
    }
  }
  $ms = New-Object System.IO.MemoryStream(, [Convert]::FromBase64String($Matches[1]))
  $bmp = New-Object System.Drawing.Bitmap($ms)
  return @{ bmp = $bmp; svg = $s }
}

function SaveSvgPng([string]$path, [string]$svg, $bmp) {
  $m = New-Object System.IO.MemoryStream
  $bmp.Save($m, [System.Drawing.Imaging.ImageFormat]::Png)
  $b64 = [Convert]::ToBase64String($m.ToArray())
  $m.Dispose()
  $new = [regex]::Replace(
    $svg,
    'data:image/png;base64,[A-Za-z0-9+/=]+',
    "data:image/png;base64,$b64",
    1
  )
  [IO.File]::WriteAllText((Resolve-Path $path), $new, [Text.UTF8Encoding]::new($false))
}

# FRAME 393×765 ↔ PNG 899×1750
$FRAME_W = 393
$CONTENT_H = 765
# PRAISE_CALENDAR_FIXED_RECT + 여유
$fx = 250; $fy = 304; $fw = 120; $fh = 52

function ErasePraise([string]$path) {
  $pack = LoadSvgPng $path
  $bmp = $pack.bmp
  $W = $bmp.Width
  $H = $bmp.Height
  $x0 = [Math]::Max(0, [int]($fx * $W / $FRAME_W))
  $y0 = [Math]::Max(0, [int]($fy * $H / $CONTENT_H))
  $x1 = [Math]::Min($W - 1, [int](($fx + $fw) * $W / $FRAME_W))
  $y1 = [Math]::Min($H - 1, [int](($fy + $fh) * $H / $CONTENT_H))
  Write-Output ("{0}: erase x{1}..{2} y{3}..{4}" -f (Split-Path $path -Leaf), $x0, $x1, $y0, $y1)

  function IsButtonPixel($c) {
    # 흰 카드·파란 글자·별
    if ($c.R -gt 200 -and $c.G -gt 210 -and $c.B -gt 220) { return $true }
    if ($c.B -gt $c.R + 20 -and $c.B -gt 150 -and $c.R -lt 200) { return $true }
    if ($c.R -gt 180 -and $c.G -gt 200 -and $c.B -gt 230) { return $true }
    return $false
  }

  function SampleGrass($bx, $by) {
    # 위·왼쪽 잔디 샘플
    foreach ($dy in @(-20, -30, -12, 20, 30)) {
      foreach ($dx in @(-25, 25, -40, 40, 0)) {
        $sx = [Math]::Max(0, [Math]::Min($W - 1, $bx + $dx))
        $sy = [Math]::Max(0, [Math]::Min($H - 1, $by + $dy))
        if ($sx -ge $x0 -and $sx -le $x1 -and $sy -ge $y0 -and $sy -le $y1) { continue }
        $c = $bmp.GetPixel($sx, $sy)
        if (-not (IsButtonPixel $c)) { return $c }
      }
    }
    return [Drawing.Color]::FromArgb(173, 232, 219)
  }

  $n = 0
  for ($y = $y0; $y -le $y1; $y++) {
    for ($x = $x0; $x -le $x1; $x++) {
      $c = $bmp.GetPixel($x, $y)
      if (-not (IsButtonPixel $c)) { continue }
      $g = SampleGrass $x $y
      # 가장자리 살짝 블렌드
      $edge = [Math]::Min(
        [Math]::Min($x - $x0, $x1 - $x),
        [Math]::Min($y - $y0, $y1 - $y)
      )
      if ($edge -lt 3) {
        $t = $edge / 3.0
        $r = [int]($c.R * (1 - $t) + $g.R * $t)
        $gg = [int]($c.G * (1 - $t) + $g.G * $t)
        $b = [int]($c.B * (1 - $t) + $g.B * $t)
        $bmp.SetPixel($x, $y, [Drawing.Color]::FromArgb($r, $gg, $b))
      } else {
        $bmp.SetPixel($x, $y, $g)
      }
      $n++
    }
  }
  Write-Output "  painted $n px"
  SaveSvgPng $path $pack.svg $bmp
  $bmp.Dispose()
}

ErasePraise 'public\assets\main-home-full-map.svg'
ErasePraise 'public\assets\main-home-full-map-cleared.svg'
Write-Output 'done'
