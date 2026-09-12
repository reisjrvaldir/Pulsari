-- ============================================================================
-- Sprint 08 — Portfólio integrado a projetos
--
-- Nome `portfolio_items` e não `portfolio_projects`: a segunda já existe neste
-- banco, herdada da migração de julho/2026, com colunas em português e zero
-- linhas. Mesma lição de `contact_messages`.
--
-- A tabela guarda APENAS o que pode ser publicado. Não há coluna para valor,
-- comentário interno, tarefa ou anexo de projeto — o vazamento que a Fase 06
-- pede para auditar é impossível por ausência de lugar onde guardar.
--
-- `project_id` é só rastreio de origem: liga o case ao projeto que o gerou,
-- para saber de onde veio. Nada é lido de lá em tempo de publicação.
-- ============================================================================

CREATE TABLE IF NOT EXISTS portfolio_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Projeto de origem. ON DELETE SET NULL: apagar o projeto não apaga o case
  -- já publicado, que é conteúdo do site e tem vida própria.
  project_id       uuid REFERENCES projects(id) ON DELETE SET NULL,

  title            text NOT NULL,
  slug             text NOT NULL,
  description      text,
  case_description text,
  technologies     text[] NOT NULL DEFAULT '{}',
  main_image       text,
  gallery          text[] NOT NULL DEFAULT '{}',
  project_url      text,

  featured         boolean NOT NULL DEFAULT false,

  -- Falso por padrão, e a especificação é explícita: nada vai ao ar sozinho.
  -- Publicar é sempre um ato deliberado de alguém.
  published        boolean NOT NULL DEFAULT false,
  published_at     timestamptz,

  position         integer NOT NULL DEFAULT 0,

  created_by       uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  -- Slug é a URL pública do case: precisa de formato previsível.
  CONSTRAINT portfolio_items_slug_check CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- Publicado sem imagem principal fica quebrado na vitrine.
  CONSTRAINT portfolio_items_publicado_check CHECK (
    published = false OR (main_image IS NOT NULL AND published_at IS NOT NULL)
  ),
  -- Destaque só faz sentido no que está publicado.
  CONSTRAINT portfolio_items_destaque_check CHECK (featured = false OR published = true)
);

CREATE UNIQUE INDEX IF NOT EXISTS portfolio_items_slug_key ON portfolio_items (slug);
CREATE INDEX IF NOT EXISTS portfolio_items_publicados_idx
  ON portfolio_items (position, published_at DESC) WHERE published = true;
CREATE INDEX IF NOT EXISTS portfolio_items_project_idx ON portfolio_items (project_id);

-- Um projeto gera um case. Republicar edita o existente em vez de criar outro.
CREATE UNIQUE INDEX IF NOT EXISTS portfolio_items_project_key
  ON portfolio_items (project_id) WHERE project_id IS NOT NULL;
