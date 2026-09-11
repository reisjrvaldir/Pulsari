import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Check, CircleAlert, FileText, Loader2 } from 'lucide-react'
import { Logo } from '../components/Logo'
import { site, whatsappHref } from '../config/site'

/**
 * Página pública da proposta — /proposta/:token
 *
 * É a única tela do sistema que um estranho abre. Tudo o que ela exibe vem
 * da projeção pública da API, que é montada campo a campo no servidor; nada
 * aqui filtra dado sensível, porque nada sensível chega até aqui.
 */

interface Item {
  description: string
  quantity: string
  unit_price: string
  line_total: string
}

interface Proposta {
  title: string
  presentation: string | null
  scope: string | null
  deliverables: string | null
  timeline: string | null
  discount: string
  valid_until: string | null
  status: string
  accepted_at: string | null
  accepted_by: string | null
  accepted_total: string | null
  client_name: string | null
  items_total: string
  items: Item[]
  vencida: boolean
}

/**
 * Os valores chegam como string — o `NUMERIC` do Postgres é serializado assim
 * para não perder precisão. Aqui só formatamos para exibição; nenhuma conta é
 * feita em JavaScript.
 */
function moeda(valor: string | null | undefined): string {
  if (valor == null) return '—'
  const n = Number(valor)
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function data(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

/** Blocos de texto livre preservam as quebras de linha que a equipe escreveu. */
function Texto({ children }: { children: string }) {
  return (
    <div className="space-y-3">
      {children.split(/\n{2,}/).map((paragrafo, i) => (
        <p key={i} className="text-ink-soft leading-relaxed whitespace-pre-line">
          {paragrafo}
        </p>
      ))}
    </div>
  )
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-8 mt-8">
      <h2 className="text-xs font-semibold tracking-[0.16em] uppercase text-ink/40 mb-4">
        {titulo}
      </h2>
      {children}
    </section>
  )
}

export function ProposalPage() {
  const { token } = useParams<{ token: string }>()

  const [proposta, setProposta] = useState<Proposta | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [naoEncontrada, setNaoEncontrada] = useState(false)

  const [nome, setNome] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erroAceite, setErroAceite] = useState<string | null>(null)
  const [aceitaAgora, setAceitaAgora] = useState(false)

  const carregar = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/proposal/${token}`)
      if (!res.ok) {
        setNaoEncontrada(true)
        return
      }
      const data = (await res.json()) as { proposal: Proposta }
      setProposta(data.proposal)
    } catch {
      setNaoEncontrada(true)
    } finally {
      setCarregando(false)
    }
  }, [token])

  // Buscar a proposta é exatamente o caso que a regra `set-state-in-effect`
  // abre exceção: sincronizar com um sistema externo. Todo setState dentro de
  // `carregar` acontece depois do await — nenhum é síncrono — mas o linter não
  // rastreia através da função assíncrona.
  // eslint-disable-next-line react/set-state-in-effect
  useEffect(() => { void carregar() }, [carregar])

  async function aceitar(e: React.FormEvent) {
    e.preventDefault()
    setErroAceite(null)
    setEnviando(true)
    try {
      const res = await fetch(`/api/public/proposal/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, aceite: 'aceito' }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setErroAceite(data.error ?? 'Não foi possível registrar o aceite.')
        return
      }
      setAceitaAgora(true)
      await carregar()
    } catch {
      setErroAceite('Falha de conexão. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  if (carregando) {
    return (
      <div className="min-h-screen grid place-items-center bg-paper">
        <Loader2 className="h-6 w-6 animate-spin text-ink-soft" aria-label="Carregando proposta" />
      </div>
    )
  }

  // Mesma tela para token inválido, proposta em rascunho, recusada ou
  // inexistente — a API já responde igual nos quatro casos de propósito.
  if (naoEncontrada || !proposta) {
    return (
      <div className="min-h-screen grid place-items-center bg-paper px-6">
        <div className="max-w-md text-center">
          <FileText className="h-10 w-10 mx-auto text-ink/20 mb-5" aria-hidden />
          <h1 className="font-display text-2xl font-bold text-ink mb-2">
            Proposta não encontrada
          </h1>
          <p className="text-ink-soft leading-relaxed">
            Este link pode ter expirado ou estar incorreto. Fale com a gente que
            enviamos uma nova.
          </p>
          <a href={whatsappHref('Olá! Meu link de proposta não está funcionando.')}
             target="_blank" rel="noreferrer" className="btn-gradient mt-7 inline-flex">
            Falar com a Pulsari
          </a>
        </div>
      </div>
    )
  }

  const aceita = proposta.status === 'accepted' || proposta.status === 'paid'
  const podeAceitar = !aceita && !proposta.vencida

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-plum">
        <div className="container-px max-w-content mx-auto py-6 flex items-center justify-between">
          <Logo variant="light" />
          <span className="text-xs tracking-[0.16em] uppercase text-white/40">Proposta</span>
        </div>
      </header>

      <main className="container-px max-w-content mx-auto py-12 sm:py-16">
        <div className="max-w-3xl">
          {proposta.client_name && (
            <p className="text-xs font-semibold tracking-[0.16em] uppercase text-brand-violet mb-3">
              Para {proposta.client_name}
            </p>
          )}
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink leading-tight">
            {proposta.title}
          </h1>

          {proposta.valid_until && !aceita && (
            <p className={`mt-4 text-sm ${proposta.vencida ? 'text-red-600' : 'text-ink-soft'}`}>
              {proposta.vencida
                ? `Esta proposta venceu em ${data(proposta.valid_until)}.`
                : `Válida até ${data(proposta.valid_until)}.`}
            </p>
          )}

          {aceita && (
            <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">
              <p className="flex items-center gap-2 font-display font-semibold text-green-800">
                <Check size={18} />
                {aceitaAgora ? 'Proposta aceita. Obrigado!' : 'Proposta aceita'}
              </p>
              <p className="mt-1 text-sm text-green-800/80">
                {proposta.accepted_by && `Aceite registrado por ${proposta.accepted_by}`}
                {proposta.accepted_at && ` em ${data(proposta.accepted_at)}`}.
                {' '}Entraremos em contato com os próximos passos.
              </p>
            </div>
          )}

          {proposta.presentation && (
            <Secao titulo="Apresentação"><Texto>{proposta.presentation}</Texto></Secao>
          )}
          {proposta.scope && (
            <Secao titulo="Escopo"><Texto>{proposta.scope}</Texto></Secao>
          )}
          {proposta.deliverables && (
            <Secao titulo="Entregáveis"><Texto>{proposta.deliverables}</Texto></Secao>
          )}
          {proposta.timeline && (
            <Secao titulo="Prazo"><Texto>{proposta.timeline}</Texto></Secao>
          )}

          <Secao titulo="Investimento">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.1em] text-ink/40">
                    <th className="pb-3 font-semibold">Item</th>
                    <th className="pb-3 font-semibold text-right w-20">Qtd</th>
                    <th className="pb-3 font-semibold text-right w-32">Unitário</th>
                    <th className="pb-3 font-semibold text-right w-32">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {proposta.items.map((item, i) => (
                    <tr key={i} className="border-t border-line">
                      <td className="py-3 text-ink">{item.description}</td>
                      <td className="py-3 text-right text-ink-soft">{Number(item.quantity)}</td>
                      <td className="py-3 text-right text-ink-soft">{moeda(item.unit_price)}</td>
                      <td className="py-3 text-right text-ink font-medium">{moeda(item.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 border-t border-line pt-5 space-y-2 text-sm">
              <div className="flex justify-between text-ink-soft">
                <span>Subtotal</span>
                <span>{moeda(proposta.items_total)}</span>
              </div>
              {Number(proposta.discount) > 0 && (
                <div className="flex justify-between text-ink-soft">
                  <span>Desconto</span>
                  <span>− {moeda(proposta.discount)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-2">
                <span className="font-display font-semibold text-ink">Total</span>
                <span className="font-display text-2xl font-bold text-ink">
                  {/* Quando já aceita, mostramos o valor congelado no aceite,
                      não o cálculo de agora — é esse que vale. */}
                  {moeda(aceita ? proposta.accepted_total : String(
                    Number(proposta.items_total) - Number(proposta.discount),
                  ))}
                </span>
              </div>
            </div>
          </Secao>

          {podeAceitar && (
            <Secao titulo="Aceite">
              <form onSubmit={aceitar} className="card-surface p-6 sm:p-8">
                <p className="text-ink-soft leading-relaxed mb-5">
                  Ao confirmar, você aceita esta proposta nas condições descritas acima.
                  Em seguida enviamos as instruções de pagamento.
                </p>
                <label className="block text-xs font-semibold tracking-[0.14em] uppercase text-ink/40">
                  Seu nome completo
                  <input
                    type="text"
                    required
                    minLength={2}
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm font-normal normal-case tracking-normal text-ink outline-none focus:border-brand-violet"
                  />
                </label>

                {erroAceite && (
                  <p role="alert" className="mt-4 flex items-start gap-2 text-sm text-red-600">
                    <CircleAlert size={16} className="mt-0.5 shrink-0" />
                    {erroAceite}
                  </p>
                )}

                <button type="submit" disabled={enviando} className="btn-gradient mt-6 disabled:opacity-60">
                  {enviando ? 'Registrando…' : 'Aceitar proposta'}
                </button>
              </form>
            </Secao>
          )}

          <Secao titulo="Sobre a Pulsari">
            <Texto>
              {`Unimos estratégia, design e tecnologia para criar experiências digitais que conectam marcas, pessoas e resultados.\n\n${site.location}`}
            </Texto>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href="/#portfolio" className="btn-outline-dark">Ver portfólio</a>
              <a href={whatsappHref(`Olá! Tenho dúvidas sobre a proposta "${proposta.title}".`)}
                 target="_blank" rel="noreferrer" className="btn-outline-dark">
                Tirar uma dúvida
              </a>
            </div>
          </Secao>
        </div>
      </main>

      <footer className="border-t border-line mt-8">
        <div className="container-px max-w-content mx-auto py-8 text-xs text-ink/40">
          © {new Date().getFullYear()} Pulsari. Proposta confidencial, destinada apenas ao
          destinatário deste link.
        </div>
      </footer>
    </div>
  )
}
