-- ============================================================================
-- Sprint 02 — CRM e gestão de clientes
--
-- Fluxo: visitante → formulário → mensagem → lead → qualificação → proposta
--        → ganho → cliente → projeto.
--
-- Single-company: sem tenant_id / organization_id.
-- Aditiva: não altera nada da 001.
-- ============================================================================

-- Normalização para deduplicação --------------------------------------------
-- Colunas geradas em vez de calculadas na aplicação: o banco garante que o
-- valor normalizado sempre corresponde ao original, mesmo se alguém escrever
-- por fora da API. É o que sustenta os índices de duplicidade abaixo.
CREATE OR REPLACE FUNCTION pulsari_norm_email(v text) RETURNS text
  LANGUAGE sql IMMUTABLE AS $$ SELECT nullif(lower(btrim(v)), '') $$;

-- Descarta o DDI 55 antes de cortar em 11: telefone fixo com DDI tem 12
-- dígitos (55 + DDD + 8) e cortar direto deixaria um "5" grudado no DDD.
CREATE OR REPLACE FUNCTION pulsari_norm_phone(v text) RETURNS text
  LANGUAGE sql IMMUTABLE AS $$
    SELECT nullif(
      right(
        CASE
          WHEN length(regexp_replace(coalesce(v, ''), '\D', '', 'g')) > 11
           AND left(regexp_replace(coalesce(v, ''), '\D', '', 'g'), 2) = '55'
          THEN substr(regexp_replace(coalesce(v, ''), '\D', '', 'g'), 3)
          ELSE regexp_replace(coalesce(v, ''), '\D', '', 'g')
        END,
        11
      ), ''
    )
  $$;

-- Clientes -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  company_name  text,
  email         text,
  phone         text,
  whatsapp      text,
  document      text,
  notes         text,
  status        text NOT NULL DEFAULT 'active',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  email_norm    text GENERATED ALWAYS AS (pulsari_norm_email(email)) STORED,
  phone_norm    text GENERATED ALWAYS AS (pulsari_norm_phone(coalesce(phone, whatsapp))) STORED,

  CONSTRAINT clients_status_check CHECK (status IN ('active','inactive','archived'))
);

-- Um mesmo e-mail não pode virar dois clientes. Parcial: cliente sem e-mail
-- é permitido (indicação, contato só por telefone).
CREATE UNIQUE INDEX IF NOT EXISTS clients_email_norm_key
  ON clients (email_norm) WHERE email_norm IS NOT NULL;
CREATE INDEX IF NOT EXISTS clients_phone_norm_idx ON clients (phone_norm);
CREATE INDEX IF NOT EXISTS clients_status_idx     ON clients (status);

-- Leads ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leads (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL,
  company_name      text,
  email             text,
  phone             text,
  whatsapp          text,
  source            text NOT NULL DEFAULT 'website',
  source_detail     text,
  service_interest  text,
  estimated_value   numeric(12,2),
  score             integer NOT NULL DEFAULT 0,
  status            text NOT NULL DEFAULT 'new',
  owner_id          uuid REFERENCES users(id) ON DELETE SET NULL,
  notes             text,
  last_contact_at   timestamptz,
  next_contact_at   timestamptz,

  -- Ordem dentro da coluna do kanban. Sem isto o quadro reordena sozinho a
  -- cada carga e o arrastar-e-soltar não gruda.
  board_position    integer NOT NULL DEFAULT 0,

  -- Preenchido ao converter em WON; é o que torna a conversão idempotente.
  converted_client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  converted_at        timestamptz,

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  email_norm        text GENERATED ALWAYS AS (pulsari_norm_email(email)) STORED,
  phone_norm        text GENERATED ALWAYS AS (pulsari_norm_phone(coalesce(phone, whatsapp))) STORED,

  CONSTRAINT leads_status_check CHECK (
    status IN ('new','contacted','qualified','proposal','negotiation','won','lost')
  ),
  CONSTRAINT leads_score_check CHECK (score BETWEEN 0 AND 100),
  -- Um lead ganho precisa apontar para o cliente que originou.
  CONSTRAINT leads_won_has_client CHECK (
    status <> 'won' OR converted_client_id IS NOT NULL
  )
);

-- Sem índice único: a mesma pessoa pode voltar meses depois como lead novo,
-- e travar isso no banco esconderia negócio legítimo. A deduplicação acontece
-- na ingestão do formulário, que procura um lead ABERTO com o mesmo contato.
CREATE INDEX IF NOT EXISTS leads_email_norm_idx ON leads (email_norm);
CREATE INDEX IF NOT EXISTS leads_phone_norm_idx ON leads (phone_norm);
CREATE INDEX IF NOT EXISTS leads_status_pos_idx ON leads (status, board_position);
CREATE INDEX IF NOT EXISTS leads_owner_idx      ON leads (owner_id);
CREATE INDEX IF NOT EXISTS leads_next_contact_idx ON leads (next_contact_at)
  WHERE next_contact_at IS NOT NULL;

-- Histórico do lead ----------------------------------------------------------
-- Toda mudança relevante vira uma linha aqui. `user_id` nulo = ação do próprio
-- site (visitante preencheu o formulário), não de um membro da equipe.
CREATE TABLE IF NOT EXISTS lead_activities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  type        text NOT NULL,
  description text,
  from_value  text,
  to_value    text,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT lead_activities_type_check CHECK (
    type IN ('created','status_changed','owner_changed','note','contact',
             'follow_up_scheduled','message_received','converted','updated')
  )
);

CREATE INDEX IF NOT EXISTS lead_activities_lead_idx ON lead_activities (lead_id, created_at DESC);

-- Mensagens do formulário público -------------------------------------------
-- Nome `contact_messages` e não `messages`: já existe uma tabela `messages`
-- neste banco, herdada da migração Supabase→Neon de julho/2026, com schema
-- incompatível (colunas em português) e zero linhas. Ela é órfã desde a
-- reescrita do site, mas apagá-la é decisão de quem opera, não desta migration.
-- Guarda o que o visitante escreveu, mesmo que o lead seja depois mesclado
-- num existente. `payload` preserva as respostas do briefing sem exigir uma
-- coluna nova a cada pergunta adicionada no site.
CREATE TABLE IF NOT EXISTS contact_messages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id          uuid REFERENCES leads(id) ON DELETE SET NULL,
  name             text,
  email            text,
  phone            text,
  company_name     text,
  service_interest text,
  body             text,
  payload          jsonb,
  source           text NOT NULL DEFAULT 'website',
  ip               text,
  user_agent       text,
  read             boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contact_messages_lead_idx    ON contact_messages (lead_id);
CREATE INDEX IF NOT EXISTS contact_messages_unread_idx  ON contact_messages (created_at DESC) WHERE read = false;

-- Limite de envios do formulário público -------------------------------------
-- Mesma razão do login: serverless não tem memória entre invocações.
CREATE TABLE IF NOT EXISTS form_submissions (
  id           bigserial PRIMARY KEY,
  ip           text,
  email_norm   text,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS form_submissions_ip_time_idx ON form_submissions (ip, submitted_at DESC);
