/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class", '[data-theme="black"]'],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        white: "rgb(var(--color-white) / <alpha-value>)",
        black: "rgb(var(--color-black) / <alpha-value>)",
        zinc: {
          850: "rgb(var(--color-zinc-850) / <alpha-value>)",
          950: "rgb(var(--color-zinc-950) / <alpha-value>)",
          900: "rgb(var(--color-zinc-900) / <alpha-value>)",
          800: "rgb(var(--color-zinc-800) / <alpha-value>)",
          700: "rgb(var(--color-zinc-700) / <alpha-value>)",
          500: "rgb(var(--color-zinc-500) / <alpha-value>)",
          600: "rgb(var(--color-zinc-600) / <alpha-value>)",
          300: "rgb(var(--color-zinc-300) / <alpha-value>)",
          400: "rgb(var(--color-zinc-400) / <alpha-value>)",
          200: "rgb(var(--color-zinc-200) / <alpha-value>)",
          100: "rgb(var(--color-zinc-100) / <alpha-value>)",
        },
        accent: {
          soft: "rgb(var(--accent-soft) / <alpha-value>)",
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          strong: "rgb(var(--accent-strong) / <alpha-value>)",
          ink: "rgb(var(--accent-ink) / <alpha-value>)",
        },
        danger: {
          soft: "rgb(var(--danger-soft) / <alpha-value>)",
          DEFAULT: "rgb(var(--danger) / <alpha-value>)",
          strong: "rgb(var(--danger-strong) / <alpha-value>)",
          ink: "rgb(var(--danger-ink) / <alpha-value>)",
        },
        neutral: {
          950: "rgb(var(--color-neutral-950) / <alpha-value>)",
          900: "rgb(var(--color-neutral-900) / <alpha-value>)",
          800: "rgb(var(--color-neutral-800) / <alpha-value>)",
          700: "rgb(var(--color-neutral-700) / <alpha-value>)",
          600: "rgb(var(--color-neutral-600) / <alpha-value>)",
          500: "rgb(var(--color-neutral-500) / <alpha-value>)",
          400: "rgb(var(--color-neutral-400) / <alpha-value>)",
          300: "rgb(var(--color-neutral-300) / <alpha-value>)",
          200: "rgb(var(--color-neutral-200) / <alpha-value>)",
        },
      },
      fontFamily: {
        belanosima: ["Belanosima", "sans-serif"],
        instrumentsans: ["Instrument Sans", "sans-serif"],
        josefinsans: ["Josefin Sans", "sans-serif"],
        notokhmer: ["Noto Sans Khmer", "sans-serif"],
        comfortaa: ["Comfortaa", "sans-serif"],
      },
    },
  },
  plugins: [],
};
