import { useState } from "react";
import {
    ArrowRight,
    ArrowUpRight,
    Check,
    Cloud,
    CloudRain,
    Droplets,
    Fuel,
    MapPin,
    Megaphone,
    Radio,
    Sun,
    Ticket,
    TrendingUp,
    Trophy,
    Users,
    Zap,
    ShoppingBag,
    Tent,
    Popcorn,
} from "lucide-react";
import type { GameViewProps } from "../game/types";
import { CITIES } from "../game/data";
import { formatMoney, getForecast, getTravelCost, MARKETING_COSTS } from "../game/engine";
import RouteMap from "../components/RouteMap";
export function Route({ state, dispatch }: GameViewProps) {
    const [selected, setSelected] = useState(
        state.route.find((id) => id !== state.cityId) ||
            CITIES.find((c) => c.id !== state.cityId)!.id,
    );
    const city = CITIES.find((c) => c.id === selected)!;
    const cost = getTravelCost(state, selected);
    const Weather = city.weather === "rain" ? CloudRain : city.weather === "cloud" ? Cloud : Sun;
    return (
        <>
            <div className="page-heading">
                <div>
                    <span className="eyebrow">THE OPEN ROAD</span>
                    <h1>A little further. A little grander.</h1>
                    <p>Find your next audience. Make every kilometre count.</p>
                </div>
                <span className="tag">
                    <MapPin size={14} /> Touring Poland
                </span>
            </div>
            <div className="route-layout">
                <section className="panel map-panel">
                    <div className="panel-heading">
                        <h2>Your season, on the map</h2>
                        <span className="muted">Select a city to explore</span>
                    </div>
                    <RouteMap state={state} selected={selected} onSelect={setSelected} />
                    <div className="map-legend">
                        <span>
                            <i className="dot green" />
                            Your circus
                        </span>
                        <span>
                            <i className="dot rust" />
                            Planned route
                        </span>
                        <span>8 cities. Endless possibilities.</span>
                    </div>
                </section>
                <section className="panel city-detail">
                    <span className="eyebrow">
                        {selected === state.cityId ? "CURRENT STOP" : "A NEW AUDIENCE AWAITS"}
                    </span>
                    <h2>{city.name}</h2>
                    <p>{city.description}</p>
                    <div className="city-weather">
                        <Weather size={30} />
                        <div>
                            <strong>
                                {city.weather === "rain"
                                    ? "Rain on the horizon"
                                    : city.weather === "cloud"
                                      ? "A little cloudy"
                                      : "Clear skies ahead"}
                            </strong>
                            <small>Forecast for your arrival</small>
                        </div>
                    </div>
                    <dl className="detail-list">
                        <div>
                            <dt>Population</dt>
                            <dd>{city.population}</dd>
                        </div>
                        <div>
                            <dt>Ground rental</dt>
                            <dd>{formatMoney(city.rent)}</dd>
                        </div>
                        <div>
                            <dt>Travel time</dt>
                            <dd>{cost.hours} hours</dd>
                        </div>
                        <div>
                            <dt>Fuel needed</dt>
                            <dd>{cost.fuel} L</dd>
                        </div>
                        <div>
                            <dt>Your local reputation</dt>
                            <dd>
                                {state.history.filter((r) => r.cityId === selected).length
                                    ? "An audience remembers you"
                                    : "A fresh beginning"}
                            </dd>
                        </div>
                    </dl>
                    {selected !== state.cityId && (
                        <>
                            <button
                                className="btn btn-secondary w-full"
                                disabled={!!state.liveShow}
                                onClick={() =>
                                    dispatch({
                                        type: "SET_ROUTE",
                                        route: state.route.includes(selected)
                                            ? state.route.filter((id) => id !== selected)
                                            : [...state.route, selected],
                                    })
                                }
                            >
                                {state.route.includes(selected) ? (
                                    <Check size={16} />
                                ) : (
                                    <MapPin size={16} />
                                )}{" "}
                                {state.route.includes(selected)
                                    ? "Remove from route"
                                    : "Add to route"}
                            </button>
                            <button
                                className="btn btn-primary w-full"
                                disabled={
                                    state.fuel < cost.fuel || !!state.liveShow || state.gameOver
                                }
                                onClick={() => dispatch({ type: "TRAVEL", cityId: selected })}
                            >
                                Pack up & travel <ArrowRight size={16} />
                            </button>
                            <small className="muted">
                                {state.fuel < cost.fuel
                                    ? "Refuel in Supplies before travelling."
                                    : "Camp packs automatically. Marketing is local to each stop."}
                            </small>
                        </>
                    )}
                </section>
            </div>
            <section className="panel planned-stops">
                <div className="panel-heading">
                    <h2>The road ahead</h2>
                    <span className="eyebrow">YOUR ITINERARY</span>
                </div>
                <div className="stop-list">
                    <div className="stop">
                        <span className="stop-number current">
                            <Tent size={18} />
                        </span>
                        <div>
                            <small>YOU ARE HERE</small>
                            <strong>{CITIES.find((c) => c.id === state.cityId)?.name}</strong>
                        </div>
                    </div>
                    {state.route
                        .filter((id) => id !== state.cityId)
                        .map((id, i) => (
                            <div className="stop" key={id}>
                                <ArrowRight size={17} />
                                <button
                                    className="stop-number"
                                    onClick={() => setSelected(id)}
                                    aria-label={`View stop ${i + 1}`}
                                >
                                    {i + 1}
                                </button>
                                <div>
                                    <small>NEXT STOP {i + 1}</small>
                                    <strong>{CITIES.find((c) => c.id === id)?.name}</strong>
                                </div>
                                <button
                                    className="icon-btn"
                                    aria-label={`Remove ${CITIES.find((c) => c.id === id)?.name} from route`}
                                    onClick={() =>
                                        dispatch({
                                            type: "SET_ROUTE",
                                            route: state.route.filter((v) => v !== id),
                                        })
                                    }
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                </div>
            </section>
        </>
    );
}
export function Marketing({ state, dispatch }: GameViewProps) {
    const forecast = getForecast(state);
    const city = CITIES.find((c) => c.id === state.cityId)!;
    return (
        <>
            <div className="page-heading">
                <div>
                    <span className="eyebrow">FILL THE BIG TOP</span>
                    <h1>Give the town something to talk about.</h1>
                    <p>Set your ticket price and get the word out in {city.name}.</p>
                </div>
                <Megaphone size={35} strokeWidth={1.2} />
            </div>
            <div className="stat-grid three">
                <div className="panel stat-card">
                    <Ticket />
                    <span>Expected audience</span>
                    <strong>
                        {forecast.tickets}
                        <small> / {forecast.capacity}</small>
                    </strong>
                </div>
                <div className="panel stat-card">
                    <TrendingUp />
                    <span>Expected box office</span>
                    <strong>{formatMoney(forecast.revenue)}</strong>
                </div>
                <div className="panel stat-card">
                    <Megaphone />
                    <span>Local marketing spend</span>
                    <strong>
                        {formatMoney(
                            Object.entries(state.marketing).reduce(
                                (sum, [channel, count]) => sum + count * MARKETING_COSTS[channel],
                                0,
                            ),
                        )}
                    </strong>
                </div>
            </div>
            <section className="panel ticket-panel">
                <div>
                    <span className="eyebrow">ADMISSION TO A LITTLE WONDER</span>
                    <h2>The price of a good night</h2>
                    <p className="muted">
                        Lower prices welcome more people. Higher prices make each seat count.
                    </p>
                </div>
                <div className="price-control">
                    <label htmlFor="ticket-price">
                        Ticket price <strong>{formatMoney(state.ticketPrice)}</strong>
                    </label>
                    <input
                        id="ticket-price"
                        disabled={!!state.liveShow}
                        type="range"
                        min="15"
                        max="70"
                        step="5"
                        value={state.ticketPrice}
                        onChange={(e) =>
                            dispatch({ type: "SET_PRICE", value: Number(e.target.value) })
                        }
                    />
                    <div>
                        <span>15 zł · accessible</span>
                        <span>70 zł · premium</span>
                    </div>
                </div>
            </section>
            <div className="marketing-grid">
                {[
                    {
                        id: "posters",
                        name: "Paint the town",
                        sub: "Posters & handbills",
                        description:
                            "A splash of colour in shop windows. A familiar invitation for local families.",
                        cost: 250,
                        Icon: Ticket,
                    },
                    {
                        id: "radio",
                        name: "Make some noise",
                        sub: "Local radio",
                        description:
                            "Let your ringmaster do the talking. Reach a wider audience across the city.",
                        cost: 600,
                        Icon: Radio,
                    },
                    {
                        id: "social",
                        name: "Spread the wonder",
                        sub: "Social media",
                        description:
                            "A glimpse behind the curtain. Get the next generation excited for the show.",
                        cost: 400,
                        Icon: Users,
                    },
                ].map(({ id, name, sub, description, cost, Icon }) => (
                    <section className="panel marketing-card" key={id}>
                        <div className={`channel-art ${id}`}>
                            <Icon size={56} strokeWidth={1} />
                            <span>{sub.toUpperCase()}</span>
                            <i>THE GRAND TOUR</i>
                        </div>
                        <div className="marketing-body">
                            <span className="eyebrow">{sub}</span>
                            <h2>{name}</h2>
                            <p>{description}</p>
                            <div className="campaign-spend">
                                <span>Invested in {city.name}</span>
                                <strong>{formatMoney((state.marketing[id] || 0) * cost)}</strong>
                            </div>
                            <button
                                className="btn btn-secondary w-full"
                                disabled={
                                    state.money < cost ||
                                    !!state.liveShow ||
                                    (state.marketing[id] || 0) >= 3
                                }
                                onClick={() => dispatch({ type: "PROMOTE", channel: id })}
                            >
                                {(state.marketing[id] || 0) >= 3
                                    ? "Campaign fully funded"
                                    : `Launch campaign · ${formatMoney(cost)}`}
                                <ArrowUpRight size={16} />
                            </button>
                        </div>
                    </section>
                ))}
            </div>
        </>
    );
}
export function Supplies({ state, dispatch }: GameViewProps) {
    return (
        <>
            <div className="page-heading">
                <div>
                    <span className="eyebrow">THE QUARTERMASTER</span>
                    <h1>Great shows start behind the scenes.</h1>
                    <p>Keep the wheels turning and give your circus room to grow.</p>
                </div>
                <ShoppingBag size={34} strokeWidth={1.2} />
            </div>
            <div className="supply-grid">
                {[
                    {
                        id: "fuel",
                        name: "A full tank of possibility",
                        sub: "40 L of fuel",
                        desc: "For the road ahead and the camp generator.",
                        price: 280,
                        Icon: Fuel,
                    },
                    {
                        id: "water",
                        name: "Fresh water, fresh start",
                        sub: "60 L of water",
                        desc: "Essential for setting up camp and keeping spirits high.",
                        price: 120,
                        Icon: Droplets,
                    },
                    {
                        id: "lighting",
                        name: "A little more limelight",
                        sub: "Professional stage lighting",
                        desc: "Better lighting lifts the quality of every performance.",
                        price: 1600,
                        Icon: Zap,
                    },
                    {
                        id: "popcorn",
                        name: "Something for the interval",
                        sub: "Popcorn concession",
                        desc: "Turn your intermission into a delicious extra income.",
                        price: 1200,
                        Icon: Popcorn,
                    },
                    {
                        id: "tent",
                        name: "Dream a little bigger",
                        sub: "Expanded big top",
                        desc: "Make room for more applause with 150 extra seats.",
                        price: 4000,
                        Icon: Tent,
                    },
                ].map(({ id, name, sub, desc, price, Icon }) => {
                    const owned = state.upgrades.includes(id);
                    return (
                        <section className="panel supply-card" key={id}>
                            <div className={`supply-icon ${id}`}>
                                <Icon size={40} strokeWidth={1.3} />
                            </div>
                            <span className="eyebrow">{sub}</span>
                            <h2>{name}</h2>
                            <p>{desc}</p>
                            <button
                                className={`btn ${owned ? "btn-secondary" : "btn-primary"} w-full`}
                                disabled={owned || state.money < price || !!state.liveShow}
                                onClick={() => dispatch({ type: "BUY", item: id })}
                            >
                                {owned ? (
                                    <>
                                        <Check size={16} /> In your circus
                                    </>
                                ) : (
                                    <>
                                        Buy · {formatMoney(price)}
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </section>
                    );
                })}
            </div>
        </>
    );
}
export function Rankings({ state }: GameViewProps) {
    const [metric, setMetric] = useState<"rating" | "tickets">("rating");
    const total = state.history.reduce((a, r) => a + r.tickets, 0);
    const rating = total ? state.history.reduce((a, r) => a + r.rating * r.tickets, 0) / total : 0;
    const rows = [
        { name: "Cirque Aurora", rating: 4.7, tickets: 4280 },
        { name: "The Velvet Ring", rating: 4.3, tickets: 3640 },
        { name: "Cyrk Fantazja", rating: 4.1, tickets: 2980 },
        { name: state.circusName, rating, tickets: total, own: true },
        { name: "The Wandering Stars", rating: 3.8, tickets: 2150 },
    ].sort((a, b) => b[metric] - a[metric]);
    return (
        <>
            <div className="page-heading">
                <div>
                    <span className="eyebrow">LEAVE YOUR MARK</span>
                    <h1>Every great circus starts somewhere.</h1>
                    <p>
                        Your career beside the touring greats. Rival benchmarks give you a target to
                        chase.
                    </p>
                </div>
                <Trophy size={38} strokeWidth={1.2} />
            </div>
            <div className="ranking-banner">
                <Trophy size={54} strokeWidth={1} />
                <div>
                    <span className="eyebrow">YOUR STORY SO FAR</span>
                    <h2>
                        {state.history.length
                            ? `${state.history.length} shows. ${total.toLocaleString()} little moments of wonder.`
                            : "An empty ring. An unwritten story."}
                    </h2>
                    <p>
                        {state.history.length
                            ? "Keep your audience happy and your next big season is just around the corner."
                            : "Put on your first show to earn your place among the greats."}
                    </p>
                </div>
            </div>
            <section className="panel">
                <div className="panel-heading">
                    <h2>The touring greats</h2>
                    <div className="segmented">
                        <button
                            className={metric === "rating" ? "active" : ""}
                            onClick={() => setMetric("rating")}
                        >
                            Audience rating
                        </button>
                        <button
                            className={metric === "tickets" ? "active" : ""}
                            onClick={() => setMetric("tickets")}
                        >
                            Tickets sold
                        </button>
                    </div>
                </div>
                <div className="table-scroll">
                    <table>
                        <thead>
                            <tr>
                                <th>RANK</th>
                                <th>CIRCUS</th>
                                <th>AUDIENCE RATING</th>
                                <th>TICKETS SOLD</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r, i) => (
                                <tr className={r.own ? "your-row" : ""} key={r.name}>
                                    <td>
                                        <span className="rank-number">
                                            {String(i + 1).padStart(2, "0")}
                                        </span>
                                    </td>
                                    <td>
                                        <strong>{r.name}</strong>{" "}
                                        {r.own && <span className="tag">YOU</span>}
                                    </td>
                                    <td>
                                        {r.rating
                                            ? `★ ${r.rating.toFixed(2)}`
                                            : "Awaiting first show"}
                                    </td>
                                    <td>{r.tickets.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
            <section className="panel history-panel">
                <div className="panel-heading">
                    <h2>Your travel journal</h2>
                    <span className="muted">All performances</span>
                </div>
                {state.history.length ? (
                    <div className="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>DAY / CITY</th>
                                    <th>AUDIENCE</th>
                                    <th>RATING</th>
                                    <th>SHOW PROFIT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...state.history].reverse().map((r, i) => (
                                    <tr key={i}>
                                        <td>
                                            Day {r.day} ·{" "}
                                            {CITIES.find((c) => c.id === r.cityId)?.name}
                                        </td>
                                        <td>{r.tickets}</td>
                                        <td>★ {r.rating.toFixed(1)}</td>
                                        <td className={r.profit >= 0 ? "positive" : "negative"}>
                                            {formatMoney(r.profit)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <Ticket size={30} />
                        <p>The first page is yours to write.</p>
                        <span>Your show results will appear here.</span>
                    </div>
                )}
            </section>
        </>
    );
}
