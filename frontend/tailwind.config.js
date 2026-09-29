/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Institutional Observatory Slate & Maritime Navy Palette ─────
        ocean: {
          950: "#080c14", // Deep command console ground
          900: "#0c1322", // Operational workstation panel base
          850: "#121b2f", // Scientific card surface
          800: "#1d2b45", // Hairline structural dividers
          750: "#273859", // Interactive hover surface
          700: "#364c75", // Active state border
          600: "#49659b", // Elevated telemetry borders
        },
        slate: {
          950: "#080c14",
          900: "#0c1322",
          850: "#121b2f",
          800: "#1d2b45",
          700: "#334155",
        },
        // ── Meteorological Sensor & Signal Tokens ───────────────────────
        ir: "#38bdf8", // TIR1 (10.8µm) Thermal Infrared
        wv: "#0ea5e9", // WV (6.7µm) Water Vapour Channel
        vis: "#f8fafc", // VIS (0.65µm) Visible Optical Spectrum
        radar: "#0284c7", // Doppler Radar reflectivity
        confidence: "#10b981", // Operational Nominal / Verification
        alert: "#ef4444", // Storm Warning / High Convection
        hazard: "#dc2626", // Severe Cyclonic Landfall Hazard
        caution: "#f59e0b", // Tropical Depression / Pre-warning
        accent: "#38bdf8", // Interactive telemetry cyan
        
        // ── Typography Tokens ──────────────────────────────────────────
        text: {
          primary: "#f8fafc", // High contrast reading
          secondary: "#cbd5e1", // Supporting scientific telemetry
          muted: "#94a3b8", // Metadata labels & coordinates
          faint: "#64748b", // Subtle timestamps & system IDs
        },

        // ── Institutional System Aliases ───────────────────────────────
        danger: { DEFAULT: "#ef4444", critical: "#dc2626" },
        base: { 900: "#080c14", 800: "#0c1322", 700: "#121b2f" },
        glass: {
          bg: "rgba(12, 19, 34, 0.85)",
          card: "rgba(18, 27, 47, 0.72)",
          border: "rgba(255, 255, 255, 0.08)",
          highlight: "rgba(56, 189, 248, 0.05)",
        },
      },
      fontFamily: {
        sans: [
          '"IBM Plex Sans"',
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
        mono: [
          '"IBM Plex Mono"',
          '"JetBrains Mono"',
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      boxShadow: {
        glass: "0 8px 30px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.06)",
        panel: "0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08)",
        card: "0 2px 10px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.06)",
        subtle: "0 1px 3px rgba(0, 0, 0, 0.3)",
        radar: "0 0 12px rgba(14, 165, 233, 0.2)",
        "radar-alert": "0 0 12px rgba(239, 68, 68, 0.25)",
      },
      backdropBlur: {
        xs: "4px",
        sm: "8px",
        md: "14px",
        lg: "20px",
        xl: "28px",
      },
    },
  },
  plugins: [],
};
