/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        dmSans: ["dm sans", "sans-serif"],
        hkg: ["HKGrotesk wide", "sans-serif"],
      },
    },
  },
  plugins: [],
};
