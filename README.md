# Daily Log

A personal health tracker — calorie estimation (no AI, just a formula), weight + body data trends, water intake. Runs entirely in your browser. No backend, no signup.

## What it does

- **Food tab** — log meals with category, portion, oiliness, sauciness, sweetness, cooking method, and extra protein. The formula estimates calories from those inputs. Optional photo per entry.
- **Weight tab** — daily weight, body fat %, waist, sleep, energy, exercise minutes, steps. Week/month/all-time trend chart.
- **Water tab** — quick-add buttons (150 / 250 / 500 / 750 ml) + custom amount, daily goal with progress bar, 7-day chart.
- **Export / Import** (↗ ↙ in header) — back up your data to a JSON file, restore it later, or move it between devices manually.

## File structure

```
/
├── index.html          ← entry point, contains HTML structure for all 3 tabs
├── css/
│   └── styles.css      ← all styling (one file, scoped by classes)
├── js/
│   ├── storage.js      ← localStorage wrapper + photo compression + import/export
│   ├── calories.js     ← the calorie formula (tweak numbers here)
│   ├── food-log.js     ← food tab logic
│   ├── weight.js       ← weight tab + chart
│   ├── water.js        ← water tab + chart
│   └── app.js          ← tab switching, modals, ties everything together
└── README.md
```

Only external dependency is **Chart.js** (loaded from a CDN, no install needed).

## How to deploy to GitHub Pages

1. **Create a repo on GitHub.** Name it anything — e.g. `daily-log`. Make it Public.
2. **Upload these files** (drag & drop in the GitHub web UI works fine, or `git push` if you prefer). Keep the folder structure intact.
3. **Enable Pages**: Repo → *Settings* → *Pages* → *Source* = "Deploy from a branch" → Branch = `main` (or `master`), folder = `/ (root)`. Save.
4. Wait ~30 seconds. Your app is now at `https://<your-username>.github.io/<repo-name>/`.
5. On your phone: open that URL in your browser → **Share** → **Add to Home Screen**. It now behaves like an app.

## About sync between phone and computer

Your data lives in your browser's `localStorage`, which means it's stored **per device per browser**. That is a real limitation — there's no automatic sync. Two ways to handle it:

### Option A: manual sync (built in)
Use the **export (↗)** and **import (↙)** buttons in the header. Export on your computer → email/cloud-drive the JSON file to yourself → import on your phone (or vice versa). When importing, you can choose **merge** (combines both) or **replace**.

This is fine if you mostly use one device and only sync occasionally.

### Option B: real auto-sync via Firebase (optional upgrade)
If manual sync gets annoying, you can switch to Firebase Firestore (free, auto-syncs across devices). The code is structured so you only need to replace `js/storage.js` — the rest of the app stays untouched. Setup is ~20 minutes:
1. Create a Firebase project at console.firebase.google.com
2. Enable Firestore + Anonymous Auth
3. Get your config keys
4. Swap `storage.js` for a Firebase version

Ask me to help with this if/when you decide you want it.

## Tweaking the calorie formula

Open `js/calories.js`. The `BASE` object has base kcal per food category. If your portions of, say, rice are bigger than mine, bump `rice: 220` up to `260` or whatever fits.

The formula:
```
cal = (base × portion + protein_bonus)
      × (1 + 0.08 × oil)
      × (1 + 0.05 × sauce)
      × (1 + 0.10 × sweet)
      × cooking_multiplier
```

Tweak any of those coefficients to taste. The values shown above are reasonable starting points.

## Notes on storage limits

- Each browser gives you roughly **5–10 MB** of localStorage. Photos are auto-compressed to ~50–150 KB each, so you can store hundreds of meals with photos before hitting the limit.
- If you ever do hit the limit, the app will warn you. Export your data, then delete some older photo-heavy entries.
- Clearing browser data / cache **will wipe your logs**. Export regularly as a backup.

## Browser support

Anything modern: Chrome, Safari, Firefox, Edge — desktop and mobile. The "Add to Home Screen" trick on iOS / Android gives you an app icon without needing an app store.
