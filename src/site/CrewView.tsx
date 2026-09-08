import { useState } from "react";
import {
    ArrowUpRight,
    Users,
    Moon,
    Zap,
    Sparkles,
    Heart,
    Dumbbell,
    Home,
    Wrench,
} from "lucide-react";
import type { Person, SiteViewProps } from "./types";
import { buildingDef } from "./data";
import { formatMoney } from "./engine";
import { getStats, getBuildingStatus, distance } from "./spatial";
import "./site-views.css";

export function PerformerPortrait({
    performer,
    small = false,
}: {
    performer: Person;
    small?: boolean;
}) {
    const { role: kind, color } = performer;
    return (
        <svg
            className={`crew-portrait ${small ? "crew-portrait-small" : ""}`}
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
            {kind === "magician" && (
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

function Meter({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Zap }) {
    return (
        <div className="crew-meter">
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
            <div className="progress-track">
                <span style={{ width: `${value}%` }} />
            </div>
        </div>
    );
}

export default function CrewView({ state, dispatch, navigate }: SiteViewProps) {
    const [tab, setTab] = useState<"hired" | "available">("hired");
    const [dismiss, setDismiss] = useState<string | null>(null);
    const hired = state.people.filter((p) => p.hired);
    const people = state.people.filter((p) => p.hired === (tab === "hired"));
    const busy = state.phase !== "planning" || state.gameOver;
    const stats = getStats(state);
    const homes = state.buildings.filter((b) => b.kind === "trailer");
    return (
        <div className="site-view crew-view">
            <div className="page-heading">
                <div>
                    <span className="eyebrow">THE PEOPLE BEHIND THE MAGIC</span>
                    <h1>A place to belong.</h1>
                    <p className="muted">
                        Recruit talent, make room backstage, and help your people shine.
                    </p>
                </div>
                <button className="btn btn-secondary" onClick={() => navigate("schedule")}>
                    Plan a performance <ArrowUpRight size={16} />
                </button>
            </div>
            <div className="panel crew-summary">
                <div className="crew-summary-icon">
                    <Users size={25} />
                </div>
                <div>
                    <strong>{hired.length} people in your circus</strong>
                    <span className="muted">
                        {formatMoney(stats.dailyWages)} in wages every day
                    </span>
                </div>
                <div className="crew-summary-bed">
                    <Home size={17} />
                    <strong>
                        {stats.housed} / {stats.beds}
                    </strong>
                    <span className="muted">beds occupied</span>
                </div>
                <button className="btn btn-secondary" onClick={() => navigate("site")}>
                    Build a home <ArrowUpRight size={15} />
                </button>
            </div>
            <div className="site-tabs" role="tablist" aria-label="Crew roster">
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
                    Talent scouting <span>{state.people.length - hired.length}</span>
                </button>
            </div>
            {busy && (
                <div className="site-note">
                    <Moon size={18} />
                    Crew changes and training resume next morning.
                </div>
            )}
            <div className="crew-grid">
                {people.map((p) => {
                    const work = state.buildings.filter((b) =>
                        p.role === "technician"
                            ? ["smallTent", "bigTop"].includes(b.kind)
                            : p.role === "vendor"
                              ? ["popcorn", "lemonade", "carousel"].includes(b.kind)
                              : false,
                    );
                    const home = state.buildings.find((b) => b.id === p.homeId);
                    const homeStatus = home ? getBuildingStatus(state, home) : null;
                    const noisy =
                        home &&
                        state.buildings.some(
                            (b) => b.kind === "generator" && distance(b, home) < 4,
                        );
                    const recovery = !home ? 15 : homeStatus?.operational && !noisy ? 40 : 25;
                    const booked = state.bookings.some(
                        (b) => b.status === "scheduled" && b.acts.some((a) => a.personId === p.id),
                    );
                    return (
                        <article className="panel crew-card" key={p.id}>
                            <div className="crew-art">
                                <span className="eyebrow">
                                    {p.role === "technician"
                                        ? "BEHIND THE CURTAIN"
                                        : p.role === "vendor"
                                          ? "A WARM WELCOME"
                                          : "A LITTLE EXTRAORDINARY"}
                                </span>
                                <PerformerPortrait performer={p} />
                                <span className={"crew-status " + (p.energy < 35 ? "tired" : "")}>
                                    <i />
                                    {!p.hired
                                        ? "Available to join"
                                        : p.energy < 35
                                          ? "Ready for a rest"
                                          : "Ready for the day"}
                                </span>
                            </div>
                            <div className="crew-details">
                                <h2>{p.name}</h2>
                                <div className="crew-role">
                                    <span>{p.role}</span>
                                    <span>{formatMoney(p.wage)} / day</span>
                                </div>
                                <div className="crew-meters">
                                    <Meter label="Skill" value={p.skill} icon={Sparkles} />
                                    <Meter label="Energy" value={p.energy} icon={Zap} />
                                    <Meter label="Morale" value={p.morale} icon={Heart} />
                                </div>
                                {p.hired ? (
                                    <>
                                        <label className="site-field">
                                            <span>
                                                <Home size={13} />
                                                Home trailer
                                            </span>
                                            <select
                                                aria-label={`Home for ${p.name}`}
                                                value={p.homeId ?? ""}
                                                disabled={busy}
                                                onChange={(e) =>
                                                    dispatch({
                                                        type: "ASSIGN_HOME",
                                                        id: p.id,
                                                        buildingId: e.target.value || null,
                                                    })
                                                }
                                            >
                                                <option value="">No bed assigned</option>
                                                {homes.map((b) => {
                                                    const occupied = hired.filter(
                                                        (other) => other.homeId === b.id,
                                                    ).length;
                                                    const beds = buildingDef(b.kind).beds ?? 0;
                                                    return (
                                                        <option
                                                            key={b.id}
                                                            value={b.id}
                                                            disabled={
                                                                occupied >= beds &&
                                                                p.homeId !== b.id
                                                            }
                                                        >
                                                            {b.name} ({b.x + 1},{b.y + 1}) ·{" "}
                                                            {occupied}/{beds} beds
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </label>
                                        <p
                                            className={
                                                "crew-home-note " +
                                                (!home || noisy || !homeStatus?.operational
                                                    ? "warning"
                                                    : "")
                                            }
                                        >
                                            <Moon size={13} />
                                            {`+${recovery} energy overnight · ${!home ? "Outdoors · −8 morale" : noisy ? "Generator noise · +3 morale" : !homeStatus?.operational ? "Needs services · +3 morale" : "Quiet home · +3 morale"}`}
                                        </p>
                                        {(p.role === "technician" || p.role === "vendor") && (
                                            <label className="site-field">
                                                <span>
                                                    <Wrench size={13} />
                                                    Work assignment
                                                </span>
                                                <select
                                                    aria-label={`Work for ${p.name}`}
                                                    value={p.assignmentId ?? ""}
                                                    disabled={busy}
                                                    onChange={(e) =>
                                                        dispatch({
                                                            type: "ASSIGN_WORK",
                                                            id: p.id,
                                                            buildingId: e.target.value || null,
                                                        })
                                                    }
                                                >
                                                    <option value="">Choose a workplace</option>
                                                    {work.map((b) => {
                                                        const worker = hired.find(
                                                            (other) =>
                                                                other.assignmentId === b.id &&
                                                                other.id !== p.id,
                                                        );
                                                        return (
                                                            <option
                                                                key={b.id}
                                                                value={b.id}
                                                                disabled={!!worker}
                                                            >
                                                                {b.name} ({b.x + 1},{b.y + 1})
                                                                {worker
                                                                    ? ` · ${worker.name.split(" ")[0]}`
                                                                    : ""}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                            </label>
                                        )}
                                        <div className="crew-actions">
                                            <button
                                                className="btn btn-secondary"
                                                disabled={
                                                    busy ||
                                                    state.money < 120 ||
                                                    p.energy < 35 ||
                                                    p.skill >= 100
                                                }
                                                title="+4 skill, −12 energy. Needs at least 35 energy."
                                                onClick={() =>
                                                    dispatch({ type: "TRAIN", id: p.id })
                                                }
                                            >
                                                <Dumbbell size={14} />
                                                Train · {formatMoney(120)}
                                            </button>
                                            <button
                                                className="crew-dismiss"
                                                disabled={busy || booked}
                                                title={
                                                    booked
                                                        ? "Cancel future performances before dismissing this person"
                                                        : "Dismiss from troupe"
                                                }
                                                onClick={() => setDismiss(p.id)}
                                            >
                                                Dismiss
                                            </button>
                                        </div>
                                        {dismiss === p.id && (
                                            <div className="crew-dismiss-confirm">
                                                <p>
                                                    Let {p.name.split(" ")[0]} go? Their bed and
                                                    workplace will become available.
                                                </p>
                                                <button
                                                    className="btn btn-secondary"
                                                    onClick={() => setDismiss(null)}
                                                >
                                                    Keep in troupe
                                                </button>
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => {
                                                        dispatch({ type: "FIRE", id: p.id });
                                                        setDismiss(null);
                                                    }}
                                                >
                                                    Dismiss
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <button
                                        className="btn btn-primary crew-hire"
                                        disabled={busy || state.money < p.hireCost}
                                        onClick={() => dispatch({ type: "HIRE", id: p.id })}
                                    >
                                        <Users size={15} />
                                        Hire · {formatMoney(p.hireCost)}
                                    </button>
                                )}
                            </div>
                        </article>
                    );
                })}
            </div>
            {people.length === 0 && (
                <div className="panel site-empty">
                    <Users size={32} />
                    <h2>
                        {tab === "hired"
                            ? "Your next great act starts here."
                            : "The whole gang is here."}
                    </h2>
                    <p className="muted">
                        {tab === "hired"
                            ? "Find performers to fill your ring and support staff to keep it running."
                            : "Every available candidate has a place in your circus."}
                    </p>
                    <button
                        className="btn btn-primary"
                        onClick={() =>
                            tab === "hired" ? setTab("available") : navigate("schedule")
                        }
                    >
                        {tab === "hired" ? "Scout talent" : "Plan a show"}
                    </button>
                </div>
            )}
            <div className="site-note">
                <Sparkles size={18} />
                <p>
                    <strong>Good shows start backstage.</strong> Every tent needs its own
                    technician. Food stands and the carousel each need a vendor. Wages are paid at
                    closing, even on quiet days.
                </p>
            </div>
        </div>
    );
}
