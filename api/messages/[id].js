import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*')
  res.setHeader('Access-Control-Allow-Methods', 'PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // Todas as rotas aqui são protegidas
  const token = req.headers['x-admin-token']
  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Não autorizado' })
  }

  const { id } = req.query

  /* PATCH /api/messages/:id — marcar como lida */
  if (req.method === 'PATCH') {
    const { error } = await supabase
      .from('messages')
      .update(req.body)
      .eq('id', id)

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ ok: true })
  }

  /* DELETE /api/messages/:id — apagar */
  if (req.method === 'DELETE') {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id)

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ ok: true })
  }

  res.status(405).json({ error: 'Método não permitido' })
}
