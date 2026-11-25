# Definir o padrão de escrita de PRs, comentários e issues e corrigir o PR do agente de issues

> Status: em-revisao
> Tipo: funcionalidade
> Tamanho: media
> Branch: feat/73-padrao-de-pr-comentarios-e-issues
> Criada em: 2026-11-25

Issue: #73 de felipe-sant/claude-kit.

## Objetivo

O primeiro pull request aberto sozinho pelo agente de issues saiu com a descrição em um parágrafo único, sem as seções combinadas. Hoje o jeito de escrever pull request, comentário e issue está espalhado entre skills e regras, e cada uma repete um pedaço. Esta tarefa cria duas regras curtas, uma para pull request e comentários e outra para issues, faz as skills e as regras existentes apontarem para elas em vez de repetir o texto, e ajusta as instruções do agente de issues para que a descrição do pull request saia com as três seções mesmo dentro das restrições de comando que ele tem.

## Regras

Regra nova de pull request e comentários, que vale para todos os projetos:

- RN-01: a descrição do pull request tem, nesta ordem, as seções "O que muda", "Como foi verificado" e "Observações", em linguagem simples, sem caminhos de arquivo nem código. Leva "Closes #n" quando conclui uma issue. O título segue o padrão de commits. Fonte: product-owner.
- RN-02: comentários em pull request, em issue e de revisão são escritos em linguagem simples, de forma objetiva, com uma ideia por comentário, falando do código e não da pessoa. Fonte: product-owner.
- RN-03: o comentário de revisão classifica o achado como "bloqueia" ou "sugestão" e diz o problema e o que mudaria. A regra nova só aponta para o padrão de revisão, sem repetir o texto dele. Fonte: product-owner.

Regra nova de criação de issues, que vale para todos os projetos:

- RN-04: o título da issue é uma frase em português simples, sem caminho de arquivo nem código. Fonte: product-owner.
- RN-05: a issue de bug tem quatro seções, nesta ordem: "O que aconteceu", "Impacto", "Causa provável" e "Sugestão". Fonte: product-owner.
- RN-06: a issue de funcionalidade tem três seções, nesta ordem: "O que se quer", "Por que" e "Critérios de aceite". Fonte: product-owner.
- RN-07: a issue de bug leva a etiqueta "bug" e a de funcionalidade leva "enhancement". A regra manda usar as etiquetas que o projeto já tem e, se houver "bug" e "enhancement", usá-las. Nenhuma etiqueta nova é criada. Fonte: product-owner (D-01 e D-02).
- RN-07a: quem cria a issue nunca define tamanho nem prioridade. O tamanho é definido pelo dono do projeto; neste repositório, por exemplo, quem define é o agente de issues, que não existe nos outros projetos. Fonte: product-owner (D-03).
- RN-07b: a regra de issues vale para issues do GitHub em qualquer repositório que receba o time pela sincronização, e não trata de quadros de tarefas de outros projetos. Fonte: product-owner (D-02).
- RN-08: o repositório do time é público, então a issue nunca leva dado sensível, dado de cliente nem caminho de arquivo. Isso já está no padrão de problemas do time: a regra nova aponta para ele, sem repetir. Fonte: product-owner.

Agente de issues:

- RN-09: as instruções do agente de issues mandam usar as três seções do pull request e explicam como montar o texto dentro das restrições que ele já tem: texto direto no comando, sem arquivo, sem crase, sem cifrão e sem heredoc, com as quebras de linha dentro do próprio texto. Continuam pedindo "Closes #n" e a linha "Aberto pelo agente de issues.". Fonte: product-owner, a partir da sugestão da issue #73.
- RN-10: a automação do agente de issues, as permissões dela e os comandos negados ficam como estão. Fonte: product-owner.

Geral:

- RN-11: as skills e as regras que já tratam do assunto passam a apontar para as regras novas, sem repetir o texto delas, e não há skill nova de criar issue. Fonte: product-owner.

## Critérios de aceite

- CA-01: QUANDO alguém sincroniza o time em um projeto qualquer, sem perfil ou com qualquer perfil ENTÃO o projeto DEVE receber a regra de pull request e comentários junto com as demais regras gerais. Cobre RN-01, RN-02, RN-03.
- CA-02: QUANDO alguém lê a regra de pull request e comentários ENTÃO ela DEVE trazer as três seções da descrição na ordem "O que muda", "Como foi verificado" e "Observações", pedir linguagem simples sem caminhos nem código, pedir "Closes #n" quando o pull request conclui uma issue e mandar o título seguir o padrão de commits. Cobre RN-01.
- CA-03: QUANDO alguém lê a regra de pull request e comentários ENTÃO ela DEVE pedir comentários em linguagem simples, objetivos, com uma ideia por comentário e falando do código e não da pessoa, e DEVE apontar para o padrão de revisão quanto à classificação "bloqueia" ou "sugestão", sem copiar o texto dele. Cobre RN-02, RN-03.
- CA-04: QUANDO alguém lê a skill de abrir pull request e a skill de revisão ENTÃO as duas DEVEM mandar seguir a regra de pull request e comentários, e nenhuma delas DEVE repetir a lista de seções nem as orientações de escrita da regra. Cobre RN-11.
- CA-05: QUANDO alguém lê o padrão de revisão ENTÃO a parte sobre como escrever os comentários DEVE apontar para a regra de pull request e comentários. Cobre RN-03, RN-11.
- CA-06: QUANDO alguém sincroniza o time em um projeto qualquer, sem perfil ou com qualquer perfil ENTÃO o projeto DEVE receber a regra de issues junto com as demais regras gerais. Cobre RN-04 a RN-08 e RN-07b.
- CA-07: QUANDO alguém lê a regra de issues ENTÃO ela DEVE trazer o título como frase simples sem caminho nem código, as quatro seções da issue de bug na ordem certa, as três seções da issue de funcionalidade na ordem certa, que vale para issues do GitHub, sem tratar de quadros de tarefas, as etiquetas "bug" para bug e "enhancement" para funcionalidade com a orientação de usar as que o projeto já tem, a proibição de quem cria a issue definir tamanho ou prioridade, o tamanho definido pelo dono do projeto com o agente de issues só como exemplo deste repositório, e o apontamento para o padrão de problemas do time quanto ao que nunca vai na issue, sem repetir a lista. Cobre RN-04 a RN-08, RN-07a e RN-07b.
- CA-08: QUANDO alguém lê o padrão de problemas do time ENTÃO ele DEVE apontar para a regra de issues para o título e as seções, em vez de repetir o formato, e DEVE continuar dizendo onde abrir, quem abre, a busca por duplicata e o que nunca vai na issue. Cobre RN-08, RN-11.
- CA-09: QUANDO alguém procura uma skill de criar issue ENTÃO o time DEVE continuar sem ela. Cobre RN-11.
- CA-10: QUANDO alguém lê as instruções do agente de issues ENTÃO elas DEVEM mandar a descrição do pull request com as seções "O que muda", "Como foi verificado" e "Observações", nesta ordem, explicar que o texto vai direto no comando, sem arquivo, sem crase, sem cifrão e sem heredoc, com as quebras de linha dentro do próprio texto, e continuar pedindo "Closes #n" e a linha "Aberto pelo agente de issues.". Cobre RN-09.
- CA-11: QUANDO a suíte roda ENTÃO um teste DEVE conferir que as instruções do agente de issues trazem as três seções e na ordem certa, e DEVE falhar se uma delas faltar ou vier fora de ordem. Cobre RN-09.
- CA-12: QUANDO alguém compara a automação do agente de issues, as permissões e os comandos negados com o que está na branch principal ENTÃO não DEVE haver diferença. Todas as proteções que os testes de hoje conferem nas instruções do agente continuam conferidas. Cobre RN-10.
- CA-13: QUANDO alguém lê o README ENTÃO a lista de regras DEVE trazer as duas regras novas, a contagem de regras gerais DEVE estar certa no resumo e na parte de perfis, e a seção do agente de issues DEVE dizer que a descrição do pull request sai com as três seções. Cobre RN-01, RN-04, RN-09.
- CA-14: QUANDO alguém roda o lint, a suíte e a checagem do catálogo ENTÃO os três DEVEM passar, e a cópia do time gerada dentro do próprio repositório DEVE estar em dia com as fontes, gerada pela sincronização e nunca editada à mão. Cobre RN-11.

## Critérios de sucesso

- O lint, a suíte e a checagem do catálogo passam, e o CI aprova o pull request desta tarefa.
- Um projeto novo sincronizado recebe nove regras gerais, entre elas as duas novas.
- O próximo pull request aberto pelo agente de issues, depois do merge, sai com as três seções separadas, o "Closes #n" e a linha "Aberto pelo agente de issues.". O QA confere isso no primeiro pull request real do agente.
- Nenhuma regra ou skill repete o texto que agora mora nas regras novas.

## Fora do escopo

- A automação do agente de issues, as permissões dela e os comandos negados (decisão do product-owner).
- Padrão de comentário em código: a regra de nunca escrever comentários em código continua como está.
- Prioridade de issues e de pull requests.
- Reclassificar ou reescrever pull requests e issues antigos.
- Skill nova de criar issue.
- Quadros de tarefas de outros projetos e as etiquetas deles: a regra de issues trata só de issues do GitHub (D-02).
- Criar etiqueta no GitHub: a "enhancement" já existe e nenhuma tarefa cria etiqueta (D-01).

## Plano de execução

- Fase 1 (paralelo): T1 [P] (Dev Doc) e T5 [P] (Dev Ops). Editam arquivos diferentes e a T5 não gera nada no `.claude/`.
- Fase 2 (sequencial, Dev Doc, depois da T1): T2 → T3 → T4. A T5 pode seguir em paralelo a qualquer uma delas.
- Gate de fase (fim da Fase 2, com a T5 concluída, antes do reviewer): `npm run lint`, `npm test`, `node bin/ai-sync.js --check` e o sync em pasta temporária (`T=$(mktemp -d) && node bin/ai-sync.js "$T" && ls -R "$T/.claude"; rm -rf "$T"`).

As tarefas do Dev Doc não são `[P]` entre si de propósito: todas mudam fonte do catálogo e, pela sincronização, o mesmo arquivo gerado de registro do que foi instalado (`.claude/claude-core.lock.json`). Na mesma worktree, o hook recusaria o commit de uma enquanto a outra tem fonte alterada e não commitada.

Sobre o `.claude/` gerado: o hook de pre-commit regenera o `.claude/` e recusa o commit por caminhos que não traga os gerados atualizados. Por isso cada tarefa do Dev Doc que muda fonte (`rules/`, `skills/`, `catalog.json`, `profiles/`) roda `npm run sync` e inclui nos caminhos do commit os arquivos gerados que mudaram com ela. A T4 faz a conferência final de que o `.claude/` está em dia e roda o sync em pasta temporária. A T5 não toca fonte do catálogo e não gera nada no `.claude/`. Este repositório não tem typecheck nem formatador separado: o lint cobre o código Node e o formato do conteúdo.

## Tarefas

### T1 [P] Regras novas, catálogo e perfis

- O quê: criar as regras `pull-request-standard` e `issue-standard`, registrá-las no catálogo com `applies` `["all"]` e incluí-las em todos os perfis.
- Onde: `rules/pull-request-standard.md`, `rules/issue-standard.md`, `catalog.json`, `profiles/*.json`, `tests/standards.test.js`, `tests/team.test.js` e os gerados em `.claude/rules/` e `.claude/claude-core.lock.json`.
- Dev: Dev Doc (dev-doc).
- Depende de: nada.
- Reaproveita: o formato das regras gerais de hoje (título, quando vale, lista curta); a lista de seções da skill `create-pull-request`; as quatro seções do `feedback-standard`; o teste do `feedback-standard` em `tests/team.test.js` como modelo.
- Atende: RN-01 a RN-08, RN-07a, RN-07b; CA-01, CA-02, CA-03, CA-06, CA-07.
- Passos:
  1. Acrescentar `pull-request-standard` e `issue-standard` à lista `general` de `tests/standards.test.js` e escrever em `tests/team.test.js` um teste por regra: registrada com `applies` `["all"]`, presente em todos os perfis, e com o conteúdo pedido (as três seções do pull request na ordem, "Closes #", o padrão de commits, uma ideia por comentário, a citação ao `review-standard`; o título simples, as quatro seções de bug na ordem, as três de funcionalidade na ordem, "bug" e "enhancement" com a orientação de usar as etiquetas que o projeto já tem, a ausência de "feature" como etiqueta, quem cria nunca define tamanho nem prioridade, o tamanho pelo dono do projeto, o agente de issues citado só como exemplo, que vale para issues do GitHub e a citação ao `feedback-standard`). Ver falhar.
  2. Escrever as duas regras, curtas (o teste de standards limita a 60 linhas), sem repetir o texto do `review-standard` nem a lista do que nunca vai na issue do `feedback-standard`.
  3. Registrar as duas no `catalog.json` e incluí-las em `profiles/default.json`, `backend.json`, `frontend.json` e `tooling.json`.
  4. Rodar `npm run sync` e commitar as fontes, os testes e os gerados juntos, por caminho exato.
- Teste: unitário; o primeiro a falhar é "projeto sem stack conhecida recebe só os padrões gerais", com as duas regras novas faltando.
- Pronto quando: as duas regras existem, estão no catálogo e nos quatro perfis, os testes novos passam, os de hoje continuam passando sem afrouxar e o gate passa.
- Gate: `npm run lint`, `npm test` e `node bin/ai-sync.js --check`.
- Modelo: padrao.
- Status: pendente.

### T2 Skills de pull request e de revisão apontam para a regra nova

- O quê: fazer as skills `create-pull-request` e `code-review` mandarem seguir o `pull-request-standard`, tirando delas o texto que passa a morar na regra.
- Onde: `skills/create-pull-request/SKILL.md`, `skills/code-review/SKILL.md`, `tests/team.test.js` (ou um teste novo de conteúdo) e os gerados em `.claude/skills/` e `.claude/claude-core.lock.json`.
- Dev: Dev Doc (dev-doc).
- Depende de: T1 (mesmo arquivo gerado de registro e a regra citada precisa existir).
- Reaproveita: o passo da skill `code-review` que já cita o `review-standard`.
- Atende: RN-11; CA-04.
- Passos:
  1. Escrever o teste: as duas skills citam `pull-request-standard` e a `create-pull-request` não traz mais a lista das três seções. Ver falhar.
  2. Ajustar as duas skills, mantendo os passos de cada uma (o que rodar, o que conferir, o veredito) e trocando o texto repetido pela citação da regra.
  3. Rodar `npm run sync` e commitar as fontes, o teste e os gerados juntos, por caminho exato.
- Teste: unitário; o primeiro a falhar é "a skill create-pull-request cita o pull-request-standard".
- Pronto quando: as duas skills citam a regra, não repetem o texto dela, continuam dizendo quando usar e o que entregam, e o gate passa.
- Gate: `npm run lint`, `npm test` e `node bin/ai-sync.js --check`.
- Modelo: economico.
- Status: pendente.

### T3 Padrão de revisão e padrão de problemas do time apontam para as regras novas

- O quê: fazer o `review-standard` apontar para o `pull-request-standard` na parte de comentários e o `feedback-standard` apontar para o `issue-standard` em vez de repetir o formato da issue.
- Onde: `rules/review-standard.md`, `rules/feedback-standard.md`, `tests/team.test.js` e os gerados em `.claude/rules/` e `.claude/claude-core.lock.json`.
- Dev: Dev Doc (dev-doc).
- Depende de: T2 (e, por ela, da T1: as duas regras precisam existir e todas mexem no mesmo arquivo gerado de registro).
- Reaproveita: o teste do `feedback-standard` em `tests/team.test.js`.
- Atende: RN-03, RN-08, RN-11; CA-05, CA-08.
- Passos:
  1. Ajustar o teste do `feedback-standard`: a conferência das quatro seções passa a ser feita no `issue-standard` (já coberta pela T1), e o teste passa a conferir que o `feedback-standard` cita o `issue-standard`. As demais conferências dele ficam como estão (repositório, "é público", busca por duplicata, `gh issue create ... --label bug`, sem pedir confirmação, "Nunca coloque na issue", relato à orchestrator). Escrever também a conferência de que o `review-standard` cita o `pull-request-standard`. Ver falhar. A troca da conferência das quatro seções é mudança por desenho (CA-08) e o relato deve citá-la com o motivo.
  2. Ajustar as duas regras: o `feedback-standard` troca o bloco das seções e a linha do título pela citação do `issue-standard`, mantendo a orientação de citar na "Causa provável" o agente, a regra ou a skill do time; o `review-standard` aponta para o `pull-request-standard` na escrita dos comentários e da descrição.
  3. Rodar `npm run sync` e commitar as fontes, o teste e os gerados juntos, por caminho exato.
- Teste: unitário; o primeiro a falhar é "o feedback-standard aponta para o issue-standard".
- Pronto quando: as duas regras apontam para as novas sem repetir o formato, as conferências de hoje do `feedback-standard` seguem valendo (menos a das seções, movida para o `issue-standard`) e o gate passa.
- Gate: `npm run lint`, `npm test` e `node bin/ai-sync.js --check`.
- Modelo: padrao.
- Status: pendente.

### T4 README e conferência final do `.claude/`

- O quê: atualizar o README com as regras novas e o pull request do agente com as três seções, e conferir que o `.claude/` está em dia com as fontes.
- Onde: `README.md` (resumo, perfis, lista de regras e seção "Agente de issues"), `tests/team.test.js` e o `.claude/` gerado.
- Dev: Dev Doc (dev-doc).
- Depende de: T1, T2 e T3.
- Reaproveita: a conferência `assert.match(readme, ...)` do teste do `feedback-standard`.
- Atende: CA-09, CA-13, CA-14.
- Passos:
  1. Escrever a conferência de que o README cita `pull-request-standard` e `issue-standard`. Ver falhar.
  2. Atualizar o README: "9 gerais" no resumo, "as nove regras gerais" na parte de perfis, uma linha para cada regra nova na lista de regras e, na seção "Issue Claude Agent", que a descrição do pull request sai com "O que muda", "Como foi verificado" e "Observações".
  3. Rodar `npm run sync` e conferir que não sobra diferença no `.claude/`; se sobrar, incluí-la no commit. Rodar o sync em pasta temporária.
  4. Commitar por caminho exato.
- Teste: unitário; o primeiro a falhar é "o README cita as regras de pull request e de issues".
- Pronto quando: o README está coerente com a entrega, o `.claude/` está em dia, não existe skill de criar issue e o gate de fase passa.
- Gate: o gate de fase da Fase 2.
- Modelo: economico.
- Status: pendente.

### T5 [P] Instruções do agente de issues com as três seções

- O quê: fazer as instruções do agente de issues pedirem as três seções do pull request, nesta ordem, e explicarem como montá-las dentro das restrições de comando.
- Onde: `.github/issue-agent/agent-prompt.md` e `tests/issue-claude-agent-prompt.test.js`.
- Dev: Dev Ops (dev-devops).
- Depende de: nada. Não edita arquivos do Dev Doc, e o Dev Doc não edita estes.
- Reaproveita: a lista de guardas de `tests/issue-claude-agent-prompt.test.js` e o passo 4 da seção "Pull request" das instruções.
- Atende: RN-09, RN-10; CA-10, CA-11, CA-12.
- Passos:
  1. Escrever os testes: as instruções trazem "O que muda", "Como foi verificado" e "Observações", nesta ordem (um teste da ordem que falha com uma seção faltando ou trocada); explicam as quebras de linha dentro do próprio texto do `--body`; citam heredoc entre o que não usar. Ver falhar.
  2. Ajustar o passo do pull request: as três seções na ordem, cada uma com título e texto em linguagem simples, montadas com quebras de linha dentro do próprio texto passado em `--body`, sem arquivo, sem crase, sem cifrão e sem heredoc; o "Closes #<número>" e a linha "Aberto pelo agente de issues." continuam. Manter sem mudança todas as frases que os testes de hoje conferem.
  3. Conferir com `git diff origin/main -- .github/workflows .claude/settings.json templates` que a automação, as permissões e os comandos negados não mudaram.
  4. Commitar por caminho exato.
- Teste: unitário; o primeiro a falhar é "as instruções pedem as três seções do pull request na ordem".
- Pronto quando: os testes novos passam, todas as guardas de hoje continuam passando sem afrouxar, nada fora dos dois arquivos mudou e o gate passa.
- Gate: `npm run lint`, `npm test` e `node bin/ai-sync.js --check`.
- Modelo: padrao.
- Status: pendente.

## Dúvidas

Do product-owner:

- D-01 (respondida, fonte: product-owner): a issue de funcionalidade leva a etiqueta "enhancement", que já existe no repositório. A etiqueta "feature" não é criada e nenhuma tarefa cria etiqueta. Aplicada em RN-07, CA-07, T1 e "Fora do escopo".
- D-02 (respondida, fonte: product-owner): a regra vale para issues do GitHub em qualquer repositório que receba o time pela sincronização e não trata de quadros de tarefas de outros projetos. Sobre etiquetas, ela diz: "use as etiquetas que o projeto já tem; se houver bug e enhancement, use-as". Aplicada em RN-07, RN-07b, CA-06, CA-07, T1 e "Fora do escopo".
- D-03 (respondida, fonte: product-owner): a regra é geral. Quem cria a issue nunca define tamanho nem prioridade, e o tamanho é definido pelo dono do projeto. O agente de issues aparece só como exemplo do que acontece neste repositório, porque ele não existe nos outros. Aplicada em RN-07a, CA-07 e T1.

Só o usuário responde:

- Nenhuma.
