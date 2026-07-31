$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$sprite = [System.Drawing.Bitmap]::FromFile('C:\Users\user\.cursor\projects\loopin-webapp\public\assets\map-castle-red-flag.png')
Write-Output ("sprite {0}x{1}" -f $sprite.Width, $sprite.Height)

# Find transparent holes inside the lower third of the sprite (not edge padding)
$y0 = [int]($sprite.Height * 0.55)
$holes = 0
for ($y = $y0; $y -lt $sprite.Height; $y++) {
  $run = 0
  for ($x = 10; $x -lt ($sprite.Width - 10); $x++) {
    if ($sprite.GetPixel($x, $y).A -lt 40) {
      $run++
    } else {
      if ($run -ge 3) {
        Write-Output ("  hole y={0} run={1} near x~{2}" -f $y, $run, ($x - $run))
        $holes++
      }
      $run = 0
    }
  }
}
Write-Output ("internal hole rows flagged: {0}" -f $holes)

# Save alpha visualization of bottom half
$vis = New-Object System.Drawing.Bitmap($sprite.Width, $sprite.Height)
for ($y = 0; $y -lt $sprite.Height; $y++) {
  for ($x = 0; $x -lt $sprite.Width; $x++) {
    $a = $sprite.GetPixel($x, $y).A
    if ($a -lt 40) {
      $vis.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, 0, 255, 255)) # cyan = transparent
    } else {
      $vis.SetPixel($x, $y, $sprite.GetPixel($x, $y))
    }
  }
}
$big = New-Object System.Drawing.Bitmap($vis, ($vis.Width * 3), ($vis.Height * 3))
$big.Save('C:\Users\user\.cursor\projects\loopin-webapp\tools\sprite-alpha-vis.png', [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output 'saved sprite-alpha-vis.png'
$big.Dispose(); $vis.Dispose(); $sprite.Dispose()
