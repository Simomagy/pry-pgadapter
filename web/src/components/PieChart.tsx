import React, { useState } from "react";
import type { ChartData } from "../types";

const SLICE_COLORS = [
  "#d68a3c",
  "#8b1a1a",
  "#4a5a32",
  "#8b3e1a",
  "#5a4838",
  "#a82626",
  "#6b7a48",
  "#7a6450",
];

interface Slice {
  label: string;
  time: number;
  queries: number;
  color: string;
  startAngle: number;
  endAngle: number;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number): string {
  const s = polarToCartesian(cx, cy, r, start);
  const e = polarToCartesian(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)} Z`;
}

interface Props {
  data: ChartData;
}

const PieChart: React.FC<Props> = ({ data }) => {
  const [hovered, setHovered] = useState<number | null>(null);

  if (!data.labels.length) return null;

  const total = data.data.reduce((sum, d) => sum + d.time, 0);
  if (total === 0) return null;

  let currentAngle = 0;
  const slices: Slice[] = data.labels.map((label, i) => {
    const time = data.data[i]?.time ?? 0;
    const queries = data.data[i]?.queries ?? 0;
    const angleDelta = (time / total) * 360;
    const slice: Slice = {
      label,
      time,
      queries,
      color: SLICE_COLORS[i % SLICE_COLORS.length],
      startAngle: currentAngle,
      endAngle: currentAngle + angleDelta,
    };
    currentAngle += angleDelta;
    return slice;
  });

  const SIZE = 160;
  const R = 70;
  const cx = SIZE / 2;
  const cy = SIZE / 2;

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="shrink-0"
      >
        {slices.map((slice, i) => (
          <path
            key={i}
            d={arcPath(cx, cy, R, slice.startAngle, slice.endAngle)}
            fill={slice.color}
            opacity={hovered === null || hovered === i ? 1 : 0.35}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: "pointer", transition: "opacity .15s ease" }}
          />
        ))}

        {hovered !== null && slices[hovered] && (
          <>
            <text
              x={cx}
              y={cy - 7}
              textAnchor="middle"
              fill="#f3e2bd"
              fontSize={9}
              fontFamily="JetBrains Mono, monospace"
            >
              {slices[hovered].time.toFixed(1)} ms
            </text>
            <text
              x={cx}
              y={cy + 7}
              textAnchor="middle"
              fill="#e6a45c"
              fontSize={8}
              fontFamily="JetBrains Mono, monospace"
            >
              {slices[hovered].queries} queries
            </text>
          </>
        )}
      </svg>

      <div className="flex flex-col gap-1 w-full overflow-y-auto rdm-scroll-area max-h-28">
        {slices.map((slice, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-[11px] cursor-default px-1"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <span
              className="block w-2 h-2 shrink-0"
              style={{ background: slice.color }}
            />
            <span
              className={`truncate transition-colors ${
                hovered === i ? "text-bone-50" : "text-bone-200/55"
              }`}
            >
              {slice.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PieChart;
