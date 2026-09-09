/**
 * Bootstrap do Google Analytics 4.
 *
 * Vive num arquivo próprio, e não inline no index.html, porque a CSP define
 * script-src 'self' sem 'unsafe-inline'. Um script inline seria bloqueado —
 * e a alternativa (liberar 'unsafe-inline') abriria a porta justamente para
 * o tipo de injeção que a política existe para barrar.
 *
 * ⚠️ MEASUREMENT_ID é um placeholder. Troque por um ID real (analytics.google.com
 * → Admin → Fluxos de dados) e o mesmo valor precisa ser trocado na tag
 * <script src="https://www.googletagmanager.com/gtag/js?id=..."> do index.html.
 * Enquanto for placeholder, o gtag carrega mas não envia dados a lugar nenhum.
 */
var MEASUREMENT_ID = 'G-XXXXXXXXXX'

window.dataLayer = window.dataLayer || []
function gtag() {
  window.dataLayer.push(arguments)
}
window.gtag = gtag

gtag('js', new Date())
gtag('config', MEASUREMENT_ID)
