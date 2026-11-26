"use client";

const heights = [28, 52, 74, 40, 88, 62, 34, 70, 96, 48, 82, 58, 36, 68, 92, 46, 76, 54, 30, 66, 84, 42, 72, 50, 32, 60, 78, 44, 26, 56];

export function Waveform({ active }: { active: boolean }) {
  return (
    <div className="flex h-10 items-center justify-center gap-[3px]" aria-hidden>
      {heights.map((height, i) => (
        <span
          key={i}
          className={`wave-bar ${active ? "" : "idle"}`}
          style={active ? {
            height: `${height}%`,
            animation: `bar ${0.65 + (i % 5) * 0.11}s ease-in-out ${(i % 9) * 0.08}s infinite`,
          } : undefined}
        />
      ))}
    </div>
  );
}
