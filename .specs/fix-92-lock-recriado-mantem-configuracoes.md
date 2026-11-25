# Registro de instalação recriado perde as configurações já aplicadas

> Status: resolvida
> Tipo: bug
> Tamanho: media
> Branch: fix/92-lock-recriado-mantem-configuracoes
> Criada em: 2026-11-25

Issue: #92 de felipe-sant/claude-kit.

## Comportamento observado

Quando o registro de instalação de um repositório (o arquivo em que a sincronização anota o que o kit instalou) não existe, por ter sido apagado, e a sincronização roda de novo, o registro novo não lista as configurações do Claude que já estão no arquivo de configurações do projeto com o mesmo valor do modelo do kit. A sincronização só anota as configurações que ela mesma acrescenta naquela rodada; as que já estão lá, mesmo iguais ao modelo, ficam de fora, como se fossem do usuário.

## Comportamento esperado

Quando não existe registro anterior nenhum (nem o atual, nem o de nome antigo), toda configuração que já está no arquivo de configurações com exatamente o mesmo valor do modelo do kit passa a constar no registro recriado como aplicada pelo kit. Em todos os outros casos o comportamento de hoje continua: o que difere do modelo só é sugerido, o que o kit não entrega nunca é registrado, e, com registro existente, nada muda.

## Regras

- RN-01 (fonte: usuário): quando o registro de instalação é recriado, isto é, não há registro anterior, nem o atual nem o de nome antigo, uma configuração que já está no arquivo de configurações com o mesmo valor do modelo do kit é registrada como aplicada pelo kit.
- RN-02 (fonte: usuário): a comparação é feita item a item, como hoje. Em um grupo de configurações, cada item igual ao modelo é registrado e cada item diferente só é sugerido. Listas e valores simples são comparados inteiros: só são registrados se forem exatamente iguais.
- RN-03 (fonte: usuário): a garantia de nunca apagar nem sobrescrever o que é do usuário continua valendo em todos os outros casos. Valor diferente do modelo só é sugerido e não é registrado; configuração que o kit não entrega nunca é registrada; o arquivo de configurações não é alterado por causa do registro; arquivos instalados que o usuário editou continuam intocados.
- RN-04 (fonte: usuário): se existe um registro anterior legível (atual ou de nome antigo) e ele não lista a configuração, ela continua tratada como do usuário, exatamente como hoje, mesmo que o valor seja igual ao modelo.
- Risco aceito pelo usuário: uma configuração igual ao modelo pode ter sido definida pelo próprio usuário, e não pelo kit. Ao recriar o registro, ela passa a contar como do kit, e uma sincronização futura pode tratá-la como do kit, inclusive removê-la. O usuário conhece o risco e o aceitou. Fato verificado hoje: a sincronização nunca remove configurações que saem do modelo; o efeito visível hoje é que uma configuração registrada e depois apagada pelo usuário não volta a ser acrescentada. A remoção só passaria a valer se uma mudança futura a introduzir.

## Impacto

- Repositórios que tiveram o registro apagado ou perdido e rodaram a sincronização de novo.
- O registro deixa de saber o que veio do kit. Hoje isso faz, por exemplo, uma configuração do kit apagada pelo usuário voltar na sincronização seguinte, porque o kit não sabe que já a tinha aplicado. O problema já existia antes da troca de nome para claude-kit e foi notado no trabalho da issue #86.

## Como reproduzir

1. Em uma pasta vazia, crie o arquivo de configurações do Claude com o conteúdo exato do modelo base do kit, sem registro de instalação.
2. Rode a sincronização nessa pasta, sem perfil.
3. Abra o registro de instalação criado: ele lista os arquivos copiados, mas não tem a parte de configurações aplicadas.

## Evidência

Reproduzido nesta branch, antes da correção: a sincronização em uma pasta temporária com o arquivo de configurações igual ao modelo base criou o registro com 28 arquivos e sem a lista de configurações aplicadas. O arquivo de configurações ficou idêntico ao modelo, como esperado.

Conferido também: a cópia do time deste próprio repositório, o teste de sincronização do CI e o hook de commit geram tudo em pastas vazias, sem arquivo de configurações prévio. Nesses casos a configuração já é acrescentada e registrada hoje, então a correção não muda nenhum arquivo gerado deste repositório.

## Causa suspeita

Hipótese: na junção do modelo com o arquivo existente, o ramo que encontra uma configuração já presente com o mesmo valor do modelo não faz nada; só o ramo que acrescenta a configuração faltante a anota no registro. Como, sem registro anterior, a lista de aplicadas começa vazia, as configurações iguais ao modelo nunca entram nela.

## Critérios de aceite

- CA-01 (RN-01): QUANDO não há registro anterior e o arquivo de configurações já tem configurações com o mesmo valor do modelo ENTÃO o sistema DEVE listar cada uma delas como aplicada no registro recriado. Este é o teste que reproduz o bug e falha antes da correção.
- CA-02 (RN-01, RN-03): QUANDO o CA-01 acontece ENTÃO o sistema DEVE deixar o arquivo de configurações exatamente como estava, byte a byte, e não mostrar sugestão para essas configurações.
- CA-03 (RN-02, RN-03): QUANDO não há registro anterior e um grupo de configurações tem itens iguais e itens diferentes do modelo ENTÃO o sistema DEVE registrar só os itens iguais, mostrar os diferentes em "Sugerido e não aplicado" e não alterar o valor do usuário.
- CA-04 (RN-02, RN-03): QUANDO não há registro anterior e uma lista de configurações é igual à do modelo ENTÃO o sistema DEVE registrá-la como um único item; QUANDO a lista é diferente ENTÃO o sistema DEVE só sugeri-la, sem registrar nem alterar.
- CA-05 (RN-03): QUANDO não há registro anterior e o arquivo tem configurações que o modelo do kit não entrega ENTÃO o sistema DEVE deixá-las fora do registro e intocadas.
- CA-06 (RN-01): QUANDO não há registro anterior e faltam configurações do modelo no arquivo ENTÃO o sistema DEVE acrescentá-las e registrá-las como hoje, junto com as iguais já presentes.
- CA-07 (RN-04): QUANDO existe registro anterior legível, com arquivos mas sem a configuração na lista de aplicadas, e o arquivo de configurações tem essa configuração igual ao modelo ENTÃO o sistema DEVE continuar sem registrá-la.
- CA-08 (RN-04): QUANDO existe apenas o registro de nome antigo, legível e sem a configuração na lista de aplicadas, e o arquivo de configurações a tem igual ao modelo ENTÃO o sistema DEVE migrar o registro como hoje e continuar sem registrá-la.
- CA-09 (RN-03): QUANDO não há registro anterior e o arquivo de configurações não é um JSON válido ENTÃO o sistema DEVE deixá-lo intocado, avisar como hoje e não registrar configuração nenhuma.
- CA-10 (RN-01): QUANDO o registro foi recriado com as configurações iguais ao modelo e o usuário apaga uma delas do arquivo ENTÃO a sincronização seguinte NÃO DEVE acrescentá-la de novo.
- CA-11 (RN-01): QUANDO a sincronização roda uma segunda vez depois de recriar o registro ENTÃO o sistema DEVE não mudar nada e dizer que está tudo em dia.
- CA-12 (RN-03): QUANDO não há registro anterior e há arquivos do kit editados pelo usuário ENTÃO o sistema DEVE continuar sem tocá-los, como hoje.
- CA-13 (não regressão): QUANDO o projeto não tem arquivo de configurações, ou já tem registro com as configurações listadas ENTÃO o sistema DEVE se comportar exatamente como antes, e toda a suíte de testes existente DEVE continuar passando sem alteração nos testes atuais.

## Fora do escopo

- Remover configurações que saem do modelo do kit: hoje isso não existe e continua sem existir.
- Registrar configurações iguais ao modelo quando já existe registro anterior que não as lista (RN-04): decisão do usuário de manter como está.
- Tratar o registro atual ilegível (JSON inválido no arquivo novo): continua como hoje, fora desta correção.
- Mudar as mensagens da sincronização ou avisar na saída que configurações foram reconhecidas no registro recriado: não foi pedido.
- Alterar a cópia do time deste repositório: a correção não muda nenhum arquivo gerado (ver Evidência).

## Plano de execução

- Fase 1 (paralelo): T1 [P] e T2 [P].
- Gate de fase: `npm run lint`, `npm test` (suíte completa), `node bin/ai-sync.js --check` e a sincronização em pasta temporária (`T=$(mktemp -d) && node bin/ai-sync.js "$T" && ls -R "$T/.claude"; rm -rf "$T"`), rodados uma vez ao fim da fase e antes do reviewer. Conferir também que `git status --short` não mostra nada em `.claude/` depois dos commits.
- O projeto não tem typecheck nem formatador (JavaScript puro, sem TypeScript nem Prettier); por isso os gates não têm essas etapas. O lint é o `oxlint` mais a checagem de conteúdo, os mesmos do CI.
- Commits: as tarefas mexem em `bin/`, `tests/` e `README.md`, que não são fontes sincronizadas. O hook de pre-commit roda o sync e confere a cópia, mas não deve gerar mudança em `.claude/`. Commite por caminho, só os arquivos da tarefa; se o hook recusar ou aparecer arquivo em `.claude/` alterado, pare e avise a orchestrator.

## Tarefas

### T1 [P] Registrar as configurações iguais ao modelo quando o registro é recriado

- O quê: quando não existe registro anterior (nem o atual nem o de nome antigo), as configurações já presentes com o mesmo valor do modelo passam a entrar na lista de aplicadas, e os testes cobrem o caso feliz e os casos que não mudam.
- Onde: `bin/ai-sync.js` (função `mergeMissing`, perto das linhas 300-314, e o ponto em que `previousManifest` é lido, perto das linhas 151-175); `tests/settings.test.js`.
- Dev: Dev Back.
- Depende de: nada.
- Reaproveita: `leafPaths` e `isPlainObject` para as folhas; a comparação por `JSON.stringify` já usada no ramo de sugestão; os helpers `makeCore`, `makeTarget`, `run`, `read` e `snapshot` de `tests/helpers.js`; o modelo `template` e o `core()` de `tests/settings.test.js`.
- Detalhe do gatilho: o gatilho é a ausência dos dois arquivos de registro (`claude-kit.lock.json` e `claude-core.lock.json`) antes da rodada, não a ausência de `settings.applied` no registro lido. Registro existente sem a configuração mantém o comportamento atual (CA-07, CA-08). Registrar só no ramo em que o valor existente é igual ao modelo (folha a folha em objeto; lista e valor simples inteiros por igualdade de JSON).
- Atende: RN-01, RN-02, RN-03, RN-04; CA-01 a CA-13.
- Teste: unitário de comportamento pelo próprio comando, em pasta temporária. O primeiro teste, que deve falhar antes da correção: sem registro, arquivo de configurações igual ao modelo, rodar a sincronização e conferir que o registro lista as configurações em `settings.applied` (CA-01). Mostrar a falha localmente antes de corrigir; nunca commitar teste vermelho. Depois, um teste por critério: CA-02 (arquivo idêntico e sem sugestão), CA-03 (grupo misto), CA-04 (lista igual e lista diferente), CA-05 (chave que o kit não entrega), CA-06 (faltantes acrescentadas mais iguais registradas), CA-07 (registro atual sem a configuração), CA-08 (registro de nome antigo sem a configuração), CA-09 (JSON inválido), CA-10 (apagada depois não volta), CA-11 (segunda rodada sem mudança), CA-12 (arquivo editado intocado). Os testes atuais não podem ser alterados.
- Gate: `node --test tests/settings.test.js`, `npm run lint` e `node bin/ai-sync.js --check` (sem typecheck nem formatador no projeto).
- Pronto quando: o teste do CA-01 falhou antes e passa depois; todos os testes novos e os existentes passam; o gate passa; um commit atômico, por caminho, só com `bin/ai-sync.js` e `tests/settings.test.js`, por exemplo `Fix :bug: [#92] Registra as configurações iguais ao modelo quando o registro é recriado`.
- Modelo: padrao.
- Status: feita (commit 1ad2ecb; gate ok: 5 testes vermelhos antes, 23 passando no arquivo de testes das configurações, lint ok; gate de fase ok: npm run lint, npm test com 483 de 483, --check ok, ai-sync em pasta temporária sem erro; commit 9180db0 com as sugestões do reviewer, só em testes: teste novo do CA-12 e o CA-07 com o registro da primeira rodada; gate no 9180db0 ok: lint ok, npm test com 484 de 484, --check ok, git status limpo; aprovada pelo reviewer).

### T2 [P] Documentar o registro recriado no README

- O quê: na seção da configuração base, acrescentar que, quando o registro é recriado (não existe registro anterior), as configurações já presentes com o mesmo valor do modelo passam a constar como aplicadas pelo kit, com o aviso de que uma configuração igual definida pelo usuário passa a contar como do kit, e que com registro existente nada muda.
- Onde: `README.md`, seção "Configuração base do Claude", lista "Como é aplicada" (perto da linha 104, que já fala do registro do que foi acrescentado).
- Dev: Dev Back.
- Depende de: nada (o comportamento está fixado nas regras desta especificação).
- Reaproveita: o texto atual da lista "Como é aplicada" e o tom da seção "Sincronização segura".
- Atende: RN-01, RN-03, RN-04.
- Teste: nenhum (só texto). Confirmar que nenhum teste de conteúdo quebra.
- Gate: `npm run lint` e `node --test tests/content.test.js tests/standards.test.js` (sem typecheck nem formatador no projeto).
- Pronto quando: o README descreve o comportamento em linguagem simples, sem contradizer o restante da seção; o gate passa; um commit atômico, por caminho, só com `README.md`, por exemplo `Docs :bulb: [#92] Documenta o registro das configurações quando o registro é recriado`.
- Modelo: economico.
- Status: feita (commit 39bacd3; gate ok: lint e testes de conteúdo e padrões, 22 de 22; gate de fase ok: npm run lint, npm test com 483 de 483, --check ok, ai-sync em pasta temporária sem erro).

## Dúvidas

Product-owner: nenhuma.

Usuário: nenhuma. A regra e o risco foram decididos pelo usuário e estão registrados em Regras.
