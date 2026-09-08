import { useState } from "react";
import {
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    Check,
    Clock3,
    Droplets,
    House,
    Lightbulb,
    MapPin,
    Move,
    Popcorn,
    Sparkles,
    Tent,
    Volume2,
    Zap,
} from "lucide-react";
import CircusScene from "../components/CircusScene";
import { CITIES } from "../game/data";
import { formatMoney, getForecast, SHOP_COSTS } from "../game/engine";
import type { GameViewProps, GroundItem } from "../game/types";

const details: Record<
    GroundItem["kind"],
    { name: string; description: string; icon: typeof Tent }
> = {
    tent: {
        name: "The big top",
        description:
            "The heart of your little world. Leave a clear approach from the entrance so the evening can begin with a grand welcome.",
        icon: Tent,
    },
    wagon: {
        name: "Living wagon",
        description:
            "A quiet corner for your extraordinary people. Give the wagon some breathing room from the generator.",
        icon: House,
    },
    generator: {
        name: "Generator",
        description:
            "A little backstage magic that keeps the lights on. Keep this noisy neighbor away from the living wagon.",
        icon: Zap,
    },
    popcorn: {
        name: "Popcorn cart",
        description:
            "The smell of something wonderful. A spot close to the entrance puts your cart in the path of hungry guests.",
        icon: Popcorn,
    },
};

export default function Grounds({ state, dispatch, navigate }: GameViewProps) {
    const [selectedId, setSelectedId] = useState<string>("tent");
    const selected = state.grounds.find((item) => item.id === selectedId) || state.grounds[0];
    const city = CITIES.find((item) => item.id === state.cityId)!;
    const selectedDetails = details[selected.kind];
    const wagon = state.grounds.find((item) => item.kind === "wagon");
    const generator = state.grounds.find((item) => item.kind === "generator");
    const quiet =
        wagon && generator ? Math.hypot(wagon.x - generator.x, wagon.y - generator.y) >= 22 : true;
    const move = (x: number, y: number) =>
        dispatch({ type: "MOVE_GROUND", id: selected.id, x: selected.x + x, y: selected.y + y });
    const locked = !!state.liveShow || state.gameOver;
    const upgrades = [
        {
            id: "popcorn",
            name: "A little extra delight",
            detail: "Popcorn income at every show",
            icon: Popcorn,
        },
        {
            id: "lighting",
            name: "Let there be a little magic",
            detail: "Better lighting, happier audiences",
            icon: Lightbulb,
        },
        {
            id: "tent",
            name: "Room for more wonder",
            detail: "Grow your big top to 450 seats",
            icon: Tent,
        },
    ];
    return (
        <div className="grounds-page">
            <div className="page-heading">
                <div>
                    <span className="eyebrow">MAKE YOURSELF AT HOME</span>
                    <h1>Your little world.</h1>
                    <p className="muted">
                        A place to gather, a place to dream. Make every corner count.
                    </p>
                </div>
                <span className="tag">
                    <MapPin size={13} />
                    {city.name} · Riverside meadow
                </span>
            </div>
            <div className="grounds-layout">
                <div>
                    <div className="grounds-map">
                        <div className="grounds-map-label">
                            <i />
                            {state.setup
                                ? "Camp is ready for an audience"
                                : "Layout preview · select a building"}
                        </div>
                        <CircusScene
                            state={state}
                            interactive={!locked}
                            selectedId={selected.id}
                            onSelect={setSelectedId}
                        />
                        <div className="grounds-legend">
                            <span>
                                <i />
                                Performance & attractions
                            </span>
                            <span>
                                <i />
                                Living & backstage
                            </span>
                            <span>
                                <i />
                                Visitor paths
                            </span>
                        </div>
                    </div>
                    <div className="grounds-items">
                        {state.grounds.map((item) => {
                            const Icon = details[item.kind].icon;
                            return (
                                <button
                                    key={item.id}
                                    className={`ground-chip ${selected.id === item.id ? "active" : ""}`}
                                    onClick={() => setSelectedId(item.id)}
                                >
                                    <Icon size={14} />
                                    {details[item.kind].name}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <aside className="panel grounds-controls">
                    <span className="eyebrow">SELECTED BUILDING</span>
                    <h3>{selectedDetails.name}</h3>
                    <p className="muted">{selectedDetails.description}</p>
                    <div className="grounds-move">
                        <span />
                        <button
                            aria-label="Move building north"
                            disabled={locked || selected.y <= 15}
                            onClick={() => move(0, -5)}
                        >
                            <ArrowUp size={16} />
                        </button>
                        <span />
                        <button
                            aria-label="Move building west"
                            disabled={locked || selected.x <= 10}
                            onClick={() => move(-5, 0)}
                        >
                            <ArrowLeft size={16} />
                        </button>
                        <span>
                            <Move size={17} />
                        </span>
                        <button
                            aria-label="Move building east"
                            disabled={locked || selected.x >= 90}
                            onClick={() => move(5, 0)}
                        >
                            <ArrowRight size={16} />
                        </button>
                        <span />
                        <button
                            aria-label="Move building south"
                            disabled={locked || selected.y >= 85}
                            onClick={() => move(0, 5)}
                        >
                            <ArrowDown size={16} />
                        </button>
                        <span />
                    </div>
                    <div className="grounds-coordinates">
                        POSITION {selected.x} / {selected.y}
                    </div>
                    <p className="muted" style={{ fontSize: 11, marginTop: 22 }}>
                        Use the arrows to arrange your camp. Planning takes no time.
                    </p>
                </aside>
            </div>
            <div className="grounds-bottom">
                <section className="panel grounds-readiness">
                    <h3>A good place to begin</h3>
                    <div className="grounds-readiness-row">
                        <span>
                            <Tent size={15} />
                            Audience capacity
                        </span>
                        <strong>{getForecast(state).capacity} seats</strong>
                    </div>
                    <div className="grounds-readiness-row">
                        <span>
                            <Volume2 size={15} />
                            Wagon surroundings
                        </span>
                        <strong style={{ color: quiet ? "#5c7a4d" : "#b16b46" }}>
                            {quiet ? "Peaceful & quiet" : "A little noisy"}
                        </strong>
                    </div>
                    <div className="grounds-readiness-row">
                        <span>
                            <Droplets size={15} />
                            Water for setup
                        </span>
                        <strong>{state.setup ? "Ready" : "20 L"}</strong>
                    </div>
                    <div className="grounds-readiness-row">
                        <span>
                            <Clock3 size={15} />
                            Pitch & setup
                        </span>
                        <strong>
                            {state.setup ? "All settled in" : `${formatMoney(city.rent)} · 3 hours`}
                        </strong>
                    </div>
                    {state.setup ? (
                        <button className="btn btn-secondary" onClick={() => navigate("troupe")}>
                            <Check size={16} />
                            Camp ready · visit your troupe
                            <ArrowRight size={15} />
                        </button>
                    ) : (
                        <button
                            className="btn btn-primary"
                            disabled={locked || state.money < city.rent || state.water < 20}
                            onClick={() => dispatch({ type: "SETUP" })}
                        >
                            <Tent size={16} />
                            Set up the circus
                            <ArrowRight size={15} />
                        </button>
                    )}
                </section>
                <section className="panel grounds-readiness">
                    <h3>Little upgrades, bigger dreams</h3>
                    {upgrades.map((item) => {
                        const Icon = item.icon;
                        const owned = state.upgrades.includes(item.id);
                        return (
                            <div key={item.id} className="grounds-upgrade">
                                <div className="grounds-upgrade-icon">
                                    <Icon size={19} />
                                </div>
                                <div className="grounds-upgrade-copy">
                                    <strong>{item.name}</strong>
                                    <small>{item.detail}</small>
                                </div>
                                <button
                                    className="btn btn-secondary"
                                    disabled={owned || locked || state.money < SHOP_COSTS[item.id]}
                                    onClick={() => dispatch({ type: "BUY", item: item.id })}
                                >
                                    {owned ? (
                                        <>
                                            <Check size={12} />
                                            Owned
                                        </>
                                    ) : (
                                        formatMoney(SHOP_COSTS[item.id])
                                    )}
                                </button>
                            </div>
                        );
                    })}
                    <p className="muted" style={{ fontSize: 11, marginTop: 14 }}>
                        Every upgrade travels with your circus. Installation takes 2 hours.
                    </p>
                </section>
            </div>
            <div className="grounds-tip">
                <Sparkles size={17} />
                <div>
                    <strong>A ringmaster’s little wisdom</strong>
                    <br />A happy troupe begins with a quiet home. Keep the generator away from the
                    wagons, and place your popcorn cart near the entrance arch.
                </div>
            </div>
        </div>
    );
}
