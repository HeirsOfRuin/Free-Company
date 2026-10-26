import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// base './' so the build works from any path: Pages (/<repo>/), itch's frame, a zip.
// The build id is NOT set here: tools/stamp.mjs writes it over __BUILD_ID__ in
// dist/ after the build (sw.js and the bundled sw-register), and fails if it
// did not land. One mechanism for every shape.
export default defineConfig({
  base: './',
  plugins: [preact()],
  test: { include: ['tests/**/*.test.ts'] },
} as never);
