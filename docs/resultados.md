# Resultados da execução

Execução de **06/11/2026, 11:11:30** (GitHub Actions, aplicação real com PostgreSQL 17 + API NestJS + front Angular) · duração dos testes: **30 s**

| Total | ✅ Passaram | ❌ Falharam (defeitos) | Taxa de aprovação |
|---:|---:|---:|---:|
| **65** | **43** | **22** | 66% |

> Os testes descrevem o comportamento **esperado** da plataforma. Cada falha corresponde a um defeito documentado em [relatorio-de-bugs.md](relatorio-de-bugs.md).

## Por área

| Projeto | Área | Testes | ✅ | ❌ |
|---|---|---:|---:|---:|
| API | Autenticação (POST /auth/login) | 6 | 4 | 2 |
| API | Exames - cadastro (POST /exames) | 20 | 16 | 4 |
| API | Exames - consulta | 3 | 2 | 1 |
| API | Idempotência no cadastro de exames | 4 | 1 | 3 |
| API | Pacientes - cadastro (POST /pacientes) | 12 | 7 | 5 |
| API | Pacientes - consulta | 9 | 6 | 3 |
| API | Segurança e privacidade (dados de saúde / LGPD) | 4 | 2 | 2 |
| E2E | Login | 3 | 3 | 0 |
| E2E | Pacientes e exames pela interface | 4 | 2 | 2 |

## Todos os testes

| Projeto | Teste | Resultado | Defeito revelado |
|---|---|:---:|---|
| API | CT01 - login com credenciais válidas retorna token JWT | ✅ |  |
| API | CT02 - senha incorreta retorna 401 Unauthorized | ❌ | BUG12 |
| API | CT03 - e-mail inexistente retorna 401 com a mesma mensagem da senha incorreta | ❌ | BUG12 |
| API | CT04 - e-mail em formato inválido retorna 400 | ✅ |  |
| API | CT05 - rota protegida sem token retorna 401 | ✅ |  |
| API | CT06 - rota protegida com token adulterado retorna 401 | ✅ |  |
| API | CT30 - cadastra exame válido, retorna 201 e o exame fica gravado | ❌ | BUG01 |
| API | CT31 - aceita a modalidade DICOM CR | ✅ |  |
| API | CT31 - aceita a modalidade DICOM CT | ✅ |  |
| API | CT31 - aceita a modalidade DICOM DX | ✅ |  |
| API | CT31 - aceita a modalidade DICOM MG | ✅ |  |
| API | CT31 - aceita a modalidade DICOM MR | ✅ |  |
| API | CT31 - aceita a modalidade DICOM NM | ✅ |  |
| API | CT31 - aceita a modalidade DICOM OT | ✅ |  |
| API | CT31 - aceita a modalidade DICOM PT | ✅ |  |
| API | CT31 - aceita a modalidade DICOM RF | ✅ |  |
| API | CT31 - aceita a modalidade DICOM US | ✅ |  |
| API | CT31 - aceita a modalidade DICOM XA | ✅ |  |
| API | CT32 - rejeita modalidade inválida "XX" com 400 | ✅ |  |
| API | CT32 - rejeita modalidade inválida "ct" com 400 | ✅ |  |
| API | CT32 - rejeita modalidade inválida "" com 400 | ✅ |  |
| API | CT32 - rejeita modalidade inválida "CTX" com 400 | ✅ |  |
| API | CT33 - exame para paciente inexistente retorna 404, sem expor detalhes internos | ❌ | BUG04 (bloqueado pelo BUG01) |
| API | CT34 - patientId fora do formato UUID retorna 400 | ❌ | BUG04 (bloqueado pelo BUG01) |
| API | CT35 - sem idempotencyKey retorna 400 | ✅ |  |
| API | CT36 - idempotencyKey acima de 128 caracteres retorna 400, não 500 | ❌ | BUG13 (bloqueado pelo BUG01) |
| API | CT37 - busca exame por id (GET /exames/:id) retorna 200 | ❌ | BUG02 |
| API | CT38 - contrato do README: GET /exames?page=1&pageSize=1 retorna no máximo 1 exame | ✅ |  |
| API | CT39 - listagem paginada de exames (GET /exames/paginated) traz metadados coerentes | ✅ |  |
| API | CT40 - reenvio com a mesma idempotencyKey devolve o mesmo exame e não duplica | ❌ | BUG01 |
| API | CT41 - chave já existente no seed devolve o exame original | ✅ |  |
| API | CT42 - 10 requisições simultâneas com a mesma chave criam apenas 1 exame | ❌ | BUG05 (bloqueado pelo BUG01) |
| API | CT43 - mesma chave com dados diferentes não cria um segundo exame | ❌ | BUG01 |
| API | CT10 - cadastra paciente válido e retorna 201 com id | ✅ |  |
| API | CT11 - documento duplicado retorna 409 Conflict sem expor detalhes internos | ❌ | BUG03 · BUG06 |
| API | CT12 - campo obrigatório: nome vazio retorna 400 | ✅ |  |
| API | CT12 - campo obrigatório: sem nome retorna 400 | ✅ |  |
| API | CT12 - campo obrigatório: documento vazio retorna 400 | ✅ |  |
| API | CT12 - campo obrigatório: sem documento retorna 400 | ✅ |  |
| API | CT12 - campo obrigatório: nome numérico (tipo errado) retorna 400 | ✅ |  |
| API | CT13 - CPF inválido é rejeitado pela API (não só pelo front) | ❌ | BUG07 |
| API | CT14 - campo desconhecido no corpo é rejeitado com 400 | ✅ |  |
| API | CT14b - cliente não consegue falsificar a auditoria (createdBy) | ❌ | BUG08 |
| API | CT15 - nome acima do limite do banco (150) retorna 400, não 500 | ❌ | BUG13 · BUG06 |
| API | CT16 - documento acima do limite do banco (32) retorna 400, não 500 | ❌ | BUG13 · BUG06 |
| API | CT17 - busca paciente por id (GET /pacientes/:id) retorna 200 | ❌ | BUG02 |
| API | CT18 - listagem paginada retorna dados e metadados coerentes | ✅ |  |
| API | CT19 - páginas consecutivas não repetem pacientes | ✅ |  |
| API | CT20 - paginação inválida (page=0&pageSize=10) retorna 400 | ✅ |  |
| API | CT20 - paginação inválida (page=1&pageSize=0) retorna 400 | ✅ |  |
| API | CT20 - paginação inválida (page=-1&pageSize=10) retorna 400 | ✅ |  |
| API | CT20 - paginação inválida (page=abc&pageSize=10) retorna 400 | ✅ |  |
| API | CT21 - página além do fim retorna 200 com lista vazia | ❌ | BUG11 |
| API | CT22 - pageSize muito grande é limitado ou rejeitado | ❌ | BUG11 |
| API | CT50 - erro interno não devolve stack trace nem SQL ao cliente | ❌ | BUG02 · BUG06 |
| API | CT51 - listagem de usuários do sistema não expõe senha (hash) | ✅ |  |
| API | CT52 - endpoints de usuários exigem autenticação | ✅ |  |
| API | CT53 - resposta de login não devolve o e-mail na URL do envelope | ❌ | BUG14 |
| E2E | E2E01 - login válido leva à tela de pacientes | ✅ |  |
| E2E | E2E02 - login com senha errada mantém o usuário na tela de login | ✅ |  |
| E2E | E2E03 - acessar /patients sem login redireciona para /login | ✅ |  |
| E2E | E2E10 - cadastra paciente com CPF válido e ele aparece na lista | ✅ |  |
| E2E | E2E11 - CPF inválido é bloqueado no formulário | ✅ |  |
| E2E | E2E12 - editar um paciente não altera os outros da lista (sem recarregar a página) | ❌ | BUG09 |
| E2E | E2E13 - cadastra exame para um paciente e ele aparece na tela de exames | ❌ | BUG01 |
