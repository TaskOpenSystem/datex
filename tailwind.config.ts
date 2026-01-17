import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#00bfff", // Cyan - Marketplace primary
        "background-light": "#f6f7f9",
        "background-dark": "#19202e",
        "slush-yellow": "#FFD600",
        "slush-orange": "#FF5C00",
        "slush-purple": "#9747FF",
        "slush-green": "#00D68F",
        "slush-dark": "#1A1A1A",
        // Marketplace colors
        ink: "#101618",
        "accent-lime": "#ccff00",
        "accent-orange": "#ff6b00",
        "accent-pink": "#ff0099",
      },
      boxShadow: {
        hard: "4px 4px 0px 0px #101618",
        "hard-sm": "2px 2px 0px 0px #101618",
        "hard-lg": "8px 8px 0px 0px #101618",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        sans: ["Space Grotesk", "sans-serif"],
        body: ["Space Grotesk", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        large: "2rem",
      },
      animation: {
        marquee: "marquee 25s linear infinite",
        "marquee-reverse": "marquee-reverse 25s linear infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-100%)" },
        },
        "marquee-reverse": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
