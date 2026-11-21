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

O campo `applies` de cada item do catálogo diz a que projetos ele serve: `["all"]` para qualquer projeto ou uma lista de stacks, como `["react"]`. Itens de stack ficam em `stacks/<stack>/` e o `path` do catálogo aponta para lá. A configuração base do Claude por projeto está na issue [#8](https://github.com/felipe-sant/claude-core/issues/8).

## Planejado

O que falta para a nova função está nas issues:

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
node ~/claude-core/bin/ai-sync.js /caminho/do/repo
```

Ou, dentro do repositório, sem argumento de pasta:

```
node ~/claude-core/bin/ai-sync.js
```

Sem `--profile`, a ferramenta detecta a stack do projeto e aplica tudo o que vale para qualquer projeto (`applies: ["all"]`) mais o que é das stacks detectadas. Ao final, mostra as stacks detectadas e o que foi aplicado.

- A detecção olha as dependências do `package.json` e do `composer.json` na raiz e nas pastas de primeiro nível, então um repositório com painel e API reconhece as duas stacks.
- Só são detectadas as stacks para as quais existe conteúdo no `claude-core`. As regras de detecção ficam em `stacks` no `catalog.json`.
- Se nada for reconhecido, aplica só o que vale para qualquer projeto e avisa.
- `--profile nome` escolhe um perfil à mão, prevalece sobre a detecção e aplica exatamente o que o perfil lista.

Isso copia os agentes para `.claude/agents/`, as regras para `.claude/rules/` e as skills para `.claude/skills/` do repositório. Depois, abra o orquestrador:

```
claude --agent orchestrator
```

## Sincronização segura

O `ai-sync` registra o que instalou em `.claude/claude-core.lock.json` (caminho, versão e impressão digital de cada arquivo) e usa esse registro para nunca mexer no que é seu:

- Arquivo criado por você, ou que já existia com o mesmo nome de um do `claude-core`, não é apagado nem sobrescrito. Se o conteúdo for diferente, a ferramenta avisa.
- Arquivo instalado e sem alterações é atualizado quando há versão nova, e removido quando sai do `claude-core`.
- Arquivo instalado que você editou não é tocado. A ferramenta avisa e diz se há versão nova disponível.
- Em repositório que já foi configurado antes, os arquivos idênticos aos do `claude-core` passam a ser acompanhados; os diferentes ficam como estão, com aviso.
- Ao final, lista o que foi criado, atualizado, removido e deixado como estava. Rodar de novo com tudo em dia não muda nada.

Para receber a versão nova dos arquivos em conflito (os que você editou e os que já existiam sem registro, como em repositórios configurados pela versão antiga), rode com `--force`:

```
node ~/claude-core/bin/ai-sync.js --force
```

O `--force` sobrescreve só os arquivos que o `claude-core` entrega e que estão em conflito, e lista cada um em "Sobrescritos". Arquivos que o `claude-core` não entrega nunca são tocados, e as edições sobrescritas não voltam. Se quiser guardá-las, faça commit antes. Versione o `claude-core.lock.json` junto com o repositório.

## Perfis

Ficam em `profiles/*.json` e só valem quando escolhidos com `--profile`. Cada perfil lista os `agents` e as `rules` que o repositório recebe.

- `default`: time completo.
- `frontend`: `dev-frontend`, `dev-fullstack` e `dev-doc`, com `designer`.
- `backend`: `dev-backend`, `dev-fullstack`, `dev-database`, `dev-devops` e `dev-doc`, sem `designer`.

Todos incluem o `reviewer`.

Cada perfil pode ter as listas `agents`, `rules` e `skills`, com nomes registrados no `catalog.json`. Para uma configuração manual nova, crie `profiles/nome.json`.

## Regras

Ficam em `rules/*.md` (gerais) e `stacks/<stack>/rules/*.md` (por stack). O Claude Code as carrega sozinho a partir de `.claude/rules/`, sem nenhuma ação sua. Cada uma é curta e diz no início quando vale.

Gerais, aplicadas em qualquer projeto:

- `commit-standard`: tipos de alteração com ícone e padrão de branches e commits (`Fix :bug: [#5] Troca <a href> por <Link>`).
- `code-standard`: estilo de código, incluindo nunca escrever comentários.
- `testing-standard`: testes primeiro (TDD), teste para cada bug e nunca alterar teste só para passar.
- `security-standard`: segredos, validação de entrada, acesso, senhas e dependências.
- `review-standard`: como preparar e como fazer uma revisão de código.

Por stack, aplicadas só quando a stack é detectada no projeto:

- `react-standard` (React), `nestjs-standard` (NestJS), `laravel-standard` (Laravel) e `adonisjs-standard` (AdonisJS).
- Têm `paths` no cabeçalho, então o Claude só as carrega ao mexer em arquivos da stack. Em um repositório com painel React e API NestJS, cada padrão aparece só nos arquivos certos.

Você pode editar uma regra no projeto: a próxima sincronização não a sobrescreve e avisa se houver versão nova (veja "Sincronização segura"). Regras novas seguem o fluxo de "Adicionar um item". Os perfis manuais (`--profile`) incluem só as regras gerais.

## Testes e lint

Requer Node 22 ou mais novo. Instale as dependências de desenvolvimento uma vez com `npm ci`.

- `npm test`: roda os testes do `ai-sync` (detecção de stack, arquivos do usuário preservados, atualização e remoção seguras, `--force`) e da consistência do catálogo e dos perfis. Eles trabalham só em pastas temporárias.
- `npm run lint`: roda o oxlint no código Node e a checagem do formato dos agentes (cabeçalho com `name`, `description` e `model`, nome igual ao do arquivo), das regras, das skills, dos perfis e dos JSON. A regra de nunca escrever comentários no código também é conferida aqui.

O GitHub roda os dois em todo PR (`.github/workflows/ci.yml`), com os mesmos comandos. PR com lint ou teste quebrado não passa na checagem.

## Adicionar um item

1. Crie o arquivo: `agents/nome.md` (com o cabeçalho `name`, `description`, `model`), `rules/nome.md` ou `skills/nome/SKILL.md`. Se for só de uma stack, use `stacks/<stack>/...`.
2. Registre em `catalog.json`, no grupo certo, com `path`, `applies` e `description`. É o único lugar de registro.
3. Rode o `ai-sync`: com `applies: ["all"]` ou uma stack detectada, o item é aplicado sozinho. Para um perfil manual receber o item, inclua o nome em `profiles/*.json`.

Para uma stack nova, adicione-a em `stacks` no `catalog.json` com `detect.dependencies` (nomes de pacotes do `package.json` ou `composer.json`).

Para conferir se o catálogo e os perfis estão consistentes: `node bin/ai-sync.js --check`.
