---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---

# Padrão de organização de arquivos e imports no frontend

Vale para o código frontend deste projeto. Se o projeto já tem uma convenção própria para algo abaixo, siga a do projeto.

- Um símbolo exportado por arquivo, sempre como exportação padrão (`export default`), declarada no final do arquivo.
- Identificadores sempre em inglês: componentes, funções, variáveis, tipos, arquivos, classes de estilo e chaves de tradução.
- Imports internos pelo apelido do projeto (por exemplo `@/components/Button`), nunca por caminho relativo que sobe pastas (`../`).
- Imports nomeados em vez de importar o pacote inteiro: `import { useState } from 'react'`, não `import * as React from 'react'`.
- Tipos exportados ficam em arquivos próprios e são importados como tipo (`import type { User } from '@/types/User'`).
