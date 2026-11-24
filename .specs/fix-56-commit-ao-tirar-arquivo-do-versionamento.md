# Regra de git: commit ao tirar um arquivo do controle de versão mantendo-o na pasta

> Status: em-andamento
> Tipo: bug
> Tamanho: media
> Branch: fix/56-commit-ao-tirar-arquivo-do-versionamento
> Criada em: 2026-11-23

## Comportamento observado

A regra de git do time manda commitar sempre informando exatamente quais arquivos entram no commit. Quando o trabalho é tirar um arquivo do controle de versão e manter o arquivo na pasta do projeto, essa forma de commitar não funciona: o git responde que não há nada para commitar, porque o arquivo continua existindo na pasta e passa a ser visto como um arquivo novo, fora do controle. A remoção preparada só é commitada quando o commit é feito sem informar arquivos, o que a regra hoje proíbe na prática.

## Comportamento esperado

A regra prevê esse caso e diz exatamente o que fazer: o agente confere a lista do que está preparado para commit; se ali estiver apenas essa remoção e, quando houver, a linha que ele mesmo acrescentou ao arquivo de ignorados do git para esse arquivo, commita os dois juntos sem informar arquivos; se houver algo preparado por outro agente, pede ao dono que commite antes e espera. Antes de preparar o arquivo de ignorados, o agente confere o que mudou nele; se houver mudança de outro agente ali, não o prepara e pede ao dono que commite antes. Os agentes que commitam citam essa exceção de forma curta e remetem à regra de git. Todos os outros casos continuam com o commit informando os arquivos, e os atalhos proibidos continuam proibidos.

## Impacto

- Afeta todo agente que commita (devs e executor) nos repositórios que recebem a regra de git.
- Na issue #56, dois agentes toparam com isso no mesmo trabalho: um commitou sem informar arquivos, o que pode levar junto o trabalho de outro agente; o outro terminou com dois commits, um deles com a mensagem errada.
- Sem instrução, cada agente improvisa.

## Como reproduzir

1. Em um repositório com um arquivo já versionado, tire esse arquivo do controle de versão mantendo-o na pasta.
2. Faça o commit informando o caminho desse arquivo, como a regra manda.
3. O git responde que não há nada para commitar, e a remoção continua preparada sem ser commitada.
4. Faça o commit sem informar arquivos: a remoção é commitada.

## Evidência

- Issue #56 do repositório do time, com o relato dos dois agentes.
- Reprodução feita pela orchestrator em um repositório temporário: com o commit informando o caminho, nada é commitado e o arquivo continua na pasta como não versionado; com o commit sem caminhos, a remoção entra.
- Leitura da regra atual: a parte de commit só prevê arquivo novo (adicionar antes) e arquivo removido de verdade (remover antes).

## Causa suspeita

Hipótese: a regra foi escrita pensando só em arquivos que existem no controle e na pasta, ou em arquivos apagados da pasta. No caso de tirar do controle mantendo na pasta, informar o caminho no commit faz o git olhar o arquivo da pasta, que já não está no controle, e ignorar a remoção preparada.

## Regras

- RN-01: Ao tirar um arquivo do controle de versão mantendo-o na pasta, e só nesse caso, o agente pode commitar sem informar arquivos. Fonte: decisão do usuário na issue #56.
- RN-02: Antes desse commit, o agente confere a lista do que está preparado para commit e só segue se ali estiver apenas essa remoção e, quando houver, a linha que ele mesmo acrescentou ao arquivo de ignorados do git para esse arquivo. Os dois vão juntos no mesmo commit sem informar arquivos. Fonte: decisão do usuário na issue #56 e resposta do usuário à dúvida do arquivo de ignorados.
- RN-03: Se houver na lista algo preparado por outro agente, o agente pede ao dono que commite antes e espera, em vez de levar o trabalho dele junto. Fonte: decisão do usuário na issue #56.
- RN-04: A exceção não autoriza nenhum atalho já proibido: adicionar tudo de uma vez, adicionar só o que já está no controle, marcar arquivo novo como intenção de adicionar, nem commitar tudo o que mudou. Fonte: decisão do usuário na issue #56, relatada pela orchestrator.
- RN-05: Fora desse caso, continua valendo o commit informando os arquivos. Fonte: regra de git atual.
- RN-06: A alteração no arquivo de ignorados do git é opcional: só entra no commit quando o próprio agente acrescentou uma linha para aquele arquivo. Sem ela, o commit leva só a remoção. Fonte: decisão do usuário, a partir da revisão da T1.
- RN-07: Antes de preparar o arquivo de ignorados do git para o commit, o agente confere o que mudou nele. Se houver mudança de outro agente, não o prepara e pede ao dono que commite antes. Fonte: decisão do usuário, a partir da revisão da T1.
- RN-08: Os agentes que commitam (devs e executor) citam a exceção de forma curta, remetendo à regra de git, sem repetir o passo a passo. Fonte: decisão do usuário, a partir da revisão da T1.

A memória do time registra a mesma decisão, mas sua lista de atalhos proibidos não cita o de marcar arquivo novo como intenção de adicionar. Vale a lista relatada pela orchestrator, que o inclui (RN-04).

## Critérios de aceite

- CA-01: QUANDO um agente lê a regra de git ENTÃO a regra DEVE descrever o caso de tirar um arquivo do controle de versão mantendo-o na pasta. (RN-01)
- CA-02: QUANDO o agente vai commitar essa remoção ENTÃO a regra DEVE mandar conferir antes a lista do que está preparado para commit e só commitar sem informar arquivos se ali estiver apenas essa remoção e, quando houver, a linha que o próprio agente acrescentou ao arquivo de ignorados do git para esse arquivo, as duas no mesmo commit. (RN-01, RN-02)
- CA-03: QUANDO a lista do que está preparado para commit tem algo de outro agente ENTÃO a regra DEVE mandar pedir ao dono que commite antes e esperar. (RN-03)
- CA-04: QUANDO um agente lê a exceção ENTÃO a regra DEVE continuar proibindo todos os atalhos já proibidos, sem nenhuma frase que os libere. (RN-04)
- CA-05: QUANDO o commit não é a retirada de um arquivo do controle mantendo-o na pasta ENTÃO a regra DEVE continuar mandando commitar informando os arquivos, como antes. (RN-05)
- CA-06: QUANDO a suíte de testes roda ENTÃO DEVE haver um teste que exige o trecho da exceção na regra, escrito antes da mudança e visto falhar, e todos os testes que já passavam DEVEM continuar passando. (RN-01 a RN-05)
- CA-07: QUANDO a retirada do arquivo do controle não vem com alteração no arquivo de ignorados ENTÃO a regra DEVE deixar claro que o commit leva só a remoção, e que o arquivo de ignorados só entra quando houver a linha que o próprio agente acrescentou para aquele arquivo. (RN-02, RN-06)
- CA-08: QUANDO o agente vai preparar o arquivo de ignorados para esse commit ENTÃO a regra DEVE mandar conferir antes o que mudou nele. (RN-07)
- CA-09: QUANDO o arquivo de ignorados tem mudança de outro agente ENTÃO a regra DEVE mandar não prepará-lo e pedir ao dono que commite antes. (RN-03, RN-07)
- CA-10: QUANDO um agente que commita (cada um dos devs e o executor) lê as próprias instruções ENTÃO elas DEVEM citar a exceção de tirar arquivo do controle mantendo-o na pasta e remeter à regra de git, sem repetir o passo a passo da conferência. (RN-08)
- CA-11: QUANDO um agente que commita lê as próprias instruções ENTÃO elas DEVEM continuar mandando commitar informando os arquivos e proibindo os mesmos atalhos de antes. (RN-04, RN-05)
- CA-12: QUANDO a suíte de testes roda ENTÃO DEVE haver testes que exigem os trechos novos da regra e dos agentes, escritos antes de cada mudança e vistos falhar, e todos os testes que já passavam DEVEM continuar passando. (RN-06 a RN-08)

## Fora do escopo

- Repetir nos agentes que commitam o passo a passo da exceção: eles só a citam e remetem à regra de git, que continua sendo a fonte única.
- Alterar agentes que não commitam (orchestrator, product-owner, sdd, reviewer, qa e designer). As stacks não têm agente que commita.
- Mudar outras regras, as skills ou a lista de formas proibidas de adicionar arquivos.
- Mudar o gancho de pré-commit ou a sincronização da pasta gerada, inclusive o problema do arquivo de travamento gravado desatualizado no commit com caminhos (issue #60), que segue à parte.

## Plano de execução

- Fase 1 (sequencial): T1 (feita)
- Gate de fase: `npm run lint`, `npm test` e `node bin/ai-sync.js --check`, rodados uma vez ao fim da fase e antes do reviewer.
- Fase 2 (sequencial): T2
- Gate de fase: `npm run lint`, `npm test` e `node bin/ai-sync.js --check`.
- Fase 3 (sequencial): T3
- Gate de fase: `npm run lint`, `npm test` e `node bin/ai-sync.js --check`, antes do reviewer.

Não há tarefa `[P]`. T2 e T3 editam o mesmo arquivo de teste (`tests/agents.test.js`), e o gancho de pré-commit roda `npm run sync` e adiciona ao stage toda a pasta `.claude/` gerada (`git add -A -- .claude/agents .claude/rules ...`): com as duas em andamento na mesma worktree, o commit de uma levaria a cópia gerada dos arquivos ainda não commitados da outra. T3 vem depois de T2 para que o texto curto dos agentes remeta à regra já ajustada. O projeto não tem typecheck.

## Tarefas

### T1 Acrescenta à regra de git a exceção conferida para tirar arquivo do controle mantendo-o na pasta

- O quê: incluir na regra de git o caso de tirar arquivo do controle mantendo-o na pasta, com a conferência da lista preparada (só a remoção e, quando houver, a linha do próprio agente no `.gitignore` para esse arquivo, no mesmo commit) e o pedido ao dono, coberto por um teste novo.
- Onde: `rules/git-standard.md`, seção `## Commit`, em um item novo logo depois do item que manda commitar com caminhos explícitos; `tests/agents.test.js`, teste novo junto dos testes do padrão de git. O `.claude/rules/git-standard.md` é regenerado pelo gancho `.githooks/pre-commit` (que roda `npm run sync`) e entra no commit junto; nunca editá-lo à mão.
- Dev: Inumaki (dev-backend)
- Depende de: nada
- Reaproveita: a forma dos testes existentes do padrão de git (leitura de `catalog.rules['git-standard'].path` e `assert.match`/`assert.ok`) e a redação já usada na seção `## Isolar uma falha` ("avise o dono do arquivo e espere ele commitar").
- Atende: RN-01, RN-02, RN-03, RN-04, RN-05; CA-01 a CA-06
- Texto que o teste e a regra devem ter em comum (âncoras):
  - `git rm --cached`
  - `git diff --cached --name-status`
  - a condição de haver no stage apenas essa remoção e, quando houver, a linha que o próprio agente acrescentou ao `.gitignore` para esse arquivo, as duas no mesmo commit sem caminhos
  - `.gitignore`
  - o pedido ao dono para commitar antes e esperar, reaproveitando "espere ele commitar"
- Pronto quando:
  - o teste novo falhou antes da mudança na regra, pelo motivo certo (trecho ausente), e passa depois;
  - o teste novo também confere que `git add .`, `git add -A`, `git add -N`, `--intent-to-add`, `git add -u` e `git commit -a` continuam no texto e que o exemplo `git commit -m "..." -- caminho/a.ts caminho/b.ts` continua lá;
  - o gate passa;
  - `git show --stat --name-status HEAD` lista só `rules/git-standard.md`, `tests/agents.test.js` e `.claude/rules/git-standard.md`, mais o `.claude/claude-core.lock.json`, também regenerado pelo gancho de pré-commit e esperado no commit.
- Teste: unitário de conteúdo. Deve falhar primeiro o teste novo "o padrão de git explica como commitar ao tirar um arquivo do controle de versão mantendo-o na pasta", em `tests/agents.test.js`.
- Gate: `npm run lint` e `npm test`. O projeto não tem typecheck nem formatador; o lint (`oxlint` e `node lint/content.js`) é a checagem de formato.
- Modelo: economico
- Status: feita. Commit `3d8f1f9`, feito pelo Inumaki (dev-backend). O teste novo falhou antes da mudança na regra (refeito pelo Kusakabe em uma worktree descartável: AssertionError pelo trecho ausente) e passa depois. Gate: `npm run lint` ok, `npm test` 113/113, `node bin/ai-sync.js --check` ok. O `.claude/` gerado foi conferido com `npm run sync` em uma cópia isolada, sem diferença. Revisão: aprovada pelo Kusakabe (reviewer).

### T2 Deixa opcional a linha do .gitignore na exceção e manda conferir o .gitignore antes de prepará-lo

- O quê: ajustar a exceção da regra de git para dizer que o `.gitignore` só entra quando houver a linha que o próprio agente acrescentou para aquele arquivo, e mandar conferir o `.gitignore` com `git diff .gitignore` antes de adicioná-lo, sem adicioná-lo se houver mudança de outro agente.
- Onde: `rules/git-standard.md`, só o item da exceção na seção `## Commit`; `tests/agents.test.js`, o teste "o padrão de git explica como commitar ao tirar um arquivo do controle de versão mantendo-o na pasta" (âncora do `.gitignore` ajustada) e, se preferir, um teste novo para a conferência do `.gitignore`. O `.claude/rules/git-standard.md` e o `.claude/claude-core.lock.json` são regenerados pelo gancho de pré-commit; nunca editá-los à mão.
- Dev: Inumaki (dev-backend)
- Depende de: T1
- Reaproveita: o teste da T1 e a redação "peça ao dono que commite antes e espere ele commitar", já usada na exceção.
- Atende: RN-02, RN-03, RN-06, RN-07; CA-02, CA-03, CA-07, CA-08, CA-09, CA-12
- Texto que o teste e a regra devem ter em comum (âncoras):
  - "quando houver" ligado à linha que o próprio agente acrescentou ao `.gitignore` para aquele arquivo (substitui a âncora atual "apenas essa remoção e o `.gitignore` que você mesmo alterou")
  - `git diff .gitignore`
  - a instrução de não adicionar o `.gitignore` e pedir ao dono que commite antes quando houver mudança de outro agente
- Pronto quando:
  - o teste com as âncoras novas falhou antes da mudança na regra, pelo motivo certo (trecho ausente), e passa depois;
  - as âncoras da T1 que não mudaram (`git rm --cached`, `git diff --cached --name-status`, o pedido ao dono, os atalhos proibidos e o exemplo de commit por caminho) continuam exigidas e passando;
  - o gate passa;
  - `git show --stat --name-status HEAD` lista só `rules/git-standard.md`, `tests/agents.test.js`, `.claude/rules/git-standard.md` e `.claude/claude-core.lock.json` (os dois últimos regenerados pelo gancho). Se o arquivo de travamento entrar desatualizado, é o caso da issue #60: relatar à orchestrator, sem corrigir nesta tarefa.
- Teste: unitário de conteúdo. Deve falhar primeiro o teste do padrão de git com as âncoras novas do `.gitignore` opcional e do `git diff .gitignore`.
- Gate: `npm run lint` e `npm test`. O projeto não tem typecheck nem formatador; o lint (`oxlint` e `node lint/content.js`) é a checagem de formato.
- Modelo: padrao
- Status: pendente

### T3 Faz os agentes que commitam citarem a exceção de forma curta, remetendo à regra de git

- O quê: acrescentar, no item de commit de cada agente que commita, uma frase curta que cita a exceção de tirar arquivo do controle mantendo-o na pasta e remete à regra de git, sem repetir o passo a passo.
- Onde: `agents/dev-frontend.md`, `agents/dev-backend.md`, `agents/dev-mobile.md`, `agents/dev-devops.md`, `agents/dev-database.md`, `agents/dev-fullstack.md`, `agents/dev-doc.md` e `agents/executor.md`, no item que hoje diz "adicione e commite só os seus arquivos, por caminho exato"; `tests/agents.test.js`, o teste "todo agente que commita manda adicionar e commitar só os próprios arquivos, por caminho exato" ou um teste novo sobre a mesma lista `committers`. Nenhum agente de `stacks/` commita. A cópia gerada em `.claude/agents/` e o `.claude/claude-core.lock.json` são regenerados pelo gancho de pré-commit; nunca editá-los à mão.
- Dev: Inumaki (dev-backend), podendo delegar ao executor
- Depende de: T2
- Reaproveita: a lista `committers` e a forma do teste existente; a mesma frase nos 8 agentes, como já acontece com a frase de commit por caminho.
- Atende: RN-04, RN-05, RN-08; CA-10, CA-11, CA-12
- Texto que o teste e os agentes devem ter em comum (âncoras):
  - "tirar um arquivo do controle de versão mantendo-o na pasta"
  - `git rm --cached`
  - a remissão a `.claude/rules/git-standard.md` na mesma frase
  - o teste também exige que o agente não traga `git diff --cached --name-status` nem `git diff .gitignore`, para garantir que o passo a passo não foi repetido
- Pronto quando:
  - o teste novo falhou antes da mudança nos agentes, pelo motivo certo (trecho ausente), e passa depois para os 8 agentes;
  - as asserções atuais (citar `git-standard.md`, `git commit -m "..." -- caminhos` e a lista de atalhos proibidos) continuam passando;
  - o gate passa;
  - `git show --stat --name-status HEAD` lista só os 8 arquivos de `agents/`, `tests/agents.test.js`, as 4 cópias em `.claude/agents/` que o perfil `tooling` instala (`executor.md`, `dev-backend.md`, `dev-devops.md` e `dev-doc.md`) e `.claude/claude-core.lock.json`. Se o arquivo de travamento entrar desatualizado, é o caso da issue #60: relatar à orchestrator, sem corrigir nesta tarefa.
- Teste: unitário de conteúdo. Deve falhar primeiro o teste que exige a citação curta da exceção em cada agente que commita.
- Gate: `npm run lint` e `npm test`. O projeto não tem typecheck nem formatador; o lint (`oxlint` e `node lint/content.js`) é a checagem de formato.
- Modelo: economico
- Status: pendente

## Dúvidas

Product-owner: nenhuma.

Usuário: nenhuma.
