---
name: accessibility-audit
description: Audita a acessibilidade de uma tela React em camadas, separando o que é verificado automaticamente do que só uma pessoa confere. Use quando o usuário pedir para auditar, revisar ou garantir a acessibilidade de uma tela.
---

# Auditoria de acessibilidade de uma tela

Entrega: achados por gravidade e, no fim, a lista do que ficou para conferência manual. Nunca declare a tela acessível só porque os testes passaram: ferramenta automática pega só parte dos problemas.

## Camadas

1. **Análise de código**: leia a tela e o lint de acessibilidade do projeto. Procure elementos clicáveis que não são botão ou link, imagem sem texto alternativo, campo sem `label` e ordem de leitura que não bate com a visual.
2. **Teste por papel**: com Testing Library, busque cada controle por papel e nome (`getByRole`). Se não achar, o leitor de tela também não acha.
3. **Verificação automática**: rode o verificador que o projeto tem (como axe). Ele cobre erros de marcação, não a experiência de uso.
4. **Navegador real**: abra a tela e confira o que depende de estilo e de tela renderizada.
5. **Conferência manual**: o que só uma pessoa decide.

## O que checar

- **Teclado**: tudo se alcança e se aciona só com `Tab`, `Enter`, `Espaço` e `Esc`, sem armadilha de foco e em ordem lógica.
- **Foco**: o foco aparece sempre, o diálogo prende e devolve o foco, e depois de trocar de tela ou enviar um formulário o foco vai para um lugar útil.
- **Títulos e áreas**: um título principal, níveis sem pular e áreas da página marcadas (`header`, `nav`, `main`, `footer`).
- **Idioma**: a página declara o idioma, e trechos em outro idioma também.
- **Contraste**: texto com pelo menos 4,5 para 1 (3 para 1 em texto grande) e a informação nunca depende só da cor.
- **Movimento**: animação respeita a preferência de reduzir movimento e nada pisca.
- **Alvos de toque**: áreas clicáveis com pelo menos 24 por 24 pixels, melhor 44.
- **Zoom**: a tela funciona com 200% de zoom e com o texto aumentado, sem perder conteúdo nem rolar para os lados.

## Só uma pessoa confere

Leitor de tela (a ordem, os nomes e os avisos fazem sentido ao ouvir), o texto alternativo ser útil, o foco fazer sentido para quem usa, clareza das mensagens de erro e uso real com teclado e com o celular.

## Fechamento

Termine sempre com duas listas: o que foi verificado e como (camada), e **Para conferência manual**, com cada item e como conferi-lo. Se algo não pôde ser rodado, diga.
