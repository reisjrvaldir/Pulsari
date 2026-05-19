import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const ADMIN_TOKEN = process.env.ADMIN_TOKEN

export const config = { api: { bodyParser: { sizeLimit: '5mb' } } }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })
  if (req.headers['x-admin-token'] !== ADMIN_TOKEN) return res.status(401).json({ error: 'Não autorizado' })

  const { base64, filename, contentType } = req.body
  if (!base64 || !filename) return res.status(400).json({ error: 'base64 e filename são obrigatórios' })

  /* Converte base64 para buffer */
  const buffer = Buffer.from(base64.replace(/^data:[^;]+;base64,/, ''), 'base64')

  /* Nome único para evitar colisões */
  const ext = filename.split('.').pop()
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const path = `projects/${safeName}`

  const { error } = await supabase.storage
    .from('portfolio-images')
    .upload(path, buffer, { contentType: contentType || 'image/jpeg', upsert: false })

  if (error) return res.status(500).json({ error: error.message })

  const { data: { publicUrl } } = supabase.storage
    .from('portfolio-images')
    .getPublicUrl(path)

  return res.status(200).json({ url: publicUrl })
}
