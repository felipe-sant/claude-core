# Ajustes nas automações do agente de issues e do CI

> Status: aprovada
> Tipo: bug
> Tamanho: grande
> Branch: fix/agente-de-issues-automacoes
> Criada em: 2026-11-25

Issues: #98, #104, #94 e #100 de felipe-sant/claude-kit, nesta ordem. Um commit por issue e um único pull request ao fim, que fecha as quatro.

## Comportamento observado

- #98: toda execução das automações do repositório (verificação de pull request, fluxo do Claude, classificação de tamanho e agente de issues) mostra o aviso de que o Node.js 20 está obsoleto, porque as ações de baixar o código e de preparar o Node estão numa versão feita para ele.
- #104: o agente de issues não consegue editar o guia do Claude da pasta de configuração do time, o único arquivo dessa pasta escrito à mão. A edição é negada, o agente só comenta na issue e ela fica sem solução automática.
- #94: a conferência final do agente de issues reprova a execução quando o dono junta outro pull request enquanto o agente trabalha, com o erro "A branch principal mudou durante a execução", mesmo sem o agente ter mexido na principal. A classificação de tamanho tem a mesma checagem. Na classificação, a checagem "A lista de branches mudou durante a execução" também reprova quando o dono junta um pull request e a branch é apagada, ou quando cria uma branch.
- #100: quando a etapa do agente falha (por exemplo, por limite de uso do Claude), a execução fica vermelha, mas nenhuma mensagem diz com clareza a causa provável. A conferência final só mostra mensagens genéricas.

## Comportamento esperado

- #98: as execuções rodam sem o aviso do Node.js 20 e sem mudança de comportamento.
- #104: o agente de issues consegue alterar o guia do Claude quando a issue pede, e continua sem poder alterar o resto da pasta de configuração do time e a configuração de permissões.
- #94: a conferência aceita que a principal avance durante a execução, desde que o ponto em que ela estava antes continue na história dela. Ela só reprova se a principal perdeu esse ponto (história reescrita). Na classificação, branch nova ou apagada não reprova; só reprova a branch que existia antes e perdeu o ponto em que estava.
- #100: quando a etapa do agente falha, a execução mostra uma anotação de erro e um resumo dizendo que o agente falhou antes de concluir e que é para conferir o limite de uso do Claude e o log do passo do agente. O resto não muda.

## Impacto

- #98: hoje só polui as execuções e esconde avisos reais; quando o GitHub deixar de aceitar o Node 20, as automações podem parar.
- #104: toda issue que precisa mudar o guia do Claude fica para alguém fazer à mão.
- #94: alarme falso, mais frequente quanto mais ativo o dono estiver; esconde falhas reais.
- #100: quem olha a execução precisa descobrir a causa sozinho no log.

## Como reproduzir

1. #98: abrir qualquer execução recente de uma das quatro automações e ver o aviso de Node.js 20 nas anotações.
2. #104: dar ao agente de issues uma issue P que peça mudança no guia do Claude. A edição é negada e o agente comenta na issue. Caso real: execução 45705884116, da issue #91.
3. #94: disparar a Issue Claude Agent e, enquanto ela roda, juntar outro pull request na principal. A conferência final reprova.
4. #100: fazer a etapa do agente falhar (por exemplo, sem cota do Claude). A execução fica vermelha só com as mensagens genéricas da conferência final.

## Evidência

- Issues #98, #104, #94 e #100, com os relatos.
- #98, conferido pelo usuário na fonte oficial: a versão estável mais recente de baixar o código é a 7.0.1 e a de preparar o Node é a 7.1.0, ambas com a marca geral 7 e feitas para o Node 24. Nenhuma automação usa o registro de pacotes com credencial nem o campo de gerenciador de pacotes, então as mudanças da versão 7 de preparar o Node (credencial do registro e cache automático) não afetam o repositório.
- #104, confirmado nesta especificação:
  - Na execução 45705884116, a única negação foi a edição do guia do Claude. O motivo registrado é "negado porque o Claude Code roda em modo sem perguntar". A lista de proibições da automação não cita a pasta de configuração, e a edição de arquivos já está liberada.
  - Ou seja, o bloqueio não é uma regra da automação: é uma proteção própria do Claude Code sobre a pasta de configuração, que pede confirmação para qualquer escrita nela. Sem ninguém para confirmar, ela vira negação.
  - Experimento local com o Claude Code 2.1.332, em repositório descartável e no mesmo modo da automação: liberar a edição só do guia do Claude não destrava, em nenhuma das quatro formas de escrever o caminho. Também não destravam um gancho de pré-uso que aprova o arquivo (confirmado que o gancho rodou e devolveu a aprovação, e a edição foi negada mesmo assim) nem o modo que aceita edições. A cópia para dentro da pasta por comando do terminal também é negada.
  - No mesmo experimento, um comando liberado que roda um script próprio grava o guia do Claude normalmente. É o mesmo caminho pelo qual a sincronização, já liberada ao agente, grava hoje os arquivos gerados dessa pasta.
- #94: a conferência guarda o ponto da principal antes e o compara com o de depois; qualquer diferença reprova. Na classificação de tamanho, o código é baixado só com o último ponto da história, então uma conferência pela história local exigiria buscar a história; a consulta de comparação do GitHub responde sem isso.
- #100: a conferência final já reprova com "A etapa do agente terminou sem sucesso", sem apontar causa.

## Causa suspeita

- #98: confirmada pela leitura das quatro automações, que usam a versão 4 das duas ações.
- #104: confirmada pelo experimento: a proteção própria do Claude Code sobre a pasta de configuração não é liberada por nenhuma regra de permissão no modo sem perguntar.
- #94: confirmada pela leitura: a conferência exige igualdade da principal antes e depois.
- #100: confirmada pela leitura: não há passo que avise a causa provável quando o agente falha.

## Regras

- RN-01: As ações de baixar o código e de preparar o Node passam para a marca geral 7 (a versão estável mais recente feita para o Node 24), nas quatro automações. A versão do Node usada nos passos (22) e o cache continuam como estão. A ação de publicar arquivos e a ação do Claude ficam fora. Fonte: usuário (#98).
- RN-02: O agente de issues passa a poder alterar o guia do Claude da pasta de configuração do time, e só ele. Fonte: usuário (#104).
- RN-03: Os demais arquivos da pasta de configuração do time (os gerados) e as configurações de permissão continuam sem poder ser alterados à mão pelo agente. Os gerados continuam mudando só pelas fontes e pela sincronização. Fonte: usuário (#104).
- RN-04: A conferência da principal, no agente de issues e na classificação de tamanho, aceita que a principal avance durante a execução e só reprova se o ponto em que ela estava antes deixou de fazer parte da história dela. Fonte: usuário (#94).
- RN-05: A conferência da principal não usa o autor das mudanças como critério e não exige que cada mudança nova tenha vindo de pull request: basta a principal ter avançado sem perder a história antiga. Fonte: issue #94 e usuário (D-2).
- RN-06: Quando a etapa do agente de issues falha ou é cancelada enquanto roda, a execução mostra, como anotação de erro e no resumo, a mensagem "O agente falhou antes de concluir: confira o limite de uso do Claude e o log do passo do agente.", sem depender do texto do erro. Fonte: usuário (D-4) e issue #100.
- RN-07: O resto do comportamento na falha do agente não muda: sem pull request, a limpeza da branch continua e a conferência final continua reprovando. Quando o agente conclui com sucesso, ou quando a etapa do agente nem chega a rodar porque um passo anterior falhou, nenhuma mensagem nova aparece. Fonte: issue #100 e usuário (D-4).
- RN-08: A mensagem de falha vale só para o agente de issues; a classificação de tamanho fica de fora, porque a issue #100 trata só do agente de issues. Fonte: usuário (#100).
- RN-09: A conferência das branches da classificação de tamanho aceita as mudanças legítimas do dono durante a execução: branch nova criada e branch apagada (por exemplo, depois de juntar um pull request) não reprovam. Ela só reprova se uma branch que existia antes e continua existindo mudou de ponto sem ser avanço, ou seja, perdeu o ponto em que estava antes. Fonte: usuário (D-3).

## Permissões do agente de issues (para revisão atenta)

Esta seção trata só da #104 e é o ponto que mais pede atenção do usuário.

O que fica liberado:

- Alterar o guia do Claude da pasta de configuração do time, e só esse arquivo, por um único comando novo, com nome fixo e sem argumentos. O comando copia para o guia um texto que o agente prepara antes na pasta temporária da execução, que ele já pode escrever hoje.
- Nada mais é liberado: a lista de ferramentas ganha só esse comando.

O que continua bloqueado:

- Os demais arquivos da pasta de configuração do time (agentes, regras, skills, registro da instalação): a proteção do Claude Code continua valendo para eles, e o comando novo só escreve no guia do Claude, em caminho fixo.
- A edição à mão das configurações de permissão dessa pasta: continua protegida pelo Claude Code e o comando novo nunca as toca.
- A lista de proibições não muda e continua igual nas duas automações.
- A sincronização, já liberada, continua sendo o único caminho para os arquivos gerados.

O que já existe hoje e esta tarefa não muda: como o agente pode alterar as fontes e rodar a sincronização, ele já consegue mudar indiretamente a configuração gerada da pasta, inclusive a de permissões, alterando o modelo de configuração de origem e sincronizando. Esse caminho passa pela revisão do pull request e fica como está.

Por que não basta uma regra de permissão: o experimento mostrou que, no modo sem perguntar, nenhuma regra de liberação vence a proteção do Claude Code sobre essa pasta. "Proibição vence liberação" não se aplica, porque não há proibição a trocar.

Este caminho exige mexer, além da automação, nas instruções do agente e num script novo da automação do agente de issues, o que vai além do "só workflows" combinado inicialmente. Caminho aprovado pelo usuário (D-1).

## Critérios de aceite

- CA-01: QUANDO qualquer uma das quatro automações roda ENTÃO o sistema DEVE usar a versão 7 das ações de baixar o código e de preparar o Node, sem o aviso de Node.js 20 obsoleto. (RN-01)
- CA-02: QUANDO a verificação de pull request roda depois da troca de versão ENTÃO o sistema DEVE continuar rodando o lint, os testes e a checagem das automações, com o mesmo resultado de antes. (RN-01)
- CA-03: QUANDO as automações rodam depois da troca de versão ENTÃO o sistema DEVE manter o mesmo comportamento de antes: mesmo Node 22, mesmo cache onde já havia, mesma forma de baixar o código (história inteira onde já era, sem guardar credenciais onde já não guardava). (RN-01)
- CA-04: QUANDO a issue P pede uma mudança no guia do Claude ENTÃO o agente de issues DEVE conseguir alterá-lo e abrir o pull request pelo fluxo normal. (RN-02)
- CA-05: QUANDO o agente de issues tenta alterar à mão outro arquivo da pasta de configuração do time ou uma configuração de permissão ENTÃO o sistema DEVE negar a alteração, como hoje. (RN-03)
- CA-06: QUANDO o comando novo é chamado sem o texto preparado, ou com o texto vazio ENTÃO o sistema DEVE recusar sem alterar o guia do Claude e dizer o motivo. (RN-02)
- CA-07: QUANDO o comando novo é chamado ENTÃO o sistema DEVE escrever só no guia do Claude, nunca em outro arquivo, qualquer que seja o conteúdo do texto preparado. (RN-02, RN-03)
- CA-08: QUANDO as instruções do agente de issues são lidas ENTÃO elas DEVEM dizer que o guia do Claude é a única exceção, e como alterá-lo (preparar o texto e rodar o comando novo). (RN-02, RN-03)
- CA-09: QUANDO a principal avança durante a execução, por pull request juntado ENTÃO a conferência final do agente de issues e a da classificação de tamanho NÃO DEVEM reprovar por causa da principal. (RN-04, RN-05)
- CA-10: QUANDO a principal não muda durante a execução ENTÃO as duas conferências DEVEM seguir aprovando a principal, como hoje. (RN-04)
- CA-11: QUANDO a principal perde o ponto em que estava antes da execução (história reescrita ou ponto antigo fora da história) ENTÃO as duas conferências DEVEM reprovar com uma mensagem que diga isso. (RN-04)
- CA-12: QUANDO a consulta que compara a principal de antes e de depois falha ENTÃO a conferência DEVE falhar de forma visível, sem aprovar a principal em silêncio. (RN-04)
- CA-13: QUANDO a etapa do agente de issues falha, ou a execução é cancelada enquanto essa etapa roda, ENTÃO o sistema DEVE mostrar a mensagem da RN-06 como anotação de erro e no resumo da execução, qualquer que seja o texto do erro. (RN-06)
- CA-14: QUANDO a etapa do agente de issues falha ENTÃO o sistema DEVE continuar sem abrir pull request, fazendo a limpeza da branch e reprovando na conferência final, como hoje. (RN-07)
- CA-15: QUANDO a etapa do agente de issues termina com sucesso, ou nem chega a rodar porque um passo anterior falhou ou porque a execução foi cancelada antes dela ENTÃO o sistema NÃO DEVE mostrar a mensagem da RN-06. (RN-07)
- CA-16: QUANDO a classificação de tamanho falha ENTÃO o sistema NÃO DEVE mostrar a mensagem da RN-06. (RN-08)
- CA-17: QUANDO, durante a classificação de tamanho, o dono cria uma branch nova ou apaga uma branch (por exemplo, ao juntar um pull request) ENTÃO a conferência final NÃO DEVE reprovar por causa das branches. (RN-09)
- CA-18: QUANDO, durante a classificação de tamanho, uma branch que existia antes e continua existindo só avança ENTÃO a conferência final NÃO DEVE reprovar por causa dela. (RN-09)
- CA-19: QUANDO, durante a classificação de tamanho, uma branch que existia antes e continua existindo perde o ponto em que estava antes (história reescrita) ENTÃO a conferência final DEVE reprovar com uma mensagem que diga qual branch foi. (RN-09)
- CA-20: QUANDO as branches não mudam durante a classificação de tamanho ENTÃO a conferência final DEVE seguir aprovando as branches, como hoje. (RN-09)

## Critérios de sucesso

- As execuções das quatro automações saem sem o aviso de Node.js 20.
- Uma issue que pede mudança no guia do Claude vira pull request sem ajuda manual.
- Juntar pull request durante a execução do agente deixa de gerar falha falsa.
- Uma falha da etapa do agente aponta, na própria execução, para o limite de uso e para o log do passo.
- O lint, os testes e a checagem das automações do CI continuam passando.

## Fora do escopo

- A ação de publicar arquivos e a ação do Claude (RN-01).
- A verificação de que cada mudança nova da principal veio de pull request juntado (RN-05, decidido pelo usuário): a proteção da principal já exige pull request, e a consulta de associação entre mudança e pull request pode atrasar logo depois do merge, o que traria de volta o alarme falso.
- A mensagem de falha na classificação de tamanho (RN-08).
- O sincronizador e os testes dele, tratados por outro dev na issue #92. As tarefas daqui só mexem nos testes das automações e num arquivo de teste novo, nunca nos testes do sincronizador.

## Desenho

- Versões (#98): nas quatro automações, a marca da versão das duas ações passa de 4 para 7, sem mexer nas opções de cada uso. A troca é conferida por um teste novo, que lê as quatro automações e exige a marca 7 nas duas ações e nenhuma marca 4 delas.
- Guia do Claude (#104), caminho aprovado pelo usuário (D-1):
  - O agente grava o texto completo do novo guia num arquivo de nome fixo na pasta temporária do contexto da execução, que ele já escreve hoje com a ferramenta de escrita.
  - Um script novo da automação do agente de issues, sem argumentos, lê esse arquivo e o copia para o guia do Claude na raiz do repositório. Recusa arquivo ausente ou vazio, com mensagem. O caminho de destino é fixo no script.
  - A lista de ferramentas liberadas do agente ganha só a chamada exata desse script. A lista de proibições não muda, para continuar igual nas duas automações.
  - As instruções do agente explicam a exceção e o passo a passo, e continuam dizendo que o resto da pasta é gerado.
- Principal (#94): a foto de antes continua guardando o ponto da principal. Na conferência, a automação pega o ponto atual e pede ao GitHub a comparação entre os dois, gravando a resposta em arquivo antes de ler (os testes proíbem encadear a consulta com outro comando). Aprova quando a comparação diz que são iguais ou que a principal só avançou; reprova em qualquer outro caso, com a mensagem nova. A falha da consulta derruba o passo. Vale igual nas duas automações.
- Branches da classificação (D-3, junto com a #94): a foto de antes já grava todas as branches com o ponto de cada uma. Na conferência, a automação lê de novo a lista e cruza as duas por nome. Branch só na lista de antes (apagada) ou só na de depois (nova) é aceita. Para cada branch presente nas duas com ponto diferente, pede ao GitHub a comparação entre o ponto de antes e o de depois, grava em arquivo e aprova só `identical` ou `ahead`; qualquer outro valor reprova citando a branch. A principal entra nessa mesma regra. Risco aceito: um envio forçado do próprio dono numa branch dele durante a classificação reprova a execução; é raro e é o mesmo caso que a regra quer pegar. A classificação já não tem permissão de escrita no conteúdo do repositório, então não consegue criar nem mudar branch.
- Falha do agente (#100): um passo novo, logo depois da etapa do agente, roda só quando ela falhou ou foi cancelada enquanto rodava (condição `always()` mais resultado da etapa igual a falha ou cancelado), escreve a anotação de erro e acrescenta a mesma frase ao resumo da execução. O passo não muda o resultado da execução e não depende do texto do erro. A conferência final continua com a reprovação que já tem.
- Cancelamento (#100): quando uma execução é cancelada, o GitHub interrompe o passo em andamento, que fica com resultado cancelado, e ainda roda os passos seguintes que usam `always()`; os demais ficam como pulados. Por isso a condição precisa de `always()`. Passos que ainda não tinham começado, como a etapa do agente cancelada antes de rodar, ficam como pulados e não disparam a mensagem. Limite registrado: se o cancelamento for forçado, ou se o prazo do GitHub para encerrar a execução cancelada se esgotar, os passos com `always()` deixam de rodar e a mensagem não aparece. Isso se confirma no disparo real (passo 6 da validação).

## Plano de execução

Todas as tarefas mexem na automação do agente de issues e nos mesmos testes, e o dev é um só. Por isso nenhuma é `[P]` e a ordem é a das issues.

- Fase 1 (sequencial): T1 → T2 → T3 → T4.
- Gate de fase, ao fim da fase e antes do reviewer: `npm run lint`, `npm test` (suíte inteira), `node bin/ai-sync.js --check` e o actionlint na versão fixada pelo CI. Não há build, typecheck nem formatador no projeto.

Validação em execução real, passo do usuário, fora do gate:

1. Depois do pull request aberto, conferir na verificação de pull request que lint, testes e checagem das automações passam sem o aviso de Node.js 20.
2. Disparar à mão a Issue Size Set e a Issue Claude Agent na branch do pull request (Run workflow escolhendo a branch, ou pela linha de comando com a branch indicada) e conferir que não há o aviso.
3. Durante a execução da Issue Claude Agent, juntar um pull request qualquer na principal e conferir que a conferência final não reprova pela principal.
4. Para o guia do Claude, abrir uma issue P de teste que peça uma mudança pequena nele e disparar a Issue Claude Agent com o número dela.
5. Para a conferência das branches da classificação, durante uma execução da Issue Size Set, juntar um pull request apagando a branch e conferir que a conferência não reprova.
6. Para a mensagem de falha, cancelar uma execução da Issue Claude Agent durante o passo do agente e conferir a anotação e o resumo. Para a falha, a forma mais simples é esperar a próxima falha real da etapa do agente. Uma alternativa não verificada aqui é disparar na branch do pull request com um commit temporário que derrube a etapa do agente.

## Tarefas

### T1: Atualiza as ações de baixar o código e de preparar o Node para a versão 7 (#98)

- O quê: troca a versão 4 pela 7 das duas ações nas quatro automações e ajusta os testes que fixam a versão.
- Onde: `.github/workflows/ci.yml`, `.github/workflows/claude.yml`, `.github/workflows/issue-size-set.yml`, `.github/workflows/issue-claude-agent.yml`; `tests/issue-claude-agent-workflow.test.js` e `tests/issue-size-set-workflow.test.js` (testes do checkout que citam `actions/checkout@v4`); teste novo `tests/workflow-actions-version.test.js`.
- Dev: dev-devops.
- Depende de: nada.
- Reaproveita: `readWorkflow` de `tests/issue-workflow-helpers.js` e `repoRoot` de `tests/helpers.js`.
- Atende: RN-01; CA-01, CA-02, CA-03.
- Pronto quando: as quatro automações usam `actions/checkout@v7` e `actions/setup-node@v7`, com as mesmas opções de antes; nenhuma usa `@v4` dessas duas ações; `actions/upload-artifact@v4` e a ação do Claude não mudam; gate passando; commit `Fix :bug: [#98] ...`.
- Teste: unitário. Falha primeiro o teste novo que exige a marca 7 nas duas ações das quatro automações e nenhuma marca 4 delas, e os testes do checkout ajustados para `@v7`.
- Gate: `npm test`, `npm run lint`, `node bin/ai-sync.js --check` e actionlint 1.7.12 baixado pelo mesmo script fixado no CI para a pasta temporária. Sem typecheck nem formatador no projeto.
- Modelo: economico.
- Status: pendente.

### T2: Libera ao agente de issues só a alteração do guia do Claude (#104)

- O quê: cria o comando que copia o texto preparado pelo agente para o guia do Claude, libera só esse comando ao agente e explica a exceção nas instruções.
- Onde: script novo em `.github/issue-agent/` (por exemplo, `apply-claude-guide.js`); `--allowedTools` do passo `claude` em `.github/workflows/issue-claude-agent.yml`; `.github/issue-agent/agent-prompt.md`; `tests/issue-claude-agent-workflow.test.js`, `tests/issue-claude-agent-prompt.test.js` e teste novo do script em `tests/`.
- Dev: dev-devops.
- Depende de: T1.
- Reaproveita: o padrão dos scripts de `.github/issue-agent/` (como `open-pull-request.js`) e dos testes deles; a pasta do contexto que o agente já escreve (`runner.temp`/`issue-agent`). O `CONTEXT_DIR` não existe no ambiente do passo `claude`, então o script monta o caminho de origem a partir de `RUNNER_TEMP` (`$RUNNER_TEMP/issue-agent/<arquivo fixo>`), e as instruções citam o caminho completo do arquivo em "Valores desta execução", como já fazem com a descrição do pull request. A frase que `tests/issue-claude-agent-prompt.test.js` já exige ("O `.claude/CLAUDE.md` é o único arquivo do `.claude/` editado à mão") continua nas instruções.
- Atende: RN-02, RN-03; CA-04, CA-05, CA-06, CA-07, CA-08.
- Pronto quando: o script, sem argumentos, copia o arquivo preparado de nome fixo da pasta do contexto para `.claude/CLAUDE.md` e recusa arquivo ausente ou vazio, sem tocar no guia; o destino é fixo e nenhum outro arquivo é escrito; `--allowedTools` do agente ganha só a chamada exata do script; `--disallowedTools` não muda e segue igual nas duas automações; as instruções dizem como alterar o guia e que o resto da pasta segue gerado; gate passando; commit `Fix :bug: [#104] ...`.
- Teste: unitário. Falham primeiro: o teste do script (copia o texto preparado para o guia; recusa ausente e vazio sem alterar o guia; nunca escreve fora do guia), o teste da automação que exige a chamada exata do script entre as liberadas e nenhuma liberação nova de edição na pasta, e o teste das instruções que exige o passo a passo da exceção.
- Gate: o mesmo de T1.
- Modelo: padrao.
- Status: pendente.

### T3: Aceita a principal e as branches avançarem durante a execução (#94)

- O quê: troca a comparação de igualdade da principal por uma comparação pelo GitHub que aceita a principal igual ou à frente do ponto de antes, nas duas automações, e troca a comparação da lista inteira de branches da classificação por uma que aceita branch nova e apagada e só reprova branch que perdeu o ponto de antes.
- Onde: passo "Conferência final" de `.github/workflows/issue-claude-agent.yml` e de `.github/workflows/issue-size-set.yml`; `tests/issue-claude-agent-workflow.test.js` e `tests/issue-size-set-workflow.test.js`.
- Dev: dev-devops.
- Depende de: T1 (mesmos arquivos; ordem no Plano de execução).
- Reaproveita: a foto de antes que já grava o ponto da principal em `$CHECK_DIR/main` e, na classificação, todas as branches com o ponto em `$CHECK_DIR/branches`, a função `fail` e o padrão de gravar a saída do `gh api` em arquivo antes de ler.
- Atende: RN-04, RN-05, RN-09; CA-09, CA-10, CA-11, CA-12, CA-17, CA-18, CA-19, CA-20.
- Pronto quando: as duas conferências consultam `repos/$GITHUB_REPOSITORY/compare/<antes>...<depois>`, gravam o `status` em arquivo e só aprovam `identical` ou `ahead`; qualquer outro valor reprova com mensagem nova que diga que a principal perdeu o ponto de antes; a frase "A branch principal mudou durante a execução" não existe mais; na classificação, a frase "A lista de branches mudou durante a execução" não existe mais, branch nova e apagada não reprovam, e cada branch presente antes e depois com ponto diferente passa pela mesma comparação, reprovando com o nome da branch fora de `identical` ou `ahead`; nenhuma checagem usa autor; nenhuma consulta é encadeada com pipe; gate passando; commit `Fix :bug: [#94] ...`.
- Teste: unitário. Falham primeiro os testes das duas automações que exigem a comparação pelo GitHub, a aceitação de `identical` e `ahead`, a mensagem nova e a ausência da mensagem antiga, e os da classificação que exigem a comparação por branch, a mensagem com o nome da branch e a ausência da frase da lista de branches.
- Gate: o mesmo de T1.
- Modelo: padrao.
- Status: pendente.

### T4: Mostra a causa provável quando a etapa do agente falha (#100)

- O quê: acrescenta um passo que, só quando a etapa do agente falha ou é cancelada enquanto roda, escreve a anotação de erro e o resumo com a mensagem da RN-06.
- Onde: trabalho `agent` de `.github/workflows/issue-claude-agent.yml`; `tests/issue-claude-agent-workflow.test.js`.
- Dev: dev-devops.
- Depende de: T3 (mesmos arquivos).
- Reaproveita: o `id: claude` da etapa do agente e o padrão de passos com `if: always()`.
- Atende: RN-06, RN-07, RN-08; CA-13, CA-14, CA-15, CA-16.
- Pronto quando: há um passo logo depois da etapa do agente com a condição `always() && (steps.claude.outcome == 'failure' || steps.claude.outcome == 'cancelled')`, que escreve `::error::` e acrescenta ao `$GITHUB_STEP_SUMMARY` a frase "O agente falhou antes de concluir: confira o limite de uso do Claude e o log do passo do agente.", sem ler o texto do erro e terminando com sucesso; a abertura do pull request, a limpeza e a conferência final ficam como estão; a classificação de tamanho não muda; gate passando; commit `Fix :bug: [#100] ...`.
- Teste: unitário. Falham primeiro os testes que exigem o passo novo depois da etapa do agente e antes do relatório, a condição com `always()` que aceita só falha e cancelado (nunca sucesso nem pulado), a frase exata na anotação e no resumo, e a ausência da frase na classificação de tamanho.
- Gate: o mesmo de T1.
- Modelo: economico.
- Status: pendente.

## Dúvidas

Nenhuma. As respostas do usuário viraram regra: D-1 (caminho do script da #104, seção de permissões e T2), D-2 (RN-05), D-3 (RN-09 e T3) e D-4 (RN-06, RN-07 e T4).
