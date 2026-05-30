import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1B4332",
          dark: "#081C15",
          medium: "#2D6A4F",
          light: "#40916C",
          lighter: "#74C69D",
          pale: "#B7E4C7",
          muted: "#D8F3DC",
        },
        accent: "#40916C",
        "green-light": "#D8F3DC",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
