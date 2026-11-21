---
name: documentation
description: Escreve ou atualiza a documentação do projeto (README, guias, referência) a partir do que o código realmente faz. Use quando o usuário pedir para documentar, atualizar o README ou explicar como algo funciona.
---

# Documentação

Entrega: documentação clara e fiel ao código, no lugar certo, com um resumo do que mudou.

## Passos

1. Descubra o que documentar: o que mudou (`git diff`), o que o usuário indicou ou o que está desatualizado.
2. Leia o código e os testes para saber o que de fato acontece. Documente o comportamento real, nunca o que parece ou o que se desejaria.
3. Procure a documentação que já existe (README, pasta de documentos) e atualize no lugar dela em vez de criar um arquivo novo. Mantenha o idioma e o tom do projeto.
4. Escreva para quem vai usar: comece pelo que é e para que serve, depois como usar, com exemplos que funcionam. Rode os comandos dos exemplos antes de escrevê-los.
5. Atualize também o que ficou errado em outros lugares (listas, links, nomes de comandos).

## Cuidados

- Nunca invente regra de negócio. Se não está no código nem na tarefa, pergunte.
- Não escreva comentários no código; explicação vai para a documentação ou para nomes melhores.
- Não registre o que o código mostra por si só (cada função, cada arquivo). Documente o que não é óbvio.
