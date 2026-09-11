-- ============================================================================
-- Correção da Sprint 03 — fases da sprint realmente imutáveis
--
-- O gatilho da 003 cobria UPDATE e DELETE, mas não INSERT: era possível
-- acrescentar uma nona fase e quebrar a regra de "exatamente 8 colunas" do
-- kanban. Encontrado ao testar as restrições contra o banco real.
--
-- O gatilho novo recusa qualquer alteração e qualquer inserção fora dos 8
-- códigos canônicos. Permitir a inserção dos canônicos mantém a 003
-- reexecutável — um BEFORE INSERT que recusasse tudo faria o seed dela falhar.
-- ============================================================================

DROP TRIGGER IF EXISTS sprint_stages_bloqueio ON sprint_stages;

CREATE OR REPLACE FUNCTION pulsari_sprint_stages_imutavel() RETURNS trigger
  LANGUAGE plpgsql AS $$
  BEGIN
    IF TG_OP = 'INSERT' THEN
      IF NEW.code IN ('planning','definition','development','testing',
                      'bugfix','review','delivery','retrospective') THEN
        RETURN NEW;
      END IF;
      RAISE EXCEPTION
        'As 8 fases da sprint são fixas. Código recusado: %', NEW.code;
    END IF;

    RAISE EXCEPTION 'As fases da sprint são fixas e não podem ser alteradas.';
  END;
  $$;

-- Remove qualquer fase fora do conjunto canônico antes de religar o bloqueio.
-- Sem o gatilho ativo neste ponto, o DELETE passa.
DELETE FROM sprint_stages
 WHERE code NOT IN ('planning','definition','development','testing',
                    'bugfix','review','delivery','retrospective');

CREATE TRIGGER sprint_stages_bloqueio
  BEFORE INSERT OR UPDATE OR DELETE ON sprint_stages
  FOR EACH ROW EXECUTE FUNCTION pulsari_sprint_stages_imutavel();
