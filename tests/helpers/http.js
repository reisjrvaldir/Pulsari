/** req/res mínimos no formato que a Vercel entrega ao handler. */
export function mockReq({ method = 'GET', body = null, headers = {}, cookie } = {}) {
  const h = { ...headers }
  if (cookie) h.cookie = cookie
  return { method, body, headers: h, socket: { remoteAddress: '203.0.113.7' } }
}

export function mockRes() {
  return {
    statusCode: null,
    headers: {},
    body: undefined,
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; return this },
    status(code) { this.statusCode = code; return this },
    json(payload) { this.body = payload; return this },
    end() { return this },
  }
}

/** Extrai o valor do cookie de sessão a partir do Set-Cookie da resposta. */
export function cookieFrom(res, name = 'pulsari_session') {
  const raw = res.headers['set-cookie']
  if (!raw) return null
  const first = Array.isArray(raw) ? raw[0] : raw
  const m = first.match(new RegExp(`${name}=([^;]*)`))
  return m ? m[1] : null
}
