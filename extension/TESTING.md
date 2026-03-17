# Testing Guide

This project uses `Vitest` + `@testing-library/react` for unit and component tests.

## 1. Run tests

```bash
npm run test
```

Watch mode:

```bash
npm run test:watch
```

Coverage report:

```bash
npm run test:coverage
```

## 2. Where tests live

Create tests next to the file they test:

- `src/components/FeaturePageShell.test.tsx`
- `src/components/AutoApplyPanel.test.tsx`
- `src/utils/errorHandler.test.ts`

## 3. Test patterns

### For pure utilities

- Import function
- Call with fixed inputs
- Assert exact output

### For React components

- Render component with `render(...)`
- Query by visible text/role
- Trigger events with `fireEvent` (or `userEvent`)
- Assert callback calls and UI state changes

## 4. Suggested next tests

1. `src/utils/errorHandling.ts`:
   - `withTimeout`
   - `retryWithBackoff` (with fake timers)
2. `src/hooks/useAuth.ts`:
   - initial loading behavior
   - authenticated vs unauthenticated states
3. `src/api/mistral.ts`:
   - `getMistralClientOrNull` behavior when API key is missing
4. `src/Popup.tsx`:
   - loading screen
   - lazy feature page navigation

## 5. CI recommendation

Add this check to your CI pipeline:

```bash
npm run type-check
npm run test
npm run build
```
