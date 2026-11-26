# claude-kit

Um comando que configura o Claude Code em qualquer repositório: leva o time de agentes, os padrões de desenvolvimento e as skills que servem ao projeto, escolhendo sozinho o que é de cada stack.

O `claude-kit` é publicado no npm como `@felipe-sant/claude-kit`, e o comando é o `ai-sync`.

| O que | Quantos | Onde fica no projeto |
| --- | --- | --- |
| Agentes (o time) | 13 | `.claude/agents/` |
| Regras (padrões de desenvolvimento) | 9 gerais e 4 por stack | `.claude/rules/` |
| Skills | 6 gerais e 2 por stack | `.claude/skills/` |
| Configuração base do Claude | 1 modelo | `.claude/settings.json` |

Stacks com conteúdo hoje: React, NestJS, Laravel e AdonisJS.

## Instalar e atualizar

Requer Node 22 ou mais novo. No repositório que vai usar o time:

```
npm install --save-dev @felipe-sant/claude-kit
npx ai-sync
```

Depois, abra o Claude no repositório e transforme a sessão na orquestradora do time:

```
/team-setup
```

Para atualizar, suba a versão e rode o `ai-sync` de novo:

```
npm install --save-dev @felipe-sant/claude-kit@latest
npx ai-sync
```

Para voltar a uma versão anterior, instale essa versão (`@felipe-sant/claude-kit@1.0.0`) e rode o `ai-sync`. Versione o `package.json` e o `package-lock.json` para o repositório declarar qual versão do time usa.

### Opções

| Opção | O que faz |
| --- | --- |
| `--profile nome` (ou `-p`) | Escolhe um perfil à mão, no lugar da detecção. Aplica exatamente o que o perfil lista. |
| `--force` | Reinstala também os arquivos em conflito (veja "Sincronização segura"). |
| `--teams` / `--no-teams` | Liga ou desliga o recurso experimental de times de agentes (veja "Subagentes ou time de agentes"). Sem nenhum dos dois, o `ai-sync` não mexe nisso. |
| `--check` | Confere se o catálogo e os perfis estão consistentes. Não aplica nada. |
| pasta | Um caminho no lugar do repositório atual: `npx ai-sync /caminho/do/repo`. |

### O que é aplicado

Sem `--profile`, o `ai-sync` detecta as stacks do projeto e aplica o que vale para qualquer projeto mais o das stacks detectadas. Ao final, mostra as stacks detectadas e o que foi criado, atualizado, removido e deixado como estava.

| Stack | Detectada por (dependência) |
| --- | --- |
| React | `react` |
| NestJS | `@nestjs/core` |
| Laravel | `laravel/framework` |
| AdonisJS | `@adonisjs/core` |

- A detecção lê o `package.json` e o `composer.json` na raiz e nas pastas de primeiro nível (menos as ocultas, `node_modules`, `vendor`, `dist`, `build` e `coverage`). Um repositório com painel e API reconhece as duas stacks.
- Se nada for reconhecido, aplica só o que vale para qualquer projeto e avisa.
- Os padrões e as skills de uma stack não chegam a projetos de outra.

### Perfis

Perfis manuais ficam em `profiles/*.json` e só valem com `--profile`. Trazem só o que vale para qualquer projeto: o conteúdo de stack vem apenas pela detecção.

- `default`: o time completo.
- `frontend`: `dev-frontend`, `dev-fullstack` e `dev-doc`, com `designer`.
- `backend`: `dev-backend`, `dev-fullstack`, `dev-database`, `dev-devops` e `dev-doc`, sem `designer`.
- `tooling`: para repositórios de ferramentas, scripts, CLIs e conteúdo (como o próprio `claude-kit`), sem telas nem banco. `dev-backend`, `dev-devops` e `dev-doc`, sem `designer`. Esses repositórios não têm stack detectável, então use `--profile tooling`.

Todos incluem `product-owner`, `sdd`, `executor`, `reviewer` e `qa`, as nove regras gerais, as seis skills gerais (entre elas a `team-setup`) e a configuração base.

### Sincronização segura

O `ai-sync` nunca apaga nem sobrescreve arquivo seu. Ele registra o que instalou em `.claude/claude-kit.lock.json` (caminho, versão do `claude-kit` e impressão digital de cada arquivo); versione esse arquivo junto com o repositório.

- Arquivo criado por você, ou que já existia com o mesmo nome de um do `claude-kit`, fica como está. Se o conteúdo for diferente, a ferramenta avisa.
- Arquivo instalado e sem alterações é atualizado quando há versão nova e removido quando sai do `claude-kit`.
- Arquivo instalado que você editou não é tocado. A ferramenta avisa e diz se há versão nova.
- Em repositório já configurado antes, os arquivos idênticos aos do `claude-kit` passam a ser acompanhados; os diferentes ficam como estão, com aviso.
- Rodar de novo com tudo em dia não muda nada.
- Quando agentes mudam, a ferramenta avisa para abrir uma sessão nova do Claude: sessões abertas continuam com os agentes antigos. Se um dev não conseguir chamar o `executor` ou o `sdd`, o motivo costuma ser esse.

Para receber a versão nova dos arquivos em conflito, rode com `--force`. Ele sobrescreve só os arquivos que o `claude-kit` entrega e lista cada um em "Sobrescritos"; as edições sobrescritas não voltam, então faça commit antes se quiser guardá-las.

### Configuração base do Claude

O modelo `templates/settings.base.json` vai para `.claude/settings.json`, o arquivo compartilhado do projeto.

| Chave | Valor | Para quê |
| --- | --- | --- |
| `effortLevel` | `medium` | Esforço econômico por padrão. |
| `env.CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY` | `1` | Sem a pesquisa de satisfação no meio do trabalho. |

- Sem `.claude/settings.json`, o arquivo é criado com o modelo. Com ele, só o que falta é acrescentado: o que você definiu nunca muda, e o que difere do recomendado aparece em "Sugerido e não aplicado". Listas existentes ficam como estão.
- O que você apagar depois não volta, e um `settings.json` apagado não é recriado. O registro do que foi acrescentado fica no `claude-kit.lock.json`.
- Arquivo com JSON inválido não é tocado, e a ferramenta avisa. Tirar uma chave do modelo não a remove de quem já a recebeu: apague-a à mão.
- O modelo não concede permissões amplas, não define `model` e não define hooks. A única permissão nova, a da pasta de worktrees, vai para o `.claude/settings.local.json`, que fica fora do git.

## O time

A `orchestrator` não é um agente: é a sessão principal depois de `/team-setup`. Ela é a única que fala com você, monta o time de cada tarefa e só delega.

| Agente | Modelo | Papel |
| --- | --- | --- |
| `product-owner` | sonnet | Fonte das regras de negócio. Consulta e cria tarefas, nunca define prioridade, e edita ou apaga só a pedido explícito. |
| `sdd` | opus | Escreve a especificação da tarefa e é o único que escreve nela, inclusive o `Status`. Só o dev o chama. |
| `executor` | haiku | Ajudante dos devs. Executa uma tarefa da especificação, com teste primeiro, gate e commit. |
| `dev-frontend` | sonnet | Implementa telas. |
| `dev-backend` | sonnet | Implementa API e dados. |
| `dev-mobile` | sonnet | Implementa aplicativos de celular. |
| `dev-devops` | sonnet | Infraestrutura, pipelines de entrega e ambientes. |
| `dev-database` | sonnet | Modelagem, migrações e consultas. |
| `dev-fullstack` | sonnet | Tarefa pequena que atravessa tela e API, com uma pessoa só. |
| `dev-doc` | sonnet | Atualiza a documentação. Nunca define regra de negócio. |
| `reviewer` | opus | Revisa a entrega dos devs. Obrigatório sempre que houver dev na tarefa. |
| `qa` | sonnet | Valida a entrega. |
| `designer` | sonnet | Visual e experiência de uso. |

### Como o time é montado

- O time é montado por tarefa, com quantos agentes do mesmo papel o escopo pedir, e o trabalho é dividido para rodar em paralelo.
- A `orchestrator` pede as regras ao `product-owner`, propõe a composição e confirma com você antes de delegar. O `reviewer` entra sempre que houver dev. `qa` e `designer` são opcionais: ela avisa que existem e você decide.
- Cada tarefa roda em uma worktree própria, confirmada com você, para várias sessões trabalharem juntas no mesmo repositório.
- No início, ela pergunta um tema opcional para os nomes (por exemplo, personagens de Jujutsu Kaisen), o nome dela e o do `product-owner`. O nome de cada dev, do `reviewer`, do `qa` e do `designer` é perguntado só quando eles entram, uma pergunta por agente.
- Ela mostra uma tabela com o que cada agente está fazendo quando o time é montado, quando uma fase muda, quando alguém trava e antes de te fazer uma pergunta.
- Os agentes compartilham uma memória do time por repositório, em `.claude/team-memory/`, que guarda só o que continua valendo depois da tarefa e só é gravada a pedido seu.

### Subagentes ou time de agentes

O fluxo é o mesmo nos dois modos, e a escolha é sua:

| | Subagentes (padrão) | Time de agentes (opcional) |
| --- | --- | --- |
| Como ligar | Nada a fazer | `npx ai-sync --teams` no repositório (no clone do `claude-kit`, `node bin/ai-sync.js --teams`). Grava `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` no `.claude/settings.local.json`, só seu e fora do git. `--no-teams` desliga. |
| Comunicação | Cada agente devolve o resultado a quem o chamou. | Os integrantes trocam mensagens entre si e com você pelo painel; os devs podem perguntar ao `product-owner` direto. |
| Consumo | Menor. | Bem maior (a documentação do Claude Code estima cerca de 7 vezes). |
| Indicado para | Tarefas em sequência ou que mexem nos mesmos arquivos. | Tarefas grandes, com partes independentes. |

- O recurso é experimental e vem desligado. O `ai-sync` nunca o liga sozinho, e ligar ou desligar exige abrir uma sessão nova.
- Com ele ligado, qualquer agente chamado com nome vira integrante e aparece no painel, mesmo sem você pedir um time.
- Só a `orchestrator` cria integrantes. Não há retomada: depois de `/resume`, ela recria quem sumiu e avisa você. Cada sessão tem um time só.
- A especificação continua a única fonte de verdade: a lista de tarefas do time só a espelha.

### Fluxo de uma tarefa

1. O `product-owner` define as regras e o escopo.
2. Um dev pede a especificação ao `sdd`, e você a aprova. Em tarefa pequena você pode dispensá-la.
3. Os devs implementam com TDD em lógica e comportamento, delegando as tarefas mecânicas e paralelas ao `executor`, com um commit atômico por tarefa.
4. O `reviewer` revisa, conferindo especificação e testes. Ele não aprova com achado em aberto.
5. O `designer` entra em mudanças visuais e o `qa` valida, se estiverem no time.

Dúvidas de regra vão ao `product-owner`; dúvidas maiores vão a você. Tudo passa pela `orchestrator`.

### Especificação

Fica em `.specs/<nome-da-branch>.md`, na worktree da tarefa, e vai commitada com a branch.

- Tem tipo (funcionalidade ou bug), tamanho (pequena, média ou grande) e status (`em-revisao`, `aprovada`, `em-andamento`, `implementada` ou `resolvida`).
- Só o `sdd` escreve no arquivo. Devs e executores relatam cada tarefa feita à `orchestrator` (tarefa, commit e evidência), e ela passa o andamento a um `sdd` de andamento.
- Regras e critérios de aceite têm IDs (`RN-01`, `CA-01`) no formato "QUANDO ... ENTÃO o sistema DEVE ...".
- Cada tarefa traz de quem é, do que depende, o gate e se é paralela (`[P]`) ou mecânica (modelo econômico).
- Nada é codificado antes da sua aprovação, a menos que você dispense a especificação.

### Gate de verificação

O gate roda as mesmas checagens que o CI do projeto, em dois níveis:

- **Gate da tarefa**, em todo commit: typecheck (quando existe), o teste da tarefa, o lint e a checagem de formatação dos arquivos alterados (quando há formatador).
- **Gate de fase**, ao fim de cada fase do plano e antes do `reviewer`: build, suíte completa, lint completo e formatação completa.

O `sdd` descobre os comandos no projeto (`package.json`, `Makefile` ou CI) e os escreve na especificação. Se o typecheck leva minutos, ele marca `Typecheck lento` e o typecheck passa para o gate de fase.

### Commits, coautoria e `.env`

- Os devs e o `executor` têm no prompt a autorização de commitar. Se o classificador de permissões do Claude Code ainda negar o commit, libere-o no `.claude/settings.local.json` do projeto, que não vai para o git: `{ "permissions": { "allow": ["Bash(git commit *)"] } }`. É uma sugestão opcional (não vai no modelo base) e não garante que o classificador deixe de negar.
- A coautoria do Claude depende do repositório. A regra `git-standard` manda seguir a regra dele e conferir o commit com `git log -1`. Para um repositório que a proíbe, desligue a linha na origem com `"attribution": { "commit": "", "pr": "" }` no `.claude/settings.json` dele.
- O `.env` pode ser lido e copiado pelos agentes, por exemplo para a worktree da tarefa. A regra de segurança proíbe imprimir os valores, commitá-lo ou colá-lo em mensagens e na especificação.

## Regras

Ficam em `.claude/rules/` e o Claude Code as carrega sozinho. Cada uma diz no início quando vale. As regras de stack têm `paths` no cabeçalho, então só são carregadas ao mexer em arquivos da stack.

Gerais:

- `commit-standard`: tipos de alteração com ícone e padrão de branches e commits (`Fix :bug: [#5] Troca <a href> por <Link>`).
- `code-standard`: estilo de código, incluindo nunca escrever comentários.
- `testing-standard`: testes primeiro (TDD), teste para cada bug e nunca alterar teste só para passar.
- `security-standard`: segredos, validação de entrada, acesso, senhas e dependências.
- `review-standard`: como preparar e como fazer uma revisão de código.
- `git-standard`: git com vários agentes na mesma worktree. Só os próprios arquivos, por caminho exato, nunca `git add .`, `git add -A` nem `git commit -a`, e como reescrever o histórico sem `git rebase -i`.
- `feedback-standard`: problema nas instruções do próprio time vira issue no `felipe-sant/claude-kit`. Os agentes relatam à `orchestrator`, que procura duplicata e abre a issue sem código nem dado do projeto, porque o repositório é público.
- `pull-request-standard`: a descrição do pull request tem as seções "O que muda", "Como foi verificado" e "Observações", com `Closes #n` quando conclui uma issue. Comentários são simples, objetivos e sobre o código, não sobre a pessoa.
- `issue-standard`: título em frase simples, as quatro seções da issue de bug e as três da de funcionalidade, as etiquetas `bug` e `enhancement`, e nunca definir tamanho nem prioridade.

Por stack: `react-standard`, `nestjs-standard`, `laravel-standard` e `adonisjs-standard`.

## Skills

Ficam em `.claude/skills/<nome>/SKILL.md`. O Claude as usa sozinho quando o pedido combina com a descrição, ou você as chama por `/nome`.

- `team-setup`: transforma a sessão na `orchestrator`.
- `commit-message`: cria o commit no padrão do projeto, dividindo mudanças que misturam propósitos.
- `create-pull-request`: roda lint e testes, faz o push (com sua confirmação) e abre o PR com título no padrão e descrição clara.
- `code-review`: revisa uma mudança e entrega achados que bloqueiam ou são sugestões, sem alterar o código.
- `bug-investigation`: acha a causa com evidências e propõe a correção e o teste, sem aplicar.
- `documentation`: escreve e atualiza a documentação a partir do que o código faz.

Por stack: `react-component` (React) e `nestjs-module` (NestJS), ambas com teste primeiro.

## Contribuir com o claude-kit

Esta parte é para quem mantém o `claude-kit`. O repositório não tem aplicação nem build: é conteúdo (markdown e JSON) mais o `ai-sync`, um script Node sem dependências de execução.

### Estrutura

| Pasta ou arquivo | Conteúdo |
| --- | --- |
| `catalog.json` | Registra cada agente, regra, skill e modelo de configuração com `path`, `applies` e `description`, e as `stacks` com a regra de detecção. É o único lugar de registro. |
| `agents/`, `rules/`, `skills/` | O que vale para qualquer projeto (uma pasta por skill, com `SKILL.md`). |
| `stacks/<stack>/` | O que vale só para uma stack, com `agents/`, `rules/` e `skills/`. |
| `templates/` | Modelos de configuração do Claude (hoje, `settings.base.json`). |
| `profiles/` | Perfis manuais, escolhidos com `--profile`. |
| `bin/ai-sync.js` | O comando. |
| `lint/` | Regra do oxlint contra comentários e checagem do formato do conteúdo. |
| `tests/` | Testes do `ai-sync`, do formato do conteúdo e das automações. |
| `.changeset/` | Notas de mudança (uma por pull request) e a configuração da ferramenta de versões. |
| `scripts/` | Scripts das automações de versão e publicação. |
| `.github/workflows/` | CI, checagem da nota de mudança, pull request de versão, release e agente de issues. |
| `.github/issue-agent/` | Scripts e instruções do agente de issues. |
| `.claude/` | O próprio `claude-kit` aplicado aqui com o perfil `tooling`. Gerado: nunca edite à mão, exceto `.claude/CLAUDE.md`. |

O campo `applies` de cada item do catálogo diz a que projetos ele serve: `["all"]` para qualquer projeto ou uma lista de stacks, como `["react"]`.

### Adicionar um item

1. Crie o arquivo: `agents/nome.md` (com o cabeçalho `name`, `description`, `model`), `rules/nome.md` ou `skills/nome/SKILL.md`. Se for só de uma stack, use `stacks/<stack>/...`.
2. Registre em `catalog.json`, no grupo certo, com `path`, `applies` e `description`.
3. Rode o `ai-sync`: com `applies: ["all"]` ou uma stack detectada, o item é aplicado sozinho. Para um perfil manual receber o item, inclua o nome em `profiles/*.json`.
4. Se for um agente que a `orchestrator` pode chamar, inclua o nome na lista de agentes de `skills/team-setup/SKILL.md`.

Um modelo de configuração fica em `templates/settings.nome.json` e é registrado no grupo `settings`; o lint reprova modelo que conceda permissões amplas. Uma stack nova entra em `stacks` no `catalog.json` com `detect.dependencies` (nomes de pacotes do `package.json` ou `composer.json`).

### Verificar uma mudança

Instale as dependências uma vez com `npm ci`.

- `npm test`: testes do `ai-sync`, do catálogo, dos perfis, do conteúdo e das automações. Trabalham só em pastas temporárias.
- `npm run lint`: oxlint com a regra de nunca escrever comentários e a checagem do formato de agentes, regras, skills, perfis e JSON.
- `node bin/ai-sync.js --check`: consistência do catálogo e dos perfis.
- `npm pack --dry-run`: lista o que o pacote leva para o npm (só o que o `ai-sync` usa).
- `npm run sync`: aplica o `claude-kit` neste repositório e atualiza o `.claude/`.
- Para testar uma mudança em outro repositório antes de publicar, rode o `ai-sync` pelo clone: `node bin/ai-sync.js /caminho/do/repo`.

O hook de pre-commit regenera o `.claude/` a cada commit, e o GitHub roda lint e testes em todo PR. Os detalhes estão em `.claude/CLAUDE.md`.

### Nota de mudança

Todo pull request traz uma nota de mudança (changeset), criada no mesmo pull request. Ela diz o tipo da mudança e é o que gera a versão e o CHANGELOG.

- Com tipo: `npm run changeset` (interativo) e escolha major, minor ou patch.
- Vazia, para documentação, textos (como o README), CI e testes: `npm run changeset -- --empty`.
- Sem terminal (como um agente), crie o arquivo à mão em `.changeset/`. O nome é livre e único; o nome da branch é uma boa sugestão. O texto fica em português simples, em uma ou duas linhas:

```
---
"@felipe-sant/claude-kit": patch
---

Corrige a mensagem do ai-sync quando a pasta não existe.
```

A nota vazia tem só os dois `---`, sem tipo e sem texto. O CI reprova o pull request sem nota (checagem `Changeset`); o pull request de versão fica fora dessa checagem.

### Regra de versão

| Tipo | Quando |
| --- | --- |
| major | Remove ou renomeia um agente, uma regra ou uma skill, muda o fluxo do time ou quebra uma opção do `ai-sync`. |
| minor | Novo agente, regra, skill, stack ou opção. |
| patch | Ajuste de texto, correção ou mudança que não quebra nada. |

### Versão e publicação

1. O pull request com nota de tipo entra na `main`. A automação abre, ou atualiza, o pull request de versão "Chore :see_no_evil: Atualiza versão e CHANGELOG", com a nova versão, o CHANGELOG e o `.claude/` regenerado. Só notas vazias não abrem pull request de versão.
2. O merge do pull request de versão cria a tag `vX.Y.Z`, cria o Release com a seção daquela versão do CHANGELOG e publica a versão no npm. Versão que já tem tag não é publicada de novo, e versão abaixo da 1.0.0 não é publicada.
3. A publicação usa o trusted publishing do npm: não há token guardado no repositório, e as versões automáticas saem com prova de origem. Se a publicação falha, a tag não é criada e rodar a automação de novo tenta publicar outra vez.

O pull request de versão é aberto com o token padrão do GitHub, que não dispara o CI. Antes de cada merge dele, depois da última atualização automática, feche e reabra o pull request e espere o CI passar. O mesmo vale para o pull request que o agente de issues abre.

### Passos do dono do repositório

Feitos fora do código, nesta ordem:

1. Ter conta no npm e ser dono do escopo `@felipe-sant`, com verificação em dois fatores.
2. Manter ligada, em Settings, Actions, General, a opção "Allow GitHub Actions to create and approve pull requests".
3. Fazer o merge do pull request da publicação no npm. A versão continua 0.1.0 e nada é publicado; a automação abre o pull request de versão com a 1.0.0.
4. Colocar a checagem `Changeset` entre as obrigatórias da regra da `main`. Só depois do passo 3, porque antes disso a checagem não existe na `main`.
5. Publicar a 1.0.0 à mão, a partir da branch do pull request de versão: `git switch changeset-release/main`, `npm ci`, `npm pack --dry-run` para conferir a lista e `npm publish --access public`. O npm só deixa ligar o trusted publishing em um pacote que já existe, por isso essa versão sai sem prova de origem. Entre esta publicação e o merge do passo 6, nenhum outro pull request pode entrar na `main`.
6. Fechar e reabrir o pull request de versão, esperar o CI passar e fazer o merge. A automação cria a tag `v1.0.0` e o Release e não publica de novo.
7. Na página do pacote no npm, ligar o trusted publishing com o dono `felipe-sant`, o repositório `claude-kit` e o workflow `release.yml`, logo antes do merge do primeiro pull request de versão que deve publicar sozinho. A ligação expira se a primeira publicação por ela não acontecer em 2 dias.
8. Em todo pull request de versão seguinte, logo antes do merge, fechar e reabrir o pull request e esperar o CI passar.

## Agente de issues

Duas automações do GitHub Actions, só deste repositório (não vão para outros pelo `ai-sync`): a "Issue Size Set" define o tamanho das issues abertas por colaboradores, e a "Issue Claude Agent" resolve a issue pequena e abre o pull request. Só tratam issues de dono, membro ou colaborador; só leem título, corpo e comentários dessas pessoas, e o texto da issue é tratado como descrição do problema, nunca como ordem.

| Etiqueta | Significado |
| --- | --- |
| `Size: P` | Tarefa pequena e clara, que a Issue Claude Agent resolve sozinha, incluindo ajustes pequenos nas regras, nos agentes e nas skills. É a única que vira pull request. |
| `Size: M` | Precisa da atenção do dono do repositório. |
| `Size: G` | Grande migração ou mudança que envolve o fluxo inteiro do repositório. |

Na dúvida entre P e M, é M. Mudar automações, fluxos do GitHub, permissões ou segredos, apagar arquivo e qualquer mudança major pela regra de versão são sempre M. As issues M e G recebem só o tamanho e um comentário curto com o motivo.

**Issue Size Set.** Põe uma etiqueta de tamanho e um comentário com o motivo. Roda quando uma issue é aberta ou reaberta, todo dia às 02:28 de Brasília (até 10 issues sem tamanho por varredura, das mais antigas) e à mão. Ao terminar, se há uma P esperando, dispara a Issue Claude Agent.

**Issue Claude Agent.** Resolve uma issue P no padrão de branch, commit e descrição do time, só com lint e testes passando, e grava a nota de mudança pela regra de versão (patch, minor ou vazia). Se percebe que a mudança é major ou maior do que parecia, para, explica na issue e troca P por M, sem deixar pull request. Quem abre o pull request é um passo da automação depois do agente: ele confere a branch e a nota, monta o título, liga o `Closes #n` e acrescenta a linha "Aberto pelo agente de issues.".

- Roda encadeada pela Issue Size Set, todo dia às 02:47 de Brasília e à mão. Cada execução trata uma única issue, a P mais antiga que puder ser tratada.
- Só trata issue P sem pull request ligado, sem branch própria, sem responsável e sem dependência aberta. Pode haver até 5 pull requests do agente abertos; com 5 ou mais, a execução termina sem chamar o Claude.
- Issue que diz "depende de #n" com a #n ainda aberta espera fora da fila.
- A automação comenta na issue que o agente começou e, no fim, atualiza o comentário com o link do pull request ou o motivo de não ter aberto.
- Nunca fazem merge, nunca enviam nada direto para a `main`, nunca definem prioridade e nunca editam à mão o `.claude/`, exceto o `.claude/CLAUDE.md`.

Disparo à mão: em Actions, escolha "Issue Size Set" ou "Issue Claude Agent" e clique em Run workflow, ou:

```bash
gh workflow run issue-size-set.yml
gh workflow run issue-claude-agent.yml
gh workflow run issue-claude-agent.yml -f issue=<número>
```

O campo `issue` existe só na Issue Claude Agent e aceita apenas dígitos. Vazio, ela pega a P mais antiga que pode ser tratada. Com o número de uma issue que não pode ser tratada, ou com o limite de 5 atingido, termina sem fazer nada e o resumo da execução diz o motivo.

### Instalação das automações

Feita pelo dono do repositório, uma vez:

1. Gere a credencial da assinatura Pro/Max com `claude setup-token` e guarde como segredo do repositório com o nome `CLAUDE_CODE_OAUTH_TOKEN`: `gh secret set CLAUDE_CODE_OAUTH_TOKEN --repo felipe-sant/claude-kit`.
2. Instale o app do Claude no repositório com `/install-github-app` no Claude Code.
3. Ligue a opção "Allow GitHub Actions to create and approve pull requests" (veja os passos do dono). Sem ela, a automação não abre o pull request do agente.

Sem a credencial, a execução falha de forma visível, e a Issue Size Set não dispara a Issue Claude Agent.

O Claude também responde quando alguém com permissão de escrita no repositório o menciona com @claude em uma issue ou em um comentário.
