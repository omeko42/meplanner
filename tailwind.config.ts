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
        wedding: {
          navy: "#0A192F",
          navyDark: "#061020",
          navyLight: "#112240",
          gold: "#C5A059",
          goldLight: "#E6C786",
          goldDark: "#9A7732",
          ivory: "#FAF8F5",
          champagne: "#F4EFE6",
          rose: "#8B1E3F",
          sage: "#2D5A27",
        },
        bareskrim: {
          DEFAULT: "#8B0000",
          dark: "#660000",
          crimson: "#991B1B",
          maroon: "#800020",
          light: "#B91C1C",
          gold: "#C5A059",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "Times", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
