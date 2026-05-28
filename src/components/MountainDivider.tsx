import React from "react";
import signitoLogoUrl from "@assets/signito-logo-nobg.png";

const MOTION_PATH = "M0,90 L180,10 L360,80 L540,5 L720,75 L900,0 L1080,70 L1200,20 L1350,-130 L1440,-60";
const NODE_SIZE = 22;
const NODE_COUNT = 8;
const DUR = 7;

export function MountainDivider() {
  return (
    <svg
      className="absolute top-0 left-0 w-full pointer-events-none"
      style={{ transform: "translateY(-99%)", overflow: "visible" }}
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      overflow="visible"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <path id="mtn-rail" d={MOTION_PATH} />
      </defs>

      <path
        d="M0,120 L0,90 L180,10 L360,80 L540,5 L720,75 L900,0 L1080,70 L1200,20 L1350,-130 L1440,-60 L1440,120 Z"
        fill="#FFFFFF"
      />

      <use href="#mtn-rail" fill="none" stroke="#FF6B00" strokeWidth="1.2" strokeOpacity="0.3" strokeDasharray="5 7" />

      {Array.from({ length: NODE_COUNT }, (_, i) => (
        <image
          key={i}
          href={signitoLogoUrl}
          width={NODE_SIZE}
          height={NODE_SIZE}
          x={-NODE_SIZE / 2}
          y={-NODE_SIZE / 2}
          opacity="0.72"
          overflow="visible"
        >
          <animateMotion
            dur={`${DUR}s`}
            begin={`${-(i * DUR / NODE_COUNT).toFixed(2)}s`}
            repeatCount="indefinite"
            rotate="none"
          >
            <mpath href="#mtn-rail" />
          </animateMotion>
        </image>
      ))}
    </svg>
  );
}
