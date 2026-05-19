-- ══════════════════════════════════════════════
-- PULSARI — Setup do Portfólio no Supabase
-- Execute no SQL Editor do painel Supabase
-- ══════════════════════════════════════════════

-- 1. Tabela de projetos
CREATE TABLE IF NOT EXISTS portfolio_projects (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category     text NOT NULL CHECK (category IN ('sites','landing','ecommerce','sistemas')),
  nome         text NOT NULL,
  desc         text,
  context      text,
  tags         text[] DEFAULT '{}',
  imagem       text,
  link         text,
  "linkSistema" text,
  order_index  integer DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

-- 2. RLS: leitura pública, escrita via service key apenas
ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leitura_publica" ON portfolio_projects
  FOR SELECT USING (true);

-- (escrita é feita via SUPABASE_SERVICE_KEY na API — não precisa de policy)

-- 3. Índice para ordenação
CREATE INDEX IF NOT EXISTS idx_portfolio_category ON portfolio_projects(category, order_index);

-- ══════════════════════════════════════════════
-- STORAGE BUCKET
-- Execute via painel Supabase > Storage > New Bucket:
--   Nome: portfolio-images
--   Public: SIM (toggle ligado)
-- Ou via SQL:
-- ══════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-images', 'portfolio-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy de leitura pública para o bucket
CREATE POLICY "portfolio_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolio-images');

-- ══════════════════════════════════════════════
-- DADOS INICIAIS (opcional — ALPHA LED)
-- ══════════════════════════════════════════════

INSERT INTO portfolio_projects (category, nome, desc, context, tags, imagem, link, "linkSistema")
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
