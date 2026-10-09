import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reportOnFailure: true,
      include: ['src/**/*.ts'],
      exclude: [
        'src/generated/**',
        'src/routes/**/*.routes.ts',
        'src/types/**/*.d.ts',
        'src/data/default-catalog.ts',
      ],
      reporter: ['text', 'html', 'json', 'json-summary'],
      thresholds: {
        lines: 13,
        branches: 13,
      },
    },
  },
})
