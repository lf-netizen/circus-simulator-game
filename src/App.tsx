import { useEffect, useReducer, useRef, useState } from "react";
import {
    ArrowRight,
    Check,
    ChevronDown,
    CircleHelp,
    Download,
    Droplets,
    Flag,
    Fuel,
    LayoutDashboard,
    Map,
    Menu,
    Megaphone,
    RotateCcw,
    Settings2,
    ShoppingBag,
    Sparkles,
    Star,
    Tent,
    Trophy,
    Upload,
    Users,
    Wallet,
    X,
} from "lucide-react";
import type { View } from "./game/types";
import { CITIES } from "./game/data";
import { formatMoney, formatTime, reducer } from "./game/engine";
import { exportGame, loadGame, parseSave, saveGame } from "./game/persistence";
import Overview from "./views/Overview";
import { Marketing, Rankings, Route, Supplies } from "./views/Management";
import Troupe from "./views/Troupe";
import Show from "./views/Show";
import Grounds from "./views/Grounds";
const nav = [
    { id: "overview", name: "Overview", Icon: LayoutDashboard },
    { id: "route", name: "Tour map", Icon: Map },
    { id: "grounds", name: "Circus grounds", Icon: Tent },
    { id: "troupe", name: "Your troupe", Icon: Users },
    { id: "show", name: "The performance", Icon: Sparkles },
    { id: "marketing", name: "Tickets & promotion", Icon: Megaphone },
    { id: "supplies", name: "Supplies & upgrades", Icon: ShoppingBag },
    { id: "rankings", name: "The greats", Icon: Trophy },
] as const;
export default function App() {
    const [state, dispatch] = useReducer(reducer, undefined, loadGame);
    const [view, setView] = useState<View>("overview");
    const [menu, setMenu] = useState(false);
    const [modal, setModal] = useState<"save" | "help" | "reset" | null>(null);
    const [notice, setNotice] = useState("");
    const [saveFailed, setSaveFailed] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const dialogRef = useRef<HTMLDivElement>(null);
    const navigate = (v: View) => {
        setView(v);
        setMenu(false);
        window.scrollTo({ top: 0, behavior: "instant" });
    };
    useEffect(() => {
        try {
            setSaveFailed(!saveGame(state));
        } catch {
            setSaveFailed(true);
        }
    }, [state]);
    useEffect(() => {
        if (notice) {
            const t = setTimeout(() => setNotice(""), 4500);
            return () => clearTimeout(t);
        }
    }, [notice]);
    const overlay = !!modal || !!state.lastResult || state.gameOver;
    useEffect(() => {
        if (!overlay) return;
        const previous = document.activeElement as HTMLElement | null;
        dialogRef.current?.focus();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !state.gameOver) {
                setModal(null);
                if (state.lastResult) dispatch({ type: "DISMISS_RESULT" });
            }
            if (e.key === "Tab") {
                const items = dialogRef.current?.querySelectorAll<HTMLElement>(
                    'button:not(:disabled),input,a,[tabindex="0"]',
                );
                if (!items?.length) {
                    e.preventDefault();
                    return;
                }
                const first = items[0],
                    last = items[items.length - 1];
                if (
                    e.shiftKey &&
                    (document.activeElement === first ||
                        document.activeElement === dialogRef.current)
                ) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("keydown", onKey);
            previous?.focus();
        };
    }, [overlay, state.gameOver, state.lastResult]);
    const props = { state, dispatch, navigate };
    const Content = {
        overview: Overview,
        route: Route,
        grounds: Grounds,
        troupe: Troupe,
        show: Show,
        marketing: Marketing,
        supplies: Supplies,
        rankings: Rankings,
    }[view];
    const city = CITIES.find((c) => c.id === state.cityId)!;
    return (
        <div className="app-shell">
            <aside className={`sidebar ${menu ? "open" : ""}`}>
                <button
                    className="brand"
                    onClick={() => navigate("overview")}
                    aria-label="The Grand Tour home"
                >
                    <div className="brand-mark">
                        <Tent size={35} strokeWidth={1.1} />
                        <span>✦</span>
                    </div>
                    <strong>THE GRAND TOUR</strong>
                    <small>A CIRCUS STORY</small>
                </button>
                <div className="circus-switch">
                    <span className="circus-avatar">G</span>
                    <div>
                        <strong>{state.circusName}</strong>
                        <small>Independent & a little extraordinary</small>
                    </div>
                    <ChevronDown size={13} />
                </div>
                <span className="nav-heading">THE RINGMASTER’S DESK</span>
                <nav aria-label="Main navigation">
                    {nav.map(({ id, name, Icon }, i) => (
                        <button
                            className={`${view === id ? "active" : ""} ${i === 6 ? "nav-divider" : ""}`}
                            key={id}
                            onClick={() => navigate(id)}
                            aria-current={view === id ? "page" : undefined}
                        >
                            <Icon size={19} strokeWidth={1.65} />
                            <span>{name}</span>
                            {id === "show" && state.liveShow && <span className="live-dot" />}
                            {view === id && <span className="nav-active-dot" />}
                        </button>
                    ))}
                </nav>
                <div className="season-card">
                    <Flag size={18} />
                    <span>THE FIRST OF MANY ADVENTURES</span>
                    <h3>Season {String(state.season).padStart(2, "0")}</h3>
                    <div className="progress-track">
                        <span style={{ width: `${((state.history.length % 6) / 6) * 100}%` }} />
                    </div>
                    <small>{state.history.length % 6} of 6 shows this season</small>
                </div>
                <div className="sidebar-bottom">
                    <button onClick={() => setModal("help")}>
                        <CircleHelp size={17} /> Ringmaster’s guide
                    </button>
                    <button onClick={() => setModal("save")}>
                        <Settings2 size={17} /> Saves & settings
                    </button>
                    <span>
                        <i className={`dot ${saveFailed ? "rust" : "green"}`} />
                        {saveFailed
                            ? "Autosave unavailable · export your save"
                            : "Your adventure is saved automatically"}
                    </span>
                </div>
            </aside>
            {menu && (
                <button
                    className="mobile-scrim"
                    aria-label="Close menu"
                    onClick={() => setMenu(false)}
                />
            )}
            <div className="main-shell">
                <header className="topbar">
                    <div className="top-location">
                        <button
                            className="mobile-menu icon-btn"
                            onClick={() => setMenu(!menu)}
                            aria-label="Open navigation"
                        >
                            <Menu size={22} />
                        </button>
                        <Map size={16} />
                        <strong>{city.name}, Poland</strong>
                        <span className="top-separator" />
                        <span>
                            Day {state.day} <b>·</b> {formatTime(state)}
                        </span>
                    </div>
                    <div className="resources">
                        <span title="Available funds">
                            <Wallet size={16} />
                            <strong>{formatMoney(state.money)}</strong>
                        </span>
                        <span title="Fuel">
                            <Fuel size={16} />
                            <strong>
                                {state.fuel}
                                <small> L</small>
                            </strong>
                        </span>
                        <span title="Water">
                            <Droplets size={16} />
                            <strong>
                                {state.water}
                                <small> L</small>
                            </strong>
                        </span>
                        <span title="Global reputation">
                            <Star size={16} />
                            <strong>{Number(state.reputation.toFixed(1))}</strong>
                        </span>
                    </div>
                </header>
                <main key={view}>
                    {state.liveShow && view !== "show" && (
                        <div className="live-banner">
                            <Sparkles size={17} />
                            <span>
                                Your show is in progress. Finish the performance to resume
                                management.
                            </span>
                            <button className="btn btn-primary" onClick={() => navigate("show")}>
                                Return to the ring <ArrowRight size={15} />
                            </button>
                        </div>
                    )}
                    <Content {...props} />
                    <footer className="page-footer">
                        <span>
                            THE GRAND TOUR <i>✦</i> A circus story, made by you.
                        </span>
                        <span>Take your time. The clock moves when you do.</span>
                    </footer>
                </main>
            </div>
            {notice && (
                <div className="toast" role="status">
                    <Check size={17} />
                    {notice}
                </div>
            )}
            {overlay && (
                <div className="modal-backdrop">
                    <div
                        className={`modal ${state.lastResult ? "result-modal" : ""}`}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-title"
                        tabIndex={-1}
                        ref={dialogRef}
                    >
                        {!state.gameOver && (
                            <button
                                className="modal-close icon-btn"
                                aria-label="Close dialog"
                                onClick={() => {
                                    setModal(null);
                                    if (state.lastResult) dispatch({ type: "DISMISS_RESULT" });
                                }}
                            >
                                <X size={20} />
                            </button>
                        )}
                        {state.gameOver ? (
                            <>
                                <Tent className="modal-emblem" size={50} />
                                <span className="eyebrow">THE CURTAIN FALLS</span>
                                <h2 id="modal-title">Every ringmaster has a rough season.</h2>
                                <p>
                                    Your circus has run out of funds. You staged{" "}
                                    {state.history.length} performances and brought a little wonder
                                    along the way.
                                </p>
                                <button
                                    className="btn btn-primary w-full"
                                    onClick={() => {
                                        dispatch({ type: "RESET" });
                                        setModal(null);
                                        navigate("overview");
                                    }}
                                >
                                    Begin a new story <ArrowRight size={17} />
                                </button>
                                <button
                                    className="btn btn-secondary w-full"
                                    onClick={() => fileRef.current?.click()}
                                >
                                    <Upload size={16} /> Restore an exported save
                                </button>
                            </>
                        ) : state.lastResult ? (
                            <>
                                <div className="result-stars">✦ ★ ✦</div>
                                <span className="eyebrow">THE APPLAUSE IS YOURS</span>
                                <h2 id="modal-title">
                                    What a night in{" "}
                                    {CITIES.find((c) => c.id === state.lastResult!.cityId)?.name}.
                                </h2>
                                <p>The lights go down. A new page in your circus story.</p>
                                <div className="result-score">
                                    {state.lastResult.rating.toFixed(1)}
                                    <span>/ 5</span>
                                    <small>AUDIENCE RATING</small>
                                </div>
                                <div className="result-details">
                                    <div>
                                        <span>Tickets sold</span>
                                        <strong>{state.lastResult.tickets}</strong>
                                    </div>
                                    <div>
                                        <span>Tickets & concessions</span>
                                        <strong>{formatMoney(state.lastResult.revenue)}</strong>
                                    </div>
                                    <div>
                                        <span>Troupe wages</span>
                                        <strong>−{formatMoney(state.lastResult.wages)}</strong>
                                    </div>
                                    <div>
                                        <span>Show operating costs</span>
                                        <strong>−{formatMoney(state.lastResult.expenses)}</strong>
                                    </div>
                                    <div className="result-total">
                                        <span>Show profit</span>
                                        <strong>{formatMoney(state.lastResult.profit)}</strong>
                                    </div>
                                </div>
                                <small className="muted">
                                    Camp rental, promotion, training, and travel are paid
                                    separately.
                                </small>
                                <button
                                    className="btn btn-primary w-full"
                                    onClick={() => {
                                        dispatch({ type: "DISMISS_RESULT" });
                                        navigate("route");
                                    }}
                                >
                                    Find your next audience <ArrowRight size={17} />
                                </button>
                                <button
                                    className="btn btn-secondary w-full"
                                    onClick={() => {
                                        dispatch({ type: "DISMISS_RESULT" });
                                        navigate("overview");
                                    }}
                                >
                                    Back to camp
                                </button>
                            </>
                        ) : modal === "help" ? (
                            <>
                                <Tent className="modal-emblem" size={44} />
                                <span className="eyebrow">WELCOME, RINGMASTER</span>
                                <h2 id="modal-title">A little guide to a grand adventure.</h2>
                                <p>You manage the circus. Your troupe makes the magic.</p>
                                <ol className="guide-list">
                                    <li>
                                        <strong>Make camp.</strong> Set up your big top. Keep water
                                        and fuel in reserve.
                                    </li>
                                    <li>
                                        <strong>Prepare your people.</strong> Train for better acts,
                                        dress for the occasion, and rest to recover energy.
                                    </li>
                                    <li>
                                        <strong>Fill the seats.</strong> Balance ticket prices with
                                        local promotion.
                                    </li>
                                    <li>
                                        <strong>Raise the curtain.</strong> Arrange 90–210 minutes
                                        of acts, include an interval, and respond to a surprise.
                                    </li>
                                    <li>
                                        <strong>Follow the road.</strong> Collect your takings, pay
                                        your troupe, and find your next city. Six shows make a
                                        season.
                                    </li>
                                </ol>
                                <div className="guide-note">
                                    Planning is free. Actions move time forward. Overnight rest
                                    restores energy and costs upkeep. Run out of money and the
                                    curtain falls.
                                </div>
                                <button
                                    className="btn btn-primary w-full"
                                    onClick={() => setModal(null)}
                                >
                                    Let’s make some magic <Sparkles size={16} />
                                </button>
                            </>
                        ) : modal === "reset" ? (
                            <>
                                <RotateCcw className="modal-emblem" size={38} />
                                <h2 id="modal-title">Start a fresh story?</h2>
                                <p>
                                    This replaces your current browser save. Export it first if
                                    you’d like to return to this circus later.
                                </p>
                                <button
                                    className="btn btn-secondary w-full"
                                    onClick={() => {
                                        exportGame(state);
                                        setNotice("Save exported. Keep it for your next encore.");
                                    }}
                                >
                                    <Download size={16} /> Export current adventure
                                </button>
                                <button
                                    className="btn btn-danger w-full"
                                    onClick={() => {
                                        dispatch({ type: "RESET" });
                                        setModal(null);
                                        navigate("overview");
                                        setNotice("A new adventure awaits.");
                                    }}
                                >
                                    Start new game
                                </button>
                                <button
                                    className="btn btn-secondary w-full"
                                    onClick={() => setModal("save")}
                                >
                                    Keep this adventure
                                </button>
                            </>
                        ) : (
                            <>
                                <Settings2 className="modal-emblem" size={38} />
                                <span className="eyebrow">YOUR ADVENTURE, TO GO</span>
                                <h2 id="modal-title">Keep your story safe.</h2>
                                <p>
                                    Your progress saves in this browser after every action. Export a
                                    save to keep a backup or continue on another device.
                                </p>
                                <div className="save-summary">
                                    <Tent size={26} />
                                    <div>
                                        <strong>{state.circusName}</strong>
                                        <small>
                                            Season {state.season} · Day {state.day} · {city.name}
                                        </small>
                                    </div>
                                    <span className="tag tag-green">
                                        {saveFailed ? "Export recommended" : "Saved locally"}
                                    </span>
                                </div>
                                <button
                                    className="btn btn-primary w-full"
                                    onClick={() => {
                                        exportGame(state);
                                        setNotice("Save exported. Keep it for your next encore.");
                                    }}
                                >
                                    <Download size={17} /> Export save
                                </button>
                                <button
                                    className="btn btn-secondary w-full"
                                    onClick={() => fileRef.current?.click()}
                                >
                                    <Upload size={17} /> Import save
                                </button>
                                <button
                                    className="btn text-danger w-full"
                                    onClick={() => setModal("reset")}
                                >
                                    <RotateCcw size={15} /> Start a new game
                                </button>
                                <small className="muted">
                                    Import replaces your current adventure. Only valid Grand Tour
                                    saves are accepted. No account or server needed.
                                </small>
                            </>
                        )}
                    </div>
                </div>
            )}
            <input
                className="sr-only"
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                aria-label="Import save file"
                onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                        if (file.size > 2000000) throw new Error("Save file is too large.");
                        const imported = parseSave(await file.text());
                        dispatch({ type: "IMPORT", state: imported });
                        setModal(null);
                        navigate("overview");
                        setNotice("Your adventure has been restored.");
                    } catch (error) {
                        setNotice(
                            error instanceof Error
                                ? error.message
                                : "This save could not be imported.",
                        );
                    }
                    e.target.value = "";
                }}
            />
        </div>
    );
}
