# Demo verification

Verified with Playwright MCP against the running Vite app, September 8, 2026.

- Completed camp setup → poster campaign → running order → live performance → equipment repair → final act → show report → travel to Wrocław.
- First show sold 218 tickets, earned 4.3/5, and produced 6,600 zł show profit. Camp setup and campaign expenses were charged separately.
- Reload restored browser state exactly after travel.
- Exported JSON, advanced the game, then imported the export; restored state matched the original exactly.
- Imported malformed JSON; validation rejected it without replacing current state.
- Visited all eight screens at 390 × 844; no document horizontal overflow.
- Verified performer training, costumes, recruitment, supply purchases, and free grounds placement through browser controls.
- Production build and simulation/save regression tests pass.

Automated regression coverage includes complete management loops, live-show action locking, unaffordable actions, fatigue, resources, six-show seasons, layout effects, bankruptcy, nested save corruption, unavailable storage, live-save validation, and 23:00 clock boundaries.

The demo uses scripted rotating incidents and static competitor benchmarks. Those simplifications are intentional, not untested production systems.

The final static production build was also checked with Playwright MCP (`pnpm preview`): a second performance used the microphone incident and free improvisation, a live event survived a full reload, and a late-night start was correctly blocked until the troupe rested.

Screenshots:

- [Desktop overview](screenshots/overview-desktop.png)
- [Mobile overview](screenshots/overview-mobile.png)
- [Live show](screenshots/live-show-desktop.png)
