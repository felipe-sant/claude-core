---
paths:
  - "**/*.tsx"
  - "**/*.jsx"
  - "**/*.css"
  - "**/*.scss"
---

# Padrão de estilo

Vale para o estilo das telas React. Se o projeto já tem outra forma de estilizar (Tailwind, styled-components, outra biblioteca), siga a do projeto.

- Cada componente tem o próprio arquivo de estilo, como módulo de CSS, e os estilos ficam isolados nele.
- Cores, espaçamentos, tempos e curvas de animação vêm das variáveis globais de design do projeto. Nunca use valores soltos.
- Nunca escreva estilo direto na marcação (atributo `style`).
- Não escreva CSS global dentro de componente, salvo exceção justificada.
- Toda classe usada no código precisa existir no arquivo de estilo.
