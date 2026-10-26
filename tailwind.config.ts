import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#ecfdf3",
          100: "#d1fadf",
          500: "#12b76a",
          600: "#039855",
          700: "#027a48",
          900: "#054f31",
        },
        accent: { 400: "#fdb022", 500: "#f79009", 600: "#dc6803" },
        ink: { 900: "#101828", 700: "#344054", 500: "#667085", 300: "#d0d5dd", 100: "#f2f4f7" },
      },
      fontFamily: { sans: ["var(--font-sans)", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
} satisfies Config;
