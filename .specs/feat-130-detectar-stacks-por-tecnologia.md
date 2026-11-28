# Detectar stacks por tecnologia, não só por framework

> Status: implementada (código aprovado pelo reviewer, sem achado bloqueante)
> Tipo: funcionalidade
> Tamanho: media
> Branch: feat/130-detectar-stacks-por-tecnologia
> Criada em: 2026-11-28

## Objetivo

Hoje a sincronização reconhece o projeto pelo framework (React, NestJS, Laravel, AdonisJS) e por TypeScript e tradução. A issue #130 pede que ela reconheça também tecnologias de apoio, começando por três: Vitest (testes), Playwright (testes de ponta a ponta) e Redux Toolkit (estado da aplicação). Assim, as regras e skills dessas tecnologias, que virão em outras issues, chegam só aos projetos que as usam.

## Regras

- RN-01: O catálogo passa a ter três stacks novas: `vitest`, `playwright` e `redux-toolkit`, cada uma com a sua regra de detecção pelos pacotes do projeto. Fonte: issue #130.
- RN-02: Pacotes que identificam cada stack: Vitest pelo pacote `vitest`; Playwright pelo pacote `@playwright/test` ou pelo pacote `playwright`; Redux Toolkit pelo pacote `@reduxjs/toolkit`. Fonte: issue #130 (pacotes sugeridos) e decisão do usuário.
- RN-03: A detecção vale tanto para dependências normais quanto para dependências de desenvolvimento. Fonte: issue #130.
- RN-04: Um projeto pode ser reconhecido por várias stacks ao mesmo tempo e recebe o conteúdo de todas elas. Fonte: issue #130.
- RN-05: Projeto que não usa a tecnologia não recebe o conteúdo dela. Fonte: issue #130.
- RN-06: A checagem do catálogo continua reprovando qualquer item que cite uma stack que não está registrada. Fonte: issue #130.
- RN-07: Esta tarefa não cria regras nem skills para as três stacks, e não mexe em TypeScript nem em tradução. Fonte: issue #130.
- RN-08: Comportamento atual, mantido: uma stack sem nenhum conteúdo no catálogo não aparece como detectada. Fonte: código atual, teste existente "stack sem conteúdo no catálogo não é detectada" e decisão do usuário (opção a de D-PO-1).

## Critérios de aceite

- CA-01: QUANDO alguém consulta o catálogo ENTÃO ele DEVE ter as stacks Vitest, Playwright e Redux Toolkit, cada uma com descrição e com os pacotes da RN-02. (RN-01, RN-02)
- CA-02: QUANDO um projeto lista o Vitest só nas dependências de desenvolvimento e a stack Vitest tem conteúdo no catálogo ENTÃO a sincronização DEVE reconhecer a stack Vitest e entregar o conteúdo dela. (RN-02, RN-03)
- CA-03: QUANDO um projeto usa o Playwright por qualquer um dos dois pacotes, e a stack tem conteúdo ENTÃO a sincronização DEVE reconhecer a stack Playwright nos dois casos. (RN-02)
- CA-04: QUANDO um projeto lista o Redux Toolkit nas dependências normais e a stack tem conteúdo ENTÃO a sincronização DEVE reconhecer a stack Redux Toolkit e entregar o conteúdo dela. (RN-02, RN-03)
- CA-05: QUANDO um projeto usa React, Vitest, Playwright e Redux Toolkit ao mesmo tempo, com parte delas só em dependências de desenvolvimento, e todas têm conteúdo ENTÃO a sincronização DEVE reconhecer todas e entregar o conteúdo de todas. (RN-03, RN-04)
- CA-06: QUANDO um projeto não usa nenhuma das três tecnologias ENTÃO a sincronização NÃO DEVE reconhecer essas stacks nem entregar o conteúdo delas. (RN-05)
- CA-07: QUANDO um projeto usa só uma das três tecnologias ENTÃO ele NÃO DEVE receber o conteúdo das outras duas. (RN-05)
- CA-08: QUANDO o catálogo real passa pela checagem ENTÃO ela DEVE terminar sem erro. (RN-01, RN-06)
- CA-09: QUANDO um item do catálogo cita uma stack que não está registrada ENTÃO a checagem DEVE reprovar e dizer qual stack falta. (RN-06)
- CA-10: QUANDO um projeto real usa só o Vitest, enquanto as três stacks ainda não têm conteúdo ENTÃO a sincronização DEVE entregar só o conteúdo geral, como hoje. (RN-07, RN-08)
- CA-11: QUANDO um projeto que já era reconhecido (React, NestJS, Laravel, AdonisJS, TypeScript, tradução) é sincronizado ENTÃO ele DEVE receber exatamente o mesmo conteúdo de antes. (RN-07)

## Critérios de sucesso

- As três stacks estão no catálogo, prontas para receber regras e skills nas próximas issues sem outra mudança na detecção.
- Os testes provam a detecção positiva e negativa de cada stack, várias ao mesmo tempo e por dependências de desenvolvimento.
- Lint, testes e checagem do catálogo passam no CI, e os projetos que já eram reconhecidos recebem o mesmo conteúdo de antes.

## Fora do escopo

- Regras e skills de Vitest, Playwright e Redux Toolkit: virão em outras issues (RN-07).
- Mudanças nas stacks de TypeScript e de tradução (RN-07).
- Mudar a regra de que stack sem conteúdo não aparece como detectada: o usuário escolheu manter (opção a de D-PO-1).
- Atualizar o README: ele não lista as stacks uma a uma.

## Plano de execução

- Fase 1 (paralelo): T1 [P] e T2 [P]. Arquivos diferentes, e só a T1 mexe em fonte sincronizada (o catálogo).
- Gate de fase: `npm run lint`, `npm test` e `node bin/ai-sync.js --check`, rodados uma vez ao fim da fase e antes do reviewer. O projeto não tem typecheck, build nem formatador: o lint é o oxlint mais a checagem de formato do conteúdo.

## Tarefas

### T1 [P] Registrar as três stacks no catálogo
- O quê: adicionar as stacks `vitest`, `playwright` e `redux-toolkit` ao catálogo, com descrição e pacotes de detecção, mais a nota de mudança minor.
- Onde: `catalog.json` (seção `stacks`), `tests/standards.test.js`, nova nota em `.changeset/` (nome livre, por exemplo `feat-130-stacks-por-tecnologia.md`).
- Dev: dev-backend-1.
- Depende de: nada.
- Reaproveita: o formato das stacks atuais do catálogo (`description` e `detect.dependencies`); a leitura do catálogo real que já existe no topo de `tests/standards.test.js`; o padrão dos testes de tradução desse arquivo; o teste de `--check` no catálogo real em `tests/ai-sync.test.js`.
- Atende: RN-01, RN-02, RN-07, RN-08, CA-01, CA-08, CA-10, CA-11.
- Pronto quando: as três stacks estão no catálogo com os pacotes da RN-02; o teste do catálogo real passa; um projeto real só com `vitest` recebe só as regras gerais (CA-10); os testes de projetos já reconhecidos seguem passando sem mudança; a nota existe com o cabeçalho `"@felipe-sant/claude-kit": minor` e uma ou duas linhas em português simples; o gate passa.
- Teste: unitário de conteúdo, em `tests/standards.test.js`. Falha primeiro: o teste que lê o catálogo real e confere que cada stack nova existe, tem descrição e tem exatamente os pacotes da RN-02. Depois, o teste de CA-10 (passa já hoje e documenta a opção a de D-PO-1).
- Gate: `npm run lint`, `npm test` e `node bin/ai-sync.js --check`. Sem typecheck nem formatador no projeto.
- Commit: `Feat :sparkles: [#130] Adiciona as stacks Vitest, Playwright e Redux Toolkit ao catálogo`, com os caminhos explícitos. O catálogo é fonte sincronizada: antes de commitar, rode `npm run sync` e inclua nos caminhos os arquivos de `.claude/` que mudarem (provavelmente nenhum, já que o perfil `tooling` não usa essas stacks). O hook recusa o commit por caminhos sem eles.
- Modelo: economico.
- Status: feita (commit dccccd6; gate ok: lint, 634 testes, --check).

### T2 [P] Testar a detecção das stacks novas com catálogo de teste
- O quê: cobrir a detecção positiva, negativa, de várias stacks juntas e por dependências de desenvolvimento, usando um catálogo de teste em que as três stacks têm uma regra fictícia.
- Onde: `tests/ai-sync.test.js`.
- Dev: dev-backend-1.
- Depende de: nada.
- Reaproveita: `makeCore`, `makeTarget` e `run` de `tests/helpers.js`; o padrão de `stackCore()` e dos testes "projeto NestJS recebe o conteúdo de NestJS, mesmo em devDependencies" e "projeto com painel e API em pastas separadas recebe as duas stacks"; o teste "--check reprova item que se aplica a uma stack desconhecida", que já cobre o CA-09 e não precisa ser reescrito.
- Atende: RN-02, RN-03, RN-04, RN-05, RN-06, CA-02, CA-03, CA-04, CA-05, CA-06, CA-07, CA-09.
- Pronto quando: há um teste por critério de CA-02 a CA-07 (o CA-03 com os dois pacotes do Playwright), cada um conferindo a linha "Stacks detectadas" e os arquivos de regra entregues ou ausentes; o gate passa.
- Teste: integração do `ai-sync` com catálogo de teste. Nenhum teste deve falhar primeiro: a detecção por várias stacks e por dependências de desenvolvimento já existe, e estes testes a protegem para as stacks novas. Para provar que o teste não passa por acaso, confira que ele falha se a regra de detecção do catálogo de teste usar outro pacote, e desfaça.
- Gate: `npm run lint`, `npm test` e `node bin/ai-sync.js --check`. Sem typecheck nem formatador no projeto.
- Commit: `Test :test_tube: [#130] Cobre a detecção das stacks Vitest, Playwright e Redux Toolkit`, só com `tests/ai-sync.test.js` nos caminhos.
- Modelo: economico.
- Status: feita (commit ca5b744; gate ok: lint, 640 testes, --check).

## Dúvidas

Nenhuma. Decisões do usuário registradas na aprovação:

- D-PO-1: opção a. A sincronização não muda, e um projeto real continua vendo "nenhuma stack" até as skills e regras dessas stacks existirem.
- D-PO-2: os pacotes são `vitest`, `@playwright/test`, `playwright` e `@reduxjs/toolkit`, e o pacote `redux` puro fica de fora.
- D-US-1: registrar no catálogo stacks ainda sem conteúdo é aceito.
