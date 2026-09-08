import { BUILDINGS, CANDIDATES, buildingDef } from "./data";
import type { Building, BuildingKind, BuildingStatus, SiteState, SiteStats } from "./types";
export const tileKey = (x: number, y: number) => `${x},${y}`;
export function footprint(building: Pick<Building, "kind" | "x" | "y" | "rotated">) {
    const def = buildingDef(building.kind),
        width = building.rotated ? def.height : def.width,
        height = building.rotated ? def.width : def.height;
    return Array.from({ length: width * height }, (_, i) => ({
        x: building.x + (i % width),
        y: building.y + Math.floor(i / width),
    }));
}
export function createSite(seed: number = Math.floor(Math.random() * 2147483646) + 1): SiteState {
    seed = Math.abs(Math.trunc(seed)) % 2147483647 || 1;
    let s = seed;
    const random = () => {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        return s / 4294967296;
    };
    const pond = {
        x: 2.3 + random() * 1.3,
        y: 2.2 + random() * 1.4,
        rx: 2 + random() * 0.7,
        ry: 1.6 + random() * 0.7,
    };
    const grove = { x: 16 + random() * 2, y: 8 + random() * 7 };
    return {
        version: 2,
        seed,
        size: 20,
        tiles: Array.from({ length: 400 }, (_, i) => {
            const x = i % 20,
                y = Math.floor(i / 20),
                r = random(),
                shore = ((x - pond.x) / pond.rx) ** 2 + ((y - pond.y) / pond.ry) ** 2,
                groveDensity =
                    Math.exp(-((x - grove.x) ** 2 + (y - grove.y) ** 2) / 12) +
                    Math.exp(-((x - 2) ** 2 + (y - 12) ** 2) / 14),
                rockDensity = Math.exp(-((x - 13) ** 2 + (y - 2) ** 2) / 7);
            return {
                x,
                y,
                terrain:
                    x >= 4 && x <= 15 && y >= 6 && y <= 19
                        ? "grass"
                        : shore < 0.92 + (r - 0.5) * 0.16
                          ? "water"
                          : r < 0.08 + groveDensity * 0.5
                            ? "tree"
                            : r > 0.96 - rockDensity * 0.2
                              ? "rock"
                              : "grass",
            };
        }),
        paths: [19, 18, 17, 16, 15].map((y) => tileKey(10, y)),
        entrance: { x: 10, y: 19 },
        buildings: [],
        people: CANDIDATES.map((p) => ({ ...p })),
        bookings: [],
        day: 1,
        minute: 480,
        phase: "planning",
        money: 22000,
        fuel: 32,
        water: 80,
        reputation: 38,
        marketing: 0,
        visitors: [],
        report: null,
        history: [],
        incident: null,
        log: ["Welcome to Riverside Meadow. Build a circus worth staying for."],
        nextId: 1,
        today: {
            guests: 0,
            ticketRevenue: 0,
            concessionRevenue: 0,
            shows: 0,
            ratings: [],
            incidentUsed: false,
            repairs: 0,
        },
        won: false,
        gameOver: false,
    };
}
export function canPlace(
    state: SiteState,
    kind: BuildingKind,
    x: number,
    y: number,
    rotated = false,
): string | null {
    if (!BUILDINGS.some((b) => b.kind === kind) || !Number.isInteger(x) || !Number.isInteger(y))
        return "Choose a valid grid tile.";
    const cells = footprint({ kind, x, y, rotated });
    if (cells.some((c) => c.x < 0 || c.y < 0 || c.x >= state.size || c.y >= state.size))
        return "The whole footprint must fit inside the site.";
    if (cells.some((c) => state.paths.includes(tileKey(c.x, c.y))))
        return "Buildings cannot cover a path. Remove the path first.";
    if (cells.some((c) => state.tiles[c.y * state.size + c.x]?.terrain !== "grass"))
        return "Clear trees or rocks first. Water cannot be built on.";
    const occupied = new Set(
        state.buildings.flatMap((b) => footprint(b).map((c) => tileKey(c.x, c.y))),
    );
    if (cells.some((c) => occupied.has(tileKey(c.x, c.y))))
        return "Another building occupies this space.";
    return null;
}
const neighbors = (x: number, y: number) => [
    { x: x - 1, y },
    { x: x + 1, y },
    { x, y: y - 1 },
    { x, y: y + 1 },
];
export function connectedPaths(state: SiteState): Set<string> {
    const paths = new Set(state.paths),
        seen = new Set<string>(),
        start = tileKey(state.entrance.x, state.entrance.y);
    if (!paths.has(start)) return seen;
    const queue = [state.entrance];
    seen.add(start);
    for (let i = 0; i < queue.length; i++)
        for (const n of neighbors(queue[i].x, queue[i].y)) {
            const key = tileKey(n.x, n.y);
            if (paths.has(key) && !seen.has(key)) {
                seen.add(key);
                queue.push(n);
            }
        }
    return seen;
}
export const isConnected = (building: Building, paths: Set<string>) =>
    footprint(building).some((c) => neighbors(c.x, c.y).some((n) => paths.has(tileKey(n.x, n.y))));
export const distance = (a: Building, b: Building) => {
    const ac = footprint(a),
        bc = footprint(b);
    return Math.min(...ac.flatMap((x) => bc.map((y) => Math.hypot(x.x - y.x, x.y - y.y))));
};
function utilities(state: SiteState, paths: Set<string>) {
    const generators = state.buildings
        .filter((b) => b.kind === "generator" && isConnected(b, paths))
        .sort((a, b) => a.id.localeCompare(b.id));
    const active = generators.slice(0, Math.floor(state.fuel / 4));
    const powered = new Set<string>();
    const consumers = state.buildings.filter(
        (b) => (buildingDef(b.kind).power ?? 0) > 0 && isConnected(b, paths),
    );
    for (const generator of active) {
        let remaining = 10;
        const nearby = consumers
            .filter((b) => distance(b, generator) <= 6)
            .sort(
                (a, b) =>
                    distance(a, generator) - distance(b, generator) || a.id.localeCompare(b.id),
            );
        for (const b of nearby) {
            const demand = buildingDef(b.kind).power ?? 0;
            if (!powered.has(b.id) && remaining >= demand) {
                remaining -= demand;
                powered.add(b.id);
            }
        }
    }
    const tanks =
        state.water >= dailyWaterUse(state)
            ? state.buildings.filter((b) => b.kind === "waterTank" && isConnected(b, paths))
            : [];
    return { powered, active, tanks };
}
export const dailyWaterUse = (state: SiteState) =>
    Math.max(
        4,
        state.people.filter((p) => p.hired).length * 2 +
            Math.ceil(
                state.bookings.filter((b) => b.day === state.day && b.status !== "cancelled")
                    .length * 8,
            ),
    );
export function getBuildingStatus(state: SiteState, building: Building): BuildingStatus {
    const paths = connectedPaths(state),
        u = utilities(state, paths),
        def = buildingDef(building.kind),
        connected = isConnected(building, paths),
        needsWater = ["smallTent", "bigTop", "trailer", "toilets", "popcorn", "lemonade"].includes(
            building.kind,
        );
    const powered = !def.power || u.powered.has(building.id),
        watered = !needsWater || u.tanks.some((t) => distance(t, building) <= 6);
    const role = ["smallTent", "bigTop"].includes(building.kind)
        ? "technician"
        : ["popcorn", "lemonade", "carousel"].includes(building.kind)
          ? "vendor"
          : null;
    const worker = role
        ? state.people.find((p) => p.hired && p.role === role && p.assignmentId === building.id)
        : undefined;
    const staffed = !role || (!!worker && worker.energy >= 15);
    const issues: string[] = [],
        bonuses: string[] = [];
    if (!connected) issues.push("No path to the gate");
    if (!powered) issues.push("No available power within 6 tiles");
    if (!watered) issues.push("No water supply within 6 tiles");
    if (!staffed)
        issues.push(worker ? `${worker.name} needs at least 15 energy` : `Assign a ${role}`);
    if (building.kind === "generator" && !u.active.some((g) => g.id === building.id))
        issues.push("Needs 4 fuel");
    if (building.kind === "waterTank" && state.water < dailyWaterUse(state))
        issues.push(`Need ${dailyWaterUse(state)} water for the day`);
    if (building.kind === "trailer") {
        bonuses.push("4 beds");
        if (u.active.some((g) => distance(g, building) < 4))
            bonuses.push("Noisy: reduced overnight recovery");
        else bonuses.push("Quiet: full overnight recovery");
    }
    if (building.kind === "generator") bonuses.push("10 power · 6-tile reach");
    if (building.kind === "waterTank") bonuses.push("6-tile water reach");
    if (def.capacity) {
        bonuses.push(`${Math.round(def.capacity * (1 + (building.level - 1) * 0.2))} seats`);
        const scenery = state.buildings.filter(
            (b) =>
                ["bench", "flowers"].includes(b.kind) &&
                isConnected(b, paths) &&
                distance(b, building) <= 5,
        ).length;
        if (scenery) bonuses.push(`Nearby scenery: +${Math.min(15, scenery * 3)} comfort`);
    }
    return {
        connected,
        powered,
        watered,
        staffed,
        operational: issues.length === 0,
        issues,
        bonuses,
    };
}
export function getStats(state: SiteState): SiteStats {
    const paths = connectedPaths(state),
        u = utilities(state, paths);
    const tents = state.buildings.filter((b) => buildingDef(b.kind).capacity);
    let comfort = 40;
    if (
        state.buildings.some((b) => b.kind === "toilets" && getBuildingStatus(state, b).operational)
    )
        comfort += 25;
    if (
        state.buildings.some(
            (b) => b.kind === "carousel" && getBuildingStatus(state, b).operational,
        )
    )
        comfort += 10;
    comfort += Math.min(
        15,
        state.buildings.filter(
            (b) =>
                ["bench", "flowers"].includes(b.kind) &&
                isConnected(b, paths) &&
                tents.some((t) => distance(t, b) <= 5),
        ).length * 3,
    );
    if (
        state.buildings.some(
            (b) =>
                ["popcorn", "lemonade"].includes(b.kind) && getBuildingStatus(state, b).operational,
        )
    )
        comfort += 10;
    return {
        beds: state.buildings.filter((b) => b.kind === "trailer").length * 4,
        housed: state.people.filter((p) => p.hired && p.homeId).length,
        powerSupply: u.active.length * 10,
        powerDemand: state.buildings.reduce((sum, b) => sum + (buildingDef(b.kind).power ?? 0), 0),
        connectedBuildings: state.buildings.filter((b) => isConnected(b, paths)).length,
        comfort: Math.min(100, comfort),
        dailyWages: state.people.filter((p) => p.hired).reduce((sum, p) => sum + p.wage, 0),
        dailyUpkeep:
            180 + state.buildings.reduce((sum, b) => sum + buildingDef(b.kind).upkeep * b.level, 0),
        capacity: tents.reduce(
            (sum, b) => sum + Math.round(buildingDef(b.kind).capacity! * (1 + (b.level - 1) * 0.2)),
            0,
        ),
    };
}
export function findPath(state: SiteState, targetBuilding: Building): { x: number; y: number }[] {
    const paths = new Set(state.paths),
        targets = new Set(
            footprint(targetBuilding).flatMap((c) =>
                neighbors(c.x, c.y).map((n) => tileKey(n.x, n.y)),
            ),
        );
    const start = tileKey(state.entrance.x, state.entrance.y);
    if (!paths.has(start)) return [];
    const queue = [state.entrance],
        parents = new Map<string, string | null>([[start, null]]);
    let finish: string | null = null;
    for (let i = 0; i < queue.length; i++) {
        const c = queue[i],
            key = tileKey(c.x, c.y);
        if (targets.has(key)) {
            finish = key;
            break;
        }
        for (const n of neighbors(c.x, c.y)) {
            const nk = tileKey(n.x, n.y);
            if (paths.has(nk) && !parents.has(nk)) {
                parents.set(nk, key);
                queue.push(n);
            }
        }
    }
    if (!finish) return [];
    const result: { x: number; y: number }[] = [];
    for (let key: string | null = finish; key !== null; key = parents.get(key) ?? null) {
        const [x, y] = key.split(",").map(Number);
        result.push({ x, y });
    }
    return result.reverse();
}
