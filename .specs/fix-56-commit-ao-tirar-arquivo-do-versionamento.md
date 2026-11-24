# Regra de git: commit ao tirar um arquivo do controle de versão mantendo-o na pasta

> Status: aprovada
> Tipo: bug
> Tamanho: media
> Branch: fix/56-commit-ao-tirar-arquivo-do-versionamento
> Criada em: 2026-11-23

## Comportamento observado

A regra de git do time manda commitar sempre informando exatamente quais arquivos entram no commit. Quando o trabalho é tirar um arquivo do controle de versão e manter o arquivo na pasta do projeto, essa forma de commitar não funciona: o git responde que não há nada para commitar, porque o arquivo continua existindo na pasta e passa a ser visto como um arquivo novo, fora do controle. A remoção preparada só é commitada quando o commit é feito sem informar arquivos, o que a regra hoje proíbe na prática.

## Comportamento esperado

A regra prevê esse caso e diz exatamente o que fazer: o agente confere a lista do que está preparado para commit; se ali estiver apenas essa remoção e, quando houver, a linha que ele mesmo acrescentou ao arquivo de ignorados do git para esse arquivo, commita os dois juntos sem informar arquivos; se houver algo preparado por outro agente, pede ao dono que commite antes e espera. Todos os outros casos continuam com o commit informando os arquivos, e os atalhos proibidos continuam proibidos.

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

A memória do time registra a mesma decisão, mas sua lista de atalhos proibidos não cita o de marcar arquivo novo como intenção de adicionar. Vale a lista relatada pela orchestrator, que o inclui (RN-04).

## Critérios de aceite

- CA-01: QUANDO um agente lê a regra de git ENTÃO a regra DEVE descrever o caso de tirar um arquivo do controle de versão mantendo-o na pasta. (RN-01)
- CA-02: QUANDO o agente vai commitar essa remoção ENTÃO a regra DEVE mandar conferir antes a lista do que está preparado para commit e só commitar sem informar arquivos se ali estiver apenas essa remoção e, quando houver, a linha que o próprio agente acrescentou ao arquivo de ignorados do git para esse arquivo, as duas no mesmo commit. (RN-01, RN-02)
- CA-03: QUANDO a lista do que está preparado para commit tem algo de outro agente ENTÃO a regra DEVE mandar pedir ao dono que commite antes e esperar. (RN-03)
- CA-04: QUANDO um agente lê a exceção ENTÃO a regra DEVE continuar proibindo todos os atalhos já proibidos, sem nenhuma frase que os libere. (RN-04)
- CA-05: QUANDO o commit não é a retirada de um arquivo do controle mantendo-o na pasta ENTÃO a regra DEVE continuar mandando commitar informando os arquivos, como antes. (RN-05)
- CA-06: QUANDO a suíte de testes roda ENTÃO DEVE haver um teste que exige o trecho da exceção na regra, escrito antes da mudança e visto falhar, e todos os testes que já passavam DEVEM continuar passando. (RN-01 a RN-05)

## Fora do escopo

- Alterar os 8 agentes que commitam (devs e executor). Eles já mandam seguir a regra de git e o teste atual confere neles a frase de commit por caminho; a exceção fica só na regra, que é a fonte que eles citam. Mexer neles traria mudança repetida sem ganho.
- Mudar outras regras, as skills ou a lista de formas proibidas de adicionar arquivos.
- Mudar o gancho de pré-commit ou a sincronização da pasta gerada.

## Plano de execução

- Fase 1 (sequencial): T1
- Gate de fase: `npm run lint`, `npm test` e `node bin/ai-sync.js --check`, rodados uma vez ao fim da fase e antes do reviewer.

Não há tarefa `[P]`: é um único dev com uma única tarefa, pequena, em que o teste e a regra precisam entrar no mesmo commit para não deixar commit com teste quebrado.

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

## Dúvidas

Product-owner: nenhuma.

Usuário: nenhuma.
