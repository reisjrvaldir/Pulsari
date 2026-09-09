import { readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * Espelha em dev e em preview os mesmos headers que a Vercel aplica em
 * produção, lidos do próprio vercel.json — fonte única, sem cópia manual
 * para sair de sincronia.
 *
 * Existe por um motivo concreto: a CSP só valia em produção, então uma
 * política que quebrasse o site (framer-motion injeta estilo inline em toda
 * seção) só apareceria depois do deploy. Agora quebra aqui primeiro.
 */
function headersDaVercel(): Record<string, string> {
  try {
    const config = JSON.parse(readFileSync('./vercel.json', 'utf8')) as {
      headers?: { source: string; headers: { key: string; value: string }[] }[]
    }
    const globais = config.headers?.find((h) => h.source === '/(.*)')
    if (!globais) return {}

    return Object.fromEntries(
      globais.headers
        // HSTS em localhost forçaria https e deixaria o dev inacessível.
        .filter((h) => h.key !== 'Strict-Transport-Security')
        .map((h) => [h.key, h.value]),
    )
  } catch {
    return {}
  }
}

const headers = headersDaVercel()

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { headers },
  preview: { headers },
})
