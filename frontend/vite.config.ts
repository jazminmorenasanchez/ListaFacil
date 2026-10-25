import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: { sourcemap: true },
  test: {
    exclude: [...configDefaults.exclude, 'e2e/**'],
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      reporter: ['text', 'html', 'json-summary'],
      reportOnFailure: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/types/index.ts', 'src/main.tsx'],
      thresholds: {
        lines: 48,
        branches: 35,
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
      },
    },
  },
})
