import React from "react";

export function SketchPattern({ id }: { id: string }) {
  return (
    <pattern id={id} patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45 0 0)">
      <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(255,255,255,0.09)" strokeWidth="2" />
    </pattern>
  );
}

interface BoxProps {
  x: number; y: number; w: number; h: number;
  label: string; sub?: string;
  accent?: boolean; rx?: number; pid: string;
  labelSize?: number; subSize?: number;
}

export function SketchBox({ x, y, w, h, label, sub, accent = false, rx = 10, pid, labelSize = 15, subSize = 10 }: BoxProps) {
  const stroke = accent ? "#FF6B00" : "rgba(255,255,255,0.7)";
  const sw = accent ? 2.5 : 2;
  const tc = accent ? "#FF6B00" : "white";
  const cy = y + h / 2;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={rx} fill="#1A1A1A" />
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={`url(#${pid})`} />
      <rect x={x} y={y} width={w} height={h} rx={rx} fill="none" stroke={stroke} strokeWidth={sw} />
      <text x={x + w / 2} y={sub ? cy - 3 : cy + labelSize * 0.4}
        textAnchor="middle" fill={tc}
        fontSize={labelSize} fontFamily="JetBrains Mono, monospace" fontWeight="bold">{label}</text>
      {sub && (
        <text x={x + w / 2} y={cy + subSize + 3}
          textAnchor="middle" fill="rgba(255,255,255,0.4)"
          fontSize={subSize} fontFamily="JetBrains Mono, monospace">{sub}</text>
      )}
    </g>
  );
}

interface ArrowProps {
  x1: number; y1: number; x2: number; y2: number;
  color?: string; label?: string; dashed?: boolean;
  labelOffset?: number;
}

export function SketchArrow({ x1, y1, x2, y2, color = "#FF6B00", label, dashed, labelOffset = -10 }: ArrowProps) {
  const dx = x2 - x1; const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return null;
  const ux = dx / len; const uy = dy / len;
  const nx = -uy; const ny = ux;
  const tip = 11;
  const ax = x2 - ux * tip; const ay = y2 - uy * tip;
  const mx = (x1 + x2) / 2; const my = (y1 + y2) / 2;
  return (
    <g>
      <line x1={x1} y1={y1} x2={ax} y2={ay}
        stroke={color} strokeWidth="2.5" strokeLinecap="round"
        strokeDasharray={dashed ? "6 4" : undefined} />
      <polygon
        points={`${x2},${y2} ${ax + nx * 5},${ay + ny * 5} ${ax - nx * 5},${ay - ny * 5}`}
        fill={color} />
      {label && (
        <text x={mx + nx * Math.abs(labelOffset)} y={my + ny * Math.abs(labelOffset)}
          textAnchor="middle" fill="rgba(255,255,255,0.45)"
          fontSize="10" fontFamily="JetBrains Mono, monospace">{label}</text>
      )}
    </g>
  );
}
