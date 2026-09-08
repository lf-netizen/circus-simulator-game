import { ACTS, CITIES, INITIAL_STATE, PERFORMERS } from "./data";
import type { GameState } from "./types";

export const SAVE_KEY = "wandering-wonder-save-v1";
const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);
const number = (value: unknown, min = 0, max = 1e9): value is number =>
    typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
const integer = (value: unknown, min = 0, max = 1e9): value is number =>
    number(value, min, max) && Number.isInteger(value);
const string = (value: unknown, max = 200): value is string =>
    typeof value === "string" && value.length > 0 && value.length <= max;
const strings = (value: unknown, allowed: string[], max: number): value is string[] =>
    Array.isArray(value) &&
    value.length <= max &&
    new Set(value).size === value.length &&
    value.every((v) => typeof v === "string" && allowed.includes(v));
const cities = CITIES.map((c) => c.id);
const acts = ACTS.map((a) => a.id);
const result = (value: unknown) =>
    isObject(value) &&
    cities.includes(value.cityId as string) &&
    integer(value.day, 1) &&
    integer(value.tickets, 0, 450) &&
    number(value.rating, 1, 5) &&
    integer(value.revenue) &&
    integer(value.wages) &&
    integer(value.expenses) &&
    integer(value.profit, -1e9) &&
    value.profit ===
        (value.revenue as number) - (value.wages as number) - (value.expenses as number);

/** Validate before replacing any progress. Invalid or incompatible files throw. */
export function parseSave(text: string): GameState {
    const fail = (): never => {
        throw new Error(
            "This is not a valid Wandering Wonder save. Choose a version 1 JSON export.",
        );
    };
    if (typeof text !== "string" || text.length > 5_000_000) return fail();
    let raw: unknown;
    try {
        raw = JSON.parse(text);
    } catch {
        return fail();
    }
    if (
        !isObject(raw) ||
        raw.version !== 1 ||
        !string(raw.circusName, 80) ||
        !integer(raw.day, 1) ||
        !number(raw.hour, 7, 23 - 1 / 60 + 1e-9) ||
        Math.abs(raw.hour * 60 - Math.round(raw.hour * 60)) > 1e-7 ||
        !integer(raw.money, -1e9) ||
        !integer(raw.fuel) ||
        !integer(raw.water) ||
        !number(raw.reputation, 0, 100) ||
        !cities.includes(raw.cityId as string) ||
        !strings(raw.route, cities, CITIES.length) ||
        typeof raw.setup !== "boolean" ||
        !integer(raw.ticketPrice, 15, 70) ||
        typeof raw.gameOver !== "boolean" ||
        raw.gameOver !== (raw.money as number) <= 0
    )
        return fail();
    if (
        !isObject(raw.marketing) ||
        Object.keys(raw.marketing).length !== 3 ||
        !["posters", "radio", "social"].every((key) =>
            integer(raw.marketing && (raw.marketing as Record<string, unknown>)[key], 0, 3),
        )
    )
        return fail();
    if (
        !Array.isArray(raw.performers) ||
        raw.performers.length !== PERFORMERS.length ||
        new Set(raw.performers.map((p) => (isObject(p) ? p.id : null))).size !==
            PERFORMERS.length ||
        !raw.performers.every((p) => {
            if (!isObject(p)) return false;
            const original = PERFORMERS.find((person) => person.id === p.id);
            return (
                original &&
                p.name === original.name &&
                p.role === original.role &&
                p.kind === original.kind &&
                p.wage === original.wage &&
                p.color === original.color &&
                typeof p.hired === "boolean" &&
                typeof p.costume === "boolean" &&
                number(p.skill, 0, 100) &&
                number(p.energy, 0, 100) &&
                number(p.morale, 0, 100)
            );
        })
    )
        return fail();
    if (
        !strings(raw.lineup, acts, ACTS.length) ||
        !strings(raw.upgrades, ["lighting", "popcorn", "tent"], 3) ||
        !Array.isArray(raw.grounds) ||
        raw.grounds.length < 3 ||
        raw.grounds.length > 10 ||
        new Set(raw.grounds.map((g) => (isObject(g) ? g.id : null))).size !== raw.grounds.length ||
        !raw.grounds.every(
            (g) =>
                isObject(g) &&
                string(g.id, 40) &&
                ["tent", "wagon", "popcorn", "generator"].includes(g.kind as string) &&
                number(g.x, 0, 100) &&
                number(g.y, 0, 100),
        ) ||
        !["tent", "wagon", "generator"].every((kind) =>
            (raw.grounds as Record<string, unknown>[]).some((g) => g.kind === kind),
        )
    )
        return fail();
    if (
        !Array.isArray(raw.history) ||
        raw.history.length > 10000 ||
        !raw.history.every(result) ||
        !integer(raw.season, 1) ||
        raw.season !== Math.floor(raw.history.length / 6) + 1 ||
        !(raw.lastResult === null || result(raw.lastResult)) ||
        !Array.isArray(raw.log) ||
        raw.log.length > 30 ||
        !raw.log.every((line) => string(line, 500))
    )
        return fail();
    if (raw.liveShow !== null) {
        const live = raw.liveShow;
        if (
            !isObject(live) ||
            !integer(live.step, 0, raw.lineup.length - 1) ||
            !Array.isArray(live.scores) ||
            live.scores.length !==
                raw.lineup.slice(0, live.step as number).filter((id) => id !== "break").length ||
            !live.scores.every((score) => number(score, 1, 5)) ||
            typeof live.eventResolved !== "boolean" ||
            ![null, "repair", "improvise"].includes(live.eventChoice as null | string) ||
            live.eventResolved !== (live.eventChoice !== null) ||
            ((live.step as number) > 1 && !live.eventResolved) ||
            ((live.step as number) === 0 && live.eventResolved) ||
            !integer(live.tickets, 0, raw.upgrades.includes("tent") ? 450 : 300) ||
            !raw.setup ||
            raw.gameOver ||
            raw.lastResult !== null ||
            raw.lineup.length < 2 ||
            raw.lineup.some((id) => {
                const act = ACTS.find((a) => a.id === id)!;
                return (
                    act.kind !== "break" &&
                    !(raw.performers as Record<string, unknown>[]).some(
                        (p) => p.id === act.performerId && p.hired,
                    )
                );
            })
        )
            return fail();
        const program = raw.lineup.map((id) => ACTS.find((act) => act.id === id)!);
        const duration = program.reduce((sum, act) => sum + act.duration, 0);
        const elapsed = program.slice(0, live.step).reduce((sum, act) => sum + act.duration, 0);
        const currentMinute = Math.round(raw.hour * 60);
        if (
            duration < 90 ||
            duration > 210 ||
            program[0].kind === "break" ||
            program.at(-1)?.kind === "break" ||
            currentMinute - elapsed < 7 * 60 ||
            currentMinute + duration - elapsed > 23 * 60
        )
            return fail();
    }
    return raw as unknown as GameState;
}

export function loadGame(): GameState {
    try {
        const saved = localStorage.getItem(SAVE_KEY);
        if (saved) return parseSave(saved);
    } catch {
        /* Private mode, unavailable storage, and old saves start a fresh demo. */
    }
    return structuredClone(INITIAL_STATE);
}

/** False means storage was unavailable; the current in-memory game is unaffected. */
export function saveGame(state: GameState): boolean {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(state));
        return true;
    } catch {
        return false;
    }
}

export function exportGame(state: GameState): void {
    const url = URL.createObjectURL(
        new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `wandering-wonder-day-${state.day}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
