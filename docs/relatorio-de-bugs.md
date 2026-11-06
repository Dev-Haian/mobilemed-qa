# Relatório de defeitos – Mobilemed

> **Status:** levantamento inicial por **análise estática do código**. Cada item aponta o teste automatizado que o confirma.
> Após a execução no GitHub Actions, a coluna "Confirmado" é atualizada com a evidência (relatório do Playwright e logs).

| ID | Título | Severidade | Teste | Confirmado |
|---|---|---|---|---|
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
**Suspeita:** a resposta vem sem o exame e nada é gravado.

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
`patient.service.ts`: `current.findIndex((p) => (p.id = dto.id!))` usa `=` (atribuição). O primeiro item da lista recebe o id do paciente editado e é substituído na tela.

## BUG10 – Contrato do README divergente
O README documenta `GET /exames?page=x&pageSize=y`, mas essa rota chama `findAll` (sem paginação). A paginada é `GET /exames/paginated`, que não está documentada.

## BUG11 – Paginação
- Página sem resultados retorna **404**, quando o padrão é 200 com `[]` (ver AMB02).
- `pageSize` não tem limite máximo (`?pageSize=100000`).

## BUG12 – Código de status do login
Credenciais inválidas retornam **404 Not Found**, quando o correto é **401 Unauthorized**.

---

## Observações de melhoria (não são defeitos)
- Textos do Swagger copiados de outro projeto ("Customer", "Customer removed successfully").
- O placeholder da busca de pacientes diz "nome, email ou telefone", mas o paciente só tem nome e documento.
- CORS liberado para qualquer origem (`*`) e o token salvo em `localStorage`.
- O login não tem limite de tentativas (risco de força bruta).
