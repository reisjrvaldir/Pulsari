-- ============================================================================
-- Correção P1 da auditoria — card não pode referenciar sprint de outro projeto
--
-- Achado: `project_cards.project_id` e `project_cards.sprint_id` eram chaves
-- estrangeiras independentes. Nada impedia um card do projeto B apontar para
-- uma sprint do projeto A — confirmado por ataque direto ao banco.
--
-- Consequência: o card apareceria no kanban do projeto errado, e a contagem
-- de progresso da sprint somaria trabalho de outro cliente.
--
-- A correção é uma chave estrangeira composta: o par (sprint_id, project_id)
-- do card precisa existir como par em `sprints`. Fica impossível por
-- construção, sem depender de validação na aplicação — que, aliás, ainda não
-- existe para este módulo.
-- ============================================================================

-- Pré-requisito da FK composta: o par precisa ser único na tabela de origem.
-- `id` já é PK, então o par (id, project_id) é trivialmente único; a restrição
-- existe apenas para o Postgres aceitar referenciá-lo.
ALTER TABLE sprints
  DROP CONSTRAINT IF EXISTS sprints_id_project_key;
ALTER TABLE sprints
  ADD CONSTRAINT sprints_id_project_key UNIQUE (id, project_id);

-- Limpa qualquer vínculo cruzado já existente antes de impor a regra.
-- Sem isto o ALTER falharia em banco com dado inconsistente.
UPDATE project_cards c
   SET sprint_id = NULL, sprint_stage = NULL, card_type = 'standalone', status = 'todo'
 WHERE c.sprint_id IS NOT NULL
   AND NOT EXISTS (
     SELECT 1 FROM sprints s
      WHERE s.id = c.sprint_id AND s.project_id = c.project_id
   );

ALTER TABLE project_cards
  DROP CONSTRAINT IF EXISTS project_cards_sprint_do_projeto_fk;
ALTER TABLE project_cards
  ADD CONSTRAINT project_cards_sprint_do_projeto_fk
  FOREIGN KEY (sprint_id, project_id) REFERENCES sprints (id, project_id)
  ON DELETE SET NULL;
