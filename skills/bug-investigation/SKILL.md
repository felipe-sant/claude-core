---
name: bug-investigation
description: Descobre a causa de um bug com evidências e propõe a correção e um teste que o reproduz, sem aplicar a correção. Use quando o usuário relatar um erro, comportamento errado ou pedir para investigar um bug.
---

# Investigação de bug

Entrega: a causa do bug com evidências, a correção proposta e o teste que o reproduz. A correção só é aplicada se o usuário pedir.

## Passos

1. Entenda o sintoma: o que deveria acontecer, o que acontece, em que situação. Pergunte só o que falta e não dá para descobrir no código.
2. Reproduza. Rode o caso (comando, teste ou chamada) e veja o erro acontecer. Sem reprodução, diga isso e liste o que faltou.
3. Levante hipóteses, da mais provável à menos, e teste cada uma com um fato: leia o código do caminho, olhe logs, rode com entradas diferentes, use `git log` e `git blame` para ver o que mudou.
4. Pare na causa, não no sintoma. Pergunte "por que" até chegar no que, mudado, faz o bug sumir.
5. Escreva o teste que falha por causa desse bug (ele fica para quem corrigir) e proponha a menor correção possível.
6. Confira se o mesmo erro pode estar em outros lugares parecidos.

## Formato da resposta

- **Causa**: uma ou duas frases.
- **Evidências**: o que você viu (arquivo e linha, saída de comando).
- **Correção proposta**: o que mudar e onde.
- **Teste**: o que ele verifica e como falha hoje.
- **Incerteza**: o que não foi possível confirmar.

Nunca apresente suposição como fato.
