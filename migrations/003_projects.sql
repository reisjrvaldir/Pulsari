-- ============================================================================
-- Sprint 03 — Gestão de projetos, sprints e kanban
--
-- Duas formas de organizar demanda, deliberadamente separadas:
--   SPRINT     → card percorre as 8 fases do método
--   AVULSO     → demanda solta, fluxo curto (todo → done)
--
-- O kanban de projeto NÃO se mistura com o kanban do CRM: são tabelas,
-- colunas e telas distintas.
-- ============================================================================

-- Projetos -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  -- De onde veio o negócio. Mantém a linha CRM → projeto rastreável.
  lead_id        uuid REFERENCES leads(id) ON DELETE SET NULL,
  name           text NOT NULL,
  description    text,
  value          numeric(12,2),
  status         text NOT NULL DEFAULT 'planning',
  payment_status text NOT NULL DEFAULT 'pending',
  start_date     date,
  due_date       date,
  created_by     uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT projects_status_check CHECK (
    status IN ('planning','active','paused','completed','cancelled')
  ),
  CONSTRAINT projects_payment_check CHECK (
    payment_status IN ('pending','partial','paid','overdue','cancelled')
  ),
  -- Prazo antes do início é sempre erro de digitação.
  CONSTRAINT projects_dates_check CHECK (
    start_date IS NULL OR due_date IS NULL OR due_date >= start_date
  )
);

CREATE INDEX IF NOT EXISTS projects_client_idx ON projects (client_id);
CREATE INDEX IF NOT EXISTS projects_status_idx ON projects (status);
CREATE INDEX IF NOT EXISTS projects_lead_idx   ON projects (lead_id);

-- Equipe do projeto ----------------------------------------------------------
-- A tabela nasceu na Sprint 01 como primitivo do RBAC (papel developer só
-- alcança projeto em que esteja vinculado). Agora que `projects` existe,
-- ganha a chave estrangeira que faltava e o papel dentro do projeto.
ALTER TABLE project_members
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member';

ALTER TABLE project_members
  DROP CONSTRAINT IF EXISTS project_members_role_check;
ALTER TABLE project_members
  ADD CONSTRAINT project_members_role_check
  CHECK (role IN ('lead','member','observer'));

ALTER TABLE project_members
  DROP CONSTRAINT IF EXISTS project_members_project_fk;
ALTER TABLE project_members
  ADD CONSTRAINT project_members_project_fk
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Sprints --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sprints (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  number       integer NOT NULL,
  name         text NOT NULL,
  goal         text,
  description  text,
  status       text NOT NULL DEFAULT 'planning',
  start_date   date,
  due_date     date,
  started_at   timestamptz,
  completed_at timestamptz,
  created_by   uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT sprints_status_check CHECK (
    status IN ('planning','active','completed','cancelled')
  ),
  CONSTRAINT sprints_number_check CHECK (number > 0)
);

-- Numeração por projeto. É esta restrição — e não um cuidado na aplicação —
-- que impede duas "Sprint 03" no mesmo projeto: duas criações simultâneas
-- calculam max+1 igual, e o banco recusa a segunda, que então recalcula.
CREATE UNIQUE INDEX IF NOT EXISTS sprints_project_number_key
  ON sprints (project_id, number);
CREATE INDEX IF NOT EXISTS sprints_project_status_idx ON sprints (project_id, status);

-- Fases da sprint ------------------------------------------------------------
-- Tabela de referência apenas para leitura: os códigos são o método de
-- trabalho da Pulsari e não podem ser editados pela interface. O gatilho
-- abaixo recusa qualquer alteração, inclusive por SQL direto na aplicação.
CREATE TABLE IF NOT EXISTS sprint_stages (
  code       text PRIMARY KEY,
  position   integer NOT NULL UNIQUE,
  label_pt   text NOT NULL
);

INSERT INTO sprint_stages (code, position, label_pt) VALUES
  ('planning',      1, 'Planejamento'),
  ('definition',    2, 'Definição das tarefas'),
  ('development',   3, 'Desenvolvimento'),
  ('testing',       4, 'Testes'),
  ('bugfix',        5, 'Correção de bugs'),
  ('review',        6, 'Revisão'),
  ('delivery',      7, 'Entrega'),
  ('retrospective', 8, 'Retrospectiva')
ON CONFLICT (code) DO NOTHING;

CREATE OR REPLACE FUNCTION pulsari_sprint_stages_imutavel() RETURNS trigger
  LANGUAGE plpgsql AS $$
  BEGIN
    RAISE EXCEPTION 'As fases da sprint são fixas e não podem ser alteradas.';
  END;
  $$;

DROP TRIGGER IF EXISTS sprint_stages_bloqueio ON sprint_stages;
CREATE TRIGGER sprint_stages_bloqueio
  BEFORE UPDATE OR DELETE ON sprint_stages
  FOR EACH ROW EXECUTE FUNCTION pulsari_sprint_stages_imutavel();

-- Cards ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_cards (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sprint_id    uuid REFERENCES sprints(id) ON DELETE SET NULL,
  sprint_stage text REFERENCES sprint_stages(code),
  title        text NOT NULL,
  description  text,
  card_type    text NOT NULL,
  status       text NOT NULL DEFAULT 'todo',
  priority     text NOT NULL DEFAULT 'medium',
  assigned_to  uuid REFERENCES users(id) ON DELETE SET NULL,
  position     integer NOT NULL DEFAULT 0,
  due_date     date,
  created_by   uuid REFERENCES users(id) ON DELETE SET NULL,
  completed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT project_cards_type_check CHECK (card_type IN ('sprint','standalone')),
  CONSTRAINT project_cards_priority_check CHECK (
    priority IN ('low','medium','high','critical')
  ),

  -- A regra central da sprint 03, expressa no banco em vez de só na aplicação:
  -- card de sprint tem fase; card avulso não tem sprint nem fase. Impede que
  -- um avulso apareça no meio das 8 colunas por engano.
  CONSTRAINT project_cards_shape_check CHECK (
    (card_type = 'sprint'     AND sprint_id IS NOT NULL AND sprint_stage IS NOT NULL) OR
    (card_type = 'standalone' AND sprint_id IS NULL     AND sprint_stage IS NULL)
  ),

  -- Cada tipo tem seu próprio conjunto de estados.
  CONSTRAINT project_cards_status_check CHECK (
    (card_type = 'sprint'     AND status IN ('open','done')) OR
    (card_type = 'standalone' AND status IN ('todo','in_progress','review','done'))
  ),

  -- Concluído precisa de data; não concluído não pode ter.
  CONSTRAINT project_cards_completed_check CHECK (
    (status = 'done' AND completed_at IS NOT NULL) OR
    (status <> 'done' AND completed_at IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS project_cards_project_idx  ON project_cards (project_id);
CREATE INDEX IF NOT EXISTS project_cards_sprint_idx   ON project_cards (sprint_id, sprint_stage, position);
CREATE INDEX IF NOT EXISTS project_cards_assigned_idx ON project_cards (assigned_to);
CREATE INDEX IF NOT EXISTS project_cards_standalone_idx
  ON project_cards (project_id, status, position) WHERE card_type = 'standalone';

-- Retrospectiva --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sprint_retrospectives (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id        uuid NOT NULL UNIQUE REFERENCES sprints(id) ON DELETE CASCADE,
  what_went_well   text,
  what_went_wrong  text,
  improvements     text,
  notes            text,
  created_by       uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Histórico do projeto -------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_activity (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sprint_id   uuid REFERENCES sprints(id) ON DELETE SET NULL,
  card_id     uuid REFERENCES project_cards(id) ON DELETE SET NULL,
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  type        text NOT NULL,
  description text,
  from_value  text,
  to_value    text,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT project_activity_type_check CHECK (
    type IN ('project_created','sprint_created','sprint_started','sprint_completed',
             'card_created','card_moved','card_assigned','card_due_changed',
             'card_completed','card_converted','retrospective_saved','member_added',
             'member_removed','project_updated')
  )
);

CREATE INDEX IF NOT EXISTS project_activity_project_idx ON project_activity (project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS project_activity_sprint_idx  ON project_activity (sprint_id, created_at DESC);
