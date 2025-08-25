# Error & Fix Log

This file documents the concrete fixes applied to resolve issues encountered during development: Tailwind/PostCSS plugin errors, missing styles/icons, runtime "[object Event]" errors caused by throwing non-Error values, and dev script / config issues.

## Summary of problems

- PostCSS/Tailwind plugin shape errors (Next.js complained about plugin shape / direct tailwind usage as PostCSS plugin).
- Tailwind utilities not compiling / styles not applied.
- Icons/logo appearing in unexpected places and a centered homepage logo that needed removal.
- Runtime browser error showing `"[object Event]"` due to code throwing non-Error values (e.g., `throw error` where `error` could be an Event or other non-Error`).
- Dev script compatibility on Windows and package issues (invalid package name, NODE_OPTIONS usage on Windows).

## Fixes applied (high level)

1. Tailwind / PostCSS

   - Fixed plugin shape issues by updating the PostCSS/Tailwind wiring and ensuring the Tailwind token is defined in `tailwind.config.js`.
   - Introduced a single accent token `uswift-accent` and replaced scattered `uswift-purple` uses with that token for consistent CTA styling.
   - Files edited: `tailwind.config.js`, `styles/theme.css`, various components that used `uswift-purple`.

2. CTA / Buttons / UI

   - Centralized CTA color in `tailwind.config.js` as `uswift-accent` (now set to `#14b8a6` — Vibrant Cyan-Teal) and updated `styles/theme.css` variable.
   - Updated shared `Button` component and CTA anchors to use `bg-uswift-accent`.
   - Replaced the navbar `Sign In` link with a `Get Started` CTA linking to `/auth/signup`.
   - Files edited: `components/ui/Button.tsx`, `components/LandingHero.tsx`, `components/ui/Navbar.tsx`, `app/page.tsx`, `components/DashboardStats.tsx`, `components/PricingTable.tsx`.

3. Icons & homepage layout

   - Removed the centered big logo from the homepage to avoid duplication and visual clutter.
   - Ensured fallback for the navbar icon (uses `/icons/icon128.png` with a fallback to `/icon128.png`).
   - Files edited: `app/page.tsx`, `components/ui/Navbar.tsx`.

4. Runtime error normalization

   - Added a defensive `throwNormalized(err)` pattern to ensure code throws an `Error` instance rather than arbitrary values (which showed in the browser as `[object Event]`).
   - Applied changes to extension source files where raw `throw error` was present in response/error checks.
   - Files edited: `extension/src/ProfileVault.tsx`, `extension/src/JobTracker.tsx` (added helper and replaced raw throws).
   - Note: compiled bundles in `extension/dist/*` may still contain older `throw error` occurrences. Rebuilding the extension is required to reflect source fixes in runtime code.

5. Dev scripts, Next.js config, and package fixes
   - Added/updated scripts in `package.json` (e.g., `build`, `dev:fast`) and made them Windows-friendly (use `cross-env` for env vars where needed).
   - Fixed invalid package name `@types.node` → `@types/node` to avoid npm install errors.
   - Simplified/refactored `next.config.js` to use supported top-level keys and turbopack rules (remove deprecated experimental keys).
   - Created `.watchmanconfig` to ignore large folders for watch performance.
   - Files edited: `package.json` (dashboard), `next.config.js`, `.watchmanconfig`.

## Files changed (not exhaustive; key edits)

- `tailwind.config.js` — add `uswift-accent` color token and content globs.
- `styles/theme.css` — update CSS variable `--uswift-accent`.
- `components/ui/Button.tsx` — use `bg-uswift-accent`.
- `components/LandingHero.tsx` — CTA uses `bg-uswift-accent`.
- `components/ui/Navbar.tsx` — replaced Sign In with Get Started CTA; icon fallback behavior.
- `app/page.tsx` — removed centered icon; pricing CTA uses accent.
- `app/auth/*.tsx` — message and link colors updated to use accent.
- `components/DashboardStats.tsx`, `components/PricingTable.tsx` — updated purple backgrounds/borders to accent.
- `extension/src/ProfileVault.tsx`, `extension/src/JobTracker.tsx` — added throw normalization helper usage.
- `tailwind.config.js`, `postcss.config.js` — PostCSS/Tailwind wiring (iterative changes during debugging).
- `next.config.js`, `package.json` (dashboard) — config & scripts changes.

## Verification steps (how to confirm fixes locally)

1. Rebuild / restart dev server so Tailwind picks up config changes:

```powershell
# from C:\Users\DELL\Uswift\dashboard
npm install
npm run dev
```

2. Confirm UI changes in browser:

   - Landing page CTA (center) should use the cyan-teal color `#14b8a6`.
   - Navbar should show a small icon (left) and a `Get Started` CTA on the right.
   - Pricing CTA should use the same accent.

3. Rebuild the extension (so `extension/dist/*` is regenerated from `extension/src/*`) and load it in Chrome to ensure normalized throws are present in runtime bundles.

## Next steps / remaining tasks

- Rebuild the extension bundle so compiled files in `extension/dist/` reflect the `throwNormalized` changes.
- Run a full browser repro to confirm the previous `"[object Event]"` runtime error no longer appears; collect console stack trace if it does.
- Optionally: extract color tokens into a single `tokens.css` and reference from Tailwind and component CSS for stricter design-system parity.

## Notes / caveats

- If a dev server was running during the config edits, Tailwind may cache an older config — restart dev server after edits.
- Some changes were iterative and responded to errors produced by the toolchain (Next.js + PostCSS/Tailwind). If you hit a PostCSS plugin-shape error again, paste the exact build error and I will refine `postcss.config.js` accordingly.

---

If you'd like, I can now:

- Rebuild and start the dashboard dev server and show the live verification output.
- Rebuild the extension bundle and paste any build output/errors here.

Choose one and I'll proceed.
