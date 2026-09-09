# CI

`ci.yml` roda em todo pull request e em todo push para `main`:
lint (oxlint) → testes (vitest) → build (tsc + vite).

Os testes não tocam banco: as rotas são exercitadas contra um dublê do cliente
Neon (`tests/helpers/fakeSql.js`), então o CI não precisa de `DATABASE_URL`
nem de segredo nenhum configurado.
