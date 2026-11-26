# Publicar o claude-kit no npm com versões automáticas

> Status: em-andamento
> Tipo: funcionalidade
> Tamanho: grande
> Branch: feat/109-publicacao-no-npm
> Criada em: 2026-11-25
> Revisão: o Reviewer aprovou T1 a T9 e o encaixe entre elas, sem achado bloqueante. Falta a validação do QA.

Issue: #109 de felipe-sant/claude-kit. Pedido por: Dev Ops 1.

## Objetivo

Hoje cada repositório usa o claude-kit a partir de um clone local, sem versão. A mudança publica o claude-kit no npm como `@felipe-sant/claude-kit`. Assim cada repositório declara qual versão do time usa, atualiza subindo a versão e pode voltar a uma versão anterior. O lançamento de versões fica automático: cada pull request traz uma nota de mudança, a entrada na `main` abre o pull request de versão, e o merge dele cria a tag, o Release e publica no npm. O comando continua sendo o `ai-sync`, chamado pelo `npx`.

## Regras

- RN-01: O pacote se chama `@felipe-sant/claude-kit`, é público, e o comando é o `ai-sync`, chamado pelo `npx`. Fonte: usuário (issue #109).
- RN-02: A primeira versão publicada é a 1.0.0. Ela vem de uma nota de mudança do tipo major, que entra no próprio pull request desta tarefa sobre a versão atual, 0.1.0. Fonte: usuário (issue #109).
- RN-03: Só existe a `main`, sem staging nem promoção. Todo pull request traz uma nota de mudança. Mudança que não altera a versão (documentação, CI, testes) traz uma nota vazia. Fonte: usuário (issue #109).
- RN-04: O CI reprova o pull request sem nota de mudança. O pull request de versão fica de fora dessa checagem. Fonte: usuário (issue #109).
- RN-05: A entrada de um pull request na `main` abre o pull request de versão, ou o atualiza se ele já existir. O título e a mensagem do commit são "Chore :see_no_evil: Atualiza versão e CHANGELOG", e o texto fixo da descrição fica em português. Fonte: usuário (issue #109).
- RN-06: O merge do pull request de versão cria a tag `vX.Y.Z`, cria o Release com a seção daquela versão do CHANGELOG e publica a versão no npm. Versão que já tem tag não é publicada de novo. Fonte: usuário (issue #109).
- RN-07: O pull request de versão também atualiza a cópia do time que este repositório usa em si mesmo (a pasta gerada pelo próprio `ai-sync`). O registro dessa cópia guarda a versão do claude-kit, e a checagem de sincronia é rígida. Fonte: usuário (issue #109).
- RN-08: Regra de versão. major: remove ou renomeia um agente, uma regra ou uma skill, muda o fluxo do time ou quebra uma opção do `ai-sync`. minor: novo agente, regra, skill, stack ou opção. patch: ajuste de texto, correção ou mudança que não quebra nada. Fonte: usuário (issue #109).
- RN-09: O agente de issues cria a nota de mudança nos pull requests que abre, pela regra de versão: patch para correção ou ajuste que não quebra nada, minor para um item ou uma opção nova pequena (a issue continua P) e nota vazia para documentação, CI ou testes. O texto da nota é em português simples. Fonte: usuário (issue #109) e product-owner (resposta à dúvida P1).
- RN-10: A publicação usa o trusted publishing do npm. Nenhum token fica guardado no repositório, e a publicação automática leva a prova de origem. Fonte: usuário (issue #109).
- RN-11: O npm só deixa ligar o trusted publishing na página de um pacote que já existe. Por isso a 1.0.0 é publicada à mão pelo dono, e a automação assume a partir da versão seguinte. Fonte: usuário (issue #109, conferido na documentação do npm).
- RN-12: O pacote leva só o que o `ai-sync` usa para funcionar. Testes, lint, automações do GitHub, o agente de issues, as especificações e os scripts de versão ficam de fora. Fonte: usuário (issue #109).
- RN-13: O `ai-sync` instalado pelo npm continua sem apagar nem sobrescrever arquivo do usuário. Fonte: usuário (issue #109) e garantia do repositório.
- RN-14: Os scripts novos não têm dependências de execução e têm testes. As ferramentas de notas de mudança entram só como dependências de desenvolvimento. Fonte: usuário (issue #109).
- RN-15: O README e as instruções do projeto para os agentes explicam como instalar e atualizar pelo npm, como escrever a nota de mudança, a regra de versão e os passos do dono. As instruções do projeto para os agentes trazem a regra direta "Todo PR traz uma nota de mudança (changeset), criada no mesmo PR: patch, minor ou major pela regra de versão, ou vazia para documentação, textos (como o README), CI e testes." Assim o agente cria a nota sempre, sem o usuário precisar lembrar. Fonte: usuário (issue #109 e aprovação da especificação).
- RN-16: As checagens que o CI já roda (lint, testes e checagem das automações) continuam passando. A cópia do time que o próprio `ai-sync` gera neste repositório nunca é editada à mão. Fonte: usuário (issue #109) e garantia do repositório.
- RN-17: O pull request de versão não ganha token de app nem exceção na regra da `main`. Antes do merge dele, depois da última atualização automática, o dono fecha e reabre o pull request para o CI rodar. Isso fica nos passos do dono. Fonte: usuário (decisão sobre a dúvida U1).
- RN-18: A 1.0.0 é publicada à mão pelo dono a partir da branch do pull request de versão, antes do merge dele, sem nenhum outro pull request entrar na `main` no meio. O trusted publishing é ligado depois, logo antes da primeira versão automática, e a automação cria a tag e o Release da 1.0.0 sem publicar de novo. Fonte: usuário (decisão sobre a dúvida U2, opção A).
- RN-19: A checagem "Changeset" passa a ser obrigatória na regra da `main`. O dono faz essa mudança depois do merge desta tarefa. Fonte: usuário (decisão sobre a dúvida U3).
- RN-20: O pacote usa a licença MIT, com titular Luiz Felipe e ano 2026, e a descrição do pacote informa essa licença. Fonte: usuário (decisão sobre a dúvida U4).
- RN-21: Os títulos de seção que a ferramenta de notas escreve sozinha em inglês no CHANGELOG e na lista do pull request de versão ficam como estão. Só o parágrafo fixo da descrição do pull request de versão é traduzido. Fonte: usuário (decisão sobre a dúvida U5).
- RN-22: Mudança major pela regra de versão nunca é P. A classificação de tamanho trata como M toda mudança que a regra de versão classifica como major. O agente de issues conhece a regra de versão completa e, se perceber durante a execução que a mudança é major, para, explica o motivo na issue e troca P por M, sem deixar pull request, como já faz quando a issue P é maior do que parecia. Fonte: product-owner (resposta à dúvida P1).

## Critérios de aceite

- CA-01: QUANDO alguém confere o pacote que vai para o npm ENTÃO o sistema DEVE mostrar o nome `@felipe-sant/claude-kit`, o acesso público e o comando `ai-sync`. Cobre RN-01.
- CA-02: QUANDO alguém lista os arquivos que o pacote leva ENTÃO o sistema DEVE mostrar só o comando, o catálogo, os agentes, as regras, as skills, as stacks, os modelos de configuração, os perfis e os arquivos que o npm sempre inclui (descrição do pacote, README e licença), e nenhum teste, lint, automação do GitHub, agente de issues, especificação, nota de mudança, script de versão ou cópia gerada do time. Cobre RN-12 e RN-20.
- CA-03: QUANDO um repositório instala o pacote empacotado e roda o `ai-sync` pelo `npx` ENTÃO o sistema DEVE instalar o time como hoje e registrar a versão do pacote em cada arquivo instalado. Cobre RN-01 e RN-13.
- CA-04: QUANDO o repositório que instalou o pacote já tem um arquivo próprio com o mesmo nome de um arquivo do time ENTÃO o sistema DEVE manter esse arquivo como estava e avisar que há conflito. Cobre RN-13.
- CA-05: QUANDO um pull request para a `main` não traz nota de mudança ENTÃO o sistema DEVE reprovar a checagem de nota de mudança. Cobre RN-03 e RN-04.
- CA-06: QUANDO um pull request traz uma nota vazia ou uma nota com tipo ENTÃO o sistema DEVE aprovar a checagem de nota de mudança. Cobre RN-03.
- CA-07: QUANDO o pull request é o de versão ENTÃO o sistema NÃO DEVE rodar a checagem de nota de mudança. Cobre RN-04.
- CA-08: QUANDO um pull request com nota de tipo entra na `main` ENTÃO o sistema DEVE abrir ou atualizar o pull request de versão. Ele deve ter o título "Chore :see_no_evil: Atualiza versão e CHANGELOG", a nova versão, o CHANGELOG atualizado e o texto fixo em português no lugar do texto padrão em inglês. Cobre RN-05.
- CA-09: QUANDO o pull request de versão é criado ou atualizado ENTÃO o sistema DEVE trazer no mesmo pull request a cópia do time deste repositório regenerada, com a nova versão em todos os arquivos. O commit da automação não pode ser recusado pela checagem de sincronia, e a checagem de sincronia do CI deve passar nele. Cobre RN-07.
- CA-10: QUANDO só entram na `main` notas vazias ENTÃO o sistema NÃO DEVE abrir pull request de versão. Cobre RN-03 e RN-05.
- CA-11: QUANDO o pull request de versão entra na `main` com uma versão a partir da 1.0.0 que ainda não tem tag ENTÃO o sistema DEVE publicar a versão no npm com prova de origem, criar a tag `vX.Y.Z` e criar o Release com a seção daquela versão do CHANGELOG. Cobre RN-06 e RN-10.
- CA-12: QUANDO a versão da `main` já tem tag ENTÃO o sistema NÃO DEVE publicar nem criar tag ou Release de novo. Cobre RN-06.
- CA-13: QUANDO a versão ainda não tem tag mas já está no npm (caso da 1.0.0 publicada à mão) ENTÃO o sistema DEVE criar a tag e o Release e NÃO DEVE tentar publicar de novo. Cobre RN-06 e RN-11.
- CA-14: QUANDO a versão da `main` é menor que 1.0.0 (caso do merge desta tarefa, ainda na 0.1.0) ENTÃO o sistema NÃO DEVE publicar nem criar tag ou Release. Cobre RN-02.
- CA-15: QUANDO a publicação no npm falha ENTÃO o sistema NÃO DEVE criar a tag. Rodar a automação de novo deve tentar publicar outra vez. Cobre RN-06.
- CA-16: QUANDO a consulta ao npm falha por um motivo que não seja "versão não encontrada" ENTÃO o sistema DEVE parar com erro, sem publicar e sem criar tag. Cobre RN-06.
- CA-17: QUANDO o CHANGELOG não tem a seção da versão ENTÃO o sistema DEVE parar com erro em português, sem publicar e sem criar tag. Cobre RN-06.
- CA-18: QUANDO alguém lê a configuração do repositório ENTÃO o sistema NÃO DEVE ter token do npm guardado nem passado à publicação. Cobre RN-10.
- CA-19: QUANDO o agente de issues abre um pull request de correção ou de ajuste que não quebra nada ENTÃO o pull request DEVE trazer uma nota de mudança patch em português simples. Cobre RN-09.
- CA-20: QUANDO o agente de issues abre um pull request só de documentação, CI ou testes ENTÃO o pull request DEVE trazer uma nota vazia. Cobre RN-09.
- CA-21: QUANDO a branch do agente de issues não traz nota de mudança ENTÃO o sistema NÃO DEVE abrir o pull request e DEVE registrar o motivo na issue, como já faz nas outras recusas. Cobre RN-04 e RN-09.
- CA-22: QUANDO alguém lê o README e as instruções do projeto ENTÃO o sistema DEVE explicar como instalar e atualizar pelo npm, como escrever a nota de mudança (com tipo ou vazia), a regra de versão e os passos do dono, e as instruções do projeto DEVEM trazer, com esse sentido, a regra direta "Todo PR traz uma nota de mudança (changeset), criada no mesmo PR: patch, minor ou major pela regra de versão, ou vazia para documentação, textos (como o README), CI e testes." Cobre RN-08, RN-11 e RN-15.
- CA-23: QUANDO a suíte, o lint, a checagem do catálogo e a checagem das automações rodam depois da mudança ENTÃO o sistema DEVE aprovar todas. Cobre RN-14 e RN-16.
- CA-24: QUANDO alguém confere o repositório e a descrição do pacote ENTÃO o sistema DEVE ter o arquivo de licença MIT com o titular Luiz Felipe e o ano 2026, e a descrição do pacote DEVE informar a licença MIT. Cobre RN-20.
- CA-25: QUANDO alguém lê os passos do dono no README ENTÃO eles DEVEM trazer, na ordem, tornar a checagem "Changeset" obrigatória depois do merge desta tarefa, a publicação da 1.0.0 à mão antes do merge do pull request de versão e o fechar e reabrir do pull request de versão antes de cada merge dele. Cobre RN-17, RN-18 e RN-19.
- CA-26: QUANDO o agente de issues abre um pull request que adiciona um item ou uma opção nova pequena (agente, regra, skill, stack ou opção do `ai-sync`) ENTÃO o pull request DEVE trazer uma nota de mudança minor em português simples, e a issue DEVE continuar P. Cobre RN-08 e RN-09.
- CA-27: QUANDO o agente de issues percebe, durante a execução, que a mudança é major pela regra de versão ENTÃO o sistema DEVE parar sem enviar branch nem abrir pull request, comentar o motivo na issue e trocar o tamanho P por M. Cobre RN-08 e RN-22.
- CA-28: QUANDO a classificação de tamanho avalia uma issue cuja mudança é major pela regra de versão ENTÃO o sistema DEVE classificá-la como M, nunca como P. Cobre RN-08 e RN-22.
- CA-29: QUANDO alguém lê as instruções do agente de issues ENTÃO elas DEVEM trazer a regra de versão completa (major, minor e patch) e a nota vazia para documentação, CI ou testes. Cobre RN-08 e RN-09.

## Critérios de sucesso

- A versão 1.0.0 está no npm como `@felipe-sant/claude-kit`, pública, e existe a tag `v1.0.0` com o Release.
- Em um repositório qualquer, instalar o pacote e rodar `npx ai-sync` monta o time como o clone local montava.
- A versão seguinte (a primeira automática) sai sozinha depois do merge do pull request de versão, com prova de origem no npm, sem ninguém publicar à mão.
- Nenhum pull request entra na `main` sem nota de mudança, e o CI atual continua verde.

## Fora do escopo

- Ambiente de staging e promoção entre branches: o repositório só tem a `main` (RN-03). Por isso o verificador de notas pendentes do portfolio, que só serve à promoção, não é trazido.
- Dependabot ou Renovate nos repositórios que usam o pacote: é configuração de cada consumidor.
- Mudanças no `ai-sync` além do que o empacotamento exigir. Hoje ele acha o conteúdo a partir da pasta do próprio comando, o que já funciona dentro do pacote instalado (ver Desenho). Uma mudança só entra se o teste de instalação provar que é necessária.
- Mudar a classificação de tamanho das issues ou o fluxo do time. A única mudança na classificação é a de RN-22: mudança major pela regra de versão é M. O resto dos critérios de tamanho fica como está.
- Uma regra da nota de mudança para os repositórios consumidores: a regra vale só para este repositório e fica no README e nas instruções do projeto, nunca nas regras copiadas pelo `ai-sync`.
- Traduzir os títulos de seção que a ferramenta de notas escreve sozinha no CHANGELOG e na lista do pull request de versão: por decisão do usuário, eles ficam em inglês (RN-21).

## Desenho

### Peças e quem é dono

| Peça | O que faz | Dono |
| --- | --- | --- |
| Descrição do pacote (`package.json` e `package-lock.json`) | Nome, acesso, licença, arquivos levados, scripts de versão, dependências de desenvolvimento | Dev Ops 1 (só ele edita) |
| `LICENSE` | Texto da licença MIT, titular Luiz Felipe, ano 2026 | Dev Ops 1 |
| `.changeset/config.json` e `.changeset/README.md` | Configuração da ferramenta de notas de mudança e explicação curta | Dev Ops 1 |
| Nota major inicial em `.changeset/` | Gera a 1.0.0 no primeiro pull request de versão | Dev Ops 1 |
| `.github/workflows/changeset-check.yml` | Reprova pull request sem nota | Dev Ops 1 |
| `.github/workflows/version.yml` e scripts do texto do PR de versão | Abre ou atualiza o pull request de versão | Dev Ops 1 |
| `.github/workflows/release.yml` e scripts de release | Publica, cria a tag e o Release | Dev Ops 1 |
| `.github/issue-agent/agent-prompt.md`, `.github/issue-agent/size-set-prompt.md` e `.github/issue-agent/open-pull-request.js` | Agente cria a nota pela regra de versão e para no major, a classificação trata major como M, e a abertura do pull request confere se a nota existe | Dev Ops 2 |
| `README.md` e `.claude/CLAUDE.md` | Documentação | Dev Doc |

### Contrato (fixado pela T1, consumido por T2 a T9)

- Nota de mudança: arquivo `.changeset/<nome-em-kebab-case>.md`, com nome único. A sugestão é usar o nome da branch com `/` trocado por `-` (ex.: `fix-123-corrige-x.md`).
- Nota com tipo: cabeçalho YAML com uma única linha `"@felipe-sant/claude-kit": patch`, `minor` ou `major`, seguido de um corpo em português simples de uma ou duas linhas:

```
---
"@felipe-sant/claude-kit": patch
---

Corrige a mensagem do ai-sync quando a pasta não existe.
```

- Nota vazia: exatamente o que `changeset add --empty` gera. A conferência com `@changesets/cli` 3 deu os bytes `---\n\n---\n\n\n` (cabeçalho com uma linha em branco e sem corpo). O validador da T1 aceita também `---\n---\n` com ou sem linhas em branco depois, e nenhum outro conteúdo.
- O `.changeset/README.md` não é nota.
- Scripts do `package.json` que a T1 cria e que os outros usam pelo nome: `changeset` (`changeset`), `changeset:version` (`changeset version && npm install --package-lock-only --ignore-scripts && npm run sync:version`) e `sync:version` (`rm -f .claude/claude-kit.lock.json && npm run sync`). Os scripts `test`, `lint`, `sync` e `prepare` ficam como estão: o teste de sincronização confere `sync` e `prepare` literalmente.
- Branch do pull request de versão: `changeset-release/main`, o padrão do `changesets/action` para a base `main`.
- Saídas do script de release para o workflow: `tag` (`vX.Y.Z`), `release` (`true` ou `false`), `publish` (`true` ou `false`) e `notes-file` (caminho do arquivo com as notas, só quando `release=true`).

### Por que o `sync` sozinho não basta no pull request de versão (evidência)

Experimento feito em 2026-11-25, numa cópia desta worktree:
1. A versão do `package.json` foi trocada para 1.0.0 e o `npm run sync` foi rodado. Resultado: as 23 entradas do registro continuaram com a versão `0.1.0` e nenhuma passou para `1.0.0`. O `bin/ai-sync.js` mantém a versão já registrada quando o arquivo não mudou (`manifest[rel] = recorded && recorded.hash === sourceHash ? recorded : {...}`). Isso reprovou o teste "o .claude deste repositório está sincronizado com o perfil tooling", que compara com uma sincronização numa pasta vazia, onde tudo sai com a versão nova.
2. Depois disso, o registro `.claude/claude-kit.lock.json` foi apagado e o `npm run sync` foi rodado de novo. Resultado: as 23 entradas saíram com `1.0.0`, o `.claude/settings.json` ficou idêntico e o mesmo teste passou.

Por isso o `changeset:version` termina com o `sync:version`, que apaga o registro e roda o sync. O hook de pre-commit também compara com uma sincronização em pasta vazia (`.githooks/check-sync.js`). Sem o `sync:version`, ele recusaria o commit do pull request de versão.

O hook roda dentro do workflow de versão: o `npm ci` roda o `prepare`, que liga o `core.hooksPath`. O commit que o `changesets/action` faz por git passa pelo `.githooks/pre-commit` e precisa ser aceito.

Correção registrada na T3: o `changesets/action` commita pela API do GitHub, e não por git. Por isso o hook de pre-commit não roda no commit do pull request de versão, e o `.claude/` regenerado pelo `sync:version` entra pelo estado da árvore. O parágrafo acima vale como hipótese original.

### `ai-sync` dentro do pacote instalado

Em `bin/ai-sync.js`, `root = path.resolve(__dirname, '..')` aponta para a raiz do pacote em `node_modules/@felipe-sant/claude-kit`. A pasta alvo padrão é a pasta atual (`process.cwd()`). O comando lê `catalog.json`, `profiles/`, `package.json` (para a versão) e os caminhos do catálogo (`agents/`, `rules/`, `skills/`, `stacks/`, `templates/`). Logo o campo `files` é: `bin`, `catalog.json`, `agents`, `rules`, `skills`, `stacks`, `templates` e `profiles`. O npm inclui sozinho o `package.json`, o `README.md` e o `LICENSE`, que por isso não entra no `files`. O `.claude/` fica fora do pacote. O `bin/ai-sync.js` já é executável e começa com `#!/usr/bin/env node`. O campo `bin` deve ficar na forma que o npm não corrige sozinho (`bin/ai-sync.js`, sem `./`), para o `npm publish` não avisar.

### Pull request de versão (`version.yml`)

- Dispara em `push` na `main` e por `workflow_dispatch`. Permissões: `contents: write` e `pull-requests: write`. Concorrência sem cancelar.
- Passos: checkout com `fetch-depth: 0`, setup-node 22 com cache, `npm ci`, `changesets/action@v2` fixado por SHA (como a ação do Claude), com as entradas `version-script: npm run changeset:version`, `commit-message` e `pr-title` iguais a "Chore :see_no_evil: Atualiza versão e CHANGELOG", `github-token` e `GITHUB_TOKEN` no ambiente (o `@changesets/changelog-github` precisa dele), sem `publish`.
- Depois, só se a ação devolver `pr-number`: um passo lê o corpo do pull request, roda `node scripts/prepare-version-pr-body.js <arquivo>` e só chama `gh pr edit --body-file` quando o corpo mudou. É o mesmo padrão do portfolio, em JS puro. Nada de `${{ }}` dentro de `run`: os valores passam por `env`.
- Texto em português no lugar do parágrafo padrão em inglês ("This PR was opened by the ... this PR will be updated."): "Pull request de versão aberto pela automação de notas de mudança. Ao fazer o merge na `main`, a automação publica a versão no npm e cria a tag e o Release. Enquanto houver notas novas na `main`, este pull request é atualizado."

### Release (`release.yml`)

- Dispara em `push` na `main`. Concorrência `release`, sem cancelar. Job com `contents: write` e `id-token: write`.
- Passos: checkout com `fetch-depth: 0` e `fetch-tags: true`, setup-node 22 sem `registry-url` (ele grava um `.npmrc` com `NODE_AUTH_TOKEN`, que tomaria o lugar do OIDC) e `npm install -g npm@^11.5.1`, porque o Node 22 traz o npm 10 e o trusted publishing exige npm 11.5.1 ou mais novo e Node 22.14.0 ou mais novo. Depois vêm o `npm ci`, o `node scripts/prepare-release.js`, o passo de publicar e o passo de criar a tag e o Release.
- Decisão do script, pura e testável (`resolveRelease(version, existingTags, isPublished)`):
  - Versão fora de `MAJOR.MINOR.PATCH`: erro.
  - major 0: `release=false` e `publish=false`.
  - Tag `vX.Y.Z` já existe: `release=false` e `publish=false`.
  - Sem tag e versão fora do npm: `release=true` e `publish=true`.
  - Sem tag e versão já no npm: `release=true` e `publish=false` (caso da 1.0.0 manual).
- Consulta ao npm: `npm view @felipe-sant/claude-kit@<versão> version`. Código de saída zero quer dizer publicada. Erro com `E404` quer dizer não publicada. Qualquer outro erro para a execução.
- Ordem: publicar (`npm publish --access public`, só se `publish=true`) antes de criar a tag e o Release (`gh release create "$TAG" --target "$GITHUB_SHA" --title "$TAG" --notes-file "$NOTES_FILE"`, só se `release=true`). Se a publicação falhar, a tag não existe e a nova execução tenta de novo (CA-15).
- Nenhum `NPM_TOKEN`, `NODE_AUTH_TOKEN` nem `registry-url` no workflow. A prova de origem é automática com trusted publishing, e o `--provenance` explícito é aceito, mas não obrigatório.
- O `package.json` precisa do campo `repository` apontando para `https://github.com/felipe-sant/claude-kit`: o npm confere esse campo contra o repositório da prova de origem.

### Checagem de nota (`changeset-check.yml`)

- Dispara em `pull_request` para a `main`. Job `Changeset` com `if: github.head_ref != 'changeset-release/main'`, checkout com `fetch-depth: 0`, setup-node 22, `npm ci` e `npx changeset status --since=origin/main`. Permissão `contents: read`.
- Com a checagem obrigatória (RN-19), o pull request de versão continua podendo entrar: quando o dono o fecha e reabre (RN-17), o workflow roda, o job é pulado pelo `if`, e o GitHub conta job pulado assim como aprovado na checagem obrigatória.

### Agente de issues

- O agente já pode usar `Write` sem restrição de caminho, `git add:*` e `git commit:*`, e não pode rodar `npx`. Então ele grava a nota direto, no formato do contrato, com a ferramenta de escrita, e a inclui no commit pelo caminho. Não é preciso mudar as ferramentas liberadas no workflow.
- O prompt do agente (`agent-prompt.md`) traz a regra de versão completa e o tipo da nota: patch para correção ou ajuste compatível, minor para item ou opção nova pequena, vazia para documentação, CI ou testes. Major não tem nota: o agente usa a saída que já existe na seção "Se a issue P for maior do que parecia" (para, apaga a branch local, não envia branch, comenta o motivo na issue sem a marca de classificação e troca `Size: P` por `Size: M`). A conferência final do workflow do agente já aceita `Size: M` quando não há pull request do agente aberto para a issue, então o workflow não muda.
- O prompt do Size Set (`size-set-prompt.md`) ganha, na lista de critérios de tamanho, só a regra de que mudança major pela regra de versão é sempre M, com os casos de major de RN-08. O workflow do Size Set não muda.
- A abertura do pull request (`open-pull-request.js`) passa a recusar a branch que não traz nenhuma nota nova, com um motivo em português. É a mesma forma das outras recusas (`Refusal`, `failure_reason`), que o comentário de fim de acompanhamento já mostra na issue. Isso garante RN-04 mesmo quando o CI não roda no pull request aberto pela automação.

### Passos do dono (documentados pela Dev Doc, feitos fora do código)

1. Ter conta no npm e ser dono do escopo `@felipe-sant` (usuário ou organização `felipe-sant`), com verificação em dois fatores.
2. No GitHub, em Settings > Actions > General, manter ligada a opção "Allow GitHub Actions to create and approve pull requests". Hoje ela já está ligada (`can_approve_pull_request_reviews: true`, conferido em 2026-11-25).
3. Fazer o merge do pull request desta tarefa. A versão continua 0.1.0 e nada é publicado (CA-14). A automação abre o pull request de versão com a 1.0.0.
4. Colocar a checagem `Changeset` entre as obrigatórias da regra da `main` (RN-19). Só depois do passo 3, porque antes disso a checagem não existe na `main`.
5. Publicar a 1.0.0 à mão a partir da branch do pull request de versão (`changeset-release/main`): `git switch changeset-release/main`, `npm ci`, `npm pack --dry-run` para conferir a lista e `npm publish --access public` (RN-18). Essa versão sai sem prova de origem. Entre esta publicação e o merge do passo 6, nenhum outro pull request entra na `main`: uma nota patch transformaria o pull request de versão em 1.0.1 e a 1.0.0 ficaria sem tag, e qualquer outra mudança deixaria a `main` diferente do que foi publicado.
6. Fechar e reabrir o pull request de versão, esperar o CI passar e fazer o merge (RN-17). A automação cria a tag `v1.0.0` e o Release e não publica de novo (CA-13).
7. Na página do pacote no npm, ligar o trusted publishing com o dono `felipe-sant`, o repositório `claude-kit` e o workflow `release.yml` (só o nome do arquivo), logo antes do merge do primeiro pull request de versão que deve publicar sozinho (a 1.0.1 ou a seguinte). A ligação expira se a primeira publicação por ela não acontecer em 2 dias. Fazer a ligação nesse momento evita a expiração.
8. Em todo pull request de versão seguinte, logo antes do merge e depois da última atualização automática dele, fechar e reabrir o pull request e esperar o CI passar (RN-17). Cada atualização automática traz um commit novo sem checagens, porque o pull request é aberto com o token padrão do GitHub, que não dispara o CI.

## Plano de execução

Sem typecheck: o projeto é JS puro, sem TypeScript nem `checkJs`. Sem formatador: o projeto não tem um, e o oxlint faz só o lint. Sem build.

- Fase 1 (sequencial): T1 (Dev Ops 1), que fixa o contrato.
  - Gate de fase: `npm run lint`, `npm test`, `node bin/ai-sync.js --check`, actionlint e `npm pack --dry-run`.
- Fase 2 (paralelo): T2 [P] T3 [P] T4 [P] T5 [P] (Dev Ops 1), T6 [P] T7 [P] (Dev Ops 2), T8 [P] T9 [P] (Dev Doc).
  - Cada tarefa edita arquivos próprios. Nenhuma edita o `package.json`, que é só da T1.
  - Se uma tarefa da Fase 2 precisar mudar o `package.json`, ela relata o que precisa ao Dev Ops 1, que faz a mudança numa tarefa própria.
  - Gate de fase: o mesmo da Fase 1.
- Fase 3: reviewer e QA, depois os passos do dono (Desenho).

Gate de fase, comandos:
- `npm run lint`
- `npm test`
- `node bin/ai-sync.js --check`
- actionlint como no CI, baixado numa pasta temporária fora da worktree para o binário não entrar no commit: `D=$(mktemp -d) && (cd "$D" && bash <(curl -sSL https://raw.githubusercontent.com/rhysd/actionlint/914e7df21a07ef503a81201c76d2b11c789d3fca/scripts/download-actionlint.bash) 1.7.12) && "$D/actionlint" -color; rm -rf "$D"`
- `npm pack --dry-run`

## Tarefas

Regra para todos os que implementarem: nunca escrever comentários em código, nem em YAML, e deixar os que já existem. Os commits seguem o padrão do repositório (`Feat :sparkles: [#109] ...`), com caminhos explícitos. Se a mudança tocar fonte do time, o `.claude/` gerado vai junto. O `.claude/CLAUDE.md` é o único arquivo do `.claude/` editado à mão.

### T1 Contrato do pacote e das notas de mudança

- O quê: transformar o projeto em pacote publicável e fixar o formato das notas de mudança, com a nota major que gera a 1.0.0.
- Onde:
  - `package.json`:
    - `name` passa a `@felipe-sant/claude-kit`, e `private` sai.
    - Entram `publishConfig.access: public`, o campo `repository` com o repositório no GitHub, `license: MIT`, `bin` com `ai-sync: bin/ai-sync.js` e `files` com a lista do Desenho.
    - Entram os scripts `changeset`, `changeset:version` e `sync:version` do contrato, e `@changesets/cli` e `@changesets/changelog-github` em `devDependencies`, sem `dependencies`.
    - A versão fica 0.1.0, e `engines` fica `>=22`.
  - `package-lock.json`: gerado pelo `npm install`.
  - `LICENSE`: texto padrão da licença MIT, com `Copyright (c) 2026 Luiz Felipe`.
  - `.changeset/config.json`:
    - `changelog: ["@changesets/changelog-github", { "repo": "felipe-sant/claude-kit" }]`.
    - `commit: false`, `access: public`, `baseBranch: main`, `fixed`, `linked` e `ignore` vazios, e `updateInternalDependencies: patch`.
  - `.changeset/README.md`: explicação curta em português que aponta para o README.
  - `.changeset/publica-no-npm.md`: a nota major.
  - Testes novos: `tests/package-contract.test.js` e `tests/version-sync.test.js`.
- Dev: Dev Ops 1.
- Depende de: nada.
- Reaproveita: `.changeset/config.json` do portfolio (trocando a base para `main` e o acesso para público), `tests/helpers.js` (`tempDir`, `cleanup`, `run`) e o `makeHookedRepo` de `tests/self-sync.test.js` como modelo.
- Atende: RN-01, RN-02, RN-03, RN-07, RN-12, RN-14, RN-20; CA-01, CA-09 (parte local), CA-23, CA-24.
- Pronto quando:
  - Os testes novos passam.
  - O teste do contrato confere que a descrição do pacote informa `license: MIT` e que o `LICENSE` existe com o texto MIT, o ano 2026 e o titular Luiz Felipe.
  - Todo arquivo `.changeset/*.md`, menos o README, segue o contrato: nota vazia ou cabeçalho com só `"@felipe-sant/claude-kit": patch|minor|major` e corpo não vazio. O teste confere o formato, não a existência da nota major, porque ela some quando o pull request de versão é aplicado.
  - Numa cópia do repositório com a versão trocada, `npm run sync:version` deixa todas as entradas do registro com a versão nova, e o teste de sincronização passa na cópia.
  - Nessa mesma cópia com o hook ligado, um commit sem caminhos com a versão trocada e o `.claude/` regenerado é aceito.
  - `npx changeset status --since=origin/main` aprova a branch.
  - O gate passa.
- Teste: unitário e integração.
  - Primeiro deve falhar "o pacote se chama @felipe-sant/claude-kit, é público e leva só os arquivos do ai-sync" (hoje o nome é outro e `private` é verdadeiro).
  - Depois deve falhar "o pacote usa a licença MIT de Luiz Felipe, de 2026" (hoje não há licença).
  - Depois deve falhar "trocar a versão e rodar o sync:version deixa o registro do .claude com a versão nova" (hoje o script não existe).
  - Depois vêm os casos do validador de nota: vazia aceita nas duas formas, tipo inválido recusado, outro pacote recusado, corpo vazio recusado e README ignorado.
- Gate: `node --test tests/package-contract.test.js tests/version-sync.test.js`, `npm run lint` e `node bin/ai-sync.js --check`. Sem typecheck nem formatador no projeto.
- Modelo: padrao.
- Status: feita (commit a649493, Dev Ops 1; gate: 14 testes novos, suíte completa com 539 passando, lint ok, `ai-sync --check` ok, `npm pack --dry-run` com 44 arquivos, `changeset status` ok).

### T2 [P] Empacotamento e instalação pelo npx

- O quê: provar por teste que o pacote leva só o que deve e que, instalado num repositório, o `npx ai-sync` monta o time preservando arquivo do usuário.
- Onde: `tests/package-install.test.js`. `bin/ai-sync.js` muda só se o teste provar que é preciso.
- Dev: Dev Ops 1.
- Depende de: T1.
- Reaproveita: `tests/helpers.js` (`tempDir`, `cleanup`, `read`, `write`) e o catálogo para listar os caminhos esperados.
- Atende: RN-01, RN-12, RN-13; CA-02, CA-03, CA-04.
- Pronto quando:
  - `npm pack --dry-run --json` lista o `bin/ai-sync.js`, o `catalog.json`, todo `path` do catálogo, os perfis e o `LICENSE`.
  - A lista não traz nada sob `tests/`, `lint/`, `.github/`, `.specs/`, `.claude/`, `.changeset/`, `scripts/` nem `.githooks/`.
  - O tarball instalado sem rede (`npm install <tgz> --offline --no-audit --no-fund`) numa pasta temporária com `package.json` próprio roda `npx --no-install ai-sync`. O comando sai com código 0, cria o `.claude/` com o registro na versão do pacote e mantém intacto um arquivo do usuário criado antes no caminho de uma regra do catálogo.
  - `npx --no-install ai-sync --check` também passa.
  - O gate passa.
- Teste: integração.
  - Primeiro deve falhar "o pacote não leva testes, lint, automações nem especificações".
  - Se a T1 já fixou o `files` e ele passa de primeira, registrar que ele foi conferido contra um `files` vazio, que leva tudo.
- Gate: `node --test tests/package-install.test.js`, `npm run lint` e `npm pack --dry-run`.
- Modelo: padrao.
- Status: feita (commit b7470cf, Dev Ops 1; o teste de instalação passou de primeira, como a especificação previa, e a falha foi provada contra um `files` vazio; gate: testes, lint e actionlint 1.7.12 ok).

### T3 [P] Pull request de versão

- O quê: criar a automação que abre ou atualiza o pull request de versão com título, commit e texto em português, e os scripts que trocam o texto padrão.
- Onde:
  - `.github/workflows/version.yml`.
  - `scripts/replace-version-pr-boilerplate.js` e `scripts/prepare-version-pr-body.js`.
  - Testes: `tests/version-pr-body.test.js` e `tests/version-workflow.test.js`.
- Dev: Dev Ops 1.
- Depende de: T1.
- Reaproveita: `version.yml`, `replaceVersionPrBoilerplate.ts`, `prepareVersionPrBody.ts` e `changesetWorkflows.test.ts` do portfolio, reescritos em CommonJS, sem dependências e com `node --test`. O teste de workflow lê o YAML como texto, como os testes atuais.
- Atende: RN-05, RN-07; CA-08, CA-09, CA-10.
- Pronto quando:
  - A troca do parágrafo padrão devolve o texto em português do Desenho, deixa o resto do corpo como está e não muda um corpo sem o parágrafo.
  - O script de corpo grava `changed=true|false` no `GITHUB_OUTPUT` e reescreve o arquivo, e recusa a chamada sem arquivo com mensagem em português.
  - O workflow:
    - dispara em `push` na `main`;
    - usa o `changesets/action@v2` fixado por SHA, com `version-script: npm run changeset:version` e `commit-message` e `pr-title` do RN-05; o dev confere os nomes das entradas e da saída `pr-number` no `action.yml` do SHA fixado;
    - passa o `GITHUB_TOKEN` no ambiente;
    - só troca o corpo quando há `pr-number` e quando o corpo mudou;
    - não interpola `${{ }}` em `run`;
    - usa checkout e setup-node na versão 7.
  - O dev confere, no código da ação do SHA fixado, que só notas vazias não abrem pull request de versão (CA-10). Se abrirem, relata ao Dev Ops 1 antes de seguir.
  - O actionlint passa.
  - O gate passa.
- Teste: unitário. Primeiro deve falhar "troca o parágrafo padrão em inglês pelo texto em português". Depois vêm o corpo sem o parágrafo e os testes do workflow.
- Gate: `node --test tests/version-pr-body.test.js tests/version-workflow.test.js tests/workflow-actions-version.test.js`, `npm run lint` e o actionlint do Plano de execução.
- Modelo: padrao.
- Status: feita (commit a319961, Dev Ops 1; vermelho: `version-pr-body` e `version-workflow` sem scripts; depois 21 testes; gate: testes, lint e actionlint 1.7.12 ok). CA-10 confirmado no código da ação: só notas vazias não abrem pull request de versão. A ação commita pela API do GitHub, então o hook de pre-commit não roda no commit do pull request de versão, e o `.claude/` regenerado entra pelo estado da árvore.

### T4 [P] Release: publicação, tag e Release

- O quê: criar a automação que, a partir da 1.0.0, publica no npm por trusted publishing e cria a tag e o Release, sem republicar versão com tag nem já publicada.
- Onde:
  - `.github/workflows/release.yml`.
  - `scripts/resolve-release.js`, `scripts/extract-changelog-section.js` e `scripts/prepare-release.js`.
  - Testes: `tests/release-scripts.test.js` e `tests/release-workflow.test.js`.
- Dev: Dev Ops 1.
- Depende de: T1.
- Reaproveita: `release.yml`, `prepareRelease.ts`, `resolveRelease.ts`, `extractChangelogSection.ts` e os testes deles no portfolio, em CommonJS, sem dependências. A parte de Fatec fica fora. Entram a decisão `publish` e a consulta ao npm, recebida como função para o teste não usar rede.
- Atende: RN-02, RN-06, RN-10, RN-11; CA-11 a CA-18.
- Pronto quando:
  - A decisão cobre os casos da tabela do Desenho.
  - A seção do CHANGELOG é extraída entre `## X.Y.Z` e o próximo `## `, e a falta da seção dá erro em português.
  - A consulta ao npm trata `E404` como não publicada e qualquer outro erro como falha.
  - O script grava `tag`, `release`, `publish` e `notes-file` no `GITHUB_OUTPUT`.
  - O workflow:
    - tem `id-token: write` e `contents: write`;
    - não tem `registry-url`, `NODE_AUTH_TOKEN` nem `NPM_TOKEN`;
    - instala o npm `^11.5.1` antes de publicar;
    - publica antes de criar a tag;
    - cada passo só roda com a sua saída verdadeira;
    - não interpola `${{ }}` em `run`;
    - usa checkout e setup-node na versão 7.
  - O actionlint passa.
  - O gate passa.
- Teste: unitário.
  - Primeiro deve falhar "versão sem tag já publicada no npm cria o Release sem publicar".
  - Depois vêm: major 0 não faz nada; tag existente não faz nada; sem tag e fora do npm publica e cria Release; versão inválida dá erro; erro do npm que não é 404 para; seção ausente dá erro.
  - Depois vêm os testes do workflow.
- Gate: `node --test tests/release-scripts.test.js tests/release-workflow.test.js tests/workflow-actions-version.test.js`, `npm run lint` e o actionlint do Plano de execução.
- Modelo: padrao.
- Status: feita (commit f137626, Dev Ops 1; vermelho: `release-scripts` e `release-workflow` sem scripts; depois 30 testes; gate: testes, lint e actionlint 1.7.12 ok).

### T5 [P] Checagem de nota de mudança no pull request

- O quê: criar a checagem que reprova pull request para a `main` sem nota e deixa de fora o pull request de versão.
- Onde: `.github/workflows/changeset-check.yml` e `tests/changeset-check-workflow.test.js`.
- Dev: Dev Ops 1.
- Depende de: T1.
- Reaproveita: `changeset-check.yml` do portfolio, trocando `staging` por `main` e `.nvmrc` por `node-version: 22`, sem a exceção da branch `main`.
- Atende: RN-03, RN-04; CA-05, CA-06, CA-07.
- Pronto quando:
  - O workflow dispara em `pull_request` para a `main`.
  - O job se chama `Changeset` e roda só quando a branch não é `changeset-release/main`.
  - O workflow usa checkout com `fetch-depth: 0`, roda `npx changeset status --since=origin/main` e tem só `contents: read`.
  - O actionlint passa.
  - O gate passa.
- Teste: unitário, sobre o texto do workflow. Primeiro deve falhar "o pull request de versão fica fora da checagem de nota".
- Gate: `node --test tests/changeset-check-workflow.test.js tests/workflow-actions-version.test.js`, `npm run lint` e o actionlint do Plano de execução.
- Modelo: economico.
- Status: feita (commit 10ef12f, Dev Ops 1 por executor; 10 testes; o executor não relatou o teste falhando primeiro, e o Reviewer refez a prova contra o commit anterior: o teste do pull request de versão fora da checagem falha por ENOENT; gate: testes, lint e actionlint 1.7.12 ok).

### T6 [P] Agente de issues cria a nota de mudança e trata o major

- O quê: instruir o agente de issues a gravar a nota de mudança pela regra de versão e a parar no major trocando P por M, e instruir a classificação de tamanho a tratar mudança major como M.
- Onde:
  - `.github/issue-agent/agent-prompt.md` (seções "Pull request", "Se a issue P for maior do que parecia" e "Limites").
  - `.github/issue-agent/size-set-prompt.md` (lista de critérios de "Classificar").
  - `tests/issue-claude-agent-prompt.test.js` e `tests/issue-size-set-prompt.test.js` (novas guardas).
  - Não edita o `package.json`, os workflows do Dev Ops 1 nem os workflows `issue-*.yml`.
- Dev: Dev Ops 2.
- Depende de: T1.
- Reaproveita:
  - O mapa `guards` dos dois testes de prompt.
  - As regras atuais do prompt do agente (sem crase nem cifrão em comandos, arquivos pelo caminho).
  - A seção "Se a issue P for maior do que parecia", que já é a saída para trocar P por M sem pull request.
  - A regra de versão (RN-08), escrita do mesmo jeito nos dois prompts.
- Atende: RN-08, RN-09, RN-22; CA-19, CA-20, CA-26, CA-27, CA-28, CA-29.
- Pronto quando:
  - O prompt do agente traz a regra de versão completa: major (remove ou renomeia agente, regra ou skill, muda o fluxo do time ou quebra uma opção do `ai-sync`), minor (novo agente, regra, skill, stack ou opção) e patch (ajuste de texto, correção ou mudança que não quebra nada).
  - O prompt do agente manda gravar, com a ferramenta de escrita, um arquivo `.changeset/<nome-da-branch-com-hífen>.md`:
    - patch para correção ou ajuste compatível, com uma ou duas linhas em português simples, sem caminho de arquivo nem código;
    - minor para item ou opção nova pequena, no mesmo formato;
    - nota vazia para documentação, CI ou testes, no formato exato do contrato.
  - O prompt do agente diz que mudança major nunca é P: se ele perceber durante a execução que a mudança é major, segue a seção "Se a issue P for maior do que parecia" (para, não envia branch nem deixa pull request, comenta o motivo na issue e troca `Size: P` por `Size: M`).
  - O prompt do agente manda incluir a nota no commit pelo caminho e nunca rodar `npx changeset`.
  - O prompt do Size Set diz que mudança classificada como major pela regra de versão é sempre M, com os casos de major. Os outros critérios de tamanho não mudam.
  - Novas guardas nos dois testes conferem cada frase, e as guardas atuais continuam passando.
  - As ferramentas liberadas e o resto dos workflows `issue-*.yml` não mudam.
  - O gate passa.
- Teste: unitário.
  - Primeiro deve falhar a guarda "o agente grava a nota de mudança patch na correção".
  - Depois as guardas da nota minor, da nota vazia, da regra de versão no prompt do agente e de "major para e troca P por M".
  - Depois a guarda do Size Set "mudança major pela regra de versão é M".
- Gate: `node --test tests/issue-claude-agent-prompt.test.js tests/issue-claude-agent-workflow.test.js tests/issue-size-set-prompt.test.js tests/issue-size-set-workflow.test.js` e `npm run lint`. Sem typecheck nem formatador no projeto.
- Modelo: padrao.
- Status: feita (commit dd2fbf8, Dev Ops 2; vermelho: 17 guardas novas falhando; gate: 570 testes ok, lint ok, `ai-sync --check` ok).

### T7 [P] Abertura do pull request do agente confere a nota

- O quê: fazer a abertura do pull request do agente recusar a branch sem nota de mudança nova, com motivo em português.
- Onde: `.github/issue-agent/open-pull-request.js` e `tests/issue-claude-agent-open-pull-request.test.js`.
- Dev: Dev Ops 2.
- Depende de: T1.
- Reaproveita:
  - A comparação `compare/<base>...<branch>`, que já é consultada (o campo `files` da resposta traz os arquivos alterados).
  - `Refusal`, `recordOutputs` e o padrão de teste com `fetch` dublado.
- Atende: RN-04, RN-09; CA-21.
- Pronto quando:
  - Uma função exportada diz se a lista de arquivos da comparação tem ao menos um `.changeset/*.md` adicionado que não seja o README.
  - Sem nota, a abertura recusa com o motivo "A branch <branch> não traz a nota de mudança." (ou texto equivalente fixado no teste), e nenhum pull request é criado.
  - Com nota, o fluxo segue como hoje.
  - Os testes atuais continuam passando.
  - O gate passa.
- Teste: unitário. Primeiro deve falhar "branch sem nota de mudança não abre pull request". Depois vêm: nota vazia aceita, README sozinho recusado, nota fora de `.changeset/` recusada.
- Gate: `node --test tests/issue-claude-agent-open-pull-request.test.js` e `npm run lint`.
- Modelo: padrao.
- Status: feita (commit 96dcebc, Dev Ops 2; vermelho: 4 testes com "checkChangesetNote is not a function"; gate: 553 testes ok, lint ok, `ai-sync --check` ok).

### T8 [P] README: instalar pelo npm, nota de mudança e passos do dono

- O quê: atualizar o README para explicar a instalação e a atualização pelo npm, a nota de mudança, a regra de versão, o fluxo automático de versões e os passos do dono.
- Onde: `README.md`, nas seções "Usar em um repositório", "Desenvolvimento" e "Estrutura do repositório", mais uma seção nova sobre versões e publicação.
- Dev: Dev Doc.
- Depende de: T1.
- Reaproveita:
  - Os scripts e o formato da nota do contrato.
  - A regra de versão (RN-08).
  - Os passos do dono do Desenho.
  - O `.changeset/README.md` do portfolio como tom.
- Atende: RN-08, RN-11, RN-15, RN-17, RN-18, RN-19; CA-22, CA-25.
- Pronto quando:
  - "Usar em um repositório" mostra:
    - `npm install --save-dev @felipe-sant/claude-kit` e `npx ai-sync`;
    - o uso sem instalar (`npx @felipe-sant/claude-kit`);
    - como atualizar subindo a versão.
  - O clone local continua citado como opção para quem desenvolve o claude-kit.
  - Há uma seção com:
    - a nota de mudança (`npm run changeset`, ou `npm run changeset -- --empty`), com exemplo;
    - a regra de versão;
    - o fluxo do pull request de versão e da publicação;
    - os passos do dono na ordem do Desenho, incluindo tornar a checagem `Changeset` obrigatória depois do merge desta tarefa e fechar e reabrir o pull request de versão antes de cada merge dele.
  - A tabela de estrutura cita `.changeset/`, `scripts/` e os três workflows novos.
  - Os testes que leem o README continuam passando.
  - O gate passa.
- Teste: nenhum novo (só texto). Os testes atuais do README em `tests/team.test.js` precisam continuar passando.
- Gate: `node --test tests/team.test.js` e `npm run lint`.
- Modelo: economico.
- Status: feita (commit cbc0094, Dev Doc; gate: `npm test` 570/570, lint ok, `ai-sync --check` ok). Pendência: o README cita os workflows e a branch `changeset-release/main` pela especificação; conferir contra o código quando T3 a T5 estiverem commitadas.

### T9 [P] Instruções do projeto: nota de mudança e versões

- O quê: atualizar as instruções do projeto para os agentes com a nota de mudança obrigatória, a regra de versão e as peças novas.
- Onde: `.claude/CLAUDE.md` (editado à mão; é o único arquivo do `.claude/` que não é gerado).
- Dev: Dev Doc.
- Depende de: T1.
- Reaproveita: a tabela "Estrutura", as seções "Regras ao editar", "Verificar uma mudança" e "Branches e commits", e o contrato.
- Atende: RN-03, RN-08, RN-15; CA-22.
- Pronto quando:
  - A tabela cita `.changeset/`, `scripts/` e os workflows de nota, versão e release.
  - "Regras ao editar" traz a regra direta, com este texto: "Todo PR traz uma nota de mudança (changeset), criada no mesmo PR: patch, minor ou major pela regra de versão, ou vazia para documentação, textos (como o README), CI e testes."
  - A mesma seção diz o formato da nota pelo contrato e qual tipo usar pela regra de versão.
  - O texto diz que o pull request de versão é da automação e regenera o `.claude/`.
  - "Verificar uma mudança" cita `npm pack --dry-run`.
  - A menção a `npm run sync` continua (o teste de sincronização confere).
  - O gate passa.
- Teste: nenhum novo (só texto). `tests/self-sync.test.js` e `tests/team.test.js` precisam continuar passando.
- Gate: `node --test tests/self-sync.test.js tests/team.test.js` e `npm run lint`.
- Modelo: economico.
- Status: feita (commit 1615c2f, Dev Doc; gate: `npm test` 570/570, lint ok, `ai-sync --check` ok).

## Dúvidas

Do usuário: nenhuma. As dúvidas U1 a U5 foram decididas e viraram as regras RN-17 a RN-21.

Do product-owner: nenhuma. A dúvida P1 foi respondida e virou RN-09 (ampliada) e RN-22.
