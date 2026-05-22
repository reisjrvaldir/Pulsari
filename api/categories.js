import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
const isAuth = (req) => req.headers['x-admin-token'] === process.env.ADMIN_TOKEN

/* Usa o bucket portfolio-images (já existe) para guardar config */
const BUCKET = 'portfolio-images'
const FILE   = 'config/categories.json'

const DEFAULT_CATS = [
  { id: '1', key: 'sites',     label: 'Sites',       color: '#5A2EA6', order_index: 0 },
  { id: '2', key: 'landing',   label: 'Landpages',   color: '#FF2D8D', order_index: 1 },
  { id: '3', key: 'ecommerce', label: 'E-commerce',  color: '#2D6BFF', order_index: 2 },
  { id: '4', key: 'sistemas',  label: 'Sistemas',    color: '#10b981', order_index: 3 },
]

async function readCats() {
  try {
    const { data, error } = await supabase.storage.from(BUCKET).download(FILE)
    if (error) return DEFAULT_CATS
    const text = await data.text()
    const parsed = JSON.parse(text)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CATS
  } catch { return DEFAULT_CATS }
}

async function writeCats(cats) {
  const json = JSON.stringify(cats)
  const buf  = Buffer.from(json, 'utf-8')
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(FILE, buf, { contentType: 'application/json', upsert: true })
  if (error) throw new Error(error.message)
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token')
  if (req.method === 'OPTIONS') return res.status(200).end()

  /* ── GET — público ── */
  if (req.method === 'GET') {
    const cats = await readCats()
    return res.status(200).json(cats)
  }

  if (!isAuth(req)) return res.status(401).json({ error: 'Não autorizado' })

  /* ── POST — criar ── */
  if (req.method === 'POST') {
    const { label, color } = req.body
    if (!label?.trim()) return res.status(400).json({ error: 'label é obrigatório' })

    const key = label.trim()
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')

    const cats = await readCats()
    if (cats.find(c => c.key === key)) {
      return res.status(409).json({ error: `Já existe uma categoria com a chave "${key}"` })
    }

    const newCat = {
      id:          Date.now().toString(),
      key,
      label:       label.trim(),
      color:       color || '#5A2EA6',
      order_index: cats.length,
    }
    cats.push(newCat)
    await writeCats(cats)
    return res.status(201).json(newCat)
  }

  /* ── PUT — editar ── */
  if (req.method === 'PUT') {
    const { id, label, color } = req.body
    if (!id) return res.status(400).json({ error: 'id é obrigatório' })

    const cats = await readCats()
    const idx  = cats.findIndex(c => c.id === id)
    if (idx === -1) return res.status(404).json({ error: 'Categoria não encontrada' })

    if (label?.trim()) cats[idx].label = label.trim()
    if (color)         cats[idx].color = color
    await writeCats(cats)
    return res.status(200).json(cats[idx])
  }

  /* ── DELETE — excluir ── */
  if (req.method === 'DELETE') {
    const { id } = req.body
    if (!id) return res.status(400).json({ error: 'id é obrigatório' })

    const cats = await readCats()
    const cat  = cats.find(c => c.id === id)
    if (!cat) return res.status(404).json({ error: 'Categoria não encontrada' })

    /* Bloqueia se tiver projetos vinculados */
    const { count } = await supabase
      .from('portfolio_projects')
      .select('id', { count: 'exact', head: true })
      .eq('category', cat.key)

    if (count > 0) {
      return res.status(409).json({
        error: `Esta categoria tem ${count} projeto(s). Remova-os antes de excluir.`
      })
    }

    const updated = cats.filter(c => c.id !== id)
    await writeCats(updated)
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Método não permitido' })
}
