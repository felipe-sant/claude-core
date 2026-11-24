# Hook de pre-commit grava o .claude desatualizado ou de outro agente no commit que escolhe os arquivos

> Status: em-andamento
> Tipo: bug
> Tamanho: media
> Branch: fix/60-hook-trava-desatualizado
> Criada em: 2026-11-23

Issue: #60 de felipe-sant/claude-kit.

## Comportamento observado

Antes de cada commit, o hook do repositório gera de novo a cópia do time (a pasta de agentes, regras, skills, configuração e o registro de versões, o "lock") e põe essa cópia no commit. Ele gera a cópia a partir do que está na pasta de trabalho, e não do que vai de fato no commit.

Quando o commit escolhe os arquivos (o jeito de commitar que a regra de git exige quando há vários agentes na mesma pasta) e outro agente tem fontes alteradas e ainda não commitadas na pasta:

- o commit leva a cópia gerada a partir das fontes do outro agente, sem levar essas fontes;
- o commit fica com a cópia fora de sincronia com as fontes commitadas: gerar a cópia de novo a partir desse commit dá diferença, e o teste de sincronização do CI reprova;
- o commit leva arquivos que são do trabalho de outro agente;
- depois do commit, o stage real fica com uma versão antiga dos arquivos gerados (o arquivo aparece ao mesmo tempo como alterado no stage e na pasta).

## Comportamento esperado

O hook nunca deixa sair um commit com a cópia do time fora de sincronia com as fontes que estão no commit, e nunca põe no commit, por conta própria, arquivos que quem commita não pediu. No commit que escolhe os arquivos, se a cópia gerada não estiver atualizada e incluída, o hook recusa o commit e orienta, em português, a rodar o sync, incluir os arquivos gerados nos caminhos do commit e commitar de novo. A mensagem de recusa também orienta o caso de outro agente com fonte alterada na pasta: esperar o dono commitar ou trabalhar em uma worktree isolada. No commit sem caminhos, a conferência acontece antes de o hook adicionar qualquer coisa; se recusar, o stage fica como estava. Se o commit não toca fonte nem arquivo gerado e o último commit está em sincronia, o hook não recusa nem adiciona nada. Se o último commit já estiver fora de sincronia, o hook recusa até um commit que não toca fonte, e a mensagem diz como corrigir.

## Impacto

- Qualquer agente do time que commita por caminhos enquanto outro agente trabalha na mesma pasta.
- O CI reprova o PR pelo teste de sincronização, e o histórico ganha commits com arquivos de outro agente, difíceis de separar sem reescrever o histórico.

## Como reproduzir

Reproduzido com git 2.53.

1. Em uma cópia do repositório com o hook ligado, altere a fonte A (por exemplo, o texto de um agente) e a fonte B (outro agente), sem commitar nenhuma.
2. Commite escolhendo só o caminho da fonte A.
3. Resultado: o commit leva a fonte A mais a cópia gerada e o lock calculados com A e B juntos; a fonte B fica fora. Gerar a cópia de novo a partir desse commit dá diferença.
4. Variação confirmada na worktree da #56: o outro dev tinha fontes alteradas e não commitadas, e o commit por caminho de outro agente, só da especificação (arquivo que não é fonte), levou 6 arquivos gerados do trabalho dele, sem as fontes.

Não reproduzido (o commit sai certo): commit por caminho de uma fonte sozinha sem outras alterações na pasta, commit da fonte com os gerados nos caminhos, dois commits seguidos e amend.

## Evidência

- Reprodução descrita acima, relatada pela orchestrator.
- Caso real na worktree da #56: 6 arquivos gerados de outro agente entraram no commit de uma especificação.
- Leitura do hook atual: ele regenera a cópia a partir da pasta e adiciona os gerados ao stage em uso. No commit que escolhe os arquivos, o git usa um stage temporário só para aquele commit; o hook adiciona os gerados nesse stage temporário.

## Causa suspeita

Hipótese: o hook gera a cópia a partir da pasta de trabalho (que inclui o trabalho não commitado de outros agentes) e não a partir do que está no stage do commit, e põe o resultado no stage temporário do commit que escolhe os arquivos. O stage real recebe só os caminhos pedidos, por isso fica com a versão antiga dos gerados.

Hipótese: o caso relatado originalmente na issue (lock com o registro antigo) é uma variação do mesmo problema.

## Regras

- RN-01: No commit que escolhe os arquivos, o hook nunca adiciona nada ao commit. Fonte: usuário.
- RN-02: O hook atualiza a cópia do time na pasta de trabalho e, se o commit não levar os gerados atualizados e coerentes com as fontes do commit, recusa o commit com mensagem clara em português: rodar o sync, incluir os arquivos gerados nos caminhos do commit e commitar de novo. Fonte: usuário.
- RN-03: A coerência é conferida a partir do que está no stage do commit, nunca a partir da pasta de trabalho. Fonte: usuário (via orchestrator).
- RN-04: O commit sem caminhos continua adicionando os gerados como hoje, e passa pela mesma conferência. Fonte: usuário.
- RN-05: Commit que não toca fonte nem arquivo gerado, com o último commit em sincronia, não é recusado nem recebe nada do hook. Exceção: se o último commit já estiver fora de sincronia, o hook recusa também esse commit, e a mensagem diz que o último commit está fora de sincronia e como corrigir. Fonte: orchestrator, a partir do caso da #56; a exceção é resposta do usuário à dúvida sobre o último commit fora de sincronia.
- RN-06: O formato do lock, o comportamento do sync e o texto da regra de git não mudam nesta tarefa. Fonte: usuário.
- RN-07: A mensagem de recusa cita também o caso de outro agente com fonte alterada na pasta: esperar o dono commitar ou trabalhar em uma worktree isolada. Fonte: usuário, resposta à dúvida sobre a mensagem.
- RN-08: No commit sem caminhos, a conferência roda antes de o hook adicionar os gerados. Se recusar, o stage fica exatamente como estava e nada é adicionado. Fonte: usuário, resposta à dúvida sobre o commit sem caminhos.
- RN-09: Se o sync falhar durante o commit, o hook recusa o commit com uma mensagem em português que diz que o sync falhou e o que conferir. Fonte: usuário, decisão após a revisão.

## Critérios de aceite

- CA-01: QUANDO alguém faz um commit que escolhe os arquivos, alterando uma fonte, sem incluir os gerados atualizados ENTÃO o sistema DEVE recusar o commit com a mensagem em português que manda rodar o sync, incluir os gerados nos caminhos e commitar de novo, listando os arquivos fora de sincronia, e nada é commitado. Para arquivo gerado novo, a mensagem lembra de adicioná-lo antes pelo caminho exato, como manda a regra de git. (RN-01, RN-02, RN-03)
- CA-02: QUANDO alguém faz um commit que escolhe os arquivos, com a fonte alterada e os gerados atualizados nos caminhos ENTÃO o sistema DEVE aceitar o commit, e gerar a cópia de novo a partir desse commit não dá diferença. (RN-02, RN-03)
- CA-03: QUANDO alguém faz um commit sem escolher arquivos, com as fontes da pasta iguais às do stage ENTÃO o sistema DEVE aceitar o commit, incluir os gerados atualizados como hoje, e o commit fica em sincronia. (RN-04)
- CA-04: QUANDO alguém faz um commit sem escolher arquivos e há fonte alterada na pasta que não está no stage ENTÃO o sistema DEVE recusar o commit com a mesma mensagem, porque os gerados ficariam fora de sincronia com o que vai no commit. (RN-03, RN-04)
- CA-05: QUANDO um agente faz um commit que escolhe só a fonte A, e outro agente tem a fonte B alterada e não commitada na pasta ENTÃO o sistema DEVE recusar o commit, sem levar nenhum gerado nem a fonte B. (RN-01, RN-02, RN-03)
- CA-06: QUANDO um agente faz um commit que escolhe só um arquivo que não é fonte nem gerado (como a especificação), com o último commit em sincronia, e outro agente tem fontes alteradas e não commitadas na pasta ENTÃO o sistema DEVE aceitar o commit só com esse arquivo, sem nenhum arquivo da cópia do time e sem recusar. (RN-01, RN-05)
- CA-07: QUANDO um commit que escolhe os arquivos termina ENTÃO o stage real NÃO DEVE ficar com versões antigas dos arquivos gerados (nada aparece no stage que quem commitou não pediu). (RN-01)
- CA-08: QUANDO o commit é feito dentro de uma worktree vinculada (o jeito que o time trabalha) ENTÃO o sistema DEVE se comportar como nos critérios CA-01 a CA-06. (RN-01 a RN-05)
- CA-09: QUANDO o hook recusa um commit, com ou sem caminhos ENTÃO o sistema NÃO DEVE deixar arquivos temporários para trás nem alterar o stage. (RN-01, RN-04)
- CA-11: QUANDO o hook recusa um commit ENTÃO a mensagem DEVE orientar também o caso de outro agente com fonte alterada na pasta: esperar o dono commitar ou trabalhar em uma worktree isolada. (RN-07)
- CA-12: QUANDO alguém faz um commit sem escolher arquivos e o hook o recusa ENTÃO o stage DEVE ficar exatamente como estava antes do commit, sem nenhum arquivo gerado adicionado. (RN-04, RN-08)
- CA-13: QUANDO o último commit já está fora de sincronia e alguém faz um commit que não toca fonte nem arquivo gerado (como a especificação) ENTÃO o sistema DEVE recusar o commit com uma mensagem que diz que o último commit está fora de sincronia e como corrigir, e nada é commitado. (RN-05)
- CA-10: QUANDO a tarefa termina ENTÃO o lint e a suíte de testes do projeto DEVEM passar, incluindo o teste que já existe do hook (o hook continua rodando o sync e adicionando a cópia do time no commit sem caminhos). (RN-04, RN-06)
- CA-14: QUANDO a suíte de testes roda ENTÃO o teste que confere as pastas temporárias do hook DEVE usar uma pasta temporária só dele e falhar se sobrar nela qualquer arquivo ou pasta depois de commits aceitos e recusados. (CA-09)
- CA-15: QUANDO o teste da recusa do commit sem caminhos roda ENTÃO ele DEVE comparar o stage antes e depois também pela lista completa dos arquivos preparados, com a versão de cada um, além da lista de alterações. (RN-08, CA-12)
- CA-16: QUANDO o sync falha durante o commit, com ou sem caminhos ENTÃO o sistema DEVE recusar o commit com uma mensagem em português que diz que o sync falhou e o que conferir, sem commitar nada, sem alterar o stage e sem deixar pastas temporárias. (RN-01, RN-08, RN-09)
- CA-17: QUANDO a branch vai para o pull request ENTÃO ela DEVE estar atualizada com a main por merge (sem reescrever o histórico), com o lint e a suíte passando depois do merge. (decisão do usuário, após a revisão)

## Critérios de sucesso

- Nenhum commit que escolhe os arquivos chega ao HEAD com a cópia do time fora de sincronia com as fontes commitadas.
- Nenhum commit leva arquivo gerado do trabalho de outro agente.
- O teste de sincronização do CI deixa de reprovar por esse motivo.

## Limite conhecido

Quando dois agentes mexem em fontes ao mesmo tempo na mesma pasta, o lock é um só e já reflete as duas alterações. Por isso, o agente A não consegue montar, na pasta compartilhada, gerados coerentes só com a fonte dele: incluir os gerados da pasta também é recusado. A recusa é o comportamento esperado. Para passar, o agente A espera o dono da fonte B commitar (e então roda o sync e commita a fonte com os gerados), ou trabalha em uma worktree isolada, como manda a regra de git. Commits que não tocam fonte (como a especificação) passam normalmente (CA-06).

## Fora do escopo

- Mudar o formato do lock ou o comportamento do sync: decisão do usuário (RN-06).
- Desistir do commit que escolhe os arquivos: é a regra do time com vários agentes.
- Mudar o texto da regra de git: fica como pendência para depois da #56.

## Como desfazer

Reverter os commits da tarefa (`git revert`) volta o hook ao comportamento anterior, sem efeito em outros arquivos: nada muda no sync, no lock nem nos repositórios que recebem o time, porque o hook só existe neste repositório.

## Plano de execução

- Fase 1 (paralelo): T1 [P] e T2 [P]. Gate de fase rodado uma vez (`npm run lint` ok, `npm test` 121/121, `node bin/ai-sync.js --check` ok e sync em pasta temporária ok), mas a fase foi reaberta pela revisão (achados em T1 e T2).
- Gate de fase: `npm run lint`, `npm test`, `node bin/ai-sync.js --check` e o sync em pasta temporária (`T=$(mktemp -d) && node bin/ai-sync.js "$T" && ls -R "$T/.claude"; rm -rf "$T"`). O projeto não tem build, typecheck nem formatador; o lint e a suíte são o que o CI roda.
- Fase 2 (sequencial): T3, porque mexe no hook e no mesmo arquivo de teste da T1, e o merge com a main precisa vir por último.
- Gate de fase: o mesmo da Fase 1, rodado depois do merge com a main e antes do reviewer.

## Tarefas

### T1 [P] Hook que confere o commit a partir do stage e recusa o que está fora de sincronia
- O quê: o hook passa a validar os gerados a partir do stage do commit, recusa com mensagem quando estão fora de sincronia e deixa de adicionar arquivos no commit que escolhe os arquivos.
- Onde: `.githooks/pre-commit`, um script Node novo sem dependências chamado pelo hook (sugestão: `.githooks/check-sync.js`; conferir que o oxlint o alcança), `tests/self-sync.test.js` e, se útil, um helper em `tests/helpers.js`.
- Dev: Todo (dev-devops).
- Depende de: nada.
- Reaproveita: `bin/ai-sync.js` (sem alterá-lo), o teste de sincronização existente (mesma conferência: sync em pasta vazia comparado ao `.claude/`), `tests/helpers.js` (`tempDir`, `cleanup`, `write`, `read`).
- Atende: RN-01 a RN-08, CA-01 a CA-13.
- Desenho do hook:
  - O shell continua com `npm run sync` (atualiza a pasta) e com o `git add -A -- .claude/agents .claude/rules .claude/skills .claude/settings.json .claude/claude-core.lock.json`, este só no fluxo sem caminhos, isto é, quando o índice em uso NÃO casa `*next-index-*`. A condição depende só desse padrão no `GIT_INDEX_FILE`; é proibido comparar com o literal `.git/index` (na worktree vinculada o índice é `.git/worktrees/<nome>/index`). `commit -a` (índice `index.lock`) segue o fluxo sem caminhos.
  - Commit por caminho (`*next-index-*`): chama a validação comparando os gerados do stage do commit; não roda `git add`.
  - Commit sem caminhos: chama a validação ANTES do `git add`, comparando o sync das fontes do stage com os gerados da pasta (que são os que o `git add` levaria). Se baterem, roda o `git add` como hoje; se não, recusa sem tocar no stage e sem adicionar nada (RN-08, CA-12).
  - Mensagem de recusa: além de rodar o sync, incluir os gerados nos caminhos e commitar de novo, orienta o caso de outro agente com fonte alterada na pasta (esperar o dono commitar ou trabalhar em uma worktree isolada) (RN-07, CA-11). Quando o próprio HEAD está fora de sincronia, a mensagem diz isso e como corrigir (RN-05, CA-13); sugestão para detectar: aplicar a mesma comparação ao HEAD exportado (`git archive HEAD` extraído em pasta temporária), também apagada sempre.
  - Validação: exporta o stage em uso para uma pasta temporária A (`git checkout-index -a --prefix=<A>/`); roda o ai-sync exportado, `node <A>/bin/ai-sync.js <B> --profile tooling`, com B vazia (o ai-sync resolve as fontes pela própria pasta, então rodar o do worktree leria a fonte B do outro agente; e sincronizar em cima de A não serve, porque o ai-sync mantém arquivo cujo hash difere do lock e deixaria passar gerados parciais); compara os gerados de A com os de B (`.claude/agents`, `.claude/rules`, `.claude/skills`, `.claude/settings.json`, `.claude/claude-core.lock.json`), contando arquivo mudado, a mais e a menos. Qualquer diferença: sai com código 1 e imprime a mensagem em português com a lista. Apaga A e B sempre, inclusive na recusa e em erro.
  - Justificativa do script em Node: comparar árvores, listar criados e removidos e limpar temporários de forma portátil, passando pelo oxlint e pela regra sem comentários; o repositório já é só Node. Sem comentários em nenhum arquivo.
- Teste (escrito primeiro, deve falhar antes da mudança; tudo na mesma tarefa, sem commitar teste quebrado): em `tests/self-sync.test.js`, repositório temporário com `git init`, cópia de `bin`, `catalog.json`, `agents`, `rules`, `skills`, `stacks`, `templates`, `profiles`, `.claude`, `.githooks` e `package.json`, `chmod` do hook, `core.hooksPath .githooks`, `user.name`, `user.email`, `commit.gpgsign=false`, primeiro commit com `--no-verify`; no spawn do git, retirar `GIT_INDEX_FILE`, `GIT_DIR` e `GIT_WORK_TREE` do ambiente e garantir `npm` no PATH. Casos:
  - (a) commit por caminho só da fonte alterada: recusado, com a mensagem, HEAD inalterado. Primeiro a falhar. (CA-01)
  - (b) commit por caminho da fonte mais os gerados atualizados: passa e o HEAD fica em sincronia (sync em pasta vazia a partir do HEAD sem diferença). (CA-02)
  - (c) commit sem caminhos com a fonte no stage: passa e fica em sincronia. (CA-03)
  - (c2) commit sem caminhos com outra fonte alterada fora do stage: recusado. (CA-04)
  - (d) commit por caminho de A com B alterada e não commitada: recusado, nem B nem gerados no commit; incluir os gerados da pasta também é recusado (limite documentado). (CA-05)
  - (e) commit por caminho só da especificação com fontes de outro agente alteradas: passa, o commit tem só esse arquivo, nenhum arquivo do `.claude/`, e o stage real fica sem diferenças depois. (CA-06, CA-07)
  - (f) o caso (a) e o (e) dentro de uma worktree vinculada (`git worktree add`). (CA-08)
  - (g) nas recusas de (a) e (d), a mensagem cita esperar o dono commitar ou trabalhar em uma worktree isolada. (CA-11)
  - (h) na recusa de (c2), o stage depois da tentativa é igual ao de antes (mesma saída de `git diff --cached --name-status` e de `git ls-files -s`). (CA-12)
  - (i) com o HEAD fora de sincronia (criado com `--no-verify`), commit por caminho só da especificação: recusado, com a mensagem de último commit fora de sincronia e como corrigir, HEAD inalterado. (CA-13)
  - O teste existente "o hook de pre-commit roda o sync e adiciona o .claude ao commit" continua valendo sem mudança, porque o hook mantém `npm run sync` e o `git add` dos gerados; se precisar de ajuste, só o que o desenho tornar necessário, explicado no commit.
- Pronto quando: os casos acima passam, nenhuma pasta temporária sobra (CA-09) e o gate passa.
- Gate: `npm run lint` e `npm test` (o projeto não tem typecheck nem formatador).
- Modelo: padrao.
- Status: em-andamento. Primeira entrega no commit `27c22b3`, feito pelo Todo (dev-devops). Antes da mudança, 6 dos 9 testes novos falharam, porque o commit saía quando devia ser recusado; depois, `npm test` 121/121. Gate: `npm run lint` ok, 121/121, `node bin/ai-sync.js --check` ok, sync em pasta temporária ok. Achado da revisão (Kusakabe, bloqueia): falta a detecção do último commit fora de sincronia pedida no CA-13. O Todo está corrigindo dentro da T1.

### T2 [P] Atualizar a descrição do hook na documentação
- O quê: a documentação passa a dizer que o hook atualiza o `.claude/` na pasta e recusa o commit que não leva os gerados coerentes, orientando a rodar o sync e incluí-los nos caminhos, e cita o limite com dois agentes mexendo em fontes.
- Onde: `README.md` (item do `npm run sync`, perto da linha 263) e `.claude/CLAUDE.md` (regra do `.claude/` gerado, perto da linha 50; este arquivo não é gerado e pode ser editado). Manter o texto `npm run sync` no `.claude/CLAUDE.md`, que o teste confere.
- Dev: Todo (dev-devops).
- Depende de: nada (o comportamento está fixado nesta especificação).
- Reaproveita: o texto atual dos dois arquivos.
- Atende: RN-02, RN-05, RN-07, CA-10.
- Pronto quando: os dois textos descrevem o novo comportamento, incluindo a orientação de esperar o dono commitar ou usar worktree isolada e a recusa quando o último commit está fora de sincronia, e o gate passa.
- Teste: nenhum (só texto); o teste existente que confere `npm run sync` no `.claude/CLAUDE.md` continua passando.
- Gate: `npm run lint` e `npm test`.
- Modelo: economico.
- Status: em-andamento. Primeira entrega no commit `8e5867e`, feito pelo Todo (dev-devops). Só texto, no `README.md` e no `.claude/CLAUDE.md`. Gate: `npm run lint` ok, `npm test` 121/121, `node bin/ai-sync.js --check` ok. Achado da revisão (Kusakabe, bloqueia): a documentação não cita a recusa quando o último commit está fora de sincronia. O Todo está corrigindo dentro da T2.

### T3 Reforça os testes do hook, trata a falha do sync e atualiza a branch com a main
- O quê: o teste das pastas temporárias passa a usar um `TMPDIR` próprio e falha se sobrar algo; o teste da recusa sem caminhos compara também `git ls-files -s`; o hook recusa com mensagem em português quando o sync falha; e a branch é atualizada com a main por merge antes do PR.
- Onde: `.githooks/pre-commit` e o script de validação criado na T1; `tests/self-sync.test.js`; merge de `main` na branch `fix/60-hook-trava-desatualizado`.
- Dev: Todo (dev-devops).
- Depende de: T1, T2.
- Reaproveita: o repositório temporário e os casos de teste da T1; o caso (h) da T1 (comparação do stage) ganha `git ls-files -s` se ainda não o tiver.
- Atende: RN-01, RN-08, RN-09; CA-09, CA-12, CA-14, CA-15, CA-16, CA-17.
- Desenho:
  - (a) os testes que fazem commit no repositório temporário passam `TMPDIR` apontando para uma pasta criada só para o teste; ao fim de commits aceitos e recusados, o teste falha se essa pasta não estiver vazia. (CA-14)
  - (b) na recusa do commit sem caminhos, o teste compara antes e depois a saída de `git diff --cached --name-status` e de `git ls-files -s`. (CA-15)
  - (c) se o `npm run sync` (ou a sincronização feita pela validação) sair com erro, o hook sai com código 1 e imprime em português que o sync falhou e o que conferir, sem `git add` e apagando as pastas temporárias. O texto exato é do dev e é conferido na revisão. O teste provoca a falha no repositório temporário (por exemplo, com um `catalog.json` inválido no stage e na pasta) e confere a recusa, a mensagem, o HEAD inalterado e o stage igual. (CA-16)
  - (d) depois de (a) a (c) commitados, `git merge main` na branch (sem rebase), resolvendo conflitos se houver, e o gate de novo. (CA-17)
- Teste (escrito primeiro, deve falhar antes da mudança): devem falhar primeiro o teste da falha do sync (o commit sai ou a mensagem não aparece) e o teste do `TMPDIR` próprio, se o hook deixar algo para trás. Se algum desses passar já na primeira execução, registrar no relato que ele já era atendido, sem alterar o teste para forçar a falha.
- Pronto quando: os testes novos passam, nenhuma pasta temporária sobra, o merge com a main está feito e o gate passa depois do merge.
- Gate: `npm run lint`, `npm test`, `node bin/ai-sync.js --check` e o sync em pasta temporária (o projeto não tem typecheck nem formatador).
- Modelo: padrao.
- Status: pendente.

## Dúvidas

Product-owner: nenhuma.

Usuário: nenhuma. As três dúvidas foram respondidas e viraram RN-07, RN-08 e a exceção da RN-05.
