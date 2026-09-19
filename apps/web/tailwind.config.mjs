/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        border: "#000000",
        input: "#000000",
        ring: "#000000",
        background: "#fdfbf7",
        foreground: "#121212",
        main: "#a3e635",
        primary: {
          DEFAULT: "#facc15",
          foreground: "#000000",
        },
        secondary: {
          DEFAULT: "#38bdf8",
          foreground: "#000000",
        },
        destructive: {
          DEFAULT: "#f87171",
          foreground: "#000000",
        },
        muted: {
          DEFAULT: "#e5e7eb",
          foreground: "#4b5563",
        },
        accent: {
          DEFAULT: "#f472b6",
          foreground: "#000000",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#121212",
        },
      },
      borderRadius: {
        base: "6px",
      },
      boxShadow: {
        brutal: "4px 4px 0px 0px #000000",
        "brutal-sm": "2px 2px 0px 0px #000000",
        "brutal-lg": "6px 6px 0px 0px #000000",
      },
      translate: {
        boxShadowX: "4px",
        boxShadowY: "4px",
      },
      fontFamily: {
        para: ['"Public Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        heading: ['"Cabinet Grotesk"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
