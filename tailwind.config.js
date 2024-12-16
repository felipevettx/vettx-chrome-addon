/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        dmSans: ["dm sans", "sans-serif"],
        hkg: ["hkGrotesk wide", "sans-serif"],
      },
    },
  },
  plugins: [],
};
