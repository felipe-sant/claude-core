# Padrão de segurança

Vale para todo código que recebe dados de fora, guarda dados ou controla acesso.

- Nunca coloque senhas, chaves, tokens ou certificados no código, em testes, em exemplos ou no commit. Use variáveis de ambiente ou o cofre de segredos do projeto, e mantenha o arquivo de exemplo sem valores reais.
- O `.env` pode ser lido e copiado para rodar testes e o projeto localmente (por exemplo, para a worktree da tarefa), mas nunca imprima os valores, nem em mensagem, log, relatório, especificação ou commit, e nunca o adicione ao stage. Copie com `cp`, sem exibir o conteúdo.
- Valide toda entrada na borda (corpo, query, cabeçalhos, arquivos enviados). Aceite só o que é esperado, não o que "parece válido".
- Consultas ao banco sempre parametrizadas. Nunca monte SQL ou comandos de sistema juntando texto do usuário.
- Autenticação e autorização são conferidas no servidor, em cada operação. Esconder um botão na tela não protege nada.
- Cada pessoa só acessa os dados a que tem direito: confira o dono do recurso, não só que há alguém logado.
- Senhas guardadas só com algoritmo próprio para isso (argon2 ou bcrypt), nunca em texto puro nem com hash simples.
- Não registre em log senhas, tokens, documentos pessoais ou corpo inteiro de requisição. Mensagens de erro para o usuário não revelam detalhes internos.
- Escape o que vai para a tela e use o que o framework já oferece contra injeção de código e falsificação de requisição.
- Antes de adicionar uma dependência, confira se é mantida e conhecida. Mantenha o arquivo de travamento de versões no repositório.
- Se encontrar uma falha ou um segredo exposto, avise antes de seguir; um segredo que vazou precisa ser trocado, não só apagado.
