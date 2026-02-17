# Papa N Toots

Local catering & handcrafted foods — Kea'au, Hawai'i Island.

## Deploy

Push to GitHub, import into Vercel. Static site, no build step.

## Setup

- **Form**: Replace `YOUR_FORM_ID` in `index.html` with a [Formspree](https://formspree.io) form ID. Until then, form falls back to mailto.
- **Hero image**: `hero-bg.webp` is a placeholder. Replace with an actual Big Island landscape photo — ranch land, pasture, ocean view from mauka. The CSS overlay is heavy so the image is subtle texture, not the focal point.
- **Logo**: Replace `logo.jpg` with higher-res version when available.
- **Domain**: Update canonical URL and OG tags once final domain is set.

## Structure

```
├── index.html       # Full site (HTML + CSS + JS)
├── logo.jpg         # Brand logo
├── hero-bg.webp     # Hero background (replace with real photo)
├── vercel.json      # Deploy config
└── README.md
```

## Local Dev

```bash
npx serve .
```
