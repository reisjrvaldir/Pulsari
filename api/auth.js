export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const { email, pass } = req.body || {}

  const okEmail = process.env.ADMIN_EMAIL
  const okPass  = process.env.ADMIN_PASS

  if (!okEmail || !okPass) {
    return res.status(500).json({ error: 'Credenciais não configuradas no servidor.' })
  }

  if (email?.trim() === okEmail && pass === okPass) {
    return res.json({ ok: true })
  }

  return res.status(401).json({ ok: false, error: 'E-mail ou senha incorretos.' })
}
