import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        panel: "0 16px 60px rgba(18, 24, 40, 0.12)",
      },
    },
  },
  plugins: [],
} satisfies Config;
