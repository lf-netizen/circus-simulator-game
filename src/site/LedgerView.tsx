import { useState } from "react";
import {
    ArrowDownLeft,
    ArrowUpRight,
    ChevronDown,
    ChevronUp,
    Coins,
    Flag,
    Receipt,
    Sparkles,
    Ticket,
    Users,
    Wrench,
} from "lucide-react";
import type { DayReport, SiteViewProps } from "./types";
import { formatMoney } from "./engine";
import { getStats } from "./spatial";
import "./site-views.css";

function ReportRow({ report }: { report: DayReport }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="ledger-report">
            <button
                className="ledger-report-toggle"
                aria-expanded={open}
                onClick={() => setOpen(!open)}
            >
                <span className="ledger-day-badge">{String(report.day).padStart(2, "0")}</span>
                <span>
                    <strong>Day {report.day}</strong>
                    <small>
                        {report.shows} {report.shows === 1 ? "show" : "shows"} · {report.guests}{" "}
                        guests{report.shows ? ` · ${report.rating}/5 rating` : ""}
                    </small>
                </span>
                <strong className={report.profit >= 0 ? "positive" : "negative"}>
                    {report.profit > 0 ? "+" : ""}
                    {formatMoney(report.profit)}
                </strong>
                {open ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
            </button>
            {open && (
                <div className="ledger-report-details">
                    <div className="ledger-line">
                        <span>Ticket sales</span>
                        <strong>{formatMoney(report.ticketRevenue)}</strong>
                    </div>
                    <div className="ledger-line">
                        <span>Food & attractions</span>
                        <strong>{formatMoney(report.concessionRevenue)}</strong>
                    </div>
                    <div className="ledger-line">
                        <span>Crew wages</span>
                        <strong>−{formatMoney(report.wages)}</strong>
                    </div>
                    <div className="ledger-line">
                        <span>Site upkeep</span>
                        <strong>−{formatMoney(report.upkeep)}</strong>
                    </div>
                    <div className="ledger-line">
                        <span>Show repairs</span>
                        <strong>−{formatMoney(report.repairs)}</strong>
                    </div>
                    <div className="ledger-line">
                        <span>Fuel / resource costs</span>
                        <strong>−{formatMoney(report.fuelCost)}</strong>
                    </div>
                    <div className="ledger-line total">
                        <span>Operating result</span>
                        <strong>{formatMoney(report.profit)}</strong>
                    </div>
                    {report.notes.map((note, i) => (
                        <p className="muted" key={i}>
                            {note}
                        </p>
                    ))}
                </div>
            )}
        </div>
    );
}
export default function LedgerView({ state, navigate }: SiteViewProps) {
    const stats = getStats(state);
    const completed = state.bookings.filter((b) => b.status === "completed");
    const guests =
        state.history.reduce((sum, r) => sum + r.guests, 0) +
        (state.phase === "closed" ? 0 : state.today.guests);
    const shows =
        state.history.reduce((sum, r) => sum + r.shows, 0) +
        (state.phase === "closed" ? 0 : state.today.shows);
    const income = state.today.ticketRevenue + state.today.concessionRevenue;
    const dailyCosts = stats.dailyWages + stats.dailyUpkeep;
    const reports = [...state.history].reverse();
    const max = Math.max(
        1,
        ...reports.map((r) =>
            Math.max(
                r.ticketRevenue + r.concessionRevenue,
                r.wages + r.upkeep + r.fuelCost + r.repairs,
            ),
        ),
    );
    const goals = [
        { label: "Guests delighted", current: guests, target: 300, icon: Users },
        { label: "Performances given", current: shows, target: 6, icon: Ticket },
        { label: "Circus reputation", current: state.reputation, target: 60, icon: Sparkles },
    ];
    return (
        <div className="site-view ledger-view">
            <div className="page-heading">
                <div>
                    <span className="eyebrow">KEEP THE MAGIC IN BUSINESS</span>
                    <h1>The little green ledger.</h1>
                    <p className="muted">
                        Good memories for your guests. A future for your circus.
                    </p>
                </div>
                <button className="btn btn-secondary" onClick={() => navigate("schedule")}>
                    Plan the next show <ArrowUpRight size={16} />
                </button>
            </div>
            <div className="ledger-top">
                <div className="panel ledger-balance">
                    <div className="ledger-balance-top">
                        <span className="eyebrow">MONEY IN THE TIN</span>
                        <Coins size={22} />
                    </div>
                    <strong>{formatMoney(state.money)}</strong>
                    <p>Build carefully. Every new attraction brings opportunity—and upkeep.</p>
                    <div>
                        <span>Daily wages & upkeep</span>
                        <b>{formatMoney(dailyCosts)}</b>
                    </div>
                </div>
                <section className="panel ledger-today">
                    <span className="eyebrow">
                        DAY {state.day} ·{" "}
                        {state.phase === "closed" ? "CLOSING FIGURES" : "SO FAR TODAY"}
                    </span>
                    <h2>The day's takings</h2>
                    <div className="ledger-line">
                        <span>
                            <Ticket size={15} />
                            Ticket sales
                        </span>
                        <strong className="positive">
                            {formatMoney(state.today.ticketRevenue)}
                        </strong>
                    </div>
                    <div className="ledger-line">
                        <span>
                            <ArrowDownLeft size={15} />
                            Food & attractions
                        </span>
                        <strong className="positive">
                            {formatMoney(state.today.concessionRevenue)}
                        </strong>
                    </div>
                    <div className="ledger-line">
                        <span>
                            <Users size={15} />
                            Daily crew wages
                        </span>
                        <strong>−{formatMoney(stats.dailyWages)}</strong>
                    </div>
                    <div className="ledger-line">
                        <span>
                            <Receipt size={15} />
                            Daily site upkeep
                        </span>
                        <strong>−{formatMoney(stats.dailyUpkeep)}</strong>
                    </div>
                    <div className="ledger-line">
                        <span>
                            <Wrench size={15} />
                            Show repairs
                        </span>
                        <strong>−{formatMoney(state.today.repairs)}</strong>
                    </div>
                    <div className="ledger-line total">
                        <span>Before other upfront purchases</span>
                        <strong
                            className={
                                income - dailyCosts - state.today.repairs >= 0
                                    ? "positive"
                                    : "negative"
                            }
                        >
                            {formatMoney(income - dailyCosts - state.today.repairs)}
                        </strong>
                    </div>
                </section>
            </div>
            <section className={"panel circus-milestone " + (state.won ? "achieved" : "")}>
                <div className="milestone-heading">
                    <div className="milestone-icon">
                        <Flag size={22} />
                    </div>
                    <div>
                        <span className="eyebrow">YOUR FIRST LITTLE SUCCESS</span>
                        <h2>
                            {state.won
                                ? "A circus worth coming back to."
                                : "Become the talk of the neighbourhood."}
                        </h2>
                        <p className="muted">
                            Welcome 300 guests, give 6 shows, and reach 60 reputation. Keep building
                            after you get there.
                        </p>
                    </div>
                </div>
                <div className="milestone-goals">
                    {goals.map(({ label, current, target, icon: Icon }) => (
                        <div key={label}>
                            <div>
                                <span>
                                    <Icon size={15} />
                                    {label}
                                </span>
                                <strong>
                                    {current}
                                    <small> / {target}</small>
                                </strong>
                            </div>
                            <div className="progress-track">
                                <span
                                    style={{ width: `${Math.min(100, (current / target) * 100)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            <div className="ledger-bottom">
                <section className="panel ledger-history">
                    <div className="ledger-section-heading">
                        <div>
                            <span className="eyebrow">ONE DAY AT A TIME</span>
                            <h2>Closing the books</h2>
                        </div>
                        <span className="tag">{reports.length} days</span>
                    </div>
                    {reports.length === 0 ? (
                        <div className="ledger-empty">
                            <Receipt size={30} />
                            <h3>Your story is still being written.</h3>
                            <p className="muted">
                                At closing time, each day's income, wages and expenses appear here.
                            </p>
                        </div>
                    ) : (
                        reports.map((report) => <ReportRow key={report.day} report={report} />)
                    )}
                </section>
                <aside className="panel ledger-trend">
                    <span className="eyebrow">THE SHAPE OF THINGS</span>
                    <h2>Income & running costs</h2>
                    <div
                        className="ledger-chart"
                        role="img"
                        aria-label="Income and operating costs over the last seven days"
                    >
                        {reports.length === 0 ? (
                            <div className="ledger-chart-placeholder">
                                <i />
                                <i />
                                <i />
                                <i />
                                <i />
                                <span>Your first day starts the chart</span>
                            </div>
                        ) : (
                            [...reports.slice(0, 7)].reverse().map((r) => (
                                <div className="ledger-chart-day" key={r.day}>
                                    <div>
                                        <i
                                            title={`Income: ${formatMoney(r.ticketRevenue + r.concessionRevenue)}`}
                                            style={{
                                                height: `${Math.max(2, ((r.ticketRevenue + r.concessionRevenue) / max) * 130)}px`,
                                            }}
                                        />
                                        <i
                                            title={`Costs: ${formatMoney(r.wages + r.upkeep + r.fuelCost + r.repairs)}`}
                                            style={{
                                                height: `${Math.max(2, ((r.wages + r.upkeep + r.fuelCost + r.repairs) / max) * 130)}px`,
                                            }}
                                        />
                                    </div>
                                    <span>D{r.day}</span>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="ledger-chart-key">
                        <span>
                            <i />
                            Income
                        </span>
                        <span>
                            <i />
                            Running costs
                        </span>
                    </div>
                    <p className="muted ledger-chart-note">
                        Building, recruitment, training and posters are paid immediately. Daily
                        reports show operating results.
                    </p>
                    <div className="ledger-best">
                        <Sparkles size={17} />
                        <div>
                            <strong>
                                {completed.length
                                    ? `${Math.max(...completed.map((b) => b.rating))}/5`
                                    : "A clean slate"}
                            </strong>
                            <span className="muted">
                                {completed.length
                                    ? "Your best performance so far"
                                    : "Your best performance is ahead of you"}
                            </span>
                        </div>
                    </div>
                </aside>
            </div>
            <div className="site-note">
                <Coins size={18} />
                <p>
                    <strong>A little room to breathe.</strong> Keep enough in reserve for wages,
                    upkeep, fuel and water. Unsold seats cost nothing, but your circus still needs
                    looking after.
                </p>
            </div>
        </div>
    );
}
