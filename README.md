# claude-core

Ferramenta que roda em outros repositórios para configurar o Claude Code e o sistema de desenvolvimento da melhor forma, com um comando. Ela leva para cada projeto o time de agentes, os padrões de desenvolvimento e as skills que servem a ele, escolhendo sozinha o que é de cada stack.

## Em resumo

| O que | Quantos | Onde fica no projeto |
| --- | --- | --- |
| Agentes (o time) | 14 | `.claude/agents/` |
| Regras (padrões de desenvolvimento) | 5 gerais e 4 por stack | `.claude/rules/` |
| Skills | 5 gerais e 2 por stack | `.claude/skills/` |
| Configuração base do Claude | 1 modelo | `.claude/settings.json` |

Stacks com conteúdo hoje: React, NestJS, Laravel e AdonisJS.

## Usar em um repositório

Requer Node 22 ou mais novo.

```
node ~/claude-core/bin/ai-sync.js /caminho/do/repo
```

Ou, dentro do repositório, sem argumento de pasta:

```
node ~/claude-core/bin/ai-sync.js
```

Depois, abra o orquestrador:

```
claude --agent orchestrator
```

Opções:

| Opção | O que faz |
| --- | --- |
| `--profile nome` (ou `-p`) | Escolhe um perfil à mão. Prevalece sobre a detecção e aplica exatamente o que o perfil lista. |
| `--force` | Reinstala também os arquivos em conflito (veja "Sincronização segura"). |
| `--check` | Confere se o catálogo, os arquivos e os perfis do `claude-core` estão consistentes. Não aplica nada. |

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
- Só são detectadas stacks que têm conteúdo no `claude-core`. As regras de detecção ficam em `stacks`, no `catalog.json`.
- Se nada for reconhecido, aplica só o que vale para qualquer projeto e avisa.
- Os padrões e as skills de uma stack não chegam a projetos de outra.

### Perfis

Ficam em `profiles/*.json` e só valem com `--profile`. Cada perfil lista `agents`, `rules`, `skills` e `settings` pelos nomes do catálogo. Os perfis trazem só o que vale para qualquer projeto: o conteúdo de stack vem apenas pela detecção.

- `default`: o time completo.
- `frontend`: `dev-frontend`, `dev-fullstack` e `dev-doc`, com `designer`.
- `backend`: `dev-backend`, `dev-fullstack`, `dev-database`, `dev-devops` e `dev-doc`, sem `designer`.

Todos incluem `orchestrator`, `product-owner`, `sdd`, `executor`, `reviewer` e `qa`, as cinco regras gerais, as cinco skills gerais e a configuração base. Para uma configuração manual nova, crie `profiles/nome.json`.

## Sincronização segura

O `ai-sync` registra o que instalou em `.claude/claude-core.lock.json` (caminho, versão e impressão digital de cada arquivo) e usa esse registro para nunca mexer no que é seu. Versione esse arquivo junto com o repositório.

- Arquivo criado por você, ou que já existia com o mesmo nome de um do `claude-core`, não é apagado nem sobrescrito. Se o conteúdo for diferente, a ferramenta avisa.
- Arquivo instalado e sem alterações é atualizado quando há versão nova, e removido quando sai do `claude-core`.
- Arquivo instalado que você editou não é tocado. A ferramenta avisa e diz se há versão nova disponível.
- Em repositório já configurado antes, os arquivos idênticos aos do `claude-core` passam a ser acompanhados; os diferentes ficam como estão, com aviso.
- Rodar de novo com tudo em dia não muda nada.
- Quando agentes são instalados, atualizados ou removidos, a ferramenta avisa para abrir uma sessão nova do Claude: sessões já abertas continuam com os agentes antigos. Se um dev não conseguir chamar o `executor` ou o `sdd`, ele avisa a `orchestrator`, que orienta você a rodar o `ai-sync` e abrir uma sessão nova.

Para receber a versão nova dos arquivos em conflito (os que você editou e os que já existiam sem registro), rode com `--force`. Ele sobrescreve só os arquivos que o `claude-core` entrega e que estão em conflito, e lista cada um em "Sobrescritos". Arquivos que o `claude-core` não entrega nunca são tocados, e as edições sobrescritas não voltam: faça commit antes se quiser guardá-las.

## Configuração base do Claude

O modelo fica em `templates/settings.base.json` e vai para `.claude/settings.json` do projeto, o arquivo compartilhado e versionado. Os valores recomendados são:

| Chave | Valor | Para quê |
| --- | --- | --- |
| `effortLevel` | `medium` | Esforço econômico por padrão. |
| `env.CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY` | `1` | Sem a pesquisa de satisfação no meio do trabalho. |
| `permissions.deny` | leitura de `.env` e `.env.*` | Protege segredos. O `.env.example` continua liberado. |

Como é aplicada:

- Projeto sem `.claude/settings.json`: o arquivo é criado com o modelo.
- Projeto com o arquivo: só o que falta é acrescentado. O que você já definiu nunca é alterado, e o que difere do recomendado aparece em "Sugerido e não aplicado", com o seu valor e o recomendado. Listas existentes (como `permissions.deny`) ficam como estão.
- O que você apagar depois de a ferramenta acrescentar não volta, e um `settings.json` apagado não é recriado. O registro do que foi acrescentado fica no `claude-core.lock.json`.
- Arquivo com JSON inválido não é tocado, e a ferramenta avisa.
- O modelo não concede permissões amplas (nada de `allow`, `defaultMode` ou diretórios extras; o lint reprova). A única permissão nova é a da pasta de worktrees, e ela vai para `.claude/settings.local.json`, o arquivo local, que fica fora do git.
- O modelo não define `model` nem hooks. Cada agente já escolhe o seu modelo, e fixar um no projeto passaria por cima da escolha de quem trabalha nele.

## Time de agentes

| Agente | Modelo | Papel |
| --- | --- | --- |
| `orchestrator` | opus | Orquestrador. Única sessão que fala com o usuário. Só delega. |
| `product-owner` | sonnet | Fonte das regras de negócio. Consulta e cria tarefas, nunca define prioridade, e edita ou apaga só a pedido explícito do usuário. |
| `sdd` | opus | Escreve a especificação da tarefa. Só é chamado por um dev. |
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
- Regras e critérios de aceite têm IDs (`RN-01`, `CA-01`) no formato "QUANDO ... ENTÃO o sistema DEVE ...".
- Cada tarefa traz de quem é, do que depende, o gate e se é paralela (`[P]`) ou mecânica (modelo econômico).
- Nada é codificado antes da sua aprovação, a menos que você dispense a especificação. As tarefas `[P]` rodam ao mesmo tempo.

### Gate de verificação

O gate tem dois níveis, para não rodar build e suíte inteira a cada commit:

- **Gate da tarefa**, em todo commit: typecheck do projeto (quando existe), o teste da tarefa e o lint dos arquivos alterados. Nunca se commita sem o typecheck.
- **Gate de fase**, uma vez ao fim de cada fase do plano e antes do `reviewer`: build, suíte completa e lint completo.

O `sdd` descobre os comandos no projeto (`package.json`, `Makefile` ou CI) e os escreve na especificação. Se o typecheck do projeto leva minutos, ele marca `Typecheck lento` com o tempo medido e o typecheck passa para o gate de fase, aceitando que commits intermediários possam não compilar. Os devs registram o resultado, incluindo o typecheck, no Status de cada tarefa, e o `reviewer` confere essa evidência e roda o gate de fase uma vez no último commit.

### Como o time é montado

- O time é montado por tarefa, com quantos agentes do mesmo papel o escopo pedir, e o trabalho é dividido para rodar em paralelo.
- A `orchestrator` pede as regras ao `product-owner`, propõe a composição e confirma com você antes de delegar. O `reviewer` entra sempre que houver dev. `qa` e `designer` são opcionais: ela avisa que existem e você decide.
- Cada tarefa roda em uma worktree própria, confirmada com você, para várias sessões trabalharem juntas no mesmo repositório.
- No início da sessão ela pergunta um tema opcional para os nomes (por exemplo, personagens de Jujutsu Kaisen), o nome dela e o do `product-owner`. Com tema, cada pergunta de nome traz sugestões, e você pode dizer "escolha por mim". O nome de cada dev, do `reviewer`, do `qa` e do `designer` é perguntado só quando eles entram no time, uma pergunta por agente.
- Os agentes compartilham uma memória do time por repositório, em `.claude/team-memory/`, que guarda só o que continua valendo depois da tarefa, e só é gravada a pedido seu.

## Regras

Ficam em `rules/*.md` (gerais) e `stacks/<stack>/rules/*.md` (por stack). O Claude Code as carrega sozinho a partir de `.claude/rules/`, sem nenhuma ação sua. Cada uma é curta e diz no início quando vale.

Gerais:

- `commit-standard`: tipos de alteração com ícone e padrão de branches e commits (`Fix :bug: [#5] Troca <a href> por <Link>`).
- `code-standard`: estilo de código, incluindo nunca escrever comentários.
- `testing-standard`: testes primeiro (TDD), teste para cada bug e nunca alterar teste só para passar.
- `security-standard`: segredos, validação de entrada, acesso, senhas e dependências.
- `review-standard`: como preparar e como fazer uma revisão de código.

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
| `lint/` | Regra do oxlint contra comentários e checagem do formato de agentes, regras, skills e perfis. |
| `tests/` | Testes do `ai-sync` e do formato do conteúdo. |
| `.github/workflows/ci.yml` | Roda lint e testes em todo PR. |

O campo `applies` de cada item do catálogo diz a que projetos ele serve: `["all"]` para qualquer projeto ou uma lista de stacks, como `["react"]`.

## Adicionar um item

1. Crie o arquivo: `agents/nome.md` (com o cabeçalho `name`, `description`, `model`), `rules/nome.md` ou `skills/nome/SKILL.md`. Se for só de uma stack, use `stacks/<stack>/...`.
2. Registre em `catalog.json`, no grupo certo, com `path`, `applies` e `description`. É o único lugar de registro.
3. Rode o `ai-sync`: com `applies: ["all"]` ou uma stack detectada, o item é aplicado sozinho. Para um perfil manual receber o item, inclua o nome em `profiles/*.json`.
4. Se o item é um agente que a `orchestrator` pode chamar, inclua o nome na lista `Agent(...)` dela.

Um modelo de configuração fica em `templates/settings.nome.json` e é registrado no grupo `settings` do catálogo; o lint reprova modelo que conceda permissões amplas.

Para uma stack nova, adicione-a em `stacks` no `catalog.json` com `detect.dependencies` (nomes de pacotes do `package.json` ou `composer.json`).

## Desenvolvimento

Instale as dependências uma vez com `npm ci`.

- `npm test`: testes do `ai-sync` (detecção de stack, arquivos do usuário preservados, atualização e remoção seguras, `--force`, configuração base), do catálogo e dos perfis e do conteúdo dos padrões e skills. Trabalham só em pastas temporárias.
- `npm run lint`: oxlint no código Node, com a regra de nunca escrever comentários, e checagem do formato de agentes (cabeçalho com `name`, `description` e `model`), regras, skills, perfis e JSON.
- `node bin/ai-sync.js --check`: consistência do catálogo e dos perfis.

O GitHub roda lint e testes em todo PR, com os mesmos comandos.
