---
paths:
  - "**/*.tsx"
  - "**/*.jsx"
---

# Padrão de acessibilidade

Vale para toda tela nova ou alterada. A meta é a conformidade AA das diretrizes WCAG. Se o projeto já tem uma convenção ou biblioteca de acessibilidade, siga a do projeto.

- Use primeiro o elemento semântico certo (`button`, `a`, `label`, `nav`, `main`, `h1` a `h6`). Só acrescente atributos `aria-*` ou `role` quando nenhum elemento resolve.
- Tudo que é clicável funciona pelo teclado (Tab, Enter e Espaço) e mostra o foco de forma visível. Nunca remova o contorno de foco sem trocá-lo por outro igualmente visível.
- Todo campo tem rótulo ligado a ele, e toda imagem com sentido tem texto alternativo. Imagem só decorativa leva o texto alternativo vazio.
- Alvos de toque têm tamanho confortável, de pelo menos 44 por 44 pixels, e não ficam colados uns nos outros.
- Respeite a preferência de reduzir movimento (`prefers-reduced-motion`): animações e transições desligam ou diminuem quando ela está ativa.
- Não passe informação só pela cor: o texto contrasta com o fundo no nível AA e erros e estados também aparecem em texto ou ícone.
- Toda tela tem verificação automática de acessibilidade nos testes (por exemplo `jest-axe` ou `vitest-axe`), e ela precisa passar sem violações.
- Nunca desligue uma regra da ferramenta de verificação para fazer o teste passar: corrija a tela.
