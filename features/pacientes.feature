# language: pt
Funcionalidade: Cadastro e consulta de pacientes
  Como profissional da área médica
  Quero cadastrar e consultar pacientes
  Para vincular exames a um registro único e confiável

  Contexto:
    Dado que estou autenticado com um usuário ativo

  Cenário: Cadastrar paciente válido
    Quando cadastro um paciente com nome e CPF válidos
    Então recebo o status 201
    E a resposta traz o id do paciente

  Cenário: Bloquear documento duplicado
    Dado que existe um paciente com o CPF "529.982.247-25"
    Quando cadastro outro paciente com o mesmo CPF
    Então recebo o status 409
    E a resposta não expõe detalhes do banco

  Cenário: Validar o CPF também na API
    Quando cadastro um paciente pela API com o CPF "123.456.789-00"
    Então recebo o status 400

  Esquema do Cenário: Campos obrigatórios
    Quando cadastro um paciente com <caso>
    Então recebo o status 400

    Exemplos:
      | caso            |
      | nome vazio      |
      | documento vazio |
      | sem nome        |
      | sem documento   |

  Cenário: Respeitar o tamanho máximo dos campos
    Quando cadastro um paciente com nome de 151 caracteres
    Então recebo o status 400 e não 500

  Cenário: Auditoria não pode ser falsificada pelo cliente
    Quando cadastro um paciente enviando "createdBy" = "usuario-falso"
    Então o registro não é gravado com createdBy "usuario-falso"

  Cenário: Paginação da listagem
    Dado que existem pacientes cadastrados
    Quando consulto a página 1 com 2 itens por página
    Então recebo no máximo 2 pacientes
    E totalPages é igual a totalItems dividido por 2, arredondado para cima

  Esquema do Cenário: Paginação inválida
    Quando consulto a listagem com "<query>"
    Então recebo o status 400

    Exemplos:
      | query                |
      | page=0&pageSize=10   |
      | page=1&pageSize=0    |
      | page=abc&pageSize=10 |

  Cenário: Página além do fim
    Quando consulto uma página que não tem pacientes
    Então recebo o status 200 com a lista vazia

  Cenário: Editar um paciente pela interface
    Dado que existem os pacientes "A" e "B" na lista
    Quando edito o nome do paciente "B"
    Então o paciente "A" continua na lista sem alteração
