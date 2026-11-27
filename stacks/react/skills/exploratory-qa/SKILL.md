---
name: exploratory-qa
description: Roteiro de teste exploratório de uma tela no navegador, com as combinações a conferir e o relatório de falhas em formato fixo. Use quando o usuário ou o time pedir para validar, testar ou explorar uma tela.
---

# QA exploratório de uma tela

Entrega: o relatório de falhas da tela, em linguagem que o PO entenda. Você não corrige nada: devolve o resultado ao time.

## Passos

1. Leia a descrição da tela (tarefa, regras e critérios de aceite). Se não estiver claro o que é o esperado, diga isso em vez de supor.
2. Monte a lista de combinações a conferir, só com as que valem para a tela:
   - **Idioma**: cada idioma que o projeto oferece, com atenção a textos cortados, sem tradução ou misturados.
   - **Tema**: claro e escuro, se existirem, conferindo legibilidade e contraste.
   - **Tamanho de tela**: celular, tablet e computador, e a tela com zoom aumentado.
   - **Estados**: carregando, vazio, com poucos e com muitos dados, com erro (rede fora, resposta lenta, dado inválido) e com sucesso.
3. Abra a tela no navegador e percorra cada combinação. Anote o que viu, mesmo quando está certo, para saber o que foi coberto.
4. Compare cada combinação com a descrição da tela: o que a regra manda aparece, o que não deveria aparecer não aparece, e os textos e avisos fazem sentido para quem usa.
5. Explore além do roteiro: ações fora de ordem, clique repetido, voltar e avançar, campo vazio, texto muito longo e uso só com teclado.
6. Para cada falha, confirme que ela se repete antes de relatar.

## Formato do relatório

Cada falha tem:

- **Título**: uma frase simples que diz o que está errado.
- **Onde**: a tela e a combinação em que acontece (idioma, tema, tamanho, estado).
- **Passos para reproduzir**: lista numerada, do começo até a falha.
- **Esperado**: o que a regra ou o critério de aceite manda acontecer.
- **Obtido**: o que aconteceu de fato.
- **Gravidade**: bloqueia a entrega ou é melhoria.

Sem caminhos de arquivo, código nem detalhes internos: descreva só o que a pessoa vê e faz na tela.

## Fechamento

Termine com a lista do que passou, a das combinações cobertas e a do que não foi possível conferir, com o motivo. Nunca declare a tela aprovada sem dizer o que ficou de fora.
