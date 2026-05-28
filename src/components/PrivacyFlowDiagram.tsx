import React from "react";

const NX = [101, 267, 433, 599, 765, 931, 1097];
const NW = 112;
const NH = 58;
const ROW_Y = 116;

const NODES = [
  { label: "SENDER",    sub: "wallet",       type: "entry" as const },
  { label: "OTS VAULT", sub: "vault code",   type: "security" as const },
  { label: "sTOKEN",    sub: "PBKDF2 shield",type: "security" as const },
  { label: "POOL PDA",  sub: "commitment",   type: "privacy" as const },
  { label: "ZK PROOF",  sub: "Groth16",      type: "privacy" as const },
  { label: "RELAY",     sub: "broadcast",    type: "privacy" as const },
  { label: "RECIPIENT", sub: "unlinkable",   type: "exit" as const },
];

const EDGE_LABELS = [
  "vault code",
  "OTS chain",
  "deposit",
  "in-browser",
  "Groth16",
  "no owner",
];

const ZONES = [
  { label: "SECURITY",  x1: 211, x2: 489, color: "#FF7A20" },
  { label: "PRIVACY",   x1: 543, x2: 987, color: "#AAAAAA" },
];

const NODE_COLORS: Record<string, string> = {
  entry:    "rgba(255,255,255,0.55)",
  security: "#FF7A20",
  privacy:  "#AAAAAA",
  exit:     "rgba(255,255,255,0.55)",
};

function seededJitter(seed: number, scale = 1.4): number {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return (s - Math.floor(s) - 0.5) * 2 * scale;
}

function chalkRect(bx: number, by: number, w: number, h: number, seed: number): string {
  const j = (n: number) => seededJitter(seed * 17 + n, 1.5);
  return `M ${bx + j(1)} ${by + j(2)} L ${bx + w + j(3)} ${by + j(4)} L ${bx + w + j(5)} ${by + h + j(6)} L ${bx + j(7)} ${by + h + j(8)} Z`;
}

function chalkLine(x1: number, y: number, x2: number, seed: number): string {
  const mid = (x1 + x2) / 2;
  const j = (n: number) => seededJitter(seed * 31 + n, 2.4);
  return `M ${x1} ${y + j(1)} C ${mid - 18} ${y + j(2)} ${mid + 18} ${y + j(3)} ${x2} ${y + j(4)}`;
}

function getLineColor(ni: number): string {
  if (ni === 0) return "rgba(255,255,255,0.22)";
  if (ni === 1) return "#7A3800";
  if (ni === 2) return "#303030";
  if (ni >= 3 && ni <= 4) return "#303030";
  return "rgba(255,255,255,0.15)";
}

function getDashColor(ni: number): string {
  if (ni <= 1) return "#FF7A20";
  if (ni >= 2 && ni <= 4) return "#AAAAAA";
  return "rgba(255,255,255,0.5)";
}

export function PrivacyFlowDiagram() {
  return (
    <div className="w-full pt-6 pb-4 relative z-10">
      <div className="max-w-[1200px] mx-auto px-4">
        <svg
          viewBox="0 0 1200 185"
          style={{ width: "100%", height: "auto", display: "block" }}
          aria-label="Signito protocol flow"
        >
          <defs>
            <filter id="pf-chalk" x="-8%" y="-60%" width="116%" height="220%">
              <feTurbulence type="fractalNoise" baseFrequency="0.055 0.08" numOctaves="4" seed="7" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.0" xChannelSelector="R" yChannelSelector="G" result="displaced" />
              <feGaussianBlur in="displaced" stdDeviation="0.3" />
            </filter>
            <filter id="pf-box" x="-6%" y="-30%" width="112%" height="160%">
              <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="3" seed="11" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <style>{`
              @keyframes pf-flow {
                from { stroke-dashoffset: 0; }
                to   { stroke-dashoffset: -28; }
              }
            `}</style>
          </defs>

          {ZONES.map((zone) => {
            const mx = (zone.x1 + zone.x2) / 2;
            const bY = 14;
            const tickH = 8;
            return (
              <g key={zone.label}>
                <line x1={zone.x1} y1={bY + tickH} x2={zone.x1} y2={bY} stroke={zone.color} strokeWidth="1" strokeOpacity="0.55" />
                <line x1={zone.x1} y1={bY} x2={zone.x2} y2={bY} stroke={zone.color} strokeWidth="1" strokeOpacity="0.55" strokeDasharray="4 3" />
                <line x1={zone.x2} y1={bY} x2={zone.x2} y2={bY + tickH} stroke={zone.color} strokeWidth="1" strokeOpacity="0.55" />
                <text
                  x={mx} y={bY - 4}
                  textAnchor="middle"
                  fill={zone.color}
                  fontSize="12"
                  fontFamily="'JetBrains Mono','Courier New',monospace"
                  fontWeight="700"
                  letterSpacing="2"
                  fillOpacity="0.9"
                >
                  {zone.label}
                </text>
              </g>
            );
          })}

          {NX.slice(0, -1).map((nx, si) => {
            const x1 = nx + NW / 2 + 3;
            const x2 = NX[si + 1] - NW / 2 - 3;
            const path = chalkLine(x1, ROW_Y, x2, si * 5 + 3);
            const midX = (x1 + x2) / 2;

            return (
              <g key={si}>
                <g filter="url(#pf-chalk)">
                  <path d={path} fill="none" stroke={getLineColor(si)} strokeWidth="5" strokeLinecap="round" />
                  <path d={path} fill="none" stroke={getDashColor(si)} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
                  <path
                    d={path}
                    fill="none"
                    stroke={getDashColor(si)}
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeDasharray="5 9"
                    strokeOpacity="0.9"
                    style={{ animation: `pf-flow 1.8s linear infinite`, animationDelay: `${-(si * 0.28)}s` }}
                  />
                </g>
                <text
                  x={midX}
                  y={ROW_Y - NH / 2 - 7}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.28)"
                  fontSize="7"
                  fontFamily="'JetBrains Mono','Courier New',monospace"
                  letterSpacing="0.3"
                >
                  {EDGE_LABELS[si]}
                </text>
              </g>
            );
          })}

          {NX.map((nx, ni) => {
            const bx = nx - NW / 2;
            const by = ROW_Y - NH / 2;
            const borderPath = chalkRect(bx, by, NW, NH, ni * 7 + 3);
            const color = NODE_COLORS[NODES[ni].type];
            const isHighlighted = NODES[ni].type === "security" || NODES[ni].type === "privacy";

            return (
              <g key={ni}>
                <rect x={bx - 1} y={by - 1} width={NW + 2} height={NH + 2} fill="#0A0A0A" />
                {isHighlighted && (
                  <rect x={bx} y={by} width={NW} height={NH} fill={color} fillOpacity="0.05" />
                )}
                <path
                  d={borderPath}
                  fill="none"
                  stroke={color}
                  strokeWidth={isHighlighted ? 1.8 : 1.2}
                  strokeOpacity={isHighlighted ? 0.9 : 0.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#pf-box)"
                />
                <text
                  x={nx}
                  y={ROW_Y - 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={color}
                  fontSize="10.5"
                  fontFamily="'JetBrains Mono','Courier New',monospace"
                  fontWeight="700"
                  letterSpacing="0.3"
                >
                  {NODES[ni].label}
                </text>
                <text
                  x={nx}
                  y={ROW_Y + NH / 2 + 9}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="rgba(255,255,255,0.22)"
                  fontSize="7.5"
                  fontFamily="'JetBrains Mono','Courier New',monospace"
                  letterSpacing="0.2"
                >
                  {NODES[ni].sub}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
