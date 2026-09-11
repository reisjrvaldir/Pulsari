-- ============================================================================
-- Sprint 06 — Pagamento e acompanhamento do cliente
--
-- Regra que organiza tudo aqui: pagamento só é considerado confirmado pelo
-- webhook do provedor. Nada que venha do navegador do cliente — nem um
-- "retorno de sucesso", nem um parâmetro na URL — marca uma cobrança como
-- paga. O front pode ficar otimista; o banco só muda por webhook verificado.
-- ============================================================================

-- Eventos de webhook ---------------------------------------------------------
-- Guardados ANTES de serem processados, e por isso a tabela é a espinha
-- dorsal da idempotência: o índice único em (provider, event_id) faz o replay
-- de um evento já recebido parar aqui, sem chegar a tocar no financeiro.
--
-- O payload cru fica registrado para auditoria: quando houver divergência de
-- valor com o provedor, é esta linha que resolve a discussão.
CREATE TABLE IF NOT EXISTS webhook_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider     text NOT NULL DEFAULT 'asaas',
  event_id     text NOT NULL,
  event_type   text,
  payload      jsonb NOT NULL,
  received_at  timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  status       text NOT NULL DEFAULT 'received',
  error        text,

  CONSTRAINT webhook_events_status_check CHECK (
    status IN ('received','processed','ignored','failed')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS webhook_events_provider_event_key
  ON webhook_events (provider, event_id);
CREATE INDEX IF NOT EXISTS webhook_events_pendentes_idx
  ON webhook_events (received_at) WHERE status IN ('received','failed');

-- Cobranças ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS proposal_payments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id       uuid NOT NULL REFERENCES proposals(id) ON DELETE RESTRICT,
  client_id         uuid REFERENCES clients(id) ON DELETE SET NULL,

  provider          text NOT NULL DEFAULT 'asaas',
  -- Id da cobrança no provedor. Único: é a chave que liga o webhook à
  -- cobrança e impede que dois registros disputem o mesmo pagamento.
  provider_charge_id text,

  method            text NOT NULL,
  amount            numeric(14,2) NOT NULL,
  status            text NOT NULL DEFAULT 'pending',

  due_date          date,
  paid_at           timestamptz,

  -- Dados de exibição devolvidos pelo provedor (copia-e-cola do PIX, link da
  -- fatura). Não são segredo, mas também não são reconstruíveis aqui.
  pix_payload       text,
  invoice_url       text,

  created_by        uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT proposal_payments_method_check CHECK (
    method IN ('pix','credit_card','boleto')
  ),
  CONSTRAINT proposal_payments_status_check CHECK (
    status IN ('pending','confirmed','received','overdue','refunded','failed','cancelled')
  ),
  CONSTRAINT proposal_payments_amount_check CHECK (amount > 0),
  CONSTRAINT proposal_payments_paid_check CHECK (
    (status IN ('confirmed','received') AND paid_at IS NOT NULL) OR
    (status NOT IN ('confirmed','received') AND paid_at IS NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS proposal_payments_charge_key
  ON proposal_payments (provider, provider_charge_id)
  WHERE provider_charge_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS proposal_payments_proposal_idx ON proposal_payments (proposal_id);
CREATE INDEX IF NOT EXISTS proposal_payments_status_idx   ON proposal_payments (status, due_date);

-- Origem de lançamento financeiro -------------------------------------------
-- Acrescenta 'proposal_payment' aos tipos aceitos. O índice único de
-- idempotência da 004 continua valendo: um pagamento confirmado duas vezes
-- gera um único lançamento.
ALTER TABLE financial_transactions
  DROP CONSTRAINT IF EXISTS financial_transactions_origin_check;
ALTER TABLE financial_transactions
  ADD CONSTRAINT financial_transactions_origin_check
  CHECK (origin_type IN ('manual','project_payment','recurring_service','invoice','proposal_payment'));

-- Visibilidade da sprint ao cliente ------------------------------------------
-- Falso por padrão: o cliente não vê sprint interna a menos que alguém
-- decida publicá-la.
ALTER TABLE sprints
  ADD COLUMN IF NOT EXISTS client_visible boolean NOT NULL DEFAULT false;

-- Linha do tempo do cliente --------------------------------------------------
-- Marcos públicos, escritos para o cliente ler. NÃO é projeção do kanban
-- interno: nenhuma coluna aponta para card, fase ou responsável. O que o
-- cliente vê é decidido por quem publica, não derivado do trabalho interno.
CREATE TABLE IF NOT EXISTS client_timeline_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id  uuid REFERENCES projects(id) ON DELETE CASCADE,
  proposal_id uuid REFERENCES proposals(id) ON DELETE SET NULL,
  -- Quando o marco nasceu de uma sprint publicada. Guardado só para rastreio
  -- interno; nunca sai na resposta ao cliente.
  sprint_id   uuid REFERENCES sprints(id) ON DELETE SET NULL,

  title       text NOT NULL,
  description text,
  status      text NOT NULL DEFAULT 'pending',
  position    integer NOT NULL DEFAULT 0,

  published_at timestamptz NOT NULL DEFAULT now(),
  created_by  uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT client_timeline_status_check CHECK (
    status IN ('done','current','pending')
  )
);

CREATE INDEX IF NOT EXISTS client_timeline_client_idx
  ON client_timeline_events (client_id, position, published_at);
CREATE INDEX IF NOT EXISTS client_timeline_project_idx
  ON client_timeline_events (project_id, position);

-- Um marco por sprint publicada, para republicar não duplicar a linha.
CREATE UNIQUE INDEX IF NOT EXISTS client_timeline_sprint_key
  ON client_timeline_events (sprint_id) WHERE sprint_id IS NOT NULL;
