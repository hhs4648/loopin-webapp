$ErrorActionPreference = 'Stop'
$bak = Join-Path $PSScriptRoot '..\public\assets\main-home-academy-map.before-extend.svg' | Resolve-Path
$raw = [IO.File]::ReadAllText($bak)

$old = @'
<g filter="url(#filter0_d_6022_868)">
<rect x="159" y="284" width="50" height="50" rx="25" fill="white" shape-rendering="crispEdges"/>
<rect x="163" y="288" width="42" height="42" rx="21" fill="#E8453C"/>
<path d="M184 299.102L186.9 305.702L194 306.402L188.7 311.202L190.2 318.202L184 314.602L177.8 318.202L179.3 311.202L174 306.402L181.1 305.702L184 299.102Z" fill="white"/>
</g>
'@

# Lock badge centered at (184, 309) — same geometry as other castles (ref center 287,454)
$new = @'
<!-- castle1 marker: lock (was star; completed icon TBD) -->
<path d="M184 324C192.284 324 199 317.284 199 309C199 300.716 192.284 294 184 294C175.716 294 169 300.716 169 309C169 317.284 175.716 324 184 324Z" fill="white"/>
<path d="M184.001 323.201C191.843 323.201 198.201 316.843 198.201 309.001C198.201 301.158 191.843 294.801 184.001 294.801C176.158 294.801 169.801 301.158 169.801 309.001C169.801 316.843 176.158 323.201 184.001 323.201Z" stroke="#E5E9EC" stroke-width="1.4"/>
<path d="M180 306.5V303.5C180 302.439 180.421 301.422 181.172 300.672C181.922 299.921 182.939 299.5 184 299.5C185.061 299.5 186.078 299.921 186.828 300.672C187.579 301.422 188 302.439 188 303.5V306.5" stroke="#5B6470" stroke-width="1.9"/>
<path d="M187.601 306.5H180.401C178.965 306.5 177.801 307.664 177.801 309.1V313.3C177.801 314.736 178.965 315.9 180.401 315.9H187.601C189.037 315.9 190.201 314.736 190.201 313.3V309.1C190.201 307.664 189.037 306.5 187.601 306.5Z" fill="#5B6470"/>
'@

if ($raw.IndexOf($old) -lt 0) {
  # try CRLF-normalized
  $old2 = $old -replace "`n", "`r`n"
  if ($raw.IndexOf($old2) -ge 0) { $old = $old2; $new = $new -replace "`n", "`r`n" }
  else {
    # fuzzy: find by unique star path
    $star = 'M184 299.102L186.9 305.702L194 306.402'
    $i = $raw.IndexOf($star)
    if ($i -lt 0) { throw 'star path not found' }
    $gStart = $raw.LastIndexOf('<g filter="url(#filter0_d_6022_868)">', $i)
    $gEnd = $raw.IndexOf('</g>', $i) + 4
    Write-Output "fuzzy replace gStart=$gStart gEnd=$gEnd"
    $raw = $raw.Remove($gStart, $gEnd - $gStart).Insert($gStart, $new)
    [IO.File]::WriteAllText($bak, $raw)
    Write-Output "wrote backup (fuzzy) bytes=$((Get-Item $bak).Length)"
    exit 0
  }
}

$raw2 = $raw.Replace($old, $new)
if ($raw2 -eq $raw) { throw 'replace failed' }
[IO.File]::WriteAllText($bak, $raw2)
Write-Output "wrote backup bytes=$((Get-Item $bak).Length)"
Write-Output "star remaining=$(([regex]::Matches($raw2, 'M184 299.102')).Count)"
Write-Output "lock at 184=$(([regex]::Matches($raw2, 'M184 324C192.284')).Count)"
