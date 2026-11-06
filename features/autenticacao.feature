# language: pt
Funcionalidade: Autenticação com JWT
  Como usuário da plataforma
  Quero acessar o sistema com minhas credenciais
  Para que só pessoas autorizadas vejam dados de saúde

  Cenário: Login com credenciais válidas
    Quando faço login com "adm@gmail.com" e a senha correta
    Então recebo o status 200 e um token JWT
    E a resposta não contém a senha

  Cenário: Login com senha incorreta
    Quando faço login com a senha incorreta
    Então recebo o status 401

  Cenário: E-mail inexistente não revela se a conta existe
    Quando faço login com um e-mail que não existe
    Então recebo o status 401 com a mesma mensagem da senha incorreta

  Cenário: Rota protegida sem token
    Quando consulto a lista de pacientes sem token
    Então recebo o status 401

  Cenário: Token adulterado
    Quando consulto a lista de pacientes com um token alterado
    Então recebo o status 401

  Cenário: Acesso à interface sem login
    Quando acesso a tela de pacientes sem estar logado
    Então sou redirecionado para a tela de login
