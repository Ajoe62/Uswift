/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
  uswiftBlue: '#1cb5e0',
  uswiftNavy: '#000851',
  uswiftPurple: '#6d28d9',
  "uswift-accent": '#14b8a6',
      },
      backgroundImage: {
        'uswift-gradient': 'linear-gradient(90deg, #1cb5e0 0%, #000851 100%)',
      },
    },
  },
  plugins: [],
};