/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Ocean palette (from the console shell tokens) ─────────────────
        ocean: {
          950: '#050506',
          900: '#0C0C0E',
          850: '#151518',
          800: '#29272A',
          750: '#403D42',
        },
        // ── Signal colours ─────────────────────────────────────────────────
        ir:         '#FF7A45',   // IR channel / active alerts
        wv:         '#4FC3E0',   // Water vapour channel
        vis:        '#E7EEF4',   // Visible channel
        confidence: '#6FE3B4',   // Confidence / positive readouts
        alert:      '#FF5C5C',   // High-severity alerts
        accent:     '#D7A45A',   // Interactive / selected states
        // ── Text ───────────────────────────────────────────────────────────
        text: {
          primary:   '#F4F1EA',
          secondary: '#B5B0A8',
          muted:     '#89847E',
          faint:     '#5A5652',
        },
        // ── Legacy aliases kept so existing classes don't break ────────────
        danger: { DEFAULT: '#FF5C5C', critical: '#FF3B30' },
        base: { 900: '#050506', 800: '#0C0C0E', 700: '#151518' },
        glass: {
          bg:        'rgba(16, 27, 40, 0.60)',
          border:    'rgba(255, 255, 255, 0.08)',
          highlight: 'rgba(255, 255, 255, 0.04)',
        },
      },
      fontFamily: {
        // IBM Plex Sans for UI prose, IBM Plex Mono for data values
        sans: ['"IBM Plex Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        glass:  '0 8px 32px 0 rgba(0,0,0,0.45)',
        glow:   '0 0 20px rgba(100,149,237,0.25)',
        'glow-ir': '0 0 14px rgba(255,122,69,0.35)',
        'glow-conf': '0 0 10px rgba(111,227,180,0.30)',
      },
      backdropBlur: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      },
    },
  },
  plugins: [],
};
