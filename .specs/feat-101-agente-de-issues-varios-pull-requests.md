# O agente de issues pode ter até 5 pull requests abertos ao mesmo tempo

> Status: em-andamento
> Aprovada pelo usuário em 2026-11-25.
> Tipo: funcionalidade
> Tamanho: grande
> Branch: feat/101-agente-de-issues-varios-pull-requests
> Criada em: 2026-11-25

Issue: #101 de felipe-sant/claude-kit.

## Objetivo

Hoje o agente de issues só trabalha quando não há nenhum pull request dele aberto (regra que veio da issue #76). Basta um pull request esperando revisão para a fila inteira das issues pequenas parar. A mudança deixa o agente ter até 5 pull requests abertos ao mesmo tempo, continuando a tratar uma issue por execução, e faz a issue que depende de outra ainda aberta esperar fora da fila até a outra ser fechada.

## Regras

- RN-01: O agente só trata uma nova issue quando há menos de 5 pull requests dele abertos. Conta como pull request do agente o que foi aberto pela conta do Claude ou o que traz na descrição a linha "Aberto pelo agente de issues.". Fonte: usuário (issue #101).
- RN-02: Cada execução trata uma única issue e abre no máximo um pull request, da issue pequena mais antiga que puder ser tratada. Fonte: usuário (issue #101).
- RN-03: Com 5 pull requests do agente abertos, a execução termina com sucesso, sem chamar o Claude, e o resumo da execução explica que o limite foi atingido. Fonte: usuário (issue #101).
- RN-04: O limite vale também para o disparo à mão com o número de uma issue. Fonte: usuário (issue #101).
- RN-05: Se o texto da issue disser "depende de #n" e a issue #n estiver aberta, a issue espera fora da fila. Quando a #n for fechada, ela volta para a fila. Fonte: usuário (issue #101).
- RN-05a: Só o corpo da issue conta para a dependência; os comentários não contam. Fonte: usuário (respostas às dúvidas).
- RN-05b: Valem as formas "depende de", "depende do" e "depende da", sem diferenciar maiúsculas de minúsculas, e várias issues na mesma frase (como "depende de #3 e #4"). A issue só entra na fila quando todas as issues citadas como dependência estiverem fechadas. Fonte: usuário (respostas às dúvidas).
- RN-05c: São ignoradas a citação dentro de trecho de código (em bloco ou no meio da linha), a citação de issue de outro repositório e a citação da própria issue. Fonte: usuário (respostas às dúvidas).
- RN-05d: Se o número citado for de um pull request aberto, e não de uma issue, ele não conta como dependência. Fonte: usuário (respostas às dúvidas).
- RN-05e: No disparo à mão com o número de uma issue que espera dependência aberta, a execução recusa e mostra o motivo no resumo e no registro, como as outras recusas, listando as dependências que seguem abertas. Essa checagem vem depois da validação do número e do limite. Fonte: usuário (respostas às dúvidas).
- RN-05f: Quando a dependência fecha, basta a issue voltar para a fila; o agente não é disparado na hora e a issue é pega na próxima execução. Fonte: usuário (respostas às dúvidas).
- RN-06: O agente não tenta prever conflito entre issues; isso fica para a revisão do pull request. Fonte: usuário (issue #101).
- RN-07: Pull request do agente fechado sem merge continua tirando a issue da fila. Fonte: usuário (issue #101), já vigente desde a issue #76.
- RN-08: Continuam valendo: só trata issue pequena (P), só de dono, membro ou colaborador, sem responsável, sem pull request ligado e sem branch própria; o agente nunca faz merge; a branch enviada sem pull request é apagada pela automação; o agente nunca define prioridade. Fonte: usuário (issue #101).
- RN-09: A documentação do agente de issues descreve o limite de 5, a espera por dependência e o que acontece quando o limite é atingido. Fonte: usuário (issue #101).
- RN-10: Os testes cobrem: abaixo do limite, no limite, disparo à mão no limite, dependência de issue aberta e dependência de issue fechada. Fonte: usuário (issue #101).
- RN-11: A classificação de tamanho, ao terminar, dispara o agente quando há uma issue pequena esperando e menos de 5 pull requests do agente abertos (antes: nenhum aberto). Fonte: usuário (respostas às dúvidas), confirmada; o product-owner está acrescentando esse critério à issue #101.

## Critérios de aceite

- CA-01: QUANDO há uma issue pequena na fila e 0 a 4 pull requests do agente abertos ENTÃO o sistema DEVE escolher essa issue para tratar. Cobre RN-01.
- CA-02: QUANDO há exatamente 4 pull requests do agente abertos e uma issue pequena na fila ENTÃO o sistema DEVE tratar a issue (o quinto pull request é permitido). Cobre RN-01.
- CA-03: QUANDO há 5 pull requests do agente abertos ENTÃO o sistema DEVE terminar a execução com sucesso, sem chamar o Claude, sem abrir pull request, e o resumo DEVE dizer quantos pull requests do agente estão abertos e que o limite é 5. Cobre RN-01, RN-03.
- CA-04: QUANDO há mais de 5 pull requests do agente abertos (por exemplo, um aberto à mão com a linha do agente) ENTÃO o sistema DEVE se comportar como em CA-03. Cobre RN-01, RN-03.
- CA-05: QUANDO há 5 ou mais pull requests abertos de outras pessoas e menos de 5 do agente ENTÃO o sistema DEVE tratar a issue normalmente. Cobre RN-01.
- CA-06: QUANDO a contagem chega a 5 somando pull requests da conta do Claude e pull requests com a linha "Aberto pelo agente de issues." na descrição ENTÃO o sistema DEVE considerar o limite atingido. Cobre RN-01.
- CA-07: QUANDO o disparo é à mão com o número de uma issue tratável e há 5 pull requests do agente abertos ENTÃO o sistema DEVE recusar sem chamar o Claude, terminar com sucesso e dizer no resumo que o limite foi atingido e que nenhuma issue é tratada agora. Cobre RN-03, RN-04.
- CA-08: QUANDO o disparo é à mão com um número inválido e o limite está atingido ENTÃO o sistema DEVE recusar como número inválido (a validação do número vem antes do limite, como hoje). Cobre RN-04.
- CA-09: QUANDO há duas ou mais issues pequenas na fila e menos de 5 pull requests do agente abertos ENTÃO o sistema DEVE tratar só a mais antiga e abrir no máximo um pull request na execução. Cobre RN-02.
- CA-10: QUANDO o corpo de uma issue pequena diz "depende de #n" e a issue #n, do mesmo repositório, está aberta ENTÃO o sistema DEVE deixar essa issue fora da fila e escolher a próxima issue pequena mais antiga que puder ser tratada. Cobre RN-02, RN-05.
- CA-11: QUANDO o corpo de uma issue pequena diz "depende de #n" e a #n está fechada ENTÃO o sistema DEVE tratar essa issue normalmente, como se não houvesse a dependência. Cobre RN-05.
- CA-12: QUANDO a única issue pequena da fila espera uma dependência aberta ENTÃO o sistema DEVE terminar com sucesso, sem chamar o Claude, com o resumo dizendo que não há issue pequena na fila. Cobre RN-05.
- CA-13: QUANDO o texto cita "#n" sem dizer "depende de" (por exemplo, "relacionada a #n" ou "ver #n") ENTÃO o sistema DEVE ignorar a citação para efeito de dependência. Cobre RN-05.
- CA-14: QUANDO a execução termina ENTÃO a conferência final DEVE reprovar se houver mais de 5 pull requests do agente abertos ou se a execução abriu mais de um pull request do agente. Cobre RN-01, RN-02.
- CA-15: QUANDO a issue tratada vira tamanho M na execução e já havia pull requests do agente abertos de outras issues ENTÃO a conferência final DEVE aprovar, desde que nenhum pull request tenha sido aberto para essa issue. Cobre RN-08.
- CA-16: QUANDO a issue tratada vira tamanho M e a execução abriu um pull request para ela ENTÃO a conferência final DEVE reprovar. Cobre RN-08.
- CA-17: QUANDO o pull request do agente de uma issue foi fechado sem merge ENTÃO o sistema DEVE manter essa issue fora da fila, mesmo abaixo do limite. Cobre RN-07.
- CA-18: QUANDO uma issue tem responsável, pull request ligado, branch própria, tamanho M ou G, ou foi aberta por quem não é colaborador ENTÃO o sistema DEVE continuar ignorando-a (fila) ou recusando-a com o motivo de hoje (disparo à mão), mesmo abaixo do limite. Cobre RN-08.
- CA-19: QUANDO a classificação de tamanho termina com uma issue pequena esperando e menos de 5 pull requests do agente abertos ENTÃO o sistema DEVE disparar o agente; com 5 ou mais, não DEVE disparar. Cobre RN-11.
- CA-20: QUANDO alguém lê a documentação do agente de issues ENTÃO ela DEVE explicar o limite de 5, a espera por dependência, a volta à fila quando a dependência fecha e o que acontece quando o limite é atingido, sem citar mais "um pull request do agente por vez". Cobre RN-09.
- CA-21: QUANDO a suíte de testes roda ENTÃO ela DEVE ter testes para abaixo do limite, no limite, disparo à mão no limite, dependência de issue aberta e dependência de issue fechada. Cobre RN-10.
- CA-22: QUANDO o corpo diz "depende de #3 e #4" e só a #3 está fechada ENTÃO o sistema DEVE deixar a issue fora da fila; quando as duas estiverem fechadas, DEVE tratá-la normalmente. Cobre RN-05b.
- CA-23: QUANDO o corpo diz "Depende do #n" ou "DEPENDE DA #n" e a #n está aberta ENTÃO o sistema DEVE deixar a issue fora da fila, como em "depende de #n". Cobre RN-05b.
- CA-24: QUANDO "depende de #n" aparece só dentro de trecho de código (em bloco ou no meio da linha) e a #n está aberta ENTÃO o sistema DEVE ignorar a citação e tratar a issue normalmente. Cobre RN-05c.
- CA-25: QUANDO o corpo diz que depende de uma issue de outro repositório ou da própria issue ENTÃO o sistema DEVE ignorar a citação. Cobre RN-05c.
- CA-26: QUANDO "depende de #n" aparece só num comentário da issue, e não no corpo, e a #n está aberta ENTÃO o sistema DEVE ignorar a citação. Cobre RN-05a.
- CA-27: QUANDO o número citado em "depende de #n" é de um pull request aberto ENTÃO o sistema DEVE tratar a issue normalmente. Cobre RN-05d.
- CA-28: QUANDO o disparo é à mão com o número de uma issue tratável cuja dependência está aberta e o limite não foi atingido ENTÃO o sistema DEVE recusar sem chamar o Claude, terminar com sucesso e mostrar o motivo no resumo e no registro, citando a dependência aberta; com várias abertas, DEVE listar todas as que seguem abertas e nenhuma das fechadas. Cobre RN-05b, RN-05e.
- CA-29: QUANDO o disparo é à mão com o número de uma issue que espera dependência e o limite está atingido ENTÃO o sistema DEVE recusar pelo limite, como em CA-07. Cobre RN-04, RN-05e.

## Critérios de sucesso

- Com um ou mais pull requests do agente esperando revisão, a próxima execução trata a próxima issue pequena, até o quinto pull request aberto.
- Com 5 abertos, as execuções terminam verdes e o resumo diz por que nada foi feito.
- Uma issue que depende de outra ainda aberta não é tratada antes da hora e volta sozinha depois que a outra fecha.
- Lint, testes e a checagem do catálogo passam no CI, inclusive o actionlint.

## Fora do escopo

- Tratar várias issues numa mesma execução: RN-02 mantém uma por execução.
- Execuções em paralelo: a fila única das duas automações continua.
- Tratar issues M e G.
- Definir prioridade entre issues.
- Merge automático.
- Prever ou resolver sozinho conflito entre pull requests do agente (RN-06).
- Disparar o agente no momento em que a dependência fecha: a issue volta para a fila e é pega na próxima execução (RN-05f).

## Desenho

### Contrato entre as partes (fixado aqui para as tarefas rodarem em paralelo)

- Nome e valor do limite: `MAX_AGENT_PULLS = 5`, constante nomeada no script de seleção, exportada para os testes. No workflow da Issue Claude Agent, o mesmo valor entra como variável de ambiente do trabalho `agent`: `MAX_AGENT_PULLS: 5`. Um teste confere que os dois valores são iguais.
- Textos do resumo, com `<q>` sendo a quantidade de pull requests do agente abertos e `<limite>` o valor da constante:
  - Fila, limite atingido: `Já há <q> pull requests do agente abertos e o limite é <limite>: a fila das P espera.`
  - Disparo à mão, limite atingido: `Já há <q> pull requests do agente abertos e o limite é <limite>: nenhuma issue é tratada agora.`
  - Fila sem issue tratável (inclusive quando todas esperam dependência): `Nenhuma issue P na fila.` (sem mudança).
  - Disparo à mão de issue que espera uma dependência aberta: `A issue <número> depende da issue #<n>, ainda aberta.`
  - Disparo à mão de issue que espera várias dependências abertas, listando só as abertas, em ordem crescente: `A issue <número> depende das issues #<a>, #<b>, ainda abertas.`

### Como as partes se encaixam

- Seleção (script `.github/issue-agent/select-issues.js`, modo `agent`):
  - Hoje `selectAgent` para com qualquer pull request do agente aberto (`openPulls.some(isAgentPull)`), nos dois caminhos (fila e número informado). Passa a contar `openPulls.filter(isAgentPull).length` e a parar só com contagem maior ou igual a `MAX_AGENT_PULLS`. A ordem das checagens no disparo à mão não muda: número inválido, depois limite, depois os motivos de recusa da issue.
  - A dependência é uma condição a mais em `isQueuedSmall` (fila) e em `refusalReason` (disparo à mão), nesta ordem no disparo à mão: número inválido, limite, motivos de hoje e por último a dependência. Uma função pura recebe o corpo e o número da issue e devolve os números citados como dependência: tira antes os trechos de código (cercados por três crases e entre crases simples), reconhece "depende de", "depende do" e "depende da" sem diferenciar maiúsculas, aceita vários "#n" na mesma citação ("#3 e #4", "#3, #4"), ignora `dono/repo#n` e o próprio número. A issue espera quando qualquer desses números está entre as issues abertas já buscadas. Só o corpo é lido; os comentários nunca entram.
  - O estado da #n sai da lista de issues abertas que a seleção já busca, sem chamada nova à API: se a #n não está na lista, conta como fechada ou inexistente e não bloqueia. Essa lista não traz pull requests, então uma "#n" que é um pull request aberto não bloqueia (RN-05d). Citação de outro repositório (`dono/repo#n`) é ignorada. Referência à própria issue é ignorada.
  - A consulta GraphQL `ISSUES_QUERY` não traz o corpo hoje: passa a trazer `body`, e `normalizeIssue` passa a devolver `body` (texto vazio quando nulo). O modo `size-set` usa a mesma consulta, sem mudança de comportamento.
- Encadeamento da Issue Size Set: o trabalho `chain` já chama a seleção no modo `agent`, então passa a seguir o limite sem mudança no YAML (RN-11). A conferência final da Issue Size Set compara a contagem de pull requests do agente antes e depois e continua igual.
- Conferência final da Issue Claude Agent (vinda da #95): hoje `[ "$open_agent_pulls" -le 1 ]` garante ao mesmo tempo "no máximo 1 aberto" e "no máximo 1 novo". Passa a ter duas checagens:
  - a Foto de antes grava a contagem de pull requests do agente abertos (`$CHECK_DIR/agent-pulls`), com a mesma consulta paginada e soma por `awk`, sem `gh api` encadeado em pipe;
  - a conferência exige total depois menor ou igual a `$MAX_AGENT_PULLS` e total depois menor ou igual a total antes mais 1.
  - No caso `Size: M`, `[ "$open_agent_pulls" -eq 0 ]` (total) fica errado com pull requests legítimos de outras issues. Passa a exigir que nenhum pull request tenha sido aberto para esta issue (`pulls_for_issue` igual a 0). Como `pulls_for_issue` é calculado depois do `case`, o cálculo das branches novas e dos pull requests da issue sobe para antes do `case`.
- Limpeza da Issue Claude Agent: sem mudança. Ela compara as branches novas da issue com as branches de pull requests abertos e não supõe pull request único.
- Instruções do agente (`agent-prompt.md`): sem mudança. "No máximo um pull request por execução" é RN-02 e é conferido pelo teste das instruções. As instruções da classificação não citam o limite.
- `.claude/CLAUDE.md`: a linha da tabela sobre as automações não fala em "um por vez"; sem mudança. Se alguém quiser citar o limite ali, esse é o único arquivo do `.claude/` editado à mão (o resto é gerado pelo `ai-sync` a partir das fontes). O `CLAUDE.md` da raiz é outra fonte e também não cita o limite.

### Testes vigentes que contradizem a regra nova

Mudar estes testes é decisão explícita desta especificação, pela RN-01 aprovada na issue #101 (antes valia "um pull request por vez", da #76). Todos em `tests/issue-claude-agent-select.test.js`:

- `pull request do agente aberto deixa pr_issue vazio e a fila espera`: um pull request deixa de bloquear. Passa a usar 5 pull requests do agente e o texto novo.
- `pull request com a linha fixa no corpo conta como do agente`: hoje espera bloqueio com um único pull request. Passa a montar 5 pull requests, parte da conta do Claude e parte só com a linha fixa (CA-06).
- `com número e pull request do agente aberto, a recusa é a do pull request`: passa a usar 5 pull requests e o texto novo.

Em `tests/issue-claude-agent-workflow.test.js`, o teste `a conferência final roda sempre e exige Size P ou M, sem pull request se M` não confere o `-eq 0` pelo texto e continua passando, mas o nome passa a descrever "sem pull request desta issue se M"; o teste novo da conferência confere a regra.

`tests/issue-agent-select.test.js` (`normalizeIssue converte o nó da API...`) não usa comparação do objeto inteiro e continua passando; ganha a asserção do `body`.

## Plano de execução

Sem typecheck: o projeto é JavaScript sem TypeScript. Sem formatador: só o oxlint, dentro de `npm run lint`. O actionlint roda só no CI (o teste local confere apenas que o CI o chama).

- Fase 1 (paralelo): T1 [P] (Dev Ops), T3 [P] (Dev Ops), T5 [P] (Dev Doc).
  - Gate de fase: `npm run lint`, `npm test` e `node bin/ai-sync.js --check`, uma vez ao fim da fase.
- Fase 2 (paralelo): T2 [P] (Dev Ops, depende de T1), T4 [P] (Dev Ops, depende de T1 e T3).
  - Gate de fase: `npm run lint`, `npm test` e `node bin/ai-sync.js --check`, antes do reviewer. O Dev Doc confere o README contra o comportamento final de T2.

## Tarefas

Regra para devs e executores em todas as tarefas: nunca escreva comentários no código (nem de linha, nem de bloco, nem JSDoc) nem no YAML. Use constantes nomeadas, sem número nem texto solto que carregue regra. Commits no padrão do repositório, com `[#101]`, um commit atômico por tarefa, com os caminhos explícitos.

### T1 [P] Limite de 5 pull requests na seleção

- O quê: a seleção passa a parar só com 5 ou mais pull requests do agente abertos, na fila e no disparo à mão, com os textos novos do resumo.
- Onde: `.github/issue-agent/select-issues.js` (`selectAgent`, constante `MAX_AGENT_PULLS`, `module.exports`) e `tests/issue-claude-agent-select.test.js`.
- Dev: Dev Ops.
- Depende de: nada.
- Reaproveita: `isAgentPull`, `AGENT_AUTHOR`, `PULL_REQUEST_LINE`, os ajudantes `issue()` e `select()` do teste.
- Atende: RN-01, RN-02, RN-03, RN-04, RN-07, RN-08, RN-10, RN-11; CA-01 a CA-09, CA-17, CA-18, CA-19 (pela seleção), CA-21.
- Pronto quando: os testes novos e os três testes reescritos (lista no Desenho) passam; todos os outros testes da seleção continuam passando sem mudança; o gate passa.
- Teste: unitário. Primeiro o que deve falhar: "quatro pull requests do agente abertos ainda deixam tratar a P mais antiga" (falha hoje, porque um já bloqueia). Depois: 5 bloqueiam (fila) com o texto novo; 6 bloqueiam; 5 de outras pessoas não bloqueiam; 5 somando conta do Claude e linha fixa bloqueiam; disparo à mão no limite recusa com o texto novo; número inválido no limite continua recusado como inválido; issue com pull request ligado (fechado sem merge) continua fora da fila abaixo do limite.
- Gate: `node --test tests/issue-claude-agent-select.test.js`, `npm run lint` e `node bin/ai-sync.js --check`.
- Modelo: padrao.
- Status: feita (commit c6f1046; 11 testes falharam antes da mudança; os 3 testes antigos foram reescritos por causa da RN-01; gate: lint ok, 409 testes passando e 0 falhando, ai-sync --check ok).

### T2 [P] Issue que depende de outra aberta espera fora da fila

- O quê: a seleção lê o corpo das issues e deixa fora da fila a issue que diz "depende de #n" enquanto a #n estiver aberta.
- Onde: `.github/issue-agent/select-issues.js` (`ISSUES_QUERY` com `body`, `normalizeIssue`, função pura de extração das dependências, `isQueuedSmall` e `refusalReason`), `tests/issue-claude-agent-select.test.js` e `tests/issue-agent-select.test.js`.
- Dev: Dev Ops.
- Depende de: T1 (mesmo arquivo).
- Reaproveita: a lista de issues abertas já buscada, `byOldest`, `isQueuedSmall`, `refusalReason`, o padrão de busca de branch própria (`hasOwnBranch`).
- Atende: RN-02, RN-05, RN-05a a RN-05f, RN-10; CA-10 a CA-13, CA-21 a CA-29.
- Pronto quando: os testes de dependência passam; o teste de `normalizeIssue` confere o `body` (e texto vazio quando a API devolve nulo); a seleção no modo `size-set` não muda; o gate passa.
- Teste: unitário. Primeiro o que deve falhar: "P mais antiga que depende de uma issue aberta fica fora da fila e a seguinte é escolhida". Depois: dependência de issue fechada (fora da lista de abertas) não bloqueia; única P esperando dependência dá "Nenhuma issue P na fila."; citação de "#n" sem "depende de" não bloqueia; citação de outro repositório é ignorada; referência à própria issue é ignorada; "depende de #3 e #4" com só uma fechada bloqueia e com as duas fechadas libera; "Depende do" e "DEPENDE DA" bloqueiam; citação só dentro de trecho de código (bloco e no meio da linha) é ignorada; citação só em comentário é ignorada; "#n" de pull request aberto não bloqueia; disparo à mão de issue com dependência aberta recusa com o texto do Desenho (uma e várias abertas, só as abertas listadas); disparo à mão com dependência aberta e limite atingido recusa pelo limite.
- Gate: `node --test tests/issue-claude-agent-select.test.js tests/issue-agent-select.test.js`, `npm run lint` e `node bin/ai-sync.js --check`.
- Modelo: padrao.
- Status: pendente.

### T3 [P] Conferência final aceita até 5 pull requests e um novo por execução

- O quê: a conferência final da Issue Claude Agent passa a aceitar até 5 pull requests do agente abertos, no máximo um novo por execução, e no caso de tamanho M exige só que nenhum pull request tenha sido aberto para a issue.
- Onde: `.github/workflows/issue-claude-agent.yml` (variável `MAX_AGENT_PULLS: 5` no `env` do trabalho `agent`, passos "Foto de antes" e "Conferência final") e `tests/issue-claude-agent-workflow.test.js`.
- Dev: Dev Ops.
- Depende de: nada (o nome e o valor estão fixados no Desenho).
- Reaproveita: a consulta paginada de pull requests do agente com soma por `awk`, a função `fail`, o cálculo de `pulls_for_issue`, os ajudantes `job` e `stepOf` do teste.
- Atende: RN-01, RN-02, RN-08; CA-14, CA-15, CA-16.
- Pronto quando: a Foto de antes grava a contagem de pull requests do agente; a conferência compara com `$MAX_AGENT_PULLS` e com a contagem de antes mais 1; o caso `Size: M` usa `pulls_for_issue` calculado antes do `case`; nenhum `-le 1` nem `-eq 0` sobre o total; nenhum `gh api` encadeado em pipe; a Limpeza não muda; o gate passa.
- Teste: teste de conteúdo do workflow. Primeiro o que deve falhar: "a conferência final limita o total ao MAX_AGENT_PULLS e a um pull request novo por execução" (procura `MAX_AGENT_PULLS`, a contagem de antes e a ausência de `-le 1`). Depois: "no tamanho M a conferência exige zero pull request desta issue, não zero no total"; "a foto de antes grava a contagem de pull requests do agente". Renomear o teste `...sem pull request se M` para dizer "desta issue".
- Gate: `node --test tests/issue-claude-agent-workflow.test.js tests/issue-automations.test.js`, `npm run lint` e `node bin/ai-sync.js --check`. O actionlint roda no CI.
- Modelo: padrao.
- Status: feita (commit 67ae0dc; 4 testes falharam antes da mudança; o teste "...sem pull request se M" foi renomeado para "...desta issue se M", como previsto; gate: lint ok, 413 testes passando e 0 falhando, ai-sync --check ok; o actionlint não rodou localmente porque não está instalado e fica para o CI).

### T4 [P] Teste de que o limite é o mesmo na seleção e na automação

- O quê: um teste confere que o valor de `MAX_AGENT_PULLS` do script de seleção é igual ao do workflow da Issue Claude Agent.
- Onde: `tests/issue-automations.test.js`.
- Dev: Dev Ops (pode ir para o executor).
- Depende de: T1 e T3.
- Reaproveita: o teste "a linha fixa do pull request é a mesma na seleção, no script e na automação" como modelo.
- Atende: RN-01; CA-14.
- Pronto quando: o teste passa e falha se um dos dois valores mudar sozinho; o gate passa.
- Teste: teste de conteúdo. Escreva-o e confirme que falha trocando o valor em um só lado numa cópia local, sem commitar a troca.
- Gate: `node --test tests/issue-automations.test.js`, `npm run lint` e `node bin/ai-sync.js --check`.
- Modelo: economico.
- Status: pendente.

### T5 [P] Documentação do limite e da dependência

- O quê: a seção do agente de issues no README passa a descrever o limite de 5, a espera por dependência e o que acontece no limite.
- Onde: `README.md`, seção "Agente de issues": o item da Issue Size Set que dispara o agente ("nenhum pull request do agente aberto" vira "menos de 5"), o item "Só trabalha em issue P..." ("só quando não há outro pull request do agente aberto"), o parágrafo do campo `issue` do disparo à mão (o motivo "já há um pull request do agente aberto" vira o do limite) e "Fila única e limites" ("Só há um pull request do agente aberto por vez"). O parágrafo "Pull request fechado sem merge" continua valendo (RN-07). Conferir o `.claude/CLAUDE.md` e o `CLAUDE.md` da raiz: nenhum cita o limite hoje, sem mudança esperada; se precisar, só o `.claude/CLAUDE.md` é editado à mão no `.claude/`.
- Dev: Dev Doc.
- Depende de: nada. A parte da dependência segue RN-05 a RN-05f e é conferida contra o comportamento final de T2 no gate da Fase 2.
- Reaproveita: o texto atual da seção e os textos do resumo fixados no Desenho.
- Atende: RN-05, RN-05a a RN-05f, RN-07, RN-09, RN-11; CA-20.
- Pronto quando: nenhuma frase da seção diz que só pode haver um pull request do agente aberto; o limite, a dependência (formas aceitas, só o corpo, o que é ignorado, todas precisam estar fechadas, recusa no disparo à mão), a volta à fila sem disparo na hora e o resumo no limite estão descritos em linguagem simples; o gate passa.
- Teste: nenhum (texto, sem comportamento).
- Gate: `npm run lint`, `node --test tests/team.test.js` e `node bin/ai-sync.js --check`.
- Modelo: economico.
- Status: feita (commit 9e7a8c1; gate: lint ok, 399 testes passando e 0 falhando, ai-sync --check ok; falta conferir o texto contra o comportamento final da T2; ajuste da revisão no commit d6b3299, com as sugestões 1 e 2 do Reviewer: quem conta no limite e "5 ou mais"; gate do ajuste: lint ok e ai-sync --check ok, npm test com 1 falha no teste do workflow do agente de issues, atribuída ao trabalho ainda sem commit da T3 e sem relação com o README; segundo ajuste da revisão no commit 38e4118, com a sugestão 3 do Reviewer: a conferência final reprova com mais de 5 pull requests do agente abertos ou com mais de um pull request novo; gate: lint ok, 414 testes passando e 0 falhando, ai-sync --check ok).

## Decisões

Respostas do usuário às dúvidas da primeira versão, já refletidas nas regras e nos critérios:

1. Só o corpo da issue conta para "depende de #n", sem comentários (RN-05a).
2. Valem "depende de", "depende do" e "depende da", sem diferenciar maiúsculas, e várias issues na mesma frase; todas precisam estar fechadas para a issue entrar na fila. Citação em trecho de código é ignorada, assim como outro repositório e a própria issue (RN-05b, RN-05c).
3. Disparo à mão de issue que espera dependência aberta é recusado com o motivo, depois das checagens do número e do limite (RN-05e).
4. Pull request aberto citado como "#n" não conta como dependência (RN-05d).
5. Basta a issue voltar para a fila quando a dependência fecha, sem disparar o agente na hora (RN-05f).
6. A classificação de tamanho dispara o agente sempre que houver menos de 5 pull requests do agente abertos (RN-11).

## Dúvidas

Nenhuma.
