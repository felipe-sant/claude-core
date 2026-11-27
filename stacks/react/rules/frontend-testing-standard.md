---
paths:
  - "**/*.test.tsx"
  - "**/*.test.ts"
  - "**/*.spec.tsx"
  - "**/*.spec.ts"
  - "**/test/**"
---

# Padrão de testes de frontend

Complementa o `testing-standard`, sem substituí-lo. Se o projeto já tem convenção própria para algo abaixo, siga a do projeto.

- O teste fica em uma pasta `test/` ao lado do que ele testa, com o nome do arquivo testado e o sufixo `.test`.
- Nomes de grupo e de caso são em português e descrevem o comportamento ("mostra a mensagem de erro quando o e-mail é inválido").
- Teste de tela afirma o texto que a pessoa vê, nunca a chave de tradução.
- Troca de idioma e de tema é feita dentro do próprio teste, não em configuração global compartilhada.
- Todo teste de página e de componente inclui uma verificação de acessibilidade.
- Quem substitui um recurso global ou uma variável de ambiente restaura o original no fim do teste.
- Teste de ponta a ponta espera por estado (elemento visível, resposta recebida), nunca por tempo fixo.
