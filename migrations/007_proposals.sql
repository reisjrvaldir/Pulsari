-- ============================================================================
-- Sprint 05 — Propostas comerciais
--
-- Duas superfícies muito diferentes:
--   /admin/proposals  → builder interno, autenticado
--   /proposta/:token   → página pública, sem login
--
-- A pública é a segunda rota sem autenticação do sistema (a outra é
-- /api/contact). Por isso o desenho separa com rigor o que é interno do que
-- pode ser servido a quem tem o link.
-- ============================================================================

CREATE TABLE IF NOT EXISTS proposals (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     uuid REFERENCES clients(id) ON DELETE SET NULL,
  lead_id       uuid REFERENCES leads(id) ON DELETE SET NULL,

  title         text NOT NULL,
  presentation  text,
  scope         text,
  deliverables  text,
  timeline      text,

  -- Só a equipe vê. Nunca sai na rota pública — é o campo que existe
  -- justamente para anotar margem, risco e o que não se diz ao cliente.
  internal_notes text,

  discount      numeric(14,2) NOT NULL DEFAULT 0,
  valid_until   date,

  status        text NOT NULL DEFAULT 'draft',

  -- 32 bytes de aleatoriedade (256 bits). Enumerar é inviável; não há
  -- sequência nem id previsível na URL pública.
  public_token  text NOT NULL,

  sent_at         timestamptz,
  first_viewed_at timestamptz,
  accepted_at     timestamptz,
  accepted_by     text,
  accepted_ip     text,
  rejected_at     timestamptz,

  -- Valor congelado no aceite. Itens podem ser corrigidos depois por
  -- engano; o que foi aceito não muda.
  accepted_total  numeric(14,2),

  created_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT proposals_status_check CHECK (
    status IN ('draft','sent','viewed','accepted','rejected','expired','paid')
  ),
  CONSTRAINT proposals_discount_check CHECK (discount >= 0),
  CONSTRAINT proposals_token_len_check CHECK (length(public_token) >= 32),
  CONSTRAINT proposals_accepted_check CHECK (
    (status IN ('accepted','paid') AND accepted_at IS NOT NULL AND accepted_total IS NOT NULL) OR
    (status NOT IN ('accepted','paid') AND accepted_at IS NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS proposals_public_token_key ON proposals (public_token);
CREATE INDEX IF NOT EXISTS proposals_client_idx ON proposals (client_id);
CREATE INDEX IF NOT EXISTS proposals_lead_idx   ON proposals (lead_id);
CREATE INDEX IF NOT EXISTS proposals_status_idx ON proposals (status, valid_until);

-- Itens ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS proposal_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity    numeric(12,3) NOT NULL DEFAULT 1,
  unit_price  numeric(14,2) NOT NULL,
  position    integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),

  -- Total do item calculado pelo banco. Multiplicar na aplicação abriria a
  -- porta para aritmética de ponto flutuante justamente onde não pode haver.
  line_total  numeric(14,2) GENERATED ALWAYS AS (round(quantity * unit_price, 2)) STORED,

  CONSTRAINT proposal_items_quantity_check CHECK (quantity > 0),
  CONSTRAINT proposal_items_price_check CHECK (unit_price >= 0)
);

CREATE INDEX IF NOT EXISTS proposal_items_proposal_idx ON proposal_items (proposal_id, position);

-- Trava de edição ------------------------------------------------------------
-- Proposta já enviada não tem itens alterados em silêncio: o cliente pode
-- estar com o link aberto, e mudar o preço por baixo seria indefensável.
-- Para corrigir, volte a proposta para rascunho de forma explícita.
CREATE OR REPLACE FUNCTION pulsari_proposal_items_travadas() RETURNS trigger
  LANGUAGE plpgsql AS $$
  DECLARE
    st text;
    pid uuid;
  BEGIN
    pid := coalesce(NEW.proposal_id, OLD.proposal_id);
    SELECT status INTO st FROM proposals WHERE id = pid;
    IF st IS NOT NULL AND st <> 'draft' THEN
      RAISE EXCEPTION
        'Itens só podem ser alterados enquanto a proposta está em rascunho (atual: %).', st;
    END IF;
    RETURN coalesce(NEW, OLD);
  END;
  $$;

DROP TRIGGER IF EXISTS proposal_items_trava ON proposal_items;
CREATE TRIGGER proposal_items_trava
  BEFORE INSERT OR UPDATE OR DELETE ON proposal_items
  FOR EACH ROW EXECUTE FUNCTION pulsari_proposal_items_travadas();

-- Visualizações --------------------------------------------------------------
-- Registro de acesso à página pública. Contém IP e user-agent, que são dado
-- pessoal: manter só o necessário para saber se a proposta foi lida.
CREATE TABLE IF NOT EXISTS proposal_views (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  viewed_at   timestamptz NOT NULL DEFAULT now(),
  ip          text,
  user_agent  text,
  referer     text
);

CREATE INDEX IF NOT EXISTS proposal_views_proposal_idx ON proposal_views (proposal_id, viewed_at DESC);
