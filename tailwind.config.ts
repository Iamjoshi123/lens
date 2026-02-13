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
          bg: "#07004D",           // Deep navy — primary background
          surface: "#0d0860",      // Slightly lighter navy — panels
          card: "#140e6e",         // Card backgrounds
          border: "#2D82B7",       // Blue — borders & dividers
          muted: "#8ba4c4",        // Muted text on dark
          text: "#F3DFBF",         // Warm cream — primary text
          // Accents
          accent: "#42E2B8",       // Teal — primary accent / CTAs
          "accent-dim": "#34b896", // Dimmed teal
          blue: "#2D82B7",        // Blue — secondary
          "blue-dim": "#246a96",
          coral: "#EB8A90",       // Coral — alerts / special
          "coral-dim": "#d07078",
          // Semantic (mapped to palette)
          hook: "#42E2B8",        // Teal for hooks
          proof: "#2D82B7",       // Blue for proof
          cta: "#EB8A90",         // Coral for CTAs
          green: "#42E2B8",       // Teal as green replacement
          gold: "#42E2B8",        // Teal replaces gold
          "gold-dim": "#34b896",
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
            boxShadow: "0 0 0 4px rgba(45, 130, 183, 0.08)",
          },
          "50%": {
            boxShadow: "0 0 0 4px rgba(45, 130, 183, 0.15)",
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
