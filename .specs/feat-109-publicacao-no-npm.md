# Publicar o claude-kit no npm com versões automáticas

> Status: em-revisao
> Tipo: funcionalidade
> Tamanho: grande
> Branch: feat/109-publicacao-no-npm
> Criada em: 2026-11-25

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
- RN-09: O agente de issues cria a nota de mudança nos pull requests que abre: patch para correção e nota vazia para documentação, CI ou testes. O texto é em português simples. Fonte: usuário (issue #109).
- RN-10: A publicação usa o trusted publishing do npm. Nenhum token fica guardado no repositório, e a publicação automática leva a prova de origem. Fonte: usuário (issue #109).
- RN-11: O npm só deixa ligar o trusted publishing na página de um pacote que já existe. Por isso a 1.0.0 é publicada à mão pelo dono, e a automação assume a partir da versão seguinte. Fonte: usuário (issue #109, conferido na documentação do npm).
- RN-12: O pacote leva só o que o `ai-sync` usa para funcionar. Testes, lint, automações do GitHub, o agente de issues, as especificações e os scripts de versão ficam de fora. Fonte: usuário (issue #109).
- RN-13: O `ai-sync` instalado pelo npm continua sem apagar nem sobrescrever arquivo do usuário. Fonte: usuário (issue #109) e garantia do repositório.
- RN-14: Os scripts novos não têm dependências de execução e têm testes. As ferramentas de notas de mudança entram só como dependências de desenvolvimento. Fonte: usuário (issue #109).
- RN-15: O README e as instruções do projeto para os agentes explicam como instalar e atualizar pelo npm, como escrever a nota de mudança, a regra de versão e os passos do dono. Fonte: usuário (issue #109).
- RN-16: As checagens que o CI já roda (lint, testes e checagem das automações) continuam passando. A pasta gerada `.claude/` nunca é editada à mão. Fonte: usuário (issue #109) e garantia do repositório.

## Critérios de aceite

- CA-01: QUANDO alguém confere o pacote que vai para o npm ENTÃO o sistema DEVE mostrar o nome `@felipe-sant/claude-kit`, o acesso público e o comando `ai-sync`. Cobre RN-01.
- CA-02: QUANDO alguém lista os arquivos que o pacote leva ENTÃO o sistema DEVE mostrar só o comando, o catálogo, os agentes, as regras, as skills, as stacks, os modelos de configuração, os perfis e os arquivos que o npm sempre inclui (descrição do pacote e README), e nenhum teste, lint, automação do GitHub, agente de issues, especificação, nota de mudança, script de versão ou cópia gerada do time. Cobre RN-12.
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
- CA-19: QUANDO o agente de issues abre um pull request de correção ENTÃO o pull request DEVE trazer uma nota de mudança patch em português simples. Cobre RN-09.
- CA-20: QUANDO o agente de issues abre um pull request só de documentação, CI ou testes ENTÃO o pull request DEVE trazer uma nota vazia. Cobre RN-09.
- CA-21: QUANDO a branch do agente de issues não traz nota de mudança ENTÃO o sistema NÃO DEVE abrir o pull request e DEVE registrar o motivo na issue, como já faz nas outras recusas. Cobre RN-04 e RN-09.
- CA-22: QUANDO alguém lê o README e as instruções do projeto ENTÃO o sistema DEVE explicar como instalar e atualizar pelo npm, como escrever a nota de mudança (com tipo ou vazia), a regra de versão e os passos do dono. Cobre RN-08, RN-11 e RN-15.
- CA-23: QUANDO a suíte, o lint, a checagem do catálogo e a checagem das automações rodam depois da mudança ENTÃO o sistema DEVE aprovar todas. Cobre RN-14 e RN-16.

## Critérios de sucesso

- A versão 1.0.0 está no npm como `@felipe-sant/claude-kit`, pública, e existe a tag `v1.0.0` com o Release.
- Em um repositório qualquer, instalar o pacote e rodar `npx ai-sync` monta o time como o clone local montava.
- A versão seguinte (a primeira automática) sai sozinha depois do merge do pull request de versão, com prova de origem no npm, sem ninguém publicar à mão.
- Nenhum pull request entra na `main` sem nota de mudança, e o CI atual continua verde.

## Fora do escopo

- Ambiente de staging e promoção entre branches: o repositório só tem a `main` (RN-03). Por isso o verificador de notas pendentes do portfolio, que só serve à promoção, não é trazido.
- Dependabot ou Renovate nos repositórios que usam o pacote: é configuração de cada consumidor.
- Mudanças no `ai-sync` além do que o empacotamento exigir. Hoje ele acha o conteúdo a partir da pasta do próprio comando, o que já funciona dentro do pacote instalado (ver Desenho). Uma mudança só entra se o teste de instalação provar que é necessária.
- Mudar a classificação de tamanho das issues ou o fluxo do time.
- Uma regra da nota de mudança para os repositórios consumidores: a regra vale só para este repositório e fica no README e nas instruções do projeto, nunca nas regras copiadas pelo `ai-sync`.
- Traduzir os títulos de seção que a ferramenta de notas escreve sozinha no CHANGELOG e na lista do pull request de versão (ver Dúvidas).

## Desenho

### Peças e quem é dono

| Peça | O que faz | Dono |
| --- | --- | --- |
| Descrição do pacote (`package.json` e `package-lock.json`) | Nome, acesso, arquivos levados, scripts de versão, dependências de desenvolvimento | Dev Ops 1 (só ele edita) |
| `.changeset/config.json` e `.changeset/README.md` | Configuração da ferramenta de notas de mudança e explicação curta | Dev Ops 1 |
| Nota major inicial em `.changeset/` | Gera a 1.0.0 no primeiro pull request de versão | Dev Ops 1 |
| `.github/workflows/changeset-check.yml` | Reprova pull request sem nota | Dev Ops 1 |
| `.github/workflows/version.yml` e scripts do texto do PR de versão | Abre ou atualiza o pull request de versão | Dev Ops 1 |
| `.github/workflows/release.yml` e scripts de release | Publica, cria a tag e o Release | Dev Ops 1 |
| `.github/issue-agent/agent-prompt.md` e `.github/issue-agent/open-pull-request.js` | Agente cria a nota, e a abertura do pull request confere se ela existe | Dev Ops 2 |
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

### `ai-sync` dentro do pacote instalado

Em `bin/ai-sync.js`, `root = path.resolve(__dirname, '..')` aponta para a raiz do pacote em `node_modules/@felipe-sant/claude-kit`. A pasta alvo padrão é a pasta atual (`process.cwd()`). O comando lê `catalog.json`, `profiles/`, `package.json` (para a versão) e os caminhos do catálogo (`agents/`, `rules/`, `skills/`, `stacks/`, `templates/`). Logo o campo `files` é: `bin`, `catalog.json`, `agents`, `rules`, `skills`, `stacks`, `templates` e `profiles`. O npm inclui sozinho o `package.json` e o `README.md`. O `.claude/` fica fora do pacote. O `bin/ai-sync.js` já é executável e começa com `#!/usr/bin/env node`. O campo `bin` deve ficar na forma que o npm não corrige sozinho (`bin/ai-sync.js`, sem `./`), para o `npm publish` não avisar.

### Pull request de versão (`version.yml`)

- Dispara em `push` na `main` e por `workflow_dispatch`. Permissões: `contents: write` e `pull-requests: write`. Concorrência sem cancelar.
- Passos: checkout com `fetch-depth: 0`, setup-node 22 com cache, `npm ci`, `changesets/action` fixado por SHA (como a ação do Claude), com `version: npm run changeset:version`, `commit` e `title` iguais a "Chore :see_no_evil: Atualiza versão e CHANGELOG" e `GITHUB_TOKEN` no ambiente (o `@changesets/changelog-github` precisa dele), sem `publish`.
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

### Agente de issues

- O agente já pode usar `Write` sem restrição de caminho, `git add:*` e `git commit:*`, e não pode rodar `npx`. Então ele grava a nota direto, no formato do contrato, com a ferramenta de escrita, e a inclui no commit pelo caminho. Não é preciso mudar as ferramentas liberadas no workflow.
- A abertura do pull request (`open-pull-request.js`) passa a recusar a branch que não traz nenhuma nota nova, com um motivo em português. É a mesma forma das outras recusas (`Refusal`, `failure_reason`), que o comentário de fim de acompanhamento já mostra na issue. Isso garante RN-04 mesmo quando o CI não roda no pull request aberto pela automação.

### Passos do dono (documentados pela Dev Doc, feitos fora do código)

1. Ter conta no npm e ser dono do escopo `@felipe-sant` (usuário ou organização `felipe-sant`), com verificação em dois fatores.
2. No GitHub, em Settings > Actions > General, manter ligada a opção "Allow GitHub Actions to create and approve pull requests". Hoje ela já está ligada (`can_approve_pull_request_reviews: true`, conferido em 2026-11-25).
3. Fazer o merge do pull request desta tarefa. A versão continua 0.1.0 e nada é publicado (CA-14). A automação abre o pull request de versão com a 1.0.0.
4. Publicar a 1.0.0 à mão a partir da branch do pull request de versão (`changeset-release/main`): `git switch changeset-release/main`, `npm ci`, `npm pack --dry-run` para conferir a lista e `npm publish --access public`. Essa versão sai sem prova de origem.
5. Na página do pacote no npm, ligar o trusted publishing com o dono `felipe-sant`, o repositório `claude-kit` e o workflow `release.yml` (só o nome do arquivo). A configuração expira se a primeira publicação por ela não acontecer em 2 dias. Conferir na página do npm o que vale depois de uma publicação manual, e refazer a ligação se ela expirar.
6. Fazer o merge do pull request de versão. A automação cria a tag `v1.0.0` e o Release e não publica de novo (CA-13).
7. Colocar a checagem `Changeset` entre as obrigatórias da regra da `main`, se a Dúvida U3 for aceita.

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
    - Entram `publishConfig.access: public`, o campo `repository` com o repositório no GitHub, `bin` com `ai-sync: bin/ai-sync.js` e `files` com a lista do Desenho.
    - Entram os scripts `changeset`, `changeset:version` e `sync:version` do contrato, e `@changesets/cli` e `@changesets/changelog-github` em `devDependencies`, sem `dependencies`.
    - A versão fica 0.1.0, e `engines` fica `>=22`.
  - `package-lock.json`: gerado pelo `npm install`.
  - `.changeset/config.json`:
    - `changelog: ["@changesets/changelog-github", { "repo": "felipe-sant/claude-kit" }]`.
    - `commit: false`, `access: public`, `baseBranch: main`, `fixed`, `linked` e `ignore` vazios, e `updateInternalDependencies: patch`.
  - `.changeset/README.md`: explicação curta em português que aponta para o README.
  - `.changeset/publica-no-npm.md`: a nota major.
  - Testes novos: `tests/package-contract.test.js` e `tests/version-sync.test.js`.
- Dev: Dev Ops 1.
- Depende de: nada.
- Reaproveita: `.changeset/config.json` do portfolio (trocando a base para `main` e o acesso para público), `tests/helpers.js` (`tempDir`, `cleanup`, `run`) e o `makeHookedRepo` de `tests/self-sync.test.js` como modelo.
- Atende: RN-01, RN-02, RN-03, RN-07, RN-12, RN-14; CA-01, CA-09 (parte local), CA-23.
- Pronto quando:
  - Os testes novos passam.
  - Todo arquivo `.changeset/*.md`, menos o README, segue o contrato: nota vazia ou cabeçalho com só `"@felipe-sant/claude-kit": patch|minor|major` e corpo não vazio. O teste confere o formato, não a existência da nota major, porque ela some quando o pull request de versão é aplicado.
  - Numa cópia do repositório com a versão trocada, `npm run sync:version` deixa todas as entradas do registro com a versão nova, e o teste de sincronização passa na cópia.
  - Nessa mesma cópia com o hook ligado, um commit sem caminhos com a versão trocada e o `.claude/` regenerado é aceito.
  - `npx changeset status --since=origin/main` aprova a branch.
  - O gate passa.
- Teste: unitário e integração.
  - Primeiro deve falhar "o pacote se chama @felipe-sant/claude-kit, é público e leva só os arquivos do ai-sync" (hoje o nome é outro e `private` é verdadeiro).
  - Depois deve falhar "trocar a versão e rodar o sync:version deixa o registro do .claude com a versão nova" (hoje o script não existe).
  - Depois vêm os casos do validador de nota: vazia aceita nas duas formas, tipo inválido recusado, outro pacote recusado, corpo vazio recusado e README ignorado.
- Gate: `node --test tests/package-contract.test.js tests/version-sync.test.js`, `npm run lint` e `node bin/ai-sync.js --check`. Sem typecheck nem formatador no projeto.
- Modelo: padrao.
- Status: pendente.

### T2 [P] Empacotamento e instalação pelo npx

- O quê: provar por teste que o pacote leva só o que deve e que, instalado num repositório, o `npx ai-sync` monta o time preservando arquivo do usuário.
- Onde: `tests/package-install.test.js`. `bin/ai-sync.js` muda só se o teste provar que é preciso.
- Dev: Dev Ops 1.
- Depende de: T1.
- Reaproveita: `tests/helpers.js` (`tempDir`, `cleanup`, `read`, `write`) e o catálogo para listar os caminhos esperados.
- Atende: RN-01, RN-12, RN-13; CA-02, CA-03, CA-04.
- Pronto quando:
  - `npm pack --dry-run --json` lista o `bin/ai-sync.js`, o `catalog.json`, todo `path` do catálogo e os perfis.
  - A lista não traz nada sob `tests/`, `lint/`, `.github/`, `.specs/`, `.claude/`, `.changeset/`, `scripts/` nem `.githooks/`.
  - O tarball instalado sem rede (`npm install <tgz> --offline --no-audit --no-fund`) numa pasta temporária com `package.json` próprio roda `npx --no-install ai-sync`. O comando sai com código 0, cria o `.claude/` com o registro na versão do pacote e mantém intacto um arquivo do usuário criado antes no caminho de uma regra do catálogo.
  - `npx --no-install ai-sync --check` também passa.
  - O gate passa.
- Teste: integração.
  - Primeiro deve falhar "o pacote não leva testes, lint, automações nem especificações".
  - Se a T1 já fixou o `files` e ele passa de primeira, registrar que ele foi conferido contra um `files` vazio, que leva tudo.
- Gate: `node --test tests/package-install.test.js`, `npm run lint` e `npm pack --dry-run`.
- Modelo: padrao.
- Status: pendente.

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
    - usa o `changesets/action` fixado por SHA, com `npm run changeset:version` e o título e o commit do RN-05;
    - passa o `GITHUB_TOKEN` no ambiente;
    - só troca o corpo quando há `pr-number` e quando o corpo mudou;
    - não interpola `${{ }}` em `run`;
    - usa checkout e setup-node na versão 7.
  - O actionlint passa.
  - O gate passa.
- Teste: unitário. Primeiro deve falhar "troca o parágrafo padrão em inglês pelo texto em português". Depois vêm o corpo sem o parágrafo e os testes do workflow.
- Gate: `node --test tests/version-pr-body.test.js tests/version-workflow.test.js tests/workflow-actions-version.test.js`, `npm run lint` e o actionlint do Plano de execução.
- Modelo: padrao.
- Status: pendente.

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
- Status: pendente.

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
- Status: pendente.

### T6 [P] Agente de issues cria a nota de mudança

- O quê: instruir o agente de issues a gravar a nota de mudança no formato do contrato em todo pull request que abre.
- Onde: `.github/issue-agent/agent-prompt.md` (seção "Pull request" e "Limites") e `tests/issue-claude-agent-prompt.test.js` (novas guardas).
- Dev: Dev Ops 2.
- Depende de: T1.
- Reaproveita: o mapa `guards` do teste do prompt e as regras atuais do prompt (sem crase nem cifrão em comandos, arquivos pelo caminho).
- Atende: RN-08, RN-09; CA-19, CA-20.
- Pronto quando:
  - O prompt manda gravar, com a ferramenta de escrita, um arquivo `.changeset/<nome-da-branch-com-hífen>.md`:
    - patch para correção, com uma ou duas linhas em português simples, sem caminho de arquivo nem código;
    - nota vazia para documentação, CI ou testes, no formato exato do contrato.
  - O prompt manda incluir a nota no commit pelo caminho e nunca rodar `npx changeset`.
  - Novas guardas no teste conferem cada frase.
  - As ferramentas liberadas no workflow não mudam.
  - O gate passa.
- Teste: unitário. Primeiro deve falhar a guarda "o agente grava a nota de mudança patch na correção".
- Gate: `node --test tests/issue-claude-agent-prompt.test.js tests/issue-claude-agent-workflow.test.js` e `npm run lint`.
- Modelo: economico.
- Status: pendente.

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
- Status: pendente.

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
- Atende: RN-08, RN-11, RN-15; CA-22.
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
    - os passos do dono na ordem.
  - A tabela de estrutura cita `.changeset/`, `scripts/` e os três workflows novos.
  - Os testes que leem o README continuam passando.
  - O gate passa.
- Teste: nenhum novo (só texto). Os testes atuais do README em `tests/team.test.js` precisam continuar passando.
- Gate: `node --test tests/team.test.js` e `npm run lint`.
- Modelo: economico.
- Status: pendente.

### T9 [P] Instruções do projeto: nota de mudança e versões

- O quê: atualizar as instruções do projeto para os agentes com a nota de mudança obrigatória, a regra de versão e as peças novas.
- Onde: `.claude/CLAUDE.md` (editado à mão; é o único arquivo do `.claude/` que não é gerado).
- Dev: Dev Doc.
- Depende de: T1.
- Reaproveita: a tabela "Estrutura", as seções "Regras ao editar", "Verificar uma mudança" e "Branches e commits", e o contrato.
- Atende: RN-03, RN-08, RN-15; CA-22.
- Pronto quando:
  - A tabela cita `.changeset/`, `scripts/` e os workflows de nota, versão e release.
  - "Regras ao editar" diz que todo pull request traz uma nota (com tipo ou vazia) no formato do contrato e qual tipo usar pela regra de versão.
  - O texto diz que o pull request de versão é da automação e regenera o `.claude/`.
  - "Verificar uma mudança" cita `npm pack --dry-run`.
  - A menção a `npm run sync` continua (o teste de sincronização confere).
  - O gate passa.
- Teste: nenhum novo (só texto). `tests/self-sync.test.js` e `tests/team.test.js` precisam continuar passando.
- Gate: `node --test tests/self-sync.test.js tests/team.test.js` e `npm run lint`.
- Modelo: economico.
- Status: pendente.

## Dúvidas

Do usuário:

- U1 (bloqueia o merge do pull request de versão, não a implementação): o pull request de versão é aberto pela automação com o token padrão do GitHub. Pull request aberto assim não dispara o CI, e a regra da `main` exige as checagens "Lint" e "Testes", sem exceção para ninguém. Sem as checagens, o pull request de versão pode ficar sem poder entrar.
  - Evidência: o pull request #105, aberto pela automação, teve as checagens, mas recebeu commits depois de aberto, o que não prova o caso.
  - Opções:
    - (a) o dono fecha e reabre o pull request de versão para disparar o CI, como passo documentado;
    - (b) um token de app ou pessoal só para a automação de versão (segredo novo no repositório, mas não do npm);
    - (c) a automação de versão dispara o CI à mão na branch de versão, o que exige mudar o `ci.yml`;
    - (d) uma exceção na regra da `main`.
  - Proposta: (a), sem segredo novo.
- U2: a publicação da 1.0.0. A especificação segue a opção A.
  - Opção A (proposta): o dono publica à mão a partir da branch do pull request de versão antes do merge. Depois liga o trusted publishing e faz o merge. A automação cria a tag e o Release e pula a publicação, porque a versão já está no npm.
  - Opção B: o dono faz o merge primeiro. A publicação automática falha por falta do trusted publishing e não cria a tag. O dono publica à mão a partir da `main`, liga o trusted publishing e roda a automação de novo, que cria a tag e o Release e pula a publicação.
  - A opção A evita uma execução vermelha.
- U3: colocar a checagem "Changeset" entre as obrigatórias da regra da `main`? Sem isso, ela reprova, mas não impede o merge. Com isso, o pull request de versão depende de U1, porque ela fica de fora só quando roda.
- U4: o pacote será público e o repositório não tem licença. Qual licença usar? Isso não bloqueia: sem licença, o npm só avisa.
- U5: a ferramenta de notas escreve em inglês os títulos de seção do CHANGELOG e da lista do pull request de versão ("Major Changes", "Patch Changes", "Releases"). Isso é aceitável, ou esses títulos também devem ser traduzidos? A especificação traduz só o parágrafo fixo do pull request de versão.

Do product-owner:

- P1: quando uma issue P resolvida pelo agente de issues adiciona algo novo (agente, regra, skill ou opção, que pela regra de versão é minor) ou quebra algo (major), qual nota o agente grava? A decisão do usuário cobre só patch e vazia.
  - Proposta a confirmar: minor segue a regra de versão, e major faz a issue virar M, por exigir decisão do dono.
  - Até a resposta, a T6 instrui só patch e vazia.
