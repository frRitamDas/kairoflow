import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#07080a",
          900: "#0b0d10",
          850: "#101317",
          800: "#15181d",
          700: "#1e2228",
        },
        chalk: "#f4f4f2",
        muted: "#8c919b",
        accent: "#c8ff5e",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        glow: "0 0 60px -12px rgba(200, 255, 94, 0.35)",
        panel: "0 24px 70px -30px rgba(0, 0, 0, 0.9)",
      },
      keyframes: {
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.55" },
          "50%": { transform: "scale(1.09)", opacity: "0.9" },
        },
        ripple: {
          "0%": { transform: "scale(0.92)", opacity: "0.6" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        bar: {
          "0%, 100%": { transform: "scaleY(0.25)" },
          "50%": { transform: "scaleY(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        breathe: "breathe 2.6s ease-in-out infinite",
        ripple: "ripple 2.4s ease-out infinite",
        bar: "bar 1s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
        fadeUp: "fadeUp 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
