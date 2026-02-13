
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
        // Brand Colors
        lens: {
          primary: "#FCA311", // Gold
          secondary: "#14213D", // Deep Navy
          // Backgrounds
          bg: "#14213D", // Navy Main Background
          "bg-subtle": "#1D2D50", // Slightly lighter Navy for cards/sections
          "bg-inverse": "#FFFFFF", // White
          // Text
          text: "#FFFFFF", // White text for dark background
          "text-inverse": "#14213D", // Navy text for light backgrounds (like buttons)
          muted: "#94A3B8", // Slate-400 equivalent for muted text
          // Borders
          border: "#2A3B55", // Subtle border for dark theme
          "border-active": "#FCA311",
        },
      },
      fontFamily: {
        heading: ["var(--font-bricolage)", "sans-serif"],
        body: ["var(--font-inter-tight)", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      boxShadow: {
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
