# O agente de issues não consegue abrir o pull request no formato pedido e termina sem avisar

> Status: em-revisao
> Tipo: bug
> Tamanho: media
> Branch: fix/95-agente-de-issues-abre-pull-request
> Criada em: 2026-11-25

Issue: #95 de felipe-sant/claude-kit.

## Comportamento observado

- As instruções do agente de issues pedem que ele abra o pull request com uma descrição de três seções com título (O que muda, Como foi verificado, Observações), escrita inteira dentro do próprio comando. O Claude Code nega o comando quando, dentro do texto, uma linha depois da primeira começa com cerquilha, o que acontece com todo título de seção a partir do segundo. A outra saída, ler a descrição de um arquivo, está bloqueada para o agente.
- Numa execução, o pull request saiu com a descrição em uma linha corrida, e o dono a corrigiu à mão.
- Em outra, o agente fez a correção inteira e enviou a branch, mas o pull request não foi aberto: houve comandos negados, nada foi comentado na issue e a execução terminou verde.
- A branch enviada tira a issue da fila, porque a fila ignora issue com branch própria. A issue fica parada até alguém apagar a branch ou abrir o pull request à mão.
- As instruções proíbem editar à mão a pasta de configuração do time, sem dizer que o guia do Claude dessa pasta é a única exceção, escrita à mão.

## Comportamento esperado

- O agente faz a correção, envia a branch e grava a descrição do pull request num arquivo que a própria automação indica. Depois do agente, um passo da automação confere a branch, monta o título e o vínculo com a issue e abre o pull request com as três seções, o vínculo e a linha fixa do agente.
- Quando o agente é barrado ou a execução falha ou trava, ele deixa na issue um comentário de um parágrafo dizendo o que houve.
- A automação apaga a branch do agente enviada sem pull request, e a conferência final reprova a execução que deixou branch sem pull request ou que terminou sem pull request e sem comentário.

## Impacto

- O agente de issues não entrega pull request no padrão pedido.
- Quando falha, não deixa rastro: sem pull request, sem comentário e com a execução verde.
- A issue com branch enviada fica presa fora da fila até alguém agir à mão.

## Como reproduzir

1. Ter uma issue `Size: P` na fila e disparar a Issue Claude Agent.
2. O agente resolve a issue, envia a branch e tenta abrir o pull request com a descrição de três seções num único comando.
3. Resultado: o comando é negado. Ou o agente desiste, e não há pull request nem comentário, ou tenta de novo sem as seções e o pull request sai com a descrição em uma linha corrida. A execução termina verde nos dois casos.

Reprodução local relatada na issue: o mesmo comando é permitido quando nenhuma linha além da primeira começa com cerquilha, e é negado caso contrário, mesmo sem as regras de bloqueio da automação.

## Evidência

- Issue #95, com o relato das duas execuções e o link da execução que a classificou.
- Leitura das instruções do agente: o passo 6 manda montar a descrição num único texto entre aspas, sem arquivo.
- Leitura da automação: a leitura de arquivo pelo comando de pull request está bloqueada, e a conferência final não verifica branch sem pull request nem execução sem rastro na issue.
- Achado ao preparar esta especificação: a opção do repositório que permite à automação do GitHub criar pull request está desligada. Ver a dúvida D-1.

### Ferramenta própria da ação para criar pull request (RN-04)

Verificado no código da ação no commit fixado pela automação:

- A ação tem servidores próprios só para atualizar o comentário dela, para commit e remoção de arquivos (só com assinatura de commit ligada) e para comentário em linha de pull request. Nenhum deles cria pull request.
- Se a lista de ferramentas liberadas incluir alguma ferramenta `mcp__github__...`, a ação sobe o servidor oficial do GitHub (`github-mcp-server` v0.17.1, em docker, com o token do app do Claude). Esse servidor tem a ferramenta `create_pull_request`, que não passa pela verificação de comandos.
- Vantagem: o pull request sairia com o autor do app do Claude e dispararia o CI. Contrapartida: é uma dependência a mais (imagem docker) e expõe uma parte grande da API do GitHub, inclusive leitura de arquivos, o que contraria a RN-02 se não for limitada a essa única ferramenta.
- Decisão aprovada: só registrar. O plano principal é o passo da automação.

## Causa suspeita

- Confirmada pela reprodução: o passo 6 das instruções (descrição com títulos de seção num único texto do comando) colide com a verificação de comandos do Claude Code, e a leitura da descrição de um arquivo está bloqueada na automação.
- Hipótese: falta nas instruções o que fazer quando um comando é negado, e a conferência final não reprova branch sem pull request nem execução sem rastro.
- Hipótese de baixa confiança, não investigada aqui: as execuções sem efeito em outra issue ocorreram porque a mudança envolvia o guia do Claude da pasta de configuração, que as instruções proíbem editar.

## Regras

- RN-01: Quem abre o pull request é um passo da própria automação, depois do agente. O agente grava a descrição num arquivo de caminho fixo, definido pela automação, na mesma pasta temporária do arquivo de contexto que ele já lê. O passo confere que a branch é do agente e da issue da execução e monta sozinho o título e o vínculo com a issue. Fonte: usuário.
- RN-02: A leitura de arquivo continua bloqueada para o agente. Fonte: usuário.
- RN-03: A descrição sai com as três seções (O que muda, Como foi verificado, Observações), o vínculo que fecha a issue e a linha "Aberto pelo agente de issues.". Fonte: usuário.
- RN-04: A ferramenta própria da ação para criar pull request só é verificada e registrada; o plano principal é o passo da automação. Fonte: usuário.
- RN-05: As instruções mandam o agente comentar na issue o que houve, em um único parágrafo e sem linha começando com cerquilha. Vale quando um comando é negado e quando a execução falha ou trava por outro motivo. Fonte: usuário.
- RN-06: A limpeza da branch enviada sem pull request é da automação, não do agente. Fonte: usuário.
- RN-07: A conferência final reprova em dois casos: branch do agente enviada sem pull request aberto, e execução que termina sem pull request e sem comentário. Fonte: usuário.
- RN-08: As instruções deixam claro que o guia do Claude da pasta de configuração é o único arquivo dessa pasta editado à mão. Fonte: usuário.

## Critérios de aceite

- CA-01: QUANDO o agente envia a branch da issue e grava a descrição com as três seções no arquivo indicado ENTÃO o sistema DEVE abrir, pela automação, um único pull request dessa branch, com o título montado por ela e a descrição com as três seções na ordem, o vínculo que fecha a issue da execução e a linha "Aberto pelo agente de issues.". (RN-01, RN-03)
- CA-02: QUANDO o texto gravado pelo agente traz um vínculo que fecha qualquer issue ENTÃO o sistema NÃO DEVE abrir o pull request, porque só a automação monta o vínculo. (RN-01)
- CA-03: QUANDO o arquivo da descrição não existe, está vazio ou não tem as três seções na ordem ENTÃO o sistema NÃO DEVE abrir o pull request e DEVE terminar a execução com erro visível. (RN-03, RN-07)
- CA-04: QUANDO não há branch da issue da execução enviada pelo agente, ou há mais de uma ENTÃO o sistema NÃO DEVE abrir pull request. (RN-01)
- CA-05: QUANDO há uma branch com o número de outra issue, ou uma branch da issue que já existia antes da execução ENTÃO o sistema NÃO DEVE abrir pull request dela nem apagá-la. (RN-01, RN-06)
- CA-06: QUANDO a issue deixou de ser `Size: P` durante a execução ENTÃO o sistema NÃO DEVE abrir pull request. (RN-01)
- CA-07: QUANDO a execução termina com uma branch do agente para a issue enviada e sem pull request aberto dela ENTÃO o sistema DEVE reprovar a execução na conferência final e apagar essa branch, deixando a issue livre para voltar à fila. (RN-06, RN-07)
- CA-08: QUANDO a execução termina sem pull request do agente para a issue e sem comentário novo do agente na issue ENTÃO o sistema DEVE reprovar a execução na conferência final. (RN-07)
- CA-09: QUANDO a execução termina sem pull request, mas com comentário novo do agente na issue (por exemplo, a troca de P por M ou o aviso de um comando negado) e sem branch enviada ENTÃO o sistema NÃO DEVE reprovar a execução por esses dois motivos. (RN-05, RN-07)
- CA-10: QUANDO as instruções do agente são lidas ENTÃO o sistema DEVE instruir o agente a gravar a descrição no arquivo indicado, não abrir o pull request por conta própria, não escrever o vínculo nem a linha fixa, e comentar na issue em um parágrafo, sem linha começando com cerquilha, quando um comando for negado ou a execução falhar ou travar. (RN-01, RN-03, RN-05)
- CA-11: QUANDO as instruções do agente são lidas ENTÃO o sistema DEVE deixar claro nelas que o guia do Claude da pasta de configuração é o único arquivo dessa pasta editado à mão, e que o resto da pasta continua gerado. (RN-08)
- CA-12: QUANDO a automação é conferida ENTÃO o sistema DEVE manter a leitura de arquivo bloqueada para o agente, com a mesma lista de proibições nas duas automações. (RN-02)
- CA-13: QUANDO a issue P é maior do que parecia e o agente troca o tamanho para M com comentário, sem enviar branch ENTÃO o sistema DEVE terminar a execução sem pull request e sem reprovar, como hoje. (o que já funcionava)
- CA-14: QUANDO a execução termina ENTÃO o sistema DEVE manter as conferências que já existem: a branch principal não muda, há no máximo um pull request do agente aberto, as etiquetas que não são de tamanho não mudam e não há comentário novo com a marca de classificação. (o que já funcionava)
- CA-15: QUANDO a documentação do agente de issues é lida ENTÃO o sistema DEVE descrever nela que o pull request é aberto pela automação, o comentário do agente quando algo dá errado, a limpeza da branch sem pull request e os dois novos motivos de reprovação da conferência. (RN-01, RN-05, RN-06, RN-07)
- CA-16: QUANDO a tarefa termina ENTÃO o sistema DEVE passar no lint, na suíte de testes e na checagem do catálogo. (o que já funcionava)

## Fora do escopo

- Liberar a leitura de arquivo para o agente: com ela, ele poderia publicar qualquer arquivo num repositório público (RN-02).
- Investigar as duas execuções em outra issue que terminaram sem efeito: causa não confirmada e fora do pedido.
- Mudar a Issue Size Set, o tamanho das issues ou a seleção da fila.
- Adotar a ferramenta própria da ação para criar pull request (RN-04): só registrada.

## Plano de execução

- Fase 1 (paralelo): T1 [P], T2 [P], T3 [P] e T4 [P]. O contrato entre o script, a automação e as instruções está fixado em "Contrato" abaixo; nenhuma tarefa espera o código da outra e nenhuma edita o mesmo arquivo.
- Gate de fase: `npm run lint`, `npm test`, `node bin/ai-sync.js --check` e o sync em pasta temporária (`T=$(mktemp -d) && node bin/ai-sync.js "$T" && ls -R "$T/.claude"; rm -rf "$T"`). O projeto não tem build, typecheck nem formatador. O actionlint roda só no CI; se estiver instalado na máquina, rode-o também no workflow alterado.
- Fase 2 (sequencial): T5.
- Gate de fase: o mesmo da Fase 1, antes do reviewer.
- Depois do merge, validação ao vivo pelo dono (fora do gate): um disparo à mão com uma issue P de teste, conferindo o pull request aberto e a conferência final.

### Contrato (vale para T1, T2, T3 e T5)

- Arquivo da descrição: `pull-request-body.md`, dentro da pasta do contexto filtrado (`$CONTEXT_DIR`, que é `${{ runner.temp }}/issue-agent`).
- O passo "Montagem das instruções" acrescenta em "Valores desta execução" a linha `- Arquivo da descrição do pull request: <caminho>`, com o caminho completo do arquivo.
- Script novo: `.github/issue-agent/open-pull-request.js`, chamado por `node .github/issue-agent/open-pull-request.js "$CONTEXT_DIR" "$PR_ISSUE"`, com `GITHUB_TOKEN` e `GITHUB_REPOSITORY` no ambiente. Sai com código 0 quando abre o pull request ou quando não há branch da issue; sai com código 1 e `::error::` em português quando recusa.
- O script lê o arquivo do disco; o texto nunca entra no `run:` nem é interpolado no shell. Título e corpo vão para a API do GitHub como dados.
- Branch da issue: nome no padrão `^<tipo>/<pr_issue>-`, com `<tipo>` em minúsculas da tabela do `commit-standard`, o mesmo padrão de branch própria da seleção. Só conta branch que não existia na "Foto de antes".
- Corpo final: o texto do agente com `Closes #<pr_issue>` ao fim da seção "O que muda" e a linha `Aberto pelo agente de issues.` ao fim do texto.
- Título: ver a dúvida D-2. Proposta: `<Tipo> <ícone> [#<pr_issue>] <título da issue>`, com tipo e ícone tirados do tipo da branch pela tabela do `commit-standard`.

## Tarefas

### T1 [P] Script que confere a branch e abre o pull request
- O quê: um script Node, sem dependências, que acha a branch da issue, valida o arquivo da descrição, monta título e corpo e abre o pull request pela API.
- Onde: `.github/issue-agent/open-pull-request.js` (novo) e `tests/issue-claude-agent-open-pull-request.test.js` (novo).
- Dev: dev-devops.
- Depende de: nada.
- Reaproveita: `fetch-with-retry.js`; o padrão de branch própria e a linha fixa de `select-issues.js` (copiar o padrão no script novo ou exportar de lá; se exportar, só a T1 toca nesse arquivo); o molde de funções puras exportadas e testadas de `issue-context.js` e `select-issues.js`; `tests/helpers.js`.
- Atende: RN-01, RN-03; CA-01, CA-02, CA-03, CA-04, CA-05, CA-06.
- Desenho: funções puras exportadas, testadas sem rede: achar a branch (zero, uma ou mais de uma; ignora outra issue, prefixo de número, como `9` contra `95`, e branch que já existia); validar o texto (existe, não vazio, três seções `## O que muda`, `## Como foi verificado` e `## Observações` na ordem; recusa qualquer palavra de fechamento de issue, como closes, fixes ou resolves seguida de `#`, sem diferenciar maiúsculas); montar o corpo e o título do contrato; recusar quando a issue não está com `Size: P`. O `main` faz as chamadas: lista as branches, lê a issue, lê o arquivo, confere que a branch está à frente da principal e cria o pull request com `head` igual à branch e `base` igual à principal.
- Teste (primeiro, deve falhar antes do script existir): começar por "monta o corpo com o vínculo ao fim de O que muda e a linha fixa ao fim". Depois, um teste por caso acima, incluindo os limites (arquivo vazio, seções fora de ordem, duas branches da issue, branch `fix/950-...` quando a issue é 95).
- Pronto quando: os testes passam e o gate passa.
- Gate: `npm run lint` e `npm test` (sem typecheck nem formatador no projeto).
- Modelo: padrao.
- Regra obrigatória: nunca escrever comentários no código.
- Status: pendente.

### T2 [P] Instruções do agente
- O quê: as instruções passam a mandar gravar a descrição no arquivo indicado, não abrir o pull request, comentar na issue quando algo dá errado e tratar o guia do Claude como exceção da pasta gerada.
- Onde: `.github/issue-agent/agent-prompt.md` e `tests/issue-claude-agent-prompt.test.js`.
- Dev: dev-devops.
- Depende de: nada.
- Reaproveita: as guardas atuais do teste do prompt.
- Atende: RN-01, RN-03, RN-05, RN-08; CA-10, CA-11, CA-13.
- Mudanças no texto:
  - Seção "Entradas desta execução": cita o arquivo da descrição do pull request, que vem em "Valores desta execução".
  - Seção "Pull request": depois do lint, dos testes e da checagem passando, enviar a branch e gravar a descrição com a ferramenta de escrita no arquivo indicado, com as três seções, em linguagem simples e sem caminhos de arquivo nem código; não escrever o vínculo nem a linha fixa, que a automação acrescenta; nunca abrir o pull request, porque a automação o abre depois.
  - Seção nova sobre o que fazer quando algo dá errado: se um comando for negado, ou a execução falhar ou travar, comentar na issue o que houve e o link da execução, em um único parágrafo, sem linha começando com cerquilha, sem crase e sem cifrão.
  - Seção "Limites": o guia do Claude da pasta `.claude/` (`.claude/CLAUDE.md`) é o único arquivo dela editado à mão; o resto continua gerado e só muda pelas fontes e pelo sync.
  - Continua: "Nos textos de `--body` e `-m`, não use crase nem cifrão", agora para comentários e commits.
  - Seção "Limites": a proibição de pastas temporárias continua valendo para comandos. A única exceção é gravar o arquivo da descrição com a ferramenta de escrita, no caminho que vem em "Valores desta execução"; a frase atual ganha essa exceção logo depois, sem perder o texto que a guarda confere.
- Testes que mudam de propósito, porque a regra mudou (registrar no commit): as guardas "texto longo direto em --body" (passa a valer só para comentários), "quebras de linha dentro do próprio texto" e "sem arquivo, sem crase, sem cifrão e sem heredoc" saem; "liga a issue com Closes" e "linha fixa do pull request" passam a conferir que o agente não os escreve; "skill de pull request" só fica se o texto ainda citar a skill para o formato da descrição. O teste das três seções na ordem continua. A guarda "comandos a partir da raiz, sem cd, sem substituição e sem pastas temporárias" continua igual, e ganha uma guarda nova para a exceção do arquivo da descrição.
- Teste (primeiro, deve falhar antes da mudança): guardas novas para o arquivo da descrição, para não abrir o pull request, para o comentário em um parágrafo sem cerquilha nos três casos (negado, falha, trava) para a exceção do guia do Claude e para a exceção do arquivo da descrição na proibição de pastas temporárias.
- Pronto quando: os testes passam e o gate passa.
- Gate: `npm run lint` e `npm test`.
- Modelo: padrao.
- Regra obrigatória: nunca escrever comentários no código.
- Status: pendente.

### T3 [P] Automação: abertura do pull request, conferência e limpeza
- O quê: a automação ganha o passo que abre o pull request, a conferência dos dois novos casos e a limpeza da branch sem pull request.
- Onde: `.github/workflows/issue-claude-agent.yml`, `tests/issue-claude-agent-workflow.test.js` e `tests/issue-automations.test.js`.
- Dev: dev-devops.
- Depende de: nada (usa o contrato).
- Reaproveita: o passo "Foto de antes", o passo "Conferência final", `issue-workflow-helpers.js`.
- Atende: RN-01, RN-02, RN-06, RN-07; CA-04, CA-05, CA-07, CA-08, CA-09, CA-12, CA-13, CA-14.
- Desenho:
  - "Foto de antes" grava também as branches da issue que já existem e a contagem de comentários do `claude[bot]` na issue sem a marca de classificação.
  - "Montagem das instruções" acrescenta a linha do arquivo da descrição (contrato).
  - Passo novo "Abertura do pull request", logo depois da ação, com o `node` do contrato e `CONTEXT_DIR` definido a partir de `runner.temp`. Quando ele roda depende da D-3. Token conforme a D-1.
  - "Conferência final" (sempre) reprova também quando há branch nova da issue sem pull request aberto com essa branch como origem, e quando não há pull request do agente para a issue e a contagem de comentários do agente não aumentou.
  - Passo novo "Limpeza" (sempre), depois da conferência: apaga as branches novas da issue sem pull request aberto, nunca uma que existia na foto de antes.
  - A lista de ferramentas liberadas perde `Bash(gh pr create:*)`, conforme a D-4. As proibições não mudam (RN-02).
- Testes que mudam de propósito, porque a regra mudou (registrar no commit): a contagem de definições de `CONTEXT_DIR` a partir de `runner.temp` passa de 2 para 3 na Issue Claude Agent, nos dois arquivos de teste (no `issue-automations.test.js`, a contagem passa a ser por automação, mantendo 2 na Issue Size Set); a lista de ferramentas liberadas deixa de exigir `Bash(gh pr create:*)` e passa a proibir que ele esteja lá, se a D-4 confirmar.
- Teste (primeiro, deve falhar antes da mudança): começar pelo passo de abertura existir depois da ação, chamar o script com os argumentos entre aspas e não interpolar texto; depois, a conferência citar os dois novos casos, a limpeza rodar sempre e depois da conferência, e a foto de antes gravar branches e comentários.
- Pronto quando: os testes passam e o gate passa.
- Gate: `npm run lint` e `npm test`. O actionlint roda no CI; rode-o também na máquina, se estiver instalado.
- Modelo: padrao.
- Regra obrigatória: nunca escrever comentários no código nem no YAML.
- Status: pendente.

### T4 [P] Documentação do agente de issues
- O quê: o README e o guia do Claude passam a descrever a abertura do pull request pela automação, o comentário do agente quando algo dá errado, a limpeza da branch sem pull request e os novos motivos de reprovação da conferência.
- Onde: `README.md` (seção "Agente de issues": "Issue Claude Agent", "O que as duas tratam e o que nunca fazem" e, conforme a D-1, "Instalação") e `.claude/CLAUDE.md` (linha das automações na tabela de estrutura). O `.claude/CLAUDE.md` é o único arquivo de `.claude/` editado à mão; não editar o resto da pasta.
- Dev: dev-doc.
- Depende de: nada (o comportamento está fixado nesta especificação; a parte de instalação espera a resposta da D-1, que vem antes da aprovação).
- Reaproveita: o texto atual das seções.
- Atende: CA-15.
- Pronto quando: os textos descrevem o comportamento novo em linguagem simples e o gate passa.
- Teste: nenhum (só texto).
- Gate: `npm run lint` e `npm test`.
- Modelo: economico.
- Status: pendente.

### T5 Coerência entre o script, a automação e as instruções
- O quê: um teste confere que o nome do arquivo da descrição, o nome do script e a linha fixa são os mesmos no script, na automação e nas instruções.
- Onde: `tests/issue-automations.test.js`.
- Dev: dev-devops.
- Depende de: T1, T2, T3.
- Reaproveita: o teste que já confere a marca e a linha fixa iguais no script de seleção e nas automações.
- Atende: RN-01, RN-03; CA-01, CA-16.
- Teste: o teste novo deve passar se o contrato foi seguido; se falhar, a divergência volta para a tarefa dona do arquivo.
- Pronto quando: o teste passa e o gate de fase passa.
- Gate: `npm run lint`, `npm test`, `node bin/ai-sync.js --check` e o sync em pasta temporária.
- Modelo: economico.
- Regra obrigatória: nunca escrever comentários no código.
- Status: pendente.

## Dúvidas

### Do usuário (bloqueiam a aprovação)

- D-1: A ação revoga o token do app do Claude ao terminar, então o passo da automação só tem o token padrão do GitHub Actions. Duas consequências: (a) a opção do repositório "Permitir que o GitHub Actions crie e aprove pull requests" está desligada hoje, e sem ela o passo não consegue abrir o pull request; (b) pull request aberto com o token padrão não dispara o CI, então o lint e os testes não rodam sozinhos no pull request do agente, e o autor passa a ser o bot do GitHub Actions (a seleção e a conferência continuam achando o pull request pela linha fixa). Qual caminho seguir: ligar a opção e aceitar o CI sem disparo automático (o dono dispara à mão), criar um segredo novo com um token próprio usado só nesse passo, ou rever a RN-04 e usar a ferramenta própria da ação?
- D-2: De onde vem o título do pull request? Proposta: tipo e ícone pelo tipo da branch, o número da issue e o título da issue (`Fix :bug: [#95] <título da issue>`).
- D-3: O passo de abertura roda quando a etapa do agente termina com falha (por exemplo, limite de turnos) mas deixou branch e descrição válidas? Proposta: só abre se a etapa do agente terminou com sucesso; caso contrário, a limpeza apaga a branch e a conferência reprova.
- D-4: Como o agente não abre mais o pull request, a permissão de abrir pull request sai da lista do agente? Proposta: sim, para não haver dois caminhos de abertura.

### Do product-owner

Nenhuma.
