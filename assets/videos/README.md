Place hero video files here so the site serves them locally.

Expected filenames (used by the site):

- 15252518_1920_1080_50fps.mp4
- 14278721_1440_2560_30fps.mp4
- 20670148-hd_1920_1080_30fps.mp4

How to download using the provided PowerShell script (from project root):

```powershell
powershell -ExecutionPolicy Bypass -File assets\scripts\download-videos.ps1
```

If the script fails, download the MP4s manually from Pexels (open the page, right-click the video, choose download) and save them into this folder with the exact filenames above.