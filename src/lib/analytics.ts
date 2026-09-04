// Camada fina sobre o Google Analytics 4 (gtag.js, carregado em index.html).
// ⚠️ O ID de medição em index.html é um placeholder (G-XXXXXXXXXX) — substitua
// pelo ID real da propriedade GA4 da Pulsari assim que ela existir. Até lá,
// as chamadas abaixo são no-op seguro (gtag não existe, então nada quebra).

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

/** Registra um evento de conversão/interação no GA4, se o gtag estiver carregado. */
export function trackEvent(action: string, params?: Record<string, string | number | boolean>) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('event', action, params)
}
