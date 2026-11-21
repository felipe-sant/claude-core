---
paths:
  - "**/*.tsx"
  - "**/*.jsx"
---

# Padrão React

Vale para componentes React deste projeto. Se o projeto já usa uma biblioteca ou convenção para algo abaixo (estado, formulários, estilo), siga a do projeto.

- Componentes são funções. Um componente por arquivo, com o nome do componente em PascalCase e o do arquivo igual a ele.
- Tipe as props (TypeScript) e mantenha-as poucas. Muitas props pedem um componente menor ou composição com `children`.
- Guarde o estado no componente mais baixo que precisa dele. Não copie para estado o que dá para calcular a partir de props ou de outro estado.
- `useEffect` é só para sincronizar com algo de fora do React (rede, timer, evento do navegador). Não use para derivar valores nem para reagir a clique: isso vai no próprio evento ou no cálculo durante a renderização.
- Efeitos limpam o que criam (listeners, timers, requisições) e declaram todas as dependências.
- Listas usam `key` estável e única, nunca o índice quando a lista pode mudar de ordem.
- Dados que vêm do servidor passam pela biblioteca de dados do projeto (por exemplo React Query), com estados de carregando, erro e vazio tratados.
- Use elementos semânticos (`button`, `a`, `label`, `nav`), campos com `label` e imagens com texto alternativo. Tudo que é clicável precisa funcionar pelo teclado.
- Evite passar props por muitos níveis: use composição ou contexto para dados realmente globais, como usuário e tema.
- Teste com Testing Library pelo que a pessoa vê e faz (texto, papel, clique), não por estado interno nem por nome de componente.
