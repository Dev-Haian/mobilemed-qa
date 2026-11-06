# QA – Plataforma Médica Mobilemed

Solução do teste técnico de QA da Mobilemed: plano de testes, cenários em Gherkin, testes automatizados de **API** e **E2E** com Playwright e um relatório de defeitos, tudo rodando no **GitHub Actions** contra a aplicação real (PostgreSQL 17 + NestJS + Angular).

Autor: **Haian Vilas Boas**

## Resultado

**65 testes automatizados** (59 de API e 6 de E2E): 43 passaram e 22 falharam, revelando **14 defeitos**. Foram 11 confirmados e 3 bloqueados por um defeito crítico. O principal: **o cadastro de exames responde 201 mas não grava nada**. Detalhes, evidências e sugestões de correção em [`docs/relatorio-de-bugs.md`](docs/relatorio-de-bugs.md).

## O que tem aqui

| Pasta | Conteúdo |
|---|---|
| `docs/plano-de-testes.md` | Escopo, análise de risco, técnicas, critérios e ambiguidades levantadas |
| `features/` | Cenários BDD (Gherkin) de autenticação, pacientes e exames |
| `tests/api/` | Testes de API: autenticação, pacientes, exames, idempotência e segurança |
| `tests/e2e/` | Testes de interface com Page Objects: login, cadastro de paciente e de exame |
| `docs/relatorio-de-bugs.md` | Defeitos com severidade, passos, causa provável e sugestão de correção |
| `.github/workflows/qa.yml` | Pipeline que sobe a aplicação e roda todos os testes |

## Como os testes rodam no CI
1. Sobe um **PostgreSQL 17** como serviço.
2. Faz checkout do repositório do desafio, roda **migrations e seeds** e inicia a API (`:3000`) e o front (`:4200`).
3. Executa os testes com Playwright.
4. Publica o **resumo na página da execução** e o relatório HTML, traces, vídeos e logs como artefato (`relatorio-qa`).

## Como rodar localmente
Com a aplicação do desafio rodando (passos do README dela):

```bash
npm install
npx playwright install chromium
npm run test:api     # só API
npm run test:e2e     # só interface
npm run report       # abre o relatório HTML
```

Variáveis opcionais: `API_URL` (padrão `http://localhost:3000`) e `WEB_URL` (padrão `http://localhost:4200`).

## Decisões
- **Os testes descrevem o comportamento esperado**, não o atual. Um teste que falha é um defeito, documentado em `docs/relatorio-de-bugs.md`.
- **Dados isolados por execução:** CPFs válidos gerados aleatoriamente (com dígitos verificadores) e chaves de idempotência únicas, para os testes não dependerem uns dos outros.
- **Prioridade por risco:** em uma plataforma de saúde, duplicidade de registros, integridade dos dados e exposição de informação vêm primeiro.
- **Ambiguidades** do enunciado estão listadas no plano de testes (AMB01 a AMB06), com o comportamento que assumi em cada uma.
