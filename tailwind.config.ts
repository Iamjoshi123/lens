import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        lens: {
          // Core palette
          bg: "#0D0D0D",             // Deep Onyx — main canvas
          surface: "#161616",        // Slightly lighter — panels
          card: "#1E1E1E",           // Card backgrounds
          border: "#2A2A2A",         // Borders & dividers
          muted: "#808080",          // Muted text
          text: "#F2F2F2",           // Ghost Grey — primary text
          // Accents
          lime: "#CCFF00",           // Radioactive Lime — CTA
          "lime-dim": "#A3CC00",     // Dimmed lime
          mauve: "#9D8DF1",          // Muted Mauve — secondary
          "mauve-dim": "#7D6DD1",    // Dimmed mauve
          red: "#FF3E3E",            // Glitch Red — errors/alerts
          "red-dim": "#CC3232",      // Dimmed red
          // Semantic aliases
          accent: "#CCFF00",         // Primary CTA
          gold: "#CCFF00",           // Alias for backward compat
          "gold-dim": "#A3CC00",
          blue: "#9D8DF1",           // Secondary alias
          "blue-dim": "#7D6DD1",
          hook: "#CCFF00",           // Lime for hooks
          proof: "#9D8DF1",          // Mauve for proof
          cta: "#FF3E3E",            // Red for CTAs
          green: "#CCFF00",          // Lime as green replacement
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "fade-in": "fade-in 0.4s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        "glow-pulse": {
          "0%, 100%": {
            boxShadow: "0 0 0 4px rgba(204, 255, 0, 0.04)",
          },
          "50%": {
            boxShadow: "0 0 0 4px rgba(204, 255, 0, 0.1)",
          },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
