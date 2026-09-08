import { useState } from "react";
import {
    ArrowUpRight,
    Check,
    Dumbbell,
    Heart,
    Moon,
    Shirt,
    Sparkles,
    Tent,
    Users,
    Zap,
} from "lucide-react";
import type { GameViewProps, Performer } from "../game/types";
import { formatMoney } from "../game/engine";
import "./troupe-show.css";

export function PerformerPortrait({
    performer,
    small = false,
}: {
    performer: Performer;
    small?: boolean;
}) {
    const { kind, color } = performer;
    return (
        <svg
            className={`performer-portrait ${small ? "portrait-small" : ""}`}
            viewBox="0 0 240 210"
            role="img"
            aria-label={`${performer.name}, ${performer.role}`}
        >
            <path d="M29 210V103a91 91 0 0 1 182 0v107" fill={color} opacity=".17" />
            <circle cx="120" cy="96" r="67" fill={color} opacity=".1" />
            <g fill="none" stroke={color} strokeWidth="1" opacity=".45">
                <path d="m35 67 10-5 4 11M194 43l-8 9 11 7M35 171l12-4M200 157l-10-8" />
                <circle cx="56" cy="41" r="3" />
                <circle cx="195" cy="112" r="3" />
            </g>
            {kind === "acrobat" && (
                <>
                    <path d="M67 0v83m106-83v83M67 82h106" stroke="#776d54" strokeWidth="3" />
                    <path
                        d="m80 142-15-56m95 56 15-56"
                        stroke="#d99d79"
                        strokeWidth="13"
                        strokeLinecap="round"
                    />
                </>
            )}
            {kind === "juggler" && (
                <>
                    <circle cx="54" cy="77" r="11" fill="#c69b4d" />
                    <circle cx="185" cy="67" r="11" fill="#bd694e" />
                    <circle cx="117" cy="28" r="10" fill="#446452" />
                    <path
                        d="M53 101q5 24 18 28m110-41q-2 20-17 28"
                        fill="none"
                        stroke="#b6af99"
                        strokeDasharray="3 5"
                    />
                </>
            )}
            <path d="M64 210v-31q0-53 56-53t56 53v31" fill={color} />
            <path d="m109 125-4 18 15 17 15-17-4-18" fill="#e4b08b" />
            <ellipse cx="120" cy="94" rx="30" ry="37" fill="#e5b18c" />
            <path
                d="M89 100V77q2-29 33-27 33 1 29 39l-9-6-4-16q-18 20-43 17v17Z"
                fill={kind === "clown" ? "#ac563c" : "#433b32"}
            />
            {kind === "acrobat" && <circle cx="140" cy="50" r="15" fill="#433b32" />}
            <path d="M103 96h5m24 0h5" stroke="#463c31" strokeWidth="3" strokeLinecap="round" />
            <path
                d="m119 100-3 9h5m-9 9q9 5 18-2"
                fill="none"
                stroke="#a96b51"
                strokeWidth="2"
                strokeLinecap="round"
            />
            {kind === "clown" && (
                <>
                    <circle cx="120" cy="107" r="8" fill="#c85942" />
                    <path d="m92 129 28 17-25 14Zm56 0-28 17 25 14Z" fill="#e2bd62" />
                    <circle cx="120" cy="178" r="7" fill="#eadcae" />
                    <circle cx="120" cy="204" r="7" fill="#eadcae" />
                    <path d="m96 61 24-39 24 39" fill="#c79d50" />
                    <circle cx="120" cy="23" r="6" fill="#c95b44" />
                </>
            )}
            {kind === "magic" && (
                <>
                    <path d="M91 37h58v42H91Z" fill="#283f36" />
                    <path d="M91 65h58v10H91Z" fill="#c79d50" />
                    <path d="M80 80h80" stroke="#283f36" strokeWidth="8" strokeLinecap="round" />
                    <path d="m104 139 16 8-16 8m32-16-16 8 16 8" fill="#d5b475" />
                    <path d="m93 154 18 56H80l-15-50m81-6-18 56h32l15-50" fill="#244d3e" />
                    <path d="m176 194 15-57" stroke="#e2cf9c" strokeWidth="5" />
                    <path d="m188 148 3-11" stroke="#fcf6df" strokeWidth="5" />
                </>
            )}
            {(kind === "acrobat" || kind === "juggler") && (
                <>
                    <path d="m92 136 28 42 28-42" fill="none" stroke="#ead6a0" strokeWidth="5" />
                    <path d="m116 184 4-7 4 7 8 1-6 6 2 8-8-4-8 4 2-8-6-6Z" fill="#ead6a0" />
                </>
            )}
            <path d="M30 209h180" stroke={color} strokeWidth="2" opacity=".4" />
        </svg>
    );
}

function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Zap }) {
    return (
        <div className="performer-stat">
            <div>
                <span>
                    <Icon size={13} />
                    {label}
                </span>
                <strong>
                    {value}
                    <small>/100</small>
                </strong>
            </div>
            <div className="stat-meter">
                <span style={{ width: `${value}%` }} />
            </div>
        </div>
    );
}

export default function Troupe({ state, dispatch, navigate }: GameViewProps) {
    const [tab, setTab] = useState<"hired" | "available">("hired");
    const hired = state.performers.filter((p) => p.hired);
    const performers = state.performers.filter((p) => p.hired === (tab === "hired"));
    const busy = !!state.liveShow || state.gameOver;
    return (
        <div className="troupe-page">
            <div className="page-heading">
                <div>
                    <div className="eyebrow">THE PEOPLE BEHIND THE MAGIC</div>
                    <h1>Your extraordinary troupe</h1>
                    <p className="muted">
                        A little practice. A little sparkle. A whole lot of heart.
                    </p>
                </div>
                <button className="btn btn-secondary" onClick={() => navigate("show")}>
                    Plan the show <ArrowUpRight size={16} />
                </button>
            </div>
            <div className="troupe-summary panel">
                <div className="troupe-summary-symbol">
                    <Users size={25} />
                </div>
                <div>
                    <strong>{hired.length} remarkable performers</strong>
                    <span className="muted">One extraordinary circus</span>
                </div>
                <div className="troupe-summary-metric">
                    <span className="muted">Wages per show</span>
                    <strong>{formatMoney(hired.reduce((sum, p) => sum + p.wage, 0))}</strong>
                </div>
                <button
                    className="btn btn-secondary"
                    disabled={busy}
                    onClick={() => dispatch({ type: "REST" })}
                >
                    <Moon size={15} />
                    Rest until morning
                </button>
            </div>
            <div className="troupe-toolbar">
                <div className="troupe-tabs" role="tablist" aria-label="Performer roster">
                    <button
                        role="tab"
                        aria-selected={tab === "hired"}
                        className={tab === "hired" ? "active" : ""}
                        onClick={() => setTab("hired")}
                    >
                        Your troupe <span>{hired.length}</span>
                    </button>
                    <button
                        role="tab"
                        aria-selected={tab === "available"}
                        className={tab === "available" ? "active" : ""}
                        onClick={() => setTab("available")}
                    >
                        Talent scouting <span>{state.performers.length - hired.length}</span>
                    </button>
                </div>
                <span className="muted troupe-toolbar-note">
                    Great performances start backstage.
                </span>
            </div>
            {!state.setup && (
                <div className="troupe-setup-note">
                    <Tent size={19} />
                    <p>
                        <strong>First, give them a place to practice.</strong> Set up your circus
                        grounds to unlock training.
                    </p>
                    <button className="show-text-link" onClick={() => navigate("grounds")}>
                        Go to the grounds <ArrowUpRight size={14} />
                    </button>
                </div>
            )}
            <div className="performer-grid">
                {performers.map((p) => (
                    <article className="panel performer-card" key={p.id}>
                        <div className="performer-art">
                            <span className="eyebrow">
                                {p.kind === "magic"
                                    ? "THE IMPOSSIBLE"
                                    : p.kind === "acrobat"
                                      ? "A LITTLE DARING"
                                      : p.kind === "juggler"
                                        ? "PERFECT BALANCE"
                                        : "PURE JOY"}
                            </span>
                            <PerformerPortrait performer={p} />
                            <span className={`performer-status ${p.energy < 35 ? "tired" : ""}`}>
                                <span />
                                {p.hired
                                    ? p.energy < 35
                                        ? "Needs rest"
                                        : "Ready to shine"
                                    : "Available to hire"}
                            </span>
                        </div>
                        <div className="performer-details">
                            <h2>{p.name}</h2>
                            <div className="performer-role">
                                <span>{p.role}</span>
                                <span>{formatMoney(p.wage)} / show</span>
                            </div>
                            <div className="performer-stats">
                                <Stat label="Skill" value={p.skill} icon={Sparkles} />
                                <Stat label="Energy" value={p.energy} icon={Zap} />
                                <Stat label="Morale" value={p.morale} icon={Heart} />
                            </div>
                            {p.hired ? (
                                <div className="performer-actions">
                                    <button
                                        className="btn btn-secondary"
                                        disabled={
                                            busy ||
                                            !state.setup ||
                                            state.money < 180 ||
                                            p.energy < 25 ||
                                            p.skill >= 100
                                        }
                                        title={
                                            !state.setup
                                                ? "Set up your circus before training"
                                                : "Gain skill; costs energy and two hours"
                                        }
                                        onClick={() => dispatch({ type: "TRAIN", id: p.id })}
                                    >
                                        <Dumbbell size={14} />
                                        Train · {formatMoney(180)}
                                    </button>
                                    <button
                                        className={`btn ${p.costume ? "costume-equipped" : "btn-secondary"}`}
                                        disabled={busy || p.costume || state.money < 450}
                                        onClick={() => dispatch({ type: "COSTUME", id: p.id })}
                                    >
                                        {p.costume ? <Check size={14} /> : <Shirt size={14} />}{" "}
                                        {p.costume
                                            ? "Dressed to impress"
                                            : `Costume · ${formatMoney(450)}`}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    className="btn btn-primary hire-button"
                                    disabled={busy || state.money < p.wage * 3}
                                    onClick={() => dispatch({ type: "HIRE", id: p.id })}
                                >
                                    <Users size={15} />
                                    Invite to the troupe · {formatMoney(p.wage * 3)}
                                </button>
                            )}
                        </div>
                    </article>
                ))}
            </div>
            {performers.length === 0 && (
                <div className="panel troupe-empty">
                    <Sparkles size={28} />
                    <h2>The whole gang is here.</h2>
                    <p className="muted">
                        Every available performer has joined your troupe. Time to make some magic.
                    </p>
                    <button className="btn btn-primary" onClick={() => navigate("show")}>
                        Plan your next show
                    </button>
                </div>
            )}
            <div className="troupe-tip">
                <Sparkles size={18} />
                <p>
                    <strong>A ringmaster’s note.</strong> Training builds skill but uses energy.
                    Give your people a good night’s rest, and let a beautiful costume do the rest.
                </p>
            </div>
        </div>
    );
}
