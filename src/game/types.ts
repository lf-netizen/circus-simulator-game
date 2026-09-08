export type View =
    "overview" | "route" | "grounds" | "troupe" | "show" | "marketing" | "supplies" | "rankings";
export type ActKind = "acrobat" | "juggler" | "clown" | "magic";
export interface Performer {
    id: string;
    name: string;
    role: string;
    kind: ActKind;
    skill: number;
    energy: number;
    morale: number;
    wage: number;
    hired: boolean;
    costume: boolean;
    color: string;
}
export interface City {
    id: string;
    name: string;
    population: string;
    x: number;
    y: number;
    rent: number;
    appeal: number;
    weather: "sun" | "cloud" | "rain";
    description: string;
}
export interface Act {
    id: string;
    name: string;
    performerId: string;
    kind: ActKind | "break";
    duration: number;
    excitement: number;
}
export interface ShowResult {
    cityId: string;
    day: number;
    tickets: number;
    rating: number;
    revenue: number;
    wages: number;
    expenses: number;
    profit: number;
}
export interface GroundItem {
    id: string;
    kind: "tent" | "wagon" | "popcorn" | "generator";
    x: number;
    y: number;
}
export interface LiveShow {
    step: number;
    scores: number[];
    eventResolved: boolean;
    eventChoice: string | null;
    tickets: number;
}
export interface GameState {
    version: 1;
    circusName: string;
    day: number;
    hour: number;
    money: number;
    fuel: number;
    water: number;
    reputation: number;
    cityId: string;
    route: string[];
    setup: boolean;
    ticketPrice: number;
    marketing: Record<string, number>;
    performers: Performer[];
    lineup: string[];
    grounds: GroundItem[];
    upgrades: string[];
    history: ShowResult[];
    log: string[];
    liveShow: LiveShow | null;
    lastResult: ShowResult | null;
    season: number;
    gameOver: boolean;
}
export type GameAction =
    | { type: "SETUP" }
    | { type: "REST" }
    | { type: "TRAIN"; id: string }
    | { type: "HIRE"; id: string }
    | { type: "COSTUME"; id: string }
    | { type: "SET_PRICE"; value: number }
    | { type: "PROMOTE"; channel: string }
    | { type: "SET_LINEUP"; lineup: string[] }
    | { type: "SET_ROUTE"; route: string[] }
    | { type: "TRAVEL"; cityId: string }
    | { type: "BUY"; item: string }
    | { type: "MOVE_GROUND"; id: string; x: number; y: number }
    | { type: "START_SHOW" }
    | { type: "ADVANCE_SHOW" }
    | { type: "RESOLVE_EVENT"; choice: string }
    | { type: "DISMISS_RESULT" }
    | { type: "IMPORT"; state: GameState }
    | { type: "RESET" };
export interface GameViewProps {
    state: GameState;
    dispatch: React.Dispatch<GameAction>;
    navigate: (view: View) => void;
}
