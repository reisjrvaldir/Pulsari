import { useEffect, useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { ORIGENS, ROTULO_ORIGEM, importarCsv, type ResultadoImportacao } from './prospectsClient'

const entrada =
  'w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-brand-violet'

/**
 * Importação de CSV.
 *
 * O arquivo é lido no navegador e enviado como texto — não há upload de
 * binário nem armazenamento do arquivo. O servidor devolve o resumo por
 * linha, e é ele que a tela mostra: "importei 300 e apareceram 240" precisa
 * de resposta, não de um "concluído".
 */
export function ImportCsvModal({
  onFechar, onImportado,
}: {
  onFechar: () => void
  onImportado: () => void
}) {
  const [csv, setCsv] = useState('')
  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null)
  const [origem, setOrigem] = useState('lista')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => { if (e.key === 'Escape') onFechar() }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [onFechar])

  async function escolherArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    setNomeArquivo(arquivo.name)
    setCsv(await arquivo.text())
    setErro(null)
  }

  async function enviar() {
    setEnviando(true); setErro(null)
    try {
      const r = await importarCsv(csv, origem, nomeArquivo ?? undefined)
      if (!r.ok) { setErro(r.erro); return }
      setResultado(r.dados)
      onImportado()
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center px-4">
      <button type="button" aria-label="Fechar" onClick={onFechar} className="absolute inset-0 bg-plum/40" />

      <div role="dialog" aria-label="Importar CSV"
           className="relative w-full max-w-lg rounded-2xl bg-paper-white p-6 shadow-soft">
        <div className="flex items-start justify-between mb-5">
          <h2 className="font-display text-lg font-bold text-ink">Importar CSV</h2>
          <button type="button" onClick={onFechar} aria-label="Fechar" className="text-ink/30 hover:text-ink">
            <X size={18} />
          </button>
        </div>

        {resultado ? (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3 text-center">
              {[
                ['Linhas', resultado.total, 'text-ink'],
                ['Importados', resultado.importados, 'text-green-700'],
                ['Repetidos', resultado.duplicados, 'text-amber-700'],
                ['Inválidos', resultado.invalidos, 'text-red-700'],
              ].map(([rotulo, valor, cor]) => (
                <div key={String(rotulo)} className="rounded-xl border border-line p-3">
                  <p className={`font-display text-xl font-bold ${cor}`}>{valor}</p>
                  <p className="text-xs text-ink-soft mt-0.5">{rotulo}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-ink-soft">
              Colunas reconhecidas: {resultado.colunas_reconhecidas.join(', ') || 'nenhuma'}
            </p>

            {resultado.erros.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                <p className="text-xs font-medium text-red-800 mb-2">Linhas recusadas</p>
                <ul className="space-y-1 text-xs text-red-800/90">
                  {resultado.erros.map((e) => (
                    <li key={e.linha}>Linha {e.linha}: {e.motivo}</li>
                  ))}
                </ul>
              </div>
            )}

            <button type="button" onClick={onFechar} className="btn-gradient w-full justify-center">
              Concluir
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-ink-soft">
              O cabeçalho pode estar em português ou inglês. A coluna do nome da
              empresa é a única obrigatória — aceita <code className="text-xs">empresa</code>,{' '}
              <code className="text-xs">razão social</code> ou <code className="text-xs">company_name</code>.
            </p>

            <div>
              <input ref={inputRef} type="file" accept=".csv,text/csv"
                     onChange={escolherArquivo} className="sr-only" id="arquivo-csv" />
              <button type="button" onClick={() => inputRef.current?.click()}
                      className="btn-outline-dark w-full justify-center">
                <Upload size={15} /> {nomeArquivo ?? 'Escolher arquivo'}
              </button>
            </div>

            <label className="block">
              <span className="text-xs uppercase tracking-[0.12em] text-ink/40">Origem destes contatos</span>
              <select value={origem} onChange={(e) => setOrigem(e.target.value)} className={`${entrada} mt-1.5`}>
                {ORIGENS.map((o) => (
                  <option key={o} value={o}>{ROTULO_ORIGEM[o]}</option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-ink-soft">
                Pesa no score: indicação vale mais que lista.
              </span>
            </label>

            {erro && <p role="alert" className="text-sm text-red-600">{erro}</p>}

            <button type="button" onClick={() => void enviar()} disabled={!csv || enviando}
                    className="btn-gradient w-full justify-center disabled:opacity-60">
              {enviando ? 'Importando…' : 'Importar'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
