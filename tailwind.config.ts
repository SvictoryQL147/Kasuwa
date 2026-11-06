import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Electric blue: primary actions, links, focus
        brand: {
          50: "#eef3ff",
          100: "#dce6ff",
          500: "#3d7bff",
          600: "#1f5eff", // white text on it: 5.1:1
          700: "#1747cc",
          900: "#0b1020", // midnight
        },
        // Cantaloupe orange: Team-Up, deals, badges. Put midnight text on 400-600, never white.
        accent: {
          400: "#ffb97a",
          500: "#ffa65c", // midnight text on it: 9.8:1
          600: "#f28e3c", // hover
          700: "#a8500f", // orange TEXT on white or light orange: 5.5:1
        },
        // Midnight black + cool greys
        ink: { 900: "#0b1020", 700: "#2e3548", 500: "#5f677b", 300: "#cfd4df", 100: "#f3f5f9" },
      },
      fontFamily: { sans: ["var(--font-sans)", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
} satisfies Config;
