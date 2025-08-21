# Error-fix notes

## Purpose

Step-by-step record of the fixes applied during the build & Chrome load problems (popup.html / popup.js resolution, missing `manifest.json` in `dist`, and icon-loading errors). Use this as a checklist or copy into your project docs.

---

## Checklist (what was required)

- [ ] Diagnose unresolved module errors from Vite/Rollup
- [ ] Ensure `src/popup.html` references bundle entry in a way Vite can resolve
- [ ] Ensure `dist` contains a valid `manifest.json` pointing at existing files
- [ ] Provide any runtime files referenced by the manifest (e.g., `config.js`)
- [ ] Resolve Chrome icon-loading failures (either add icons or remove icons from the manifest)

---

## 1) popup.html / popup.js resolution error

Symptom

- Build fails with: `Rollup failed to resolve import "/popup.js" from "src/popup.html"` or `Could not resolve "./popup.js" from "src/popup.html"`.

Root cause

- `src/popup.html` referenced an absolute path (`/popup.js` or `/popup.css`) or a non-built entry that Rollup could not resolve at build time.

Fix applied

- Edit `src/popup.html` so Vite can bundle the app and produce predictable output. The working approach used here:
  - In `src/popup.html`, reference the Vite entry relative to the HTML used during bundling (example used earlier):
    - `<script type="module" crossorigin src="./main.tsx"></script>` (this lets Vite follow TS/TSX imports starting at your app entry)
    - `<link rel="stylesheet" href="./index.css" />`
- Ensure the Vite config's `build.rollupOptions.input` contains `src/popup.html` as an entry (so Vite treats that HTML as an entry page).

Verification

- Run `npm run build` and confirm Vite produces `dist/popup.js`, `dist/popup.css`, and `dist/popup.html` without unresolved import warnings.

Commands used (example)

```bash
# remove old build artifacts, reinstall if needed
rm -rf dist && npm install
npm run build
```

---

## 2) `manifest.json` not found in `dist`

Symptom

- Chrome: "Manifest file is missing or unreadable" when loading the unpacked extension from `dist`.

Root cause

- Build output (`dist`) did not include a manifest or the manifest was not copied into `dist`.

Fix applied

- Created a valid `dist/manifest.json` that points to the built runtime files. Key points:
  - `action.default_popup` -> `popup.html` (exists in `dist`)
  - `background.service_worker` -> `background.js`
  - `content_scripts` -> `content.js`
  - `web_accessible_resources` includes `config.js` (if used at runtime)
- Copied `src/config.js` to `dist/config.js` so runtime code expecting that file can access it.

Files changed/created

- `c:\Users\DELL\Uswift\extension\dist\manifest.json` (added)
- `c:\Users\DELL\Uswift\extension\dist\config.js` (copied from `src/config.js`)

Verification

- Confirm `dist/manifest.json` is valid JSON and references existing files in `dist`.
- Load the unpacked extension from `dist` in Chrome.

---

## 3) Icon load errors (missing icon files)

Symptom

- Chrome error: `Could not load icon 'icon16.png' specified in 'icons'. Could not load manifest.`

Root cause

- `manifest.json` declared icons but the actual icon files were not present in `dist`.

Fix options (choose one)

1. Add icon files to `dist` (preferred if you have icons): `icon16.png`, `icon48.png`, `icon128.png`.
2. Remove the `icons` block from `dist/manifest.json` so Chrome does not fail on missing icons (used as a quick workaround in this session).

Fix applied in repo

- Removed the `icons` block from `dist/manifest.json` to allow Chrome to load the extension immediately.

Follow-up

- Add real icons into `dist` and re-add the `icons` block, or keep the block removed during development.

---

## Final verification steps (recommended)

1. Clean and rebuild:

```bash
rm -rf dist
npm install
npm run build
```

2. Inspect `dist` — ensure these files are present: `manifest.json`, `popup.html`, `popup.js`, `popup.css`, `background.js`, `content.js`, `config.js` (if required).
3. Load unpacked extension in Chrome from `c:\Users\DELL\Uswift\extension\dist`.
4. If Chrome reports missing icons, either provide icon files or edit `manifest.json` accordingly.

---

## Notes / rationale

- For extension builds with Vite, prefer making `src/popup.html` the HTML entry and referencing your application entry module (e.g., `main.tsx`) relatively; Vite will bundle to `dist/popup.js`.
- Chrome expects the final `manifest.json` and referenced runtime files inside the folder you point at when loading an unpacked extension.
- During development it's acceptable to remove icon declarations to avoid load failures; re-add icons for published builds.

If you want, I can now:

- Add placeholder icons into `dist` and re-add the `icons` block, or
- Run a fresh build and validate the output automatically.
