# claude-core

Ferramenta que roda em outros repositórios para configurar o Claude Code e o sistema de desenvolvimento da melhor forma: padrões de desenvolvimento, skills úteis e agentes de utilidade, tudo aplicado com um comando.

## Estado atual

Hoje o repositório já entrega:

- o time de agentes (orquestrador, product owner, devs, revisor, QA e designer);
- o padrão de branches e commits, como regra do Claude;
- perfis que escolhem o que cada repositório recebe;
- o `ai-sync`, que copia isso para um repositório e libera a pasta de worktrees das tarefas.

## Planejado

O que falta para a nova função está nas issues:

- [#2](https://github.com/felipe-sant/claude-core/issues/2) reorganizar o repositório para configurar outros projetos;
- [#3](https://github.com/felipe-sant/claude-core/issues/3) detectar a stack do projeto automaticamente;
- [#4](https://github.com/felipe-sant/claude-core/issues/4) sincronizar sem apagar ou sobrescrever arquivos do usuário;
- [#5](https://github.com/felipe-sant/claude-core/issues/5) padrões de desenvolvimento gerais e por stack;
- [#6](https://github.com/felipe-sant/claude-core/issues/6) skills úteis;
- [#7](https://github.com/felipe-sant/claude-core/issues/7) agentes de utilidade além do time;
- [#8](https://github.com/felipe-sant/claude-core/issues/8) configuração base do Claude para cada projeto;
- [#1](https://github.com/felipe-sant/claude-core/issues/1) fluxo de especificação e testes (SDD e TDD) para os devs.

## Time de agentes

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
node ~/claude-core/bin/ai-sync.js /caminho/do/repo --profile default
```

Ou, dentro do repositório, sem argumento de pasta:

```
node ~/claude-core/bin/ai-sync.js --profile frontend
```

Isso copia os agentes do perfil para `.claude/agents/` e as regras para `.claude/rules/` do repositório. Depois, abra o orquestrador:

```
claude --agent orchestrator
```

Rodar de novo atualiza os arquivos copiados e remove os que saíram do perfil. Atenção: hoje a remoção é feita pelo nome do arquivo, então um agente ou regra seu com o mesmo nome de um do `claude-core` pode ser apagado ou sobrescrito. Agentes e regras com outros nomes não são tocados. A proteção completa está na issue [#4](https://github.com/felipe-sant/claude-core/issues/4).

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
