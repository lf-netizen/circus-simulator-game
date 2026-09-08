import { useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent, ReactNode } from "react";
import { BUILDINGS } from "./data";
import { canPlace, connectedPaths, footprint, getBuildingStatus } from "./spatial";
import type { Building, SiteState, Tool } from "./types";
import "./iso-map.css";

interface Props {
    state: SiteState;
    tool: Tool;
    rotated: boolean;
    selectedId: string | null;
    onTile: (x: number, y: number) => void;
    onSelect: (id: string) => void;
    showGrid: boolean;
    overlay: "none" | "paths" | "power" | "water";
    zoom: number;
}
type Point = { x: number; y: number };
const HALF_W = 24,
    HALF_H = 12,
    ORIGIN_X = 540,
    ORIGIN_Y = 92;
const iso = (x: number, y: number): Point => ({ x: (x - y) * HALF_W, y: (x + y) * HALF_H });
const world = (x: number, y: number): Point => {
    const p = iso(x, y);
    return { x: p.x + ORIGIN_X, y: p.y + ORIGIN_Y };
};
const points = (p: Point[]) => p.map((v) => `${v.x},${v.y}`).join(" ");
const diamond = (x: number, y: number, w = 1, h = 1) =>
    points([world(x, y), world(x + w, y), world(x + w, y + h), world(x, y + h)]);
const numberNoise = (x: number, y: number, seed: number) =>
    (((Math.imul(x + 37, 374761393) ^ Math.imul(y + 91, 668265263) ^ seed) >>> 0) % 1000) / 1000;

function Box({
    w,
    h,
    height,
    color,
    top,
    side,
    children,
}: {
    w: number;
    h: number;
    height: number;
    color: string;
    top: string;
    side: string;
    children?: ReactNode;
}) {
    const center = iso(w / 2, h / 2);
    const p = (x: number, y: number, z = 0) => {
        const v = iso(x, y);
        return { x: v.x - center.x, y: v.y - center.y - z };
    };
    return (
        <g>
            <polygon
                points={points([p(0, h), p(w, h), p(w, h, height), p(0, h, height)])}
                fill={color}
            />
            <polygon
                points={points([p(w, 0), p(w, h), p(w, h, height), p(w, 0, height)])}
                fill={side}
            />
            <polygon
                points={points([
                    p(0, 0, height),
                    p(w, 0, height),
                    p(w, h, height),
                    p(0, h, height),
                ])}
                fill={top}
            />
            {children}
        </g>
    );
}

function Tent({ large, id }: { large: boolean; id: string }) {
    const scale = large ? 1.25 : 0.96;
    return (
        <g transform={`scale(${scale})`}>
            <ellipse cy="8" rx="72" ry="30" fill="#436148" opacity=".18" />
            <path
                d="M-64-22-75 15M64-22l13 37M-35-64-71 12M35-64l37 78"
                fill="none"
                stroke="#a48c65"
                strokeWidth="1"
            />
            <path d="M-65-24Q0 4 65-24V9Q0 50-65 9Z" fill="#f4e7c6" />
            <path
                d="m-65-23 12 4v35l-12-7Zm23 9 12 3v37l-12-5Zm24 6 12 1v39l-12-2Zm24 1 12-1v38L6 32Zm24-4 12-3v35l-12 5Zm23-8 12-4V9l-12 7Z"
                fill={`url(#${id}-red)`}
            />
            <path
                d="M-65-24Q-36-43-18-91Q-7-76 0-74Q9-78 19-95Q39-45 65-24Q0 11-65-24Z"
                fill={`url(#${id}-cream)`}
            />
            <path
                d="M-18-91Q-31-45-52-19l13 5q9-41 21-77M-18-91Q-10-41-14-8l15 1Q-1-50-18-91M19-95Q18-45 11-8l15-2q2-46-7-85M19-95Q40-45 54-20l11-4Q37-47 19-95"
                fill={`url(#${id}-red)`}
            />
            <path d="M-65-24Q0 11 65-24" fill="none" stroke="#a75843" strokeWidth="2" />
            {Array.from({ length: 10 }, (_, i) => (
                <path
                    key={i}
                    d={`M${-65 + i * 13} ${-24 + Math.sin((i / 9) * Math.PI) * 17}q6.5 12 13 2v-4q-6 1-13-2Z`}
                    fill={i % 2 ? "#f4e3b7" : "#c67253"}
                />
            ))}
            <path d="M-13 32V8q13-19 26 0v24" fill="#473e35" />
            <path d="M-13 8q5 11 0 24l-8-2Zm26 0q-5 11 0 24l8-2Z" fill="#b8644d" />
            <path d="M-18-89v-23m37 20v-26" stroke="#816c4b" strokeWidth="1.6" />
            <path
                className="iso-flag"
                d="m-17-112 20 4-20 8m37-18 23 5-23 8"
                fill={large ? "#c4a04d" : "#b96049"}
            />
            <circle cx="-18" cy="-113" r="2" fill="#e5c36b" />
            <circle cx="19" cy="-119" r="2" fill="#e5c36b" />
            {large && (
                <>
                    <path d="M-51 11q51 26 102 0" stroke="#d9b65f" strokeWidth="2" fill="none" />
                    <path d="m-4-26 4-8 4 8 9 1-7 6 2 9-8-4-8 4 2-9-7-6Z" fill="#e3c372" />
                </>
            )}
        </g>
    );
}

function BuildingArt({
    building,
    id,
}: {
    building: Pick<Building, "kind" | "rotated">;
    id: string;
}) {
    const def = BUILDINGS.find((d) => d.kind === building.kind)!;
    const w = (building.rotated ? def.height : def.width) * 0.88,
        h = (building.rotated ? def.width : def.height) * 0.88;
    const radius = (w + h) * 12;
    if (building.kind === "smallTent" || building.kind === "bigTop")
        return <Tent large={building.kind === "bigTop"} id={id} />;
    return (
        <g>
            <ellipse cx="3" cy="5" rx={radius} ry={(w + h) * 5.5} fill="#476143" opacity=".18" />
            {building.kind === "trailer" && (
                <>
                    <Box w={w} h={h} height={31} color="#b7885b" side="#896c4e" top="#568476" />
                    <path d="M-42-31 0-52 42-31v-6L0-59-42-38Z" fill="#739587" />
                    <path
                        d="m-33-20 11 5v14l-11-5Zm18 9 11 5v14l-11-5Z"
                        fill="#f0db9f"
                        stroke="#725d42"
                        strokeWidth="2"
                    />
                    <path d="m22-11 12-6V8l-12 6Z" fill="#4e594a" />
                    <path d="m-37-2 34 17" stroke="#d2a575" strokeWidth="2" />
                    <g fill="#454b3e">
                        <ellipse cx="-27" cy="13" rx="5" ry="7" />
                        <ellipse cx="-7" cy="23" rx="5" ry="7" />
                    </g>
                    <g fill="#c3ab76">
                        <ellipse cx="-27" cy="13" rx="2" ry="4" />
                        <ellipse cx="-7" cy="23" rx="2" ry="4" />
                    </g>
                    <path d="m22 17 13-7v5l-13 7Z" fill="#c4ab7c" />
                </>
            )}
            {building.kind === "generator" && (
                <>
                    <Box
                        w={w * 0.85}
                        h={h * 0.85}
                        height={27}
                        color="#7c9188"
                        side="#526b63"
                        top="#a4b2a2"
                    />
                    <path d="m-29-15 19 9m-19-3 19 9m-19-3 19 9" stroke="#4a675c" strokeWidth="2" />
                    <path d="m7-16-7 12 6 2-4 9 14-14-7-2 4-5Z" fill="#efcf75" />
                    <path d="m19-24 0-23h7" fill="none" stroke="#4f6257" strokeWidth="5" />
                    <path d="m18-52 3-5m5 3 3-7" stroke="#adbaa6" strokeWidth="2" opacity=".7" />
                    <circle cx="26" cy="1" r="3" fill="#d4b462" />
                </>
            )}
            {building.kind === "waterTank" && (
                <>
                    <path
                        d="M-12 8v-31m24 31v-31M-11 3l22-26m-22 0L11 3"
                        stroke="#798776"
                        strokeWidth="3"
                    />
                    <path d="M-17-43h34v23q-17 12-34 0Z" fill="#86b5bc" />
                    <path d="M0-43h17v23q-8 6-17 6Z" fill="#6898a5" />
                    <ellipse cy="-43" rx="17" ry="8" fill="#b3d5cb" />
                    <path
                        d="M-17-39q17 9 34 0m-34 15q17 9 34 0"
                        fill="none"
                        stroke="#567f8a"
                        strokeWidth="1.5"
                    />
                    <path d="M-6-41q6-7 12 0" stroke="#628993" fill="none" strokeWidth="2" />
                    <path d="M16-31h7V9" fill="none" stroke="#bdc2a5" strokeWidth="2" />
                </>
            )}
            {building.kind === "toilets" && (
                <>
                    <Box w={w} h={h} height={34} color="#8eaa83" side="#688570" top="#bdcca1" />
                    <Box
                        w={w + 0.14}
                        h={h + 0.14}
                        height={36}
                        color="#6f8d75"
                        side="#557462"
                        top="#b0c29a"
                    />
                    <g
                        transform={`translate(${building.rotated ? -6 : -17} ${building.rotated ? 9 : 3})`}
                    >
                        <path d="m-6-27 12 6v23l-12-6Z" fill="#506b5a" />
                        <circle cx="0" cy="-19" r="2" fill="#eee5b7" />
                        <path d="m0-15-2 6 4 2-2-8" fill="#eee5b7" />
                    </g>
                    <path d="m8-20 14-7v22L8 2Z" fill="#5c7b63" />
                    <circle cx="15" cy="-18" r="2" fill="#eee5b7" />
                    <path d="M15-14v7m-3-4 6-3" stroke="#eee5b7" strokeWidth="1.5" />
                </>
            )}
            {(building.kind === "popcorn" || building.kind === "lemonade") && (
                <g>
                    <Box
                        w={w}
                        h={h}
                        height={17}
                        color={building.kind === "popcorn" ? "#ce9c5e" : "#b2b870"}
                        side={building.kind === "popcorn" ? "#b17a4e" : "#899752"}
                        top="#f3e4b7"
                    />
                    <path
                        d={`M${-radius + 3} -7v-34M${radius - 3} -7v-34M0 14v-34`}
                        stroke="#967b4f"
                        strokeWidth="2"
                    />
                    <g transform="translate(0 -38)">
                        <Box
                            w={w + 0.2}
                            h={h + 0.2}
                            height={4}
                            color={building.kind === "popcorn" ? "#be7150" : "#9ba35e"}
                            side="#ad8954"
                            top="#f3e7c5"
                        />
                        {[-0.6, -0.2, 0.2, 0.6].map((a, i) => (
                            <path
                                key={i}
                                d={`m${a * radius - 10} ${a * radius * 0.5 - 4} ${radius * 0.7} ${-radius * 0.35} 7 3.5 ${-radius * 0.7} ${radius * 0.35}Z`}
                                fill={building.kind === "popcorn" ? "#c57450" : "#bac271"}
                            />
                        ))}
                    </g>
                    <path d="m-15-5 22 11v9L-15 4Z" fill="#f3e5bc" />
                    <text
                        x="-13"
                        y="1"
                        fontSize="4.1"
                        fill="#825b3f"
                        transform="rotate(26 -13 1)"
                        fontWeight="700"
                    >
                        {building.kind === "popcorn" ? "POPCORN" : "LEMONADE"}
                    </text>
                    {building.kind === "popcorn" ? (
                        <>
                            <path d="m-7-23 10 3-2 10-7-2Z" fill="#faf0cc" />
                            <circle cx="-4" cy="-24" r="4" fill="#e7c473" />
                            <circle cx="1" cy="-23" r="4" fill="#f8e2a5" />
                        </>
                    ) : (
                        <>
                            <path d="M-6-26h8v14h-8Z" fill="#d9d28b" opacity=".9" />
                            <ellipse cx="-2" cy="-26" rx="4" ry="2" fill="#f8e7a4" />
                            <circle cx="8" cy="-14" r="3" fill="#e6c660" />
                        </>
                    )}
                    <circle cx={-radius * 0.65} cy="5" r="4" fill="#5b5845" />
                    <circle cx="4" cy="17" r="4" fill="#5b5845" />
                </g>
            )}
            {building.kind === "carousel" && (
                <>
                    <ellipse cy="9" rx="41" ry="19" fill="#af816c" />
                    <ellipse cy="4" rx="41" ry="19" fill="#e5c992" />
                    <path d="M0-61v65" stroke="#b59755" strokeWidth="4" />
                    {[-26, -8, 23].map((x, i) => (
                        <g key={x}>
                            <path
                                d={`M${x} -35v${i === 1 ? 45 : 39}`}
                                stroke="#d4bc7b"
                                strokeWidth="1.7"
                            />
                            <path
                                d={`m${x - 7} ${i === 1 ? -2 : -10} 12-1 4-7 4 1-2 8-3 3-1 9-3 0-1-7-7-1-3 6-3-1 2-8Z`}
                                fill={i % 2 ? "#b87861" : "#efe1b8"}
                            />
                        </g>
                    ))}
                    <path d="M-44-34 0-64 44-34Q0-9-44-34Z" fill="#f0dbac" />
                    <path d="M0-64-34-28l15 6L0-64 4-19l16-3L0-64 35-28l9-6Z" fill="#b97f94" />
                    <path
                        d="M-44-34v7q44 27 88 0v-7"
                        fill="none"
                        stroke="#b38665"
                        strokeWidth="3"
                    />
                    <path d="M0-64v-15l17 5L0-68" fill="#c9a54d" stroke="#ac8c4c" strokeWidth="1" />
                </>
            )}
            {building.kind === "bench" && (
                <>
                    <path d="m-18-3 27 14 8-5-27-14Z" fill="#b28b5c" />
                    <path d="m-18-12 27 14v7l-27-14Z" fill="#c29e6a" />
                    <path d="M-15-10V6M6 1v14m8-9v6" stroke="#67745a" strokeWidth="2.5" />
                    <path d="m-16-9 23 12m-22-3 22 11" stroke="#8f6f49" strokeWidth="1" />
                </>
            )}
            {building.kind === "flowers" && (
                <>
                    <ellipse rx="21" ry="10" fill="#95795d" />
                    <ellipse cy="-2" rx="19" ry="8" fill="#759566" />
                    {Array.from({ length: 9 }, (_, i) => {
                        const x = Math.sin(i * 2.3) * 15,
                            y = Math.cos(i * 2.3) * 5 - 5;
                        return (
                            <g key={i}>
                                <path d={`M${x} ${y + 7}v-8`} stroke="#547b51" strokeWidth="1.5" />
                                <circle
                                    cx={x}
                                    cy={y - 2}
                                    r="3"
                                    fill={["#d39599", "#f2de9e", "#e9b77d"][i % 3]}
                                />
                                <circle cx={x} cy={y - 2} r="1" fill="#f6e7b0" />
                            </g>
                        );
                    })}
                </>
            )}
        </g>
    );
}

export default function IsoMap({
    state,
    tool,
    rotated,
    selectedId,
    onTile,
    onSelect,
    showGrid,
    overlay,
    zoom,
}: Props) {
    const id = useId().replace(/:/g, "");
    const svgRef = useRef<SVGSVGElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const scrollCenter = useRef({ x: 0.5, y: 0.5 });
    useLayoutEffect(() => {
        const viewport = scrollRef.current;
        if (!viewport) return;
        viewport.scrollLeft =
            scrollCenter.current.x * viewport.scrollWidth - viewport.clientWidth / 2;
        viewport.scrollTop =
            scrollCenter.current.y * viewport.scrollHeight - viewport.clientHeight / 2;
    }, [zoom]);
    const drag = useRef(false),
        lastPaint = useRef("");
    const [hover, setHover] = useState<Point | null>(null);
    const [cursor, setCursor] = useState<Point>({ x: 10, y: 12 });
    const [keyboard, setKeyboard] = useState(false);
    const active = keyboard ? cursor : hover;
    const connections = useMemo(() => connectedPaths(state), [state]);
    const pathSet = useMemo(() => new Set(state.paths), [state.paths]);
    const occupied = useMemo(() => {
        const map = new Map<string, Building>();
        state.buildings.forEach((b) => footprint(b).forEach((p) => map.set(`${p.x},${p.y}`, b)));
        return map;
    }, [state.buildings]);
    const statuses = useMemo(
        () => new Map(state.buildings.map((b) => [b.id, getBuildingStatus(state, b)])),
        [state],
    );
    const chosenDef = BUILDINGS.find((b) => b.kind === tool);
    const selected = state.buildings.find((b) => b.id === selectedId);
    const hovered = active ? occupied.get(`${active.x},${active.y}`) : undefined;
    const phaseLocked = state.phase !== "planning" || state.gameOver;
    let problem: string | null = null;
    if (active && tool !== "select") {
        const key = `${active.x},${active.y}`,
            terrain = state.tiles[active.y * state.size + active.x]?.terrain;
        if (phaseLocked) problem = "Construction is available during planning.";
        else if (chosenDef)
            problem =
                canPlace(state, chosenDef.kind, active.x, active.y, rotated) ||
                (state.money < chosenDef.cost ? "Not enough money for this building." : null);
        else if (tool === "path")
            problem = hovered
                ? "A building occupies this tile."
                : terrain !== "grass"
                  ? "Clear this tile before adding a path."
                  : !pathSet.has(key) && state.money < 15
                    ? "Not enough money for a path."
                    : null;
        else if (tool === "bulldoze")
            problem =
                terrain === "water"
                    ? "The pond cannot be removed."
                    : active.x === state.entrance.x && active.y === state.entrance.y
                      ? "The entrance must stay connected."
                      : null;
    }
    const ghostCells =
        active && chosenDef
            ? footprint({ kind: chosenDef.kind, x: active.x, y: active.y, rotated })
            : active
              ? [active]
              : [];
    const coverage = useMemo(() => {
        if (overlay !== "power" && overlay !== "water") return new Set<string>();
        const supply = state.buildings
            .filter(
                (b) =>
                    b.kind === (overlay === "power" ? "generator" : "waterTank") &&
                    statuses.get(b.id)?.operational,
            )
            .flatMap((b) => footprint(b));
        return new Set(
            state.tiles
                .filter((t) => supply.some((s) => Math.hypot(s.x - t.x, s.y - t.y) <= 6))
                .map((t) => `${t.x},${t.y}`),
        );
    }, [state.buildings, state.tiles, overlay, statuses]);
    const ghostCoverage = useMemo(() => {
        if (
            !active ||
            (overlay !== "power" && overlay !== "water") ||
            chosenDef?.kind !== (overlay === "power" ? "generator" : "waterTank")
        )
            return new Set<string>();
        return new Set(
            state.tiles
                .filter((t) => ghostCells.some((s) => Math.hypot(s.x - t.x, s.y - t.y) <= 6))
                .map((t) => `${t.x},${t.y}`),
        );
    }, [state.tiles, overlay, active?.x, active?.y, tool, rotated]);
    const readPoint = (event: PointerEvent<SVGSVGElement>): Point | null => {
        const svg = svgRef.current,
            matrix = svg?.getScreenCTM();
        if (!svg || !matrix) return null;
        const point = svg.createSVGPoint();
        point.x = event.clientX;
        point.y = event.clientY;
        const p = point.matrixTransform(matrix.inverse()),
            dx = (p.x - ORIGIN_X) / HALF_W,
            dy = (p.y - ORIGIN_Y) / HALF_H;
        const tile = { x: Math.floor((dx + dy) / 2), y: Math.floor((dy - dx) / 2) };
        return tile.x >= 0 && tile.y >= 0 && tile.x < state.size && tile.y < state.size
            ? tile
            : null;
    };
    const act = (p: Point) => {
        if (tool === "select") {
            const b = occupied.get(`${p.x},${p.y}`);
            if (b) onSelect(b.id);
        } else if (!phaseLocked) onTile(p.x, p.y);
    };
    const paint = (p: Point) => {
        const key = `${p.x},${p.y}`;
        if (lastPaint.current === key) return;
        if (tool === "path" && lastPaint.current) {
            const [x, y] = lastPaint.current.split(",").map(Number);
            let nextX = x,
                nextY = y;
            while (nextX !== p.x || nextY !== p.y) {
                if (nextX !== p.x) nextX += Math.sign(p.x - nextX);
                else nextY += Math.sign(p.y - nextY);
                act({ x: nextX, y: nextY });
            }
        } else act(p);
        lastPaint.current = key;
    };
    const keyDown = (e: KeyboardEvent<SVGSVGElement>) => {
        const directions: Record<string, Point> = {
            ArrowRight: { x: 1, y: 0 },
            ArrowLeft: { x: -1, y: 0 },
            ArrowDown: { x: 0, y: 1 },
            ArrowUp: { x: 0, y: -1 },
        };
        if (directions[e.key]) {
            e.preventDefault();
            setKeyboard(true);
            const d = directions[e.key];
            setCursor((p) => ({
                x: Math.max(0, Math.min(state.size - 1, p.x + d.x)),
                y: Math.max(0, Math.min(state.size - 1, p.y + d.y)),
            }));
        } else if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setKeyboard(true);
            act(cursor);
        } else if (e.key === "Escape") {
            setKeyboard(false);
            setHover(null);
        }
    };
    const visualItems: { depth: number; key: string; node: ReactNode }[] = state.tiles
        .filter((t) => t.terrain === "tree" || t.terrain === "rock")
        .map((t) => {
            const p = world(t.x + 0.5, t.y + 0.5),
                noise = numberNoise(t.x, t.y, state.seed);
            return {
                depth: t.x + t.y + 1,
                key: `terrain-${t.x}-${t.y}`,
                node: (
                    <g transform={`translate(${p.x} ${p.y})`}>
                        {t.terrain === "tree" ? (
                            <g transform={`scale(${0.7 + noise * 0.33})`}>
                                <ellipse
                                    cx="5"
                                    cy="4"
                                    rx="19"
                                    ry="8"
                                    fill="#3e6446"
                                    opacity=".17"
                                />
                                <path d="M-2 3v-34h4V3" fill="#887452" />
                                <path
                                    d="M0-64-15-38h7l-16 21h9L-27 0Q0 12 26 0L14-17h9L8-38h7Z"
                                    fill={noise > 0.5 ? "#5f886b" : "#6a906b"}
                                />
                                <path
                                    d="M0-64v72Q16 6 26 0L14-17h9L8-38h7Z"
                                    fill="#3e7057"
                                    opacity=".55"
                                />
                                <path
                                    d="m-8-34 6-10m-12 29 9-9"
                                    stroke="#93ad7c"
                                    strokeWidth="1.7"
                                    opacity=".6"
                                />
                            </g>
                        ) : (
                            <>
                                <ellipse cy="4" rx="16" ry="7" fill="#6d7d62" opacity=".2" />
                                <path d="m-16 0 7-14 16-3 10 13-9 11-16-1Z" fill="#acb3a0" />
                                <path d="m-16 0 7-14 5 10 12 11-16-1Z" fill="#c0c5b1" />
                                <path d="m-4-4 11-13 10 13-9 11Z" fill="#8d9c8e" />
                            </>
                        )}
                    </g>
                ),
            };
        });
    state.buildings.forEach((b) => {
        const def = BUILDINGS.find((d) => d.kind === b.kind)!,
            w = b.rotated ? def.height : def.width,
            h = b.rotated ? def.width : def.height,
            p = world(b.x + w / 2, b.y + h / 2),
            status = statuses.get(b.id)!;
        const chosen = b.id === selectedId;
        const overlayGood =
            overlay === "paths"
                ? status.connected
                : overlay === "power"
                  ? b.kind === "generator"
                      ? status.operational
                      : status.powered
                  : b.kind === "waterTank"
                    ? status.operational
                    : status.watered;
        visualItems.push({
            depth: b.x + b.y + (w + h) / 2,
            key: b.id,
            node: (
                <g
                    transform={`translate(${p.x} ${p.y})`}
                    className={chosen ? "iso-building is-selected" : "iso-building"}
                    data-building-id={b.id}
                    pointerEvents={tool === "select" ? "visiblePainted" : "none"}
                    onPointerDown={(e) => {
                        if (tool !== "select" || e.button !== 0) return;
                        e.stopPropagation();
                        onSelect(b.id);
                        setKeyboard(false);
                        setHover({ x: b.x, y: b.y });
                        setCursor({ x: b.x, y: b.y });
                    }}
                >
                    <title>
                        {b.name} — {status.operational ? "Ready" : status.issues.join(", ")}
                    </title>
                    <BuildingArt building={b} id={id} />
                    {(chosen || overlay !== "none") && (
                        <g
                            transform={`translate(0 ${b.kind === "bigTop" ? -162 : b.kind === "smallTent" ? -129 : -76})`}
                        >
                            <rect
                                x={chosen ? -51 : -8}
                                y="-11"
                                width={chosen ? 102 : 16}
                                height="18"
                                rx="9"
                                fill={chosen ? "#244d3c" : overlayGood ? "#477e5c" : "#be7152"}
                            />
                            {chosen ? (
                                <text
                                    textAnchor="middle"
                                    y="1"
                                    fontSize="7"
                                    fill="#fff7da"
                                    fontWeight="600"
                                >
                                    {b.name.length > 22 ? b.name.slice(0, 21) + "…" : b.name}
                                </text>
                            ) : (
                                <text textAnchor="middle" y="1" fontSize="10" fill="white">
                                    {overlayGood ? "✓" : "!"}
                                </text>
                            )}
                        </g>
                    )}
                </g>
            ),
        });
    });
    state.visitors.forEach((visitor, i) => {
        if (!visitor.route.length || visitor.progress < 0) return;
        const progress = Math.max(0, Math.min(visitor.route.length - 1, visitor.progress)),
            index = Math.floor(progress),
            t = progress - index,
            a = visitor.route[index],
            b = visitor.route[Math.min(index + 1, visitor.route.length - 1)];
        const x = a.x + (b.x - a.x) * t + 0.5,
            y = a.y + (b.y - a.y) * t + 0.5,
            p = world(x, y),
            offset = ((i % 3) - 1) * 3;
        visualItems.push({
            depth: x + y + 0.05,
            key: visitor.id,
            node: (
                <g
                    className={state.phase === "running" ? "iso-visitor walking" : "iso-visitor"}
                    transform={`translate(${p.x + offset} ${p.y + offset * 0.35})`}
                >
                    <title>
                        {visitor.mood === "happy"
                            ? "Happy visitor"
                            : visitor.mood === "unhappy"
                              ? "Unhappy visitor"
                              : "Exploring the circus"}
                    </title>
                    <ellipse cx="2" cy="1" rx="5" ry="2" fill="#6f7752" opacity=".25" />
                    <path
                        className="visitor-legs"
                        d="m-1-5-2 6m5-6 2 6"
                        stroke="#465b48"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                    />
                    <path d="M-3-12h6l2 8h-9Z" fill={visitor.color} />
                    <circle cy="-15" r="3" fill="#dfb38a" />
                    <path d="M-3-16q3-4 6 0" fill="#625442" />
                    <path d="m-3-10-2 5m8-5 2 5" stroke="#dfb38a" strokeWidth="1.4" />
                    {visitor.mood === "unhappy" && <circle cx="5" cy="-22" r="2" fill="#b97059" />}
                </g>
            ),
        });
    });
    const gate = world(state.entrance.x + 0.5, state.entrance.y + 0.5);
    visualItems.push({
        depth: state.entrance.x + state.entrance.y + 1.1,
        key: "entrance",
        node: (
            <g transform={`translate(${gate.x} ${gate.y + 5})`}>
                <path d="M-25 0v-45M25 0v-45" stroke="#927c54" strokeWidth="3.5" />
                <path d="M-30-45q30-18 60 0v12q-30-16-60 0Z" fill="#3d6952" />
                <path d="M-28-43q28-15 56 0" fill="none" stroke="#d3b779" strokeWidth="1" />
                <text
                    textAnchor="middle"
                    y="-41"
                    fontSize="6.5"
                    letterSpacing="1.8"
                    fill="#f5df9f"
                    fontWeight="700"
                >
                    CIRCUS
                </text>
                <path d="M-25-32v10m50-10v10" stroke="#d5b66d" strokeWidth="1.4" />
                <circle cx="-25" cy="-21" r="3" fill="#eed599" />
                <circle cx="25" cy="-21" r="3" fill="#eed599" />
            </g>
        ),
    });
    const tooltip = active
        ? tool === "select"
            ? hovered
                ? `${hovered.name} · ${statuses.get(hovered.id)?.operational ? "Ready" : statuses.get(hovered.id)?.issues[0]}`
                : "Select a building to inspect it"
            : (problem ??
              (chosenDef
                  ? `${chosenDef.name} · ${chosenDef.cost.toLocaleString()} · click to place`
                  : tool === "path"
                    ? "Footpath · drag to draw · 15 / tile"
                    : "Remove building, path, tree or rock"))
        : null;
    return (
        <div className="iso-map-shell">
            <div
                ref={scrollRef}
                className="iso-map-scroll"
                onScroll={(e) => {
                    const viewport = e.currentTarget;
                    scrollCenter.current = {
                        x: (viewport.scrollLeft + viewport.clientWidth / 2) / viewport.scrollWidth,
                        y: (viewport.scrollTop + viewport.clientHeight / 2) / viewport.scrollHeight,
                    };
                }}
            >
                <svg
                    ref={svgRef}
                    className={`iso-map tool-${tool}`}
                    style={{
                        width: `${Math.max(0.6, zoom) * 100}%`,
                        minWidth: `${760 * Math.max(0.6, zoom)}px`,
                    }}
                    viewBox="0 0 1080 650"
                    role="application"
                    aria-label="Circus construction map. Use arrow keys to move the tile cursor and Enter to use the selected tool."
                    tabIndex={0}
                    onKeyDown={keyDown}
                    onPointerDown={(e) => {
                        if (e.button !== 0) return;
                        const p = readPoint(e);
                        setKeyboard(false);
                        if (!p) return;
                        setHover(p);
                        setCursor(p);
                        if (tool === "path" || tool === "bulldoze") {
                            drag.current = true;
                            lastPaint.current = "";
                            e.currentTarget.setPointerCapture(e.pointerId);
                            paint(p);
                        } else act(p);
                    }}
                    onPointerMove={(e) => {
                        const p = readPoint(e);
                        setKeyboard(false);
                        setHover(p);
                        if (p && drag.current) paint(p);
                    }}
                    onPointerUp={(e) => {
                        drag.current = false;
                        lastPaint.current = "";
                        if (e.currentTarget.hasPointerCapture(e.pointerId))
                            e.currentTarget.releasePointerCapture(e.pointerId);
                    }}
                    onPointerCancel={() => {
                        drag.current = false;
                        lastPaint.current = "";
                    }}
                    onPointerLeave={() => {
                        if (!drag.current) setHover(null);
                    }}
                >
                    <defs>
                        <linearGradient id={`${id}-red`} x2=".7" y2="1">
                            <stop stopColor="#db8562" />
                            <stop offset="1" stopColor="#b75e47" />
                        </linearGradient>
                        <linearGradient id={`${id}-cream`} x2=".7" y2="1">
                            <stop stopColor="#fff0c8" />
                            <stop offset="1" stopColor="#ead7ad" />
                        </linearGradient>
                        <radialGradient id={`${id}-land-shadow`}>
                            <stop stopColor="#789c73" stopOpacity=".23" />
                            <stop offset="1" stopColor="#789c73" stopOpacity="0" />
                        </radialGradient>
                    </defs>
                    <rect width="1080" height="650" fill="#e6ecd9" />
                    <ellipse cx="546" cy="396" rx="513" ry="233" fill={`url(#${id}-land-shadow)`} />
                    <path
                        d={`M${ORIGIN_X - state.size * HALF_W} ${ORIGIN_Y + state.size * HALF_H}l${state.size * HALF_W} ${state.size * HALF_H} ${state.size * HALF_W} ${-state.size * HALF_H}v15l${-state.size * HALF_W} ${state.size * HALF_H} ${-state.size * HALF_W} ${-state.size * HALF_H}Z`}
                        fill="#a7b38b"
                    />
                    <path
                        d={`M${ORIGIN_X} ${ORIGIN_Y + state.size * HALF_H * 2}v15l${-state.size * HALF_W} ${-state.size * HALF_H}v-15Z`}
                        fill="#8f9f78"
                    />
                    {state.tiles.map((tile) => {
                        const p = world(tile.x + 0.5, tile.y + 0.5),
                            noise = numberNoise(tile.x, tile.y, state.seed),
                            key = `${tile.x},${tile.y}`,
                            water = tile.terrain === "water";
                        return (
                            <g key={key}>
                                <polygon
                                    points={diamond(tile.x, tile.y)}
                                    fill={
                                        water
                                            ? ["#a6c7bc", "#9cbfb7", "#b0cfc0"][
                                                  Math.floor(noise * 3)
                                              ]
                                            : [
                                                  "#bdcda1",
                                                  "#c4d2aa",
                                                  "#c0cea5",
                                                  "#c9d6ae",
                                                  "#bbcca1",
                                              ][Math.floor(noise * 5)]
                                    }
                                    stroke={showGrid ? "#859c7555" : water ? "#a6c5b9" : "#c0cfa6"}
                                    strokeWidth={showGrid ? 0.7 : 0.3}
                                />
                                {water ? (
                                    <path
                                        d={`m${p.x - 8} ${p.y}q4-2 8 0m2 4h6`}
                                        fill="none"
                                        stroke="#d8e6ca"
                                        strokeWidth="1"
                                        opacity=".65"
                                    />
                                ) : (
                                    noise > 0.67 &&
                                    !pathSet.has(key) &&
                                    !occupied.has(key) && (
                                        <path
                                            d={`m${p.x - 6} ${p.y + 2} 1-3 2 3m7-4 1-2 1 3`}
                                            fill="none"
                                            stroke="#8da773"
                                            strokeWidth=".8"
                                            opacity=".6"
                                        />
                                    )
                                )}
                                {coverage.has(key) && (
                                    <polygon
                                        points={diamond(tile.x, tile.y)}
                                        fill={overlay === "power" ? "#e4bd4740" : "#539fc840"}
                                        stroke={overlay === "power" ? "#caa33266" : "#619cb066"}
                                        strokeWidth=".4"
                                    />
                                )}
                                {ghostCoverage.has(key) && (
                                    <polygon
                                        points={diamond(tile.x, tile.y)}
                                        fill={overlay === "power" ? "#e4bd4718" : "#539fc818"}
                                        stroke={overlay === "power" ? "#b8944388" : "#5f95ad88"}
                                        strokeWidth=".8"
                                        strokeDasharray="2 3"
                                    />
                                )}
                            </g>
                        );
                    })}
                    {state.paths.map((key) => {
                        const [x, y] = key.split(",").map(Number),
                            p = world(x + 0.5, y + 0.5),
                            color =
                                overlay === "paths"
                                    ? connections.has(key)
                                        ? "#8cb38b"
                                        : "#cb9580"
                                    : "#ddcc9c";
                        return (
                            <g key={key}>
                                <polygon points={diamond(x, y)} fill={color} />
                                {[
                                    [1, 0],
                                    [0, 1],
                                    [-1, 0],
                                    [0, -1],
                                ]
                                    .filter(([dx, dy]) => !pathSet.has(`${x + dx},${y + dy}`))
                                    .map(([dx, dy], i) => {
                                        const a =
                                            dx === 1
                                                ? world(x + 1, y)
                                                : dy === 1
                                                  ? world(x, y + 1)
                                                  : dx === -1
                                                    ? world(x, y)
                                                    : world(x, y);
                                        const b =
                                            dx === 1
                                                ? world(x + 1, y + 1)
                                                : dy === 1
                                                  ? world(x + 1, y + 1)
                                                  : dx === -1
                                                    ? world(x, y + 1)
                                                    : world(x + 1, y);
                                        return (
                                            <path
                                                key={i}
                                                d={`M${a.x} ${a.y}L${b.x} ${b.y}`}
                                                stroke="#bbaa8177"
                                                strokeWidth="1"
                                            />
                                        );
                                    })}
                                <path
                                    d={`m${p.x - 5} ${p.y + 1} 3 1m5-4 2 1`}
                                    stroke="#b9a880"
                                    strokeWidth=".6"
                                    opacity=".45"
                                />
                                {overlay === "paths" && !connections.has(key) && (
                                    <text
                                        x={p.x}
                                        y={p.y + 3}
                                        fontSize="8"
                                        fill="#945b47"
                                        textAnchor="middle"
                                    >
                                        !
                                    </text>
                                )}
                            </g>
                        );
                    })}
                    {selected &&
                        footprint(selected).map((p) => (
                            <polygon
                                key={`select-${p.x}-${p.y}`}
                                points={diamond(p.x, p.y)}
                                fill="#f9edba55"
                                stroke="#fff2b6"
                                strokeWidth="1.5"
                            />
                        ))}
                    {active &&
                        tool !== "select" &&
                        ghostCells.map((p) => (
                            <polygon
                                key={`ghost-${p.x}-${p.y}`}
                                points={diamond(p.x, p.y)}
                                fill={
                                    problem
                                        ? "#ca6b6255"
                                        : tool === "bulldoze"
                                          ? "#ca986555"
                                          : "#65a77b66"
                                }
                                stroke={
                                    problem
                                        ? "#a64f46"
                                        : tool === "bulldoze"
                                          ? "#ad8057"
                                          : "#3e855a"
                                }
                                strokeWidth="1.8"
                            />
                        ))}
                    {visualItems
                        .sort((a, b) => a.depth - b.depth)
                        .map((item) => (
                            <g key={item.key} pointerEvents="none">
                                {item.node}
                            </g>
                        ))}
                    {active &&
                        chosenDef &&
                        (() => {
                            const w = rotated ? chosenDef.height : chosenDef.width,
                                h = rotated ? chosenDef.width : chosenDef.height,
                                p = world(active.x + w / 2, active.y + h / 2);
                            return (
                                <g
                                    transform={`translate(${p.x} ${p.y})`}
                                    opacity={problem ? 0.3 : 0.6}
                                    pointerEvents="none"
                                >
                                    <BuildingArt
                                        building={{ kind: chosenDef.kind, rotated }}
                                        id={id}
                                    />
                                </g>
                            );
                        })()}
                    {active &&
                        ghostCells.map((p) => (
                            <polygon
                                key={`outline-${p.x}-${p.y}`}
                                points={diamond(p.x, p.y)}
                                fill="none"
                                stroke={
                                    tool === "select" ? "#fdf2bd" : problem ? "#af5249" : "#386f50"
                                }
                                strokeWidth={keyboard ? 2 : 1.2}
                                strokeDasharray={keyboard ? "4 3" : undefined}
                                pointerEvents="none"
                            />
                        ))}
                    <g transform="translate(978 90)" opacity=".55" fill="#60785b">
                        <path d="m0-17-4 14 4-3 4 3Z" />
                        <path
                            d="M0-6v20m-12-12 12 5 12-5"
                            fill="none"
                            stroke="#68815e"
                            strokeWidth="1"
                        />
                        <text x="0" y="-22" fontSize="8" textAnchor="middle" letterSpacing="1">
                            N
                        </text>
                    </g>
                    <text x="74" y="596" fill="#829371" fontSize="9" letterSpacing="2.5">
                        RIVERSIDE MEADOW
                    </text>
                </svg>
            </div>
            <div className={`iso-map-status ${problem ? "has-problem" : ""}`} aria-live="polite">
                <span className="iso-map-status-dot" />
                <span>
                    {tooltip ??
                        (state.phase === "running"
                            ? "The gates are open. Guests follow your paths to the circus."
                            : "Your little corner of possibility. Choose something to build.")}
                </span>
                {active && (
                    <span className="iso-map-coordinates">
                        {active.x + 1}, {active.y + 1}
                    </span>
                )}
            </div>
            <div className="iso-map-hint">
                {overlay === "power"
                    ? "Gold tiles: active generator reach · badges: available power"
                    : overlay === "water"
                      ? "Blue tiles: active water tower reach · badges: available water"
                      : overlay === "paths"
                        ? "Green paths lead to the gate · terracotta paths are disconnected"
                        : tool === "path"
                          ? "Click and drag to draw paths. Every building needs a path along its edge."
                          : "Arrow keys move the cursor · Enter uses your tool · scroll to explore"}
                {ghostCoverage.size > 0
                    ? " · Dashed tiles: potential reach after placement and connection"
                    : ""}
            </div>
        </div>
    );
}
