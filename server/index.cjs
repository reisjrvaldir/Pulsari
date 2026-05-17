require('dotenv').config()
const express      = require('express')
const cors         = require('cors')
const path         = require('path')
const fs           = require('fs')
const nodemailer   = require('nodemailer')
const { createClient } = require('@supabase/supabase-js')

const app  = express()
const PORT = process.env.PORT || 3001

/* ── Supabase ── */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY   // service_role key — só no servidor, nunca no frontend
)

/* ── Middlewares ── */
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }))
app.use(express.json())

/* ── Serve o frontend em produção ── */
const DIST = path.join(__dirname, '..', 'dist')
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST))
}

/* ── Transporter de e-mail ── */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,   // App Password do Gmail
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
${msg.respostas?.map((r, i) => `<p><strong>${i+1}. ${r.pergunta}</strong><br/>${r.resposta}</p>`).join('') || ''}
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
    to:   process.env.EMAIL_NOTIFY || process.env.EMAIL_USER,
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0A0812;color:#fff;padding:2rem;border-radius:8px">
        <div style="text-align:center;margin-bottom:1.5rem">
          <span style="font-size:1.5rem;font-weight:900;background:linear-gradient(135deg,#FF2D8D,#5A2EA6,#2D6BFF);-webkit-background-clip:text;-webkit-text-fill-color:transparent"
          >PULSARI</span>
        </div>
        ${body}
        <hr style="border-color:rgba(90,46,166,.3);margin:1.5rem 0"/>
        <p style="color:rgba(255,255,255,.4);font-size:.8rem;text-align:center">
          Recebido em ${new Date().toLocaleString('pt-BR')} · Acesse o painel em <a href="${process.env.SITE_URL}/admin" style="color:#a855f7">${process.env.SITE_URL}/admin</a>
        </p>
      </div>`,
  }).catch(err => console.error('Email error:', err))
}

/* ─────────────── ROTAS API ─────────────── */

/* Auth middleware simples */
const checkAuth = (req, res, next) => {
  const token = req.headers['x-admin-token']
  if (token !== process.env.ADMIN_TOKEN) return res.status(401).json({ error: 'Não autorizado' })
  next()
}

/* POST /api/messages — recebe formulário do site */
app.post('/api/messages', async (req, res) => {
  const body = req.body
  const { data, error } = await supabase
    .from('messages')
    .insert([{
      tipo:         body.tipo        || null,
      nome:         body.nome        || null,
      email:        body.email       || null,
      tipo_projeto: body.tipo_projeto|| null,
      mensagem:     body.mensagem    || null,
      respostas:    body.respostas   || null,
      read:         false,
    }])
    .select()
    .single()

  if (error) {
    console.error('Supabase insert error:', error)
    return res.status(500).json({ error: 'Erro ao salvar mensagem' })
  }

  await sendNotification(data)
  res.json({ ok: true, id: data.id })
})

/* GET /api/messages — lista todas (protegido) */
app.get('/api/messages', checkAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

/* GET /api/messages/unread-count — contagem (protegido) */
app.get('/api/messages/unread-count', checkAuth, async (req, res) => {
  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('read', false)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ count: count || 0 })
})

/* PATCH /api/messages/:id — marcar como lida (protegido) */
app.patch('/api/messages/:id', checkAuth, async (req, res) => {
  const { error } = await supabase
    .from('messages')
    .update(req.body)
    .eq('id', req.params.id)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

/* DELETE /api/messages/:id — apagar (protegido) */
app.delete('/api/messages/:id', checkAuth, async (req, res) => {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', req.params.id)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

/* SPA fallback */
app.get('*', (req, res) => {
  if (fs.existsSync(DIST)) {
    res.sendFile(path.join(DIST, 'index.html'))
  } else {
    res.status(404).send('Build não encontrado. Rode npm run build.')
  }
})

app.listen(PORT, () => console.log(`✅ Pulsari server rodando na porta ${PORT}`))
