import { afterEach, describe, expect, it, vi } from "vitest";
import { ACTS, CITIES, INITIAL_STATE } from "./data";
import { formatTime, getForecast, getShowReadiness, getTravelCost, reducer } from "./engine";
import { loadGame, parseSave, SAVE_KEY, saveGame } from "./persistence";
import type { GameAction, GameState } from "./types";

afterEach(() => vi.unstubAllGlobals());

const fresh = () => structuredClone(INITIAL_STATE);
function finish(state: GameState, choice: "repair" | "improvise" = "repair"): GameState {
    let next = reducer(state, { type: "START_SHOW" });
    expect(next.liveShow).not.toBeNull();
    for (let i = 0; i < state.lineup.length; i++) {
        if (next.liveShow?.step === 1) next = reducer(next, { type: "RESOLVE_EVENT", choice });
        next = reducer(next, { type: "ADVANCE_SHOW" });
        expect(() => parseSave(JSON.stringify(next))).not.toThrow();
    }
    return next;
}

describe("circus management loop", () => {
    it("prepares, promotes, runs a show, pays the troupe and travels to the next town", () => {
        const initial = fresh();
        expect(getShowReadiness(initial)).toContain("Set up your circus grounds first.");
        let state = reducer(initial, { type: "SETUP" });
        expect(state).toMatchObject({ setup: true, money: 11350, hour: 12, water: 80 });
        expect(getShowReadiness(state)).toEqual([]);
        state = reducer(state, { type: "TRAIN", id: "zofia" });
        state = reducer(state, { type: "COSTUME", id: "zofia" });
        const audience = getForecast(state).tickets;
        state = reducer(state, { type: "PROMOTE", channel: "posters" });
        expect(getForecast(state).tickets).toBeGreaterThan(audience);
        state = reducer(state, { type: "BUY", item: "popcorn" });
        state = finish(state);
        expect(state.history).toHaveLength(1);
        expect(state.lastResult?.rating).toBeGreaterThan(3);
        expect(state.lastResult?.profit).toBeGreaterThan(0);
        expect(state.reputation).toBeGreaterThan(0);
        expect(state.lastResult?.wages).toBe(580);
        const fuelBeforeTravel = state.fuel;
        const travel = getTravelCost(state, "wroclaw");
        state = reducer(state, { type: "TRAVEL", cityId: "wroclaw" });
        expect(state).toMatchObject({
            cityId: "wroclaw",
            route: ["poznan", "gdansk"],
            setup: false,
            fuel: fuelBeforeTravel - travel.fuel,
            marketing: { posters: 0, radio: 0, social: 0 },
        });
        state = reducer(state, { type: "REST" });
        state = reducer(state, { type: "SETUP" });
        expect(getShowReadiness(state)).toEqual([]);
        state = finish(state, "improvise");
        expect(state.history).toHaveLength(2);
        expect(initial).toEqual(INITIAL_STATE);
    });

    it("pauses the performance for an event and freezes management while live", () => {
        let state = reducer(reducer(fresh(), { type: "SETUP" }), { type: "START_SHOW" });
        expect(reducer(state, { type: "SET_PRICE", value: 70 })).toBe(state);
        state = reducer(state, { type: "ADVANCE_SHOW" });
        expect(state.liveShow?.step).toBe(1);
        expect(reducer(state, { type: "ADVANCE_SHOW" })).toBe(state);
        state = reducer(state, { type: "RESOLVE_EVENT", choice: "improvise" });
        expect(reducer(state, { type: "ADVANCE_SHOW" }).liveShow?.step).toBe(2);
        expect(reducer(state, { type: "RESOLVE_EVENT", choice: "repair" })).toBe(state);
    });

    it("prevents unaffordable, unknown, duplicate and exhausted actions", () => {
        const state = fresh();
        expect(reducer(state, { type: "TRAIN", id: "zofia" })).toBe(state);
        expect(reducer(state, { type: "BUY", item: "__proto__" })).toBe(state);
        expect(reducer(state, { type: "SET_LINEUP", lineup: ["silks", "silks"] })).toBe(state);
        expect(reducer(state, { type: "SET_PRICE", value: NaN })).toBe(state);
        expect(reducer(state, { type: "SET_ROUTE", route: ["atlantis"] })).toBe(state);
        const empty = { ...state, fuel: 0 };
        expect(reducer(empty, { type: "TRAVEL", cityId: "wroclaw" })).toBe(empty);
        const poor = { ...state, money: 100 };
        expect(reducer(poor, { type: "HIRE", id: "luna" })).toBe(poor);
        expect(reducer(poor, { type: "SETUP" })).toBe(poor);
        const exhausted = {
            ...state,
            setup: true,
            performers: state.performers.map((p) => ({ ...p, energy: 0 })),
        };
        expect(reducer(exhausted, { type: "START_SHOW" })).toBe(exhausted);
    });

    it("requires a valid lineup and enough daylight, water and generator fuel", () => {
        const state = { ...fresh(), setup: true };
        expect(getShowReadiness({ ...state, lineup: ["silks"] })).toContain(
            "Plan a show between 90 and 210 minutes.",
        );
        expect(getShowReadiness({ ...state, lineup: ["juggling", "magic", "silks"] })).toContain(
            "Hire the performers for every planned act.",
        );
        expect(getShowReadiness({ ...state, hour: 22 })).toContain(
            "It is too late for this show. Rest until morning.",
        );
        expect(getShowReadiness({ ...state, fuel: 0, water: 0 })).toHaveLength(2);
        expect(
            ACTS.filter((a) => state.lineup.includes(a.id)).reduce((sum, a) => sum + a.duration, 0),
        ).toBe(110);
    });

    it("advances seasons after six shows and allows resource replenishment", () => {
        let state = reducer(fresh(), { type: "SETUP" });
        for (let i = 0; i < 6; i++) {
            state = reducer(state, { type: "REST" });
            if (state.water < 20) state = reducer(state, { type: "BUY", item: "water" });
            state = finish(state);
        }
        expect(state.season).toBe(2);
        expect(state.history).toHaveLength(6);
        expect(state.log[0]).toContain("Season 1 complete");
    });

    it("rewards quieter living quarters and food stalls close to the entrance", () => {
        const state = reducer(fresh(), { type: "BUY", item: "popcorn" });
        const wagon = state.grounds.find((g) => g.kind === "wagon")!;
        const noisy = reducer(state, {
            type: "MOVE_GROUND",
            id: "generator",
            x: wagon.x,
            y: wagon.y,
        });
        expect(getForecast(noisy).rating).toBeLessThan(getForecast(state).rating);
        const distant = reducer(state, { type: "MOVE_GROUND", id: "popcorn", x: 10, y: 15 });
        expect(getForecast(distant).revenue).toBeLessThan(getForecast(state).revenue);
    });

    it("rest restores energy, charges daily upkeep and ends an insolvent game", () => {
        const state = {
            ...fresh(),
            money: 150,
            performers: fresh().performers.map((p) => ({ ...p, energy: 10 })),
        };
        const rested = reducer(state, { type: "REST" });
        expect(rested).toMatchObject({ day: 2, hour: 7, money: -50, gameOver: true });
        expect(rested.performers[0].energy).toBe(45);
        expect(reducer(rested, { type: "BUY", item: "water" })).toBe(rested);
        expect(reducer(rested, { type: "RESET" })).toEqual(INITIAL_STATE);
        expect(() => parseSave(JSON.stringify(rested))).not.toThrow();
    });

    it("settles a show ending at 23:00 before sleeping and records the correct performance day", () => {
        const start = { ...fresh(), setup: true, hour: 21 + 10 / 60, money: 100 };
        expect(getShowReadiness(start)).toEqual([]);
        const state = finish(start, "improvise");
        expect(state).toMatchObject({ day: 2, hour: 7, gameOver: false });
        expect(state.lastResult?.day).toBe(1);
        expect(state.money).toBe(start.money + state.lastResult!.profit - 200);
        expect(state.reputation * 10).toBe(Math.round(state.reputation * 10));
    });

    it("carries timed work across closing time in whole minutes and charges upkeep once", () => {
        const state = reducer({ ...fresh(), hour: 22 + 50 / 60 }, { type: "BUY", item: "water" });
        expect(state).toMatchObject({ day: 2, hour: 7 + 20 / 60, money: 11680 });
        expect(formatTime(state)).toBe("07:20");
        expect(() => parseSave(JSON.stringify(state))).not.toThrow();
        expect(formatTime({ ...state, hour: 10.999999999999 })).toBe("11:00");
    });

    it("exports a consistent bankrupt state if a show repair empties the cashbox", () => {
        let state = reducer({ ...fresh(), setup: true, money: 300 }, { type: "START_SHOW" });
        state = reducer(state, { type: "ADVANCE_SHOW" });
        state = reducer(state, { type: "RESOLVE_EVENT", choice: "repair" });
        expect(state).toMatchObject({ money: 0, gameOver: true, liveShow: null });
        expect(state.history).toEqual([]);
        expect(parseSave(JSON.stringify(state))).toEqual(state);
    });

    it("keeps all timed management transitions serializable around closing time", () => {
        const ready = { ...fresh(), setup: true };
        const actions: GameAction[] = [
            { type: "REST" },
            { type: "TRAIN", id: "zofia" },
            { type: "HIRE", id: "luna" },
            { type: "COSTUME", id: "felix" },
            { type: "SET_PRICE", value: 70 },
            ...["posters", "radio", "social"].map((channel) => ({
                type: "PROMOTE" as const,
                channel,
            })),
            ...["fuel", "water", "lighting", "popcorn", "tent"].map((item) => ({
                type: "BUY" as const,
                item,
            })),
            ...CITIES.map((city) => ({ type: "TRAVEL" as const, cityId: city.id })),
        ];
        for (const hour of [7, 21.5, 22 + 50 / 60]) {
            for (const action of actions) {
                const next = reducer({ ...ready, hour }, action);
                expect(parseSave(JSON.stringify(next))).toEqual(next);
                expect(next.hour).toBeGreaterThanOrEqual(7);
                expect(next.hour).toBeLessThan(23);
            }
        }
        const setup = reducer({ ...fresh(), hour: 22 }, { type: "SETUP" });
        expect(parseSave(JSON.stringify(setup))).toEqual(setup);
    });
});

describe("portable saves", () => {
    it("round-trips initial and live saves without sharing mutable state", () => {
        const original = fresh();
        const restored = parseSave(JSON.stringify(original));
        expect(restored).toEqual(original);
        restored.performers[0].skill = 10;
        expect(original.performers[0].skill).toBe(76);
        const live = reducer(reducer(original, { type: "SETUP" }), { type: "START_SHOW" });
        expect(parseSave(JSON.stringify(live))).toEqual(live);
    });

    it.each(["{}", "null", "[1,2]", "{broken"])("rejects malformed save %s", (text) => {
        expect(() => parseSave(text)).toThrow("not a valid");
    });

    it("rejects corrupt nested state and impossible show progress", () => {
        const badStates = [
            { ...fresh(), version: 2 },
            { ...fresh(), cityId: "missing" },
            { ...fresh(), money: "12000" },
            { ...fresh(), performers: [] },
            { ...fresh(), marketing: { posters: -1, radio: 0, social: 0 } },
            { ...fresh(), grounds: [{ id: "tent", kind: "tent", x: "bad", y: 5 }] },
            { ...fresh(), history: [{ cityId: "krakow" }] },
            { ...fresh(), season: 99 },
            { ...fresh(), lineup: ["silks", "silks"] },
            { ...fresh(), fuel: -1 },
            {
                ...fresh(),
                setup: true,
                liveShow: {
                    step: 90,
                    scores: [],
                    eventResolved: false,
                    eventChoice: null,
                    tickets: 10,
                },
            },
        ];
        for (const bad of badStates) {
            expect(() => parseSave(JSON.stringify(bad))).toThrow();
            const current = fresh();
            expect(reducer(current, { type: "IMPORT", state: bad as GameState })).toBe(current);
        }
    });

    it("rejects imported live programs that could not have passed show readiness", () => {
        const live = reducer({ ...fresh(), setup: true }, { type: "START_SHOW" });
        for (const bad of [
            { ...live, hour: 22 },
            { ...live, lineup: ["silks", "clown"] },
            { ...live, lineup: ["break", "silks", "juggling", "clown"] },
            { ...live, lineup: ["silks", "juggling", "clown", "break"] },
            { ...live, hour: 7, liveShow: { ...live.liveShow!, step: 1, scores: [4] } },
        ])
            expect(() => parseSave(JSON.stringify(bad))).toThrow();
    });

    it("recovers from corrupt or unavailable storage without overwriting an in-memory game", () => {
        const setItem = vi.fn();
        vi.stubGlobal("localStorage", { getItem: () => "{broken", setItem });
        expect(loadGame()).toEqual(INITIAL_STATE);
        expect(saveGame(fresh())).toBe(true);
        expect(setItem).toHaveBeenCalledWith(SAVE_KEY, JSON.stringify(INITIAL_STATE));
        vi.stubGlobal("localStorage", {
            getItem: () => {
                throw new Error("blocked");
            },
            setItem: () => {
                throw new Error("quota");
            },
        });
        expect(loadGame()).toEqual(INITIAL_STATE);
        const current = reducer(fresh(), { type: "SETUP" });
        expect(saveGame(current)).toBe(false);
        expect(current.setup).toBe(true);
    });
});
