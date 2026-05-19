-- ══════════════════════════════════════════════
-- PULSARI — Setup do Portfólio no Supabase
-- Execute no SQL Editor do painel Supabase
-- ══════════════════════════════════════════════

-- 1. Tabela de projetos
CREATE TABLE IF NOT EXISTS portfolio_projects (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category      text NOT NULL CHECK (category IN ('sites','landing','ecommerce','sistemas')),
  nome          text NOT NULL,
  descricao     text,
  context       text,
  tags          text[] DEFAULT '{}',
  imagem        text,
  link          text,
  link_sistema  text,
  order_index   integer DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

-- 2. RLS: leitura pública, escrita via service key
ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leitura_publica" ON portfolio_projects
  FOR SELECT USING (true);

-- 3. Índice para ordenação
CREATE INDEX IF NOT EXISTS idx_portfolio_category
  ON portfolio_projects(category, order_index);

-- ══════════════════════════════════════════════
-- STORAGE BUCKET (execute separado se der erro)
-- ══════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-images', 'portfolio-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY IF NOT EXISTS "portfolio_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolio-images');

-- ══════════════════════════════════════════════
-- DADOS INICIAIS — ALPHA LED
-- ══════════════════════════════════════════════

INSERT INTO portfolio_projects
  (category, nome, descricao, context, tags, imagem, link, link_sistema)
VALUES (
  'landing',
  'ALPHA LED',
  'Construção de site institucional para empresa do setor de iluminação LED.',
  'Construção de site institucional, atendendo o design system e aplicando SEO.',
  ARRAY['WordPress','HTML','CSS','SQL'],
  'https://i.imgur.com/VUeKSG0.jpg',
  'https://alphaledpaineis.com.br',
  'https://alphaledpaineis.com.br'
);
