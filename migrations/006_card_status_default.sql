-- ============================================================================
-- Correção da Sprint 03 — status do card sem default contraditório
--
-- `project_cards.status` nascia com DEFAULT 'todo', mas a restrição
-- project_cards_status_check só aceita 'todo' para card avulso: card de
-- sprint usa 'open'/'done'. Criar um card de sprint sem informar status
-- estourava a própria restrição da tabela.
--
-- Não existe default correto para os dois tipos, porque o valor válido
-- depende de card_type. Tirar o default obriga quem insere a declarar — e o
-- erro, quando falta, passa a ser "status não informado" em vez de uma
-- violação de restrição confusa.
-- ============================================================================

ALTER TABLE project_cards ALTER COLUMN status DROP DEFAULT;
