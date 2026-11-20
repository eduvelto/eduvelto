import { defineConfig } from 'vitest/config';

// Vitest config (moved here from vite.config.ts: the `test` key does not
// type-check under vite's defineConfig, and vitest/config's defineConfig
// clashes with the top-level vite plugins because vitest bundles its own
// nested copy of vite — a dedicated vitest.config.ts avoids both problems;
// vitest prefers it over vite.config.ts).
//
// Emulator tests: the Firestore emulator is slow when cold (each rules
// call can take ~1s), so the 5s vitest default times out the first
// tests. 30s is generous without hiding a genuinely stuck test.
export default defineConfig({
  test: {
    testTimeout: 30000,
  },
});
