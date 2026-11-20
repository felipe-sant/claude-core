# CLAUDE.md

Orientações para o Claude Code ao trabalhar neste repositório.

## Contexto

O `ai-core` é a fonte única do time de agentes do Felipe para o Claude Code. Os papéis (agentes) e as regras ficam aqui e o `ai-sync` os copia para qualquer outro repositório, de acordo com um perfil. Este repositório não tem aplicação nem build: é conteúdo (markdown e JSON) mais um script Node sem dependências.

Todo o texto dos agentes, das regras e da documentação é em **português**. Nomes de arquivos, de agentes e de perfis são em **inglês** e em minúsculas, com hífen (`product-owner`, `dev-frontend`).

## Estrutura

| Pasta | Conteúdo |
| --- | --- |
| `agents/` | Um arquivo `.md` por papel, com cabeçalho (`name`, `description`, `model`, `tools`) e as instruções. |
| `rules/` | Regras compartilhadas, copiadas para `.claude/rules/` dos repositórios. |
| `profiles/` | Um `.json` por configuração, com as listas `agents` e `rules` que o repositório recebe. |
| `bin/ai-sync.js` | Copia os agentes e as regras de um perfil para um repositório. |

## O time

- `orchestrator`: única sessão que fala com o usuário e só delega. Só pode chamar agentes e perguntar ao usuário.
- `product-owner`: fonte das regras de negócio. Consulta e cria tarefas, nunca define prioridade, e só edita ou apaga tarefa quando o usuário pediu isso de forma explícita.
- `dev-frontend`, `dev-backend`, `reviewer`, `qa` e `designer`.

O time é montado por tarefa, com mais de um dev do mesmo tipo quando o escopo pedir. O `reviewer` é obrigatório sempre que houver dev. `qa` e `designer` são opcionais: a `orchestrator` informa que existem e o usuário decide.

Fluxo: o `product-owner` define as regras, os devs implementam, o `reviewer` revisa, o `designer` entra em mudanças visuais e o `qa` valida.

## Regras ao editar

- **Nunca escreva comentários no código** (nem de linha, nem de bloco, nem JSDoc), em nenhum arquivo. Deixe os comentários que já existem como estão.
- O nome do arquivo em `agents/` é igual ao campo `name` do cabeçalho.
- Todo agente citado em `profiles/*.json` precisa existir em `agents/`, e toda regra citada precisa existir em `rules/`.
- Agente que escreve código leva no prompt a regra de não escrever comentários.
- Tarefas escritas por agentes usam linguagem simples, que um PO e um QA entendam, sem caminhos de arquivo, código ou detalhes internos.
- Ao criar ou renomear um papel, atualize `profiles/`, o `README.md` e a lista acima.

## Verificar uma mudança

Rode o `ai-sync` em uma pasta temporária e confira o resultado:

```bash
T=$(mktemp -d) && node bin/ai-sync.js "$T" --profile default && ls -R "$T/.claude"; rm -rf "$T"
```

## Branches e commits

@../rules/commit-standard.md
