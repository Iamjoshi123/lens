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
          bg: "#0c0c11",
          surface: "#121218",
          card: "#18181f",
          border: "#24242e",
          muted: "#64648a",
          text: "#d8d8e8",
          gold: "#e8a838",
          "gold-dim": "#c08a28",
          blue: "#5090f0",
          "blue-dim": "#3870d0",
          hook: "#e8a838",
          proof: "#5090f0",
          cta: "#e06060",
          green: "#40c070",
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
            boxShadow: "0 0 0 4px rgba(255, 255, 255, 0.02)",
          },
          "50%": {
            boxShadow: "0 0 0 4px rgba(255, 255, 255, 0.05)",
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
