import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Severity / status palette used across badges
        severity: {
          low: "#0ea5e9",
          medium: "#f59e0b",
          high: "#f97316",
          critical: "#dc2626",
        },
      },
    },
  },
  plugins: [],
};

export default config;
