# Papa N Toots

Local catering & handcrafted foods — Kea'au, Hawai'i Island.

## Deploy

Push to GitHub, import into Vercel. Static site, no build step.

## Setup

- **Forms**: The catering order builder, the Pastelle Sausage batch reservation, and the laulau waitlist all post to a Google Sheet via Apps Script. Follow [`SETUP-GOOGLE-SHEETS.md`](SETUP-GOOGLE-SHEETS.md) and paste your deployed Web App URL into `GOOGLE_SHEET_URL` in `index.html`. Until then, the forms fall back to a pre-filled email so nothing is lost.
- **Sausage batch dates**: Edit the `SAUSAGE_BATCHES` array near the bottom of the `<script>` in `index.html`. Each entry is `{ label: 'Sat, Jun 14 · Keaʻau pickup', status: 'open' }`. Set `status: 'soldout'` to grey one out, or remove past dates after each run. A "notify me of future batches" option is added automatically (and becomes the default when no batches are open).
- **Hero image**: `hero-bg.webp` is a placeholder. Replace with an actual Big Island landscape photo — ranch land, pasture, ocean view from mauka. The CSS overlay is heavy so the image is subtle texture, not the focal point.
- **Logo**: Replace `logo.jpg` with higher-res version when available.
- **Domain**: Update canonical URL and OG tags once final domain is set.

## Structure

```
├── index.html              # Full site (HTML + CSS + JS)
├── google-apps-script.js   # Paste into Apps Script to capture form leads
├── SETUP-GOOGLE-SHEETS.md  # 10-min form-wiring guide
├── logo.jpg                # Brand logo
├── hero-bg.webp            # Hero background (replace with real photo)
├── vercel.json             # Deploy config
└── README.md
```

## Local Dev

```bash
npx serve .
```
