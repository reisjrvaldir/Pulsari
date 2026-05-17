import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

async function sendNotification(msg) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return
  const isOrc = msg.tipo === 'orcamento'
  const subject = isOrc
    ? `📋 Novo Briefing — ${msg.nome || 'Visitante'}`
    : `💬 Novo Contato — ${msg.nome || 'Visitante'}`

  const body = isOrc
    ? `
<h2 style="color:#5A2EA6">Novo Briefing Recebido</h2>
<p><strong>Nome:</strong> ${msg.nome || '—'}</p>
<p><strong>E-mail:</strong> ${msg.email || '—'}</p>
<hr/>
${msg.respostas?.map((r, i) => `<p><strong>${i + 1}. ${r.pergunta}</strong><br/>${r.resposta}</p>`).join('') || ''}
`
    : `
<h2 style="color:#5A2EA6">Nova Mensagem de Contato</h2>
<p><strong>Nome:</strong> ${msg.nome}</p>
<p><strong>E-mail:</strong> ${msg.email}</p>
<p><strong>Tipo de projeto:</strong> ${msg.tipo_projeto || '—'}</p>
<p><strong>Mensagem:</strong><br/>${msg.mensagem}</p>
`

  await transporter.sendMail({
    from: `"Pulsari Site" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_NOTIFY || process.env.EMAIL_USER,
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0A0812;color:#fff;padding:2rem;border-radius:8px">
        <div style="text-align:center;margin-bottom:1.5rem">
          <span style="font-size:1.5rem;font-weight:900;background:linear-gradient(135deg,#FF2D8D,#5A2EA6,#2D6BFF);-webkit-background-clip:text;-webkit-text-fill-color:transparent">PULSARI</span>
        </div>
        ${body}
        <hr style="border-color:rgba(90,46,166,.3);margin:1.5rem 0"/>
        <p style="color:rgba(255,255,255,.4);font-size:.8rem;text-align:center">
          Recebido em ${new Date().toLocaleString('pt-BR')} ·
          <a href="${process.env.SITE_URL}/admin" style="color:#a855f7">Acessar painel</a>
        </p>
      </div>`,
  }).catch(err => console.error('Email error:', err))
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token')
  if (req.method === 'OPTIONS') return res.status(200).end()

  /* POST /api/messages — recebe formulário do site (público) */
  if (req.method === 'POST') {
    const body = req.body
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        tipo:         body.tipo         || null,
        nome:         body.nome         || null,
        email:        body.email        || null,
        tipo_projeto: body.tipo_projeto || null,
        mensagem:     body.mensagem     || null,
        respostas:    body.respostas    || null,
        read:         false,
      }])
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return res.status(500).json({ error: 'Erro ao salvar mensagem' })
    }

    await sendNotification(data)
    return res.json({ ok: true, id: data.id })
  }

  /* GET /api/messages — lista todas (protegido) */
  if (req.method === 'GET') {
    const token = req.headers['x-admin-token']
    if (token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ error: 'Não autorizado' })
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.json(data)
  }

  res.status(405).json({ error: 'Método não permitido' })
}
