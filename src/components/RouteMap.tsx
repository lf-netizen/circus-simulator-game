import { CITIES } from "../game/data";
import type { GameState } from "../game/types";
export default function RouteMap({
    state,
    selected,
    onSelect,
    compact = false,
}: {
    state: GameState;
    selected?: string;
    onSelect?: (id: string) => void;
    compact?: boolean;
}) {
    const current = CITIES.find((c) => c.id === state.cityId)!;
    return (
        <div className={`route-map ${compact ? "compact" : ""}`}>
            <svg viewBox="0 0 700 490" role="img" aria-label="Tour map of Poland">
                <defs>
                    <pattern id="map-grid" width="28" height="28" patternUnits="userSpaceOnUse">
                        <path d="M28 0H0V28" fill="none" stroke="#bac4ad" strokeWidth=".5" />
                    </pattern>
                    <filter id="land-shadow">
                        <feDropShadow
                            dx="0"
                            dy="4"
                            stdDeviation="6"
                            floodColor="#526d57"
                            floodOpacity=".08"
                        />
                    </filter>
                </defs>
                <rect width="700" height="490" fill="#e8ecdf" />
                <rect width="700" height="490" fill="url(#map-grid)" />
                <path
                    d="M185 84 222 71 247 52 294 59 326 40 388 60 424 50 451 73 491 61 525 92 539 154 565 180 551 215 570 244 549 275 565 301 531 348 504 367 488 403 443 425 411 408 375 432 349 411 304 407 276 385 243 392 224 365 192 358 174 326 145 309 159 266 141 237 165 203 151 164 171 140Z"
                    fill="#f6f4e9"
                    stroke="#c4cdb7"
                    strokeWidth="2"
                    filter="url(#land-shadow)"
                />
                <path
                    d="M312 81Q370 133 339 185T376 279Q411 311 399 376"
                    stroke="#b8d3d2"
                    fill="none"
                    strokeWidth="5"
                />
                <path
                    d="M218 119Q291 191 472 184M188 266Q347 257 515 333M254 365Q280 243 457 104"
                    stroke="#dedfcd"
                    fill="none"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                />
                <text x="40" y="56" className="map-water">
                    B A L T I C S E A
                </text>
                <text x="35" y="269" className="map-country">
                    GERMANY
                </text>
                <text x="570" y="388" className="map-country">
                    UKRAINE
                </text>
                <text x="205" y="461" className="map-country">
                    CZECHIA
                </text>
                <text x="385" y="465" className="map-country">
                    SLOVAKIA
                </text>
                <text x="571" y="97" className="map-country">
                    LITHUANIA
                </text>
                {[current.id, ...state.route.filter((id) => id !== current.id)].map(
                    (id, i, arr) => {
                        if (!i) return null;
                        const a = CITIES.find((c) => c.id === arr[i - 1])!,
                            b = CITIES.find((c) => c.id === id)!;
                        return (
                            <path
                                key={`${id}-${i}`}
                                d={`M${a.x * 7} ${a.y * 4.9} Q${(a.x + b.x) * 3.5 + 15} ${(a.y + b.y) * 2.45 - 20} ${b.x * 7} ${b.y * 4.9}`}
                                fill="none"
                                stroke="#ba7358"
                                strokeWidth="2"
                                strokeDasharray="6 5"
                            />
                        );
                    },
                )}
                {CITIES.map((c) => (
                    <g
                        key={c.id}
                        className={onSelect ? "map-city interactive" : "map-city"}
                        onClick={() => onSelect?.(c.id)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                onSelect?.(c.id);
                            }
                        }}
                        role={onSelect ? "button" : undefined}
                        tabIndex={onSelect ? 0 : undefined}
                        aria-label={onSelect ? `Select ${c.name}` : undefined}
                    >
                        <circle cx={c.x * 7} cy={c.y * 4.9} r="22" fill="transparent" />
                        {c.id === current.id && (
                            <circle
                                cx={c.x * 7}
                                cy={c.y * 4.9}
                                r="17"
                                fill="#254f40"
                                opacity=".13"
                            />
                        )}
                        <circle
                            cx={c.x * 7}
                            cy={c.y * 4.9}
                            r={c.id === current.id ? 8 : 5}
                            fill={
                                c.id === selected
                                    ? "#bd694e"
                                    : c.id === current.id
                                      ? "#254f40"
                                      : "#f6f4e9"
                            }
                            stroke={c.id === selected ? "#bd694e" : "#63775b"}
                            strokeWidth="2"
                        />
                        <text
                            x={c.x * 7 + 13}
                            y={c.y * 4.9 + 5}
                            fontWeight={c.id === current.id ? "700" : "500"}
                        >
                            {c.name}
                        </text>
                    </g>
                ))}
                <g transform="translate(628 420)">
                    <path d="M0-20 6 0 0-4-6 0Z" fill="#708267" />
                    <text y="-28" textAnchor="middle" className="map-country">
                        N
                    </text>
                </g>
            </svg>
        </div>
    );
}
