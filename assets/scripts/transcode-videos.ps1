# Transcode hero videos to web-optimized MP4s (H.264) with faststart for streaming
# Requires ffmpeg installed and accessible in PATH (https://ffmpeg.org/download.html)

$videos = @(
  @{ in = 'assets/videos/homepage.mp4'; out = 'assets/videos/homepage-720.mp4' },
  @{ in = 'assets/videos/dental.mp4'; out = 'assets/videos/dental-720.mp4' },
  @{ in = 'assets/videos/medical.mp4'; out = 'assets/videos/medical-720.mp4' }
)

foreach ($v in $videos) {
  if (-not (Test-Path $v.in)) {
    Write-Warning "Input not found: $($v.in)"
    continue
  }

  $cmd = "ffmpeg -y -i `"$($v.in)`" -c:v libx264 -preset medium -crf 23 -maxrate 3M -bufsize 6M -vf \"scale=-2:720\" -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 128k `"$($v.out)`""
  Write-Host "Running: $cmd"
  iex $cmd

  if (Test-Path $v.out) {
    Write-Host "Created: $($v.out)"
  } else {
    Write-Warning "Failed to create $($v.out)"
  }
}

Write-Host "Transcoding complete. Replace original files if satisfied (rename files manually or use Move-Item)."