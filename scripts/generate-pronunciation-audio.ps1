Add-Type -AssemblyName System.Speech

$audioDir = Join-Path $PSScriptRoot '..\public\assets\audio'
New-Item -ItemType Directory -Force -Path $audioDir | Out-Null

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 0

$selectedVoice = $null
foreach ($installed in $synth.GetInstalledVoices()) {
  $info = $installed.VoiceInfo
  Write-Output "VOICE: $($info.Name) ($($info.Culture.Name))"
  if (-not $selectedVoice -and $info.Name -like '*Zira*') {
    $selectedVoice = $info.Name
  }
}

if (-not $selectedVoice) {
  foreach ($installed in $synth.GetInstalledVoices()) {
    $info = $installed.VoiceInfo
    if ($info.Culture.Name -eq 'en-US') {
      $selectedVoice = $info.Name
      break
    }
  }
}

if ($selectedVoice) {
  $synth.SelectVoice($selectedVoice)
  Write-Output "SELECTED: $selectedVoice"
}

$items = [ordered]@{
  'various' = 'various'
  'wave' = 'wave'
  'run-errands' = 'run errands'
  'latest' = 'latest'
  'sentence-various' = 'We tried various foods at the festival.'
  'sentence-wave' = 'I wave to my friend every morning.'
  'sentence-run-errands' = 'I run errands for my mom on weekends.'
  'sentence-latest' = 'I bought the latest version of the game.'
}

foreach ($entry in $items.GetEnumerator()) {
  $path = Join-Path $audioDir ($entry.Key + '.wav')
  $synth.SetOutputToWaveFile($path)
  $synth.Speak($entry.Value)
  $synth.SetOutputToDefaultAudioDevice()
  Write-Output "WROTE: $path"
}
