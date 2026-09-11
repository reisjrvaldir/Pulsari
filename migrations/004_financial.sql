-- ============================================================================
-- Sprint 04 — Financeiro integrado aos projetos
--
-- Princípio: o financeiro NÃO recalcula nem duplica o que já existe no
-- projeto. Ele registra lançamentos, e todo lançamento aponta para sua origem
-- (`origin_type` + `origin_id`). Saldo é soma de lançamentos, nunca um campo
-- de saldo mantido à mão.
--
-- Dinheiro é NUMERIC(14,2) — decimal exato do Postgres, não ponto flutuante.
-- Toda soma acontece em SQL. A aplicação nunca faz aritmética sobre esses
-- valores: o driver devolve NUMERIC como string justamente para não perder
-- precisão, e converter para Number reintroduziria o erro que o tipo evita.
-- ============================================================================

-- Categorias -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS financial_categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  type       text NOT NULL,
  color      text,
  active     boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT financial_categories_type_check CHECK (type IN ('income','expense'))
);

-- Mesmo nome pode existir nos dois lados (ex.: "Ajuste" receita e despesa).
CREATE UNIQUE INDEX IF NOT EXISTS financial_categories_name_type_key
  ON financial_categories (lower(name), type);

-- Lançamentos ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS financial_transactions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type             text NOT NULL,
  category_id      uuid REFERENCES financial_categories(id) ON DELETE SET NULL,
  description      text NOT NULL,

  -- Sempre positivo. O sinal vem de `type`, não do número: valor negativo
  -- numa receita seria ambíguo e quebraria qualquer soma por tipo.
  amount           numeric(14,2) NOT NULL,

  status           text NOT NULL DEFAULT 'pending',
  transaction_date date NOT NULL DEFAULT current_date,
  due_date         date,
  paid_at          timestamptz,

  -- Rastro da origem. É o que permite ao financeiro receber informação do
  -- projeto sem copiar o projeto para dentro dele.
  origin_type      text NOT NULL DEFAULT 'manual',
  origin_id        uuid,
  -- Competência, para origens que se repetem (mensalidade de recorrente).
  origin_period    date,

  client_id        uuid REFERENCES clients(id) ON DELETE SET NULL,
  project_id       uuid REFERENCES projects(id) ON DELETE SET NULL,
  created_by       uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT financial_transactions_type_check CHECK (type IN ('income','expense')),
  CONSTRAINT financial_transactions_amount_check CHECK (amount > 0),
  CONSTRAINT financial_transactions_status_check CHECK (
    status IN ('pending','paid','overdue','cancelled')
  ),
  CONSTRAINT financial_transactions_origin_check CHECK (
    origin_type IN ('manual','project_payment','recurring_service','invoice')
  ),
  -- Origem automática precisa dizer de onde veio.
  CONSTRAINT financial_transactions_origin_id_check CHECK (
    origin_type = 'manual' OR origin_id IS NOT NULL
  ),
  -- Pago exige data de pagamento; não pago não pode ter.
  CONSTRAINT financial_transactions_paid_check CHECK (
    (status = 'paid' AND paid_at IS NOT NULL) OR
    (status <> 'paid' AND paid_at IS NULL)
  )
);

-- Idempotência: é este índice que impede o duplo clique em "marcar projeto
-- como pago" de gerar dois lançamentos. A geração usa ON CONFLICT DO NOTHING
-- contra ele, então a segunda chamada simplesmente não escreve nada.
--
-- `origin_period` entra na chave para que uma recorrência mensal possa gerar
-- um lançamento por competência sem colidir com o mês anterior.
CREATE UNIQUE INDEX IF NOT EXISTS financial_transactions_origin_key
  ON financial_transactions (origin_type, origin_id, coalesce(origin_period, DATE '1970-01-01'))
  WHERE origin_type <> 'manual';

CREATE INDEX IF NOT EXISTS financial_transactions_date_idx    ON financial_transactions (transaction_date DESC);
CREATE INDEX IF NOT EXISTS financial_transactions_status_idx  ON financial_transactions (status, due_date);
CREATE INDEX IF NOT EXISTS financial_transactions_client_idx  ON financial_transactions (client_id);
CREATE INDEX IF NOT EXISTS financial_transactions_project_idx ON financial_transactions (project_id);
CREATE INDEX IF NOT EXISTS financial_transactions_category_idx ON financial_transactions (category_id);

-- Serviços recorrentes -------------------------------------------------------
CREATE TABLE IF NOT EXISTS recurring_services (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  description   text NOT NULL,
  amount        numeric(14,2) NOT NULL,
  frequency     text NOT NULL DEFAULT 'monthly',
  -- Dia do mês da cobrança. 29 a 31 são normalizados para o último dia do mês
  -- na geração, senão fevereiro deixaria a cobrança sem acontecer.
  billing_day   integer NOT NULL DEFAULT 1,
  next_due_date date NOT NULL,
  category_id   uuid REFERENCES financial_categories(id) ON DELETE SET NULL,
  active        boolean NOT NULL DEFAULT true,
  created_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT recurring_services_amount_check CHECK (amount > 0),
  CONSTRAINT recurring_services_frequency_check CHECK (
    frequency IN ('monthly','quarterly','semiannual','annual')
  ),
  CONSTRAINT recurring_services_billing_day_check CHECK (billing_day BETWEEN 1 AND 31)
);

CREATE INDEX IF NOT EXISTS recurring_services_client_idx ON recurring_services (client_id);
CREATE INDEX IF NOT EXISTS recurring_services_due_idx
  ON recurring_services (next_due_date) WHERE active = true;

-- Categorias iniciais --------------------------------------------------------
-- Ponto de partida editável, não catálogo fechado.
INSERT INTO financial_categories (name, type) VALUES
  ('Projetos',            'income'),
  ('Serviços recorrentes','income'),
  ('Outras receitas',     'income'),
  ('Ferramentas e software','expense'),
  ('Infraestrutura',      'expense'),
  ('Terceirizados',       'expense'),
  ('Impostos',            'expense'),
  ('Outras despesas',     'expense')
ON CONFLICT DO NOTHING;
