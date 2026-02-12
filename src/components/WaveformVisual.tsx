import React from "react";

const BAR_COUNT = 60;
const MARKER_POSITIONS = [12, 28, 44];

export default function WaveformVisual() {
  const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
    const center = BAR_COUNT / 2;
    const dist = Math.abs(i - center) / center;
    const height = 20 + (1 - dist) * 60 + Math.sin(i * 0.7) * 15;
    return height;
  });

  return (
    <div className="relative w-full max-w-3xl mx-auto h-32 flex items-end justify-center gap-[2px] opacity-30">
      {bars.map((h, i) => (
        <div
          key={i}
          className="waveform-bar rounded-full"
          style={{
            width: "3px",
            height: `${h}%`,
            backgroundColor: MARKER_POSITIONS.includes(i)
              ? "hsl(var(--landing-accent))"
              : "hsl(var(--landing-text) / 0.5)",
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
      {MARKER_POSITIONS.map((pos) => (
        <div
          key={pos}
          className="marker-dot absolute bottom-0 w-2 h-2 rounded-full"
          style={{
            left: `${(pos / BAR_COUNT) * 100}%`,
            backgroundColor: "hsl(var(--landing-accent))",
          }}
        />
      ))}
    </div>
  );
}
