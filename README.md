# Neon Coast Cover Studio

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/Jo3st4r/gta6-cover-art-01-bot/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/Jo3st4r/gta6-cover-art-01-bot/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

**Drag 3 photos into a sun-bleached 9-panel grid and stamp the caption in neon — a Vice City sunset poster maker that runs fully offline.**

Neon Coast Cover Studio turns your own photos and a caption into multi-panel GTA-style poster cover art, exported as a PNG to share. It runs entirely in your desktop browser from static files: photos are read on your machine and never uploaded, and the app makes zero network requests.

## What it does

- **6 poster layouts** — 9-panel grid, 4-panel grid, Hero + 3, Tilted snapshots, Full bleed, and Hero + strip. Every layout is drawn live on canvas with white poster frames.
- **Up to 3 photos** — fill several panels with one photo or spread three photos across the panels. Click a panel in the preview to select it, drag it to reposition the photo, or use the zoom and pan sliders to crop each panel exactly.
- **5 sunset grades** — Sunset, Neon Nights, Palm Dusk, Midnight Drive, and Golden Hour. Each grade washes the panels with a sunset gradient, adds a neon title rule, and tints the title band.
- **Bold original lettering** — the title is set in Anton and the subtitle in a neon Pacifico script, both vendored under the SIL Open Font License (see `app/fonts/OFL.txt`). No Rockstar logo, artwork, character, or font is used anywhere.
- **Polish** — deterministic film grain, a vignette, and a title band that names the panel count, grade count, and export size.
- **3 export sizes, one click** — 1080 × 1080, 1080 × 1350, and 1920 × 1080 PNG, straight from the live preview.

## How to use it

1. Serve `app/` with any static server, e.g. `node serve.ts`, then open http://localhost:8080 (or open `app/index.html` directly).
2. Add up to 3 photos (or press **Use sample photos** to try it with the included samples).
3. Pick a layout and a grade, type your title and neon subtitle.
4. Click any panel to crop and position its photo.
5. Pick a size and press **Export PNG**.

## Try it

See the entry on make.fun: https://make.fun/bounty/gta6-cover-art-01

## Notes

- The two sample photos in `app/samples/` were made with an image model for make.fun and are free to use.
- Fonts: Anton (Copyright 2020 The Anton Project Authors) and Pacifico (Copyright 2018 The Pacifico Project Authors), both under the SIL Open Font License 1.1.
- License: MIT (see `LICENSE`).
