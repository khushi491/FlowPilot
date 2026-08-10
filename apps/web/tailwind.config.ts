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
        lego: {
          red: "#e3000b",
          yellow: "#ffd500",
          blue: "#0055bf",
          green: "#00a651",
          orange: "#f57c00",
          ink: "#111111",
          base: "#f2f2f2",
        },
      },
      boxShadow: {
        brick: "0 5px 0 rgba(0,0,0,0.18)",
        "brick-red": "0 4px 0 #8b0008",
        "brick-yellow": "0 4px 0 #b89600",
        "brick-blue": "0 4px 0 #003a82",
      },
      borderRadius: {
        brick: "6px",
      },
    },
  },
  plugins: [],
};
export default config;
