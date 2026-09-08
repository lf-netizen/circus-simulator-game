import { ACTS, buildingDef } from "./data";
import { parseSiteSave } from "./persistence";
import {
    canPlace,
    connectedPaths,
    createSite,
    dailyWaterUse,
    distance,
    findPath,
    footprint,
    getBuildingStatus,
    getStats,
    isConnected,
    tileKey,
} from "./spatial";
import type { Booking, BuildingKind, SiteAction, SiteState } from "./types";

export const UPGRADE_COST = 600;
export const STARTER_COST = 8070;
export const formatMoney = (amount: number) =>
    `${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(amount)} zł`;
export const formatTime = (minute: number) =>
    `${Math.floor(minute / 60)
        .toString()
        .padStart(2, "0")}:${(minute % 60).toString().padStart(2, "0")}`;
export const dayWeather = (state: SiteState): "sun" | "cloud" | "rain" => {
    const n = ((state.seed % 97) + state.day * 7) % 10;
    return n < 6 ? "sun" : n < 9 ? "cloud" : "rain";
};
export const bookingDuration = (booking: Pick<Booking, "acts">) =>
    booking.acts.reduce((sum, a) => sum + (ACTS.find((d) => d.id === a.actId)?.duration ?? 0), 0);
type BookingInput = Pick<Booking, "tentId" | "day" | "start" | "price" | "acts"> & { id?: string };
export function bookingProblems(
    state: SiteState,
    booking: BookingInput,
    ignoreId?: string,
): string[] {
    const problems: string[] = [],
        tent = state.buildings.find((b) => b.id === booking.tentId),
        duration = bookingDuration(booking);
    if (!tent || !["smallTent", "bigTop"].includes(tent.kind))
        problems.push("Choose a performance tent.");
    if (!Number.isInteger(booking.day) || booking.day < state.day || booking.day > state.day + 6)
        problems.push("Choose a day within the next seven days.");
    if (
        !Number.isInteger(booking.start) ||
        booking.start < 600 ||
        booking.start > 1200 ||
        booking.start + duration > 1320
    )
        problems.push("Start between 10:00 and 20:00 and finish by 22:00.");
    if (booking.day === state.day && booking.start < state.minute)
        problems.push("This start time has already passed.");
    if (!Number.isInteger(booking.price) || booking.price < 10 || booking.price > 60)
        problems.push("Tickets must cost a whole number between 10 and 60 zł.");
    if (booking.acts.length < 3 || booking.acts.length > 8 || duration < 60 || duration > 120)
        problems.push("A show needs 3–8 segments and must last 60–120 minutes.");
    if (booking.acts[0]?.actId === "interval" || booking.acts.at(-1)?.actId === "interval")
        problems.push("An interval cannot open or close the show.");
    if (booking.acts.filter((a) => a.actId === "interval").length > 1)
        problems.push("Use at most one interval.");
    const used = new Set<string>();
    for (const segment of booking.acts) {
        const act = ACTS.find((a) => a.id === segment.actId);
        if (!act) {
            problems.push("Choose an available act.");
            continue;
        }
        if (act.requiresBigTop && tent?.kind !== "bigTop")
            problems.push(`${act.name} requires the grand pavilion.`);
        if (act.role === "interval") {
            if (segment.personId) problems.push("Intervals do not need a performer.");
            continue;
        }
        const person = state.people.find((p) => p.id === segment.personId && p.hired);
        if (!person || person.role !== act.role)
            problems.push(`${act.name} needs a hired ${act.role}.`);
        if (used.has(segment.actId)) problems.push("Each act can appear only once in a show.");
        used.add(segment.actId);
    }
    const performerIds = new Set(booking.acts.map((a) => a.personId).filter(Boolean));
    for (const other of state.bookings) {
        if (
            other.id === (ignoreId ?? booking.id) ||
            other.status === "cancelled" ||
            other.day !== booking.day
        )
            continue;
        if (
            booking.start < other.start + bookingDuration(other) &&
            other.start < booking.start + duration
        ) {
            if (other.tentId === booking.tentId)
                problems.push("This tent already has a show at that time.");
            if (other.acts.some((a) => a.personId && performerIds.has(a.personId)))
                problems.push("A performer is already booked in another show at that time.");
        }
    }
    return [...new Set(problems)];
}
export function getDailyDemand(state: SiteState, day = state.day): number {
    return Math.floor(
        (180 + state.reputation * 2 + (day === state.day ? state.marketing * 2 : 0)) *
            (dayWeather({ ...state, day }) === "rain" ? 0.85 : 1),
    );
}
function baseForecast(
    state: SiteState,
    booking: BookingInput,
): { audience: number; rating: number; revenue: number } {
    const tent = state.buildings.find((b) => b.id === booking.tentId);
    if (!tent) return { audience: 0, rating: 0, revenue: 0 };
    const performing = booking.acts
        .filter((a) => a.personId)
        .map((a) => ({
            person: state.people.find((p) => p.id === a.personId),
            act: ACTS.find((d) => d.id === a.actId),
        }))
        .filter((a) => a.person && a.act);
    const average = (f: (item: (typeof performing)[number]) => number) =>
        performing.length ? performing.reduce((s, p) => s + f(p), 0) / performing.length : 0;
    const technician = state.people.find(
        (p) => p.hired && p.role === "technician" && p.assignmentId === tent.id,
    );
    const technicalQuality = technician
        ? (technician.skill - 50) * 0.003 + (technician.energy - 50) * 0.001
        : 0;
    const comfort = getStats(state).comfort,
        roles = new Set(performing.map((a) => a.person!.role)).size;
    let flow = 0,
        previous = 0;
    for (const a of booking.acts) {
        const act = ACTS.find((d) => d.id === a.actId);
        if (!act) continue;
        if (act.role === "clown" || act.role === "interval") {
            previous = 0;
            continue;
        }
        if (act.excitement < previous) flow -= 0.18;
        previous = act.excitement;
    }
    const rating =
        Math.round(
            Math.max(
                1,
                Math.min(
                    5,
                    1 +
                        average((a) => a.person!.skill) * 0.028 +
                        average((a) => a.person!.energy) * 0.008 +
                        average((a) => a.person!.morale) * 0.003 +
                        comfort * 0.006 +
                        Math.min(3, roles) * 0.08 +
                        technicalQuality +
                        flow +
                        (tent.level - 1) * 0.2 -
                        (dayWeather({ ...state, day: booking.day }) === "rain" ? 0.15 : 0),
                ),
            ) * 10,
        ) / 10;
    const repeat = state.bookings.filter(
        (b) => b.day === booking.day && b.start < booking.start && b.status !== "cancelled",
    ).length;
    const demand = Math.max(
        0.12,
        Math.min(
            1,
            0.47 +
                state.reputation * 0.006 +
                (booking.day === state.day ? state.marketing : 0) * 0.006 +
                comfort * 0.002 +
                (rating - 3) * 0.05 -
                (booking.price - 20) * 0.016 -
                repeat * 0.1 -
                (dayWeather({ ...state, day: booking.day }) === "rain" ? 0.12 : 0),
        ),
    );
    const audience = Math.floor(
        buildingDef(tent.kind).capacity! * (1 + (tent.level - 1) * 0.2) * demand,
    );
    return { audience, rating, revenue: audience * booking.price };
}
export function forecastBooking(
    state: SiteState,
    booking: BookingInput,
): { audience: number; rating: number; revenue: number } {
    const saved = state.bookings.find((b) => b.id === booking.id);
    if (saved && (saved.status === "running" || saved.status === "completed"))
        return { audience: saved.audience, rating: saved.rating, revenue: saved.revenue };
    const own = baseForecast(state, booking);
    const rows = state.bookings
        .filter(
            (b) =>
                b.day === booking.day &&
                b.status !== "cancelled" &&
                b.id !== booking.id &&
                b.start <= booking.start,
        )
        .map((b) => ({
            booking: b as BookingInput,
            predicted:
                b.status === "running" || b.status === "completed"
                    ? { audience: b.audience, rating: b.rating, revenue: b.revenue }
                    : baseForecast(state, b),
            fixed: b.status === "running" || b.status === "completed",
            target: false,
        }));
    rows.push({ booking, predicted: own, fixed: false, target: true });
    let remaining = getDailyDemand(state, booking.day);
    for (const start of [...new Set(rows.map((r) => r.booking.start))].sort((a, b) => a - b)) {
        const group = rows.filter((r) => r.booking.start === start);
        remaining = Math.max(
            0,
            remaining -
                group.filter((r) => r.fixed).reduce((sum, r) => sum + r.predicted.audience, 0),
        );
        const scheduled = group.filter((r) => !r.fixed),
            total = scheduled.reduce((sum, r) => sum + r.predicted.audience, 0),
            available = remaining;
        for (const row of scheduled) {
            const audience =
                total > available
                    ? Math.floor((available * row.predicted.audience) / Math.max(1, total))
                    : row.predicted.audience;
            remaining -= audience;
            if (row.target) return { ...own, audience, revenue: audience * booking.price };
        }
    }
    return own;
}
export function getOpeningProblems(state: SiteState): string[] {
    const problems: string[] = [];
    const shows = state.bookings.filter((b) => b.day === state.day && b.status === "scheduled");
    if (!shows.length) problems.push("Schedule at least one show for today.");
    for (const b of shows) {
        problems.push(...bookingProblems(state, b, b.id));
        const tent = state.buildings.find((t) => t.id === b.tentId);
        if (tent)
            problems.push(
                ...getBuildingStatus(state, tent).issues.map((s) => `${tent.name}: ${s}.`),
            );
    }
    for (const p of state.people.filter((p) => p.hired)) {
        const needed = shows.reduce(
            (sum, b) =>
                sum +
                b.acts
                    .filter((a) => a.personId === p.id)
                    .reduce((s, a) => s + (ACTS.find((d) => d.id === a.actId)?.energy ?? 0), 0),
            0,
        );
        if (needed > p.energy)
            problems.push(
                `${p.name} needs ${needed} energy for today's programme (has ${p.energy}).`,
            );
    }
    if (state.water < dailyWaterUse(state))
        problems.push(`Stock at least ${dailyWaterUse(state)} water before opening.`);
    if (state.gameOver) problems.push("This circus is out of money. Start a new site.");
    return [...new Set(problems)];
}
const log = (state: SiteState, message: string) => {
    state.log = [`Day ${state.day} · ${message}`, ...state.log].slice(0, 40);
};
const fail = (state: SiteState, message: string): SiteState => ({
    ...state,
    log: [`Day ${state.day} · ${message}`, ...state.log].slice(0, 40),
});
const round = (n: number) => Math.round(n * 10) / 10;
function startShow(state: SiteState, b: Booking, forecast = forecastBooking(state, b)) {
    b.status = "running";
    b.audience = forecast.audience;
    b.rating = forecast.rating;
    b.revenue = forecast.revenue;
    const tent = state.buildings.find((t) => t.id === b.tentId)!;
    const route = findPath(state, tent);
    const count = Math.min(24, Math.ceil(b.audience / 3));
    for (let i = 0; i < count; i++)
        state.visitors.push({
            id: `visitor-${state.nextId++}`,
            route,
            progress: i === 0 ? 0 : -i * 0.13,
            targetId: tent.id,
            mood: b.rating >= 4 ? "happy" : b.rating >= 3 ? "neutral" : "unhappy",
            color: ["#efc270", "#90b8b1", "#d3999c", "#9eaccb"][i % 4],
        });
    state.visitors = state.visitors.slice(-40);
    log(state, `${tent.name} opens: ${b.audience} guests, ${formatMoney(b.price)} tickets.`);
}
function completeShow(state: SiteState, b: Booking) {
    b.status = "completed";
    b.revenue = b.audience * b.price;
    state.money += b.revenue;
    state.today.ticketRevenue += b.revenue;
    state.today.guests += b.audience;
    state.today.shows++;
    state.today.ratings.push(b.rating);
    for (const segment of b.acts) {
        const person = state.people.find((p) => p.id === segment.personId),
            act = ACTS.find((a) => a.id === segment.actId);
        if (person && act) {
            person.energy = Math.max(0, person.energy - act.energy);
            person.morale = Math.min(100, Math.max(0, person.morale + (b.rating >= 4 ? 2 : -2)));
        }
    }
    state.reputation = Math.max(0, Math.min(100, round(state.reputation + (b.rating - 2.5) * 1.4)));
    const stalls = state.buildings.filter(
            (x) =>
                ["popcorn", "lemonade", "carousel"].includes(x.kind) &&
                getBuildingStatus(state, x).operational,
        ),
        interval = b.acts.some((a) => a.actId === "interval");
    let concessions = 0;
    for (const stall of stalls) {
        const vendor = state.people.find(
            (p) => p.hired && p.assignmentId === stall.id && p.role === "vendor",
        )!;
        concessions += Math.round(
            b.audience *
                (stall.kind === "carousel" ? 2.8 : stall.kind === "popcorn" ? 2.1 : 1.4) *
                (interval ? 1.25 : 1) *
                (0.75 + vendor.skill / 200) *
                (0.7 + vendor.energy * 0.003),
        );
        const route = findPath(state, stall);
        for (let i = 0; i < Math.min(5, Math.ceil(b.audience / 15)); i++)
            state.visitors.push({
                id: `visitor-${state.nextId++}`,
                route,
                progress: i === 0 ? 0 : -i * 0.3,
                targetId: stall.id,
                mood: "happy",
                color: "#e9b86e",
            });
    }
    state.money += concessions;
    state.today.concessionRevenue += concessions;
    state.visitors = state.visitors.slice(-40);
    log(
        state,
        `Show finished: ${b.rating.toFixed(1)}★, ${formatMoney(b.revenue)} tickets + ${formatMoney(concessions)} guest services.`,
    );
}
function closeDay(state: SiteState) {
    const stats = getStats(state),
        paths = connectedPaths(state),
        generators = state.buildings
            .filter((b) => b.kind === "generator" && isConnected(b, paths))
            .slice(0, Math.floor(state.fuel / 4)).length;
    const fuelUsed = generators * 4,
        waterUsed = dailyWaterUse(state),
        wages = stats.dailyWages,
        upkeep = stats.dailyUpkeep;
    for (const person of state.people.filter((p) => p.hired && p.assignmentId)) {
        const workplace = state.buildings.find((b) => b.id === person.assignmentId);
        if (!workplace || !getBuildingStatus(state, workplace).operational) continue;
        const shifts =
            person.role === "technician"
                ? state.bookings.filter(
                      (b) =>
                          b.day === state.day &&
                          b.status === "completed" &&
                          b.tentId === person.assignmentId,
                  ).length
                : person.role === "vendor"
                  ? state.today.shows
                  : 0;
        person.energy = Math.max(
            0,
            person.energy - shifts * (person.role === "technician" ? 12 : 8),
        );
    }
    state.fuel = Math.max(0, state.fuel - fuelUsed);
    state.water = Math.max(0, state.water - waterUsed);
    state.money -= wages + upkeep;
    const rating = state.today.ratings.length
        ? round(state.today.ratings.reduce((s, r) => s + r, 0) / state.today.ratings.length)
        : 0;
    // Fuel is paid when stocked; do not charge a second time at close.
    const report = {
        day: state.day,
        guests: state.today.guests,
        ticketRevenue: state.today.ticketRevenue,
        concessionRevenue: state.today.concessionRevenue,
        wages,
        upkeep,
        fuelCost: 0,
        repairs: state.today.repairs,
        profit:
            state.today.ticketRevenue +
            state.today.concessionRevenue -
            wages -
            upkeep -
            state.today.repairs,
        rating,
        shows: state.today.shows,
        notes: [
            `${fuelUsed} fuel and ${waterUsed} water used from stock. Upkeep includes 180 zł ground rent. Resource purchases, campaigns, training and capital investments are excluded from operating profit.`,
            ...(stats.housed < state.people.filter((p) => p.hired).length
                ? ["Unhoused crew recover less energy and lose morale."]
                : []),
        ],
    };
    state.report = report;
    state.history.push(report);
    state.phase = "closed";
    state.visitors = [];
    state.gameOver = state.money <= 0;
    state.won =
        state.won ||
        (state.history.reduce((s, r) => s + r.guests, 0) >= 300 &&
            state.history.reduce((s, r) => s + r.shows, 0) >= 6 &&
            state.reputation >= 60 &&
            state.money > 0);
    log(
        state,
        `Gates closed. Operating ${report.profit >= 0 ? "profit" : "loss"}: ${formatMoney(report.profit)}. Crew paid ${formatMoney(wages)}.`,
    );
    if (state.won)
        log(state, "A meadow institution: 300 guests, six shows and 60 reputation. Keep growing!");
    if (state.gameOver)
        log(state, "The circus has run out of cash. Export this save or start a new site.");
}
export function reducer(original: SiteState, action: SiteAction): SiteState {
    if (action.type === "RESET") return createSite(action.seed);
    if (action.type === "IMPORT") {
        try {
            return parseSiteSave(JSON.stringify(action.state));
        } catch {
            return fail(original, "Import rejected: this save contains invalid site data.");
        }
    }
    if (action.type === "CLOSE_REPORT")
        return original.phase === "closed" ? { ...original, report: null } : original;
    if (original.gameOver)
        return fail(original, "This circus has run out of cash. Start a new site.");
    if (action.type === "TICK") {
        if (original.phase !== "running" || original.incident) return original;
        const state = structuredClone(original);
        state.minute = Math.min(1320, state.minute + 5);
        state.visitors = state.visitors
            .map((v) => ({ ...v, progress: v.progress + 0.9 }))
            .filter((v) => v.progress < v.route.length + 8);
        const starting = state.bookings.filter(
            (b) => b.day === state.day && b.status === "scheduled" && b.start <= state.minute,
        );
        const forecasts = starting.map((b) => forecastBooking(state, b));
        for (let i = 0; i < starting.length; i++) startShow(state, starting[i], forecasts[i]);
        const active = state.bookings.find((b) => b.day === state.day && b.status === "running");
        if (active && !state.today.incidentUsed && state.minute >= active.start + 20) {
            state.today.incidentUsed = true;
            state.incident = {
                title: "A loose spotlight",
                description:
                    "The lighting rig is flickering. Pay for a replacement fitting, or let your performers continue under simpler lighting (−0.35 stars for this show).",
                bookingId: active.id,
                repairCost: 180,
            };
            log(state, "A loose spotlight pauses the show. Choose how to respond.");
            return state;
        }
        for (const b of state.bookings.filter(
            (b) =>
                b.day === state.day &&
                b.status === "running" &&
                b.start + bookingDuration(b) <= state.minute,
        ))
            completeShow(state, b);
        if (state.minute >= 1320) closeDay(state);
        return state;
    }
    if (action.type === "RESOLVE_INCIDENT") {
        if (!original.incident) return original;
        const state = structuredClone(original),
            incident = state.incident!,
            booking = state.bookings.find((b) => b.id === incident.bookingId);
        if (action.choice === "repair") {
            if (state.money < incident.repairCost)
                return fail(original, "Not enough cash for the repair. Improvise to continue.");
            state.money -= incident.repairCost;
            state.today.repairs += incident.repairCost;
            state.gameOver = state.money <= 0;
            log(
                state,
                `Spotlight repaired for ${formatMoney(incident.repairCost)}. Show quality preserved.`,
            );
        } else {
            if (booking)
                booking.rating = Math.max(1, Math.round((booking.rating - 0.35) * 100) / 100);
            log(
                state,
                "The crew improvise under simple lighting. Show rating reduced by 0.35 stars.",
            );
        }
        state.incident = null;
        return state;
    }
    if (action.type === "NEXT_DAY") {
        if (original.phase !== "closed") return original;
        const state = structuredClone(original);
        for (const person of state.people.filter((p) => p.hired)) {
            const home = state.buildings.find((b) => b.id === person.homeId);
            let recovery = 15;
            if (home) {
                const noisy = state.buildings.some(
                    (b) =>
                        b.kind === "generator" &&
                        distance(b, home) < 4 &&
                        getBuildingStatus(state, b).operational,
                );
                recovery = getBuildingStatus(state, home).operational && !noisy ? 40 : 25;
                person.morale = Math.min(100, person.morale + 3);
            } else person.morale = Math.max(0, person.morale - 8);
            person.energy = Math.min(100, person.energy + recovery);
        }
        state.day++;
        state.minute = 480;
        state.phase = "planning";
        state.marketing = 0;
        state.report = null;
        state.incident = null;
        state.today = {
            guests: 0,
            ticketRevenue: 0,
            concessionRevenue: 0,
            shows: 0,
            ratings: [],
            incidentUsed: false,
            repairs: 0,
        };
        log(state, "A new morning. Plan the programme, check utilities and open the gates.");
        return state;
    }
    if (original.phase !== "planning")
        return fail(original, "Finish the day before changing your site or programme.");
    const state = structuredClone(original);
    switch (action.type) {
        case "BUILD": {
            const problem = canPlace(state, action.kind, action.x, action.y, action.rotated);
            if (problem) return fail(original, problem);
            const def = buildingDef(action.kind);
            if (state.money < def.cost)
                return fail(original, `Need ${formatMoney(def.cost)} to build ${def.name}.`);
            state.money -= def.cost;
            state.buildings.push({
                id: `building-${state.nextId++}`,
                kind: action.kind,
                x: action.x,
                y: action.y,
                rotated: !!action.rotated,
                name: def.name,
                level: 1,
            });
            log(state, `${def.name} built for ${formatMoney(def.cost)}.`);
            break;
        }
        case "PATH": {
            const { x, y } = action;
            if (
                !Number.isInteger(x) ||
                !Number.isInteger(y) ||
                x < 0 ||
                y < 0 ||
                x >= state.size ||
                y >= state.size
            )
                return fail(original, "Choose a tile inside the site.");
            const key = tileKey(x, y);
            if (state.paths.includes(key)) return original;
            if (state.tiles[y * state.size + x].terrain !== "grass")
                return fail(original, "Clear this tile first. Paths cannot cross water.");
            if (state.buildings.some((b) => footprint(b).some((c) => c.x === x && c.y === y)))
                return fail(original, "A building occupies this tile.");
            if (state.money < 15) return fail(original, "A path tile costs 15 zł.");
            state.money -= 15;
            state.paths.push(key);
            break;
        }
        case "BULLDOZE": {
            const { x, y } = action;
            if (
                !Number.isInteger(x) ||
                !Number.isInteger(y) ||
                x < 0 ||
                y < 0 ||
                x >= state.size ||
                y >= state.size
            )
                return original;
            const building = state.buildings.find((b) =>
                footprint(b).some((c) => c.x === x && c.y === y),
            );
            if (building) {
                if (
                    state.bookings.some(
                        (b) =>
                            b.tentId === building.id && ["scheduled", "running"].includes(b.status),
                    )
                )
                    return fail(original, "Cancel this tent’s scheduled shows before removing it.");
                state.buildings = state.buildings.filter((b) => b.id !== building.id);
                for (const p of state.people) {
                    if (p.homeId === building.id) p.homeId = null;
                    if (p.assignmentId === building.id) p.assignmentId = null;
                }
                const refund = Math.floor(
                    (buildingDef(building.kind).cost + (building.level - 1) * UPGRADE_COST) * 0.5,
                );
                state.money += refund;
                log(state, `${building.name} removed; ${formatMoney(refund)} salvaged.`);
            } else if (state.paths.includes(tileKey(x, y))) {
                if (x === state.entrance.x && y === state.entrance.y)
                    return fail(original, "The entrance path must remain.");
                state.paths = state.paths.filter((k) => k !== tileKey(x, y));
                state.money += 7;
            } else {
                const tile = state.tiles[y * state.size + x];
                if (tile.terrain === "water")
                    return fail(original, "The pond is protected. Build around it.");
                if (tile.terrain === "grass") return original;
                const cost = tile.terrain === "tree" ? 40 : 100;
                if (state.money < cost)
                    return fail(original, `Clearing this tile costs ${cost} zł.`);
                state.money -= cost;
                tile.terrain = "grass";
                log(state, `Site cleared for ${cost} zł.`);
            }
            break;
        }
        case "HIRE": {
            const person = state.people.find((p) => p.id === action.id);
            if (!person || person.hired) return original;
            if (state.money < person.hireCost)
                return fail(
                    original,
                    `Need ${formatMoney(person.hireCost)} to hire ${person.name}.`,
                );
            person.hired = true;
            state.money -= person.hireCost;
            log(
                state,
                `${person.name} hired. Daily wage: ${formatMoney(person.wage)}. Assign a home.`,
            );
            break;
        }
        case "FIRE": {
            const p = state.people.find((p) => p.id === action.id);
            if (!p?.hired) return original;
            if (
                state.bookings.some(
                    (b) => b.status === "scheduled" && b.acts.some((a) => a.personId === p.id),
                )
            )
                return fail(
                    original,
                    "Cancel this performer’s future shows before releasing them.",
                );
            p.hired = false;
            p.homeId = null;
            p.assignmentId = null;
            log(state, `${p.name} left the circus.`);
            break;
        }
        case "ASSIGN_HOME": {
            const p = state.people.find((p) => p.id === action.id && p.hired);
            if (!p) return original;
            if (action.buildingId) {
                const home = state.buildings.find(
                    (b) => b.id === action.buildingId && b.kind === "trailer",
                );
                if (!home) return fail(original, "Choose a living trailer.");
                if (
                    state.people.filter((q) => q.hired && q.homeId === home.id && q.id !== p.id)
                        .length >= 4
                )
                    return fail(original, "This trailer has no empty beds.");
            }
            p.homeId = action.buildingId;
            log(state, `${p.name}: ${action.buildingId ? "home assigned" : "home unassigned"}.`);
            break;
        }
        case "ASSIGN_WORK": {
            const p = state.people.find((p) => p.id === action.id && p.hired);
            if (!p) return original;
            if (action.buildingId) {
                const b = state.buildings.find((b) => b.id === action.buildingId);
                const permitted =
                    p.role === "technician"
                        ? ["smallTent", "bigTop"]
                        : p.role === "vendor"
                          ? ["popcorn", "lemonade", "carousel"]
                          : [];
                if (!b || !permitted.includes(b.kind))
                    return fail(original, "This job does not match the crew member’s role.");
                if (state.people.some((q) => q.hired && q.id !== p.id && q.assignmentId === b.id))
                    return fail(original, "This building already has an assigned worker.");
            }
            p.assignmentId = action.buildingId;
            log(
                state,
                `${p.name}: ${action.buildingId ? "workplace assigned" : "workplace unassigned"}.`,
            );
            break;
        }
        case "TRAIN": {
            const p = state.people.find((p) => p.id === action.id && p.hired);
            if (!p) return original;
            if (p.skill >= 100) return fail(original, "Already at maximum skill.");
            if (p.energy < 35)
                return fail(original, "Training needs at least 35 energy. Rest overnight.");
            if (state.money < 120) return fail(original, "Training costs 120 zł.");
            state.money -= 120;
            p.skill = Math.min(100, p.skill + 4);
            p.energy -= 12;
            log(state, `${p.name} trained: +4 skill, −12 energy, 120 zł.`);
            break;
        }
        case "BOOK": {
            const problems = bookingProblems(state, action.booking);
            if (problems.length) return fail(original, problems.join(" "));
            state.bookings.push({
                ...action.booking,
                acts: action.booking.acts.map((a) => ({ ...a })),
                id: `show-${state.nextId++}`,
                status: "scheduled",
                audience: 0,
                rating: 0,
                revenue: 0,
            });
            log(
                state,
                `Show booked for day ${action.booking.day} at ${formatTime(action.booking.start)}.`,
            );
            break;
        }
        case "CANCEL_BOOKING": {
            const b = state.bookings.find((b) => b.id === action.id);
            if (b?.status === "scheduled") {
                b.status = "cancelled";
                log(state, "Show cancelled. Its time and performers are available again.");
            } else return original;
            break;
        }
        case "OPEN_DAY": {
            const problems = getOpeningProblems(state);
            if (problems.length) return fail(original, problems.join(" "));
            state.phase = "running";
            state.minute = 540;
            log(state, "Gates open at 09:00. The programme runs until 22:00.");
            break;
        }
        case "BUY_RESOURCE": {
            const cost = action.resource === "fuel" ? 160 : 80,
                amount = action.resource === "fuel" ? 20 : 40;
            if (state.money < cost) return fail(original, `Need ${cost} zł to restock.`);
            if (state[action.resource] + amount > 1000)
                return fail(original, "Storage is full (1,000 units).");
            state.money -= cost;
            state[action.resource] += amount;
            log(state, `Bought ${amount} ${action.resource} for ${cost} zł.`);
            break;
        }
        case "MARKET": {
            if (state.marketing >= 45)
                return fail(original, "Today’s local campaign is already fully funded.");
            if (state.money < 200) return fail(original, "Local posters cost 200 zł.");
            state.money -= 200;
            state.marketing += 15;
            log(state, "Local posters: +15 demand for today’s shows. Campaign resets tomorrow.");
            break;
        }
        case "UPGRADE": {
            const b = state.buildings.find((b) => b.id === action.id);
            if (!b || !["smallTent", "bigTop"].includes(b.kind))
                return fail(original, "Only performance tents can be upgraded.");
            if (b.level >= 2) return fail(original, "This tent is already upgraded.");
            if (state.money < UPGRADE_COST) return fail(original, "A tent upgrade costs 600 zł.");
            state.money -= UPGRADE_COST;
            b.level++;
            log(state, `${b.name} upgraded: +20% seats and +0.2 show quality.`);
            break;
        }
        case "STARTER_CAMP": {
            if (
                state.buildings.length ||
                state.people.some((p) => p.hired) ||
                state.bookings.length ||
                state.paths.length !== 5
            )
                return fail(original, "The starter layout is available on an untouched site.");
            if (state.money < STARTER_COST)
                return fail(
                    original,
                    `The complete starter camp costs ${formatMoney(STARTER_COST)}.`,
                );
            let built: SiteState = state;
            for (let y = 6; y <= 19; y++) built = reducer(built, { type: "PATH", x: 10, y });
            for (let x = 4; x <= 15; x++) built = reducer(built, { type: "PATH", x, y: 12 });
            for (let y = 14; y <= 15; y++) built = reducer(built, { type: "PATH", x: 9, y });
            const blueprint: [BuildingKind, number, number, boolean?][] = [
                ["smallTent", 6, 9],
                ["generator", 11, 9],
                ["waterTank", 9, 11],
                ["toilets", 11, 11, true],
                ["popcorn", 6, 13],
                ["trailer", 11, 14],
                ["trailer", 7, 14],
            ];
            for (const [kind, x, y, rotated] of blueprint)
                built = reducer(built, { type: "BUILD", kind, x, y, rotated });
            if (built.buildings.length !== 7)
                return fail(original, "Clear the starter area before placing the camp.");
            const hires = ["mila", "otto", "inez", "felix", "bea"],
                homes = built.buildings.filter((b) => b.kind === "trailer");
            for (let i = 0; i < hires.length; i++) {
                built = reducer(built, { type: "HIRE", id: hires[i] });
                built = reducer(built, {
                    type: "ASSIGN_HOME",
                    id: hires[i],
                    buildingId: homes[Math.floor(i / 4)].id,
                });
            }
            const tent = built.buildings.find((b) => b.kind === "smallTent")!;
            built = reducer(built, { type: "ASSIGN_WORK", id: "felix", buildingId: tent.id });
            built = reducer(built, {
                type: "ASSIGN_WORK",
                id: "bea",
                buildingId: built.buildings.find((b) => b.kind === "popcorn")!.id,
            });
            built = reducer(built, {
                type: "BOOK",
                booking: {
                    tentId: tent.id,
                    day: built.day,
                    start: 720,
                    price: 24,
                    acts: [
                        { actId: "clown", personId: "mila" },
                        { actId: "juggling", personId: "otto" },
                        { actId: "acrobatics", personId: "inez" },
                    ],
                },
            });
            log(
                built,
                `Starter camp purchased for ${formatMoney(original.money - built.money)}. Five crew, seven buildings, and your first show are ready.`,
            );
            return built;
        }
    }
    state.gameOver = state.money <= 0;
    return state;
}
