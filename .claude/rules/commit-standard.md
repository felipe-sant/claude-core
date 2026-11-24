# Padrão de branches e commits

## Tipos de alteração

O `<Tipo>` de branch e commit vem sempre desta tabela:

| Tipo     |     Ícone     | Descrição                                                                   |
| -------- | :-----------: | --------------------------------------------------------------------------- |
| Fix      |     :bug:     | Correção de bugs.                                                           |
| Feat     |  :sparkles:   | Desenvolvimento de novas funcionalidades (features).                        |
| Hotfix   |  :ambulance:  | Correção de bugs a partir da branch de produção (main).                     |
| Refactor |   :recycle:   | Melhorias no código (ex.: reestruturações; melhorias no código).            |
| Test     |  :test_tube:  | Criação ou alteração de arquivos de teste.                                  |
| Perf     |     :zap:     | Mudanças a fim de melhorar a performance.                                   |
| Style    |     :art:     | Mudanças apenas em estilo de código (ex.: formatação; clean code).          |
| Docs     |    :bulb:     | Mudanças relacionadas à documentação.                                       |
| Build    |   :rocket:    | Mudanças em arquivos de build (ex.: Vite; `package.json`).                  |
| Chore    | :see_no_evil: | Mudanças sem impacto direto na aplicação (ex.: alterações no `.gitignore`). |
| Revert   |   :rewind:    | Reverter algum commit.                                                      |

## Branches

```
<tipo>/<número-da-issue>-<descrição-curta>
```

- O tipo vai em minúsculas: `feat/21-agentes-e-skills`.
- Sem issue aberta, o número é omitido: `chore/update-gitignore`.

## Commits

```
<Tipo> <ícone> [#<número-da-issue>] <descrição-da-alteração>
```

- Exemplo: `Fix :bug: [#5] Troca <a href> por <Link> na página NotFound`.
- Sem issue relacionada, omita o `[#...]`: `Chore :see_no_evil: Atualiza .gitignore`.
- O ícone é o código da tabela (`:bug:`), não o emoji.
- Commits são atômicos: uma mudança concluída por commit, não várias tarefas acumuladas.
- A descrição diz o que mudou, em português e no imperativo ("Troca", "Adiciona", "Remove").
