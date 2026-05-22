-- ══════════════════════════════════════════════
-- PULSARI — Tabela de Categorias do Portfólio
-- Execute no SQL Editor do Supabase
-- ══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS portfolio_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text NOT NULL UNIQUE,
  label       text NOT NULL,
  color       text NOT NULL DEFAULT '#5A2EA6',
  order_index integer DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE portfolio_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cats_public_read" ON portfolio_categories
  FOR SELECT USING (true);

-- Categorias padrão
INSERT INTO portfolio_categories (key, label, color, order_index) VALUES
  ('sites',     'Sites',       '#5A2EA6', 0),
  ('landing',   'Landpages',   '#FF2D8D', 1),
  ('ecommerce', 'E-commerce',  '#2D6BFF', 2),
  ('sistemas',  'Sistemas',    '#10b981', 3)
ON CONFLICT (key) DO NOTHING;

-- Confirma
SELECT key, label, color FROM portfolio_categories ORDER BY order_index;
