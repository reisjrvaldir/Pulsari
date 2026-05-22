import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
const isAuth = (req) => req.headers['x-admin-token'] === process.env.ADMIN_TOKEN

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token')
  if (req.method === 'OPTIONS') return res.status(200).end()

  /* ── GET — público ── */
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('portfolio_categories')
      .select('*')
      .order('order_index', { ascending: true })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data || [])
  }

  if (!isAuth(req)) return res.status(401).json({ error: 'Não autorizado' })

  /* ── POST — criar categoria ── */
  if (req.method === 'POST') {
    const { label, color } = req.body
    if (!label) return res.status(400).json({ error: 'label é obrigatório' })

    /* Gera key a partir do label (slug) */
    const key = label
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')

    /* Pega maior order_index atual */
    const { data: last } = await supabase
      .from('portfolio_categories')
      .select('order_index')
      .order('order_index', { ascending: false })
      .limit(1)
    const nextOrder = (last?.[0]?.order_index ?? -1) + 1

    const { data, error } = await supabase
      .from('portfolio_categories')
      .insert([{ key, label, color: color || '#5A2EA6', order_index: nextOrder }])
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  /* ── PUT — renomear / recolorir categoria ── */
  if (req.method === 'PUT') {
    const { id, label, color } = req.body
    if (!id) return res.status(400).json({ error: 'id é obrigatório' })

    const updates = {}
    if (label) updates.label = label
    if (color) updates.color = color

    const { data, error } = await supabase
      .from('portfolio_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  /* ── DELETE — remover categoria ── */
  if (req.method === 'DELETE') {
    const { id } = req.body
    if (!id) return res.status(400).json({ error: 'id é obrigatório' })

    /* Busca a key da categoria */
    const { data: cat } = await supabase
      .from('portfolio_categories')
      .select('key')
      .eq('id', id)
      .single()

    if (!cat) return res.status(404).json({ error: 'Categoria não encontrada' })

    /* Bloqueia exclusão se houver projetos vinculados */
    const { count } = await supabase
      .from('portfolio_projects')
      .select('id', { count: 'exact', head: true })
      .eq('category', cat.key)

    if (count > 0) {
      return res.status(409).json({
        error: `Esta categoria tem ${count} projeto(s). Remova-os antes de excluir a categoria.`
      })
    }

    const { error } = await supabase.from('portfolio_categories').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Método não permitido' })
}
