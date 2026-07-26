import type { Config } from "tailwindcss";

/**
 * Tasarım token'ları docs/STITCH-PROMPT.md ve docs/design/screen-*.html
 * referanslarından birebir aktarılmıştır (Tech Indigo Modern).
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#c3c0ff",
        "on-primary": "#1d00a5",
        "primary-container": "#4f46e5",
        "on-primary-container": "#dad7ff",
        "primary-fixed": "#e2dfff",
        "primary-fixed-dim": "#c3c0ff",
        "inverse-primary": "#4d44e3",
        secondary: "#89ceff",
        "on-secondary": "#00344d",
        "secondary-container": "#00a2e6",
        "on-secondary-container": "#00344e",
        tertiary: "#ffb695",
        "on-tertiary": "#571f00",
        "tertiary-container": "#a44100",
        "on-tertiary-container": "#ffd2be",
        error: "#ffb4ab",
        "on-error": "#690005",
        "error-container": "#93000a",
        "on-error-container": "#ffdad6",
        background: "#051424",
        "on-background": "#d4e4fa",
        surface: "#051424",
        "on-surface": "#d4e4fa",
        "surface-dim": "#051424",
        "surface-bright": "#2c3a4c",
        "surface-container-lowest": "#010f1f",
        "surface-container-low": "#0d1c2d",
        "surface-container": "#122131",
        "surface-container-high": "#1c2b3c",
        "surface-container-highest": "#273647",
        "surface-variant": "#273647",
        "on-surface-variant": "#c7c4d8",
        outline: "#918fa1",
        "outline-variant": "#464555",
        "inverse-surface": "#d4e4fa",
        "inverse-on-surface": "#233143",
        "surface-tint": "#c3c0ff",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "40px",
        "2xl": "64px",
        gutter: "24px",
        "container-max": "1280px",
      },
      fontFamily: {
        display: ["Outfit", "sans-serif"],
        sans: ["Inter", "sans-serif"],
      },
      fontSize: {
        "display-lg": ["48px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-lg-mobile": ["32px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-md": ["24px", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-sm": ["20px", { lineHeight: "1.4", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "label-md": ["14px", { lineHeight: "1", letterSpacing: "0.02em", fontWeight: "600" }],
        "label-xs": ["12px", { lineHeight: "1", fontWeight: "500" }],
      },
    },
  },
  plugins: [],
};

export default config;
