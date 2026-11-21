# Padrão de código

Vale para todo código escrito neste projeto. Se o projeto já tem uma convenção própria (formatador, linter, nomes), ela vence este padrão.

- **Nunca escreva comentários no código** (nem de linha, nem de bloco, nem de documentação). Deixe os que já existem como estão. Quando algo pede explicação, renomeie ou extraia uma função em vez de comentar.
- Dê nomes que dizem o que a coisa é ou faz. Sem abreviações obscuras e sem nomes genéricos como `data`, `item` e `temp`.
- Funções curtas, com uma responsabilidade. Se precisa de "e" para descrever, divida.
- Sem código morto, sem código comentado e sem `console.log` ou prints de depuração esquecidos.
- Sem números e textos soltos que carregam regra: dê um nome a eles.
- Trate erro na borda do sistema (entrada do usuário, rede, banco, arquivo). Dentro do sistema, confie nas garantias já dadas e não escreva defesas para o que não pode acontecer.
- Use o formatador do projeto e não misture mudança de formatação com mudança de comportamento.
- Não adicione dependência nova se a plataforma ou o que já está instalado resolve.
- Faça só o que a tarefa pede: sem refatoração ou melhoria no caminho que ninguém pediu.
