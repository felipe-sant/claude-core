---
paths:
  - "**/*.tsx"
  - "**/*.jsx"
  - "**/*.ts"
  - "**/*.js"
  - "**/*.vue"
  - "**/*.php"
  - "**/locales/**"
  - "**/i18n/**"
---

# Padrão de textos de interface e tradução

Vale para projetos que usam uma biblioteca de tradução. Se o projeto já tem uma convenção própria de chaves ou de pastas de idioma, siga a do projeto.

- Texto de tela nunca fica escrito no código: vem de uma chave de tradução. Isso inclui rótulos, botões, mensagens de erro, placeholders, títulos e textos alternativos.
- As chaves são em inglês, em hierarquia e com nome claro (`checkout.payment.errorTitle`), sem nomes genéricos como `text1`.
- Texto novo nasce no idioma de referência do projeto e é entregue em todos os idiomas suportados no mesmo trabalho. Nunca deixe idioma faltando para depois.
- Chave que deixou de ser usada é removida de todos os idiomas.
- Texto com marcação (negrito, link, variável, plural) usa o recurso próprio da biblioteca. Nunca monte frase juntando pedaços traduzidos.
- O idioma ativo é lido por um único ponto do projeto. Componentes e funções usam o recurso da biblioteca, sem ler idioma, navegador ou armazenamento por conta própria.
- Datas, números e moedas seguem o idioma ativo pelos recursos de formatação da biblioteca ou da plataforma.
- Teste pelo texto que a pessoa vê, no idioma de referência.
