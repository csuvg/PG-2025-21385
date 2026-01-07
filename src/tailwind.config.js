/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-gold': '#D4AF37',
        'brand-dark': '#1A1A1A',
        'brand-light': '#F9F9F9',
        "brand-beige": "#FCF7F2",
      },
      fontFamily: {
        inter: ['"Inter"', "sans-serif"],
        outfit: ['"Outfit"', "sans-serif"],
        "tilt-warp": ['"Tilt Warp"', "cursive"],
      },
    }
  },
  plugins: [],
}
