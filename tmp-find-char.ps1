Get-ChildItem 'public/assets' | ForEach-Object {
  $n = $_.Name
  if ($n -match '시작|캐릭|character|curriculum-start|cheer|wave|mascot') {
    Write-Output ($n + ' | ' + $_.Length)
  }
}
