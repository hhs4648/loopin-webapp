$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$svgPath = Join-Path $PSScriptRoot '..\public\assets\main-home-academy-map.svg' | Resolve-Path
$raw = [IO.File]::ReadAllText($svgPath)
Write-Output ("star leftover={0}" -f ([regex]::Matches($raw, 'M184 299.102')).Count)
Write-Output ("lock184={0}" -f ([regex]::Matches($raw, 'M184 324C192.284')).Count)
Write-Output ("E8453C leftover={0}" -f ([regex]::Matches($raw, '#E8453C')).Count)

# Render isn't available; crop embedded PNG won't show vector lock.
# Instead open via browser later. Save a tiny HTML crop check using object.

$outDir = Join-Path $PSScriptRoot '..\tmp-castle-align' | Resolve-Path
$html = @"
<!doctype html>
<html><body style="margin:0;background:#222">
<div style="width:360px;height:200px;overflow:hidden;border:2px solid #fff;margin:12px">
<img src="/assets/main-home-academy-map.svg?v=17" style="position:absolute;left:0;top:-250px;width:360px" />
</div>
<p style="color:#fff;font:14px sans-serif;margin:12px">castle1 marker zone (y~250-450)</p>
</body></html>
"@
[IO.File]::WriteAllText((Join-Path $outDir 'check-lock.html'), $html)
Write-Output 'ok'
