# claude-kit

Ferramenta que roda em outros repositórios para configurar o Claude Code e o sistema de desenvolvimento da melhor forma, com um comando. Ela leva para cada projeto o time de agentes, os padrões de desenvolvimento e as skills que servem a ele, escolhendo sozinha o que é de cada stack.

## Em resumo

| O que | Quantos | Onde fica no projeto |
| --- | --- | --- |
| Agentes (o time) | 13 | `.claude/agents/` |
| Regras (padrões de desenvolvimento) | 9 gerais e 4 por stack | `.claude/rules/` |
| Skills | 6 gerais e 2 por stack | `.claude/skills/` |
| Configuração base do Claude | 1 modelo | `.claude/settings.json` |

Stacks com conteúdo hoje: React, NestJS, Laravel e AdonisJS.

## Usar em um repositório

Requer Node 22 ou mais novo. O `claude-kit` é publicado no npm como `@felipe-sant/claude-kit`, e o comando é o `ai-sync`, chamado pelo `npx`.

Para fixar a versão do time no repositório, instale como dependência de desenvolvimento e rode:

```
npm install --save-dev @felipe-sant/claude-kit
npx ai-sync
```

Para usar sem instalar:

```
npx @felipe-sant/claude-kit
```

Para atualizar, suba a versão e rode o `ai-sync` de novo (por exemplo, `npm install --save-dev @felipe-sant/claude-kit@latest` e `npx ai-sync`). Para voltar a uma versão anterior, instale essa versão (`@felipe-sant/claude-kit@1.0.0`) e rode o `ai-sync`. Cada arquivo instalado guarda no registro a versão do `claude-kit` que o trouxe.

Quem desenvolve o próprio `claude-kit` pode usar um clone local no lugar do pacote:

```
node ~/claude-kit/bin/ai-sync.js /caminho/do/repo
```

O pacote leva só o que o `ai-sync` usa (o comando, o catálogo, os agentes, as regras, as skills, as stacks, os modelos de configuração e os perfis). Testes, lint, automações do GitHub e especificações ficam de fora.

Depois, abra o Claude normalmente no repositório e transforme a sessão na orquestradora do time:

```
/team-setup
```

Não é preciso abrir o Claude com `--agent`: a própria sessão principal vira a `orchestrator` ao carregar a skill `team-setup`, com o modelo que a sessão já usa.

Opções:

| Opção | O que faz |
| --- | --- |
| `--profile nome` (ou `-p`) | Escolhe um perfil à mão. Prevalece sobre a detecção e aplica exatamente o que o perfil lista. |
| `--force` | Reinstala também os arquivos em conflito (veja "Sincronização segura"). |
| `--teams` / `--no-teams` | Liga ou desliga o recurso experimental de times de agentes em `.claude/settings.local.json` (veja "Subagentes ou time de agentes"). Sem nenhum dos dois, o `ai-sync` não mexe nisso. |
| `--check` | Confere se o catálogo, os arquivos e os perfis do `claude-kit` estão consistentes. Não aplica nada. |

Além de copiar os arquivos e aplicar a configuração base, o `ai-sync` libera, em `.claude/settings.local.json`, a pasta de worktrees das tarefas (`<repositório>-worktrees`, ao lado do repositório) e mantém `.claude/team-memory/` e `.claude/settings.local.json` fora do git, pelo `.git/info/exclude`.

## O que é aplicado

Sem `--profile`, a ferramenta detecta a stack do projeto e aplica tudo o que vale para qualquer projeto mais o que é das stacks detectadas. Ao final, mostra as stacks detectadas e o que foi criado, atualizado, removido e deixado como estava.

| Stack | Detectada por (dependência) |
| --- | --- |
| React | `react` |
| NestJS | `@nestjs/core` |
| Laravel | `laravel/framework` |
| AdonisJS | `@adonisjs/core` |

- A detecção lê o `package.json` e o `composer.json` na raiz e nas pastas de primeiro nível (menos as ocultas, `node_modules`, `vendor`, `dist`, `build` e `coverage`). Um repositório com painel e API reconhece as duas stacks.
- Só são detectadas stacks que têm conteúdo no `claude-kit`. As regras de detecção ficam em `stacks`, no `catalog.json`.
- Se nada for reconhecido, aplica só o que vale para qualquer projeto e avisa.
- Os padrões e as skills de uma stack não chegam a projetos de outra.

### Perfis

Ficam em `profiles/*.json` e só valem com `--profile`. Cada perfil lista `agents`, `rules`, `skills` e `settings` pelos nomes do catálogo. Os perfis trazem só o que vale para qualquer projeto: o conteúdo de stack vem apenas pela detecção.

- `default`: o time completo.
- `frontend`: `dev-frontend`, `dev-fullstack` e `dev-doc`, com `designer`.
- `backend`: `dev-backend`, `dev-fullstack`, `dev-database`, `dev-devops` e `dev-doc`, sem `designer`.
- `tooling`: para repositórios de ferramentas, scripts, CLIs e conteúdo (como o próprio `claude-kit`), sem telas nem banco. `dev-backend` (scripts e lógica), `dev-devops` (CI) e `dev-doc` (documentação e conteúdo em markdown), sem `designer`. Como esses repositórios não têm stack detectável, use `--profile tooling`.

Todos incluem `product-owner`, `sdd`, `executor`, `reviewer` e `qa`, as nove regras gerais, as seis skills gerais (entre elas a `team-setup`, que faz da sessão a `orchestrator`) e a configuração base. Para uma configuração manual nova, crie `profiles/nome.json`.

## Sincronização segura

O `ai-sync` registra o que instalou em `.claude/claude-kit.lock.json` (caminho, versão e impressão digital de cada arquivo) e usa esse registro para nunca mexer no que é seu. Versione esse arquivo junto com o repositório.

Se o repositório ainda tem o registro com o nome antigo do projeto, o `ai-sync` o migra sozinho e sem aviso: passa a usar o novo e remove o antigo. Se os dois existirem, vale o novo e o antigo é removido. Se o antigo for inválido, a ferramenta para com erro.

- Arquivo criado por você, ou que já existia com o mesmo nome de um do `claude-kit`, não é apagado nem sobrescrito. Se o conteúdo for diferente, a ferramenta avisa.
- Arquivo instalado e sem alterações é atualizado quando há versão nova, e removido quando sai do `claude-kit`.
- Arquivo instalado que você editou não é tocado. A ferramenta avisa e diz se há versão nova disponível.
- Em repositório já configurado antes, os arquivos idênticos aos do `claude-kit` passam a ser acompanhados; os diferentes ficam como estão, com aviso.
- Rodar de novo com tudo em dia não muda nada.
- Quando agentes são instalados, atualizados ou removidos, a ferramenta avisa para abrir uma sessão nova do Claude: sessões já abertas continuam com os agentes antigos. Se um dev não conseguir chamar o `executor` ou o `sdd`, ele avisa a `orchestrator`, que orienta você a rodar o `ai-sync` e abrir uma sessão nova.

Para receber a versão nova dos arquivos em conflito (os que você editou e os que já existiam sem registro), rode com `--force`. Ele sobrescreve só os arquivos que o `claude-kit` entrega e que estão em conflito, e lista cada um em "Sobrescritos". Arquivos que o `claude-kit` não entrega nunca são tocados, e as edições sobrescritas não voltam: faça commit antes se quiser guardá-las.

## Configuração base do Claude

O modelo fica em `templates/settings.base.json` e vai para `.claude/settings.json` do projeto, o arquivo compartilhado e versionado. Os valores recomendados são:

| Chave | Valor | Para quê |
| --- | --- | --- |
| `effortLevel` | `medium` | Esforço econômico por padrão. |
| `env.CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY` | `1` | Sem a pesquisa de satisfação no meio do trabalho. |

Como é aplicada:

- Projeto sem `.claude/settings.json`: o arquivo é criado com o modelo.
- Projeto com o arquivo: só o que falta é acrescentado. O que você já definiu nunca é alterado, e o que difere do recomendado aparece em "Sugerido e não aplicado", com o seu valor e o recomendado. Listas existentes (como `permissions.deny`) ficam como estão.
- O que você apagar depois de a ferramenta acrescentar não volta, e um `settings.json` apagado não é recriado. O registro do que foi acrescentado fica no `claude-kit.lock.json`.
- Se o `claude-kit.lock.json` foi apagado e é recriado, as configurações que já estão no `settings.json` com o mesmo valor do modelo passam a constar como aplicadas pelo kit. Uma configuração igual que foi você quem definiu também passa a contar como do kit. Com o registro existente, nada disso muda: o que ele não lista continua sendo seu.
- Arquivo com JSON inválido não é tocado, e a ferramenta avisa.
- Tirar uma chave do modelo não a remove dos projetos que já a receberam: apague-a à mão no `.claude/settings.json` deles. Foi o caso do bloqueio de leitura do `.env`, retirado porque a regra de negação também impede o `cp` do `.env` para a worktree da tarefa, e uma regra de permissão não abre exceção a ela.
- O modelo não concede permissões amplas (nada de `allow`, `defaultMode` ou diretórios extras; o lint reprova). A única permissão nova é a da pasta de worktrees, e ela vai para `.claude/settings.local.json`, o arquivo local, que fica fora do git.
- O modelo não define `model` nem hooks. Cada agente já escolhe o seu modelo, e fixar um no projeto passaria por cima da escolha de quem trabalha nele.

## Time de agentes

A `orchestrator` não é um agente: é a sessão principal depois de rodar `/team-setup`. Ela é a única que fala com o usuário, monta o time de cada tarefa e só delega.

| Agente | Modelo | Papel |
| --- | --- | --- |
| `product-owner` | sonnet | Fonte das regras de negócio. Consulta e cria tarefas, nunca define prioridade, e edita ou apaga só a pedido explícito do usuário. |
| `sdd` | opus | Escreve a especificação da tarefa e é o único que escreve nela, inclusive o `Status`. Só o dev o chama para escrever. |
| `executor` | haiku | Ajudante dos devs. Executa uma tarefa da especificação, com teste primeiro, gate e commit. Só é chamado por um dev. |
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

### Subagentes ou time de agentes

O fluxo é o mesmo nos dois modos, e a escolha é sua:

| | Subagentes (padrão) | Time de agentes (opcional) |
| --- | --- | --- |
| Como ligar | Nada a fazer | `node bin/ai-sync.js --teams` no repositório (grava `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` no `.claude/settings.local.json`, só seu e fora do git). `--no-teams` desliga. |
| Comunicação | Cada agente devolve o resultado a quem o chamou. Agentes chamados com nome também se falam por ele. | Os integrantes trocam mensagens entre si e com você pelo painel; os devs podem perguntar ao `product-owner` direto. |
| Consumo | Menor. | Bem maior (a documentação do Claude Code estima cerca de 7 vezes). |
| Indicado para | Tarefas em sequência ou que mexem nos mesmos arquivos. | Tarefas grandes, com partes independentes. |

- O recurso é experimental e vem desligado. O `ai-sync` nunca o liga sozinho, e ligar ou desligar exige abrir uma sessão nova.
- Com ele ligado, qualquer agente chamado com nome vira integrante, então em um repositório com o recurso ligado os agentes aparecem no painel mesmo sem você pedir um time.
- Só a `orchestrator` cria integrantes. Como ela é a sessão principal, tem todas as ferramentas que os integrantes usam e se limita a delegar por instrução da skill `team-setup`.
- A especificação continua a única fonte de verdade: a lista de tarefas do time só a espelha.
- Não há retomada de integrantes: depois de `/resume`, a `orchestrator` recria quem sumiu e avisa você.
- Cada sessão tem um time só. Para tarefas ao mesmo tempo, abra outra sessão.
- Não testado ainda: os ajudantes `executor` de um dev podem rodar um depois do outro dentro do time.

### Fluxo de uma tarefa

1. O `product-owner` define as regras e o escopo.
2. Um dev pede a especificação ao `sdd`, e você a aprova. Em tarefa pequena você pode dispensá-la.
3. Os devs implementam com TDD em lógica e comportamento, delegando as tarefas mecânicas e paralelas ao `executor`, com um commit atômico por tarefa.
4. O `reviewer` revisa, conferindo especificação e testes. Ele não aprova com achado em aberto.
5. O `designer` entra em mudanças visuais e o `qa` valida, se estiverem no time.

Dúvidas de regra vão ao `product-owner`; dúvidas maiores vão a você. Tudo passa pela `orchestrator`.

### Especificação

Fica em um único arquivo, `.specs/<nome-da-branch>.md`, na worktree da tarefa, e vai commitada com a branch.

- Tem tipo (funcionalidade ou bug), tamanho (pequena, média ou grande) e status (`em-revisao`, `aprovada`, `em-andamento`, `implementada` ou `resolvida`).
- Só o `sdd` escreve no arquivo e commita só ele. Os devs e executores relatam cada tarefa feita à `orchestrator` (tarefa, commit e evidência), e ela passa o andamento a um `sdd` de andamento. Assim, dois devs não editam nem commitam a mesma linha de `Status`.
- Regras e critérios de aceite têm IDs (`RN-01`, `CA-01`) no formato "QUANDO ... ENTÃO o sistema DEVE ...".
- Cada tarefa traz de quem é, do que depende, o gate e se é paralela (`[P]`) ou mecânica (modelo econômico).
- Nada é codificado antes da sua aprovação, a menos que você dispense a especificação. As tarefas `[P]` rodam ao mesmo tempo.

### Gate de verificação

O gate tem dois níveis, para não rodar build e suíte inteira a cada commit:

- **Gate da tarefa**, em todo commit: typecheck do projeto (quando existe), o teste da tarefa, o lint e a checagem de formatação dos arquivos alterados (quando o projeto tem formatador). Nunca se commita sem o typecheck.
- **Gate de fase**, uma vez ao fim de cada fase do plano e antes do `reviewer`: build, suíte completa, lint completo e checagem de formatação completa.

Os dois níveis rodam as mesmas checagens que o CI do projeto roda, para o que passa no gate também passar no CI.

O `sdd` descobre os comandos no projeto (`package.json`, `Makefile` ou CI) e os escreve na especificação. Se o typecheck do projeto leva minutos, ele marca `Typecheck lento` com o tempo medido e o typecheck passa para o gate de fase, aceitando que commits intermediários possam não compilar. Os devs registram o resultado, incluindo o typecheck, no Status de cada tarefa, e o `reviewer` confere essa evidência e roda o gate de fase uma vez no último commit.

### Como o time é montado

- O time é montado por tarefa, com quantos agentes do mesmo papel o escopo pedir, e o trabalho é dividido para rodar em paralelo.
- A `orchestrator` pede as regras ao `product-owner`, propõe a composição e confirma com você antes de delegar. O `reviewer` entra sempre que houver dev. `qa` e `designer` são opcionais: ela avisa que existem e você decide.
- Cada tarefa roda em uma worktree própria, confirmada com você, para várias sessões trabalharem juntas no mesmo repositório.
- No início da sessão ela pergunta um tema opcional para os nomes (por exemplo, personagens de Jujutsu Kaisen), o nome dela e o do `product-owner`. Com tema, cada pergunta de nome traz sugestões, e você pode dizer "escolha por mim". O nome de cada dev, do `reviewer`, do `qa` e do `designer` é perguntado só quando eles entram no time, uma pergunta por agente.
- Cada agente aparece com o nome e a função abreviada, como `Rika (PO)` ou `Gojo (Dev Back)`.
- A `orchestrator` mostra uma tabela com o que cada agente está fazendo, o estado e o que ele espera, quando o time é montado, quando uma fase muda, quando alguém trava e antes de te fazer uma pergunta.
- Os agentes compartilham uma memória do time por repositório, em `.claude/team-memory/`, que guarda só o que continua valendo depois da tarefa, e só é gravada a pedido seu.

### Commits, coautoria e `.env`

- Os devs e o `executor` têm no prompt a autorização de commitar. Se o classificador de permissões do Claude Code ainda negar o commit, libere-o no `.claude/settings.local.json` do projeto, que não vai para o git: `{ "permissions": { "allow": ["Bash(git commit *)"] } }`. Isso é uma sugestão opcional e não vai no modelo base, porque o lint reprova modelos com permissões amplas. Não garanto que a regra evite a negação do classificador.
- A coautoria do Claude depende do repositório. O `git-standard` manda seguir a regra dele e conferir o commit com `git log -1`. Para um repositório que a proíbe, desligue a linha na origem com `"attribution": { "commit": "", "pr": "" }` no `.claude/settings.json` dele. A chave `attribution` vem da documentação do Claude Code e substitui a antiga `includeCoAuthoredBy`.
- O `.env` pode ser lido e copiado pelos agentes, por exemplo para a worktree da tarefa. A regra de segurança proíbe imprimir os valores, commitá-lo ou colá-lo em mensagens e na especificação.

## Regras

Ficam em `rules/*.md` (gerais) e `stacks/<stack>/rules/*.md` (por stack). O Claude Code as carrega sozinho a partir de `.claude/rules/`, sem nenhuma ação sua. Cada uma é curta e diz no início quando vale.

Gerais:

- `team-setup`: transforma a sessão principal na `orchestrator`, que pergunta os nomes, monta o time de cada tarefa e só delega. Rode `/team-setup` no início da sessão.
- `commit-standard`: tipos de alteração com ícone e padrão de branches e commits (`Fix :bug: [#5] Troca <a href> por <Link>`).
- `code-standard`: estilo de código, incluindo nunca escrever comentários.
- `testing-standard`: testes primeiro (TDD), teste para cada bug e nunca alterar teste só para passar.
- `security-standard`: segredos, validação de entrada, acesso, senhas e dependências.
- `review-standard`: como preparar e como fazer uma revisão de código.
- `git-standard`: git com vários agentes na mesma worktree. Adicionar e commitar só os próprios arquivos, por caminho exato (`git commit -m "..." -- caminhos`), nunca `git add .`, `git add -A` nem `git commit -a`, e como reescrever o histórico sem `git rebase -i` (`GIT_SEQUENCE_EDITOR`, `--autosquash` e cherry-pick).
- `feedback-standard`: problema nas instruções do próprio time (agente que não consegue usar uma ferramenta, regra mal escrita ou que trava o fluxo) vira issue no `felipe-sant/claude-kit` assim que aparece. Os agentes relatam à `orchestrator`, que procura duplicata e abre a issue sem pedir confirmação, sem código nem dado do projeto, porque o repositório é público.
- `pull-request-standard`: a descrição do pull request tem as seções "O que muda", "Como foi verificado" e "Observações", com `Closes #n` quando conclui uma issue, e os comentários em pull request, em issue e de revisão são simples, objetivos, uma ideia por comentário e sobre o código, não sobre a pessoa.
- `issue-standard`: criação de issues do GitHub, com título em frase simples, as quatro seções da issue de bug e as três da de funcionalidade, as etiquetas `bug` e `enhancement` e nunca definir tamanho nem prioridade.

Por stack: `react-standard`, `nestjs-standard`, `laravel-standard` e `adonisjs-standard`. Têm `paths` no cabeçalho, então o Claude só as carrega ao mexer em arquivos da stack. Em um repositório com painel React e API NestJS, cada padrão aparece só nos arquivos certos.

## Skills

Ficam em `skills/<nome>/SKILL.md` (gerais) e `stacks/<stack>/skills/<nome>/SKILL.md` (por stack). O Claude as usa sozinho quando o pedido combina com a `description`, ou você as chama por `/nome`. Cada uma diz quando usar e o que entrega.

Gerais:

- `commit-message`: cria o commit no padrão do projeto, dividindo mudanças que misturam propósitos.
- `create-pull-request`: roda lint e testes, faz o push (com sua confirmação) e abre o PR com título no padrão e descrição clara.
- `code-review`: revisa uma mudança e entrega achados que bloqueiam ou são sugestões, sem alterar o código.
- `bug-investigation`: acha a causa com evidências e propõe a correção e o teste, sem aplicar.
- `documentation`: escreve e atualiza a documentação a partir do que o código faz.

Por stack: `react-component` (React) e `nestjs-module` (NestJS), ambas com teste primeiro.

Regras e skills editadas no projeto não são sobrescritas pela próxima sincronização.

## Agente de issues

Duas automações do GitHub Actions, só deste repositório (não vão para outros pelo `ai-sync`), cada uma com uma função só: a "Issue Size Set" define o tamanho das issues abertas por colaboradores, e a "Issue Claude Agent" resolve a issue pequena e a automação abre o pull request.

### Tamanhos

| Etiqueta | Significado |
| --- | --- |
| `Size: P` | Tarefa pequena e clara, que a Issue Claude Agent resolve sozinha, incluindo ajustes pequenos nas regras, nos agentes e nas skills do time. É a única que vira pull request. |
| `Size: M` | Precisa da atenção do dono do repositório. |
| `Size: G` | Grande migração ou mudança que envolve o fluxo inteiro do repositório. |

Na dúvida entre P e M, o tamanho é M. Mudar automações, fluxos do GitHub, permissões ou segredos, ou apagar arquivo, é sempre M, e mudança major pela regra de versão (veja "Versões e publicação") também. As issues M e G recebem só o tamanho e um comentário curto com o motivo e o link da execução.

### Issue Size Set

- Faz: põe uma única etiqueta de tamanho na issue e deixa um único comentário com o motivo e o link da execução.
- Só classifica issue de dono, membro ou colaborador, sem tamanho, sem responsável e sem pull request ligado.
- Nunca faz: criar branch, commit ou pull request, nem alterar arquivos do repositório.
- Roda quando uma issue é aberta ou reaberta (trata só essa issue), todo dia às 02:28 de Brasília (05:28 UTC) e quando disparada à mão. O minuto quebrado evita o pico de horas cheias do GitHub, que atrasa ou descarta execuções agendadas.
- Na varredura diária e no disparo manual, classifica no máximo 10 issues sem tamanho por execução, das mais antigas para as mais novas; o resto fica para a próxima.
- Ao terminar, confere se há uma P esperando e menos de 5 pull requests do agente abertos e, só nesse caso, dispara a Issue Claude Agent. Isso vale mesmo que não tenha classificado nada. Se a classificação falhar, ela não dispara a Issue Claude Agent.

### Issue Claude Agent

- Faz: resolve uma issue P, no padrão de branch, commit e descrição do time, só com o lint e os testes passando. O agente envia a branch e grava a descrição do pull request, com as seções "O que muda", "Como foi verificado" e "Observações", num arquivo que a própria automação indica. O agente grava também a nota de mudança no commit, pela regra de versão (patch para correção ou ajuste que não quebra nada, minor para item ou opção nova pequena, nota vazia para documentação, CI ou testes), e a automação recusa a branch sem nota. Quem abre o pull request é um passo da automação, depois do agente: o passo confere a branch, monta o título (como `Fix :bug: [#n] <título da issue>`) e o `Closes #n` que liga à issue, e acrescenta a linha "Aberto pelo agente de issues.". O agente nunca abre o pull request nem escreve o `Closes` ou essa linha. O pull request só é aberto se a etapa do agente terminou com sucesso.
- Quando algo dá errado: se um comando é negado, ou a execução falha ou trava, o agente comenta na issue o que houve, em um parágrafo, com o link da execução.
- Acompanhamento: assim que a Seleção escolhe a issue, a automação comenta nela que o agente começou, com o link da execução. No fim, ela edita esse mesmo comentário (não cria outro) com o resultado: o link do pull request aberto, ou o motivo de não ter aberto (o agente falhou, o limite de uso do Claude, comandos barrados, erro na abertura do pull request, o agente explicou em comentário ou terminou sem fazer nada). Se o agente comentou na issue nesta execução (e não abriu pull request), a automação apaga o comentário de acompanhamento em vez de editá-lo, para ficar só o do agente; se a remoção falhar, só sai um aviso. O comentário é do `github-actions[bot]`, não conta como comentário do agente e não leva a marca de classificação. Execução sem issue escolhida não comenta. A conferência final continua reprovando a execução sem pull request e sem comentário do agente.
- Saída da execução: a saída completa do agente fica como artefato `saida-do-agente` da execução, por 7 dias. Como o repositório é público, o arquivo passa antes por um filtro que troca por `***` os valores dos segredos da execução e os formatos conhecidos de token; a saída completa nunca vai para o log. O resumo da execução lista os comandos que foram barrados, para ler sem baixar nada.
- Limpeza: se a execução termina com uma branch do agente enviada e sem pull request, a automação apaga essa branch, para a issue voltar à fila. Nunca apaga uma branch que já existia antes da execução.
- Nunca faz: classificar, nem pôr ou mudar tamanho. A única exceção: se começa uma P e percebe que ela é maior (o que inclui mudança major pela regra de versão, que nunca é P), para, explica na issue e troca P por M, sem deixar pull request.
- Só trabalha em issue P, de dono, membro ou colaborador, sem pull request ligado, sem branch própria, sem responsável e sem tamanho M ou G, e só quando há menos de 5 pull requests do agente abertos. Pode haver até 5 abertos ao mesmo tempo, mas cada execução trata uma única issue e abre no máximo um pull request, da P mais antiga da fila que puder ser tratada. Conta como pull request do agente o que foi aberto pela conta do Claude ou o que traz na descrição a linha "Aberto pelo agente de issues.". O agente não tenta prever conflito entre as issues: isso fica para a revisão de cada pull request.
- Roda de três jeitos: encadeada pela Issue Size Set, quando há P esperando; todo dia às 02:47 de Brasília (05:47 UTC), logo depois da Issue Size Set, como rede de segurança; e à mão.
- No encadeamento ela pega a P mais antiga da fila, que pode não ser a issue que fez a Issue Size Set rodar. Uma issue de quem não é colaborador nunca é tratada por ela, mas a abertura dela faz a Issue Size Set rodar e pode adiantar uma P de colaborador que já estava na fila.

### Disparo à mão

Pela tela: em Actions, escolha "Issue Size Set" ou "Issue Claude Agent" e clique em Run workflow. Pela linha de comando:

```bash
gh workflow run issue-size-set.yml
gh workflow run issue-claude-agent.yml
gh workflow run issue-claude-agent.yml -f issue=<número>
```

O campo `issue` existe só na Issue Claude Agent e é opcional. Vazio, ela pega a P mais antiga que pode ser tratada; se não há nenhuma, termina com sucesso sem chamar o Claude e diz no resumo da execução que não há issue P na fila, ou que o limite de 5 pull requests do agente abertos foi atingido. Com o número de uma issue que não pode ser tratada, termina sem fazer nada e mostra o motivo no resumo e no registro da execução; com o limite atingido, recusa também o número informado e o resumo diz que nenhuma issue é tratada agora. Se a issue diz que depende de outra ainda aberta (veja "Dependência entre issues"), a execução também recusa e o resumo lista as dependências que seguem abertas. O valor só pode ter dígitos; qualquer outra coisa é recusada como número inválido.

### Limite de pull requests abertos

O agente só trata uma nova issue quando há menos de 5 pull requests dele abertos. Só contam os pull requests do agente (da conta do Claude ou com a linha "Aberto pelo agente de issues."); os de outras pessoas não entram na conta. Com 5 ou mais abertos, a execução termina com sucesso, sem chamar o Claude e sem abrir pull request, e o resumo diz quantos pull requests do agente estão abertos e que o limite é 5. O limite vale também para o disparo à mão com o número de uma issue. Quando um pull request é fechado ou mergeado, a próxima execução volta a tratar a fila.

### Dependência entre issues

Se o corpo da issue diz "depende de #n" e a issue #n está aberta, a issue espera fora da fila e o agente trata a próxima P mais antiga que puder ser tratada. Quando a #n é fechada, a issue volta para a fila, sem disparar o agente na hora: ela é pega na próxima execução.

- Valem "depende de", "depende do" e "depende da", sem diferenciar maiúsculas de minúsculas, e várias issues na mesma frase, como "depende de #3 e #4". A issue só entra na fila quando todas as citadas estão fechadas.
- Só o corpo da issue conta; os comentários não.
- São ignoradas a citação dentro de trecho de código (em bloco ou no meio da linha), a de issue de outro repositório, a da própria issue e a de um número que é de pull request aberto.
- Citar "#n" sem dizer "depende de" (como "relacionada a #n") não cria dependência.
- Se todas as issues P esperam dependência, a execução termina com sucesso, dizendo no resumo que não há issue P na fila.

### Pull request fechado sem merge

A issue com pull request ligado, aberto ou fechado, não volta para a fila. Por isso, se o pull request do agente é fechado sem merge, a issue continua fora da fila: fechar sem merge costuma ser uma recusa, e o agente não tenta de novo sozinho.

Para liberar a issue de novo, à mão:

1. Edite a descrição do pull request fechado e apague a linha `Closes #<número>`, para ele deixar de estar ligado à issue. Em pull request já fechado isso pode não desfazer a ligação: nesse caso, na issue, em "Development", desligue o pull request e confira que ele não aparece mais ali.
2. Apague a branch do agente dessa issue, se ela ainda existir no repositório (o nome começa com o tipo e o número da issue, como `fix/<número>-...`), porque branch própria também tira a issue da fila.
3. Confira que a issue está com `Size: P` e sem responsável. Na próxima execução da Issue Claude Agent ela volta a ser tratada; para não esperar, dispare-a à mão com o número da issue.

Se a issue continuar fora da fila mesmo assim, o caminho é abrir uma issue nova.

### Fila única e limites

As duas ficam numa fila única e nunca rodam ao mesmo tempo: a segunda espera a primeira terminar. Quando várias são disparadas juntas, o GitHub mantém uma rodando e uma esperando, e a que espera é cancelada se chega outra mais nova; o que ficou para trás é pego pela próxima varredura, pela rede de segurança das 02:47 ou pelo próximo disparo. Pode haver até 5 pull requests do agente abertos ao mesmo tempo (veja "Limite de pull requests abertos"). Rodar as duas em seguida, ou a mesma duas vezes, não repete o tamanho, o comentário nem o pull request.

### O que as duas tratam e o que nunca fazem

- Só tratam issues abertas por dono, membro ou colaborador do repositório. As demais são ignoradas.
- Só leem o título, o corpo e os comentários de dono, membro ou colaborador. Comentários de qualquer outra pessoa nunca chegam ao Claude, e o texto da issue é tratado como descrição do problema, nunca como ordem.
- Nunca fazem merge, nunca enviam nada direto para a branch principal, nunca definem prioridade e nunca editam à mão o `.claude/`, exceto o guia do Claude dessa pasta (`.claude/CLAUDE.md`), que é o único arquivo dela escrito à mão: o resto é gerado, a mudança é feita nas fontes e o `.claude/` é atualizado pelo sync.
- Cada execução termina com uma conferência que falha de forma visível se algo saiu do permitido. Além dos casos de sempre, ela reprova a execução que termina com mais de 5 pull requests do agente abertos, a que abre mais de um pull request novo, a que deixa uma branch do agente enviada sem pull request e a que termina sem pull request e sem comentário novo do agente na issue.

### Instalação

Feita pelo dono do repositório, uma vez, e vale para as duas:

1. Gere a credencial da assinatura Pro/Max com `claude setup-token` e guarde como segredo do repositório, com o nome `CLAUDE_CODE_OAUTH_TOKEN`, em Settings, Secrets and variables, Actions, New repository secret, ou com:

```bash
gh secret set CLAUDE_CODE_OAUTH_TOKEN --repo felipe-sant/claude-kit
```

2. Instale o app do Claude no repositório com `/install-github-app` no Claude Code.

3. Ligue, em Settings, Actions, General, Workflow permissions, a opção "Permitir que o GitHub Actions crie e aprove pull requests" (no GitHub em inglês, "Allow GitHub Actions to create and approve pull requests"). Sem ela, a automação não consegue abrir o pull request do agente.

Sem a credencial, a execução falha de forma visível no passo do Claude, e a Issue Size Set não dispara a Issue Claude Agent.

O pull request aberto pela automação não dispara o CI sozinho. Para rodar o CI nele, feche e reabra o pull request ou envie um commit nele.

### Onde ver o que elas fizeram

No comentário da issue, que traz o motivo do tamanho e o link da execução da Issue Size Set, e no registro de cada execução em Actions, que mostra o que foi escolhido e por quê, o que o Claude rodou e o resumo das decisões. As automações ficam em `.github/workflows/issue-size-set.yml` e `.github/workflows/issue-claude-agent.yml`, e os scripts e as instruções em `.github/issue-agent/`.

## Versões e publicação

Só existe a `main`. As versões são automáticas, a partir de uma nota de mudança (changeset) que cada pull request traz.

### Nota de mudança

Todo pull request traz uma nota, criada no mesmo pull request. Rode:

```
npm run changeset
```

e escolha o tipo (major, minor ou patch). Para documentação, textos (como o README), CI e testes, crie a nota vazia:

```
npm run changeset -- --empty
```

A nota é o arquivo `.changeset/<nome-da-branch>.md`, com o tipo no cabeçalho e o texto em português simples, de uma ou duas linhas:

```
---
"@felipe-sant/claude-kit": patch
---

Corrige a mensagem do ai-sync quando a pasta não existe.
```

A nota vazia é a que o `npm run changeset -- --empty` gera: só o cabeçalho, sem tipo e sem texto. O CI reprova o pull request sem nota (a checagem `Changeset`), e o pull request de versão fica fora dessa checagem.

### Regra de versão

- major: remove ou renomeia um agente, uma regra ou uma skill, muda o fluxo do time ou quebra uma opção do `ai-sync`.
- minor: novo agente, regra, skill, stack ou opção.
- patch: ajuste de texto, correção ou mudança que não quebra nada.

### Fluxo

1. O pull request com nota de tipo entra na `main`. A automação abre o pull request de versão, "Chore :see_no_evil: Atualiza versão e CHANGELOG", ou o atualiza se ele já existir. Ele traz a nova versão, o CHANGELOG e a cópia do time deste repositório (o `.claude/`) regenerada com a versão nova. Se só entraram notas vazias, ele não é aberto. Os títulos de seção que a ferramenta escreve sozinha no CHANGELOG ficam em inglês.
2. O merge do pull request de versão cria a tag `vX.Y.Z`, cria o Release com a seção daquela versão do CHANGELOG e publica a versão no npm. Versão que já tem tag não é publicada de novo, e versão abaixo da 1.0.0 não é publicada.
3. A publicação usa o trusted publishing do npm: não há token guardado no repositório, e as versões automáticas saem com prova de origem. Se a publicação falha, a tag não é criada e rodar a automação de novo tenta publicar outra vez.

O pull request de versão é aberto com o token padrão do GitHub, então ele não dispara o CI sozinho. Por isso, antes de cada merge dele e depois da última atualização automática, feche e reabra o pull request e espere o CI passar.

### Passos do dono do repositório

Feitos uma vez, fora do código, nesta ordem:

1. Ter conta no npm e ser dono do escopo `@felipe-sant`, com verificação em dois fatores.
2. Manter ligada, em Settings, Actions, General, a opção "Allow GitHub Actions to create and approve pull requests".
3. Fazer o merge do pull request da publicação no npm. A versão continua 0.1.0 e nada é publicado. A automação abre o pull request de versão com a 1.0.0.
4. Colocar a checagem `Changeset` entre as obrigatórias da regra da `main`. Só depois do passo 3, porque antes disso a checagem não existe na `main`.
5. Publicar a 1.0.0 à mão, a partir da branch do pull request de versão: `git switch changeset-release/main`, `npm ci`, `npm pack --dry-run` para conferir a lista e `npm publish --access public`. O npm só deixa ligar o trusted publishing em um pacote que já existe, e por isso essa versão sai sem prova de origem. Entre esta publicação e o merge do passo 6, nenhum outro pull request pode entrar na `main`.
6. Fechar e reabrir o pull request de versão, esperar o CI passar e fazer o merge. A automação cria a tag `v1.0.0` e o Release e não publica de novo.
7. Na página do pacote no npm, ligar o trusted publishing com o dono `felipe-sant`, o repositório `claude-kit` e o workflow `release.yml`, logo antes do merge do primeiro pull request de versão que deve publicar sozinho. A ligação expira se a primeira publicação por ela não acontecer em 2 dias.
8. Em todo pull request de versão seguinte, logo antes do merge, fechar e reabrir o pull request e esperar o CI passar.

## Menções ao Claude

O Claude também responde quando alguém com permissão de escrita no repositório o menciona com @claude em uma issue ou em um comentário.

## Estrutura do repositório

| Pasta ou arquivo | Conteúdo |
| --- | --- |
| `catalog.json` | Arquivo central. Registra cada agente, regra, skill e modelo de configuração com `path`, `applies` e `description`, e as `stacks` com a regra de detecção. |
| `agents/` | Agentes que valem para qualquer projeto. |
| `rules/` | Padrões que valem para qualquer projeto. |
| `skills/` | Skills que valem para qualquer projeto (uma pasta por skill, com `SKILL.md`). |
| `stacks/<stack>/` | O que vale só para uma stack, com as mesmas subpastas `agents/`, `rules/` e `skills/`. |
| `templates/` | Modelos de configuração do Claude (hoje, `settings.base.json`). |
| `profiles/` | Perfis manuais, escolhidos com `--profile`. |
| `bin/ai-sync.js` | Aplica o conteúdo em um repositório. |
| `.changeset/` | Notas de mudança (uma por pull request) e a configuração da ferramenta de versões. |
| `scripts/` | Scripts das automações de versão e publicação. |
| `LICENSE` | Licença MIT. |
| `lint/` | Regra do oxlint contra comentários e checagem do formato de agentes, regras, skills e perfis. |
| `tests/` | Testes do `ai-sync` e do formato do conteúdo. |
| `.github/workflows/ci.yml` | Roda lint e testes em todo PR. |
| `.github/workflows/changeset-check.yml`, `.github/workflows/version.yml` e `.github/workflows/release.yml` | Conferem a nota de mudança no PR, abrem o pull request de versão e publicam a versão no npm (veja "Versões e publicação"). |
| `.github/workflows/issue-size-set.yml`, `.github/workflows/issue-claude-agent.yml` e `.github/issue-agent/` | Agente de issues: a Issue Size Set classifica as issues por tamanho e a Issue Claude Agent abre pull request das pequenas. |

O campo `applies` de cada item do catálogo diz a que projetos ele serve: `["all"]` para qualquer projeto ou uma lista de stacks, como `["react"]`.

## Adicionar um item

1. Crie o arquivo: `agents/nome.md` (com o cabeçalho `name`, `description`, `model`), `rules/nome.md` ou `skills/nome/SKILL.md`. Se for só de uma stack, use `stacks/<stack>/...`.
2. Registre em `catalog.json`, no grupo certo, com `path`, `applies` e `description`. É o único lugar de registro.
3. Rode o `ai-sync`: com `applies: ["all"]` ou uma stack detectada, o item é aplicado sozinho. Para um perfil manual receber o item, inclua o nome em `profiles/*.json`.
4. Se o item é um agente que a `orchestrator` pode chamar, inclua o nome na lista de agentes do time em `skills/team-setup/SKILL.md`.

Um modelo de configuração fica em `templates/settings.nome.json` e é registrado no grupo `settings` do catálogo; o lint reprova modelo que conceda permissões amplas.

Para uma stack nova, adicione-a em `stacks` no `catalog.json` com `detect.dependencies` (nomes de pacotes do `package.json` ou `composer.json`).

## Desenvolvimento

Instale as dependências uma vez com `npm ci`.

- `npm test`: testes do `ai-sync` (detecção de stack, arquivos do usuário preservados, atualização e remoção seguras, `--force`, configuração base), do catálogo e dos perfis e do conteúdo dos padrões e skills. Trabalham só em pastas temporárias.
- `npm run lint`: oxlint no código Node, com a regra de nunca escrever comentários, e checagem do formato de agentes (cabeçalho com `name`, `description` e `model`), regras, skills, perfis e JSON.
- `node bin/ai-sync.js --check`: consistência do catálogo e dos perfis.
- `npm run sync`: aplica o próprio `claude-kit` neste repositório com o perfil `tooling`, atualizando o `.claude/`. O hook de pre-commit (`.githooks/pre-commit`, ligado pelo `npm ci`) roda isso a cada commit. No commit sem caminhos, inclui o `.claude/` no commit; no commit por caminhos, não adiciona nada e recusa o commit se os arquivos gerados não estiverem atualizados e coerentes com as fontes que vão nele, orientando a rodar `npm run sync` e a incluí-los nos caminhos. Se outro agente tem fontes alteradas e não commitadas na mesma pasta, o commit é recusado até ele commitar ou até você usar uma worktree isolada. Se o último commit já estiver fora de sincronia, o hook recusa também o commit que não toca fonte, com uma mensagem própria que diz como corrigir. Um teste também reprova a cópia desatualizada.

- `npm pack --dry-run`: lista o que o pacote leva para o npm.
- `npm run changeset`: cria a nota de mudança do pull request (veja "Versões e publicação").

O GitHub roda lint e testes em todo PR, com os mesmos comandos, e confere a nota de mudança.
