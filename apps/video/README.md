# CaseWin AI Video Assets

This folder contains Remotion video components for marketing CaseWin AI.

## Videos Available

| Composition | Duration | Resolution | Description |
|-------------|----------|------------|-------------|
| `PromoVideo` | 60s | 1920x1080 | Main promotional video |
| `ExplainerVideo` | 90s | 1920x1080 | How prediction markets work |
| `SocialAd` | 15s | 1080x1080 | Instagram/TikTok square ad |
| `TwitterAd` | 15s | 1200x675 | Twitter/X optimized ad |

## Setup

```bash
cd apps/video
npm install
```

## Preview Videos

Start Remotion Studio to preview and edit videos:

```bash
npm start
```

This opens a browser at http://localhost:3000 where you can preview all compositions.

## Render Videos

Render individual videos:

```bash
# Render promo video
npm run render:promo

# Render explainer video
npm run render:explainer

# Render social ad
npm run render:social

# Render all videos
npm run render:all
```

## Output

Rendered videos are saved to the `out/` folder:
- `out/PromoVideo.mp4` (60s, 1920x1080)
- `out/ExplainerVideo.mp4` (90s, 1920x1080)
- `out/SocialAd.mp4` (15s, 1080x1080)
- `out/TwitterAd.mp4` (15s, 1200x675)

## Customization

Edit the source files in `src/`:
- `PromoVideo.tsx` - Main promo with all features
- `ExplainerVideo.tsx` - Step-by-step prediction market guide
- `SocialAd.tsx` - Fast-paced social media clips

## Requirements

- Node.js 18+
- FFmpeg (for rendering)

Install FFmpeg:
```bash
# Windows (via winget)
winget install FFmpeg

# Or download from https://ffmpeg.org/download.html
```
