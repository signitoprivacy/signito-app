import React, { useState, useEffect, useRef } from "react";
import signitoLogoUrl from "@assets/signito-logo-nobg.png";

const R = 380;
const CX = 400;
const CY = 420;
const VBOX = 800;
const CONNECT_DIST = 115;
const ROT_SPEED = 8;
const HUB_ROT_SPEED = 28;

interface RawNode {
  lat: number;
  lon: number;
  id: number;
}

interface GNode {
  x: number;
  y: number;
  z: number;
  id: number;
}

const GRID: [number, number][] = [
  [85, 0],
  [75, 0], [75, 45], [75, 90], [75, 135], [75, 180], [75, 225], [75, 270], [75, 315],
  [60, 0], [60, 36], [60, 72], [60, 108], [60, 144], [60, 180], [60, 216], [60, 252], [60, 288], [60, 324],
  [30, 0], [30, 24], [30, 48], [30, 72], [30, 96], [30, 120], [30, 144], [30, 168],
  [30, 192], [30, 216], [30, 240], [30, 264], [30, 288], [30, 312], [30, 336],
  [0, 0], [0, 22], [0, 44], [0, 66], [0, 88], [0, 110], [0, 132], [0, 154],
  [0, 176], [0, 198], [0, 220], [0, 242], [0, 264], [0, 286], [0, 308], [0, 330],
  [-30, 0], [-30, 30], [-30, 60], [-30, 90], [-30, 120], [-30, 150],
  [-30, 180], [-30, 210], [-30, 240], [-30, 270], [-30, 300], [-30, 330],
  [-60, 0], [-60, 45], [-60, 90], [-60, 135], [-60, 180], [-60, 225], [-60, 270], [-60, 315],
  [-85, 0],
];

function project(lat: number, lon: number, rotDeg: number): GNode & { id: number } {
  const la = (lat * Math.PI) / 180;
  const lo = ((lon + rotDeg) * Math.PI) / 180;
  return {
    id: 0,
    x: CX + R * Math.cos(la) * Math.cos(lo),
    y: CY - R * Math.sin(la),
    z: Math.cos(la) * Math.sin(lo),
  };
}

const RAW_NODES: RawNode[] = GRID.map(([lat, lon], id) => ({ lat, lon, id }));

const LAT_LINES = [-60, -30, 30, 60];

const HUB_COORDS: [number, number][] = [
  [55, 20],
  [55, 110],
  [55, 200],
  [55, 290],
  [10, 60],
  [10, 150],
  [10, 240],
  [10, 330],
  [-35, 80],
  [-35, 260],
];
const HUB_REACH = 160;

export function HeroGlobe({
  light = false,
  baseFill = "#1A0800",
  frozen = false,
}: {
  light?: boolean;
  baseFill?: string;
  frozen?: boolean;
}) {
  const angleRef = useRef(frozen ? 90 : 0);
  const hubAngleRef = useRef(0);
  const lastRef = useRef<number | null>(null);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    let raf: number;
    const tick = (now: number) => {
      if (lastRef.current !== null) {
        const dt = (now - lastRef.current) / 1000;
        if (!frozen) {
          angleRef.current = (angleRef.current + ROT_SPEED * dt) % 360;
        }
        hubAngleRef.current = (hubAngleRef.current + HUB_ROT_SPEED * dt) % 360;
        forceUpdate(n => n + 1);
      }
      lastRef.current = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [frozen]);

  const angle = angleRef.current;
  const hubAngle = hubAngleRef.current;

  const nodes: (GNode & { id: number })[] = RAW_NODES.map(n => ({
    ...project(n.lat, n.lon, angle),
    id: n.id,
  }));

  const visible = nodes.filter(n => n.z > 0.05);

  const edges: [number, number][] = [];
  for (let i = 0; i < visible.length; i++) {
    for (let j = i + 1; j < visible.length; j++) {
      const dx = visible[i].x - visible[j].x;
      const dy = visible[i].y - visible[j].y;
      if (Math.sqrt(dx * dx + dy * dy) < CONNECT_DIST) {
        edges.push([i, j]);
      }
    }
  }

  const hubNodes = HUB_COORDS.map(([lat, lon]) =>
    project(lat, lon, frozen ? hubAngle : angle)
  );

  const hubLinks: { hx: number; hy: number; nx: number; ny: number; op: number }[] = [];
  for (const hub of hubNodes) {
    if (hub.z < 0.0) continue;
    const nearby = visible
      .filter(n => {
        const dx = n.x - hub.x; const dy = n.y - hub.y;
        return Math.sqrt(dx * dx + dy * dy) < HUB_REACH;
      })
      .sort((a, b) => {
        const da = (a.x - hub.x) ** 2 + (a.y - hub.y) ** 2;
        const db = (b.x - hub.x) ** 2 + (b.y - hub.y) ** 2;
        return da - db;
      })
      .slice(0, 7);
    for (const n of nearby) {
      const op = Math.max(0.1, Math.min(0.55, 0.1 + hub.z * 0.5));
      hubLinks.push({ hx: hub.x, hy: hub.y, nx: n.x, ny: n.y, op });
    }
  }

  const gradId = frozen ? "sphereGradFrozen" : "sphereGrad";
  const rimId = frozen ? "sphereRimFrozen" : "sphereRim";

  return (
    <svg
      viewBox={`0 0 ${VBOX} ${VBOX}`}
      className="w-full h-full select-none"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <defs>
        <radialGradient id={gradId} cx="38%" cy="32%" r="60%">
          {light ? (
            <>
              <stop offset="0%" stopColor="#8090A8" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#8090A8" stopOpacity="0.0" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#4A5468" stopOpacity="0.22" />
              <stop offset="50%" stopColor="#1E2230" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#0A0A0A" stopOpacity="0.0" />
            </>
          )}
        </radialGradient>
        <radialGradient id={rimId} cx="50%" cy="50%" r="50%">
          {light ? (
            <>
              <stop offset="75%" stopColor="#8090A8" stopOpacity="0.0" />
              <stop offset="100%" stopColor="#8090A8" stopOpacity="0.1" />
            </>
          ) : (
            <>
              <stop offset="75%" stopColor="#0A0A0A" stopOpacity="0.0" />
              <stop offset="100%" stopColor="#2A3040" stopOpacity="0.35" />
            </>
          )}
        </radialGradient>
      </defs>

      <circle cx={CX} cy={CY} r={R} fill={baseFill} />
      <circle cx={CX} cy={CY} r={R} fill={`url(#${gradId})`} />
      <circle cx={CX} cy={CY} r={R} fill={`url(#${rimId})`} />
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#8090A8" strokeWidth="1.2" opacity="0.55" />

      {LAT_LINES.map(lat => {
        const laR = (lat * Math.PI) / 180;
        const rx = R * Math.cos(laR);
        const ry = rx * 0.18;
        const cy2 = CY - R * Math.sin(laR);
        if (rx < 5) return null;
        return (
          <ellipse key={`lat-${lat}`} cx={CX} cy={cy2} rx={rx} ry={ry}
            fill="none" stroke="#6878A0" strokeWidth="0.6" opacity="0.22" />
        );
      })}

      {edges.map(([i, j], k) => {
        const a = visible[i];
        const b = visible[j];
        const avgZ = (a.z + b.z) / 2;
        const op = Math.max(0.06, Math.min(0.28, 0.07 + (avgZ + 0.2) * 0.26));
        return (
          <line key={k}
            x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke="#90A0C0" strokeWidth="0.8" opacity={op}
          />
        );
      })}

      {hubLinks.map((l, i) => (
        <line key={`hl-${i}`}
          x1={l.hx} y1={l.hy} x2={l.nx} y2={l.ny}
          stroke="#A0B0C8" strokeWidth="0.9" opacity={l.op}
          strokeDasharray="5 5"
        />
      ))}

      {visible.map((n, i) => {
        const depthFront = Math.max(0, n.z);
        const size = 10 + depthFront * 8;
        const op = 0.35 + depthFront * 0.65;
        return (
          <image
            key={i}
            href={signitoLogoUrl}
            x={n.x - size / 2}
            y={n.y - size / 2}
            width={size}
            height={size}
            opacity={op}
          />
        );
      })}
    </svg>
  );
}
