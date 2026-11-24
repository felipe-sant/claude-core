---
name: commit-message
description: Cria o commit no padrão do projeto (tipo, ícone, número da issue e descrição no imperativo). Use quando o usuário pedir para commitar, fazer commit ou escrever mensagem de commit.
---

# Commit no padrão

Entrega: um ou mais commits atômicos, com mensagem no padrão do projeto, e um resumo do que foi commitado.

## Passos

1. Leia o padrão em `.claude/rules/commit-standard.md` (ou `rules/commit-standard.md`). Se o projeto não tem o padrão, use `<Tipo> <ícone> [#issue] <descrição>` e avise.
2. Rode `git status` e `git diff` (inclua o que já está em staging) para ver exatamente o que mudou.
3. Se a mudança mistura propósitos (por exemplo correção e refatoração), proponha dividir em commits separados e adicione arquivos de cada um por vez, pelo nome. Nunca use `git add -A` às cegas.
4. Escolha o tipo na tabela do padrão. Pegue o número da issue do nome da branch (`feat/12-algo`) ou do que o usuário disser. Sem issue, omita o `[#...]`.
5. Escreva a descrição em português, no imperativo, dizendo o que mudou ("Troca", "Adiciona", "Remove"), em uma linha.
6. Antes de commitar, rode o lint e os testes do projeto se ele os tem. Com falha, não commite: mostre o erro.
7. Crie o commit. Nunca use `--no-verify` nem `--amend` sem o usuário pedir.

## Cuidados

- Não commite arquivos com segredos (`.env`, chaves) e avise se estiverem em staging.
- Não faça push: isso só acontece se o usuário pedir.
