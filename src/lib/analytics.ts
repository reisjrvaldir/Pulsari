// Camada fina sobre o Google Analytics 4 (gtag.js) e o Meta Pixel (fbq).
// ⚠️ Os IDs de medição em /analytics-init.js e /meta-pixel-init.js são
// placeholders — substitua pelos IDs reais assim que as propriedades
// existirem. Até lá, as chamadas abaixo são no-op seguro (gtag/fbq não
// existem, então nada quebra).

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
  }
}

/** Registra um evento de conversão/interação no GA4 e no Meta Pixel, quando disponíveis. */
export function trackEvent(action: string, params?: Record<string, string | number | boolean>) {
  if (typeof window === 'undefined') return
  if (typeof window.gtag === 'function') window.gtag('event', action, params)
  if (typeof window.fbq === 'function') window.fbq('trackCustom', action, params)
}
