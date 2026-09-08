import { ACTS, CITIES, INITIAL_STATE } from "./data";
import { parseSave } from "./persistence";
import type { GameAction, GameState, ShowResult } from "./types";

export const MARKETING_COSTS: Record<string, number> = { posters: 250, radio: 600, social: 400 };
export const SHOP_COSTS: Record<string, number> = {
    fuel: 280,
    water: 120,
    lighting: 1600,
    popcorn: 1200,
    tent: 4000,
};
const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));
const note = (s: GameState, message: string): GameState => ({
    ...s,
    log: [message, ...s.log].slice(0, 30),
});
export const formatMoney = (value: number) =>
    `${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(value)} zł`;
export const formatTime = (state: GameState) => {
    const minutes = Math.round(state.hour * 60);
    return `${Math.floor(minutes / 60)
        .toString()
        .padStart(2, "0")}:${(minutes % 60).toString().padStart(2, "0")}`;
};

function overnight(state: GameState): GameState {
    const cost = 140 + state.performers.filter((p) => p.hired).length * 20;
    const water = Math.max(0, state.water - 5);
    return note(
        {
            ...state,
            day: state.day + 1,
            hour: 7,
            money: state.money - cost,
            water,
            performers: state.performers.map((p) =>
                p.hired
                    ? {
                          ...p,
                          energy: clamp(p.energy + (water > 0 ? 35 : 10)),
                          morale: clamp(p.morale + (water > 0 ? 3 : -15)),
                      }
                    : p,
            ),
        },
        `A new morning. Troupe upkeep: ${formatMoney(cost)}${water === 0 ? ". Refill the water tank to keep spirits up." : "."}`,
    );
}
function spendTime(state: GameState, hours: number): GameState {
    let next = { ...state };
    let remaining = Math.round(hours * 60);
    while (remaining > 0) {
        const current = Math.round(next.hour * 60);
        const available = 23 * 60 - current;
        if (remaining < available) {
            next.hour = (current + remaining) / 60;
            remaining = 0;
        } else {
            remaining -= available;
            next = overnight(next);
        }
    }
    return next;
}

export function getTravelCost(state: GameState, cityId: string): { fuel: number; hours: number } {
    const from = CITIES.find((c) => c.id === state.cityId);
    const to = CITIES.find((c) => c.id === cityId);
    if (!from || !to || from.id === to.id) return { fuel: 0, hours: 0 };
    const distance = Math.hypot(from.x - to.x, from.y - to.y);
    return { fuel: Math.ceil(distance * 0.64 + 8), hours: Math.max(2, Math.ceil(distance / 12)) };
}

function actScore(state: GameState, id: string, index: number): number {
    const act = ACTS.find((a) => a.id === id);
    if (!act || act.kind === "break") return 0;
    const performer = state.performers.find((p) => p.id === act.performerId && p.hired);
    if (!performer) return 1;
    const previous = ACTS.find((a) => a.id === state.lineup[index - 1]);
    const sequencePenalty =
        previous && previous.kind !== "clown" && previous.kind !== "break"
            ? Math.max(0, previous.excitement - act.excitement) * 0.008
            : 0;
    const generator = state.grounds.find((g) => g.kind === "generator");
    const wagons = state.grounds.filter((g) => g.kind === "wagon");
    const noisePenalty =
        generator && wagons.length
            ? Math.max(
                  ...wagons.map((w) =>
                      Math.max(0, 1 - Math.hypot(w.x - generator.x, w.y - generator.y) / 22),
                  ),
              ) * 0.2
            : 0;
    return clamp(
        1 +
            performer.skill * 0.028 +
            performer.energy * 0.009 +
            performer.morale * 0.005 +
            (performer.costume ? 0.2 : 0) +
            (state.upgrades.includes("lighting") ? 0.2 : 0) -
            sequencePenalty -
            noisePenalty,
        1,
        5,
    );
}
function concessionRevenue(state: GameState, tickets: number): number {
    if (!state.upgrades.includes("popcorn")) return 0;
    const stall = state.grounds.find((g) => g.kind === "popcorn");
    const locationBonus = stall
        ? Math.max(0, 1 - Math.hypot(stall.x - 70, stall.y - 80) / 60) * 0.2
        : 0;
    return Math.round(tickets * (state.lineup.includes("break") ? 5 : 3) * (1 + locationBonus));
}
export function getForecast(state: GameState): {
    tickets: number;
    capacity: number;
    rating: number;
    revenue: number;
} {
    const city = CITIES.find((c) => c.id === state.cityId) ?? CITIES[0];
    const capacity = state.upgrades.includes("tent") ? 450 : 300;
    const promotion = Object.entries(state.marketing).reduce(
        (sum, [channel, count]) =>
            sum + count * (channel === "radio" ? 55 : channel === "social" ? 42 : 28),
        0,
    );
    const repeats = state.history.filter(
        (h) => h.cityId === state.cityId && h.day >= state.day - 3,
    ).length;
    const demand =
        (170 + state.reputation * 1.6 + promotion) *
        city.appeal *
        (city.weather === "rain" ? 0.83 : 1) *
        (35 / state.ticketPrice) ** 0.8 *
        Math.max(0.35, 1 - repeats * 0.16);
    const tickets = Math.round(clamp(demand, 0, capacity));
    const scores = state.lineup.map((id, index) => actScore(state, id, index)).filter(Boolean);
    const rating = scores.length
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        : 0;
    const snacks = concessionRevenue(state, tickets);
    return { tickets, capacity, rating, revenue: tickets * state.ticketPrice + snacks };
}
export function getShowReadiness(state: GameState): string[] {
    const problems: string[] = [];
    if (state.gameOver) problems.push("Your circus is out of funds. Start a new game.");
    if (!state.setup) problems.push("Set up your circus grounds first.");
    if (state.liveShow) problems.push("A show is already running.");
    const acts = state.lineup.map((id) => ACTS.find((a) => a.id === id));
    const duration = acts.reduce((sum, act) => sum + (act?.duration ?? 0), 0);
    if (duration < 90 || duration > 210) problems.push("Plan a show between 90 and 210 minutes.");
    if (acts.some((a) => !a)) problems.push("Remove unknown acts from the running order.");
    if (acts[0]?.kind === "break" || acts.at(-1)?.kind === "break")
        problems.push("Place the interval between acts.");
    const performing = acts.filter((a) => a && a.kind !== "break");
    if (!performing.length) problems.push("Add at least one performance.");
    if (performing.some((a) => !state.performers.find((p) => p.id === a?.performerId && p.hired)))
        problems.push("Hire the performers for every planned act.");
    if (performing.some((a) => state.performers.find((p) => p.id === a?.performerId)?.energy! < 20))
        problems.push("Your performers need rest before the show.");
    if (state.fuel < 5) problems.push("You need 5 L of fuel for the generator.");
    if (state.water < 10) problems.push("You need 10 L of water for the show.");
    if (Math.round(state.hour * 60) + duration > 23 * 60)
        problems.push("It is too late for this show. Rest until morning.");
    return problems;
}

function completeShow(state: GameState): GameState {
    const live = state.liveShow!;
    const rating =
        Math.round(
            clamp(
                live.scores.reduce((a, b) => a + b, 0) / Math.max(1, live.scores.length) +
                    (live.eventChoice === "repair" ? 0.05 : -0.12),
                1,
                5,
            ) * 10,
        ) / 10;
    const snacks = concessionRevenue(state, live.tickets);
    const revenue = live.tickets * state.ticketPrice + snacks;
    const wages = state.performers.filter((p) => p.hired).reduce((sum, p) => sum + p.wage, 0);
    const expenses = 150 + (live.eventChoice === "repair" ? 300 : 0);
    const result: ShowResult = {
        cityId: state.cityId,
        day: state.day,
        tickets: live.tickets,
        rating,
        revenue,
        wages,
        expenses,
        profit: revenue - wages - expenses,
    };
    const history = [...state.history, result];
    const season = Math.floor(history.length / 6) + 1;
    // Event repairs were paid when chosen; the final cash transfer only deducts wages and running costs.
    let next: GameState = {
        ...state,
        money: state.money + revenue - wages - 150,
        reputation: Math.round(clamp(state.reputation + (rating - 3) * 5) * 10) / 10,
        history,
        lastResult: result,
        liveShow: null,
        season,
        performers: state.performers.map((p) =>
            p.hired
                ? {
                      ...p,
                      skill: clamp(p.skill + 1),
                      morale: clamp(p.morale + Math.round((rating - 3) * 4)),
                  }
                : p,
        ),
    };
    next = note(
        next,
        `${CITIES.find((c) => c.id === state.cityId)?.name}: ${result.tickets} delighted guests, ${rating.toFixed(1)} stars. Net takings ${formatMoney(result.profit)}.`,
    );
    return season > state.season
        ? note(
              next,
              `Season ${state.season} complete! Your reputation carries into season ${season}.`,
          )
        : next;
}

function applyAction(state: GameState, action: GameAction): GameState {
    if (action.type === "RESET") return structuredClone(INITIAL_STATE);
    if (action.type === "IMPORT") {
        try {
            return parseSave(JSON.stringify(action.state));
        } catch {
            return state;
        }
    }
    if (action.type === "DISMISS_RESULT") return { ...state, lastResult: null };
    if (state.gameOver) return state;
    if (state.liveShow && !["ADVANCE_SHOW", "RESOLVE_EVENT"].includes(action.type)) return state;
    switch (action.type) {
        case "SETUP": {
            const city = CITIES.find((c) => c.id === state.cityId)!;
            if (state.setup || state.money < city.rent || state.water < 20) return state;
            return note(
                spendTime(
                    {
                        ...state,
                        setup: true,
                        money: state.money - city.rent,
                        water: state.water - 20,
                    },
                    3,
                ),
                `The big top is up in ${city.name}. Let the wonder begin.`,
            );
        }
        case "REST":
            return overnight(state);
        case "TRAIN": {
            const person = state.performers.find((p) => p.id === action.id);
            if (
                !state.setup ||
                !person?.hired ||
                person.energy < 25 ||
                person.skill >= 100 ||
                state.money < 180
            )
                return state;
            return note(
                spendTime(
                    {
                        ...state,
                        money: state.money - 180,
                        performers: state.performers.map((p) =>
                            p.id === action.id
                                ? { ...p, skill: clamp(p.skill + 6), energy: clamp(p.energy - 15) }
                                : p,
                        ),
                    },
                    2,
                ),
                `${person.name} perfected a little more of the impossible. Skill +6.`,
            );
        }
        case "HIRE": {
            const person = state.performers.find((p) => p.id === action.id);
            if (!person || person.hired || state.money < person.wage * 3) return state;
            return note(
                spendTime(
                    {
                        ...state,
                        money: state.money - person.wage * 3,
                        performers: state.performers.map((p) =>
                            p.id === action.id ? { ...p, hired: true } : p,
                        ),
                    },
                    1,
                ),
                `${person.name} has joined the family.`,
            );
        }
        case "COSTUME": {
            const person = state.performers.find((p) => p.id === action.id);
            if (!person?.hired || person.costume || state.money < 450) return state;
            return note(
                spendTime(
                    {
                        ...state,
                        money: state.money - 450,
                        performers: state.performers.map((p) =>
                            p.id === action.id ? { ...p, costume: true } : p,
                        ),
                    },
                    1,
                ),
                `A new stage costume for ${person.name}.`,
            );
        }
        case "SET_PRICE":
            return Number.isFinite(action.value)
                ? { ...state, ticketPrice: clamp(Math.round(action.value), 15, 70) }
                : state;
        case "PROMOTE": {
            const cost = MARKETING_COSTS[action.channel];
            if (
                !Object.hasOwn(MARKETING_COSTS, action.channel) ||
                state.money < cost ||
                (state.marketing[action.channel] ?? 0) >= 3
            )
                return state;
            return note(
                spendTime(
                    {
                        ...state,
                        money: state.money - cost,
                        marketing: {
                            ...state.marketing,
                            [action.channel]: (state.marketing[action.channel] ?? 0) + 1,
                        },
                    },
                    1,
                ),
                `Your ${action.channel} campaign is bringing the circus to town.`,
            );
        }
        case "SET_LINEUP":
            return action.lineup.length <= ACTS.length &&
                new Set(action.lineup).size === action.lineup.length &&
                action.lineup.every((id) => ACTS.some((a) => a.id === id))
                ? { ...state, lineup: [...action.lineup] }
                : state;
        case "SET_ROUTE":
            return action.route.length <= CITIES.length &&
                new Set(action.route).size === action.route.length &&
                action.route.every((id) => CITIES.some((c) => c.id === id))
                ? { ...state, route: [...action.route] }
                : state;
        case "TRAVEL": {
            if (action.cityId === state.cityId || !CITIES.some((c) => c.id === action.cityId))
                return state;
            const cost = getTravelCost(state, action.cityId);
            if (state.fuel < cost.fuel) return state;
            return note(
                spendTime(
                    {
                        ...state,
                        cityId: action.cityId,
                        route: state.route.filter(
                            (id) => id !== action.cityId && id !== state.cityId,
                        ),
                        fuel: state.fuel - cost.fuel,
                        setup: false,
                        marketing: { posters: 0, radio: 0, social: 0 },
                        lastResult: null,
                        performers: state.performers.map((p) =>
                            p.hired ? { ...p, energy: clamp(p.energy - cost.hours * 2) } : p,
                        ),
                    },
                    cost.hours + (state.setup ? 1 : 0),
                ),
                `Next stop: ${CITIES.find((c) => c.id === action.cityId)!.name}. A fresh audience awaits.`,
            );
        }
        case "BUY": {
            const cost = SHOP_COSTS[action.item];
            if (!Object.hasOwn(SHOP_COSTS, action.item) || state.money < cost) return state;
            if (action.item === "fuel")
                return spendTime(
                    { ...state, money: state.money - cost, fuel: state.fuel + 40 },
                    0.5,
                );
            if (action.item === "water")
                return spendTime(
                    { ...state, money: state.money - cost, water: state.water + 60 },
                    0.5,
                );
            if (state.upgrades.includes(action.item)) return state;
            return note(
                spendTime(
                    {
                        ...state,
                        money: state.money - cost,
                        upgrades: [...state.upgrades, action.item],
                        grounds:
                            action.item === "popcorn"
                                ? [
                                      ...state.grounds,
                                      { id: "popcorn", kind: "popcorn", x: 70, y: 80 },
                                  ]
                                : state.grounds,
                    },
                    2,
                ),
                `Your ${action.item} upgrade is ready for the next audience.`,
            );
        }
        case "MOVE_GROUND":
            return Number.isFinite(action.x) && Number.isFinite(action.y)
                ? {
                      ...state,
                      grounds: state.grounds.map((g) =>
                          g.id === action.id
                              ? { ...g, x: clamp(action.x, 10, 90), y: clamp(action.y, 15, 85) }
                              : g,
                      ),
                  }
                : state;
        case "START_SHOW": {
            if (getShowReadiness(state).length) return state;
            return note(
                {
                    ...state,
                    lastResult: null,
                    fuel: state.fuel - 5,
                    water: state.water - 10,
                    liveShow: {
                        step: 0,
                        scores: [],
                        eventResolved: false,
                        eventChoice: null,
                        tickets: getForecast(state).tickets,
                    },
                },
                "The lights dim. The audience hushes. It is showtime.",
            );
        }
        case "RESOLVE_EVENT": {
            if (
                !state.liveShow ||
                state.liveShow.step !== 1 ||
                state.liveShow.eventResolved ||
                !["repair", "improvise"].includes(action.choice)
            )
                return state;
            if (action.choice === "repair" && state.money < 300) return state;
            return note(
                {
                    ...state,
                    money: state.money - (action.choice === "repair" ? 300 : 0),
                    liveShow: {
                        ...state.liveShow,
                        eventResolved: true,
                        eventChoice: action.choice,
                    },
                },
                action.choice === "repair"
                    ? "The technician fixes the equipment. The show goes on!"
                    : "A little clowning covers the technical mishap. The audience laughs.",
            );
        }
        case "ADVANCE_SHOW": {
            const live = state.liveShow;
            if (!live || (live.step === 1 && !live.eventResolved)) return state;
            const act = ACTS.find((a) => a.id === state.lineup[live.step]);
            if (!act) return state;
            const scores =
                act.kind === "break"
                    ? live.scores
                    : [...live.scores, actScore(state, act.id, live.step)];
            const next = {
                ...state,
                hour: (Math.round(state.hour * 60) + act.duration) / 60,
                liveShow: { ...live, step: live.step + 1, scores },
                performers: state.performers.map((p) =>
                    act.kind === "break" && p.hired
                        ? { ...p, energy: clamp(p.energy + 5) }
                        : p.id === act.performerId
                          ? { ...p, energy: clamp(p.energy - 18) }
                          : p,
                ),
            };
            if (live.step + 1 < state.lineup.length) return next;
            const completed = completeShow(next);
            return completed.hour >= 23 ? overnight(completed) : completed;
        }
        default:
            return state;
    }
}
export function reducer(state: GameState, action: GameAction): GameState {
    const next = applyAction(state, action);
    if (!Number.isFinite(next.money) || !Number.isFinite(next.fuel) || !Number.isFinite(next.water))
        return state;
    return next.money <= 0 && !next.gameOver
        ? note(
              { ...next, gameOver: true, liveShow: null },
              "The cashbox is empty. Every great ringmaster learns from a first tour. Start again and try a new strategy.",
          )
        : next;
}
