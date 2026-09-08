# The Grand Tour · Riverside Meadow

A playable circus management slice on one procedural, isometric site. Build paths and facilities, recruit a crew, schedule performances in multiple tents, and operate a profitable day. Touring, world maps, rivals, and seasons have been removed from this demo.

[Play on GitHub Pages](https://lf-netizen.github.io/circus-simulator-game/)

## Run locally

Requires Node.js 22+ and pnpm 10.

```sh
pnpm install
pnpm dev
pnpm test      # Simulation and save validation tests
pnpm build     # TypeScript check and static production build
pnpm preview   # Serve the production build locally
```

## GitHub Pages

Site: https://lf-netizen.github.io/circus-simulator-game/

The app is built **locally** and the generated files are pushed over SSH to `gh-pages`. Source code stays on `main`. The deployment script preserves branch history and never force-pushes or switches your working branch.

To update the source and publish:

```sh
git add .
git commit -m "Describe your changes"
git push
pnpm run deploy
```

`pnpm run deploy` runs the tests, builds `dist/`, then publishes it to `origin/gh-pages` with `.nojekyll`. It uses your existing Git/SSH credentials; no GitHub CLI login, access token, or deployment secret is required to push the build.

GitHub Pages must serve **Deploy from a branch → gh-pages → /(root)** in the repository's Pages settings. The GitHub Actions workflow only checks source changes; publishing is controlled by `pnpm run deploy`.

`main` tracks `origin/main`. Remote: `git@github.com:lf-netizen/circus-simulator-game.git`.

## Other static hosts

Deploy the contents of `dist/` to any static host: GitHub Pages, Cloudflare Pages, Netlify, Vercel, or a simple web server. Build command: `pnpm build`. Output directory: `dist`. Vite uses relative asset paths, so hosting under a subdirectory works. No backend, secrets, database, account, or environment variables are needed. Navigation is in-app and does not require server routing rules.

React 19, TypeScript, Vite, Tailwind CSS 4, Lucide, Vitest, and pnpm. Illustrations are editable SVG and fonts are bundled locally; there are no runtime requests to third-party services.

## Play the slice

1. **Build your grounds.** Begin with 22,000 zł and an empty 20 × 20 meadow. Buy tents, generators, water, trailers, guest services, and scenery. Lay entrance-connected paths; clear trees and rocks to expand. Buildings have real footprints, rotation, collision checks, maintenance costs, and demolition refunds. Map overlays show access and utilities.
2. **Recruit and assign.** Performers provide distinct acts. Assign a technician to each tent, vendors to attractions and concessions, and beds to your crew. Training improves skill but spends cash and energy. Quiet, serviced trailers restore more energy overnight.
3. **Write the daily programme.** Choose a tent, day, time, ticket price, and 60–120 minute running order. Performer and tent conflicts are blocked. Big tops support aerial acts. Order, fatigue, ticket price, weather, services, and local posters affect the forecast. All tents share a finite daily audience.
4. **Open the gates.** Construction pauses while the day runs from 09:00 to 22:00. Pause and choose 1×, 3×, or 6× speed. Shows begin on schedule, groups of guests walk the actual path network, concessions earn money, and an equipment incident needs your decision.
5. **Review and improve.** Tickets settle after each show. Closing charges wages and maintenance, consumes stock, and reports operating profit. Prepare tomorrow to rest the crew, replenish supplies, book more shows, and reinvest.

For a quick start, **Build starter camp** purchases a working layout, five crew, and a noon show for 8,070 zł. It uses the same construction, recruitment, and scheduling rules as manual play. Add a second performance later in the day or expand with another tent and technician.

The local milestone is 300 admissions, six completed shows, and 60 reputation while solvent. Continue building after reaching it. Running out of money ends the attempt; restart the seed or import a backup.

## Saves

Changes automatically save to browser `localStorage`. **Saves and settings → Export site** downloads portable JSON; **Import site** restores it with the clock paused. Imports validate terrain, building footprints, crew assignments, programmes, finances, and live simulation state. Invalid files leave progress intact. If browser storage is unavailable, play continues in memory and the interface asks you to export.

This slice uses save version 2 and the separate `grand-tour-site-v2` storage key. Existing touring-demo saves are left untouched; they cannot be imported into this location slice.

## Scope and structure

This is a focused management demo, not a full individual-guest simulation. Animated walkers represent visitor groups; food, comfort, and attendance use aggregate rules. The equipment incident is scripted. Recruitment uses a fixed roster, while terrain and weather are seeded. See [the implemented rules](docs/single-location.md) and [verification notes](docs/verification.md).

- `src/site/spatial.ts` — seeded terrain, footprints, pathfinding, utilities, and building bonuses.
- `src/site/engine.ts` — simulation reducer, forecasts, scheduling, and economy.
- `src/site/persistence.ts` — versioned save validation and browser storage.
- `src/site/IsoMap.tsx` — interactive SVG map and animated visitors.
- `src/site/*View.tsx` — construction, crew, schedule, and cashbook interfaces.
- `src/site/SiteApp.tsx` — application shell, time controls, autosave, and reports.
- `src/site/engine.test.ts` — simulation and save regression tests.

The [original broader design](docs/design.md) remains as reference; it does not describe the current demo's scope.
