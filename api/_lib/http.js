import { getSessionUser, readSessionCookie } from './session.js'
import { can, needsProjectMembership } from './rbac.js'
import { getSql } from './db.js'

export function json(res, status, payload) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  return res.status(status).json(payload)
}

/**
 * Site e API vivem na mesma origem (pulsari.com.br), então não emitimos
 * Access-Control-Allow-Origin nenhum: requisição cross-origin simplesmente não
 * é atendida pelo navegador. É mais restrito que "CORS restrito" — é CORS
 * ausente, que é o correto para same-origin.
 */
export function guardMethod(req, res, allowed) {
  if (allowed.includes(req.method)) return true
  res.setHeader('Allow', allowed.join(', '))
  json(res, 405, { error: 'Método não permitido' })
  return false
}

/**
 * Envelope de erro para os handlers.
 *
 * Sem isto, uma falha do banco vira 500 com stack trace na resposta — que
 * entrega nomes de arquivo, versões e estrutura interna a quem chamou.
 * O detalhe vai para o log do servidor; o cliente recebe uma frase genérica.
 */
export function withErrorHandling(handler) {
  return async function wrapped(req, res) {
    try {
      return await handler(req, res)
    } catch (err) {
      console.error('[api] falha não tratada:', {
        path: req.url,
        method: req.method,
        message: err?.message,
        stack: err?.stack,
      })

      // A resposta pode já ter começado (ex.: erro após setHeader).
      if (res.statusCode && res.body !== undefined) return undefined

      return json(res, 500, { error: 'Erro interno. Tente novamente em instantes.' })
    }
  }
}

export function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for']
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim()
  if (Array.isArray(fwd) && fwd.length > 0) return String(fwd[0]).split(',')[0].trim()
  return req.socket?.remoteAddress ?? null
}

/** Vercel já entrega req.body parseado; o fallback cobre runtime local e testes. */
export async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body) } catch { return null }
  }
  return null
}

/**
 * Exige sessão válida. Responde 401 e devolve null quando não houver.
 * Uso: `const user = await requireAuth(req, res); if (!user) return`
 */
export async function requireAuth(req, res) {
  const token = readSessionCookie(req)
  const user = token ? await getSessionUser(token) : null
  if (!user) {
    json(res, 401, { error: 'Não autenticado' })
    return null
  }
  return user
}

/**
 * Exige permissão sobre um recurso. Papéis com escopo por vínculo (developer
 * em projects) são recusados aqui de propósito: essa rota precisa passar por
 * requireProjectMembership(), que sabe qual projeto está em jogo.
 */
export async function requireRole(req, res, resource, action = 'read') {
  const user = await requireAuth(req, res)
  if (!user) return null

  if (!can(user.role, resource, action)) {
    json(res, 403, { error: 'Sem permissão para esta operação' })
    return null
  }

  if (needsProjectMembership(user.role, resource)) {
    json(res, 403, { error: 'Acesso a este recurso exige vínculo com o projeto' })
    return null
  }

  return user
}

/**
 * Autoriza um usuário sobre um projeto específico.
 * Quem não é escopado por vínculo (admin, manager…) passa pelo `can()` normal.
 */
export async function requireProjectMembership(req, res, projectId, action = 'read') {
  const user = await requireAuth(req, res)
  if (!user) return null

  if (!can(user.role, 'projects', action)) {
    json(res, 403, { error: 'Sem permissão para esta operação' })
    return null
  }

  if (!needsProjectMembership(user.role, 'projects')) return user

  const sql = getSql()
  const rows = await sql`
    SELECT 1 FROM project_members
     WHERE project_id = ${projectId} AND user_id = ${user.id}
     LIMIT 1
  `
  if (rows.length === 0) {
    json(res, 403, { error: 'Você não está vinculado a este projeto' })
    return null
  }
  return user
}
