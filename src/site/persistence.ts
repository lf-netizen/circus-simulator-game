import { ACTS, BUILDINGS, CANDIDATES } from "./data";
import { createSite, footprint, tileKey } from "./spatial";
import type { SiteState } from "./types";
export const SAVE_KEY = "grand-tour-site-v2";
function invalid(): never {
    throw new Error("This is not a valid Riverside Meadow save (version 2).");
}
const object = (value: unknown): Record<string, unknown> => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return invalid();
    return value as Record<string, unknown>;
};
const array = (value: unknown, max = 10000): unknown[] => {
    if (!Array.isArray(value) || value.length > max) return invalid();
    return value;
};
const number = (v: unknown, min: number, max: number, integer = false): number => {
    if (
        typeof v !== "number" ||
        !Number.isFinite(v) ||
        v < min ||
        v > max ||
        (integer && !Number.isInteger(v))
    )
        return invalid();
    return v;
};
const string = (v: unknown, max = 300): string => {
    if (typeof v !== "string" || v.length > max) return invalid();
    return v;
};
const bool = (v: unknown) => {
    if (typeof v !== "boolean") invalid();
};
const choice = (v: unknown, choices: unknown[]) => {
    if (!choices.includes(v)) invalid();
};
function validateReport(value: unknown) {
    const r = object(value);
    number(r.day, 1, 100000, true);
    for (const field of [
        "guests",
        "ticketRevenue",
        "concessionRevenue",
        "wages",
        "upkeep",
        "fuelCost",
        "repairs",
        "shows",
    ])
        number(r[field], 0, 1e12, true);
    number(r.profit, -1e12, 1e12);
    if (
        r.profit !==
        (r.ticketRevenue as number) +
            (r.concessionRevenue as number) -
            (r.wages as number) -
            (r.upkeep as number) -
            (r.fuelCost as number) -
            (r.repairs as number)
    )
        invalid();
    number(r.rating, 0, 5);
    array(r.notes, 30).forEach((s) => string(s, 2000));
}
export function parseSiteSave(text: string): SiteState {
    if (text.length > 4_000_000) invalid();
    let raw: unknown;
    try {
        raw = JSON.parse(text);
    } catch {
        throw new Error("The save is not valid JSON.");
    }
    const s = object(raw);
    if (s.version !== 2)
        throw new Error(
            "Choose a Riverside Meadow version 2 save. Touring saves belong to the earlier demo.",
        );
    number(s.seed, 1, 2147483646, true);
    if (s.size !== 20) invalid();
    const entrance = object(s.entrance);
    if (entrance.x !== 10 || entrance.y !== 19) invalid();
    number(s.day, 1, 100000, true);
    number(s.minute, 480, 1320, true);
    if ((s.minute as number) % 5 !== 0) invalid();
    choice(s.phase, ["planning", "running", "closed"]);
    if (
        (s.phase === "planning" && s.minute !== 480) ||
        (s.phase === "closed" && s.minute !== 1320) ||
        (s.phase === "running" && (s.minute as number) < 540)
    )
        invalid();
    number(s.money, -1e8, 1e12);
    number(s.fuel, 0, 1000, true);
    number(s.water, 0, 1000, true);
    number(s.reputation, 0, 100);
    number(s.marketing, 0, 45, true);
    if ((s.marketing as number) % 15 !== 0) invalid();
    number(s.nextId, 1, 1e9, true);
    bool(s.won);
    bool(s.gameOver);
    if (s.gameOver !== (s.money as number) <= 0) invalid();
    const tiles = array(s.tiles, 400);
    if (tiles.length !== 400) invalid();
    tiles.forEach((value, i) => {
        const t = object(value);
        if (t.x !== i % 20 || t.y !== Math.floor(i / 20)) invalid();
        choice(t.terrain, ["grass", "tree", "rock", "water"]);
    });
    const paths = array(s.paths, 400).map((v) => string(v, 6)),
        pathSet = new Set(paths);
    if (paths.length !== pathSet.size || !pathSet.has("10,19")) invalid();
    for (const key of paths) {
        if (!/^\d{1,2},\d{1,2}$/.test(key)) invalid();
        const [x, y] = key.split(",").map(Number);
        if (
            x > 19 ||
            y > 19 ||
            key !== tileKey(x, y) ||
            object(tiles[y * 20 + x]).terrain !== "grass"
        )
            invalid();
    }
    const buildings = array(s.buildings, 400),
        buildingMap = new Map<string, Record<string, unknown>>(),
        occupied = new Set<string>();
    for (const value of buildings) {
        const b = object(value),
            id = string(b.id, 80);
        if (!/^building-\d+$/.test(id) || buildingMap.has(id)) invalid();
        if (Number(id.split("-")[1]) >= (s.nextId as number)) invalid();
        choice(
            b.kind,
            BUILDINGS.map((d) => d.kind),
        );
        number(b.x, 0, 19, true);
        number(b.y, 0, 19, true);
        bool(b.rotated);
        number(b.level, 1, 2, true);
        if (b.level === 2 && !["smallTent", "bigTop"].includes(b.kind as string)) invalid();
        string(b.name, 120);
        buildingMap.set(id, b);
        for (const tile of footprint(b as unknown as SiteState["buildings"][number])) {
            const key = tileKey(tile.x, tile.y);
            if (
                tile.x > 19 ||
                tile.y > 19 ||
                occupied.has(key) ||
                pathSet.has(key) ||
                object(tiles[tile.y * 20 + tile.x]).terrain !== "grass"
            )
                invalid();
            occupied.add(key);
        }
    }
    const people = array(s.people, 30),
        personMap = new Map<string, Record<string, unknown>>(),
        homes = new Map<string, number>(),
        jobs = new Set<string>();
    if (people.length !== CANDIDATES.length) invalid();
    for (const value of people) {
        const p = object(value),
            id = string(p.id, 80),
            candidate = CANDIDATES.find((c) => c.id === id);
        if (!candidate || personMap.has(id) || candidate.role !== p.role) invalid();
        personMap.set(id, p);
        string(p.name, 120);
        string(p.color, 30);
        if (!/^#[\da-fA-F]{6}$/.test(p.color as string)) invalid();
        for (const field of ["skill", "energy", "morale"]) number(p[field], 0, 100);
        if (p.wage !== candidate.wage || p.hireCost !== candidate.hireCost) invalid();
        bool(p.hired);
        for (const field of ["homeId", "assignmentId"])
            if (p[field] !== null) {
                const bid = string(p[field], 80),
                    b = buildingMap.get(bid);
                if (!p.hired || !b) invalid();
                if (field === "homeId") {
                    if (b.kind !== "trailer") invalid();
                    homes.set(bid, (homes.get(bid) ?? 0) + 1);
                    if (homes.get(bid)! > 4) invalid();
                } else {
                    const kinds =
                        p.role === "technician"
                            ? ["smallTent", "bigTop"]
                            : p.role === "vendor"
                              ? ["popcorn", "lemonade", "carousel"]
                              : [];
                    if (!kinds.includes(b.kind as string) || jobs.has(bid)) invalid();
                    jobs.add(bid);
                }
            }
    }
    const bookings = array(s.bookings, 10000),
        bookingMap = new Map<string, Record<string, unknown>>();
    for (const value of bookings) {
        const b = object(value),
            id = string(b.id, 80);
        if (
            !/^show-\d+$/.test(id) ||
            bookingMap.has(id) ||
            Number(id.split("-")[1]) >= (s.nextId as number)
        )
            invalid();
        bookingMap.set(id, b);
        const tentId = string(b.tentId, 80);
        if (!/^building-\d+$/.test(tentId)) invalid();
        number(b.day, 1, (s.day as number) + 6, true);
        number(b.start, 600, 1200, true);
        number(b.price, 10, 60, true);
        choice(b.status, ["scheduled", "running", "completed", "cancelled"]);
        const pending = b.status === "scheduled" || b.status === "running",
            tent = buildingMap.get(tentId);
        if (
            pending &&
            (!tent ||
                !["smallTent", "bigTop"].includes(tent.kind as string) ||
                (b.day as number) < (s.day as number))
        )
            invalid();
        if (
            b.status === "running" &&
            (s.phase !== "running" || b.day !== s.day || (b.start as number) > (s.minute as number))
        )
            invalid();
        if (b.status === "completed" && (b.day as number) > (s.day as number)) invalid();
        const acts = array(b.acts, 8);
        if (acts.length < 3) invalid();
        let duration = 0;
        const seen = new Set<string>();
        for (let i = 0; i < acts.length; i++) {
            const segment = object(acts[i]),
                act = ACTS.find((a) => a.id === segment.actId);
            if (!act || seen.has(act.id)) invalid();
            seen.add(act.id);
            duration += act.duration;
            if (act.role === "interval") {
                if (segment.personId !== null || i === 0 || i === acts.length - 1) invalid();
            } else {
                const p = personMap.get(string(segment.personId, 80));
                if (
                    !p ||
                    p.role !== act.role ||
                    (pending && !p.hired) ||
                    (pending && act.requiresBigTop && tent?.kind !== "bigTop")
                )
                    invalid();
            }
        }
        if (duration < 60 || duration > 120 || (b.start as number) + duration > 1320) invalid();
        number(b.audience, 0, 1000, true);
        number(b.rating, 0, 5);
        number(b.revenue, 0, 1e8);
        if (
            ["scheduled", "cancelled"].includes(b.status as string) &&
            (b.audience !== 0 || b.rating !== 0 || b.revenue !== 0)
        )
            invalid();
        if (
            ["completed", "running"].includes(b.status as string) &&
            b.revenue !== (b.audience as number) * (b.price as number)
        )
            invalid();
    }
    // A corrupt import cannot schedule a person or tent in two places simultaneously.
    const bookingsByDay = new Map<number, Record<string, unknown>[]>();
    for (const b of bookingMap.values()) {
        if (b.status === "cancelled") continue;
        const day = b.day as number;
        bookingsByDay.set(day, [...(bookingsByDay.get(day) ?? []), b]);
    }
    for (const activeBookings of bookingsByDay.values())
        for (let i = 0; i < activeBookings.length; i++)
            for (let j = i + 1; j < activeBookings.length; j++) {
                const a = activeBookings[i],
                    b = activeBookings[j];
                const duration = (v: Record<string, unknown>) =>
                    (v.acts as { actId: string }[]).reduce(
                        (sum, a) => sum + ACTS.find((d) => d.id === a.actId)!.duration,
                        0,
                    );
                if (
                    (a.start as number) < (b.start as number) + duration(b) &&
                    (b.start as number) < (a.start as number) + duration(a)
                ) {
                    const cast = new Set(
                        (a.acts as { personId: string | null }[])
                            .map((x) => x.personId)
                            .filter(Boolean),
                    );
                    if (
                        a.tentId === b.tentId ||
                        (b.acts as { personId: string | null }[]).some(
                            (x) => x.personId && cast.has(x.personId),
                        )
                    )
                        invalid();
                }
            }
    const visitors = array(s.visitors, 40),
        visitorIds = new Set<string>();
    for (const value of visitors) {
        const v = object(value),
            id = string(v.id, 80);
        if (
            visitorIds.has(id) ||
            !/^visitor-\d+$/.test(id) ||
            Number(id.split("-")[1]) >= (s.nextId as number)
        )
            invalid();
        visitorIds.add(id);
        if (!buildingMap.has(string(v.targetId, 80))) invalid();
        choice(v.mood, ["happy", "neutral", "unhappy"]);
        string(v.color, 30);
        if (!/^#[\da-fA-F]{6}$/.test(v.color as string)) invalid();
        const route = array(v.route, 400);
        if (!route.length) invalid();
        number(v.progress, -20, 408);
        for (let i = 0; i < route.length; i++) {
            const c = object(route[i]);
            number(c.x, 0, 19, true);
            number(c.y, 0, 19, true);
            if (!pathSet.has(tileKey(c.x as number, c.y as number))) invalid();
            if (i === 0 && (c.x !== 10 || c.y !== 19)) invalid();
            if (i) {
                const previous = object(route[i - 1]);
                if (
                    Math.abs((c.x as number) - (previous.x as number)) +
                        Math.abs((c.y as number) - (previous.y as number)) !==
                    1
                )
                    invalid();
            }
        }
    }
    if (s.phase !== "running" && visitors.length) invalid();
    for (const b of bookingMap.values()) {
        const duration = (b.acts as { actId: string }[]).reduce(
            (sum, a) => sum + ACTS.find((d) => d.id === a.actId)!.duration,
            0,
        );
        if (b.day === s.day) {
            if (
                b.status === "scheduled" &&
                (s.phase === "closed" ||
                    (s.phase === "running" && (b.start as number) <= (s.minute as number)))
            )
                invalid();
            if (
                b.status === "completed" &&
                (s.phase === "planning" || (b.start as number) + duration > (s.minute as number))
            )
                invalid();
            if (b.status === "running" && (b.start as number) + duration <= (s.minute as number))
                invalid();
        }
    }
    const today = object(s.today);
    for (const f of ["guests", "ticketRevenue", "concessionRevenue", "shows", "repairs"])
        number(today[f], 0, 1e12, true);
    array(today.ratings, 100).forEach((r) => number(r, 1, 5));
    bool(today.incidentUsed);
    if ((today.ratings as unknown[]).length !== today.shows) invalid();
    const finished = [...bookingMap.values()].filter(
        (b) => b.day === s.day && b.status === "completed",
    );
    if (
        today.shows !== finished.length ||
        today.guests !== finished.reduce((sum, b) => sum + (b.audience as number), 0) ||
        today.ticketRevenue !== finished.reduce((sum, b) => sum + (b.revenue as number), 0)
    )
        invalid();
    if (
        s.phase === "planning" &&
        (today.concessionRevenue !== 0 || today.incidentUsed || today.repairs !== 0)
    )
        invalid();
    if (s.incident !== null) {
        const incident = object(s.incident);
        string(incident.title, 200);
        string(incident.description, 2000);
        number(incident.repairCost, 0, 1e5, true);
        const b = bookingMap.get(string(incident.bookingId, 80));
        if (!b || b.status !== "running" || s.phase !== "running" || !today.incidentUsed) invalid();
    }
    const history = array(s.history, 100000);
    let previousDay = 0;
    for (const r of history) {
        validateReport(r);
        const day = object(r).day as number;
        if (
            day <= previousDay ||
            day > (s.day as number) ||
            (s.phase !== "closed" && day === s.day)
        )
            invalid();
        previousDay = day;
    }
    if (s.report !== null) {
        validateReport(s.report);
        if (
            s.phase !== "closed" ||
            object(s.report).day !== s.day ||
            !history.length ||
            JSON.stringify(s.report) !== JSON.stringify(history.at(-1))
        )
            invalid();
    }
    array(s.log, 40).forEach((line) => string(line, 4000));
    return structuredClone(s) as unknown as SiteState;
}
export function loadSite(): SiteState {
    try {
        const text = localStorage.getItem(SAVE_KEY);
        return text ? parseSiteSave(text) : createSite();
    } catch {
        return createSite();
    }
}
export function saveSite(state: SiteState): boolean {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(state));
        return true;
    } catch {
        return false;
    }
}
export function exportSite(state: SiteState) {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }),
        url = URL.createObjectURL(blob),
        a = document.createElement("a");
    a.href = url;
    a.download = `riverside-meadow-day-${state.day}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
