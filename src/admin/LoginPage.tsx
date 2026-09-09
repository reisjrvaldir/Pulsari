import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { useSession } from './session-context'

export function LoginPage() {
  const { user, loading, signIn } = useSession()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const destino = (location.state as { from?: string } | null)?.from ?? '/admin'

  if (!loading && user) return <Navigate to={destino} replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)

    const result = await signIn(email, password)

    if (!result.ok) {
      const espera = result.retryAfter
        ? ` Tente novamente em ${Math.ceil(result.retryAfter / 60)} min.`
        : ''
      setErro(result.error + espera)
      setPassword('')
    }
    setEnviando(false)
  }

  return (
    <div className="min-h-screen grid place-items-center bg-plum px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo variant="light" />
        </div>

        <div className="bg-paper-white rounded-2xl shadow-soft p-8">
          <h1 className="font-display text-xl font-bold text-ink mb-1">Pulsari Operations</h1>
          <p className="text-sm text-ink-soft mb-6">Acesso restrito à equipe.</p>

          <form onSubmit={handleSubmit} noValidate>
            <label className="block text-xs font-semibold tracking-[0.14em] uppercase text-ink/40 mb-1.5">
              E-mail
              <input
                type="email"
                name="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm font-normal normal-case tracking-normal text-ink outline-none focus:border-brand-violet"
              />
            </label>

            <label className="mt-4 block text-xs font-semibold tracking-[0.14em] uppercase text-ink/40 mb-1.5">
              Senha
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm font-normal normal-case tracking-normal text-ink outline-none focus:border-brand-violet"
              />
            </label>

            {erro && (
              <p role="alert" className="mt-4 text-sm text-red-600">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="btn-gradient mt-6 w-full justify-center disabled:opacity-60"
            >
              {enviando ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-white/40">
          Esqueceu a senha? Fale com um administrador.
        </p>
      </div>
    </div>
  )
}
