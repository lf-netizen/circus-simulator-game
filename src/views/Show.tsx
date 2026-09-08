import {
    ArrowDown,
    ArrowRight,
    ArrowUp,
    Check,
    CircleAlert,
    Clock3,
    Coffee,
    GripVertical,
    Lightbulb,
    MicVocal,
    PanelTopClose,
    Play,
    Plus,
    Sparkles,
    Star,
    Ticket,
    Trash2,
    WandSparkles,
    Wrench,
} from "lucide-react";
import { ACTS, CITIES } from "../game/data";
import { formatMoney, getForecast, getShowReadiness } from "../game/engine";
import type { Act, GameViewProps } from "../game/types";
import "./troupe-show.css";

const SHOW_EVENTS = [
    {
        title: "The spotlight flickers.",
        description:
            "A faulty cable has dimmed the ring. Your technician can fix it, or the troupe can turn the mishap into a little comedy.",
        repair: "Repair the lights",
        icon: Lightbulb,
    },
    {
        title: "The microphone crackles.",
        description:
            "The ringmaster’s introduction dissolves into a squeal. Replace the failing connection, or let the troupe tell the next story with gestures and a grin.",
        repair: "Repair the microphone",
        icon: MicVocal,
    },
    {
        title: "The curtain won’t budge.",
        description:
            "A pulley has jammed just as your next performer is ready. Have the technician free it, or make an unexpected entrance through the audience.",
        repair: "Repair the curtain",
        icon: PanelTopClose,
    },
];

function Stage({ kind, active }: { kind: string; active: boolean }) {
    return (
        <svg
            className={`show-stage ${active ? "stage-active" : ""}`}
            viewBox="0 0 800 430"
            role="img"
            aria-label={
                active
                    ? `A ${kind} performance under the big top`
                    : "The illuminated circus ring awaits its performers"
            }
        >
            <defs>
                <radialGradient id="stageGlow">
                    <stop stopColor="#506d56" />
                    <stop offset="1" stopColor="#183e36" />
                </radialGradient>
                <linearGradient id="spotlight" x2=".6" y2="1">
                    <stop stopColor="#f9e6a7" stopOpacity=".3" />
                    <stop offset="1" stopColor="#f9e6a7" stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d="M0 0h800v430H0z" fill="url(#stageGlow)" />
            <path d="M0 0h800v18Q400 140 0 18" fill="#c19550" />
            <path d="M0 0h140q-1 129-76 217L0 267Zm800 0H660q1 129 76 217l64 50Z" fill="#ad6049" />
            <path
                d="M0 20h40q20 99-2 183M70 23q29 67 0 147M800 20h-40q-20 99 2 183m-32-180q-29 67 0 147"
                fill="none"
                stroke="#884c3b"
                strokeWidth="13"
                opacity=".5"
            />
            <path d="m153 37 378 313H242Zm494 0L269 350h289Z" fill="url(#spotlight)" />
            <path d="M103 64q297 127 594 0" fill="none" stroke="#ccb577" strokeWidth="1" />
            {Array.from({ length: 17 }, (_, i) => (
                <circle
                    key={i}
                    cx={112 + i * 36}
                    cy={68 + Math.sin((i / 16) * Math.PI) * 57}
                    r="3.5"
                    fill="#edce81"
                />
            ))}
            <ellipse cx="400" cy="347" rx="242" ry="63" fill="#102e28" />
            <ellipse cx="400" cy="329" rx="235" ry="63" fill="#c09456" />
            <ellipse cx="400" cy="322" rx="221" ry="52" fill="#d0b77d" />
            <ellipse
                cx="400"
                cy="322"
                rx="199"
                ry="42"
                fill="none"
                stroke="#ae8a51"
                strokeWidth="2"
            />
            {active ? (
                <g className="stage-performer">
                    {kind === "acrobat" && (
                        <>
                            <path
                                d="M350 0v173m100-173v173m-100 0h100"
                                stroke="#d5bd83"
                                strokeWidth="3"
                            />
                            <path
                                d="m362 175 23 53h30l23-53"
                                stroke="#e5b18c"
                                fill="none"
                                strokeWidth="10"
                                strokeLinecap="round"
                            />
                        </>
                    )}
                    <ellipse cx="400" cy="321" rx="36" ry="8" fill="#7c754d" opacity=".35" />
                    <path
                        d="m391 277-10 42m29-42 13 42"
                        stroke="#213f35"
                        strokeWidth="13"
                        strokeLinecap="round"
                    />
                    <path
                        d="m390 236-8 42h36l-9-42"
                        fill={kind === "clown" ? "#d5b559" : "#b86b51"}
                    />
                    <circle cx="400" cy="218" r="18" fill="#e5b18c" />
                    {kind !== "acrobat" && (
                        <path
                            d="m385 242-32 17-18-18m79 1 32 17 18-18"
                            fill="none"
                            stroke="#e5b18c"
                            strokeWidth="9"
                            strokeLinecap="round"
                        />
                    )}
                    {kind === "juggler" && (
                        <g className="juggling-balls">
                            <circle cx="344" cy="201" r="10" fill="#d9b252" />
                            <circle cx="399" cy="166" r="10" fill="#b9654e" />
                            <circle cx="454" cy="201" r="10" fill="#e6d49c" />
                        </g>
                    )}
                    {kind === "magic" && (
                        <>
                            <path
                                d="M387 180h26v29h-26Zm-8 29h42"
                                fill="#142e28"
                                stroke="#142e28"
                                strokeWidth="4"
                            />
                            <path d="m462 241 16-42" stroke="#efe3ba" strokeWidth="4" />
                            <path d="m487 179 4-10 4 10 10 4-10 4-4 10-4-10-10-4Z" fill="#e9c66f" />
                        </>
                    )}
                    {kind === "clown" && (
                        <>
                            <circle cx="400" cy="224" r="5" fill="#c74935" />
                            <path d="m384 203 16-31 16 31" fill="#d4a24e" />
                            <path d="m390 241 10 7-10 7m20-14-10 7 10 7" fill="#bd654d" />
                        </>
                    )}
                    {kind === "break" && (
                        <>
                            <path d="M359 267h82v59h-82Z" fill="#e9d6a0" />
                            <path
                                d="M359 267h12v59h-12Zm28 0h12v59h-12Zm28 0h12v59h-12Z"
                                fill="#bd694e"
                            />
                            {[369, 383, 399, 415, 431].map((x, i) => (
                                <circle
                                    key={x}
                                    cx={x}
                                    cy={263 - (i % 2) * 5}
                                    r="10"
                                    fill="#f2e5b4"
                                />
                            ))}
                        </>
                    )}
                </g>
            ) : (
                <>
                    <path d="M395 244h10v74h-10Z" fill="#e8d7a5" />
                    <circle cx="400" cy="233" r="14" fill="#c3a263" />
                    <path d="m393 223 14 20m-17-14 17 7" stroke="#eddeb7" strokeWidth="2" />
                </>
            )}
            {Array.from({ length: 19 }, (_, i) => (
                <g key={i} fill={i % 2 ? "#102c27" : "#193a31"}>
                    <circle cx={-14 + i * 46} cy={399 + Math.sin(i) * 9} r="15" />
                    <ellipse cx={-14 + i * 46} cy="430" rx="25" ry="27" />
                </g>
            ))}
            <path
                d="m203 176 3-7 3 7 7 3-7 3-3 7-3-7-7-3Zm380 53 3-7 3 7 7 3-7 3-3 7-3-7-7-3Z"
                fill="#c9ab67"
                opacity=".7"
            />
        </svg>
    );
}

export default function Show({ state, dispatch, navigate }: GameViewProps) {
    const acts = state.lineup
        .map((id) => ACTS.find((a) => a.id === id))
        .filter((a): a is Act => !!a);
    const available = ACTS.filter(
        (a) =>
            a.kind === "break" || state.performers.some((p) => p.id === a.performerId && p.hired),
    );
    const readiness = getShowReadiness(state);
    const forecast = getForecast(state);
    const live = state.liveShow;
    const current = live ? acts[live.step] : null;
    const city = CITIES.find((c) => c.id === state.cityId);
    const event = live && live.step === 1 && !live.eventResolved;
    const showEvent = SHOW_EVENTS[state.history.length % SHOW_EVENTS.length];
    const EventIcon = showEvent.icon;
    const audienceScore = live?.scores.length
        ? live.scores.reduce((sum, score) => sum + score, 0) / live.scores.length
        : null;
    const audienceFeedback =
        audienceScore === null
            ? "A room full of possibility."
            : audienceScore >= 4.5
              ? "They’re on their feet."
              : audienceScore >= 3.8
                ? "They’re loving it."
                : audienceScore >= 3
                  ? "The crowd is warming up."
                  : audienceScore >= 2.2
                    ? "A few restless seats."
                    : "A tough crowd tonight.";
    const duration = acts.reduce((n, a) => n + a.duration, 0);
    const move = (index: number, delta: number) => {
        const lineup = [...state.lineup];
        [lineup[index], lineup[index + delta]] = [lineup[index + delta], lineup[index]];
        dispatch({ type: "SET_LINEUP", lineup });
    };
    return (
        <div className="show-page">
            <div className="page-heading">
                <div>
                    <div className="eyebrow">LET THE WONDER BEGIN</div>
                    <h1>{live ? "The show must go on" : "Make it unforgettable"}</h1>
                    <p className="muted">
                        {live
                            ? "The spotlight is on. Your people are ready. Enjoy the magic."
                            : "A little suspense, a burst of laughter, and a spectacular finish."}
                    </p>
                </div>
                <span className="tag">
                    <Ticket size={14} />
                    {city?.name} · Day {state.day}
                </span>
            </div>
            {live ? (
                <div className="live-show-layout">
                    <div className="panel live-stage-panel">
                        <div className="live-heading">
                            <span className="live-indicator">
                                <span />
                                LIVE UNDER THE BIG TOP
                            </span>
                            <span>{live.tickets} guests in the audience</span>
                        </div>
                        <Stage kind={current?.kind ?? "magic"} active />
                        <div className="live-act-caption">
                            <span className="eyebrow">
                                {current?.kind === "break"
                                    ? "TIME FOR A LITTLE TREAT"
                                    : `ACT ${live.step + 1} OF ${acts.length}`}
                            </span>
                            <h2>{current?.name ?? "The grand finale"}</h2>
                            <p className="muted">
                                {current?.kind === "break"
                                    ? "The popcorn is warm and the audience is buzzing."
                                    : state.performers.find((p) => p.id === current?.performerId)
                                          ?.name}
                            </p>
                            <div className="live-step-dots">
                                {acts.map((a, i) => (
                                    <span
                                        key={`${a.id}-${i}`}
                                        className={
                                            i < live.step
                                                ? "complete"
                                                : i === live.step
                                                  ? "current"
                                                  : ""
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="live-side">
                        <div className="panel audience-panel">
                            <div className="eyebrow">FROM THE FRONT ROW</div>
                            <h2>{audienceFeedback}</h2>
                            <div className="audience-stars" aria-hidden="true">
                                {Array.from({ length: 5 }, (_, i) => (
                                    <span className="audience-star" key={i}>
                                        <Star size={23} />
                                        <span
                                            style={{
                                                width: `${Math.max(0, Math.min(1, (audienceScore ?? 0) - i)) * 100}%`,
                                            }}
                                        >
                                            <Star size={23} fill="currentColor" />
                                        </span>
                                    </span>
                                ))}
                            </div>
                            <p className="muted">
                                {live.scores.length
                                    ? `Audience score so far: ${audienceScore?.toFixed(1)} / 5`
                                    : "Your opening act sets the tone for the whole evening."}
                            </p>
                        </div>
                        {event ? (
                            <div className="panel show-event" role="alert">
                                <EventIcon size={24} />
                                <div className="eyebrow">A TWIST IN THE TALE</div>
                                <h2>{showEvent.title}</h2>
                                <p>{showEvent.description}</p>
                                <button
                                    className="btn btn-primary"
                                    disabled={state.money < 300}
                                    onClick={() =>
                                        dispatch({ type: "RESOLVE_EVENT", choice: "repair" })
                                    }
                                >
                                    <Wrench size={15} />
                                    {showEvent.repair} · {formatMoney(300)}
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() =>
                                        dispatch({ type: "RESOLVE_EVENT", choice: "improvise" })
                                    }
                                >
                                    <WandSparkles size={15} />
                                    Improvise · free
                                </button>
                            </div>
                        ) : (
                            <div className="panel next-act-panel">
                                <Sparkles size={25} />
                                <h2>
                                    {live.step === acts.length - 1
                                        ? "Take a bow."
                                        : "Keep the magic moving."}
                                </h2>
                                <p className="muted">
                                    {live.step === acts.length - 1
                                        ? "Finish the evening to see your audience reviews and box office results."
                                        : "Let the act unfold, then bring your next performer into the ring."}
                                </p>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => dispatch({ type: "ADVANCE_SHOW" })}
                                >
                                    {live.step === acts.length - 1
                                        ? "Finish the show"
                                        : "Perform & continue"}
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="show-planner-layout">
                    <div className="show-lineup-column">
                        <div className="panel lineup-panel">
                            <div className="lineup-heading">
                                <div>
                                    <span className="eyebrow">TONIGHT’S PROGRAMME</span>
                                    <h2>Every act has its moment.</h2>
                                </div>
                                <span className="tag">
                                    <Clock3 size={13} />
                                    {duration} min
                                </span>
                            </div>
                            <div className="show-timeline">
                                {acts.map((a, i) => (
                                    <span
                                        key={`${a.id}-${i}`}
                                        style={{ flex: a.duration }}
                                        className={`timeline-${a.kind}`}
                                        title={`${a.name}: ${a.duration} minutes`}
                                    />
                                ))}
                            </div>
                            <div className="lineup-list">
                                {acts.map((a, i) => (
                                    <div
                                        className={`lineup-row ${a.kind === "break" ? "lineup-break" : ""}`}
                                        key={`${a.id}-${i}`}
                                    >
                                        <span className="lineup-number">
                                            {String(i + 1).padStart(2, "0")}
                                        </span>
                                        <span className={`act-icon act-${a.kind}`}>
                                            {a.kind === "break" ? (
                                                <Coffee size={19} />
                                            ) : (
                                                <Sparkles size={19} />
                                            )}
                                        </span>
                                        <div className="lineup-act-name">
                                            <strong>{a.name}</strong>
                                            <span className="muted">
                                                {a.kind === "break"
                                                    ? "Refreshments & a little breathing room"
                                                    : state.performers.find(
                                                          (p) => p.id === a.performerId,
                                                      )?.name}
                                            </span>
                                        </div>
                                        <span className="lineup-duration">{a.duration} min</span>
                                        <div className="lineup-controls">
                                            <button
                                                aria-label={`Move ${a.name} up`}
                                                disabled={i === 0 || state.gameOver}
                                                onClick={() => move(i, -1)}
                                            >
                                                <ArrowUp size={14} />
                                            </button>
                                            <button
                                                aria-label={`Move ${a.name} down`}
                                                disabled={i === acts.length - 1 || state.gameOver}
                                                onClick={() => move(i, 1)}
                                            >
                                                <ArrowDown size={14} />
                                            </button>
                                            <button
                                                aria-label={`Remove ${a.name}`}
                                                disabled={state.gameOver}
                                                onClick={() =>
                                                    dispatch({
                                                        type: "SET_LINEUP",
                                                        lineup: state.lineup.filter(
                                                            (_, index) => index !== i,
                                                        ),
                                                    })
                                                }
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {!acts.length && (
                                <div className="lineup-empty">
                                    <GripVertical size={25} />
                                    <p>
                                        Your ring is a blank canvas.
                                        <br />
                                        Add your first act below.
                                    </p>
                                </div>
                            )}
                            <p className="lineup-footnote">
                                <Clock3 size={14} />
                                Aim for 90–210 minutes, with a break for refreshments.
                            </p>
                        </div>
                        <div className="panel available-acts-panel">
                            <div className="lineup-heading">
                                <div>
                                    <span className="eyebrow">A BOX OF POSSIBILITIES</span>
                                    <h2>Add a little more wonder</h2>
                                </div>
                                <button
                                    className="show-text-link"
                                    onClick={() => navigate("troupe")}
                                >
                                    Meet the troupe <ArrowRight size={14} />
                                </button>
                            </div>
                            <div className="available-acts">
                                {available.map((a) => (
                                    <button
                                        key={a.id}
                                        className={`available-act act-${a.kind}`}
                                        disabled={state.gameOver || state.lineup.includes(a.id)}
                                        onClick={() =>
                                            dispatch({
                                                type: "SET_LINEUP",
                                                lineup: [...state.lineup, a.id],
                                            })
                                        }
                                    >
                                        <span>
                                            {a.kind === "break" ? (
                                                <Coffee size={18} />
                                            ) : (
                                                <Sparkles size={18} />
                                            )}
                                            <strong>{a.name}</strong>
                                            <small>{a.duration} min</small>
                                        </span>
                                        {state.lineup.includes(a.id) ? (
                                            <Check size={16} />
                                        ) : (
                                            <Plus size={16} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="show-preview-column">
                        <div className="panel show-preview">
                            <Stage kind="magic" active={false} />
                            <div className="show-preview-content">
                                <span className="eyebrow">ONE NIGHT. A THOUSAND MEMORIES.</span>
                                <h2>The stage is yours.</h2>
                                <p className="muted">Give {city?.name} something to talk about.</p>
                                <div className="show-forecast">
                                    <div>
                                        <span>Expected audience</span>
                                        <strong>
                                            {forecast.tickets}
                                            <small> guests</small>
                                        </strong>
                                    </div>
                                    <div>
                                        <span>Ticket price</span>
                                        <strong>{formatMoney(state.ticketPrice)}</strong>
                                    </div>
                                </div>
                                <div className="show-readiness">
                                    {readiness.length ? (
                                        readiness.map((reason) => (
                                            <div key={reason}>
                                                <CircleAlert size={15} />
                                                <span>{reason}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="ready">
                                            <Check size={16} />
                                            <span>The ring is ready. Let’s make some magic.</span>
                                        </div>
                                    )}
                                </div>
                                <button
                                    className="btn btn-primary start-show-button"
                                    disabled={readiness.length > 0 || state.gameOver}
                                    onClick={() => dispatch({ type: "START_SHOW" })}
                                >
                                    <Play size={16} fill="currentColor" />
                                    Open the curtain
                                </button>
                                <button
                                    className="show-text-link show-ticket-link"
                                    onClick={() => navigate("marketing")}
                                >
                                    Manage tickets & promotion <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                        <div className="show-director-note">
                            <span className="eyebrow">THE ART OF THE RUNNING ORDER</span>
                            <p>
                                Open with charm. Build the suspense. Give them a breather. Save a
                                little wonder for the end.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
