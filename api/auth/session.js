import { guardMethod, json, requireAuth, withErrorHandling } from '../_lib/http.js'

async function handler(req, res) {
  if (!guardMethod(req, res, ['GET'])) return

  const user = await requireAuth(req, res)
  if (!user) return

  return json(res, 200, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
    },
  })
}

export default withErrorHandling(handler)
