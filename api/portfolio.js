import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const ADMIN_TOKEN = process.env.ADMIN_TOKEN
const isAuth = (req) => req.headers['x-admin-token'] === ADMIN_TOKEN

/* Converte linha do DB → objeto do frontend */
function toFront(row) {
  if (!row) return null
  return {
    id:          row.id,
    category:    row.category,
    nome:        row.nome,
    desc:        row.descricao,
    context:     row.context,
    tags:        row.tags || [],
    imagem:      row.imagem || null,
    link:        row.link || null,
    linkSistema: row.link_sistema || null,
    order_index: row.order_index,
    created_at:  row.created_at,
  }
}

/* Converte objeto do frontend → linha do DB */
function toDB(p) {
  return {
    category:     p.category,
    nome:         p.nome,
    descricao:    p.desc || p.descricao || null,
    context:      p.context || null,
    tags:         Array.isArray(p.tags) ? p.tags : [],
    imagem:       p.imagem || null,
    link:         p.link || null,
    link_sistema: p.linkSistema || p.link_sistema || null,
  }
}

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
      .order('created_at',  { ascending: true })

    if (error) return res.status(500).json({ error: error.message })

    const grouped = { sites: [], landing: [], ecommerce: [], sistemas: [] }
    for (const row of data || []) {
      const p = toFront(row)
      if (grouped[p.category]) grouped[p.category].push(p)
    }
    return res.status(200).json(grouped)
  }

  /* ── POST — criar ── */
  if (req.method === 'POST') {
    if (!isAuth(req)) return res.status(401).json({ error: 'Não autorizado' })
    const { category, nome } = req.body
    if (!category || !nome) return res.status(400).json({ error: 'category e nome são obrigatórios' })

    const { data, error } = await supabase
      .from('portfolio_projects')
      .insert([toDB(req.body)])
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(toFront(data))
  }

  /* ── PUT — atualizar ── */
  if (req.method === 'PUT') {
    if (!isAuth(req)) return res.status(401).json({ error: 'Não autorizado' })
    const { id } = req.body
    if (!id) return res.status(400).json({ error: 'id é obrigatório' })

    const { data, error } = await supabase
      .from('portfolio_projects')
      .update(toDB(req.body))
      .eq('id', id)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(toFront(data))
  }

  /* ── DELETE — remover ── */
  if (req.method === 'DELETE') {
    if (!isAuth(req)) return res.status(401).json({ error: 'Não autorizado' })
    const { id } = req.body
    if (!id) return res.status(400).json({ error: 'id é obrigatório' })

    /* Remove imagem do Storage se for do Supabase */
    const { data: proj } = await supabase
      .from('portfolio_projects')
      .select('imagem')
      .eq('id', id)
      .single()

    if (proj?.imagem?.includes('portfolio-images')) {
      const path = proj.imagem.split('/portfolio-images/')[1]
      if (path) await supabase.storage.from('portfolio-images').remove([path])
    }

    const { error } = await supabase.from('portfolio_projects').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Método não permitido' })
}
