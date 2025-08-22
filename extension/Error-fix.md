# Error-fix notes

## Purpose

Step-by-step record of the fixes applied during the build & Chrome load problems (popup.html / popup.js resolution, missing `manifest.json` in `dist`, and icon-loading errors). Use this as a checklist or copy into your project docs.

---

## E) "Supabase not initialized" — reliable, long-term fixes

Symptom

- Runtime error: "Supabase not initialized" (or code that expects `window.supabase` / `supabaseClient` to be present fails intermittently on popup open or background messages).

Why this happens (common causes)

- CSP / extension packaging: remote `<script>` tags are blocked by extension CSP, so a runtime client may never be loaded.
- Race conditions: popup HTML opens and React mounts before the bundled Supabase client code runs or before `window.SUPABASE_CONFIG` is available.
- Multiple entry points: background script and popup each initialize their own client inconsistently, or one expects a client on `window` that only exists in the popup context.
- Missing/incorrect environment values: incorrect `SUPABASE_URL` / `SUPABASE_KEY` or not exposed to the build/runtime.

Battle-tested permanent fixes (recommended order)

1. Bundle a single, environment-safe Supabase client and export a singleton

- Create `src/supabaseClient.ts` (or `.js`) that reads config from a single source and exports a singleton client:
  - Use safe runtime config: prefer `public/` or build-time env variables injected during build (Vite `import.meta.env.VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`) or a small `config.js` in `public/` copied to `dist`.
  - Example contract: export default function getSupabase(){ return singleton; }
- Import this client from every runtime entry (`background.ts`, `content.ts`, `main.tsx`) rather than creating ad-hoc clients in multiple files.

2. Avoid attaching the client to `window` as the primary source of truth

- Attaching `window.supabase` can work but leads to race conditions across extension contexts. Prefer importing the singleton module where needed.
- If you must expose it on `window` for legacy code, ensure the singleton is created synchronously at module import time.

3. Make config presence explicit and fail-fast during startup

- Validate `SUPABASE_URL` and `SUPABASE_KEY` at module initialization; throw a descriptive error during build/start if missing.
- Add a small runtime check in the popup and background that logs a clear error and prevents UI blocking if config is absent.

4. Initialize background/auth centrally when the extension starts

- Initialize auth and refresh logic in the background service worker. Persist session tokens in `chrome.storage` (or `browser.storage`) and rehydrate in popup on open.
- This keeps the popup fast (it reads session state) and avoids re-initializing the client on every popup open.

5. Use CSP-safe bundling (no external script tags)

- Bundle the Supabase client with Vite (do not use remote unpkg CDN script tags). Import the local client in `main.tsx` and `background.ts` so the client is included in the produced JS files.

6. Add quick runtime self-test and telemetry

- On app startup run a lightweight check: `if (!supabase) console.error('Supabase missing: check config / build');` and show a small UI state to users.

7. Add CI/build checks

- Add an npm script (or CI job) to verify that `dist` includes a `config.js` or that `dist/popup.js` includes the Supabase client bundle (grep for `createClient` or your client signature) so missing-bundle regressions are caught early.

Checklist to implement (minimal)

- [ ] Create `src/supabaseClient.ts` exporting a singleton getClient()
- [ ] Replace ad-hoc `createClient(...)` calls in `main.tsx`, `background.ts`, `content.ts` with the singleton import
- [ ] Move runtime config into `public/config.js` or use `import.meta.env.VITE_*` and validate at startup
- [ ] Initialize auth in background and persist sessions to `chrome.storage`.
- [ ] Add a CI check that verifies `dist` contains Supabase client text after build (simple grep in CI)

Why this works (short)

- Single source of truth (singleton) removes race conditions and duplication.
- Background-first auth keeps the popup lightweight and avoids missing session state.
- Bundling removes CSP problems and ensures the code is present in `dist`.

If you want, I can now:

- Implement `src/supabaseClient.ts` and wire it into `src/main.tsx` and `src/background.ts` for you, then run a build and verify `dist/popup.js` contains the client.
- Add a small npm/CI script that validates `dist` after build.

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

---

## Recent fixes (last 3)

Below are the three most recent error series we resolved with concise step-by-step actions so you can reproduce or audit the changes.

### A) CSP block for external Supabase script

Symptom

- Browser console: Refused to load the script 'https://unpkg.com/@supabase/supabase-js@2' because it violates Content Security Policy `script-src 'self'`.

Root cause

- `src/popup.html` included an external `<script src="https://unpkg.com/@supabase/...">` which Chrome extension CSP blocks.

Steps taken (exact)

1. Removed the external script tag from `src/popup.html`.
2. Created/verified a local `src/supabase.js` that implements the minimal Supabase client behavior used by the extension and attaches `window.supabase`.
3. Imported `./supabase` from `src/main.tsx` so Vite bundles it into `popup.js` (no external network script required).
4. Updated `dist/popup.html` to remove the unpkg line (regenerated or patched) so runtime uses the bundled client.

Verification

- `npm run build` produced `dist/popup.js` containing the bundled client and Chrome no longer blocked scripts for CSP reasons.

### B) `manifest.json` deleted from `dist` after build

Symptom

- Each build removed `dist/manifest.json` and Chrome complained `Manifest file is missing` when loading the unpacked extension.

Root cause

- Vite config used `emptyOutDir: true` and `publicDir: false`, so `dist` was cleaned before build and non-copied static files were wiped.

Steps taken (exact)

1. Moved `manifest.json` into `extension/public/manifest.json` (Vite's public folder) so it is copied into `dist` automatically during build.
2. Re-enabled `publicDir` in `vite.config.ts` (set `publicDir: 'public'`) so Vite will copy `public/` into `dist` after building.
3. Updated `public/manifest.json` to point `action.default_popup` to `popup.html` (the file produced by the build).
4. Optionally created `dist/config.js` from `src/config.js` when needed during debugging; long-term the `public/manifest.json` approach removes the need to manually copy to `dist`.

Verification

- After `npm run build`, `dist/manifest.json` exists and remains after subsequent builds.

### C) default_popup file missing / mismatch (popup.html vs index.html)

Symptom

- Chrome: "The default_popup file in the manifest doesn't exist" because the manifest pointed to `popup.html` but `dist` contained `index.html` (or vice versa).

Root cause

- Build outputs and manifest entry became out of sync: the manifest referenced a file name not present in `public/` or the built output.

Steps taken (exact)

1. Decided canonical source of the popup HTML: keep `src/popup.html` as the Vite HTML entry and copy a stable copy into `public/popup.html` so it lands in `dist/`.
2. Ensured `public/manifest.json` `action.default_popup` value matches the actual filename produced in `dist` (`popup.html`).
3. If needed as a temporary measure, updated `dist/manifest.json` to point to `index.html` to unblock testing — but the long-term fix is to keep `popup.html` in `public/`.

Verification

- After copying `src/popup.html` to `extension/public/popup.html` and rebuilding, `dist/popup.html` existed and Chrome loaded the popup successfully.

---

## D) Quick fix applied: popup not rendering when clicking extension

Symptom

- Clicking the extension icon opened a blank popup (or no UI) because the popup HTML in `dist` loaded the wrong module.

Root cause

- `dist/popup.html` referenced the source entry (`./main.tsx`) instead of the built bundle (`./popup.js`). Chrome's extension environment loads files from `dist` and cannot resolve project source modules.

Fix applied (concise)

- Edited `dist/popup.html` to load the built bundle and CSS:
  - `<script type="module" src="./popup.js"></script>`
  - `<link rel="stylesheet" href="./popup.css" />`

Permanent prevention (do this once)

- Keep a canonical `extension/public/popup.html` that references the built bundle (or use the Vite HTML entry `src/popup.html` with a relative `<script src="./main.tsx">` during development). Ensure `vite.config.ts` has `publicDir: 'public'` so `public/popup.html` is copied to `dist` on build.
- Add a build check in CI or an npm script that verifies `dist/popup.html` contains `./popup.js` and `./popup.css` before publishing.
- Optionally remove direct references to source files from files that will be packaged into `dist` to avoid accidental absolute or source imports in the built HTML.

Verification

- Rebuilt (or patched) `dist/popup.html`; reloaded unpacked extension from `extension/dist`; popup renders when clicking the extension icon.

---

## F) "Supabase not initialized" — Complete Implementation Fix (August 2025)

### Symptoms Observed

- Error in popup console: "Supabase configuration missing: set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY or window.SUPABASE_CONFIG"
- Auth forms showing "Supabase not initialized" when trying to sign up/sign in
- `window.supabase` undefined in popup context despite config being present

### Root Cause Analysis

1. **Client Reference Mismatch**: `useAuth` hook was looking for `window.supabase` but our singleton exposed `window.supabaseClient`
2. **Missing Runtime Config Loading**: `dist/popup.html` didn't load `config.js` before the popup bundle, so `window.SUPABASE_CONFIG` was undefined during client initialization
3. **Incomplete Client API**: The `SupabaseClient` class was missing `signUp()` and `getUser()` methods needed by the auth hook
4. **Build Configuration Issue**: Vite wasn't properly copying `public/config.js` to `dist/` or including config script in the built HTML

### Implementation Steps Applied

#### Step 1: Fixed Runtime Config Loading

```bash
# Ensured public/config.js exists with runtime configuration
cat > public/config.js <<'EOF'
window.SUPABASE_CONFIG = {
  url: "https://sigoorxtktxtbcneodux.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIs..."
};
EOF

# Created public/popup.html that loads config.js before the bundle
cat > public/popup.html <<'EOF'
<script src="./config.js"></script>
<script type="module" crossorigin src="./popup.js"></script>
<link rel="stylesheet" href="./popup.css" />
EOF
```

#### Step 2: Enhanced SupabaseClient Class

- Added `signUp(email, password, options)` method using `/auth/v1/signup` endpoint
- Added `getUser()` method using `/auth/v1/user` endpoint with stored auth token
- Improved session loading/saving with `chrome.storage` fallback to `localStorage`

#### Step 3: Updated Authentication Hook (`src/hooks/useAuth.ts`)

- Changed from `window.supabase` to `getSupabaseClient()` singleton import
- Fixed `signUp()` to call client's `signUp()` method instead of `signIn()`
- Improved error handling with proper user object construction
- Reduced initialization timeout from 500ms to 300ms for better responsiveness

#### Step 4: Updated Component References

- Changed `Popup.tsx` to import and use `getSupabaseClient()` instead of global `supabase`
- Updated `loadProfileFromSupabase()` to use client's `makeRequest()` method
- Ensured all Supabase calls go through the singleton client

### Verification Commands

```bash
# Verify config.js loads before popup bundle
grep -n "config.js" dist/popup.html

# Test runtime config in popup console
typeof window.SUPABASE_CONFIG === 'object' && window.SUPABASE_CONFIG.url

# Verify client initialization
getSupabaseClient() !== null
```

### Files Modified

- `src/supabaseClient.ts` - Added signUp() and getUser() methods
- `src/hooks/useAuth.ts` - Fixed client references and method calls
- `src/Popup.tsx` - Updated to use singleton client
- `public/config.js` - Runtime configuration (preserved across builds)
- `public/popup.html` - Ensures config loads before bundle

### Result

- ✅ Auth forms now successfully connect to Supabase
- ✅ No more "Supabase not initialized" errors
- ✅ Runtime config consistently available before client initialization
- ✅ Both signup and signin flows working properly
- ✅ Session persistence working across popup opens

### Prevention for Future Builds

1. Always rebuild after auth changes: `npm run build`
2. Verify config loading order in `dist/popup.html`
3. Keep runtime config in `public/` directory (source-controlled)
4. Test auth flows in actual Chrome extension context, not just dev server

---
