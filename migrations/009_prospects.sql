-- ============================================================================
-- Sprint 07 — Captação e prospecção
--
-- Prospect é quem a Pulsari foi buscar; lead é quem procurou a Pulsari. São
-- tabelas distintas de propósito: misturar os dois falsearia a taxa de
-- conversão do funil de entrada, que é o número que diz se o site funciona.
--
-- A passagem de um para o outro é explícita (prospect → lead), e registrada.
-- ============================================================================

-- Score -----------------------------------------------------------------------
-- Determinístico e auditável: cada fator vale um número fixo, e a soma é
-- calculada pelo próprio banco como coluna gerada. Assim o score nunca fica
-- defasado do dado, mesmo que alguém escreva por fora da API.
--
-- A tradução de cada fator em texto vive em api/_lib/prospects.js, e um teste
-- de paridade impede que as duas implementações divirjam.
--
-- Pesos: contato alcançável pesa mais que presença digital, porque prospect
-- sem forma de contato não é prospect, é anotação.
CREATE OR REPLACE FUNCTION pulsari_prospect_score(
  p_email text, p_phone text, p_website text, p_social text,
  p_segment text, p_city text, p_source text, p_notes text
) RETURNS integer
  LANGUAGE sql IMMUTABLE AS $$
    SELECT least(
      100,
      (CASE WHEN nullif(btrim(coalesce(p_email,'')),'')   IS NOT NULL THEN 20 ELSE 0 END) +
      (CASE WHEN nullif(btrim(coalesce(p_phone,'')),'')   IS NOT NULL THEN 20 ELSE 0 END) +
      (CASE WHEN nullif(btrim(coalesce(p_website,'')),'') IS NOT NULL THEN 10 ELSE 0 END) +
      (CASE WHEN nullif(btrim(coalesce(p_social,'')),'')  IS NOT NULL THEN  5 ELSE 0 END) +
      (CASE WHEN nullif(btrim(coalesce(p_segment,'')),'') IS NOT NULL THEN 10 ELSE 0 END) +
      (CASE WHEN nullif(btrim(coalesce(p_city,'')),'')    IS NOT NULL THEN  5 ELSE 0 END) +
      (CASE lower(coalesce(p_source,''))
         WHEN 'indicacao' THEN 20
         WHEN 'evento'    THEN 15
         WHEN 'inbound'   THEN 15
         WHEN 'pesquisa'  THEN 10
         WHEN 'lista'     THEN  5
         ELSE 0 END) +
      (CASE WHEN length(btrim(coalesce(p_notes,''))) >= 20 THEN 10 ELSE 0 END)
    )
  $$;

-- Remoção de acento para comparação de nomes.
-- `unaccent()` do Postgres é STABLE, não IMMUTABLE, e por isso não pode ser
-- usado em coluna gerada. `translate` é imutável e cobre o português.
CREATE OR REPLACE FUNCTION pulsari_sem_acento(v text) RETURNS text
  LANGUAGE sql IMMUTABLE AS $$
    SELECT translate(
      coalesce(v, ''),
      'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
      'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'
    )
  $$;

-- Prospects -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prospects (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name  text NOT NULL,
  contact_name  text,
  email         text,
  phone         text,
  website       text,
  social        text,
  source        text NOT NULL DEFAULT 'pesquisa',
  segment       text,
  city          text,
  status        text NOT NULL DEFAULT 'new',
  owner_id      uuid REFERENCES users(id) ON DELETE SET NULL,
  notes         text,

  next_contact_at timestamptz,
  last_contact_at timestamptz,

  -- Preenchidos na conversão; é o que a torna idempotente.
  converted_lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  converted_at      timestamptz,

  created_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  email_norm    text GENERATED ALWAYS AS (pulsari_norm_email(email)) STORED,
  phone_norm    text GENERATED ALWAYS AS (pulsari_norm_phone(phone)) STORED,
  -- Nome da empresa sem acento, caixa nem pontuação. Serve para um aviso de
  -- possível duplicata, não para bloquear: é heurística, e imperfeita por
  -- natureza. "Café & Cia." vira `cafecia`, mas "Cafe e Cia" vira `cafeecia`
  -- — o & some e o "e" fica. A trava real de duplicidade é o e-mail.
  company_norm  text GENERATED ALWAYS AS (
    nullif(regexp_replace(lower(pulsari_sem_acento(company_name)), '[^a-z0-9]', '', 'g'), '')
  ) STORED,

  score         integer GENERATED ALWAYS AS (
    pulsari_prospect_score(email, phone, website, social, segment, city, source, notes)
  ) STORED,

  CONSTRAINT prospects_status_check CHECK (
    status IN ('new','researching','contacted','interested','converted','discarded')
  ),
  CONSTRAINT prospects_source_check CHECK (
    source IN ('indicacao','evento','inbound','pesquisa','lista','outro')
  ),
  CONSTRAINT prospects_converted_check CHECK (
    status <> 'converted' OR converted_lead_id IS NOT NULL
  )
);

-- Duplicidade: e-mail é único quando existe. Empresa e telefone são índices
-- de busca, não travas — a mesma empresa pode ter dois contatos legítimos.
CREATE UNIQUE INDEX IF NOT EXISTS prospects_email_norm_key
  ON prospects (email_norm) WHERE email_norm IS NOT NULL;
CREATE INDEX IF NOT EXISTS prospects_company_norm_idx ON prospects (company_norm);
CREATE INDEX IF NOT EXISTS prospects_phone_norm_idx   ON prospects (phone_norm);
CREATE INDEX IF NOT EXISTS prospects_status_score_idx ON prospects (status, score DESC);
CREATE INDEX IF NOT EXISTS prospects_owner_idx        ON prospects (owner_id);
CREATE INDEX IF NOT EXISTS prospects_next_contact_idx
  ON prospects (next_contact_at) WHERE next_contact_at IS NOT NULL;

-- Histórico -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prospect_activities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  type        text NOT NULL,
  description text,
  from_value  text,
  to_value    text,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT prospect_activities_type_check CHECK (
    type IN ('created','imported','status_changed','owner_changed','note',
             'contact','follow_up_scheduled','converted','updated')
  )
);

CREATE INDEX IF NOT EXISTS prospect_activities_prospect_idx
  ON prospect_activities (prospect_id, created_at DESC);

-- Importações -----------------------------------------------------------------
-- Cada arquivo processado vira uma linha, com o resumo do que entrou e do que
-- foi recusado. Sem isto, "importei 300 e apareceram 240" não tem resposta.
CREATE TABLE IF NOT EXISTS prospect_imports (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename      text,
  total_linhas  integer NOT NULL DEFAULT 0,
  importados    integer NOT NULL DEFAULT 0,
  duplicados    integer NOT NULL DEFAULT 0,
  invalidos     integer NOT NULL DEFAULT 0,
  erros         jsonb,
  created_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);
