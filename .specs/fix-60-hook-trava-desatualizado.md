# Hook de pre-commit grava o .claude desatualizado ou de outro agente no commit que escolhe os arquivos

> Status: em-revisao
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

O hook nunca deixa sair um commit com a cópia do time fora de sincronia com as fontes que estão no commit, e nunca põe no commit, por conta própria, arquivos que quem commita não pediu. No commit que escolhe os arquivos, se a cópia gerada não estiver atualizada e incluída, o hook recusa o commit e orienta, em português, a rodar o sync, incluir os arquivos gerados nos caminhos do commit e commitar de novo. Se o commit não toca fonte nem arquivo gerado, o hook não recusa nem adiciona nada.

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
- RN-05: Commit que não toca fonte nem arquivo gerado, com o último commit em sincronia, não é recusado nem recebe nada do hook. Fonte: orchestrator, a partir do caso da #56.
- RN-06: O formato do lock, o comportamento do sync e o texto da regra de git não mudam nesta tarefa. Fonte: usuário.

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
- CA-10: QUANDO a tarefa termina ENTÃO o lint e a suíte de testes do projeto DEVEM passar, incluindo o teste que já existe do hook (o hook continua rodando o sync e adicionando a cópia do time no commit sem caminhos). (RN-04, RN-06)

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

- Fase 1 (paralelo): T1 [P] e T2 [P].
- Gate de fase: `npm run lint`, `npm test`, `node bin/ai-sync.js --check` e o sync em pasta temporária (`T=$(mktemp -d) && node bin/ai-sync.js "$T" && ls -R "$T/.claude"; rm -rf "$T"`). O projeto não tem build, typecheck nem formatador; o lint e a suíte são o que o CI roda.

## Tarefas

### T1 [P] Hook que confere o commit a partir do stage e recusa o que está fora de sincronia
- O quê: o hook passa a validar os gerados a partir do stage do commit, recusa com mensagem quando estão fora de sincronia e deixa de adicionar arquivos no commit que escolhe os arquivos.
- Onde: `.githooks/pre-commit`, um script Node novo sem dependências chamado pelo hook (sugestão: `.githooks/check-sync.js`; conferir que o oxlint o alcança), `tests/self-sync.test.js` e, se útil, um helper em `tests/helpers.js`.
- Dev: Todo (dev-devops).
- Depende de: nada.
- Reaproveita: `bin/ai-sync.js` (sem alterá-lo), o teste de sincronização existente (mesma conferência: sync em pasta vazia comparado ao `.claude/`), `tests/helpers.js` (`tempDir`, `cleanup`, `write`, `read`).
- Atende: RN-01 a RN-06, CA-01 a CA-10.
- Desenho do hook:
  - O shell continua com `npm run sync` (atualiza a pasta) e com o `git add -A -- .claude/agents .claude/rules .claude/skills .claude/settings.json .claude/claude-core.lock.json`, este só no fluxo sem caminhos, isto é, quando o índice em uso NÃO casa `*next-index-*`. A condição depende só desse padrão no `GIT_INDEX_FILE`; é proibido comparar com o literal `.git/index` (na worktree vinculada o índice é `.git/worktrees/<nome>/index`). `commit -a` (índice `index.lock`) segue o fluxo sem caminhos.
  - Commit por caminho (`*next-index-*`): chama a validação comparando os gerados do stage do commit; não roda `git add`.
  - Commit sem caminhos: chama a validação ANTES do `git add`, comparando o sync das fontes do stage com os gerados da pasta (que são os que o `git add` levaria). Se baterem, roda o `git add` como hoje; se não, recusa sem tocar no stage.
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
  - O teste existente "o hook de pre-commit roda o sync e adiciona o .claude ao commit" continua valendo sem mudança, porque o hook mantém `npm run sync` e o `git add` dos gerados; se precisar de ajuste, só o que o desenho tornar necessário, explicado no commit.
- Pronto quando: os casos acima passam, nenhuma pasta temporária sobra (CA-09) e o gate passa.
- Gate: `npm run lint` e `npm test` (o projeto não tem typecheck nem formatador).
- Modelo: padrao.
- Status: pendente.

### T2 [P] Atualizar a descrição do hook na documentação
- O quê: a documentação passa a dizer que o hook atualiza o `.claude/` na pasta e recusa o commit que não leva os gerados coerentes, orientando a rodar o sync e incluí-los nos caminhos, e cita o limite com dois agentes mexendo em fontes.
- Onde: `README.md` (item do `npm run sync`, perto da linha 263) e `.claude/CLAUDE.md` (regra do `.claude/` gerado, perto da linha 50; este arquivo não é gerado e pode ser editado). Manter o texto `npm run sync` no `.claude/CLAUDE.md`, que o teste confere.
- Dev: Todo (dev-devops).
- Depende de: nada (o comportamento está fixado nesta especificação).
- Reaproveita: o texto atual dos dois arquivos.
- Atende: RN-02, CA-10.
- Pronto quando: os dois textos descrevem o novo comportamento e o gate passa.
- Teste: nenhum (só texto); o teste existente que confere `npm run sync` no `.claude/CLAUDE.md` continua passando.
- Gate: `npm run lint` e `npm test`.
- Modelo: economico.
- Status: pendente.

## Dúvidas

Product-owner:
- Nenhuma.

Usuário:
- A mensagem de recusa deve citar o caso de outro agente com fontes alteradas na pasta (esperar o dono commitar ou usar worktree isolada), ou fica só "rode o sync, inclua os gerados e commite de novo"?
- A memória do time registra uma exceção para commit sem caminhos ao tirar um arquivo do controle de versão. Com o novo hook, o commit sem caminhos é recusado (sem mexer no stage) enquanto outro agente tiver fonte alterada na pasta. Está de acordo?
- Se o último commit já estiver fora de sincronia (por um commit antigo), até um commit que não toca fonte será recusado até alguém commitar os gerados corretos. Está de acordo, ou o hook deve deixar passar commit que não toca fonte nem gerado nesse caso?
