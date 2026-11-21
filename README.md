# claude-core

Ferramenta que roda em outros repositórios para configurar o Claude Code e o sistema de desenvolvimento da melhor forma: padrões de desenvolvimento, skills úteis e agentes de utilidade, tudo aplicado com um comando.

## Estado atual

Hoje o repositório já entrega:

- o time de agentes (orquestrador, product owner, devs, revisor, QA e designer);
- o padrão de branches e commits, como regra do Claude;
- perfis que escolhem o que cada repositório recebe;
- o `catalog.json`, que descreve tudo o que existe e a que projetos cada item se aplica;
- o `ai-sync`, que copia isso para um repositório e libera a pasta de worktrees das tarefas.

## Estrutura

| Pasta ou arquivo | Conteúdo |
| --- | --- |
| `catalog.json` | Arquivo central. Registra cada agente, regra e skill com caminho, a que projetos se aplica e descrição. |
| `agents/` | Agentes que valem para qualquer projeto. |
| `rules/` | Padrões que valem para qualquer projeto. |
| `skills/` | Skills que valem para qualquer projeto (uma pasta por skill, com `SKILL.md`). |
| `stacks/<stack>/` | O que vale só para uma stack (`react`, `nestjs`, `laravel`...), com as mesmas subpastas `agents/`, `rules/` e `skills/`. |
| `profiles/` | Escolhem o que cada repositório recebe. |
| `bin/ai-sync.js` | Aplica um perfil em um repositório. |

O campo `applies` de cada item do catálogo diz a que projetos ele serve: `["all"]` para qualquer projeto ou uma lista de stacks, como `["react"]`. Itens de stack ficam em `stacks/<stack>/` e o `path` do catálogo aponta para lá. A configuração base do Claude por projeto está na issue [#8](https://github.com/felipe-sant/claude-core/issues/8) e a detecção automática de stack, na [#3](https://github.com/felipe-sant/claude-core/issues/3).

## Planejado

O que falta para a nova função está nas issues:

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
| `sdd` | Escreve a especificação da tarefa (SDD). Só é chamado por um dev. |
| `executor` | Ajudante dos devs. Executa uma tarefa bem definida da especificação, com teste primeiro, gate e commit. Só é chamado por um dev. |
| `dev-frontend` | Implementa telas. |
| `dev-backend` | Implementa API e dados. |
| `dev-mobile` | Implementa aplicativos de celular. |
| `dev-devops` | Infraestrutura, pipelines de entrega e ambientes. |
| `dev-database` | Modelagem, migrações e consultas. |
| `dev-fullstack` | Tarefa pequena que atravessa tela e API, com uma pessoa só. |
| `dev-doc` | Atualiza a documentação. Nunca define regra de negócio. |
| `reviewer` | Revisa a entrega dos devs. Obrigatório sempre que houver dev na tarefa. |
| `qa` | Valida a entrega. |
| `designer` | Visual e experiência de uso. |

Fluxo: o product-owner define as regras, um dev pede a especificação ao sdd, você aprova a especificação, os devs implementam com testes primeiro (TDD), o reviewer revisa, o designer entra em mudanças visuais e o QA valida.

A especificação fica em um único arquivo, `.specs/<nome-da-branch>.md`, na worktree da tarefa, e vai commitada com a branch. Tem tipo (funcionalidade ou bug), tamanho (pequena, média ou grande) e status (`em-revisao`, `aprovada`, `em-andamento`, `implementada` ou `resolvida`). As regras e os critérios de aceite têm IDs (`RN-01`, `CA-01`) no formato "QUANDO ... ENTÃO o sistema DEVE ...", e cada tarefa traz de quem é, do que depende, o gate de verificação e se é paralela (`[P]`) ou mecânica (modelo econômico). O dev revisa a spec e, se tiver dúvida de regra, ela vai ao product-owner; dúvida maior vai a você. Nada é codificado antes da sua aprovação, a menos que você dispense a especificação em uma tarefa pequena. Cada dev segue TDD em lógica e comportamento, nunca altera teste para passar, roda o gate e faz um commit por tarefa; o reviewer não aprova com achado em aberto. As tarefas `[P]` rodam ao mesmo tempo. O dev chama o `sdd` e os `executor` diretamente: ele fica com as tarefas que pedem decisão e delega as mecânicas e as `[P]` independentes, conferindo cada entrega. Dúvidas de regra e de escopo voltam pela orchestrator, que fala com o product-owner e com você.

O time é montado por tarefa, com quantos agentes do mesmo papel o escopo pedir, e o trabalho é dividido para rodar em paralelo e economizar tempo (devs, reviewer, qa e designer entram assim que há o que fazer, sem esperar uns aos outros). Cada tarefa roda em uma worktree própria (confirmada com você), para várias sessões trabalharem juntas no mesmo repositório. A `orchestrator` pede as regras ao `product-owner`, propõe quantos `dev-frontend` e `dev-backend` a tarefa pede e confirma com você antes de delegar. O `reviewer` entra sempre que houver dev. `qa` e `designer` são opcionais: ela avisa que estão disponíveis e você decide se entram. No início da sessão ela pergunta, nesta ordem, um tema opcional para os nomes (por exemplo, personagens de Jujutsu Kaisen), o nome dela e o do `product-owner`. Com tema, cada pergunta de nome traz sugestões dele, para você não precisar inventar dezenas de nomes em um time grande, e você pode dizer "escolha por mim". o nome de cada dev, do `reviewer`, do `qa` e do `designer` é perguntado só quando eles entram no time de uma tarefa, uma pergunta por agente.

## Usar em um repositório

```
node ~/claude-core/bin/ai-sync.js /caminho/do/repo --profile default
```

Ou, dentro do repositório, sem argumento de pasta:

```
node ~/claude-core/bin/ai-sync.js --profile frontend
```

Isso copia os agentes do perfil para `.claude/agents/`, as regras para `.claude/rules/` e as skills para `.claude/skills/` do repositório. Depois, abra o orquestrador:

```
claude --agent orchestrator
```

Rodar de novo atualiza os arquivos copiados e remove os que saíram do perfil. Atenção: hoje a remoção é feita pelo nome do arquivo, então um agente ou regra seu com o mesmo nome de um do `claude-core` pode ser apagado ou sobrescrito. Agentes e regras com outros nomes não são tocados. A proteção completa está na issue [#4](https://github.com/felipe-sant/claude-core/issues/4).

## Perfis

Ficam em `profiles/*.json`. Cada perfil lista os `agents` e as `rules` que o repositório recebe.

- `default`: time completo.
- `frontend`: `dev-frontend`, `dev-fullstack` e `dev-doc`, com `designer`.
- `backend`: `dev-backend`, `dev-fullstack`, `dev-database`, `dev-devops` e `dev-doc`, sem `designer`.

Todos incluem o `reviewer`.

Cada perfil pode ter as listas `agents`, `rules` e `skills`, com nomes registrados no `catalog.json`. Para uma configuração nova, crie `profiles/nome.json`.

## Regras

Ficam em `rules/*.md` e o Claude Code as carrega sozinho a partir de `.claude/rules/`.

- `commit-standard`: tipos de alteração com ícone e padrão de branches e commits (`Fix :bug: [#5] Troca <a href> por <Link>`).

## Adicionar um item

1. Crie o arquivo: `agents/nome.md` (com o cabeçalho `name`, `description`, `model`), `rules/nome.md` ou `skills/nome/SKILL.md`. Se for só de uma stack, use `stacks/<stack>/...`.
2. Registre em `catalog.json`, no grupo certo, com `path`, `applies` e `description`. É o único lugar de registro.
3. Para um repositório receber o item, inclua o nome no perfil que deve usá-lo (`profiles/*.json`) e rode o `ai-sync`.

Para conferir se o catálogo e os perfis estão consistentes: `node bin/ai-sync.js --check`.
