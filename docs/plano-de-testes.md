# Plano de testes – Plataforma Médica Mobilemed

## 1. Objetivo
Verificar se a plataforma de pacientes e exames de imagem atende às regras de negócio do README e se é **segura e confiável** para dados de saúde, que são dados pessoais sensíveis pela LGPD (art. 5º, II).

## 2. Escopo

| Dentro do escopo | Fora do escopo |
|---|---|
| Autenticação JWT (`POST /auth/login`) e proteção das rotas | Teste de carga e estresse |
| Pacientes: cadastro, unicidade do documento, validações, paginação, busca por id | Compatibilidade entre navegadores |
| Exames: cadastro, modalidades DICOM, paciente inexistente, idempotência e concorrência | Auditoria manual de acessibilidade |
| Tratamento de erros e exposição de dados | Testes de invasão |
| Fluxos principais da interface (login, paciente, exame) | Upload e visualização de imagens DICOM |
| Responsividade em celular (412px) e tablet (768px) | Navegadores além do Chromium |
| Acessibilidade automática (axe-core, WCAG 2.1 AA) | Auditoria manual de acessibilidade com leitor de tela |

## 3. Análise de risco (o que priorizei e por quê)

| Risco | Impacto | Probabilidade | Prioridade |
|---|---|---|---|
| Exame duplicado ou perdido (falha de idempotência e concorrência) | Alto: laudo em duplicidade ou histórico incompleto | Média | **P1** |
| Paciente duplicado (documento repetido) | Alto: histórico clínico dividido | Média | **P1** |
| Exame vinculado a paciente inexistente | Alto: dado órfão | Média | **P1** |
| Vazamento de informação interna em erro (stack trace, SQL) | Alto: segurança e LGPD | Alta (verificado no código) | **P1** |
| Rotas acessíveis sem autenticação | Alto | Baixa | P2 |
| Validação só no front (CPF) | Médio: dados inconsistentes via API | Alta | P2 |
| Paginação incorreta ou sem limite | Médio: dados faltando ou sobrecarga | Média | P2 |
| Divergência entre documentação e API | Médio: integrações quebradas | Alta | P3 |

## 4. Estratégia e técnicas
- **Análise estática do código-fonte** antes de executar, para levantar hipóteses de defeito e direcionar os casos de teste.
- **Partição de equivalência e valor-limite:** tamanhos máximos do banco (nome 150, documento 32, chave 128), paginação (0, 1, negativo, texto, muito grande).
- **Tabela de decisão:** idempotência (chave nova, repetida, com mesmos dados, com dados diferentes, simultânea).
- **Teste de concorrência:** 10 requisições paralelas com a mesma chave.
- **Teste de contrato:** README × comportamento real da API.
- **Testes exploratórios guiados por risco** na interface.

## 5. Níveis e ferramentas
| Nível | Ferramenta | Pasta |
|---|---|---|
| API (integração) | Playwright `request` | `tests/api` |
| E2E (interface) | Playwright + Page Objects | `tests/e2e` |
| Especificação | Gherkin (BDD) | `features/` |
| Execução contínua | GitHub Actions (PostgreSQL 17 + API + front) | `.github/workflows/qa.yml` |

## 6. Critérios
- **Entrada:** aplicação sobe com migrations e seeds; login do seed funcionando.
- **Saída:** todos os casos P1 executados; defeitos registrados com evidência, severidade e passos para reproduzir.

## 7. Ambiguidades levantadas (para alinhar com Produto)
- **AMB01:** mesma `idempotencyKey` com dados diferentes deve devolver o original ou recusar com 409/422?
- **AMB02:** listagem vazia deve retornar 200 com `[]` ou 404? (adotei 200, padrão REST)
- **AMB03:** qual é o limite máximo de `pageSize`?
- **AMB04:** login inválido deve retornar 401? (hoje o código indica 404)
- **AMB05:** `PUT`/`DELETE` e `/user-system` existem, mas não estão no README. Fazem parte do produto?
- **AMB06:** excluir paciente apaga os exames em cascata. Isso é permitido para prontuário médico, que tem guarda obrigatória?
