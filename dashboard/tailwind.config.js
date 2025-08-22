module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        uswiftBlue: '#1cb5e0',
        uswiftNavy: '#000851',
        uswiftPurple: '#6d28d9',
      },
      backgroundImage: {
        'uswift-gradient': 'linear-gradient(90deg, #1cb5e0 0%, #000851 100%)',
      },
    },
  },
  plugins: [],
};
