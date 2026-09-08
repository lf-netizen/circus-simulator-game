import { useEffect, useReducer, useRef, useState } from "react";
import {
    ArrowRight,
    CalendarDays,
    Check,
    CircleHelp,
    ClipboardList,
    Cloud,
    CloudRain,
    Download,
    Droplets,
    Flag,
    Fuel,
    Hammer,
    Menu,
    Pause,
    Play,
    RotateCcw,
    Settings2,
    Sparkles,
    Star,
    Sun,
    Tent,
    Upload,
    Users,
    Wallet,
    X,
} from "lucide-react";
import type { SiteAction, SiteViewProps } from "./types";
import { dayWeather, formatMoney, formatTime, getOpeningProblems, reducer } from "./engine";
import { exportSite, loadSite, parseSiteSave, saveSite } from "./persistence";
import BuilderView from "./BuilderView";
import CrewView from "./CrewView";
import ScheduleView from "./ScheduleView";
import LedgerView from "./LedgerView";
import "./site.css";
type View = "site" | "crew" | "schedule" | "ledger";
const navigation = [
    { id: "site", name: "The grounds", Icon: Hammer },
    { id: "crew", name: "People & crew", Icon: Users },
    { id: "schedule", name: "Show schedule", Icon: CalendarDays },
    { id: "ledger", name: "The cashbook", Icon: ClipboardList },
] as const;
export default function SiteApp() {
    const [state, send] = useReducer(reducer, undefined, loadSite);
    const [view, setView] = useState<View>("site");
    const [paused, setPaused] = useState(true);
    const [speed, setSpeed] = useState(1);
    const [modal, setModal] = useState<"settings" | "help" | "new" | "opening" | null>(null);
    const [notice, setNotice] = useState("");
    const [saveFailed, setSaveFailed] = useState(false);
    const [mobileMenu, setMobileMenu] = useState(false);
    const [seed, setSeed] = useState(String(Math.floor(Math.random() * 999999) + 1));
    const fileRef = useRef<HTMLInputElement>(null);
    const dialogRef = useRef<HTMLDivElement>(null);
    const dispatch = (action: SiteAction) => {
        send(action);
    };
    const navigate = (v: View) => {
        setView(v);
        setMobileMenu(false);
        window.scrollTo({ top: 0, behavior: "instant" });
    };
    useEffect(() => {
        setSaveFailed(!saveSite(state));
    }, [state]);
    useEffect(() => {
        if (state.phase !== "running" || paused || state.incident || state.gameOver || modal)
            return;
        const timer = setInterval(() => send({ type: "TICK" }), 800 / speed);
        return () => clearInterval(timer);
    }, [state.phase, paused, speed, state.incident, state.gameOver, modal]);
    useEffect(() => {
        if (!notice) return;
        const timer = setTimeout(() => setNotice(""), 5000);
        return () => clearTimeout(timer);
    }, [notice]);
    const report = state.phase === "closed" ? state.report : null;
    const blocking = !!modal || !!report || !!state.incident || state.gameOver;
    useEffect(() => {
        if (!blocking) return;
        const previous = document.activeElement as HTMLElement | null;
        dialogRef.current?.focus();
        const key = (event: KeyboardEvent) => {
            if (event.key === "Escape" && modal) setModal(null);
            if (event.key === "Tab") {
                const items = dialogRef.current?.querySelectorAll<HTMLElement>(
                    "button:not(:disabled),input,select,a[href]",
                );
                if (!items?.length) {
                    event.preventDefault();
                    return;
                }
                const first = items[0],
                    last = items[items.length - 1];
                if (
                    event.shiftKey &&
                    (document.activeElement === first ||
                        document.activeElement === dialogRef.current)
                ) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        };
        document.addEventListener("keydown", key);
        return () => {
            document.removeEventListener("keydown", key);
            previous?.focus();
        };
    }, [blocking, modal]);
    const openProblems = getOpeningProblems(state);
    const weather = dayWeather(state);
    const WeatherIcon = weather === "rain" ? CloudRain : weather === "cloud" ? Cloud : Sun;
    const Content = {
        site: BuilderView,
        crew: CrewView,
        schedule: ScheduleView,
        ledger: LedgerView,
    }[view];
    const props: SiteViewProps = { state, dispatch, navigate };
    const guests =
        state.history.reduce((sum, r) => sum + r.guests, 0) +
        (state.phase === "closed" ? 0 : state.today.guests);
    const shows =
        state.history.reduce((sum, r) => sum + r.shows, 0) +
        (state.phase === "closed" ? 0 : state.today.shows);
    const open = () => {
        if (openProblems.length) {
            setModal("opening");
            return;
        }
        send({ type: "OPEN_DAY" });
        setPaused(false);
        navigate("site");
    };
    const nextDay = () => {
        send({ type: "NEXT_DAY" });
        setPaused(true);
        setModal(null);
        navigate("site");
    };
    return (
        <div className="site-app">
            <header className="game-topbar">
                <button className="game-brand" onClick={() => navigate("site")}>
                    <span className="logo-tent">
                        <Tent size={27} strokeWidth={1.2} />
                        <i>✦</i>
                    </span>
                    <span>
                        <strong>THE GRAND TOUR</strong>
                        <small>A LITTLE CIRCUS. A BIG AMBITION.</small>
                    </span>
                </button>
                <nav
                    className={mobileMenu ? "game-nav open" : "game-nav"}
                    aria-label="Main navigation"
                >
                    {navigation.map(({ id, name, Icon }) => (
                        <button
                            key={id}
                            onClick={() => navigate(id)}
                            className={view === id ? "active" : ""}
                            aria-current={view === id ? "page" : undefined}
                        >
                            <Icon size={16} />
                            {name}
                        </button>
                    ))}
                </nav>
                <div className="top-actions">
                    <button aria-label="Ringmaster’s guide" onClick={() => setModal("help")}>
                        <CircleHelp size={19} />
                    </button>
                    <button aria-label="Saves and settings" onClick={() => setModal("settings")}>
                        <Settings2 size={19} />
                    </button>
                    <button
                        className="mobile-nav-toggle"
                        aria-label="Toggle navigation"
                        onClick={() => setMobileMenu(!mobileMenu)}
                    >
                        <Menu size={20} />
                    </button>
                </div>
            </header>
            <div className="management-bar">
                <div className="day-info">
                    <div className="day-number">
                        <span>DAY</span>
                        <strong>{String(state.day).padStart(2, "0")}</strong>
                    </div>
                    <div>
                        <strong>
                            {state.phase === "planning"
                                ? "Before the gates open"
                                : state.phase === "closed"
                                  ? "The last guest has gone"
                                  : `${formatTime(state.minute)} · ${paused ? "Paused" : "Gates open"}`}
                        </strong>
                        <span>
                            <WeatherIcon size={13} />
                            {weather === "rain"
                                ? "Showers expected"
                                : weather === "cloud"
                                  ? "A little overcast"
                                  : "Clear skies"}
                            <i>·</i> Riverside Meadow
                        </span>
                    </div>
                </div>
                <div className="resource-pills">
                    <div className="money-pill">
                        <Wallet size={16} />
                        <span>
                            <small>CASHBOX</small>
                            <strong>{formatMoney(state.money)}</strong>
                        </span>
                    </div>
                    <button
                        onClick={() => {
                            if (state.phase === "planning" && state.money >= 160)
                                dispatch({ type: "BUY_RESOURCE", resource: "fuel" });
                            else
                                setNotice(
                                    state.phase === "planning"
                                        ? "You need 160 zł for a fuel delivery."
                                        : "Order supplies during tomorrow’s preparation.",
                                );
                        }}
                        title="Buy 20 L fuel for 160 zł during preparation"
                    >
                        <Fuel size={16} />
                        <span>
                            <small>FUEL</small>
                            <strong>
                                {state.fuel} <em>L</em>
                            </strong>
                        </span>
                        <b>+</b>
                    </button>
                    <button
                        onClick={() => {
                            if (state.phase === "planning" && state.money >= 80)
                                dispatch({ type: "BUY_RESOURCE", resource: "water" });
                            else
                                setNotice(
                                    state.phase === "planning"
                                        ? "You need 80 zł for a water delivery."
                                        : "Order supplies during tomorrow’s preparation.",
                                );
                        }}
                        title="Buy 40 L water for 80 zł during preparation"
                    >
                        <Droplets size={16} />
                        <span>
                            <small>WATER</small>
                            <strong>
                                {state.water} <em>L</em>
                            </strong>
                        </span>
                        <b>+</b>
                    </button>
                    <div>
                        <Star size={16} />
                        <span>
                            <small>REPUTATION</small>
                            <strong>
                                {state.reputation.toFixed(0)} <em>/ 100</em>
                            </strong>
                        </span>
                    </div>
                </div>
                <div className="time-controls">
                    {state.phase === "running" ? (
                        <>
                            <button
                                className="pause-control"
                                aria-label={paused ? "Resume day" : "Pause day"}
                                onClick={() => setPaused(!paused)}
                            >
                                {paused ? (
                                    <Play size={16} fill="currentColor" />
                                ) : (
                                    <Pause size={16} fill="currentColor" />
                                )}
                            </button>
                            <div
                                className="speed-control"
                                role="group"
                                aria-label="Simulation speed"
                            >
                                {[1, 3, 6].map((value) => (
                                    <button
                                        key={value}
                                        aria-pressed={speed === value}
                                        className={speed === value ? "active" : ""}
                                        onClick={() => setSpeed(value)}
                                    >
                                        {value}×
                                    </button>
                                ))}
                            </div>
                            <span className="day-clock">{formatTime(state.minute)}</span>
                        </>
                    ) : (
                        <button
                            className="btn btn-primary"
                            onClick={state.phase === "closed" ? nextDay : open}
                            disabled={state.gameOver}
                        >
                            {state.phase === "closed" ? "Prepare tomorrow" : "Open the gates"}
                            <Play size={14} fill="currentColor" />
                        </button>
                    )}
                </div>
            </div>
            <main className={`site-main view-${view}`}>
                <Content {...props} />
                <section className="daily-notebook">
                    <div className="notebook-heading">
                        <span className="eyebrow">LIFE AROUND THE GROUNDS</span>
                        <span className="save-status">
                            <span className={`status-dot ${saveFailed ? "rust" : "green"}`} />
                            {saveFailed
                                ? "Autosave unavailable · export a backup"
                                : "Saved in this browser"}
                        </span>
                    </div>
                    <div className="notebook-entries">
                        {state.log.slice(0, 3).map((line, i) => (
                            <p key={`${i}-${line}`}>
                                <span className="notebook-dot" />
                                {line}
                            </p>
                        ))}
                    </div>
                </section>
                <footer className="game-footer">
                    <span>
                        THE GRAND TOUR <i>✦</i> ONE FIELD. ENDLESS POSSIBILITIES.
                    </span>
                    <span>
                        {state.phase === "planning"
                            ? "Take your time. Construction is paused."
                            : "Your decisions make this place."}
                    </span>
                </footer>
            </main>
            <div className="objective-bar">
                <Flag size={17} />
                <span>
                    <strong>
                        {state.won ? "A circus worth coming back to." : "MAKE YOUR MARK"}
                    </strong>
                    <small>
                        {state.won
                            ? "Milestone reached. Keep growing your circus."
                            : "Welcome 300 guests · Finish 6 shows · Reach 60 reputation"}
                    </small>
                </span>
                <div className="objective-meters">
                    <span>
                        <Users size={13} />
                        {Math.min(guests, 300)} / 300
                    </span>
                    <span>
                        <Tent size={13} />
                        {Math.min(shows, 6)} / 6
                    </span>
                    <span>
                        <Star size={13} />
                        {Math.min(Math.floor(state.reputation), 60)} / 60
                    </span>
                </div>
                {state.won && <Check className="objective-won" size={20} />}
            </div>
            {notice && (
                <div className="site-toast" role="status">
                    <InfoIcon />
                    <span>{notice}</span>
                </div>
            )}
            {blocking && (
                <div className="modal-backdrop">
                    <div
                        className={`modal ${report ? "day-report-modal" : ""}`}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-title"
                        tabIndex={-1}
                        ref={dialogRef}
                    >
                        {modal && !state.gameOver && !state.incident && !report && (
                            <button
                                className="modal-close icon-button"
                                aria-label="Close dialog"
                                onClick={() => setModal(null)}
                            >
                                <X size={20} />
                            </button>
                        )}
                        {state.gameOver ? (
                            <>
                                <Tent className="modal-symbol" size={46} />
                                <span className="eyebrow">THE CASHBOX IS EMPTY</span>
                                <h2 id="modal-title">A rough day at the circus.</h2>
                                <p>
                                    The grounds can’t cover their costs. You welcomed {guests}{" "}
                                    guests and finished {shows} shows. Your next attempt starts with
                                    what you learned.
                                </p>
                                <button
                                    className="btn btn-primary w-full"
                                    onClick={() => {
                                        send({ type: "RESET", seed: state.seed });
                                        setPaused(true);
                                        setModal(null);
                                        navigate("site");
                                    }}
                                >
                                    Try this site again <RotateCcw size={15} />
                                </button>
                                <button
                                    className="btn btn-secondary w-full"
                                    onClick={() => fileRef.current?.click()}
                                >
                                    <Upload size={16} /> Restore an exported save
                                </button>
                            </>
                        ) : state.incident ? (
                            <>
                                <WrenchIcon />
                                <span className="eyebrow">THE SHOW NEEDS YOU</span>
                                <h2 id="modal-title">{state.incident.title}</h2>
                                <p>{state.incident.description}</p>
                                <div className="incident-note">
                                    The clock is paused while you make a decision.
                                </div>
                                <button
                                    className="btn btn-primary w-full"
                                    disabled={state.money < state.incident.repairCost}
                                    onClick={() =>
                                        send({ type: "RESOLVE_INCIDENT", choice: "repair" })
                                    }
                                >
                                    Pay for the repair · {formatMoney(state.incident.repairCost)}
                                </button>
                                <button
                                    className="btn btn-secondary w-full"
                                    onClick={() =>
                                        send({ type: "RESOLVE_INCIDENT", choice: "improvise" })
                                    }
                                >
                                    Improvise · free
                                </button>
                                <small className="muted">
                                    A repair protects the performance. Improvising costs a little
                                    audience satisfaction.
                                </small>
                            </>
                        ) : report ? (
                            <>
                                <div className="report-stars">✦ ★ ✦</div>
                                <span className="eyebrow">
                                    DAY {report.day} · THE EVENING TAKINGS
                                </span>
                                <h2 id="modal-title">Another day to remember.</h2>
                                <p>The lanterns go out. Here’s how your circus performed.</p>
                                <div className="report-headlines">
                                    <div>
                                        <strong>{report.guests}</strong>
                                        <span>GUESTS WELCOMED</span>
                                    </div>
                                    <div>
                                        <strong>{report.shows}</strong>
                                        <span>SHOWS COMPLETED</span>
                                    </div>
                                    <div>
                                        <strong>
                                            {report.rating.toFixed(1)}
                                            <small>/5</small>
                                        </strong>
                                        <span>AUDIENCE RATING</span>
                                    </div>
                                </div>
                                <div className="report-accounts">
                                    {[
                                        { label: "Ticket takings", value: report.ticketRevenue },
                                        {
                                            label: "Food, drinks & attractions",
                                            value: report.concessionRevenue,
                                        },
                                        { label: "Crew wages", value: -report.wages },
                                        {
                                            label: "Ground rent & maintenance",
                                            value: -report.upkeep,
                                        },
                                        {
                                            label: "Operating supplies",
                                            value: report.fuelCost === 0 ? 0 : -report.fuelCost,
                                        },
                                        { label: "Emergency repairs", value: -report.repairs },
                                    ].map((item) => (
                                        <div key={item.label}>
                                            <span>{item.label}</span>
                                            <strong>{formatMoney(item.value)}</strong>
                                        </div>
                                    ))}
                                    <div className="report-profit">
                                        <span>Operating profit</span>
                                        <strong
                                            className={report.profit >= 0 ? "positive" : "negative"}
                                        >
                                            {formatMoney(report.profit)}
                                        </strong>
                                    </div>
                                </div>
                                {report.notes.length > 0 && (
                                    <div className="report-notes">
                                        {report.notes.map((note, i) => (
                                            <p key={i}>{note}</p>
                                        ))}
                                    </div>
                                )}
                                <small className="muted">
                                    Construction, hiring, training, and supply deliveries are paid
                                    separately when ordered.
                                </small>
                                <button className="btn btn-primary w-full" onClick={nextDay}>
                                    Prepare day {state.day + 1} <ArrowRight size={16} />
                                </button>
                                <button
                                    className="btn btn-secondary w-full"
                                    onClick={() => {
                                        send({ type: "CLOSE_REPORT" });
                                        navigate("ledger");
                                    }}
                                >
                                    Review the cashbook
                                </button>
                            </>
                        ) : modal === "opening" ? (
                            <>
                                <Tent className="modal-symbol" size={43} />
                                <span className="eyebrow">ONE LAST LOOK AROUND</span>
                                <h2 id="modal-title">Before the guests arrive.</h2>
                                <p>There are a few things to put in place before opening today.</p>
                                <div className="opening-problems">
                                    {openProblems.map((p) => (
                                        <p key={p}>
                                            <span /> {p}
                                        </p>
                                    ))}
                                </div>
                                <button
                                    className="btn btn-primary w-full"
                                    onClick={() => {
                                        setModal(null);
                                        navigate(
                                            state.bookings.some((b) => b.day === state.day)
                                                ? "site"
                                                : "schedule",
                                        );
                                    }}
                                >
                                    Back to preparations <ArrowRight size={15} />
                                </button>
                            </>
                        ) : modal === "new" ? (
                            <>
                                <LeafIcon />
                                <span className="eyebrow">A FRESH PATCH OF POSSIBILITY</span>
                                <h2 id="modal-title">Start with a new site.</h2>
                                <p>
                                    A different seed creates a different meadow, with its own ponds,
                                    trees, and rocks. This replaces your current location. Export
                                    first to keep it.
                                </p>
                                <label className="field-label" htmlFor="site-seed">
                                    Site seed
                                </label>
                                <div className="seed-control">
                                    <input
                                        id="site-seed"
                                        type="number"
                                        min="1"
                                        max="999999999"
                                        value={seed}
                                        onChange={(e) => setSeed(e.target.value)}
                                    />
                                    <button
                                        className="btn btn-secondary"
                                        aria-label="Randomize site seed"
                                        onClick={() =>
                                            setSeed(String(Math.floor(Math.random() * 999999) + 1))
                                        }
                                    >
                                        <RotateCcw size={16} />
                                    </button>
                                </div>
                                <button
                                    className="btn btn-primary w-full"
                                    disabled={
                                        !Number.isSafeInteger(Number(seed)) ||
                                        Number(seed) < 1 ||
                                        Number(seed) > 999999999
                                    }
                                    onClick={() => {
                                        send({ type: "RESET", seed: Number(seed) });
                                        setPaused(true);
                                        setModal(null);
                                        navigate("site");
                                    }}
                                >
                                    Start a new circus <ArrowRight size={16} />
                                </button>
                                <button
                                    className="btn btn-secondary w-full"
                                    onClick={() => exportSite(state)}
                                >
                                    <Download size={16} /> Export current site
                                </button>
                            </>
                        ) : modal === "help" ? (
                            <>
                                <Tent className="modal-symbol" size={43} />
                                <span className="eyebrow">THE RINGMASTER’S FIELD GUIDE</span>
                                <h2 id="modal-title">One field. Your circus.</h2>
                                <p>
                                    Your task is to turn this meadow into a place people want to
                                    visit—and one that pays its bills.
                                </p>
                                <ol className="guide-list">
                                    <li>
                                        <strong>Build a working camp.</strong> Place a tent,
                                        generator, water tank, housing, and toilets. Connect
                                        buildings to the entrance with paths. Clear trees and rocks
                                        for more room.
                                    </li>
                                    <li>
                                        <strong>Recruit and assign.</strong> Performers bring the
                                        acts. Each tent needs a technician; concessions need
                                        vendors. Assign beds for a rested, motivated crew.
                                    </li>
                                    <li>
                                        <strong>Book the programme.</strong> Choose a tent, date,
                                        time, ticket price, and performers. Nobody can appear in two
                                        tents at once. A big top unlocks aerial acts.
                                    </li>
                                    <li>
                                        <strong>Open the gates.</strong> Guests walk your paths and
                                        shows follow your timetable. Pause or change speed, and
                                        respond when something goes wrong.
                                    </li>
                                    <li>
                                        <strong>Improve tomorrow.</strong> Review the report, rest
                                        your crew, refill supplies, and reinvest. Reach 300 guests,
                                        6 shows, and 60 reputation to establish your circus.
                                    </li>
                                </ol>
                                <div className="incident-note">
                                    Generators have limited capacity and range. Keep noisy equipment
                                    away from trailers. Guest services, benches, and flowers make a
                                    happier place.
                                </div>
                                <button
                                    className="btn btn-primary w-full"
                                    onClick={() => setModal(null)}
                                >
                                    Back to the meadow <ArrowRight size={15} />
                                </button>
                            </>
                        ) : (
                            <>
                                <Settings2 className="modal-symbol" size={37} />
                                <span className="eyebrow">KEEP YOUR LITTLE WORLD SAFE</span>
                                <h2 id="modal-title">Your site, wherever you go.</h2>
                                <p>
                                    Changes save automatically in this browser. Export your site to
                                    keep a backup or continue on another device. Imports replace the
                                    current site.
                                </p>
                                <div className="save-summary">
                                    <Tent size={28} />
                                    <div>
                                        <strong>Riverside Meadow</strong>
                                        <span>
                                            Day {state.day} · Seed {state.seed} ·{" "}
                                            {state.buildings.length} buildings
                                        </span>
                                    </div>
                                    <Check size={16} />
                                </div>
                                <button
                                    className="btn btn-primary w-full"
                                    onClick={() => {
                                        exportSite(state);
                                        setNotice("Your site has been exported.");
                                    }}
                                >
                                    <Download size={16} /> Export site
                                </button>
                                <button
                                    className="btn btn-secondary w-full"
                                    onClick={() => fileRef.current?.click()}
                                >
                                    <Upload size={16} /> Import site
                                </button>
                                <button
                                    className="btn btn-secondary w-full"
                                    onClick={() => setModal("new")}
                                >
                                    <RotateCcw size={16} /> Start a new site
                                </button>
                                <small className="muted">
                                    This location slice uses its own save format. Your original
                                    touring-demo save remains in browser storage.
                                </small>
                            </>
                        )}
                    </div>
                </div>
            )}
            <input
                ref={fileRef}
                className="sr-only"
                type="file"
                accept=".json,application/json"
                aria-label="Import site file"
                onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                        if (file.size > 5000000)
                            throw new Error("This file is too large for a site save.");
                        const restored = parseSiteSave(await file.text());
                        send({ type: "IMPORT", state: restored });
                        setPaused(true);
                        setModal(null);
                        navigate("site");
                        setNotice("Your site has been restored. The clock is paused.");
                    } catch (error) {
                        setNotice(
                            error instanceof Error
                                ? error.message
                                : "The save could not be imported.",
                        );
                    }
                    e.target.value = "";
                }}
            />
        </div>
    );
}
function InfoIcon() {
    return <Sparkles size={17} />;
}
function WrenchIcon() {
    return <Settings2 className="modal-symbol" size={40} />;
}
function LeafIcon() {
    return <Flag className="modal-symbol" size={40} />;
}
