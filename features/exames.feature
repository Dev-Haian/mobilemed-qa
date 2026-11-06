# language: pt
Funcionalidade: Cadastro e consulta de exames médicos
  Como profissional da área médica
  Quero registrar exames de imagem dos meus pacientes
  Para manter o histórico clínico organizado e sem duplicidade

  Contexto:
    Dado que estou autenticado com um usuário ativo
    E existe um paciente cadastrado

  Cenário: Cadastrar exame com dados válidos
    Quando cadastro um exame com modalidade "CT" e uma idempotencyKey nova
    Então recebo o status 201
    E a resposta traz o id do exame criado
    E o exame fica gravado uma única vez

  Esquema do Cenário: Aceitar todas as modalidades DICOM suportadas
    Quando cadastro um exame com modalidade "<modalidade>"
    Então recebo o status 201

    Exemplos:
      | modalidade |
      | CR         |
      | CT         |
      | DX         |
      | MG         |
      | MR         |
      | NM         |
      | OT         |
      | PT         |
      | RF         |
      | US         |
      | XA         |

  Esquema do Cenário: Rejeitar modalidade fora da lista DICOM
    Quando cadastro um exame com modalidade "<modalidade>"
    Então recebo o status 400

    Exemplos:
      | modalidade |
      | XX         |
      | ct         |
      | CTX        |

  Cenário: Não permitir exame para paciente inexistente
    Quando cadastro um exame para um patientId que não existe
    Então recebo o status 404
    E a resposta não expõe stack trace nem detalhes do banco

  Cenário: Reenvio com a mesma idempotencyKey
    Dado que cadastrei um exame com a idempotencyKey "K1"
    Quando envio novamente o mesmo exame com a idempotencyKey "K1"
    Então recebo o mesmo id do primeiro cadastro
    E existe apenas 1 exame com a idempotencyKey "K1"

  Cenário: Requisições simultâneas com a mesma idempotencyKey
    Quando envio 10 requisições ao mesmo tempo com a idempotencyKey "K2"
    Então nenhuma resposta é erro 5xx
    E todas as respostas trazem o mesmo id
    E existe apenas 1 exame com a idempotencyKey "K2"

  Cenário: Mesma idempotencyKey com dados diferentes
    Dado que cadastrei um exame "CT" com a idempotencyKey "K3"
    Quando envio um exame "XA" com a idempotencyKey "K3"
    Então nenhum segundo exame é criado
    E o exame gravado continua com a modalidade "CT"
