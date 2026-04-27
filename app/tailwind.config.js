/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff0ee',
          100: '#ffe3df',
          200: '#ffc6be',
          300: '#ffa69c',
          400: '#ff887b',
          500: '#FA8072',
          600: '#e06b5e',
          700: '#bd5348',
          800: '#9c433b',
          900: '#823c35',
        },
      },
    },
  },
  plugins: [],
}
