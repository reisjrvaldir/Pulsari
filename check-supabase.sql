-- ══════════════════════════════════════════════
-- VERIFICAÇÃO DO SETUP — Pulsari Portfolio
-- Cole e execute no SQL Editor do Supabase
-- ══════════════════════════════════════════════

-- 1. Verifica se a tabela existe e mostra colunas
SELECT
  '✅ TABELA EXISTE' AS status,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'portfolio_projects'
ORDER BY ordinal_position;

-- ── Se retornar linhas: tabela OK ──
-- ── Se retornar vazio: tabela NÃO existe, rode o setup SQL ──


-- 2. Conta quantos projetos existem por categoria
SELECT
  category,
  COUNT(*) AS total
FROM portfolio_projects
GROUP BY category
ORDER BY category;


-- 3. Verifica o bucket de imagens
SELECT
  id,
  name,
  public,
  '✅ BUCKET OK' AS status
FROM storage.buckets
WHERE id = 'portfolio-images';

-- ── Se retornar vazio: bucket NÃO existe ──


-- 4. Verifica a policy de leitura pública
SELECT
  policyname,
  cmd,
  '✅ POLICY OK' AS status
FROM pg_policies
WHERE tablename = 'portfolio_projects';
