import { useId } from "react";
import type { GameState } from "../game/types";
import "./circus-scene.css";

type Props = {
    state: GameState;
    interactive?: boolean;
    selectedId?: string | null;
    onSelect?: (id: string) => void;
};

export default function CircusScene({ state, interactive = false, selectedId, onSelect }: Props) {
    const id = useId().replace(/:/g, "");
    const ref = (name: string) => `#${id}-${name}`;
    const point = (x: number, y: number) => ({ x: 100 + x * 7, y: 140 + y * 2.7 });
    const trees = [
        [55, 220, 1.1],
        [88, 197, 0.8],
        [135, 166, 0.72],
        [183, 145, 0.65],
        [736, 159, 0.7],
        [783, 183, 0.95],
        [832, 227, 1.1],
        [794, 254, 0.7],
        [70, 307, 0.85],
        [104, 357, 1],
        [155, 390, 0.75],
        [799, 334, 1.05],
        [750, 385, 0.8],
        [253, 406, 0.65],
    ];
    return (
        <svg
            className={`circus-scene ${interactive ? "is-interactive" : ""}`}
            viewBox="0 0 900 480"
            role={interactive ? "group" : "img"}
            aria-label={
                interactive
                    ? "Interactive circus grounds. Select a building to move it."
                    : "Illustrated circus campsite with a striped big top, caravans and festival stalls in a green meadow"
            }
        >
            <defs>
                <linearGradient id={`${id}-sky`} x2="0" y2="1">
                    <stop stopColor="#e9eddf" />
                    <stop offset="1" stopColor="#cad5b8" />
                </linearGradient>
                <linearGradient id={`${id}-land`} x2=".2" y2="1">
                    <stop stopColor="#c8d3ad" />
                    <stop offset="1" stopColor="#a6bd8e" />
                </linearGradient>
                <linearGradient id={`${id}-roof`} x2=".8" y2="1">
                    <stop stopColor="#fff5d8" />
                    <stop offset="1" stopColor="#e6d2aa" />
                </linearGradient>
                <linearGradient id={`${id}-red`} x2="1" y2="1">
                    <stop stopColor="#cb7457" />
                    <stop offset="1" stopColor="#aa4a3b" />
                </linearGradient>
                <radialGradient id={`${id}-sun`}>
                    <stop stopColor="#fff9dd" stopOpacity=".8" />
                    <stop offset="1" stopColor="#fff9dd" stopOpacity="0" />
                </radialGradient>
                <pattern id={`${id}-grass`} width="48" height="43" patternUnits="userSpaceOnUse">
                    <path
                        d="m4 30 2-4 2 4m24-15 1-3 2 3"
                        stroke="#758f64"
                        strokeWidth=".8"
                        opacity=".35"
                    />
                    <circle cx="41" cy="36" r="1" fill="#e7dec0" />
                </pattern>
                <g id={`${id}-pine`}>
                    <ellipse cx="6" cy="0" rx="25" ry="8" fill="#698760" opacity=".2" />
                    <path d="M-3 0v-48h6V0" fill="#857253" />
                    <path
                        d="m0-99-24 43h12l-22 31h14L-38-7Q0 7 36-7L18-25h13L10-56h11Z"
                        fill="#54775b"
                    />
                    <path
                        d="m0-99 0 103Q21 2 36-7L18-25h13L10-56h11Z"
                        fill="#365f4e"
                        opacity=".6"
                    />
                    <path
                        d="m-12-58 12-22m-23 49 17-19m-23 37 19-17"
                        stroke="#88a279"
                        strokeWidth="2"
                        opacity=".45"
                    />
                </g>
                <g id={`${id}-bush`}>
                    <ellipse cx="0" cy="0" rx="24" ry="7" fill="#879d70" opacity=".4" />
                    <circle cx="-12" cy="-8" r="12" fill="#789366" />
                    <circle cy="-15" r="17" fill="#829e6d" />
                    <circle cx="14" cy="-7" r="11" fill="#92a978" />
                </g>
                <g id={`${id}-tent`}>
                    <ellipse cx="8" cy="3" rx="156" ry="42" fill="#62784e" opacity=".23" />
                    <path
                        d="M-138-50-151 9M138-50l17 61M-76-104l-66 101M80-106l73 98"
                        stroke="#a29470"
                        strokeWidth="1.4"
                    />
                    <path d="M-133-54Q0-22 133-54V-5Q0 61-133-5Z" fill="#f1e5c5" />
                    <path
                        d="M-132-51-110-45v52l-22-12Zm44 12 23 5v53l-23-7Zm48 8 23 2v57l-23-3Zm51 2 24-2v55l-24 4Zm49-6 22-5v51l-22 8Zm46-12 25-7v48l-25 14Z"
                        fill={`url(${ref("red")})`}
                    />
                    <path
                        d="M-133-53Q-72-91-38-157Q-18-131 0-122Q22-134 40-164Q73-91 133-53Q0 7-133-53Z"
                        fill={`url(${ref("roof")})`}
                    />
                    <path
                        d="M-38-157Q-74-84-107-44l29 9Q-57-108-38-157M-38-157Q-28-86-30-26l28 1Q-9-100-38-157M40-164Q34-94 20-26l30-3Q53-112 40-164M40-164Q86-92 112-44l21-9Q76-95 40-164"
                        fill={`url(${ref("red")})`}
                    />
                    <path d="M-133-53Q0 5 133-53" fill="none" stroke="#8e4939" strokeWidth="3" />
                    {Array.from({ length: 12 }, (_, i) => (
                        <path
                            key={i}
                            d={`M${-132 + i * 22} ${-52 + Math.sin((i / 11) * Math.PI) * 30}q11 18 22 3v-7q-11 0-22-5Z`}
                            fill={i % 2 ? "#f6e7bf" : "#bd6249"}
                        />
                    ))}
                    <path d="M-25 29V-13q24-29 48 0v42" fill="#543d34" />
                    <path
                        d="M-25-13q7 16 0 42l-14-3 14-39M23-13q-9 17 0 42l15-4-15-38"
                        fill="#b15842"
                    />
                    <path d="M-38-154v-36M40-160v-39" stroke="#8c7350" strokeWidth="2" />
                    <path
                        className="scene-flag"
                        d="m-37-190 32 6-32 12Zm78-9 36 7-36 12Z"
                        fill="#bd6249"
                    />
                    <circle cx="-38" cy="-191" r="3" fill="#d3b46c" />
                    <circle cx="40" cy="-200" r="3" fill="#d3b46c" />
                    <path
                        d="M-141 7h-8m298 2h9"
                        stroke="#6b654f"
                        strokeWidth="4"
                        strokeLinecap="round"
                    />
                </g>
                <g id={`${id}-wagon`}>
                    <ellipse cx="4" cy="3" rx="67" ry="17" fill="#687f53" opacity=".25" />
                    <path d="m-53-49 79 13 27-16v53L26 17-53 4Z" fill="#b87751" />
                    <path d="m26-36 27-16v53L26 17Z" fill="#936544" />
                    <path d="m-56-50 82 14 30-17q-4-16-20-20l-76-12q-15 5-16 35" fill="#466a58" />
                    <path d="m-56-50 82 14q-1-21 14-34l-80-15q-15 5-16 35" fill="#688571" />
                    <path
                        d="m-48-38 66 11m-66 5 65 11m-65 4 65 11"
                        stroke="#d69c68"
                        strokeWidth="1.3"
                    />
                    <path
                        d="m-38-34 20 4v21l-20-4Zm34 6 19 3v21L-4-7Z"
                        fill="#f2dfaa"
                        stroke="#674f35"
                        strokeWidth="3"
                    />
                    <path
                        d="m-28-32v21m-9-12 18 3M6-25v20M-3-17l17 3"
                        stroke="#99754e"
                        strokeWidth="1.5"
                    />
                    <path d="m35-25 12-7V0L35 7Z" fill="#574e3b" />
                    <circle cx="44" cy="-10" r="1.5" fill="#e8c779" />
                    <path d="m31 11 18-10v5L31 17Zm-3 7 23-12v5L28 24Z" fill="#b89e70" />
                    {[-37, 9].map((x) => (
                        <g key={x} transform={`translate(${x} 9)`}>
                            <ellipse rx="10" ry="13" fill="#4f5141" />
                            <ellipse rx="6" ry="9" fill="#af9664" />
                            <path d="M0-8V8M-5-4 5 4M-5 4 5-4" stroke="#66583e" strokeWidth="1.3" />
                            <circle r="2.5" fill="#4f5141" />
                        </g>
                    ))}
                </g>
                <g id={`${id}-popcorn`}>
                    <ellipse cx="5" cy="3" rx="42" ry="11" fill="#6c8255" opacity=".23" />
                    <path d="m-32-34 50 9 19-11v33L18 9-32 0Z" fill="#c47855" />
                    <path d="m18-25 19-11v33L18 9Z" fill="#a55d42" />
                    <path d="m-32-34 50 9 19-11-49-10Z" fill="#f2e6bf" />
                    <path d="M-29-36v-32M17-28v-32M35-39v-32" stroke="#a08250" strokeWidth="3" />
                    <path d="m-39-69 57 10 25-15-58-11Z" fill="#f8e9c2" />
                    {[0, 1, 2, 3].map((i) => (
                        <path
                            key={i}
                            d={`m${-39 + i * 16} ${-69 + i * 2.8} 25-16 8 1.5-25 16Z`}
                            fill="#b75f48"
                        />
                    ))}
                    <path d="m-39-69 57 10v9l-57-10Zm57 10 25-15v9L18-50Z" fill="#bd6c50" />
                    <path d="m-24-23 33 6v16l-33-6Z" fill="#f4e6be" />
                    <text
                        x="-20"
                        y="-10"
                        fontSize="6.5"
                        fontWeight="800"
                        fill="#8f4c38"
                        transform="rotate(9)"
                    >
                        POPCORN
                    </text>
                    <path d="m-10-39 10 2-2 12-7-1Z" fill="#faf0d3" />
                    <circle cx="-6" cy="-42" r="5" fill="#f4da99" />
                    <circle cx="-1" cy="-40" r="4" fill="#fff0bb" />
                    <circle cx="-22" cy="3" r="5" fill="#585447" />
                    <circle cx="17" cy="10" r="5" fill="#585447" />
                </g>
                <g id={`${id}-generator`}>
                    <ellipse rx="35" ry="10" fill="#697e56" opacity=".25" />
                    <path d="m-26-26 37 6 15-9v25L11 6-26 0Z" fill="#849486" />
                    <path d="m11-20 15-9v25L11 6Z" fill="#5b7162" />
                    <path d="m-26-26 15-9 37 6-15 9Z" fill="#9faf9b" />
                    <path d="m-19-18 15 3m-15 4 15 3m-15 4 15 3" stroke="#536a59" strokeWidth="2" />
                    <path d="m1-18-6 9 5 1-4 8 11-11-5-1 4-5Z" fill="#efce7f" />
                    <path d="M18-29v-13h5" fill="none" stroke="#58665a" strokeWidth="4" />
                </g>
                <g id={`${id}-person`}>
                    <ellipse cx="3" cy="1" rx="7" ry="2.5" fill="#6f805b" opacity=".3" />
                    <path
                        d="m-2-7-1 8m6-8 2 8"
                        stroke="#535649"
                        strokeWidth="2.3"
                        strokeLinecap="round"
                    />
                    <path d="M-3-16h7l2 10h-11Z" fill="currentColor" />
                    <circle cx=".5" cy="-20" r="4" fill="#dfb488" />
                    <path d="M-3-22q4-5 7 0" stroke="#5a5141" strokeWidth="2" />
                    <path
                        d="m-3-13-4 6m11-6 4 5"
                        stroke="#dfb488"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </g>
            </defs>
            <rect width="900" height="480" fill={`url(${ref("sky")})`} />
            <circle cx="710" cy="44" r="155" fill={`url(${ref("sun")})`} />
            <path
                d="M0 125 92 50l43 22 43-31 79 78 80-47 93 39 74-44 61 40 55-30 65 39 68-70 42 23 56-36 94 100v83H0Z"
                fill="#cbd4bf"
            />
            <path
                d="m0 143 81-40 94 39 87-30 99 40 85-32 84 8 64-17 90 31 103-45 113 48v74H0Z"
                fill="#b9c9a8"
            />
            <path
                d="M0 228Q115 169 233 183T432 171Q610 117 900 192V480H0Z"
                fill={`url(${ref("land")})`}
            />
            <path
                d="M0 228Q115 169 233 183T432 171Q610 117 900 192V480H0Z"
                fill={`url(${ref("grass")})`}
            />
            <ellipse cx="453" cy="300" rx="324" ry="123" fill="#bbcb9f" opacity=".6" />
            <path
                d="M949 408Q742 456 648 386T456 294Q366 275 280 294T-37 333"
                fill="none"
                stroke="#c0b998"
                strokeWidth="35"
                opacity=".4"
            />
            <path
                d="M949 402Q742 450 648 380T456 288Q366 269 280 288T-37 327"
                fill="none"
                stroke="#e0d4ad"
                strokeWidth="29"
            />
            <path
                d="M640 373Q578 303 670 250M283 287q-40-26-42-43"
                fill="none"
                stroke="#dfd3ac"
                strokeWidth="18"
            />
            <path
                d="M65 220Q226 108 419 161M620 162q128 11 206 107"
                fill="none"
                stroke="#8e9472"
                strokeWidth="2"
                opacity=".4"
            />
            {trees
                .filter(([, y]) => y < 280)
                .map(([x, y, s], i) => (
                    <use
                        key={i}
                        href={ref("pine")}
                        transform={`translate(${x} ${y}) scale(${s})`}
                    />
                ))}
            <g stroke="#b29e73" fill="none" strokeWidth="3">
                <path d="M159 313 253 358 335 382M159 302l94 45 82 24M682 361l79-40M682 350l79-40" />
                {[
                    [159, 313],
                    [183, 326],
                    [209, 338],
                    [233, 350],
                    [258, 361],
                    [284, 369],
                    [310, 377],
                    [335, 382],
                    [682, 361],
                    [709, 347],
                    [735, 334],
                    [761, 321],
                ].map(([x, y], i) => (
                    <path key={i} d={`M${x} ${y + 7}v-29`} strokeLinecap="round" />
                ))}
            </g>
            <path
                d="M209 216q94 56 204-4M567 204q64 48 155 23"
                fill="none"
                stroke="#817653"
                strokeWidth="1.4"
            />
            {[
                [223, 224],
                [244, 231],
                [266, 235],
                [288, 237],
                [310, 237],
                [332, 234],
                [355, 229],
                [378, 223],
                [582, 212],
                [603, 221],
                [625, 227],
                [648, 231],
                [672, 232],
                [695, 230],
            ].map(([x, y], i) => (
                <path
                    key={i}
                    d={`m${x} ${y} 12 2-7 13Z`}
                    fill={["#b9634d", "#efdca3", "#527d70"][i % 3]}
                />
            ))}
            <g transform="translate(634 230) scale(.85)">
                <use href={ref("wagon")} />
            </g>
            {[...state.grounds]
                .sort((a, b) => a.y - b.y)
                .map((item) => {
                    const pos = point(item.x, item.y);
                    return (
                        <g
                            key={item.id}
                            transform={`translate(${pos.x} ${pos.y})`}
                            className={`scene-building ${selectedId === item.id ? "selected" : ""}`}
                            role={interactive ? "button" : undefined}
                            tabIndex={interactive ? 0 : undefined}
                            aria-label={
                                interactive
                                    ? `Select ${item.kind === "tent" ? "big top" : item.kind === "wagon" ? "living wagon" : item.kind}`
                                    : undefined
                            }
                            aria-pressed={interactive ? selectedId === item.id : undefined}
                            onClick={interactive ? () => onSelect?.(item.id) : undefined}
                            onKeyDown={
                                interactive
                                    ? (e) => {
                                          if (e.key === "Enter" || e.key === " ") {
                                              e.preventDefault();
                                              onSelect?.(item.id);
                                          }
                                      }
                                    : undefined
                            }
                        >
                            {interactive && (
                                <ellipse
                                    className="building-target"
                                    rx={item.kind === "tent" ? 155 : 65}
                                    ry={item.kind === "tent" ? 49 : 24}
                                    cy="5"
                                />
                            )}
                            <use href={ref(item.kind)} />
                            {selectedId === item.id && (
                                <g transform={`translate(0 ${item.kind === "tent" ? -221 : -104})`}>
                                    <rect
                                        x="-46"
                                        y="-14"
                                        width="92"
                                        height="24"
                                        rx="12"
                                        fill="#183e36"
                                    />
                                    <text
                                        textAnchor="middle"
                                        y="2"
                                        fill="#fff8e9"
                                        fontSize="10"
                                        fontWeight="600"
                                    >
                                        {item.kind === "tent"
                                            ? "The big top"
                                            : item.kind === "wagon"
                                              ? "Living wagon"
                                              : item.kind === "popcorn"
                                                ? "Popcorn cart"
                                                : "Generator"}
                                    </text>
                                    <path d="m-4 10 4 5 4-5" fill="#183e36" />
                                </g>
                            )}
                        </g>
                    );
                })}
            <g transform="translate(607 391)">
                <ellipse rx="57" ry="12" fill="#8da276" opacity=".2" />
                <path d="M-43 0v-69M43 0v-69" stroke="#846d4d" strokeWidth="5" />
                <path d="M-49-71q49-25 98 0v18q-49-23-98 0Z" fill="#456857" />
                <path d="M-47-68q47-23 94 0" stroke="#d7ba77" fill="none" />
                <text
                    x="0"
                    y="-62"
                    textAnchor="middle"
                    fill="#f7e6b8"
                    fontSize="10"
                    fontWeight="700"
                    letterSpacing="3"
                >
                    CIRCUS
                </text>
                <path d="M-43-53v14m86-14v14" stroke="#d7b36e" strokeWidth="2" />
                <circle cx="-43" cy="-37" r="4" fill="#f5dfaa" />
                <circle cx="43" cy="-37" r="4" fill="#f5dfaa" />
            </g>
            {[
                [530, 318, "#c27755"],
                [547, 324, "#546f79"],
                [579, 349, "#e1c485"],
                [633, 407, "#b96750"],
                [659, 412, "#496c5b"],
                [354, 304, "#d5ac65"],
                [371, 309, "#68878a"],
                [269, 319, "#b5664c"],
                [695, 270, "#d7b46d"],
                [223, 266, "#527668"],
            ].map(([x, y, c], i) => (
                <use
                    key={i}
                    href={ref("person")}
                    transform={`translate(${x} ${y}) scale(${i % 3 === 0 ? 0.85 : 1})`}
                    color={String(c)}
                />
            ))}
            <g transform="translate(737 352)">
                <path d="M0 0v-53" stroke="#816e51" strokeWidth="2" />
                <path d="M0-54 20-48 0-37Z" fill="#b76148" />
                <path
                    d="m-19-17 33 5v8l-33-5Zm3-8v24m24-20V4"
                    stroke="#957c51"
                    fill="none"
                    strokeWidth="4"
                />
            </g>
            {trees
                .filter(([, y]) => y >= 280)
                .map(([x, y, s], i) => (
                    <use
                        key={i}
                        href={ref("pine")}
                        transform={`translate(${x} ${y}) scale(${s})`}
                    />
                ))}
            {[
                [188, 371, 0.6],
                [744, 405, 0.8],
                [837, 289, 0.7],
                [111, 257, 0.6],
                [381, 418, 0.55],
                [860, 393, 1],
            ].map(([x, y, s], i) => (
                <use key={i} href={ref("bush")} transform={`translate(${x} ${y}) scale(${s})`} />
            ))}
            <g fill="#f6ecc9">
                {[
                    [190, 302],
                    [196, 307],
                    [780, 365],
                    [786, 370],
                    [401, 381],
                    [407, 379],
                    [101, 403],
                    [95, 399],
                ].map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r="2" />
                ))}
            </g>
            <path
                d="m747 67 7-3 7 3m25 16 5-2 5 2"
                stroke="#8b9b83"
                strokeWidth="1.4"
                fill="none"
                strokeLinecap="round"
            />
        </svg>
    );
}
