import { guardMethod, json, requireRole, withErrorHandling } from '../../_lib/http.js'
import { rascunhoDoProjeto } from '../../_lib/portfolio.js'

/**
 * Rascunho de case a partir de um projeto — o que o botão
 * "Adicionar ao portfólio" preenche.
 *
 * Não grava nada: devolve os campos seguros para a equipe revisar. Copia só
 * nome e descrição; valor, pagamento, cards, sprints, atividades e anexos não
 * saem do projeto — e nem teriam onde ser guardados no portfólio.
 */
async function handler(req, res) {
  if (!guardMethod(req, res, ['GET'])) return

  const user = await requireRole(req, res, 'portfolio', 'write')
  if (!user) return

  const r = await rascunhoDoProjeto(String(req.query?.id ?? ''))
  if (!r) return json(res, 404, { error: 'Projeto não encontrado' })

  if (r.jaExiste) {
    return json(res, 409, {
      error: 'Este projeto já tem um case no portfólio.',
      item: r.jaExiste,
    })
  }

  return json(res, 200, { rascunho: r.rascunho, concluido: r.concluido })
}

export default withErrorHandling(handler)
