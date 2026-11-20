# ai-core

Time de agentes reutilizável para o Claude Code. Os papéis ficam aqui e são copiados para qualquer repositório com um comando.

## Time

| Agente | Papel |
| --- | --- |
| `orchestrator` | Orquestrador. Única sessão que fala com o usuário. Só delega. |
| `product-owner` | Product Owner. Fonte das regras. Consulta e cria tarefas. Edita ou apaga só a pedido explícito do usuário. |
| `dev-frontend` | Implementa telas. |
| `dev-backend` | Implementa API e dados. |
| `reviewer` | Revisa a entrega dos devs. Obrigatório sempre que houver dev na tarefa. |
| `qa` | Valida a entrega. |
| `designer` | Visual e experiência de uso. |

Fluxo: o product-owner define as regras, os devs implementam, o reviewer revisa, o designer entra em mudanças visuais e o QA valida.

O time é montado por tarefa e cada tarefa roda em uma worktree própria (confirmada com você), para várias sessões trabalharem juntas no mesmo repositório. A `orchestrator` pede as regras ao `product-owner`, propõe quantos `dev-frontend` e `dev-backend` a tarefa pede e confirma com você antes de delegar. O `reviewer` entra sempre que houver dev. `qa` e `designer` são opcionais: ela avisa que estão disponíveis e você decide se entram. No início da sessão ela pergunta só o nome dela e o do `product-owner`; o nome de cada dev, do `reviewer`, do `qa` e do `designer` é perguntado só quando eles entram no time de uma tarefa.

## Usar em um repositório

```
node ~/ai-core/bin/ai-sync.js /caminho/do/repo --profile default
```

Ou, dentro do repositório, sem argumento de pasta:

```
node ~/ai-core/bin/ai-sync.js --profile frontend
```

Isso copia os agentes do perfil para `.claude/agents/` e as regras para `.claude/rules/` do repositório. Depois, abra o orquestrador:

```
claude --agent orchestrator
```

Rodar de novo atualiza os arquivos copiados e remove os que saíram do perfil. Agentes e regras que você criou à mão no repositório não são tocados.

## Perfis

Ficam em `profiles/*.json`. Cada perfil lista os `agents` e as `rules` que o repositório recebe.

- `default`: time completo.
- `frontend`: sem `dev-backend`.
- `backend`: sem `dev-frontend` e sem `designer`.

Todos incluem o `reviewer`.

Para uma configuração nova, crie `profiles/nome.json` com as duas listas.

## Regras

Ficam em `rules/*.md` e o Claude Code as carrega sozinho a partir de `.claude/rules/`.

- `commit-standard`: tipos de alteração com ícone e padrão de branches e commits (`Fix :bug: [#5] Troca <a href> por <Link>`).

## Adicionar um papel

Crie `agents/nome.md` com o cabeçalho (`name`, `description`, `model`) e as instruções. Depois inclua o nome nos perfis que devem usá-lo e rode o `ai-sync`.
