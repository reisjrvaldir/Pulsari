import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const ADMIN_TOKEN = process.env.ADMIN_TOKEN
const isAuth = (req) => req.headers['x-admin-token'] === ADMIN_TOKEN

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token')
  if (req.method === 'OPTIONS') return res.status(200).end()

  /* ── GET — público ── */
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('portfolio_projects')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) return res.status(500).json({ error: error.message })

    /* Agrupa por categoria */
    const grouped = { sites: [], landing: [], ecommerce: [], sistemas: [] }
    for (const p of data || []) {
      if (grouped[p.category]) grouped[p.category].push(p)
    }
    return res.status(200).json(grouped)
  }

  /* ── POST — criar projeto (protegido) ── */
  if (req.method === 'POST') {
    if (!isAuth(req)) return res.status(401).json({ error: 'Não autorizado' })
    const { category, nome, desc, context, tags, imagem, link, linkSistema } = req.body
    if (!category || !nome) return res.status(400).json({ error: 'category e nome são obrigatórios' })

    const { data, error } = await supabase
      .from('portfolio_projects')
      .insert([{ category, nome, desc, context, tags: tags || [], imagem: imagem || null, link: link || null, linkSistema: linkSistema || null }])
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  /* ── PUT — atualizar projeto (protegido) ── */
  if (req.method === 'PUT') {
    if (!isAuth(req)) return res.status(401).json({ error: 'Não autorizado' })
    const { id, category, nome, desc, context, tags, imagem, link, linkSistema } = req.body
    if (!id) return res.status(400).json({ error: 'id é obrigatório' })

    const { data, error } = await supabase
      .from('portfolio_projects')
      .update({ category, nome, desc, context, tags: tags || [], imagem: imagem || null, link: link || null, linkSistema: linkSistema || null })
      .eq('id', id)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  /* ── DELETE — remover projeto (protegido) ── */
  if (req.method === 'DELETE') {
    if (!isAuth(req)) return res.status(401).json({ error: 'Não autorizado' })
    const { id } = req.body
    if (!id) return res.status(400).json({ error: 'id é obrigatório' })

    /* Remove imagem do Storage se existir */
    const { data: proj } = await supabase.from('portfolio_projects').select('imagem').eq('id', id).single()
    if (proj?.imagem?.includes('supabase')) {
      const path = proj.imagem.split('/portfolio-images/')[1]
      if (path) await supabase.storage.from('portfolio-images').remove([path])
    }

    const { error } = await supabase.from('portfolio_projects').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Método não permitido' })
}
