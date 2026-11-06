# Relatório de defeitos – Mobilemed

> **Status:** defeitos confirmados executando os testes no GitHub Actions contra a aplicação real (PostgreSQL 17 + API + front).
> Resultado da execução: **65 testes, 43 passaram e 22 falharam**. Cada falha corresponde a um defeito abaixo. O relatório HTML, os traces e os vídeos estão no artefato `relatorio-qa` da execução.
> Os itens foram levantados primeiro por análise estática do código e depois confirmados (ou não) na execução.

| ID | Título | Severidade | Teste | Status |
|---|---|---|---|---|
| BUG01 | Cadastro de exame responde 201, mas não grava o exame | **Crítica** | CT30, CT40, CT42, CT43, E2E13 | ✅ Confirmado |
| BUG02 | Busca por id de paciente e de exame retorna 500 | Alta | CT17, CT37 | ✅ Confirmado |
| BUG03 | Documento duplicado retorna 500 em vez de 409 | Alta | CT11 | ✅ Confirmado |
| BUG04 | Exame para paciente inexistente não é tratado | Alta | CT33, CT34 | ⏸️ Bloqueado pelo BUG01 |
| BUG05 | Condição de corrida na idempotência (requisições simultâneas) | Alta | CT42 | ⏸️ Bloqueado pelo BUG01 |
| BUG06 | Respostas de erro expõem stack trace (`stark`) | Alta | CT11, CT15, CT16, CT50 | ✅ Confirmado |
| BUG07 | API aceita CPF inválido (validação só no front) | Média | CT13 | ✅ Confirmado |
| BUG08 | Cliente consegue gravar `createdBy` falso na auditoria | Média | CT14b | ✅ Confirmado |
| BUG09 | Front: editar um paciente substitui outro paciente na lista | Média | E2E12 | ✅ Confirmado |
| BUG10 | `GET /exames` ignora a paginação documentada no README | Média | CT38 | ⏸️ Mascarado pelo BUG01 (só existe 1 exame) |
| BUG11 | Página vazia retorna 404 e não há limite de `pageSize` | Baixa | CT21, CT22 | ✅ Confirmado |
| BUG12 | Login inválido retorna 404 em vez de 401 | Baixa | CT02, CT03 | ✅ Confirmado |
| BUG13 | Nome acima de 150 ou documento acima de 32 caracteres retornam 500 | Média | CT15, CT16 | ✅ Confirmado (novo) |
| BUG14 | Resposta do login devolve o e-mail do usuário no campo `url` | Baixa | CT53 | ✅ Confirmado (novo) |

**Sobre os bloqueados:** como o BUG01 impede qualquer exame de ser gravado, as validações que dependem da inserção (paciente inexistente, formato do `patientId`, tamanho da chave, concorrência) nunca chegam a ser executadas. Elas respondem 201 sem gravar. Esses testes devem ser reexecutados depois da correção do BUG01.

---|---|---|---|---|
| BUG01 | Cadastro de exame não grava o exame (verificação de idempotência sempre verdadeira) | Crítica | CT30, CT31, E2E13 | a confirmar |
| BUG02 | Busca por id de paciente e de exame quebra (parâmetro da query com nome errado) | Alta | CT17, CT37 | a confirmar |
| BUG03 | Documento duplicado retorna 500 em vez de 409 | Alta | CT11 | a confirmar |
| BUG04 | Exame para paciente inexistente retorna 500 em vez de 404 | Alta | CT33 | a confirmar |
| BUG05 | Requisições simultâneas com a mesma chave geram erro 500 (condição de corrida) | Alta | CT42 | a confirmar |
| BUG06 | Respostas de erro expõem stack trace (`stark`) e mensagem do banco | Alta | CT11, CT33, CT50 | a confirmar |
| BUG07 | API aceita CPF inválido (validação só no front) | Média | CT13 | a confirmar |
| BUG08 | Cliente consegue gravar `createdBy` falso na auditoria | Média | CT14b | a confirmar |
| BUG09 | Front: editar paciente corrompe a lista (atribuição no lugar de comparação) | Média | E2E12 | a confirmar |
| BUG10 | `GET /exames` ignora a paginação documentada no README | Média | CT38 | a confirmar |
| BUG11 | Página vazia retorna 404 e não há limite de `pageSize` | Baixa | CT21, CT22 | a confirmar |
| BUG12 | Login inválido retorna 404 em vez de 401 | Baixa | CT02, CT03 | a confirmar |

---

## BUG01 – Cadastro de exame não grava o exame
**Severidade:** Crítica · **Componente:** `backend/src/application/exam/services/exam.service.ts` (método `create`)

**Causa provável:** `findByIdempotencyKey` sempre devolve um objeto de resposta (`ResponseMessageDto`), mesmo quando não encontra nada. O `if (created)` é sempre verdadeiro e o método retorna antes de chamar `repository.create`.

**Passos:**
1. Autenticar com `adm@gmail.com`.
2. `POST /exames` com `patientId` de um paciente existente, `modality: "CT"` e uma `idempotencyKey` nova.
3. Consultar `GET /exames`.

**Esperado:** 201 com o exame criado, e o exame presente na listagem.
**Obtido:** 201 com corpo vazio, e o exame não aparece na listagem. Pela interface (E2E13), a tela mostra "Exame criado com sucesso", mas o exame não existe.

**Sugestão de correção:** `if (created.data) { ... }`

---

## BUG02 – Busca por id quebra
**Severidade:** Alta · **Componentes:** `patient.repository.ts` e `exam.repository.ts` (método `findOne`)

**Causa provável:** a query usa `:patientId` / `:examId`, mas o parâmetro é passado como `{ id: ... }`.

**Sugestão:** `qb.where('patient.id = :patientId', { patientId })`.

---

## BUG03 / BUG04 – Erros de banco viram 500
**Causa provável:** não há verificação prévia (documento existente, paciente existente) e o `GlobalExceptionFilter` transforma qualquer erro que não seja `HttpException` em 500.

**Sugestão:** validar antes de inserir e mapear os códigos do PostgreSQL `23505` (único) → 409 e `23503` (chave estrangeira) → 404/422.

---

## BUG05 – Condição de corrida na idempotência
**Causa provável:** o fluxo "consulta e depois insere" não é atômico. Duas requisições simultâneas passam pela consulta e a segunda viola o índice único → 500.

**Sugestão:** `INSERT ... ON CONFLICT (idempotencykey) DO NOTHING` e depois buscar o registro, ou capturar o erro `23505` e devolver o exame existente.

---

## BUG06 – Vazamento de informação interna
**Componente:** `global-exception.filter.ts` devolve `stark: exception.stack` e `exception.message` crua.
**Risco:** expõe estrutura interna (tabelas, colunas, caminhos de arquivo) numa plataforma de saúde. Fere boas práticas de segurança (OWASP A05) e a proteção de dados sensíveis.
**Sugestão:** registrar o stack só no log do servidor e devolver uma mensagem genérica com um id de correlação.

---

## BUG07 – CPF inválido aceito pela API
O front valida o CPF (`validateCPF`), mas o `PatientDto` só exige `IsString`/`IsNotEmpty`. Qualquer integração direta grava documentos inválidos. O próprio seed usa `00000000000`.

## BUG08 – Auditoria falsificável
O `AuditSubscriber` faz `entity.createdBy = entity.createdBy || usuário`. Como `createdBy` está no DTO, o cliente pode enviar o valor que quiser.

## BUG09 – Front: edição de paciente corrompe a lista
**Evidência (E2E12):** depois de editar outro paciente, o primeiro da lista ("SAMUEL BERTONI", do seed) some da tela sem recarregar a página.

`patient.service.ts`: `current.findIndex((p) => (p.id = dto.id!))` usa `=` (atribuição). O primeiro item da lista recebe o id do paciente editado e é substituído na tela.

## BUG10 – Contrato do README divergente
O README documenta `GET /exames?page=x&pageSize=y`, mas essa rota chama `findAll` (sem paginação). A paginada é `GET /exames/paginated`, que não está documentada.

## BUG11 – Paginação
- Página sem resultados retorna **404**, quando o padrão é 200 com `[]` (ver AMB02).
- `pageSize` não tem limite máximo (`?pageSize=100000`).

## BUG12 – Código de status do login
Credenciais inválidas retornam **404 Not Found**, quando o correto é **401 Unauthorized**.

---

## BUG13 – Tamanho dos campos não validado
O `PatientDto` não tem `MaxLength`. Um nome com 151 caracteres ou um documento com 33 chega ao banco, que recusa, e a API responde 500 com o stack trace.
**Sugestão:** `@MaxLength(150)` no nome e `@MaxLength(32)` no documento (e `@MaxLength(128)` na `idempotencyKey`).

## BUG14 – E-mail do usuário no envelope do login
`AuthRepository.login` monta `url: /auth/login/${userEmail}`. O e-mail aparece na resposta e pode acabar em logs.

---

## Observações de melhoria (não são defeitos)
- Textos do Swagger copiados de outro projeto ("Customer", "Customer removed successfully").
- O placeholder da busca de pacientes diz "nome, email ou telefone", mas o paciente só tem nome e documento.
- CORS liberado para qualquer origem (`*`) e o token salvo em `localStorage`.
- O login não tem limite de tentativas (risco de força bruta).
