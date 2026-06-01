# Download hero MP4s into assets/videos/
$videos = @(
  @{ url = 'https://videos.pexels.com/video-files/35972202/15252518_1920_1080_50fps.mp4'; out = 'assets/videos/15252518_1920_1080_50fps.mp4' },
  @{ url = 'https://videos.pexels.com/video-files/33590000/14278721_1440_2560_30fps.mp4'; out = 'assets/videos/14278721_1440_2560_30fps.mp4' },
  @{ url = 'https://videos.pexels.com/video-files/20670148/20670148-hd_1920_1080_30fps.mp4'; out = 'assets/videos/20670148-hd_1920_1080_30fps.mp4' }
)

# Create target folder
if (-not (Test-Path -Path 'assets/videos')) { New-Item -ItemType Directory -Path 'assets/videos' | Out-Null }

foreach ($v in $videos) {
  $out = $v.out
  Write-Host "Downloading $($v.url) -> $out"
  try {
    Invoke-WebRequest $v.url -OutFile $out -UseBasicParsing -ErrorAction Stop
    Write-Host "Saved: $out"
  } catch {
    Write-Warning "Failed to download $($v.url): $($_.Exception.Message)"
  }
}

Write-Host "Done. If downloads failed, check network/CORS or download via browser."