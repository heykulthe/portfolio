import defaultTheme from "tailwindcss/defaultTheme";

export default {
  darkMode: ["class"],
  content: [
    "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "rgb(var(--paper) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
        display: ["Fraunces Variable", ...defaultTheme.fontFamily.serif],
        mono: ["Maple Mono", ...defaultTheme.fontFamily.mono],
      },

      borderRadius: {
        none: "0px",
        sm: "2px",
        DEFAULT: "2px",
        md: "2px",
        lg: "2px",
        xl: "2px",
        full: "9999px",
      },

      boxShadow: {
        none: "none",
      },
      letterSpacing: {
        label: "0.12em",
      },
      fontSize: {
        label: ["0.75rem", { lineHeight: "1.1rem" }],
      },
      maxWidth: {
        measure: "42rem",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
