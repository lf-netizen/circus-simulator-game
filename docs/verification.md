# Single-location demo verification

Verified September 8, 2026 using Playwright MCP against Vite and the static production build. `pnpm test`: **39 tests pass**. `pnpm build`: TypeScript and production bundling pass.

## Browser checks

- Bought the starter blueprint for exactly 8,070 zł: seven buildings, five hired and assigned crew, two trailers, connected utilities, and a valid noon performance.
- Booked a second performance, purchased posters, opened the gates, ran the clock at 6×, resolved the equipment incident, and completed the day.
- First tested day: 123 admissions across two shows, 2,952 zł ticket income, 282 zł concessions, 495 zł wages, 281 zł maintenance/rent, 180 zł repair, and 2,278 zł operating profit. Capital and marketing purchases were paid separately.
- Advanced to tomorrow; manually placed a second tent and generator through the isometric map, recruited and assigned a second technician, and scheduled both tents. Overlapping performer bookings were blocked; a later performance was accepted.
- Completed that expanded day: 217 admissions, two shows, 5,208 zł tickets, 497 zł concessions, 575 zł wages, 381 zł rent/maintenance, and 4,749 zł operating profit. Closing consumed 8 L fuel and 28 L water. The free incident response reduced the first show's rating.
- Attempting to build over an existing tent preserved cash and buildings. Cutting the entrance path removed access and prevented opening; restoring the path restored operation. Clicking a building's artwork selected its inspector.
- Drag-painted three continuous new path tiles for 45 zł without advancing the planning clock.
- Exported a site, generated a different empty site, and imported the downloaded file. Restored state matched exactly. Invalid nested JSON was rejected without changing progress.
- Reloaded an active day: exact state preserved and the clock returned paused. The same check passed against the production build with 20 visible guest groups on connected paths.
- Checked all four views at 390 × 844; document width remained 390 px. The isometric map scrolls within its own viewport.
- Inspected desktop and mobile screenshots. No production browser console warnings or errors.

## Simulation regressions

Tests cover seeded terrain, safe build space, footprints and rotation, collisions, clearing costs, protected entry paths, disconnected sites, limited electricity, fuel/water requirements, crew roles, housing capacity, training, programme overlaps and duration, aerial restrictions, pending booking protection, fractional-price rejection, clock-driven shows, incidents, revenue settlement, daily wages, supply use, overnight recovery and noise, concession staffing, marketing, price effects, finite shared audience, technician skill/fatigue, bankruptcy, milestone progression, nested save corruption, portable live saves, and unavailable browser storage.

## Screenshots

- [Constructed site on desktop](screenshots/site-desktop.png)
- [Mobile map](screenshots/site-mobile.png)
- [Daily programme and forecast](screenshots/schedule-desktop.png)
- [Operating grounds with visitor groups](screenshots/site-live.png)

The slice deliberately uses aggregate visitor groups, a fixed recruitment roster, and one scripted equipment incident. These are demo scope limits. Touring, rivals, world-map travel, and seasons are absent.
