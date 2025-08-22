// PostCSS configuration for Next.js
// Use CommonJS export so Next.js can read the `plugins` key.
module.exports = {
  // Next.js expects PostCSS plugin names as strings in the `plugins` object.
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};