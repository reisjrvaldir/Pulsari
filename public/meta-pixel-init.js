/**
 * Bootstrap do Meta Pixel (Facebook/Instagram Ads).
 *
 * Vive num arquivo próprio, e não inline no index.html, pelo mesmo motivo do
 * analytics-init.js: a CSP define script-src 'self' sem 'unsafe-inline', e um
 * script inline seria bloqueado.
 *
 * ⚠️ PIXEL_ID é um placeholder. Troque pelo ID real (Meta Business Suite →
 * Gerenciador de Eventos) quando o pixel existir. Enquanto for placeholder,
 * o fbq carrega mas não envia dados a lugar nenhum.
 */
var PIXEL_ID = 'SEU_PIXEL_ID'

!(function (f, b, e, v, n, t, s) {
  if (f.fbq) return
  n = f.fbq = function () {
    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
  }
  if (!f._fbq) f._fbq = n
  n.push = n
  n.loaded = true
  n.version = '2.0'
  n.queue = []
  t = b.createElement(e)
  t.async = true
  t.src = v
  s = b.getElementsByTagName(e)[0]
  s.parentNode.insertBefore(t, s)
})(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')

window.fbq('init', PIXEL_ID)
window.fbq('track', 'PageView')
