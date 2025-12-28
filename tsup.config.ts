import { defineConfig } from 'tsup';

export default defineConfig([
  {
    // CLI entry with shebang
    entry: {
      cli: 'src/cli.ts',
    },
    format: ['esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    external: ['@boundaryml/baml'],
    platform: 'node',
    target: 'node24',
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
  {
    // Library entry without shebang
    entry: {
      index: 'src/index.ts',
    },
    format: ['esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: false,
    external: ['@boundaryml/baml'],
    platform: 'node',
    target: 'node24',
  },
]);

