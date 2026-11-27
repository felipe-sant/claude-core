# Padrão de revisão de código

Vale ao revisar uma mudança e ao preparar a sua para ser revisada.

**Ao preparar**
- Mudança pequena e com um propósito. Se faz duas coisas, são dois PRs.
- A descrição diz, em linguagem simples, o que mudou, por quê e como foi verificado.
- Só abra para revisão com testes e checagens passando.

**Ao revisar**
- Confira primeiro se a mudança cumpre a regra de negócio e os critérios de aceite da tarefa, depois o código.
- Leia os testes: eles provam o comportamento pedido, incluindo erros e limites? Teste alterado para passar é achado.
- Procure bugs, caminhos sem tratamento, falhas de segurança e efeitos em outras partes do sistema.
- Cheque os padrões do projeto (código, testes, segurança, commits e branches).
- Confira também as regras da stack instaladas em `.claude/rules/` e use as skills de revisão da stack, se houver. O que depende de ver a tela (aparência, foco na prática, leitor de tela) fica com o `qa` e o `designer`: aponte o que só o código mostra e deixe o resto para eles.
- Classifique cada achado: **bloqueia** (bug, regra errada, falha de segurança, teste faltando) ou **sugestão** (melhoria opcional). Diga o arquivo, o problema e o que mudaria.
- Não aprove com achado que bloqueia em aberto. Quem corrige é quem escreveu, e a revisão recomeça no que mudou.
- Escreva os comentários como manda o `pull-request-standard`: específicos, objetivos e sobre o código, não sobre a pessoa.
