import { getSql } from './db.js'

/**
 * Portfólio.
 *
 * Duas projeções que nunca se misturam:
 *   projecaoAdmin   → tudo, para a equipe autenticada
 *   listPublished   → só o que pode ir ao site, campo a campo
 *
 * O caminho público não faz SELECT *. Acrescentar uma coluna à tabela não a
 * expõe sozinha — é preciso escrevê-la explicitamente aqui.
 */

/**
 * Campos do projeto que podem ser copiados para um case.
 *
 * A lista existe no negativo também: `value`, `payment_status`, notas,
 * cards, sprints, atividades e anexos NÃO entram. O pré-preenchimento é uma
 * conveniência de digitação, não uma ponte entre o interno e o público.
 */
const CAMPOS_SEGUROS_DO_PROJETO = ['name', 'description']

export function gerarSlug(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'case'
}

/** Garante slug único acrescentando sufixo numérico quando já existe. */
export async function slugDisponivel(base, ignorarId = null) {
  const sql = getSql()
  let slug = gerarSlug(base)
  for (let n = 0; n < 50; n++) {
    const candidato = n === 0 ? slug : `${slug}-${n + 1}`
    const rows = await sql`
      SELECT 1 FROM portfolio_items
       WHERE slug = ${candidato} AND (${ignorarId}::uuid IS NULL OR id <> ${ignorarId})
       LIMIT 1
    `
    if (rows.length === 0) return candidato
  }
  return `${slug}-${Date.now()}`
}

// --- Leitura interna --------------------------------------------------------

export async function listItems({ published } = {}) {
  const sql = getSql()
  return sql`
    SELECT i.id, i.project_id, i.title, i.slug, i.description, i.case_description,
           i.technologies, i.main_image, i.gallery, i.project_url,
           i.featured, i.published, i.published_at, i.position,
           i.created_at, i.updated_at,
           p.name AS project_name
      FROM portfolio_items i
      LEFT JOIN projects p ON p.id = i.project_id
     WHERE (${published ?? null}::boolean IS NULL OR i.published = ${published ?? null})
     ORDER BY i.position ASC, i.created_at DESC
  `
}

export async function getItem(id) {
  const sql = getSql()
  const rows = await sql`
    SELECT i.id, i.project_id, i.title, i.slug, i.description, i.case_description,
           i.technologies, i.main_image, i.gallery, i.project_url,
           i.featured, i.published, i.published_at, i.position,
           i.created_at, i.updated_at,
           p.name AS project_name
      FROM portfolio_items i
      LEFT JOIN projects p ON p.id = i.project_id
     WHERE i.id = ${id} LIMIT 1
  `
  return rows[0] ?? null
}

// --- Leitura pública --------------------------------------------------------

/**
 * O que o site mostra. Note o que NÃO está na lista: project_id, created_by,
 * datas internas e qualquer coisa vinda de `projects`. Um visitante não
 * consegue descobrir sequer que o case veio de um projeto cadastrado.
 */
export async function listPublished() {
  const sql = getSql()
  return sql`
    SELECT title, slug, description, case_description,
           technologies, main_image, gallery, project_url, featured
      FROM portfolio_items
     WHERE published = true
     ORDER BY featured DESC, position ASC, published_at DESC
  `
}

export async function getPublishedBySlug(slug) {
  const sql = getSql()
  const rows = await sql`
    SELECT title, slug, description, case_description,
           technologies, main_image, gallery, project_url, featured
      FROM portfolio_items
     WHERE slug = ${slug} AND published = true
     LIMIT 1
  `
  return rows[0] ?? null
}

// --- Escrita ----------------------------------------------------------------

export async function createItem(dados, { userId = null } = {}) {
  const sql = getSql()
  const slug = await slugDisponivel(dados.slug || dados.title)

  const rows = await sql`
    INSERT INTO portfolio_items
      (project_id, title, slug, description, case_description, technologies,
       main_image, gallery, project_url, position, created_by)
    VALUES (${dados.project_id ?? null}, ${dados.title}, ${slug},
            ${dados.description ?? null}, ${dados.case_description ?? null},
            ${dados.technologies ?? []}, ${dados.main_image ?? null},
            ${dados.gallery ?? []}, ${dados.project_url ?? null},
            ${dados.position ?? 0}, ${userId})
    RETURNING id
  `
  return getItem(rows[0].id)
}

const EDITAVEL = [
  'title', 'description', 'case_description', 'technologies',
  'main_image', 'gallery', 'project_url', 'position',
]

export async function updateItem(id, dados) {
  const atual = await getItem(id)
  if (!atual) return null
  const sql = getSql()

  for (const campo of Object.keys(dados).filter((k) => EDITAVEL.includes(k))) {
    switch (campo) {
      case 'title': await sql`UPDATE portfolio_items SET title = ${dados.title}, updated_at = now() WHERE id = ${id}`; break
      case 'description': await sql`UPDATE portfolio_items SET description = ${dados.description}, updated_at = now() WHERE id = ${id}`; break
      case 'case_description': await sql`UPDATE portfolio_items SET case_description = ${dados.case_description}, updated_at = now() WHERE id = ${id}`; break
      case 'technologies': await sql`UPDATE portfolio_items SET technologies = ${dados.technologies}, updated_at = now() WHERE id = ${id}`; break
      case 'main_image': await sql`UPDATE portfolio_items SET main_image = ${dados.main_image}, updated_at = now() WHERE id = ${id}`; break
      case 'gallery': await sql`UPDATE portfolio_items SET gallery = ${dados.gallery}, updated_at = now() WHERE id = ${id}`; break
      case 'project_url': await sql`UPDATE portfolio_items SET project_url = ${dados.project_url}, updated_at = now() WHERE id = ${id}`; break
      case 'position': await sql`UPDATE portfolio_items SET position = ${dados.position}, updated_at = now() WHERE id = ${id}`; break
    }
  }

  if (dados.slug && dados.slug !== atual.slug) {
    const slug = await slugDisponivel(dados.slug, id)
    await sql`UPDATE portfolio_items SET slug = ${slug}, updated_at = now() WHERE id = ${id}`
  }

  return getItem(id)
}

/**
 * Publicar e despublicar são operações próprias, separadas da edição.
 * Nada vai ao ar como efeito colateral de salvar um campo.
 */
export async function setPublished(id, publicar) {
  const sql = getSql()
  const atual = await getItem(id)
  if (!atual) return null

  if (publicar && !atual.main_image) {
    return { erro: 'sem_imagem' }
  }

  if (publicar) {
    await sql`
      UPDATE portfolio_items
         SET published = true, published_at = coalesce(published_at, now()), updated_at = now()
       WHERE id = ${id}
    `
  } else {
    // Despublicar tira o destaque junto: a restrição do banco exige, e um
    // case fora do ar não pode continuar marcado como destaque.
    await sql`
      UPDATE portfolio_items
         SET published = false, featured = false, updated_at = now()
       WHERE id = ${id}
    `
  }
  return { item: await getItem(id) }
}

export async function setFeatured(id, destacar) {
  const sql = getSql()
  const atual = await getItem(id)
  if (!atual) return null
  if (destacar && !atual.published) return { erro: 'nao_publicado' }

  await sql`UPDATE portfolio_items SET featured = ${Boolean(destacar)}, updated_at = now() WHERE id = ${id}`
  return { item: await getItem(id) }
}

export async function reordenar(ordem) {
  const sql = getSql()
  for (const [i, id] of ordem.entries()) {
    await sql`UPDATE portfolio_items SET position = ${i + 1}, updated_at = now() WHERE id = ${id}`
  }
  return listItems({})
}

// --- Pré-preenchimento a partir do projeto ----------------------------------

/**
 * Monta um rascunho a partir de um projeto concluído.
 *
 * Copia só `name` e `description`. Valor, status de pagamento, cards,
 * sprints, atividades, anexos e notas internas ficam de fora por construção —
 * não há nem coluna onde guardá-los no portfólio.
 *
 * Não grava nada: devolve o rascunho para a equipe revisar e editar antes de
 * criar o case. Publicar continua sendo um segundo ato deliberado.
 */
export async function rascunhoDoProjeto(projectId) {
  const sql = getSql()
  const rows = await sql`
    SELECT id, name, description, status FROM projects WHERE id = ${projectId} LIMIT 1
  `
  const projeto = rows[0]
  if (!projeto) return null

  const jaExiste = await sql`
    SELECT id, slug, published FROM portfolio_items WHERE project_id = ${projectId} LIMIT 1
  `
  if (jaExiste[0]) return { jaExiste: jaExiste[0] }

  const seguro = {}
  for (const campo of CAMPOS_SEGUROS_DO_PROJETO) seguro[campo] = projeto[campo]

  return {
    jaExiste: null,
    concluido: projeto.status === 'completed',
    rascunho: {
      project_id: projeto.id,
      title: seguro.name,
      slug: gerarSlug(seguro.name),
      description: seguro.description,
      case_description: '',
      technologies: [],
      gallery: [],
      project_url: '',
    },
  }
}
