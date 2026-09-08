import {
    ArrowRight,
    ArrowUpRight,
    Check,
    ChevronRight,
    Clock3,
    Flag,
    MapPin,
    Megaphone,
    Moon,
    Sparkles,
    Star,
    Sun,
    Tent,
    Ticket,
    Users,
} from "lucide-react";
import type { GameViewProps } from "../game/types";
import { CITIES } from "../game/data";
import { formatMoney, getForecast, getShowReadiness } from "../game/engine";
import CircusScene from "../components/CircusScene";
import RouteMap from "../components/RouteMap";
export default function Overview({ state, dispatch, navigate }: GameViewProps) {
    const city = CITIES.find((c) => c.id === state.cityId)!;
    const forecast = getForecast(state);
    const readiness = getShowReadiness(state);
    const troupe = state.performers.filter((p) => p.hired);
    const energy = Math.round(
        troupe.reduce((a, p) => a + p.energy, 0) / Math.max(1, troupe.length),
    );
    const spent = Object.values(state.marketing).reduce((a, b) => a + b, 0);
    return (
        <>
            <div className="page-heading overview-heading">
                <div>
                    <div className="eyebrow">
                        <span className="tiny-star">✦</span> THE WORLD IS YOUR RING
                    </div>
                    <h1>The show starts with you.</h1>
                    <p>A new town. A little ambition. A whole lot of magic to make.</p>
                </div>
                <button
                    className="btn btn-secondary"
                    onClick={() => dispatch({ type: "REST" })}
                    disabled={!!state.liveShow || state.gameOver}
                >
                    <Moon size={16} /> Rest until morning
                </button>
            </div>
            <div className="overview-grid">
                <section className="panel camp-hero">
                    <div className="camp-top">
                        <div>
                            <span className="eyebrow">YOUR LITTLE CORNER OF THE WORLD</span>
                            <h2>
                                {city.name} <span>·</span> Riverside grounds
                            </h2>
                        </div>
                        <span className={`tag ${state.setup ? "tag-green" : ""}`}>
                            <i className="dot green" />
                            {state.setup ? "Camp is ready" : "Ready to set up"}
                        </span>
                    </div>
                    <CircusScene state={state} />
                    <div className="camp-bottom">
                        <span>
                            <MapPin size={15} /> {city.name}, Poland
                        </span>
                        <span>
                            <Sun size={16} />
                            {city.weather === "rain"
                                ? "Rain expected"
                                : city.weather === "cloud"
                                  ? "Partly cloudy"
                                  : "A fine day for a circus"}
                        </span>
                        <button onClick={() => navigate("grounds")}>
                            Explore grounds <ArrowUpRight size={16} />
                        </button>
                    </div>
                </section>
                <section className="panel next-show">
                    <div className="panel-heading">
                        <span className="eyebrow">THE NEXT BIG THING</span>
                        <Sparkles size={17} />
                    </div>
                    <div className="show-ticket">
                        <div className="ticket-stars">✦ &nbsp; ★ &nbsp; ✦</div>
                        <span>ONE NIGHT OF WONDER</span>
                        <h2>
                            The Grand
                            <br />
                            Premiere
                        </h2>
                        <div className="ticket-rule" />
                        <p>
                            {city.name} · Season {state.season}
                        </p>
                        <small>THE GRAND TOUR CIRCUS</small>
                    </div>
                    <div className="show-facts">
                        <span>
                            <Ticket size={16} /> Expected audience{" "}
                            <strong>
                                {forecast.tickets} / {forecast.capacity}
                            </strong>
                        </span>
                        <div className="progress-track">
                            <span
                                style={{
                                    width: `${(forecast.tickets / forecast.capacity) * 100}%`,
                                }}
                            />
                        </div>
                        <span>
                            <Clock3 size={16} /> Showtime{" "}
                            <strong>
                                {state.liveShow
                                    ? "Live in the ring"
                                    : state.setup
                                      ? "On your cue"
                                      : "After camp setup"}
                            </strong>
                        </span>
                    </div>
                    <button
                        className="btn btn-primary w-full"
                        onClick={() =>
                            state.setup ? navigate("show") : dispatch({ type: "SETUP" })
                        }
                        disabled={
                            state.gameOver ||
                            (!state.setup && (state.money < city.rent || state.water < 20))
                        }
                    >
                        {state.liveShow
                            ? "Return to the show"
                            : state.setup
                              ? "Plan your performance"
                              : "Set up camp"}{" "}
                        <ArrowRight size={17} />
                    </button>
                    <small className="show-hint">
                        {state.setup
                            ? readiness.length
                                ? "A great evening starts with a great plan."
                                : "Your troupe is ready. Let’s make some magic."
                            : `3 hours · ${formatMoney(city.rent)} · 20 L water`}
                    </small>
                </section>
                <div className="stat-grid overview-stats">
                    <button className="panel stat-card" onClick={() => navigate("marketing")}>
                        <span className="stat-icon rust">
                            <Ticket size={19} />
                        </span>
                        <span>Expected box office</span>
                        <strong>{formatMoney(forecast.revenue)}</strong>
                        <small>
                            Give the town something to talk about <ArrowUpRight size={12} />
                        </small>
                    </button>
                    <button className="panel stat-card" onClick={() => navigate("troupe")}>
                        <span className="stat-icon green">
                            <Users size={19} />
                        </span>
                        <span>Troupe readiness</span>
                        <strong>
                            {energy}% <em>{energy > 65 ? "In good spirits" : "Time for a rest"}</em>
                        </strong>
                        <small>
                            {troupe.length} performers ready for their moment{" "}
                            <ArrowUpRight size={12} />
                        </small>
                    </button>
                    <button className="panel stat-card" onClick={() => navigate("rankings")}>
                        <span className="stat-icon ochre">
                            <Star size={19} />
                        </span>
                        <span>Your reputation</span>
                        <strong>
                            {Number(state.reputation.toFixed(1))}
                            <em>
                                {state.reputation === 0 ? "A fresh beginning" : "Making a name"}
                            </em>
                        </strong>
                        <small>
                            {state.history.length} performances in your story{" "}
                            <ArrowUpRight size={12} />
                        </small>
                    </button>
                </div>
                <section className="panel preparations">
                    <div className="panel-heading">
                        <h2>A little preparation goes a long way</h2>
                        <span className="eyebrow">BEFORE THE CURTAIN</span>
                    </div>
                    {[
                        {
                            title: "Make yourself at home",
                            desc: "Raise the big top and settle into the grounds.",
                            done: state.setup,
                            view: "grounds" as const,
                            Icon: Tent,
                        },
                        {
                            title: "Get the troupe in tune",
                            desc: "Train your performers or give them a well-earned rest.",
                            done: troupe.some((p) => p.skill > 76),
                            view: "troupe" as const,
                            Icon: Users,
                        },
                        {
                            title: "Let the town know",
                            desc: "Put up posters, buy airtime, and fill those seats.",
                            done: spent > 0,
                            view: "marketing" as const,
                            Icon: Megaphone,
                        },
                        {
                            title: "Put together a little magic",
                            desc: "Build your running order and take it to the ring.",
                            done: state.history.length > 0,
                            view: "show" as const,
                            Icon: Sparkles,
                        },
                    ].map(({ title, desc, done, view, Icon }, i) => (
                        <button className="prep-row" onClick={() => navigate(view)} key={title}>
                            <span className={`prep-check ${done ? "done" : ""}`}>
                                {done ? <Check size={14} /> : String(i + 1).padStart(2, "0")}
                            </span>
                            <div>
                                <strong>{title}</strong>
                                <small>{desc}</small>
                            </div>
                            <Icon className="prep-icon" size={18} />
                            <ChevronRight size={16} />
                        </button>
                    ))}
                </section>
                <section className="panel road-card">
                    <div className="panel-heading">
                        <h2>The road ahead</h2>
                        <button className="text-link" onClick={() => navigate("route")}>
                            Plan route <ArrowUpRight size={14} />
                        </button>
                    </div>
                    <RouteMap state={state} compact />
                    <div className="road-caption">
                        <Flag size={17} />
                        <div>
                            <strong>
                                {state.route.filter((id) => id !== state.cityId).length} stops on
                                the horizon
                            </strong>
                            <small>A new audience is just down the road.</small>
                        </div>
                    </div>
                </section>
                <section className="panel camp-journal">
                    <div className="panel-heading">
                        <h2>Whispers around the campfire</h2>
                        <span className="eyebrow">YOUR JOURNAL</span>
                    </div>
                    {state.log.slice(0, 3).map((line, i) => (
                        <div className="journal-line" key={`${i}-${line}`}>
                            <span className="journal-dot" />
                            <p>{line}</p>
                            <span>{i === 0 ? "LATEST" : ""}</span>
                        </div>
                    ))}
                </section>
            </div>
        </>
    );
}
