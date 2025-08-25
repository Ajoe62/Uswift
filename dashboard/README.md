Dashboard visual update

This dashboard landing page and styles were created to match the Uswift Chrome extension palette (gradient: #1cb5e0 -> #000851, accent #6d28d9).

Files added:

- public/index.html (landing page)
- public/styles.css (palette + layout)

Next steps (manual):

1. Copy the extension icons into dashboard public folder so the page shows icons:
   cp ../extension/dist/icon128.png public/icons/
   cp ../extension/dist/icon48.png public/icons/
   cp ../extension/dist/icon16.png public/icons/

   # add a hero illustration to public/icons/hero-illustration.png if desired

2. Run your dashboard dev server (depending on framework):
   npm install
   npm run dev

3. Adjust content in `public/index.html` and `public/styles.css` as needed.
