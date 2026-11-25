# Troca o nome antigo claude-core por claude-kit em todo o repositório

> Status: em-andamento
> Tipo: funcionalidade
> Tamanho: grande
> Branch: chore/86-renomeia-claude-core-para-claude-kit
> Criada em: 2026-11-25

Issue: #86 de felipe-sant/claude-kit.

O pedido é de manutenção (Chore), mas o formato da especificação só aceita `funcionalidade` ou `bug`. Ficou como `funcionalidade` porque a migração do registro de instalação é comportamento novo.

## Objetivo

O projeto mudou de nome para claude-kit, mas o nome antigo, claude-core, ainda aparece na documentação, nas mensagens da ferramenta de cópia (o ai-sync), no nome do pacote, na regra do lint e no nome do arquivo de registro do que foi instalado (o "lock"). A tarefa troca o nome em todos esses lugares. Quem já usa a ferramenta continua recebendo as atualizações: o registro com o nome antigo é aproveitado e passa a ter o nome novo.

## Regras

- RN-01: todo texto do repositório que cita o projeto usa o nome claude-kit, inclusive os exemplos de comando. Fonte: usuário (issue #86).
- RN-02: as especificações antigas não mudam, porque são histórico. Fonte: usuário.
- RN-03: o registro do que a ferramenta instalou passa a se chamar `claude-kit.lock.json` e continua na pasta `.claude` do repositório de destino. Fonte: usuário.
- RN-04: um repositório que ainda tem o registro com o nome antigo continua sendo atualizado sem perder nada do que estava registrado. A ferramenta lê o registro antigo, grava o novo e remove o antigo. Fonte: usuário.
- RN-05: continua valendo a garantia de que a ferramenta nunca apaga nem sobrescreve um arquivo do usuário. O único arquivo que a migração remove é o registro antigo da própria ferramenta. Fonte: usuário e documentação do projeto.
- RN-06: o nome antigo só pode continuar no trecho da ferramenta que faz a migração e no teste dela. Fonte: usuário.
- RN-07: a cópia do time que fica neste repositório é gerada a partir das fontes e nunca é editada à mão. A exceção é o arquivo de instruções do projeto, que é editado à mão. Fonte: documentação do projeto.
- RN-08: se o repositório já tiver os dois registros, o antigo e o novo, a ferramenta usa só o novo e remove o antigo. Fonte: usuário.
- RN-09: se o registro antigo for inválido (não dá para ler), a ferramenta para com erro e não perde o registro: o antigo fica onde está, nenhum registro novo é gravado e nenhum arquivo é copiado. Fonte: usuário.
- RN-10: a migração é silenciosa: a ferramenta não mostra nenhum aviso por ter migrado o registro. Fonte: usuário.

## Critérios de aceite

- CA-01: QUANDO alguém lê o README, as instruções do projeto ou as regras ENTÃO o sistema DEVE mostrar só o nome claude-kit, inclusive nos exemplos de comando e no nome do registro de instalação. (RN-01, RN-03)
- CA-02: QUANDO a ferramenta avisa que um arquivo do usuário tem o mesmo nome de um arquivo do projeto, que há versão nova de um arquivo editado ou que um arquivo editado saiu do catálogo ENTÃO o sistema DEVE citar claude-kit na mensagem. (RN-01)
- CA-03: QUANDO a ferramenta roda pela primeira vez em um repositório ENTÃO o sistema DEVE gravar o registro como `.claude/claude-kit.lock.json` e não criar o registro com o nome antigo. (RN-03)
- CA-04: QUANDO a ferramenta roda em um repositório que só tem o registro antigo ENTÃO o sistema DEVE gravar o registro novo com tudo o que estava no antigo (os arquivos instalados e as configurações já aplicadas) e remover o registro antigo. (RN-04)
- CA-05: QUANDO a ferramenta migra um registro antigo e, depois da migração, o conteúdo seria igual ao que já estava gravado ENTÃO o sistema DEVE criar o registro novo e remover o antigo do mesmo jeito. (RN-04)
- CA-06: QUANDO a ferramenta migra o registro ENTÃO o sistema DEVE remover o antigo só depois de gravar o novo. Se não der para gravar o novo, o antigo fica onde está. (RN-04, RN-05)
- CA-07: QUANDO a ferramenta migra um repositório em que o usuário editou um arquivo instalado ENTÃO o sistema DEVE deixar esse arquivo como está e avisar, do mesmo jeito que fazia com o registro antigo. (RN-04, RN-05)
- CA-08: QUANDO a ferramenta migra um repositório com um arquivo instalado e sem alterações que tem versão nova ENTÃO o sistema DEVE atualizar esse arquivo. (RN-04)
- CA-09: QUANDO a ferramenta migra o registro ENTÃO o sistema DEVE deixar intactos os outros arquivos da pasta `.claude` que não são dela. (RN-05)
- CA-10: QUANDO alguém roda a verificação de lint ENTÃO o sistema DEVE aplicar a regra contra comentários com o nome claude-kit e continuar reprovando comentários. (RN-01)
- CA-11: QUANDO alguém consulta o nome do pacote do projeto ENTÃO o sistema DEVE mostrar claude-kit nos dois arquivos de pacote, e a instalação limpa das dependências DEVE continuar funcionando. (RN-01)
- CA-12: QUANDO alguém commita neste repositório ENTÃO o sistema DEVE conferir e incluir na cópia gerada o registro com o nome novo, e a pasta temporária do hook DEVE usar o nome novo. (RN-03, RN-07)
- CA-13: QUANDO a tarefa termina ENTÃO a cópia gerada deste repositório DEVE estar atualizada, só com o registro novo, e a verificação de lint, os testes e a checagem do catálogo DEVEM passar. (RN-07)
- CA-14: QUANDO alguém procura o nome antigo no repositório, fora das especificações, das dependências instaladas e da pasta interna do git ENTÃO o sistema DEVE encontrá-lo só na migração da ferramenta e no teste dela. (RN-02, RN-06)
- CA-15: QUANDO a ferramenta roda em um repositório que tem os dois registros ENTÃO o sistema DEVE usar só o que está no registro novo como registro anterior, ignorar o conteúdo do antigo e remover o antigo ao terminar. (RN-08, RN-05)
- CA-16: QUANDO a ferramenta roda em um repositório que só tem o registro antigo e ele é inválido ENTÃO o sistema DEVE parar com erro, com uma mensagem que diz que o registro antigo não pôde ser lido, deixar o registro antigo como estava e não gravar o registro novo nem copiar arquivos. (RN-09, RN-05)
- CA-17: QUANDO a ferramenta migra o registro antigo ENTÃO o sistema DEVE mostrar a mesma saída que mostraria se o registro já tivesse o nome novo, sem nenhum aviso sobre a migração. (RN-10)

## Critérios de sucesso

- Ninguém que lê o projeto ou usa a ferramenta vê mais o nome claude-core, a não ser no histórico.
- Um repositório configurado antes da troca recebe a próxima atualização sem aviso novo de conflito e sem perder o registro.
- O CI passa no PR.

## Fora do escopo

- Especificações antigas: são histórico (RN-02).
- Nomes de pastas fora do repositório, como a pasta onde cada pessoa clonou o projeto, e o nome da branch desta tarefa.
- Mudar a versão do pacote: a troca de nome não muda a versão.
- Mudar o formato do registro de instalação: só o nome do arquivo muda.
- Mudar o que acontece quando o registro novo é inválido: continua como hoje, tratado como vazio. O usuário confirmou que isso fica fora desta tarefa.

## Desenho

**Contrato fixo do registro (vale para os três devs desde o início):**

| | Caminho |
| --- | --- |
| Registro novo | `.claude/claude-kit.lock.json` |
| Registro antigo (só lido na migração) | `.claude/claude-core.lock.json` |

O conteúdo do registro continua igual: `files` e, quando houver, `settings.applied`.

**Migração, em `bin/ai-sync.js`:**
- Se o registro novo existe, ele é a fonte do registro anterior, como hoje.
- Se só o antigo existe, ele é lido como registro anterior, tanto `files` quanto `settings.applied`.
- Ao gravar, a regra de pular a gravação quando o conteúdo é igual não vale se o registro novo ainda não existe. Depois que o novo foi gravado, o antigo é removido. Nenhum outro arquivo é removido pela migração.
- Se os dois registros existem, o novo é a fonte do registro anterior, o antigo não é lido e é removido depois da gravação (RN-08).
- Se só o antigo existe e ele é inválido, a ferramenta para com erro antes de copiar qualquer arquivo, e o antigo continua onde está (RN-09). Atenção: hoje a ferramenta não para com um registro inválido. A leitura (`readJson`) devolve um objeto vazio quando o JSON não pode ser lido, e a execução segue como se fosse a primeira. Por isso o erro do RN-09 é comportamento novo, só para o registro antigo. O tratamento do registro novo inválido continua como está hoje (ver Fora do escopo e Dúvidas).
- A migração não escreve nada na saída (RN-10).

**Por que o nome do registro fica numa tarefa só:** o hook de commit roda a ferramenta e o conferidor de sincronia que estão na pasta de trabalho, e não os que estão commitados. Se a ferramenta e o hook usarem nomes diferentes, o primeiro commit quebra:
- se só a ferramenta mudar, o conferidor ainda procura o registro antigo e recusa o commit;
- se só o hook mudar, ele tenta adicionar um registro que ainda não existe e o commit falha.

Por isso a T1 junta a ferramenta, os dois arquivos do hook e os dois testes. Esse foi o ajuste feito na divisão proposta: o Dev Back fica com as linhas do registro em `.githooks/check-sync.js` e `.githooks/pre-commit`, e o Dev Ops fica só com o prefixo da pasta temporária.

**Quem roda `npm run sync` e quando:**
- T1 (Dev Back) roda `npm run sync` e commita primeiro o registro novo e a remoção do antigo. Enquanto a regra de feedback estiver editada e não commitada, o hook recusa o commit da T1. Por isso, a edição da T5 só é feita, ou refeita, depois do commit da T1.
- Na Fase 2, só a T5 (Dev Doc) muda uma fonte da cópia gerada, a regra de feedback. Ela roda `npm run sync` e commita a fonte com `.claude/rules/feedback-standard.md` e `.claude/claude-kit.lock.json` nos caminhos. Nenhuma outra tarefa commita arquivo gerado.
- Histórico: tentamos commitar a T5 antes da T1, e o hook recusou, porque o lock gerado já refletia a T1, que ainda não estava commitada. O Dev Doc desfez a edição da regra e voltou a ordem T1 → T5.
- O hook roda o sync a cada commit, de qualquer dev. Por isso, quem edita `bin/ai-sync.js` ou `.githooks/` mantém esses arquivos funcionando o tempo todo: uma versão quebrada faz o commit de todos ser recusado.

## Plano de execução

- Fase 1 (sequencial): T1. Durante a Fase 1, T3 e T4 podem ser editadas, e a T4, que é só texto, já foi commitada. A regra da T5 só é editada depois do commit da T1.
  - Gate de fase: `npm run lint`, `npm test` e `node bin/ai-sync.js --check`.
- Fase 2 (paralelo): T2 [P], T3 [P], T4 [P] e T5 [P]. Todas dependem só da T1 e não mexem nos mesmos arquivos entre si.
  - Gate de fase: `npm run lint`, `npm test` e `node bin/ai-sync.js --check`. Em seguida, a busca do CA-14: `grep -rni claude-core . --exclude-dir=.git --exclude=.git --exclude-dir=node_modules --exclude-dir=.specs`, que só pode encontrar a migração em `bin/ai-sync.js` e o teste dela em `tests/ai-sync.test.js`.

O projeto não tem typecheck nem formatador, só lint (oxlint mais a checagem de conteúdo) e testes com `node --test`. O gate de cada tarefa é `npm run lint` mais o teste da tarefa.

## Tarefas

### T1: Registro com o nome novo e migração do antigo
- O quê: a ferramenta grava o registro como `.claude/claude-kit.lock.json`, migra o antigo, o hook passa a conferir e adicionar o registro novo, e a cópia gerada é atualizada.
- Onde: `bin/ai-sync.js` (caminho do registro, leitura do antigo, gravação e remoção), `tests/ai-sync.test.js` (citações do registro e testes novos da migração), `.githooks/check-sync.js` (só a lista de gerados), `.githooks/pre-commit` (só o caminho no `git add`), `tests/self-sync.test.js` (todas as citações do registro), `.claude/claude-kit.lock.json` (gerado) e a remoção de `.claude/claude-core.lock.json`.
- Dev: Dev Back
- Depende de: nada
- Reaproveita: `readJson`, `writeManifest` e os auxiliares de `tests/helpers.js` (`makeTarget`, `run`, `read`, `exists`).
- Atende: RN-03, RN-04, RN-05, RN-07, RN-08, RN-09, RN-10; CA-03, CA-04, CA-05, CA-06, CA-07, CA-08, CA-09, CA-12 (parte do registro), CA-13, CA-15, CA-16, CA-17
- Pronto quando: os testes novos de migração passam; não há mais citação do registro antigo nos hooks nem em `tests/self-sync.test.js`; `npm run sync` gera só o registro novo; o commit leva o registro novo e a remoção do antigo (o antigo removido com `git rm` e o caminho dele no commit); o gate passa.
- Teste: unitário e de integração com `node --test`. Falham primeiro: (a) a primeira execução cria `claude-kit.lock.json` e não cria o antigo; (b) com só o registro antigo, `files` e `settings.applied` vão para o novo e o antigo some; (c) registro antigo igual ao que seria gravado ainda gera o novo e remove o antigo; (d) arquivo editado pelo usuário e registrado no antigo continua intocado, com aviso; (e) arquivo instalado sem alteração e registrado no antigo é atualizado quando há versão nova; (f) outro arquivo do usuário na pasta `.claude` continua lá depois da migração; (g) com os dois registros, vale só o conteúdo do novo e o antigo some; (h) com só o registro antigo inválido, a execução termina com erro, o antigo continua com o mesmo conteúdo e o novo não é criado; (i) a saída da migração é igual à de uma execução com o registro já no nome novo, sem aviso de migração.
- Gate: `npm run lint` e `node --test tests/ai-sync.test.js tests/self-sync.test.js`
- Modelo: padrao
- Status: feita. Commit 037991e, do Dev Back. Gate: `npm run lint` ok e `npm test` com 357 testes passando e 0 falhando. Antes da correção, falharam: "primeira execução grava só o registro com o nome novo" e "registro antigo é migrado..." (ENOENT), e "registro antigo inválido para com erro..." (Expected actual strictly unequal to 0). O projeto não tem typecheck nem formatador.

### T2 [P]: Mensagens da ferramenta com o nome novo
- O quê: os três avisos da ferramenta que citam o projeto passam a dizer claude-kit.
- Onde: `bin/ai-sync.js` (avisos de arquivo já existente, de versão nova disponível e de arquivo que saiu do catálogo) e `tests/ai-sync.test.js` (os testes que conferem esses textos).
- Dev: Dev Back
- Depende de: T1
- Reaproveita: os testes de aviso que já existem em `tests/ai-sync.test.js`.
- Atende: RN-01; CA-02
- Pronto quando: os três avisos citam claude-kit, os testes conferem o texto novo e o gate passa.
- Teste: unitário. Primeiro, ajuste o teste do aviso de arquivo que saiu do catálogo para o texto novo e veja-o falhar. Depois, acrescente a conferência do nome nos avisos de arquivo já existente e de versão nova.
- Gate: `npm run lint` e `node --test tests/ai-sync.test.js`
- Modelo: economico
- Status: feita. Commit 02a8e87, do Dev Back. Gate: `npm run lint` ok e `tests/ai-sync.test.js` com 44 testes passando e 0 falhando. Antes da correção, falharam 3 testes de aviso que exigiam o nome novo (/claude-kit/ não casava). A suíte completa tinha 7 falhas de sincronização, causadas por fontes da T3 e da T5 ainda não commitadas; o gate de fase roda depois delas.

### T3 [P]: Nome do pacote, regra do lint e pasta temporária do hook
- O quê: o pacote, o plugin do oxlint e a pasta temporária do hook passam a usar claude-kit.
- Onde: `package.json` e `package-lock.json` (os dois campos `name`), `lint/no-comments-plugin.js` e `.oxlintrc.json` (`claude-kit/no-comments`, os dois no mesmo commit, porque separados quebram o lint) e `.githooks/check-sync.js` (só o prefixo da pasta temporária).
- Dev: Dev Ops
- Depende de: T1
- Reaproveita: a configuração atual do oxlint.
- Atende: RN-01; CA-10, CA-11, CA-12 (pasta temporária)
- Pronto quando: `npm ci` instala sem erro com o `package-lock.json` alterado; `npm run lint` passa e continua reprovando um comentário de teste, feito numa cópia temporária, sem commitar; o gate passa.
- Teste: nenhum novo. A suíte de testes e o lint confirmam que nada quebrou.
- Gate: `npm ci`, `npm run lint` e `node --test tests/self-sync.test.js`
- Modelo: economico
- Status: pendente

### T4 [P]: README e instruções do projeto com o nome novo
- O quê: o README e as instruções do projeto passam a citar claude-kit, inclusive nos exemplos de comando e no nome do registro, e o README conta que o registro antigo é migrado sozinho.
- Onde: `README.md` (título, exemplos de comando, frases, nome do registro e uma frase sobre a migração na seção do registro) e `.claude/CLAUDE.md` (abertura e nome do registro; arquivo editado à mão, que não é gerado).
- Dev: Dev Doc
- Depende de: T1 (só para commitar; a edição pode começar antes)
- Reaproveita: o texto atual.
- Atende: RN-01, RN-03; CA-01
- Pronto quando: a busca do CA-14 não encontra nada nesses dois arquivos e o gate passa.
- Teste: nenhum, é só texto.
- Gate: `npm run lint` e `node --test tests/content.test.js tests/self-sync.test.js`
- Modelo: economico
- Status: feita. Commit f966a91, do Dev Doc, com o README.md e o .claude/CLAUDE.md. No commit, o gate da tarefa não rodou, porque é só texto. Depois, o Reviewer rodou o gate numa worktree própria, no commit c81b134: `npm ci`, `npm run lint`, `npm test` com 357 de 357 testes passando e `node bin/ai-sync.js --check`. Tudo passou.

### T5 [P]: Regra de feedback com o nome novo
- O quê: a regra de feedback passa a citar claude-kit, e a cópia gerada dela é atualizada.
- Onde: `rules/feedback-standard.md` (fonte), mais os gerados `.claude/rules/feedback-standard.md` e `.claude/claude-kit.lock.json`, atualizados com `npm run sync` e commitados com a fonte nos caminhos.
- Dev: Dev Doc
- Depende de: T1 (a edição da regra só começa depois do commit da T1, senão o hook recusa o commit da T1)
- Reaproveita: o texto atual da regra.
- Atende: RN-01, RN-07; CA-01, CA-13
- Pronto quando: a fonte e a cópia gerada citam claude-kit, o hook aceita o commit e o gate passa.
- Teste: nenhum novo. O teste de sincronização confere a cópia gerada.
- Gate: `npm run lint` e `node --test tests/self-sync.test.js tests/standards.test.js`
- Modelo: economico
- Status: feita. Commit 6da620d, do Dev Doc, com a fonte e a cópia gerada da regra de feedback e o registro novo. Gate: `npm run lint` ok, `npm test` com 357 testes passando e 0 falhando e `node bin/ai-sync.js --check` ok. É só texto, então não houve teste falhando antes.

## Dúvidas

Product-owner:
- Nenhuma.

Usuário:
- As três dúvidas sobre a migração (os dois registros, registro antigo inválido e aviso de migração) foram respondidas e viraram RN-08, RN-09 e RN-10.
- A resposta sobre o registro antigo inválido dizia "para com erro, como hoje", mas hoje a ferramenta não para: ela trata um registro inválido como vazio e segue como se fosse a primeira execução. A especificação segue a decisão de parar com erro, só para o registro antigo. O usuário confirmou: o erro é regra nova, só para o registro antigo, e o registro novo inválido continua como hoje, fora desta tarefa. Resolvida.
