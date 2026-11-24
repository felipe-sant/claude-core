---
name: create-pull-request
description: Abre um pull request no GitHub com título no padrão e descrição clara. Use quando o usuário pedir para abrir, criar ou subir um PR.
---

# Criar pull request

Entrega: um PR aberto no GitHub e o link dele.

## Passos

1. Confira a branch com `git branch --show-current`. Nunca abra PR a partir da branch principal.
2. Veja o que vai no PR: `git log <base>..HEAD --oneline` e `git diff <base>...HEAD --stat`. A base é a branch principal, salvo se o usuário disser outra.
3. Rode o lint e os testes do projeto. Com falha, pare e mostre o erro: PR com checagem quebrada não deve ser aberto.
4. Confirme com o usuário que pode fazer o push, a menos que ele já tenha pedido. Faça o push com `git push -u origin <branch>`.
5. Monte o título no padrão de commits do projeto (`<Tipo> <ícone> [#issue] <descrição>`), em português.
6. Escreva a descrição com `gh pr create --body`, nestas seções, em linguagem simples:
   - **O que muda**: o resultado para quem usa, não a lista de arquivos.
   - **Como foi verificado**: o que foi rodado e o que não foi testado (diga sem rodeios).
   - **Observações**: decisões, riscos e o que o revisor deve olhar com atenção.
   - `Closes #<issue>` se o PR conclui uma issue.
7. Devolva o link e o estado das checagens se já houver.

## Cuidados

- Um PR, um propósito. Se a branch mistura dois assuntos, avise.
- Não force push nem altere a base sem o usuário pedir.
