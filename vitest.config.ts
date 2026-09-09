import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    // Node por padrão (rotas de API). Testes de componente declaram
    // `@vitest-environment jsdom` no topo do arquivo.
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx,js}'],
    coverage: {
      provider: 'v8',
      include: ['api/**/*.js', 'src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', '**/*.d.ts'],
    },
  },
})
