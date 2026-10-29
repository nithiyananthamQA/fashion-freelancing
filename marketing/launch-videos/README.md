# Launch reels

Two 30-second Instagram Reels (1080×1920, 30 fps, H.264, silent AAC track).

| File | Story |
|---|---|
| `fashion-freelancing-services-reel.mp4` | We do it for you: logo build → "Everything your fashion business needs, under one team" → all ten services with real work → three-step process → **Start a project** |
| `fashion-freelancing-network-reel.mp4` | The specialist network: "Need a specialist?" → two ways in → a brand finds, views and requests to hire a specialist, or posts a project and gets matched → a freelancer joins in the seven real application steps, gets approved, receives a matched invitation → **Find a specialist / Join as a freelancer** |

The specialists and the freelancer shown are invented for the demo (no real accounts).
Images are the site's own work samples from `public-html/assets/img`.

The reels have no music. Add a track in Instagram's audio picker when posting.
Keep text inside the frame: the important content sits between y≈260 and y≈1570, clear of the Reels UI.

## Editing and re-rendering

`source/services.html` and `source/network.html` are the reels. Each one builds a single paused GSAP timeline,
and `render.mjs` steps it frame by frame, so every export comes out the same.

```bash
cd marketing/launch-videos/source
npm install                     # puppeteer-core; uses /usr/bin/google-chrome
# needs an ffmpeg with libx264 on PATH, or FFMPEG=/path/to/ffmpeg
npm run services                # → ../fashion-freelancing-services-reel.mp4  (~4 min)
npm run network                 # → ../fashion-freelancing-network-reel.mp4

node render.mjs network.html --sheet ../preview/sheet.png          # one frame every 2 s, tiled
node render.mjs network.html --sheet ../preview/sheet.png 8,12.5   # chosen moments
```

You can open either page in Chrome with `?play` to watch it live, or with `?t=12.5` to freeze one moment.
Chrome needs `--allow-file-access-from-files` for the fonts and images to load from disk.
