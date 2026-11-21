---
name: react-component
description: Cria ou altera um componente React seguindo o padrão do projeto, com teste primeiro. Use quando o usuário pedir uma tela, componente ou formulário em React.
---

# Componente React

Entrega: o componente, o teste dele e o uso dele na tela pedida.

## Passos

1. Olhe componentes parecidos já existentes e siga a estrutura de pastas, a forma de estilizar e a biblioteca de dados do projeto. Siga também `.claude/rules/react-standard.md`.
2. Defina o contrato: quais props entram (tipadas), o que a pessoa vê e faz, e os estados de carregando, erro e vazio.
3. Escreva primeiro o teste com Testing Library, pelo que a pessoa vê e faz (texto, papel, clique). Veja-o falhar.
4. Implemente o mínimo para passar: função, props tipadas, estado no nível mais baixo possível, elementos semânticos e campos com `label`.
5. Use `useEffect` só para sincronizar com algo de fora do React. Listas com `key` estável.
6. Rode o lint, o teste e a checagem de tipos do projeto.

Se a tela é visual, diga o que foi feito e peça para o usuário conferir no navegador, porque o teste não prova a aparência.
