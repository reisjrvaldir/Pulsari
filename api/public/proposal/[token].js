import { getClientIp, guardMethod, json, readJsonBody, withErrorHandling } from '../../_lib/http.js'
import { ValidationError, pick } from '../../_lib/validate.js'
import { acceptProposal, getPublicProposal, registerView } from '../../_lib/proposals.js'

/**
 * Página pública da proposta — sem autenticação, acessível por quem tem o link.
 *
 * Princípio de resposta: token inválido, proposta em rascunho, recusada ou
 * inexistente respondem EXATAMENTE a mesma coisa (404 com o mesmo corpo).
 * Diferenciar as respostas permitiria descobrir tokens válidos observando o
 * comportamento, que é a forma prática de enumerar quando o espaço é grande
 * demais para força bruta.
 */

const NAO_ENCONTRADA = { error: 'Proposta não encontrada ou indisponível.' }

// Limite por IP: a página é pública e não deve virar ferramenta de sondagem.
const JANELA_MS = 60 * 1000
const MAX_POR_JANELA = 30
const acessos = new Map()

function excedeu(ip) {
  if (!ip) return false
  const agora = Date.now()
  const registro = acessos.get(ip)
  if (!registro || agora - registro.inicio > JANELA_MS) {
    acessos.set(ip, { inicio: agora, n: 1 })
    return false
  }
  registro.n += 1
  return registro.n > MAX_POR_JANELA
}

async function handler(req, res) {
  if (!guardMethod(req, res, ['GET', 'POST'])) return

  const token = String(req.query?.token ?? '')
  const ip = getClientIp(req)

  // O limite vive na memória da instância. Serverless tem várias, então isto
  // é atrito contra varredura casual, não defesa forte — a defesa forte são
  // os 256 bits do token. Um limite em banco aqui custaria uma escrita por
  // visita de página pública, o que não se paga.
  if (excedeu(ip)) {
    res.setHeader('Retry-After', '60')
    return json(res, 429, { error: 'Muitas requisições. Aguarde um instante.' })
  }

  const proposta = await getPublicProposal(token)
  if (!proposta) return json(res, 404, NAO_ENCONTRADA)

  const { _id, ...publica } = proposta

  if (req.method === 'GET') {
    // Registrar a visualização não pode derrubar a página do cliente.
    try {
      await registerView(_id, {
        ip,
        userAgent: req.headers['user-agent'],
        referer: req.headers.referer,
      })
    } catch { /* telemetria é secundária ao conteúdo */ }

    return json(res, 200, { proposal: publica })
  }

  if (publica.vencida) {
    return json(res, 410, { error: 'Esta proposta venceu. Fale com a Pulsari para uma nova.' })
  }

  let dados
  try {
    dados = pick(await readJsonBody(req), {
      nome: { type: 'string', required: true, min: 2, max: 120 },
      aceite: { type: 'enum', values: ['aceito'], required: true },
    })
  } catch (err) {
    if (err instanceof ValidationError) {
      return json(res, 400, { error: 'Confirme seu nome para aceitar.', campos: err.errors })
    }
    throw err
  }

  const r = await acceptProposal(token, { nome: dados.nome, ip })

  if (r.erro === 'nao_encontrada') return json(res, 404, NAO_ENCONTRADA)
  if (r.erro === 'vencida') return json(res, 410, { error: 'Esta proposta venceu.' })
  if (r.erro === 'indisponivel') return json(res, 409, { error: 'Esta proposta não está disponível para aceite.' })

  // Aceite repetido devolve 200 com o mesmo resultado — o cliente que clicou
  // duas vezes vê sucesso, e nada é sobrescrito.
  return json(res, r.jaAceita ? 200 : 201, {
    ok: true,
    jaAceita: r.jaAceita,
    total: r.total,
  })
}

export default withErrorHandling(handler)
