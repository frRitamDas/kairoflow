export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <div
      className="relative grid place-items-center rounded-[11px] border border-white/15 bg-white/[0.05]"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
        <path d="M5 4v16M5 12h6M11 7l7 5-7 5" stroke="#c8ff5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
