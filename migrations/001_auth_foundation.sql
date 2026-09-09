-- ============================================================================
-- Sprint 01 — Fundação de segurança do Pulsari Operations
-- Single-company com RBAC. NÃO usar tenant_id / organization_id.
-- Aditiva: não altera nem remove messages, portfolio_projects ou app_settings.
-- ============================================================================

-- Controle de versão das próprias migrations -------------------------------
CREATE TABLE IF NOT EXISTS schema_migrations (
  version    text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

-- Usuários -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  email         text NOT NULL,
  password_hash text NOT NULL,
  role          text NOT NULL,
  status        text NOT NULL DEFAULT 'active',
  last_login_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_role_check   CHECK (role IN ('admin','manager','developer','financial','commercial')),
  CONSTRAINT users_status_check CHECK (status IN ('active','inactive','suspended'))
);

-- E-mail único e case-insensitive: evita cadastrar Ana@x.com e ana@x.com.
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_key ON users (lower(email));

-- Sessões server-side ------------------------------------------------------
-- Guardamos o SHA-256 do token, nunca o token em si: um dump do banco não
-- permite sequestrar sessões. Revogação é imediata (logout, desativação).
CREATE TABLE IF NOT EXISTS sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash    text NOT NULL UNIQUE,
  expires_at    timestamptz NOT NULL,
  revoked_at    timestamptz,
  ip            text,
  user_agent    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx    ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at);

-- Tentativas de login ------------------------------------------------------
-- Serverless não tem memória entre invocações; o rate limit precisa de store.
CREATE TABLE IF NOT EXISTS login_attempts (
  id            bigserial PRIMARY KEY,
  email         text,
  ip            text,
  successful    boolean NOT NULL DEFAULT false,
  attempted_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS login_attempts_email_time_idx ON login_attempts (lower(email), attempted_at DESC);
CREATE INDEX IF NOT EXISTS login_attempts_ip_time_idx    ON login_attempts (ip, attempted_at DESC);

-- Vínculo usuário ↔ projeto ------------------------------------------------
-- Primitivo para o papel DEVELOPER ("projetos aos quais estiver vinculado").
-- A tabela projects só nasce na Sprint 02, por isso não há FK para ela ainda.
CREATE TABLE IF NOT EXISTS project_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_members_unique UNIQUE (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS project_members_user_idx ON project_members (user_id);
