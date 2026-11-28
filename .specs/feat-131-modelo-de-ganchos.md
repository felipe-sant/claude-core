# Modelo de ganchos com proteção de branch e formatação automática

> Status: implementada (código aprovado pelo reviewer na nova revisão, sem achado bloqueante; risco pendente de confirmação do usuário, ver "Não conferido" no plano)
> Tipo: funcionalidade
> Tamanho: grande
> Branch: feat/131-modelo-de-ganchos
> Criada em: 2026-11-28

## Objetivo

Hoje cada projeto precisa montar sozinho as próprias guardas contra acidentes do agente. Este trabalho cria um novo modelo de configuração que a sincronização do kit mescla nas configurações do projeto, sem alterar o que o dono já definiu. O modelo traz dois ganchos:

1. Uma guarda que, antes de o agente rodar um comando no terminal, impede commit e envio direto nas branches protegidas, envio forçado e remoção recursiva de arquivos, e explica o motivo em português.
2. Uma etapa que formata e confere o arquivo logo depois de cada edição feita pelo agente, usando só as ferramentas que o projeto já tem instaladas.

Para isso, a sincronização passa a saber mesclar listas de ganchos: acrescenta os do kit aos que o projeto já tem, sem duplicar e sem trazer de volta o que o dono removeu.

## Regras

- RN-01: O modelo de ganchos é um item novo do catálogo de configurações, ligado aos perfis do kit. Fonte: issue #131.
- RN-02: Os ganchos funcionam sozinhos, escritos por inteiro na própria configuração, sem depender de scripts, arquivos ou comandos do projeto. Fonte: issue #131.
- RN-03: Em caso de dúvida os ganchos deixam passar: comando que a guarda não reconhece, dados de entrada ilegíveis, pasta sem git, ferramenta ausente ou qualquer erro interno. Só é barrado o que está na lista da RN-05 a RN-08. Fonte: issue #131.
- RN-04: Ao barrar, a guarda impede o comando e explica em português o que foi barrado e por quê, para o agente entender e mudar de rumo. Fonte: issue #131.
- RN-05: Commit direto em branch protegida é barrado. As branches protegidas são `main`, `master`, `develop` e `production` (lista fixa). Fonte: issue #131, pedido da orchestrator e decisão do usuário.
- RN-06: Envio (push) para branch protegida é barrado, seja nomeando a branch de destino, seja enviando sem nomear o destino enquanto se está nela. Apagar uma branch protegida no servidor também é barrado. Fonte: issue #131.
- RN-06a: Enviar todas as branches de uma vez (opções `--all` e `--mirror`) é barrado quando a pasta está numa branch protegida, e deixado passar quando está numa branch de tarefa. Fonte: decisão do usuário na revisão.
- RN-07: Envio forçado é barrado em qualquer branch, nas suas várias formas (forçado, forçado com proteção e o destino marcado com sinal de mais). Fonte: issue #131.
- RN-08: Remoção recursiva de arquivos é barrada em qualquer pasta, nas suas várias formas de escrever a opção. Fonte: issue #131.
- RN-08a: Exceção à RN-08: a remoção recursiva de uma pasta temporária criada pelo `mktemp` no mesmo comando é deixada passar, para que o roteiro "Verificar uma mudança" do repositório continue funcionando. A exceção só vale quando a variável recebeu o resultado do `mktemp` antes da remoção e não foi usada de outro jeito no caminho até ela. Fonte: decisão do usuário e revisão.
- RN-09: A branch conferida é a da pasta onde o comando vai rodar de fato: se o comando entra antes em outra pasta, vale a branch dessa pasta. Isso é o que permite aos agentes commitarem nas worktrees das tarefas enquanto a pasta principal está na `main`. Fonte: fluxo do time (CLAUDE.md, worktrees por tarefa).
- RN-10: Depois de cada edição ou criação de arquivo pelo agente, o arquivo é formatado e conferido com as ferramentas do projeto que já estão instaladas nele. Se o projeto não tem nenhuma, nada acontece e nada falha. Se o projeto não tem o arquivo de configuração do formatador, o arquivo não é formatado. Problemas encontrados pela conferência são avisados ao agente, sem bloquear. As ferramentas são só `prettier` e `oxlint`. A etapa nunca desfaz nem impede a edição. Fonte: issue #131 e decisão do usuário.
- RN-11: A sincronização preserva os ganchos que o projeto já tem: os do kit são acrescentados ao lado, sem alterar, reordenar nem apagar os do dono. Fonte: issue #131 e garantia do kit de nunca sobrescrever o que é do usuário (CLAUDE.md).
- RN-12: Rodar a sincronização de novo não duplica os ganchos do kit. Fonte: pedido da orchestrator.
- RN-13: Gancho do kit que o dono apagou não volta nas próximas sincronizações, como já acontece com as demais configurações. Fonte: pedido da orchestrator e comportamento atual do kit.
- RN-14: Quando o kit muda um gancho numa versão nova, a sincronização troca a versão antiga pela nova só se o dono não a alterou. Se o dono alterou ou apagou o gancho, a versão nova não entra e é listada como sugestão. Fonte: mesma lógica que o kit já usa para os arquivos instalados (CLAUDE.md).
- RN-15: Quem precisar contornar os ganchos pode desligá-los sem editar arquivo versionado, por uma variável de ambiente (`CLAUDE_KIT_HOOKS_OFF=1`), posta no terminal ou na configuração local do Claude, que fica fora do git. Fonte: issue #131 e pedido da orchestrator.

## Critérios de aceite

Guarda de comandos (exemplos de comando entre crases são o texto que o agente pediria para rodar):

- CA-01: QUANDO o agente pede `git commit -m "x"` numa pasta que está na `main`, `master`, `develop` ou `production` ENTÃO o sistema DEVE barrar o comando e explicar em português que commit direto em branch protegida não é permitido. Cobre RN-04, RN-05.
- CA-02: QUANDO o agente pede `git commit -m "x"` numa pasta que está em outra branch (por exemplo `feat/1-x`) ENTÃO o sistema DEVE deixar passar. Cobre RN-03, RN-05.
- CA-03: QUANDO o agente, a partir de uma pasta na `main`, pede `cd <worktree> && git commit ...` ou `git -C <worktree> commit ...` e a worktree está numa branch de tarefa ENTÃO o sistema DEVE deixar passar; e QUANDO a pasta de destino está numa branch protegida ENTÃO DEVE barrar. Cobre RN-09.
- CA-04: QUANDO a pasta de destino não pode ser descoberta com segurança (nome vindo de variável, subcomando ou pasta inexistente) ENTÃO o sistema DEVE deixar passar. Cobre RN-03, RN-09.
- CA-05: QUANDO o agente pede `git push origin main`, `git push origin HEAD:main`, `git push origin feat/x:main`, `git push origin :main` ou `git push origin --delete main` ENTÃO o sistema DEVE barrar, valendo o mesmo para as outras branches protegidas. Cobre RN-04, RN-06.
- CA-05a: QUANDO o agente pede `git push --all`, `git push --mirror`, `git push --all origin` ou `git push origin --mirror` numa pasta em branch protegida ENTÃO o sistema DEVE barrar; e QUANDO a pasta está numa branch de tarefa ENTÃO DEVE deixar passar. Cobre RN-04, RN-06a.
- CA-06: QUANDO o agente pede `git push` ou `git push origin` sem nomear destino e a pasta está numa branch protegida ENTÃO o sistema DEVE barrar; e QUANDO está numa branch de tarefa ENTÃO DEVE deixar passar. Cobre RN-06.
- CA-07: QUANDO o agente pede `git push -u origin feat/1-x` (inclusive estando na `main`) ENTÃO o sistema DEVE deixar passar. Cobre RN-03, RN-06.
- CA-08: QUANDO o agente pede um envio com `--force`, `-f`, `--force-with-lease`, `--force-if-includes`, `-f` dentro de um grupo de opções curtas (como `-uf`) ou um destino começando com `+` (como `+feat/x`) ENTÃO o sistema DEVE barrar, em qualquer branch. Cobre RN-04, RN-07.
- CA-09: QUANDO o agente pede `rm -r x`, `rm -rf x`, `rm -fr x`, `rm -Rf x`, `rm -r -f x`, `rm --recursive x` ou qualquer uma delas precedida de `sudo` ENTÃO o sistema DEVE barrar e explicar em português que remoção recursiva não é permitida. Cobre RN-04, RN-08.
- CA-10: QUANDO o agente pede `rm arquivo.txt` ou `rm -f arquivo.txt` ENTÃO o sistema DEVE deixar passar. Cobre RN-03, RN-08.
- CA-10a: QUANDO o agente pede um comando que cria a pasta temporária com `mktemp -d`, guarda o nome numa variável e depois a remove recursivamente pela mesma variável, como `T=$(mktemp -d) && node bin/ai-sync.js "$T" && ls -R "$T/.claude"; rm -rf "$T"` ENTÃO o sistema DEVE deixar passar. Cobre RN-08a.
- CA-10b: QUANDO a remoção recursiva usa uma variável que não foi criada pelo `mktemp -d` no mesmo comando (por exemplo `rm -rf "$T"` sozinho, ou `T=build; rm -rf "$T"`), ou mistura a pasta temporária com outro alvo (`T=$(mktemp -d); rm -rf "$T" src`) ENTÃO o sistema DEVE barrar. Cobre RN-08, RN-08a.
- CA-10c: QUANDO a variável recebe um caminho que sai da pasta temporária (`T=$(mktemp -d)/../..`), a remoção vem antes da atribuição, ou a variável é redefinida por um laço (`for T in /`) ENTÃO o sistema DEVE barrar. Cobre RN-08, RN-08a.
- CA-11: QUANDO o comando proibido aparece encadeado depois de outro (`npm test && git push --force`, `ls; rm -rf x`, `true || git commit -m x` na `main`) ENTÃO o sistema DEVE barrar. Cobre RN-05 a RN-08.
- CA-12: QUANDO o texto proibido aparece só dentro de uma mensagem ou de um argumento entre aspas (por exemplo `git commit -m "explica o rm -rf"` numa branch de tarefa, ou `echo "git push --force"`) ENTÃO o sistema DEVE deixar passar. Cobre RN-03.
- CA-12a: QUANDO o comando tem redirecionamento de saída ou de entrada (por exemplo `git push --all 2>&1`, `git status > saida.txt`) ENTÃO o sistema DEVE ignorar o redirecionamento ao decidir, sem tratá-lo como destino do envio nem como alvo, e um comando liberado continua liberado. Cobre RN-03, RN-06.
- CA-13: QUANDO a entrada recebida pelo gancho não é legível, o comando está vazio, a pasta não tem git, o git não está instalado ou o Node não está instalado ENTÃO o sistema DEVE deixar passar, sem mensagem de erro. Cobre RN-02, RN-03.
- CA-14: QUANDO o agente pede qualquer comando que não esteja na lista acima (por exemplo `npm test`, `git status`, `git worktree remove ../x`) ENTÃO o sistema DEVE deixar passar. Cobre RN-03.
- CA-15: QUANDO a variável `CLAUDE_KIT_HOOKS_OFF` vale `1` ENTÃO o sistema DEVE deixar passar todos os comandos e não formatar nem conferir arquivos; isso vale com a variável no terminal e com a variável na configuração local do Claude (esta forma é conferida na prática na tarefa de registro). Cobre RN-15.

Formatação depois da edição:

- CA-16: QUANDO o agente edita ou cria um arquivo num projeto que tem o formatador instalado e o arquivo de configuração dele ENTÃO o sistema DEVE formatar esse arquivo logo em seguida; e QUANDO o formatador está instalado mas o projeto não tem o arquivo de configuração dele ENTÃO DEVE deixar o arquivo como está. Cobre RN-10.
- CA-17: QUANDO o projeto também tem a ferramenta de conferência instalada ENTÃO o sistema DEVE conferir o arquivo editado, sem desfazer nem impedir a edição; e QUANDO a conferência encontra problemas ENTÃO DEVE avisar o agente com o resultado, sem bloquear. Cobre RN-10.
- CA-18: QUANDO o arquivo editado está numa worktree ENTÃO o sistema DEVE usar as ferramentas instaladas na pasta do próprio arquivo (subindo pelas pastas acima dele), e QUANDO não há nenhuma instalada ali ENTÃO DEVE não fazer nada. Cobre RN-09, RN-10.
- CA-19: QUANDO o projeto não tem formatador nem ferramenta de conferência, o arquivo não existe mais ou a entrada é ilegível ENTÃO o sistema DEVE terminar sem fazer nada e sem erro. Cobre RN-03, RN-10.
- CA-20: QUANDO o formatador demora demais ENTÃO o sistema DEVE desistir depois de um tempo curto (30 segundos) sem travar o agente. Cobre RN-03.

Sincronização:

- CA-21: QUANDO o projeto não tem configuração ou não tem ganchos ENTÃO a sincronização DEVE acrescentar os dois ganchos do kit e listá-los no resumo como acrescentados. Cobre RN-01, RN-11.
- CA-22: QUANDO o projeto já tem ganchos próprios no mesmo momento (antes de comando ou depois de edição) ENTÃO a sincronização DEVE manter os do dono exatamente como estavam, na mesma ordem, e acrescentar os do kit depois deles. Cobre RN-11.
- CA-23: QUANDO a sincronização roda de novo sem mudanças ENTÃO nada DEVE mudar na configuração nem no registro, e os ganchos do kit DEVEM aparecer uma vez só. Cobre RN-12.
- CA-24: QUANDO o dono apaga um gancho do kit, a lista inteira de um momento ou o grupo inteiro de ganchos ENTÃO as próximas sincronizações NÃO DEVEM trazê-lo de volta. Cobre RN-13.
- CA-25: QUANDO o kit muda o texto de um gancho e o dono não tinha mexido no anterior ENTÃO a sincronização DEVE trocar o anterior pelo novo no mesmo lugar, sem deixar os dois. Cobre RN-14.
- CA-26: QUANDO o kit muda o texto de um gancho e o dono tinha alterado ou apagado o anterior ENTÃO a sincronização NÃO DEVE acrescentar o novo e DEVE listá-lo como sugerido e não aplicado. Cobre RN-11, RN-14.
- CA-27: QUANDO o registro do kit foi apagado e o projeto já tem um gancho igual ao do kit ENTÃO a sincronização DEVE registrá-lo como do kit sem duplicá-lo. Cobre RN-12, RN-13.
- CA-28: QUANDO os ganchos do projeto estão num formato que a sincronização não entende (por exemplo, não são uma lista) ENTÃO ela NÃO DEVE mexer neles e DEVE listar os do kit como sugeridos. Cobre RN-11.
- CA-29: QUANDO dois modelos do kit trazem ganchos para o mesmo momento ENTÃO a sincronização DEVE juntar as listas, sem que um modelo apague os ganchos do outro. Cobre RN-11.
- CA-30: QUANDO as demais configurações (as que não são ganchos) são sincronizadas ENTÃO DEVEM se comportar exatamente como antes. Cobre RN-11.
- CA-31: QUANDO o dono deixou uma lista de ganchos vazia num momento, ou o grupo de ganchos vazio ENTÃO a sincronização NÃO DEVE apagá-los ao gravar a configuração; só apaga a chave vazia que ela mesma criou. Cobre RN-11.

## Critérios de sucesso

- Um projeto que roda a sincronização passa a ter as duas guardas funcionando, sem perder nenhum gancho próprio, e a segunda rodada não muda nada.
- Nos testes, todos os exemplos barrados de CA-01 a CA-11 (incluindo CA-10b) saem barrados e todos os exemplos liberados de CA-02 a CA-14 (incluindo CA-10a) saem liberados.
- `npm run lint` e `npm test` passam, e `node bin/ai-sync.js --check` não aponta erro.
- O próprio claude-kit, que recebe o perfil `tooling`, passa a ter os ganchos e o fluxo do time segue funcionando nas worktrees.

## Fora do escopo

- Lista de branches protegidas configurável por projeto: a lista é fixa nesta entrega, por decisão do usuário.
- Proteção contra outros comandos perigosos (reescrever histórico na principal, `git reset --hard`, apagar com outras ferramentas). A issue pede só os três casos.
- Ferramentas de formatação e conferência além de `prettier` e `oxlint` (como `eslint`, `biome` ou as de PHP), por decisão do usuário.
- Exceção para remoção recursiva de outras pastas temporárias que não as criadas pelo `mktemp` no mesmo comando.
- Mudar as permissões do Claude ou as listas de comandos permitidos das automações de issues.
- Escrever os ganchos em arquivos separados do projeto: a issue pede que não dependam de arquivos do projeto.

**Limites conhecidos** (aceitos nesta entrega, registrados na revisão):

- A guarda pode ser contornada por quem escreve o comando de outro jeito: `/bin/rm` ou outro caminho completo, `bash -c "..."`, `sh -c`, `eval`, apelidos (aliases) do git e texto vindo de heredoc não são analisados.
- `pushd` não é acompanhado como troca de pasta, só `cd` e `git -C`.
- A conferência usa o `oxlint` instalado no `node_modules` do projeto; se ele estiver só instalado globalmente, não roda.
- Quando o kit traz um gancho novo para uma ferramenta que já tinha um gancho antigo do kit alterado ou apagado pelo dono, o novo vai para "sugerido" e não é aplicado (RN-14).
- A lista de branches protegidas é fixa.
- A exceção do mktemp não sabe se a atribuição chegou a rodar. Por isso estes casos passam: `false && HOME=$(mktemp -d); rm -rf "$HOME"`, `(HOME=$(mktemp -d)); rm -rf "$HOME"`, `HOME=$(mktemp -d) rm -rf "$HOME"` e `T=$(mktemp -d && echo ~); rm -rf $T`.
- Um `export T` entre a atribuição do mktemp e a remoção faz a remoção ser barrada, mesmo sendo da pasta temporária.
- `git push --all` e `git push --mirror` a partir de branch de tarefa passam, por decisão do usuário (RN-06a).

## Desenho

**Peças**

1. Modelo de ganchos: arquivo novo de configuração do kit, registrado no catálogo como `hooks`. Contém o grupo `hooks` com duas entradas: uma no momento "antes de usar ferramenta" para a ferramenta de terminal (a guarda) e uma no momento "depois de usar ferramenta" para as ferramentas de edição e escrita (a formatação). Cada entrada traz o comando completo, sem depender de nada do projeto.
2. Sincronização: aprende a mesclar listas de ganchos por entrada, sem mudar a regra das outras chaves.
3. Registro do kit (o arquivo de trava que guarda o que o kit aplicou): passa a guardar uma identificação por gancho aplicado.

**Contratos fixados por esta especificação (as tarefas paralelas partem deles)**

- Arquivo do modelo: `templates/settings.hooks.json`, nome no catálogo `hooks`, `applies: ["all"]` (decisão do usuário) e listado nos quatro perfis.
- Formato do modelo, igual ao esperado pelo Claude Code:

```json
{
  "hooks": {
    "PreToolUse": [{ "matcher": "Bash", "hooks": [{ "type": "command", "command": "...", "timeout": 10 }] }],
    "PostToolUse": [{ "matcher": "Edit|Write|MultiEdit", "hooks": [{ "type": "command", "command": "...", "timeout": 30 }] }]
  }
}
```

- Variável de desligar: `CLAUDE_KIT_HOOKS_OFF=1`.
- Saída da guarda: código 2 com a mensagem em português na saída de erro para barrar; código 0 em qualquer outro caso, inclusive erro interno.
- Linguagem do comando: um prefixo de shell curto que sai com 0 quando a variável de desligar está ligada ou quando o Node não existe (`command -v node`), seguido de `node -e` com o programa inteiro dentro de um `try`, cujo `catch` sai com 0. Motivo: o Node já é exigido pelo kit, lê JSON sem `jq` (que não é garantido) e roda igual em Linux, macOS e no shell que o Claude Code usa no Windows. O programa não pode conter aspas simples, para caber no `node -e '...'`.
- A guarda lê do stdin o JSON do gancho (`tool_input.command` e `cwd`), divide o comando em trechos por `&&`, `||`, `;`, `|` e quebra de linha, respeitando aspas, acompanha `cd <pasta>` e `git -C <pasta>` para saber a pasta de cada trecho e pergunta a branch com `git -C <pasta> symbolic-ref --short HEAD`. Pasta indefinida ou falha do git: o trecho passa. A guarda também anota as variáveis atribuídas com `NOME=$(mktemp -d ...)` em trechos anteriores do mesmo comando; um `rm` recursivo cujos alvos são todos `$NOME` ou `"$NOME"` dessas variáveis passa, e qualquer outro alvo junto o faz ser barrado.
- A formatação lê `tool_input.file_path`, sobe a partir da pasta do arquivo procurando `node_modules/.bin`, roda o formatador (`prettier --write <arquivo>`) só quando existe ali e há configuração do prettier no projeto (arquivo de configuração dele ou a chave `prettier` no `package.json`), e a conferência (`oxlint <arquivo>`) quando existe ali. Se a conferência aponta problemas, o gancho devolve o resultado ao agente como aviso que não bloqueia (a forma exata de devolver, pela saída do gancho que o Claude Code mostra ao agente, é escolhida e testada em T3). Ausência de ambos ou de arquivo: sai com 0.

**Mesclagem dos ganchos na sincronização**

- Juntar modelos: no grupo `hooks`, as listas de um mesmo momento são concatenadas entre modelos, sem repetir entradas iguais. As demais chaves seguem como hoje (o último modelo vence).
- Identidade de um gancho: um resumo (hash curto) do conteúdo inteiro da entrada (ferramenta, comando e tempo limite). Uma entrada do projeto é considerada a mesma do kit quando o conteúdo é idêntico.
- Registro: cada gancho aplicado é guardado na lista de configurações aplicadas como `hooks.<Momento>.<hash>`, com ponto como separador. Assim, a checagem que já existe por prefixo reconhece a remoção do grupo inteiro (`hooks`) e da lista inteira de um momento (`hooks.PreToolUse`).
- Para cada momento e cada entrada do modelo:
  - grupo `hooks` ausente no projeto e já registrado antes: nada entra (o dono apagou);
  - lista do momento ausente e já registrada antes: nada entra;
  - lista do momento existe mas não é lista: nada muda, entrada vai para "sugerido";
  - entrada idêntica já presente: nada muda (se o registro foi recriado, ela passa a ser registrada);
  - hash da entrada já registrado e ausente do projeto: o dono apagou ou alterou, nada entra;
  - entrada nova cuja ferramenta (`matcher`) tem uma entrada antiga do kit registrada: se a antiga ainda está presente e idêntica, é trocada pela nova no mesmo lugar e o registro troca de hash; se a antiga sumiu ou mudou, a nova vai para "sugerido";
  - nos demais casos: a entrada é acrescentada ao fim da lista e registrada.
- Resumo da sincronização: lista os ganchos acrescentados e sugeridos por momento e ferramenta (por exemplo `hooks.PreToolUse (Bash)`), sem despejar o comando inteiro.

**Reflexos neste repositório**

- O perfil `tooling` passa a receber os ganchos, então o `.claude/settings.json` gerado ganha as duas entradas.
- O roteiro "Verificar uma mudança" do CLAUDE.md termina com uma remoção recursiva da pasta criada pelo `mktemp` no mesmo comando, que a exceção RN-08a deixa passar; o roteiro não muda.
- As automações de issues trabalham numa branch própria e só enviam essa branch, então não são barradas.

**Testes**

- Mesclagem: com o kit de teste que já existe nos testes, usando modelos de ganchos fictícios.
- Guarda e formatação: leem o modelo real do repositório, extraem o comando da entrada certa e o executam com `spawnSync('sh', ['-c', comando], { input, cwd, env })`, alimentando o stdin com o JSON do gancho, dentro de um repositório git temporário (`git init -b main`, branches criadas por teste). A formatação usa um `node_modules/.bin/prettier` e um `oxlint` falsos que só gravam um arquivo de marca.

## Plano de execução

O projeto não tem typecheck nem formatador; os gates usam o lint e os testes.

- Fase 1 (paralelo): T1 [P], T2 [P], T5 [P]
  - Gate de fase: `npm run lint`, `npm test` e `node bin/ai-sync.js --check`.
- Fase 2 (sequencial): T3, que só começa depois do commit de T2.
  - Gate de fase: `npm run lint`, `npm test` e `node bin/ai-sync.js --check`.
- Fase 3 (sequencial): T4, que só começa depois dos commits de T1 e T3.
  - Gate de fase: `npm run lint`, `npm test`, `node bin/ai-sync.js --check`, `npm pack --dry-run` (o modelo novo entra no pacote) e o `ai-sync` numa pasta temporária, conferindo o `.claude/settings.json` gerado. Depois, o reviewer.
- Fase 4 (correções da revisão, sequencial): T6 → T7 → T9 mexem no modelo de ganchos (fonte sincronizada) e foram commitadas em ordem; T8 mexe só na sincronização.
  - Gate de fase: `npm run lint`, `npm test` (726/726 no último commit), `node bin/ai-sync.js --check`. Depois, nova revisão.

**Não conferido numa sessão real do Claude** (risco conhecido, pendente de confirmação do usuário): a desativação pela configuração local (parte de CA-15, pedida em T4) e o aviso do `oxlint` chegando ao agente (CA-17, testado só com ferramenta falsa em T3).

T2, T3 e T4 mexem em fontes do conteúdo sincronizado (`templates/`, `catalog.json`, `profiles/`) e por isso não rodam em paralelo entre si: a próxima só começa depois do commit da anterior. T1 (sincronização) e T5 (documentação e nota de mudança) não mexem nessas fontes.

## Tarefas

### T1 [P] Mesclagem de listas de ganchos na sincronização

- O quê: a sincronização passa a mesclar o grupo `hooks` por entrada, como descrito no Desenho, sem mudar o comportamento das outras chaves.
- Onde: `bin/ai-sync.js` (`mergeTemplates`, `mergeMissing`, `wasApplied`, `applySettings`, `printSettingsReport`), `tests/settings.test.js`.
- Depende de: nada.
- Reaproveita: `previousSettings`, `appliedSettings`, `wasApplied`, `manifestWasRecreated`, `settingsReport` e o resumo atual; nos testes, `h.makeCore`, `h.makeTarget`, `h.run`, `h.snapshot` e o `appliedIn` do próprio arquivo.
- Atende: RN-11, RN-12, RN-13, RN-14; CA-21 a CA-30.
- Pronto quando: cada caso de CA-21 a CA-30 tem um teste com modelos de ganchos fictícios e passa; todos os testes que já existem em `tests/settings.test.js` passam sem alteração; o gate passa.
- Teste: integração (rodando o `ai-sync` sobre pastas temporárias). O primeiro a falhar: "projeto com gancho próprio em PreToolUse recebe o do kit ao lado e mantém o seu", que hoje falha porque a lista inteira vai para "sugerido".
- Gate: `node --test tests/settings.test.js` e `npm run lint`.
- Modelo: padrao.
- Status: feita (commit 892e3bc; gate ok: lint, 643/643 testes, --check; sem typecheck nem formatador no projeto).

### T2 [P] Guarda de comandos no modelo de ganchos

- O quê: cria `templates/settings.hooks.json` só com a entrada de "antes de usar ferramenta" para o terminal, com a guarda completa em `node -e`, e os testes do bloqueio.
- Onde: `templates/settings.hooks.json` (novo), `tests/hooks-guard.test.js` (novo). Não registra no catálogo nem nos perfis (fica para T4).
- Depende de: nada.
- Reaproveita: `h.tempDir`, `h.cleanup` e `h.repoRoot` de `tests/helpers.js`.
- Atende: RN-02 a RN-09, RN-08a, RN-15; CA-01 a CA-15, incluindo CA-10a e CA-10b (a parte da configuração local de CA-15 é conferida em T4).
- Pronto quando: cada exemplo barrado de CA-01, CA-03, CA-05, CA-06, CA-08, CA-09 e CA-11 sai com código 2 e mensagem em português na saída de erro; cada exemplo liberado de CA-02, CA-03, CA-04, CA-06, CA-07, CA-10, CA-12, CA-13 e CA-14 sai com código 0 e sem mensagem; o comando do roteiro "Verificar uma mudança" do CLAUDE.md (CA-10a) sai com 0 e cada exemplo de CA-10b sai com 2; com `CLAUDE_KIT_HOOKS_OFF=1` todos saem com 0; com o Node fora do caminho de busca o comando sai com 0; o lint de conteúdo aceita o modelo; o gate passa.
- Teste: integração, extraindo o comando do modelo real e executando-o com `spawnSync('sh', ['-c', comando], ...)` num repositório git temporário. O primeiro a falhar: "commit na main é barrado com mensagem em português". Para a exceção, o primeiro a falhar: "remoção recursiva da pasta criada pelo mktemp no mesmo comando passa".
- Gate: `node --test tests/hooks-guard.test.js` e `npm run lint`.
- Modelo: padrao.
- Status: feita (commit 43e7379; guarda com a exceção do mktemp, RN-08a, CA-10a e CA-10b; teste falhou antes com o arquivo do modelo ausente; gate ok: lint, 692/692 testes).

### T3 Formatação depois da edição no modelo de ganchos

- O quê: acrescenta ao `templates/settings.hooks.json` a entrada de "depois de usar ferramenta" para edição e escrita, com a formatação e a conferência em `node -e`, e os testes.
- Onde: `templates/settings.hooks.json`, `tests/hooks-format.test.js` (novo).
- Depende de: T2 (mesmo arquivo de modelo, que é fonte sincronizada).
- Reaproveita: `h.tempDir`, `h.cleanup`, `h.repoRoot` e o jeito de extrair e executar o comando criado em T2.
- Atende: RN-02, RN-03, RN-10, RN-15; CA-15 a CA-20.
- Pronto quando: com um `prettier` falso no `node_modules/.bin` da pasta do arquivo e configuração do prettier no projeto, ele é chamado com o arquivo editado; sem a configuração, ele não é chamado; com um `oxlint` falso, ele também é chamado; num arquivo de worktree sem `node_modules` nada é chamado; sem ferramentas, sem arquivo, com entrada ilegível ou com `CLAUDE_KIT_HOOKS_OFF=1` o comando sai com 0 sem chamar nada; a entrada tem tempo limite de 30 segundos; quando o `oxlint` falso aponta problema, o gancho devolve o aviso ao agente sem bloquear a edição; o gate passa.
- Teste: integração, com ferramentas falsas que gravam um arquivo de marca. O primeiro a falhar: "arquivo editado é formatado pelo prettier do projeto".
- Gate: `node --test tests/hooks-format.test.js` e `npm run lint`.
- Modelo: padrao.
- Status: feita (commit 1223428; teste falhou antes com TypeError; gate ok: lint, 707/707 testes).

### T4 Registro do modelo no catálogo e nos perfis

- O quê: registra `hooks` no catálogo, liga nos quatro perfis, ajusta o teste que fixa os ganchos do projeto e regenera o `.claude/` deste repositório.
- Onde: `catalog.json` (`settings.hooks`, com `applies` e descrição), `profiles/default.json`, `profiles/frontend.json`, `profiles/backend.json`, `profiles/tooling.json`, `tests/settings.test.js` (teste "o modelo do repositório respeita um projeto que já tem configuração"), `.claude/settings.json` e `.claude/claude-kit.lock.json` gerados por `npm run sync`.
- Depende de: T1 e T3.
- Reaproveita: a entrada `settings.base` do catálogo como modelo, o hook de pre-commit que regenera o `.claude/`.
- Atende: RN-01, RN-11, RN-15; CA-15, CA-21, CA-22.
- Pronto quando: `node bin/ai-sync.js --check` passa; o `ai-sync` numa pasta temporária cria o `.claude/settings.json` com as duas entradas de ganchos; o teste citado passa a conferir que os ganchos `Stop` do dono continuam iguais e que os do kit foram acrescentados (mudança justificada: o comportamento mudou por regra, RN-11, e não para o teste passar); a desativação pela configuração local foi conferida numa sessão real do Claude e o resultado foi relatado (se não funcionar, fica valendo só a variável no terminal e isso é relatado para ajustar a documentação); o gate passa.
- Teste: integração; o teste ajustado deve falhar antes do registro (os ganchos do kit ainda não aparecem).
- Gate: `node --test tests/settings.test.js tests/self-sync.test.js` e `npm run lint`.
- Modelo: economico.
- Status: feita (commit 2a69c70; testes do modelo do repositório falharam antes; ajustados o teste do perfil tooling para incluir hooks e dois testes de configuração, por consequência da RN-11; gate ok: lint, 707/707 testes, --check, npm pack, ai-sync em pasta temporária gera PreToolUse e PostToolUse; gate de fase final ok).

### T5 [P] Documentação e nota de mudança

- O quê: documenta o modelo de ganchos, a exceção da pasta temporária e como desligá-lo, e cria a nota de mudança `minor`. O roteiro "Verificar uma mudança" não muda.
- Onde: `README.md` (seção sobre o que o kit configura e como desligar os ganchos), `.claude/CLAUDE.md` do repositório (linha de `templates/` na tabela de estrutura), `.changeset/<nome-unico>.md` com `"@felipe-sant/claude-kit": minor` e uma ou duas linhas em português simples.
- Depende de: nada (os nomes estão fixados no Desenho).
- Reaproveita: o formato das notas existentes em `.changeset/`.
- Atende: RN-01, RN-15.
- Pronto quando: o README diz o que os ganchos fazem e como desligá-los com `CLAUDE_KIT_HOOKS_OFF=1`; o README cita a exceção para a pasta criada pelo `mktemp` no mesmo comando; o roteiro do CLAUDE.md continua igual; a nota existe com tipo `minor`; o gate passa.
- Teste: nenhum (só texto).
- Gate: `npm run lint` e `node --test tests/changeset-check-workflow.test.js tests/content.test.js`.
- Modelo: economico.
- Status: feita (commit 8adab3a; README, linha de templates no CLAUDE.md e nota de mudança minor; gate ok: lint e testes de changeset e conteúdo).

### T6 Guarda ignora redirecionamentos (correção da revisão)

- O quê: a guarda deixa de tratar redirecionamentos como destino do envio ou alvo da remoção.
- Onde: `templates/settings.hooks.json`, `tests/hooks-guard.test.js`, `.claude/` regenerado.
- Depende de: T4.
- Atende: RN-03, RN-06; CA-12a.
- Teste: integração; 6 testes falharam antes.
- Gate: `node --test tests/hooks-guard.test.js`, `npm test` e `npm run lint`.
- Modelo: padrao.
- Status: feita (commit 6d9d127; vermelho em 6 testes; gate ok: 716/716 testes).

### T7 Exceção do mktemp mais estrita (correção da revisão)

- O quê: a exceção só vale para a variável que recebeu `$(mktemp ...)` antes da remoção, sem outro uso no caminho.
- Onde: `templates/settings.hooks.json`, `tests/hooks-guard.test.js`, `.claude/` regenerado.
- Depende de: T6.
- Atende: RN-08, RN-08a; CA-10a, CA-10b, CA-10c.
- Teste: integração; falharam antes os casos `T=$(mktemp -d)/../..`, remoção antes da atribuição e `for T in /`.
- Gate: `node --test tests/hooks-guard.test.js`, `npm test` e `npm run lint`.
- Modelo: padrao.
- Status: feita (commit 9c2cf61; vermelho nos três casos citados; gate ok: 716/716 testes).

### T8 Sincronização só apaga a chave vazia que ela criou (correção da revisão)

- O quê: ao gravar a configuração, a sincronização não apaga lista ou grupo de ganchos vazio deixado pelo dono.
- Onde: `bin/ai-sync.js`, `tests/settings.test.js`.
- Depende de: T1.
- Atende: RN-11; CA-31.
- Teste: integração; 2 testes falharam antes.
- Gate: `node --test tests/settings.test.js`, `npm test` e `npm run lint`.
- Modelo: padrao.
- Status: feita (commit 39e8d9c; vermelho em 2 testes; gate ok: 718/718 testes).

### T9 Barrar envio de todas as branches a partir de branch protegida (decisão do usuário na revisão)

- O quê: a guarda passa a barrar `git push --all` e `git push --mirror` quando a pasta está numa branch protegida.
- Onde: `templates/settings.hooks.json`, `tests/hooks-guard.test.js`, `.claude/` regenerado.
- Depende de: T7.
- Atende: RN-04, RN-06a; CA-05a.
- Teste: integração; 4 testes falharam antes.
- Gate: `node --test tests/hooks-guard.test.js`, `npm test` e `npm run lint`.
- Modelo: padrao.
- Status: feita (commit fc0a8ca; vermelho em 4 testes; gate ok: 726/726 testes).

## Dúvidas

Nenhuma. Decisões do usuário registradas na aprovação:

1. O modelo vale para todos os projetos (`applies: ["all"]`) e entra nos quatro perfis.
2. Branches protegidas: `main`, `master`, `develop` e `production`, em lista fixa.
3. Sem arquivo de configuração do formatador no projeto, o arquivo não é formatado.
4. Problemas encontrados pela conferência são avisados ao agente, sem bloquear.
5. Só `prettier` e `oxlint`.
6. A guarda deixa passar a remoção recursiva da pasta temporária criada pelo `mktemp` no mesmo comando (RN-08a), e o roteiro "Verificar uma mudança" continua como está.
7. Na revisão: a guarda também barra `git push --all` e `git push --mirror` a partir de branch protegida (RN-06a).
