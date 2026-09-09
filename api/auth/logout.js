import { buildClearCookie, readSessionCookie, revokeSession } from '../_lib/session.js'
import { guardMethod, json, withErrorHandling } from '../_lib/http.js'

async function handler(req, res) {
  if (!guardMethod(req, res, ['POST'])) return

  const token = readSessionCookie(req)

  // Revoga no banco antes de limpar o cookie: se o usuário já tinha copiado o
  // token, ele deixa de valer de qualquer forma.
  if (token) {
    try {
      await revokeSession(token)
    } catch {
      // Falha ao revogar não deve impedir a limpeza do cookie do lado do cliente.
    }
  }

  res.setHeader('Set-Cookie', buildClearCookie())

  // Idempotente de propósito: deslogar sem sessão não é erro.
  return json(res, 200, { ok: true })
}

export default withErrorHandling(handler)
