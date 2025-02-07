
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./client/src/**/*.{js,jsx,ts,tsx}",
    "./client/index.html"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
