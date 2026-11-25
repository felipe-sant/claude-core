---
name: code-review
description: Revisa uma mudança (branch, PR ou arquivos) e entrega os achados por gravidade, sem alterar o código. Use quando o usuário pedir revisão, review ou para conferir uma mudança antes do merge.
---

# Revisão de código

Entrega: uma lista de achados classificados, com veredito. Esta skill só lê: quem corrige é quem escreveu.

## Passos

1. Siga o padrão em `.claude/rules/review-standard.md`, se existir, e os demais padrões do projeto.
2. Descubra a mudança: `git diff <base>...HEAD` para uma branch, `gh pr diff <número>` para um PR, ou os arquivos que o usuário indicar.
3. Se existir uma especificação em `.specs/<branch>.md` ou uma issue ligada, leia as regras e os critérios de aceite. Confira se a mudança cumpre cada um.
4. Leia os testes: provam o comportamento pedido, incluindo erros e limites? Teste alterado só para passar é achado que bloqueia.
5. Procure bugs, caminhos sem tratamento, falhas de segurança, efeito em outras partes e desvio dos padrões (código, testes, segurança, commits).
6. Rode o lint e os testes do projeto e registre o resultado.

## Formato da resposta

Para cada achado: **bloqueia** ou **sugestão**, arquivo e linha, o problema e o que mudaria. Termine com o veredito:

- **Aprovado**: sem achado que bloqueia.
- **Mudanças necessárias**: lista dos que bloqueiam.

Escreva os comentários como manda o `pull-request-standard` (`.claude/rules/pull-request-standard.md`). Não aprove com achado que bloqueia em aberto.
