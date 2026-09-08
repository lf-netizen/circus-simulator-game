import { useState } from "react";
import {
    ArrowRight,
    Check,
    CircleHelp,
    CircleX,
    Droplets,
    Footprints,
    Grid2X2,
    Hammer,
    House,
    Info,
    Leaf,
    MousePointer2,
    MoveUpRight,
    Plus,
    RotateCw,
    Sparkles,
    Tent,
    Trash2,
    Users,
    Volume2,
    Wrench,
    Zap,
    ZoomIn,
    ZoomOut,
} from "lucide-react";
import type { BuildingKind, SiteViewProps, Tool } from "./types";
import { ACTS, BUILDINGS } from "./data";
import { canPlace, footprint, getBuildingStatus, getStats } from "./spatial";
import { bookingDuration, formatMoney, formatTime, STARTER_COST, UPGRADE_COST } from "./engine";
import IsoMap from "./IsoMap";

const icons: Record<string, typeof Tent> = {
    smallTent: Tent,
    bigTop: Tent,
    trailer: House,
    generator: Zap,
    waterTank: Droplets,
    toilets: Users,
    popcorn: Sparkles,
    lemonade: Droplets,
    carousel: RotateCw,
    bench: House,
    flowers: Leaf,
};
export default function BuilderView({ state, dispatch, navigate }: SiteViewProps) {
    const [tool, setTool] = useState<Tool>("select");
    const [category, setCategory] = useState("Shows");
    const [rotated, setRotated] = useState(false);
    const [selectedId, setSelected] = useState<string | null>(null);
    const [grid, setGrid] = useState(true);
    const [overlay, setOverlay] = useState<"none" | "paths" | "power" | "water">("none");
    const [zoom, setZoom] = useState(1);
    const [message, setMessage] = useState("");
    const planning = state.phase === "planning" && !state.gameOver;
    const stats = getStats(state);
    const selected = state.buildings.find((b) => b.id === selectedId);
    const definition = selected ? BUILDINGS.find((d) => d.kind === selected.kind) : undefined;
    const status = selected ? getBuildingStatus(state, selected) : undefined;
    const chosen = BUILDINGS.find((d) => d.kind === tool);
    const totalHired = state.people.filter((p) => p.hired).length;
    const todays = state.bookings.filter((b) => b.day === state.day && b.status !== "cancelled");
    const selectTool = (next: Tool) => {
        setTool(next);
        setMessage("");
        setSelected(null);
    };
    const onTile = (x: number, y: number) => {
        if (!planning && tool !== "select") return;
        setMessage("");
        if (tool === "select") {
            const found = state.buildings.find((b) =>
                footprint(b).some((t) => t.x === x && t.y === y),
            );
            setSelected(found?.id ?? null);
            return;
        }
        if (tool === "path") {
            const tile = state.tiles.find((t) => t.x === x && t.y === y);
            if (tile?.terrain !== "grass") {
                setMessage("Clear trees or rocks first. Water cannot become a path.");
                return;
            }
            dispatch({ type: "PATH", x, y });
            return;
        }
        if (tool === "bulldoze") {
            dispatch({ type: "BULLDOZE", x, y });
            setSelected(null);
            return;
        }
        const reason = canPlace(state, tool as BuildingKind, x, y, rotated);
        if (reason) {
            setMessage(reason);
            return;
        }
        dispatch({ type: "BUILD", kind: tool as BuildingKind, x, y, rotated });
    };
    return (
        <>
            <div className="site-heading">
                <div>
                    <span className="eyebrow">
                        RIVERSIDE MEADOW · PLOT {String(state.seed).slice(-6)}
                    </span>
                    <h1>A little land. A grand ambition.</h1>
                    <p>Make a place worth coming to. Then give them a reason to stay.</p>
                </div>
                <div className="phase-pill">
                    <span className={`status-dot ${planning ? "ochre" : "green"}`} />
                    {planning
                        ? "Construction & preparation"
                        : state.phase === "running"
                          ? "The grounds are open"
                          : "The grounds are closed"}
                </div>
            </div>
            <div className="builder-layout">
                <aside className="build-catalog panel">
                    <div className="catalog-heading">
                        <Hammer size={17} />
                        <h2>Build your circus</h2>
                    </div>
                    <div className="build-basics">
                        <button
                            className={tool === "select" ? "selected" : ""}
                            onClick={() => selectTool("select")}
                            title="Inspect buildings"
                        >
                            <MousePointer2 size={18} />
                            <span>Select</span>
                        </button>
                        <button
                            className={tool === "path" ? "selected" : ""}
                            disabled={!planning}
                            onClick={() => selectTool("path")}
                        >
                            <Footprints size={18} />
                            <span>Paths</span>
                            <small>15 zł</small>
                        </button>
                        <button
                            className={tool === "bulldoze" ? "selected" : ""}
                            disabled={!planning}
                            onClick={() => selectTool("bulldoze")}
                        >
                            <Trash2 size={18} />
                            <span>Clear</span>
                            <small>½ refund</small>
                        </button>
                    </div>
                    <div className="catalog-tabs" role="tablist" aria-label="Building categories">
                        {["Shows", "Backstage", "Guest services", "Scenery"].map((c) => (
                            <button
                                role="tab"
                                aria-selected={category === c}
                                className={category === c ? "active" : ""}
                                key={c}
                                onClick={() => setCategory(c)}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                    <div className="catalog-items">
                        {BUILDINGS.filter((d) => d.category === category).map((d) => {
                            const Icon = icons[d.kind];
                            return (
                                <button
                                    key={d.kind}
                                    className={`build-card ${tool === d.kind ? "selected" : ""}`}
                                    disabled={!planning || state.money < d.cost}
                                    onClick={() => selectTool(d.kind)}
                                    aria-label={`Build ${d.name} for ${d.cost} zł`}
                                >
                                    <div className={`building-thumb ${d.kind}`}>
                                        <Icon size={31} strokeWidth={1.1} />
                                        <span>
                                            {d.width} × {d.height}
                                        </span>
                                    </div>
                                    <div className="build-card-copy">
                                        <strong>{d.name}</strong>
                                        <small>
                                            {d.capacity
                                                ? `${d.capacity} guests per show`
                                                : d.beds
                                                  ? `${d.beds} comfortable beds`
                                                  : d.kind === "generator"
                                                    ? "Power within 6 tiles"
                                                    : d.kind === "waterTank"
                                                      ? "Water within 6 tiles"
                                                      : d.category === "Scenery"
                                                        ? "Nearby comfort bonus"
                                                        : d.kind === "toilets"
                                                          ? "Happier, longer visits"
                                                          : "Income from your visitors"}
                                        </small>
                                        <span>
                                            {formatMoney(d.cost)} <Plus size={12} />
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    <div className="catalog-foot">
                        <Info size={14} />
                        <p>Placement costs money, never time. Hold and drag to paint paths.</p>
                    </div>
                </aside>
                <section className="map-panel-site">
                    <div className="map-toolbar">
                        <div className="map-view-label">
                            <span className="status-dot green" />
                            YOUR GROUNDS <span>20 × 20 tiles</span>
                        </div>
                        <div className="map-tools">
                            <button
                                aria-label="Toggle construction grid"
                                aria-pressed={grid}
                                className={grid ? "active" : ""}
                                onClick={() => setGrid(!grid)}
                            >
                                <Grid2X2 size={16} />
                            </button>
                            <span className="toolbar-divider" />
                            <button
                                aria-label="Zoom out"
                                disabled={zoom <= 0.7}
                                onClick={() => setZoom((v) => Math.max(0.7, v - 0.15))}
                            >
                                <ZoomOut size={17} />
                            </button>
                            <button
                                aria-label="Reset zoom"
                                className="zoom-label"
                                onClick={() => setZoom(1)}
                            >
                                {Math.round(zoom * 100)}%
                            </button>
                            <button
                                aria-label="Zoom in"
                                disabled={zoom >= 1.6}
                                onClick={() => setZoom((v) => Math.min(1.6, v + 0.15))}
                            >
                                <ZoomIn size={17} />
                            </button>
                        </div>
                    </div>
                    <IsoMap
                        state={state}
                        tool={planning ? tool : "select"}
                        rotated={rotated}
                        selectedId={selectedId}
                        onTile={onTile}
                        onSelect={(id) => {
                            setSelected(id);
                            setTool("select");
                        }}
                        showGrid={grid}
                        overlay={overlay}
                        zoom={zoom}
                    />
                    <div className="map-bottom-toolbar">
                        <div className="overlay-tabs" role="group" aria-label="Map overlays">
                            {[
                                { id: "none", label: "Natural", Icon: Leaf },
                                { id: "paths", label: "Access", Icon: Footprints },
                                { id: "power", label: "Power", Icon: Zap },
                                { id: "water", label: "Water", Icon: Droplets },
                            ].map(({ id, label, Icon }) => (
                                <button
                                    key={id}
                                    aria-pressed={overlay === id}
                                    className={overlay === id ? "active" : ""}
                                    onClick={() => setOverlay(id as typeof overlay)}
                                >
                                    <Icon size={14} />
                                    {label}
                                </button>
                            ))}
                        </div>
                        <span className="map-seed">SEED {state.seed}</span>
                    </div>
                    <div className="build-context" aria-live="polite">
                        {message ? (
                            <>
                                <CircleX size={16} />
                                <span>{message}</span>
                            </>
                        ) : chosen && planning ? (
                            <>
                                <Hammer size={15} />
                                <span>
                                    <strong>{chosen.name}</strong> · {chosen.width}×{chosen.height}{" "}
                                    · {formatMoney(chosen.cost)} · Click a clear tile to place
                                </span>
                                <button
                                    className="text-button"
                                    onClick={() => setRotated(!rotated)}
                                >
                                    <RotateCw size={14} />
                                    {rotated ? "Rotated" : "Rotate"}
                                </button>
                            </>
                        ) : tool === "path" && planning ? (
                            <>
                                <Footprints size={15} />
                                <span>
                                    Drag across grass to lay paths. Connect every building to the
                                    entrance.
                                </span>
                            </>
                        ) : tool === "bulldoze" && planning ? (
                            <>
                                <Trash2 size={15} />
                                <span>
                                    Click to remove. Buildings refund 50%; clearing trees costs 40
                                    zł, rocks 100 zł.
                                </span>
                            </>
                        ) : (
                            <>
                                <MousePointer2 size={15} />
                                <span>
                                    Click a building to inspect it. Arrow keys move the tile cursor;
                                    Enter selects or builds.
                                </span>
                            </>
                        )}
                    </div>
                </section>
                <aside className="site-inspector">
                    {!selected && state.phase !== "planning" ? (
                        <section className="panel operations-card">
                            <span className="eyebrow">TODAY AT THE CIRCUS</span>
                            <h2>
                                {state.phase === "running"
                                    ? "The meadow comes alive."
                                    : "The evening settles in."}
                            </h2>
                            <div className="operations-numbers">
                                <div>
                                    <strong>{state.today.guests}</strong>
                                    <span>guests welcomed</span>
                                </div>
                                <div>
                                    <strong>
                                        {formatMoney(
                                            state.today.ticketRevenue +
                                                state.today.concessionRevenue,
                                        )}
                                    </strong>
                                    <span>takings so far</span>
                                </div>
                            </div>
                            <span className="eyebrow">ON THE BILL</span>
                            <div className="operations-bill">
                                {todays
                                    .sort((a, b) => a.start - b.start)
                                    .map((booking) => {
                                        let elapsed = state.minute - booking.start;
                                        const act = booking.acts.find((a) => {
                                            const duration =
                                                ACTS.find((d) => d.id === a.actId)?.duration ?? 0;
                                            if (elapsed < duration) return true;
                                            elapsed -= duration;
                                            return false;
                                        });
                                        return (
                                            <button
                                                key={booking.id}
                                                onClick={() => navigate("schedule")}
                                            >
                                                <span className={`bill-dot ${booking.status}`} />
                                                <div>
                                                    <span>
                                                        {formatTime(booking.start)} ·{" "}
                                                        {
                                                            state.buildings.find(
                                                                (b) => b.id === booking.tentId,
                                                            )?.name
                                                        }
                                                    </span>
                                                    <strong>
                                                        {booking.status === "running"
                                                            ? ACTS.find((a) => a.id === act?.actId)
                                                                  ?.name
                                                            : booking.status === "completed"
                                                              ? `${booking.audience} guests · ${booking.rating.toFixed(1)} stars`
                                                              : "The stage is getting ready"}
                                                    </strong>
                                                    {booking.status === "running" && (
                                                        <div className="progress-track">
                                                            <span
                                                                style={{
                                                                    width: `${Math.min(100, ((state.minute - booking.start) / bookingDuration(booking)) * 100)}%`,
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                                <ArrowRight size={12} />
                                            </button>
                                        );
                                    })}
                            </div>
                            <div className="operations-help">
                                <Users size={16} />
                                <p>
                                    The walkers represent groups of guests. Their routes follow your
                                    connected paths to tents and concessions.
                                </p>
                            </div>
                            <button
                                className="btn btn-secondary w-full"
                                onClick={() => navigate("schedule")}
                            >
                                View today’s programme <ArrowRight size={14} />
                            </button>
                        </section>
                    ) : selected && definition && status ? (
                        <section className="panel inspector-card">
                            <span className="eyebrow">BUILDING INSPECTOR</span>
                            <div className={`inspector-icon ${selected.kind}`}>
                                {(() => {
                                    const Icon = icons[selected.kind];
                                    return <Icon size={35} strokeWidth={1.1} />;
                                })()}
                            </div>
                            <h2>{selected.name}</h2>
                            <p>{definition.description}</p>
                            <span
                                className={`tag ${status.operational ? "tag-green" : "tag-warning"}`}
                            >
                                {status.operational ? <Check size={12} /> : <Wrench size={12} />}{" "}
                                {status.operational ? "Ready for the day" : "Needs attention"}
                            </span>
                            <div className="connection-checks">
                                {[
                                    {
                                        label: "Connected to entrance",
                                        value: status.connected,
                                        Icon: Footprints,
                                    },
                                    { label: "Power coverage", value: status.powered, Icon: Zap },
                                    {
                                        label: "Water supply",
                                        value: status.watered,
                                        Icon: Droplets,
                                    },
                                    { label: "Staff assigned", value: status.staffed, Icon: Users },
                                ].map(({ label, value, Icon }) => (
                                    <div key={label}>
                                        <Icon size={14} />
                                        <span>{label}</span>
                                        {value ? (
                                            <Check className="positive" size={14} />
                                        ) : (
                                            <CircleX className="negative" size={14} />
                                        )}
                                    </div>
                                ))}
                            </div>
                            {status.issues.length > 0 && (
                                <div className="inspector-issues">
                                    {status.issues.map((issue) => (
                                        <p key={issue}>{issue}</p>
                                    ))}
                                </div>
                            )}
                            {status.bonuses.length > 0 && (
                                <div className="inspector-bonuses">
                                    {status.bonuses.map((bonus) => (
                                        <p key={bonus}>
                                            <Sparkles size={12} />
                                            {bonus}
                                        </p>
                                    ))}
                                </div>
                            )}
                            <div className="inspector-detail">
                                <span>Daily maintenance</span>
                                <strong>{formatMoney(definition.upkeep)}</strong>
                            </div>
                            {definition.capacity && (
                                <>
                                    <div className="inspector-detail">
                                        <span>Show capacity</span>
                                        <strong>
                                            {Math.round(
                                                definition.capacity *
                                                    (selected.level > 1 ? 1.2 : 1),
                                            )}{" "}
                                            seats
                                        </strong>
                                    </div>
                                    <button
                                        className="btn btn-primary w-full"
                                        onClick={() => navigate("schedule")}
                                    >
                                        Schedule a performance <ArrowRight size={14} />
                                    </button>
                                    <button
                                        className="btn btn-secondary w-full"
                                        disabled={
                                            !planning ||
                                            selected.level >= 2 ||
                                            state.money < UPGRADE_COST
                                        }
                                        onClick={() =>
                                            dispatch({ type: "UPGRADE", id: selected.id })
                                        }
                                    >
                                        {selected.level >= 2 ? (
                                            <>
                                                <Check size={14} /> Premium seating installed
                                            </>
                                        ) : (
                                            <>Improve seating · {formatMoney(UPGRADE_COST)}</>
                                        )}
                                    </button>
                                </>
                            )}
                            {[
                                "smallTent",
                                "bigTop",
                                "popcorn",
                                "lemonade",
                                "carousel",
                                "trailer",
                            ].includes(selected.kind) && (
                                <button
                                    className="btn btn-secondary w-full"
                                    onClick={() => navigate("crew")}
                                >
                                    Manage people <Users size={14} />
                                </button>
                            )}
                            <small className="muted">
                                Position {selected.x}, {selected.y} · {definition.width}×
                                {definition.height} footprint
                            </small>
                        </section>
                    ) : (
                        <section className="panel inspector-card">
                            <span className="eyebrow">THE RINGMASTER’S CHECKLIST</span>
                            <h2>A place for a little wonder.</h2>
                            <p>Five small steps between an empty field and a standing ovation.</p>
                            <div className="opening-checklist">
                                {[
                                    {
                                        done: state.buildings.some(
                                            (b) => b.kind === "smallTent" || b.kind === "bigTop",
                                        ),
                                        title: "Raise your first tent",
                                        sub: "Choose Shows from the build menu.",
                                        view: "site" as const,
                                    },
                                    {
                                        done:
                                            stats.connectedBuildings >=
                                            Math.max(1, state.buildings.length),
                                        title: "Connect your grounds",
                                        sub: "Paths lead back to the entrance.",
                                        view: "site" as const,
                                    },
                                    {
                                        done:
                                            state.buildings.some((b) => b.kind === "generator") &&
                                            state.buildings.some((b) => b.kind === "waterTank"),
                                        title: "Bring the essentials",
                                        sub: "Power, water, and a quiet home.",
                                        view: "site" as const,
                                    },
                                    {
                                        done: totalHired >= 4,
                                        title: "Find your people",
                                        sub: "Performers and a tent technician.",
                                        view: "crew" as const,
                                    },
                                    {
                                        done: todays.length > 0,
                                        title: "Give them a show",
                                        sub: "Book an hour or more in a tent.",
                                        view: "schedule" as const,
                                    },
                                ].map((item, i) => (
                                    <button
                                        key={item.title}
                                        onClick={() =>
                                            item.view === "site"
                                                ? selectTool(
                                                      i === 0
                                                          ? "smallTent"
                                                          : i === 1
                                                            ? "path"
                                                            : "generator",
                                                  )
                                                : navigate(item.view)
                                        }
                                    >
                                        <span className={item.done ? "done" : ""}>
                                            {item.done ? <Check size={12} /> : i + 1}
                                        </span>
                                        <div>
                                            <strong>{item.title}</strong>
                                            <small>{item.sub}</small>
                                        </div>
                                        <MoveUpRight size={13} />
                                    </button>
                                ))}
                            </div>
                            {state.buildings.length === 0 &&
                                totalHired === 0 &&
                                state.bookings.length === 0 &&
                                state.paths.length === 5 && (
                                    <div className="starter-offer">
                                        <span className="eyebrow">LEARN BY DOING</span>
                                        <p>
                                            A starter blueprint buys a tent, utilities, two
                                            trailers, popcorn, five crew, and a noon show. Then make
                                            it your own.
                                        </p>
                                        <button
                                            className="btn btn-primary w-full"
                                            disabled={!planning || state.money < STARTER_COST}
                                            onClick={() => {
                                                dispatch({ type: "STARTER_CAMP" });
                                                setTool("select");
                                            }}
                                        >
                                            Build starter camp <ArrowRight size={14} />
                                        </button>
                                        <small>
                                            All purchases included · {formatMoney(STARTER_COST)}
                                        </small>
                                    </div>
                                )}
                        </section>
                    )}
                    <div className="plot-note">
                        <CircleHelp size={16} />
                        <p>
                            {planning
                                ? "Need room? Clear trees and rocks. Keep housing away from noisy generators."
                                : state.phase === "running"
                                  ? "Watch visitors follow the paths you built. Shows start at their scheduled time."
                                  : "Review today’s results, then prepare for another day."}
                        </p>
                    </div>
                </aside>
            </div>
            <div className="site-summary-strip">
                <div>
                    <Tent size={19} />
                    <span>
                        Seats under canvas<strong>{stats.capacity}</strong>
                    </span>
                </div>
                <div>
                    <House size={19} />
                    <span>
                        People housed
                        <strong>
                            {stats.housed} / {totalHired}
                            <small> · {stats.beds} beds</small>
                        </strong>
                    </span>
                </div>
                <div>
                    <Zap size={19} />
                    <span>
                        Power demand
                        <strong>
                            {stats.powerDemand} / {stats.powerSupply}
                            <small> kW</small>
                        </strong>
                    </span>
                </div>
                <div>
                    <Volume2 size={19} />
                    <span>
                        Guest comfort
                        <strong>
                            {stats.comfort}
                            <small> / 100</small>
                        </strong>
                    </span>
                </div>
                <div>
                    <Users size={19} />
                    <span>
                        Daily wages & upkeep
                        <strong>{formatMoney(stats.dailyWages + stats.dailyUpkeep)}</strong>
                    </span>
                </div>
            </div>
        </>
    );
}
