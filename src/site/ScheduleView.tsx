import { useState } from "react";
import {
    ArrowDown,
    ArrowUp,
    ArrowUpRight,
    CalendarDays,
    Check,
    Clock3,
    Megaphone,
    Plus,
    Sparkles,
    Ticket,
    Trash2,
    TriangleAlert,
    X,
} from "lucide-react";
import type { Booking, ScheduledAct, SiteViewProps } from "./types";
import { ACTS } from "./data";
import {
    bookingDuration,
    bookingProblems,
    forecastBooking,
    formatMoney,
    formatTime,
    dayWeather,
    getDailyDemand,
} from "./engine";
import { getBuildingStatus } from "./spatial";
import "./site-views.css";

type Draft = Omit<Booking, "id" | "status" | "audience" | "rating" | "revenue">;
export default function ScheduleView({ state, dispatch, navigate }: SiteViewProps) {
    const [dayOffset, setDayOffset] = useState(0);
    const day = state.day + dayOffset;
    const tents = state.buildings.filter((b) => b.kind === "smallTent" || b.kind === "bigTop");
    const [tentId, setTentId] = useState("");
    const activeTent = tents.find((t) => t.id === tentId) ?? tents[0];
    const [start, setStart] = useState(14 * 60);
    const [price, setPrice] = useState(24);
    const [acts, setActs] = useState<ScheduledAct[]>([]);
    const [actId, setActId] = useState("");
    const [personId, setPersonId] = useState("");
    const [message, setMessage] = useState("");
    const [selected, setSelected] = useState<string | null>(null);
    const [cancelConfirm, setCancelConfirm] = useState(false);
    const allActs = ACTS;
    const actById = Object.fromEntries(ACTS.map((a) => [a.id, a]));
    const chosenAct =
        allActs.find((a) => a.id === actId) ?? allActs.find((a) => a.role !== "interval")!;
    const eligible = state.people.filter((p) => p.hired && p.role === chosenAct?.role);
    const chosenPerson = eligible.find((p) => p.id === personId) ?? eligible[0];
    const draft: Draft = { tentId: activeTent?.id ?? "", day, start, price, acts };
    const duration = bookingDuration(draft);
    const problems = bookingProblems(state, draft);
    const forecast = activeTent && problems.length === 0 ? forecastBooking(state, draft) : null;
    const dailyAudience = getDailyDemand(state, day);
    const status = activeTent ? getBuildingStatus(state, activeTent) : null;
    const bookings = state.bookings.filter((b) => b.day === day && b.status !== "cancelled");
    const selectedBooking = bookings.find((b) => b.id === selected);
    const canPlan = state.phase === "planning" && !state.gameOver;
    function addAct() {
        if (!chosenAct) return;
        setActs([
            ...acts,
            {
                actId: chosenAct.id,
                personId: chosenAct.role === "interval" ? null : (chosenPerson?.id ?? null),
            },
        ]);
        setMessage("");
    }
    function moveAct(index: number, by: number) {
        const copy = [...acts];
        [copy[index], copy[index + by]] = [copy[index + by], copy[index]];
        setActs(copy);
    }
    function useTemplate() {
        const available = allActs.filter(
            (a) =>
                a.role !== "interval" &&
                (!a.requiresBigTop || activeTent?.kind === "bigTop") &&
                state.people.some((p) => p.hired && p.role === a.role),
        );
        const chosen: ScheduledAct[] = [];
        const used = new Set<string>();
        for (const a of available) {
            if (used.has(a.role)) continue;
            const p = state.people.find((p) => p.hired && p.role === a.role)!;
            chosen.push({ actId: a.id, personId: p.id });
            used.add(a.role);
            if (chosen.length === 3) break;
        }
        setActs(chosen);
        setMessage(
            chosen.length < 3
                ? "Recruit three different performer roles for the opening programme."
                : "Opening programme loaded. Adjust it to make it yours.",
        );
    }
    return (
        <div className="site-view schedule-view">
            <div className="page-heading">
                <div>
                    <span className="eyebrow">A LITTLE ANTICIPATION</span>
                    <h1>Make a day of it.</h1>
                    <p className="muted">Every tent has a stage. Give every stage a story.</p>
                </div>
                <button className="btn btn-secondary" onClick={() => navigate("crew")}>
                    Meet your troupe <ArrowUpRight size={16} />
                </button>
            </div>
            <div className="schedule-days" role="tablist" aria-label="Performance day">
                {Array.from({ length: 7 }, (_, i) => (
                    <button
                        key={i}
                        role="tab"
                        aria-selected={dayOffset === i}
                        className={dayOffset === i ? "active" : ""}
                        onClick={() => {
                            setDayOffset(i);
                            setSelected(null);
                            setCancelConfirm(false);
                        }}
                    >
                        <span>{i === 0 ? "Today" : i === 1 ? "Tomorrow" : "Coming up"}</span>
                        <strong>Day {state.day + i}</strong>
                        <small>{dayWeather({ ...state, day: state.day + i })}</small>
                    </button>
                ))}
            </div>
            {tents.length === 0 ? (
                <div className="panel site-empty">
                    <CalendarDays size={36} />
                    <h2>Every story needs a stage.</h2>
                    <p className="muted">
                        Place a little tent or a big top on your site, then write its first
                        programme.
                    </p>
                    <button className="btn btn-primary" onClick={() => navigate("site")}>
                        Build your first tent <ArrowUpRight size={16} />
                    </button>
                </div>
            ) : (
                <>
                    <section className="panel schedule-board">
                        <div className="schedule-board-heading">
                            <div>
                                <span className="eyebrow">DAY {day} · PERFORMANCE BOARD</span>
                                <h2>
                                    {bookings.length
                                        ? `${bookings.length} ${bookings.length === 1 ? "performance" : "performances"} planned`
                                        : "An empty ring. Endless possibilities."}
                                </h2>
                                <p
                                    className="muted"
                                    style={{ margin: "8px 0 0", maxWidth: 580, lineHeight: 1.65 }}
                                >
                                    <strong>
                                        {dailyAudience} potential visitors on day {day}.
                                    </strong>{" "}
                                    All tents share this daily audience. Earlier shows use part of
                                    it; simultaneous shows divide the remaining guests.
                                </p>
                            </div>
                            <span className="tag">
                                <Clock3 size={13} />
                                10:00 – 22:00
                            </span>
                        </div>
                        <div className="schedule-scroll">
                            <div className="schedule-timeline">
                                <div className="schedule-time-labels">
                                    <span>THE STAGE</span>
                                    {Array.from({ length: 7 }, (_, i) => (
                                        <span key={i}>{10 + i * 2}:00</span>
                                    ))}
                                </div>
                                {tents.map((t) => (
                                    <div className="schedule-track" key={t.id}>
                                        <button
                                            className="schedule-tent-name"
                                            onClick={() => {
                                                setTentId(t.id);
                                                setSelected(null);
                                            }}
                                        >
                                            <strong>{t.name}</strong>
                                            <small>
                                                {getBuildingStatus(state, t).operational
                                                    ? "Ready to welcome guests"
                                                    : "Needs attention"}
                                            </small>
                                        </button>
                                        <div className="schedule-track-lane">
                                            {Array.from({ length: 6 }, (_, i) => (
                                                <i
                                                    className="schedule-grid-line"
                                                    key={i}
                                                    style={{ left: `${(i / 6) * 100}%` }}
                                                />
                                            ))}
                                            {bookings
                                                .filter((b) => b.tentId === t.id)
                                                .map((b) => (
                                                    <button
                                                        key={b.id}
                                                        className={`schedule-booking ${b.status} ${selected === b.id ? "selected" : ""}`}
                                                        style={{
                                                            left: `${((b.start - 600) / 720) * 100}%`,
                                                            width: `${(bookingDuration(b) / 720) * 100}%`,
                                                        }}
                                                        onClick={() => {
                                                            setSelected(b.id);
                                                            setCancelConfirm(false);
                                                        }}
                                                        title={`${t.name}, ${formatTime(b.start)}, ${b.status}`}
                                                    >
                                                        <strong>{formatTime(b.start)}</strong>
                                                        {b.status === "running" && (
                                                            <i
                                                                className="booking-live-progress"
                                                                style={{
                                                                    width: `${Math.min(100, ((state.minute - b.start) / bookingDuration(b)) * 100)}%`,
                                                                }}
                                                            />
                                                        )}
                                                        <span>
                                                            {b.status === "completed"
                                                                ? `${b.audience} guests`
                                                                : b.status === "running"
                                                                  ? "On stage"
                                                                  : `${b.acts.filter((a) => actById[a.actId]?.role !== "interval").length} acts`}
                                                        </span>
                                                    </button>
                                                ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {bookings.length === 0 && (
                            <p className="schedule-board-empty">
                                No performances booked. Compose your first show below.
                            </p>
                        )}
                    </section>
                    {selectedBooking && (
                        <div className="panel booking-detail">
                            <div>
                                <span className="eyebrow">
                                    {selectedBooking.status.toUpperCase()}
                                </span>
                                <h3>
                                    {
                                        state.buildings.find((b) => b.id === selectedBooking.tentId)
                                            ?.name
                                    }{" "}
                                    · {formatTime(selectedBooking.start)}
                                </h3>
                                <p className="muted">
                                    {selectedBooking.acts
                                        .map((a) => actById[a.actId]?.name)
                                        .join(" → ")}
                                </p>
                                <span>
                                    {bookingDuration(selectedBooking)} minutes ·{" "}
                                    {formatMoney(selectedBooking.price)} per ticket
                                    {selectedBooking.status === "completed"
                                        ? ` · ${selectedBooking.audience} guests · ${selectedBooking.rating}/5 rating`
                                        : ""}
                                </span>
                            </div>
                            {selectedBooking.status === "running" && (
                                <div className="booking-now">
                                    <span>
                                        On stage ·{" "}
                                        {Math.min(
                                            bookingDuration(selectedBooking),
                                            state.minute - selectedBooking.start,
                                        )}{" "}
                                        / {bookingDuration(selectedBooking)} min
                                    </span>
                                    <div className="progress-track">
                                        <span
                                            style={{
                                                width: `${Math.min(100, ((state.minute - selectedBooking.start) / bookingDuration(selectedBooking)) * 100)}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="booking-detail-actions">
                                {canPlan && (
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setTentId(selectedBooking.tentId);
                                            setStart(selectedBooking.start);
                                            setPrice(selectedBooking.price);
                                            setActs(selectedBooking.acts.map((a) => ({ ...a })));
                                            setMessage(
                                                "Programme copied below. Choose a free time, or cancel the original before replacing it.",
                                            );
                                        }}
                                    >
                                        Use as draft
                                    </button>
                                )}
                                {selectedBooking.status === "scheduled" &&
                                    canPlan &&
                                    (cancelConfirm ? (
                                        <>
                                            <span>Cancel this performance?</span>
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => setCancelConfirm(false)}
                                            >
                                                Keep it
                                            </button>
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => {
                                                    dispatch({
                                                        type: "CANCEL_BOOKING",
                                                        id: selectedBooking.id,
                                                    });
                                                    setSelected(null);
                                                    setCancelConfirm(false);
                                                }}
                                            >
                                                Confirm cancellation
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => setCancelConfirm(true)}
                                        >
                                            Cancel performance
                                        </button>
                                    ))}
                                <button
                                    className="icon-button"
                                    aria-label="Close performance details"
                                    onClick={() => setSelected(null)}
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                    <div className="schedule-layout">
                        <section className="panel programme-editor">
                            <div className="programme-heading">
                                <div>
                                    <span className="eyebrow">THE RUNNING ORDER</span>
                                    <h2>Compose a performance</h2>
                                </div>
                                <button
                                    className="btn btn-secondary"
                                    disabled={!canPlan}
                                    onClick={useTemplate}
                                >
                                    <Sparkles size={14} />
                                    Opening programme
                                </button>
                            </div>
                            {!canPlan && (
                                <div className="site-note">
                                    <Clock3 size={16} />
                                    The gates are open. Plan your next performances in the morning.
                                </div>
                            )}
                            <div className="programme-settings">
                                <label className="site-field">
                                    <span>Stage</span>
                                    <select
                                        aria-label="Performance tent"
                                        value={activeTent?.id ?? ""}
                                        disabled={!canPlan}
                                        onChange={(e) => setTentId(e.target.value)}
                                    >
                                        {tents.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.name} · {t.x + 1},{t.y + 1}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="site-field">
                                    <span>Curtain up</span>
                                    <select
                                        aria-label="Performance start time"
                                        value={start}
                                        disabled={!canPlan}
                                        onChange={(e) => setStart(Number(e.target.value))}
                                    >
                                        {Array.from({ length: 41 }, (_, i) => 600 + i * 15).map(
                                            (time) => (
                                                <option key={time} value={time}>
                                                    {formatTime(time)}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </label>
                                <label className="site-field">
                                    <span>Ticket price · zł</span>
                                    <input
                                        type="number"
                                        aria-label="Ticket price"
                                        min={10}
                                        max={60}
                                        step={1}
                                        value={price}
                                        disabled={!canPlan}
                                        onChange={(e) => setPrice(Number(e.target.value))}
                                    />
                                </label>
                            </div>
                            <div className="programme-list">
                                {acts.length === 0 ? (
                                    <div className="programme-empty">
                                        <Sparkles size={26} />
                                        <h3>The spotlight is yours.</h3>
                                        <p>Add acts below, or start with the opening programme.</p>
                                    </div>
                                ) : (
                                    acts.map((a, i) => {
                                        const def = actById[a.actId];
                                        const person = state.people.find(
                                            (p) => p.id === a.personId,
                                        );
                                        return (
                                            <div
                                                className={
                                                    "programme-act " +
                                                    (def?.role === "interval" ? "interval" : "")
                                                }
                                                key={`${i}-${a.actId}`}
                                            >
                                                <span className="programme-act-number">
                                                    {String(i + 1).padStart(2, "0")}
                                                </span>
                                                <div>
                                                    <strong>{def?.name ?? a.actId}</strong>
                                                    <span>
                                                        {person?.name ??
                                                            "Refreshments & a little breathing room"}{" "}
                                                        · {def?.duration} min
                                                    </span>
                                                </div>
                                                <div className="programme-act-controls">
                                                    <button
                                                        className="icon-button"
                                                        disabled={!canPlan || i === 0}
                                                        aria-label={`Move ${def?.name} up`}
                                                        onClick={() => moveAct(i, -1)}
                                                    >
                                                        <ArrowUp size={14} />
                                                    </button>
                                                    <button
                                                        className="icon-button"
                                                        disabled={!canPlan || i === acts.length - 1}
                                                        aria-label={`Move ${def?.name} down`}
                                                        onClick={() => moveAct(i, 1)}
                                                    >
                                                        <ArrowDown size={14} />
                                                    </button>
                                                    <button
                                                        className="icon-button"
                                                        disabled={!canPlan}
                                                        aria-label={`Remove ${def?.name}`}
                                                        onClick={() =>
                                                            setActs(acts.filter((_, j) => j !== i))
                                                        }
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            <div className="programme-add">
                                <label className="site-field">
                                    <span>The next act</span>
                                    <select
                                        aria-label="Act to add"
                                        value={chosenAct?.id ?? ""}
                                        disabled={!canPlan}
                                        onChange={(e) => {
                                            setActId(e.target.value);
                                            setPersonId("");
                                        }}
                                    >
                                        {allActs.map((a) => (
                                            <option
                                                key={a.id}
                                                value={a.id}
                                                disabled={
                                                    a.requiresBigTop &&
                                                    activeTent?.kind !== "bigTop"
                                                }
                                            >
                                                {a.name} · {a.duration} min
                                                {a.requiresBigTop ? " · Big top" : ""}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                {chosenAct?.role !== "interval" && (
                                    <label className="site-field">
                                        <span>In the spotlight</span>
                                        <select
                                            aria-label="Performer for act"
                                            value={chosenPerson?.id ?? ""}
                                            disabled={!canPlan || eligible.length === 0}
                                            onChange={(e) => setPersonId(e.target.value)}
                                        >
                                            {eligible.length === 0 ? (
                                                <option value="">No {chosenAct?.role} hired</option>
                                            ) : (
                                                eligible.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.name} · {p.energy} energy
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                    </label>
                                )}
                                <button
                                    className="btn btn-secondary"
                                    disabled={
                                        !canPlan ||
                                        (!chosenPerson && chosenAct?.role !== "interval") ||
                                        acts.length >= 8
                                    }
                                    onClick={addAct}
                                >
                                    <Plus size={16} />
                                    Add
                                </button>
                            </div>
                            {chosenAct?.role !== "interval" && eligible.length === 0 && (
                                <button className="site-text-link" onClick={() => navigate("crew")}>
                                    Find a {chosenAct?.role} in talent scouting{" "}
                                    <ArrowUpRight size={14} />
                                </button>
                            )}
                            <div className="programme-duration">
                                <span>
                                    <Clock3 size={16} />
                                    {duration} minutes
                                </span>
                                <span className="muted">
                                    Aim for 60–120 min · Ends {formatTime(start + duration)}
                                </span>
                            </div>
                        </section>
                        <aside className="panel performance-forecast">
                            <span className="eyebrow">BEFORE THE CURTAIN RISES</span>
                            <h2>A little foresight.</h2>
                            <p className="muted">
                                A forecast, not a promise. Your crew, site, weather and ticket price
                                all play a part.
                            </p>
                            <div className="forecast-metrics">
                                <div>
                                    <UsersIcon />
                                    <span>Expected audience</span>
                                    <strong>
                                        {forecast ? forecast.audience : "—"}
                                        {forecast && <small> guests</small>}
                                    </strong>
                                </div>
                                <div>
                                    <Sparkles size={19} />
                                    <span>Expected rating</span>
                                    <strong>
                                        {forecast ? forecast.rating : "—"}
                                        {forecast && <small> /5</small>}
                                    </strong>
                                </div>
                                <div>
                                    <Ticket size={19} />
                                    <span>Ticket income</span>
                                    <strong>
                                        {forecast ? formatMoney(forecast.revenue) : "—"}
                                    </strong>
                                </div>
                            </div>
                            {!forecast && (
                                <p
                                    className="muted"
                                    style={{
                                        marginTop: -10,
                                        marginBottom: 20,
                                        lineHeight: 1.65,
                                        fontSize: 11,
                                    }}
                                >
                                    Complete a valid programme to see attendance, quality and ticket
                                    income.
                                </p>
                            )}
                            <div className="local-posters">
                                <div>
                                    <Megaphone size={17} />
                                    <strong>Let the neighbourhood know</strong>
                                </div>
                                <p>
                                    {day === state.day
                                        ? "Posters improve attendance and reach up to 30 more potential visitors today, depending on weather. Fund up to three campaigns."
                                        : "Campaigns run for one day. Come back on the morning of this performance to put up local posters."}
                                </p>
                                {day === state.day && (
                                    <>
                                        <div className="poster-status">
                                            <span>{state.marketing / 15} / 3 campaigns funded</span>
                                            <div className="poster-stamps" aria-hidden="true">
                                                {[15, 30, 45].map((n) => (
                                                    <i
                                                        key={n}
                                                        className={
                                                            state.marketing >= n ? "filled" : ""
                                                        }
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <button
                                            className="btn btn-secondary"
                                            aria-label="Put up local posters for 200 zł"
                                            disabled={
                                                !canPlan ||
                                                state.marketing >= 45 ||
                                                state.money < 200
                                            }
                                            onClick={() => dispatch({ type: "MARKET" })}
                                        >
                                            <Megaphone size={14} />
                                            {state.marketing >= 45
                                                ? "Neighbourhood covered"
                                                : `Put up posters · ${formatMoney(200)}`}
                                        </button>
                                        <small>Paid now · resets tomorrow</small>
                                    </>
                                )}
                            </div>
                            {status && status.issues.length > 0 && (
                                <div className="forecast-warnings">
                                    <strong>
                                        <TriangleAlert size={15} />
                                        Before showtime
                                    </strong>
                                    {status.issues.map((issue) => (
                                        <p key={issue}>{issue}</p>
                                    ))}
                                    <button
                                        className="site-text-link"
                                        onClick={() => navigate("site")}
                                    >
                                        Prepare the site <ArrowUpRight size={13} />
                                    </button>
                                </div>
                            )}
                            {status && status.bonuses.length > 0 && (
                                <div className="forecast-bonuses">
                                    {status.bonuses.map((b) => (
                                        <p key={b}>
                                            <Check size={14} />
                                            {b}
                                        </p>
                                    ))}
                                </div>
                            )}
                            {problems.length > 0 && (
                                <div className="programme-problems" aria-live="polite">
                                    <strong>To book this performance</strong>
                                    {problems.map((p) => (
                                        <p key={p}>{p}</p>
                                    ))}
                                </div>
                            )}
                            <button
                                className="btn btn-primary book-performance"
                                disabled={!canPlan || problems.length > 0}
                                onClick={() => {
                                    dispatch({ type: "BOOK", booking: draft });
                                    setActs([]);
                                    setMessage(
                                        `Performance booked for day ${day}, ${formatTime(start)}.`,
                                    );
                                }}
                            >
                                <CalendarDays size={16} />
                                Book performance
                            </button>
                            {message && (
                                <p className="schedule-feedback" role="status">
                                    {message}
                                </p>
                            )}
                            <p className="forecast-footnote">
                                Booking is free. Finish preparing your site before you open the
                                gates.
                            </p>
                        </aside>
                    </div>
                </>
            )}
        </div>
    );
}
function UsersIcon() {
    return (
        <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
        >
            <circle cx="9" cy="7" r="3" />
            <path d="M3 21v-3a6 6 0 0 1 12 0v3m1-17a3 3 0 0 1 0 6m2 5a5 5 0 0 1 3 4v2" />
        </svg>
    );
}
