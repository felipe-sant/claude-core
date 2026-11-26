# CLAUDE.md

Orientações para o Claude Code ao trabalhar neste repositório.

## Contexto

O `claude-kit` é a fonte única do time de agentes do Felipe para o Claude Code. Os papéis (agentes) e as regras ficam aqui e o `ai-sync` os copia para qualquer outro repositório, de acordo com um perfil. Este repositório não tem aplicação nem build: é conteúdo (markdown e JSON) mais um script Node sem dependências.

Todo o texto dos agentes, das regras e da documentação é em **português**. Nomes de arquivos, de agentes e de perfis são em **inglês** e em minúsculas, com hífen (`product-owner`, `dev-frontend`).

## Estrutura

| Pasta | Conteúdo |
| --- | --- |
| `catalog.json` | Arquivo central. Registra cada agente, regra, skill e modelo de configuração (`settings`) com `path`, `applies` (`["all"]` ou stacks) e `description`, e as `stacks` com a regra de detecção. É o único lugar de registro de um item. |
| `agents/` | Um arquivo `.md` por papel, com cabeçalho (`name`, `description`, `model`, `tools`) e as instruções. |
| `rules/` | Regras compartilhadas, copiadas para `.claude/rules/` dos repositórios. |
| `skills/` | Skills que valem para qualquer projeto, uma pasta por skill, copiadas para `.claude/skills/`. |
| `stacks/<stack>/` | O que vale só para uma stack (`react`, `nestjs`, `laravel`...), com `agents/`, `rules/` e `skills/`. |
| `templates/` | Modelos da configuração base do Claude, mesclados em `.claude/settings.json` do projeto sem alterar o que o usuário definiu. |
| `profiles/` | Um `.json` por configuração, com as listas `agents`, `rules`, `skills` e `settings` (nomes do catálogo) que o repositório recebe. |
| `lint/` | Regra do oxlint contra comentários e a checagem do formato de agentes, regras, skills e perfis. |
| `tests/` | Testes do `ai-sync` e do formato do conteúdo, com `node --test`. |
| `.github/workflows/ci.yml` | Roda `npm run lint` e `npm test` em todo PR. |
| `.github/workflows/issue-size-set.yml`, `.github/workflows/issue-claude-agent.yml` e `.github/issue-agent/` | Automações do agente de issues: a Issue Size Set classifica as issues por tamanho (P, M, G) e a Issue Claude Agent resolve só as P e abre o PR por um passo próprio, depois do agente, e o agente comenta na issue quando algo dá errado. Documentadas no `README.md`. |
| `.changeset/` | Notas de mudança (uma por pull request) e a configuração da ferramenta de versões. |
| `scripts/` | Scripts das automações de versão e publicação, em JS puro e sem dependências. |
| `.github/workflows/changeset-check.yml`, `.github/workflows/version.yml` e `.github/workflows/release.yml` | Reprova o PR sem nota de mudança, abre o pull request de versão e, no merge dele, cria a tag e o Release e publica no npm. |
| `bin/ai-sync.js` | Copia o conteúdo para um repositório. Sem `--profile`, detecta as stacks e aplica o que vale para todos mais o das stacks; com `--profile`, aplica só o perfil. Registra o que instalou em `.claude/claude-kit.lock.json` e só atualiza ou remove arquivo instalado e sem alterações; `--force` sobrescreve os arquivos em conflito que o catálogo entrega. |

## O time

- `orchestrator`: não é agente, é a sessão principal depois de `/team-setup` (skill `skills/team-setup`). Única que fala com o usuário e só delega; delegar é regra da skill. Funciona com subagentes (padrão) e com time de agentes, que o usuário liga com `ai-sync --teams` e nunca é ligado sozinho.
- `product-owner`: fonte das regras de negócio. Consulta e cria tarefas, nunca define prioridade, e só edita ou apaga tarefa quando o usuário pediu isso de forma explícita.
- `sdd`: escreve a especificação da tarefa, só a pedido de um dev, e não grava na memória. É o único que escreve no arquivo da especificação (inclusive o `Status`) e commita só ele; devs e executores relatam o andamento à orchestrator.
- `executor`: ajudante dos devs, executa uma tarefa da especificação (teste primeiro, gate, commit). Só um dev o chama e ele leva no prompt a regra de não escrever comentários.
- Devs: `dev-frontend`, `dev-backend`, `dev-mobile`, `dev-devops`, `dev-database`, `dev-fullstack` e `dev-doc` (este nunca define regra de negócio).
- `reviewer`, `qa` e `designer`.

O time é montado por tarefa, com mais de um agente do mesmo papel quando o escopo pedir, e o trabalho é dividido para rodar em paralelo. O nome de cada agente é perguntado em uma pergunta individual, e um tema opcional (como Jujutsu Kaisen) faz a orchestrator sugerir os nomes. O `reviewer` é obrigatório sempre que houver dev. `qa` e `designer` são opcionais: a `orchestrator` informa que existem e o usuário decide.

Fluxo: o `product-owner` define as regras, um dev chama o `sdd` para a especificação, o usuário aprova, os devs implementam (delegando as tarefas mecânicas e paralelas ao `executor`) com TDD em lógica e comportamento, o `reviewer` revisa (conferindo especificação e testes), o `designer` entra em mudanças visuais e o `qa` valida. A especificação fica inteira em `.specs/<branch>.md` na worktree, commitada, com tipo, tamanho, status, IDs de regra e critério e tarefas com `[P]`, dependências e gate. Cada dev faz um commit atômico por tarefa. O usuário pode dispensá-la em tarefa pequena.

## Regras ao editar

- **Nunca escreva comentários no código** (nem de linha, nem de bloco, nem JSDoc), em nenhum arquivo. Deixe os comentários que já existem como estão.
- O nome do arquivo em `agents/` é igual ao campo `name` do cabeçalho.
- Todo item citado em `profiles/*.json` precisa estar registrado no `catalog.json`, e todo `path` do catálogo precisa existir. O `node bin/ai-sync.js --check` confere isso.
- Item novo (agente, regra ou skill) é um arquivo mais uma entrada no `catalog.json`. Item com `applies` `["all"]` ou de stack detectada é aplicado sozinho; só perfis manuais precisam do nome na lista.
- Toda stack citada em `applies` precisa existir em `stacks` do catálogo.
- O `ai-sync` nunca apaga nem sobrescreve arquivo do usuário: qualquer mudança nele precisa manter essa garantia e ser conferida com arquivo criado, editado e retirado do catálogo.
- Agente que escreve código leva no prompt a regra de não escrever comentários.
- Tarefas escritas por agentes usam linguagem simples, que um PO e um QA entendam, sem caminhos de arquivo, código ou detalhes internos.
- O `.claude/` deste repositório (menos este `CLAUDE.md`) é gerado: é o próprio `ai-sync` aplicado aqui com o perfil `tooling`. Nunca o edite à mão; edite a fonte (`agents/`, `rules/`, `skills/`, `templates/`, `catalog.json`, `profiles/`). Todo commit regenera o `.claude/` pelo hook `.githooks/pre-commit`, que o `npm ci` liga: o commit sem caminhos já o inclui, e o commit por caminhos é recusado se os gerados não estiverem nos caminhos, atualizados e coerentes com as fontes do commit (rode `npm run sync`, inclua-os nos caminhos e commite de novo; com fonte de outro agente alterada na pasta, espere ele commitar ou use uma worktree isolada; se o último commit já estiver fora de sincronia, até o commit que não toca fonte é recusado, com a mensagem de como corrigir). Se o hook não rodar (commit com `--no-verify` ou sem `npm ci`), rode `npm run sync` e commite o `.claude/` junto; o teste de sincronização no CI reprova a cópia desatualizada.
- **Todo PR traz uma nota de mudança (changeset), criada no mesmo PR: patch, minor ou major pela regra de versão, ou vazia para documentação, textos (como o README), CI e testes.**
- A nota é o arquivo `.changeset/<nome-da-branch-com-hífen>.md`, criado por `npm run changeset` (ou `npm run changeset -- --empty` para a vazia). Com tipo, o cabeçalho tem só a linha `"@felipe-sant/claude-kit": patch`, `minor` ou `major`, seguida de um corpo em português simples de uma ou duas linhas. Regra de versão: major remove ou renomeia agente, regra ou skill, muda o fluxo do time ou quebra uma opção do `ai-sync`; minor traz novo agente, regra, skill, stack ou opção; patch é ajuste de texto, correção ou mudança que não quebra nada. Mudança major nunca é P para o agente de issues.
- O pull request de versão é da automação: ela atualiza a versão, o CHANGELOG e regenera o `.claude/` (`npm run changeset:version`). Não o crie nem o edite à mão; o dono fecha e reabre o PR antes do merge para o CI rodar. A publicação no npm sai do merge dele.
- Ao criar ou renomear um papel, atualize o `catalog.json`, `profiles/`, a lista de agentes da skill `team-setup`, o `README.md` e a lista acima.

## Verificar uma mudança

Rode `npm run lint` e `npm test` (o CI roda os mesmos comandos). Toda mudança de comportamento do `ai-sync` ou de formato do conteúdo precisa de teste. Use `npm pack --dry-run` para conferir o que o pacote leva. Depois rode a checagem e o `ai-sync` em uma pasta temporária e confira o resultado:

```bash
node bin/ai-sync.js --check
T=$(mktemp -d) && node bin/ai-sync.js "$T" && ls -R "$T/.claude"; rm -rf "$T"
```

## Branches e commits

@../rules/commit-standard.md
