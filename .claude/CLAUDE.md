# CLAUDE.md

Orientações para o Claude Code ao trabalhar neste repositório.

## Contexto

O `claude-core` é a fonte única do time de agentes do Felipe para o Claude Code. Os papéis (agentes) e as regras ficam aqui e o `ai-sync` os copia para qualquer outro repositório, de acordo com um perfil. Este repositório não tem aplicação nem build: é conteúdo (markdown e JSON) mais um script Node sem dependências.

Todo o texto dos agentes, das regras e da documentação é em **português**. Nomes de arquivos, de agentes e de perfis são em **inglês** e em minúsculas, com hífen (`product-owner`, `dev-frontend`).

## Estrutura

| Pasta | Conteúdo |
| --- | --- |
| `catalog.json` | Arquivo central. Registra cada agente, regra e skill com `path`, `applies` (`["all"]` ou stacks) e `description`, e as `stacks` com a regra de detecção. É o único lugar de registro de um item. |
| `agents/` | Um arquivo `.md` por papel, com cabeçalho (`name`, `description`, `model`, `tools`) e as instruções. |
| `rules/` | Regras compartilhadas, copiadas para `.claude/rules/` dos repositórios. |
| `skills/` | Skills que valem para qualquer projeto, uma pasta por skill, copiadas para `.claude/skills/`. |
| `stacks/<stack>/` | O que vale só para uma stack (`react`, `nestjs`, `laravel`...), com `agents/`, `rules/` e `skills/`. |
| `profiles/` | Um `.json` por configuração, com as listas `agents`, `rules` e `skills` (nomes do catálogo) que o repositório recebe. |
| `bin/ai-sync.js` | Copia o conteúdo para um repositório. Sem `--profile`, detecta as stacks e aplica o que vale para todos mais o das stacks; com `--profile`, aplica só o perfil. Registra o que instalou em `.claude/claude-core.lock.json` e só atualiza ou remove arquivo instalado e sem alterações; `--force` sobrescreve os arquivos em conflito que o catálogo entrega. |

## O time

- `orchestrator`: única sessão que fala com o usuário e só delega. Só pode chamar agentes e perguntar ao usuário.
- `product-owner`: fonte das regras de negócio. Consulta e cria tarefas, nunca define prioridade, e só edita ou apaga tarefa quando o usuário pediu isso de forma explícita.
- `sdd`: escreve a especificação da tarefa, só a pedido de um dev, e não grava na memória.
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
- Ao criar ou renomear um papel, atualize o `catalog.json`, `profiles/`, o `README.md` e a lista acima.

## Verificar uma mudança

Rode a checagem e o `ai-sync` em uma pasta temporária e confira o resultado:

```bash
node bin/ai-sync.js --check
T=$(mktemp -d) && node bin/ai-sync.js "$T" && ls -R "$T/.claude"; rm -rf "$T"
```

## Branches e commits

@../rules/commit-standard.md
