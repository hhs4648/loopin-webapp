param(
  [Parameter(Mandatory = $true)][string]$JsonPath,
  [Parameter(Mandatory = $true)][string]$OutPath
)
$j = Get-Content -Raw -LiteralPath $JsonPath | ConvertFrom-Json
[IO.File]::WriteAllBytes($OutPath, [Convert]::FromBase64String($j.data))
Write-Host "saved -> $OutPath"
