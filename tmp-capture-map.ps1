# Decodes latest CDP full-map screenshot if present; otherwise just lists browser-logs
$logs = Get-ChildItem 'C:\Users\user\.cursor\browser-logs\cdp-response-Page.captureScreenshot-*.json' |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 5
foreach ($l in $logs) {
  Write-Output ("{0}  {1}" -f $l.LastWriteTime.ToString('HH:mm:ss'), $l.Name)
}
