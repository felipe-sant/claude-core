---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# Padrão TypeScript

Vale para o código TypeScript deste projeto. Se o projeto já tem uma convenção própria de tipos, siga a do projeto.

- Deixe o modo estrito sempre ligado (`"strict": true` no `tsconfig`). Nunca o desligue para fazer um erro passar.
- Não use o tipo `any` de forma explícita. Quando o tipo não é conhecido, use `unknown` e confira com uma checagem antes de usar o valor.
- Não converta tipo só para calar um erro (`as Tipo`, `as unknown as Tipo`, `!`). Corrija o tipo na origem ou valide o valor na borda.
- Funções públicas (exportadas) declaram os tipos de entrada e de saída, sem depender da inferência.
- Tipos compartilhados ficam em um lugar próprio do projeto, não repetidos em cada arquivo.
- Importe tipos com `import type`, para separar o que é só tipo do que existe em tempo de execução.
