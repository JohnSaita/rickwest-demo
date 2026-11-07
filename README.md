# Rickwest Projects Map (concept demo)

A pitch demo for Rickwest Realty: every current project on one interactive map, with nearby schools, hospitals and shops, live drive times to Westlands, the CBD and JKIA, and a WhatsApp button on each project.

Built with React, TypeScript, Vite and Mapbox GL JS (react-map-gl), the same setup as `geo-intelligence-lab-starter`.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:5173. The `.env` file holds `VITE_MAPBOX_TOKEN` (your public `pk.` token). It is git-ignored.

## What it does

| Feature | Source |
| --- | --- |
| Project pins, prices, units, photos | `src/data/projects.ts`, copied from rickwestrealty.co.ke listings (7 Nov 2026) |
| Drive times to Westlands, CBD, JKIA | Mapbox Directions API, `driving-traffic` profile (live traffic) |
| 10 / 20 / 30 min drive areas | Mapbox Isochrone API |
| Schools, hospitals, malls within 2 km | OpenStreetMap via the Overpass API, cached in the browser for a week |
| WhatsApp button | `wa.me/254789305431` (the number on Rickwest's site), message pre-filled with the project name |

## Before you send the link

- **Check every pin.** Pins marked "Approximate location" were placed from the neighbourhood name only. Hephe Palace (opposite The Oval) and the JKIA apartments (opposite Hilton Garden Inn) were placed from landmarks. Search each one on Google Maps and move the coordinates in `src/data/projects.ts` if needed.
- **Check the photos load.** They are hot-linked from Rickwest's site. If one is blocked, the card shows initials instead.
- **Add your Mapbox URL restriction.** In your Mapbox account, restrict the token to `johnsaita.github.io` and `localhost`.

## Deploy to GitHub Pages

1. Create a new public repo on GitHub named `rickwest-demo` and push this folder:
   ```bash
   git init
   git add .
   git commit -m "Rickwest projects map concept"
   git branch -M main
   git remote add origin https://github.com/JohnSaita/rickwest-demo.git
   git push -u origin main
   ```
2. In the repo: **Settings > Secrets and variables > Actions > New repository secret**, name `VITE_MAPBOX_TOKEN`, value your `pk.` token.
3. **Settings > Pages > Source: GitHub Actions.**
4. The workflow in `.github/workflows/deploy.yml` builds and publishes on each push. The site appears at https://johnsaita.github.io/rickwest-demo/.

## Demo script (60–90 s Loom)

1. Open on the full map: "Every Rickwest project, on one page."
2. Click **Westlands**, then **Hephe Palace**: price, completion, units.
3. Point at **Drive times now**: live minutes to Westlands, the CBD and JKIA.
4. Show **Within 2 km**: nearest hospital and school, dots on the map.
5. Tick **Show areas within 10 / 20 / 30 min drive**.
6. Tap **Chat on WhatsApp**: "the enquiry lands straight with your sales team."
7. Switch to **Satellite**, then filter by budget: "a diaspora buyer can shortlist from their phone."
