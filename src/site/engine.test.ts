import { describe, expect, it, vi } from "vitest";
import { BUILDINGS } from "./data";
import {
    bookingDuration,
    bookingProblems,
    forecastBooking,
    getDailyDemand,
    getOpeningProblems,
    reducer,
    STARTER_COST,
} from "./engine";
import { parseSiteSave, SAVE_KEY, saveSite, loadSite } from "./persistence";
import {
    canPlace,
    connectedPaths,
    createSite,
    findPath,
    getBuildingStatus,
    getStats,
} from "./spatial";
import type { Booking, SiteState } from "./types";
const starter = () => reducer(createSite(12345), { type: "STARTER_CAMP" });
const runDay = (initial: SiteState) => {
    let s = reducer(initial, { type: "OPEN_DAY" });
    expect(s.phase).toBe("running");
    for (let i = 0; i < 200 && s.phase === "running"; i++) {
        s = reducer(
            s,
            s.incident ? { type: "RESOLVE_INCIDENT", choice: "improvise" } : { type: "TICK" },
        );
    }
    expect(s.phase).toBe("closed");
    return s;
};
const bookingCopy = (b: Booking, changes: Partial<Booking> = {}) => ({
    ...b,
    ...changes,
    id: "candidate",
});
describe("procedural site and placement", () => {
    it("generates reproducible terrain with a safe, varied starting plot", () => {
        expect(createSite(42).tiles).toEqual(createSite(42).tiles);
        expect(createSite(43).tiles).not.toEqual(createSite(42).tiles);
        for (let seed = 1; seed <= 20; seed++) {
            const s = createSite(seed);
            expect(s.tiles).toHaveLength(400);
            expect(
                s.tiles
                    .filter((t) => t.x >= 4 && t.x <= 15 && t.y >= 6 && t.y <= 19)
                    .every((t) => t.terrain === "grass"),
            ).toBe(true);
            expect(new Set(s.tiles.map((t) => t.terrain)).size).toBe(4);
            expect(connectedPaths(s).size).toBe(5);
        }
    });
    it("enforces full footprints, blocked terrain, overlap, paths and rotation", () => {
        let s = createSite(1);
        expect(canPlace(s, "bigTop", 18, 18)).toMatch(/footprint/);
        expect(canPlace(s, "smallTent", 9, 15)).toMatch(/path/);
        const blocked = s.tiles.find((t) => t.terrain === "water")!;
        expect(canPlace(s, "flowers", blocked.x, blocked.y)).toMatch(/Clear/);
        s = reducer(s, { type: "BUILD", kind: "smallTent", x: 6, y: 9 });
        expect(canPlace(s, "flowers", 8, 11)).toMatch(/occupies/);
        expect(canPlace(s, "toilets", 19, 10, true)).toMatch(/footprint/);
        s = reducer(s, { type: "BULLDOZE", x: 19, y: 10 });
        s = reducer(s, { type: "BULLDOZE", x: 19, y: 11 });
        expect(canPlace(s, "toilets", 19, 10, false)).toBeNull();
    });
    it("charges clear costs and preserves the entry point", () => {
        let s = createSite(12);
        const tree = s.tiles.find((t) => t.terrain === "tree")!;
        s = reducer(s, { type: "BULLDOZE", x: tree.x, y: tree.y });
        expect(s.money).toBe(21960);
        expect(s.tiles[tree.y * 20 + tree.x].terrain).toBe("grass");
        s = reducer(s, { type: "BULLDOZE", x: 10, y: 19 });
        expect(s.paths).toContain("10,19");
    });
    it("isolated path fragments do not provide guest access or utility service", () => {
        let s = starter();
        expect(getBuildingStatus(s, s.buildings[0]).operational).toBe(true);
        s = reducer(s, { type: "BULLDOZE", x: 10, y: 18 });
        expect(getBuildingStatus(s, s.buildings[0]).connected).toBe(false);
        expect(findPath(s, s.buildings[0])).toEqual([]);
        expect(getOpeningProblems(s).join()).toMatch(/path/);
    });
});
describe("staffing and finite utilities", () => {
    it("buys the advertised fully functioning starter camp", () => {
        const s = starter();
        expect(s.money).toBe(22000 - STARTER_COST);
        expect(s.buildings).toHaveLength(7);
        expect(s.people.filter((p) => p.hired)).toHaveLength(5);
        expect(getStats(s).housed).toBe(5);
        expect(getStats(s).beds).toBe(8);
        expect(getOpeningProblems(s)).toEqual([]);
        expect(
            getBuildingStatus(
                s,
                s.buildings.find((b) => b.kind === "popcorn")!,
            ).operational,
        ).toBe(true);
        expect(reducer(s, { type: "STARTER_CAMP" }).money).toBe(s.money);
    });
    it("does not silently supply unlimited electricity", () => {
        let s = starter();
        for (let x = 11; x <= 14; x++) s = reducer(s, { type: "BULLDOZE", x, y: 5 });
        s = reducer(s, { type: "BUILD", kind: "bigTop", x: 11, y: 5 });
        s = reducer(s, { type: "BUILD", kind: "carousel", x: 7, y: 6 });
        s = reducer(s, { type: "PATH", x: 9, y: 6 });
        s = reducer(s, { type: "PATH", x: 9, y: 7 });
        expect(getStats(s).powerDemand).toBeGreaterThan(10);
        const demands = s.buildings.filter((b) => BUILDINGS.find((d) => d.kind === b.kind)!.power);
        const supplied = demands
            .filter((b) => getBuildingStatus(s, b).powered)
            .reduce((n, b) => n + BUILDINGS.find((d) => d.kind === b.kind)!.power!, 0);
        expect(supplied).toBeLessThanOrEqual(10);
        expect(demands.some((b) => !getBuildingStatus(s, b).powered)).toBe(true);
    });
    it("requires fuel, water and an assigned technician to run a tent", () => {
        const s = starter(),
            tent = s.buildings[0];
        expect(getBuildingStatus({ ...s, fuel: 0 }, tent).powered).toBe(false);
        expect(getBuildingStatus({ ...s, water: 0 }, tent).watered).toBe(false);
        const noTech = reducer(s, { type: "ASSIGN_WORK", id: "felix", buildingId: null });
        expect(getOpeningProblems(noTech).join()).toMatch(/technician/);
        expect(reducer(noTech, { type: "OPEN_DAY" }).phase).toBe("planning");
    });
    it("enforces job roles, unique workers, and four beds per home", () => {
        let s = starter();
        const firstHome = s.buildings.find((b) => b.kind === "trailer")!;
        s = reducer(s, { type: "ASSIGN_HOME", id: "bea", buildingId: firstHome.id });
        expect(s.people.find((p) => p.id === "bea")!.homeId).not.toBe(firstHome.id);
        s = reducer(s, { type: "ASSIGN_WORK", id: "mila", buildingId: s.buildings[0].id });
        expect(s.people.find((p) => p.id === "mila")!.assignmentId).toBeNull();
        s = reducer(s, { type: "HIRE", id: "leo" });
        s = reducer(s, { type: "ASSIGN_WORK", id: "leo", buildingId: s.buildings[0].id });
        expect(s.people.find((p) => p.id === "leo")!.assignmentId).toBeNull();
    });
    it("training costs cash and energy and improves predicted quality", () => {
        let s = starter();
        const rating = forecastBooking(s, s.bookings[0]).rating;
        const before = s.people.find((p) => p.id === "mila")!;
        s = reducer(s, { type: "TRAIN", id: "mila" });
        const after = s.people.find((p) => p.id === "mila")!;
        expect(after.skill).toBe(before.skill + 4);
        expect(after.energy).toBe(before.energy - 12);
        expect(s.money).toBe(22000 - STARTER_COST - 120);
        expect(forecastBooking(s, s.bookings[0]).rating).toBeGreaterThanOrEqual(rating);
    });
});
describe("daily programme and economy", () => {
    it("rejects tent/performer overlaps, wrong roles, aerials in small tents and invalid durations", () => {
        const s = starter(),
            b = s.bookings[0];
        expect(bookingDuration(b)).toBe(75);
        expect(bookingProblems(s, bookingCopy(b)).join()).toMatch(/already/);
        expect(bookingProblems(s, bookingCopy(b, { start: 900 }))).toEqual([]);
        expect(
            bookingProblems(
                s,
                bookingCopy(b, {
                    start: 900,
                    acts: [{ actId: "clown", personId: "otto" }, ...b.acts.slice(1)],
                }),
            ).join(),
        ).toMatch(/clown/);
        expect(
            bookingProblems(
                s,
                bookingCopy(b, {
                    start: 900,
                    acts: [...b.acts.slice(0, 2), { actId: "aerial", personId: "inez" }],
                }),
            ).join(),
        ).toMatch(/pavilion/);
        expect(
            bookingProblems(s, bookingCopy(b, { start: 900, acts: b.acts.slice(0, 2) })).join(),
        ).toMatch(/60/);
    });
    it("reserves future days and protects planned shows from demolition and dismissal", () => {
        let s = starter();
        s = reducer(s, { type: "BOOK", booking: { ...s.bookings[0], day: 2 } });
        expect(s.bookings).toHaveLength(2);
        const attempted = reducer(s, { type: "BULLDOZE", x: 6, y: 9 });
        expect(attempted.buildings).toHaveLength(7);
        expect(
            reducer(s, { type: "FIRE", id: "mila" }).people.find((p) => p.id === "mila")!.hired,
        ).toBe(true);
        s = reducer(s, { type: "CANCEL_BOOKING", id: s.bookings[0].id });
        expect(s.bookings[0].status).toBe("cancelled");
    });
    it("runs on the clock, animates guests, pauses incidents and settles only completed shows", () => {
        let s = reducer(starter(), { type: "OPEN_DAY" });
        const cash = s.money;
        while (s.minute < 720) s = reducer(s, { type: "TICK" });
        expect(s.bookings[0].status).toBe("running");
        expect(s.visitors.length).toBeGreaterThan(0);
        expect(s.money).toBe(cash);
        while (!s.incident) s = reducer(s, { type: "TICK" });
        expect(reducer(s, { type: "TICK" })).toBe(s);
        s = reducer(s, { type: "RESOLVE_INCIDENT", choice: "repair" });
        expect(s.money).toBe(cash - 180);
        while (s.minute < 795) s = reducer(s, { type: "TICK" });
        expect(s.bookings[0].status).toBe("completed");
        expect(s.today.shows).toBe(1);
        expect(s.today.concessionRevenue).toBeGreaterThan(0);
        expect(s.money).toBe(cash - 180 + s.today.ticketRevenue + s.today.concessionRevenue);
    });
    it("plays two full days with salaries, stock consumption, recovery and future booking survival", () => {
        let s = starter();
        s = reducer(s, { type: "BOOK", booking: { ...s.bookings[0], day: 2 } });
        const wages = getStats(s).dailyWages,
            water = s.water;
        s = runDay(s);
        expect(s.report!.wages).toBe(wages);
        expect(s.report!.profit).toBeGreaterThan(0);
        expect(s.fuel).toBe(28);
        expect(s.water).toBeLessThan(water);
        expect(s.bookings.find((b) => b.day === 2)!.status).toBe("scheduled");
        s = reducer(s, { type: "NEXT_DAY" });
        expect(s.day).toBe(2);
        expect(s.people.filter((p) => p.hired).every((p) => p.energy === 100)).toBe(true);
        s = runDay(s);
        expect(s.history).toHaveLength(2);
        expect(s.history.reduce((sum, r) => sum + r.guests, 0)).toBeGreaterThan(100);
        expect(s.money).toBeGreaterThan(22000 - STARTER_COST);
        expect(parseSiteSave(JSON.stringify(s))).toEqual(s);
    });
    it("concessions earn nothing without their assigned vendor", () => {
        let s = starter();
        s = reducer(s, { type: "ASSIGN_WORK", id: "bea", buildingId: null });
        s = runDay(s);
        expect(s.report!.concessionRevenue).toBe(0);
    });
    it("price, promotion and a nicer site change demand", () => {
        let s = starter();
        const b = s.bookings[0],
            baseline = forecastBooking(s, b);
        expect(forecastBooking(s, { ...b, price: 50 }).audience).toBeLessThan(baseline.audience);
        s = reducer(s, { type: "MARKET" });
        expect(forecastBooking(s, b).audience).toBeGreaterThan(baseline.audience);
    });
    it("housing and generator noise affect overnight recovery", () => {
        let s = runDay(starter());
        s.people.find((p) => p.id === "inez")!.energy = 40;
        s.people.find((p) => p.id === "mila")!.energy = 40;
        s.people.find((p) => p.id === "mila")!.homeId = null;
        s = reducer(s, { type: "NEXT_DAY" });
        expect(s.people.find((p) => p.id === "inez")!.energy).toBe(80);
        expect(s.people.find((p) => p.id === "mila")!.energy).toBe(55);
    });
});
describe("financial and recovery edge cases", () => {
    it("records repair spending in operating profit and allows closing the report", () => {
        let s = reducer(starter(), { type: "OPEN_DAY" });
        while (!s.incident) s = reducer(s, { type: "TICK" });
        s = reducer(s, { type: "RESOLVE_INCIDENT", choice: "repair" });
        while (s.phase === "running") s = reducer(s, { type: "TICK" });
        const r = s.report!;
        expect(r.repairs).toBe(180);
        expect(r.profit).toBe(r.ticketRevenue + r.concessionRevenue - r.wages - r.upkeep - 180);
        s = reducer(s, { type: "CLOSE_REPORT" });
        expect(s.report).toBeNull();
        expect(s.phase).toBe("closed");
        expect(parseSiteSave(JSON.stringify(s))).toEqual(s);
        expect(reducer(s, { type: "NEXT_DAY" }).day).toBe(2);
    });
    it("does not apply today’s poster campaign to tomorrow’s demand", () => {
        let s = starter();
        const b = { ...s.bookings[0], day: 2 },
            before = forecastBooking(s, b);
        s = reducer(s, { type: "MARKET" });
        expect(forecastBooking(s, b)).toEqual(before);
    });
    it("a working generator beside a home reduces overnight recovery", () => {
        let s = starter();
        s = reducer(s, { type: "BUILD", kind: "generator", x: 11, y: 16 });
        const home = s.buildings.find((b) => b.kind === "trailer")!;
        expect(getBuildingStatus(s, home).bonuses.join()).toMatch(/Noisy/);
        s = runDay(s);
        s.people.find((p) => p.id === "inez")!.energy = 40;
        s = reducer(s, { type: "NEXT_DAY" });
        expect(s.people.find((p) => p.id === "inez")!.energy).toBe(65);
    });
    it("cash exhaustion consistently ends play and import cannot bypass validation", () => {
        const s = { ...starter(), money: 60 };
        const spent = reducer(s, { type: "BUILD", kind: "flowers", x: 4, y: 13 });
        expect(spent.money).toBe(0);
        expect(spent.gameOver).toBe(true);
        expect(parseSiteSave(JSON.stringify(spent))).toEqual(spent);
        expect(reducer(spent, { type: "OPEN_DAY" }).phase).toBe("planning");
        const corrupt = { ...s, seed: Infinity };
        expect(reducer(s, { type: "IMPORT", state: corrupt }).seed).toBe(s.seed);
    });
});
describe("crew work and finite local audience", () => {
    it("technician training improves the show and support shifts cost energy at closing", () => {
        const s = starter(),
            tech = s.people.find((p) => p.id === "felix")!;
        tech.skill = 25;
        const baseline = forecastBooking(s, s.bookings[0]).rating;
        tech.skill = 90;
        expect(forecastBooking(s, s.bookings[0]).rating).toBeGreaterThan(baseline);
        const closed = runDay(s);
        expect(closed.people.find((p) => p.id === "felix")!.energy).toBe(88);
        expect(closed.people.find((p) => p.id === "bea")!.energy).toBe(92);
    });
    it("an unhoused support worker can recover enough to work the following morning", () => {
        let s = starter();
        s.people.find((p) => p.id === "felix")!.energy = 15;
        s.people.find((p) => p.id === "felix")!.homeId = null;
        s = runDay(s);
        expect(s.people.find((p) => p.id === "felix")!.energy).toBe(3);
        s = reducer(s, { type: "NEXT_DAY" });
        expect(s.people.find((p) => p.id === "felix")!.energy).toBe(18);
        expect(getBuildingStatus(s, s.buildings[0]).staffed).toBe(true);
    });
    it("simultaneous tents share a finite audience in proportion to demand", () => {
        let s = starter();
        s.reputation = 0;
        s.bookings[0].price = 10;
        for (let x = 11; x <= 14; x++) s = reducer(s, { type: "BULLDOZE", x, y: 5 });
        s = reducer(s, { type: "BUILD", kind: "bigTop", x: 11, y: 5 });
        const tent = s.buildings.find((b) => b.kind === "bigTop")!;
        for (const id of ["leo", "ada", "luca", "poppy"]) s = reducer(s, { type: "HIRE", id });
        s = reducer(s, { type: "ASSIGN_WORK", id: "leo", buildingId: tent.id });
        s = reducer(s, {
            type: "BOOK",
            booking: {
                tentId: tent.id,
                day: 1,
                start: 720,
                price: 10,
                acts: [
                    { actId: "clown", personId: "poppy" },
                    { actId: "magic", personId: "ada" },
                    { actId: "acrobatics", personId: "luca" },
                ],
            },
        });
        expect(s.bookings).toHaveLength(2);
        const forecasts = s.bookings.map((b) => forecastBooking(s, b));
        expect(forecasts[0].audience).toBeGreaterThan(0);
        expect(forecasts[1].audience).toBeGreaterThan(forecasts[0].audience);
        expect(forecasts.reduce((sum, b) => sum + b.audience, 0)).toBeLessThanOrEqual(
            getDailyDemand(s),
        );
        s = reducer(s, { type: "OPEN_DAY" });
        expect(s.phase).toBe("running");
        while (s.minute < 720) s = reducer(s, { type: "TICK" });
        expect(s.bookings.map((b) => b.audience)).toEqual(forecasts.map((b) => b.audience));
        expect(parseSiteSave(JSON.stringify(s))).toEqual(s);
    });
    it("later performances cannot conjure an unlimited daily crowd", () => {
        let s = starter();
        s.reputation = 0;
        for (const start of [840, 960, 1080])
            s = reducer(s, { type: "BOOK", booking: { ...s.bookings[0], start, price: 10 } });
        const forecast = s.bookings.map((b) => forecastBooking(s, b));
        expect(forecast.reduce((sum, b) => sum + b.audience, 0)).toBeLessThanOrEqual(
            getDailyDemand(s),
        );
        expect(forecast.at(-1)!.audience).toBeLessThan(forecast[0].audience);
    });
    it("a bankruptcy during an incident can be exported, imported and reset", () => {
        let s = reducer(starter(), { type: "OPEN_DAY" });
        while (!s.incident) s = reducer(s, { type: "TICK" });
        s.money = 180;
        s = reducer(s, { type: "RESOLVE_INCIDENT", choice: "repair" });
        expect(s.gameOver).toBe(true);
        expect(s.incident).toBeNull();
        expect(s.visitors.length).toBeGreaterThan(0);
        expect(parseSiteSave(JSON.stringify(s))).toEqual(s);
        const restored = reducer(createSite(7), { type: "IMPORT", state: s });
        expect(restored.gameOver).toBe(true);
        const fresh = reducer(restored, { type: "RESET", seed: 42 });
        expect(fresh.gameOver).toBe(false);
        expect(fresh.money).toBe(22000);
        expect(fresh.buildings).toHaveLength(0);
    });
    it("awards the milestone only after guests, shows, reputation and solvency are met", () => {
        let s = starter();
        s.reputation = 65;
        for (let day = 1; day <= 3; day++) {
            if (day > 1)
                s = reducer(s, { type: "BOOK", booking: { ...s.bookings[0], day, start: 720 } });
            s = reducer(s, { type: "BOOK", booking: { ...s.bookings[0], day, start: 900 } });
            s = runDay(s);
            if (day < 3) {
                expect(s.won).toBe(false);
                s = reducer(s, { type: "NEXT_DAY" });
            }
        }
        expect(s.history.reduce((sum, r) => sum + r.guests, 0)).toBeGreaterThanOrEqual(300);
        expect(s.history.reduce((sum, r) => sum + r.shows, 0)).toBe(6);
        expect(s.won).toBe(true);
        expect(reducer(s, { type: "NEXT_DAY" }).won).toBe(true);
    });
});
describe("portable, resilient saves", () => {
    it("rejects fractional ticket prices before booking or importing, preserving portable daily accounts", () => {
        const s = starter(),
            booking = { ...s.bookings[0], start: 900, price: 24.5 };
        expect(bookingProblems(s, booking).join()).toMatch(/whole number/);
        const rejected = reducer(s, { type: "BOOK", booking });
        expect(rejected.bookings).toHaveLength(1);
        expect(rejected.money).toBe(s.money);
        const imported = structuredClone(s);
        imported.bookings[0].price = 24.5;
        expect(() => parseSiteSave(JSON.stringify(imported))).toThrow();
        const valid = reducer(s, { type: "BOOK", booking: { ...booking, price: 25 } });
        expect(valid.bookings).toHaveLength(2);
        expect(parseSiteSave(JSON.stringify(valid))).toEqual(valid);
    });
    it("round-trips planning, a paused live incident, and the day report", () => {
        let s = starter();
        expect(parseSiteSave(JSON.stringify(s))).toEqual(s);
        s = reducer(s, { type: "OPEN_DAY" });
        while (!s.incident) s = reducer(s, { type: "TICK" });
        expect(parseSiteSave(JSON.stringify(s))).toEqual(s);
    });
    it.each([
        "terrain",
        "footprint",
        "path",
        "home",
        "worker",
        "act",
        "seed",
        "phase",
        "incident",
        "rating",
    ])("rejects corrupt nested %s data", (kind) => {
        const s = starter();
        switch (kind) {
            case "terrain":
                s.tiles[0].terrain = "lava" as never;
                break;
            case "footprint":
                s.buildings[0].x = 19;
                break;
            case "path":
                s.paths.push("99,99");
                break;
            case "home":
                s.people[0].homeId = "missing";
                break;
            case "worker":
                s.people[0].assignmentId = s.buildings[0].id;
                break;
            case "act":
                s.bookings[0].acts[0].personId = "otto";
                break;
            case "seed":
                s.seed = NaN;
                break;
            case "phase":
                s.phase = "closed";
                break;
            case "incident":
                s.incident = {
                    title: "Bad",
                    description: "Bad",
                    repairCost: 1,
                    bookingId: "missing",
                };
                break;
            case "rating":
                s.today.ratings = [99];
                break;
        }
        expect(() => parseSiteSave(JSON.stringify(s))).toThrow();
    });
    it("keeps the old save key intact and reports storage failure", () => {
        const storage = new Map<string, string>([["grand-tour-save", "old data"]]);
        vi.stubGlobal("localStorage", {
            getItem: (k: string) => storage.get(k) ?? null,
            setItem: (k: string, v: string) => storage.set(k, v),
        });
        const s = starter();
        expect(saveSite(s)).toBe(true);
        expect(storage.has(SAVE_KEY)).toBe(true);
        expect(storage.get("grand-tour-save")).toBe("old data");
        expect(loadSite()).toEqual(s);
        vi.stubGlobal("localStorage", {
            getItem: () => "{bad",
            setItem: () => {
                throw new Error("quota");
            },
        });
        expect(saveSite(s)).toBe(false);
        expect(loadSite().version).toBe(2);
        vi.unstubAllGlobals();
    });
});
