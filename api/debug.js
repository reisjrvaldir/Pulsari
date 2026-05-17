import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const checks = {
    env: {
      SUPABASE_URL:         !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
      ADMIN_TOKEN:          !!process.env.ADMIN_TOKEN,
      ADMIN_EMAIL:          !!process.env.ADMIN_EMAIL,
      ADMIN_PASS:           !!process.env.ADMIN_PASS,
      EMAIL_USER:           !!process.env.EMAIL_USER,
      EMAIL_PASS:           !!process.env.EMAIL_PASS,
    },
    supabase: { connected: false, canInsert: false, canRead: false, error: null },
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    )

    /* Tenta inserir uma linha de teste */
    const { data: ins, error: insErr } = await supabase
      .from('messages')
      .insert([{ tipo: 'debug', nome: 'TESTE DIAGNOSTICO', email: 'debug@test.com', mensagem: 'auto-deletado' }])
      .select()
      .single()

    if (insErr) {
      checks.supabase.error = `INSERT: ${insErr.message}`
    } else {
      checks.supabase.canInsert = true
      checks.supabase.connected = true

      /* Tenta ler */
      const { data: rows, error: readErr } = await supabase.from('messages').select('id').limit(1)
      if (readErr) checks.supabase.error = `READ: ${readErr.message}`
      else checks.supabase.canRead = true

      /* Apaga a linha de teste */
      if (ins?.id) await supabase.from('messages').delete().eq('id', ins.id)
    }
  } catch (e) {
    checks.supabase.error = `EXCEPTION: ${e.message}`
  }

  res.status(200).json(checks)
}
