export type Terrain = "grass" | "tree" | "rock" | "water";
export type BuildingKind =
    | "smallTent"
    | "bigTop"
    | "trailer"
    | "generator"
    | "waterTank"
    | "toilets"
    | "popcorn"
    | "lemonade"
    | "carousel"
    | "bench"
    | "flowers";
export type Tool = BuildingKind | "path" | "bulldoze" | "select";
export interface Tile {
    x: number;
    y: number;
    terrain: Terrain;
}
export interface BuildingDef {
    kind: BuildingKind;
    name: string;
    category: "Shows" | "Backstage" | "Guest services" | "Scenery";
    width: number;
    height: number;
    cost: number;
    upkeep: number;
    description: string;
    capacity?: number;
    power?: number;
    range?: number;
    beds?: number;
    color: string;
}
export interface Building {
    id: string;
    kind: BuildingKind;
    x: number;
    y: number;
    rotated: boolean;
    name: string;
    level: number;
}
export type Role = "acrobat" | "juggler" | "clown" | "magician" | "technician" | "vendor";
export interface Person {
    id: string;
    name: string;
    role: Role;
    skill: number;
    energy: number;
    morale: number;
    wage: number;
    hireCost: number;
    hired: boolean;
    homeId: string | null;
    assignmentId: string | null;
    color: string;
}
export interface ActDef {
    id: string;
    name: string;
    role: Role | "interval";
    duration: number;
    excitement: number;
    energy: number;
    requiresBigTop?: boolean;
}
export interface ScheduledAct {
    actId: string;
    personId: string | null;
}
export interface Booking {
    id: string;
    tentId: string;
    day: number;
    start: number;
    price: number;
    acts: ScheduledAct[];
    status: "scheduled" | "running" | "completed" | "cancelled";
    audience: number;
    rating: number;
    revenue: number;
}
export interface DayReport {
    day: number;
    guests: number;
    ticketRevenue: number;
    concessionRevenue: number;
    wages: number;
    upkeep: number;
    fuelCost: number;
    repairs: number;
    profit: number;
    rating: number;
    shows: number;
    notes: string[];
}
export interface Incident {
    title: string;
    description: string;
    bookingId: string;
    repairCost: number;
}
export interface Visitor {
    id: string;
    route: { x: number; y: number }[];
    progress: number;
    targetId: string;
    mood: "happy" | "neutral" | "unhappy";
    color: string;
}
export interface SiteState {
    version: 2;
    seed: number;
    size: number;
    tiles: Tile[];
    paths: string[];
    entrance: { x: number; y: number };
    buildings: Building[];
    people: Person[];
    bookings: Booking[];
    day: number;
    minute: number;
    phase: "planning" | "running" | "closed";
    money: number;
    fuel: number;
    water: number;
    reputation: number;
    marketing: number;
    visitors: Visitor[];
    report: DayReport | null;
    history: DayReport[];
    incident: Incident | null;
    log: string[];
    nextId: number;
    today: {
        repairs: number;
        guests: number;
        ticketRevenue: number;
        concessionRevenue: number;
        shows: number;
        ratings: number[];
        incidentUsed: boolean;
    };
    won: boolean;
    gameOver: boolean;
}
export type SiteAction =
    | { type: "BUILD"; kind: BuildingKind; x: number; y: number; rotated?: boolean }
    | { type: "PATH"; x: number; y: number }
    | { type: "BULLDOZE"; x: number; y: number }
    | { type: "HIRE"; id: string }
    | { type: "FIRE"; id: string }
    | { type: "ASSIGN_HOME"; id: string; buildingId: string | null }
    | { type: "ASSIGN_WORK"; id: string; buildingId: string | null }
    | { type: "TRAIN"; id: string }
    | { type: "BOOK"; booking: Omit<Booking, "id" | "status" | "audience" | "rating" | "revenue"> }
    | { type: "CANCEL_BOOKING"; id: string }
    | { type: "OPEN_DAY" }
    | { type: "TICK" }
    | { type: "CLOSE_REPORT" }
    | { type: "NEXT_DAY" }
    | { type: "RESOLVE_INCIDENT"; choice: "repair" | "improvise" }
    | { type: "BUY_RESOURCE"; resource: "fuel" | "water" }
    | { type: "MARKET" }
    | { type: "UPGRADE"; id: string }
    | { type: "STARTER_CAMP" }
    | { type: "RESET"; seed?: number }
    | { type: "IMPORT"; state: SiteState };
export interface BuildingStatus {
    connected: boolean;
    powered: boolean;
    watered: boolean;
    staffed: boolean;
    operational: boolean;
    issues: string[];
    bonuses: string[];
}
export interface SiteStats {
    beds: number;
    housed: number;
    powerSupply: number;
    powerDemand: number;
    connectedBuildings: number;
    comfort: number;
    dailyWages: number;
    dailyUpkeep: number;
    capacity: number;
}
export interface SiteViewProps {
    state: SiteState;
    dispatch: React.Dispatch<SiteAction>;
    navigate: (view: "site" | "crew" | "schedule" | "ledger") => void;
}
