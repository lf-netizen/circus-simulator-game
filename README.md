# The Grand Tour · A Circus Story

A playable, illustrated circus management demo based on [the original design](docs/design.md). Build a little touring circus, find an audience across Poland, and make your next show better than the last.

## Run locally

Requires Node.js 22+ and pnpm 10.

```sh
pnpm install
pnpm dev
```

Open the URL printed by Vite (normally http://localhost:5173).

```sh
pnpm build     # TypeScript check and static production build
pnpm preview   # Serve the production build locally
pnpm test      # Simulation and save validation tests
```

## GitHub Pages

Live site: https://lf-netizen.github.io/circus-simulator-game/

Every push to `main` runs the tests, builds the app, and deploys `dist/` through `.github/workflows/deploy.yml`. The repository uses **Settings → Pages → Source: GitHub Actions**. No deployment token or additional repository secret is required.

For future updates:

```sh
git add .
git commit -m "Describe your changes"
git push
```

`main` tracks `origin/main`, and `origin` uses `git@github.com:lf-netizen/circus-simulator-game.git`. Deployment progress appears in the repository’s Actions tab.

## Other static hosts

Deploy the contents of `dist/` to any static host: GitHub Pages, Cloudflare Pages, Netlify, Vercel, or a simple web server. Build command: `pnpm build`. Output directory: `dist`. Vite uses relative asset paths, so hosting under a subdirectory works. No backend, secrets, database, account, or environment variables are needed. Navigation is in-app and does not require server routing rules.

React 19, TypeScript, Vite, Tailwind CSS 4, Lucide, Vitest, and pnpm. Illustrations are editable SVG and fonts are bundled locally; there are no runtime requests to third-party services.

## Play the demo

1. **Set up camp** in Kraków. Arrange the big top, wagon, generator, and optional popcorn cart. Noisy living quarters hurt show quality; a popcorn stall near the entrance earns more.
2. **Prepare your troupe.** Train performers, buy costumes, or recruit an illusionist and a tightrope artist. Training costs time and energy; overnight rest restores energy and charges upkeep.
3. **Promote the show.** Set a 15–70 zł ticket price and buy local poster, radio, or social campaigns. Each channel allows three campaign purchases per stop. Weather, price, reputation, and repeat visits affect demand.
4. **Plan and run the performance.** Reorder acts, add an interval, and build a 90–210 minute show. Act order and performer readiness affect audience ratings. Advance each act and choose how to handle the evening’s mishap.
5. **Collect the takings and travel.** Show results account for tickets, concessions, wages, and operating expenses. Buy fuel and water, plan your next stop, and move to another of eight Polish cities.

Six performances complete a season. Reputation carries forward. Your audience-weighted career rating and total tickets are compared against clearly identified rival benchmarks. Running out of money ends the game; you can start over or restore an export.

Time advances only through actions. Planning is free. Actions that cross 23:00 pause for overnight rest; performances must finish by closing.

## Saves

Progress is automatically stored in this browser’s `localStorage` after each change. **Saves & settings → Export save** downloads a versioned JSON file; **Import save** restores it, including an in-progress show. Import validates nested state before replacing progress. Invalid files leave your adventure intact. Export before clearing browser data or switching devices. If storage is unavailable, play continues in memory and the sidebar asks you to export.

## Demo scope

This is a focused vertical slice of the larger design, with a starting troupe and equipment so the loop is immediately playable. Economics and travel are intentionally compact: wages are paid per show, cities have one pitch and fixed weather, rivals are benchmark scores, and three scripted show surprises rotate across performances. Detailed scouting, animals, vehicle logistics, dynamic rival routes, negotiated recruitment, multiyear leaderboards, and the full segment/performer constraints are future expansion work.

## Project structure

- `src/game/` — data, pure simulation reducer, save validation, and regression tests.
- `src/components/` — custom SVG circus environment and route map.
- `src/views/` — overview, troupe, grounds, performance, and management screens.
- `src/App.tsx` — navigation, autosave, settings, and show results.
- `src/styles.css` — responsive visual system with Tailwind integration.

See [verification notes](docs/verification.md) for browser checks and screenshots.
