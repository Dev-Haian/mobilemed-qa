# QA – Plataforma Médica Mobilemed

![Testes](https://img.shields.io/badge/testes-78-blue) ![Passaram](https://img.shields.io/badge/passaram-51-brightgreen) ![Falharam](https://img.shields.io/badge/falharam%20(defeitos)-27-red) ![Defeitos](https://img.shields.io/badge/defeitos-17-orange) ![Responsivo](https://img.shields.io/badge/mobile%20%2B%20tablet-testado-blueviolet) ![A11y](https://img.shields.io/badge/acessibilidade-axe--core-informational) ![Playwright](https://img.shields.io/badge/Playwright-API%20%2B%20E2E-2EAD33?logo=playwright) ![CI](https://github.com/Dev-Haian/mobilemed-qa/actions/workflows/qa.yml/badge.svg)

Solução do teste técnico de QA da Mobilemed. O projeto testa a aplicação **real**: o GitHub Actions sobe o PostgreSQL 17, a API NestJS e o front Angular do desafio e roda **78 testes automatizados** de API e de interface com Playwright, incluindo **responsividade** (celular e tablet) e **acessibilidade** (WCAG 2.1 AA).

**Autor:** Haian Vilas Boas · [LinkedIn](https://www.linkedin.com/in/haian-vilas-boas-806647221/)

---

## Resumo executivo

- **78 testes** (58 de API, 10 de interface no desktop e 10 de responsividade em celular e tablet): **51 passaram** e **27 falharam**. Cada falha é um defeito real, documentado.
- **17 defeitos encontrados:** 1 crítico, 6 altos, 7 médios e 3 baixos. Foram 14 confirmados na execução e 3 bloqueados pelo defeito crítico.
- **A interface não é responsiva**, apesar de o README do desafio prometer: no celular, o menu lateral fixo deixa só 177px de 412px para o conteúdo.
- **Defeito crítico:** o cadastro de exames responde **201 Created, mas não grava o exame**. Pela interface aparece a mensagem de sucesso, e o exame não existe.
- **Risco de LGPD:** as respostas de erro devolvem o **stack trace** da aplicação, numa plataforma com dados de saúde.

📄 [Resultados detalhados](docs/resultados.md) · 🐞 [Relatório de defeitos](docs/relatorio-de-bugs.md) · 🧭 [Plano de testes](docs/plano-de-testes.md) · 🥒 [Cenários BDD](features/)

---

## Resultados por área

| Projeto | Área | Testes | ✅ | ❌ |
|---|---|---:|---:|---:|
| API | Autenticação | 6 | 4 | 2 |
| API | Pacientes · cadastro | 12 | 7 | 5 |
| API | Pacientes · consulta e paginação | 9 | 6 | 3 |
| API | Exames · cadastro e modalidades DICOM | 20 | 16 | 4 |
| API | Exames · consulta | 3 | 2 | 1 |
| API | Idempotência e concorrência | 4 | 1 | 3 |
| API | Segurança e privacidade (LGPD) | 4 | 2 | 2 |
| E2E | Login | 3 | 3 | 0 |
| E2E | Pacientes e exames pela interface | 4 | 2 | 2 |
| E2E | Acessibilidade (axe-core, WCAG 2.1 AA) | 3 | 1 | 2 |
| Mobile | Responsividade (Pixel 7, 412px) | 5 | 3 | 2 |
| Tablet | Responsividade (768px) | 5 | 4 | 1 |
| | **Total** | **78** | **51** | **27** |

## Defeitos encontrados

| ID | Defeito | Severidade | Status |
|---|---|---|---|
| BUG01 | Cadastro de exame responde 201, mas não grava o exame | 🔴 Crítica | ✅ Confirmado |
| BUG02 | Busca por id de paciente e de exame retorna 500 | 🟠 Alta | ✅ Confirmado |
| BUG03 | Documento duplicado retorna 500 em vez de 409 | 🟠 Alta | ✅ Confirmado |
| BUG04 | Exame para paciente inexistente não é tratado | 🟠 Alta | ⏸️ Bloqueado pelo BUG01 |
| BUG05 | Condição de corrida na idempotência | 🟠 Alta | ⏸️ Bloqueado pelo BUG01 |
| BUG06 | Respostas de erro expõem stack trace | 🟠 Alta | ✅ Confirmado |
| BUG07 | API aceita CPF inválido (validação só no front) | 🟡 Média | ✅ Confirmado |
| BUG08 | Cliente consegue falsificar a auditoria (`createdBy`) | 🟡 Média | ✅ Confirmado |
| BUG09 | Front: editar um paciente substitui outro na lista | 🟡 Média | ✅ Confirmado |
| BUG10 | `GET /exames` ignora a paginação documentada | 🟡 Média | ⏸️ Mascarado pelo BUG01 |
| BUG13 | Campos acima do limite do banco retornam 500 | 🟡 Média | ✅ Confirmado |
| BUG11 | Página vazia retorna 404 e `pageSize` sem limite | 🟢 Baixa | ✅ Confirmado |
| BUG12 | Login inválido retorna 404 em vez de 401 | 🟢 Baixa | ✅ Confirmado |
| BUG14 | E-mail do usuário exposto na resposta do login | 🟢 Baixa | ✅ Confirmado |
| BUG15 | Interface não é responsiva: menu lateral fixo ocupa a tela no celular | 🟠 Alta | ✅ Confirmado |
| BUG16 | Campo de busca ultrapassa a largura da tela no celular | 🟡 Média | ✅ Confirmado |
| BUG17 | Acessibilidade: 57 botões sem nome, contraste e autocomplete | 🟡 Média | ✅ Confirmado |

Cada defeito tem passos para reproduzir, causa provável no código e sugestão de correção no [relatório](docs/relatorio-de-bugs.md).

### Responsividade no celular

| Login (ok) | Lista de pacientes (BUG15) |
|---|---|
| <img src="docs/evidencias/mobile-login.png" width="260"> | <img src="docs/evidencias/mobile-pacientes.png" width="260"> |

No celular, o login se adapta à tela, mas nas páginas internas o menu lateral fica sempre aberto e ocupa mais da metade da largura.

---

## Como foi feito

```mermaid
flowchart LR
    A[Leitura do código<br/>e do README] --> B[Análise de risco<br/>e hipóteses de defeito]
    B --> C[Cenários BDD<br/>em Gherkin]
    C --> D[Testes de API e E2E<br/>com Playwright]
    D --> E[GitHub Actions:<br/>Postgres + API + Front]
    E --> F[Relatório HTML,<br/>traces e vídeos]
    F --> G[Confirmação dos<br/>defeitos com evidência]
```

1. **Análise estática do código** para levantar hipóteses de defeito antes de executar.
2. **Priorização por risco:** em plataforma de saúde, duplicidade de registros, integridade dos dados e vazamento de informação vêm primeiro.
3. **Técnicas:** partição de equivalência, valor-limite (tamanhos máximos do banco e paginação), tabela de decisão (idempotência) e teste de concorrência (10 requisições simultâneas com a mesma chave).
4. **Dados isolados:** CPFs válidos gerados a cada execução (com dígitos verificadores) e chaves de idempotência únicas.
5. **Os testes descrevem o comportamento esperado.** Um teste que falha é um defeito, não um teste quebrado.

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `docs/` | Plano de testes, relatório de defeitos, resultados da execução e prints de evidência |
| `features/` | Cenários BDD (Gherkin) de autenticação, pacientes e exames |
| `tests/api/` | Autenticação, pacientes, exames, idempotência e segurança |
| `tests/e2e/` | Interface com Page Objects: login, pacientes e exames, responsividade (celular e tablet) e acessibilidade (axe-core) |
| `tests/support/` | Geração de dados (CPF válido, chaves) e helpers de API |
| `.github/workflows/qa.yml` | Pipeline que sobe a aplicação e roda tudo |

## Evidências
Cada execução no [GitHub Actions](https://github.com/Dev-Haian/mobilemed-qa/actions) publica:
- **um resumo na própria página da execução**, com a tabela de testes;
- **o artefato `relatorio-qa`**, com o relatório HTML do Playwright, os traces, os vídeos das falhas de interface e os logs da API e do front.

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

## Ambiguidades levantadas
Listadas no [plano de testes](docs/plano-de-testes.md#7-ambiguidades-levantadas-para-alinhar-com-produto) (AMB01 a AMB06), com o comportamento que assumi em cada uma. Exemplo: o que deve acontecer quando a mesma `idempotencyKey` chega com dados diferentes?
